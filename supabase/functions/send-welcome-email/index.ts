// Supabase Edge Function: notify Arnaud when a new profile is created.
// The old user-facing "Your adventure matches are saved" email is RETIRED
// (Arnaud's order, 2026-07-22): it was stale quest-era copy, and new joiners
// already get the approved circle-welcome letter. Only the admin
// "New adventurer" notification remains — Arnaud's sole signal for accounts
// created outside the waitlist funnel.

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

    const adminNotify = await fetch("https://api.resend.com/emails", {
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
    });

    const data = await adminNotify.json().catch(() => ({}));

    if (!adminNotify.ok) {
      console.error("Admin notify failed:", data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: data.id, userEmail: "retired" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
