/* Seed pipeline for the science-backed essays (the "why step up" content pillar).
 * These are real, well-established research anchors — angles + experts to write FROM,
 * not fabricated citations. ET voice: connect/introduce, no banned words
 * (transformation, life-changing, vacation, luxury, easy). Edits live in localStorage. */
window.ET_ARTICLES_SEED = [
  {
    id: "choose-online-course",
    title: "How to choose an online course, from first principles",
    core: "method",
    skill: "All disciplines — choosing online learning that actually teaches",
    hook: "Follow the money, count the doing, and book the room before you start the screen. A 20-minute vetting method derived from what a skill actually is.",
    science: "Reich & Ruipérez-Valiente (Science 2019) MOOC completion; Ericsson deliberate practice; Cepeda spacing meta-analysis; Koedinger doer effect; US DoE online-learning meta-analysis; Blume transfer meta-analysis; FTC dark-patterns report + MOBE/Digital Altitude/OTA cases.",
    experts: ["Reich & Ruipérez-Valiente", "K. Anders Ericsson", "Kenneth Koedinger", "FTC enforcement record"],
    promise: "The reader can vet any online course in 20 minutes and knows exactly where the screen ends and the room begins.",
    outline: [
      "What a skill is (the loop) → four irreducibles",
      "What a screen carries: digitizes / degrades / vanishes — honest both ways",
      "Four cash-flow shapes → what the school is paid to optimise",
      "The 8-step process (money timing, private-window test, count the doing, who sees your work, test the exit, decide by the loop, book the room)",
      "Where the screen ends → Atlas bridge"
    ],
    status: "draft",
    draftUrl: "/journal/how-to-choose-an-online-course",
    reviewNotes: "FULL DRAFT LIVE (noindex, unlisted, draft banner) at /journal/how-to-choose-an-online-course. Built 2026-07-09 by a 13-agent workflow (4 research sweeps, 3 first-principles derivations — incentives lens won the judge panel, 3 adversarial critics). All blocker+major findings fixed: MOOC stats scoped to free courses with the verified-track counterpoint added, permission re-categorised as issuer-dependent, step-7 mapping stated honestly, 'the room' defined functionally. 13 minor critic notes remain, none factual. TO PUBLISH: remove draft banner + noindex meta, add the journal index card, and decide whether it complements or replaces the six-questions piece.",
    targetWeek: "await founder review"
  },
  {
    id: "hands-reward",
    title: "Why your hands settle your head",
    core: "wellness",
    skill: "Craft & making (all hands-on disciplines)",
    hook: "The brain rewards effort you can touch. Working with your hands is measurably grounding — not a metaphor.",
    science: "Effort-driven rewards & behavioural activation: physical, goal-directed hand work engages the striatum and lifts mood. Strong antidote framing to passive screen time.",
    experts: ["Kelly Lambert (effort-driven rewards, 'Lifting Depression')", "behavioural-activation literature"],
    promise: "Make the reader feel the pull to put the screen down and do one real thing with their hands this month.",
    outline: [
      "Open on the moment a beginner's hands first 'get it' (a thrown pot, a clean knife cut)",
      "The science: effort you can see + touch = reward circuitry, not dopamine-scroll",
      "Why the AI age makes this scarcer and more valuable (quiet foil, one line)",
      "Where the craft is alive → one Atlas page"
    ],
    status: "idea", targetWeek: "Month 2"
  },
  {
    id: "flow-at-source",
    title: "Flow doesn't come from a couch",
    core: "creative",
    skill: "Any deep-practice craft (pottery, glass, music, cooking)",
    hook: "The most satisfying state humans can enter needs a real challenge, real feedback, and full attention — the opposite of a feed.",
    science: "Flow: the balance of challenge and skill, immediate feedback, loss of self-consciousness. A week of focused practice at the source is a flow factory.",
    experts: ["Mihaly Csikszentmihalyi ('Flow')", "Anders Ericsson (deliberate practice)"],
    promise: "Show that the thing they're chasing on screens (absorption, time vanishing) is available, in a higher form, by learning a craft in a room with others.",
    outline: [
      "Define flow plainly; the reader has felt it and lost it",
      "Why notifications murder it and a week-long immersion rebuilds it",
      "Deliberate practice + a master's feedback loop",
      "Atlas: where to find a room like that"
    ],
    status: "idea", targetWeek: "Month 2"
  },
  {
    id: "awe-nature",
    title: "Awe is a nutrient, and we're starving",
    core: "adventure",
    skill: "Freediving, sailing, mountaineering, surfing",
    hook: "Awe measurably lowers stress and shrinks the ego's noise — and it lives in big water and high places, not in a 6-inch screen.",
    science: "Awe research: awe-walks reduce daily stress and self-focus, increase prosocial feeling and wellbeing. Adventure disciplines are awe on tap.",
    experts: ["Dacher Keltner ('Awe', Berkeley awe-walk studies)"],
    promise: "Make the reader ache for the horizon and book the skill that gets them there (diving, sailing) — earned, not bought.",
    outline: [
      "What awe does to the body and the small self",
      "Why screens can't deliver it (and pretend they can)",
      "The skills that are really doorways to awe",
      "Atlas: the strongest communities for each"
    ],
    status: "idea", targetWeek: "Month 3"
  },
  {
    id: "cold-water-nervous-system",
    title: "What cold water teaches your nervous system",
    core: "adventure",
    skill: "Freediving & cold-water immersion",
    hook: "The dive reflex and deliberate breath work are an ancient off-switch for the stress response — and you can be taught to use it.",
    science: "Mammalian dive reflex, vagal tone, breath-control training; downshifting the sympathetic nervous system. Frame responsibly (safety, certified instruction).",
    experts: ["dive-reflex physiology", "freediving pedagogy (AIDA/Molchanovs)", "controlled breathing & HRV research"],
    promise: "Turn curiosity about breath-hold into the desire to learn it properly, with a real school and a cohort — never alone off a video.",
    outline: [
      "The reflex we're born with and forget",
      "Breath as a trainable skill, not a hack",
      "Safety = why this is a 'learn at a school, in a group' skill",
      "Atlas: where freedivers go to become freedivers"
    ],
    status: "idea", targetWeek: "Month 3"
  },
  {
    id: "mastery-meaning",
    title: "Skills last, tans fade — the case for mastery",
    core: "culinary",
    skill: "Cooking, pastry, fermentation, sommellerie",
    hook: "A capability you earn stays with you and compounds. A memory you buy doesn't. Mastery is the one purchase that keeps paying out.",
    science: "Deliberate practice; competence as a driver of intrinsic motivation and meaning; craftsmanship and the dignity of skilled work.",
    experts: ["Anders Ericsson (deliberate practice)", "Cal Newport ('So Good They Can't Ignore You')", "Matthew Crawford ('Shop Class as Soulcraft')"],
    promise: "Reframe the spend: not on a week away, but on a skill they'll have for life. The ET thesis in essay form.",
    outline: [
      "Memory economy vs capability economy",
      "Why competence feels like meaning (self-determination theory)",
      "The credential as proof you actually did the thing",
      "Atlas: where each craft was born"
    ],
    status: "idea", targetWeek: "Month 2"
  },
  {
    id: "ai-age-real-skill",
    title: "When machines can do almost anything, do something real",
    core: "wellness",
    skill: "Cross-cutting (the manifesto-adjacent essay)",
    hook: "The rarer it becomes to make something with your own hands, alongside other people, the more it's worth. This is the quiet case for the source.",
    science: "Embodied cognition; the limits of vicarious/observational learning vs doing; human need for agency and belonging. Keep the AI angle a quiet foil, not a billboard.",
    experts: ["embodied-cognition research", "self-determination theory (Deci & Ryan): autonomy/competence/relatedness"],
    promise: "The keystone 'put the screen down' essay — give the reader permission, and a map, to go become someone who can do a real thing.",
    outline: [
      "The new scarcity: real skill, real people, a real place",
      "What you can't learn by watching (embodied knowledge)",
      "Agency + competence + belonging = the three things screens fake",
      "The Atlas as the map, the Circle as the people"
    ],
    status: "idea", targetWeek: "Month 2"
  },
  {
    id: "belonging-longevity",
    title: "The people you learn beside",
    core: "wellness",
    skill: "Cross-cutting (the cohort/community essay)",
    hook: "The single strongest predictor of a long, good life is the strength of your relationships — and a shared hard thing forges them fast.",
    science: "Harvard Study of Adult Development (relationships predict health & longevity); Blue Zones (belonging, purpose); shared-adversity bonding.",
    experts: ["Robert Waldinger ('The Good Life', Harvard Study of Adult Development)", "Blue Zones research (Dan Buettner)"],
    promise: "Sell the cohort, not the class — make the reader want the circle of people chasing the same fire. ET's real moat in essay form.",
    outline: [
      "Why we remember the people more than the place",
      "The science of bonding through a shared hard skill",
      "Belonging as health, not a nice-to-have",
      "The Circle: how to find your people"
    ],
    status: "idea", targetWeek: "Month 4"
  },
  {
    id: "learn-by-doing",
    title: "You cannot YouTube a roll-tack",
    core: "adventure",
    skill: "Sailing (and every motor-skill craft)",
    hook: "Some knowledge only enters through the body, with a teacher beside you and water under the hull. Watching is not doing.",
    science: "Motor learning, procedural memory, the role of real-time correction and proprioception; why observational learning plateaus without practice.",
    experts: ["motor-learning research", "expertise & procedural memory literature"],
    promise: "Puncture the illusion that a screen can teach a physical skill — and point to the place and people who actually can.",
    outline: [
      "The plateau of watching",
      "Procedural memory: knowledge that lives in the hands",
      "Why a master's correction in the moment is irreplaceable",
      "Atlas: schools where the craft is taught right"
    ],
    status: "idea", targetWeek: "Month 3"
  }
];
