// Supabase Edge Function: Send Follow-up WhatsApp Messages
// Run daily via cron to send Day 1 (welcome), Day 3, and Day 7 WhatsApp messages
// Mirrors send-followup-emails but for WhatsApp-opted-in users

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WHATSAPP_FUNCTION_URL = Deno.env.get("SUPABASE_URL") +
  "/functions/v1/send-whatsapp";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Template names must match what's approved in Meta's template manager
const TEMPLATES = {
  day1: "welcome_quest",
  day3: "followup_day3",
  day7: "followup_day7",
};

async function sendWhatsApp(
  to: string,
  template: string,
  variables: Record<string, string>
) {
  const res = await fetch(WHATSAPP_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ to, template, variables }),
  });

  return res.json();
}

serve(async (req) => {
  try {
    const now = new Date();
    const results: {
      day1: string[];
      day3: string[];
      day7: string[];
      errors: Array<{ type: string; phone?: string; error: string }>;
    } = { day1: [], day3: [], day7: [], errors: [] };

    // ========================================
    // DAY 1 — Welcome (same day as signup)
    // ========================================
    const todayStart = now.toISOString().split("T")[0] + "T00:00:00Z";
    const todayEnd = now.toISOString().split("T")[0] + "T23:59:59Z";

    const { data: day1Users, error: day1Error } = await supabase
      .from("profiles")
      .select("id, phone, name, email")
      .not("phone", "is", null)
      .eq("whatsapp_opt_in", true)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .is("whatsapp_day1_sent", null);

    if (day1Error) {
      results.errors.push({ type: "day1_query", error: day1Error.message });
    }

    for (const user of day1Users || []) {
      const firstName = user.name || user.email.split("@")[0];
      try {
        // Day 1 welcome uses the welcome_quest template
        // We send a simpler version without persona/adventure since we may not have preferences yet
        await sendWhatsApp(user.phone, TEMPLATES.day1, {
          "1": firstName,
          "2": "Explorer", // Default persona
          "3": "your matched adventures", // Generic until we query preferences
        });

        await supabase
          .from("profiles")
          .update({ whatsapp_day1_sent: now.toISOString() })
          .eq("id", user.id);

        results.day1.push(user.phone);
      } catch (e) {
        results.errors.push({
          type: "day1_send",
          phone: user.phone,
          error: e.message,
        });
      }
    }

    // ========================================
    // DAY 3 — Follow-up
    // ========================================
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStart =
      threeDaysAgo.toISOString().split("T")[0] + "T00:00:00Z";
    const threeDaysAgoEnd =
      threeDaysAgo.toISOString().split("T")[0] + "T23:59:59Z";

    const { data: day3Users, error: day3Error } = await supabase
      .from("profiles")
      .select("id, phone, name, email")
      .not("phone", "is", null)
      .eq("whatsapp_opt_in", true)
      .gte("created_at", threeDaysAgoStart)
      .lte("created_at", threeDaysAgoEnd)
      .is("whatsapp_day3_sent", null);

    if (day3Error) {
      results.errors.push({ type: "day3_query", error: day3Error.message });
    }

    for (const user of day3Users || []) {
      const firstName = user.name || user.email.split("@")[0];
      try {
        await sendWhatsApp(user.phone, TEMPLATES.day3, { "1": firstName });
        await supabase
          .from("profiles")
          .update({ whatsapp_day3_sent: now.toISOString() })
          .eq("id", user.id);
        results.day3.push(user.phone);
      } catch (e) {
        results.errors.push({
          type: "day3_send",
          phone: user.phone,
          error: e.message,
        });
      }
    }

    // ========================================
    // DAY 7 — Final follow-up
    // ========================================
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStart =
      sevenDaysAgo.toISOString().split("T")[0] + "T00:00:00Z";
    const sevenDaysAgoEnd =
      sevenDaysAgo.toISOString().split("T")[0] + "T23:59:59Z";

    const { data: day7Users, error: day7Error } = await supabase
      .from("profiles")
      .select("id, phone, name, email")
      .not("phone", "is", null)
      .eq("whatsapp_opt_in", true)
      .gte("created_at", sevenDaysAgoStart)
      .lte("created_at", sevenDaysAgoEnd)
      .is("whatsapp_day7_sent", null);

    if (day7Error) {
      results.errors.push({ type: "day7_query", error: day7Error.message });
    }

    for (const user of day7Users || []) {
      const firstName = user.name || user.email.split("@")[0];
      try {
        await sendWhatsApp(user.phone, TEMPLATES.day7, { "1": firstName });
        await supabase
          .from("profiles")
          .update({ whatsapp_day7_sent: now.toISOString() })
          .eq("id", user.id);
        results.day7.push(user.phone);
      } catch (e) {
        results.errors.push({
          type: "day7_send",
          phone: user.phone,
          error: e.message,
        });
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
