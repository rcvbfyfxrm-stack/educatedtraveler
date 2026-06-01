// Edge Function: notify-instructor-enrollment
// Emails the instructor when a student pays (deposit or full) for their cohort
// and asks them to CONFIRM the booking. The email carries a one-click
// "Confirm this booking" link (and a Decline link) backed by confirm-enrollment
// — the student is only shown as enrolled once the instructor confirms.
//
// Body: { enrollment_id: string }
// Auth: service-role only (called by paypal-capture-order).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function escapeHtml(s: string) {
  return (s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function fmtMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
    minimumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(`${d}${d.length === 10 ? "T00:00:00Z" : ""}`).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { enrollment_id } = await req.json();
    if (!enrollment_id) {
      return new Response(JSON.stringify({ error: "enrollment_id required" }), { status: 400 });
    }

    const { data: enrollment, error: enrErr } = await admin
      .from("enrollments")
      .select(`
        id, amount_paid_cents, currency, paid_at, confirm_token,
        payment_status, payment_plan, price_total_cents, balance_cents, balance_due_date,
        student_notes, addons,
        cohorts (
          id, title, location, start_date, end_date, capacity,
          instructors ( id, name, email )
        ),
        profiles ( email, name, first_name, phone )
      `)
      .eq("id", enrollment_id)
      .single();

    if (enrErr || !enrollment) {
      console.error("Enrollment lookup failed", enrErr);
      return new Response(JSON.stringify({ error: "Enrollment not found" }), { status: 404 });
    }

    const cohort = enrollment.cohorts as unknown as Record<string, unknown> & {
      instructors?: { id?: string; name?: string; email?: string };
    };
    const profile = enrollment.profiles as unknown as Record<string, string | null>;

    const instructorEmail = cohort?.instructors?.email;
    const instructorName = cohort?.instructors?.name ?? "instructor";
    if (!instructorEmail) {
      console.error("No instructor email on cohort", cohort?.id);
      return new Response(JSON.stringify({ error: "No instructor email" }), { status: 400 });
    }

    const studentName = profile.first_name || profile.name || profile.email?.split("@")[0] || "A new student";
    const studentEmail = profile.email ?? "";
    const studentPhone = profile.phone ?? "";
    const cohortTitle = (cohort?.title as string) ?? "your cohort";
    const cohortLocation = (cohort?.location as string) ?? "";
    const startDate = fmtDate(cohort?.start_date as string | null);
    const endDate = fmtDate(cohort?.end_date as string | null);
    const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || endDate;

    const isDeposit = enrollment.payment_status === "deposit_paid" && (enrollment.balance_cents ?? 0) > 0;
    const paidStr = fmtMoney(enrollment.amount_paid_cents ?? 0, (enrollment.currency as string) ?? "usd");
    const totalStr = fmtMoney(enrollment.price_total_cents ?? enrollment.amount_paid_cents ?? 0, (enrollment.currency as string) ?? "usd");
    const balanceStr = fmtMoney(enrollment.balance_cents ?? 0, (enrollment.currency as string) ?? "usd");
    const balanceDue = fmtDate(enrollment.balance_due_date as string | null);

    // Confirmed-seat count (this booking is still awaiting, so not counted yet).
    const { count: enrolledCount } = await admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", cohort.id)
      .eq("status", "enrolled");

    const capacity = (cohort?.capacity as number) ?? 0;
    const remaining = Math.max(0, capacity - (enrolledCount ?? 0));
    const firstName = (instructorName || "").split(" ")[0] || "there";

    const confirmUrl = `${FUNCTIONS_URL}/confirm-enrollment?token=${encodeURIComponent(enrollment.confirm_token as string)}`;
    const declineUrl = `${confirmUrl}&action=decline`;

    const addons = Array.isArray(enrollment.addons) ? (enrollment.addons as string[]) : [];
    const notes = (enrollment.student_notes as string | null) ?? "";

    const paymentRow = isDeposit
      ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Deposit paid</td><td style="color:#10b981;font-size:13px;padding:4px 0;text-align:right;font-weight:500;">${escapeHtml(paidStr)} <span style="color:rgba(255,255,255,0.4);">of ${escapeHtml(totalStr)}</span></td></tr>
         <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Balance due</td><td style="color:#fbbf24;font-size:13px;padding:4px 0;text-align:right;">${escapeHtml(balanceStr)}${balanceDue ? ` by ${escapeHtml(balanceDue)}` : ""}</td></tr>`
      : `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Paid in full</td><td style="color:#10b981;font-size:13px;padding:4px 0;text-align:right;font-weight:500;">${escapeHtml(paidStr)}</td></tr>`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#fff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;color:rgba(255,255,255,0.85);">

      <p style="color:#fbbf24;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px 0;font-family:'Courier New',monospace;">Booking — needs your confirmation</p>

      <h2 style="color:#fff;font-size:20px;font-weight:400;margin:0 0 6px 0;">${escapeHtml(studentName)} wants to join</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 24px 0;">${escapeHtml(cohortTitle)}</p>

      <p style="font-size:15px;line-height:1.7;margin:0 0 16px 0;">Hey ${escapeHtml(firstName)},</p>

      <p style="font-size:15px;line-height:1.7;margin:0 0 20px 0;">${escapeHtml(studentName)} just ${isDeposit ? "paid their deposit" : "paid in full"} for <strong>${escapeHtml(cohortTitle)}</strong>. Confirm to lock their seat — they'll only show as enrolled once you do.</p>

      <!-- Confirm / Decline -->
      <div style="text-align:center;margin:8px 0 22px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:14px;font-weight:600;">Confirm this booking</a>
        <p style="margin:12px 0 0 0;"><a href="${declineUrl}" style="color:rgba(255,255,255,0.4);font-size:12px;text-decoration:underline;">Can't take this student — decline</a></p>
      </div>

      <!-- Student card -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:18px;margin:16px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;font-family:'Courier New',monospace;">Student</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Name</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;">${escapeHtml(studentName)}</td></tr>
          <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Email</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;"><a href="mailto:${escapeHtml(studentEmail)}" style="color:#3B8DD4;text-decoration:none;">${escapeHtml(studentEmail)}</a></td></tr>
          ${studentPhone ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Phone</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;">${escapeHtml(studentPhone)}</td></tr>` : ""}
          ${paymentRow}
        </table>
      </div>

      <!-- Cohort card -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:18px;margin:16px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;font-family:'Courier New',monospace;">Cohort</p>
        <table style="width:100%;border-collapse:collapse;">
          ${dateRange ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Dates</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;">${escapeHtml(dateRange)}</td></tr>` : ""}
          ${cohortLocation ? `<tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Location</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;">${escapeHtml(cohortLocation)}</td></tr>` : ""}
          <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Confirmed seats</td><td style="color:#fff;font-size:13px;padding:4px 0;text-align:right;">${enrolledCount ?? 0} of ${capacity} ${remaining === 0 ? "<span style=\"color:#fbbf24;\">— FULL</span>" : `<span style=\"color:rgba(255,255,255,0.4);\">(${remaining} left)</span>`}</td></tr>
        </table>
      </div>

      ${notes ? `<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin:16px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;font-family:'Courier New',monospace;">Notes from the student</p>
        <p style="color:#fff;font-size:13px;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(notes)}</p>
      </div>` : ""}

      ${addons.length ? `<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:16px;margin:16px 0;">
        <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;font-family:'Courier New',monospace;">Add-ons of interest</p>
        <ul style="margin:0;padding-left:18px;">${addons.map((a) => `<li style="color:rgba(255,255,255,0.8);font-size:13px;line-height:1.6;">${escapeHtml(a)}</li>`).join("")}</ul>
      </div>` : ""}

      <p style="font-size:13px;line-height:1.7;margin:20px 0 4px 0;color:rgba(255,255,255,0.6);">Prefer to manage it in one place? You can also confirm from your <a href="${APP_URL}/instructor-dashboard" style="color:#3B8DD4;text-decoration:none;">dashboard</a>.</p>

    </div>

    <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin-top:24px;">EducatedTraveler · Payment received via PayPal.<br>Reply to this email to reach ${escapeHtml(studentName)}.</p>
  </div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EducatedTraveler <founder@educatedtraveler.app>",
        to: [instructorEmail],
        reply_to: studentEmail || "founder@educatedtraveler.app",
        subject: `Confirm ${studentName}'s booking — ${cohortTitle}`,
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
    console.error("notify-instructor-enrollment error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500 },
    );
  }
});
