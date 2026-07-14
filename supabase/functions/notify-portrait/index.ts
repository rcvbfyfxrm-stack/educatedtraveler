// Edge Function: notify-portrait (v2)
// Fires when a member seals their Circle portrait at /portrait.
//  1) Emails Arnaud the FULL sheet — every answer, labeled, with the letter.
//  2) (flag-gated) Emails the member Arnaud's letter back — only when the
//     PORTRAIT_WELCOME_ENABLED secret is "true". Off by default.
// Security: verifies the caller's JWT, then re-reads that user's OWN profile
// with the service role — nothing from the browser is trusted.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://educatedtraveler.app";
const NOTIFY_TO = Deno.env.get("PORTRAIT_NOTIFY_TO") ?? "arnaudcallier@pm.me";
const WELCOME_ON = (Deno.env.get("PORTRAIT_WELCOME_ENABLED") ?? "").toLowerCase() === "true";
const FROM_NOTIFY = "The Circle · EducatedTraveler <founder@educatedtraveler.app>";
const FROM_MEMBER = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const REPLY_TO_MEMBER = "founder@educatedtraveler.app";

// ── The portrait's own vocabulary (mirror of website/portrait.html) ──
// Any stored answer NOT in these sets was typed in the member's own words.
const CHIP_LABELS = new Set([
  // lifestage
  "I'm at a turn — ready for something new",
  "I outgrew the thing I chose too early",
  "I just love to learn, and always will",
  "I need to step out and come back myself",
  "I'm deep in a craft and want a true master",
  "I want to give someone (or myself) this",
  // depth
  "Total beginner", "I’ve dabbled", "I practice — want to go deeper", "Serious — chasing mastery",
  // timing
  "I'm ready now", "This year", "Next year", "Someday — I’m dreaming",
  // length
  "A weekend", "Most of a week", "A full week or more", "As long as it takes",
  // reach
  "Close to home", "My region / a short hop", "Across the world for the right one",
]);
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

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function flattenCrafts(iv: unknown): string[] {
  if (Array.isArray(iv)) return iv.filter(Boolean).map(String);
  if (iv && typeof iv === "object") return Object.values(iv as Record<string, unknown>).flat().filter(Boolean).map(String);
  return [];
}
// group crafts by their Atlas world; unknown names = the member's own words
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
// "— their own words" marker when an answer isn't one of the page's chips
function ownWordsMark(v: string | null | undefined): string {
  if (!v) return "";
  return CHIP_LABELS.has(v.trim()) ? "" :
    ` <span style="color:#d28a52;font-size:11px;font-style:italic;font-family:Georgia,serif;">— their own words</span>`;
}
function sealedAt(ts: string | null | undefined): string {
  try {
    if (!ts) return "";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts)) + " (Madrid)";
  } catch { return ts ?? ""; }
}

// ── Arnaud's full sheet ──
function fullSheetHtml(rec: Record<string, unknown>, email: string): string {
  const name = String(rec.first_name || "A new member");
  const crafts = flattenCrafts(rec.interests);
  const grouped = groupCrafts(crafts);
  const letter = String(rec.dream_letter || "").trim();

  const row = (k: string, v: string) => v
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

  const startRows = [
    ["Where they are with it", rec.previous_experience],
    ["When they could go", rec.availability],
    ["How long they'd give it", rec.preferred_duration],
    ["How far they'd travel", rec.reach],
  ].map(([k, v]) => {
    const s = v ? String(v) : "";
    return s ? row(String(k), esc(s) + ownWordsMark(s)) : "";
  }).join("");

  const letterBlock = letter
    ? `<div style="background:#efe6d3;border-radius:8px;padding:24px 26px;margin:24px 0 6px 0;box-shadow:0 10px 30px -18px rgba(0,0,0,0.8);">
         <p style="color:#6f6350;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0 0 14px 0;">The letter — for you alone</p>
         <p style="color:#2c231a;font-family:Georgia,serif;font-size:16px;line-height:1.8;margin:0;white-space:pre-wrap;">${esc(letter)}</p>
         <p style="color:#3a2c1e;font-family:Georgia,serif;font-style:italic;font-size:15px;margin:16px 0 0 0;text-align:right;">— ${esc(name)}</p>
       </div>`
    : `<p style="color:rgba(243,237,226,0.4);font-size:14px;font-style:italic;margin:20px 0 0 0;">No letter yet — they said they'd write it later.</p>`;

  const status = rec.status ? String(rec.status) : "";
  const when = sealedAt(rec.portrait_completed_at as string);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:34px 28px;">
      <p style="color:#d28a52;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px 0;font-family:'Courier New',monospace;">Portrait sealed${when ? " · " + esc(when) : ""}</p>
      <p style="color:#f3ede2;font-family:Georgia,serif;font-size:23px;line-height:1.4;margin:0 0 22px 0;">${esc(name)} just took a place in the Circle.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        ${row("Name", esc(name))}
        ${row("Email", email ? `<a href="mailto:${esc(email)}" style="color:#7fa8a5;">${esc(email)}</a>` : "")}
        ${row("What they do", rec.profession ? esc(rec.profession) : "")}
        ${row("Where they live", rec.location ? esc(rec.location) : "")}
        ${row("At the door", status ? esc(status) + ownWordsMark(status) : "")}
      </table>

      <p style="margin:18px 0 10px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">The crafts — ${crafts.length}</p>
      ${craftBlock}

      ${startRows ? `<p style="margin:18px 0 4px 0;color:rgba(243,237,226,0.4);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-family:'Courier New',monospace;">Where they're starting from</p>
      <table style="width:100%;border-collapse:collapse;">${startRows}</table>` : ""}

      ${letterBlock}

      <div style="text-align:center;margin:28px 0 0 0;">
        <a href="${APP_URL}/admin" style="display:inline-block;background:linear-gradient(135deg,#7fa8a5 0%,#d28a52 100%);color:#14110d;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;font-weight:500;">Open the Circle roster</a>
      </div>
    </div>
    <p style="color:rgba(243,237,226,0.25);font-size:12px;text-align:center;margin:22px 0 0 0;">Reply goes straight to ${esc(name)}. You read every letter — this one's waiting.</p>
  </div>
</body></html>`;
}

// ── The member's letter back ──
// Arnaud's reply, written on the same warm paper the member wrote on.
// They closed "Speak soon," — so does he. One-time, flag-gated, zero sell.
function craftsSentence(crafts: string[]): string {
  const c = crafts.filter(Boolean);
  if (!c.length) return "And the craft? We'll find it together — that's half the point.";
  if (c.length === 1) return `So it's ${c[0]} that keeps calling you. Good. Now I know where to look.`;
  if (c.length === 2) return `So it's ${c[0]} and ${c[1]} that keep calling you. Good. Now I know where to look.`;
  if (c.length === 3) return `So it's ${c[0]}, ${c[1]} and ${c[2]} that keep calling you. Good. Now I know where to look.`;
  return `So it's ${c[0]}, ${c[1]}, ${c[2]} — and the ${c.length - 3} more you named — that keep calling you. Good. Now I know where to look.`;
}
function memberWelcome(rec: Record<string, unknown>, _email: string): { subject: string; html: string; text: string } {
  const name = String(rec.first_name || "").trim();
  const crafts = flattenCrafts(rec.interests);
  const hasLetter = String(rec.dream_letter || "").trim().length > 0;
  const craftsLine = craftsSentence(crafts);

  const openerText = hasLetter
    ? `Your portrait reached me — your letter with it. I've read it once already; I'll read it again, slowly. Nobody else will.`
    : `Your portrait reached me. The sheet where the letter goes is still open — whenever a sentence feels true, come back and write it. One line is enough; it's the part I build from.`;
  const openerHtml = hasLetter
    ? esc(openerText)
    : `Your portrait reached me. The sheet where the letter goes is <a href="${APP_URL}/portrait" style="color:#4a5f5d;">still open</a> — whenever a sentence feels true, come back and write it. One line is enough; it&#39;s the part I build from.`;

  const nextText = `Here is what happens next, plainly. I go looking for the real thing — the master still practicing, the place where the craft is genuinely alive, the handful of people you'd want in the room. When I have something true to offer — the first is taking shape around a modernist kitchen in Barcelona, this autumn — you'll hear it from me before anyone else. Not a newsletter. A letter back.`;
  const replyText = `If there's anything you almost wrote and didn't — just hit reply. It comes straight to me, and I answer myself.`;

  const P = `color:#2c231a;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.8;margin:0 0 18px 0;`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <p style="color:rgba(243,237,226,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 16px 0;font-family:'Courier New',monospace;text-align:center;">The Circle &middot; your place is sealed</p>
    <div style="background:#efe6d3;border:1px solid #e2d6bd;border-radius:6px;padding:34px 32px 28px;box-shadow:0 30px 60px -24px rgba(0,0,0,0.6);">
      <p style="color:#2c231a;font-family:Georgia,'Times New Roman',serif;font-size:19px;margin:0 0 18px 0;">${esc(name) || "Hello"},</p>
      <p style="${P}">${openerHtml}</p>
      <p style="${P}">${esc(craftsLine)}</p>
      <p style="${P}">${esc(nextText)}</p>
      <p style="${P}margin-bottom:24px;">${esc(replyText)}</p>
      <p style="color:#6f6350;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;margin:0;">Speak soon,</p>
      <p style="color:#3a2c1e;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;margin:2px 0 0 0;">Arnaud</p>
    </div>
    <div style="margin-top:36px;padding-top:22px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="${APP_URL}/browse" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">Wander the Atlas while you wait</a></p>
    </div>
  </div>
</body></html>`;

  const text = `${name || "Hello"},

${openerText}

${craftsLine}

${nextText}

${replyText}

Speak soon,
Arnaud

—
Skills last, tans fade
Wander the Atlas while you wait: ${APP_URL}/browse`;

  return { subject: "Your portrait is on my desk", html, text };
}

async function sendResend(payload: Record<string, unknown>): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, status: res.status, error: await res.text() };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "missing auth" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Render-only self-test: requires the SERVICE key as bearer, fixture data
  // only, zero DB reads, zero sends. (Anon-key callers never reach this.)
  if (jwt === SERVICE_ROLE) {
    const body = await req.json().catch(() => ({}));
    if (body?.dryRun) {
      const sample = {
        first_name: "Aiko", profession: "marine biologist", location: "Lisbon",
        status: "I outgrew the thing I chose too early",
        interests: { ocean: ["Freediving"], culinary: ["Sushi & Washoku"], creative: ["the old way of smoking fish"] },
        previous_experience: "I’ve dabbled", availability: "ten days in October, realistically",
        preferred_duration: "A full week or more", reach: "Across the world for the right one",
        dream_letter: "Arnaud,\n\nThe craft I can't stop thinking about is sushi — not restaurant sushi, the discipline underneath it.\n\nSpeak soon,",
        portrait_completed_at: new Date().toISOString(),
      };
      const w = memberWelcome(sample, "sample@example.com");
      return json({
        ok: true, dryRun: true, welcomeEnabled: WELCOME_ON,
        notifySubject: "New portrait: Aiko", notifyHtmlLength: fullSheetHtml(sample, "sample@example.com").length,
        welcomeSubject: w.subject, welcomeHtmlLength: w.html.length,
      });
    }
    return json({ error: "service key accepted, but no dryRun flag" }, 400);
  }

  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (uErr || !user) return json({ error: "invalid auth" }, 401);

  const { data: rec, error: pErr } = await admin
    .from("profiles").select("*").eq("id", user.id).single();
  if (pErr || !rec) return json({ error: "no profile" }, 404);
  if (rec.portrait_complete !== true) return json({ skipped: "portrait not complete" });

  const email = user.email || rec.email || "";
  const name = rec.first_name || "A new member";
  const crafts = flattenCrafts(rec.interests);
  const letter = String(rec.dream_letter || "").trim();

  // 1) Arnaud's full sheet.
  const subject = `New portrait: ${name}` +
    (crafts.length ? ` — ${crafts[0]}${crafts.length > 1 ? ` +${crafts.length - 1}` : ""}` : "") +
    (letter ? " · with a letter" : "");
  const notify = await sendResend({
    from: FROM_NOTIFY, to: NOTIFY_TO, reply_to: email || undefined,
    subject, html: fullSheetHtml(rec, email),
  });
  if (!notify.ok) console.error("[notify-portrait] notify send failed:", notify.status, notify.error);

  // 2) The member's letter back — flag-gated, once per member.
  let welcomed = false;
  if (WELCOME_ON && email && !rec.portrait_welcomed_at) {
    const w = memberWelcome(rec, email);
    const sent = await sendResend({
      from: FROM_MEMBER, to: email, reply_to: REPLY_TO_MEMBER,
      subject: w.subject, html: w.html, text: w.text,
    });
    if (sent.ok) {
      welcomed = true;
      const { error: stampErr } = await admin.from("profiles")
        .update({ portrait_welcomed_at: new Date().toISOString() }).eq("id", user.id);
      if (stampErr) console.error("[notify-portrait] welcome stamp failed:", stampErr.message);
    } else {
      console.error("[notify-portrait] welcome send failed:", sent.status, sent.error);
    }
  }

  if (!notify.ok) return json({ error: "notify failed", welcomed }, 502);
  return json({ ok: true, emailed: NOTIFY_TO, welcomed });
});
