#!/usr/bin/env node
// concierge-queue.mjs — the Claude-in-the-loop half of the Circle Concierge.
// The scanner (concierge-draft.mjs) drops skeleton rows at status='draft'. This
// helper is the two ends of the enrichment loop:
//
//   --pending          Dump the draft rows that still need content (message_md is
//                      null) as JSON, so Claude can research + write the verified
//                      fact / reply / skill sheet for each. READ-ONLY.
//   --apply <file>     Take Claude's enriched JSON and PATCH it back onto the rows
//                      BY ext_id — only where status is still draft/changes_requested
//                      (never touches an approved/published/sent row). For a 'create'
//                      row that comes with skill_sheet_md, it renders page_html via
//                      the one Atlas renderer, so the Studio preview is the real page.
//
// It NEVER approves, publishes, or sends. Everything it writes stays status='draft'
// for Arnaud to judge in the Studio. Content it writes must be source-verified — see
// os/playbooks/Playbook - Circle Concierge Drafting.md (NEVER FABRICATE).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Flags: --dry, --fixture <file.json>.
//   node scripts/concierge-queue.mjs --pending > /tmp/pending.json
//   # ...Claude researches + writes /tmp/enriched.json...
//   node scripts/concierge-queue.mjs --apply /tmp/enriched.json
import { readFileSync } from "node:fs";
import { renderAtlasPage } from "./atlas-page.mjs";

const URL = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const argVal = (f, d) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : d);
const DRY = process.argv.includes("--dry");
const FIXTURE = argVal("--fixture", null);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

// Only these fields may be written by enrichment; status/approval fields are never touched here.
const ENRICH_FIELDS = ["skill_title", "world", "fact_md", "fact_source", "message_subject",
  "message_md", "skill_sheet_md", "claude_notes_md", "atlas_url"];

async function getJson(url) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

async function pending() {
  const rows = FIXTURE
    ? JSON.parse(readFileSync(FIXTURE, "utf8"))
    : await getJson(`${URL}/rest/v1/concierge_queue?select=id,ext_id,lead_email,person_name,skill_raw,skill_title,skill_slug,world,atlas_action,atlas_url,message_md&status=in.(draft,changes_requested)&message_md=is.null&order=created_at.asc`);
  // Emit exactly what Claude needs to enrich each row (no secrets).
  const out = rows.map((r) => ({
    ext_id: r.ext_id, lead_email: r.lead_email, person_name: r.person_name,
    skill_raw: r.skill_raw, skill_title: r.skill_title, skill_slug: r.skill_slug,
    world: r.world, atlas_action: r.atlas_action, atlas_url: r.atlas_url,
  }));
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  console.error(`${out.length} row(s) awaiting content.`);
}

async function apply(file) {
  const items = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(items)) throw new Error("enriched file must be a JSON array");
  let ok = 0, skipped = 0;
  for (const it of items) {
    const ext_id = String(it.ext_id || "").trim();
    if (!ext_id) { console.error("skip: item without ext_id"); skipped++; continue; }
    // Build the patch from allowed fields only.
    const patch = {};
    for (const f of ENRICH_FIELDS) if (it[f] != null && it[f] !== "") patch[f] = it[f];
    // Render the finished Atlas page for a create row so the Studio preview is byte-identical to publish.
    if (it.atlas_action === "create" && patch.skill_sheet_md && it.skill_slug) {
      patch.page_html = renderAtlasPage({
        skill_title: patch.skill_title || it.skill_title, skill_raw: it.skill_raw,
        skill_slug: it.skill_slug, world: patch.world || it.world, skill_sheet_md: patch.skill_sheet_md,
      });
      patch.page_built_at = new Date().toISOString();
    }
    if (!Object.keys(patch).length) { console.error(`skip ${ext_id}: nothing to write`); skipped++; continue; }
    if (DRY || FIXTURE) {
      console.error(`[dry] ${ext_id}: would set ${Object.keys(patch).join(", ")}` +
        (patch.page_html ? ` (page_html ${patch.page_html.length}b)` : ""));
      ok++; continue;
    }
    // PATCH by ext_id, guarded to still-open rows — never overwrite an approved/published/sent draft.
    const q = `${URL}/rest/v1/concierge_queue?ext_id=eq.${encodeURIComponent(ext_id)}&status=in.(draft,changes_requested)`;
    const res = await fetch(q, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(patch) });
    if (!res.ok) { console.error(`FAIL ${ext_id}: ${res.status} ${await res.text()}`); skipped++; continue; }
    console.error(`enriched ${ext_id}: ${Object.keys(patch).join(", ")}`);
    ok++;
  }
  console.error(`\nDone: ${ok} enriched, ${skipped} skipped. All stay status='draft' — judge them in the Studio.`);
}

async function main() {
  if (!KEY && !FIXTURE && !DRY) { console.error("missing SUPABASE_SERVICE_ROLE_KEY (or pass --fixture / --dry)"); process.exit(1); }
  if (process.argv.includes("--pending")) return pending();
  const applyFile = argVal("--apply", null);
  if (applyFile) return apply(applyFile);
  console.error("usage: concierge-queue.mjs --pending | --apply <enriched.json> [--dry]");
  process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
