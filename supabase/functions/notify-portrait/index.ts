// Edge Function: notify-portrait
// Emails Arnaud every time a member seals their Circle portrait at /portrait.
// Called by the page (supabase.functions.invoke) right after a successful save.
// Security: the function does NOT trust anything the browser sends — it verifies
// the caller's JWT, then re-reads that user's OWN profile row with the service
// role and emails from the trusted data.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
// Where the "someone completed their portrait" note lands. Arnaud's inbox.
const NOTIFY_TO = Deno.env.get("PORTRAIT_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const FROM = "The Circle · EducatedTraveler <founder@educatedtraveler.app>";

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  // 1) Who's calling? Verify the JWT, don't trust the body.
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "missing auth" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (uErr || !user) return json({ error: "invalid auth" }, 401);

  // 2) Read THEIR profile from the source of truth.
  const { data: rec, error: pErr } = await admin
    .from("profiles").select("*").eq("id", user.id).single();
  if (pErr || !rec) return json({ error: "no profile" }, 404);
  if (rec.portrait_complete !== true) return json({ skipped: "portrait not complete" });

  const email = user.email || rec.email || "";
  const name = rec.first_name || "A new member";
  // interests is a JSONB object keyed by category: { culinary:[...], ocean:[...] }
  const crafts: string[] = (() => {
    const iv = rec.interests;
    if (Array.isArray(iv)) return iv.filter(Boolean);
    if (iv && typeof iv === "object") return Object.values(iv).flat().filter(Boolean) as string[];
    return [];
  })();
  const startingFrom = [rec.previous_experience, rec.availability, rec.preferred_duration, rec.reach]
    .filter(Boolean).join(" · ");
  const letter = (rec.dream_letter || "").trim();

  const row = (k: string, v: string) => v
    ? `<tr><td style="padding:6px 14px 6px 0;color:rgba(243,237,226,0.4);font-size:12px;letter-spacing:1px;text-transform:uppercase;font-family:'Courier New',monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 0;color:#f3ede2;font-size:15px;line-height:1.6;">${v}</td></tr>`
    : "";

  const craftTags = crafts.map((c) =>
    `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border:1px solid #7fa8a5;border-radius:8px;font-size:13px;color:#f3ede2;">${esc(c)}</span>`
  ).join("");

  const letterBlock = letter
    ? `<div style="background:#efe6d3;border-radius:8px;padding:22px 24px;margin:22px 0 6px 0;">
         <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 12px 0;">The letter — for you alone</p>
         <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.75;margin:0;white-space:pre-wrap;">${esc(letter)}</p>
       </div>`
    : `<p style="color:rgba(243,237,226,0.4);font-size:14px;font-style:italic;margin:18px 0 0 0;">No letter yet — they said they'd write it later.</p>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:32px 26px;">
      <p style="color:#d28a52;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px 0;font-family:'Courier New',monospace;">New portrait sealed</p>
      <p style="color:#f3ede2;font-family:Georgia,serif;font-size:22px;line-height:1.4;margin:0 0 20px 0;">${esc(name)} just took a place in the Circle.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", esc(name))}
        ${row("Email", email ? `<a href="mailto:${esc(email)}" style="color:#7fa8a5;">${esc(email)}</a>` : "")}
        ${row("They do", esc(rec.profession))}
        ${row("Location", esc(rec.location))}
        ${row("At the door", esc(rec.status))}
        ${row("The craft", craftTags)}
        ${row("Starting from", esc(startingFrom))}
      </table>
      ${letterBlock}
      <div style="text-align:center;margin:26px 0 0 0;">
        <a href="${APP_URL}/admin" style="display:inline-block;background:linear-gradient(135deg,#7fa8a5 0%,#d28a52 100%);color:#14110d;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;font-weight:500;">Open the Circle roster</a>
      </div>
    </div>
    <p style="color:rgba(243,237,226,0.25);font-size:12px;text-align:center;margin:22px 0 0 0;">You read every letter. This one's waiting.</p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: NOTIFY_TO,
        reply_to: email || undefined,
        subject: `New portrait: ${name}${crafts.length ? " — " + crafts[0] : ""}`,
        html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[notify-portrait] resend failed:", res.status, t);
      return json({ error: "resend failed", status: res.status }, 502);
    }
  } catch (e) {
    console.error("[notify-portrait] error:", e);
    return json({ error: String(e) }, 500);
  }

  return json({ ok: true, emailed: NOTIFY_TO });
});
