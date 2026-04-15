# Instructor Index

Master registry of all EducatedTraveler partner instructors. Each instructor has their own file with full details.

## Active Instructors

| Name | Discipline | Location | Status | Showcase Page | File |
|------|-----------|----------|--------|---------------|------|
| Hiroko Ishii | Sushi / Japanese Cuisine | Tokyo, Japan | Approved | `/sushi-mastery` | [hiroko-ishii.md](hiroko-ishii.md) |
| Martin Lippo | Modernist Cuisine | Barcelona, Spain | Confirmed | `/modernist-barcelona` | [martin-lippo.md](martin-lippo.md) |

## Pipeline

| Name | Discipline | Location | Status | Notes |
|------|-----------|----------|--------|-------|
| — | — | — | — | Scouting in progress |

## How to Add a New Instructor

1. Create a file in this directory: `firstname-lastname.md` using the template below
2. Pre-create their instructor record via Admin (`/admin` → Instructors → Prepare an Instructor)
3. Build their showcase page in `website/` (use `sushi-mastery.html` as template)
4. Add Netlify redirect in `netlify.toml`
5. Send them the page link with `?instructor` to claim their profile
6. Update Notion Experiences and Partners databases
7. Update this INDEX

## Instructor File Template

```markdown
# [Full Name]

## Identity
- **Discipline:** 
- **Location:** 
- **Email:** 
- **Status:** Approved / Pending / Pipeline
- **Showcase page:** /[slug]
- **Supabase instructor_id:** 

## Background
[Bio paragraph]

## Credentials
- [List certifications, training, notable experience]

## Teaching Approach
[How they teach, philosophy, style]

## Program
- **Name:** 
- **Duration:** 
- **Levels:** 
- **Max students:** 
- **Pricing:** 
- **Dates:** 

## Cohorts
| Level | Dates | Capacity | Enrolled | Status |
|-------|-------|----------|----------|--------|

## Contact
- **Instructor email:** 
- **Academy:** 
- **Instagram:** 

## Notes
[Anything relevant — how we found them, relationship status, special requirements]
```
