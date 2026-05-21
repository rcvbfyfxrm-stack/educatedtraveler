// Supabase Edge Function: Send Welcome Email via Resend
// Triggered when a new profile is created

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function fmtList(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  return arr.map(String).join(", ");
}

async function buildInterestHtml(userId: string, email: string): Promise<string> {
  if (!admin) return "";
  try {
    async function fetchAll() {
      return Promise.all([
        admin!.from("user_preferences")
          .select("elements, desires, time_preference, intensity, updated_at")
          .eq("user_id", userId).maybeSingle(),
        admin!.from("saved_adventures")
          .select("adventure_id, created_at")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
        admin!.from("experience_interests")
          .select("experience_id, created_at")
          .eq("email", email).order("created_at", { ascending: false }).limit(10),
      ]);
    }

    // Client typically upserts user_preferences a beat after the profile is
    // created. Wait briefly so the admin notification reflects what the user
    // actually filled in.
    await new Promise((r) => setTimeout(r, 2000));
    let [prefsRes, savedRes, expRes] = await fetchAll();

    // One retry if nothing came back yet (handles slower mobile clients).
    if (!prefsRes.data && (savedRes.data || []).length === 0 && (expRes.data || []).length === 0) {
      await new Promise((r) => setTimeout(r, 2500));
      [prefsRes, savedRes, expRes] = await fetchAll();
    }

    const prefs = prefsRes.data;
    const saved = savedRes.data || [];
    const interests = expRes.data || [];

    if (!prefs && saved.length === 0 && interests.length === 0) return "";

    const rows: string[] = [];
    if (prefs) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#888;width:120px;">Elements</td><td>${fmtList(prefs.elements)}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#888;">Desires</td><td>${fmtList(prefs.desires)}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#888;">Time</td><td>${prefs.time_preference || "—"}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#888;">Intensity</td><td>${prefs.intensity ?? "—"}</td></tr>`,
      );
    }
    if (saved.length) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#888;">Saved</td><td>${saved.map((s) => s.adventure_id).join(", ")}</td></tr>`,
      );
    }
    if (interests.length) {
      rows.push(
        `<tr><td style="padding:6px 0;color:#888;">Interests</td><td>${interests.map((i) => i.experience_id).join(", ")}</td></tr>`,
      );
    }

    return `
    <p style="margin:24px 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;">What they want</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">${rows.join("")}</table>`;
  } catch (e) {
    console.error("Interest lookup failed:", e);
    return "";
  }
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "profiles") {
      return new Response(JSON.stringify({ message: "Ignored" }), { status: 200 });
    }

    const { email, name, id, created_at } = payload.record;
    const firstName = name || email.split("@")[0];
    const ADMIN_EMAIL = "arnaudcallier@pm.me";

    const interestHtml = await buildInterestHtml(id, email);

    // Fire-and-forget admin notification (parallel with the welcome email).
    // Failure here must not block the user-facing email or return 5xx.
    const adminNotify = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EducatedTraveler <founder@educatedtraveler.app>",
        to: [ADMIN_EMAIL],
        reply_to: email,
        subject: `New adventurer: ${firstName} (${email})`,
        html: `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;">New signup</p>
    <h2 style="margin:0 0 20px 0;font-size:20px;font-weight:500;color:#111;">${firstName}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
      <tr><td style="padding:6px 0;color:#888;width:120px;">Email</td><td><a href="mailto:${email}" style="color:#0066B1;text-decoration:none;">${email}</a></td></tr>
      <tr><td style="padding:6px 0;color:#888;">Profile ID</td><td style="font-family:monospace;font-size:12px;color:#555;">${id}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Joined</td><td>${created_at}</td></tr>
    </table>
    ${interestHtml}
    <p style="margin:24px 0 0 0;">
      <a href="https://educatedtraveler.app/admin.html" style="display:inline-block;padding:10px 18px;background:#0066B1;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;">Open admin console</a>
    </p>
  </div>
</body></html>
        `,
      }),
    }).catch((e) => console.error("Admin notify failed:", e));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arnaud <founder@educatedtraveler.app>",
        to: [email],
        reply_to: "founder@educatedtraveler.app",
        subject: "Your adventure matches are saved",
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#ffffff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>

    <!-- Card -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">

      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">Your Quest Results</p>

      <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hey ${firstName},</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">You just did something most people never do — you actually chose.</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">Your matches are saved. They're not random — they're based on what you said you want: the element, the outcome, the intensity.</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 28px 0;">We're building cohorts now. When one opens that fits you, you'll be first to know.</p>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="https://educatedtraveler.app/offerings" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">See What's Available</a>
      </div>

    </div>

    <!-- Sign-off -->
    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;">
        <a href="https://educatedtraveler.app" style="color:rgba(59,141,212,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a>
      </p>
    </div>

  </div>
</body>
</html>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    // Ensure the admin notification completes before the function exits
    // (Edge runtime cancels in-flight fetches on return).
    await adminNotify;

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
