#!/usr/bin/env node
// refresh-vouches.mjs — pull the checks that real people signed into the build.
//
// A vouch is written by a signed-in member on /you. It lands `pending` and it
// stays invisible until Arnaud approves it AND the person consented to it being
// public. Only rows that clear BOTH end up here, keyed by destination id, and
// scripts/build-atlas-pages.py merges them into that place's `check`.
//
//   node scripts/refresh-vouches.mjs [--dry] [--allow-shrink]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. RLS hides this table from the
// anon key and returns 200 [] rather than an error, which is why an empty answer
// is treated as a FAILURE below and never as "nobody vouched".
//
// ── WHY A FAILED FETCH WRITES NOTHING ────────────────────────────────────────
// The file it produces is evidence: it is what lets a craft show more than three
// dots. A timeout that quietly wrote {} would silently un-check every place a
// real person signed for, and the next build would publish that as the truth.
// So: any error, any non-200, any empty array → write nothing, exit non-zero.
// A shrink is legitimate (Arnaud can retract one) but it must be asked for.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "atlas-vouches.json");
const BASE = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
const ALLOW_SHRINK = process.argv.includes("--allow-shrink");

const die = (m) => { console.error("refresh-vouches: " + m); process.exit(1); };
if (!KEY) die("no SUPABASE_SERVICE_ROLE_KEY in the environment — refusing to write.");

const url = `${BASE}/rest/v1/vouches`
  + `?select=destination,state,display_name,trade,visited_on,route,what,created_at`
  + `&status=eq.approved&consent_public=is.true&order=created_at.asc`;

let rows;
try {
  const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) die(`Supabase returned ${r.status} — writing nothing.`);
  rows = await r.json();
} catch (e) { die(`fetch failed (${e.message}) — writing nothing.`); }

if (!Array.isArray(rows)) die("unexpected payload — writing nothing.");
if (!rows.length) die("zero approved vouches came back. That is either true and harmless, "
  + "or RLS hid the table. Either way this writes nothing; delete data/atlas-vouches.json "
  + "by hand if you really mean to clear it.");

// One check per place: the earliest approved vouch is the one that stands, and a
// second is what lifts the craft to five. Later ones are kept in `also`.
const out = {};
for (const v of rows) {
  const entry = {
    state: v.state, by: v.display_name, trade: v.trade,
    date: new Date(v.visited_on + "T00:00:00Z").toLocaleDateString("en-GB",
            { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    route: v.route, what: v.what
  };
  if (!out[v.destination]) out[v.destination] = entry;
  else (out[v.destination].also ||= []).push(entry);
}

const before = existsSync(OUT) ? Object.keys(JSON.parse(readFileSync(OUT, "utf8"))).length : 0;
const after = Object.keys(out).length;
if (after < before && !ALLOW_SHRINK) {
  die(`this would drop ${before - after} place(s) that currently carry a signed check. `
    + "If a vouch was genuinely retracted, re-run with --allow-shrink.");
}
console.log(`refresh-vouches: ${rows.length} approved vouch(es) across ${after} place(s)`
  + (before ? ` (was ${before})` : ""));
if (DRY) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote data/atlas-vouches.json`);
