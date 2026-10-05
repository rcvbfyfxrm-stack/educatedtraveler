#!/usr/bin/env node
// Tests the email that week-answers sends, without sending it.
//
// It imports supabase/functions/week-answers/sheet.ts itself — the real cleaner
// and renderer, not a copy — runs it against hostile and ordinary input, writes
// the sample sheet to the system temp folder so it can be opened and looked at,
// and prints the hash that the deployed function's dry run must return:
//
//   curl -s -X POST https://<project>.supabase.co/functions/v1/week-answers \
//        -H "Authorization: Bearer <anon key>" -H "Content-Type: application/json" \
//        -d '{"dryRun":true}'
//
// Same sha256 → what is deployed is what this file just checked.
//
// Run from the repo root:  node scripts/preview-week-answers.mjs
// Needs Node 22.18 or newer (it imports a .ts file directly). Not part of CI.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sheet = await import("../supabase/functions/week-answers/sheet.ts");
const {
  clean, roomFrom, lastAnswerAt, subjectFor, sheetHtml, sheetText, toStore,
  SAMPLE, SAMPLE_OPTS, SAMPLE_ROWS, WEEK, SLUG, REV,
} = sheet;

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (e) {
    console.error("\n✗ " + name + "\n  " + String(e.message).split("\n").join("\n  "));
    process.exitCode = 1;
  }
}

const base = (over = {}) => ({
  v: 1, week: WEEK, test: false, name: "Karim Example", email: "karim@example.com",
  answers: [
    { id: "first-table", label: "The night before: one table, one set menu", answer: "yes" },
    { id: "boqueria", label: "La Boqueria at 08:00", answer: "no" },
  ],
  dates: [{ id: "in-wed-21", label: "Wednesday 21 October", answer: "yes" }],
  note: "",
  ...over,
});
const opts = (over = {}) => ({ when: "Mon 5 Oct 2026, 12:00 (Madrid)", stored: true, room: null, replacesAt: "", ...over });
const ok = (input) => { const c = clean(input); assert.equal(c.ok, true, "expected a clean answer, got " + JSON.stringify(c)); return c.value; };

// ── ordinary answers ─────────────────────────────────────────────────────────
check("a typical answer renders yes and no, the date and the name", () => {
  const c = ok(base());
  const html = sheetHtml(c, opts({ room: roomFrom([], c) }));
  assert.match(html, /Karim Example would come to 1 of the 2\./);
  assert.match(html, /The night before: one table, one set menu<\/td><td[^>]*>Yes</);
  assert.match(html, /La Boqueria at 08:00<\/td><td[^>]*>No</);
  assert.match(html, /Wednesday 21 October<\/td><td[^>]*>Yes</);
  assert.match(html, /mailto:karim@example\.com/);
  assert.match(html, /Saved to the record\./);
  assert.equal(subjectFor(c, false), "Around the week · Karim Example · 1 of 2");
});

check("all no is a valid answer and says so", () => {
  const c = ok(base({ answers: base().answers.map((a) => ({ ...a, answer: "no" })) }));
  assert.equal(subjectFor(c, false), "Around the week · Karim Example · 0 of 2");
  assert.match(sheetHtml(c, opts()), /would come to 0 of the 2\./);
});

check("a changed answer is marked in the subject and on the sheet", () => {
  const c = ok(base());
  assert.match(subjectFor(c, true), / · changed$/);
  assert.match(sheetHtml(c, opts({ replacesAt: "Sun 4 Oct 2026, 09:00 (Madrid)" })), /This replaces the answer they sent on Sun 4 Oct 2026/);
});

check("a test answer is labelled TEST in the subject and on the sheet", () => {
  const c = ok(base({ test: true }));
  assert.match(subjectFor(c, false), /^\[TEST\] /);
  assert.match(sheetHtml(c, opts()), /TEST &middot; Around the five days/);
});

check("a failed store is said out loud, never hidden", () => {
  const html = sheetHtml(ok(base()), opts({ stored: false }));
  assert.match(html, /NOT saved to the record this time/);
});

check("a failed tally still renders the whole answer", () => {
  const html = sheetHtml(ok(base()), opts({ room: null }));
  assert.match(html, /The count could not be read this time/);
  assert.match(html, /La Boqueria at 08:00/);
});

// ── hostile input ────────────────────────────────────────────────────────────
check("markup typed into the name, a label and the text box arrives as text", () => {
  const c = ok(base({
    name: '<script>alert(1)</script> Bob',
    answers: [{ id: "boqueria", label: '<img src=x onerror=alert(1)>', answer: "yes" }],
    note: '<a href="https://evil.example">click</a> & "quotes" \'single\'',
  }));
  const html = sheetHtml(c, opts({ room: roomFrom([], c) }));
  assert.equal(/<script/i.test(html), false, "raw <script> reached the sheet");
  assert.equal(/<img/i.test(html), false, "raw <img> reached the sheet");
  assert.equal(/href="https:\/\/evil/i.test(html), false, "a sender's link became a real link");
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; Bob/);
  assert.match(html, /&lt;a href=&quot;https:\/\/evil\.example&quot;&gt;click&lt;\/a&gt;/);
  // the only links on the sheet are the mailto: built from the validated address
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ["mailto:karim@example.com"]);
});

check("addresses that could carry a second recipient or a header are refused", () => {
  for (const bad of [
    "", "no-at-sign", "a@b", "a@b.c, evil@x.y", "a@b.c;evil@x.y", '"a"@b.c', "<a@b.c>",
    "a@b.c\nBcc: evil@x.y", "a b@c.d", "a@@b.c", "a@b.c'", "x".repeat(251) + "@b.c",   // 255 characters
  ]) {
    const c = clean(base({ email: bad }));
    assert.equal(c.ok, false, "accepted a bad address: " + JSON.stringify(bad));
    assert.equal(c.error, "email_invalid");
  }
});

check("a line break in the name cannot add a line to the subject", () => {
  const c = ok(base({ name: "Karim\r\nBcc: evil@x.y" }));
  const s = subjectFor(c, false);
  assert.equal(/[\r\n]/.test(s), false);
  assert.equal(c.name, "Karim Bcc: evil@x.y");
});

check("bidi and zero-width characters are stripped from names and labels", () => {
  const c = ok(base({ name: "Ka‮rim​ X", answers: [{ id: "a", label: "La⁦bel", answer: "yes" }] }));
  assert.equal(/[​-‏‪-‮⁦-⁩]/.test(c.name + c.items[0].label), false);
});

check("over-long text is cut at the cap and the cut is shown", () => {
  const c = ok(base({ note: "word ".repeat(4000), name: "N".repeat(500) }));
  assert.equal(c.words.length, 1500);
  assert.equal(c.cut, true);
  assert.equal(c.name.length, 80);
  assert.match(sheetHtml(c, opts()), /Cut at 1,500 characters/);
});

check("line breaks in the text box survive; runs of blank lines do not", () => {
  const c = ok(base({ note: "one\r\ntwo\n\n\n\n\nthree" }));
  assert.equal(c.words, "one\ntwo\n\nthree");
});

check("five hundred answers: twenty are kept and the rest are counted", () => {
  const many = Array.from({ length: 500 }, (_, i) => ({ id: "opt-" + i, label: "Option " + i, answer: "yes" }));
  const c = ok(base({ answers: many }));
  assert.equal(c.items.filter((i) => i.group === "pick").length, 20);
  assert.equal(c.dropped, 480);
  assert.match(sheetHtml(c, opts()), /480 more entries were over the limit/);
});

check("answers that are not answers are kept as text, never dropped silently", () => {
  const c = ok(base({ answers: [
    { id: "Bad ID!", label: "x", answer: "yes" }, { id: "ok", label: "", answer: "yes" },
    { id: "maybe", label: "Maybe", answer: "perhaps" }, "a string", 42, null,
    { id: "boqueria", label: "La Boqueria", answer: "yes" }, { id: "boqueria", label: "again", answer: "no" },
  ] }));
  assert.deepEqual(c.items.filter((i) => i.group === "pick").map((i) => i.id), ["boqueria"]);
  assert.match(c.unread, /Bad ID!/);
  assert.match(c.unread, /perhaps/);
  assert.match(sheetHtml(c, opts()), /Sent, but not readable as an answer/);
});

check("shapes that are not a form at all are refused or read as empty", () => {
  for (const bad of [null, undefined, 42, "text", [], [base()]]) assert.equal(clean(bad).ok, false);
  assert.equal(clean(base({ week: "some-other-week" })).error, "unknown_week");
  assert.equal(clean(base({ name: "   " })).error, "name_missing");
  for (const odd of ["x", null, {}, 7]) {
    const c = ok(base({ answers: odd, dates: odd }));
    assert.equal(c.items.length, 0);
  }
});

// ── the room ─────────────────────────────────────────────────────────────────
const stored = (email, name, picks, at) => ({
  email, name, created_at: at,
  addons: picks.map(([id, label, answer, group = "pick"]) => ({ id, label, answer, group })),
});

check("the room counts each chef once, by their latest answer", () => {
  const rows = [  // newest first, as the function reads them
    stored("ana@example.com", "Ana B", [["boqueria", "La Boqueria at 08:00", "yes"]], "2026-10-06T10:00:00Z"),
    stored("ANA@example.com", "Ana B", [["boqueria", "La Boqueria at 08:00", "no"]], "2026-10-05T10:00:00Z"),
    stored("karim@example.com", "Karim Example", [["boqueria", "La Boqueria at 08:00", "yes"]], "2026-10-04T10:00:00Z"),
  ];
  const c = ok(base());   // Karim again, now saying no to the market
  const room = roomFrom(rows, c);
  assert.equal(room.people, 2);
  const market = room.lines.find((l) => l.id === "boqueria");
  assert.deepEqual(market.yes, ["Ana"]);
  assert.equal(lastAnswerAt(rows, "Karim@Example.com"), "2026-10-04T10:00:00Z");
  assert.equal(lastAnswerAt(rows, "nobody@example.com"), "");
});

check("an option taken off the page still counts for the chefs who saw it", () => {
  const rows = [stored("ana@example.com", "Ana B", [["old-option", "Something since removed", "yes"]], "2026-10-05T10:00:00Z")];
  const room = roomFrom(rows, ok(base()));
  assert.deepEqual(room.lines.map((l) => l.id), ["first-table", "boqueria", "in-wed-21", "old-option"]);
  assert.deepEqual(room.lines.at(-1).yes, ["Ana"]);
});

check("a stored row is trusted no more than a fresh one", () => {
  const rows = [
    stored("<b>x</b>@example.com", "Mallory", [["boqueria", "La Boqueria at 08:00", "yes"]], "2026-10-05T10:00:00Z"),
    stored("eve@example.com", "<script>alert(1)</script>",
      [["boqueria", "a label the current page overrides", "yes"], ["only-hers", "<b>bold</b>", "yes"]], "2026-10-05T09:00:00Z"),
    { email: "junk@example.com", name: "Junk", addons: "not an array" },
    null, 7, "row",
  ];
  const c = ok(base());
  const room = roomFrom(rows, c);
  assert.equal(room.people, 3);                       // Karim, Eve, Junk — not the bad address
  const html = sheetHtml(c, opts({ room }));
  assert.equal(/<script/i.test(html), false);
  assert.equal(/<b>/i.test(html), false);
  // a first name is cut at 24 characters, then escaped — so the tag arrives as text, clipped
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script</);
  assert.match(html, /&lt;b&gt;bold&lt;\/b&gt;/);
});

check("what is stored can rebuild the answer", () => {
  const c = ok(base());
  const back = roomFrom([{ email: c.email, name: c.name, addons: toStore(c), created_at: "2026-10-05T10:00:00Z" }], null);
  assert.equal(back.people, 1);
  assert.deepEqual(back.lines.map((l) => [l.id, l.group, l.yes.length]),
    [["first-table", "pick", 1], ["boqueria", "pick", 0], ["in-wed-21", "date", 1]]);
});

check("the plain-text version carries the same answer", () => {
  const c = ok(base({ note: "I land at 15:10." }));
  const text = sheetText(c, opts({ room: roomFrom([], c) }));
  assert.match(text, /YES {2}The night before/);
  assert.match(text, /no {3}La Boqueria/);
  assert.match(text, /I land at 15:10\./);
  assert.equal(/<[a-z]/i.test(text), false);
});

// ── the function file itself ─────────────────────────────────────────────────
const fnDir = new URL("../supabase/functions/week-answers/", import.meta.url);
const indexSrc = readFileSync(new URL("index.ts", fnDir), "utf8");
const sheetSrc = readFileSync(new URL("sheet.ts", fnDir), "utf8");

check("the function never names the Circle table", () => {
  for (const [file, src] of [["index.ts", indexSrc], ["sheet.ts", sheetSrc]]) {
    assert.equal(src.includes("launch" + "_waitlist"), false, file + " mentions the Circle table");
  }
});

check("the only recipient is the constant, and the chef is only ever reply_to", () => {
  const tos = [...indexSrc.matchAll(/\bto:\s*([^,\n]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(tos, ["[NOTIFY_TO]"]);
  assert.match(indexSrc, /reply_to: a\.email/);
  assert.equal(/\b(cc|bcc):/i.test(indexSrc), false);
});

check("a GET can do nothing", () => {
  assert.match(indexSrc, /if \(req\.method !== "POST"\) return json\(\{ error: "method_not_allowed" \}, 405\)/);
});

// ── the sample, and the hash the deployed dry run must match ─────────────────
const sampleHtml = sheetHtml(SAMPLE, SAMPLE_OPTS);
check("the sample renders, with its room", () => {
  assert.match(sampleHtml, /Sample Chef would come to 5 of the 8\./);
  assert.match(sampleHtml, /The room so far &middot; 2 chefs have answered/);
  assert.equal(SAMPLE_ROWS.length, 1);
  assert.equal(SLUG, "around-the-week:" + WEEK);
});

const out = join(tmpdir(), "week-answers-sample.html");
writeFileSync(out, sampleHtml);

if (process.exitCode) {
  console.error("\npreview-week-answers: FAILED");
} else {
  console.log("preview-week-answers: OK — " + passed + " checks passed.");
  console.log("rev     " + REV);
  console.log("sha256  " + createHash("sha256").update(sampleHtml).digest("hex"));
  console.log("length  " + sampleHtml.length);
  console.log("sample  " + out);
}
