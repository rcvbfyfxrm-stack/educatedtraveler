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

  const firstName = (app.name || "").split(/\s+/)[0] || "there";
  const applicantHtml = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#ffffff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">Application Received</p>
      <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hi ${escape(firstName)},</p>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">Thank you for reaching out about teaching with EducatedTraveler. Your application is in front of me and I read every one personally.</p>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">If your craft and approach feel like a fit, I'll come back to you within a week to schedule a 15-minute call.</p>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 28px 0;">Want to skip the wait? Book a slot directly:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://cal.com/educatedtraveler/instructor-intro" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">Book a 15-min call</a>
      </div>
    </div>
    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(59,141,212,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;

  async function send(payload: Record<string, unknown>) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  try {
    const [founderResult, applicantResult] = await Promise.all([
      send({
        from: "EducatedTraveler <founder@educatedtraveler.app>",
        to: [NOTIFY_TO],
        reply_to: app.email,
        subject,
        html,
      }),
      send({
        from: "Arnaud <founder@educatedtraveler.app>",
        to: [app.email],
        reply_to: NOTIFY_TO,
        subject: "We received your EducatedTraveler application",
        html: applicantHtml,
      }),
    ]);

    if (!founderResult.ok) {
      console.error("Founder email failed:", founderResult.data);
    }
    if (!applicantResult.ok) {
      console.error("Applicant confirmation failed:", applicantResult.data);
    }

    // Founder email is the critical path — only fail the request if that one breaks.
    if (!founderResult.ok) {
      return new Response(JSON.stringify({ error: "Founder email failed", detail: founderResult.data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      founder_id: founderResult.data.id,
      applicant_id: applicantResult.ok ? applicantResult.data.id : null,
      applicant_email_sent: applicantResult.ok,
    }), {
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
