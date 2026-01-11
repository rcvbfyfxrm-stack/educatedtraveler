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

Timing:
  proposed_dates: "[When considering running this]"
  local_events: "[Any known events in the area]"
  seasonal_factors: "[Weather, migrations, harvests, etc.]"
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

### Step 5: Calendar & Special Events Integration

**Ask:** What happens HERE at specific times that transforms the experience?

> "Time your experience with events that only happen once a year. This isn't tourism—it's witnessing something unrepeatable."

---

#### PHOTOGRAPHY & VISUAL ARTS

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Pushkar Camel Fair** | Rajasthan, India | Nov (5 days around full moon) | 50,000 camels, Rajasthani traders, golden light, portraits |
| **Holi Festival** | Mathura/Vrindavan, India | March (full moon) | Explosion of color, raw emotion, chaos as art |
| **Day of the Dead** | Oaxaca, Mexico | Oct 31 - Nov 2 | Altars, marigolds, face paint, graveside vigils |
| **Lantern Festival** | Chiang Mai, Thailand | November (Yi Peng) | Thousands of floating lanterns, night long exposure |
| **Cherry Blossom** | Kyoto, Japan | Late March - Early April | 2-week window, temples, reflection pools |
| **Northern Lights** | Tromsø, Norway | Sept - March | Aurora photography, dog sleds, Sami culture |
| **Carnival** | Rio/Venice | February | Masks, costumes, street life, night photography |
| **Burning Man** | Nevada, USA | Late August | Art installations, dust storms, surreal portraits |
| **Kumbh Mela** | Allahabad, India | Every 12 years (next: 2025) | Largest human gathering on earth, sadhus, ritual |
| **Mongolian Naadam** | Ulaanbaatar | July 11-13 | Wrestling, archery, horses, nomadic culture |

---

#### CULINARY EXPERIENCES

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **White Truffle Season** | Alba, Piedmont | Oct - Dec | Hunt with dogs, auction, peak truffle dishes |
| **Olive Harvest** | Tuscany/Andalusia | Oct - Nov | Press fresh oil, farm-to-table, ancient groves |
| **Grape Harvest (Vendange)** | Burgundy/Bordeaux | Sept - Oct | Pick grapes, witness crush, taste new vintage |
| **Tuna Running (Mattanza)** | Sicily | May - June | Ancient fishing ritual, freshest bluefin |
| **Cherry Season** | Jerte Valley, Spain | March-April bloom, June harvest | Million trees in bloom, festival |
| **Matsutake Season** | Japan | Sept - Nov | Most expensive mushroom, forest foraging |
| **Crab Season** | San Francisco | Nov - June | Dungeness at peak, wharf culture |
| **Lobster Season** | Maine, USA | June - Dec | Trap-to-table, fishing village immersion |
| **Cheese Festivals** | Various (France, Switzerland) | Summer alpages | High-altitude dairy, transhumance tradition |
| **Saffron Harvest** | Kashmir/La Mancha | October | Hand-pick 150 flowers per gram, labor of love |

---

#### SAILING & OCEAN

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **ARC (Atlantic Rally)** | Canaries → Caribbean | Late November | 200+ boats, trade wind crossing, fleet camaraderie |
| **Antigua Sailing Week** | Antigua | Late April | World-class racing, Caribbean setting |
| **Fastnet Race** | UK → Ireland | August (biennial) | Classic offshore race, 600nm, 300+ boats |
| **Sydney to Hobart** | Australia | Dec 26 start | Iconic race, Boxing Day tradition, Bass Strait |
| **Rolex Middle Sea** | Malta | October | Mediterranean classic, 606nm |
| **Les Voiles de Saint-Tropez** | France | Late Sept/Oct | Classic yachts, glamour, Riviera |
| **Tall Ships Races** | Europe (rotating) | Summer | Sail with trainees on square riggers |
| **Round the Island** | Isle of Wight, UK | June | 1,500+ boats, one-day race, accessible |
| **Transat Jacques Vabre** | France → Brazil | November (biennial) | Coffee route, double-handed |
| **Whale Migration** | Various | Seasonal | Humpbacks (July-Oct Tonga), Orcas (Oct-Jan Norway) |

---

#### DIVING & MARINE

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Whale Shark Season** | Isla Holbox, Mexico | June - Sept | Largest fish, snorkel alongside |
| **Manta Season** | Maldives/Komodo | Various | Cleaning stations, night dives with mantas |
| **Sardine Run** | South Africa | June - July | Greatest marine spectacle, predator frenzy |
| **Hammerhead Season** | Galápagos | June - Nov | Schools of hundreds at Darwin/Wolf |
| **Coral Spawning** | Great Barrier Reef | Nov (after full moon) | Underwater snowstorm, once per year |
| **Jellyfish Lake** | Palau | Year-round (check status) | Millions of stingless jellies |
| **Humpback Calving** | Tonga/Hawaii | July - Oct / Jan - Mar | Mother-calf encounters, singing males |
| **Thresher Sharks** | Malapascua, Philippines | Year-round, dawn | Only place for reliable encounters |
| **Orca Season** | Norway | Oct - Jan | Herring balls, aurora diving |
| **Mola Mola Season** | Bali | July - Oct | Giant sunfish at cleaning stations |

---

#### YOGA & WELLNESS

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **International Yoga Day** | Rishikesh, India | June 21 | Mass practice at Ganges, global celebration |
| **Kumbh Mela** | Rotating cities, India | Every 3 years | Millions of pilgrims, sadhu gatherings |
| **Shivaratri** | Varanasi/Nepal | Feb - March | Night of Shiva, all-night meditation, temples |
| **Diwali** | India-wide | Oct - Nov | Festival of lights, ceremonies, celebration |
| **Nyepi (Silent Day)** | Bali | March (Balinese New Year) | Entire island silent, no lights, meditation |
| **Losar (Tibetan New Year)** | Dharamsala, India | Feb - March | Monastery ceremonies, Dalai Lama teachings |
| **Full Moon Ceremonies** | Various | Monthly | Purnima gatherings, special pujas |
| **Holi** | India | March | Color festival, rebirth, playfulness |
| **Songkran** | Thailand | April 13-15 | Water festival, temple visits, cleansing |
| **Vesak (Buddha Day)** | SE Asia | May (full moon) | Birth/enlightenment/death of Buddha |

---

#### WINE & SPIRITS

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Burgundy Harvest** | Côte d'Or, France | Sept | Grand Cru picking, cellar access, new vintage |
| **Bordeaux En Primeur** | Bordeaux, France | April | Taste barrel samples, futures buying |
| **Champagne Harvest** | Épernay/Reims | Sept | Hand-picked, pressing houses, celebration |
| **Sherry Harvest** | Jerez, Spain | Sept | Palomino grapes, solera system, flamenco |
| **Port Vintage** | Douro Valley, Portugal | Sept | Foot-treading lagares, quinta stays |
| **Whisky Festival** | Islay, Scotland | Late May | Fèis Ìle, distillery open days, rare releases |
| **Oktoberfest** | Munich, Germany | Late Sept - Oct | Beer culture at peak, tradition |
| **Beaujolais Nouveau** | Beaujolais, France | 3rd Thursday Nov | Release day, village celebrations |
| **Ice Wine Harvest** | Niagara/Germany | Dec - Jan | Frozen grapes, -8°C picking, rare bottles |
| **Mezcal Harvest** | Oaxaca, Mexico | Year-round, visit Nov | Day of Dead + mezcal, palenque tours |

---

#### ADVENTURE & EXTREME

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Everest Season** | Nepal | April - May, Sept - Oct | Weather windows, expedition atmosphere |
| **Mont Blanc Season** | Chamonix, France | June - Sept | Alpine climbing, refuges, summit pushes |
| **Patagonia Season** | Chile/Argentina | Nov - March | Trekking weather, Torres del Paine |
| **Iditarod** | Alaska | March | Dog sled race, musher culture |
| **Mongol Rally** | UK to Mongolia | July start | 10,000 miles, tiny cars, chaos |
| **Running of Bulls** | Pamplona, Spain | July 6-14 | Adrenaline, tradition, controversy |
| **Wing Suit Championships** | Various | Summer | Watch/learn from world's best |
| **Freediving World Championships** | Rotating | Annual | Competition atmosphere, depth records |
| **Camel Racing** | UAE | Oct - April | Traditional sport, morning races |
| **Nile Kayak Festival** | Uganda | January | White water, waterfalls, community |

---

#### TREKKING & MOUNTAINEERING

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Annapurna Season** | Nepal | Oct - Nov, March - April | Clear skies, rhododendron bloom (spring) |
| **Inca Trail Permit Season** | Peru | May - Sept (dry) | Limited permits, book months ahead |
| **Kilimanjaro Summit Window** | Tanzania | Jan - March, June - Oct | Best weather for summit success |
| **Torres del Paine** | Chile | Nov - March | Patagonian summer, W Trek conditions |
| **Camino de Santiago** | Spain | April - Oct | Pilgrim season, harvest (Sept) |
| **Mount Fuji** | Japan | July - Aug | Official climbing season, sunrise groups |
| **Rwenzori Mountains** | Uganda | June - Aug, Dec - Feb | Dry seasons, "Mountains of the Moon" |
| **Ladakh Trekking** | India | June - Sept | High passes open, monastery festivals |
| **Chadar Trek** | Ladakh, India | Jan - Feb | Frozen river walk, extreme cold |
| **Mardi Himal** | Nepal | Oct - Nov | New route, fewer crowds, Annapurna views |

---

#### CULTURAL & ARTISAN

| Event | Location | Timing | Why It's Special |
|-------|----------|--------|------------------|
| **Fez Festival of World Sacred Music** | Morocco | June | Sufi music, medina setting |
| **Edinburgh Fringe** | Scotland | August | World's largest arts festival |
| **Venice Biennale** | Italy | May - Nov (odd years) | Contemporary art, architecture |
| **Obon Festival** | Japan | August | Ancestor honoring, lanterns, dance |
| **Paro Tsechu** | Bhutan | March/April | Masked dances, Buddhist festival |
| **Carnival of Oruro** | Bolivia | February | UNESCO heritage, devil dances |
| **Gion Matsuri** | Kyoto, Japan | July | Month-long, massive floats, tradition |
| **La Tomatina** | Buñol, Spain | Last Wed of August | Tomato fight, pure chaos |
| **Rio Carnival** | Brazil | February | Samba schools, parade, all-night |
| **Galungan** | Bali | Every 210 days | Temple ceremonies, offerings, processions |

---

### Calendar Integration Framework

**When adding any experience, ask:**

1. **What annual events happen at this location?**
   - Festivals, harvests, migrations, competitions, religious events

2. **What natural phenomena are seasonal?**
   - Blooms, animal behavior, weather patterns, celestial events

3. **What industry events align with the skill?**
   - Trade shows, competitions, award ceremonies, conferences

4. **Can we TIME the experience to coincide?**
   - Build program dates around peak events
   - Offer "special edition" cohorts during events
   - Add event attendance as enhancement

**Calendar Enhancement Output Format:**
```
CALENDAR OPPORTUNITIES for [Experience]:

🗓️ PEAK TIMING: [Best dates and why]

📅 SPECIAL EVENTS:
- [Event 1]: [Date] — [How to integrate]
- [Event 2]: [Date] — [How to integrate]

🌿 SEASONAL FACTORS:
- [Factor 1]: [Timing and impact]
- [Factor 2]: [Timing and impact]

⚡ PREMIUM TIMING RECOMMENDATION:
"Schedule [Experience] during [Event/Season] because [specific reason]"
```

---

### Example: Calendar-Enhanced Experience

**Photography in Rajasthan**

```
CALENDAR OPPORTUNITIES for Rajasthan Photography:

🗓️ PEAK TIMING: Late October - Early November

📅 SPECIAL EVENTS:
- Pushkar Camel Fair: Nov 4-12, 2025 — Build entire program around this
- Diwali: Nov 1, 2025 — Jaipur illuminated, fireworks, family scenes
- Desert Festival Jaisalmer: Feb — If winter program, camel polo, folk music

🌿 SEASONAL FACTORS:
- Light quality: Oct-Feb golden hour is magical, no haze
- Temperature: Comfortable for all-day shooting
- Crowds: Post-monsoon, pre-peak tourist season

⚡ PREMIUM TIMING RECOMMENDATION:
"Schedule Rajasthan Photography Immersion for Nov 1-14 to capture
Diwali celebrations in Jaipur (Nov 1) AND Pushkar Camel Fair (Nov 4-12).
This 2-week window offers the two most photographically rich events
in Rajasthan within days of each other. Students photograph 50,000
camels, Rajasthani traders in full regalia, festival lights, and
the most colorful scenes on earth. This combination is impossible
to replicate at any other time of year."
```

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

## Calendar & Timing Opportunities

🗓️ **PEAK TIMING:** [Best dates and why]

📅 **SPECIAL EVENTS:**
- [Event 1]: [Date] — [How to integrate]
- [Event 2]: [Date] — [How to integrate]

🌿 **SEASONAL FACTORS:**
- [Factor 1]: [Timing and impact]
- [Factor 2]: [Timing and impact]

⚡ **PREMIUM TIMING RECOMMENDATION:**
> "[Why this specific timing makes the experience 10x better]"

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
