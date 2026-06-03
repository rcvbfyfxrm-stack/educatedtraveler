// Edge Function: confirm-enrollment
// The instructor confirms (or declines) a student's booking. Two modes:
//
//   • Token mode  — GET  ?token=<confirm_token>[&action=decline]
//       One-click link from the instructor email. No login. Returns a
//       branded HTML page. Idempotent.
//   • Auth mode   — POST { enrollment_id, action: 'confirm'|'decline' }
//       Called from the instructor dashboard with the instructor's Bearer
//       JWT; verifies the caller owns the cohort. Returns JSON.
//
// A 'confirm' flips the enrollment from 'awaiting_confirmation' to 'enrolled'
// (the student is now shown enrolled) and emails them. A 'decline' flips it to
// 'declined' (any refund of the deposit is handled manually).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ENROLLMENT_SELECT = `
  id, status, confirm_token, payment_status, payment_plan,
  balance_cents, balance_due_date, amount_paid_cents, currency, cohort_id,
  cohorts ( id, title, location, start_date, end_date, capacity, status, instructor_id,
            instructors ( id, name, email, user_id ) ),
  profiles ( email, name, first_name )
`;

function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Branded dark-theme page for the one-click email link.
function htmlPage(opts: { eyebrow: string; heading: string; body: string; tone: "ok" | "error" | "neutral" }): Response {
  const accent = opts.tone === "ok" ? "#10b981" : opts.tone === "error" ? "#f87171" : "#3B8DD4";
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(opts.heading)} — EducatedTraveler</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.card{max-width:440px;width:100%;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:40px 28px;}
.cta{display:inline-block;margin-top:24px;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:13px;font-weight:500;}</style></head>
<body><div class="card">
  <div style="margin-bottom:24px;"><span style="font-size:13px;font-weight:600;letter-spacing:3px;">EDUCATED</span><span style="font-size:13px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span></div>
  <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:${accent};margin:0 0 10px 0;">${esc(opts.eyebrow)}</p>
  <h1 style="font-size:24px;font-weight:300;margin:0 0 12px 0;">${esc(opts.heading)}</h1>
  <p style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.65);margin:0;">${opts.body}</p>
  <a class="cta" href="${APP_URL}/instructor-dashboard">Open your dashboard</a>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// Read-only interstitial shown when the instructor opens the email link (GET).
// It does NOT change any state — the Confirm/Decline buttons POST the decision,
// so email scanners / link-prefetchers that issue bare GETs can't auto-act.
function htmlInterstitial(enr: Record<string, any>): Response {
  const cohort = enr.cohorts ?? {};
  const profile = enr.profiles ?? {};
  const student = esc(profile.first_name || profile.name || profile.email || "the student");
  const title = esc(cohort.title || "your cohort");
  const isDeposit = enr.payment_status === "deposit_paid" && (enr.balance_cents ?? 0) > 0;
  const paid = isDeposit
    ? `Deposit ${fmtMoney(enr.amount_paid_cents, enr.currency)} paid · balance ${fmtMoney(enr.balance_cents, enr.currency)}${enr.balance_due_date ? " due " + fmtDate(enr.balance_due_date) : ""}`
    : `Paid in full ${fmtMoney(enr.amount_paid_cents, enr.currency)}`;

  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirm booking — EducatedTraveler</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif;background:#0a0a0a;color:#fff;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.card{max-width:460px;width:100%;text-align:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:40px 28px;}
.btn{display:inline-block;border:none;cursor:pointer;color:#fff;text-decoration:none;padding:14px 28px;border-radius:50px;font-size:14px;font-weight:600;font-family:inherit;}
.confirm{background:linear-gradient(135deg,#059669 0%,#10b981 100%);}
.decline{background:transparent;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);font-weight:500;}</style></head>
<body><div class="card">
  <div style="margin-bottom:20px;"><span style="font-size:13px;font-weight:600;letter-spacing:3px;">EDUCATED</span><span style="font-size:13px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span></div>
  <p id="eyebrow" style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#fbbf24;margin:0 0 10px 0;">Confirm booking</p>
  <h1 style="font-size:22px;font-weight:300;margin:0 0 6px 0;">${student} wants to join</h1>
  <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0 0 6px 0;">${title}</p>
  <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 24px 0;">${esc(paid)}</p>
  <p id="msg" style="font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 20px 0;min-height:20px;"></p>
  <div id="btns" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
    <button class="btn confirm" onclick="act('confirm')">Confirm this booking</button>
    <button class="btn decline" onclick="act('decline')">Decline</button>
  </div>
  <script>
    function act(action){
      var btns=document.getElementById('btns'); btns.style.display='none';
      var msg=document.getElementById('msg'); msg.textContent = action==='confirm'?'Confirming…':'Declining…';
      fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action})})
        .then(function(r){return r.json();})
        .then(function(d){
          if(d&&d.ok){
            document.getElementById('eyebrow').textContent = d.status==='enrolled'?'Confirmed':'Declined';
            document.getElementById('eyebrow').style.color = d.status==='enrolled'?'#10b981':'rgba(255,255,255,0.5)';
            msg.textContent = d.status==='enrolled' ? "Seat confirmed — the student is now enrolled and we've emailed them." : "Declined. The student has been notified.";
          } else {
            btns.style.display=''; msg.textContent=(d&&d.error)||'Something went wrong — try again.';
          }
        })
        .catch(function(){ btns.style.display=''; msg.textContent='Network error — try again.'; });
    }
  </script>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function sendStudentConfirmedEmail(enr: Record<string, any>) {
  const cohort = enr.cohorts ?? {};
  const profile = enr.profiles ?? {};
  const studentEmail = profile.email;
  if (!studentEmail) return;

  const firstName = profile.first_name || profile.name || studentEmail.split("@")[0];
  const title = cohort.title ?? "your cohort";
  const dates = [fmtDate(cohort.start_date), fmtDate(cohort.end_date)].filter(Boolean).join(" – ");
  const isDeposit = enr.payment_status === "deposit_paid" && (enr.balance_cents ?? 0) > 0;
  const balanceLine = isDeposit
    ? `<p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 16px 0;">Your deposit is in and your seat is locked. The remaining balance of <strong>${fmtMoney(enr.balance_cents, enr.currency)}</strong> is due by <strong>${fmtDate(enr.balance_due_date)}</strong> — we'll email you a payment link closer to the date.</p>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:36px;"><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#fff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span></div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;color:rgba(255,255,255,0.85);">
      <p style="color:#10b981;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px 0;font-family:'Courier New',monospace;">Seat confirmed</p>
      <h2 style="color:#fff;font-size:20px;font-weight:400;margin:0 0 6px 0;">You're in, ${esc(firstName)}.</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 24px 0;">${esc(title)}${dates ? " · " + esc(dates) : ""}</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 16px 0;">${esc(cohort.instructors?.name || "Your instructor")} just confirmed your spot. You're officially enrolled.</p>
      ${balanceLine}
      <div style="text-align:center;margin:24px 0 4px 0;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:13px;font-weight:500;">View your cohort</a>
      </div>
    </div>
    <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin-top:24px;">EducatedTraveler · Skills last, tans fade</p>
  </div>
</body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Arnaud <founder@educatedtraveler.app>",
        to: [studentEmail],
        reply_to: cohort.instructors?.email || "founder@educatedtraveler.app",
        subject: `You're confirmed — ${title}`,
        html,
      }),
    });
  } catch (e) {
    console.error("confirm-enrollment: student email failed", e);
  }
}

// Keep cohort.status in sync with confirmed seats, toggling ONLY between
// 'published' and 'full' (never touching draft/pending_review/completed).
async function recalcCohortFullness(cohortId: string | undefined, capacity: number | undefined) {
  if (!cohortId || !capacity) return;
  const { count } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("cohort_id", cohortId)
    .eq("status", "enrolled");
  const enrolled = count ?? 0;
  const { data: c } = await admin.from("cohorts").select("status").eq("id", cohortId).maybeSingle();
  const status = (c as any)?.status;
  if (enrolled >= capacity && status === "published") {
    await admin.from("cohorts").update({ status: "full" }).eq("id", cohortId);
  } else if (enrolled < capacity && status === "full") {
    await admin.from("cohorts").update({ status: "published" }).eq("id", cohortId);
  }
}

// Apply confirm/decline. Returns a short status string.
async function applyTransition(
  enr: Record<string, any>,
  action: "confirm" | "decline",
  confirmedBy: string | null,
): Promise<"confirmed" | "declined"> {
  const cohort = enr.cohorts ?? {};
  if (action === "decline") {
    await admin.from("enrollments")
      .update({ status: "declined", declined_at: new Date().toISOString() })
      .eq("id", enr.id);
    await recalcCohortFullness(cohort.id, cohort.capacity);
    return "declined";
  }

  await admin.from("enrollments")
    .update({ status: "enrolled", confirmed_at: new Date().toISOString(), confirmed_by: confirmedBy })
    .eq("id", enr.id);

  await recalcCohortFullness(cohort.id, cohort.capacity);
  await sendStudentConfirmedEmail(enr);
  return "confirmed";
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    const url = new URL(req.url);
    const tokenQ = url.searchParams.get("token");
    const actionQ = url.searchParams.get("action") === "decline" ? "decline" : "confirm";

    // ---- Token mode (one-click email link) → read-only HTML interstitial ----
    // GET never mutates state (defends against email scanners / prefetchers);
    // the page's buttons POST the actual decision.
    if (req.method === "GET") {
      if (!tokenQ) {
        return htmlPage({ eyebrow: "Link error", heading: "Missing token", body: "This confirmation link is incomplete.", tone: "error" });
      }
      const { data: enr } = await admin.from("enrollments").select(ENROLLMENT_SELECT).eq("confirm_token", tokenQ).maybeSingle();
      if (!enr) {
        return htmlPage({ eyebrow: "Link error", heading: "Invalid link", body: "We couldn't find that booking. It may have been removed.", tone: "error" });
      }
      const title = (enr.cohorts as any)?.title || "your cohort";

      if (enr.status === "enrolled") {
        return htmlPage({ eyebrow: "Already done", heading: "Already confirmed", body: `This booking for <strong>${esc(title)}</strong> is already confirmed.`, tone: "neutral" });
      }
      if (enr.status === "declined") {
        return htmlPage({ eyebrow: "Already done", heading: "Already declined", body: `This booking for <strong>${esc(title)}</strong> was already declined.`, tone: "neutral" });
      }
      if (enr.status !== "awaiting_confirmation") {
        return htmlPage({ eyebrow: "Not actionable", heading: "Nothing to confirm", body: "This booking isn't awaiting confirmation (it may be unpaid or cancelled).", tone: "error" });
      }

      return htmlInterstitial(enr);
    }

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const action = (body.action ?? actionQ) === "decline" ? "decline" : "confirm";
    const token = (tokenQ || (body.token as string)) ?? null;

    // ---- Token mode via POST → JSON ----
    if (token) {
      const { data: enr } = await admin.from("enrollments").select(ENROLLMENT_SELECT).eq("confirm_token", token).maybeSingle();
      if (!enr) return json({ error: "Invalid token" }, 404);
      if (enr.status === "enrolled") return json({ ok: true, status: "enrolled", dedup: true });
      if (enr.status === "declined") return json({ ok: true, status: "declined", dedup: true });
      if (enr.status !== "awaiting_confirmation") return json({ error: "Not awaiting confirmation" }, 409);
      const result = await applyTransition(enr, action, null);
      return json({ ok: true, status: result === "confirmed" ? "enrolled" : "declined" });
    }

    // ---- Auth mode (dashboard) → JSON ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing auth" }, 401);

    const enrollmentId = body.enrollment_id as string;
    if (!enrollmentId) return json({ error: "enrollment_id required" }, 400);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    const { data: enr } = await admin.from("enrollments").select(ENROLLMENT_SELECT).eq("id", enrollmentId).maybeSingle();
    if (!enr) return json({ error: "Enrollment not found" }, 404);

    // Caller must be the instructor who owns this cohort (or an admin).
    const ownerUserId = (enr.cohorts as any)?.instructors?.user_id;
    let allowed = ownerUserId && ownerUserId === userData.user.id;
    if (!allowed) {
      const { data: prof } = await admin.from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle();
      allowed = !!prof?.is_admin;
    }
    if (!allowed) return json({ error: "Not your cohort" }, 403);

    if (enr.status === "enrolled") return json({ ok: true, status: "enrolled", dedup: true });
    if (enr.status === "declined") return json({ ok: true, status: "declined", dedup: true });
    if (enr.status !== "awaiting_confirmation") return json({ error: "Not awaiting confirmation" }, 409);

    const result = await applyTransition(enr, action, userData.user.id);
    return json({ ok: true, status: result === "confirmed" ? "enrolled" : "declined" });
  } catch (err) {
    console.error("confirm-enrollment error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
