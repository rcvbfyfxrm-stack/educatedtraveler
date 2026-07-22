#!/usr/bin/env node
// simplify-nav.mjs — quiet the top of the reading pages, move the destinations to
// the end where they make sense. For every Atlas page + Journal page:
//   1. strip the top-nav link list -> wordmark only (a magazine masthead)
//   2. add, at the foot: a warm contextual "where this leads" line + a compact
//      nav row (Atlas · Journal · Lab Weeks · Story · The Circle)
// Idempotent: skips a file already carrying the marker. Surgical (never regenerates)
// so all page content — ratings, sources, everything — is preserved verbatim.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MARK = "et-foot-nav"; // idempotency marker

// the link list that sits in the top nav on both page types (exact generated string)
const NAV_LINKS_RE = /<div style="display:flex;gap:22px">(?:\s*<a[^>]*>[^<]*<\/a>)+\s*<\/div>/;

const footNav = () =>
  `<div class="${MARK}" style="display:flex;gap:20px;flex-wrap:wrap;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 16px;">` +
  `<a href="/atlas/" style="color:var(--sea);text-decoration:none;">Atlas</a>` +
  `<a href="/journal/" style="color:var(--sea);text-decoration:none;">Journal</a>` +
  `<a href="/lab-weeks" style="color:var(--sea);text-decoration:none;">Lab Weeks</a>` +
  `<a href="/about" style="color:var(--sea);text-decoration:none;">Story</a>` +
  `<a href="/circle" style="color:var(--sea);text-decoration:none;">The Circle</a></div>`;

const contextAtlas =
  `<p style="opacity:.82;margin:0 0 16px;max-width:60ch;line-height:1.7;">One page of a larger map. ` +
  `<a href="/atlas/" style="color:var(--sea);">Wander the rest of the Atlas</a> for the other crafts and where they're alive, ` +
  `read the longer stories in the <a href="/journal/" style="color:var(--sea);">Journal</a>, ` +
  `and when a week takes shape near what pulls you, <a href="/circle" style="color:var(--sea);">the Circle</a> is how I open the door.</p>`;

const contextJournal =
  `<p style="opacity:.82;margin:0 0 16px;max-width:60ch;line-height:1.7;">A letter from the Journal. ` +
  `The crafts it points to live on the <a href="/atlas/" style="color:var(--sea);">Atlas</a>, ` +
  `there are more stories <a href="/journal/" style="color:var(--sea);">here</a>, ` +
  `and when a week takes shape near what pulls you, <a href="/circle" style="color:var(--sea);">the Circle</a> is how I open the door.</p>`;

function transform(html, kind) {
  if (html.includes(MARK)) return null; // already done
  let out = html;
  // 1) strip the top-nav links -> wordmark only
  if (NAV_LINKS_RE.test(out)) out = out.replace(NAV_LINKS_RE, "");
  else return null; // no recognizable nav list; leave untouched
  // 2) inject the contextual line + foot nav right after the footer opens
  const ctx = kind === "journal" ? contextJournal : contextAtlas;
  out = out.replace(/<footer>\s*<div class="wrap">/, (m) => m + ctx + footNav());
  return out;
}

function run(dir, kind) {
  let done = 0, skipped = 0;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".html")) continue;
    const path = join(dir, f);
    const html = readFileSync(path, "utf8");
    const next = transform(html, kind);
    if (next && next !== html) { writeFileSync(path, next); done++; }
    else skipped++;
  }
  console.log(`${dir}: ${done} simplified, ${skipped} skipped`);
}

run("website/atlas", "atlas");
run("website/journal", "journal");
