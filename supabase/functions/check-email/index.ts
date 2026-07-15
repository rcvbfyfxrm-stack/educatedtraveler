// check-email — public, side-effect-free membership probe for the Circle join page.
// Given an email, tells the browser whether it already belongs to a member account,
// so /circle can send returning members back to their own door instead of quietly
// creating a second launch_waitlist lead.
//
// READ ONLY. Never writes, never signs anyone up, never sends mail. Contrast with the
// supabase.auth.signUp() "empty identities" trick (join.html): that would create an
// unconfirmed account + confirmation email for a *new* email — unacceptable on the
// no-account Circle page. Here we look the email up with the service role instead.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.email === "string" ? body.email : "";
    const email = raw.trim().toLowerCase();
    if (!email || email.indexOf("@") === -1) {
      return json({ error: "invalid_email" }, 400);
    }

    // Every auth account gets a profiles row (migration 012 trigger) carrying its
    // email. The service role bypasses RLS, so this reliably covers members whose
    // profile isn't publicly visible — unlike an anon SELECT (visible=true only).
    // eq() on the lowercased address: GoTrue stores emails lowercased, and eq avoids
    // ilike's wildcard hazard (an "_" in a local part would match any character).
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("check-email query error:", error);
      return json({ member: false }); // fail open — never block a real join
    }

    return json({ member: !!data });
  } catch (e) {
    console.error("check-email error:", e);
    return json({ member: false }); // fail open
  }
});
