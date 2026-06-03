// Supabase Edge Function: Send Balance Reminders
// Run daily via cron. Finds installment enrollments whose balance is coming
// due (>= 1 month before the class start) and emails the student a one-click
// "pay your balance" link. Sends once per enrollment (balance_reminder_sent_at).
//
// Mirrors send-followup-emails: date-math query + tracking column + no DB-side
// execution. Schedule in the Supabase Dashboard at e.g. `0 10 * * *`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
// How many days before the balance_due_date to start nudging.
const LEAD_DAYS = Number(Deno.env.get("BALANCE_REMINDER_LEAD_DAYS") ?? "7");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function fmtMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: (currency || "usd").toUpperCase(), minimumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:40px;"><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#fff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span></div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:#fbbf24;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">${title}</p>
      ${body}
    </div>
    <div style="margin-top:32px;padding:0 4px;"><p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p></div>
  </div>
</body></html>`;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Arnaud <founder@educatedtraveler.app>",
      to: [to],
      reply_to: "founder@educatedtraveler.app",
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text().catch(() => ""));
    return false;
  }
  return true;
}

serve(async (_req) => {
  try {
    // Window: remind from LEAD_DAYS before the due date through up to 45 days
    // after it, so a balance that slipped past due (or whose earlier sends
    // failed) still gets exactly one nudge — the `balance_reminder_sent_at IS
    // NULL` guard prevents repeats. due_date in [today-45, today+LEAD_DAYS].
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const horizon = new Date(today);
    horizon.setUTCDate(horizon.getUTCDate() + LEAD_DAYS);
    const horizonStr = horizon.toISOString().slice(0, 10);
    const grace = new Date(today);
    grace.setUTCDate(grace.getUTCDate() - 45);
    const graceStr = grace.toISOString().slice(0, 10);

    const { data: due, error } = await supabase
      .from("enrollments")
      .select(`
        id, balance_cents, balance_due_date, currency,
        cohorts ( title, start_date ),
        profiles ( email, first_name, name )
      `)
      .eq("payment_status", "deposit_paid")
      .in("status", ["enrolled", "awaiting_confirmation"])
      .gt("balance_cents", 0)
      .is("balance_reminder_sent_at", null)
      .gte("balance_due_date", graceStr)
      .lte("balance_due_date", horizonStr);

    if (error) {
      console.error("Balance reminder query failed:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sent = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const enr of due ?? []) {
      const profile = (enr.profiles ?? {}) as unknown as Record<string, string | null>;
      const cohort = (enr.cohorts ?? {}) as unknown as Record<string, string | null>;
      const email = profile.email;
      if (!email) continue;

      const firstName = profile.first_name || profile.name || email.split("@")[0];
      const title = cohort.title ?? "your cohort";
      const balanceStr = fmtMoney(enr.balance_cents as number, (enr.currency as string) ?? "usd");
      const dueStr = fmtDate(enr.balance_due_date as string | null);
      const payUrl = `${APP_URL}/paypal-checkout.html?enrollment=${enr.id}&balance=1`;

      const html = emailShell("Balance due soon", `
        <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hey ${esc(firstName)},</p>
        <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">Your spot in <strong>${esc(title)}</strong> is reserved. The remaining balance of <strong>${esc(balanceStr)}</strong> is due by <strong>${esc(dueStr)}</strong>.</p>
        <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px 0;">Settle it now in a couple of clicks — same PayPal checkout as your deposit.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${payUrl}" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;">Pay your balance</a>
        </div>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;line-height:1.6;margin:0;">Questions? Just reply to this email.</p>
      `);

      const ok = await sendEmail(email, `Balance due for ${title} — ${balanceStr}`, html);
      if (ok) {
        await supabase
          .from("enrollments")
          .update({ balance_reminder_sent_at: new Date().toISOString() })
          .eq("id", enr.id);
        sent++;
      }
      results.push({ enrollment_id: enr.id, email, ok });
    }

    return new Response(
      JSON.stringify({ ok: true, ran_at: todayStr, window: [graceStr, horizonStr], candidates: due?.length ?? 0, sent, results }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-balance-reminders error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500 },
    );
  }
});
