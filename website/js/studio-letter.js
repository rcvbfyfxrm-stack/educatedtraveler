/* Studio "Letter" tab — The Circle, EducatedTraveler's newsletter.
 * Littoralicious-for-skills: a founder letter that lights up the philosophy and
 * backs it with real science about learning by hand at the source.
 * Voice-locked: connect / introduce, never sell / book / enroll. No banned words
 * (transformation, life-changing, vacation, luxury, easy), no prices, no emoji.
 * TRUST: never invent a school or a master. Where a specific place/teacher is named,
 * fill it from the live Atlas page — a [bracketed] slot means "verify, then write". */
window.ET_LETTER = {
  masthead: "The Circle — a letter from EducatedTraveler",
  standfirst: "Every couple of weeks: one place where a craft is still alive, the people who keep it, why that skill is worth your hands — and the door in. No selling. Just an introduction.",
  cadence: "Every 2 weeks · plain, founder-voiced · one place, one skill, one door.",

  // The repeatable skeleton — write every issue to this shape.
  structure: [
    { part: "1 · The hook", note: "One place, one skill, one vivid line. Drop the reader into the scene — the water, the bench, the fire. No throat-clearing." },
    { part: "2 · Why this skill remakes you", note: "The science beat. Pull ONE nugget from the Science Vault, say it plainly, no jargon. This is the spine that makes the Circle different from a travel list." },
    { part: "3 · The place & the people", note: "The master / school, and why them — lead with the real credential + community. Fill the name from the Atlas page; never invent one. Honest about confidence." },
    { part: "4 · The door", note: "How to go: best season, the first realistic step, and ONE link to the Atlas page. No prices, no pressure." },
    { part: "5 · One question + one referral", note: "End with a single reply-prompt (engagement) and one line inviting them to forward it (growth). Always." },
  ],

  // Reusable, real, citable. Frame as 'what the research suggests' — cite the study if you quote a number.
  scienceVault: [
    { claim: "Your brain builds what you practice.", detail: "Adults who learned to juggle over three months grew measurable grey matter in the brain's motion areas — which faded when they stopped. Learning a physical skill physically remodels you.", source: "Draganski et al., Nature, 2004" },
    { claim: "A master beside you is the shortcut, not a luxury.", detail: "The biggest accelerator of skill isn't raw hours or talent — it's tight, in-the-moment feedback from someone who already has it. Mechanically, a teacher's hand over yours is worth more than any amount of watching.", source: "Ericsson et al., on deliberate practice" },
    { claim: "The deepest engagement lives at the edge of your ability.", detail: "When people describe feeling most alive, they rarely describe rest — they describe full absorption in something difficult, done well. Hard, in good company, is where meaning hides.", source: "Csikszentmihalyi, on flow" },
    { claim: "Learning grows the exact part of the brain it uses.", detail: "London taxi drivers who spent years memorising the city had a measurably larger posterior hippocampus — the brain's map-maker. Sustained learning reshapes the organ doing it.", source: "Maguire et al., PNAS, 2000" },
    { claim: "Doing hard things rebuilds how you see yourself.", detail: "Mastery — actually succeeding at something demanding — is the single strongest source of self-belief, stronger than encouragement or watching others. Earn a skill and your self-image follows.", source: "Bandura, on self-efficacy" },
  ],

  issues: [
    {
      id: "issue-03-launch",
      title: "Issue 03 — He didn't take the flight (THE LAUNCH LETTER — send on launch day)",
      kind: "Launch reveal · the week is real · Martin's calling story + what you walk out with · no boat names, ever",
      portrait: "/images/lippo/martin-teaching.png",
      subject: "He didn't take the flight",
      preview: "At 26, Martin Lippo had to get to Europe. He crossed the ocean under sail instead. In October, his lab opens for us.",
      body:
`At twenty-six, Martin Lippo had to get to Europe. Everyone he knew did it the obvious way: you buy a ticket, you fly. He crossed the Atlantic under sail instead — a racing yacht, eighteen days at sea, Antigua to Spain by way of the Azores, the last stretch rerouted by a storm.

He told me this on the phone this week, and it explained everything. Because that choice makes no sense — unless you understand that the flight was never the point. Something in him wanted the ocean, and he let it navigate. That crossing marked his life and opened doors no itinerary could have drawn. Decades later, the same instinct built Vakuum: while the great kitchens of his generation put velvet ropes on their knowledge, Martin built a laboratory in Barcelona whose entire purpose is handing technique over.

Your callings know the way. Follow them.

I recognise the shape of that story because it's mine too — I left school at eighteen and let the sea do the navigating. People who follow their callings end up recognising each other. Which is how I can finally write the sentence this letter has been circling for a month:

THE WEEK IS REAL

Lab Week 01: five days in Martin Lippo's lab. Vakuum, Barcelona, 22–26 October, taught in English — ten to fifteen professional cooks at one bench. His complete programme, run as one consecutive week: textures, spherification — all of it — liquid nitrogen, foams and siphons, and sous-vide done properly. Thirty-five hours. Your hands, not a demonstration.

And here is what you walk out with, because that's the part that matters:

— The techniques, in your hands — chosen for real working kitchens: fast, prepared ahead, stable at sea.
— A certificate in English, signed — on paper and as a PDF. A line on your CV that a captain or a recruiter can check.
— Photographs of your own work, shot in the lab by Martin's team. A portfolio, not souvenirs.
— His full recipe and theory dossiers, to go deep long after the week.
— And the room itself: the working cooks beside you. In this trade, the room is never a small thing.

The honest terms, as always: the week confirms the moment ten chefs have paid — and if we're not there by 15 September, every euro is refunded in full. The live count, the day-by-day, and everything else:

educatedtraveler.app/barcelona

The Circle reads this first — that was the promise. If October is yours, don't wait for the counter.

One question, and I read every reply: what's the calling you keep booking flights around?

And if you know one chef who should be at that bench, forward this letter. That's how the room fills — one cook telling another.

A place, a person, your people.

Arnaud`,
      ps: "P.S. Film from the lab is coming — Martin presenting the week himself. The Circle sees it first, too.",
    },
    {
      id: "issue-02-avantgarde",
      title: "Issue 02 — The movement and the master (ready to send)",
      kind: "Evergreen editorial · avant-garde cuisine + Martin Lippo · safe before the signature (teaser names no dates or terms)",
      portrait: "/images/lippo/martin-teaching.png",
      subject: "The night cuisine stopped copying the past",
      preview: "A cove in Catalonia, 1,846 ideas, and the man in Barcelona who kept the flame teachable.",
      body:
`On the night of 30 July 2011, in a small cove called Cala Montjoi, the most influential restaurant of our lifetime served dinner for the last time. Two years ago, that building reopened — not as a restaurant, but as a museum. It's called elBulli1846: one number for the 1,846 creations Ferran Adrià's team catalogued over three decades, and, by a coincidence he loved, the year Escoffier was born.

A restaurant that becomes a museum. Sit with that for a second. Not because it was old — because it changed what a kitchen is.

WHAT ACTUALLY CHANGED

For most of a century, great cooking meant perfecting a canon. Escoffier had written the grammar; excellence meant speaking it beautifully. The avant-garde kitchen asked a different question entirely — not "how is this dish made?" but "what is cooking?" Adrià's motto was two words: comprender para crear. Understand, in order to create. His team split the workshop from the service, poured a fifth of the restaurant's spending into pure research, and wrote down every idea like a laboratory: numbered, dated, catalogued.

What came out of that cove didn't stay there. The foam from a siphon on a breakfast buffet. The sphere that bursts on the tongue. Gels that hold at heat, crisps made from anything, sous-vide run with a thermometer's honesty instead of a prayer. If you've plated any of it — and if you cook professionally, you have — you've spoken a language that was invented, tested and named by a small crew on the Catalan coast while most of the world wasn't looking.

But the tools were never the real influence. The real influence was permission: the idea that a working kitchen could think — that technique itself is an ingredient, that texture is a language, that understanding a product deeply enough gives you the right to remake it.

WHY THIS MATTERS TO US

Here's the working-chef version. Your guests have eaten everywhere. The difference between a good week and a legendary one is three plates they've never seen — and those plates, almost always, come out of this toolkit. Not as gimmicks. As grammar. A chef who understands why a foam holds or why a gel sets doesn't copy recipes; they answer whatever the galley throws at them.

And the research on skill is blunt about how that understanding actually arrives: the biggest accelerator isn't hours watched or recipes saved — it's tight, in-the-moment feedback from someone who already has the skill in their hands. A master beside you is the shortcut. It always was.

THE MAN WHO KEPT THE DOOR OPEN

Which brings me to the problem: most of that generation ended up behind velvet ropes. The famous kitchens take a handful of stagiaires a year from thousands. The knowledge exists — behind doors that don't open when you knock.

Martin Lippo went the other way.

Argentine, named his country's most creative young chef at twenty-seven by its leading culinary magazine. In 1995 he co-founded Delfuego Traveling Chefs — cooking as a travelling conversation, years before anyone called that a concept. In Barcelona since 2000, right through the city's avant-garde supernova. And instead of a restaurant with a rope, he built Vakuum: a laboratory whose entire purpose is teaching. He founded the Nitro School there — liquid nitrogen is his signature terrain. Les Vergers Boiron, the French fruit house, built a sixty-video technique library around him; the pastry journal so good.. has featured his work across three issues. The people who write about him describe his cooking as standing between Adrià's modernism and Escoffier's classicism — one foot in the canon, one on the frontier. A bridge, in other words.

I've stood in that lab. Steel benches, glass spheres, the fog coming off the nitrogen — and a man who has spent twenty years choosing to put technique into other people's hands rather than guard it. In a trade full of gatekept brilliance, that's the rarest thing I know: not the talent — the open door.

ONE MORE THING

I'm building something with Martin, in that lab, for chefs like us. It's not signed yet, so I'll say no more than that — but when it is, this letter is where you'll hear it first. That's a promise.

Until then, a question I genuinely want your answer to — just hit reply:

Which technique do you wish someone had put in your hands, properly, years ago?

And if you know a chef who'd want this letter, forward it. That's how the Circle grows — one cook telling another.

A place, a person, your people.

Arnaud`,
    },
    {
      id: "issue-01",
      title: "Issue 01 — To my first few (send this first)",
      kind: "Inaugural · the friends who got me started · thank-you + the vision + a share ask",
      portrait: "/images/arnaud-portrait.jpg",
      subject: "Thank you for helping me build this",
      preview: "What I keep going on about — and one small favour to ask.",
      body:
`Hey you —

You're getting this because you're one of mine — family, or a friend I've talked half to death about this idea. Some of you signed up just to get me to stop going on about it. Either way: thank you. I mean it.

So here's the thing I won't shut up about.

I cook on boats now. But the first time anyone put a knife in my hand, I was the dishwasher in a little Mexican kitchen in Darwin. One afternoon, after lunch service, they were short a pair of hands — the chef pulled me off the sink, slid a board over and told me to slice an onion. I'd never done it. But being shown, right next to someone who knew how, taught me more than any classroom could. Almost everything I can do, I picked up like that. Never off a screen.

EducatedTraveler is me trying to bottle that:

A map of where a skill is still alive and someone teaches it by hand — freediving, pottery, pastry, sailing, the breath on a mat. Ranked by how good the people are, not who pays me. Nothing on it I wouldn't send you to myself.

And a short letter every couple of weeks: one place, one skill, the people who keep it, and how to go. No selling — just pointing you at the good stuff. Down the line, when I find a school worth it, I'll set one up with them and you lot hear first.

Truth is, I'm learning all of this as I go — the website, this letter, all of it new to me. So I'm building it with you: any idea or bit of feedback you've got, I'd genuinely love to hear it. We're early, and you're early with me.

One favour: if someone comes to mind who'd love this, send them to educatedtraveler.app. A word from you is worth more than anything right now.

Thank you for being here at the start. Truly.

Bisous, les amis.
— Arnaud`,
      ps: "P.S. Me, right now? I want to learn breathwork — maybe massage too. What's yours: if you could disappear for two weeks and learn one thing by hand, what would it be? Hit reply.",
    },
    {
      id: "issue-02",
      title: "Issue 02 — Dahab: the breath you didn't know you had",
      kind: "Worked example · the place × skill loop",
      subject: "Dahab: the breath you didn't know you had",
      preview: "One flat blue hole in the Sinai, the strongest freediving community on earth, and what going deep does to a nervous system.",
      body:
`Hello —

This week, one place — Dahab, on Egypt's Sinai coast — and one skill: freediving, going down on a single breath.

On the edge of town the seabed simply drops away into the Blue Hole: a near-perfect cylinder of deep, flat, warm water. No surf to fight, no current to read, no season to wait for. That rare honesty is why the world's freedivers gather here — not because anyone advertised it, but because the water is fair and the people are already there. You arrive a stranger and inside a week you have a cohort.

Freediving looks like a feat of lungs. It's really a feat of the nervous system. Slow, trained breath-holding leans directly on the vagus nerve and the body's old mammalian dive reflex — the same wiring that slows your heart. People who train it often describe carrying the calm back onto dry land: the panic button gets harder to press. You don't only learn to go deep. You learn where your own panic lives, and how to sit beside it.

The people: [name the verified Dahab freedive school + its head instructor and certification body straight from the Atlas page — never invent one; if we haven't stood behind it yet, say "provisional, still verifying"]. We only point you to a place we'd send a friend.

How to go: it dives year-round, calmest in spring and autumn. Start with a two- or three-day entry course — you'll be surprised how deep "beginner" already reaches. The full page, with the community rank and the way in:
educatedtraveler.app/atlas/freediving--dahab-red-sea

— Arnaud`,
      ps: "P.S. Not freediving? Reply and tell me your skill — the map is wide. And forward this to the friend who keeps saying 'one day.'",
    },
  ],

  // Pre-send checklist (deliverability + focus).
  sendChecklist: [
    "Sending domain authenticated (SPF + DKIM + DMARC) — or you land in spam.",
    "Subject under ~45 characters, curiosity not hype, no banned words.",
    "Preview/preheader text set (it's the second headline in the inbox).",
    "One idea, one place, one link. Cut anything that isn't pulling its weight.",
    "Every named school/master verified from the Atlas — nothing invented.",
    "Ends with one reply-question + one forward/referral line.",
    "Plain and personal — reads like a letter, not a brochure. One photo at most.",
    "Test-send to yourself; read it on a phone; then schedule.",
  ],
};
