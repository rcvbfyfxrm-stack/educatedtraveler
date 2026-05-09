// Edge Function: invite-instructor
// Admin-only. Creates (or upgrades) an approved instructor row, then sends a
// branded magic-link email so the instructor lands directly in the dashboard.
//
// Body: { name, email, discipline?, location?, credentials?, adventure_id? }
// Auth: caller must be an authenticated admin (profiles.is_admin = true).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Caller must be admin
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    if (!profile?.is_admin) return json({ error: "Admin only" }, 403);

    const { name, email, discipline, location, credentials, adventure_id } = await req.json();
    if (!email || !name) return json({ error: "name + email required" }, 400);

    // Upsert instructor row, pre-approved.
    const { data: existing } = await admin
      .from("instructors")
      .select("id, status, name")
      .eq("email", email)
      .maybeSingle();

    let instructorId: string;
    if (existing) {
      const { data: upd, error: uErr2 } = await admin
        .from("instructors")
        .update({
          status: "approved",
          name: name || existing.name,
          discipline: discipline || undefined,
          location: location || undefined,
          credentials: credentials || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (uErr2) throw uErr2;
      instructorId = upd!.id;
    } else {
      const { data: ins, error: iErr } = await admin
        .from("instructors")
        .insert({
          name,
          email,
          discipline: discipline || null,
          location: location || null,
          credentials: credentials || null,
          status: "approved",
        })
        .select("id")
        .single();
      if (iErr) throw iErr;
      instructorId = ins!.id;
    }

    // Generate a magic link that lands them on the instructor dashboard.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${APP_URL}/instructor-dashboard?welcome=1`,
      },
    });
    if (linkErr) throw linkErr;
    const magicLinkUrl = link?.properties?.action_link;
    if (!magicLinkUrl) throw new Error("Failed to generate magic link");

    const firstName = (name || "").split(" ")[0] || "there";
    const subjectLine = "Your EducatedTraveler dashboard is ready";

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#fff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">

      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 20px 0;font-family:'Courier New',monospace;">You're In</p>

      <p style="color:#fff;font-size:18px;line-height:1.5;margin:0 0 12px 0;">Hey ${firstName},</p>

      <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 16px 0;">Your instructor dashboard is set up and waiting. From there you can confirm your bio, propose new cohort dates, see who's signed up, and connect Stripe to receive payouts directly.</p>

      <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin:0 0 28px 0;">Click below to land directly in your dashboard — no password to remember.</p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${magicLinkUrl}" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">Open My Dashboard</a>
      </div>

      <p style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;margin:24px 0 0 0;">Anything off? Reply to this email and I'll fix it. New dates, price changes, page edits — all of it goes through me until everything looks the way you want.</p>

    </div>

    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>

    <div style="margin-top:36px;text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
    </div>
  </div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arnaud <founder@educatedtraveler.app>",
        to: [email],
        reply_to: "founder@educatedtraveler.app",
        subject: subjectLine,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return json({ error: data, instructor_id: instructorId }, 500);
    }

    return json({
      success: true,
      instructor_id: instructorId,
      email_id: data.id,
    });
  } catch (err) {
    console.error("invite-instructor error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
