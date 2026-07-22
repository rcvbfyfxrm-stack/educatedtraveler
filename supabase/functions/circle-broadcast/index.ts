// Circle broadcast — admin-only sender for a Circle letter to the whole list.
// Auth: caller MUST present the service-role key as Bearer (only Arnaud has it).
// Deploy with --no-verify-jwt (we do our own service-key check below).
//
// Body:
//   { "issue": "issue-01", "dryRun": true }   -> counts recipients, sends NOTHING
//   { "issue": "issue-01", "test": "you@x" }  -> sends ONE copy to that address
//   { "issue": "issue-01" }                   -> sends to every active subscriber
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ISSUES, sendCircleEmail, sendPersonalEmail } from "../_shared/circle-emails.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  // Authorize by capability, not string-equality: only a valid service-role key
  // can list auth users. Accepts any of the project's service keys (the local
  // .env key and the function-injected key are both valid but not byte-identical).
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);
  try {
    const caller = createClient(SUPABASE_URL, token, { auth: { persistSession: false } });
    const { error: authErr } = await caller.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (authErr) return json({ error: "unauthorized" }, 401);
  } catch (_e) {
    return json({ error: "unauthorized" }, 401);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const issueKey = body.issue || "issue-01";
    const issue = ISSUES[issueKey];
    if (!issue) return json({ error: `unknown issue '${issueKey}'`, available: Object.keys(ISSUES) }, 400);

    // test mode: single address, no list read needed
    if (body.test) {
      const unsub = `${SUPABASE_URL}/functions/v1/circle-unsubscribe?token=preview`;
      const r = await sendCircleEmail(body.test, issue.subject, issue.html(unsub), unsub);
      return json({ ok: r.ok, mode: "test", to: body.test, subject: issue.subject, id: r.id, error: r.error });
    }

    // personal mode: explicit [{email,name}] list, sent 1:1 (no bulk unsub header).
    // Body: { "issue":"chef-invite", "personal":[{"email":"x","name":"Mario"}] }
    if (Array.isArray(body.personal)) {
      const results: Array<{ email: string; ok: boolean; id?: string; error?: unknown }> = [];
      for (const r of body.personal) {
        if (!r || !r.email) continue;
        const res = await sendPersonalEmail(r.email, issue.subject, issue.html("", r.name));
        results.push({ email: r.email, ok: res.ok, id: res.id, error: res.error });
        await new Promise((s) => setTimeout(s, 600));
      }
      return json({ ok: results.every((x) => x.ok), mode: "personal", issue: issueKey, subject: issue.subject, results });
    }

    const { data: subs, error } = await admin
      .from("launch_waitlist")
      .select("id,email,unsubscribe_token")
      .eq("unsubscribed", false);
    if (error) return json({ error: error.message }, 500);

    // de-dupe by lowercased email
    const seen = new Set<string>();
    let recipients = (subs || []).filter((s) => {
      const k = (s.email || "").toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Invite/conversion issues ("join", "take your place") must NEVER go to
    // someone who already has a member account — otherwise a member is told to
    // join the thing they're already in. The founding-list import seeded the
    // waitlist with people who are already members, so we filter every time.
    // Override with { "includeMembers": true } only if you really mean to.
    let skippedMembers = 0;
    if (issue.audience === "leads" && body.includeMembers !== true) {
      const { data: members, error: mErr } = await admin.from("profiles").select("email");
      if (mErr) return json({ error: `member lookup failed: ${mErr.message}` }, 500);
      const memberSet = new Set(
        (members || []).map((m) => (m.email || "").toLowerCase()).filter(Boolean),
      );
      const before = recipients.length;
      recipients = recipients.filter((s) => !memberSet.has((s.email || "").toLowerCase()));
      skippedMembers = before - recipients.length;
    }

    if (body.dryRun) {
      return json({ ok: true, mode: "dryRun", issue: issueKey, subject: issue.subject, audience: issue.audience ?? "all", recipients: recipients.length, skippedMembers });
    }

    // real send — sequential with a small delay (under Resend's ~2/s)
    let sent = 0;
    const errors: Array<{ email: string; error: unknown }> = [];
    for (const s of recipients) {
      const unsub = `${SUPABASE_URL}/functions/v1/circle-unsubscribe?token=${s.unsubscribe_token}`;
      const r = await sendCircleEmail(s.email, issue.subject, issue.html(unsub), unsub);
      if (r.ok) {
        sent++;
        await admin.from("launch_waitlist").update({ last_issue: issueKey }).eq("id", s.id);
      } else {
        errors.push({ email: s.email, error: r.error });
      }
      await new Promise((res) => setTimeout(res, 600));
    }
    return json({ ok: true, mode: "send", issue: issueKey, sent, failed: errors.length, skippedMembers, errors: errors.slice(0, 5) });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
