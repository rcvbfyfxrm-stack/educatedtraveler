#!/usr/bin/env node
// Emails must stay readable on a WHITE page.
//
// Why this exists: the Circle letters used to set background:#0d0b09 on <body>
// and near-white text on top. Gmail drops <body> styling and renders on its own
// white background — so the letters arrived as pale text on white, effectively
// invisible. A friend of Arnaud's got one in July 2026 and couldn't read it.
//
// The rules below encode the lesson: never let legibility depend on a background
// surviving the trip. Run: node scripts/check-email-contrast.mjs
//
// The website is exempt — it is Warm-Dark on purpose and renders in a browser,
// which does not strip anything. This is only about mail.

import { readFileSync, existsSync } from "node:fs";

const FILES = [
  "supabase/functions/_shared/circle-emails.ts",
  "supabase/functions/concierge-send/index.ts",
  "supabase/functions/notify-lead/index.ts",
  "supabase/functions/notify-portrait/index.ts",
  "supabase/functions/notify/index.ts",
  "supabase/functions/notify-instructor-application/index.ts",
  "supabase/functions/notify-instructor-enrollment/index.ts",
  "supabase/functions/send-welcome-email/index.ts",
  "supabase/functions/send-receipt-email/index.ts",
  "supabase/functions/send-followup-emails/index.ts",
  "supabase/functions/send-balance-reminders/index.ts",
  "supabase/functions/confirm-enrollment/index.ts",
  "supabase/functions/invite-instructor/index.ts",
  "supabase/functions/handle-interest/index.ts",
  "supabase/functions/send-reservation-email/index.ts",
  "docs/email-templates/auth-magic-link.html",
  "docs/email-templates/auth-confirm-signup.html",
  "docs/email-templates/auth-reset-password.html",
  "docs/email-templates/auth-change-email.html",
  "marketing/circle/welcome-email.html",
  "marketing/circle/issue-01.html",
  "marketing/circle/issue-02.html",
  "marketing/circle/issue-03.html",
];

const hex = (h) => {
  const s = h.replace("#", "");
  const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Each CSS run is one declaration block. Four shapes occur in this repo, and the
// first version of this check only knew about the first two — which let a
// nested escaped-quote span and a <style> rule through. Keep all four.
function blocks(src) {
  const out = [];
  const res = [
    /style="([^"]*)"/g, // style="..."
    /const \w+ = "([^"]*)"/g, // const P = "color:...;"
    /style=\\"([^"\\]*)\\"/g, // nested span inside a template literal
  ];
  for (const re of res) for (const m of src.matchAll(re)) out.push(m[1]);
  // <style> blocks: Gmail strips these entirely, so anything relying on them is
  // already fragile — but check the colours anyway for the clients that keep them.
  for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    for (const rule of m[1].split("}")) out.push(rule.replace(/^[^{]*\{/, ""));
  }
  return out;
}

// Some functions serve a browser page AND send an email from the same file. A
// page renders in a real browser, which strips nothing, so Warm-Dark is correct
// there. Mark those literals and they drop out of this check.
const SKIP = "EMAIL-CHECK: SKIP";
function emailOnly(src) {
  if (!src.includes(SKIP)) return src;
  const docs = src.split(/(?=<!DOCTYPE html>)/i);
  return docs.filter((d, i) => !(i > 0 && docs[i - 1].slice(-260).includes(SKIP))).join("");
}

const problems = [];

for (const file of FILES) {
  if (!existsSync(file)) continue;
  const src = emailOnly(readFileSync(file, "utf8"));

  // 1. rgba() text is unreliable — Outlook's Word engine ignores it, and an
  //    alpha colour silently becomes its background wherever it lands.
  for (const m of src.matchAll(/color:\s*rgba\([^)]*\)/g)) {
    problems.push(`${file}: rgba() text colour — use a solid hex (${m[0]})`);
  }

  // 2. A dark <body> background is decoration, never the thing that makes text
  //    readable. Gmail throws it away.
  for (const m of src.matchAll(/<body[^>]*background:\s*(#[0-9a-fA-F]{3,6})/g)) {
    if (ratio(m[1], "#ffffff") > 4.5) {
      problems.push(`${file}: <body> sets dark background ${m[1]} — mail clients strip it`);
    }
  }

  // 3. Every text colour must clear WCAG AA against a white page, unless its own
  //    block paints a solid background underneath it (buttons, tinted cards).
  for (const b of blocks(src)) {
    const c = b.match(/(?:^|;)\s*color:\s*(#[0-9a-fA-F]{3,6})/);
    if (!c) continue;
    const own = b.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/);
    const bg = own ? own[1] : "#ffffff";
    const size = parseFloat((b.match(/font-size:\s*([\d.]+)px/) || [])[1] || "14");
    const need = size >= 18 ? 3.0 : 4.5;
    const got = ratio(c[1], bg);
    if (got < need) {
      problems.push(
        `${file}: ${c[1]} on ${bg} at ${size}px — contrast ${got.toFixed(2)}, needs ${need}`,
      );
    }
  }
}

if (problems.length) {
  console.error(`\nEmail legibility check FAILED (${problems.length}):\n`);
  for (const p of problems) console.error("  ✗ " + p);
  console.error("\nAn email must be readable on a white page. See the note at the top of this file.\n");
  process.exit(1);
}
console.log(`Email legibility check passed — ${FILES.filter(existsSync).length} templates readable on white.`);
