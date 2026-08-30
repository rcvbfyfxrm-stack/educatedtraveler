// Circle unsubscribe — public, token-based. The {{unsubscribe_url}} target.
// GET = confirmation page only, never mutates (scanners prefetch these links);
// POST = the actual unsubscribe, from our button or RFC 8058 one-click.
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
      .select("id,email,unsubscribed")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (!row) return page("This link is no longer valid. If you'd like to leave, just reply to any note.");

    // A GET MUST NOT unsubscribe anybody.
    //
    // Every letter carries a List-Unsubscribe header pointing here, and mail
    // providers, link prefetchers and security scanners fetch URLs found in
    // mail. While a GET mutated, one of those fetches removed a real subscriber
    // who never clicked anything — she simply received a letter. Same defence
    // confirm-enrollment already had: GET shows, POST decides.
    if (req.method !== "POST") {
      if (row.unsubscribed) {
        return page("You're already unsubscribed. No more notes will arrive.");
      }
      return page(
        `Leave the Circle?<br><br>` +
        `<form method="POST" style="margin:22px 0 0;">` +
        `<button type="submit" style="font:inherit;font-size:14px;padding:12px 26px;border-radius:50px;border:0;cursor:pointer;background:#7fa8a5;color:#0d0b09;">Yes, unsubscribe me</button>` +
        `</form>` +
        `<span style="display:block;margin-top:18px;font-size:13px;color:rgba(243,237,226,0.55);">Nothing has changed yet.</span>`,
      );
    }

    // Leaving belongs to the PERSON, not the row they happened to click from.
    // The same address can sit in this table several times (founding import,
    // then /circle, then /pay), and flagging one id left the twins subscribed —
    // so the next broadcast still reached them, right after this page promised
    // it would not. Flag every row for the address.
    await admin.from("launch_waitlist").update({ unsubscribed: true }).eq("email", row.email);

    // RFC 8058 one-click posts a body and wants JSON; our own form wants a page.
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const body = await req.text().catch(() => "");
      if (!body.includes("List-Unsubscribe")) {
        return page("You've left the Circle. No more notes will arrive.<br><br>If that was a mistake, you're always welcome back at educatedtraveler.app.");
      }
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return page("Something went wrong. Reply to any note and I'll take you off by hand. — Arnaud");
  }
});
