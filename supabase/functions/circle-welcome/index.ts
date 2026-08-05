// Circle welcome — fires on a launch_waitlist INSERT (Database Webhook).
// Sends the warm welcome email once per subscriber. Re-fetches the row by id
// (don't trust the payload) so a forged POST with a random email does nothing.
// Deploy with --no-verify-jwt (called by the DB webhook).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ISSUES, sendPersonalEmail } from "../_shared/circle-emails.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Safe self-test: POST {"dryRun":true} renders without sending or touching data.
    if (body?.dryRun) {
      const html = ISSUES["welcome"].html("https://educatedtraveler.app/unsub-preview");
      return json({ ok: true, dryRun: true, subject: ISSUES["welcome"].subject, htmlLength: html.length });
    }

    // Inbox test: POST {"test":true} sends the current welcome to Arnaud only
    // (fixed recipient — no user input reaches content or destination) and
    // touches no rows. Mirrors concierge-send's test:true pattern.
    if (body?.test) {
      const TEST_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
      const unsub = "https://educatedtraveler.app/unsub-preview";
      const { subject, html, text } = ISSUES["welcome"];
      const r = await sendPersonalEmail(TEST_TO, "[TEST] " + subject, html(unsub), text?.(unsub));
      return json(r.ok ? { ok: true, test: true, id: r.id, to: TEST_TO, textChars: text ? text(unsub).length : 0 } : { error: r.error }, r.ok ? 200 : 500);
    }

    const rec = body?.record;
    if (body?.table !== "launch_waitlist" || !rec?.id) return json({ message: "ignored" });

    const { data: row } = await admin
      .from("launch_waitlist")
      .select("id,email,source,interests,unsubscribe_token,unsubscribed,welcomed_at")
      .eq("id", rec.id)
      .maybeSingle();

    if (!row) return json({ message: "no such row" });
    if (row.unsubscribed) return json({ message: "skip (unsubscribed)" });

    // Per-ROW idempotency. This endpoint is deployed --no-verify-jwt, so anyone who
    // guesses a row id can POST it again; without this, one letter can be turned into
    // unlimited identical emails to that person. Every path checks it, including
    // letters. It also covers a webhook retry.
    if (row.welcomed_at) return json({ message: "skip (this row already answered)" });

    // A letter written from an Atlas craft page gets its own reply — an answer about
    // that craft and a request to say who they are — INSTEAD of the Mashiko welcome.
    // Nobody should get two first letters from the same person on the same day.
    const isLetter = String(row.source ?? "").startsWith("atlas-letter:");

    // welcomed_at is per ROW, but a person is an EMAIL: launch_waitlist has no unique
    // constraint on it, and one person legitimately signs up more than once. Checking
    // the row alone re-sent the welcome to somebody already welcomed.
    // The match stays case-insensitive (rows are stored as typed), but the pattern is
    // escaped first: PostgREST treats _ and % in an ilike PATTERN as wildcards, so a
    // raw mary_j@x.com would match mary.j@x.com and swallow her genuine first welcome.
    const pattern = String(row.email).replace(/([\\%_])/g, "\\$1");
    const { data: prior } = await admin
      .from("launch_waitlist")
      .select("id")
      .ilike("email", pattern)
      .not("welcomed_at", "is", null)
      .limit(1);
    const alreadyWelcomed = Array.isArray(prior) && prior.length > 0;

    // A second letter is still worth an acknowledgement — it's a reply about a
    // specific craft, not an introduction. A second plain signup is not.
    if (alreadyWelcomed && !isLetter) return json({ message: "skip (this person is already welcomed)" });

    // What they wrote about, for the subject line and the opening — from the row we
    // just re-read, never from the webhook payload.
    let craft = "", name = "";
    for (const it of Array.isArray(row.interests) ? row.interests : []) {
      if (!it || typeof it !== "object") continue;
      if (it.kind === "discipline" && !craft) craft = String(it.discipline ?? it.label ?? "").trim();
      if (it.kind === "profile" && !name) name = String(it.name ?? "").trim();
    }
    if (!craft) craft = "that craft";

    const key = isLetter ? "atlas-letter" : "welcome";
    const unsub = `${SUPABASE_URL}/functions/v1/circle-unsubscribe?token=${row.unsubscribe_token}`;
    const { subject, html, text } = ISSUES[key];
    const subj = subject.replace("{CRAFT}", craft);
    const r = await sendPersonalEmail(row.email, subj, html(unsub, name, craft), text?.(unsub, name, craft));
    if (!r.ok) {
      console.error(key + " send failed:", r.error);
      return json({ error: r.error }, 500);
    }
    await admin.from("launch_waitlist")
      .update({ welcomed_at: new Date().toISOString(), last_issue: key })
      .eq("id", row.id);
    return json({ success: true, issue: key, id: r.id, to: row.email });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
