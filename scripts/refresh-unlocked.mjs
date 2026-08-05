#!/usr/bin/env node
// refresh-unlocked.mjs — work out which crafts the Circle has actually asked for,
// and write that answer to data/atlas-unlocked.json.
//
// A craft is OPEN when at least one real person has named it: in the /circle
// questionnaire, on a "raise your hand" form, in a letter from an Atlas sheet, or
// in a concierge_queue row drafted from one of those. Everything else stays a
// short sheet until somebody asks. That file is what scripts/build-atlas-pages.py
// reads, so `git log data/atlas-unlocked.json` is the record of when each craft
// opened and off how many hands.
//
//   node scripts/refresh-unlocked.mjs [--dry] [--allow-shrink]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role — RLS hides these
// tables from the anon key and returns 200 [] rather than an error, which is why
// "empty" is treated as a failure below, not as an answer).
//
// ── THE MONOTONIC FLOOR ──────────────────────────────────────────────────────
// This file only ever grows. A fetch that fails, times out, or comes back empty
// writes NOTHING and exits non-zero: the committed file keeps its last value, the
// site still builds, and every craft that was open stays open. A red run is the
// alarm. Never catch an error and write {} — that would relock the whole Atlas and
// wipe the real research out of the working tree in one commit.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "atlas-unlocked.json");
const URL_BASE = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
const ALLOW_SHRINK = process.argv.includes("--allow-shrink");

if (!KEY) die("missing SUPABASE_SERVICE_ROLE_KEY — refusing to guess. data/atlas-unlocked.json left untouched.");
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

function die(msg) { console.error("refresh-unlocked: " + msg); process.exit(1); }

// ── the site's canonical slug (mirror of website/js/studio-people.js) ──
const slugify = (s) => String(s || "").toLowerCase().replace(/&/g, " and ")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// World words. Someone picking "the Wild" has not asked for a craft, and these
// have shown up in concierge_queue as junk rows with atlas_action='create'.
const BUCKETS = new Set(["healing", "wild", "ocean", "kitchen", "craft", "body", "movement",
  "wellness", "adventure", "creative", "culinary"]);

// The legacy topic chips on the old dashboard form (website/dashboard.html). Three of
// them — photography, surfing, freediving — are byte-identical to real craft slugs, so
// a naive match would open a sheet off somebody tapping a topic chip years ago and
// never writing a word. Only applied to the profiles.interests source.
const CHIPS = new Set(["photography", "surfing", "freediving", "meditation", "breathwork",
  "pastry", "wine", "fire-cooking", "fermentation", "woodwork", "sushi", "sailing",
  "yoga", "diving", "climbing", "cooking", "dance", "music", "craft", "language"]);

// Named by hand, not guessed — each maps a real thing people wrote to the sheet that answers it.
const ALIAS = {
  "lymphatic-drainage-massage": "lymphatic-drainage",
  "self-sufficient-agriculture-farming-and-food-preservation": "self-sufficiency",
  "avant-garde-and-modernist-technique": "modern-new-technique-cuisine",
};

// ── the index of everything a craft can be called ──
function buildIndex() {
  const src = readFileSync(join(ROOT, "data", "repertoire.js"), "utf8");
  const data = JSON.parse(src.slice(src.indexOf("{", src.indexOf("window.ET_ATLAS")), src.lastIndexOf("}") + 1));
  const idx = new Map();
  const put = (k, slug) => { if (k && !idx.has(k)) idx.set(k, slug); };
  for (const d of data.disciplines) {
    put(d.id, d.id);
    put(slugify(d.id), d.id);
    put(slugify(d.discipline), d.id);
    for (const x of d.destinations || []) put(x.id, d.id);   // a destination implies its craft
  }
  const manifest = JSON.parse(readFileSync(join(ROOT, "data", "atlas-extra-sheets.json"), "utf8"));
  for (const slug of manifest.pinnedOpen || []) put(slug, slug);
  for (const c of manifest.hubCards || []) put(slugify(c.discipline), c.id);
  return idx;
}

// The one resolution rule. Anything it can't place is LOGGED, never guessed.
function resolve(raw, idx, source) {
  const k = slugify(raw);
  if (!k) return null;
  if (source === "profiles" && CHIPS.has(k)) return null;
  if (BUCKETS.has(k)) return null;
  if (ALIAS[k]) return ALIAS[k];
  if (idx.has(k)) return idx.get(k);
  if (k.includes("--")) {
    const parent = k.split("--")[0];
    if (ALIAS[parent]) return ALIAS[parent];
    if (idx.has(parent)) return idx.get(parent);
  }
  return null;
}

async function get(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, { headers: H });
  if (!res.ok) die(`${path} -> HTTP ${res.status}. Nothing written.`);
  const body = await res.json();
  if (!Array.isArray(body)) die(`${path} -> unexpected body. Nothing written.`);
  return body;
}

// interests comes in several shapes in prod. Parse defensively, lose nothing.
function craftsIn(interests) {
  const out = [];
  const push = (v) => { if (v) out.push(String(v)); };
  if (Array.isArray(interests)) {
    for (const it of interests) {
      if (typeof it === "string") push(it);
      else if (it && typeof it === "object") {
        if (it.kind === "discipline" || it.kind === "addon" || !it.kind) {
          push(it.slug); push(it.discipline); push(it.label); push(it.place);
        }
      }
    }
  } else if (interests && typeof interests === "object") {
    for (const v of Object.values(interests)) {
      if (Array.isArray(v)) v.forEach(push);
      else push(v);
    }
  }
  return out;
}

async function main() {
  const idx = buildIndex();

  // One person = one lower(email), unified across every table. Without this the
  // count inflates 2-3x: a concierge row is derived from that person's waitlist
  // row, and migration 029 copies waitlist crafts onto their profile.
  const hands = new Map();          // slug -> Set(email)
  const dropped = new Map();        // raw -> count, for the log
  const note = (slug, email) => {
    if (!hands.has(slug)) hands.set(slug, new Set());
    hands.get(slug).add(String(email || "").toLowerCase().trim() || "anon:" + Math.random());
  };
  const drop = (raw) => dropped.set(raw, (dropped.get(raw) || 0) + 1);

  const waitlist = await get("launch_waitlist?select=email,interests,source");
  for (const r of waitlist) for (const raw of craftsIn(r.interests)) {
    const s = resolve(raw, idx, "waitlist"); s ? note(s, r.email) : drop(raw);
  }

  const queue = await get("concierge_queue?select=lead_email,skill_slug,skill_title");
  for (const r of queue) for (const raw of [r.skill_slug, r.skill_title]) {
    const s = resolve(raw, idx, "concierge"); if (s) { note(s, r.lead_email); break; }
    if (raw) drop(raw);
  }

  const profiles = await get("profiles?select=email,interests");
  for (const r of profiles) for (const raw of craftsIn(r.interests)) {
    const s = resolve(raw, idx, "profiles"); s ? note(s, r.email) : drop(raw);
  }

  // Gate 2 — empty is an error even on HTTP 200. RLS answers the anon key with
  // 200 [] rather than 401, so silence is indistinguishable from "no demand".
  if (!waitlist.length) die("launch_waitlist came back empty — that is a wrong key or an outage, not an answer. Nothing written.");
  if (!hands.size) die("no craft resolved from any table. Nothing written.");

  const open = {};
  for (const [slug, emails] of [...hands].sort()) open[slug] = emails.size;

  // Gate 3 — the shrink guard. Unlocking is one-way.
  if (existsSync(OUT)) {
    const prev = JSON.parse(readFileSync(OUT, "utf8")).open || {};
    const lost = Object.keys(prev).filter((s) => !(s in open));
    if (lost.length) {
      if (!ALLOW_SHRINK) {
        die(`${lost.length} craft(s) would close again: ${lost.join(", ")}\n` +
            "  Opening is one-way — a craft that closes means a row was deleted or the rule changed.\n" +
            "  Re-run with --allow-shrink if that is deliberate. Nothing written.");
      }
      // --allow-shrink means close them. Restoring them here would make the flag a
      // no-op and leave a craft's full sheet published with no demand behind it.
      console.log(`--allow-shrink: closing ${lost.length} craft(s): ${lost.join(", ")}`);
    }
  }

  const payload = { generated_at: new Date().toISOString().slice(0, 10), open };
  const json = JSON.stringify(payload, null, 2) + "\n";

  console.log(`open: ${Object.keys(open).length} craft(s) — ${Object.entries(open).map(([s, n]) => `${s}:${n}`).join(", ")}`);
  if (dropped.size) {
    console.log(`\nunresolved (left closed, never guessed) — promote any by hand in ALIAS:`);
    for (const [raw, n] of [...dropped].sort((a, b) => b[1] - a[1])) console.log(`  ${n}x  ${raw}`);
  }
  if (DRY) { console.log("\n[dry] nothing written"); return; }
  writeFileSync(OUT, json);
  console.log(`\nwrote ${OUT}`);
}

main().catch((e) => die(String(e && e.stack || e)));
