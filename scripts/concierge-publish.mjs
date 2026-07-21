#!/usr/bin/env node
// concierge-publish.mjs — publish APPROVED concierge rows as live /atlas pages,
// then stamp them published. Runs only for rows Arnaud approved in the Studio
// (status='approved', atlas_action='create'). Never invents a page from an
// unapproved row. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Pass --dry to skip writes/stamps.
//
// The completed page is normally already built overnight and stored in
// row.page_html (what Arnaud previewed and approved is byte-identical to what
// goes live). If page_html is missing, fall back to rendering from the sheet.
//
//   node scripts/concierge-publish.mjs [--dry] [--row <id>]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderAtlasPage } from "./atlas-page.mjs";

const URL = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
const rowArg = process.argv.includes("--row") ? process.argv[process.argv.indexOf("--row") + 1] : null;
if (!KEY) { console.error("missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function main() {
  let q = `${URL}/rest/v1/concierge_queue?select=*&status=eq.approved&atlas_action=eq.create`;
  if (rowArg) q += `&id=eq.${rowArg}`;
  const rows = await (await fetch(q, { headers: H })).json();
  if (!Array.isArray(rows) || !rows.length) { console.log("no approved rows to publish"); return; }
  mkdirSync("website/atlas", { recursive: true });
  for (const row of rows) {
    if (!row.skill_slug) { console.log("skip (no slug):", row.id); continue; }
    const file = join("website/atlas", row.skill_slug + ".html");
    // prefer the page built + previewed overnight; render only as a fallback
    const html = (row.page_html && String(row.page_html).trim()) ? row.page_html : renderAtlasPage(row);
    const built = (row.page_html && String(row.page_html).trim()) ? "stored" : "rendered";
    if (DRY) { console.log(`[dry] would write ${file} (${html.length} bytes, ${built}) and stamp published`); continue; }
    writeFileSync(file, html);
    const url = `https://educatedtraveler.app/atlas/${row.skill_slug}`;
    await fetch(`${URL}/rest/v1/concierge_queue?id=eq.${row.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "published", atlas_url: url, published_at: new Date().toISOString() }),
    });
    console.log(`published ${file} -> ${url} (${built})`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
