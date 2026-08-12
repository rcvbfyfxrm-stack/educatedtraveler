# Playbook — Operations Stack

**HubSpot (CRM) + Notion (Ops Hub) + Granola (Meeting Notes)**
Connected via Zapier. Supabase remains the website backend.

---

## Architecture Overview

```
                    ┌─────────────┐
                    │   WEBSITE   │
                    │ (Supabase)  │
                    └──────┬──────┘
                           │ Zapier: new signup
                           ▼
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  Granola │──────▶│   HUBSPOT    │◀─────▶│  NOTION  │
│ (Meetings)│ native│   (CRM)     │ Zapier │ (Ops Hub)│
└──────────┘       └──────────────┘       └──────────┘
                           │
                    Deals, contacts,
                    pipeline, emails
```

**Data ownership:**
- **Supabase** → Website auth, user profiles, quest data, gamification (XP/badges)
- **HubSpot** → Contacts, deals, pipeline stages, email sequences, meeting logs
- **Notion** → Experiences catalog, cohort schedules, partner tracker, SOPs
- **Granola** → Meeting transcripts → auto-logged to HubSpot contacts

---

## 1. HubSpot Setup

### 1.1 Contact Properties (Custom)

Create these custom properties in HubSpot → Settings → Properties → Contact:

| Property | Type | Group | Purpose |
|----------|------|-------|---------|
| `et_persona` | Dropdown | ET | Ocean Tactician, Blue Depth Seeker, Quiet Storm, Kitchen Alchemist, Edgewalker, Wild Guide |
| `et_elements` | Multi-checkbox | ET | ocean, mountain, city, temple, wild |
| `et_desires` | Multi-checkbox | ET | certification, career, stories, reset, rare |
| `et_time_preference` | Dropdown | ET | Foundation (7-21d), Mastery (1-3mo), Saga (6mo) |
| `et_intensity` | Number | ET | 1-3 |
| `et_xp` | Number | ET | XP score from website |
| `et_source` | Dropdown | ET | website, instagram, referral, partner, event |
| `et_matched_adventures` | Multi-line text | ET | Adventure IDs matched by quest |
| `et_supabase_id` | Single-line text | ET | UUID link back to Supabase profile |

### 1.2 Deal Pipeline — Student Journey

**Pipeline name:** `Student Journey`

| Stage | Probability | Description |
|-------|------------|-------------|
| **Lead** | 10% | Signed up on website, took quest |
| **Engaged** | 20% | Opened emails, saved adventures, returned to site |
| **Discovery Call** | 40% | Booked or completed intro call |
| **Proposal Sent** | 60% | Received experience details + pricing |
| **Deposit Paid** | 80% | Deposit received, spot reserved |
| **Enrolled** | 90% | Full payment, cohort assigned |
| **Completed** | 100% (won) | Finished the experience |
| **Lost** | 0% (lost) | Didn't proceed |

**Deal properties (custom):**

| Property | Type | Purpose |
|----------|------|---------|
| `experience_name` | Dropdown | Which adventure |
| `cohort_id` | Single-line text | Links to Notion cohort |
| `tier` | Dropdown | Foundation / Mastery / Saga |
| `start_date` | Date | Experience start |
| `destination` | Single-line text | Location |

### 1.3 Deal Pipeline — Partner Outreach

**Pipeline name:** `Partner Pipeline`

| Stage | Description |
|-------|-------------|
| **Research** | Identified, not contacted |
| **Contacted** | First outreach sent |
| **Responded** | They replied |
| **Evaluation** | Assessing fit (instructor manifesto criteria) |
| **Negotiation** | Terms discussion |
| **Confirmed** | Partnership agreed |
| **Declined** | Not a fit |

### 1.4 Lifecycle Stages

Map HubSpot default lifecycle stages:

| Stage | ET Meaning |
|-------|------------|
| Subscriber | Signed up on website |
| Lead | Took quest, showed interest |
| MQL | Saved 2+ adventures or returned 3+ times |
| SQL | Booked discovery call |
| Opportunity | In active pipeline |
| Customer | Enrolled & paid |
| Evangelist | Completed + referred others |

### 1.5 Email Sequences

Migrate from Supabase Edge Functions to HubSpot sequences:

1. **Welcome** (immediate) — mirrors current `send-welcome-email`
2. **Day 3 Nurture** — mirrors current `send-followup-emails` Day 3
3. **Day 7 Nudge** — mirrors current `send-followup-emails` Day 7
4. **Day 14 Story** — NEW: share a student/experience story
5. **Day 30 Re-engage** — NEW: "Still dreaming about [matched adventure]?"

> **Note:** Keep Supabase Edge Functions running in parallel until HubSpot sequences are proven. Then deprecate.

---

## 2. Notion Operations Hub

### 2.1 Workspace Structure

Create one Notion workspace: **EducatedTraveler HQ**

```
EducatedTraveler HQ/
├── Dashboard          ← Home page with linked views
├── Experiences        ← Database: full product catalog
├── Cohorts            ← Database: scheduled cohort instances
├── Partners           ← Database: schools, instructors, venues
├── Content Calendar   ← Database: marketing content pipeline
├── Playbooks          ← Page: SOPs (migrated from os/playbooks/)
└── Meeting Notes      ← Database: auto-populated from Granola (optional)
```

### 2.2 Experiences Database

**Properties:**

| Property | Type | Notes |
|----------|------|-------|
| Name | Title | e.g. "Sushi Mastery — Tokyo" |
| Tier | Select | Foundation / Mastery / Saga |
| Duration | Text | e.g. "30 days" |
| Price | Number | USD |
| Destination | Select | Country |
| City | Text | |
| Certification Body | Select | PADI, RYA, Yoga Alliance, WSET, etc. |
| Certification Name | Text | e.g. "RYT-200" |
| Category | Multi-select | Culinary, Diving, Sailing, Yoga, Martial Arts, etc. |
| Elements | Multi-select | ocean, mountain, city, temple, wild |
| Cohort Size | Number | 8-12 |
| Status | Select | Draft, Ready, Active, Paused, Retired |
| Partner | Relation | → Partners database |
| XP Value | Number | |
| Included | Multi-select | Accommodation, meals, transport, gear, etc. |
| Description | Text | Short pitch |
| Curriculum | Text | Week-by-week breakdown |

Populate from `os/products.md` and `website/js/experiences.js`.

### 2.3 Cohorts Database

| Property | Type | Notes |
|----------|------|-------|
| Name | Title | e.g. "Tokyo Sushi — Oct 2026" |
| Experience | Relation | → Experiences |
| Start Date | Date | |
| End Date | Date | |
| Capacity | Number | 8-12 |
| Enrolled | Number | Current count |
| Status | Select | Planning, Open, Full, In Progress, Completed |
| Lead Instructor | Relation | → Partners |
| Location Details | Text | Venue, address |
| HubSpot Deal IDs | Text | Comma-separated for cross-reference |
| Notes | Text | |

### 2.4 Partners Database

Replaces `os/partners/outreach-tracker.md`:

| Property | Type | Notes |
|----------|------|-------|
| Name | Title | School or instructor name |
| Country | Select | |
| City | Text | |
| Category | Multi-select | Culinary, Diving, Sailing, etc. |
| Status | Select | Research, Contacted, Evaluating, Confirmed, Declined |
| Contact Name | Text | Primary contact person |
| Contact Email | Email | |
| Website | URL | |
| HubSpot Deal | Text | Link to partner pipeline deal |
| First Contact | Date | |
| Last Contact | Date | |
| Credentials | Text | Certifications they can issue |
| Evaluation | Text | Notes on fit per instructor manifesto |
| Experiences | Relation | → Experiences they're linked to |

Populate from `os/partners/outreach-tracker.md` (25 partners currently listed).

### 2.5 Content Calendar Database

| Property | Type |
|----------|------|
| Title | Title |
| Platform | Multi-select: Instagram, Website, Email, WhatsApp |
| Status | Select: Idea, Drafting, Ready, Published |
| Publish Date | Date |
| Experience | Relation → Experiences |
| Content Type | Select: Story, Reel, Post, Article, Email |
| Copy | Text |
| Assets | Files |

---

## 3. Granola → HubSpot (via Zapier)

> **Note:** Granola's native HubSpot integration requires Google Workspace or Microsoft 365 Pro. We bypass this with Zapier.

### 3.1 Setup in Granola

1. Open **Granola** → Settings → Integrations → **Zapier**
2. Click **Connect** → this gives Zapier access to your meeting notes

### 3.2 Zapier Zap: Meeting Notes → HubSpot

1. Go to **zapier.com** → Create Zap
2. **Trigger:** Granola → **New Meeting Note**
   - Connect your Granola account
   - Test trigger — it should pull a recent meeting
3. **Action 1:** HubSpot → **Search Contact** (by attendee email)
   - Search field: Email
   - Search value: `{{attendee_email}}` (from Granola trigger)
4. **Action 2:** Add a **Filter** (Zapier built-in)
   - Only continue if contact **was found** (so you don't create junk notes)
5. **Action 3:** HubSpot → **Create Engagement** (type: Note)
   - Associated Contact ID: `{{contact_id}}` from Action 1
   - Note Body:
     ```
     📝 Meeting: {{meeting_title}}
     📅 Date: {{meeting_date}}
     👥 Attendees: {{attendees}}

     ## Summary
     {{ai_summary}}

     ## Action Items
     {{action_items}}

     ## Full Notes
     {{meeting_notes}}
     ```
6. **Optional Action 4:** HubSpot → **Create Task** (for each action item)
   - Task name: `Follow up: {{meeting_title}}`
   - Due date: 2 days from now
   - Associated contact: `{{contact_id}}`
7. **Test** → **Publish**

### 3.3 Handling New Contacts (not yet in HubSpot)

Add a second path for when the contact search returns nothing:

1. In the same Zap, after the Filter, add a **Path** (Zapier Paths feature)
2. **Path A — Contact exists:** → Create Note (Action 3 above)
3. **Path B — Contact NOT found:**
   - HubSpot → **Create Contact** (email, name from Granola attendee)
   - HubSpot → **Create Engagement** (Note) on the new contact
   - `et_source` ← `meeting`

This way every meeting gets logged, whether they're already in your CRM or not.

### 3.4 What Happens After Setup

- You take a call in Granola (partner, student, anyone)
- Granola generates AI summary + action items automatically
- Zapier fires within minutes → logs everything to HubSpot contact timeline
- If the attendee is new → auto-creates a HubSpot contact tagged as source: `meeting`
- You never manually copy meeting notes into your CRM

> **Future upgrade:** When you get Google Workspace ($7/mo for `arnaud@educatedtraveler.app`), switch to Granola's native HubSpot integration for instant sync instead of Zapier's slight delay.

---

## 4. Zapier Automations

### 4.1 Supabase → HubSpot (New Signup)

**Trigger:** Supabase — New Row in `profiles` table
**Actions:**
1. **HubSpot — Create Contact**
   - Email ← `profiles.email`
   - Name ← `profiles.name`
   - `et_supabase_id` ← `profiles.id`
   - `et_xp` ← `profiles.xp`
   - Lifecycle Stage ← "Subscriber"
2. **HubSpot — Create Deal** (in Student Journey pipeline)
   - Deal name ← "[Name] — Website Lead"
   - Stage ← "Lead"
   - Associated contact ← created contact

### 4.2 Supabase → HubSpot (Quest Completed)

**Trigger:** Supabase — New Row in `user_preferences` table
**Actions:**
1. **HubSpot — Update Contact** (lookup by `et_supabase_id`)
   - `et_elements` ← `user_preferences.elements`
   - `et_desires` ← `user_preferences.desires`
   - `et_time_preference` ← `user_preferences.time_preference`
   - `et_intensity` ← `user_preferences.intensity`
   - Lifecycle Stage ← "Lead"

### 4.3 Supabase → HubSpot (Adventure Saved)

**Trigger:** Supabase — New Row in `saved_adventures` table
**Actions:**
1. **HubSpot — Update Contact**
   - Append `adventure_name` to `et_matched_adventures`
2. **Filter:** If contact has 2+ saved adventures → Update Lifecycle to "MQL"

### 4.4 HubSpot → Notion (Deal Stage Change)

**Trigger:** HubSpot — Deal stage changed to "Enrolled" (Student Journey)
**Actions:**
1. **Notion — Update Cohort** database item
   - Increment `Enrolled` count
   - Add HubSpot deal ID to `HubSpot Deal IDs`

### 4.5 HubSpot → Notion (Partner Confirmed)

**Trigger:** HubSpot — Deal stage changed to "Confirmed" (Partner Pipeline)
**Actions:**
1. **Notion — Update Partner** database item
   - Status ← "Confirmed"
   - Last Contact ← today

---

## 5. Setup Checklist

### Week 1: Foundation

- [ ] **HubSpot**
  - [ ] Create free account at hubspot.com (CRM is free)
  - [ ] Create custom property group "ET"
  - [ ] Create all 9 custom contact properties (Section 1.1)
  - [ ] Create "Student Journey" pipeline with 8 stages
  - [ ] Create "Partner Pipeline" with 7 stages
  - [ ] Create custom deal properties (Section 1.2)
  - [ ] Import existing Supabase contacts (export → CSV → HubSpot import)

- [ ] **Notion**
  - [ ] Create "EducatedTraveler HQ" workspace
  - [ ] Create Experiences database with all properties
  - [ ] Populate from products.md (start with 6 flagships)
  - [ ] Create Partners database with all properties
  - [ ] Import 25 partners from outreach-tracker.md
  - [ ] Create Cohorts database (empty for now)
  - [ ] Create Content Calendar database
  - [ ] Copy playbooks from os/playbooks/ as Notion pages

- [ ] **Granola → Zapier → HubSpot**
  - [ ] Connect Granola to Zapier (Granola → Settings → Integrations → Zapier)
  - [ ] Create Zap: Granola new meeting → HubSpot search contact → create note (see Section 3.2)
  - [ ] Add Path B for new contacts (see Section 3.3)
  - [ ] Test with a real meeting — verify note appears on HubSpot contact timeline

### Week 2: Automations

- [ ] **Zapier**
  - [ ] Create Zapier account (free tier: 100 tasks/month)
  - [ ] Set up Zap 4.1: Supabase new profile → HubSpot contact + deal
  - [ ] Set up Zap 4.2: Supabase quest completed → HubSpot contact update
  - [ ] Set up Zap 4.3: Supabase adventure saved → HubSpot update
  - [ ] Set up Zap 4.4: HubSpot enrolled → Notion cohort update
  - [ ] Set up Zap 4.5: HubSpot partner confirmed → Notion update
  - [ ] Test all zaps end-to-end with test data

### Week 3: Migration & Polish

- [ ] **Email sequence migration**
  - [ ] Recreate welcome + nurture emails in HubSpot Sequences
  - [ ] Add Day 14 and Day 30 emails (new)
  - [ ] Run both systems in parallel for 2 weeks
  - [ ] Deprecate Supabase Edge Functions for email once stable
- [ ] **Notion dashboard**
  - [ ] Create home page with linked views (open cohorts, hot leads, partner pipeline)
  - [ ] Share workspace with any collaborators

---

## 6. Cost Summary

| Tool | Plan | Cost | Notes |
|------|------|------|-------|
| HubSpot CRM | Free | $0 | Up to 1M contacts, 5 email templates, basic sequences |
| Notion | Free | $0 | Up to 10 guests, unlimited blocks for 1 user |
| Granola | Free / Pro | $0-10/mo | Free includes AI summaries, Pro adds CRM sync |
| Zapier | Free → Starter | $0-20/mo | Free: 100 tasks/mo, 5 zaps. Starter if you exceed. |
| **Total** | | **$0-30/mo** | Scale up only when volume justifies it |

---

## 7. What NOT to Move

Keep these where they are:

- **Supabase auth + profiles** — website still needs real-time auth, XP, badges
- **experiences.js** — hardcoded on website, Notion is the editing layer, not the runtime
- **Daemon / Agent docs** — these are AI operating instructions, not ops data
- **Design system / brand docs** — stay in `os/brand/`, Notion playbooks link to them

The goal: **Supabase runs the product. HubSpot runs the business. Notion runs operations.**
