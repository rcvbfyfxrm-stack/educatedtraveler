#!/usr/bin/env node
// concierge-draft.mjs — the MISSING half of the Circle Concierge: scan launch_waitlist
// for hands raised, and drop ONE draft row per (person × craft) into concierge_queue at
// status='draft'. This is the only thing that ever inserts a concierge row; the
// approve/publish/send half (studio-command.js, concierge-send, concierge-publish.mjs)
// already exists and only needs rows to act on.
//
// This script is DETERMINISTIC and writes NOTHING public. It creates skeleton drafts
// (who, what craft, is it already in the Atlas, the ext_id key). The bespoke, source-
// verified CONTENT — the surprising fact, Arnaud's reply, and (for a new craft) the full
// Atlas skill sheet — is written onto these rows by the Concierge Drafting routine
// (os/playbooks/Playbook - Circle Concierge Drafting.md), which must NEVER fabricate.
// NOTHING publishes or sends without Arnaud approving it in the Studio.
//
// Idempotent: ext_id = "<email>::<skill_slug>" is unique; re-runs ignore rows that already
// exist (resolution=ignore-duplicates), so a row a human/routine enriched is never clobbered.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Flags:
//   --dry                 parse + decide, print, write nothing
//   --limit <n>           cap leads scanned (default 200, newest first)
//   --fixture <file.json> read leads from a JSON array instead of the DB (for testing)
//   --atlas-dir <path>    where the Atlas .html live (default ./website/atlas)
//
//   node scripts/concierge-draft.mjs --dry
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
const argVal = (f, d) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : d);
const LIMIT = parseInt(argVal("--limit", "200"), 10) || 200;
const FIXTURE = argVal("--fixture", null);
const ATLAS_DIR = argVal("--atlas-dir", "website/atlas");
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

// ── the site's canonical slug (mirror of website/js/studio-people.js slugify) ──
const slugify = (s) => String(s || "").toLowerCase().replace(/&/g, " and ")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const titleCase = (s) => String(s || "").trim().replace(/\s+/g, " ")
  .replace(/\b\w/g, (m) => m.toUpperCase());

// The set of disciplines the Atlas already covers = every hub page (no "--place" suffix).
function existingHubSlugs(dir) {
  const set = new Set();
  if (!existsSync(dir)) return set;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".html")) continue;
    const slug = f.slice(0, -5);
    if (slug === "index" || slug.includes("--")) continue; // skip index + per-destination pages
    set.add(slug);
  }
  return set;
}

// launch_waitlist.interests comes in several shapes (see notify-lead). Pull the person's
// name and the list of crafts they named (label + whether it was their own words).
function parseLead(row) {
  let name = "";
  const crafts = [];
  const push = (label, own) => {
    const l = String(label || "").trim();
    if (!l) return;
    if (!crafts.some((c) => c.label.toLowerCase() === l.toLowerCase())) crafts.push({ label: l, own: !!own });
  };
  let items = [];
  const iv = row.interests;
  if (Array.isArray(iv)) items = iv;
  else if (iv && typeof iv === "object") items = Object.values(iv).flat();
  for (const it of items) {
    if (typeof it === "string") { push(it, false); continue; }
    if (!it || typeof it !== "object") continue;
    if (it.kind === "profile") { if (it.name && !name) name = String(it.name).trim(); }
    else if (it.kind === "discipline") { if (it.discipline) push(it.discipline, false); if (it.open) push(it.open, true); if (it.label && !it.discipline) push(it.label, false); }
    // intent / dream / mastery carry no craft to add here
  }
  return { name, crafts };
}

async function getJson(url) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  if (!FIXTURE && !KEY) { console.error("missing SUPABASE_SERVICE_ROLE_KEY (or pass --fixture)"); process.exit(1); }

  const atlas = existingHubSlugs(ATLAS_DIR);
  console.log(`Atlas hubs known: ${atlas.size} (from ${ATLAS_DIR})`);

  // leads
  const leads = FIXTURE
    ? JSON.parse(readFileSync(FIXTURE, "utf8"))
    : await getJson(`${URL}/rest/v1/launch_waitlist?select=email,interests,source,created_at&order=created_at.desc&limit=${LIMIT}`);
  console.log(`Leads scanned: ${leads.length}`);

  // already-queued keys (so we don't re-insert; DB unique(ext_id) is the real guard)
  const existing = new Set();
  if (!FIXTURE && KEY) {
    const rows = await getJson(`${URL}/rest/v1/concierge_queue?select=ext_id`);
    for (const r of rows) if (r.ext_id) existing.add(r.ext_id);
  }

  const toInsert = [];
  const seenExt = new Set();
  for (const lead of leads) {
    const email = String(lead.email || "").trim().toLowerCase();
    if (!email) continue;
    const { name, crafts } = parseLead(lead);
    for (const c of crafts) {
      const slug = slugify(c.label);
      if (!slug) continue;
      const ext_id = `${email}::${slug}`;
      if (existing.has(ext_id) || seenExt.has(ext_id)) continue;
      seenExt.add(ext_id);
      const inAtlas = atlas.has(slug);
      toInsert.push({
        ext_id,
        lead_email: email,
        person_name: name || null,
        skill_raw: c.label,
        skill_title: titleCase(c.label),
        skill_slug: slug,
        atlas_action: inAtlas ? "exists" : "create",
        atlas_url: inAtlas ? `https://educatedtraveler.app/atlas/${slug}` : null,
        status: "draft",
        claude_notes_md:
          `Queued by concierge-draft. atlas_action=${inAtlas ? "exists" : "create"}` +
          (c.own ? " · named in their OWN words (confirm it's a real, teachable craft before building)" : "") +
          `.\n\nNEXT (Concierge Drafting routine — never fabricate):\n` +
          `1. Verify ONE surprising, genuinely-true fact about "${c.label}" and put its source in fact_source.\n` +
          `2. Write Arnaud's personal reply (message_md) in ET voice — warm, specific to this person, no sell.\n` +
          (inAtlas
            ? `3. The Atlas already covers this — point them at ${`/atlas/${slug}`}. No new page.\n`
            : `3. Draft the full source-verified Atlas skill sheet (skill_sheet_md) + set world; page_html renders from it.\n`) +
          `Then it waits at status='draft' for Arnaud. Nothing publishes or sends without his approval.`,
      });
    }
  }

  console.log(`New drafts to create: ${toInsert.length}` +
    ` (exists=${toInsert.filter((r) => r.atlas_action === "exists").length}, create=${toInsert.filter((r) => r.atlas_action === "create").length})`);

  if (!toInsert.length) { console.log("nothing to queue."); return; }
  if (DRY || FIXTURE) {
    for (const r of toInsert.slice(0, 40)) console.log(`  [${r.atlas_action}] ${r.lead_email} → ${r.skill_title} (${r.skill_slug})`);
    if (toInsert.length > 40) console.log(`  … +${toInsert.length - 40} more`);
    console.log(DRY ? "\n--dry: wrote nothing." : "\n--fixture: wrote nothing.");
    return;
  }

  // Insert as drafts; ignore any ext_id that already exists (never clobber enriched rows).
  const res = await fetch(`${URL}/rest/v1/concierge_queue?on_conflict=ext_id`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(toInsert),
  });
  if (!res.ok) { console.error("insert failed:", res.status, await res.text()); process.exit(1); }
  console.log(`Queued ${toInsert.length} draft(s) at status='draft'. Enrich via the Concierge Drafting routine, then judge in the Studio.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
