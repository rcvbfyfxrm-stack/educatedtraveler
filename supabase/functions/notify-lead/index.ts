// Edge Function: notify-lead
// Fires on a launch_waitlist INSERT (pg_net trigger, migration 024).
// Emails Arnaud the FULL sheet for every Circle signup — name, region, crafts,
// intent, the dream letter — whichever surface it came from (/circle, homepage,
// Atlas intent forms, the orb, /barcelona).
// Security: the payload is never trusted — the row is re-fetched by id with the
// service role. A forged POST can at worst re-send Arnaud a sheet for a real row.
// Deploy with --no-verify-jwt (called by the DB trigger, which sends no JWT).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFY_TO = Deno.env.get("LEAD_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const FROM = "The Circle · EducatedTraveler <founder@educatedtraveler.app>";

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// ── Atlas worlds (mirror of notify-portrait / the site) ──
const WORLDS: Record<string, string[]> = {
  "The Wild": ["Freediving","Scuba Diving","Spearfishing","Sailing & Yachtmaster","Surfing","Kitesurfing",
    "Rock Climbing","Alpinism & Mountaineering","Ski-touring & Splitboard","Paragliding","Whitewater Kayaking"],
  "Kitchen & Cellar": ["Modernist Spanish Cuisine","New Basque Cuisine","Classical French Cuisine","French Pastry & Patisserie",
    "Bread & Boulangerie","Sushi & Washoku","Italian Cuisine & Pasta","Thai Cuisine","Oaxacan & Mexican Cuisine",
    "Peruvian Cuisine","Wine & Sommellerie","Coffee & Barista"],
  "Craft & Art": ["Pottery & Ceramics","Woodworking & Joinery","Blacksmithing & Bladesmithing","Glassblowing",
    "Photography","Filmmaking","Textiles & Weaving","Natural Dyeing","Leatherwork","Jewelry & Goldsmithing",
    "Perfumery","Lutherie & Instrument-making"],
  "Movement": ["Argentine Tango","Flamenco & Dance","Capoeira","Salsa","Ecstatic Dance & Movement","Bharatanatyam Indian Classical Dance"],
  "Body & Spirit": ["Hatha & Vinyasa Yoga","Ashtanga Yoga","Iyengar Yoga","Kundalini Yoga","Pranayama & Breathwork",
    "Vipassana & Meditation","Ayurveda","Thai Massage","Sound Healing","Tai Chi & Qigong","Cold Exposure (Wim Hof Method)"],
};
const WORLD_OF: Record<string, string> = {};
for (const [w, discs] of Object.entries(WORLDS)) for (const d of discs) WORLD_OF[d] = w;

const SOURCE_LABEL: Record<string, string> = {
  "circle-questionnaire": "the /circle questionnaire",
  "homepage": "the homepage joiner",
  "homepage-circle": "the homepage joiner",
  "join-page": "the join page",
  "barcelona": "the /barcelona teaser",
  "teach-offer": "the /teach note — a master's door",
};

const INTENT_LABEL: Record<string, string> = {
  timing: "When they could go",
  length: "How long they'd give it",
  depth: "Where they are with it",
  reach: "How far they'd travel",
};

// launch_waitlist.interests arrives in several shapes depending on the surface:
//   /circle → [{kind:'profile',name,region},{kind:'discipline',world,discipline|null,open?},
//              {kind:'intent',timing,length,depth,reach},{kind:'dream',text}]
//   homepage/orb/intent forms → ["Craft name", ...]   old profiles → {category:[...]}
// Parse defensively; anything unrecognized still shows up raw in the sheet.
type Mastery = { skill: string; level: string; relation: string; advanced: string };
// /teach writes one of these. Since the page became a letter, `offer` holds the
// letter itself rather than a one-line outcome — so it gets read as prose, on
// paper, the same way a learner's letter is.
type Instructor = {
  craft: string; offer: string; record: string; room: string;
  where: string; level: string; length: string;
};
type Parsed = {
  name: string; region: string; crafts: string[];
  intent: Array<[string, string]>; dream: string; mastery: Mastery | null;
  instructor: Instructor | null; leftovers: unknown[];
};
function parseInterests(iv: unknown): Parsed {
  const out: Parsed = { name: "", region: "", crafts: [], intent: [], dream: "", mastery: null, instructor: null, leftovers: [] };
  let items: unknown[] = [];
  if (Array.isArray(iv)) items = iv;
  else if (iv && typeof iv === "object") items = Object.values(iv as Record<string, unknown>).flat();
  for (const it of items) {
    if (typeof it === "string") { if (it.trim()) out.crafts.push(it.trim()); continue; }
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    switch (o.kind) {
      case "profile": {
        out.name = String(o.name ?? "").trim() || out.name;
        out.region = String(o.region ?? "").trim() || out.region;
        // The /browse orb (circle-onboarding.js) packs its intent answers INTO this
        // profile item as slugs, not as a separate kind:'intent'. Surface them so
        // Arnaud's sheet shows how far / when / what level every orb joiner answered
        // instead of dropping them silently.
        const ORB_EXP: Record<string, string> = { beginner: "Total beginner", some: "Some grounding", seasoned: "Seasoned hand" };
        const ORB_REACH: Record<string, string> = { region: "Close to home", europe: "Open to Europe", world: "Across the world for the right one" };
        const ORB_TIMING: Record<string, string> = { soon: "Ready now", year: "This year", dreaming: "Someday — dreaming" };
        const ORB_MOT: Record<string, string> = { new: "After a new craft", deeper: "Going deeper", people: "Here for the people", change: "After a change" };
        const ORB_TURN: Record<string, string> = { lost: "Ready for a change", spent: "Outgrew the last thing", learn: "Here to learn" };
        const pushIntent = (label: string, v: string) => {
          const s = v.trim();
          if (s && !out.intent.some(([k]) => k === label)) out.intent.push([label, s]);
        };
        if (o.experience) pushIntent(INTENT_LABEL.depth, ORB_EXP[String(o.experience)] ?? String(o.experience));
        if (o.timing) pushIntent(INTENT_LABEL.timing, ORB_TIMING[String(o.timing)] ?? String(o.timing));
        if (o.reach) pushIntent(INTENT_LABEL.reach, ORB_REACH[String(o.reach)] ?? String(o.reach));
        const why = ORB_MOT[String(o.motivation ?? "")] ?? ORB_TURN[String(o.turn ?? "")] ?? "";
        if (why) pushIntent("Why now", why);
        break;
      }
      case "discipline": {
        const d = String(o.discipline ?? "").trim();
        const open = String(o.open ?? "").trim();
        if (d) out.crafts.push(d);
        if (open) out.crafts.push(open);
        break;
      }
      case "intent":
        for (const k of ["depth", "timing", "length", "reach"]) {
          const v = String(o[k] ?? "").trim();
          if (v) out.intent.push([INTENT_LABEL[k] ?? k, v]);
        }
        break;
      case "dream":
        out.dream = String(o.text ?? "").trim() || out.dream;
        break;
      // An offer to teach, from /teach. Deliberately NOT pushed into out.crafts:
      // a craft in that list reads as a craft someone wants to LEARN, and the two
      // must never be counted as the same signal.
      case "instructor": {
        const str = (k: string) => String(o[k] ?? "").trim();
        const inst: Instructor = {
          craft: str("craft"),
          offer: str("letter") || str("offer"),
          record: str("record"), room: str("room"),
          where: str("where"), level: str("level"), length: str("length"),
        };
        if (Object.values(inst).some((v) => v)) out.instructor = inst;
        break;
      }
      case "mastery": {
        const skill = String(o.skill ?? "").trim();
        const relation = String(o.relation ?? "").trim();
        // advanced is the richer field; legacy rows carried a boolean `perfect` — map it.
        const advanced = String(o.advanced ?? "").trim() || (o.perfect === true ? "yes" : "");
        // Their own words about how far in they are. Rows written before this
        // field existed simply carry "".
        const level = String(o.level ?? "").trim();
        if (skill || level || relation || advanced) out.mastery = { skill, level, relation, advanced };
        break;
      }
      default:
        out.leftovers.push(o);
    }
  }
  return out;
}

function groupCrafts(crafts: string[]): Array<[string, string[]]> {
  const groups = new Map<string, string[]>();
  const own: string[] = [];
  for (const c of crafts) {
    const w = WORLD_OF[c];
    if (w) { if (!groups.has(w)) groups.set(w, []); groups.get(w)!.push(c); }
    else own.push(c);
  }
  const out: Array<[string, string[]]> = [...groups.entries()];
  if (own.length) out.push(["In their own words", own]);
  return out;
}

function joinedAt(ts: string | null | undefined): string {
  try {
    if (!ts) return "";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts)) + " (Madrid)";
  } catch { return ts ?? ""; }
}

function sheetHtml(row: Record<string, unknown>, p: Parsed): string {
  const name = p.name || "Someone new";
  const email = String(row.email ?? "");
  const srcRaw = String(row.source ?? "");
  const src = SOURCE_LABEL[srcRaw] ?? srcRaw;
  const when = joinedAt(row.created_at as string);
  const grouped = groupCrafts(p.crafts);

  const kv = (k: string, v: string) => v
    ? `<tr><td style="padding:7px 14px 7px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:7px 0;color:#2b2621;font-size:15px;line-height:1.6;">${v}</td></tr>`
    : "";

  const craftBlock = grouped.length
    ? grouped.map(([world, list]) =>
        `<div style="margin:0 0 10px 0;">
           <p style="margin:0 0 6px 0;color:#6b625a;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">${esc(world)}</p>
           <div>${list.map((c) =>
             `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 11px;border:1px solid ${world === "In their own words" ? "#d28a52" : "#7fa8a5"};border-radius:9px;font-size:13px;color:#2b2621;">${esc(c)}</span>`
           ).join("")}</div>
         </div>`).join("")
    : `<p style="color:#6b625a;font-size:14px;font-style:italic;margin:0;">No crafts picked.</p>`;

  const intentRows = p.intent.map(([k, v]) => kv(k, esc(v))).join("");

  const dreamBlock = p.dream
    ? `<div style="background:#efe6d3;border-radius:8px;padding:24px 26px;margin:24px 0 6px 0;box-shadow:0 10px 30px -18px rgba(0,0,0,0.8);">
         <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 14px 0;">Their dream week — in their words</p>
         <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(p.dream)}</p>
         <p style="color:#3a2c1e;font-family:Georgia,serif;font-style:italic;font-size:15px;margin:16px 0 0 0;text-align:right;">— ${esc(name)}</p>
       </div>`
    : (p.instructor ? "" : `<p style="color:#6b625a;font-size:14px;font-style:italic;margin:20px 0 0 0;">No dream written — they skipped that step.</p>`);

  // A master's note, on the same paper as a learner's — it is the whole offer
  // now, so it is read, not parsed. Nothing here is agreed by its arrival.
  const inst = p.instructor;
  const offerBlock = inst
    ? `<table style="width:100%;border-collapse:collapse;margin:6px 0 0 0;">
         ${kv("The craft", inst.craft ? esc(inst.craft) : "")}
         ${kv("The room", inst.where ? esc(inst.where) : "")}
         ${kv("How long", inst.length ? esc(inst.length) : "")}
         ${kv("Who it's for", inst.level ? esc(inst.level) : "")}
       </table>
       ${inst.offer
         ? `<div style="background:#efe6d3;border-radius:8px;padding:24px 26px;margin:18px 0 6px 0;box-shadow:0 10px 30px -18px rgba(0,0,0,0.8);">
              <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 14px 0;">What they could open — in their words</p>
              <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(inst.offer)}</p>
              <p style="color:#3a2c1e;font-family:Georgia,serif;font-style:italic;font-size:15px;margin:16px 0 0 0;text-align:right;">— ${esc(name)}</p>
            </div>`
         : ""}
       ${inst.record ? `<p style="margin:14px 0 4px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Their record</p><p style="color:#2b2621;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${esc(inst.record)}</p>` : ""}
       ${inst.room ? `<p style="margin:14px 0 4px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">The space</p><p style="color:#2b2621;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${esc(inst.room)}</p>` : ""}`
    : "";

  const RELATION_LABEL: Record<string, string> = { work: "It's their work", passion: "A lifelong passion" };
  const ADVANCED_LABEL: Record<string, string> = { yes: "Yes — they'd go deeper", curious: "Curious", no: "Not for them" };
  const masteryBlock = p.mastery && (p.mastery.skill || p.mastery.level || p.mastery.relation || p.mastery.advanced)
    ? `<p style="margin:18px 0 8px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">What they already master</p>
       <div style="border:1px solid rgba(127,168,165,0.35);border-left:2px solid #7fa8a5;border-radius:12px;padding:14px 16px;">
         ${p.mastery.skill ? `<p style="color:#2b2621;font-family:Georgia,serif;font-size:17px;margin:0 0 6px 0;">${esc(p.mastery.skill)}</p>` : ""}
         ${p.mastery.level ? `<p style="color:#2b2621;font-size:14px;line-height:1.6;margin:0 0 8px 0;white-space:pre-wrap;">${esc(p.mastery.level)}</p>` : ""}
         <p style="color:#6b625a;font-size:13px;margin:0;">
           ${p.mastery.relation ? esc(RELATION_LABEL[p.mastery.relation] ?? p.mastery.relation) : ""}${p.mastery.relation && p.mastery.advanced ? " &middot; " : ""}${p.mastery.advanced ? "Advanced week with an expert: <strong style=\"color:#8f5820;\">" + esc(ADVANCED_LABEL[p.mastery.advanced] ?? p.mastery.advanced) + "</strong>" : ""}
         </p>
       </div>`
    : "";

  const leftoverBlock = p.leftovers.length
    ? `<p style="margin:18px 0 6px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Also on the sheet</p>
       <pre style="color:#3d3630;font-size:12px;line-height:1.6;white-space:pre-wrap;margin:0;font-family:'Courier New',monospace;">${esc(JSON.stringify(p.leftovers, null, 2))}</pre>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:34px 28px;">
      <p style="color:#8f5820;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px 0;font-family:'Courier New',monospace;">${inst ? "A room offered" : "New Circle signup"}${when ? " · " + esc(when) : ""}</p>
      <p style="color:#2b2621;font-family:Georgia,serif;font-size:23px;line-height:1.4;margin:0 0 22px 0;">${esc(name)} ${inst ? "wrote to you about a room they could open." : "just raised a hand to join the Circle."}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        ${kv("Name", esc(name))}
        ${kv("Email", email ? `<a href="mailto:${esc(email)}" style="color:#3f6b67;">${esc(email)}</a>` : "")}
        ${kv("Where they live", (p.region && !inst) ? esc(p.region) : "")}
        ${kv("Came in through", src ? esc(src) : "")}
      </table>

      ${offerBlock}

      ${inst ? "" : `<p style="margin:18px 0 10px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">The crafts — ${p.crafts.length}</p>
      ${craftBlock}`}

      ${intentRows ? `<p style="margin:18px 0 4px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Where they're starting from</p>
      <table style="width:100%;border-collapse:collapse;">${intentRows}</table>` : ""}

      ${masteryBlock}
      ${dreamBlock}
      ${leftoverBlock}
    </div>
    <p style="color:#7a726a;font-size:12px;text-align:center;margin:22px 0 0 0;">Reply goes straight to ${esc(name)}. ${inst ? "Nothing is agreed by what they sent — it says they exist, and the checking is yours to do." : "They're a lead, not yet a member — the door is yours to open."}</p>
  </div>
</body></html>`;
}

// ── Seat claims (/pay) ────────────────────────────────────────────────────
// A row whose source starts with "pay:" is NOT a Circle signup and must never
// be emailed as one. It is a chef saying he is ABOUT to send money, or — on
// the second ping — saying he just has. Neither is proof: every rail settles
// off-site, so only Revolut and PayPal know. The seat count for the 15
// September gate depends on that line not being blurred, so the subject says
// it out loud rather than leaving it to be inferred.
type Seat = {
  name?: string; boat?: string; amount?: number; balance?: number;
  method?: string; stage?: string;
};

function parseSeat(iv: unknown): Seat | null {
  const arr = Array.isArray(iv) ? iv : [];
  const s = arr.find((x) =>
    x && typeof x === "object" && (x as Record<string, unknown>).kind === "seat-payment"
  ) as Record<string, unknown> | undefined;
  if (!s) return null;
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    name: str(s.name), boat: str(s.boat), method: str(s.method), stage: str(s.stage),
    amount: num(s.amount_eur), balance: num(s.balance_eur),
  };
}

const METHOD_LABEL: Record<string, string> = {
  revolut: "from their Revolut app",
  bank: "by bank transfer",
  paypal: "by PayPal",
};

const eur = (n?: number) => (typeof n === "number" ? `€${n.toLocaleString("en-GB")}` : "—");

function seatHtml(
  row: Record<string, unknown>, s: Seat, declaredSent: boolean,
  confirmUrl: string, alreadyPaid: boolean,
): string {
  const email = String(row.email ?? "");
  const method = s.method ? (METHOD_LABEL[s.method] ?? s.method) : "route not recorded";
  const line = (k: string, v: string) =>
    `<tr><td style="padding:7px 14px 7px 0;color:#6b625a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:7px 0;color:#2b2621;font-size:15px;line-height:1.6;">${v}</td></tr>`;

  const banner = declaredSent
    ? `<p style="margin:0;color:#7a3f10;font-size:15px;line-height:1.6;"><strong>They pressed “I've sent it”.</strong> That is the chef's word, not a receipt — the money moves outside the site. Check ${esc(method.replace(/^(from their|by) /, ""))} before you record it.</p>`
    : `<p style="margin:0;color:#6b625a;font-size:15px;line-height:1.6;"><strong>They started the hand-off.</strong> Nothing has been sent yet, and plenty of people stop here. Worth a note if it goes quiet.</p>`;

  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:26px;background:#faf7f2;">
    <p style="margin:0 0 4px 0;color:#6b625a;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Lab Week 01 · Barcelona</p>
    <h1 style="margin:0 0 16px 0;font-size:23px;font-weight:normal;color:#2b2621;">${declaredSent ? "Says they've sent it" : "Someone is taking a seat"}</h1>
    <div style="border-left:3px solid ${declaredSent ? "#d28a52" : "#c9c1b6"};background:#f2ede4;padding:12px 16px;margin:0 0 18px 0;">${banner}</div>
    <table style="border-collapse:collapse;width:100%;">
      ${line("Chef", esc(s.name || "(no name given)"))}
      ${line("Email", `<a href="mailto:${esc(email)}" style="color:#3f6b67;">${esc(email)}</a>`)}
      ${s.boat ? line("Boat", esc(s.boat)) : ""}
      ${line("Sending", `<strong>${esc(eur(s.amount))}</strong> ${esc(method)}`)}
      ${typeof s.balance === "number" && s.balance > 0 ? line("Balance after", esc(eur(s.balance)) + " — due only once the week is confirmed") : ""}
      ${line("Reference to look for", esc(s.name || email))}
    </table>
    ${alreadyPaid
      ? `<p style="margin:20px 0 0 0;color:#0b7a58;font-size:14px;">Already recorded as received.</p>`
      : `<div style="margin:22px 0 0 0;padding:16px 18px;background:#f2ede4;border-radius:8px;">
           <p style="margin:0 0 12px 0;color:#3d3630;font-size:14px;line-height:1.6;">When you can see the money, press this. It records the payment against their name &mdash; nothing more. What ${esc(s.name || "the chef")} is told, if anything, is decided on the next screen.</p>
           <a href="${esc(confirmUrl)}" style="display:inline-block;background:#3f6b67;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:50px;font-size:14px;font-family:Helvetica,Arial,sans-serif;">The money is here &mdash; record it</a>
           <p style="margin:12px 0 0 0;color:#6b625a;font-size:12px;">Opens a page and asks again before anything is sent. Nothing happens until you press the second button.</p>
         </div>`}
    <p style="margin:18px 0 0 0;color:#6b625a;font-size:13px;line-height:1.7;font-style:italic;">
      Only a payment you can see in Revolut, PayPal or the bank counts. Reply to this email and it goes straight to the chef.
    </p>
  </div>`;
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Safe self-test: POST {"dryRun":true} renders a sample without sending.
    if (body?.dryRun) {
      const sample = {
        email: "sample@example.com", source: "circle-questionnaire",
        created_at: "2026-07-16T12:00:00Z",
        interests: [
          { kind: "profile", name: "Sample", region: "Nowhere" },
          { kind: "discipline", world: "Body & Spirit", discipline: "Sound Healing" },
          { kind: "intent", timing: "This year", depth: "I’ve dabbled" },
          { kind: "dream", text: "A quiet week learning from a real master." },
          { kind: "mastery", skill: "Sourdough baking", relation: "passion", advanced: "yes" },
        ],
      };
      const html = sheetHtml(sample, parseInterests(sample.interests));
      return json({ ok: true, dryRun: true, htmlLength: html.length });
    }

    // Two shapes reach here.
    //
    //   { table, record:{id} }                  → the DB trigger, on INSERT.
    //   { event:'sent', seat_email:'…' }        → the "I've sent it" button on
    //                                             /pay, which has no row id.
    //
    // The button shape looks up the chef's most recent seat row by email with
    // the service role. It is deployed --no-verify-jwt like the trigger path,
    // so it is forgeable — but only into re-sending Arnaud a sheet for a row
    // that already exists, which is the same ceiling the id path already had.
    // It can never create, alter or reveal anything.
    let row: Record<string, unknown> | null = null;

    if (body?.event === "sent" && typeof body?.seat_email === "string") {
      const { data } = await admin
        .from("launch_waitlist")
        .select("id,email,interests,source,created_at,seat_token,seat_paid_at")
        .ilike("email", body.seat_email.trim())
        .like("source", "pay:%")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      row = data as Record<string, unknown> | null;
      if (!row) return json({ message: "no seat row for that email" });
    } else {
      const rec = body?.record;
      if (body?.table !== "launch_waitlist" || !rec?.id) return json({ message: "ignored" });
      const { data } = await admin
        .from("launch_waitlist")
        .select("id,email,interests,source,created_at,seat_token,seat_paid_at")
        .eq("id", rec.id)
        .maybeSingle();
      row = data as Record<string, unknown> | null;
      if (!row) return json({ message: "no such row" });
    }

    // A seat claim from /pay gets its own sheet and its own subject line. The
    // second ping (event:'sent') is fired by the "I've sent it" button; it is
    // unauthenticated, so it may only change the wording — every fact below
    // still comes from the row, re-fetched with the service role.
    const seat = String(row.source ?? "").startsWith("pay:") ? parseSeat(row.interests) : null;
    if (seat) {
      const declaredSent = body?.event === "sent";
      const seatWho = seat.name || String(row.email);

      // The one-click confirm link. The token is minted HERE, with the service
      // role — never by the browser that wrote the row, or a chef could choose
      // the string that confirms his own seat.
      let token = typeof row.seat_token === "string" ? row.seat_token : "";
      if (!token) {
        token = crypto.randomUUID();
        await admin.from("launch_waitlist").update({ seat_token: token }).eq("id", row.id);
      }
      const confirmUrl = `${SUPABASE_URL}/functions/v1/seat-confirm?token=${encodeURIComponent(token)}`;
      const alreadyPaid = !!row.seat_paid_at;
      const via = seat.method ? ` ${METHOD_LABEL[seat.method] ?? seat.method}` : "";
      const subject = declaredSent
        ? `SAYS SENT · ${seatWho} · ${eur(seat.amount)}${via} — check the account`
        : `Seat started · ${seatWho} · ${eur(seat.amount)}${via} — not paid yet`;

      const sr = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM, to: [NOTIFY_TO], reply_to: String(row.email),
          subject, html: seatHtml(row as Record<string, unknown>, seat, declaredSent, confirmUrl, alreadyPaid),
        }),
      });
      const srj = await sr.json().catch(() => ({}));
      if (!sr.ok) {
        console.error("notify-lead seat send failed:", srj);
        return json({ error: srj }, 500);
      }
      return json({ ok: true, kind: "seat", declaredSent, emailed: NOTIFY_TO, id: srj.id });
    }

    const p = parseInterests(row.interests);
    const who = p.name || String(row.email);
    const extra = p.crafts.length > 1 ? ` +${p.crafts.length - 1}` : "";
    const craftBit = p.crafts.length ? ` — ${p.crafts[0]}${extra}` : "";
    const masterBit = p.mastery?.skill ? ` · masters ${p.mastery.skill}${p.mastery.advanced === "yes" ? " (wants to go deeper)" : ""}` : "";
    // An offer to teach is not a signup and must not read as one in the inbox.
    const subject = p.instructor
      ? `A room offered: ${who}${p.instructor.craft ? " — " + p.instructor.craft : ""}${p.instructor.where ? " · " + p.instructor.where : ""}`
      : `New Circle signup: ${who}${craftBit}${p.dream ? " · with a dream" : ""}${masterBit}`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [NOTIFY_TO], reply_to: String(row.email),
        subject, html: sheetHtml(row as Record<string, unknown>, p),
      }),
    });
    const rj = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("notify-lead send failed:", rj);
      return json({ error: rj }, 500);
    }
    return json({ ok: true, emailed: NOTIFY_TO, lead: row.email, id: rj.id });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
