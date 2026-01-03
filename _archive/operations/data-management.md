# Data Management System

*One source of truth. Zero chaos.*

---

## The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE SHEETS HUB                           │
│  (Free, familiar, real-time, shareable, forms-integrated)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PARTNERS    │  │   ALUMNI     │  │  PROSPECTS   │          │
│  │  (Tab 1)     │  │   (Tab 2)    │  │   (Tab 3)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  COHORTS     │  │  FEEDBACK    │  │  OUTREACH    │          │
│  │  (Tab 4)     │  │   (Tab 5)    │  │   (Tab 6)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    Google Forms          Google Forms          Google Forms
    (Instructor          (Post-Trip            (Waitlist
     Interest)            Survey)               Signup)
```

---

## Why Google Sheets?

| Need | Google Sheets Solution |
|------|------------------------|
| Free | Yes, forever |
| Forms integration | Automatic — responses go straight to sheets |
| Collaboration | Share with team, real-time editing |
| Mobile access | Google Sheets app |
| Automation | Zapier, Make, Apps Script |
| Export | CSV, Excel, PDF anytime |
| Backup | Auto-saved, version history |
| Scales to CRM | Easy migration to Airtable/HubSpot later |

---

## Sheet 1: Partners & Instructors

### Columns

| Column | Type | Notes |
|--------|------|-------|
| ID | Auto | `P001`, `P002`, etc. |
| Name | Text | Full name |
| Email | Email | Primary contact |
| Phone | Text | With country code |
| Discipline | Dropdown | Sailing, Yoga, Culinary, etc. |
| Specialty | Text | "RYA Yachtmaster", "Edomae sushi" |
| Location | Text | City, Country |
| Destinations | Multi-select | Where they can teach |
| Certifications | Text | Their credentials |
| Source | Dropdown | How we found them |
| First Contact | Date | When we reached out |
| Status | Dropdown | Lead → Contacted → Interested → Negotiating → Partner → Inactive |
| Last Contact | Date | Most recent touchpoint |
| Next Action | Text | What's the next step? |
| Notes | Long text | Meeting notes, observations |
| Portfolio URL | URL | Their work |
| Social | URL | Instagram/LinkedIn |
| Rate Expectation | Currency | What they expect to earn |
| Availability | Text | Peak seasons, blackout dates |

### Status Pipeline

```
Lead → Contacted → Replied → Call Scheduled → Call Done →
Proposal Sent → Negotiating → Partner Signed → Active
```

---

## Sheet 2: Alumni

### Columns

| Column | Type | Notes |
|--------|------|-------|
| ID | Auto | `A001`, `A002`, etc. |
| Name | Text | Full name |
| Email | Email | |
| Phone | Text | |
| Program | Dropdown | Which flagship/adventure |
| Cohort | Text | "Tokyo March 2026" |
| Dates | Date range | Trip dates |
| Instructor | Link | Partner ID |
| Status | Dropdown | Completed, Withdrew, Deferred |
| Certification | Text | What they earned |
| NPS Score | Number | 0-10 |
| Testimonial | Long text | Quotable feedback |
| Photo Permission | Checkbox | Can we use their photos? |
| Referrals | Number | How many people they've referred |
| Repeat Interest | Dropdown | Which other programs interest them |
| Social Handle | Text | For tagging |
| Notes | Long text | |

---

## Sheet 3: Prospects (Waitlist)

### Columns

| Column | Type | Notes |
|--------|------|-------|
| ID | Auto | `W001`, `W002`, etc. |
| Timestamp | Auto | From form submission |
| Name | Text | |
| Email | Email | |
| Location | Text | City, Country |
| Programs Interested | Multi-select | From survey |
| Timeframe | Dropdown | When they want to go |
| Budget Range | Dropdown | |
| How Found Us | Dropdown | |
| Survey Completed | Checkbox | Did they do full survey? |
| Email Sequence | Dropdown | Which nurture sequence |
| Last Email | Date | |
| Opened | Number | Email open count |
| Clicked | Number | Link click count |
| Status | Dropdown | Cold → Warm → Hot → Booked → Lost |
| Notes | Long text | |

---

## Sheet 4: Cohorts

### Columns

| Column | Type | Notes |
|--------|------|-------|
| ID | Auto | `C001`, etc. |
| Program | Dropdown | Which flagship |
| Start Date | Date | |
| End Date | Date | |
| Location | Text | |
| Instructor | Link | Partner ID |
| Capacity | Number | Max participants |
| Enrolled | Number | Current count |
| Status | Dropdown | Planning → Open → Full → In Progress → Completed → Cancelled |
| Revenue | Currency | Total collected |
| Costs | Currency | Partner fees, logistics |
| Margin | Formula | Revenue - Costs |
| Avg NPS | Formula | From alumni feedback |
| Notes | Long text | |

---

## Sheet 5: Feedback

### Columns

| Column | Type | Notes |
|--------|------|-------|
| Timestamp | Auto | |
| Alumni ID | Link | |
| Cohort ID | Link | |
| NPS | Number | 0-10 |
| Would Recommend | Dropdown | Definitely, Probably, Maybe, No |
| Instructor Rating | Number | 1-5 |
| Logistics Rating | Number | 1-5 |
| Accommodation Rating | Number | 1-5 |
| Value Rating | Number | 1-5 |
| Highlight | Long text | Best part? |
| Improve | Long text | What could be better? |
| Testimonial | Long text | Quotable |
| Photo Permission | Checkbox | |
| Video Permission | Checkbox | |
| Follow-up Requested | Checkbox | Want to discuss? |

---

## Sheet 6: Outreach Tracking

### Columns

| Column | Type | Notes |
|--------|------|-------|
| ID | Auto | |
| Partner ID | Link | |
| Date | Date | |
| Channel | Dropdown | Email, LinkedIn, Instagram, Phone, In-person |
| Template Used | Text | Which email template |
| Subject Line | Text | |
| Status | Dropdown | Sent → Opened → Replied → Bounced |
| Response | Long text | What they said |
| Next Step | Text | |
| Owner | Text | Who sent it |

---

## Google Forms Setup

### Form 1: Instructor Interest
**Linked to**: `instructors.html`
**Sends to**: Partners sheet

Fields:
- Name*
- Email*
- Discipline (dropdown)
- Years teaching
- Current location
- Destinations interested in (checkboxes)
- Certifications held
- Why interested (long text)
- Portfolio/website URL
- Best way to contact

### Form 2: Waitlist Signup
**Linked to**: Main CTA
**Sends to**: Prospects sheet

Fields:
- Name*
- Email*
- Location
- Programs interested in (checkboxes)
- When looking to travel (dropdown)
- How did you hear about us?

### Form 3: Post-Trip Survey
**Sent to**: Alumni after completion
**Sends to**: Feedback sheet

Fields:
- NPS (0-10 scale)
- Ratings (1-5 scales)
- Open-ended feedback
- Testimonial permission
- Photo/video permission

---

## Automation Ideas (Phase 2)

### With Zapier/Make (free tiers available):

1. **New Prospect → Welcome Email**
   - Trigger: New row in Prospects
   - Action: Send welcome email via Gmail/Mailchimp

2. **Instructor Signup → Slack Notification**
   - Trigger: New row in Partners
   - Action: Post to #partnerships Slack channel

3. **NPS < 7 → Alert Founder**
   - Trigger: New feedback with NPS < 7
   - Action: Send urgent email to founder

4. **Cohort Full → Close Signups**
   - Trigger: Enrolled = Capacity
   - Action: Update status, notify waitlist

---

## Folder Structure in Obsidian

Keep qualitative notes in Obsidian, quantitative data in Sheets:

```
operations/
├── data-management.md      ← You are here
├── partners/
│   ├── partner-notes/      ← Individual partner meeting notes
│   │   ├── yamamoto-sensei.md
│   │   └── captain-silva.md
│   └── partner-contracts/  ← Signed agreements (PDFs)
├── alumni/
│   ├── testimonials/       ← Curated quotes for marketing
│   └── case-studies/       ← Detailed transformation stories
└── cohorts/
    ├── tokyo-march-2026/   ← Cohort-specific planning
    └── india-april-2026/
```

---

## Getting Started (15 minutes)

### Step 1: Create Master Sheet
1. Go to sheets.google.com
2. Create new spreadsheet: "EducatedTraveler Master Data"
3. Create tabs: Partners, Alumni, Prospects, Cohorts, Feedback, Outreach
4. Copy column headers from above

### Step 2: Connect Instructor Form
1. Go to forms.google.com
2. Create form matching instructor interest fields
3. Click "Responses" → Sheets icon → Select existing spreadsheet
4. Choose "Partners" tab

### Step 3: Connect Waitlist Form
1. Your existing survey already goes to a sheet
2. Consider splitting: Quick waitlist + Full survey
3. Link both to Prospects tab

### Step 4: Update Website Forms
1. Replace `instructors.html` form action with Google Form embed
2. Or use Formspree → Zapier → Sheets

---

## When to Upgrade

**Stay with Google Sheets if:**
- < 500 contacts
- < 5 team members
- Simple pipeline needs

**Consider Airtable if:**
- Need relational views (link partners ↔ cohorts ↔ alumni)
- Want Kanban boards for pipeline
- Need more complex automations

**Consider HubSpot/Pipedrive if:**
- > 1000 contacts
- Need email marketing built-in
- Multiple salespeople
- Complex reporting needs

---

## Security Notes

- Share sheet with specific emails, not "anyone with link"
- Use separate sheets for sensitive data (contracts, payments)
- Regular exports/backups to Google Drive folder
- Consider Google Workspace for business email + enhanced security

---

*Simple systems scale. Complex systems collapse.*

*Start with Sheets. Graduate when you must.*
