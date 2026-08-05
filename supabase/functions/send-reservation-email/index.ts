// Edge Function: send-reservation-email
//
// Fired by the PayPal success page after the visitor is redirected back.
// Sends a reservation notice to the platform address. No DB writes — this is a
// static-site notification path.
//
// Recovered from the deployed bundle on 2026-08-05: this function ran in
// production for months with no copy in the repo, so nothing reviewed it and no
// check covered it. Three things were wrong.
//
//  1. Legibility. It used background:#0a0a0a on <body> with near-white text.
//     Gmail drops <body> styling, so it arrived as pale text on white — and the
//     student was BCC'd, meaning a paying customer got a blank-looking receipt.
//
//  2. It was an open email relay. verify_jwt is off and CORS is *, and the cc /
//     bcc / reply_to addresses were taken straight from the request body. Anyone
//     could POST and make founder@educatedtraveler.app deliver attacker-written
//     text to two addresses of their choosing — spam and phishing riding our
//     verified, DKIM-signed domain, which would take every other ET email's
//     deliverability down with it. The old comment judged the worst case to be
//     "a spammer flooding arnaudcallier@pm.me"; the real worst case was mail to
//     third parties, from us. Recipients are now fixed to PLATFORM_EMAIL. Any
//     address in the payload is rendered as CONTENT, never used for delivery.
//
//  3. It stated payment as fact. Subject was "[RESERVATION — PAID]" and the body
//     asserted an amount, all from unverified client JSON — a caller could send
//     any figure. The verified path is paypal-capture-order. This email now says
//     plainly that the numbers are client-reported and must be checked.
//
// Body (all optional except experience + studentEmail; all treated as untrusted):
// {
//   experience, cohort, amount, studentName, studentEmail, studentPhone,
//   notes, addons: string[], instructorName, instructorEmail,
//   paypalBusiness, paypalTxnId
// }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const PLATFORM_EMAIL = Deno.env.get("PLATFORM_EMAIL") ?? "arnaudcallier@pm.me";
// Match the verified Resend sender used by the other functions.
const FROM = Deno.env.get("EMAIL_FROM") ?? "EducatedTraveler <founder@educatedtraveler.app>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// Anyone can post here, so bound every field before it reaches the message.
function field(v: unknown, max = 200): string {
  return String(v ?? "").slice(0, max);
}

const json = (b: unknown, status: number) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const r = {
    experience: field(body.experience),
    cohort: field(body.cohort),
    amount: field(body.amount, 32),
    studentName: field(body.studentName, 120),
    studentEmail: field(body.studentEmail, 160),
    studentPhone: field(body.studentPhone, 40),
    notes: field(body.notes, 2000),
    addons: (Array.isArray(body.addons) ? body.addons : []).slice(0, 20).map((a) => field(a, 120)),
    instructorName: field(body.instructorName, 120),
    instructorEmail: field(body.instructorEmail, 160),
    paypalBusiness: field(body.paypalBusiness, 160),
    paypalTxnId: field(body.paypalTxnId, 120),
  };

  if (!r.studentEmail || !r.experience) {
    return json({ error: "Missing studentEmail or experience" }, 400);
  }

  // Says what it is: reported by the browser, not confirmed by PayPal.
  const subject = `[RESERVATION — UNVERIFIED] ${r.experience} — ${r.studentName || r.studentEmail}`;

  const LBL = "color:#6b625a;font-size:13px;padding:3px 0;";
  const VAL = "color:#2b2621;font-size:13px;padding:3px 0;text-align:right;";
  const CARD = "background:#ffffff;border:1px solid #e6ded1;border-radius:10px;padding:16px;margin:14px 0;";
  const CAP = "color:#6b625a;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px 0;font-family:'Courier New',monospace;";

  const addonsList = r.addons.length
    ? `<ul style="margin:6px 0 0 0;padding-left:18px;">${
      r.addons.map((a) => `<li style="color:#3d3630;font-size:13px;line-height:1.6;">${esc(a)}</li>`).join("")
    }</ul>`
    : `<span style="color:#6b625a;font-size:13px;">— none —</span>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:36px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#2b2621;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#1f6ba8;">TRAVELER</span>
    </div>

    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:32px 28px;color:#2b2621;">

      <p style="color:#8a5a00;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;font-family:'Courier New',monospace;">Reservation — reported, not verified</p>

      <h2 style="color:#2b2621;font-size:20px;font-weight:400;margin:0 0 6px 0;">${esc(r.studentName || r.studentEmail)} reached the success page</h2>
      <p style="color:#4a423b;font-size:14px;margin:0 0 22px 0;">${esc(r.experience)}${r.cohort ? " · " + esc(r.cohort) : ""}</p>

      <div style="background:#fbf4ec;border-left:2px solid #b06f33;border-radius:0 10px 10px 0;padding:14px 16px;margin:0 0 18px 0;">
        <p style="color:#3d3630;font-size:13px;line-height:1.6;margin:0;">Every figure below was sent by the visitor's browser and <strong>has not been checked against PayPal</strong>. Confirm the payment in your PayPal inbox before you treat this seat as taken.</p>
      </div>

      <div style="${CARD}">
        <p style="${CAP}">Student (as entered)</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="${LBL}">Name</td><td style="${VAL}">${esc(r.studentName)}</td></tr>
          <tr><td style="${LBL}">Email</td><td style="${VAL}"><a href="mailto:${esc(r.studentEmail)}" style="color:#1f6ba8;text-decoration:none;">${esc(r.studentEmail)}</a></td></tr>
          ${r.studentPhone ? `<tr><td style="${LBL}">Phone</td><td style="${VAL}">${esc(r.studentPhone)}</td></tr>` : ""}
        </table>
      </div>

      <div style="${CARD}">
        <p style="${CAP}">Payment (reported)</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="${LBL}">Amount (USD)</td><td style="${VAL}font-weight:500;">$${esc(r.amount)}</td></tr>
          <tr><td style="${LBL}">PayPal account</td><td style="${VAL}">${esc(r.paypalBusiness)}</td></tr>
          ${r.paypalTxnId ? `<tr><td style="${LBL}">Txn / Session</td><td style="${VAL}font-family:'Courier New',monospace;font-size:11px;">${esc(r.paypalTxnId)}</td></tr>` : ""}
        </table>
      </div>

      <div style="${CARD}">
        <p style="${CAP}">Add-ons of interest</p>
        ${addonsList}
      </div>

      ${r.notes ? `<div style="${CARD}">
        <p style="${CAP}">Notes from the student</p>
        <p style="color:#2b2621;font-size:13px;line-height:1.6;margin:0;white-space:pre-wrap;">${esc(r.notes)}</p>
      </div>` : ""}

      <div style="${CARD}">
        <p style="${CAP}">Instructor named in the payload</p>
        <p style="color:#3d3630;font-size:13px;line-height:1.6;margin:0;">${esc(r.instructorName || "—")}${r.instructorEmail ? ` &lt;${esc(r.instructorEmail)}&gt;` : ""}</p>
        <p style="color:#6b625a;font-size:12px;line-height:1.6;margin:8px 0 0 0;">Shown for reference only. This message went to you alone — forward it once you have confirmed the payment.</p>
      </div>
    </div>

    <p style="color:#7a726a;font-size:10px;text-align:center;margin:20px 0 0 0;">Sent automatically when a visitor reached the PayPal success page. Endpoint is public and unauthenticated, so treat the contents as a claim, not a record.</p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      // Recipients are FIXED. Nothing from the request body may receive mail, or
      // this becomes an open relay on a verified domain (see note 2 above).
      body: JSON.stringify({ from: FROM, to: [PLATFORM_EMAIL], subject, html }),
    });
    const out = await res.json();
    if (!res.ok) {
      console.error("Resend error", out);
      return json({ error: "Email send failed" }, 502);
    }
    return json({ ok: true, id: out.id }, 200);
  } catch (err) {
    console.error("send-reservation-email crashed", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
