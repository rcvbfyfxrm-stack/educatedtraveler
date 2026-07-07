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
      title: "Lab Week 01 — Barcelona (the live campaign)",
      sub: "The paid week with Martin Lippo, 22–26 October. One goal: 10 paid seats by 15 September. The full private playbook (agreement points, gate branches) lives in the local LAUNCH-CHECKLIST — this is the working order. Nothing goes public before the signed yes.",
      steps: [
        { id: "lb-1", when: "Now", do: "Close the week with Martin in writing — the date (22–26 Oct) and the agreed terms on one signed page. If email stalls a few days, WhatsApp him.", where: "Private playbook · phase 1", why: "Everything downstream hangs on this one thread. No announcement, no post, no share before the signature." },
        { id: "lb-2", when: "Same week", do: "Arm the machine: the gestor hour, scrub the retired pages, confirm October leave in writing, write the 30–50 names list.", where: "Private playbook · phase 2", why: "The funnel can't open over a surface that contradicts the first rule, and the first seats live in your own phone." },
        { id: "lb-3", when: "Gates passed", do: "Soft launch — named list only. One personal WhatsApp at a time, never a broadcast. Target: the first 3 seats.", where: "educatedtraveler.app/barcelona", why: "Peers who trust you carry the close before any seat counter can." },
        { id: "lb-4", when: "Same days", do: "Circle letter #1 — the campaign diary begins. Biweekly from here, no exceptions.", where: "Letter tab", why: "The letter is the hero, and the cadence is the tripwire: if letters stop shipping, the builder's trap has won." },
        { id: "lb-5", when: "At 3 paid", do: "Go public: the collab post with Martin, chef Facebook groups (admin-cleared, as yourself), press pitches, the site strip.", where: "Posts → Lab Week 01", why: "The counter only helps once it has something honest to show." },
        { id: "lb-6", when: "Weekly", do: "Update the real seat count everywhere it appears — same day in September, never inflated, never stale.", where: "barcelona.html seat vars", why: "Honest scarcity is the engine; a stale count is an accidentally false one." },
        { id: "lb-7", when: "15 Sept", do: "The gate: decide with Martin against the written ledger and announce whichever branch is true — confirmed, or everyone refunded in full.", where: "Private playbook · phase 5", why: "Either branch banks trust, as long as it happens in public and on time." },
        { id: "lb-8", when: "22–26 Oct", do: "Deliver — and harvest: testimonials on the record, photos under the licence, the case study published within two weeks.", where: "Private playbook · phase 6", why: "The proof asset — not the fee — is the real payment of edition one, and it fills edition two." },
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
