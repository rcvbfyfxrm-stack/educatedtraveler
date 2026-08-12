# EducatedTraveler

**A free record of where crafts are still taught at the source — with a name and a date on every line — and an introduction to the teacher when you want to go.**

- **The Atlas** — what's alive, where, and the people keeping it alive. Free. Nobody can pay to be on it, or to be left off it.
- **The Circle** — the people, and what they want to learn.
- **The Lab Week** — the only paid thing. A week built for them.

Live at **[educatedtraveler.app](https://educatedtraveler.app)**.

---

## What this is not

Not a school, and not a certifier — EducatedTraveler teaches nothing and issues nothing. Where a craft has a qualification an outside body examines for, that body is named and linked; where a certificate is a school's own, the entry says so.

Not a marketplace, and not first or only. The [Homo Faber Guide](https://www.homofaber.com/) has kept a larger free record for eight years. Every entry prints the way to reach the teacher directly, and what it costs, even when that is cheaper than us.

And no promise about your hands. No study shows a week with a master beats the same hours practised alone, so we do not claim it. A week buys the room and the person.

---

## Where the map stands

100 crafts · 335 places · 847 school entries · 56 countries.

**118 places have a named teacher. 217 are blank, on purpose. 0 have been checked and dated.**

The blanks are the point: nothing is filled with a plausible name, and a craft stays blank until someone asks about it and a real check is done. Every entry carries how it is known and when it was last looked at — or says plainly that it has not been.

---

## Repo layout

```
website/            Static site — GitHub Pages → educatedtraveler.app. No build step.
  atlas/            436 generated pages (built by scripts/build-atlas-pages.py)
  js/repertoire.js  The Atlas data — window.ET_ATLAS, plus standardMeta
  js/               auth, database, supabase-config, atlas-ratings
supabase/
  migrations/       The authoritative schema. Run in order.
  functions/        Deno edge functions (welcome, follow-ups, broadcast)
scripts/            Page builder, PDF builders, ops utilities
docs/               Setup guides, flows, and HISTORY.md
os/                 Product and brand operating documents
```

**Private and gitignored:** `marketing/`, `FOUNDING-CANON/`, `MASTERPLAN.md`, `VISION.md`, `PLAYBOOK.md`.

## Working on it

Start with **`CLAUDE.md`** — it is the router, and it is short by design. Read the one row of its table your task needs, and nothing else.

```bash
python3 -m http.server 8000 --directory website   # serve
python3 scripts/build-atlas-pages.py              # rebuild the Atlas pages, sitemap, robots
```

Pushing to `main` deploys. Deploy from a fresh clone, never from a synced folder.

---

*A place, a person, your people. Earned, not bought. At the source, not the simulation.*
