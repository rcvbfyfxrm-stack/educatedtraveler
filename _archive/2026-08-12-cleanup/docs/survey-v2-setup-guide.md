# Survey v2 — Typeform & Google Forms Setup Guide

Copy-paste ready. All 15 questions with exact options.

---

## Typeform Setup

### Settings
- **Theme:** Dark background (#000000), white text, Inter font
- **Cover photo:** Use `sailing-freedom.jpg`
- **Progress bar:** Enabled
- **Welcome screen:**
  - Title: "Help us build what you actually want."
  - Subtitle: "We're designing certified skill immersions — diving, sailing, culinary, yoga — at the source. Before we build, we want to hear from you."
  - Button: "Start Survey"
  - Description: "15 questions — 3 minutes"

### Questions

**Photo break images** (add as Statement screens between sections):
- Before Q5: `freedive-cenote.png` — Statement: "What pulls you?"
- Before Q8: `kitchen-flames.png` — Statement: "Let's talk money."
- Before Q11: `yoga-sunrise.jpg` — Statement: "Almost there."
- Before Q14: `mountains-snow.png` — Statement: "Last two."

---

#### Q1 — Multiple Choice (required)
**Question:** What best describes where you are in life right now?
- Employed and successful, but craving something real and physical
- Already working in a craft (chef, instructor, guide) — ready to level up
- Switching careers or between jobs — exploring what's next
- Deeply into a hobby — ready to get serious about it
- On sabbatical or taking extended time off
- None of these — just curious

#### Q2 — Multiple Choice (required) + conditional text field
**Question:** Is there a skill you've been wanting to learn seriously — not from YouTube, but hands-on with a real expert?
- Yes, I know exactly what → [Show text field: "What skill?"]
- Yes, but I'm not sure what yet
- Not really

#### Q3 — Multiple Choice (required)
**Question:** Age range
- 18-24
- 25-29
- 30-34
- 35-39
- 40-49
- 50+

#### Q4 — Multiple Choice (required)
**Question:** Where are you based?
- Europe
- United Kingdom
- North America
- Africa
- Asia-Pacific
- Nomadic / Other

#### Q5 — Multiple Choice (required, max 2 selections)
**Question:** If you could spend 1-3 weeks somewhere learning a skill from a master — and leave with a real certification — which would you pick? (Select up to 2)
- Diving — PADI certification (Thailand or Indonesia)
- Sailing — RYA certification (Greece or Gibraltar)
- Yoga teacher training — RYT-200 (Rishikesh, India)
- Wine — WSET certification (Burgundy, France)
- Culinary / Sushi mastery (Tokyo, Japan)
- Surf coaching (Bali or Costa Rica)
- Spanish immersion (Costa Rica)
- Photography (Iceland)
- Something else → [Show text field: "What would you want?"]

#### Q6 — Multiple Choice (required)
**Question:** How long could you realistically take off for something like this?
- 1 week
- 2 weeks
- 3 weeks
- 1 month
- 2-3 months
- I'd make it work for the right program

#### Q7 — Multiple Choice (required)
**Question:** Would you go alone?
- I'd go solo — that's part of the adventure
- I'd want to bring a friend or partner
- Depends on the group / community aspect

#### Q8 — Multiple Choice (required)
**Question:** For a 2-week certified experience (instruction, accommodation, certification fees included — meals not included), what would feel fair?
- Under $2,000
- $2,000 – $3,500
- $3,500 – $5,000
- $5,000 – $7,000
- Price matters less than quality

#### Q9 — Multiple Choice (required)
**Question:** If we launched a program you loved in the next 6 months, how likely are you to actually book?
- I'd put down a deposit now (fully refundable, of course)
- Very likely, if the dates work
- Possible, but not sure yet
- Unlikely — just exploring for now

#### Q10 — Multiple Choice (required) + conditional text field
**Question:** What's the #1 thing that would stop you from booking? (Pick only one — your biggest blocker)
- Price
- Can't get enough time off work
- Don't know anyone going
- Not sure it's worth it vs. doing it myself
- Safety / trust — it's a new company
- Something else → [Show text field: "What's holding you back?"]

#### Q11 — Multiple Choice (required)
**Question:** How did you hear about EducatedTraveler?
- Friend / word of mouth
- Instagram
- Google search
- Other

#### Q12 — Multiple Choice (required)
**Question:** How important is it that the group is small (8-12 people max)?
- Essential — it's a dealbreaker
- Nice to have
- Don't care

#### Q13 — Multiple Choice (required, max 2 selections)
**Question:** What would make you trust us enough to book? (Select up to 2)
- Video testimonials from past participants
- Money-back guarantee
- Talking to someone who's done it
- Strong instructor profiles
- Recognized certification body (PADI, RYA, Yoga Alliance...)
- Payment plan option

#### Q14 — Multiple Choice (required) + conditional email field
**Question:** Want early access when we launch?
- Yes — I want first dibs → [Show email field]
- No thanks, just sharing my thoughts

#### Q15 — Long Text (optional)
**Question:** Anything else you want to tell us?
**Description:** Programs we're missing, concerns, ideas — all welcome.

### Ending Screen
- Title: "You're in."
- Subtitle: "Your answers go straight into shaping what we build. If you left your email, you'll hear from us before anyone else."
- Button: "Back to EducatedTraveler" → https://educatedtraveler.app

---

## Google Forms Setup

### Settings
- **Theme:** Dark (custom header image: `sailing-freedom.jpg`)
- **Collect email addresses:** Optional (Q14 handles this)
- **Show progress bar:** Yes
- **Shuffle question order:** No
- **Limit to 1 response:** No (allow re-edits)

### Sections (use page breaks)

**Section 1: Who are you?**
Description: "So we can build the right thing for the right people."
→ Q1, Q2, Q3, Q4

**Section 2: What do you actually want?**
Description: "No marketing fluff — just tell us what pulls you."
→ Q5, Q6, Q7

**Section 3: Money and commitment**
Description: "Honest answers help us price this right."
→ Q8, Q9, Q10

**Section 4: How we reach you**
Description: "So we know where to show up."
→ Q11, Q12, Q13

**Section 5: Stay in touch**
Description: "Almost done. Last two."
→ Q14, Q15

### Questions
(Same text and options as Typeform above)

**Notes for Google Forms:**
- Q5 and Q13: Use "Checkbox" type with data validation → "Select at most 2"
- Q2, Q10, Q14: Use "Go to section based on answer" for conditional fields, OR add the text field as a separate optional question right after
- Q15: Use "Paragraph" type
- Add section header images using the project photos (upload from `website/images/story/`)

### Confirmation message
"You're in. Your answers shape what we build. If you left your email, you'll hear from us before anyone else."
