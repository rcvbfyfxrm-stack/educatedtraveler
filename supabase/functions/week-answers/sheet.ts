// week-answers / sheet.ts
// The pure half of week-answers: clean what a browser sent, work out the room,
// and render the sheet Arnaud receives. No Deno, no network, no clock in here —
// so scripts/preview-week-answers.mjs imports THIS file and tests the real
// renderer, never a copy of it.
//
// Everything that reaches this file was typed by a stranger into a public page.
// clean() is the only door: nothing is rendered, stored or counted that did not
// come through it, and every value is escaped again at the point it is printed.

export const REV = "2026-10-05.1";
export const WEEK = "lab-week-01-barcelona";
export const SLUG = "around-the-week:" + WEEK;

export type Group = "pick" | "date";
export type Item = { id: string; label: string; answer: "yes" | "no"; group: Group };
export type Clean = {
  week: string; test: boolean; name: string; email: string;
  items: Item[]; dropped: number; unread: string; words: string; cut: boolean;
};
export type Cleaned = { ok: true; value: Clean } | { ok: false; error: string };
export type StoredRow = { email?: unknown; name?: unknown; addons?: unknown; created_at?: unknown };
export type RoomLine = { id: string; label: string; group: Group; yes: string[] };
export type Room = { people: number; lines: RoomLine[] };
export type SheetOpts = {
  when: string;            // already formatted, Madrid time
  stored: boolean | null;  // null = not attempted (dry run)
  room: Room | null;       // null = the tally could not be read
  replacesAt: string;      // "" when this is their first answer
};

const MAX_ITEMS = 20;
const MAX_DATES = 5;
const MAX_LABEL = 120;
const MAX_NAME = 80;
const MAX_WORDS = 1500;
const MAX_UNREAD = 1000;

// Control characters, zero-widths and the bidi overrides. Stripped everywhere:
// a right-to-left override in a name can make a subject line read backwards.
const CTRL = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g;
const CTRL_KEEP_NL = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g;
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Strict on purpose. The address is used three ways — reply_to, a mailto: link
// and the key of the tally — and none of them may carry a quote, a comma, an
// angle bracket or a second address.
const EMAIL = /^[^\s<>"',;@]+@[^\s<>"',;@]+\.[^\s<>"',;@]+$/;

export function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function tidy(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(CTRL, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function readItems(v: unknown, group: Group, cap: number, seen: Set<string>) {
  const items: Item[] = [];
  const odd: string[] = [];
  let dropped = 0;
  if (!Array.isArray(v)) return { items, odd, dropped };
  for (const entry of v) {
    if (items.length >= cap) { dropped++; continue; }
    const o = (entry && typeof entry === "object") ? entry as Record<string, unknown> : null;
    const id = o && typeof o.id === "string" ? o.id : "";
    const label = o ? tidy(o.label, MAX_LABEL) : "";
    const answer = o ? o.answer : null;
    if (!o || !ID.test(id) || !label || (answer !== "yes" && answer !== "no") || seen.has(id)) {
      // Never lose what somebody sent: an entry this cannot read is kept as
      // text and printed, escaped, under its own heading.
      try { odd.push(JSON.stringify(entry)); } catch { odd.push("[unreadable]"); }
      continue;
    }
    seen.add(id);
    items.push({ id, label, answer, group });
  }
  return { items, odd, dropped };
}

export function clean(input: unknown): Cleaned {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "not_an_object" };
  }
  const o = input as Record<string, unknown>;
  if (o.week !== WEEK) return { ok: false, error: "unknown_week" };

  const name = tidy(o.name, MAX_NAME);
  if (!name) return { ok: false, error: "name_missing" };

  const email = typeof o.email === "string" ? o.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) return { ok: false, error: "email_invalid" };

  const seen = new Set<string>();
  const picks = readItems(o.answers, "pick", MAX_ITEMS, seen);
  const dates = readItems(o.dates, "date", MAX_DATES, seen);

  const raw = typeof o.note === "string" ? o.note : "";
  const whole = raw.replace(/\r\n?/g, "\n").replace(CTRL_KEEP_NL, " ")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const cut = whole.length > MAX_WORDS;

  return {
    ok: true,
    value: {
      week: WEEK,
      test: o.test === true,
      name, email,
      items: [...picks.items, ...dates.items],
      dropped: picks.dropped + dates.dropped,
      unread: [...picks.odd, ...dates.odd].join("\n").slice(0, MAX_UNREAD),
      words: cut ? whole.slice(0, MAX_WORDS) : whole,
      cut,
    },
  };
}

// What goes into addon_interests.addons — one flat array, so the room can be
// rebuilt from the table alone if every email were lost.
export function toStore(c: Clean): Item[] {
  return c.items.map((i) => ({ id: i.id, label: i.label, answer: i.answer, group: i.group }));
}

export function firstName(name: string): string {
  const first = tidy(name, MAX_NAME).split(" ")[0] ?? "";
  return first.slice(0, 24) || "(no name)";
}

type Person = { name: string; items: Item[] };

// A stored row was written by this function, but the table also accepts an
// anonymous insert, so a row read back is trusted exactly as much as a fresh
// POST: it goes through the same checks or it is not counted.
function personFromRow(row: StoredRow): { key: string; person: Person } | null {
  if (!row || typeof row !== "object") return null;
  const email = typeof row.email === "string" ? row.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) return null;
  const seen = new Set<string>();
  const items: Item[] = [];
  if (Array.isArray(row.addons)) {
    for (const g of ["pick", "date"] as Group[]) {
      const of = row.addons.filter((a) => a && typeof a === "object" &&
        ((a as Record<string, unknown>).group ?? "pick") === g);
      items.push(...readItems(of, g, g === "pick" ? MAX_ITEMS : MAX_DATES, seen).items);
    }
  }
  return { key: email.toLowerCase(), person: { name: tidy(row.name, MAX_NAME), items } };
}

// The room so far: each chef's LATEST answer only. `rows` must arrive newest
// first; `current` is the answer being sent now and always wins for its address.
export function roomFrom(rows: StoredRow[], current: Clean | null): Room {
  const people = new Map<string, Person>();
  if (current) people.set(current.email.toLowerCase(), { name: current.name, items: current.items });
  for (const row of Array.isArray(rows) ? rows : []) {
    const p = personFromRow(row);
    if (p && !people.has(p.key)) people.set(p.key, p.person);
  }
  // Order: as on the page the current chef saw, then anything only others saw
  // (an option that has since been taken off the page still counts for them).
  const lines = new Map<string, RoomLine>();
  for (const person of people.values()) {
    for (const it of person.items) {
      if (!lines.has(it.id)) lines.set(it.id, { id: it.id, label: it.label, group: it.group, yes: [] });
    }
  }
  for (const person of people.values()) {
    for (const it of person.items) {
      if (it.answer === "yes") lines.get(it.id)!.yes.push(firstName(person.name));
    }
  }
  return { people: people.size, lines: [...lines.values()] };
}

// When this address last answered before now, or "" — `rows` newest first.
export function lastAnswerAt(rows: StoredRow[], email: string): string {
  const key = email.toLowerCase();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const e = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
    if (e === key && typeof row.created_at === "string") return row.created_at;
  }
  return "";
}

function counts(c: Clean) {
  const picks = c.items.filter((i) => i.group === "pick");
  return { yes: picks.filter((i) => i.answer === "yes").length, of: picks.length };
}

export function subjectFor(c: Clean, replaced: boolean): string {
  const n = counts(c);
  // Built from a cleaned name, two integers and fixed words: nothing a sender
  // typed can add a header line here.
  return (c.test ? "[TEST] " : "") + "Around the week · " + c.name + " · " + n.yes + " of " + n.of +
    (replaced ? " · changed" : "");
}

// ── the sheet ────────────────────────────────────────────────────────────────
// Solid hex on a light page, every colour. Gmail strips a <body> background and
// Outlook ignores rgba(), so nothing here may depend on either
// (scripts/check-email-contrast.mjs reads this file and fails the build on it).
const KEY = "padding:7px 14px 7px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;vertical-align:top;white-space:nowrap;";
const VAL = "padding:7px 0;color:#2b2621;font-size:15px;line-height:1.6;";
const HEAD = "margin:24px 0 8px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;";
const ROW = "padding:8px 14px 8px 0;color:#2b2621;font-size:15px;line-height:1.5;border-top:1px solid #e6ded1;";
const YES = "padding:8px 0;color:#0b7a58;font-size:15px;font-weight:bold;white-space:nowrap;text-align:right;border-top:1px solid #e6ded1;";
const NO = "padding:8px 0;color:#6b625a;font-size:15px;white-space:nowrap;text-align:right;border-top:1px solid #e6ded1;";
const FINE = "margin:10px 0 0 0;color:#6b625a;font-size:13px;line-height:1.6;";

function kv(k: string, v: string): string {
  return v ? `<tr><td style="${KEY}">${esc(k)}</td><td style="${VAL}">${v}</td></tr>` : "";
}

function answerRows(items: Item[]): string {
  return items.map((i) =>
    `<tr><td style="${ROW}">${esc(i.label)}</td><td style="${i.answer === "yes" ? YES : NO}">${i.answer === "yes" ? "Yes" : "No"}</td></tr>`
  ).join("");
}

function roomRows(lines: RoomLine[]): string {
  return lines.map((l) =>
    `<tr><td style="${ROW}">${esc(l.label)}${l.yes.length ? `<br><span style="color:#6b625a;font-size:13px;">${esc(l.yes.join(", "))}</span>` : ""}</td><td style="${l.yes.length ? YES : NO}">${l.yes.length}</td></tr>`
  ).join("");
}

export function sheetHtml(c: Clean, o: SheetOpts): string {
  const n = counts(c);
  const picks = c.items.filter((i) => i.group === "pick");
  const dates = c.items.filter((i) => i.group === "date");
  const first = firstName(c.name);

  const wordsBlock = c.words
    ? `<div style="background:#efe6d3;border-radius:8px;padding:22px 24px;margin:24px 0 6px 0;">
         <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 12px 0;">In their words</p>
         <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(c.words)}</p>
         ${c.cut ? `<p style="color:#6f6350;font-size:12px;margin:12px 0 0 0;">Cut at ${MAX_WORDS.toLocaleString("en-GB")} characters. They wrote more than that.</p>` : ""}
       </div>`
    : "";

  const unreadBlock = (c.unread || c.dropped)
    ? `<p style="${HEAD}">Sent, but not readable as an answer</p>
       <pre style="color:#3d3630;font-size:12px;line-height:1.6;white-space:pre-wrap;margin:0;font-family:'Courier New',monospace;">${esc(c.unread)}${c.dropped ? esc("\n(" + c.dropped + " more entries were over the limit and left out)") : ""}</pre>`
    : "";

  let roomBlock: string;
  if (!o.room) {
    roomBlock = `<p style="${HEAD}">The room so far</p>
       <p style="${FINE}">The count could not be read this time. This answer is complete above; the room will show on the next one.</p>`;
  } else {
    const rp = o.room.lines.filter((l) => l.group === "pick");
    const rd = o.room.lines.filter((l) => l.group === "date");
    roomBlock = `<p style="${HEAD}">The room so far &middot; ${o.room.people} ${o.room.people === 1 ? "chef has" : "chefs have"} answered</p>
       <table style="width:100%;border-collapse:collapse;">${roomRows(rp)}</table>
       ${rd.length ? `<p style="${HEAD}">In Barcelona on the two free days</p><table style="width:100%;border-collapse:collapse;">${roomRows(rd)}</table>` : ""}
       <p style="${FINE}">Each chef's latest answer only. Every answer also reached you as its own email, so a name here with no email behind it did not come through the page.</p>`;
  }

  const saved = o.stored === null ? "" : o.stored
    ? "Saved to the record."
    : "NOT saved to the record this time. This email is the only copy, so keep it.";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:34px 28px;">
      <p style="color:#8f5820;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px 0;font-family:'Courier New',monospace;">${c.test ? "TEST &middot; " : ""}Around the five days${o.when ? " &middot; " + esc(o.when) : ""}</p>
      <p style="color:#2b2621;font-family:Georgia,serif;font-size:23px;line-height:1.4;margin:0 0 8px 0;">${esc(c.name)} would come to ${n.yes} of the ${n.of}.</p>
      ${o.replacesAt ? `<p style="${FINE}">This replaces the answer they sent on ${esc(o.replacesAt)}.</p>` : ""}

      <table style="width:100%;border-collapse:collapse;margin:14px 0 0 0;">
        ${kv("Name", esc(c.name))}
        ${kv("Email", `<a href="mailto:${esc(c.email)}" style="color:#3f6b67;">${esc(c.email)}</a>`)}
      </table>

      <p style="${HEAD}">What they would come to</p>
      <table style="width:100%;border-collapse:collapse;">${answerRows(picks) || `<tr><td style="${ROW}">Nothing was on the page they sent.</td></tr>`}</table>

      ${dates.length ? `<p style="${HEAD}">In Barcelona on the two free days</p><table style="width:100%;border-collapse:collapse;">${answerRows(dates)}</table>` : ""}

      ${wordsBlock}
      ${unreadBlock}
      ${roomBlock}
    </div>
    <p style="color:#6b625a;font-size:12px;text-align:center;margin:22px 0 0 0;line-height:1.7;">Reply goes straight to ${esc(first)}. A tick is interest, not a reservation: nothing is held for anyone yet.${saved ? "<br>" + esc(saved) : ""}</p>
  </div>
</body></html>`;
}

export function sheetText(c: Clean, o: SheetOpts): string {
  const n = counts(c);
  const out: string[] = [];
  out.push((c.test ? "TEST · " : "") + "Around the five days" + (o.when ? " · " + o.when : ""));
  out.push(c.name + " would come to " + n.yes + " of the " + n.of + ".");
  if (o.replacesAt) out.push("This replaces the answer they sent on " + o.replacesAt + ".");
  out.push("", "Name: " + c.name, "Email: " + c.email, "");
  for (const i of c.items.filter((x) => x.group === "pick")) out.push((i.answer === "yes" ? "YES  " : "no   ") + i.label);
  const dates = c.items.filter((x) => x.group === "date");
  if (dates.length) {
    out.push("", "In Barcelona on the two free days:");
    for (const i of dates) out.push((i.answer === "yes" ? "YES  " : "no   ") + i.label);
  }
  if (c.words) out.push("", "In their words:", c.words + (c.cut ? "\n[cut at " + MAX_WORDS + " characters]" : ""));
  if (c.unread) out.push("", "Sent, but not readable as an answer:", c.unread);
  if (o.room) {
    out.push("", "The room so far · " + o.room.people + " answered (latest answer each):");
    for (const l of o.room.lines) out.push(l.yes.length + "  " + l.label + (l.yes.length ? " — " + l.yes.join(", ") : ""));
  } else {
    out.push("", "The room count could not be read this time.");
  }
  if (o.stored !== null) out.push("", o.stored ? "Saved to the record." : "NOT saved to the record. This email is the only copy.");
  return out.join("\n");
}

// ── the fixed sample ─────────────────────────────────────────────────────────
// Rendered by `{"dryRun":true}` and by the preview script. Both hash the result,
// so a matching hash proves the deployed bundle is the code that was reviewed.
// Nothing in it is a real person.
const sampleItem = (id: string, label: string, answer: "yes" | "no", group: Group = "pick"): Item =>
  ({ id, label, answer, group });

export const SAMPLE: Clean = {
  week: WEEK, test: true, name: "Sample Chef", email: "sample.chef@example.com",
  items: [
    sampleItem("first-table", "The night before: one table, one set menu", "yes"),
    sampleItem("boqueria", "La Boqueria at 08:00", "yes"),
    sampleItem("gresca", "Dinner at Gresca", "yes"),
    sampleItem("lasarte", "Dinner at Lasarte", "no"),
    sampleItem("wine-night", "A Catalan wine night", "yes"),
    sampleItem("martinez", "Rice at Martínez, on Montjuïc", "yes"),
    sampleItem("100chef", "The 100%Chef showroom", "no"),
    sampleItem("recaredo", "Recaredo, in the Penedès", "no"),
    sampleItem("in-wed-21", "Wednesday 21 October", "yes", "date"),
    sampleItem("in-tue-27", "Tuesday 27 October", "no", "date"),
  ],
  dropped: 0, unread: "", cut: false,
  words: "I land on the 21st at 15:10, so the evening works.\nI fly out early on the 27th.",
};

export const SAMPLE_ROWS: StoredRow[] = [
  { email: "second.chef@example.com", name: "Second Chef", created_at: "2026-10-05T09:00:00Z",
    addons: [
      sampleItem("first-table", "The night before: one table, one set menu", "yes"),
      sampleItem("lasarte", "Dinner at Lasarte", "yes"),
      sampleItem("recaredo", "Recaredo, in the Penedès", "yes"),
      sampleItem("in-tue-27", "Tuesday 27 October", "yes", "date"),
    ] },
];

export const SAMPLE_OPTS: SheetOpts = {
  when: "Mon 5 Oct 2026, 12:00 (Madrid)",
  stored: null,
  room: roomFrom(SAMPLE_ROWS, SAMPLE),
  replacesAt: "",
};
