# Notion Pipeline Setup for EducatedTraveler

Set up 3 linked databases in Notion to manage your entire operation.

---

## Database 1: Instructors Pipeline

| Property | Type | Options |
|---|---|---|
| Name | Title | — |
| Email | Email | — |
| Status | Select | `Lead`, `Applied`, `Call Scheduled`, `Call Done`, `Approved`, `Active`, `Paused`, `Rejected` |
| Discipline | Select | `Sailing`, `Diving`, `Culinary`, `Yoga`, `Adventure`, `Creative`, `Other` |
| Location | Text | — |
| Website / IG | URL | — |
| Experience (years) | Number | — |
| Credentials | Text | — |
| Preferred Locations | Multi-select | `Japan`, `India`, `Gibraltar`, `France`, `Thailand`, `Morocco`, `Switzerland`, `Bali` |
| Availability | Select | `Q1`, `Q2`, `Q3`, `Q4`, `Flexible` |
| Notes | Text | Your notes from calls, impressions |
| Cal.com Call | Date | When intro call is scheduled |
| Source | Select | `Website Form`, `Cal.com`, `Email`, `WhatsApp`, `Referral` |
| Cohorts | Relation | → Links to Cohorts database |
| Created | Created time | Auto |

**Views to create:**
- **Pipeline** (Board view): Group by Status
- **All Instructors** (Table view): Filter Status = `Approved` or `Active`
- **Pending Review** (Table view): Filter Status = `Applied`

---

## Database 2: Students Pipeline

| Property | Type | Options |
|---|---|---|
| Name | Title | — |
| Email | Email | — |
| Status | Select | `Signed Up`, `Quest Done`, `Enrolled`, `Approved`, `Active`, `Completed`, `Cancelled` |
| Role | Select | `Student`, `Instructor` |
| Quest Elements | Multi-select | `Ocean`, `Mountain`, `City`, `Temple`, `Wild` |
| Quest Desires | Multi-select | `Certification`, `Career`, `Stories`, `Reset`, `Rare` |
| Time Preference | Select | `Foundation (7-21d)`, `Mastery (1-2mo)`, `Saga (3-6mo)` |
| Intensity | Select | `1 - Soft Landing`, `2 - Bring It On`, `3 - Full Send` |
| Enrolled Cohort | Relation | → Links to Cohorts database |
| Phone | Phone | — |
| WhatsApp Opt-in | Checkbox | — |
| Source | Select | `Join Page`, `Quest`, `Community`, `Referral` |
| Notes | Text | — |
| Signed Up | Date | — |
| Last Contact | Date | — |

**Views to create:**
- **Pipeline** (Board view): Group by Status
- **Pending Approval** (Table view): Filter Status = `Enrolled`
- **Active Students** (Table view): Filter Status = `Approved` or `Active`
- **By Cohort** (Table view): Group by Enrolled Cohort

---

## Database 3: Cohorts Tracker

| Property | Type | Options |
|---|---|---|
| Title | Title | e.g., "RYA Day Skipper — Gibraltar Sep 2026" |
| Status | Select | `Planning`, `Published`, `Enrolling`, `Full`, `In Progress`, `Completed`, `Cancelled` |
| Instructor | Relation | → Links to Instructors database |
| Students | Relation | → Links to Students database |
| Discipline | Select | Same as Instructors |
| Location | Text | — |
| Start Date | Date | — |
| End Date | Date | — |
| Capacity | Number | Default: 10 |
| Enrolled Count | Rollup | Count of Students relation |
| Spots Left | Formula | `Capacity - Enrolled Count` |
| Price (USD) | Number | — |
| Revenue (est.) | Formula | `Price × Enrolled Count` |
| Instructor Fee | Number | — |
| Margin (est.) | Formula | `Revenue - Instructor Fee` |
| Notes | Text | Logistics, venue, meals, etc. |
| Created | Created time | Auto |

**Views to create:**
- **Timeline** (Timeline view): By Start Date → End Date
- **Active** (Board view): Group by Status
- **Financials** (Table view): Show Price, Revenue, Fee, Margin columns
- **By Instructor** (Table view): Group by Instructor

---

## How to link them

1. Create all 3 databases
2. In **Cohorts**, add a Relation to **Instructors** (one instructor per cohort)
3. In **Cohorts**, add a Relation to **Students** (many students per cohort)
4. In **Instructors**, the reverse relation to Cohorts auto-appears
5. In **Students**, the reverse relation to Cohorts auto-appears

---

## Daily workflow

1. Check **Instructors Pipeline** board → move new applications through stages
2. Check **Students Pending Approval** → review and approve enrollments
3. Check **Cohorts Active** → monitor enrollment counts and spots left
4. Update **Notes** after any call or WhatsApp conversation

---

## Sync with Supabase (manual for now)

When you approve a student in Notion:
1. Go to Supabase → Table Editor → `enrollments`
2. Find the enrollment, change status from `pending` to `approved`

When you approve an instructor in Notion:
1. Go to Supabase → Table Editor → `instructors`
2. Change status from `pending` to `approved`

This manual sync works fine until you have 50+ students. Then consider Notion API automation.
