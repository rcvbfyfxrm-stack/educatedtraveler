// Circle unsubscribe — public, token-based. The {{unsubscribe_url}} target.
// GET = click-through (renders a warm page); POST = one-click List-Unsubscribe.
// Deploy with --no-verify-jwt (public link in every email).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function page(message: string): Response {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>The Circle</title></head>
<body style="margin:0;background:#0d0b09;color:#f3ede2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:460px;margin:0 auto;padding:80px 24px;text-align:center;">
    <p style="font-family:Georgia,serif;font-size:15px;letter-spacing:2px;margin:0 0 28px;"><span style="color:#f3ede2;">EDUCATED</span><span style="color:#7fa8a5;">TRAVELER</span></p>
    <p style="font-size:16px;line-height:1.7;color:rgba(243,237,226,0.8);margin:0 0 28px;">${message}</p>
    <a href="https://educatedtraveler.app" style="color:#7fa8a5;font-size:13px;text-decoration:none;">educatedtraveler.app</a>
  </div>
</body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return page("This unsubscribe link is missing its token.");

    const { data: row } = await admin
      .from("launch_waitlist")
      .select("id,unsubscribed")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (!row) return page("This link is no longer valid. If you'd like to leave, just reply to any letter.");

    if (!row.unsubscribed) {
      await admin.from("launch_waitlist").update({ unsubscribed: true }).eq("id", row.id);
    }

    // One-click POST (RFC 8058) just needs a 200.
    if (req.method === "POST") {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return page("You've left the Circle. No more letters will arrive.<br><br>If that was a mistake, you're always welcome back at educatedtraveler.app.");
  } catch (e) {
    console.error(e);
    return page("Something went wrong. Reply to any letter and I'll take you off by hand. — Arnaud");
  }
});
