/* Studio "Campaign" tab — the cockpit for live paid weeks (Lab Weeks).
 * PUBLIC FILE: world-readable. Never put deal terms, fee splits, prospect names,
 * partner private contacts, or pre-signature dates/prices for a groundwork week here.
 * Seat counts live in localStorage (S.camp), not in this seed. */
window.ET_CAMPAIGNS = [
  {
    id: "labweek01",
    name: "Lab Week 01 — Barcelona",
    status: "live",                       // live | groundwork | done
    partner: "Martin Lippo — Vakuum, Barcelona",
    page: "https://educatedtraveler.app/barcelona",
    goal: 10, cap: 15,
    deadline: "2026-09-15", tz: "+02:00",
    eventStart: "2026-10-22", eventEnd: "2026-10-26",
    launchPhaseId: "labweek01",           // joins ET_LAUNCH.phases[].id — shares the checklist ticks
    publicCountVar: "SEATS_TAKEN",        // reminder: the page's own count lives in website/barcelona.html
    milestones: [
      { at: 3, do: "Counter goes public. Go loud: the collab post with Martin, chef groups (admin-cleared), press, the site strip." },
      { at: 8, do: "Goal-gradient push. If the signed extension exists, 8 on 15 Sept moves the decision to 25 Sept." },
      { at: 10, do: "CONFIRMED. Decide jointly with Martin on the ledger, announce publicly, open the cohort group, seats to 15 until 8 Oct." },
    ],
    links: [
      { label: "The page", href: "https://educatedtraveler.app/barcelona" },
      { label: "Announce post", tab: "posts" },
      { label: "Seat-count story", tab: "posts" },
      { label: "The letter", tab: "letter" },
    ],
    note: "The private playbook (agreement points, gate branches, the levers) lives in the local LAUNCH-CHECKLIST — never in this repo.",
  },
  {
    id: "labweek02",
    name: "Lab Week 02 — Tokyo (groundwork)",
    status: "groundwork",
    gatedBy: "labweek01",
    partner: "Sushi master — Tokyo (verify the April pipeline before any contact)",
    launchPhaseId: "labweek02",
    goal: null, deadline: null, eventStart: null,
    links: [],
    note: "Sells only after Lab Week 01 delivers real alumni proof. Groundwork now because supply takes ~3 months to close — that was the Lippo lesson. No dates, price, or announcement until Barcelona is done.",
  },
];

/* The whole ET development arc — the intelligent process, at a glance.
 * Where a Lab Week campaign sits inside the bigger plan. Full text: MASTERPLAN.md. */
window.ET_PATH = {
  north: "Make the Atlas the trusted place people find a real master at a real place — and prove it by (1) a community that opens and refers (the Circle) and (2) delivered Lab Weeks that leave cited proof. The map is free forever; a few times a year we walk through one door together.",
  oneThing: "Right now, one thing matters more than anything else: fill Lab Week 01. A delivered, photographed, cited cohort is the asset every later stage compounds from.",
  stages: [
    { n: 0, title: "Make the truth true", where: "Plan tab · the four founder papers", done: false,
      what: "Every public page survives inspection; the one metric is readable; the 30–50 names list, the hour budget, and the per-hour economics exist on paper. Nothing sells over a page that contradicts the first rule." },
    { n: 1, title: "Close the master", where: "Campaign → next action (lb-1) · private LAUNCH-CHECKLIST", done: false,
      what: "One signed page with Martin + the week visible on his own calendar. Everything downstream hangs on this one thread." },
    { n: 2, title: "Prove someone pays", where: "Campaign → soft launch (lb-3) · Messages", done: false,
      what: "3 refundable seats from your own named list, person by person. If your whole list can't produce 3, the offer is wrong — learn it privately, before the public push." },
    { n: 3, title: "Fill the room", where: "Campaign → milestones · Posts · Letter", done: false,
      what: "The public room: chef groups, press, the collab post, the documentary arc. The honest count does the selling from seat 7 on." },
    { n: 4, title: "Deliver and harvest", where: "Campaign → deliver (lb-8) · Articles", done: false,
      what: "Run the week, then turn it into the proof asset: cited testimonials, photos under licence, the case study within two weeks. The proof — not the fee — is the real payment of edition one." },
    { n: 5, title: "Repeat, then widen", where: "Campaign → Lab Week 02 groundwork", done: false,
      what: "Repeat the same master, then one adjacent door (Tokyo), each announced to the Circle first. Never widen before the first door is proven. The map is media; the beachhead is the business." },
  ],
  refuse: [
    "No fabricated anything — reviews, scarcity, counts. Real numbers only.",
    "No prices or checkout on the Atlas — the map sells nothing.",
    "No second city before Barcelona delivers cited proof.",
    "No luxury/exclusive/club language — more serious, never more premium.",
    "No building instead of distributing — distribution acts per week ≥ build commits, or stop.",
  ],
};
