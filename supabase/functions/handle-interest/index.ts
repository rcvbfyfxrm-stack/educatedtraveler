// Supabase Edge Function: Handle Experience Interest
// Actions: subscribe (student), confirm/decline (instructor via email link)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://educatedtraveler.app";

// Admin client for cross-user operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Arnaud <arnaud@educatedtraveler.app>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    console.error("Resend error:", err);
  }
  return res.ok;
}

function emailTemplate(content: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">${content}<p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">Skills last, tans fade.</p></div>`;
}

// === SUBSCRIBE: student expresses interest ===
async function handleSubscribe(req: Request) {
  // Get user from JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { adventure_id, adventure_name } = await req.json();
  if (!adventure_id || !adventure_name) {
    return new Response(JSON.stringify({ error: "Missing adventure_id or adventure_name" }), { status: 400, headers: corsHeaders });
  }

  // Get user profile
  const { data: profile } = await supabaseAdmin.from("profiles").select("name, email").eq("id", user.id).single();
  const studentName = profile?.name || user.email?.split("@")[0] || "there";
  const studentEmail = profile?.email || user.email!;

  // Insert interest (upsert to prevent duplicates)
  const { data: interest, error } = await supabaseAdmin
    .from("experience_interests")
    .upsert(
      { user_id: user.id, adventure_id, adventure_name, status: "interested" },
      { onConflict: "user_id,adventure_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Email 1: confirmation to student
  await sendEmail(
    studentEmail,
    `You're on the list \u2014 ${adventure_name}`,
    emailTemplate(`
      <p>Hey ${studentName},</p>
      <p>We got your interest in <strong>${adventure_name}</strong>.</p>
      <p>Here's what happens next:</p>
      <ol>
        <li>We notify the instructor that a student is ready</li>
        <li>When a cohort opens, you'll be first to know</li>
        <li>You confirm your spot \u2014 no commitment until then</li>
      </ol>
      <p>No spam, no pressure. Just a message when your spot is real.</p>
      <p style="margin-top: 30px;">\u2014 Arnaud<br><span style="color: #666;">EducatedTraveler</span></p>
    `)
  );

  // Email 2: notify Arnaud (acts as instructor relay for now)
  await sendEmail(
    "ceo-educatedtraveler@pm.me",
    `New interest: ${studentName} \u2192 ${adventure_name}`,
    emailTemplate(`
      <p><strong>${studentName}</strong> (${studentEmail}) just expressed interest in:</p>
      <p style="font-size: 18px; font-weight: 600; color: #d97706;">${adventure_name}</p>
      <p>Interest ID: ${interest.id}</p>
      <p>Token: ${interest.token}</p>
      <p style="margin-top: 20px;">
        <a href="${SITE_URL}/offerings" style="color: #06b6d4;">View offerings \u2192</a>
      </p>
    `)
  );

  return new Response(JSON.stringify({ success: true, interest_id: interest.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// === CONFIRM: instructor confirms a spot (via token) ===
async function handleConfirm(token: string) {
  const { data: interest, error } = await supabaseAdmin
    .from("experience_interests")
    .select("*, profiles(name, email)")
    .eq("token", token)
    .eq("status", "interested")
    .single();

  if (error || !interest) {
    return htmlResponse("This link has already been used or is invalid.", false);
  }

  // Update status
  await supabaseAdmin
    .from("experience_interests")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", interest.id);

  // Notify student
  const student = interest.profiles as any;
  if (student?.email) {
    await sendEmail(
      student.email,
      `Confirmed \u2014 ${interest.adventure_name}`,
      emailTemplate(`
        <p>Hey ${student.name || "there"},</p>
        <p>Great news \u2014 <strong>your spot in ${interest.adventure_name} has been confirmed</strong>.</p>
        <p>We'll be in touch with cohort details, dates, and next steps soon.</p>
        <p style="margin-top: 30px;">\u2014 Arnaud<br><span style="color: #666;">EducatedTraveler</span></p>
      `)
    );
  }

  return htmlResponse(`Student confirmed for ${interest.adventure_name}. They've been notified.`, true);
}

// === DECLINE: instructor declines (via token) ===
async function handleDecline(token: string) {
  const { data: interest, error } = await supabaseAdmin
    .from("experience_interests")
    .select("*, profiles(name, email)")
    .eq("token", token)
    .eq("status", "interested")
    .single();

  if (error || !interest) {
    return htmlResponse("This link has already been used or is invalid.", false);
  }

  await supabaseAdmin
    .from("experience_interests")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", interest.id);

  const student = interest.profiles as any;
  if (student?.email) {
    await sendEmail(
      student.email,
      `Update on ${interest.adventure_name}`,
      emailTemplate(`
        <p>Hey ${student.name || "there"},</p>
        <p>Thanks for your interest in <strong>${interest.adventure_name}</strong>.</p>
        <p>This cohort isn't available right now, but we'll keep you on the list and reach out when the next one opens.</p>
        <p><a href="${SITE_URL}/offerings" style="color: #06b6d4;">Explore other experiences \u2192</a></p>
        <p style="margin-top: 30px;">\u2014 Arnaud<br><span style="color: #666;">EducatedTraveler</span></p>
      `)
    );
  }

  return htmlResponse(`Student declined for ${interest.adventure_name}. They've been notified.`, true);
}

function htmlResponse(message: string, success: boolean): Response {
  const color = success ? "#059669" : "#ef4444";
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EducatedTraveler</title></head>
    <body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:white;margin:0;">
    <div style="text-align:center;max-width:400px;padding:40px;">
      <p style="font-size:14px;color:${color};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">${success ? "Done" : "Error"}</p>
      <p style="font-size:18px;margin-bottom:24px;">${message}</p>
      <a href="${SITE_URL}" style="color:#06b6d4;font-size:14px;">Back to EducatedTraveler</a>
    </div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (req.method === "POST" && (!action || action === "subscribe")) {
      return await handleSubscribe(req);
    }
    if (action === "confirm") {
      const token = url.searchParams.get("token");
      if (!token) return htmlResponse("Missing token.", false);
      return await handleConfirm(token);
    }
    if (action === "decline") {
      const token = url.searchParams.get("token");
      if (!token) return htmlResponse("Missing token.", false);
      return await handleDecline(token);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
