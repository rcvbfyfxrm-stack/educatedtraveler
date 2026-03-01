// Supabase Edge Function: Send WhatsApp Message via Meta Cloud API
// Accepts: { to, template, variables, language? }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
const GRAPH_API_VERSION = "v21.0";

interface WhatsAppRequest {
  to: string; // Phone number in international format (e.g., "14155238886")
  template: string; // Template name (e.g., "welcome_quest")
  variables: Record<string, string>; // Template variables: { "1": "Sarah", "2": "The Deep Diver" }
  language?: string; // Language code (default: "en")
}

serve(async (req) => {
  // CORS headers for Supabase Edge Functions
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      throw new Error(
        "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID environment variables"
      );
    }

    const { to, template, variables, language = "en" }: WhatsAppRequest =
      await req.json();

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, template" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number — remove +, spaces, dashes
    const cleanPhone = to.replace(/[\s+\-()]/g, "");

    // Build template parameters from variables object
    const parameters = Object.keys(variables || {})
      .sort()
      .map((key) => ({
        type: "text" as const,
        text: variables[key],
      }));

    // Build Meta Graph API payload
    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: template,
        language: { code: language },
        ...(parameters.length > 0 && {
          components: [
            {
              type: "body",
              parameters,
            },
          ],
        }),
      },
    };

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp API error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message_id: data.messages?.[0]?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
