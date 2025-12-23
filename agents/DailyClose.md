# Daily Close Agent

End each work session by saving progress and setting up tomorrow. Takes 5 minutes.

---

## The Ritual

```
1. SAVE   → Commit everything to GitHub
2. LOG    → Record what got done
3. QUEUE  → Set up what's next
```

That's it. No dashboards. No status meetings with yourself.

---

## 1. SAVE (GitHub)

### Before closing, run:

```bash
cd /Users/callierapca/Documents/ObsidianVault/educatedtraveler

# See what changed
git status

# Add everything
git add -A

# Commit with today's date and summary
git commit -m "$(date +%Y-%m-%d): [brief summary of what you worked on]"

# Push to remote
git push origin main
```

### Commit message format

Keep it simple:
```
2024-12-23: Added instructor outreach page and email templates
2024-12-24: Updated landing page copy, fixed form submission
2024-12-25: Created agent roadmaps for CEO, Marketing, Ops
```

One line. What you did. Done.

---

## 2. LOG (What Got Done)

After committing, update the changelog:

### File: `changelog/YYYY-MM-DD.md`

```markdown
# 2024-12-23

## Done
- Created instructor landing page (website/instructors.html)
- Wrote 5 email outreach templates
- Set up form submission guide

## Decisions Made
- Using Formspree for instructor applications (simpler than building backend)
- Softer tone for instructor outreach (community, not job posting)

## Blockers / Questions
- Need to create Formspree account and get form ID
- Should we add instructor page link to main landing page?

## Tomorrow
- Set up Formspree
- Begin instructor outreach (5 emails)
- Check survey responses
```

### Why this format works
- **Done**: Proof of progress. Morale fuel.
- **Decisions**: Context for future you. Why did we do it this way?
- **Blockers**: Things that need resolving. Don't let them fester.
- **Tomorrow**: Wake up knowing exactly where to start.

---

## 3. QUEUE (Linear Setup)

### Project Structure

Create one Linear project: **EducatedTraveler Pilot**

### Three Lists Only

| List | What Goes Here |
|------|----------------|
| **Now** | The 1-3 things you're actively working on today |
| **Next** | Queued up, ready to pull into Now |
| **Done** | Completed (auto-archive after 7 days) |

No backlog. No icebox. No "someday/maybe." If it's not Now or Next, it doesn't exist yet.

### Task Format

```
[Owner] Task description
```

Examples:
```
[CEO] Sign master instructor
[CEO] Complete 10 customer calls
[Marketing] Hit 50 survey responses
[Marketing] Create instructor intro video
[Ops] Research Bali venues (shortlist 5)
[Ops] Document 21-day schedule
```

### Labels (Optional, Keep Minimal)

| Label | Meaning |
|-------|---------|
| `blocked` | Waiting on something external |
| `priority` | Must happen this week |

That's it. Two labels max.

---

## Daily Close Checklist

Copy this and run through it:

```
□ Git status (see what changed)
□ Git add + commit + push
□ Update changelog/YYYY-MM-DD.md
□ Move completed Linear tasks to Done
□ Set 1-3 tasks in Now for tomorrow
□ Close laptop
```

---

## Weekly Review (Fridays, 15 min)

Once a week, zoom out:

```
1. Read this week's changelogs
2. Update the roadmap status (agents/*-Roadmap.md)
3. Archive done tasks in Linear
4. Identify the ONE most important thing for next week
5. Write it down and put it in Now
```

---

## The Anti-Patterns

**Don't do these:**

- Don't create tasks for everything. If it takes 5 minutes, just do it.
- Don't track time. Track outcomes.
- Don't have more than 5 items in "Next". Prioritize ruthlessly.
- Don't skip the changelog. Future you will thank present you.
- Don't commit "WIP" or "updates". Say what you actually did.

---

## Quick Commands

Save these somewhere handy:

```bash
# Quick commit with today's date
alias gitday='git add -A && git commit -m "$(date +%Y-%m-%d): $1"'

# Usage: gitday "Added instructor page"

# Quick status
alias gs='git status'

# Quick push
alias gp='git push origin main'
```

Or just copy-paste this each time:

```bash
git add -A && git commit -m "$(date +%Y-%m-%d): [what you did]" && git push origin main
```

---

## Linear Setup (One-Time)

1. Go to **linear.app** and create account
2. Create workspace: **EducatedTraveler**
3. Create project: **Pilot**
4. Create three statuses: **Now**, **Next**, **Done**
5. Turn OFF: Sprints, Cycles, Estimates, Sub-issues
6. Keep it minimal

### Initial Tasks to Add

Based on the roadmaps, start with these:

**CEO:**
- [ ] Sign master instructor
- [ ] Complete 10 customer conversations
- [ ] Secure 8 paid deposits

**Marketing:**
- [ ] Hit 100 survey responses
- [ ] Build 50 waitlist signups
- [ ] Create instructor intro video

**Operations:**
- [ ] Secure Bali venue
- [ ] Document complete 21-day schedule
- [ ] Establish vendor relationships

---

## Today's Close

Since we worked on the project today, here's your commit:

```bash
cd /Users/callierapca/Documents/ObsidianVault/educatedtraveler

git add -A

git commit -m "$(date +%Y-%m-%d): Added instructor outreach (landing page, emails), agent roadmaps, daily close workflow"

git push origin main
```

And create `changelog/2024-12-23.md` with what we accomplished.

---

## First Principles

1. **Ship daily.** Uncommitted code doesn't exist.
2. **One source of truth.** GitHub for files. Linear for tasks.
3. **Write for future you.** Changelogs and decisions matter.
4. **Less is more.** Three tasks in Now beats thirty in Backlog.
5. **End clean, start fast.** Tomorrow's you will thank today's you.

---

*"Progress compounds. Track it. Ship it. Move on."*
