// Edge Function: concierge-send
// The ONE gated act: send a concierge message to a Circle joiner. Called from the
// Studio Command tab with Arnaud's signed-in session (verify_jwt ON). Nothing here
// can send on its own — it is only ever the result of Arnaud clicking "Send".
//
// Guardrails (all must hold or it refuses):
//  1. The caller must be an admin — verified via is_admin() RPC bound to the CALLER's
//     JWT (not the service key). A random authenticated user cannot send.
//  2. The row is re-fetched by id with the service role — the client payload is never
//     trusted for content. Arnaud's in-Studio edits to the message live on the row.
//  3. status must be 'published' (the Atlas page the message links to must be live)
//     — enforces publish-before-send ordering. It refuses drafts.
//  4. test:true routes the copy to Arnaud only and does NOT stamp the row.
//
// Deploy: supabase functions deploy concierge-send --use-api --dns-resolver https
// (verify_jwt defaults ON — do NOT pass --no-verify-jwt; the admin check needs the JWT.)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const TEST_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const REPLY_TO = "founder@educatedtraveler.app";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// message_md is Arnaud's plain text (possibly edited in Studio). Render it into the
// warm-dark email shell as simple paragraphs — links are rendered from bare URLs.
function bodyHtml(messageMd: string): string {
  const paras = String(messageMd || "").trim().split(/\n{2,}/).map((p) => {
    const withLinks = esc(p.trim()).replace(
      /(https?:\/\/[^\s]+|\/atlas\/[a-z0-9-]+)/g,
      (u) => `<a href="${u.startsWith("/") ? "https://educatedtraveler.app" + u : u}" style="color:#7fa8a5;">${u}</a>`,
    );
    return `<p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0 0 16px 0;white-space:pre-wrap;">${withLinks}</p>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-family:Georgia,serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:34px 28px;">
      ${paras}
    </div>
    <div style="margin-top:36px;padding-top:20px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:10px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));

    // Self-test that touches nothing: {dryRun:true} renders a sample.
    if (body?.dryRun) {
      const html = bodyHtml("Chelsea,\n\nA small wonder about your craft…\n\nRead more: /atlas/lymphatic-drainage-massage\n\n— Arnaud");
      return json({ ok: true, dryRun: true, htmlLength: html.length });
    }

    const id = body?.id;
    if (!id) return json({ error: "missing id" }, 400);

    // 1) Admin check — bind a client to the CALLER's JWT and ask is_admin().
    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: isAdmin, error: adminErr } = await caller.rpc("is_admin");
    if (adminErr) return json({ error: "admin check failed", detail: adminErr.message }, 401);
    if (isAdmin !== true) return json({ error: "not authorized" }, 403);

    // 2) Re-fetch the row with the service role — content comes from the row, never the client.
    const { data: row } = await admin
      .from("concierge_queue")
      .select("id,lead_email,person_name,status,message_subject,message_md,atlas_url,skill_title")
      .eq("id", id)
      .maybeSingle();
    if (!row) return json({ error: "no such row" }, 404);

    // 3) Ordering guard: the Atlas page the message points to must be live.
    if (row.status !== "published") {
      return json({ error: `status is '${row.status}', expected 'published' — publish the Atlas page before sending` }, 409);
    }
    if (!row.message_md || !String(row.message_md).trim()) {
      return json({ error: "message is empty" }, 400);
    }

    const isTest = body?.test === true;
    const to = isTest ? TEST_TO : String(row.lead_email);
    const subject = (isTest ? "[TEST] " : "") + (row.message_subject || `A note about ${row.skill_title || "your craft"}`);

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html: bodyHtml(row.message_md) }),
    });
    const rj = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("concierge-send failed:", rj); return json({ error: rj }, 500); }

    // 4) Stamp only on a real send.
    if (!isTest) {
      await admin.from("concierge_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), sent_to: to })
        .eq("id", id);
    }
    return json({ ok: true, test: isTest, sentTo: to, emailId: rj.id });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
