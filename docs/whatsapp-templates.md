# WhatsApp Message Templates — Meta Approval

Submit these templates at: **Meta Business Suite > WhatsApp Manager > Message Templates**

Each template uses variables in `{{1}}`, `{{2}}` format (Meta's placeholder syntax).
Templates must be approved before you can send them programmatically.

---

## 1. `welcome_quest` — After Quest Completion

**Category:** Marketing
**Language:** English
**Header:** None
**Body:**

```
Hey {{1}}! You just completed the quest on EducatedTraveler.

Your persona: {{2}}
Your top match: {{3}}

Want to know more about this experience? Reply here — I read every message.

— Arnaud
```

**Variables:**
| Placeholder | Description | Example |
|---|---|---|
| `{{1}}` | First name | "Sarah" |
| `{{2}}` | Persona type | "The Deep Diver" |
| `{{3}}` | Top adventure match | "PADI Divemaster — Thailand" |

**Footer:** EducatedTraveler — Skills last, tans fade.
**Buttons:** None (encourages free-form reply)

---

## 2. `followup_day3` — Day 3 Nurture

**Category:** Marketing
**Language:** English
**Header:** None
**Body:**

```
Hey {{1}}, quick thought from 3 days ago.

Most travel companies optimize for comfort. We optimize for transformation.

That means:
- Real certifications (PADI, RYA, Yoga Alliance, WSET)
- Real instructors (5+ years, world-class credentials)
- Real immersion (not weekends — weeks)

When you leave, you take something home. Not a tan — a skill.

See all offerings: https://educatedtraveler.app/offerings

— Arnaud
```

**Variables:**
| Placeholder | Description | Example |
|---|---|---|
| `{{1}}` | First name | "Sarah" |

**Footer:** EducatedTraveler — Skills last, tans fade.
**Buttons:** None

---

## 3. `followup_day7` — Day 7 Nurture

**Category:** Marketing
**Language:** English
**Header:** None
**Body:**

```
Hey {{1}}, one last thought.

After 50,000 nautical miles and Michelin kitchens to midnight markets, I noticed a pattern.

Every skill worth having came from:
1. A place — where the knowledge was born
2. A person — who mastered it and is willing to share
3. Total immersion — not weekends, weeks

That's what we're building. Reply to this message if you have questions. I read everything.

— Arnaud
```

**Variables:**
| Placeholder | Description | Example |
|---|---|---|
| `{{1}}` | First name | "Sarah" |

**Footer:** EducatedTraveler — Skills last, tans fade.
**Buttons:** None

---

## 4. `booking_inquiry` — Interest Confirmation

**Category:** Utility
**Language:** English
**Header:** None
**Body:**

```
Hey {{1}}! Thanks for your interest in {{2}}.

Here's what happens next:
1. I'll send you the full experience details
2. We'll find a cohort date that works
3. You lock in your spot with a deposit

Any questions? Just reply here.

— Arnaud
```

**Variables:**
| Placeholder | Description | Example |
|---|---|---|
| `{{1}}` | First name | "Sarah" |
| `{{2}}` | Adventure name | "PADI Divemaster — Thailand" |

**Footer:** EducatedTraveler
**Buttons:** None

---

## 5. `cohort_open` — Cohort Announcement

**Category:** Marketing
**Language:** English
**Header:** None
**Body:**

```
Hey {{1}}! A {{2}} cohort is forming for {{3}}.

{{4}} spots left.

This is based on your quest results — you matched with this experience. Want in?

Reply "YES" and I'll send you the details.

— Arnaud
```

**Variables:**
| Placeholder | Description | Example |
|---|---|---|
| `{{1}}` | First name | "Sarah" |
| `{{2}}` | Adventure name | "PADI Divemaster — Thailand" |
| `{{3}}` | Month/date | "June 2026" |
| `{{4}}` | Spots remaining | "4" |

**Footer:** EducatedTraveler — Skills last, tans fade.
**Buttons:** None

---

## Submission Tips

1. **Keep it conversational** — Meta rejects templates that sound like spam
2. **No ALL CAPS** — except acronyms (PADI, RYA)
3. **Include opt-out language** if Meta requests it (they sometimes do for marketing templates)
4. **Approval takes 24-48 hours** — submit all templates at once
5. **Marketing vs Utility** — Marketing templates have a 24-hour window; Utility templates can be sent anytime
6. **Test first** — Use the test phone number from your Meta developer app before going live
