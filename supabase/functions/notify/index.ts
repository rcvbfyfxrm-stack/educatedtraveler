// Edge Function: notify
// Single dispatcher for instructor↔ET notifications. Logs into instructor_messages
// AND emails the right party (or both, with a CC pattern when "everyone needs to know").
//
// Body shapes:
//   { kind: "change_request", topic, subject, body, cohort_id? }    // instructor → ET
//   { kind: "cohort_submitted", cohort_id, note? }                  // instructor → ET
//   { kind: "cohort_approved", cohort_id, note? }                   // ET → instructor
//   { kind: "cohort_changes_requested", cohort_id, note }           // ET → instructor
//
// Auth: Bearer JWT. Permissions enforced per-kind.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
const ET_EMAIL = Deno.env.get("ET_FOUNDER_EMAIL") ?? "founder@educatedtraveler.app";

const TOPIC_LABEL: Record<string, string> = {
  cohort_dates: "Cohort dates",
  cohort_price: "Cohort price",
  cohort_capacity: "Cohort capacity",
  cohort_description: "Cohort description",
  profile_bio: "Profile / bio",
  page_content: "Public page content",
  payments_payouts: "Payments & payouts",
  student_question: "Student question",
  other: "Other",
  cohort_submitted: "Cohort submitted for review",
  cohort_approved: "Cohort approved",
  cohort_changes_requested: "Changes requested",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return (s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function emailShell(opts: {
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#fff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;color:rgba(255,255,255,0.85);">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px 0;font-family:'Courier New',monospace;">${escapeHtml(opts.eyebrow)}</p>
      <h2 style="color:#fff;font-size:20px;font-weight:400;margin:0 0 16px 0;">${escapeHtml(opts.heading)}</h2>
      <div style="font-size:15px;line-height:1.7;margin:0 0 24px 0;">${opts.body}</div>
      ${opts.ctaLabel && opts.ctaUrl ? `
      <div style="text-align:center;margin:28px 0 0 0;">
        <a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:13px;font-weight:500;">${escapeHtml(opts.ctaLabel)}</a>
      </div>` : ""}
    </div>
    <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center;margin-top:24px;">EducatedTraveler · ${ET_EMAIL}</p>
  </div>
</body></html>`;
}

async function sendEmail(to: string | string[], subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "EducatedTraveler <founder@educatedtraveler.app>",
      to: Array.isArray(to) ? to : [to],
      reply_to: replyTo ?? ET_EMAIL,
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) console.error("Resend error:", data);
  return data;
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userData.user) return json({ error: "Invalid auth" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin, name, email")
      .eq("id", userId)
      .single();
    const isAdmin = !!profile?.is_admin;

    const { data: instructor } = await admin
      .from("instructors")
      .select("id, name, email")
      .eq("user_id", userId)
      .maybeSingle();

    const payload = await req.json();
    const kind = payload.kind as string;

    // ===========================================
    // Instructor → ET: free-form change request
    // ===========================================
    if (kind === "change_request") {
      if (!instructor) return json({ error: "Instructor profile required" }, 403);

      const { topic, subject, body, cohort_id } = payload;
      if (!topic || !body) return json({ error: "topic + body required" }, 400);

      const { data: msg, error: mErr } = await admin
        .from("instructor_messages")
        .insert({
          instructor_id: instructor.id,
          cohort_id: cohort_id || null,
          from_role: "instructor",
          topic,
          subject: subject || TOPIC_LABEL[topic] || topic,
          body,
        })
        .select()
        .single();
      if (mErr) throw mErr;

      let cohortLine = "";
      if (cohort_id) {
        const { data: c } = await admin
          .from("cohorts")
          .select("title")
          .eq("id", cohort_id)
          .maybeSingle();
        if (c) cohortLine = `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 12px 0;">Cohort: <strong>${escapeHtml(c.title)}</strong></p>`;
      }

      const topicLabel = TOPIC_LABEL[topic] || topic;
      const safeBody = escapeHtml(body).replace(/\n/g, "<br>");

      // Email to ET (admin)
      const adminHtml = emailShell({
        eyebrow: "Instructor change request",
        heading: `${instructor.name}: ${subject || topicLabel}`,
        body: `
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 4px 0;">From: <strong>${escapeHtml(instructor.name)}</strong> &lt;${escapeHtml(instructor.email)}&gt;</p>
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 12px 0;">Topic: <strong>${escapeHtml(topicLabel)}</strong></p>
          ${cohortLine}
          <div style="background:rgba(255,255,255,0.04);border-left:2px solid #3B8DD4;padding:14px 16px;border-radius:6px;color:#fff;font-size:14px;line-height:1.6;">${safeBody}</div>`,
        ctaLabel: "Open Admin",
        ctaUrl: `${APP_URL}/admin?tab=messages`,
      });
      await sendEmail(ET_EMAIL, `[Instructor] ${instructor.name}: ${subject || topicLabel}`, adminHtml, instructor.email);

      // Echo back to instructor (paper trail)
      const echoHtml = emailShell({
        eyebrow: "Message received",
        heading: "Thanks — Arnaud has been notified",
        body: `
          <p style="margin:0 0 12px 0;">Your note about <strong>${escapeHtml(topicLabel)}</strong> was logged. Arnaud will get back to you shortly.</p>
          ${cohortLine}
          <div style="background:rgba(255,255,255,0.04);border-left:2px solid rgba(255,255,255,0.2);padding:14px 16px;border-radius:6px;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;">${safeBody}</div>`,
        ctaLabel: "Open Dashboard",
        ctaUrl: `${APP_URL}/instructor-dashboard`,
      });
      await sendEmail(instructor.email, `Got it — we'll come back to you`, echoHtml);

      return json({ success: true, message_id: msg!.id });
    }

    // ===========================================
    // Instructor → ET: cohort submitted for review
    // ===========================================
    if (kind === "cohort_submitted") {
      if (!instructor) return json({ error: "Instructor profile required" }, 403);
      const { cohort_id, note } = payload;

      const { data: cohort } = await admin
        .from("cohorts")
        .select("id, title, location, start_date, end_date, price_cents, capacity, instructor_id")
        .eq("id", cohort_id)
        .single();
      if (!cohort || cohort.instructor_id !== instructor.id) {
        return json({ error: "Cohort not found" }, 404);
      }

      await admin
        .from("cohorts")
        .update({
          status: "pending_review",
          submitted_for_review_at: new Date().toISOString(),
        })
        .eq("id", cohort_id);

      await admin.from("instructor_messages").insert({
        instructor_id: instructor.id,
        cohort_id,
        from_role: "system",
        topic: "cohort_submitted",
        subject: `Submitted: ${cohort.title}`,
        body: note || `Cohort submitted for review.`,
      });

      const datesStr = cohort.start_date
        ? `${cohort.start_date}${cohort.end_date ? " → " + cohort.end_date : ""}`
        : "Dates TBD";
      const priceStr = cohort.price_cents ? `$${(cohort.price_cents / 100).toLocaleString()}` : "Price TBD";

      const adminHtml = emailShell({
        eyebrow: "Awaiting your approval",
        heading: `${instructor.name} submitted: ${cohort.title}`,
        body: `
          <p style="margin:0 0 8px 0;">A new cohort is waiting for review.</p>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Dates</td><td style="color:#fff;font-size:13px;text-align:right;padding:4px 0;">${escapeHtml(datesStr)}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Location</td><td style="color:#fff;font-size:13px;text-align:right;padding:4px 0;">${escapeHtml(cohort.location ?? "—")}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Price</td><td style="color:#fff;font-size:13px;text-align:right;padding:4px 0;">${escapeHtml(priceStr)}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.5);font-size:13px;padding:4px 0;">Capacity</td><td style="color:#fff;font-size:13px;text-align:right;padding:4px 0;">${cohort.capacity ?? "—"}</td></tr>
          </table>
          ${note ? `<div style="background:rgba(255,255,255,0.04);border-left:2px solid #3B8DD4;padding:14px 16px;border-radius:6px;color:#fff;font-size:14px;line-height:1.6;margin-top:12px;">${escapeHtml(note).replace(/\n/g, "<br>")}</div>` : ""}`,
        ctaLabel: "Review in Admin",
        ctaUrl: `${APP_URL}/admin?tab=cohorts`,
      });
      await sendEmail(ET_EMAIL, `[Review] ${instructor.name} — ${cohort.title}`, adminHtml, instructor.email);

      return json({ success: true });
    }

    // ===========================================
    // Admin → instructor: cohort approved / changes requested
    // ===========================================
    if (kind === "cohort_approved" || kind === "cohort_changes_requested") {
      if (!isAdmin) return json({ error: "Admin only" }, 403);
      const { cohort_id, note } = payload;

      const { data: cohort } = await admin
        .from("cohorts")
        .select("id, title, location, start_date, end_date, instructors(id, name, email)")
        .eq("id", cohort_id)
        .single();
      if (!cohort) return json({ error: "Cohort not found" }, 404);
      const inst = cohort.instructors as { id: string; name: string; email: string };

      const newStatus = kind === "cohort_approved" ? "published" : "draft";
      await admin
        .from("cohorts")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_notes: note || null,
        })
        .eq("id", cohort_id);

      await admin.from("instructor_messages").insert({
        instructor_id: inst.id,
        cohort_id,
        from_role: "admin",
        topic: kind,
        subject: kind === "cohort_approved" ? `Approved: ${cohort.title}` : `Changes requested: ${cohort.title}`,
        body: note || (kind === "cohort_approved" ? "Cohort approved and published." : "Please update and resubmit."),
      });

      if (kind === "cohort_approved") {
        const html = emailShell({
          eyebrow: "Your cohort is live",
          heading: `${cohort.title} is published`,
          body: `
            <p style="margin:0 0 12px 0;">Hey ${escapeHtml(inst.name.split(" ")[0])},</p>
            <p style="margin:0 0 12px 0;">Your cohort is now live on the site and open for enrollments. Students can apply and pay through Stripe — payouts route directly to your connected account.</p>
            ${note ? `<div style="background:rgba(255,255,255,0.04);border-left:2px solid #10b981;padding:14px 16px;border-radius:6px;color:#fff;font-size:14px;line-height:1.6;margin:16px 0;">${escapeHtml(note).replace(/\n/g, "<br>")}</div>` : ""}
            <p style="margin:0;">— Arnaud</p>`,
          ctaLabel: "Open Dashboard",
          ctaUrl: `${APP_URL}/instructor-dashboard`,
        });
        await sendEmail(inst.email, `Approved — ${cohort.title} is live`, html);
      } else {
        const html = emailShell({
          eyebrow: "A few tweaks first",
          heading: `Changes requested: ${cohort.title}`,
          body: `
            <p style="margin:0 0 12px 0;">Hey ${escapeHtml(inst.name.split(" ")[0])},</p>
            <p style="margin:0 0 12px 0;">Before we publish, a couple of things to update on this cohort:</p>
            <div style="background:rgba(255,255,255,0.04);border-left:2px solid #fbbf24;padding:14px 16px;border-radius:6px;color:#fff;font-size:14px;line-height:1.6;margin:16px 0;">${escapeHtml(note || "(no notes)").replace(/\n/g, "<br>")}</div>
            <p style="margin:0;">Edit the cohort and click <em>Submit for review</em> again — I'll approve the moment it lands.</p>
            <p style="margin:12px 0 0 0;">— Arnaud</p>`,
          ctaLabel: "Edit Cohort",
          ctaUrl: `${APP_URL}/instructor-dashboard`,
        });
        await sendEmail(inst.email, `Changes requested — ${cohort.title}`, html);
      }

      return json({ success: true });
    }

    return json({ error: "Unknown kind" }, 400);
  } catch (err) {
    console.error("notify error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
