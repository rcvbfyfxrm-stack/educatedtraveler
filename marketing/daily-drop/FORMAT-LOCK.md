# Daily Drop — the locked format

Step 2 of the 90-day plan (see `research/market-benchmark-2026-06-11.md`).
Evidence: the single most replicated growth pattern across 24 analyzed accounts
(Li Ziqi 29M+, ProcessX 0→1.34M in ~2 yrs faceless, Tortus ~1M, three TikTok
potters at 1.2–1.3M each) is the **wordless sensory process clip**, posted on a
**relentless daily cadence in one unchanging template** (Gadsby: 11 years daily;
Leatherstein: breakout on day 31 of daily posting).

## The one format — never vary it

**Clip (30–60s, vertical):**
1. Hands + raw material of one craft. Close. Ambient/natural sound only — no
   narration, no music if the craft has its own sound.
2. Cut to only the most tactile seconds (the throw, the fold, the pour, the strike).
3. END on the finished object or the moment of competence. Always.
4. One caption card max ("Rishikesh, India" style). No text walls on the video.

**Caption (generated — see calendar):**
1. Line 1 = the hook: birthplace / living-capital / strongest-community superlative.
2. The atlas `why` line.
3. Community strength + season.
4. One sentence of what we are: "We map where every craft is truly alive — and
   introduce you to the school and the people going."
5. The atlas page URL. Every clip points at exactly one page.
6. 4–5 hashtags: core tags + place + discipline.

**Distribution:** the SAME clip to TikTok + Instagram Reels + YouTube Shorts,
same day. One global account (@educatedtraveler.app). Never regional accounts
(anti-playbook: Wecandoo's fragmented satellites).

**Cadence:** one per day, every day. Expect nothing before ~day 30
(Leatherstein precedent). Do not pivot the format inside the first 90 days.

## Voice rules (from CLAUDE.md lock)
- Connect / introduce / bridge — never sell, book, enroll.
- Banned words: transformation, life-changing, vacation, luxury, easy.
- **No prices** — the playbook's price-anchor element is deliberately dropped:
  the strategy lock keeps prices off every ET surface. The scarcity/superlative
  hook carries the caption instead.
- No decorative emoji.

## Footage sourcing (you don't film — partners do)
Footage is licensed/reposted from the schools already on each atlas page, with
credit — which is simultaneously partner recruitment (see `OUTREACH.md`).
Fallback sources: the destination's tourism board media library, or commission
a local micro-creator (step 4 of the plan).

## Workflow
1. `python3 scripts/build-daily-drop.py 30` → regenerates `calendar-30d.md` + `calendar.json`.
2. For each day: secure the clip (OUTREACH.md), post per the calendar entry.
3. The Littoralicious-side `NEXUS/Tools/social-publish/` toolkit (ig_publish.py,
   official IG Graph API) can automate posting once the ET IG is a Business
   account with a Meta token — same gate as Littoralicious.

## What success looks like (per the benchmark)
Not follower count first — watch saves, profile taps, and atlas-page clicks +
Circle signups (`launch_waitlist`). Audience converts off-platform via the
newsletter (step 3), never in the feed.
