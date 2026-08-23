// The Circle — newsletter email templates + Resend sender.
// Warm-Dark Editorial, email-safe (matches docs/email-templates + the auth emails).
// Voice lock: connect/introduce, never sell. No banned words. Source of the copy:
// marketing/circle/welcome-email.html + issue-01.html.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Arnaud · EducatedTraveler <founder@educatedtraveler.app>";
// Replies go straight to Arnaud's Proton inbox (his order, 2026-07-22).
// FROM stays on the domain — that's what DKIM/DMARC align on; Reply-To
// doesn't affect authentication.
const REPLY_TO = "arnaudcallier@pm.me";

function esc(s: unknown) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function shell(opts: {
  eyebrow: string; heading: string; body: string; unsub: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:36px 28px;">
      <p style="color:#6b625a;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 24px 0;font-family:'Courier New',monospace;">${opts.eyebrow}</p>
      <p style="color:#2b2621;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.5;margin:0 0 18px 0;">${opts.heading}</p>
      ${opts.body}
    </div>
    <div style="margin-top:32px;padding:0 4px;">
      <p style="color:#6b625a;font-size:14px;line-height:1.6;margin:0;">— Arnaud</p>
      <p style="color:#7a726a;font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e6ded1;text-align:center;">
      <p style="color:#7a726a;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:#3f6b67;font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
      <p style="color:#7a726a;font-size:10px;line-height:1.6;margin:14px 0 0 0;">You're receiving this because you joined the Circle at educatedtraveler.app.<br><a href="${opts.unsub}" style="color:#7a726a;">Leave the Circle</a></p>
    </div>
  </div>
</body></html>`;
}

const P = "color:#3d3630;font-size:15px;line-height:1.7;";
const GIFT = "background:#f2f6f5;border-left:2px solid #b06f33;border-radius:8px;padding:18px 20px;margin:0 0 22px 0;";
const BTN = "display:inline-block;background-color:#3f6b67;background:linear-gradient(135deg,#3f6b67 0%,#8f5820 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;";
const QSER = "color:#2b2621;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;margin:8px 0 0 0;";

function issue01Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 16px 0;">This is the first proper letter from the Circle. Here's how it will go: now and then, one place worth knowing — a single craft, the town where it's most alive, and the people you'd meet if you went. No selling. Just the map, and the occasional introduction.</p>
      <p style="${P}margin:0 0 22px 0;">So. The deep.</p>
      <div style="${GIFT}">
        <p style="color:#2b2621;font-size:15px;line-height:1.75;margin:0 0 14px 0;">There's a town on the Sinai coast called <strong style="color:#2b2621;">Dahab</strong>, and just off it, a flat, current-free, almost perfectly round hole in the reef — the Blue Hole. It stays warm and deep all year, which is why it has quietly become the place freedivers from every country come to: to go down a line on a single breath and find out who they are at forty metres.</p>
        <p style="color:#2b2621;font-size:15px;line-height:1.75;margin:0;">The water made the scene, and the scene made the schools. You can arrive able to hold your breath for thirty seconds and, inside a real cohort with a patient instructor, leave breathing in a way you didn't know your body could.</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">I've spent enough time underwater to tell you the truth about it: freediving isn't really about the lungs. It's about letting go — of the surface, of the noise, of the part of you that panics. You can't learn that from a screen, and you shouldn't learn it alone. You learn it on a line, with someone watching, beside people doing the same quiet, frightening thing.</p>
      <p style="${P}margin:0 0 28px 0;">The lineage runs deep here, too. This is the discipline of Jacques Mayol and Enzo Maiorca — the men <em style="color:#4a423b;">The Big Blue</em> was built on. The path is simple and real: AIDA or Molchanovs, level by level, until one day you're the calm one on the line.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas/freediving--dahab-red-sea" style="${BTN}">See who gathers in Dahab</a></div>
      <p style="color:#6b625a;font-size:13px;line-height:1.6;margin:0;text-align:center;">The schools worth writing to are on the page — Freedive Dahab among them.</p>
      <p style="${P}margin:28px 0 0 0;">And the question, if you'll humour me — just hit reply:</p>
      <p style="${QSER}">Have you ever held your breath and gone down — even to the bottom of a pool? Tell me how it felt.</p>
      <p style="color:#6b625a;font-size:14px;line-height:1.7;margin:14px 0 0 0;">And if the whole idea frightens you a little, tell me that instead. Both are exactly the right reason to go.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 1", heading: "Where the divers go to find the deep", body, unsub });
}

function issue02Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 22px 0;">Here's something you can carry to your next dinner table.</p>
      <div style="${GIFT}">
        <p style="color:#2b2621;font-size:15px;line-height:1.75;margin:0;">On the Basque coast, in San Sebastián, there's a small, plain-looking thing speared on a toothpick: one silver Cantabrian anchovy, one green olive, one slim pickled green pepper. It's called a <strong style="color:#2b2621;">Gilda</strong>, and it was the first pintxo anyone ever bothered to name. A regular at a bar called Casa Vallés invented it in the mid-1940s — not a chef, just a hungry local — and the room christened it after the Rita Hayworth film scandalising Spain at the time, because the bite was exactly like her character: salty, green, and a little bit spicy. Order one today and you're eating a 1940s in-joke that quietly started a global food movement. (The word <em style="color:#4a423b;">pintxo</em> comes from <em style="color:#4a423b;">pincho</em> — the spike that pins it together.)</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">That's the thing about this town: the food wears its history on the surface, if you know how to read it.</p>
      <p style="${P}margin:0 0 16px 0;">Walk the old quarter at seven in the evening and watch how they eat. Nobody sits down to dinner. They move — bar to bar, the <em style="color:#4a423b;">txikiteo</em> — standing at the counter, one perfect pintxo and a small glass of txakoli (the local white, poured from a height to wake it up) at each stop, then on to the next. For an hour the whole town becomes one long conversation you can taste.</p>
      <p style="${P}margin:0 0 16px 0;">But here's the part almost no visitor sees — and the real engine of it all. Behind unmarked doors, some of them older than your great-grandparents, San Sebastián hides its <strong style="color:#2b2621;">txokos</strong>: private members' cooking clubs, for generations men-only, where friends gather to cook elaborate meals for each other, by hand, for no one but themselves. Here, knowing how to cook well was never just a job — it was how you earned your standing among the people you love. A whole city raised to treat cooking as something you do <em style="color:#4a423b;">for your people</em>, not for a bill.</p>
      <p style="${P}margin:0 0 16px 0;">Now the rest makes sense. This city of 186,000 holds the highest concentration of Michelin stars per person on earth — three of them three-star kitchens, ringed around one small bay. In the 1970s two locals, Juan Mari Arzak and Pedro Subijana, came home from France with the ideas of nouvelle cuisine, refused to merely copy them, and built something of their own: Nueva Cocina Vasca. The world followed. Later the Basques did what no one else had — they founded the Basque Culinary Center, a full university faculty for cooking, grown straight out of that same circle.</p>
      <p style="${P}margin:0 0 16px 0;">I cook in the French tradition, and we like to think we wrote the rules. What stays with me about the Basques is that they never split the food from the company. The cooking turned radical; the eating stayed communal. The txoko and the three-star kitchen are the same instinct at two volumes.</p>
      <p style="${P}margin:0 0 28px 0;">That, in one town, is the whole reason I'm building this. A skill is the doorway; the people are the room.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas/new-basque-cuisine--san-sebasti-n-donostia" style="${BTN}">See where Basque cooking was reborn</a></div>
      <p style="color:#6b625a;font-size:13px;line-height:1.6;margin:0;text-align:center;">The Basque Culinary Center and the starred kitchens are on the page.</p>
      <p style="${P}margin:28px 0 0 0;">And the question — just hit reply:</p>
      <p style="${QSER}">Where have you eaten that made you feel part of something, even for an hour?</p>
      <p style="color:#6b625a;font-size:14px;line-height:1.7;margin:14px 0 0 0;">Tell me the place — and who you were standing next to.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 2", heading: "The snack named after a movie star", body, unsub });
}

function issue03Html(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 22px 0;">Here's something worth knowing before you ever plan a trip around food.</p>
      <div style="${GIFT}">
        <p style="color:#2b2621;font-size:15px;line-height:1.75;margin:0;">You can eat at noma. You can, if you book months ahead, eat at <strong style="color:#2b2621;">Disfrutar</strong> in Barcelona — named the best restaurant in the world in 2024. What you cannot do is <em style="color:#4a423b;">learn</em> in either of them. The world's most celebrated kitchens are restaurants, not schools. The only way in is a <em style="color:#4a423b;">stage</em>: an unpaid, fiercely contested apprenticeship you apply for and almost never get. The talent is real. The door is shut.</p>
      </div>
      <p style="${P}margin:0 0 16px 0;">So the most valuable person in any craft isn't the most famous one. It's the master who will actually <strong style="color:#2b2621;">teach</strong> you. They are rarer than you'd think — and finding them, by hand, is most of what I do. Three I'd send a friend to tomorrow:</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#2b2621;">In Barcelona — Martín Lippo.</strong> An Argentine chef who arrived in 2000 and became one of Spain's pioneers of sous-vide and low-temperature cooking. He took the avant-garde toolkit that Ferran Adrià unleashed — the foams, the spherification, the work with liquid nitrogen — and instead of guarding it behind a restaurant pass, he built a laboratory called <em style="color:#4a423b;">Vakuum</em> to teach it, hands-on, to anyone serious enough to show up. I met him there, in person. The door is open.</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#2b2621;">In Bologna — Alessandra Spisni.</strong> A <em style="color:#4a423b;">sfoglina</em>: she rolls pasta by hand with a meter-long pin, the way Emilia-Romagna has for centuries. Since 1993 she has run the one school in the world dedicated to training <em style="color:#4a423b;">sfogline</em> — the women who keep tortellini and tagliatelle alive as living knowledge, not a museum piece.</p>
      <p style="${P}margin:0 0 16px 0;"><strong style="color:#2b2621;">In Caracas — María Fernanda Di Giacobbe.</strong> At the source of Venezuela's legendary <em style="color:#4a423b;">criollo</em> cacao, she won the first-ever Basque Culinary World Prize — the cooking world's closest thing to a Nobel — for one idea: teach people to make chocolate <em style="color:#4a423b;">from the seed</em>. Her lab trains chocolate-makers where the bean actually grows.</p>
      <p style="${P}margin:0 0 16px 0;">What links them isn't fame. It's that they teach — at the source, with their own hands on the work beside yours. That is the rarest and most valuable thing in any craft, and almost nobody is mapping it.</p>
      <p style="${P}margin:0 0 28px 0;">So I've started to. On the Atlas, the places where a real master will actually take you on now carry a single mark — <strong style="color:#2b2621;">Enrol with the master.</strong> It's the opposite of a listicle ranked by who paid, and the opposite of a screen you watch alone. It's a door, with a name on it.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/atlas/" style="${BTN}">Find a master who teaches</a></div>
      <p style="color:#6b625a;font-size:13px;line-height:1.6;margin:0;text-align:center;">The masters above, and the rest, are on the Atlas.</p>
      <p style="${P}margin:28px 0 0 0;">And a question — just hit reply:</p>
      <p style="${QSER}">Which craft would you cross an ocean to learn, if someone who'd actually teach you were waiting?</p>
      <p style="color:#6b625a;font-size:14px;line-height:1.7;margin:14px 0 0 0;">Tell me the craft — and I'll tell you who I'd point you toward.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; Letter N&ordm; 3", heading: "The rarest thing in a kitchen isn't talent", body, unsub });
}

// Founding letter — sent once to the first signups + the friends Arnaud gathered
// by hand. Thank-you + the vision + a share ask. Personal voice, B&W portrait.
function foundingHtml(unsub: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="text-align:center;margin-bottom:26px;">
      <img src="https://educatedtraveler.app/images/arnaud-portrait.jpg" width="150" alt="Arnaud" style="width:150px;height:150px;object-fit:cover;border-radius:14px;border:1px solid #e6ded1;filter:grayscale(1);display:inline-block;">
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:36px 28px;">
      <p style="color:#6b625a;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:0 0 22px 0;font-family:'Courier New',monospace;">The Circle &middot; Letter 01</p>
      <p style="color:#2b2621;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.55;margin:0 0 20px 0;">Hey you &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">You're getting this because you're one of mine &mdash; family, or a friend I've talked half to death about this idea. Some of you signed up just to get me to stop going on about it. Either way: thank you. I mean it.</p>
      <p style="${P}margin:0 0 18px 0;">So here's the thing I won't shut up about.</p>
      <p style="${P}margin:0 0 18px 0;">I cook on boats now. But the first time anyone put a knife in my hand, I was the dishwasher in a little Mexican kitchen in Darwin. One afternoon, after lunch service, they were short a pair of hands &mdash; the chef pulled me off the sink, slid a board over and told me to slice an onion. I'd never done it. But being shown, right next to someone who knew how, taught me more than any classroom could. Almost everything I can do, I picked up like that. Never off a screen.</p>
      <p style="${P}margin:0 0 18px 0;">EducatedTraveler is me trying to bottle that:</p>
      <p style="${P}margin:0 0 18px 0;"><strong style="color:#2b2621;">A map of where those people still are</strong> &mdash; where a skill is still alive and someone teaches it by hand: freediving, pottery, pastry, sailing, the breath on a mat. Ranked by how good the people are, not who pays me. Nothing on it I wouldn't send you to myself.</p>
      <p style="${P}margin:0 0 18px 0;"><strong style="color:#2b2621;">And a short letter</strong>, every couple of weeks: one place, one skill, the people who keep it, and how to go. No selling &mdash; just pointing you at the good stuff. Down the line, when I find a school worth it, I'll set one up with them and you lot hear first.</p>
      <p style="${P}margin:0 0 18px 0;">Truth is, I'm learning all of this as I go &mdash; the website, this letter, all of it new to me. So I'm building it with you: any idea or bit of feedback you've got, I'd genuinely love to hear it. We're early, and you're early with me.</p>
      <p style="${P}margin:0 0 26px 0;">And one favour: if someone comes to mind who'd love this, send them the door. A word from you is worth more than anything right now.</p>
      <div style="text-align:center;margin:26px 0;"><a href="https://educatedtraveler.app" style="${BTN}">Share educatedtraveler.app</a></div>
      <p style="${P}margin:22px 0 0 0;">Thank you for being here at the start. Truly.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:#4a423b;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;margin:0;">Bisous, les amis.</p>
      <p style="color:#4a423b;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;margin:2px 0 0 0;">&mdash; Arnaud</p>
      <p style="color:#7a726a;font-size:12px;margin:4px 0 0 0;">Founder, EducatedTraveler</p>
    </div>
    <div style="margin-top:24px;padding:18px 20px;background:#fbf4ec;border-left:2px solid #b06f33;border-radius:0 10px 10px 0;">
      <p style="color:#3d3630;font-size:14px;line-height:1.7;margin:0;"><strong style="color:#8f5820;">P.S.</strong> Me, right now? I want to learn breathwork &mdash; maybe massage too. What's yours: if you could disappear for two weeks and learn one thing by hand, what would it be? Hit reply.</p>
    </div>
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e6ded1;text-align:center;">
      <p style="color:#7a726a;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:#3f6b67;font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
      <p style="color:#7a726a;font-size:10px;line-height:1.6;margin:14px 0 0 0;">You're receiving this because you joined the Circle (or asked me to keep you posted) at educatedtraveler.app.<br><a href="${unsub}" style="color:#7a726a;">Leave the Circle</a></p>
    </div>
  </div>
</body></html>`;
}

// Portrait invite — sent once to the people who subscribed before /portrait
// existed. Asks them to take their place: tell Arnaud, in their own words, the
// craft they'd give a week to, and write him the letter. CTA -> /circle
// (the page handles sign-in itself via magic link, so no per-recipient token).
function portraitInviteHtml(unsub: string): string {
  const body = `
      <p style="${P}margin:0 0 18px 0;">You joined the Circle a while ago &mdash; and I haven't forgotten it. I've been building quietly since, and there's now something I made for the people who were here first. You're one of them.</p>
      <p style="${P}margin:0 0 18px 0;">It's a single page. On it, you tell me &mdash; in your own words &mdash; the one craft you'd give a real week of your life to learn. And if you want, you write me a letter. Not a form with a letter-shaped box: a real letter. It opens <em style="color:#4a423b;">&ldquo;Arnaud,&rdquo;</em> and mine is the only pair of eyes that will ever read it.</p>
      <p style="${P}margin:0 0 18px 0;">Here's why it matters. I take what you tell me and go find the real thing &mdash; the master still teaching by hand, the place where the craft is genuinely alive, the handful of people you'd want beside you. Then I open the door. The clearer you are with me, the better I aim. The first one is already taking shape around a modernist kitchen in Barcelona, this autumn.</p>
      <div style="text-align:center;margin:30px 0;"><a href="https://educatedtraveler.app/circle" style="${BTN}">Take your place &rarr;</a></div>
      <p style="${P}margin:22px 0 0 0;">Five minutes, if you're quick. Twenty, if the letter gets away from you. Both are exactly right.</p>`;
  return shell({ eyebrow: "The Circle &nbsp;&middot;&nbsp; a door with your name on it", heading: "Now tell me what you'd give a week of your life to learn.", body, unsub });
}

// Chef invite — a 1:1 personal note to chefs Arnaud has spoken with about the
// modernist week. Name-aware, no bulk unsubscribe footer (this is a personal
// email, not a broadcast). CTA -> /circle to join the Circle for the details.
function chefInviteHtml(_unsub: string, name?: string): string {
  const hi = name && name.trim() ? esc(name.trim()) : "chef";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:34px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:36px 28px;">
      <p style="color:#2b2621;font-family:Georgia,'Times New Roman',serif;font-size:19px;margin:0 0 20px 0;">Hey ${hi} &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">Good to talk shop with you about the modernist week. It's moving from an idea toward the real thing now &mdash; a week in Barcelona, this autumn, built around modernist and low-temperature technique at the source: a proper master, a small room, and the kind of hands-on days we don't get once we're cooking for a living.</p>
      <p style="${P}margin:0 0 18px 0;">I'm keeping the details close while the dates and the master's side lock in &mdash; but I want you near it as it firms up, ahead of anyone else.</p>
      <p style="${P}margin:0 0 22px 0;">Simplest way to do that: I built a page where you tell me, in your own words, what you'd want out of a week like this &mdash; the technique, the people, the reason it pulls at you. Do that and you're in the Circle, which just means I write you first when the week is real, with everything you'd need to decide.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/circle" style="${BTN}">Tell me what you'd want &rarr;</a></div>
      <p style="${P}margin:20px 0 0 0;">Five minutes, tops. And either way &mdash; let's keep talking. You know where I am.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:#4a423b;font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0;">&mdash; Arnaud</p>
      <p style="color:#7a726a;font-size:12px;margin:4px 0 0 0;">EducatedTraveler</p>
    </div>
    <div style="margin-top:34px;padding-top:22px;border-top:1px solid #e6ded1;text-align:center;">
      <p style="color:#7a726a;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:#3f6b67;font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;
}

// Friend invite — a 1:1 personal note to a friend who's been on the list since
// the start (no modernist-week claim, no bulk footer). Name-aware, CTA -> /circle.
function friendInviteHtml(_unsub: string, name?: string): string {
  const hi = name && name.trim() ? esc(name.trim()) : "you";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:34px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#2b2621;">EDUCATED</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:2px;color:#3f6b67;">TRAVELER</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e6ded1;border-radius:16px;padding:36px 28px;">
      <p style="color:#2b2621;font-family:Georgia,'Times New Roman',serif;font-size:19px;margin:0 0 20px 0;">Hey ${hi} &mdash;</p>
      <p style="${P}margin:0 0 18px 0;">It's Arnaud. You were one of the first people I told about EducatedTraveler &mdash; you've been on the list since the very start &mdash; and I've quietly been building the thing I kept going on about.</p>
      <p style="${P}margin:0 0 18px 0;">It's finally real enough to show you properly. I made a page where you tell me, in your own words, the one craft you'd give a week of your life to learn &mdash; and, if you feel like it, write me a letter. It opens <em style="color:#4a423b;">&ldquo;Arnaud,&rdquo;</em> and I read every one myself.</p>
      <p style="${P}margin:0 0 22px 0;">I take what you tell me and go find the real thing &mdash; the master still teaching by hand, the place where the craft is alive, and your people &mdash; then I open the door.</p>
      <div style="text-align:center;margin:28px 0;"><a href="https://educatedtraveler.app/circle" style="${BTN}">Take your place &rarr;</a></div>
      <p style="${P}margin:20px 0 0 0;">Would mean a lot to have you properly in. And either way &mdash; good to have you here from the start. Let's catch up soon.</p>
    </div>
    <div style="margin-top:30px;padding:0 4px;">
      <p style="color:#4a423b;font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0;">&mdash; Arnaud</p>
      <p style="color:#7a726a;font-size:12px;margin:4px 0 0 0;">EducatedTraveler</p>
    </div>
    <div style="margin-top:34px;padding-top:22px;border-top:1px solid #e6ded1;text-align:center;">
      <p style="color:#7a726a;font-size:10px;letter-spacing:4px;text-transform:uppercase;font-family:'Courier New',monospace;margin:0;">Skills last, tans fade</p>
      <p style="margin:12px 0 0 0;"><a href="https://educatedtraveler.app" style="color:#3f6b67;font-size:11px;text-decoration:none;">educatedtraveler.app</a></p>
    </div>
  </div>
</body></html>`;
}

// Letter-style shell: no forced background, no wordmark header, no buttons — the
// structure of personal correspondence, which is also what keeps the Circle out of
// the Promotions tab. Used by the welcome; other templates migrate on approval.
function plainShell(opts: { body: string; unsub: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:28px 20px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:#222222;">
${opts.body}
    <p style="margin:40px 0 0 0;font-size:12px;color:#6b625a;">EducatedTraveler · <a href="https://educatedtraveler.app" style="color:#3f6b67;">educatedtraveler.app</a> · <a href="${opts.unsub}" style="color:#6b625a;">Leave the Circle</a></p>
  </div>
</body></html>`;
}

const LP = 'style="margin:0 0 18px 0;"';

function welcomePlainHtml(unsub: string): string {
  const body = `
    <p style="margin:0 0 18px 0;font-style:italic;color:#555555;">A skill, a place, a person, your people.</p>
    <p ${LP}>Your letter is here. <strong>This note is automatic — the answer won't be.</strong> I read every one myself, and I will read yours; give me a few days. There is one of me, and I would rather send you something real than something quick.</p>
    <p ${LP}>While you wait, here is what you have joined. The Circle is a letter I write when I find a place worth knowing, and a list of what the people in it want to learn. Yours went straight onto that list, and the list is the part that does the work: what you tell me decides which craft I go and check next.</p>
    <p ${LP}>So — the letter. One place.</p>
    <p ${LP}>In 1924 a young potter named <strong>Shoji Hamada</strong> could have set up anywhere. He had spent three years in England building a pottery beside <strong>Bernard Leach</strong>, he was already good, and the capital was open to him. He chose <strong>Mashiko</strong> — a country town north of Tokyo — for its clay, its glazes, its plain, useful pots, and for the country life he had learned to want there.</p>
    <p ${LP}>He stayed fifty-four years, until he died there. He fired his pots in climbing kilns built into the hillside, from the clay and the ash and the iron glaze of that valley. And for most of his life he sent them out unsigned — no seal, nothing stamped in the foot. He signed the wooden boxes they travelled in, telling Leach he could not escape the social obligation, but he never signed the pot. Asked why, he said: “If you cannot see who it is by, it is either because the pot is bad, or because you are blind.” Japan made him a Living National Treasure in 1955, the first year the title was given.</p>
    <p ${LP}>The pots were unsigned. The man was never hard to find. He was in that town, at that wheel, and the potters who wanted to learn came and stayed.</p>
    <p ${LP}>Almost everything now is built to be seen — the course with the certificate, the trip with the photographs, the skill that goes on a profile. Hamada spent his life on the opposite bet: get close to the real thing, do the work until it is genuinely good, and let the pot go without your name on it. Mashiko is still a pottery town.</p>
    <p ${LP}>That is the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, judged by the strength of the people you'd find when you arrived.</p>
    <p ${LP}>The Atlas is here: <a href="https://educatedtraveler.app/atlas/" style="color:#3f6b67;">educatedtraveler.app/atlas</a></p>
    <p ${LP}>I'm Arnaud. Cooking found me in a dishpit in Darwin, when a chef came up short after lunch and put a knife in my hand. Fifteen years travelling since; about ten of them cooking and working on boats. Cooking, sailing, freediving and wine are the ones I can speak for firsthand. Pottery is not, and that is exactly the point — this was never meant to be about me.</p>
    <p ${LP}>There is nothing you need to do now. You have told me the craft, which is normally the question I have to ask, and the rest is my work: finding who really teaches it, and whether a stranger could go and learn there.</p>
    <p ${LP}>I read every letter myself, and I answer.</p>
    <p ${LP}>Hit reply, or message me on <a href="https://wa.me/33695903520?text=Arnaud%20-%20I%20just%20wrote%20you%20a%20letter." style="color:#3f6b67;">WhatsApp</a> if that's easier. Both come straight to me, not to an office.</p>
    <p style="margin:28px 0 0 0;">Talk soon,</p>
    <p style="margin:0;">— Arnaud</p>
    <p style="margin:28px 0 0 0;"><strong>P.S.</strong> What I'm doing this month: working through the crafts people have written to me about, one at a time, and finding out who actually teaches them. And if someone came to mind while you were reading — the friend who has been saying for years they'd learn to sail properly if they ever had the time — send them the Atlas page for it.</p>`;
  return plainShell({ body, unsub });
}

function welcomeText(unsub: string): string {
  return `A skill, a place, a person, your people.

Your letter is here. This note is automatic — the answer won't be. I read every one myself, and I will read yours; give me a few days. There is one of me, and I would rather send you something real than something quick.

While you wait, here is what you have joined. The Circle is a letter I write when I find a place worth knowing, and a list of what the people in it want to learn. Yours went straight onto that list, and the list is the part that does the work: what you tell me decides which craft I go and check next.

So — the letter. One place.

In 1924 a young potter named Shoji Hamada could have set up anywhere. He had spent three years in England building a pottery beside Bernard Leach, he was already good, and the capital was open to him. He chose Mashiko — a country town north of Tokyo — for its clay, its glazes, its plain, useful pots, and for the country life he had learned to want there.

He stayed fifty-four years, until he died there. He fired his pots in climbing kilns built into the hillside, from the clay and the ash and the iron glaze of that valley. And for most of his life he sent them out unsigned — no seal, nothing stamped in the foot. He signed the wooden boxes they travelled in, telling Leach he could not escape the social obligation, but he never signed the pot. Asked why, he said: “If you cannot see who it is by, it is either because the pot is bad, or because you are blind.” Japan made him a Living National Treasure in 1955, the first year the title was given.

The pots were unsigned. The man was never hard to find. He was in that town, at that wheel, and the potters who wanted to learn came and stayed.

Almost everything now is built to be seen — the course with the certificate, the trip with the photographs, the skill that goes on a profile. Hamada spent his life on the opposite bet: get close to the real thing, do the work until it is genuinely good, and let the pot go without your name on it. Mashiko is still a pottery town.

That is the whole idea of the Atlas: a map of places like Mashiko, one craft at a time, judged by the strength of the people you'd find when you arrived.

The Atlas is here: https://educatedtraveler.app/atlas

I'm Arnaud. Cooking found me in a dishpit in Darwin, when a chef came up short after lunch and put a knife in my hand. Fifteen years travelling since; about ten of them cooking and working on boats. Cooking, sailing, freediving and wine are the ones I can speak for firsthand. Pottery is not, and that is exactly the point — this was never meant to be about me.

There is nothing you need to do now. You have told me the craft, which is normally the question I have to ask, and the rest is my work: finding who really teaches it, and whether a stranger could go and learn there.

I read every letter myself, and I answer.

Hit reply, or message me on WhatsApp if that's easier. Both come straight to me, not to an office.
https://wa.me/33695903520?text=Arnaud%20-%20I%20just%20wrote%20you%20a%20letter.

Talk soon,
— Arnaud

P.S. What I'm doing this month: working through the crafts people have written to me about, one at a time, and finding out who actually teaches them. And if someone came to mind while you were reading — the friend who has been saying for years they'd learn to sail properly if they ever had the time — send them the Atlas page for it.

--
EducatedTraveler · educatedtraveler.app
Leave the Circle: ${unsub}`;
}

// ── the reply to a letter written from an Atlas craft page ───────────────────
// This REPLACES the Mashiko welcome for that person; circle-welcome branches on
// source starting with "atlas-letter:". They asked about one specific craft, so
// the useful thing is to answer that and ask who they are — not to open with a
// story about a different craft. Same letter shell: no banner, no buttons.
function atlasLetterHtml(unsub: string, name?: string, craft?: string): string {
  const who = esc(name || "").trim();
  const c = esc(craft || "that craft").trim();
  const body = `
    <p ${LP}>${who ? who + "," : "Hello,"}</p>
    <p ${LP}>Your letter about <strong>${c}</strong> reached me. Thank you for writing it — I read every one myself, and letters like yours decide which craft I open next.</p>
    <p ${LP}>There's a sign-in link in your inbox from a moment ago. One click and you're on your own page — no password, ever.</p>
    <p ${LP}>When you're there, fill in the rest. It asks where you're starting from with ${c}, when you could actually go, how long you could give it, how far you'd travel, and where in the world you are.</p>
    <p ${LP}><a href="https://educatedtraveler.app/portrait" style="color:#3f6b67;">educatedtraveler.app/portrait</a></p>
    <p ${LP}>Five minutes, and none of it is required. I ask because the craft alone isn't enough to aim with — a beginner with two free weeks in October and a cook who's been at it fifteen years belong in very different rooms, with different people. The more of that I have, the better the week I can build you.</p>
    <p ${LP}>When there's a real week worth telling you about, I tell you, and you decide.</p>
    <p style="margin:28px 0 0 0;">Talk soon,</p>
    <p style="margin:0;">— Arnaud</p>`;
  return plainShell({ body, unsub });
}

function atlasLetterText(unsub: string, name?: string, craft?: string): string {
  const who = (name || "").trim();
  const c = (craft || "that craft").trim();
  return `${who ? who + "," : "Hello,"}

Your letter about ${c} reached me. Thank you for writing it — I read every one myself, and letters like yours decide which craft I open next.

There's a sign-in link in your inbox from a moment ago. One click and you're on your own page — no password, ever.

When you're there, fill in the rest. It asks where you're starting from with ${c}, when you could actually go, how long you could give it, how far you'd travel, and where in the world you are.

https://educatedtraveler.app/portrait

Five minutes, and none of it is required. I ask because the craft alone isn't enough to aim with — a beginner with two free weeks in October and a cook who's been at it fifteen years belong in very different rooms, with different people. The more of that I have, the better the week I can build you.

When there's a real week worth telling you about, I tell you, and you decide.

Talk soon,
— Arnaud

--
EducatedTraveler · educatedtraveler.app
Leave the Circle: ${unsub}`;
}

// ── the reply to someone offering to open a room (source 'teach-offer') ──────
// A master is not a lead, and the Mashiko welcome — written to someone deciding
// what to learn — reads wrong to someone offering to teach. The hard rule here is
// the LANGUAGE-KIT one: a list is not demand. This letter must never imply that
// people are waiting for their week. Burning a master with manufactured interest
// costs the one asset ET cannot replace.
function teachOfferHtml(unsub: string, name?: string, craft?: string): string {
  const hi = name ? `${name},` : "Hello,";
  const c = craft && craft !== "that craft" ? craft : "your craft";
  const body = `
    <p ${LP}>${hi}</p>
    <p ${LP}>Thank you — what you wrote about ${c} is here. <strong>This note is automatic; the answer won't be.</strong> I read these myself, and I will come back to you properly.</p>
    <p ${LP}>Here is where this honestly stands, because you should hear it from me rather than work it out later. EducatedTraveler is new. One week is signed — modernist technique in Barcelona, this October — and nobody has been anywhere yet. There are no alumni. The Circle is a list of people who have told me what they would give a week of their life to learn, and a list is not a queue: I will not tell you there is demand for your week until there is.</p>
    <p ${LP}>What happens next is slow, and it is my work, not yours. I check what can be checked, and I put nothing on the Atlas until you have seen it and told me it is right. Then I write to you with real questions — what it costs you to run, how many people you would actually want at the bench, how long it truly needs, what time of year is wrong. A week is the shape I know how to fill, and if your craft needs longer than that I would rather hear it now than trim it to fit. If it fits what people are asking me for, we talk about a date. If it does not fit yet, I will say so plainly and keep you on my list.</p>
    <p ${LP}>Nothing is agreed by what you sent. It tells me you exist, which is the part I cannot find on my own.</p>
    <p ${LP}>If you want to see the company you would be keeping, the Atlas is here: <a href="https://educatedtraveler.app/atlas/" style="color:#3f6b67;">educatedtraveler.app/atlas</a> — including the blanks, which are counted rather than hidden.</p>
    <p ${LP}>I'm Arnaud. Cooking found me in a dishpit in Darwin, when a chef came up short after lunch and put a knife in my hand. Fifteen years travelling since; about ten of them cooking and working on boats. I am not the teacher anywhere on this map, and that is the point.</p>
    <p ${LP}>Just hit reply if anything above is wrong, or if you would rather talk than type.</p>
    <p style="margin:28px 0 0 0;">Talk soon,</p>
    <p style="margin:0;">— Arnaud</p>`;
  return plainShell({ body, unsub });
}

function teachOfferText(unsub: string, name?: string, craft?: string): string {
  const hi = name ? `${name},` : "Hello,";
  const c = craft && craft !== "that craft" ? craft : "your craft";
  return `${hi}

Thank you — what you wrote about ${c} is here. This note is automatic; the answer won't be. I read these myself, and I will come back to you properly.

Here is where this honestly stands, because you should hear it from me rather than work it out later. EducatedTraveler is new. One week is signed — modernist technique in Barcelona, this October — and nobody has been anywhere yet. There are no alumni. The Circle is a list of people who have told me what they would give a week of their life to learn, and a list is not a queue: I will not tell you there is demand for your week until there is.

What happens next is slow, and it is my work, not yours. I check what can be checked, and I put nothing on the Atlas until you have seen it and told me it is right. Then I write to you with real questions — what it costs you to run, how many people you would actually want at the bench, how long it truly needs, what time of year is wrong. A week is the shape I know how to fill, and if your craft needs longer than that I would rather hear it now than trim it to fit. If it fits what people are asking me for, we talk about a date. If it does not fit yet, I will say so plainly and keep you on my list.

Nothing is agreed by what you sent. It tells me you exist, which is the part I cannot find on my own.

If you want to see the company you would be keeping, the Atlas is here — including the blanks, which are counted rather than hidden:
https://educatedtraveler.app/atlas

I'm Arnaud. Cooking found me in a dishpit in Darwin, when a chef came up short after lunch and put a knife in my hand. Fifteen years travelling since; about ten of them cooking and working on boats. I am not the teacher anywhere on this map, and that is the point.

Just hit reply if anything above is wrong, or if you would rather talk than type.

Talk soon,
— Arnaud

--
EducatedTraveler · educatedtraveler.app
Leave the Circle: ${unsub}`;
}

export const ISSUES: Record<string, {
  subject: string;
  html: (unsub: string, name?: string, craft?: string) => string;
  text?: (unsub: string, name?: string, craft?: string) => string;
  // audience "leads" = an invite/conversion email ("join", "take your place"):
  //   broadcast MUST skip anyone who already has a member account, or a member
  //   gets told to join the thing they're already in (bug: Jeremie et al., Jul 2026).
  // undefined / "all" = a Circle letter everyone in the Circle should get.
  audience?: "leads" | "all";
}> = {
  "welcome": { subject: "Welcome to the Circle — the potter who signed the box, not the pot", html: welcomePlainHtml, text: welcomeText, audience: "leads" },
  // Subject carries the craft name; circle-welcome substitutes {CRAFT}.
  "atlas-letter": { subject: "Got your letter about {CRAFT}", html: atlasLetterHtml, text: atlasLetterText, audience: "leads" },
  // A possible master, from /teach. Never broadcast — it answers one person's offer.
  "teach-offer": { subject: "What you could open in {CRAFT} — where this stands", html: teachOfferHtml, text: teachOfferText, audience: "leads" },
  "portrait-invite": { subject: "Take your place in the Circle", html: portraitInviteHtml, audience: "leads" },
  "chef-invite": { subject: "That modernist cooking week — I want you close to it", html: chefInviteHtml, audience: "leads" },
  "friend-invite": { subject: "The thing I kept going on about — it's real now", html: friendInviteHtml, audience: "leads" },
  "issue-01": { subject: "The Circle, Letter Nº 1 — where the divers go to find the deep", html: issue01Html },
  "issue-02": { subject: "The Circle, Letter Nº 2 — the snack named after a movie star", html: issue02Html },
  "issue-03": { subject: "The Circle, Letter Nº 3 — the rarest thing in a kitchen isn't talent", html: issue03Html },
};

// 1:1 personal send — no List-Unsubscribe (not a bulk mailing). Those headers
// are Gmail's loudest Promotions-tab signal, so the per-signup welcome letter
// must go through here, not sendCircleEmail; its in-body "Leave the Circle"
// link keeps the exit honest. A text part (when given) completes the
// personal-letter shape: multipart/alternative, not marketing HTML.
export async function sendPersonalEmail(
  to: string, subject: string, html: string, text?: string,
): Promise<{ ok: boolean; id?: string; error?: unknown }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html, ...(text ? { text } : {}) }),
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
