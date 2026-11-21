// circle-hello: READ ONLY. Turns a personal Circle key into a first name, a full
// name (when we have one) and an email, so a member who arrives from one of
// Arnaud's notes finds /tokyo-book already filled in (Arnaud, 21 Nov 2026).
//
// The key is "<launch_waitlist id>.<signature>", where the signature is an HMAC
// of the id made with CIRCLE_HELLO_SECRET. Nobody can make a key for a row
// without that secret, and the email is never in the URL. The key is made
// offline by the script that writes his notes (circle_key.py).
//
// Never writes, never signs anyone up, never sends mail. A bad or unknown key
// answers {ok:false}: the page then shows the empty form, as before.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);
// Its own secret, set with `supabase secrets set CIRCLE_HELLO_SECRET=…` and kept in
// Arnaud's keychain (service et-circle-hello). Without it every key is refused.
const HELLO_SECRET = Deno.env.get("CIRCLE_HELLO_SECRET") || "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function b64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(id: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(HELLO_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("circle-hello:v1:" + id));
  return b64url(mac).slice(0, 22);
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const k = typeof body?.k === "string" ? body.k.trim() : "";
    const m = /^([0-9a-f-]{36}|\d{1,12})\.([A-Za-z0-9_-]{22})$/i.exec(k);
    if (!m || HELLO_SECRET.length < 20) return json({ ok: false });
    if (!same(await sign(m[1]), m[2])) return json({ ok: false });

    const { data: row } = await admin.from("launch_waitlist")
      .select("email").eq("id", m[1]).maybeSingle();
    const email = (row?.email || "").trim().toLowerCase();
    if (!email) return json({ ok: false });

    // Same name rule as the Circle vault: the newest name they typed on any
    // sheet, else their account's first name, else nothing.
    const { data: rows } = await admin.from("launch_waitlist")
      .select("interests").eq("email", email).order("created_at", { ascending: true });
    let typed = "";
    for (const r of rows || []) {
      for (const it of (Array.isArray(r.interests) ? r.interests : [])) {
        if (it && typeof it === "object" && it.kind === "profile" && typeof it.name === "string" && it.name.trim()) {
          typed = it.name.trim();
        }
      }
    }
    const { data: prof } = await admin.from("profiles")
      .select("first_name,name").eq("email", email).limit(1).maybeSingle();
    const full = typed || (prof?.name || "").trim() || "";
    const first = (full.split(/\s+/)[0] || (prof?.first_name || "").trim() || "");

    return json({
      ok: true,
      email,
      first: first.slice(0, 60),
      // Only a name with a space in it is offered for the certificate line;
      // a lone first name is a greeting, not a certificate.
      full: /\s/.test(full) ? full.slice(0, 120) : "",
    });
  } catch (e) {
    console.error("circle-hello error:", e);
    return json({ ok: false });
  }
});
