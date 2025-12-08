import { supabase } from "@/integrations/supabase/client";
import type { CalendarEvent } from "@/types";

export interface GoogleAccount {
  id: string;
  email: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  calendar_id: string;
}

export async function getGoogleAuthUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("google-auth", {
    body: null,
    method: "GET",
  });

  // For GET requests with query params, we need to construct the URL manually
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/google-auth?action=get-auth-url`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get auth URL");
  }

  const result = await response.json();
  return result.authUrl;
}

export async function getConnectedAccounts(): Promise<GoogleAccount[]> {
  const { data, error } = await supabase
    .from("google_accounts")
    .select("id, email, sync_enabled, last_sync_at, calendar_id")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching connected accounts:", error);
    return [];
  }

  return data || [];
}

export async function disconnectAccount(accountId: string): Promise<boolean> {
  // Delete sync mappings first
  await supabase
    .from("event_sync_mapping")
    .delete()
    .eq("google_account_id", accountId);

  // Delete sync queue items
  await supabase
    .from("sync_queue")
    .delete()
    .eq("google_account_id", accountId);

  // Delete account
  const { error } = await supabase
    .from("google_accounts")
    .delete()
    .eq("id", accountId);

  if (error) {
    console.error("Error disconnecting account:", error);
    return false;
  }

  return true;
}

export async function toggleSyncEnabled(accountId: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("google_accounts")
    .update({ sync_enabled: enabled })
    .eq("id", accountId);

  if (error) {
    console.error("Error toggling sync:", error);
    return false;
  }

  return true;
}

export async function syncFromGoogle(accountId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
    body: { action: "fetch", accountId },
  });

  if (error) {
    console.error("Error syncing from Google:", error);
    throw error;
  }

  // Convert Google events to local format
  const events: CalendarEvent[] = (data.events || []).map((gEvent: any) => ({
    id: `google-${gEvent.id}`,
    title: gEvent.summary || "Sin título",
    description: gEvent.description || "",
    start: gEvent.start?.dateTime || gEvent.start?.date || "",
    end: gEvent.end?.dateTime || gEvent.end?.date || "",
    allDay: !!gEvent.start?.date,
    color: getLocalColor(gEvent.colorId),
    calendarId: "google",
    type: "event",
    googleEventId: gEvent.id,
    googleAccountId: accountId,
  }));

  return events;
}

export async function syncEventToGoogle(
  accountId: string,
  event: CalendarEvent,
  action: "create" | "update" | "delete"
): Promise<void> {
  // Get existing mapping if updating or deleting
  let googleEventId: string | undefined;

  if (action === "update" || action === "delete") {
    const { data: mapping } = await supabase
      .from("event_sync_mapping")
      .select("google_event_id")
      .eq("local_event_id", event.id)
      .eq("google_account_id", accountId)
      .single();

    googleEventId = mapping?.google_event_id;

    if (!googleEventId) {
      console.warn("No mapping found for event:", event.id);
      return;
    }
  }

  const { error } = await supabase.functions.invoke("google-calendar-sync", {
    body: {
      action,
      accountId,
      localEvent: {
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        color: "#039be5", // Default color since CalendarEvent doesn't have color
      },
      googleEventId,
    },
  });

  if (error) {
    console.error(`Error ${action}ing event to Google:`, error);
    throw error;
  }
}

export async function queueSyncOperation(
  accountId: string,
  eventId: string,
  action: string,
  eventData: any
): Promise<void> {
  const { error } = await supabase.from("sync_queue").insert({
    google_account_id: accountId,
    local_event_id: eventId,
    action,
    event_data: eventData,
  });

  if (error) {
    console.error("Error queueing sync operation:", error);
  }
}

function getLocalColor(googleColorId: string): string {
  const colorMap: Record<string, string> = {
    "1": "#7986cb",
    "2": "#33b679",
    "3": "#8e24aa",
    "4": "#e67c73",
    "5": "#f6c026",
    "6": "#f5511d",
    "7": "#039be5",
    "8": "#616161",
    "9": "#3f51b5",
    "10": "#0b8043",
    "11": "#d60000",
  };

  return colorMap[googleColorId] || "#039be5";
}
