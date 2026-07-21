#!/usr/bin/env node
// concierge-publish.mjs — turn APPROVED concierge rows into real Atlas discipline
// pages, then stamp them published. Runs only for rows Arnaud approved in the
// Studio (status='approved', atlas_action='create'). Never invents a page from an
// unapproved row. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Pass --dry to skip writes/stamps.
//
//   node scripts/concierge-publish.mjs [--dry] [--row <id>]
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.SUPABASE_URL || "https://exaehwaqwcledemwpluw.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
const rowArg = process.argv.includes("--row") ? process.argv[process.argv.indexOf("--row") + 1] : null;
if (!KEY) { console.error("missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// minimal, safe markdown -> HTML for the sheet body
function mdToHtml(md) {
  const lines = String(md || "").replace(/\r/g, "").split("\n");
  let html = "", inList = false, inTable = false;
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  const closeTable = () => { if (inTable) { html += "</tbody></table>"; inTable = false; } };
  for (let raw of lines) {
    const line = raw.trimEnd();
    if (/^\|(.+)\|$/.test(line) && /\|/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue; // separator row
      const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
      if (!inTable) { html += '<table class="sheet-tbl"><tbody>'; inTable = true; }
      html += "<tr>" + cells.map((c) => "<td>" + c + "</td>").join("") + "</tr>";
      continue;
    } else closeTable();
    if (/^#{1,6}\s/.test(line)) { closeList(); const n = line.match(/^#+/)[0].length; const lvl = Math.min(n + 1, 4); html += `<h${lvl}>${inline(line.replace(/^#+\s/, ""))}</h${lvl}>`; }
    else if (/^---+$/.test(line)) { closeList(); html += "<hr>"; }
    else if (/^\s*[-*]\s+/.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += "<li>" + inline(line.replace(/^\s*[-*]\s+/, "")) + "</li>"; }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); html += "<p>" + inline(line) + "</p>"; }
  }
  closeList(); closeTable();
  return html;
}

function page(row) {
  const title = row.skill_title || row.skill_raw || "A craft";
  const slug = row.skill_slug;
  const url = `https://educatedtraveler.app/atlas/${slug}`;
  const body = mdToHtml(row.skill_sheet_md);
  const world = row.world || "";
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Learn ${esc(title)} — where the craft is alive, the schools &amp; the community | EducatedTraveler</title>
<meta name="description" content="A field guide to ${esc(title)}: what it really is, where it's taught to a standard that counts, and how you'd use it. Curated by hand, no pay-to-play.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="Learn ${esc(title)} — EducatedTraveler"><meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:image" content="https://educatedtraveler.app/images/logo-et-full.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script defer data-domain="educatedtraveler.app" src="https://plausible.io/js/script.js"></script>
<style>
:root{--ink:#0d0b09;--ink2:#14110d;--paper:#f3ede2;--sea:#7fa8a5;--ember:#d28a52;--line:rgba(243,237,226,0.09);--muted:rgba(243,237,226,0.72);}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',system-ui,sans-serif;background:var(--ink);color:var(--paper);font-weight:300;line-height:1.7;-webkit-font-smoothing:antialiased;}
.serif{font-family:'Fraunces',Georgia,serif;} .mono{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--sea);}
a{color:inherit;} .wrap{max-width:760px;margin:0 auto;padding:0 24px;}
nav.top{position:sticky;top:0;background:rgba(13,11,9,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);z-index:50;}
nav.top .wrap{max-width:1100px;display:flex;justify-content:space-between;align-items:center;height:60px;}
nav.top a{text-decoration:none;opacity:.7;font-size:14px;} nav.top a:hover{opacity:1;color:var(--sea);}
.brand{font-family:'IBM Plex Mono',monospace;letter-spacing:.14em;font-size:13px;opacity:1 !important;}
header.hero{padding:66px 0 30px;border-bottom:1px solid var(--line);}
h1{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:clamp(30px,5vw,46px);line-height:1.12;margin:12px 0 10px;}
.article{padding:36px 0 10px;}
.article h2{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:26px;margin:34px 0 12px;line-height:1.2;}
.article h3{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:20px;margin:26px 0 10px;color:var(--paper);}
.article h4{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--sea);margin:22px 0 8px;}
.article p{margin:0 0 14px;color:var(--muted);font-size:16px;}
.article ul{margin:0 0 16px 20px;} .article li{margin:0 0 7px;color:var(--muted);}
.article a{color:var(--sea);text-decoration:none;border-bottom:1px solid rgba(127,168,165,.3);} .article a:hover{border-color:var(--sea);}
.article hr{border:none;border-top:1px solid var(--line);margin:32px 0;}
.article strong{color:var(--paper);font-weight:500;} .article code{font-family:'IBM Plex Mono',monospace;font-size:.9em;background:rgba(243,237,226,.06);padding:1px 5px;border-radius:4px;}
.sheet-tbl{width:100%;border-collapse:collapse;margin:0 0 18px;font-size:14.5px;} .sheet-tbl td{border:1px solid var(--line);padding:9px 12px;vertical-align:top;color:var(--muted);}
.cta{display:inline-block;margin-top:10px;padding:13px 26px;border-radius:99px;text-decoration:none;color:var(--paper);font-size:14px;background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%);}
section.trust{padding:40px 0;border-top:1px solid var(--line);background:var(--ink2);margin-top:30px;}
.intent{border:1px solid var(--line);border-radius:12px;padding:20px 22px;background:rgba(243,237,226,0.02);margin:26px 0 0;}
.intent-q{font-size:15px;opacity:.82;margin-bottom:12px;} .intent-row{display:flex;gap:8px;flex-wrap:wrap;}
.intent-input{flex:1 1 220px;background:rgba(243,237,226,0.04);border:1px solid rgba(243,237,226,0.16);border-radius:99px;padding:11px 16px;color:var(--paper);font-size:14px;}
.intent-go{border:none;border-radius:99px;padding:11px 22px;font-size:14px;font-weight:500;color:#14110d;cursor:pointer;background:linear-gradient(135deg,var(--sea) 0%,var(--ember) 130%);}
footer{padding:40px 0 60px;font-size:13px;opacity:.5;} footer a{color:var(--sea);}
</style></head>
<body>
<nav class="top"><div class="wrap">
<a class="brand" href="/">EDUCATEDTRAVELER</a>
<div style="display:flex;gap:22px"><a href="/atlas/">Atlas</a><a href="/about">About</a><a href="/journal/">Journal</a><a href="/circle">The Circle</a></div>
</div></nav>
<header class="hero"><div class="wrap">
<div class="mono"><a href="/atlas/" style="text-decoration:none">Atlas</a>${world ? " / " + esc(world) : ""}</div>
<h1>${esc(title)}</h1>
<p class="mono" style="color:var(--ember);text-transform:none;letter-spacing:0;font-size:12.5px;opacity:.8;">Added to the Atlas because a member of the Circle asked to learn it.</p>
</div></header>
<main class="article"><div class="wrap">
${body}
<div class="intent" style="margin-top:34px;"><p class="intent-q">${esc(title)} pulls you? Leave an email — I'll introduce you to the right place and the right people as the map grows.</p>
<form data-discipline="${esc(slug)}" data-label="${esc(title)}" data-source="atlas:${esc(slug)}"><div class="intent-row"><input type="email" name="email" required placeholder="you@email.com" class="intent-input"><button type="submit" class="intent-go">Raise your hand</button></div><p class="intent-msg" hidden></p></form></div>
</div></main>
<section class="trust"><div class="wrap">
<div class="mono">Why you can trust this map</div>
<h2 class="serif" style="font-size:20px;margin:8px 0 12px;">What I check before I send you anywhere</h2>
<p style="color:var(--muted);font-size:15px;">I'm Arnaud. Every school here has to clear the same bar: the craft is actually alive there, there's a named teacher, the credential is what it claims to be, and nobody paid to be listed. Where I'm still verifying something, I say so. If I wouldn't send a friend, it isn't here.</p>
<a class="cta" href="/circle" style="margin-top:18px;">Join the Circle</a>
</div></section>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/supabase-config.js"></script>
<script src="/js/intent-capture.js" defer></script>
<footer><div class="wrap">EducatedTraveler — a bridge, not a shop. We connect you to the place, the person, and your people. <a href="/circle">Join the Circle</a>.<br><span style="opacity:.75">Privacy-light, cookieless analytics — no personal data, no tracking cookies.</span></div></footer>
</body></html>`;
}

async function main() {
  let q = `${URL}/rest/v1/concierge_queue?select=*&status=eq.approved&atlas_action=eq.create`;
  if (rowArg) q += `&id=eq.${rowArg}`;
  const rows = await (await fetch(q, { headers: H })).json();
  if (!Array.isArray(rows) || !rows.length) { console.log("no approved rows to publish"); return; }
  mkdirSync("website/atlas", { recursive: true });
  for (const row of rows) {
    if (!row.skill_slug) { console.log("skip (no slug):", row.id); continue; }
    const file = join("website/atlas", row.skill_slug + ".html");
    const html = page(row);
    if (DRY) { console.log(`[dry] would write ${file} (${html.length} bytes) and stamp published`); continue; }
    writeFileSync(file, html);
    const url = `https://educatedtraveler.app/atlas/${row.skill_slug}`;
    await fetch(`${URL}/rest/v1/concierge_queue?id=eq.${row.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "published", atlas_url: url, published_at: new Date().toISOString() }),
    });
    console.log(`published ${file} -> ${url}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
