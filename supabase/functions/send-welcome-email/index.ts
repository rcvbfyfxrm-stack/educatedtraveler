// Supabase Edge Function: Send Welcome Email via Resend
// Triggered when a new profile is created

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    // Only process new profile inserts
    if (payload.type !== "INSERT" || payload.table !== "profiles") {
      return new Response(JSON.stringify({ message: "Ignored" }), { status: 200 });
    }

    const { email, name } = payload.record;
    const firstName = name || email.split("@")[0];

    // Send welcome email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arnaud <arnaud@educatedtraveler.app>",
        to: [email],
        subject: "Your adventure matches are saved",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <p>Hey ${firstName},</p>

            <p>You just did something most people never do—you actually chose.</p>

            <p>Your matches are saved. They're not random—they're based on what you said you want: the element, the outcome, the intensity.</p>

            <p>We're building cohorts now. When one opens that fits you, you'll be first to know.</p>

            <p>In the meantime, here's what makes us different:<br>
            <a href="https://educatedtraveler.app/vision.html" style="color: #06b6d4;">Read the vision →</a></p>

            <p style="margin-top: 30px;">— Arnaud<br>
            <span style="color: #666;">EducatedTraveler</span></p>

            <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Skills last, tans fade.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
