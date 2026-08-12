// Edge Function: resend-debug
// One-shot diagnostic to inspect Resend deliverability for educatedtraveler.app.
// Service-role only. Returns:
//  - domains/verification state (does Resend think educatedtraveler.app is verified?)
//  - status of specific email IDs we want to trace
//  - account info (so we can see which Resend org/account we're hitting)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

async function rs(path: string) {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  let body: unknown;
  try { body = await res.json(); } catch { body = await res.text(); }
  return { ok: res.ok, status: res.status, body };
}

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  let ids: string[] = [];
  if (req.method === "POST") {
    try {
      const j = await req.json();
      ids = Array.isArray(j?.ids) ? j.ids : [];
    } catch { /* empty body ok */ }
  }

  const [domains] = await Promise.all([rs("/domains")]);

  const emails: Record<string, unknown> = {};
  for (const id of ids) {
    emails[id] = await rs(`/emails/${id}`);
  }

  return new Response(
    JSON.stringify({
      api_key_prefix: RESEND_API_KEY.slice(0, 8) + "…",
      domains,
      emails,
    }, null, 2),
    { headers: { "Content-Type": "application/json" } },
  );
});
