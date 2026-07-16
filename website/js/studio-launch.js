/* Studio "Launch" tab — the dead-simple ordered playbook.
 * Just follow the steps top to bottom and tick them off. Each step says WHAT to
 * post, WHERE it lives in the Studio, and WHY. Two parts: the launch week (post
 * once), then the weekly loop (repeat forever). Checkboxes persist locally. */
window.ET_LAUNCH = {
  intro: "Follow it top to bottom and tick each box. Everything you need is already in the Studio — this just puts it in order.",

  // What each surface is for — clears up Daily Drop vs Posts vs Letter.
  surfaces: [
    { name: "Letter", what: "The Circle newsletter — the hero. One place + one skill + the science. Write/send it from the Letter tab." },
    { name: "Posts", what: "Your evergreen, branded library (philosophy posts + flagship reels, each with ET-design images). Copy caption, download images." },
    { name: "Daily Drop", what: "A dated calendar of place×skill clips, each already sourced from a real school — the steady drumbeat between flagship posts." },
    { name: "Outreach", what: "The emails that ask a school for permission to use their footage (and open a partner relationship). Permission first, always credit." },
  ],

  phases: [
    {
      id: "labweek01",
      title: "Lab Week 01 — Barcelona (the live campaign — post in this order)",
      sub: "Martin said yes on the phone (16 July). The week runs 22–26 October; one goal: 10 paid by 15 September or everyone is refunded. This is the exact posting order — top to bottom, tick as you go. The private playbook still holds the agreement points.",
      steps: [
        { id: "lb-1", when: "First — today", do: "Send Martin the one-line recap on WhatsApp — dates 22–26 Oct, chefs pay EducatedTraveler and ET settles with Vakuum, certificate in English (paper + PDF), his team shoots during the week — and get his thumbs-up back. A voice note counts as writing.", where: "WhatsApp → Martin", why: "The page and every post below name him as fact. Thirty seconds of written trace protects you both." },
        { id: "lb-2", when: "Same day", do: "Read the new page once on your phone — the career-assets narrative, the red countdown, the terms — and test the WhatsApp apply button.", where: "educatedtraveler.app/barcelona", why: "Every post below sends people here. The page closes; the posts only open." },
        { id: "lb-3", when: "Launch day · morning", do: "Send the launch letter to the Circle — Issue 03, 'He didn't take the flight'.", where: "Letter → Issue 03", why: "The Circle hears first — that's the standing promise, and the letter carries the calling story the feed never gets." },
        { id: "lb-4", when: "Launch day · evening", do: "POST 1 — the announce, inviting @vakuum_by_martin_lippo as collaborator (he only taps accept; it lives on both profiles).", where: "Posts → Lab Week 01 announce", why: "The reveal, with his name beside yours. The collab tag is the single strongest credibility act available." },
        { id: "lb-5", when: "Day 2", do: "POST 2 — the founder post: why a working yacht chef built this week.", where: "Posts → Why I built the week", why: "People follow a person before a project. This is the trust beat under the announcement." },
        { id: "lb-6", when: "Day 3", do: "POST 3 — the career-assets post: what a chef walks out with (certificate, portfolio by Martin's team, dossiers, the room).", where: "Posts → What you walk out with", why: "The ROI narrative in feed form — what the week does for the chef's next job, not what it costs." },
        { id: "lb-7", when: "Day 4", do: "POST 4 — the galley-fit post: why these five techniques were chosen for boats (speed, mise en place, shelf-stable, sous-vide).", where: "Posts → Built for the galley", why: "Answers the yacht chef's silent question — 'is this actually for me?' — with specifics, not adjectives." },
        { id: "lb-8", when: "Continuous", do: "Between posts: 1:1 soft outreach down the named list — one personal WhatsApp at a time, never a broadcast.", where: "Campaign → Messages", why: "The posts are air cover. The seats close person to person — that's how the first three arrive." },
        { id: "lb-9", when: "At every real milestone", do: "Milestone story — the real count, huge, one line, link sticker. Counter goes public on the page at 3 paid.", where: "Posts → Seat-count story", why: "Honest scarcity is the engine; the count only helps once it has something true to show." },
        { id: "lb-10", when: "When the film lands", do: "POST 5 — Martin's presentation video, as a collab post. Then drip the teaser cuts between milestones.", where: "Posts → Martin presents the week", why: "The one thing only he can give the campaign: his face, his lab, his invitation. Video pitch is written — his team shoots." },
        { id: "lb-11", when: "When his site lists it", do: "POST 6 — the calendar-proof post (screenshot of the week on martinlippo.com; his web developer is adding the collaboration section — will take time).", where: "Posts → It's on his calendar", why: "'Says who?' answered at the source. Strongest possible image the campaign can post." },
        { id: "lb-12", when: "At 3 paid", do: "Go wide: chef Facebook groups (admin-cleared, as yourself) + the press pitch to Dockwalk / The Superyacht Chef.", where: "Messages → group post + press", why: "Cold rooms need a warm number. Three real seats make the story news instead of an ad." },
        { id: "lb-13", when: "Weekly · September", do: "Update the real seat count everywhere it appears — page, stories, groups — same day, never inflated, never stale.", where: "barcelona.html seat vars", why: "A stale count is an accidentally false one; the first rule eats those." },
        { id: "lb-14", when: "15 Sept", do: "The gate: decide with Martin against the written ledger and announce whichever branch is true — CONFIRMED (collab post), or everyone refunded in full, said publicly.", where: "Posts → CONFIRMED · private playbook", why: "Either branch banks trust, as long as it happens in public and on time." },
        { id: "lb-15", when: "22–26 Oct", do: "Deliver — then send participants their photos, certificate (paper + PDF) and recipes, and harvest: testimonials on the record, the case study within two weeks.", where: "Private playbook · phase 6", why: "The proof asset — not the fee — is the real payment of edition one, and it fills edition two." },
      ],
    },
    {
      id: "labweek02",
      title: "Lab Week 02 — Tokyo (groundwork only, gated on Barcelona)",
      sub: "Do NOT sell this until Lab Week 01 has delivered real alumni proof. Groundwork starts now only because closing a master takes ~3 months — that was the Lippo lesson. No dates, no price, no announcement until Barcelona is done.",
      steps: [
        { id: "lw2-1", when: "Now (quiet)", do: "Re-verify the April pipeline: is the Tokyo master still findable, teaching, reachable? Confirm the venue, credentials and English capability before any contact.", where: "Private cohort-02 pipeline file", why: "The April record is stale. The experience bar needs a named master with citable proof — verify before you invest a single hour." },
        { id: "lw2-2", when: "After Barcelona confirms", do: "Send one gift-first, no-ask warming note (Messages → 'Warm a future master'). Relationship first; never a proposal.", where: "Campaign → Messages", why: "Supply is built ahead of demand. A master who already knows you says yes far faster when the time comes." },
        { id: "lw2-3", when: "After Barcelona delivers proof", do: "Adapt the Lippo term sheet to Tokyo (dates, price to the local corridor, same refund + certificate + parity structure) and open the conversation.", where: "Private cohort-02 pipeline file", why: "Barcelona's case study is your credibility — you now arrive with proof, not a pitch." },
        { id: "lw2-4", when: "When terms are signed", do: "Flip the campaign to live: fill goal, deadline, dates. Announce to the Circle first — the founding cohort gets 72 hours before anyone else.", where: "studio-campaigns.js labweek02", why: "The map is media; the beachhead is the business. Widen only after the first door is proven, and reward the people who backed edition one." },
      ],
    },
    {
      id: "launch",
      title: "Launch week — introduce EducatedTraveler",
      sub: "Post once, in this order. One flagship a day, the Letter on day one. Reply to every comment.",
      steps: [
        { id: "lw-1", when: "Day 1 · morning", do: "Post & PIN the launch carousel “This is EducatedTraveler”.", where: "Posts → This is EducatedTraveler", why: "The front door. Pin it to the top of the profile so every new visitor meets it first." },
        { id: "lw-2", when: "Day 1 · evening", do: "Send Circle Letter Issue 01 to your waitlist.", where: "Letter → Issue 01", why: "Lights up the philosophy + the science. Turns silent sign-ups into a real audience on day one." },
        { id: "lw-3", when: "Day 2", do: "Post the Story “What would you learn?” with the real Question + Poll stickers.", where: "Posts → What would you learn? (Story)", why: "Surfaces what people secretly want to learn. Every typed answer is someone to DM." },
        { id: "lw-4", when: "Day 3", do: "Post “Why I built this” (founder).", where: "Posts → Why I built this", why: "People follow a person before a project. This is the trust beat." },
        { id: "lw-5", when: "Day 4", do: "Post the “Source vs simulation” carousel.", where: "Posts → Source vs simulation", why: "States the wedge: some things only the source can teach." },
        { id: "lw-6", when: "Day 5", do: "Post the first place reel — Freediving · Dahab (your footage, or a school's with permission).", where: "Posts → Freediving · Dahab", why: "Makes it concrete: a real place, a real craft, a real way in." },
        { id: "lw-7", when: "Day 6", do: "Post the quote “You can't learn a roll-tack from a video”.", where: "Posts → roll-tack quote", why: "A shareable line — the most saveable, sendable format. Re-states the idea." },
        { id: "lw-8", when: "Day 7", do: "Reshare the best Story answers as new frames (“you said: ___”) and reply to each with its Atlas page.", where: "Story → reshare", why: "Closes the loop, shows you listen, and quietly proves the Atlas has an answer for everyone." },
      ],
    },
    {
      id: "weekly",
      title: "The weekly loop — repeat every week",
      sub: "One Letter, and a small orbit of posts around it. The Letter leads; the posts point back to it and to the Atlas.",
      steps: [
        { id: "wk-1", when: "Mon", do: "Write & send the next Circle Letter — one new place×skill, one science nugget.", where: "Letter → structure + Science Vault", why: "The hero. Everything else this week is its echo." },
        { id: "wk-2", when: "Tue", do: "Post the place reel for that craft — school footage, with permission + credit.", where: "Daily Drop (today's card) / Outreach for permission", why: "The place, alive, in motion. The school's own footage is the strongest proof." },
        { id: "wk-3", when: "Wed", do: "Post a “why this skill” card — pull one line from the Science Vault.", where: "Letter → Science Vault (make it a carousel)", why: "The science is what separates the Circle from a travel list. It makes people want to step up." },
        { id: "wk-4", when: "Thu", do: "Run a Story — a Question or a this-or-that Poll about the week's skill.", where: "Posts → Story pattern (swap the options)", why: "Cheapest reach on the platform; keeps the audience tapping and replying." },
        { id: "wk-5", when: "Fri", do: "Post one library piece — a carousel (Circle / Become) or a second place reel.", where: "Posts", why: "Keeps the feed varied and routes new visitors to the Atlas + the Circle." },
        { id: "wk-6", when: "Sat/Sun", do: "Reshare the week's best replies, answer DMs, rest. Don't break the rhythm.", where: "Story + DMs", why: "Community is replies, not broadcasts. Protect the cadence above all." },
      ],
    },
  ],
};
