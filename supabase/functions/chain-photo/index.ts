// chain-photo — the two things a /chain photo needs that storage cannot do itself:
// let the person who sent it take it back, and stop it living forever.
//
// Why an edge function at all: anon may INSERT into chain-faces but not DELETE
// (042, deliberately — otherwise anyone holding a link could wipe someone else's
// photo). So every removal has to happen behind the service role, and this is the
// only door to it.
//
// AUTHORSHIP WITHOUT ACCOUNTS. The object name travels inside the link, so knowing
// a name proves nothing — half the chain knows it. What proves authorship is the
// delete_key, minted in the uploader's browser, written once into chain_photos,
// kept only in their localStorage, and never readable back out by anon. Whoever
// still holds it is the person who took the photo, or nobody.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SWEEP_SECRET = Deno.env.get("CHAIN_SWEEP_SECRET") ?? "";
const BUCKET = "chain-faces";
const MAX_AGE_DAYS = 90;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);
const NAME_RE = /^[A-Za-z0-9_-]{6,64}\.jpg$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Compare in constant time. The key is short and the endpoint is public, so a
// naive === leaks its prefix to anyone patient enough to time the responses.
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// A photo is TWO objects: the full picture and the 32px seal the sealed card shows
// before anyone has answered. Forgetting one and keeping the other would leave a
// thumbnail of a face behind and call it deleted.
function sealOf(name: string): string { return name.replace(/\.jpg$/, "-seal.jpg"); }

// Every removal goes through here: the objects first, the row second. That order
// matters — a row with no object is a harmless orphan the sweep clears next run,
// while an object with no row is unreachable forever, because the key that would
// have deleted it is gone with it.
async function removePhoto(name: string): Promise<boolean> {
  const { error: sErr } = await admin.storage.from(BUCKET).remove([name, sealOf(name)]);
  if (sErr) {
    console.error("[chain-photo] storage remove failed", name, sErr.message);
    return false;
  }
  const { error: rErr } = await admin.from("chain_photos").delete().eq("name", name);
  if (rErr) console.error("[chain-photo] row delete failed", name, rErr.message);
  return true;
}

// ORPHANS. A row is what gives a photo a clock and a delete key, so an object with
// no row has neither: it would sit in a public bucket for good, and the person who
// sent it could never take it back. They happen — an upload that succeeded while
// the row insert failed, and every photo uploaded before this table existed. The
// sweep therefore also walks the bucket itself, and anything older than the same
// window with no row behind it goes the same way.
async function sweepOrphans(maxAgeDays: number): Promise<number> {
  const cutoff = Date.now() - maxAgeDays * 86400000;
  let removed = 0, offset = 0;
  for (;;) {
    const { data, error } = await admin.storage.from(BUCKET)
      .list("", { limit: 100, offset });
    if (error) { console.error("[chain-photo] list failed", error.message); break; }
    const items = data ?? [];
    if (!items.length) break;
    for (const it of items) {
      const name = String(it.name);
      if (!NAME_RE.test(name) || name.endsWith("-seal.jpg")) continue;  // seals go with their photo
      const created = Date.parse(String(it.created_at ?? ""));
      if (!Number.isFinite(created) || created > cutoff) continue;
      const { data: row } = await admin.from("chain_photos")
        .select("name").eq("name", name).maybeSingle();
      if (row) continue;                       // has a clock of its own; not an orphan
      if (await removePhoto(name)) removed++;
    }
    if (items.length < 100) break;
    offset += items.length;
  }
  return removed;
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  // ── someone taking their own photo back ────────────────────────────────────
  if (action === "forget") {
    const name = typeof body?.name === "string" ? body.name : "";
    const key = typeof body?.key === "string" ? body.key : "";
    if (!NAME_RE.test(name) || key.length < 16) return json({ error: "bad_request" }, 400);

    const { data, error } = await admin
      .from("chain_photos").select("name, delete_key").eq("name", name).maybeSingle();
    if (error) return json({ error: "lookup_failed" }, 500);

    // Same answer whether the row is missing or the key is wrong. A different one
    // would turn this into an oracle for which photos exist.
    if (!data || !sameSecret(String(data.delete_key), key)) {
      return json({ error: "not_yours" }, 403);
    }
    const ok = await removePhoto(name);
    return ok ? json({ forgotten: true }) : json({ error: "remove_failed" }, 500);
  }

  // ── the nightly sweep ──────────────────────────────────────────────────────
  if (action === "sweep") {
    if (!SWEEP_SECRET || !sameSecret(SWEEP_SECRET, String(body?.secret ?? ""))) {
      return json({ error: "not_allowed" }, 403);
    }
    const { data, error } = await admin.rpc("chain_photos_expired",
      { max_age_days: MAX_AGE_DAYS });
    if (error) return json({ error: "sweep_query_failed" }, 500);

    const rows = Array.isArray(data) ? data : [];
    let removed = 0;
    for (const r of rows) {
      const name = String((r as { name: string }).name);
      if (!NAME_RE.test(name)) continue;
      if (await removePhoto(name)) removed++;
    }
    const orphans = await sweepOrphans(MAX_AGE_DAYS);
    console.log(`[chain-photo] sweep: ${rows.length} expired, ${removed} removed, ${orphans} orphans`);
    return json({ expired: rows.length, removed, orphans, maxAgeDays: MAX_AGE_DAYS });
  }

  return json({ error: "unknown_action" }, 400);
});
