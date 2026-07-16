/* Studio message library — copy-ready outreach for the campaign, one tap.
 * PUBLIC FILE: no prospect names, no numbers, no private terms. Counts are TOKENS,
 * filled from live state at copy time — never hardcode a seat count here.
 * Auto-tokens (filled from the campaign + your entered count): {SEATS} {GOAL}
 *   {DAYS_LEFT} {DEADLINE} {PAGE} {PARTNER}. Manual tokens become inputs: {FIRSTNAME} ...
 * Voice lock: introduce/connect, never sell/book/enroll; no banned words; no emoji. */
window.ET_MESSAGES = [
  {
    id: "wa-invite", campaign: "labweek01", kind: "whatsapp",
    label: "Seat invite — chef you know (1:1)",
    when: "Soft launch. One at a time, never a broadcast (step lb-3).",
    fields: ["FIRSTNAME"],
    text:
"{FIRSTNAME} — I'm organising something I think is exactly for you. You know Martin Lippo, the nitro master in Barcelona? I got him to run his full modernist week in English, just for yacht chefs — 22-26 October, right when the boats hit the yard. 35 hours in his lab. EUR 1,500, in line with his own published rates (I checked). It only runs if 10 chefs commit by {DEADLINE}, otherwise everyone's refunded in full — no risk on your side. Everything's here: {PAGE}. Want me to hold you a seat while you check your winter program?",
    note: "Personalise the first line if you can. Real count only.",
  },
  {
    id: "wa-brief", campaign: "labweek01", kind: "whatsapp",
    label: "Seat invite — brief (industry friend)",
    when: "Soft launch, for chefs who already know you.",
    fields: ["FIRSTNAME"],
    text:
"{FIRSTNAME}! Quick one. I got Martin Lippo — the nitro guy, Barcelona — to run his full week in English for yacht chefs: 22-26 Oct, yard period, 35 hours hands-in, EUR 1,500 (his own published rate, I checked). Confirms at 10 in or everyone's refunded — and I'm in the room too. Want me to hold you a seat while you check your winter program? {PAGE}",
    note: "The two-line version.",
  },
  {
    id: "wa-forward", campaign: "labweek01", kind: "whatsapp",
    label: "Forward kit (built to be passed on)",
    when: "Give to anyone who offers to share it. They add one personal line on top.",
    fields: [],
    text:
"Martin Lippo — the nitro master from Barcelona — is opening his lab for a 5-day intensive built for yacht chefs. 22-26 Oct, right in yard period. 35 hours hands-in: spherification, liquid nitrogen, foams, textures, sous-vide. In English (his open sessions run in Spanish). EUR 1,500 for the full week's teaching, VAT included — in line with his own published rates. Confirmed the moment 10 chefs are in; if not, everyone's refunded in full. {PAGE}",
    note: "Under 100 words on purpose. The forwarder's own line carries the trust.",
  },
  {
    id: "wa-referrer", campaign: "labweek01", kind: "whatsapp",
    label: "Referrer note (captain / purser / crew)",
    when: "To people who'll pass it to their chef — paste the forward kit under it.",
    fields: ["FIRSTNAME"],
    text:
"{FIRSTNAME} — quick favour, no selling involved. I've put together a 5-day modernist week in Barcelona with Martin Lippo (the liquid-nitrogen master), built specifically for yacht chefs — 22-26 October, during yard period, in English. If you know a chef who'd level up from this, would you pass them the forward note? It fills on word of mouth between crews, exactly how it should. Thanks — Arnaud",
    note: "Then copy the Forward kit and send both.",
  },
  {
    id: "wa-group", campaign: "labweek01", kind: "whatsapp",
    label: "Chef group chat (once, admin-cleared)",
    when: "One post per group after clearing with the admin. Then answer in DM only.",
    fields: [],
    text:
"Hey all — sharing something I organised myself, not an ad (mods: delete if not okay, no offence taken). I finally got Martin Lippo — the liquid-nitrogen master in Barcelona — to run his 5-day modernist week IN ENGLISH, built for yacht chefs: 22-26 October, right when the boats hit the yard. Spherification, nitro, foams, textures, sous-vide — 35 hours hands-in, EUR 1,500, in line with his own published rates (the math's on the page). Confirms the moment 10 chefs have paid; if we're not there by {DEADLINE}, everyone is refunded in full. I'm going myself. Everything's here: {PAGE} — questions in DM.",
    note: "Two group posts total per group, max. The second is a real-count update only.",
  },
  {
    id: "wa-vouch-ask", campaign: "labweek01", kind: "whatsapp",
    label: "The two-names ask (every buyer)",
    when: "After a chef pays — the referral engine.",
    fields: ["FIRSTNAME"],
    text:
"{FIRSTNAME} — you're in, and I'm glad. One thing: who are the two chefs you'd most want in that room with you? A word from you carries further than anything I can send. No pressure — just their names and I'll take it from there.",
    note: "Named referrals convert far better than cold ones.",
  },
  {
    id: "wa-hold", campaign: "labweek01", kind: "whatsapp",
    label: "Seat hold after the call",
    when: "Right after the 15-minute call, before the payment link.",
    fields: ["FIRSTNAME"],
    text:
"Good to talk, {FIRSTNAME}. I'll hold your seat 48 hours while the payment link is live — the hold's just so a held seat doesn't block another chef. You pay EducatedTraveler and I handle everything from there — payment, paperwork, certificate, logistics; Martin just teaches. Any question before you go ahead, ask me here. {PAGE}",
    note: "You pay ET, ET handles all formalities — say so plainly; if we're not at 10 by 15 Sept, every euro back.",
  },
  {
    id: "wa-milestone", campaign: "labweek01", kind: "story",
    label: "Milestone story (real count only)",
    when: "Only when the public counter is 3+ and the number actually moved.",
    fields: [],
    text:
"{SEATS} of {GOAL}.\nReal count, updated today — it only ever shows paid seats. When it reaches {GOAL}, Barcelona is on. If it doesn't by {DEADLINE}, everyone is refunded in full.\n(Link sticker to the page)",
    note: "The token guard refuses to copy if the count isn't set. Never a number you haven't earned.",
  },
  {
    id: "email-press", campaign: "labweek01", kind: "email",
    label: "Press pitch (Dockwalk / The Superyacht Chef)",
    when: "Phase 4, once the counter is public.",
    subject: "A working superyacht chef built the modernist week he couldn't find",
    fields: [],
    text:
"Hello — I'm Arnaud Callier, a working superyacht chef. I've arranged something I think your readers would want to know about: Martin Lippo, the liquid-nitrogen master in Barcelona, is running his full 5-day modernist week in English, built for yacht chefs — 22-26 October, timed for yard period, 35 hours hands-in at his Vakuum lab.\n\nThe angle: I couldn't find this week anywhere, so I built it. The terms are unusually plain — it confirms at 10 paid or everyone is refunded in full, and every claim on the page is checkable against Martin's own site. Happy to do an interview, share photos of the lab (with permission), and give you the live seat count.\n\nOne link: {PAGE}\n\nThank you — Arnaud",
    note: "Offer the story, not an ad. They cover launches like this as news.",
  },
  {
    id: "email-master", campaign: "", kind: "email",
    label: "Warm a future master (general)",
    when: "Groundwork for any next Lab Week — relationship first, no ask.",
    fields: ["NAME", "CRAFT", "PLACE"],
    subject: "You're on our map",
    text:
"Hello {NAME} — I keep a hand-verified map of where a craft is still truly alive, and where {CRAFT} is concerned, {PLACE} and your name came up again and again. No bookings, no commissions, no prices on the map — I just point people to the masters worth learning from, and you're one of them.\n\nI run one or two immersive weeks a year with a master I'd stake my name on. I'm not proposing anything today — I'd just value staying in touch as this grows. If you're ever open to a conversation, I'm here.\n\nWith respect — Arnaud Callier, EducatedTraveler",
    note: "Gift-first. No terms, no dates. This is how supply gets built ahead of demand.",
  },
];
