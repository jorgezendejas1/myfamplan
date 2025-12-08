import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function refreshTokenIfNeeded(supabase: any, account: any) {
  const now = new Date();
  const expiresAt = new Date(account.token_expires_at);
  
  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log("Refreshing token for account:", account.email);
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token refresh failed:", tokens);
      throw new Error("Token refresh failed");
    }

    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await supabase
      .from("google_accounts")
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq("id", account.id);

    return tokens.access_token;
  }

  return account.access_token;
}

async function fetchGoogleEvents(accessToken: string, calendarId: string, syncToken?: string) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  
  if (syncToken) {
    url.searchParams.set("syncToken", syncToken);
  } else {
    // Initial sync: get events from 30 days ago to 1 year in the future
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);
    
    url.searchParams.set("timeMin", timeMin.toISOString());
    url.searchParams.set("timeMax", timeMax.toISOString());
  }
  
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("maxResults", "250");

  console.log("Fetching Google Calendar events:", url.toString());

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Google Calendar API error:", error);
    throw new Error(`Google Calendar API error: ${error.error?.message || "Unknown error"}`);
  }

  return response.json();
}

async function createGoogleEvent(accessToken: string, calendarId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Failed to create Google event:", error);
    throw new Error(`Failed to create event: ${error.error?.message}`);
  }

  return response.json();
}

async function updateGoogleEvent(accessToken: string, calendarId: string, eventId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Failed to update Google event:", error);
    throw new Error(`Failed to update event: ${error.error?.message}`);
  }

  return response.json();
}

async function deleteGoogleEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    console.error("Failed to delete Google event:", error);
    throw new Error(`Failed to delete event: ${error.error?.message}`);
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accountId, localEvent, googleEventId } = await req.json();
    
    console.log("Calendar sync action:", action, "accountId:", accountId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get account
    const { data: account, error: accountError } = await supabase
      .from("google_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!account.sync_enabled) {
      return new Response(
        JSON.stringify({ error: "Sync is disabled for this account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await refreshTokenIfNeeded(supabase, account);
    const calendarId = account.calendar_id || "primary";

    if (action === "fetch") {
      const result = await fetchGoogleEvents(accessToken, calendarId, account.sync_token);
      
      // Update sync token
      if (result.nextSyncToken) {
        await supabase
          .from("google_accounts")
          .update({ 
            sync_token: result.nextSyncToken,
            last_sync_at: new Date().toISOString()
          })
          .eq("id", accountId);
      }

      return new Response(
        JSON.stringify({ 
          events: result.items || [],
          nextSyncToken: result.nextSyncToken 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      const googleEvent = {
        summary: localEvent.title,
        description: localEvent.description || "",
        start: localEvent.allDay 
          ? { date: localEvent.start.split("T")[0] }
          : { dateTime: localEvent.start, timeZone: "America/Mexico_City" },
        end: localEvent.allDay
          ? { date: localEvent.end.split("T")[0] }
          : { dateTime: localEvent.end, timeZone: "America/Mexico_City" },
        colorId: getGoogleColorId(localEvent.color),
      };

      const createdEvent = await createGoogleEvent(accessToken, calendarId, googleEvent);

      // Save mapping
      await supabase.from("event_sync_mapping").insert({
        local_event_id: localEvent.id,
        google_event_id: createdEvent.id,
        google_account_id: accountId,
        sync_status: "synced",
      });

      return new Response(
        JSON.stringify({ success: true, googleEventId: createdEvent.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      const googleEvent = {
        summary: localEvent.title,
        description: localEvent.description || "",
        start: localEvent.allDay 
          ? { date: localEvent.start.split("T")[0] }
          : { dateTime: localEvent.start, timeZone: "America/Mexico_City" },
        end: localEvent.allDay
          ? { date: localEvent.end.split("T")[0] }
          : { dateTime: localEvent.end, timeZone: "America/Mexico_City" },
        colorId: getGoogleColorId(localEvent.color),
      };

      await updateGoogleEvent(accessToken, calendarId, googleEventId, googleEvent);

      // Update mapping
      await supabase
        .from("event_sync_mapping")
        .update({ last_synced_at: new Date().toISOString(), sync_status: "synced" })
        .eq("local_event_id", localEvent.id)
        .eq("google_account_id", accountId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      await deleteGoogleEvent(accessToken, calendarId, googleEventId);

      // Remove mapping
      await supabase
        .from("event_sync_mapping")
        .delete()
        .eq("google_event_id", googleEventId)
        .eq("google_account_id", accountId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calendar sync:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getGoogleColorId(hexColor: string): string {
  // Google Calendar color IDs mapping
  const colorMap: Record<string, string> = {
    "#7986cb": "1", // Lavender
    "#33b679": "2", // Sage
    "#8e24aa": "3", // Grape
    "#e67c73": "4", // Flamingo
    "#f6c026": "5", // Banana
    "#f5511d": "6", // Tangerine
    "#039be5": "7", // Peacock
    "#616161": "8", // Graphite
    "#3f51b5": "9", // Blueberry
    "#0b8043": "10", // Basil
    "#d60000": "11", // Tomato
  };

  const lowerColor = hexColor?.toLowerCase();
  return colorMap[lowerColor] || "7"; // Default to Peacock
}
