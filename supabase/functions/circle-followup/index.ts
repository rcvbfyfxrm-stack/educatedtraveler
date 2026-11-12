// Circle follow-up: two days after the welcome, to people who joined WITHOUT a note,
// ask who they are and what they would like to learn (Arnaud, 12 Nov 2026). Called once a day by
// pg_cron (job "circle-followup-daily"). Idempotent: a row is sent once
// (followed_up_at), a person once (email match), so a forged call can at most
// send a due follow-up a few hours early. {"test":true} sends to Arnaud only.
// {"dryRun":true} sends nothing and returns who is due (emails masked).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { followupEmail, sendPersonalEmail } from "../_shared/circle-emails.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);
// Only people who join from the day this shipped. Older members never get it.
const START = "2026-11-12T00:00:00Z";
const DELAY_DAYS = 2;
// Doors that already got their own reply (or paid, or only tapped "interested").
const SKIP = [/^pay:/, /:interested$/, /^atlas-letter/, /^atlas-interest/, /^teach-offer$/];

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

const SMALL = new Set(["and", "of", "the", "at", "in", "for"]);
function craftFromSlug(slug: string) {
  return slug.split("--")[0].split("-").map((w, i) =>
    w === "stcw" ? "STCW" : (i > 0 && SMALL.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

type Row = { id: string; email: string; source: string | null; interests: unknown; letter: string | null; unsubscribe_token: string };

export function doorLine(row: Pick<Row, "source" | "interests">): string {
  const s = String(row.source ?? "");
  const items = Array.isArray(row.interests) ? row.interests as Record<string, unknown>[] : [];
  const martin = items.some((i) => i?.kind === "collab-interest" && i?.teacher === "martin-lippo");
  let craft = "";
  for (const i of items) if (i?.kind === "discipline" && !craft) craft = String(i.label ?? i.discipline ?? "").trim();
  let line = "";
  if (s === "circle-whatsapp-first") line = "You came in through the note I sent on WhatsApp";
  else if (s === "circle-questionnaire") line = "You joined through the Circle page on the site";
  else if (s === "homepage-circle") line = "You joined from the front page of the site";
  else if (s.startsWith("atlas:")) line = `You found us on the ${craft || craftFromSlug(s.slice(6))} page of the Atlas`;
  else if (s === "friend-invite" || /(^|[:-])from[:-]/.test(s)) line = "A friend sent you our way";
  else if (s === "qr-hello") line = "You came in from the QR code";
  else if (s === "lab-weeks") line = "You joined from the collaborations page";
  if (martin) line = line ? line + ", and you put your name down for the new collaboration with Martin" : "You put your name down for the new collaboration with Martin";
  return line ? line + "." : "";
}

function firstName(interests: unknown) {
  for (const i of Array.isArray(interests) ? interests as Record<string, unknown>[] : [])
    if (i?.kind === "profile" && i?.name) return String(i.name).trim().split(/\s+/)[0];
  return "";
}

// Their own words live in interests kind:"dream" (claim_waitlist_answers() carries it
// into profiles.dream_letter). /first writes an automatic dream ("Works at: ...",
// "Came from the WhatsApp note ...", "Applied for ..."): those lines are not a note.
const AUTO = [/^Works at:/i, /^Came from the WhatsApp note/i, /^Applied for /i];
export function wroteANote(r: Pick<Row, "interests" | "letter">) {
  const texts = [String(r.letter ?? "")];
  for (const i of Array.isArray(r.interests) ? r.interests as Record<string, unknown>[] : [])
    if (i?.kind === "dream") texts.push(String(i.text ?? ""));
  const own = texts.join("\n").split("\n").map((l) => l.trim()).filter((l) => l && !AUTO.some((re) => re.test(l)));
  return own.join(" ").split(/\s+/).filter(Boolean).length >= 2;
}

const mask = (e: string) => e.replace(/^(.).*(@.*)$/, "$1***$2");

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.test) {
      const to = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
      const row = { source: String(body.source ?? "circle-whatsapp-first"),
        interests: [{ kind: "profile", name: String(body.name ?? "Ruthie Kallai") },
                    ...(body.martin === false ? [] : [{ kind: "collab-interest", teacher: "martin-lippo" }])] };
      const m = followupEmail("https://educatedtraveler.app/unsub-preview", firstName(row.interests), doorLine(row));
      const r = await sendPersonalEmail(to, "[TEST] " + m.subject, m.html, m.text, m.from);
      return json(r.ok ? { ok: true, test: true, to } : { error: r.error }, r.ok ? 200 : 500);
    }

    const cutoff = new Date(Date.now() - DELAY_DAYS * 86400e3).toISOString();
    const { data, error } = await admin.from("launch_waitlist")
      .select("id,email,source,interests,letter,unsubscribe_token")
      .gte("created_at", START).lte("welcomed_at", cutoff)
      .is("followed_up_at", null).eq("unsubscribed", false)
      .neq("last_issue", "welcome-skipped-duplicate");
    if (error) return json({ error }, 500);

    const due: Row[] = [];
    const seen = new Set<string>();
    for (const r of (data ?? []) as Row[]) {
      const key = r.email.trim().toLowerCase();
      if (seen.has(key) || SKIP.some((re) => re.test(String(r.source ?? "")))) continue;
      if (wroteANote(r)) continue; // only people who joined without a note
      const { count } = await admin.from("launch_waitlist").select("id", { count: "exact", head: true })
        .ilike("email", key).not("followed_up_at", "is", null);
      if (count) continue;
      seen.add(key);
      due.push(r);
    }

    if (body?.dryRun) {
      return json({ dryRun: true, due: due.map((r) => ({ to: mask(r.email), source: r.source, line: doorLine(r) })),
        sample: due[0] ? followupEmail("https://educatedtraveler.app/unsub-preview", firstName(due[0].interests), doorLine(due[0])).text : null });
    }

    const sent: string[] = [], failed: string[] = [];
    for (const r of due) {
      const unsub = `${SUPABASE_URL}/functions/v1/circle-unsubscribe?token=${r.unsubscribe_token}`;
      const m = followupEmail(unsub, firstName(r.interests), doorLine(r));
      const res = await sendPersonalEmail(r.email, m.subject, m.html, m.text, m.from);
      if (!res.ok) { console.error("followup failed", r.id, res.error); failed.push(r.id); continue; }
      await admin.from("launch_waitlist").update({ followed_up_at: new Date().toISOString(), last_issue: "followup" }).eq("id", r.id);
      sent.push(mask(r.email));
    }
    return json({ sent, failed });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
