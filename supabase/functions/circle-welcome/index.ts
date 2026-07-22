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
      return json(r.ok ? { ok: true, test: true, id: r.id, to: TEST_TO } : { error: r.error }, r.ok ? 200 : 500);
    }

    const rec = body?.record;
    if (body?.table !== "launch_waitlist" || !rec?.id) return json({ message: "ignored" });

    const { data: row } = await admin
      .from("launch_waitlist")
      .select("id,email,unsubscribe_token,unsubscribed,welcomed_at")
      .eq("id", rec.id)
      .maybeSingle();

    if (!row) return json({ message: "no such row" });
    if (row.unsubscribed || row.welcomed_at) return json({ message: "skip (already welcomed or unsubscribed)" });

    const unsub = `${SUPABASE_URL}/functions/v1/circle-unsubscribe?token=${row.unsubscribe_token}`;
    const { subject, html, text } = ISSUES["welcome"];
    const r = await sendPersonalEmail(row.email, subject, html(unsub), text?.(unsub));
    if (!r.ok) {
      console.error("welcome send failed:", r.error);
      return json({ error: r.error }, 500);
    }
    await admin.from("launch_waitlist")
      .update({ welcomed_at: new Date().toISOString(), last_issue: "welcome" })
      .eq("id", row.id);
    return json({ success: true, id: r.id, to: row.email });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
