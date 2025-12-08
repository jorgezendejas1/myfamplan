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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    console.log("Google Auth action:", action);

    if (action === "get-auth-url") {
      // Use the correct Supabase functions URL format
      const supabaseUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co/functions/v1');
      const redirectUri = `${supabaseUrl}/google-auth?action=callback`;
      const state = crypto.randomUUID();
      
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      console.log("Generated auth URL:", authUrl.toString());

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString(), state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://lovable.dev";

      if (error) {
        console.error("OAuth error:", error);
        return Response.redirect(`${frontendUrl}?google_auth_error=${error}`, 302);
      }

      if (!code) {
        console.error("No authorization code received");
        return Response.redirect(`${frontendUrl}?google_auth_error=no_code`, 302);
      }

      // Use the correct Supabase functions URL format
      const supabaseUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co/functions/v1');
      const redirectUri = `${supabaseUrl}/google-auth?action=callback`;
      
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      console.log("Token exchange response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", tokens);
        return Response.redirect(`${frontendUrl}?google_auth_error=token_exchange_failed`, 302);
      }

      // Get user info
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const userInfo = await userInfoResponse.json();
      console.log("User info retrieved:", userInfo.email);

      // Save to database
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      const { data, error: dbError } = await supabase
        .from("google_accounts")
        .upsert({
          email: userInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          sync_enabled: true,
        }, { onConflict: "email" })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        return Response.redirect(`${frontendUrl}?google_auth_error=db_error`, 302);
      }

      console.log("Account saved successfully:", data.id);
      return Response.redirect(`${frontendUrl}?google_auth_success=true&email=${encodeURIComponent(userInfo.email)}`, 302);
    }

    if (action === "refresh-token") {
      const { accountId } = await req.json();
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: account, error: fetchError } = await supabase
        .from("google_accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      if (fetchError || !account) {
        return new Response(
          JSON.stringify({ error: "Account not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
        return new Response(
          JSON.stringify({ error: "Token refresh failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await supabase
        .from("google_accounts")
        .update({
          access_token: tokens.access_token,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", accountId);

      return new Response(
        JSON.stringify({ success: true, access_token: tokens.access_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in google-auth function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
