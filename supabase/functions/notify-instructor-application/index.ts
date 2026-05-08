// Supabase Edge Function: Notify founder of a new instructor application.
// Called by the public instructor form. No auth required (anon key).
// Emails arnaudcallier@pm.me via Resend with the full application payload.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = Deno.env.get("INSTRUCTOR_NOTIFY_TO") ?? "arnaudcallier@pm.me";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Application {
  name?: string;
  email?: string;
  location?: string;
  website?: string;
  discipline?: string;
  credentials?: string;
  approach?: string;
  excitement?: string;
  ideal_students?: string;
  home_base?: string;
  willing_to_travel?: boolean;
  travel_locations?: string;
  availability?: string;
  additional?: string;
}

function escape(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function row(label: string, value: string | undefined | null): string {
  if (!value) return "";
  return `<tr><td style="padding:8px 12px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;width:160px;">${label}</td><td style="padding:8px 12px;color:#111;font-size:14px;line-height:1.5;">${escape(value)}</td></tr>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let app: Application;
  try {
    app = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!app.name || !app.email) {
    return new Response(JSON.stringify({ error: "name and email required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subject = `New instructor application: ${app.name}${app.discipline ? ` (${app.discipline})` : ""}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5;">
      <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">EducatedTraveler · Instructor Application</p>
      <h1 style="font-size:22px;color:#111;margin:0 0 4px 0;">${escape(app.name)}</h1>
      <p style="color:#666;font-size:14px;margin:0 0 24px 0;">
        <a href="mailto:${escape(app.email)}" style="color:#0066B1;text-decoration:none;">${escape(app.email)}</a>
        ${app.website ? ` · <a href="${escape(app.website)}" style="color:#0066B1;text-decoration:none;">${escape(app.website)}</a>` : ""}
      </p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">
        ${row("Discipline", app.discipline)}
        ${row("Based in", app.location)}
        ${row("Teaches at", app.home_base)}
        ${row("Will travel?", app.willing_to_travel ? "Yes" : "No")}
        ${app.willing_to_travel ? row("Travel destinations", app.travel_locations) : ""}
        ${row("2026 availability", app.availability)}
        ${row("Credentials", app.credentials)}
        ${row("Approach", app.approach)}
        ${row("Excitement", app.excitement)}
        ${row("Ideal students", app.ideal_students)}
        ${row("Additional notes", app.additional)}
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;">
        <a href="mailto:${escape(app.email)}?subject=Re:%20your%20EducatedTraveler%20instructor%20application" style="display:inline-block;background:#0066B1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Reply to ${escape(app.name)}</a>
      </div>
    </div>
    <p style="color:#999;font-size:11px;text-align:center;margin-top:16px;">Sent from educatedtraveler.app · ${new Date().toISOString()}</p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EducatedTraveler <founder@educatedtraveler.app>",
        to: [NOTIFY_TO],
        reply_to: app.email,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Email send failed", detail: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
