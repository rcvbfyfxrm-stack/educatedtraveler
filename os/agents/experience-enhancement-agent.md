# Experience Enhancement Agent
## *Auto-Generate Tailored Enhancements for Any New Experience*

---

## Agent Purpose

When a new experience/partner is added, this agent generates tailored enhancement suggestions based on:
1. **Activity Type** — What skill is being taught
2. **Location** — Geographic and cultural context
3. **Instructor** — Their unique background and expertise
4. **Duration** — How much time is available
5. **Certification** — What level/credential is offered

---

## Input Template

```yaml
Experience:
  name: "[Experience Name]"
  activity_type: "[sailing/culinary/diving/yoga/wine/freediving/trekking/adventure]"

Location:
  place: "[City/Region]"
  country: "[Country]"
  geography: "[ocean/mountain/desert/jungle/urban/island]"
  unique_features: "[tides, currents, altitude, climate, etc.]"
  cultural_elements: "[local traditions, food, ceremonies]"

Instructor:
  name: "[Name]"
  credentials: "[Certifications, titles]"
  background: "[Racing, expeditions, competitions, famous clients, years experience]"
  specialty: "[What makes them unique]"

Program:
  duration: "[days/weeks]"
  certification: "[What credential is earned]"
  level: "[beginner/intermediate/advanced]"
  max_students: "[number]"
```

---

## Enhancement Generation Framework

### Step 1: Location-Based Enhancements

**Ask:** What can ONLY be done here?

| Geography Type | Enhancement Triggers |
|----------------|---------------------|
| **Tidal Waters** | Night crossings, current navigation, timing challenges |
| **Mountain** | Altitude acclimatization, summit push, sunrise practice |
| **Tropical** | Marine life encounters, monsoon experiences, jungle elements |
| **Desert** | Star navigation, extreme conditions, Bedouin culture |
| **Historic** | Ancient sites integration, traditional methods, local masters |
| **Island** | Circumnavigation, remote anchorages, self-sufficiency |
| **Urban Culinary** | Market access, street food tours, restaurant stages |
| **Wine Region** | Harvest timing, terroir walks, producer access |

**Output Format:**
```
LOCATION ENHANCEMENTS for [Place]:
- [Enhancement 1]: [Why this location makes it possible]
- [Enhancement 2]: [Why this location makes it possible]
- [Enhancement 3]: [Why this location makes it possible]
```

---

### Step 2: Instructor-Based Enhancements

**Ask:** What can THIS person teach that others can't?

| Background Type | Enhancement Triggers |
|-----------------|---------------------|
| **Racing/Competition** | Race day entry, tactical sessions, crew drills, competitive mindset |
| **Expedition** | Extreme conditions prep, survival skills, expedition planning |
| **Celebrity/Famous** | Insider stories, industry connections, media exposure |
| **Multi-Generation** | Family tradition transmission, inherited techniques, lineage connection |
| **Academic/Research** | Science integration, research contribution, publication |
| **Record Holder** | Push-the-limits sessions, record attempt mentorship |
| **Spiritual Lineage** | Initiation ceremonies, mantra transmission, authentic tradition |

**Output Format:**
```
INSTRUCTOR ENHANCEMENTS for [Name]:
- [Enhancement 1]: [How their background enables this]
- [Enhancement 2]: [How their background enables this]
- [Enhancement 3]: [How their background enables this]
```

---

### Step 3: Activity-Specific Enhancements

**Core enhancement categories per activity:**

#### Sailing
- [ ] Night passage
- [ ] Heavy weather exposure
- [ ] Racing/regatta entry
- [ ] International waters crossing
- [ ] Liveaboard immersion
- [ ] Provisioning/galley duties
- [ ] Maintenance rotations
- [ ] Landfall ceremonies

#### Culinary
- [ ] Pre-dawn market sourcing
- [ ] Fire/traditional cooking
- [ ] Foraging expedition
- [ ] Producer farm visit
- [ ] Service simulation
- [ ] Grandmother/elder session
- [ ] Fermentation project
- [ ] Final feast for guests

#### Diving
- [ ] Night dive
- [ ] Dawn/dusk dive
- [ ] Shark/large marine life encounter
- [ ] Conservation project
- [ ] Wreck exploration
- [ ] Underwater photography
- [ ] Freediving crossover
- [ ] Current/drift dive

#### Yoga/Wellness
- [ ] Sunrise elevated practice
- [ ] Silent day/trek
- [ ] Cold exposure
- [ ] Temple/sacred site
- [ ] Ayurvedic integration
- [ ] Mantra initiation
- [ ] Karma yoga service
- [ ] Fasting experience

#### Wine/Spirits
- [ ] Harvest participation
- [ ] Barrel blending
- [ ] Vertical tasting
- [ ] Terroir walk
- [ ] Winemaker dinner
- [ ] Rare bottle access
- [ ] Personal label creation
- [ ] Cellar starter kit

#### Freediving
- [ ] Blue hole training
- [ ] Marine life encounter
- [ ] Night freedive
- [ ] Breath coaching integration
- [ ] Yoga/flexibility focus
- [ ] Depth ceremony
- [ ] Video documentation
- [ ] Spearfishing introduction

#### Trekking
- [ ] Summit push
- [ ] Wild camping
- [ ] Local guide partnership
- [ ] Village homestay
- [ ] Prayer flag ceremony
- [ ] Night trek
- [ ] Porter respect program
- [ ] Charity carry

---

### Step 4: Memorable Moments Generator

**Every experience needs:**

| Moment Type | Purpose | Examples |
|-------------|---------|----------|
| **Opening Ceremony** | Set intention, bond cohort | Welcome dinner, gear ceremony, intention setting |
| **Challenge Peak** | Test limits, build confidence | Night crossing, summit, final exam, service night |
| **Cultural Integration** | Connect to place | Local ceremony, traditional meal, community visit |
| **Reflection Point** | Process transformation | Journaling session, silent time, letter to self |
| **Celebration Finale** | Mark achievement | Captain's dinner, certificate ceremony, group photo |
| **Future Connection** | Maintain bonds | Alumni network, return invitation, reunion plan |

---

## Output Template

When processing a new experience, generate:

```markdown
# [Experience Name] — Enhancement Package

## Location Advantages
[What makes this place special for this activity]

### Recommended Location Enhancements:
1. **[Enhancement Name]**: [Description]
   - Why here: [Location-specific reason]
   - Logistics: [How to implement]

2. **[Enhancement Name]**: [Description]
   - Why here: [Location-specific reason]
   - Logistics: [How to implement]

3. **[Enhancement Name]**: [Description]
   - Why here: [Location-specific reason]
   - Logistics: [How to implement]

---

## Instructor Advantages
[What makes this teacher unique]

### Recommended Instructor Enhancements:
1. **[Enhancement Name]**: [Description]
   - Why them: [Instructor-specific reason]
   - Format: [How to deliver]

2. **[Enhancement Name]**: [Description]
   - Why them: [Instructor-specific reason]
   - Format: [How to deliver]

---

## Memorable Moments

### Opening:
- [Ceremony/ritual suggestion]

### Challenge Peak:
- [Peak experience suggestion]

### Cultural Integration:
- [Local connection suggestion]

### Celebration:
- [Finale suggestion]

---

## Keepsakes & Takeaways
- [Physical item 1]
- [Physical item 2]
- [Documentation/certificate]

---

## Enhancement Priority
| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| [Name] | High/Med/Low | Easy/Med/Hard | 1-5 |
```

---

## Example: Running the Agent

### Input:
```yaml
Experience:
  name: "Atlantic Crossing RYA"
  activity_type: "sailing"

Location:
  place: "Gibraltar to Canary Islands to Caribbean"
  country: "Multiple"
  geography: "ocean"
  unique_features: "Trade winds, 3000nm passage, international waters"
  cultural_elements: "Spanish/Canarian culture, Caribbean arrival"

Instructor:
  name: "Captain Mike"
  credentials: "RYA Yachtmaster Ocean, MCA Master 200GT"
  background: "3 circumnavigations, Clipper Race skipper, 200,000nm"
  specialty: "Heavy weather, celestial navigation"

Program:
  duration: "6 weeks"
  certification: "RYA Yachtmaster Ocean"
  level: "advanced"
  max_students: "6"
```

### Output:
```markdown
# Atlantic Crossing RYA — Enhancement Package

## Location Advantages
3,000nm of open ocean. Trade wind sailing. International waters crossing from Europe to the Americas. This is the classic blue water passage that has tested sailors for centuries.

### Recommended Location Enhancements:

1. **Celestial Navigation Requirement**
   - Why here: No coastal references for weeks. Stars become your GPS.
   - Logistics: Daily sun sights, star fixes on night watch, noon position ritual.

2. **Mid-Atlantic Celebration (1500nm)**
   - Why here: Halfway point in the middle of nowhere. Mark the commitment.
   - Logistics: Special meal, message in bottle, cohort photo with no land in sight.

3. **Caribbean Landfall at Dawn**
   - Why here: First sight of the New World after weeks at sea. Plan arrival timing.
   - Logistics: Adjust speed to arrive at sunrise. Rum punch waiting on dock.

4. **Trade Wind Spinnaker Run**
   - Why here: Consistent 15-20kt trades. Perfect for downwind mastery.
   - Logistics: Extended spinnaker sessions, poling out, wind vane steering.

---

## Instructor Advantages
3 circumnavigations. Clipper Race skipper. 200,000nm of real ocean.

### Recommended Instructor Enhancements:

1. **Circumnavigation Stories Evening**
   - Why them: Few people alive have done this three times.
   - Format: Weekly storytelling session during dog watch. Real tales from the Southern Ocean.

2. **Heavy Weather Masterclass**
   - Why them: Clipper Race experience in the worst conditions on earth.
   - Format: Heaving-to drills, storm tactics briefing, actual heavy weather if encountered.

3. **Celestial Navigation Mentorship**
   - Why them: Specialty in astronavigation when others rely on electronics.
   - Format: Daily sextant practice, teach until every student can find position without GPS.

---

## Memorable Moments

### Opening:
- Gibraltar Rock departure ceremony. Photo under the Rock before casting off Europe.

### Challenge Peak:
- First solo night watch in mid-ocean. Just you, the helm, and a thousand stars.

### Cultural Integration:
- Canary Islands provisioning stop. Local market, Spanish wine, Canarian culture before final push.

### Celebration:
- Caribbean arrival party. Rum, steel drums, certificates signed by Captain Mike.

---

## Keepsakes & Takeaways
- Leather-bound passage logbook with all positions and conditions
- Sextant (students purchase own, learn to use it properly)
- Atlantic Crossing burgee
- Photo book of the passage
- Letter from Captain Mike on seamanship growth

---

## Enhancement Priority
| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Celestial Nav Requirement | High | Medium | 1 |
| Caribbean Dawn Landfall | High | Easy | 2 |
| Circumnavigation Stories | High | Easy | 3 |
| Mid-Atlantic Celebration | Medium | Easy | 4 |
| Heavy Weather Class | High | Hard (weather dependent) | 5 |
```

---

## Agent Usage Instructions

1. **New Partner Added** → Fill input template
2. **Run Through Framework** → Generate location + instructor + activity enhancements
3. **Create Memorable Moments** → Opening, peak, cultural, celebration
4. **Prioritize** → What's highest impact, easiest to implement
5. **Share with Partner** → Include in outreach or partnership discussion
6. **Iterate** → Refine based on partner feedback

---

**Version**: 1.0
**Last Updated**: January 2026

*Every experience should be the best version of itself.*

*Skills last, tans fade.*
