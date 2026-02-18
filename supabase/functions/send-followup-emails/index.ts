// Supabase Edge Function: Send Follow-up Emails
// Run daily via cron to send Day 3 and Day 7 emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const EMAIL_TEMPLATES = {
  day3: {
    subject: "Why we don't do \"resorts\"",
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Hey ${name},</p>

        <p>Most travel companies optimize for comfort. We optimize for transformation.</p>

        <p>That means:</p>
        <ul style="color: #555;">
          <li><strong>Real certifications</strong> — PADI, RYA, Yoga Alliance, WSET</li>
          <li><strong>Real instructors</strong> — 5+ years, world-class credentials</li>
          <li><strong>Real immersion</strong> — No sitting blocks over 90 minutes</li>
        </ul>

        <p>When you leave, you take something home. Not a tan—a skill.</p>

        <p><a href="https://educatedtraveler.app/offerings.html" style="color: #06b6d4;">See all offerings →</a></p>

        <p style="margin-top: 30px;">— Arnaud<br>
        <span style="color: #666;">EducatedTraveler</span></p>

        <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          Skills last, tans fade.
        </p>
      </div>
    `,
  },
  day7: {
    subject: "The pattern I noticed",
    html: (name: string) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Hey ${name},</p>

        <p>After 50,000 nautical miles and Michelin kitchens to midnight markets, I noticed a pattern.</p>

        <p>Every skill worth having came from:</p>
        <ol style="color: #555;">
          <li><strong>A place</strong> — where the knowledge was born</li>
          <li><strong>A person</strong> — who mastered it and is willing to share</li>
          <li><strong>Total immersion</strong> — not weekends, weeks</li>
        </ol>

        <p>That's what we're building.</p>

        <p>Reply to this email if you have questions. I read everything.</p>

        <p style="margin-top: 30px;">— Arnaud<br>
        <span style="color: #666;">EducatedTraveler</span></p>

        <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          <a href="https://educatedtraveler.app" style="color: #06b6d4;">educatedtraveler.app</a>
        </p>
      </div>
    `,
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
      from: "Arnaud <arnaud@educatedtraveler.app>",
      to: [to],
      subject,
      html,
      reply_to: "ceo-educatedtraveler@pm.me",
    }),
  });

  return res.json();
}

serve(async (req) => {
  try {
    const now = new Date();
    const results = { day3: [], day7: [], errors: [] };

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

    // Send Day 3 emails
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

    // Send Day 7 emails
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
