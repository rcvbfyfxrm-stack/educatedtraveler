// Edge Function: week-answers
// Called by the browser from /around-the-week — the page Arnaud sends by hand to
// the chefs of a Lab Week, asking what they would come to around the five days.
//
// It does three things and nothing else: keeps the answer (addon_interests),
// emails Arnaud the sheet, and tells the page whether that email was accepted.
//
// What it can never do, by construction:
//   - email anyone but Arnaud: the recipient is a constant, never read from the
//     request. The chef's address is used only as reply_to.
//   - touch the Circle: it reads and writes one table, addon_interests, which no
//     trigger and no other function reads. A chef answering here is not a signup.
//   - change anything on a GET: POST only, and OPTIONS for the preflight.
//
// Deploy WITH JWT verification (the default) — it is called through
// supabaseClient.functions.invoke, which sends the public anon key.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import {
  clean, lastAnswerAt, REV, roomFrom, SAMPLE, SAMPLE_OPTS, sheetHtml, sheetText,
  SLUG, subjectFor, toStore,
} from "./sheet.ts";
import type { Room, StoredRow } from "./sheet.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFY_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const FROM = "Lab Week 01 · EducatedTraveler <founder@educatedtraveler.app>";

const MAX_BODY = 8000;      // characters; the real page sends about 1,500
const STORE_MS = 3000;
const SEND_MS = 8000;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function madrid(ts: string | Date): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts)) + " (Madrid)";
  } catch { return ""; }
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return json({ error: "not_json" }, 400); }

    // Dry run: renders the fixed sample, sends nothing, writes nothing. The hash
    // is compared with the one scripts/preview-week-answers.mjs prints — if they
    // match, what is deployed is what was reviewed.
    if (body && typeof body === "object" && (body as Record<string, unknown>).dryRun === true) {
      const html = sheetHtml(SAMPLE, SAMPLE_OPTS);
      const probe = await admin.from("addon_interests").select("id").limit(1)
        .abortSignal(AbortSignal.timeout(STORE_MS));
      return json({
        ok: true, dryRun: true, rev: REV, sha256: await sha256(html), htmlLength: html.length,
        stores: !probe.error,
      });
    }

    const c = clean(body);
    if (!c.ok) return json({ error: "invalid", reason: c.error }, 400);
    const a = c.value;
    // Test answers live under their own slug, so they never reach a real tally.
    const slug = a.test ? SLUG + ":test" : SLUG;

    // 1 · what the room has said so far — read BEFORE this answer is written, so
    //     "replaces their answer of …" means an earlier one. A failure here costs
    //     the tally, never the answer.
    let rows: StoredRow[] | null = null;
    try {
      const prior = await admin.from("addon_interests")
        .select("email,name,addons,created_at")
        .eq("page_slug", slug)
        .order("created_at", { ascending: false })
        .limit(300)
        .abortSignal(AbortSignal.timeout(STORE_MS));
      if (prior.error) console.error("week-answers: tally read failed:", prior.error.message);
      else rows = (prior.data ?? []) as StoredRow[];
    } catch (e) {
      console.error("week-answers: tally read threw:", String(e));
    }

    // 2 · keep it. Best effort: the email is the delivery, the row is the record,
    //     and the sheet says out loud when the record was not written.
    let stored = false;
    try {
      const ins = await admin.from("addon_interests").insert({
        email: a.email, name: a.name, page_slug: slug,
        addons: toStore(a), notes: a.words || null,
      }).abortSignal(AbortSignal.timeout(STORE_MS));
      stored = !ins.error;
      if (ins.error) console.error("week-answers: store failed:", ins.error.message);
    } catch (e) {
      console.error("week-answers: store threw:", String(e));
    }

    // 3 · the sheet
    let room: Room | null = null;
    let replacesAt = "";
    if (rows) {
      try {
        room = roomFrom(rows, a);
        const last = lastAnswerAt(rows, a.email);
        replacesAt = last ? madrid(last) : "";
      } catch (e) {
        console.error("week-answers: tally build threw:", String(e));
        room = null;
      }
    }
    const opts = { when: madrid(new Date()), stored, room, replacesAt };

    // 4 · send, to Arnaud and nobody else
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [NOTIFY_TO], reply_to: a.email,
        subject: subjectFor(a, !!replacesAt),
        html: sheetHtml(a, opts), text: sheetText(a, opts),
      }),
      signal: AbortSignal.timeout(SEND_MS),
    });
    if (!r.ok) {
      const why = await r.json().catch(() => ({}));
      console.error("week-answers: send failed:", r.status, why);
      // The page shows the chef a way to send it by hand. It is told the truth:
      // the email did not go, whether or not the row was written.
      return json({ error: "send_failed", stored }, 502);
    }
    return json({ ok: true, stored });
  } catch (e) {
    console.error("week-answers:", e);
    return json({ error: "failed" }, 500);
  }
});
