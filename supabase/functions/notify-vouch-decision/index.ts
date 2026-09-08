// Edge Function: notify-vouch-decision
// Called by the School comments tab in /admin when Arnaud approves or declines.
// Writes to the PERSON WHO WROTE IT, not to Arnaud — he knows what he just clicked;
// they are the ones who have been waiting.
//
// Security: the payload carries an id and a status and is never trusted for content.
// The row is re-fetched with the service role, and the caller's JWT must belong to
// an admin — otherwise anyone with the anon key could make us mail a stranger.
// Deploy WITH jwt verification (the admin page sends a real session).
//
// It sends nothing at all when there is no address. A comment can be posted without
// one; that person chose not to be written to, and this respects it silently rather
// than treating a blank field as an error.
//
// The mail is LIGHT on purpose. Gmail throws <body> styling away and renders on its
// own white background, so a Warm-Dark letter arrives invisible. Solid hex only —
// Outlook's Word engine ignores rgba().
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// ⚠ This is invoked from admin.html with Authorization + apikey + Content-Type, which
// guarantees a preflight. Without these headers the browser never sends the POST, the
// page catches the failure and writes "saved, but the email did not send" on the row,
// and the whole point of this function — telling the writer what happened — never
// fires. Every other browser-invoked function in this repo imports this; this one was
// the exception.
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const SITE = "https://educatedtraveler.app";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function shell(inner: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
</head><body style="margin:0;padding:0;background:#f6f1e7;">
<div style="max-width:560px;margin:0 auto;padding:34px 26px;font-family:Helvetica,Arial,sans-serif;">
${inner}
<p style="margin:26px 0 0 0;padding-top:16px;border-top:1px solid #ddd2bd;color:#6b625a;font-size:12px;line-height:1.7;">
  EducatedTraveler — a skill, a place, a person, your people.<br>
  You are getting this once, because you wrote to me about a school. Nothing else follows from it.
</p>
</div></body></html>`;
}

// The quote comes back to them either way. They wrote it days ago and will not
// remember which one this is about.
function theirWords(v: Record<string, unknown>) {
  return `<div style="background:#efe6d3;border-radius:8px;padding:20px 22px;margin:0 0 22px 0;">
    <p style="margin:0;color:#2c231a;font-family:Georgia,serif;font-size:15px;line-height:1.75;white-space:pre-wrap;">${esc(v.what)}</p>
  </div>`;
}

// ⚠ TWO DIFFERENT THINGS ARRIVE HERE AND ONLY ONE OF THEM GOES ON A PAGE.
// A note on a SCHOOL is keyed to a real destination and renders under that school.
// A note on a CATALOGUED PLACE is keyed `<craft>--also--<place>`, which is built on
// purpose to match no destination id, and school-note.js says plainly why nothing
// comes back: "The catalogued places need no supabase round-trip: nothing is
// published back to them." It goes to Arnaud and nowhere else — which is the useful
// thing, because nobody has checked that place yet.
// This mail used to tell both of them "your note is on the Atlas" and hand them a
// button to a page that 404s. The place note now gets the truth, which is a better
// letter anyway: you told me something about a place nobody has checked.
const isPlaceNote = (v: Record<string, unknown>) =>
  String(v.destination ?? "").includes("--also--");

function approvedPlace(v: Record<string, unknown>) {
  return shell(`
  <p style="margin:0 0 4px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">I read it</p>
  <h1 style="margin:0 0 14px 0;color:#2b2621;font-family:Georgia,serif;font-size:24px;font-weight:normal;line-height:1.3;">Thank you — this is about ${esc(v.school)}, and nobody had checked it.</h1>
  <p style="margin:0 0 20px 0;color:#2b2621;font-size:15px;line-height:1.7;">That place is on the map as a line and nothing more: no school vetted, no teacher named, nothing graded. Yours is the first thing anybody has told me about it. It is not going up as a quote — a line nobody has checked is not a place to publish someone's word under — but it is what turns that line into something I can go and check.</p>
  ${theirWords(v)}
  <p style="margin:0;color:#6b625a;font-size:14px;line-height:1.7;">If you know a school or a teacher there, reply to this — it is my own inbox, and that is the next thing I would need.</p>`);
}

function approved(v: Record<string, unknown>) {
  if (isPlaceNote(v)) return approvedPlace(v);
  const dest = String(v.destination ?? "");
  return shell(`
  <p style="margin:0 0 4px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">It is up</p>
  <h1 style="margin:0 0 14px 0;color:#2b2621;font-family:Georgia,serif;font-size:24px;font-weight:normal;line-height:1.3;">Your note about ${esc(v.school)} is on the Atlas.</h1>
  <p style="margin:0 0 20px 0;color:#2b2621;font-size:15px;line-height:1.7;">I read it myself. Thank you — every page on that map admits nobody from here has stood in these rooms, and you are somebody who has. That is worth more to the next person than anything I can write from a desk.</p>
  ${theirWords(v)}
  <p style="margin:0 0 22px 0;"><a href="${SITE}/atlas/${esc(dest)}" style="display:inline-block;background:#2b6660;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;">See it on the page &rarr;</a></p>
  <p style="margin:0;color:#6b625a;font-size:14px;line-height:1.7;">If you want it changed or taken down, reply to this — it is my own inbox.</p>`);
}

function declined(v: Record<string, unknown>) {
  return shell(`
  <p style="margin:0 0 4px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">I read it</p>
  <h1 style="margin:0 0 14px 0;color:#2b2621;font-family:Georgia,serif;font-size:24px;font-weight:normal;line-height:1.3;">I am not putting your note about ${esc(v.school)} up.</h1>
  <p style="margin:0 0 20px 0;color:#2b2621;font-size:15px;line-height:1.7;">It is not a judgement on you, and I am grateful you took the time. It just is not going on the page.</p>
  ${theirWords(v)}
  <p style="margin:0;color:#2b2621;font-size:15px;line-height:1.7;">If you want to know why, or you think I have got it wrong, reply to this. It comes straight to me.</p>`);
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  try {
    // The caller must be an admin. Without this, the anon key plus a guessed id is
    // enough to make us send mail to a stranger with our name on it.
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "no token" }, 401);
    const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
    if (whoErr || !who?.user) return json({ error: "bad token" }, 401);
    // Exactly what public.is_admin() checks, read with the service role because we
    // are outside the caller's RLS context here. There is no is_admin_uid(): the
    // SQL helper is argument-free and keyed on auth.uid(), which is not us.
    const { data: p } = await admin.from("profiles").select("is_admin")
      .eq("id", who.user.id).maybeSingle();
    if (!p?.is_admin) return json({ error: "not an admin" }, 403);

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    const status = body?.status;
    if (!id || (status !== "approved" && status !== "declined")) {
      return json({ error: "id and status (approved|declined) required" }, 400);
    }

    const { data: v, error } = await admin.from("vouches").select("*").eq("id", id).single();
    if (error || !v) return json({ error: "row not found" }, 404);

    const to = String(v.email ?? "").trim();
    // No address is not a failure. They posted without one on purpose.
    if (!to) return json({ ok: true, sent: false, reason: "no address on the row" });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: "arnaudcallier@pm.me",
        subject: status === "approved"
          ? `Your note about ${v.school} is on the Atlas`
          : `About your note on ${v.school}`,
        html: status === "approved"
          ? approved(v as Record<string, unknown>)
          : declined(v as Record<string, unknown>),
      }),
    });
    const rj = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("notify-vouch-decision send failed:", rj); return json({ error: rj }, 502); }
    return json({ ok: true, sent: true, id: rj?.id ?? null });
  } catch (e) {
    console.error("notify-vouch-decision:", e);
    return json({ error: String(e) }, 500);
  }
});
