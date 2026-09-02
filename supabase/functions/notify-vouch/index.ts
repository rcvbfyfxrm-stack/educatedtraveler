// Edge Function: notify-vouch
// Fires on a `vouches` INSERT (pg_net trigger, migration 044).
// Emails Arnaud the full sheet for a chef who has signed for a room: who they are,
// their trade, which craft and which place, when they were there, how they got
// there, and their own words — so he can decide without opening a dashboard.
//
// Security: the payload is never trusted. It carries an id and nothing else; the
// row is re-fetched with the service role. A forged POST can at worst re-send
// Arnaud a sheet about a real vouch.
// Deploy with --no-verify-jwt (the DB trigger sends no JWT).
//
// The mail is LIGHT on purpose. Gmail throws <body> styling away and renders on
// its own white background, so a Warm-Dark letter arrives invisible. Solid hex
// only — Outlook's Word engine ignores rgba().
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFY_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const FROM = "The Atlas · EducatedTraveler <founder@educatedtraveler.app>";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

const ROUTE_LINE: Record<string, string> = {
  "with-us": "They came on a week we sold. Read the words below knowing that — and if it goes up, that line goes up with it.",
  "direct": "They went on their own. Nothing came to us from this, which is the cleanest kind of witness there is.",
};

function sheet(v: Record<string, unknown>, email: string) {
  const craft = String(v.craft ?? "");
  const dest = String(v.destination ?? "");
  const route = String(v.route ?? "");
  const withUs = route === "with-us";
  const row = (k: string, val: string) =>
    `<tr><td style="padding:7px 14px 7px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td>`
    + `<td style="padding:7px 0;color:#2b2621;font-size:15px;line-height:1.6;">${val}</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
</head><body style="margin:0;padding:0;background:#f6f1e7;">
<div style="max-width:640px;margin:0 auto;padding:34px 26px;font-family:Helvetica,Arial,sans-serif;">

  <p style="margin:0 0 4px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">A chef signed for a room</p>
  <h1 style="margin:0 0 6px 0;color:#2b2621;font-family:Georgia,serif;font-size:25px;font-weight:normal;line-height:1.25;">${esc(v.display_name)}, ${esc(v.trade)}</h1>
  <p style="margin:0 0 22px 0;color:#6b625a;font-size:14px;">Nothing is public. This is waiting on you.</p>

  <table style="border-collapse:collapse;width:100%;margin:0 0 20px 0;">
    ${row("Craft", `<a href="https://educatedtraveler.app/atlas/${esc(craft)}" style="color:#2b6660;">${esc(craft)}</a>`)}
    ${row("Place", `<a href="https://educatedtraveler.app/atlas/${esc(dest)}" style="color:#2b6660;">${esc(dest)}</a>`)}
    ${row("What they did", esc(v.state))}
    ${row("When", esc(v.visited_on))}
    ${row("Account", `<a href="mailto:${esc(email)}" style="color:#2b6660;">${esc(email)}</a>`)}
    ${row("Consent to publish", v.consent_public ? "Given" : "NOT given — do not publish")}
  </table>

  <div style="background:${withUs ? "#f3e2d2" : "#e7efed"};border-left:3px solid ${withUs ? "#d28a52" : "#7fa8a5"};border-radius:6px;padding:14px 16px;margin:0 0 22px 0;">
    <p style="margin:0;color:#3a2f26;font-size:14px;line-height:1.6;">${esc(ROUTE_LINE[route] ?? route)}</p>
  </div>

  <div style="background:#efe6d3;border-radius:8px;padding:24px 26px;margin:0 0 22px 0;">
    <p style="margin:0 0 14px 0;color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">What they saw, in their words</p>
    <p style="margin:0;color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;white-space:pre-wrap;">${esc(v.what)}</p>
    <p style="margin:16px 0 0 0;color:#3a2c1e;font-family:Georgia,serif;font-style:italic;font-size:15px;text-align:right;">— ${esc(v.display_name)}, ${esc(v.trade)}</p>
  </div>

  <div style="border-top:1px solid #ddd2bd;padding-top:18px;">
    <p style="margin:0 0 10px 0;color:#6b625a;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">If it holds up</p>
    <p style="margin:0 0 10px 0;color:#2b2621;font-size:14px;line-height:1.7;">Approve it (Supabase SQL editor, or <span style="font-family:'Courier New',monospace;font-size:13px;">supabase db query --linked</span>), then pull it into the build:</p>
    <p style="margin:0 0 14px 0;color:#2b2621;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.75;background:#efe6d3;border-radius:6px;padding:12px 14px;">
      update public.vouches set status='approved', decided_at=now() where id='${esc(v.id)}';<br>
      node scripts/refresh-vouches.mjs<br>
      python3 scripts/build-atlas-pages.py
    </p>
    <p style="margin:0;color:#6b625a;font-size:13.5px;line-height:1.7;">This is the first evidence the Atlas has ever had that is not desk research. It lifts that craft off three dots — so it is worth reading twice before it goes up.</p>
  </div>

</div></body></html>`;
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id ?? body?.record?.id;
    if (!id) return json({ error: "no id" }, 400);

    const { data: v, error } = await admin.from("vouches").select("*").eq("id", id).single();
    if (error || !v) return json({ error: "row not found" }, 404);

    let email = "";
    try {
      const u = await admin.auth.admin.getUserById(String(v.user_id));
      email = u?.data?.user?.email ?? "";
    } catch (_e) { /* the sheet is still worth sending without it */ }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [NOTIFY_TO],
        ...(email ? { reply_to: email } : {}),
        subject: `${v.display_name} (${v.trade}) signed for ${v.destination}`,
        html: sheet(v as Record<string, unknown>, email),
      }),
    });
    const rj = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("notify-vouch send failed:", rj); return json({ error: rj }, 502); }
    return json({ ok: true, id: rj?.id ?? null });
  } catch (e) {
    console.error("notify-vouch:", e);
    return json({ error: String(e) }, 500);
  }
});
