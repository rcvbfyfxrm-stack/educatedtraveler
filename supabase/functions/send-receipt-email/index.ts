// Edge Function: send-receipt-email
// Sends a payment receipt + cohort prep info to the student after successful
// Stripe checkout. Triggered by stripe-webhook with the service-role key.
//
// Body: { enrollment_id: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function fmtMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const reqBody = await req.json();
    const enrollment_id = reqBody.enrollment_id;
    const kind = reqBody.kind === "balance" ? "balance" : "initial";
    if (!enrollment_id) {
      return new Response(JSON.stringify({ error: "enrollment_id required" }), { status: 400 });
    }

    const { data: enrollment, error: enrErr } = await admin
      .from("enrollments")
      .select(`
        id, amount_paid_cents, currency, paid_at, stripe_payment_intent_id, paypal_capture_id,
        payment_status, payment_plan, price_total_cents, balance_cents, balance_due_date,
        cohorts (
          id, title, description, location, start_date, end_date,
          instructors ( name, email )
        ),
        profiles ( email, name, first_name )
      `)
      .eq("id", enrollment_id)
      .single();

    if (enrErr || !enrollment) {
      console.error("Enrollment lookup failed", enrErr);
      return new Response(JSON.stringify({ error: "Enrollment not found" }), { status: 404 });
    }

    const cohort = enrollment.cohorts as unknown as Record<string, unknown> & {
      instructors?: { name?: string; email?: string };
    };
    const profile = enrollment.profiles as unknown as Record<string, string | null>;

    const studentEmail = profile.email!;
    const firstName = profile.first_name || profile.name || studentEmail.split("@")[0];
    const cohortTitle = (cohort?.title as string) ?? "Your cohort";
    const cohortLocation = (cohort?.location as string) ?? "";
    const startDate = fmtDate(cohort?.start_date as string | null);
    const endDate = fmtDate(cohort?.end_date as string | null);
    const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || endDate;
    const instructorName = cohort?.instructors?.name ?? "your instructor";

    const currency = (enrollment.currency as string) ?? "usd";
    const amountStr = fmtMoney(enrollment.amount_paid_cents ?? 0, currency);
    const totalStr = fmtMoney(
      (enrollment.price_total_cents as number | null) ?? enrollment.amount_paid_cents ?? 0,
      currency,
    );
    const balanceStr = fmtMoney((enrollment.balance_cents as number | null) ?? 0, currency);
    const balanceDue = fmtDate(enrollment.balance_due_date as string | null);
    const paidDate = fmtDate(enrollment.paid_at as string | null);
    const receiptId =
      (enrollment.paypal_capture_id as string | null) ??
      (enrollment.stripe_payment_intent_id as string | null) ??
      enrollment.id;

    // Tailor copy to deposit / full / balance.
    const isBalance = kind === "balance";
    const isDeposit = !isBalance &&
      enrollment.payment_status === "deposit_paid" &&
      ((enrollment.balance_cents as number | null) ?? 0) > 0;

    const eyebrow = isBalance ? "Payment Complete" : isDeposit ? "Deposit Received" : "Payment Received";
    const subjectLine = isBalance
      ? `Balance received — ${cohortTitle}`
      : isDeposit
      ? `Deposit received — ${cohortTitle}`
      : `Payment received — ${cohortTitle}`;

    const leadParagraph = isBalance
      ? `Your balance is in — you're all paid up for ${cohortTitle}. See you there.`
      : isDeposit
      ? `Your deposit of ${amountStr} is in and your seat in ${cohortTitle} is reserved. The remaining balance of <strong>${balanceStr}</strong> is due by <strong>${balanceDue || "one month before the start"}</strong> — we'll email you a payment link closer to the date.`
      : `Payment received in full for ${cohortTitle}.`;

    const confirmParagraph = isBalance
      ? `${instructorName} will be in touch with final prep details.`
      : `${instructorName} will confirm your seat shortly — you'll get an email the moment they do. After that, watch your inbox for the welcome packet.`;

    const amountLabel = isBalance ? "Balance paid" : isDeposit ? "Deposit paid" : "Amount";
    const receiptExtraRow = isDeposit
      ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Balance due</td><td style="color:#fbbf24;font-size:13px;padding:4px 0;text-align:right;">${balanceStr}${balanceDue ? ` by ${balanceDue}` : ""}</td></tr>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#ffffff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">

      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">${eyebrow}</p>

      <p style="color:#ffffff;font-size:18px;line-height:1.6;margin:0 0 8px 0;font-weight:500;">${cohortTitle}</p>
      ${dateRange ? `<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 4px 0;">${dateRange}</p>` : ""}
      ${cohortLocation ? `<p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 24px 0;">${cohortLocation}</p>` : ""}

      <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:24px 0 16px 0;">Hey ${firstName},</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">${leadParagraph}</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px 0;">${confirmParagraph}</p>

      <!-- Receipt block -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:20px;margin:24px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;font-family:'Courier New',monospace;">Receipt</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">${amountLabel}</td><td style="color:#ffffff;font-size:13px;padding:4px 0;text-align:right;">${amountStr}</td></tr>
          ${receiptExtraRow}
          ${paidDate ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Paid on</td><td style="color:#ffffff;font-size:13px;padding:4px 0;text-align:right;">${paidDate}</td></tr>` : ""}
          <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Reference</td><td style="color:rgba(255,255,255,0.7);font-size:11px;padding:4px 0;text-align:right;font-family:'Courier New',monospace;">${receiptId}</td></tr>
        </table>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px 0;font-weight:500;">Before we begin</p>
      <ul style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 28px 0;padding-left:20px;">
        <li>Watch your inbox — your instructor confirms your seat, then the welcome packet follows.</li>
        <li>Book your travel only after the packet confirms exact start time and meeting point.</li>
        <li>Reply to this email if you have dietary, mobility, or visa questions.</li>
      </ul>

      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">View Your Cohort</a>
      </div>

    </div>

    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>

    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;">
        <a href="${APP_URL}" style="color:rgba(59,141,212,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a>
      </p>
    </div>

  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arnaud <founder@educatedtraveler.app>",
        to: [studentEmail],
        reply_to: "founder@educatedtraveler.app",
        subject: subjectLine,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-receipt-email error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500 },
    );
  }
});
