# The place intro

_One paragraph about the town, at the top of a place sheet. What it must rest on, and what
it may never do._

Arnaud, 13 September 2026: *"when talking about a place, a school, I want all the
information regarding it — is there a strong community, the part you already checked, but
also the culture, the nature, the people, the food."* And on the form, the same day:
*"no details — the main things must be the craft and the school, but just develop a bit
more on the vibe there so people can picture it. Dont make beats, I want all to be
described in kind of an intro."*

---

## The one idea

A destination sheet — `/atlas/<craft>--<place>` — carries the craft, the school, the
teacher and the credential, and **nothing about the town**. That is not an oversight:
every other prose field is fenced to the craft on purpose. `why` is the reason to go, a
learn line "may say nothing its own why does not already say", a community line is *how we
know who is already there*. None of them may say what the place is **like**.

So this is **the only prose on the map allowed to introduce facts the craft record does not
hold** — which is exactly why its evidence rules are the strictest on the map.

---

## The form

One paragraph, **85–150 words**. No headings, no bullets, no labelled beats. The ground,
the people, the table and what is alive there, in whatever order the place itself suggests,
closing on one thing to do with a free afternoon — the reader is often a working chef with
one day off.

The fourteen already in `data/atlas-extra-sheets.json → placeIntros` are the standard.
Read them before writing one.

---

## The evidence law

**Every name and every number must be traceable** to the destination's own record or to one
of this intro's own cited sources. The build refuses the rest. There is no "researched, not
checked" state here and no provisional label.

- A source is a **url, the fact it carries, and the day it was read**. All three.
- The `what` must be readable **verbatim on that url** — fetch the page and confirm it.
  The night check re-reads every one, so a paraphrase fails forever. Cite the page carrying
  the fact, not a parent page; prefer an HTML view over a PDF.
- ⛔ **A school's own page is never evidence about its town.** The build computes every host
  selling a course on that craft and refuses a source from any of them.
- **Read the page.** A search result is a lead, never a citation.
- ⭐ **Look in our own record before going to the web.** Thirty-one school blurbs were
  truncated and every missing tail was already in that craft's `featured.description`. The
  web route had produced a wrong name before the record corrected it.

### Source families that have worked
A city council's culture office · a national tourist agency · a market authority · the EU
geographical-indication register on EUR-Lex · UNESCO ICH (`ich.unesco.org` works;
`whc.unesco.org` refuses both curl and WebFetch) · a national park service and its
operational rules · a lighthouse authority · a wine interprofession · a regional tourism
board · a state environment department's protected-areas register.

⚠ **A bot wall is not an absence.** 202, 403 and 000 are walls. Each has had a usable
sibling: a different page of the same authority, or the municipal body behind it.

---

## What it may never do

- ⛔ **Grade.** The Measure is where a judgement with a name on it lives. A second verdict
  in different words is a grade nobody signed.
- ⛔ **Restate the `why` or the community line.** The `why` prints twice on that page
  already. The build refuses a run of eight words shared with either — and the community
  line has usually already spent the obvious source, so find a different fact about the
  same town.
- ⛔ **Assert a negative.** "Nothing is open after nine", "there is no scene here" —
  *"failed" requires evidence of failure*, and this standard carries a public correction
  for that exact fault. An absence is written as an absence.
- ⛔ **Sell.** No price, no "book", no "enrol". The verbs are introduce / connect / bridge.
- ⛔ **Talk about Arnaud.** The Atlas speaks as *we*; voice means register, not biography.
- ⛔ **Repeat itself across two crafts in one town.** Barcelona carries two sheets and two
  readers. Same town, different paragraph.

### Banned words
The union of both houses' lists: transformation, transformational, life-changing, vacation,
holiday, luxury, easy, journey, curated, unlock, elevate, elevated, empower, artisanal,
delicious, vibrant, charming, quaint, stunning, breathtaking, hidden gem, must-try,
must-see, iconic, bustling, paradise, unspoilt, unspoiled, world-class, best-kept.

⚠ **A banned word inside a name a source publishes is allowed** — UNESCO inscribed
*"Artisanal talavera of Puebla and Tlaxcala"*, and refusing it would force the paragraph to
misname the thing it is about. Never censor a cited name.

---

## The two traps that catch every writer

⚠ **Month names.** The record stores `bestSeason` as `"May-Oct"` and `"Dec-Mar"`, so writing
"October" or "December" is an unsourced token and the build refuses it. Either cite a source
carrying the month, or write the season without naming one. This has tripped more drafts
than anything else.

⭐ **The imperative is the only sentence allowed to be unsourced.** *"Go early, and go
twice"* is advice and carries no claim. *"The city shops daily rather than weekly"* is a
claim and needs a source or deletion. Everything that reads as atmosphere must arrive as
either a cited fact or an instruction to the reader.

---

## Drafting, checking, signing

1. Draft into `data/atlas-intro-drafts.json` → `drafts`, shape
   `{text, sources: [{url, what, read}]}`. **The build never reads this file.**
2. Dry-run each draft: copy it into `placeIntros` with a placeholder checker and date, run
   `python3 scripts/build-atlas-pages.py`, then **restore the file**. The build names any
   unsourced token, banned word, seller host, over-long text or repeated run.
3. Re-read every source against its own url and confirm the `what` is present.
4. ⛔ **A human signs**: `python3 scripts/sign-intro.py <destination-id> --as "Name"`.
   **No script may write a `checker`** — the build refuses an intro without one, so an
   unsigned paragraph is unpublishable rather than merely unpublished.
5. Lower `placeIntroDebtFloor` to the number the build prints. Never your own arithmetic.

⚠ **Four open places cannot carry an intro at all.** `self-sufficiency--sunseed-almeria`,
`japanese-knife-making--kurogane-shimanto`, `lymphatic-drainage--walchsee` and
`lifestyle-medicine--united-states` are **preserved redirect stubs** — the build never
writes those pages, so a signed intro renders nowhere and check 20 fails. They need
`inject-related-handwritten.py`, the way the places table did. Skip anything whose
`<id>.html` is in `preserve`.

---

## Where it lives

| | |
|---|---|
| Published intros | `data/atlas-extra-sheets.json` → `placeIntros` |
| Drafts | `data/atlas-intro-drafts.json` — **never read by the build** |
| Signing | `scripts/sign-intro.py` |
| Renderer | `scripts/build-atlas-pages.py` → `place_intro()` |
| The eyebrow | `scripts/atlas_hub.py` → `PLACE_INTRO_MARK` |
| The guards | `scripts/build-atlas-pages.py`, the `placeIntros` validation block |
| The ratchet | `placeIntroDebtFloor` — headroom is the largest locked craft's place count |
| Nightly re-read | `scripts/night-check.py` → `manifest_claims()`, class `place intro` |
| The page check | `scripts/check-atlas-hub.py` → check 20 |
