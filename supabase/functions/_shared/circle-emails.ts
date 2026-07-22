// The Circle — newsletter email templates + Resend sender.
// Warm-Dark Editorial, email-safe (matches docs/email-templates + the auth emails).
// Voice lock: connect/introduce, never sell. No banned words. Source of the copy:
// marketing/circle/welcome-email.html + issue-01.html.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
const REPLY_TO = "founder@educatedtraveler.app";

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

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

function issue03Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 22px 0;">Here's something worth knowing before you ever plan a trip around food.</p>
      <div style="${GIFT}">
        <p style="color:rgba(243,237,226,0.82);font-size:15px;line-height:1.75;margin:0;">You can eat at noma. You can, if you book months ahead, eat at <strong style="color:#f3ede2;">Disfrutar</strong> in Barcelona — named the best restaurant in the world in 2024. What you cannot do is <em style="color:rgba(243,237,226,0.85);">learn</em> in either of them. The world's most celebrated kitchens are restaurants, not schools. The only way in is a <em style="color:rgba(243,237,226,0.85);">stage</em>: an unpaid, fiercely contested apprenticeship you apply for and almost never get. The talent is real. The door is shut.</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">So the most valuable person in any craft isn't the most famous one. It's the master who will actually <strong style="color:#f3ede2;">teach</strong> you. They are rarer than you'd think — and finding them, by hand, is most of what I do. Three I'd send a friend to tomorrow:</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#f3ede2;">In Barcelona — Martín Lippo.</strong> An Argentine chef who arrived in 2000 and became one of Spain's pioneers of sous-vide and low-temperature cooking. He took the avant-garde toolkit that Ferran Adrià unleashed — the foams, the spherification, the work with liquid nitrogen — and instead of guarding it behind a restaurant pass, he built a laboratory called <em style="color:rgba(243,237,226,0.85);">Vakuum</em> to teach it, hands-on, to anyone serious enough to show up. I met him there, in person. The door is open.</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#f3ede2;">In Bologna — Alessandra Spisni.</strong> A <em style="color:rgba(243,237,226,0.85);">sfoglina</em>: she rolls pasta by hand with a meter-long pin, the way Emilia-Romagna has for centuries. Since 1993 she has run the one school in the world dedicated to training <em style="color:rgba(243,237,226,0.85);">sfogline</em> — the women who keep tortellini and tagliatelle alive as living knowledge, not a museum piece.</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#f3ede2;">In Caracas — María Fernanda Di Giacobbe.</strong> At the source of Venezuela's legendary <em style="color:rgba(243,237,226,0.85);">criollo</em> cacao, she won the first-ever Basque Culinary World Prize — the cooking world's closest thing to a Nobel — for one idea: teach people to make chocolate <em style="color:rgba(243,237,226,0.85);">from the seed</em>. Her lab trains chocolate-makers where the bean actually grows.</p>
      <p style="${P}margin:0 0 16px 0;">What links them isn't fame. It's that they teach — at the source, with their own hands on the work beside yours. That is the rarest and most valuable thing in any craft, and almost nobody is mapping it.</p>
      <p style="${P}margin:0 0 28px 0;">So I've started to. On the Atlas, the places where a real master will actually take you on now carry a single mark — <strong style="color:#f3ede2;">Enrol with the master.</strong> It's the opposite of a listicle ranked by who paid, and the opposite of a screen you watch alone. It's a door, with a name on it.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas" style="${BTN}">Find a master who teaches</a></div>
      <p style="color:rgba(243,237,226,0.45);font-size:13px;line-height:1.6;margin:0;text-align:center;">The masters above, and the rest, are on the Atlas.</p>
      <p style="${P}margin:28px 0 0 0;">And a question — just hit reply:</p>
      <p style="${QSER}">Which craft would you cross an ocean to learn, if someone who'd actually teach you were waiting?</p>
      <p style="color:rgba(243,237,226,0.5);font-size:14px;line-height:1.7;margin:14px 0 0 0;">Tell me the craft — and I'll tell you who I'd point you toward.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 3", heading: "The rarest thing in a kitchen isn't talent", body, unsub });
}

// Founding letter — sent once to the first signups + the friends Arnaud gathered
// by hand. Thank-you + the vision + a share ask. Personal voice, B&W portrait.
function foundingHtml(unsub: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="text-align:center;margin-bottom:26px;">
      <img src="https://educatedtraveler.app/images/arnaud-portrait.jpg" width="150" alt="Arnaud" style="width:150px;height:150px;object-fit:cover;border-radius:14px;border:1px solid rgba(243,237,226,0.12);filter:grayscale(1);display:inline-block;">
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:rgba(243,237,226,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 22px 0;font-family:'Courier New',monospace;">The Circle &middot; Letter 01</p>
      <p style="color:#f3ede2;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.55;margin:0 0 20px 0;">Hey you &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">You're getting this because you're one of mine &mdash; family, or a friend I've talked half to death about this idea. Some of you signed up just to get me to stop going on about it. Either way: thank you. I mean it.</p>
      <p style="${P}margin:0 0 18px 0;">So here's the thing I won't shut up about.</p>
      <p style="${P}margin:0 0 18px 0;">I cook on boats now. But the first time anyone put a knife in my hand, I was the dishwasher in a little Mexican kitchen in Darwin. One afternoon, after lunch service, they were short a pair of hands &mdash; the chef pulled me off the sink, slid a board over and told me to slice an onion. I'd never done it. But being shown, right next to someone who knew how, taught me more than any classroom could. Almost everything I can do, I picked up like that. Never off a screen.</p>
      <p style="${P}margin:0 0 18px 0;">EducatedTraveler is me trying to bottle that:</p>
      <p style="${P}margin:0 0 18px 0;"><strong style="color:#f3ede2;">A map of where those people still are</strong> &mdash; where a skill is still alive and someone teaches it by hand: freediving, pottery, pastry, sailing, the breath on a mat. Ranked by how good the people are, not who pays me. Nothing on it I wouldn't send you to myself.</p>
      <p style="${P}margin:0 0 18px 0;"><strong style="color:#f3ede2;">And a short letter</strong>, every couple of weeks: one place, one skill, the people who keep it, and how to go. No selling &mdash; just pointing you at the good stuff. Down the line, when I find a school worth it, I'll set one up with them and you lot hear first.</p>
      <p style="${P}margin:0 0 18px 0;">Truth is, I'm learning all of this as I go &mdash; the website, this letter, all of it new to me. So I'm building it with you: any idea or bit of feedback you've got, I'd genuinely love to hear it. We're early, and you're early with me.</p>
      <p style="${P}margin:0 0 26px 0;">And one favour: if someone comes to mind who'd love this, send them the door. A word from you is worth more than anything right now.</p>
      <div style="text-align:center;margin:26px 0;"><a href="https://educatedtraveler.app" style="${BTN}">Share educatedtraveler.app</a></div>
      <p style="${P}margin:22px 0 0 0;">Thank you for being here at the start. Truly.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:rgba(243,237,226,0.62);font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;margin:0;">Bisous, les amis.</p>
      <p style="color:rgba(243,237,226,0.62);font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;margin:2px 0 0 0;">&mdash; Arnaud</p>
      <p style="color:rgba(243,237,226,0.28);font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>
    <div style="margin-top:24px;padding:18px 20px;background:rgba(210,138,82,0.05);border-left:2px solid rgba(210,138,82,0.5);border-radius:0 10px 10px 0;">
      <p style="color:rgba(243,237,226,0.7);font-size:14px;line-height:1.7;margin:0;"><strong style="color:#d28a52;">P.S.</strong> Me, right now? I want to learn breathwork &mdash; maybe massage too. What's yours: if you could disappear for two weeks and learn one thing by hand, what would it be? Hit reply.</p>
    </div>
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
      <p style="color:rgba(243,237,226,0.18);font-size:10px;line-height:1.6;margin:14px 0 0 0;">You're receiving this because you joined the Circle (or asked me to keep you posted) at educatedtraveler.app.<br><a href="${unsub}" style="color:rgba(243,237,226,0.3);">Leave the Circle</a></p>
    </div>
  </div>
</body></html>`;
}

// Portrait invite — sent once to the people who subscribed before /portrait
// existed. Asks them to take their place: tell Arnaud, in their own words, the
// craft they'd give a week to, and write him the letter. CTA -> /portrait
// (the page handles sign-in itself via magic link, so no per-recipient token).
function portraitInviteHtml(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 18px 0;">You joined the Circle a while ago &mdash; and I haven't forgotten it. I've been building quietly since, and there's now something I made for the people who were here first. You're one of them.</p>
      <p style="${P}margin:0 0 18px 0;">It's a single page. On it, you tell me &mdash; in your own words &mdash; the one craft you'd give a real week of your life to learn. And if you want, you write me a letter. Not a form with a letter-shaped box: a real letter. It opens <em style="color:rgba(243,237,226,0.85);">&ldquo;Arnaud,&rdquo;</em> and mine is the only pair of eyes that will ever read it.</p>
      <p style="${P}margin:0 0 18px 0;">Here's why it matters. I don't sell you a week. I take what you tell me and go find the real thing &mdash; the master still teaching by hand, the place where the craft is genuinely alive, the handful of people you'd want beside you. Then I open the door. The clearer you are with me, the better I aim. The first one is already taking shape around a modernist kitchen in Barcelona, this autumn.</p>
      <div style="text-align:center;margin:30px 0;"><a href="https://educatedtraveler.app/portrait" style="${BTN}">Take your place &rarr;</a></div>
      <p style="${P}margin:22px 0 0 0;">Five minutes, if you're quick. Twenty, if the letter gets away from you. Both are exactly right.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; a door with your name on it", heading: "Now tell me what you'd give a week of your life to learn.", body, unsub });
}

// Chef invite — a 1:1 personal note to chefs Arnaud has spoken with about the
// modernist week. Name-aware, no bulk unsubscribe footer (this is a personal
// email, not a broadcast). CTA -> /portrait to join the Circle for the details.
function chefInviteHtml(_unsub: string, name?: string): string {
  const hi = name && name.trim() ? esc(name.trim()) : "chef";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:34px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:#f3ede2;font-family:Georgia,'Times New Roman',serif;font-size:19px;margin:0 0 20px 0;">Hey ${hi} &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">Good to talk shop with you about the modernist week. It's moving from an idea toward the real thing now &mdash; a week in Barcelona, this autumn, built around modernist and low-temperature technique at the source: a proper master, a small room, and the kind of hands-on days we don't get once we're cooking for a living.</p>
      <p style="${P}margin:0 0 18px 0;">I'm keeping the details close while the dates and the master's side lock in &mdash; but I want you near it as it firms up, ahead of anyone else.</p>
      <p style="${P}margin:0 0 22px 0;">Simplest way to do that: I built a page where you tell me, in your own words, what you'd want out of a week like this &mdash; the technique, the people, the reason it pulls at you. Do that and you're in the Circle, which just means I write you first when the week is real, with everything you'd need to decide.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/portrait" style="${BTN}">Tell me what you'd want &rarr;</a></div>
      <p style="${P}margin:20px 0 0 0;">Five minutes, tops. And either way &mdash; let's keep talking. You know where I am.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:rgba(243,237,226,0.55);font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0;">&mdash; Arnaud</p>
      <p style="color:rgba(243,237,226,0.25);font-size:12px;margin:4px 0 0 0;">EducatedTraveler</p>
    </div>
    <div style="margin-top:34px;padding-top:22px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;
}

// Friend invite — a 1:1 personal note to a friend who's been on the list since
// the start (no modernist-week claim, no bulk footer). Name-aware, CTA -> /portrait.
function friendInviteHtml(_unsub: string, name?: string): string {
  const hi = name && name.trim() ? esc(name.trim()) : "you";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:34px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#f3ede2;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#7fa8a5;">TRAVELER</span>
    </div>
    <div style="background:rgba(243,237,226,0.03);border:1px solid rgba(243,237,226,0.08);border-radius:16px;padding:36px 28px;">
      <p style="color:#f3ede2;font-family:Georgia,'Times New Roman',serif;font-size:19px;margin:0 0 20px 0;">Hey ${hi} &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">It's Arnaud. You were one of the first people I told about EducatedTraveler &mdash; you've been on the list since the very start &mdash; and I've quietly been building the thing I kept going on about.</p>
      <p style="${P}margin:0 0 18px 0;">It's finally real enough to show you properly. I made a page where you tell me, in your own words, the one craft you'd give a week of your life to learn &mdash; and, if you feel like it, write me a letter. It opens <em style="color:rgba(243,237,226,0.85);">&ldquo;Arnaud,&rdquo;</em> and I read every one myself.</p>
      <p style="${P}margin:0 0 22px 0;">I don't sell you a week. I take what you tell me and go find the real thing &mdash; the master still teaching by hand, the place where the craft is alive, and your people &mdash; then I open the door.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/portrait" style="${BTN}">Take your place &rarr;</a></div>
      <p style="${P}margin:20px 0 0 0;">Would mean a lot to have you properly in. And either way &mdash; good to have you here from the start. Let's catch up soon.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:rgba(243,237,226,0.55);font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0;">&mdash; Arnaud</p>
      <p style="color:rgba(243,237,226,0.25);font-size:12px;margin:4px 0 0 0;">EducatedTraveler</p>
    </div>
    <div style="margin-top:34px;padding-top:22px;border-top:1px solid rgba(243,237,226,0.06);text-align:center;">
      <p style="color:rgba(243,237,226,0.15);font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:rgba(127,168,165,0.5);font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;
}

// Letter-style shell: no forced background, no wordmark header, no buttons — the
// structure of personal correspondence, which is also what keeps the Circle out of
// the Promotions tab. Used by the welcome; other templates migrate on approval.
function plainShell(opts: { body: string; unsub: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:#222222;">
${opts.body}
    <p style="margin:40px 0 0 0;font-size:12px;color:#8a8a8a;">EducatedTraveler · <a href="https://educatedtraveler.app" style="color:#5f8582;">educatedtraveler.app</a> · <a href="${opts.unsub}" style="color:#9a9a9a;">Leave the Circle</a></p>
  </div>
</body></html>`;
}

const LP = 'style="margin:0 0 18px 0;"';

function welcomePlainHtml(unsub: string): string {
  const body = `
    <p style="margin:0 0 18px 0;font-style:italic;color:#555555;">A place, a person, your people.</p>
    <p ${LP}>You're in. Before anything else, here's the reason the Circle exists — one place worth knowing.</p>
    <p ${LP}>In <strong>Mashiko</strong>, a quiet town a couple of hours north of Tokyo, the climbing kilns have breathed for a hundred years. A potter named Shoji Hamada settled there in 1924 and gave his life to a simple idea: that plain, useful, handmade things are worth devoting yourself to. The families who learned beside him never left, and people still come from across the world to put their hands in that clay. Mashiko isn't the prettiest town in Japan. It's something rarer — a place where a craft is genuinely alive, and the right people are gathered around it.</p>
    <p ${LP}>That's the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, ranked not by who pays us, but by the strength of the community you'd find when you arrived.</p>
    <p ${LP}>I'm Arnaud. I cook for a living, and I've spent fifteen years on the water — sailing, freediving, learning my own trade at the source. Pottery isn't my craft, and that is exactly the point: this was never meant to be about me. It's about helping you find the real version of whatever pulls at you, and the people already chasing it.</p>
    <p ${LP}>How the Circle works is short. I don't sell anything. As the Atlas grows, I send you the places and the people worth knowing — and when the moment is right, I introduce you. That's all. Skills last; the rest fades.</p>
    <p ${LP}>The Atlas is here: <a href="https://educatedtraveler.app/repertoire" style="color:#5f8582;">educatedtraveler.app/repertoire</a></p>
    <p ${LP}>And one thing I'd genuinely like to know — just hit reply:</p>
    <p style="margin:0 0 18px 0;"><strong>What is the one skill you'd give a real week of your life to learn at the source?</strong></p>
    <p ${LP}>I read every reply.</p>
    <p style="margin:28px 0 0 0;">— Arnaud</p>`;
  return plainShell({ body, unsub });
}

function welcomeText(unsub: string): string {
  return `A place, a person, your people.

You're in. Before anything else, here's the reason the Circle exists — one place worth knowing.

In Mashiko, a quiet town a couple of hours north of Tokyo, the climbing kilns have breathed for a hundred years. A potter named Shoji Hamada settled there in 1924 and gave his life to a simple idea: that plain, useful, handmade things are worth devoting yourself to. The families who learned beside him never left, and people still come from across the world to put their hands in that clay. Mashiko isn't the prettiest town in Japan. It's something rarer — a place where a craft is genuinely alive, and the right people are gathered around it.

That's the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, ranked not by who pays us, but by the strength of the community you'd find when you arrived.

I'm Arnaud. I cook for a living, and I've spent fifteen years on the water — sailing, freediving, learning my own trade at the source. Pottery isn't my craft, and that is exactly the point: this was never meant to be about me. It's about helping you find the real version of whatever pulls at you, and the people already chasing it.

How the Circle works is short. I don't sell anything. As the Atlas grows, I send you the places and the people worth knowing — and when the moment is right, I introduce you. That's all. Skills last; the rest fades.

The Atlas is here: https://educatedtraveler.app/repertoire

And one thing I'd genuinely like to know — just hit reply:

What is the one skill you'd give a real week of your life to learn at the source?

I read every reply.

— Arnaud

--
EducatedTraveler · educatedtraveler.app
Leave the Circle: ${unsub}`;
}

export const ISSUES: Record<string, {
  subject: string;
  html: (unsub: string, name?: string) => string;
  text?: (unsub: string) => string;
  // audience "leads" = an invite/conversion email ("join", "take your place"):
  //   broadcast MUST skip anyone who already has a member account, or a member
  //   gets told to join the thing they're already in (bug: Jeremie et al., Jul 2026).
  // undefined / "all" = a Circle letter everyone in the Circle should get.
  audience?: "leads" | "all";
}> = {
  "welcome": { subject: "Welcome to the Circle — one place worth knowing", html: welcomePlainHtml, text: welcomeText, audience: "leads" },
  "portrait-invite": { subject: "Take your place in the Circle", html: portraitInviteHtml, audience: "leads" },
  "chef-invite": { subject: "That modernist cooking week — I want you close to it", html: chefInviteHtml, audience: "leads" },
  "friend-invite": { subject: "The thing I kept going on about — it's real now", html: friendInviteHtml, audience: "leads" },
  "issue-01": { subject: "The Circle, Letter Nº 1 — where the divers go to find the deep", html: issue01Html },
  "issue-02": { subject: "The Circle, Letter Nº 2 — the snack named after a movie star", html: issue02Html },
  "issue-03": { subject: "The Circle, Letter Nº 3 — the rarest thing in a kitchen isn't talent", html: issue03Html },
};

// 1:1 personal send — no List-Unsubscribe (not a bulk mailing).
export async function sendPersonalEmail(
  to: string, subject: string, html: string,
): Promise<{ ok: boolean; id?: string; error?: unknown }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data };
  return { ok: true, id: data.id };
}

export async function sendCircleEmail(
  to: string, subject: string, html: string, unsubUrl: string, text?: string,
): Promise<{ ok: boolean; id?: string; error?: unknown }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
      ...(text ? { text } : {}),
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
