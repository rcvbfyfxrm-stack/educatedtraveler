/* The EducatedTraveler development roadmap — week / weeks / months.
 * Grounded in the verified live state + market benchmark, stress-tested for a
 * solo, part-time founder often at sea. Atlas-first / connection-first.
 * The build is done — this is a DISTRIBUTION plan. Edits are tracked per-item
 * in localStorage (checkboxes); regenerate this file to change the plan itself. */
window.ET_PLAN = {
  northStar: "Make the Atlas the trusted place people find a real master at a real place — and prove it by growing an owned community (the Circle) that opens, replies, and refers.",
  oneMetric: "Engaged Circle subscribers — new sign-ups that actually open and click (target ~150–300 quality sign-ups by day 90, opening at 40%+). Not revenue, not raw followers, not pageviews. Everything else feeds this.",
  stop: [
    "Do not build more Atlas — 99 disciplines / 424 pages is plenty. New page count is not progress; distribution is.",
    "Do not re-surface selling on the public site — no prices, checkout, deposits, Quest selector, or XP/badges. Dormant, not deleted.",
    "Do not rebuild the open marketplace / instructor availability portal. Curation only — nothing you haven't trusted firsthand.",
    "Do not run a cold-press blitz, chase CPF, or make 'embodied mastery vs the AI age' the public billboard (it's the quiet angle).",
    "Do not pivot the video format before day 90, and never cite a market-size / TAM number (none is verified).",
    "Biggest trap: building instead of distributing, and letting the cadence collapse during a busy charter leg. Protect the rhythm above all."
  ],
  horizons: [
    {
      id: "week", title: "This week", sub: "Make it measurable first. You cannot run a machine you can't see — so week one is three prerequisites, nothing else.",
      groups: [
        {
          title: "The three prerequisites", goal: "Turn 424 live-but-blind pages into a measured surface, and give the Circle a real home.", metric: "first visitor visible + a test sign-up receives the welcome email",
          items: [
            { id: "w-analytics", t: "Install ONE privacy-light analytics snippet (Plausible recommended) on the ~10 hand-built pages + the Atlas generator template, then regenerate the 424 atlas pages. Add a one-line privacy note.", effort: "Half-day", impact: "High", done: "homepage + one atlas page show the snippet live; first real-time visitor appears" },
            { id: "w-gsc", t: "Verify educatedtraveler.app in Google Search Console (DNS TXT) + Bing, submit /sitemap.xml — and in the same pass delete the stray /manifesto <loc> line from sitemap.xml.", effort: "Quick", impact: "High", done: "domain verified; sitemap shows 'Success'; /manifesto no longer listed" },
            { id: "w-news", t: "Stand up the simplest Circle newsletter sender (Buttondown reports opens/clicks natively, or Resend broadcasts). Authenticate the sending domain (SPF/DKIM/DMARC) or you land in spam. Export the current launch_waitlist → import to the sender, and wire new sign-ups to sync.", effort: "Half-day", impact: "High", done: "sending domain authenticated; existing waitlist imported; new sign-up auto-syncs" },
            { id: "w-welcome", t: "Write + queue the welcome email — deliver ONE genuinely good thing in paragraph one (a single master/place worth knowing), never a pitch.", effort: "Quick", impact: "High", done: "a test sign-up receives the welcome email automatically; opens/clicks tracked" }
          ]
        }
      ]
    },
    {
      id: "weeks", title: "Next weeks (2–6)", sub: "Themed sprints. Start the content engine on your own footage — never let a cold email be the single point of failure.",
      groups: [
        {
          title: "Week 2 — Launch the content engine", goal: "Start posting now; treat school footage as an upgrade, not a gate.", metric: "clips posted ≥3 · buffer ≥2 weeks deep",
          items: [
            { id: "wk2-seed", t: "Seed the daily-drop with founder-shot craft footage + licensed/CC stock (you're a Michelin chef with a media eye). School-licensed clips are an upgrade running in parallel — not a blocker.", effort: "Multi-session", impact: "High", done: "≥3 usable clips edited to the locked wordless format" },
            { id: "wk2-post", t: "Post the first clips — the SAME wordless 30–60s clip to Reels + TikTok + Shorts, same day, each linking to its Atlas page.", effort: "Half-day", impact: "High", done: "Day 1 live on all 3 platforms, caption links to the matching /atlas page" },
            { id: "wk2-buffer", t: "Build a 3–4 week scheduled buffer ashore via native schedulers (Meta Business Suite, TikTok scheduler, YouTube scheduled) so a long charter leg never breaks the cadence.", effort: "Multi-session", impact: "High", done: "3+ weeks of posts scheduled out" },
            { id: "wk2-outreach", t: "Draft 8–12 footage-licensing emails (the Outreach tab) to high-confidence Atlas schools; get approval, send. Each yes unblocks footage AND seeds a Phase-2 partner.", effort: "Half-day", impact: "Med", done: "8–12 sent and logged in the tracker" }
          ]
        },
        {
          title: "Week 3 — Make the Circle the destination", goal: "Every channel routes to the Circle; nothing dead-ends in a feed.", metric: "issue #1 open ≥40% · page CTA sign-up conv ≥20%",
          items: [
            { id: "wk3-cta", t: "Add one quiet Circle sign-up line to the highest-traffic Atlas pages + /crew ('hear about new masters & places' — belonging, not a sales list).", effort: "Half-day", impact: "High", done: "CTA live on top pages; sign-ups attributable in analytics" },
            { id: "wk3-issue1", t: "Ship Circle letter issue #1 — one discipline×place story, founder-voiced, links out to one trusted school, ends with one question + one referral line.", effort: "Half-day", impact: "High", done: "issue #1 sent; open + click reported" },
            { id: "wk3-crew", t: "Fire the crew funnel — share /crew into your yachting/chef WhatsApp groups + 1:1 to chef peers. Your highest-trust, zero-cost channel.", effort: "Quick", impact: "High", done: "posted to ≥3 groups + 5 peers; first /crew visits show in analytics" }
          ]
        },
        {
          title: "Week 4 — Founder credibility (no press blitz)", goal: "Ready the story; do NOT cold-pitch reporters pre-traction.", metric: "press-kit page live · daily cadence held",
          items: [
            { id: "wk4-presskit", t: "Build a one-page founder-story press kit ('Michelin superyacht chef, learn it by hand at the source'). Keep it ready — pitch only warm/aligned contacts or podcast-guest spots later, when a clip has travelled.", effort: "Half-day", impact: "Med", done: "press-kit page live and shareable" },
            { id: "wk4-eeat", t: "Add a named founder author bio + firsthand 'I've trained / eaten here' language to ONLY the 10–15 Atlas pages analytics shows get traffic (build, gated to proven pages — do not touch all 100).", effort: "Multi-session", impact: "Med", done: "author bio + firsthand notes on the top-traffic pages" },
            { id: "wk4-litto", t: "Cross-introduce relevant Littoralicious food-craft readers to matching Atlas disciplines (without copying Littoralicious's design — one-project-one-identity lock).", effort: "Quick", impact: "Med", done: "≥1 relevant cross-introduction made" }
          ]
        },
        {
          title: "Week 5 — Partner groundwork (relationships, not a pipeline)", goal: "Spot future co-hosts; no deal talk until the Phase-2 gate.", metric: "≥3 schools clearing the partnership filter, in warm conversation",
          items: [
            { id: "wk5-flag", t: "From schools that replied warmly to footage outreach, flag 3–5 as potential Phase-2 co-hosts; deepen the relationship, no deal talk yet.", effort: "Multi-session", impact: "Med", done: "3–5 flagged + a warm thread open with each" },
            { id: "wk5-filter", t: "Score each against the partnership filter: 5+ yrs certified, active practitioner, English (or translator costed), insurance + permits for foreign students, cohort 8–12 + rest-day, no >90-min sitting blocks.", effort: "Half-day", impact: "Med", done: "each scored; non-clearers dropped" },
            { id: "wk5-data", t: "Tag the 10 low-confidence 'featured' courses as provisional / verifying so nothing reads as fact it isn't. Curation is the whole moat.", effort: "Half-day", impact: "Med", done: "0 unverified entries presented as fact" }
          ]
        },
        {
          title: "Week 6 — Measure & decide", goal: "First read on the loop; let the signal pick the focus for months 2–6.", metric: "engaged subscribers trending up week-over-week · cadence held",
          items: [
            { id: "wk6-analytics", t: "Review 30-day analytics — which disciplines/places get attention, where sign-ups come from, which clips earned saves/shares.", effort: "Half-day", impact: "High", done: "a one-page read of what moved" },
            { id: "wk6-gsc", t: "Check GSC indexing coverage (% indexed; long-tail impressions) using the non-branded filter — exclude queries containing 'educated traveler' / 'educatedtraveler'.", effort: "Quick", impact: "Med", done: "indexing % known; non-branded impressions visible" },
            { id: "wk6-pillar", t: "Decide the content pillar to lean into for months 2–6 based on which disciplines actually moved (let signal pick, not taste).", effort: "Half-day", impact: "High", done: "chosen pillar written down" },
            { id: "wk6-capacity", t: "Honest founder-capacity check: is 3×/week + a biweekly letter sustainable around a 70-hr yacht week? Lower the floor if not — a held 3× beats a missed 5×.", effort: "Quick", impact: "High", done: "a realistic cadence floor committed to" }
          ]
        }
      ]
    },
    {
      id: "months", title: "Next months (2–6)", sub: "Compound Phase 1. Don't force monetization. Start the slow open-loops early so they never block Phase 2.",
      groups: [
        {
          title: "Keep compounding Phase 1 (the whole job)", goal: "Consistency over a year-plus is the moat. Protect the rhythm.", metric: "90 consecutive days posting · ≥6 letters at 40%+ open",
          items: [
            { id: "m-cadence", t: "Hold the short-form cadence (3–5×/week, buffered) without pivoting the format before day 90.", effort: "Multi-session", impact: "High", done: "90 days of consistent posting" },
            { id: "m-letter", t: "Ship the Circle letter biweekly (weekly when ashore); reply to every reply + DM; ask one question per issue.", effort: "Multi-session", impact: "High", done: "≥6 issues sent at 40%+ open" },
            { id: "m-seo", t: "Enrich + verify ONLY the 10–15 pages analytics proves get traffic (build, gated to proven pages — do not chase more pages).", effort: "Multi-session", impact: "Med", done: "indexing >80%; a few long-tail page-one terms by month 6" },
            { id: "m-articles", t: "Publish the science-backed essays (Articles tab) — the 'why step up' pillar. Verify every claim against primary sources; each ends pointing to one Atlas page + the Circle.", effort: "Multi-session", impact: "Med", done: "≥2 essays published in ET voice" },
            { id: "m-partners", t: "Keep partner relationships warm; do NOT pitch a deal until the Phase-2 gate is met.", effort: "Multi-session", impact: "Med", done: "relationships warm, zero premature deal talk" }
          ]
        },
        {
          title: "Month-6 checkpoint — kill / persevere / pivot", goal: "Sunk-cost protection. Decide honestly; don't grind a dead loop for a year.", metric: "a written go / change / mothball decision",
          items: [
            { id: "m-checkpoint", t: "At month 6: if engaged subscribers <100 AND no clip travelled AND <50 non-branded organic visitors/month → formally decide to change the format/channel, or mothball ET to maintenance mode. Otherwise: persevere and keep compounding.", effort: "Half-day", impact: "High", done: "decision written down with the evidence behind it" }
          ]
        },
        {
          title: "Open-loop housekeeping (can wait for traction — MUST resolve before money flows)", goal: "Start the slow ones early so they never become the blocker.", metric: "tax residence settled before any Phase-2 entity / banking decision",
          items: [
            { id: "m-tax", t: "START the tax-residence conversation EARLY (month 2–3, background) — France vs Cayman, the critical unknown. It has a long external-advice lead time and gates everything below.", effort: "Multi-session", impact: "High", done: "residence position decided with professional advice" },
            { id: "m-formation", t: "Choose the company-formation jurisdiction (Wyoming / UK / Estonia / UAE / Cayman) AFTER residence is settled — it drives banking + payment-processor eligibility.", effort: "Multi-session", impact: "High", done: "entity chosen + opened" },
            { id: "m-legal", t: "Legal/liability sanity pass on the Atlas's outbound links (duty of care, misrepresentation, affiliate disclosure) + a short disclaimer / terms before it drives real traffic.", effort: "Half-day", impact: "Med", done: "disclaimer/terms live; outbound-link risk acknowledged" },
            { id: "m-ig", t: "Convert @educatedtraveler.app to IG Business/Creator + link a FB Page + mint a long-lived Meta token into .ig-config.json (reuse NEXUS/Tools/social-publish) — once the drop is producing sign-ups and batch-scheduling is worth it.", effort: "Half-day", impact: "Med", done: "ig_publish.py posts a test successfully" },
            { id: "m-persist", t: "Reconcile the CloudStorage checkout with the canonical /private/tmp main clone so the Jun-11 work is committed + pushed and can't dehydrate/vanish.", effort: "Quick", impact: "Med", done: "Jun-11 state confirmed committed + pushed on main" },
            { id: "m-paypal", t: "Activate PayPal live ONLY when a real off-site partner immersion is ready to transact (Stripe stays dormant).", effort: "Quick", impact: "Low", done: "deferred until Phase 2" }
          ]
        },
        {
          title: "THE PHASE-2 GATE — all 8 must be true before the first curated immersion", goal: "Do not launch a partner immersion until every gate clears. These are thresholds, not vibes.", metric: "8 / 8 green",
          items: [
            { id: "g-traffic", t: "TRAFFIC — several hundred unique non-branded organic visitors/month, sustained 3+ consecutive months, a real share landing on discipline/place pages (realistically a 9–18 month milestone).", effort: "—", impact: "High", done: "3 months sustained" },
            { id: "g-list", t: "LIST SIZE — ~1,000–2,000 engaged Circle subscribers (floor ~500–1,000 for the first 8–12-seat immersion only if engagement is exceptional).", effort: "—", impact: "High", done: "list size + engagement met" },
            { id: "g-eng", t: "ENGAGEMENT — the Circle sustains 40%+ open / 6–9% click over several issues AND behaves like a community (people reply, refer ~15–20%, answer questions).", effort: "—", impact: "High", done: "sustained over several issues" },
            { id: "g-inbound", t: "INBOUND DEMAND — regular unprompted 'how do I go do this / can you connect me to that master?' via replies, DMs, Atlas. The truest signal.", effort: "—", impact: "High", done: "arriving regularly, unprompted" },
            { id: "g-video", t: "VIDEO/REACH — at least a few clips have genuinely travelled (strong saves/shares); a repeatable top-of-funnel exists.", effort: "—", impact: "High", done: "≥a few clips travelled" },
            { id: "g-partner", t: "PARTNER-READINESS — ≥1 vetted partner clearing all non-negotiables, willing to co-host on referral/outbound. The immersion runs on partner operations, never on you building logistics.", effort: "—", impact: "High", done: "≥1 partner ready" },
            { id: "g-deposit", t: "DEPOSIT VALIDATION — soft-test the specific immersion with a small refundable deposit / paid waitlist (off-site; never on the Atlas). It must fill or clearly over-subscribe before anything is booked.", effort: "—", impact: "High", done: "deposit list fills / over-subscribes" },
            { id: "g-capacity", t: "FOUNDER CAPACITY — honest check that running ONE immersion won't starve the Atlas + Circle cadence. If it would, the gate is not met.", effort: "—", impact: "High", done: "capacity confirmed" }
          ]
        }
      ]
    }
  ],
  cadence: [
    "<b>Post the locked format 3–5×</b> (Reels + TikTok + Shorts, same clip, each → one Atlas page).",
    "<b>Keep the clip buffer ≥3 weeks ahead</b> — batch ashore; protect against connectivity gaps at sea.",
    "<b>Send / draft the Circle letter</b> (biweekly default, weekly when ashore) and <b>reply to every reply + DM</b>.",
    "<b>Send 1–2 approved touches</b> (footage-licensing or co-host nurture). No cold press until a clip travels.",
    "<b>Glance the dashboard (5 min)</b>: did engaged subscribers grow? Tally saves/shares + any 'connect-me' messages.",
    "<b>Spend one compounding hour on an owned asset</b> (enrich a proven page, write the next letter, edit clips). One compounding hour beats ten reactive ones."
  ]
};
