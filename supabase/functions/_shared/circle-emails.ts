// The Circle — newsletter email templates + Resend sender.
// Warm-Dark Editorial, email-safe (matches docs/email-templates + the auth emails).
// Voice lock: connect/introduce, never sell. No banned words. Source of the copy:
// marketing/circle/welcome-email.html + issue-01.html.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const REPLY_TO = "founder@educatedtraveler.app";

function shell(opts: {
  eyebrow: string; heading: string; body: string; unsub: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:rgba(243,237,226,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">${opts.eyebrow}</p>
      <p style="color:#f3ede2;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.5;margin:0 0 18px 0;">${opts.heading}</p>
      ${opts.body}
    </div>
    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:rgba(243,237,226,0.5);font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:rgba(243,237,226,0.25);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
      <p style="color:rgba(243,237,226,0.18);font-size:10px;line-height:1.6;margin:14px 0 0 0;">You're receiving this because you joined the Circle at educatedtraveler.app.<br><a href="${opts.unsub}" style="color:rgba(243,237,226,0.3);">Leave the Circle</a></p>
    </div>
  </div>
</body></html>`;
}

const P = "color:rgba(243,237,226,0.7);font-size:15px;line-height:1.7;";
const GIFT = "background:rgba(127,168,165,0.06);border-left:2px solid #d28a52;border-radius:8px;padding:18px 20px;margin:0 0 22px 0;";
const BTN = "display:inline-block;background:linear-gradient(135deg,#7fa8a5 0%,#d28a52 100%);color:#14110d;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;";
const QSER = "color:#f3ede2;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;margin:8px 0 0 0;";

function welcomeHtml(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 22px 0;">You're in. Before anything else, here's the reason the Circle exists — one place worth knowing.</p>
      <div style="${GIFT}">
        <p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0;">In <strong style="color:#f3ede2;">Mashiko</strong>, a quiet town a couple of hours north of Tokyo, the climbing kilns have breathed for a hundred years. A potter named Shoji Hamada settled there in 1924 and gave his life to a simple idea: that plain, useful, handmade things are worth devoting yourself to. The families who learned beside him never left, and people still come from across the world to put their hands in that clay. Mashiko isn't the prettiest town in Japan. It's something rarer — a place where a craft is genuinely alive, and the right people are gathered around it.</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">That's the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, ranked not by who pays us, but by the strength of the community you'd find when you arrived.</p>
      <p style="${P}margin:0 0 16px 0;">I'm Arnaud. I cook for a living, and I've spent fifteen years on the water — sailing, freediving, learning my own trade at the source. Pottery isn't my craft, and that is exactly the point: this was never meant to be about me. It's about helping you find the real version of whatever pulls at you, and the people already chasing it.</p>
      <p style="${P}margin:0 0 28px 0;">How the Circle works is short. I don't sell anything. As the Atlas grows, I send you the places and the people worth knowing — and when the moment is right, I introduce you. That's all. Skills last; the rest fades.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/repertoire" style="${BTN}">Open the Atlas</a></div>
      <p style="${P}margin:24px 0 0 0;">And one thing I'd genuinely like to know — just hit reply:</p>
      <p style="${QSER}">What is the one skill you'd give a real week of your life to learn at the source?</p>
      <p style="color:rgba(243,237,226,0.5);font-size:14px;line-height:1.7;margin:14px 0 0 0;">I read every reply.</p>`;
  return shell({ eyebrow: "Welcome to the Circle", heading: "A place, a person, your people.", body, unsub });
}

function issue01Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 16px 0;">This is the first proper letter from the Circle. Here's how it will go: now and then, one place worth knowing — a single craft, the town where it's most alive, and the people you'd meet if you went. No selling. Just the map, and the occasional introduction.</p>
      <p style="${P}margin:0 0 22px 0;">So. The deep.</p>
      <div style="${GIFT}">
        <p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0 0 14px 0;">There's a town on the Sinai coast called <strong style="color:#f3ede2;">Dahab</strong>, and just off it, a flat, current-free, almost perfectly round hole in the reef — the Blue Hole. It stays warm and deep all year, which is why it has quietly become the place freedivers from every country come to: to go down a line on a single breath and find out who they are at forty metres.</p>
        <p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0;">The water made the scene, and the scene made the schools. You can arrive able to hold your breath for thirty seconds and, inside a real cohort with a patient instructor, leave breathing in a way you didn't know your body could.</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">I've spent enough time underwater to tell you the truth about it: freediving isn't really about the lungs. It's about letting go — of the surface, of the noise, of the part of you that panics. You can't learn that from a screen, and you shouldn't learn it alone. You learn it on a line, with someone watching, beside people doing the same quiet, frightening thing.</p>
      <p style="${P}margin:0 0 28px 0;">The lineage runs deep here, too. This is the discipline of Jacques Mayol and Enzo Maiorca — the men <em style="color:rgba(243,237,226,0.85);">The Big Blue</em> was built on. The path is simple and real: AIDA or Molchanovs, level by level, until one day you're the calm one on the line.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas/freediving--dahab-red-sea" style="${BTN}">See who gathers in Dahab</a></div>
      <p style="color:rgba(243,237,226,0.45);font-size:13px;line-height:1.6;margin:0;text-align:center;">The schools worth writing to are on the page — Freedive Dahab among them.</p>
      <p style="${P}margin:28px 0 0 0;">And the question, if you'll humour me — just hit reply:</p>
      <p style="${QSER}">Have you ever held your breath and gone down — even to the bottom of a pool? Tell me how it felt.</p>
      <p style="color:rgba(243,237,226,0.5);font-size:14px;line-height:1.7;margin:14px 0 0 0;">And if the whole idea frightens you a little, tell me that instead. Both are exactly the right reason to go.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 1", heading: "Where the divers go to find the deep", body, unsub });
}

function issue02Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 22px 0;">Here's something you can carry to your next dinner table.</p>
      <div style="${GIFT}">
        <p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0;">On the Basque coast, in San Sebastián, there's a small, plain-looking thing speared on a toothpick: one silver Cantabrian anchovy, one green olive, one slim pickled green pepper. It's called a <strong style="color:#f3ede2;">Gilda</strong>, and it was the first pintxo anyone ever bothered to name. A regular at a bar called Casa Vallés invented it in the mid-1940s — not a chef, just a hungry local — and the room christened it after the Rita Hayworth film scandalising Spain at the time, because the bite was exactly like her character: salty, green, and a little bit spicy. Order one today and you're eating a 1940s in-joke that quietly started a global food movement. (The word <em style="color:rgba(243,237,226,0.85);">pintxo</em> comes from <em style="color:rgba(243,237,226,0.85);">pincho</em> — the spike that pins it together.)</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">That's the thing about this town: the food wears its history on the surface, if you know how to read it.</p>
      <p style="${P}margin:0 0 16px 0;">Walk the old quarter at seven in the evening and watch how they eat. Nobody sits down to dinner. They move — bar to bar, the <em style="color:rgba(243,237,226,0.85);">txikiteo</em> — standing at the counter, one perfect pintxo and a small glass of txakoli (the local white, poured from a height to wake it up) at each stop, then on to the next. For an hour the whole town becomes one long conversation you can taste.</p>
      <p style="${P}margin:0 0 16px 0;">But here's the part almost no visitor sees — and the real engine of it all. Behind unmarked doors, some of them older than your great-grandparents, San Sebastián hides its <strong style="color:#f3ede2;">txokos</strong>: private members' cooking clubs, for generations men-only, where friends gather to cook elaborate meals for each other, by hand, for no one but themselves. Here, knowing how to cook well was never just a job — it was how you earned your standing among the people you love. A whole city raised to treat cooking as something you do <em style="color:rgba(243,237,226,0.85);">for your people</em>, not for a bill.</p>
      <p style="${P}margin:0 0 16px 0;">Now the rest makes sense. This city of 186,000 holds the highest concentration of Michelin stars per person on earth — three of them three-star kitchens, ringed around one small bay. In the 1970s two locals, Juan Mari Arzak and Pedro Subijana, came home from France with the ideas of nouvelle cuisine, refused to merely copy them, and built something of their own: Nueva Cocina Vasca. The world followed. Later the Basques did what no one else had — they founded the Basque Culinary Center, a full university faculty for cooking, grown straight out of that same circle.</p>
      <p style="${P}margin:0 0 16px 0;">I cook in the French tradition, and we like to think we wrote the rules. What stays with me about the Basques is that they never split the food from the company. The cooking turned radical; the eating stayed communal. The txoko and the three-star kitchen are the same instinct at two volumes.</p>
      <p style="${P}margin:0 0 28px 0;">That, in one town, is the whole reason I'm building this. A skill is the doorway; the people are the room.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas/new-basque-cuisine--san-sebasti-n-donostia" style="${BTN}">See where Basque cooking was reborn</a></div>
      <p style="color:rgba(243,237,226,0.45);font-size:13px;line-height:1.6;margin:0;text-align:center;">The Basque Culinary Center and the starred kitchens are on the page.</p>
      <p style="${P}margin:28px 0 0 0;">And the question — just hit reply:</p>
      <p style="${QSER}">Where have you eaten that made you feel part of something, even for an hour?</p>
      <p style="color:rgba(243,237,226,0.5);font-size:14px;line-height:1.7;margin:14px 0 0 0;">Tell me the place — and who you were standing next to.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 2", heading: "The snack named after a movie star", body, unsub });
}

export const ISSUES: Record<string, { subject: string; html: (unsub: string) => string }> = {
  "welcome": { subject: "Welcome to the Circle — one place worth knowing", html: welcomeHtml },
  "issue-01": { subject: "The Circle, Letter Nº 1 — where the divers go to find the deep", html: issue01Html },
  "issue-02": { subject: "The Circle, Letter Nº 2 — the snack named after a movie star", html: issue02Html },
};

export async function sendCircleEmail(
  to: string, subject: string, html: string, unsubUrl: string,
): Promise<{ ok: boolean; id?: string; error?: unknown }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data };
  return { ok: true, id: data.id };
}
