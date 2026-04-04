// Shared experiences data for EducatedTraveler
// Single source of truth — used by index.html quest selector and any future pages

window.ET_EXPERIENCES = [
    // ======== DIVING & OCEAN (PADI, AIDA, SSI, RYA) ========
    {
        id: 'scuba-mediterranean-cousteau',
        name: 'PADI Divemaster — French Mediterranean',
        category: 'diving',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['ocean'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 2,
        summary: 'Where Cousteau invented modern diving. Open Water to Divemaster on the Côte d\'Azur.',
        meta: '21-28 days · ~$6.5k-$8.5k · PADI Divemaster',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Open Water & Advanced', focus: 'Core dive skills, buoyancy, navigation, deep dives — your foundation underwater' },
                { phase: 'Week 2', title: 'Rescue Diver', focus: 'Emergency scenarios, stress management, self-rescue and buddy rescue techniques' },
                { phase: 'Week 3', title: 'Divemaster Training', focus: 'Leading dives, briefing groups, assisting instructors, map-making' },
                { phase: 'Week 4', title: 'Divemaster Exams', focus: 'Final assessments, stamina tests, professional internship dives' }
            ],
            included: [
                { name: 'Marine Biology Walks', desc: 'Evening sessions with a local marine biologist — learn to identify species and read reef ecosystems' },
                { name: 'Underwater Photography Intro', desc: 'Basics of shooting underwater with provided cameras — composition, light, and marine portraits' },
                { name: 'Historic Dive Sites', desc: 'Guided visits to sunken ships and protected marine reserves with ecological context' },
                { name: 'Local Fishing Culture', desc: 'Morning with a traditional fishing family — understand the sea from those who live on it' },
                { name: 'Night Dive Experience', desc: 'Bioluminescence dive — see the ocean transform after dark with your cohort' }
            ],
            addOns: [
                { name: 'Nitrox Specialty Certification', desc: 'Extend your bottom time — enriched air certification in 2 sessions', price: '+$350' },
                { name: 'Underwater Videography Workshop', desc: 'Full-day shoot with a professional underwater filmmaker using pro rigs', price: '+$450' },
                { name: 'Private Deep Dive with Master', desc: 'One-on-one 40m+ dive with your lead instructor at an advanced site', price: '+$300' },
                { name: 'Marine Conservation Day', desc: 'Join a reef restoration project — coral planting and data collection for ongoing research', price: '+$200' }
            ],
            nextSteps: [
                { name: 'PADI Instructor Development — 90-Day Saga', desc: 'Continue to full instructor certification with IDC and IE' },
                { name: 'Cave Diver — Yucatan Cenotes', desc: 'Take your skills underground into the world\'s longest cave systems' },
                { name: 'Marine Conservation — Great Barrier Reef', desc: 'Apply your dive skills to coral reef conservation and research' }
            ]
        }
    },
    {
        id: 'freedive-dahab',
        name: 'AIDA Freediving Instructor — Dahab',
        category: 'diving',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 4500,
        maxPrice: 6500,
        envTags: ['ocean'],
        desireTags: ['certification', 'career', 'reset'],
        intensity: 3,
        summary: 'The Blue Hole. Where world records are set. AIDA 1-4 plus Instructor certification.',
        meta: '21-28 days · ~$4.5k-$6.5k · AIDA Instructor',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'AIDA 1-2: Foundations', focus: 'Breath-hold technique, equalization, relaxation — static and dynamic apnea basics' },
                { phase: 'Week 2', title: 'AIDA 3: Deep Dives', focus: 'Free immersion and constant weight to 30m+, advanced equalization, rescue protocols' },
                { phase: 'Week 3', title: 'AIDA 4: Performance', focus: 'Deep constant weight, variable weight techniques, competition preparation' },
                { phase: 'Week 4', title: 'Instructor Training', focus: 'Teaching methodology, safety supervision, course organization, final assessment' }
            ],
            included: [
                { name: 'Breathwork & Meditation', desc: 'Daily pranayama and meditation sessions — the mental game is everything in freediving' },
                { name: 'Yoga for Diaphragm', desc: 'Specific yoga sequences designed to increase lung capacity and thoracic flexibility' },
                { name: 'Desert Stargazing', desc: 'Night sessions in the Sinai desert — decompression for the mind between deep training days' },
                { name: 'Bedouin Culture Evening', desc: 'Traditional dinner and music with local Bedouin families in the mountains behind the coast' },
                { name: 'Freedive Physiology Lectures', desc: 'Understand the mammalian dive reflex, blood shift, and the science behind your limits' }
            ],
            addOns: [
                { name: 'Blue Hole Deep Dive Experience', desc: 'Guided freedive to the arch at 56m with safety team — a bucket-list dive', price: '+$400' },
                { name: 'Private Depth Coaching', desc: 'One-on-one sessions with a competitive freediver to break through your plateau', price: '+$500' },
                { name: 'Underwater Photography Package', desc: 'Professional photos and video of your deepest dives — yours to keep', price: '+$300' },
                { name: 'Sinai Hiking & Snorkeling', desc: 'Full-day adventure combining mountain trails and hidden reef snorkeling on rest days', price: '+$150' }
            ],
            nextSteps: [
                { name: 'Competition Freediving Camp', desc: 'Train with competitive athletes and prepare for your first competition' },
                { name: 'PADI Divemaster — Mediterranean', desc: 'Add scuba to your resume and become a dual-discipline dive professional' },
                { name: 'Breathwork Instructor — WHM', desc: 'Take your breath control to the next level with cold exposure training' }
            ]
        }
    },
    {
        id: 'ocean-sailing-rya-greece',
        name: 'RYA Day Skipper — Greek Islands',
        category: 'sailing',
        tier: 'foundation',
        minDays: 14,
        maxDays: 21,
        minPrice: 5500,
        maxPrice: 7500,
        envTags: ['ocean'],
        desireTags: ['certification', 'stories'],
        intensity: 2,
        summary: 'Cradle of Mediterranean sailing. RYA Day Skipper through the Cyclades.',
        meta: '14-21 days · ~$5.5k-$7.5k · RYA Day Skipper',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Competent Crew Skills', focus: 'Sail handling, rope work, points of sail, helming, man overboard drills' },
                { phase: 'Week 2', title: 'Navigation & Pilotage', focus: 'Chart work, tidal calculations, passage planning, GPS and compass navigation' },
                { phase: 'Week 3', title: 'Skipper Responsibilities', focus: 'Weather interpretation, anchoring, mooring, night sailing, crew management, final exam' }
            ],
            included: [
                { name: 'Celestial Navigation Intro', desc: 'Evening sessions on deck learning to read the sky — stars, planets, and traditional wayfinding' },
                { name: 'Island Exploration', desc: 'Cohort days on shore — hike volcanic trails, swim hidden coves, discover villages the ferries skip' },
                { name: 'Greek Cooking on Board', desc: 'Learn to cook fresh catches and local ingredients in a tiny galley — real sailor cuisine' },
                { name: 'Knot Craft Workshop', desc: 'Master 20+ essential knots and splices — practical skills that become meditative rituals' },
                { name: 'Weather Reading Masterclass', desc: 'Learn to read clouds, barometric pressure, and wind patterns from a veteran skipper' }
            ],
            addOns: [
                { name: 'Racing Tactics Workshop', desc: 'Two-day introduction to competitive sailing with mark rounding and spinnaker work', price: '+$400' },
                { name: 'Drone Sailing Photography', desc: 'Aerial shots and video of your yacht under sail — stunning perspective', price: '+$300' },
                { name: 'Private Night Passage', desc: 'Extended overnight sail under the stars with your instructor — the real test', price: '+$350' },
                { name: 'Traditional Boatbuilding Visit', desc: 'Full day at a heritage boatyard watching craftsmen build wooden vessels by hand', price: '+$200' }
            ],
            nextSteps: [
                { name: 'Coastal Skipper — Atlantic Passage', desc: 'Blue water sailing across open ocean — the next level of seamanship' },
                { name: 'Yachtmaster — 90-Day Saga', desc: 'The full journey from Day Skipper through Yachtmaster Offshore' },
                { name: 'Kitesurfing Instructor — Tarifa', desc: 'Stay on the water but harness the wind in a completely different way' }
            ]
        }
    },
    {
        id: 'ocean-sailing-atlantic',
        name: 'RYA Coastal Skipper — Atlantic Passage',
        category: 'sailing',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 7500,
        maxPrice: 9500,
        envTags: ['ocean'],
        desireTags: ['certification', 'stories', 'career'],
        intensity: 3,
        summary: 'Blue water passage across the Atlantic. RYA Coastal Skipper certification.',
        meta: '21-28 days · ~$7.5k-$9.5k · RYA Coastal Skipper',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Passage Preparation', focus: 'Vessel checks, provisioning, weather routing, safety equipment, heavy weather drills' },
                { phase: 'Week 2', title: 'Coastal Navigation', focus: 'Pilotage in challenging conditions, lee shores, tidal gates, harbour approaches' },
                { phase: 'Week 3', title: 'Offshore Sailing', focus: 'Watch systems, sail changes, storm tactics, celestial fixes, crew endurance' },
                { phase: 'Week 4', title: 'Skipper Assessment', focus: 'Solo passage planning, emergency command, final practical exam under real conditions' }
            ],
            included: [
                { name: 'Celestial Navigation', desc: 'Full sextant training — navigate by the stars when GPS fails, the way it was done for centuries' },
                { name: 'Weather Routing Workshop', desc: 'Read GRIB files, interpret synoptic charts, and plan passages around real weather systems' },
                { name: 'Engine & Systems Maintenance', desc: 'Hands-on diesel engine care, electrical troubleshooting, watermaker operation' },
                { name: 'Ocean Wildlife Encounters', desc: 'Dolphin pods, whale sightings, seabird identification — the open ocean is alive' },
                { name: 'Provisioning & Galley Management', desc: 'Plan meals for a 3-week passage, manage freshwater, cook in any sea state' }
            ],
            addOns: [
                { name: 'Offshore Survival Course', desc: 'ISAF-standard life raft deployment, flare use, and cold water survival training', price: '+$500' },
                { name: 'Spinnaker & Downwind Mastery', desc: 'Advanced sail handling for trade wind sailing — asymmetric and symmetric techniques', price: '+$400' },
                { name: 'Marine Radio License', desc: 'Short Range Certificate (SRC) — VHF radio operation and distress procedures', price: '+$250' },
                { name: 'Passage Documentary', desc: 'Professional videographer captures your Atlantic crossing as a short film', price: '+$600' }
            ],
            nextSteps: [
                { name: 'Yachtmaster — 90-Day Saga', desc: 'Complete the full Yachtmaster journey and command any yacht worldwide' },
                { name: 'Freediving — Dahab', desc: 'Go beneath the surface after sailing across it — a natural complement' },
                { name: 'FGASA Safari Guide', desc: 'Trade blue horizons for bush horizons — a completely different kind of expedition' }
            ]
        }
    },
    {
        id: 'cave-diving-yucatan',
        name: 'PADI Cave Diver — Yucatan Cenotes',
        category: 'adventure',
        tier: 'mastery',
        minDays: 14,
        maxDays: 21,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['ocean'],
        desireTags: ['rare', 'stories', 'certification'],
        intensity: 3,
        summary: 'World\'s longest underwater cave systems. Full PADI Cave Diver certification.',
        meta: '14-21 days · ~$6.5k-$8.5k · PADI Cave Diver',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Cavern & Intro to Cave', focus: 'Overhead environment orientation, line laying, gas management, light protocols' },
                { phase: 'Week 2', title: 'Full Cave Diver', focus: 'Complex navigation, jump and gap procedures, decompression planning, restriction passages' },
                { phase: 'Week 3', title: 'Advanced Cave Techniques', focus: 'Multi-stage dives, side-mount configuration, survey techniques, final certification dives' }
            ],
            included: [
                { name: 'Cenote Geology Lectures', desc: 'Understand the million-year formation of these cave systems — stalactites, haloclines, fossils' },
                { name: 'Mayan Archaeology Sessions', desc: 'Evening talks on the sacred significance of cenotes and what has been discovered underground' },
                { name: 'Jungle Ecology Walks', desc: 'Guided hikes through the surrounding rainforest — the surface world above your cave dives' },
                { name: 'Equipment Configuration Lab', desc: 'Master side-mount and back-mount setups, build and test your own rig with expert guidance' },
                { name: 'Cenote Snorkeling for Rest Days', desc: 'Explore shallow cenotes with your cohort — crystal water, tree roots, dappled light' }
            ],
            addOns: [
                { name: 'Underwater Cave Photography', desc: 'Learn to light and photograph underground — wide angle in passages, macro on formations', price: '+$450' },
                { name: 'Side-Mount Specialty Certification', desc: 'Two-day side-mount training for streamlined cave penetration', price: '+$400' },
                { name: 'Deep Cenote Expedition', desc: 'Guided dive to rarely visited deep sections with advanced gas planning', price: '+$500' },
                { name: 'Traditional Mayan Cooking Class', desc: 'Full day cooking with a local family — underground oven, fresh tortillas, ancestral recipes', price: '+$150' }
            ],
            nextSteps: [
                { name: 'PADI Divemaster — Mediterranean', desc: 'Broaden your dive career with open water leadership certification' },
                { name: 'Indigenous Mexican Cuisine — Oaxaca', desc: 'Stay in Mexico and dive into another kind of mastery — ancient food traditions' },
                { name: 'Mountaineering — Chamonix', desc: 'Trade underground exploration for high altitude — another extreme environment' }
            ]
        }
    },
    {
        id: 'kitesurfing-tarifa',
        name: 'IKO Kitesurfing Instructor — Tarifa',
        category: 'adventure',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 5500,
        maxPrice: 7500,
        envTags: ['ocean'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 3,
        summary: 'Wind capital of Europe. IKO Level 1 through Instructor certification.',
        meta: '21-28 days · ~$5.5k-$7.5k · IKO Instructor',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Fundamentals & Body Drag', focus: 'Kite control, wind window, body dragging upwind, safety systems, self-rescue' },
                { phase: 'Week 2', title: 'Board Skills & Independence', focus: 'Water starts, riding, transitions, upwind riding, independent sessions' },
                { phase: 'Week 3', title: 'Advanced & Freestyle', focus: 'Jumps, rotations, wave riding, strapless techniques, session management' },
                { phase: 'Week 4', title: 'Instructor Certification', focus: 'Teaching methodology, student safety, lesson planning, IKO practical exam' }
            ],
            included: [
                { name: 'Wind & Weather Science', desc: 'Understand thermals, pressure systems, and coastal effects — read conditions like a local' },
                { name: 'Board Shaping Workshop', desc: 'Visit a local shaper and understand how different board designs affect your ride' },
                { name: 'Strait of Gibraltar Excursion', desc: 'Whale watching where the Atlantic meets the Mediterranean — two continents, one afternoon' },
                { name: 'Spanish Surf Culture', desc: 'Evening tapas runs with your cohort through the old town — the social side of a wind town' },
                { name: 'Equipment Repair & Maintenance', desc: 'Learn to fix tears, replace lines, and maintain your gear — essential for instructors' }
            ],
            addOns: [
                { name: 'Wingfoil Introduction', desc: 'Two-day intro to wing foiling — the newest discipline, directly transferable skills', price: '+$350' },
                { name: 'Drone Action Photography', desc: 'Professional drone footage of your sessions — epic content for your instructor portfolio', price: '+$300' },
                { name: 'Morocco Day Trip', desc: 'Ferry across to Tangier — explore the medina, surf a different continent', price: '+$200' },
                { name: 'First Aid & Water Safety', desc: 'Beach lifeguard first aid certificate — essential for any water sports instructor', price: '+$250' }
            ],
            nextSteps: [
                { name: 'Surf Instructor — Bali', desc: 'Add surfing to your water sports instructor skillset' },
                { name: 'RYA Day Skipper — Greece', desc: 'Move from riding the wind to navigating by it' },
                { name: 'Wim Hof Method — Poland', desc: 'Build the cold resilience and breath control that transforms your water performance' }
            ]
        }
    },
    {
        id: 'surf-instructor-bali',
        name: 'ISA Surf Instructor — Bali',
        category: 'adventure',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 5500,
        maxPrice: 7500,
        envTags: ['ocean'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 2,
        summary: 'World-class breaks in Uluwatu and Canggu. ISA Level 1-2 Surf Instructor.',
        meta: '21-28 days · ~$5.5k-$7.5k · ISA Surf Instructor',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Surf Foundations', focus: 'Wave reading, paddling efficiency, pop-up mechanics, lineup etiquette, ocean safety' },
                { phase: 'Week 2', title: 'Intermediate Techniques', focus: 'Bottom turns, cutbacks, tube positioning, different board types, reef break navigation' },
                { phase: 'Week 3', title: 'Advanced & Teaching', focus: 'Aerial maneuvers, competition surfing, video analysis, teaching methodology' },
                { phase: 'Week 4', title: 'Instructor Certification', focus: 'Lesson delivery, risk assessment, student progression management, ISA exam' }
            ],
            included: [
                { name: 'Ocean Reading Sessions', desc: 'Dawn patrol with a local waterman — learn to read swells, currents, tides, and sand bars' },
                { name: 'Board Design & History', desc: 'Visit a traditional shaper — understand how fins, rails, and rocker affect your surfing' },
                { name: 'Balinese Temple Ceremonies', desc: 'Witness and participate in local ceremonies — understand the spiritual connection to the ocean' },
                { name: 'Yoga for Surfers', desc: 'Targeted sessions for paddle endurance, hip flexibility, and breath hold — surf longer, recover faster' },
                { name: 'Tropical Reef Ecology', desc: 'Snorkeling sessions to understand the reef systems you surf above every day' }
            ],
            addOns: [
                { name: 'Surf Photography Workshop', desc: 'Learn water housing photography — shoot from inside the barrel', price: '+$400' },
                { name: 'Freediving Cross-Training', desc: 'Two-day breath hold and ocean confidence course — essential for big wave progression', price: '+$350' },
                { name: 'Traditional Balinese Cooking', desc: 'Full day with a local family — market, ceremony offerings, feast preparation', price: '+$150' },
                { name: 'Island Hopping Extension', desc: 'Boat trip to neighboring island breaks rarely surfed by visitors', price: '+$300' }
            ],
            nextSteps: [
                { name: 'Kitesurfing Instructor — Tarifa', desc: 'Add wind sports to your ocean instructor credentials' },
                { name: 'Yoga Alliance RYT-200 — Rishikesh', desc: 'Deepen the yoga practice that complements your surfing' },
                { name: 'PADI Divemaster — Mediterranean', desc: 'Go below the waves you\'ve been riding' }
            ]
        }
    },
    // ======== CULINARY (WSET, Le Cordon Bleu, ALMA) ========
    {
        id: 'pastry-le-cordon-bleu-paris',
        name: 'Le Cordon Bleu Pastry — Paris',
        category: 'culinary',
        tier: 'mastery',
        minDays: 30,
        maxDays: 60,
        minPrice: 15000,
        maxPrice: 25000,
        envTags: ['city'],
        desireTags: ['certification', 'career', 'creative'],
        intensity: 2,
        summary: 'The gold standard. Le Cordon Bleu Diplôme de Pâtisserie in Paris.',
        meta: '1-2 months · ~$15k-$25k · Le Cordon Bleu Diplôme',
        immersive: {
            curriculum: [
                { phase: 'Week 1-2', title: 'Foundations', focus: 'Doughs, batters, creams — pâte brisée to crème pâtissière, precision measurements, oven mastery' },
                { phase: 'Week 3-4', title: 'Classical Techniques', focus: 'Viennoiserie, laminated doughs, choux, sugar work, chocolate tempering' },
                { phase: 'Week 5-6', title: 'Advanced Patisserie', focus: 'Entremets, contemporary plating, artistic sugar pieces, flavor pairing theory' },
                { phase: 'Week 7-8', title: 'Professional Practice', focus: 'Full service production, timed execution, signature creation, final examination' }
            ],
            included: [
                { name: 'Parisian Pâtisserie Crawl', desc: 'Guided tastings at legendary pastry shops — study the masters by eating their work' },
                { name: 'Chocolate Atelier Visit', desc: 'Behind-the-scenes at a bean-to-bar workshop — understand cacao from origin to ganache' },
                { name: 'French Wine & Pastry Pairing', desc: 'Evening sessions matching desserts with sweet wines, champagne, and digestifs' },
                { name: 'Food Photography Basics', desc: 'Style and shoot your own creations — build a portfolio as you learn' },
                { name: 'Ingredient Sourcing Tour', desc: 'Visit the wholesale markets and specialty suppliers where Paris\'s best chefs shop' }
            ],
            addOns: [
                { name: 'Michelin Pastry Kitchen Stage', desc: 'One-day observation in a starred restaurant pastry section — see professional pace', price: '+$500' },
                { name: 'Artisan Bread Intensive', desc: 'Weekend deep-dive into sourdough, levain, and traditional French bread techniques', price: '+$400' },
                { name: 'Private Chocolate Masterclass', desc: 'One-on-one with a Meilleur Ouvrier de France — the highest craft distinction', price: '+$600' },
                { name: 'Paris Food History Walking Tour', desc: 'Full day exploring the culinary history of Paris — markets, bistros, and hidden gems', price: '+$200' }
            ],
            nextSteps: [
                { name: 'Italian Cuisine — Parma', desc: 'Expand from pastry into savory mastery at one of the world\'s great culinary schools' },
                { name: 'WSET Level 3 — Bordeaux', desc: 'Add wine expertise to your pastry credentials — the perfect pairing' },
                { name: 'Modernist Cuisine — Barcelona', desc: 'Take your technique into the avant-garde with molecular gastronomy' }
            ]
        }
    },
    {
        id: 'italian-cuisine-alma',
        name: 'ALMA Italian Cuisine — Parma',
        category: 'culinary',
        tier: 'mastery',
        minDays: 30,
        maxDays: 60,
        minPrice: 12000,
        maxPrice: 18000,
        envTags: ['city'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 2,
        summary: 'Italy\'s premier culinary school. ALMA professional certification in Parma.',
        meta: '1-2 months · ~$12k-$18k · ALMA Professional Certificate',
        immersive: {
            curriculum: [
                { phase: 'Week 1-2', title: 'Foundations of Italian Cooking', focus: 'Pasta from scratch, sauces, knife skills, stock work — the grammar of Italian cuisine' },
                { phase: 'Week 3-4', title: 'Regional Mastery', focus: 'Deep dives into regional traditions — each province has its own rules, ingredients, and logic' },
                { phase: 'Week 5-6', title: 'Professional Kitchen', focus: 'Station management, service timing, menu development, guest interaction' },
                { phase: 'Week 7-8', title: 'Stagione & Certification', focus: 'Restaurant internship placement, professional execution, final assessment' }
            ],
            included: [
                { name: 'Parmigiano Factory Visit', desc: 'Watch the 800-year-old process from milk to wheel — taste aging from 12 to 36 months' },
                { name: 'Prosciutto Curing House', desc: 'Walk through cellars where ham ages for years in mountain air — understand time as ingredient' },
                { name: 'Italian Wine Fundamentals', desc: 'Weekly tastings of regional wines — learn why certain wines only work with certain food' },
                { name: 'Farmers Market Sourcing', desc: 'Early morning market runs with your instructor — learn to choose by touch, smell, and season' },
                { name: 'Balsamic Vinegar Tradition', desc: 'Visit a family acetaia — taste vinegar aged 12, 25, and 50 years side by side' }
            ],
            addOns: [
                { name: 'Truffle Hunting Experience', desc: 'Full day with a truffle hunter and dogs in the hills — then cook what you find', price: '+$350' },
                { name: 'Starred Restaurant Dinner', desc: 'Multi-course dinner at a top restaurant with your cohort — study plating and service', price: '+$400' },
                { name: 'Pasta Masterclass with Sfoglina', desc: 'Private session with a traditional pasta grandmother — techniques machines can\'t replicate', price: '+$250' },
                { name: 'Emilia-Romagna Road Trip', desc: 'Full day visiting small producers — olive oil, salumi, cheese — the supply chain of excellence', price: '+$300' }
            ],
            nextSteps: [
                { name: 'Le Cordon Bleu Pastry — Paris', desc: 'Add French pastry to your Italian cuisine credentials' },
                { name: 'WSET Level 3 — Bordeaux', desc: 'Formalize the wine knowledge you\'ve been building alongside food' },
                { name: 'Modernist Cuisine — Barcelona', desc: 'Push Italian foundations into avant-garde territory' }
            ]
        }
    },
    {
        id: 'wine-sommelier-bordeaux',
        name: 'WSET Level 3 — Bordeaux',
        category: 'culinary',
        tier: 'foundation',
        minDays: 14,
        maxDays: 21,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['city'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 1,
        summary: 'WSET Level 3 in the world\'s most legendary wine region. Château visits, cellar tastings.',
        meta: '14-21 days · ~$6.5k-$8.5k · WSET Level 3',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Wine Foundations', focus: 'Systematic tasting approach, grape varieties, viticulture basics, winemaking processes' },
                { phase: 'Week 2', title: 'World Regions', focus: 'Deep study of major wine regions — terroir, climate, classification systems, quality factors' },
                { phase: 'Week 3', title: 'Advanced Tasting & Exam', focus: 'Blind tasting mastery, food and wine pairing theory, business of wine, WSET Level 3 exam' }
            ],
            included: [
                { name: 'Château Cellar Tastings', desc: 'Private visits to historic estates — taste directly from barrel in underground cellars' },
                { name: 'Vineyard Harvest Participation', desc: 'Pick grapes alongside workers during harvest — feel the rhythm of a vintage being born' },
                { name: 'Blind Tasting Evenings', desc: 'Nightly practice sessions with your cohort — sharpen your palate through repetition and debate' },
                { name: 'Cooperage Visit', desc: 'Watch oak barrels being made by hand — understand how wood shapes the wine inside it' },
                { name: 'Regional Gastronomy Dinners', desc: 'Multi-course meals paired with local wines — the theory becomes real on the plate' }
            ],
            addOns: [
                { name: 'Spirits & Cognac Extension', desc: 'Day trip to the Cognac region — distillery visits and tasting of aged eaux-de-vie', price: '+$350' },
                { name: 'Wine Investment Seminar', desc: 'Half-day session on en primeur buying, cellar management, and wine as asset class', price: '+$300' },
                { name: 'Private Winemaker Dinner', desc: 'Intimate dinner hosted by a château owner — stories, older vintages, and insider perspective', price: '+$400' },
                { name: 'Champagne Day Trip', desc: 'Train to the champagne region — chalk cellars, méthode champenoise, prestige cuvées', price: '+$450' }
            ],
            nextSteps: [
                { name: 'Sake Sommelier — Niigata', desc: 'Expand your beverage expertise into Japan\'s ancient brewing tradition' },
                { name: 'Italian Cuisine — Parma', desc: 'Pair your wine knowledge with culinary mastery — food and wine together' },
                { name: 'Le Cordon Bleu Pastry — Paris', desc: 'Sweet wines meet pastry — a natural pairing of disciplines' }
            ]
        }
    },
    {
        id: 'sake-sommelier-niigata',
        name: 'SSI Sake Sommelier — Niigata',
        category: 'culinary',
        tier: 'foundation',
        minDays: 14,
        maxDays: 21,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['city'],
        desireTags: ['certification', 'rare', 'stories'],
        intensity: 1,
        summary: 'Japan\'s premier sake region. SSI Sake Sommelier certification with brewery immersion.',
        meta: '14-21 days · ~$6.5k-$8.5k · SSI Sake Sommelier',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Sake Foundations', focus: 'Rice varieties, water sources, koji cultivation, brewing process — how sake is born' },
                { phase: 'Week 2', title: 'Tasting & Classification', focus: 'Systematic tasting technique, style categories, temperature pairing, food matching' },
                { phase: 'Week 3', title: 'Professional & Exam', focus: 'Service techniques, menu integration, brewery economics, SSI certification exam' }
            ],
            included: [
                { name: 'Brewery Immersion Days', desc: 'Work alongside master brewers during production — washing rice, monitoring fermentation, pressing' },
                { name: 'Rice Paddy Visit', desc: 'Walk the fields where sake rice grows — understand why certain varieties are prized above all others' },
                { name: 'Japanese Ceramics & Service', desc: 'Learn why the vessel matters — how different cups change the taste of the same sake' },
                { name: 'Kaiseki Pairing Dinner', desc: 'Multi-course traditional meal with sake pairing at each course — food and drink as one' },
                { name: 'Hot Spring Evenings', desc: 'Traditional onsen after long brewery days — the Japanese art of recovery and reflection' }
            ],
            addOns: [
                { name: 'Shochu & Awamori Extension', desc: 'Two-day deep dive into Japan\'s distilled spirits tradition — the other side of Japanese brewing', price: '+$400' },
                { name: 'Sushi Pairing Masterclass', desc: 'Full-day session pairing sake with different fish — the ultimate Japanese combination', price: '+$300' },
                { name: 'Calligraphy & Label Design', desc: 'Learn the art of Japanese brush writing — design your own sake label as a keepsake', price: '+$200' },
                { name: 'Snow Country Hiking', desc: 'Guided mountain trek through the landscape that shapes the water and the people who brew with it', price: '+$250' }
            ],
            nextSteps: [
                { name: 'WSET Level 3 — Bordeaux', desc: 'Add wine expertise to your sake knowledge — become a dual-beverage specialist' },
                { name: 'Italian Cuisine — Parma', desc: 'Apply your pairing instincts to another great food culture' },
                { name: 'Indigenous Mexican Cuisine — Oaxaca', desc: 'Mezcal and mole — another ancient tradition where fermentation is sacred' }
            ]
        }
    },
    // ======== WELLNESS (Yoga Alliance, ITM, WHM) ========
    {
        id: 'yoga-ryt200-rishikesh',
        name: 'Yoga Alliance RYT-200 — Rishikesh',
        category: 'wellness',
        tier: 'foundation',
        minDays: 25,
        maxDays: 28,
        minPrice: 5500,
        maxPrice: 6500,
        envTags: ['temple'],
        desireTags: ['certification', 'reset', 'career'],
        intensity: 2,
        summary: 'Birthplace of yoga. RYT-200 certification in ashrams on the Ganges.',
        meta: '25-28 days · ~$5.5k-$6.5k · Yoga Alliance RYT-200',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Asana & Alignment', focus: 'Foundation postures, anatomical alignment, breath-movement connection, daily practice' },
                { phase: 'Week 2', title: 'Philosophy & Anatomy', focus: 'Yoga sutras, chakra system, functional anatomy for teachers, Sanskrit basics' },
                { phase: 'Week 3', title: 'Teaching Methodology', focus: 'Sequencing, cueing, adjustments, voice projection, class management, practice teaching' },
                { phase: 'Week 4', title: 'Integration & Certification', focus: 'Teaching practicums, personal practice deepening, written and practical exams' }
            ],
            included: [
                { name: 'Ganga Aarti Ceremony', desc: 'Evening fire ceremonies on the river — ancient rituals performed for thousands of years at this exact spot' },
                { name: 'Ayurvedic Nutrition Workshop', desc: 'Learn your constitution type and how to eat for balance — cooking sessions with an Ayurvedic chef' },
                { name: 'Silent Meditation Mornings', desc: 'Pre-dawn meditation on the riverbank — sitting practice that changes how you experience everything else' },
                { name: 'Sanskrit Chanting', desc: 'Learn to chant traditional mantras — the vibrational practice behind the physical one' },
                { name: 'Himalayan Day Trek', desc: 'Cohort hike into the foothills — waterfalls, forest temples, mountain villages' }
            ],
            addOns: [
                { name: 'Pranayama Intensive', desc: 'Three-day advanced breathwork course — techniques beyond what the standard 200hr covers', price: '+$300' },
                { name: 'Ayurvedic Panchakarma', desc: 'Traditional cleansing treatment — consultation, herbal therapies, dietary reset', price: '+$500' },
                { name: 'Private Philosophy Sessions', desc: 'One-on-one with a philosophy teacher — deep dive into the texts that matter to you', price: '+$250' },
                { name: 'Temple & Ashram Pilgrimage', desc: 'Full day visiting sacred sites beyond Rishikesh — caves, temples, and hermitages', price: '+$200' }
            ],
            nextSteps: [
                { name: 'Yoga Alliance RYT-500 — Rishikesh', desc: 'Continue to advanced teacher training — the professional level' },
                { name: 'Thai Massage — Chiang Mai', desc: 'Add bodywork to your teaching — physical therapy meets spiritual practice' },
                { name: 'Wim Hof Method — Poland', desc: 'Push your breath and body resilience into cold exposure territory' }
            ]
        }
    },
    {
        id: 'yoga-ryt500-rishikesh',
        name: 'Yoga Alliance RYT-500 — Rishikesh',
        category: 'wellness',
        tier: 'mastery',
        minDays: 60,
        maxDays: 90,
        minPrice: 9500,
        maxPrice: 12000,
        envTags: ['temple'],
        desireTags: ['certification', 'career', 'reset'],
        intensity: 2,
        summary: 'Advanced teacher training at the source. RYT-500 for serious practitioners.',
        meta: '60-90 days · ~$9.5k-$12k · Yoga Alliance RYT-500',
        immersive: {
            curriculum: [
                { phase: 'Month 1', title: 'Advanced Asana & Therapeutics', focus: 'Advanced postures, therapeutic applications, working with injuries and limitations' },
                { phase: 'Month 2', title: 'Specialization Tracks', focus: 'Choose: Yin, Ashtanga, or Prenatal specialization — go deep in your chosen path' },
                { phase: 'Month 3', title: 'Teaching Mastery', focus: 'Workshop design, retreat leadership, business of yoga, mentored teaching, final certification' }
            ],
            included: [
                { name: 'Yoga Nidra Training', desc: 'Learn to guide deep sleep meditation — one of the most requested and least taught skills' },
                { name: 'Anatomy Lab with Cadaver Study', desc: 'Advanced anatomy sessions — understand fascia, joint mechanics, and the body in 3D' },
                { name: 'Ashram Living', desc: 'Full immersion in ashram rhythms — morning bells, communal meals, service, silence periods' },
                { name: 'Mantra & Kirtan Practice', desc: 'Weekly devotional singing — experience yoga as sound and community, not just postures' },
                { name: 'Ayurvedic Lifestyle Integration', desc: 'Daily living according to your dosha — diet, routine, herbs, and seasonal adjustments' },
                { name: 'Teaching Mentorship', desc: 'Paired with a senior teacher — regular feedback, co-teaching, and professional development' }
            ],
            addOns: [
                { name: 'Vipassana Retreat Extension', desc: '10-day silent meditation retreat at a traditional center — the deepest reset', price: '+$400' },
                { name: 'Dharamsala Extension', desc: 'Week in the Tibetan community — teachings, monastery visits, mountain meditation', price: '+$600' },
                { name: 'Yin Yoga Specialization', desc: 'Additional certification in Yin — long holds, fascia work, Chinese meridian theory', price: '+$500' },
                { name: 'Retreat Design Workshop', desc: 'Learn to plan, price, and run your own yoga retreats — the business side', price: '+$350' }
            ],
            nextSteps: [
                { name: 'Thai Massage — Chiang Mai', desc: 'Add bodywork and therapeutic touch to your teaching toolkit' },
                { name: 'Freediving — Dahab', desc: 'Take your breath control into the ocean — pranayama meets the deep' },
                { name: 'Breathwork Instructor — WHM', desc: 'Expand your breathwork expertise into cold exposure and autonomic control' }
            ]
        }
    },
    {
        id: 'thai-massage-itm',
        name: 'ITM Thai Massage — Chiang Mai',
        category: 'wellness',
        tier: 'foundation',
        minDays: 14,
        maxDays: 21,
        minPrice: 3500,
        maxPrice: 4500,
        envTags: ['temple'],
        desireTags: ['certification', 'career', 'reset'],
        intensity: 1,
        summary: 'Original Thai massage tradition. ITM Level 1-3 certification from masters.',
        meta: '14-21 days · ~$3.5k-$4.5k · ITM Certification',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Level 1: Thai Massage Foundations', focus: 'Supine and prone positions, sen energy lines, palm and thumb techniques, full-body routine' },
                { phase: 'Week 2', title: 'Level 2: Advanced Techniques', focus: 'Side-lying work, seated massage, stretching sequences, elbow and knee techniques' },
                { phase: 'Week 3', title: 'Level 3: Therapeutic Applications', focus: 'Specific conditions, assessment skills, treatment planning, professional practice, certification' }
            ],
            included: [
                { name: 'Temple Meditation Mornings', desc: 'Daily sitting practice at a 700-year-old temple — the spiritual root of healing work' },
                { name: 'Thai Herbal Compress Workshop', desc: 'Make your own herbal compresses — lemongrass, turmeric, tamarind — and learn to use them in treatment' },
                { name: 'Northern Thai Cooking Class', desc: 'Learn khao soi, laab, and som tam from a local chef — the flavors that sustain you through training' },
                { name: 'Night Market Culture', desc: 'Evening explorations of Chiang Mai\'s legendary markets — handcraft, street food, local life' },
                { name: 'Buddhist Philosophy Sessions', desc: 'Understanding metta (loving-kindness) and how it informs the healer\'s intention' }
            ],
            addOns: [
                { name: 'Thai Foot Reflexology', desc: 'Additional certification in traditional foot massage — popular add-on for professional therapists', price: '+$250' },
                { name: 'Tok Sen Wooden Hammer Therapy', desc: 'Rare traditional technique using wooden mallets — rhythmic percussion along energy lines', price: '+$300' },
                { name: 'Hill Tribe Village Visit', desc: 'Full day with indigenous communities — their healing traditions, weaving, and way of life', price: '+$200' },
                { name: 'Elephant Sanctuary Day', desc: 'Ethical elephant care — bathing, feeding, and learning about conservation efforts', price: '+$150' }
            ],
            nextSteps: [
                { name: 'Yoga Alliance RYT-200 — Rishikesh', desc: 'Add yoga teaching to your bodywork practice — a natural combination' },
                { name: 'Breathwork Instructor — WHM', desc: 'Expand into breath and cold therapy — complementary healing modalities' },
                { name: 'Surf Instructor — Bali', desc: 'Stay in Southeast Asia and add a completely different physical discipline' }
            ]
        }
    },
    {
        id: 'breathwork-wim-hof',
        name: 'Wim Hof Method Instructor — Poland',
        category: 'wellness',
        tier: 'foundation',
        minDays: 7,
        maxDays: 14,
        minPrice: 4500,
        maxPrice: 6500,
        envTags: ['mountain'],
        desireTags: ['certification', 'reset', 'rare'],
        intensity: 3,
        summary: 'Train at the source with WHM Academy. Full instructor certification.',
        meta: '7-14 days · ~$4.5k-$6.5k · WHM Instructor',
        immersive: {
            curriculum: [
                { phase: 'Days 1-3', title: 'Fundamentals', focus: 'Breathing technique mastery, cold exposure progression, mindset training, commitment exercises' },
                { phase: 'Days 4-7', title: 'Advanced Practice', focus: 'Extended cold immersion, advanced breathing rounds, meditation, physical challenges in nature' },
                { phase: 'Days 8-10', title: 'Instructor Training', focus: 'Teaching methodology, safety protocols, group facilitation, class design, assessment' },
                { phase: 'Days 11-14', title: 'Certification', focus: 'Practice teaching, peer evaluation, written exam, practical demonstration, instructor qualification' }
            ],
            included: [
                { name: 'Ice Lake Immersion', desc: 'Progressive cold exposure in natural settings — from cold showers to frozen lake swims with your cohort' },
                { name: 'Mountain Hiking in Minimal Clothing', desc: 'Shirtless winter hikes — applying breath technique to real cold stress in the mountains' },
                { name: 'Meditation & Mindset Sessions', desc: 'Daily guided meditation focused on autonomic nervous system control and fear management' },
                { name: 'Fireside Community Evenings', desc: 'Cohort bonding around the fire — sharing breakthroughs, struggles, and the mental shifts happening' },
                { name: 'Science of Cold Adaptation', desc: 'Lectures on the physiology — brown fat, norepinephrine, immune response, inflammation reduction' }
            ],
            addOns: [
                { name: 'Extreme Cold Challenge', desc: 'Full-body ice immersion for extended duration with medical monitoring — push your record', price: '+$300' },
                { name: 'Sauna & Cold Contrast Therapy', desc: 'Traditional contrast bathing — heat to cold cycles for deep recovery and vascular training', price: '+$200' },
                { name: 'Breathwork & Yoga Fusion', desc: 'Two-day workshop combining WHM with yoga — the overlap of two ancient traditions', price: '+$250' },
                { name: 'Nature Survival Skills', desc: 'Full day of bushcraft — fire making, shelter building, foraging — primal skills in cold conditions', price: '+$200' }
            ],
            nextSteps: [
                { name: 'Freediving — Dahab', desc: 'Your breath control directly transfers to underwater depth — a natural next step' },
                { name: 'Yoga Alliance RYT-200 — Rishikesh', desc: 'Expand your practice into a full teaching system' },
                { name: 'Mountaineering — Chamonix', desc: 'Take your cold resilience to altitude — the ultimate testing ground' }
            ]
        }
    },
    // ======== WILDLIFE (FGASA) ========
    {
        id: 'safari-guide-fgasa',
        name: 'FGASA Safari Guide — South Africa',
        category: 'wildlife',
        tier: 'mastery',
        minDays: 55,
        maxDays: 55,
        minPrice: 9500,
        maxPrice: 12000,
        envTags: ['wild'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 2,
        summary: 'Industry gold standard. FGASA Level 1 Field Guide in the African bush.',
        meta: '55 days · ~$9.5k-$12k · FGASA Level 1',
        immersive: {
            curriculum: [
                { phase: 'Week 1-2', title: 'Bush Fundamentals', focus: 'Big Five identification, spoor tracking, vehicle handling, guest safety, rifle handling' },
                { phase: 'Week 3-4', title: 'Ecology & Botany', focus: 'Biomes, plant identification, predator-prey dynamics, geology, astronomy for navigation' },
                { phase: 'Week 5-6', title: 'Bird & Reptile Identification', focus: 'Birding by sight and call, reptile behavior, insect ecology — the smaller residents matter too' },
                { phase: 'Week 7-8', title: 'Professional Guiding & Exams', focus: 'Walk leading, drive management, storytelling for guests, written and practical FGASA exams' }
            ],
            included: [
                { name: 'Night Drives & Sleep-outs', desc: 'Spotlighting nocturnal animals and sleeping under stars in the bush — the Africa no tourist sees' },
                { name: 'Tracking on Foot', desc: 'Walk with experienced trackers following animal spoor — learn to read the bush like a book' },
                { name: 'Community Engagement', desc: 'Visit local schools and conservation projects — understand the human side of wildlife preservation' },
                { name: 'Bush Cooking', desc: 'Learn to prepare meals on an open fire — potjie, braai, and bush bread from scratch' },
                { name: 'Conservation Research', desc: 'Participate in ongoing research — camera trap data, animal census, habitat monitoring' },
                { name: 'Zulu Cultural Experience', desc: 'Traditional dance, storytelling, and indigenous plant knowledge from community elders' }
            ],
            addOns: [
                { name: 'Advanced Rifle Handling', desc: 'Extended firearms training for dangerous game areas — essential for lead guide roles', price: '+$500' },
                { name: 'Wildlife Photography Course', desc: 'Week with a professional wildlife photographer — DSLR technique, hide photography, post-processing', price: '+$600' },
                { name: 'Anti-Poaching Unit Ride-Along', desc: 'Spend two days with rangers — K9 units, tracking poachers, understanding the frontline of conservation', price: '+$400' },
                { name: 'Mokoro & Bushveld Extension', desc: 'Three-day canoe safari through wetlands — a completely different ecosystem and guiding skill', price: '+$500' }
            ],
            nextSteps: [
                { name: 'Marine Conservation — Great Barrier Reef', desc: 'From land to sea — apply your naturalist skills to ocean conservation' },
                { name: 'Mountaineering — Chamonix', desc: 'Trade bush horizons for mountain summits — another kind of wild expedition' },
                { name: 'Whitewater Kayak — Costa Rica', desc: 'Stay in the wild but add water — jungle rivers and rainforest ecology' }
            ]
        }
    },
    {
        id: 'marine-guide-padi',
        name: 'PADI Marine Conservation — Great Barrier Reef',
        category: 'wildlife',
        tier: 'foundation',
        minDays: 21,
        maxDays: 28,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['ocean', 'wild'],
        desireTags: ['certification', 'stories', 'career'],
        intensity: 2,
        summary: 'Largest coral reef on Earth. PADI Coral Reef Conservation specialty certification.',
        meta: '21-28 days · ~$6.5k-$8.5k · PADI Specialty',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Dive Skills & Reef Ecology', focus: 'Advanced buoyancy, reef navigation, coral identification, fish species recognition' },
                { phase: 'Week 2', title: 'Marine Science', focus: 'Water sampling, coral health assessment, species surveying, data collection methodology' },
                { phase: 'Week 3', title: 'Conservation Practice', focus: 'Reef restoration techniques, crown-of-thorns management, citizen science protocols' },
                { phase: 'Week 4', title: 'Specialty & Assessment', focus: 'PADI Coral Reef Conservation specialty dives, research presentation, certification' }
            ],
            included: [
                { name: 'Marine Research Station Access', desc: 'Work alongside scientists — your data goes into real ongoing studies' },
                { name: 'Indigenous Sea Country Knowledge', desc: 'Sessions with traditional custodians — learn how the reef was understood for 60,000 years before science' },
                { name: 'Mangrove & Seagrass Ecology', desc: 'Above-water field work — understanding the nursery habitats that support the reef' },
                { name: 'Turtle Monitoring', desc: 'Night beach patrols during nesting season — nest counting, hatchling tracking' },
                { name: 'Island Ecology Walks', desc: 'Guided hikes on reef islands — bird colonies, vegetation, and the link between land and sea' }
            ],
            addOns: [
                { name: 'Underwater Survey Certification', desc: 'Reef Check EcoDiver — globally recognized citizen science methodology', price: '+$400' },
                { name: 'Liveaboard Outer Reef Trip', desc: 'Three days on the outer barrier — pristine reef systems rarely visited by tourists', price: '+$600' },
                { name: 'Drone Reef Mapping', desc: 'Learn to use drones for aerial reef assessment — a growing field in marine conservation', price: '+$350' },
                { name: 'Marine Wildlife Photography', desc: 'Underwater photography focused on marine life identification and documentation', price: '+$400' }
            ],
            nextSteps: [
                { name: 'FGASA Safari Guide — South Africa', desc: 'From ocean conservation to land — complete your naturalist credentials' },
                { name: 'PADI Divemaster — Mediterranean', desc: 'Add professional dive leadership to your marine science skills' },
                { name: 'Freediving — Dahab', desc: 'Experience reefs on a single breath — a completely different relationship with the ocean' }
            ]
        }
    },
    // ======== ADVENTURE SPORTS (IFMGA, ACA) ========
    {
        id: 'mountaineering-chamonix',
        name: 'IFMGA Alpinism — Chamonix',
        category: 'adventure',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 7500,
        maxPrice: 9500,
        envTags: ['mountain'],
        desireTags: ['certification', 'stories', 'rare'],
        intensity: 3,
        summary: 'Birthplace of alpinism. Train with IFMGA guides toward aspirant certification.',
        meta: '21-28 days · ~$7.5k-$9.5k · IFMGA Aspirant',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Rock & Ice Fundamentals', focus: 'Roped movement, belay systems, crevasse rescue, crampon technique, ice axe arrest' },
                { phase: 'Week 2', title: 'Alpine Routes', focus: 'Mixed terrain climbing, route finding, objective hazard assessment, weather-based decision making' },
                { phase: 'Week 3', title: 'Summit Attempts', focus: 'Multi-day ascents, bivouac skills, altitude management, summit pushes on classic routes' },
                { phase: 'Week 4', title: 'Professional Skills & Assessment', focus: 'Client management, risk assessment frameworks, guiding ethics, aspirant exam preparation' }
            ],
            included: [
                { name: 'Alpine History Walking Tour', desc: 'Visit the sites where mountaineering was invented — the museums, monuments, and routes that started it all' },
                { name: 'Avalanche Safety Training', desc: 'Beacon, probe, and shovel — search and rescue drills in real snow conditions' },
                { name: 'Mountain Meteorology', desc: 'Read clouds, pressure drops, and wind patterns — life-saving skills above the tree line' },
                { name: 'High Altitude Cooking', desc: 'Cook nourishing meals at altitude with limited gear — fuel, hydration, and nutrition for performance' },
                { name: 'Alpine Photography', desc: 'Capture dramatic mountain landscapes — light, exposure, and composition at extreme altitude' }
            ],
            addOns: [
                { name: 'Ski Touring Extension', desc: 'Three-day backcountry ski mountaineering — ascend on skins, descend on skis through virgin snow', price: '+$600' },
                { name: 'Via Ferrata Masterclass', desc: 'Full day on protected climbing routes — exposed ridges and vertical ladders with dramatic views', price: '+$300' },
                { name: 'Trail Running Conditioning', desc: 'Guided runs through mountain trails — build the endurance that supports every summit attempt', price: '+$250' },
                { name: 'Mont Blanc Summit Attempt', desc: 'Additional guided summit attempt on the highest peak in the Alps — the ultimate test', price: '+$500' }
            ],
            nextSteps: [
                { name: 'Wim Hof Method — Poland', desc: 'Build cold resilience and breath control for higher altitude performance' },
                { name: 'FGASA Safari Guide — South Africa', desc: 'Trade mountain expeditions for bush expeditions — another kind of wild expertise' },
                { name: 'Whitewater Kayak — Costa Rica', desc: 'Take your mountain adventure instincts into jungle river gorges' }
            ]
        }
    },
    {
        id: 'kayak-instructor-costa-rica',
        name: 'ACA Whitewater Instructor — Costa Rica',
        category: 'adventure',
        tier: 'mastery',
        minDays: 21,
        maxDays: 28,
        minPrice: 5500,
        maxPrice: 7500,
        envTags: ['ocean', 'wild'],
        desireTags: ['certification', 'career', 'stories'],
        intensity: 3,
        summary: 'Class III-V rapids in the jungle. ACA Level 4 Whitewater Kayak Instructor.',
        meta: '21-28 days · ~$5.5k-$7.5k · ACA Level 4 Instructor',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Paddle & River Fundamentals', focus: 'Strokes, eddy turns, ferrying, river reading, swimming rapids, self-rescue' },
                { phase: 'Week 2', title: 'Class III-IV Progression', focus: 'Hole surfing, wave trains, technical rapids, advanced boat control in turbulent water' },
                { phase: 'Week 3', title: 'Rescue & Safety', focus: 'Swiftwater rescue, throw bag technique, pin extraction, rope systems, emergency response' },
                { phase: 'Week 4', title: 'Instructor Certification', focus: 'Teaching flat and moving water, student assessment, risk management, ACA practical exam' }
            ],
            included: [
                { name: 'Jungle Ecology Walks', desc: 'Guided hikes through the rainforest that lines the rivers — toucans, sloths, and medicinal plants' },
                { name: 'River Conservation Workshop', desc: 'Understand dam politics, watershed ecology, and why free-flowing rivers matter globally' },
                { name: 'Waterfall Swimming', desc: 'Rest day adventures to hidden waterfalls — swimming, cliff jumping, and jungle exploration' },
                { name: 'Local Coffee Farm Visit', desc: 'Bean-to-cup experience at a small farm — the crop that sustains the communities along the rivers' },
                { name: 'Night Jungle Hike', desc: 'Guided nocturnal walk — bioluminescent fungi, frogs, insects, and the sounds of the jungle after dark' }
            ],
            addOns: [
                { name: 'Sea Kayak Expedition', desc: 'Two-day coastal paddling trip — mangroves, marine wildlife, beach camping', price: '+$350' },
                { name: 'Swiftwater Rescue Certification', desc: 'Additional rescue technician certification — valuable for any river professional', price: '+$400' },
                { name: 'Canopy Zipline & Rappelling', desc: 'Full day in the treetops — aerial perspective on the rivers you paddle below', price: '+$200' },
                { name: 'Surf Kayaking Introduction', desc: 'Take your river skills to ocean waves — a natural crossover discipline', price: '+$300' }
            ],
            nextSteps: [
                { name: 'Kitesurfing Instructor — Tarifa', desc: 'Move from river to ocean — another water sport, another instructor credential' },
                { name: 'Mountaineering — Chamonix', desc: 'From river gorges to mountain summits — continue the adventure trajectory' },
                { name: 'FGASA Safari Guide — South Africa', desc: 'Stay in the wild but shift from water to land — another expedition profession' }
            ]
        }
    },
    // ======== SAGA EXPERIENCES ========
    {
        id: 'ocean-sailing-odyssey-saga',
        name: 'RYA Yachtmaster — 90-Day Saga',
        category: 'sailing',
        tier: 'saga',
        minDays: 90,
        maxDays: 90,
        minPrice: 28000,
        maxPrice: 28000,
        envTags: ['ocean'],
        desireTags: ['career', 'stories', 'certification'],
        intensity: 3,
        summary: 'Day Skipper through Yachtmaster Offshore. 90 days of ocean passages.',
        meta: '90 days · ~$28k · RYA Yachtmaster Offshore',
        immersive: {
            curriculum: [
                { phase: 'Month 1', title: 'Day Skipper', focus: 'Competent Crew through Day Skipper — coastal sailing, pilotage, anchoring, crew management' },
                { phase: 'Month 2', title: 'Coastal Skipper', focus: 'Offshore passages, heavy weather sailing, night navigation, passage planning across open water' },
                { phase: 'Month 3', title: 'Yachtmaster Offshore', focus: 'Multi-day passages, command decisions, crew leadership, commercial endorsement, final exam' }
            ],
            included: [
                { name: 'Celestial Navigation Full Course', desc: 'From basic star identification to plotting accurate fixes with a sextant — the old way' },
                { name: 'Diesel Engine Maintenance', desc: 'Strip, service, and rebuild a marine diesel — you need to fix it when the nearest port is 500 miles away' },
                { name: 'Multiple Sea Crossings', desc: 'Atlantic coast, Mediterranean, open ocean — each body of water teaches different lessons' },
                { name: 'Port Culture Immersion', desc: 'Every landfall is a cultural experience — fishing villages, marinas, and coastal towns across multiple countries' },
                { name: 'Storm Tactics & Heavy Weather', desc: 'Real heavy weather sailing — heaving to, lying ahull, deploying drogues, surviving what the sea sends' },
                { name: 'Marine VHF & Navigation Electronics', desc: 'Radar, AIS, chart plotters — master the modern systems alongside the traditional ones' }
            ],
            addOns: [
                { name: 'RYA Yachtmaster Ocean Theory', desc: 'Celestial navigation theory for Ocean qualification — the highest RYA certification', price: '+$800' },
                { name: 'STCW Basic Safety Training', desc: 'Commercial maritime safety — fire fighting, sea survival, first aid — required for professional crew', price: '+$600' },
                { name: 'Professional Drone Photography', desc: 'Capture your 90-day journey from the air — dramatic sailing footage across multiple seas', price: '+$500' },
                { name: 'Sailing Documentary Package', desc: 'Professional filmmaker documents your entire saga — edited into a personal film', price: '+$1,200' }
            ],
            nextSteps: [
                { name: 'Kitesurfing Instructor — Tarifa', desc: 'Master another form of wind-powered movement' },
                { name: 'PADI Divemaster — Mediterranean', desc: 'Go below the surface of the ocean you\'ve been sailing across' },
                { name: 'Freediving — Dahab', desc: 'From commanding a yacht to holding your breath — two very different ocean relationships' }
            ]
        }
    },
    {
        id: 'dive-pro-saga',
        name: 'PADI Instructor Development — 90-Day Saga',
        category: 'diving',
        tier: 'saga',
        minDays: 90,
        maxDays: 90,
        minPrice: 15000,
        maxPrice: 18000,
        envTags: ['ocean'],
        desireTags: ['career', 'certification', 'stories'],
        intensity: 2,
        summary: 'Open Water to PADI Instructor. Mediterranean training with IDC and IE.',
        meta: '90 days · ~$15k-$18k · PADI Open Water Scuba Instructor',
        immersive: {
            curriculum: [
                { phase: 'Month 1', title: 'Diver Development', focus: 'Open Water through Advanced — build every fundamental skill to automatic, effortless level' },
                { phase: 'Month 2', title: 'Professional Level', focus: 'Rescue Diver, Divemaster — emergency management, dive leadership, professional internship' },
                { phase: 'Month 3', title: 'Instructor Development', focus: 'IDC coursework, teaching presentations, confined water workshops, IE examination' }
            ],
            included: [
                { name: 'Marine Biology Deep Dives', desc: 'Weekly dives focused on species identification, behavior, and ecology — know what you\'re showing students' },
                { name: 'Underwater Photography & Video', desc: 'Build a professional portfolio throughout your 90 days — essential for marketing your future dive career' },
                { name: 'Dive Center Operations', desc: 'Work behind the counter — booking, equipment servicing, compressor operation, the business side' },
                { name: 'Multi-Site Experience', desc: 'Dive across multiple locations — shore dives, boat dives, drift dives, night dives, wreck dives' },
                { name: 'First Aid Instructor Certification', desc: 'EFR Instructor — teach emergency first response alongside your dive courses' },
                { name: 'Dive Travel & Career Networking', desc: 'Connect with dive operators worldwide — many graduates step directly into tropical positions' }
            ],
            addOns: [
                { name: 'Specialty Instructor Bundle', desc: 'Teach 5 popular specialties — Deep, Nitrox, Navigation, Night, Wreck — more courses to offer', price: '+$800' },
                { name: 'Rebreather Introduction', desc: 'Two-day introduction to closed-circuit diving — the frontier of recreational diving technology', price: '+$600' },
                { name: 'Freediving Cross-Training', desc: 'AIDA 2 certification alongside your PADI work — dual-discipline dive professional', price: '+$500' },
                { name: 'Documentary Film of Your Journey', desc: 'Professional underwater filmmaker captures your 90-day transformation into an instructor', price: '+$1,000' }
            ],
            nextSteps: [
                { name: 'Cave Diver — Yucatan Cenotes', desc: 'Take your teaching skills into overhead environments' },
                { name: 'Marine Conservation — Great Barrier Reef', desc: 'Apply your professional dive skills to conservation research' },
                { name: 'RYA Day Skipper — Greece', desc: 'Add surface skills to your underwater credentials — work on any boat, above or below' }
            ]
        }
    },
    // ======== NEW CULINARY EXPERIENCES ========
    {
        id: 'ferrandi-pastry-paris',
        name: 'Ferrandi French Pastry — Paris',
        category: 'culinary',
        tier: 'mastery',
        minDays: 30,
        maxDays: 60,
        minPrice: 12000,
        maxPrice: 18000,
        envTags: ['city'],
        desireTags: ['certification', 'career', 'creative'],
        intensity: 2,
        summary: 'The school that trained Paris\'s finest pastry chefs. Ferrandi professional certificate.',
        meta: '1-2 months · ~$12k-$18k · Ferrandi Certificate',
        immersive: {
            curriculum: [
                { phase: 'Week 1-2', title: 'Classical Foundations', focus: 'Tarts, pâte à choux, puff pastry, meringues — the building blocks of French patisserie' },
                { phase: 'Week 3-4', title: 'Chocolate & Confections', focus: 'Tempering, bonbon making, chocolate sculpture, caramel work, confiserie techniques' },
                { phase: 'Week 5-6', title: 'Contemporary Creations', focus: 'Modern entremets, mirror glazes, flavor architecture, individual pastries, plated desserts' },
                { phase: 'Week 7-8', title: 'Professional Execution', focus: 'Production planning, window display, timed service, signature creation, final certification' }
            ],
            included: [
                { name: 'Parisian Pastry Architecture Tour', desc: 'Study the geometry of great pastry shops — how space, light, and display elevate the product' },
                { name: 'Butter & Dairy Farm Visit', desc: 'Meet the producers behind the best butter in the world — taste the difference terroir makes in pastry' },
                { name: 'French Bread Fundamentals', desc: 'Baguette and viennoiserie mornings — the other side of the French baking tradition' },
                { name: 'Tea & Pastry Pairing', desc: 'Sessions with a tea sommelier — how different teas complement different textures and flavors' },
                { name: 'Parisian Café Culture', desc: 'Evening explorations of legendary cafés — where pastry meets literature, art, and conversation' }
            ],
            addOns: [
                { name: 'Ice Cream & Sorbet Intensive', desc: 'Two-day frozen dessert workshop — churning, stabilization, modern techniques, seasonal flavors', price: '+$350' },
                { name: 'Pastry Shop Business Plan', desc: 'Full-day session with a pastry entrepreneur — costing, location, branding, operations', price: '+$400' },
                { name: 'Food Styling & Photography', desc: 'Professional shoot of your best creations — portfolio-ready images for your career', price: '+$300' },
                { name: 'Versailles & Royal Pastry History', desc: 'Full-day tour connecting French pastry history to royal courts and national identity', price: '+$250' }
            ],
            nextSteps: [
                { name: 'Le Cordon Bleu Pastry — Paris', desc: 'Add the other Parisian diploma to your credentials — dual-school trained' },
                { name: 'WSET Level 3 — Bordeaux', desc: 'Pair your pastry skills with wine knowledge — dessert pairing is an art' },
                { name: 'Italian Cuisine — Parma', desc: 'Cross the Alps from sweet to savory — expand your range completely' }
            ]
        }
    },
    {
        id: 'modernist-cuisine-barcelona',
        name: 'Modernist Cuisine — Barcelona',
        category: 'culinary',
        tier: 'mastery',
        minDays: 30,
        maxDays: 60,
        minPrice: 12000,
        maxPrice: 18000,
        envTags: ['city'],
        desireTags: ['certification', 'career', 'rare'],
        intensity: 2,
        summary: 'Molecular gastronomy and avant-garde techniques. Hofmann Barcelona professional diploma.',
        meta: '1-2 months · ~$12k-$18k · Hofmann Diploma',
        immersive: {
            curriculum: [
                { phase: 'Week 1-2', title: 'Science Foundations', focus: 'Spherification, gelification, emulsification — the chemistry behind modern cuisine' },
                { phase: 'Week 3-4', title: 'Texture & Temperature', focus: 'Sous vide mastery, foams, airs, liquid nitrogen, cryogenic techniques, dehydration' },
                { phase: 'Week 5-6', title: 'Creative Composition', focus: 'Flavor pairing theory, multi-sensory plating, aroma integration, deconstructed classics' },
                { phase: 'Week 7-8', title: 'Professional Innovation', focus: 'Menu development, R&D methodology, presentation to jury, signature dish, final diploma' }
            ],
            included: [
                { name: 'Market Sourcing & Terroir', desc: 'Early morning at the legendary food market — how the best modernist chefs start with the best raw ingredients' },
                { name: 'Wine & Avant-Garde Pairing', desc: 'Sessions matching experimental dishes with natural wines, sherries, and unexpected beverages' },
                { name: 'Architecture & Design Walks', desc: 'Explore the city\'s architectural heritage — understand how design thinking applies to plating and presentation' },
                { name: 'Food Science Lectures', desc: 'Guest scientists explain the physics behind your techniques — why it works, not just how' },
                { name: 'Fermentation Lab', desc: 'Hands-on fermentation projects — kombuchas, vinegars, misos — the living ingredient trend' }
            ],
            addOns: [
                { name: 'Avant-Garde Restaurant Stage', desc: 'Two-day observation in a modernist kitchen — see how a creative team develops new dishes', price: '+$500' },
                { name: 'Olive Oil Masterclass', desc: 'Full day in the olive groves — varieties, pressing, tasting, and cooking applications', price: '+$300' },
                { name: 'Cocktail & Mixology Fusion', desc: 'Molecular cocktail workshop — apply your kitchen techniques to the bar', price: '+$350' },
                { name: 'Food Tech & Innovation Seminar', desc: 'Half-day on 3D food printing, lab-grown proteins, and the future of gastronomy', price: '+$400' }
            ],
            nextSteps: [
                { name: 'Italian Cuisine — Parma', desc: 'Ground your modernist skills in classical tradition — the best innovators know the rules first' },
                { name: 'Indigenous Mexican Cuisine — Oaxaca', desc: 'Ancient techniques that pre-date modernism — fermentation, smoking, earth ovens' },
                { name: 'WSET Level 3 — Bordeaux', desc: 'Add beverage expertise to your avant-garde food skills' }
            ]
        }
    },
    {
        id: 'indigenous-mexican-oaxaca',
        name: 'Indigenous Mexican Cuisine — Oaxaca',
        category: 'culinary',
        tier: 'foundation',
        minDays: 21,
        maxDays: 28,
        minPrice: 6500,
        maxPrice: 8500,
        envTags: ['city'],
        desireTags: ['certification', 'stories', 'rare'],
        intensity: 2,
        summary: 'Pre-Hispanic techniques with local masters. Mezcal, mole, and ancient traditions in the culinary heart of Mexico.',
        meta: '21-28 days · ~$6.5k-$8.5k · CESSA Professional Certificate',
        immersive: {
            curriculum: [
                { phase: 'Week 1', title: 'Ancestral Foundations', focus: 'Nixtamalization, grinding on metate, mole basics, dried chili varieties and toasting techniques' },
                { phase: 'Week 2', title: 'Regional Traditions', focus: 'Seven moles of Oaxaca, tamales, tlayudas, memelas — each village has its own tradition' },
                { phase: 'Week 3', title: 'Fermentation & Spirits', focus: 'Mezcal production, pulque, tepache, chocolate from cacao — the fermented traditions' },
                { phase: 'Week 4', title: 'Market & Service', focus: 'Market cooking, menu creation with local ingredients, traditional feast preparation, certification' }
            ],
            included: [
                { name: 'Mezcal Palenque Visit', desc: 'Small-batch mezcal production — agave roasting in earth ovens, stone milling, clay pot distillation' },
                { name: 'Cacao & Chocolate Workshop', desc: 'Bean-to-cup chocolate making using pre-Hispanic techniques — grinding, spicing, frothing' },
                { name: 'Indigenous Market Culture', desc: 'Guided tours of village markets that have operated the same way for centuries — barter, specialty ingredients, seasonal rhythms' },
                { name: 'Textile & Craft Visits', desc: 'Watch traditional weaving, pottery, and woodcarving — the broader craft culture that surrounds the food' },
                { name: 'Milpa Farm Visit', desc: 'The ancient corn-bean-squash growing system — understand the agriculture behind the cuisine' }
            ],
            addOns: [
                { name: 'Mezcal Sommelier Workshop', desc: 'Two-day deep dive into agave varieties, production methods, and professional tasting technique', price: '+$350' },
                { name: 'Day of the Dead Cooking', desc: 'Prepare traditional offerings and feast food — bread of the dead, mole negro, ritual chocolate', price: '+$250' },
                { name: 'Zapotec Archaeological Tour', desc: 'Full-day visit to ancient sites — connect the food traditions to the civilizations that created them', price: '+$200' },
                { name: 'Home Cooking with Abuela', desc: 'Full day cooking with a grandmother in her village kitchen — recipes passed through generations', price: '+$150' }
            ],
            nextSteps: [
                { name: 'Modernist Cuisine — Barcelona', desc: 'Take ancient techniques into contemporary innovation — many top modernist chefs study Oaxaca first' },
                { name: 'WSET Level 3 — Bordeaux', desc: 'Formalize your beverage knowledge from mezcal to wine' },
                { name: 'Sake Sommelier — Niigata', desc: 'Another ancient fermentation culture on the other side of the world — fascinating parallels' }
            ]
        }
    }
];

window.ET_PERSONAS = {
    sailing: {
        title: 'Ocean Tactician',
        subtitle: 'You think in wind shifts and watch rotations. The sea is a moving chessboard.'
    },
    diving: {
        title: 'Blue Depth Seeker',
        subtitle: 'You know the best things happen below the surface.'
    },
    wellness: {
        title: 'Quiet Storm',
        subtitle: 'You want the kind of calm that survives real life, not just retreats.'
    },
    culinary: {
        title: 'Kitchen Alchemist',
        subtitle: 'Precise, obsessive, willing to repeat the same cut a thousand times.'
    },
    adventure: {
        title: 'Edgewalker',
        subtitle: 'You chase the edge to see who you become on the other side of fear.'
    },
    wildlife: {
        title: 'Wild Guide',
        subtitle: 'You\'d rather track animals than trends.'
    }
};
