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
    // Optional {"issue":"teach-offer"} so a NEW template can be rendered and read
    // before a real person is ever the one who receives it. Falls back to the
    // welcome, and refuses an unknown key rather than throwing on undefined.
    const pickIssue = (k: unknown) => {
      const key = typeof k === "string" && k in ISSUES ? k : "welcome";
      return { key, issue: ISSUES[key] };
    };

    if (body?.dryRun) {
      const { key, issue } = pickIssue(body?.issue);
      if (typeof body?.issue === "string" && body.issue !== key) {
        return json({ error: `unknown issue '${body.issue}'`, known: Object.keys(ISSUES) }, 400);
      }
      const unsub = "https://educatedtraveler.app/unsub-preview";
      const html = issue.html(unsub, "Hiroko", "Pottery & Ceramics");
      const text = issue.text?.(unsub, "Hiroko", "Pottery & Ceramics");
      return json({ ok: true, dryRun: true, issue: key, subject: issue.subject,
                    htmlLength: html.length, textChars: text ? text.length : 0, text: text ?? null });
    }

    // Inbox test: POST {"test":true} sends the current welcome to Arnaud only
    // (fixed recipient — no user input reaches content or destination) and
    // touches no rows. Mirrors concierge-send's test:true pattern.
    if (body?.test) {
      const TEST_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
      const unsub = "https://educatedtraveler.app/unsub-preview";
      const { key, issue } = pickIssue(body?.issue);
      if (typeof body?.issue === "string" && body.issue !== key) {
        return json({ error: `unknown issue '${body.issue}'`, known: Object.keys(ISSUES) }, 400);
      }
      const { subject, html, text } = issue;
      const name = typeof body?.name === "string" ? body.name : "";
      const craft = typeof body?.craft === "string" ? body.craft : "";
      const subj = "[TEST] " + subject.replace("{CRAFT}", craft || "that craft");
      const r = await sendPersonalEmail(TEST_TO, subj, html(unsub, name, craft), text?.(unsub, name, craft));
      return json(r.ok ? { ok: true, test: true, issue: key, id: r.id, to: TEST_TO,
                           textChars: text ? text(unsub, name, craft).length : 0 } : { error: r.error }, r.ok ? 200 : 500);
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

    // /pay is not a Circle door. A chef who has just tried to send €350 for a
    // seat should not receive "welcome to the Circle" ninety seconds later —
    // it answers a question he did not ask and says nothing about his money.
    // Verified 13 Aug 2026: two real chefs got exactly that. welcomed_at is
    // deliberately left null, so if he later joins the Circle properly the
    // letter still reaches him then.
    if (String(row.source ?? "").startsWith("pay:")) {
      return json({ message: "skip (seat payment, not a Circle signup)" });
    }

    // Per-ROW idempotency. This endpoint is deployed --no-verify-jwt, so anyone who
    // guesses a row id can POST it again; without this, one letter can be turned into
    // unlimited identical emails to that person. Every path checks it, including
    // letters. It also covers a webhook retry.
    if (row.welcomed_at) return json({ message: "skip (this row already answered)" });

    // A letter written from an Atlas craft page gets its own reply — an answer about
    // that craft and a request to say who they are — INSTEAD of the Mashiko welcome.
    // Nobody should get two first letters from the same person on the same day.
    // Both shapes: the hub letter writes "atlas-letter", a craft sheet "atlas-letter:<slug>".
    const isLetter = String(row.source ?? "").startsWith("atlas-letter");

    // Someone offering to open a room (/teach). They get the master's reply, never
    // the Mashiko welcome — that one is written to a person deciding what to learn.
    const isTeach = String(row.source ?? "") === "teach-offer";

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
    // specific craft, not an introduction. A second plain signup is not: stamp the
    // row so it can't come round again, and say why in last_issue.
    if (alreadyWelcomed && !isLetter && !isTeach) {
      await admin.from("launch_waitlist")
        .update({ welcomed_at: new Date().toISOString(), last_issue: "welcome-skipped-duplicate" })
        .eq("id", row.id);
      return json({ message: "skip (this person was already welcomed)" });
    }

    // What they wrote about, for the subject line and the opening — from the row we
    // just re-read, never from the webhook payload.
    let craft = "", name = "";
    for (const it of Array.isArray(row.interests) ? row.interests : []) {
      if (!it || typeof it !== "object") continue;
      if (it.kind === "discipline" && !craft) craft = String(it.discipline ?? it.label ?? "").trim();
      if (it.kind === "instructor" && !craft) craft = String(it.craft ?? "").trim();
      if (it.kind === "profile" && !name) name = String(it.name ?? "").trim();
    }
    if (!craft) craft = "that craft";

    const key = isTeach ? "teach-offer" : isLetter ? "atlas-letter" : "welcome";

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
