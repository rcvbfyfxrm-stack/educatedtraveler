// Supabase Edge Function: Send Follow-up Emails
// Run daily via cron to send Day 3 and Day 7 emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function emailShell(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#ffffff;">EDUCATED</span><span style="font-size:14px;font-weight:600;letter-spacing:3px;color:#3B8DD4;">TRAVELER</span>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">${title}</p>
      ${body}
    </div>

    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>

    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:rgba(255,255,255,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;">
        <a href="https://educatedtraveler.app" style="color:rgba(59,141,212,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

const EMAIL_TEMPLATES = {
  day3: {
    subject: "Why we don't do \"resorts\"",
    html: (name: string) => emailShell("Day 3 — The Difference", `
      <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hey ${name},</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">Most travel companies optimize for comfort. We optimize for what stays with you.</p>

      <div style="margin:24px 0;padding:20px 24px;background:rgba(0,102,177,0.08);border-left:3px solid #3B8DD4;border-radius:0 12px 12px 0;">
        <p style="color:#3B8DD4;font-size:14px;line-height:1.8;margin:0;">
          <strong style="color:#ffffff;">Real certifications</strong> — PADI, RYA, Yoga Alliance, WSET<br>
          <strong style="color:#ffffff;">Real instructors</strong> — 5+ years, world-class credentials<br>
          <strong style="color:#ffffff;">Real immersion</strong> — No sitting blocks over 90 minutes
        </p>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 28px 0;">When you leave, you take something home. Not a tan — a skill.</p>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://educatedtraveler.app/offerings" style="display:inline-block;background:linear-gradient(135deg,#0066B1 0%,#3B8DD4 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">Explore Offerings</a>
      </div>
    `),
  },
  day7: {
    subject: "The pattern I noticed",
    html: (name: string) => emailShell("Day 7 — The Pattern", `
      <p style="color:#ffffff;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hey ${name},</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">After 50,000 nautical miles and Michelin kitchens to midnight markets, I noticed a pattern.</p>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px 0;">Every skill worth having came from:</p>

      <div style="margin:16px 0 24px 0;">
        <div style="display:flex;margin-bottom:12px;">
          <span style="color:#3B8DD4;font-size:22px;font-weight:300;font-family:'Courier New',monospace;margin-right:16px;line-height:1;">1</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:500;margin:0;">A place</p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:2px 0 0 0;">Where the knowledge was born</p>
          </div>
        </div>
        <div style="display:flex;margin-bottom:12px;">
          <span style="color:#3B8DD4;font-size:22px;font-weight:300;font-family:'Courier New',monospace;margin-right:16px;line-height:1;">2</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:500;margin:0;">A person</p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:2px 0 0 0;">Who mastered it and is willing to share</p>
          </div>
        </div>
        <div style="display:flex;">
          <span style="color:#3B8DD4;font-size:22px;font-weight:300;font-family:'Courier New',monospace;margin-right:16px;line-height:1;">3</span>
          <div>
            <p style="color:#ffffff;font-size:14px;font-weight:500;margin:0;">Total immersion</p>
            <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:2px 0 0 0;">Not weekends — weeks</p>
          </div>
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px 0;">That's what we're building.</p>

      <div style="margin:24px 0;padding:16px 24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
        <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0;">Reply to this email if you have questions. I read everything.</p>
      </div>
    `),
  },
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Arnaud <founder@educatedtraveler.app>",
      to: [to],
      subject,
      html,
      reply_to: "founder@educatedtraveler.app",
    }),
  });

  return res.json();
}

serve(async (req) => {
  try {
    const now = new Date();
    const results = { day3: [] as string[], day7: [] as string[], errors: [] as any[] };

    // Find users who signed up exactly 3 days ago (haven't received day3 email)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStart = threeDaysAgo.toISOString().split("T")[0] + "T00:00:00Z";
    const threeDaysAgoEnd = threeDaysAgo.toISOString().split("T")[0] + "T23:59:59Z";

    const { data: day3Users, error: day3Error } = await supabase
      .from("profiles")
      .select("id, email, name")
      .gte("created_at", threeDaysAgoStart)
      .lte("created_at", threeDaysAgoEnd)
      .is("day3_email_sent", null);

    if (day3Error) {
      results.errors.push({ type: "day3_query", error: day3Error });
    }

    for (const user of day3Users || []) {
      const firstName = user.name || user.email.split("@")[0];
      const template = EMAIL_TEMPLATES.day3;

      try {
        await sendEmail(user.email, template.subject, template.html(firstName));
        await supabase
          .from("profiles")
          .update({ day3_email_sent: now.toISOString() })
          .eq("id", user.id);
        results.day3.push(user.email);
      } catch (e) {
        results.errors.push({ type: "day3_send", email: user.email, error: e.message });
      }
    }

    // Find users who signed up exactly 7 days ago (haven't received day7 email)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStart = sevenDaysAgo.toISOString().split("T")[0] + "T00:00:00Z";
    const sevenDaysAgoEnd = sevenDaysAgo.toISOString().split("T")[0] + "T23:59:59Z";

    const { data: day7Users, error: day7Error } = await supabase
      .from("profiles")
      .select("id, email, name")
      .gte("created_at", sevenDaysAgoStart)
      .lte("created_at", sevenDaysAgoEnd)
      .is("day7_email_sent", null);

    if (day7Error) {
      results.errors.push({ type: "day7_query", error: day7Error });
    }

    for (const user of day7Users || []) {
      const firstName = user.name || user.email.split("@")[0];
      const template = EMAIL_TEMPLATES.day7;

      try {
        await sendEmail(user.email, template.subject, template.html(firstName));
        await supabase
          .from("profiles")
          .update({ day7_email_sent: now.toISOString() })
          .eq("id", user.id);
        results.day7.push(user.email);
      } catch (e) {
        results.errors.push({ type: "day7_send", email: user.email, error: e.message });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
