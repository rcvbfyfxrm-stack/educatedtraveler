# Intent capture — "I want to learn ___"

**Status:** design + drop-in component, shipped to the Atlas generator 2026-06-19.
**Goal:** capture the *specific* burning intention (this craft, maybe this place) at the
exact moment it's hot, instead of a vague core bucket — then introduce as the Atlas grows.

---

## The problem with what we used to capture

The Circle form (`community.html`) and the homepage notify form capture a **broad core**:
`adventure | wellness | culinary | creative`. That's a mood, not an intention. Someone who
just read the whole Mashiko page and felt the pull doesn't want "creative" — they want
**pottery, at the source, soon**. The old Atlas CTA linked to a generic `/#circle` form and
**dropped that context**.

> The intention is always more specific than the bucket. Capture it at full resolution,
> where it's burning, or lose it.

---

## The data model — no migration needed

`launch_waitlist` (migrations 019 + 021) already has everything:

```
email        TEXT
interests    JSONB   -- store structured intents at full resolution instead of a flat core
source       TEXT    -- record WHERE the intent fired (which Atlas page / article)
unsubscribed / unsubscribe_token / welcomed_at / last_issue   -- Circle sender plumbing
```

The inline form writes:

```json
{ "email": "...", "interests": [
  { "kind": "discipline", "discipline": "pottery-and-ceramics", "place": "mashiko",
    "label": "Pottery & Ceramics · Mashiko" } ],
  "source": "atlas:pottery-and-ceramics--mashiko" }
```

Back-compat: the broad-core strings (`"culinary"`) stay valid in the same array — the Circle
sender already iterates `interests`; an object entry is just richer. No reader breaks. RLS
already allows anon INSERT and restricts SELECT to admins (migration 019).

---

## What shipped

- `website/js/intent-capture.js` — handles every `form.intent` on the page, writes to
  `launch_waitlist`, swaps the form for a confirmation, fires a Plausible `Intent` event.
- `scripts/build-atlas-pages.py` — `intent_form()` replaces the bare `/#circle` CTA on every
  discipline×place and discipline-hub page, with `data-discipline` / `data-place` / `data-label`
  pre-filled so the visitor only types an email. CSS + the three script tags are baked into
  the shared `page()` template. A `<noscript>` falls back to the Circle link.

## Still owed (the drip — small follow-ups)

1. `circle-welcome` Edge Function: branch the copy on `interests[0].kind === 'discipline'` so
   the welcome names the craft back ("You raised your hand for pottery in Mashiko…").
2. When the Atlas gains depth for a craft, query everyone whose `interests` contains that
   `discipline` and send one specific introduction — the outbound partner-intro bridge from
   CLAUDE.md, finally pointed at people who *asked*.
3. Admin "Demand by craft" view: `select discipline, count(*) … group by 1 order by 2 desc`.
4. Add the Plausible `Intent` custom event as a goal.

Honesty guardrail (the first rule): the confirmation says "we'll introduce you when this is
ready" — never implies a school is bookable when it isn't.
