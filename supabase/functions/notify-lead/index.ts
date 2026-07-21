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
type Mastery = { skill: string; relation: string; advanced: string };
type Parsed = {
  name: string; region: string; crafts: string[];
  intent: Array<[string, string]>; dream: string; mastery: Mastery | null; leftovers: unknown[];
};
function parseInterests(iv: unknown): Parsed {
  const out: Parsed = { name: "", region: "", crafts: [], intent: [], dream: "", mastery: null, leftovers: [] };
  let items: unknown[] = [];
  if (Array.isArray(iv)) items = iv;
  else if (iv && typeof iv === "object") items = Object.values(iv as Record<string, unknown>).flat();
  for (const it of items) {
    if (typeof it === "string") { if (it.trim()) out.crafts.push(it.trim()); continue; }
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    switch (o.kind) {
      case "profile":
        out.name = String(o.name ?? "").trim() || out.name;
        out.region = String(o.region ?? "").trim() || out.region;
        break;
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
      case "mastery": {
        const skill = String(o.skill ?? "").trim();
        const relation = String(o.relation ?? "").trim();
        // advanced is the richer field; legacy rows carried a boolean `perfect` — map it.
        const advanced = String(o.advanced ?? "").trim() || (o.perfect === true ? "yes" : "");
        if (skill || relation || advanced) out.mastery = { skill, relation, advanced };
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
    ? `<tr><td style="padding:7px 14px 7px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:7px 0;color:#f3ede2;font-size:15px;line-height:1.6;">${v}</td></tr>`
    : "";

  const craftBlock = grouped.length
    ? grouped.map(([world, list]) =>
        `<div style="margin:0 0 10px 0;">
           <p style="margin:0 0 6px 0;color:rgba(243,237,226,0.45);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;">${esc(world)}</p>
           <div>${list.map((c) =>
             `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 11px;border:1px solid ${world === "In their own words" ? "#d28a52" : "#7fa8a5"};border-radius:9px;font-size:13px;color:#f3ede2;">${esc(c)}</span>`
           ).join("")}</div>
         </div>`).join("")
    : `<p style="color:rgba(243,237,226,0.4);font-size:14px;font-style:italic;margin:0;">No crafts picked.</p>`;

  const intentRows = p.intent.map(([k, v]) => kv(k, esc(v))).join("");

  const dreamBlock = p.dream
    ? `<div style="background:#efe6d3;border-radius:8px;padding:24px 26px;margin:24px 0 6px 0;box-shadow:0 10px 30px -18px rgba(0,0,0,0.8);">
         <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 14px 0;">Their dream week — in their words</p>
         <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(p.dream)}</p>
         <p style="color:#3a2c1e;font-family:Georgia,serif;font-style:italic;font-size:15px;margin:16px 0 0 0;text-align:right;">— ${esc(name)}</p>
       </div>`
    : `<p style="color:rgba(243,237,226,0.4);font-size:14px;font-style:italic;margin:20px 0 0 0;">No dream written — they skipped that step.</p>`;

  const RELATION_LABEL: Record<string, string> = { work: "It's their work", passion: "A lifelong passion" };
  const ADVANCED_LABEL: Record<string, string> = { yes: "Yes — they'd go deeper", curious: "Curious", no: "Not for them" };
  const masteryBlock = p.mastery && (p.mastery.skill || p.mastery.relation || p.mastery.advanced)
    ? `<p style="margin:18px 0 8px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">What they already master</p>
       <div style="border:1px solid rgba(127,168,165,0.35);border-left:2px solid #7fa8a5;border-radius:12px;padding:14px 16px;">
         ${p.mastery.skill ? `<p style="color:#f3ede2;font-family:Georgia,serif;font-size:17px;margin:0 0 6px 0;">${esc(p.mastery.skill)}</p>` : ""}
         <p style="color:rgba(243,237,226,0.6);font-size:13px;margin:0;">
           ${p.mastery.relation ? esc(RELATION_LABEL[p.mastery.relation] ?? p.mastery.relation) : ""}${p.mastery.relation && p.mastery.advanced ? " &middot; " : ""}${p.mastery.advanced ? "Advanced week with an expert: <strong style=\"color:#d28a52;\">" + esc(ADVANCED_LABEL[p.mastery.advanced] ?? p.mastery.advanced) + "</strong>" : ""}
         </p>
       </div>`
    : "";

  const leftoverBlock = p.leftovers.length
    ? `<p style="margin:18px 0 6px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Also on the sheet</p>
       <pre style="color:rgba(243,237,226,0.7);font-size:12px;line-height:1.6;white-space:pre-wrap;margin:0;font-family:'Courier New',monospace;">${esc(JSON.stringify(p.leftovers, null, 2))}</pre>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:34px 28px;">
      <p style="color:#d28a52;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px 0;font-family:'Courier New',monospace;">New Circle signup${when ? " · " + esc(when) : ""}</p>
      <p style="color:#f3ede2;font-family:Georgia,serif;font-size:23px;line-height:1.4;margin:0 0 22px 0;">${esc(name)} just raised a hand to join the Circle.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        ${kv("Name", esc(name))}
        ${kv("Email", email ? `<a href="mailto:${esc(email)}" style="color:#7fa8a5;">${esc(email)}</a>` : "")}
        ${kv("Where they live", p.region ? esc(p.region) : "")}
        ${kv("Came in through", src ? esc(src) : "")}
      </table>

      <p style="margin:18px 0 10px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">The crafts — ${p.crafts.length}</p>
      ${craftBlock}

      ${intentRows ? `<p style="margin:18px 0 4px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Where they're starting from</p>
      <table style="width:100%;border-collapse:collapse;">${intentRows}</table>` : ""}

      ${masteryBlock}
      ${dreamBlock}
      ${leftoverBlock}
    </div>
    <p style="color:rgba(243,237,226,0.25);font-size:12px;text-align:center;margin:22px 0 0 0;">Reply goes straight to ${esc(name)}. They're a lead, not yet a member — the door is yours to open.</p>
  </div>
</body></html>`;
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

    const rec = body?.record;
    if (body?.table !== "launch_waitlist" || !rec?.id) return json({ message: "ignored" });

    const { data: row } = await admin
      .from("launch_waitlist")
      .select("id,email,interests,source,created_at")
      .eq("id", rec.id)
      .maybeSingle();
    if (!row) return json({ message: "no such row" });

    const p = parseInterests(row.interests);
    const who = p.name || String(row.email);
    const extra = p.crafts.length > 1 ? ` +${p.crafts.length - 1}` : "";
    const craftBit = p.crafts.length ? ` — ${p.crafts[0]}${extra}` : "";
    const masterBit = p.mastery?.skill ? ` · masters ${p.mastery.skill}${p.mastery.advanced === "yes" ? " (wants to go deeper)" : ""}` : "";
    const subject = `New Circle signup: ${who}${craftBit}${p.dream ? " · with a dream" : ""}${masterBit}`;

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
