/* Real, cited public ratings per discipline’s best school — the trust layer.
 * RULE (CLAUDE.md): real data only, source named + linked, NEVER fabricated.
 * Researched 2026-06-17 via the et-school-ratings workflows (Google/TripAdvisor).
 * found=false schools carry whyPick only (no star number) — honest by design.
 * Keyed by discipline id; destId = the exact destination the rating belongs to.
 * 99 disciplines · 61 with a verified public star rating. */
window.ET_RATINGS = {
  "cave-and-technical-diving": {
    "destId": "cave-and-technical-diving--high-springs-cave-country-north-florida",
    "school": "Global Underwater Explorers (GUE)",
    "place": "High Springs, North Florida, United States",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "GUE is a globally standardized agency where every diver learns identical theory, skills, and equipment configuration, and it is widely recognized for the rigor and consistency of its technical and cave-diving curricula taught from its High Springs base near the North Florida cave systems."
  },
  "sailing-and-yachtmaster": {
    "destId": "sailing-and-yachtmaster--the-solent-cowes-and-hamble",
    "school": "UKSA (United Kingdom Sailing Academy)",
    "place": "Cowes, Isle of Wight, United Kingdom",
    "stars": 4.4,
    "count": 7,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.co.uk/Hotel_Review-g503888-d17463441-Reviews-UKSA-Cowes_Isle_of_Wight_England.html",
    "whyPick": "UKSA is a registered maritime charity in Cowes delivering MCA-recognised professional crew qualifications, including RYA Yachtmaster training and its Superyacht Cadetship, on its own training fleet."
  },
  "alpinism-and-mountaineering": {
    "destId": "alpinism-and-mountaineering--chamonix-mont-blanc",
    "school": "Chamonix Experience (Chamex)",
    "place": "Chamonix-Mont-Blanc, France",
    "stars": 4.8,
    "count": 202,
    "source": "Google",
    "url": "https://wanderlog.com/place/details/4823728/chamonix-experience",
    "whyPick": "Established in 1996, it runs its guided alpinism and Mont Blanc ascents with a team of more than 20 fully IFMGA/UIAGM-certified mountain guides, the international standard for professional alpine guiding."
  },
  "ski-touring-and-splitboard": {
    "destId": "ski-touring-and-splitboard--chamonix-verbier-haute-route",
    "school": "Compagnie des Guides de Chamonix",
    "place": "Chamonix, France",
    "stars": 4.1,
    "count": 70,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187261-d8471945-Reviews-Compagnie_des_Guides_de_Chamonix-Chamonix_Haute_Savoie_Auvergne_Rhone_Alpes.html",
    "whyPick": "Founded in 1821, it is the oldest and largest association of certified mountain guides in the world, with reviewers consistently praising the guides' deep terrain knowledge and patience on backcountry outings."
  },
  "paragliding": {
    "destId": "paragliding--mieussy-and-annecy",
    "school": "École de Parapente Les Choucas",
    "place": "Mieussy, France",
    "stars": 5,
    "count": 9,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g2205373-d10398899-Reviews-Ecole_de_Parapente_les_Choucas-Mieussy_Haute_Savoie_Auvergne_Rhone_Alpes.html",
    "whyPick": "It is a labelled French Free Flight (EFVL) school with state-diploma-holding instructors, based in Mieussy, the village where paragliding was first flown in 1978."
  },
  "french-pastry-and-patisserie": {
    "destId": "french-pastry-and-patisserie--paris",
    "school": "FERRANDI Paris",
    "place": "Paris, France",
    "stars": 4.5,
    "count": 28,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187147-d12392307-Reviews-FERRANDI_Paris-Paris_Ile_de_France.html",
    "whyPick": "Founded in 1920 by the Paris Ile-de-France Chamber of Commerce, FERRANDI Paris awards recognised professional pastry and culinary diplomas and is widely cited for hands-on training with working chefs and strong placement into Michelin-starred kitchens."
  },
  "bread-and-boulangerie": {
    "destId": "bread-and-boulangerie--paris",
    "school": "École de Boulangerie et de Pâtisserie de Paris (EBP)",
    "place": "Paris, France",
    "stars": 4.3,
    "count": 92,
    "source": "Google",
    "url": "https://ecole-de-cuisine.autour-de-moi.com/ecole-de-boulangerie-et-de-patisserie-de-paris-ebp-paris-2273205.html",
    "whyPick": "Founded in 1929 and QUALIOPI-certified, EBP trains students toward recognised French state diplomas (CAP Boulanger/Pâtissier, BP, Bac Pro, BTM) through apprenticeship in its Bercy workshops, and reviewers consistently praise its passionate, knowledgeable instructors and well-equipped labs."
  },
  "chocolate-and-confectionery": {
    "destId": "chocolate-and-confectionery--tain-l-hermitage",
    "school": "École Valrhona / École Chocolat",
    "place": "Tain-l'Hermitage, France",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is the original campus (founded 1989 by Valrhona with pastry chef Frédéric Bau) of a professional chocolate and pastry school that is Qualiopi-certified in France and teaches alongside the brand's historic headquarters, with sister campuses in Paris, Tokyo, Brooklyn and Dubai."
  },
  "viennoiserie": {
    "destId": "viennoiserie--paris",
    "school": "FERRANDI Paris",
    "place": "Paris, France",
    "stars": 4.5,
    "count": 28,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187147-d12392307-Reviews-FERRANDI_Paris-Paris_Ile_de_France.html",
    "whyPick": "FERRANDI Paris is a culinary and hospitality grande école founded in 1920 by the Paris Île-de-France Chamber of Commerce, with documented Michelin-starred restaurant partnerships and internships that feed directly into professional kitchens."
  },
  "classical-french-cuisine": {
    "destId": "classical-french-cuisine--paris",
    "school": "Le Cordon Bleu Paris",
    "place": "Paris, France",
    "stars": 4.5,
    "count": 220,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187147-d190904-Reviews-Le_Cordon_Bleu-Paris_Ile_de_France.html",
    "whyPick": "It is the founding campus of the institution that issues the globally recognized Grand Diplôme in classical French cuisine and pâtisserie, with hands-on technique training led by working Michelin-experienced chef instructors."
  },
  "woodworking-and-joinery": {
    "destId": "woodworking-and-joinery--okayama-tokyo-sashimono-and-kumiko",
    "school": "The Somakosha School",
    "place": "Okayama, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is the teaching arm of Somakosha, a working traditional Japanese carpentry firm founded in 2012 and led by head carpenters Kohei Yamamoto and Jon Stollenmeyer, so students learn tool sharpening, layout and hand-cut joinery directly from practicing carpenters who are notably open to foreign apprentices."
  },
  "blacksmithing-and-bladesmithing": {
    "destId": "blacksmithing-and-bladesmithing--seki-gifu",
    "school": "Workshop Kurogane (Nobuya Hayashi)",
    "place": "Kochi Prefecture, Japan",
    "stars": 5,
    "count": 11,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g1023359-d3186522-Reviews-Workshop_Kurogane-Shimanto_Kochi_Prefecture_Shikoku.html",
    "whyPick": "Master smith Nobuya Hayashi completed a ten-year apprenticeship before taking over the forge in 2011 and teaches hands-on knife-making in fluent English using the ancient tatara tradition, smelting his own tamahagane steel from locally collected iron sand."
  },
  "painting-and-fine-art": {
    "destId": "painting-and-fine-art--florence",
    "school": "The Florence Academy of Art",
    "place": "Florence, Italy",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founded in 1991 by American painter Daniel Graves, it is one of the most established ateliers for classical drawing, painting, and sculpture, training students in disciplined academic realism through a structured multi-year program."
  },
  "photography": {
    "destId": "photography--paris",
    "school": "Spéos Paris Photographic Institute",
    "place": "Paris, France",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Spéos awards the French government-recognized RNCP Level 7 (Master's-equivalent) professional photographer title and runs structured programs taught in partnership with Magnum Photos for documentary photography and Agence France-Presse for photojournalism."
  },
  "filmmaking": {
    "destId": "filmmaking--paris",
    "school": "3iS International School of Creative Arts",
    "place": "Paris, France",
    "stars": 4,
    "count": 57,
    "source": "Custplace",
    "url": "https://fr.custplace.com/3is",
    "whyPick": "3iS (Institut International de l'Image et du Son, founded 1988) runs one of Europe's largest creative-industries campuses, so students train in cinema, sound, and audiovisual production on professional-grade equipment and real productions rather than in classrooms alone."
  },
  "ecstatic-dance-and-movement": {
    "destId": "ecstatic-dance-and-movement--big-sur-esalen-institute-california",
    "school": "Esalen Institute",
    "place": "Big Sur, California, United States",
    "stars": 4.2,
    "count": 258,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g240329-d107006-Reviews-Esalen_Institute-Big_Sur_California.html",
    "whyPick": "Founded in 1962, Esalen is the original home of the Human Potential Movement and Gestalt practice (Fritz Perls taught here), running structured 3-, 5-, and 7-day workshops on its Big Sur clifftop campus with cliffside hot-spring baths and organic farm-to-table meals included."
  },
  "muay-thai": {
    "destId": "muay-thai--bangkok",
    "school": "Petchyindee Kingdom",
    "place": "Bangkok, Thailand",
    "stars": 4.7,
    "count": 19,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Hotel_Review-g293916-d10006316-Reviews-Petchyindee_Kingdom-Bangkok.html",
    "whyPick": "It is the in-house training facility of the Petchyindee stable, founded in 1975 and behind world champions such as Sagat Petchyindee, so coaching comes from one of Muay Thai's most established Bangkok lineages rather than a generic tourist gym."
  },
  "bharatanatyam-indian-classical-dance": {
    "destId": "bharatanatyam-indian-classical-dance--chennai",
    "school": "Kalakshetra Foundation",
    "place": "Chennai, India",
    "stars": 4.6,
    "count": 43,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.in/Attraction_Review-g304556-d2706072-Reviews-Kalakshetra_Dance_School-Chennai_Madras_Chennai_District_Tamil_Nadu.html",
    "whyPick": "Founded in 1936 by Bharatanatyam pioneer Rukmini Devi Arundale, Kalakshetra is a Parliament-recognized Institute of National Importance that grants formal diploma courses in Bharatanatyam through its Rukmini Devi College of Fine Arts, preserving the rigorous classical training tradition reviewers consistently single out."
  },
  "flamenco-and-dance": {
    "destId": "flamenco-and-dance--jerez-de-la-frontera",
    "school": "Fundación Cristina Heeren de Arte Flamenco",
    "place": "Seville, Spain",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "A non-profit conservatory founded in 1996 that trains students professionally across all three flamenco disciplines — cante (singing), baile (dance), and guitar — in the Triana district, the historic birthplace of flamenco, and has been recognized with the Spanish Ministry of Culture's Order of Alfonso X el Sabio."
  },
  "brazilian-jiu-jitsu": {
    "destId": "brazilian-jiu-jitsu--rio-de-janeiro",
    "school": "Gracie Barra (Barra da Tijuca HQ)",
    "place": "Rio de Janeiro, Brazil",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "This is the original Gracie Barra academy (GB Rio Matriz, Av. Érico Veríssimo 970, Jardim Oceânico), founded in 1986 by Carlos Gracie Jr. — the source school of one of the largest BJJ lineages in the world, where its standardized curriculum and faculty originated."
  },
  "pilates": {
    "destId": "pilates--new-york-city",
    "school": "Power Pilates",
    "place": "New York City, United States",
    "stars": 4.4,
    "count": 70,
    "source": "Google",
    "url": "https://trustanalytica.org/us/ny/new-york/reviews/power-pilates",
    "whyPick": "Power Pilates is a classical Pilates teacher-training school whose 600-hour certification curriculum descends directly from the Romana Kryzanowska lineage of Joseph Pilates' original method, and it has certified over 7,000 instructors worldwide since 1997."
  },
  "vipassana-and-meditation": {
    "destId": "vipassana-and-meditation--igatpuri-dhamma-giri",
    "school": "Dhamma Giri Vipassana International Academy",
    "place": "Igatpuri, India",
    "stars": 4.8,
    "count": 3052,
    "source": "Google",
    "url": "https://wanderlog.com/place/details/6434/dhamma-giri-vipassana-international-academy",
    "whyPick": "Dhamma Giri is the headquarters of the Vipassana Research Institute and the principal teaching center founded by S.N. Goenka in 1976, anchoring the worldwide Vipassana network, and runs its 10-day residential courses entirely on voluntary donation with no fee for tuition, lodging, or meals."
  },
  "sound-healing": {
    "destId": "sound-healing--kathmandu-pokhara",
    "school": "Pragya Yoga School",
    "place": "Kathmandu, Nepal",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is a Yoga Alliance Registered Yoga School in Budhanilkantha/Thamel offering certified 200/300/500-hour teacher training plus dedicated sound-healing and singing-bowl therapy courses, led by founder and certified yoga therapist Yogesh Pokhrel."
  },
  "thai-massage": {
    "destId": "thai-massage--chiang-mai",
    "school": "Old Medicine Hospital (OMH) Thai Massage School",
    "place": "Chiang Mai, Thailand",
    "stars": 4.8,
    "count": 181,
    "source": "Google (via Wanderlog)",
    "url": "https://wanderlog.com/place/details/5711104/old-medicine-hospital-thai-massage-school-shivagakomarpaj",
    "whyPick": "Founded in 1962 by Ajahn Sintorn Chaichakan as the original source of Northern-style Thai massage, the school still teaches the Shivagakomarpaj lineage under his family and issues a recognized completion certificate after its structured courses."
  },
  "tai-chi-and-qigong": {
    "destId": "tai-chi-and-qigong--chenjiagou-chen-village-wen-county",
    "school": "Chenjiagou Tai Chi School",
    "place": "Chen Village, Henan, China",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is the official school of the Chen-style birthplace, formally founded by Wen County in 1982 under the four masters known as the \"Four Buddha Warrior Attendants\" (Chen Xiaowang, Chen Zhenglei, Wang Xian, Zhu Tiancai) and now led by head coach Wang Yan, so you train the original Chen lineage where it began."
  },
  "hatha-and-vinyasa-yoga": {
    "destId": "hatha-and-vinyasa-yoga--rishikesh",
    "school": "Parmarth School of Yoga (Parmarth Niketan Ashram)",
    "place": "Rishikesh, India",
    "stars": 4.6,
    "count": 23054,
    "source": "Google (Maps)",
    "url": "https://wanderlog.com/place/details/6766/parmarth-niketan-ashram",
    "whyPick": "Parmarth School of Yoga is the dedicated training arm of the Parmarth Niketan Ashram on the Ganges, running structured 200-hour Yoga Teacher Training courses and hosting the week-long International Yoga Festival each March under spiritual head HH Pujya Swami Chidanand Saraswati."
  },
  "ashtanga-yoga": {
    "destId": "ashtanga-yoga--mysore-gokulam",
    "school": "Sharath Yoga Centre (SYC)",
    "place": "Mysore (Gokulam), India",
    "stars": 4.7,
    "count": 55,
    "source": "Google (via AshtangaList directory)",
    "url": "https://ashtangalist.com/shalas/sharath-yoga-centre",
    "whyPick": "SYC is the direct continuation of the K. Pattabhi Jois Ashtanga lineage (formerly KPJAYI), run by the Jois family and recognized as the authoritative home of traditional Mysore-style Ashtanga, drawing students from over 70 countries."
  },
  "pranayama-and-breathwork": {
    "destId": "pranayama-and-breathwork--lonavla",
    "school": "Kaivalyadhama Yoga Institute",
    "place": "Lonavla, India",
    "stars": 4.1,
    "count": 75,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g608474-d10543205-Reviews-Kaivalyadhama-Lonavala_Pune_District_Maharashtra.html",
    "whyPick": "Founded in 1924 by Swami Kuvalayananda, it is the world's oldest scientific yoga research institute and pioneered laboratory study of yogic breathing, giving it deep credibility for pranayama and breathwork instruction."
  },
  "iyengar-yoga": {
    "destId": "iyengar-yoga--pune",
    "school": "Ramamani Iyengar Memorial Yoga Institute (RIMYI)",
    "place": "Pune, India",
    "stars": 4.5,
    "count": 218,
    "source": "Google (via Wanderlog aggregation, labeled Google Maps source)",
    "url": "https://wanderlog.com/place/details/15195458/ramamani-iyengar-memorial-yoga-institute",
    "whyPick": "RIMYI is the founding home of Iyengar Yoga, established in Pune in 1975 by B.K.S. Iyengar himself and named for his wife Ramamani, making it the source institute where the global Iyengar method and its teacher-certification lineage originate."
  },
  "reiki-and-energy-healing": {
    "destId": "reiki-and-energy-healing--kyoto-mount-kurama",
    "school": "Jikiden Reiki Institute (Jikiden Reiki Kenkyukai)",
    "place": "Kyoto, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is the world head office and lineage origin of Jikiden Reiki, founded in Kyoto by Chiyoko Yamaguchi and her son Tadao Yamaguchi to teach Reiki in the unadapted Japanese form Chiyoko learned directly from Dr. Chujiro Hayashi in 1938."
  },
  "tantra-and-conscious-intimacy": {
    "destId": "tantra-and-conscious-intimacy--khajuraho",
    "school": "Tantra Essence (Ma Ananda Sarita)",
    "place": "Khajuraho, India",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founder Ma Ananda Sarita was personally initiated into Tantra by Osho and has taught for over five decades; Tantra Essence is a touring school (not a fixed Khajuraho campus) whose Khajuraho program is a 7-day residential retreat built around the city's tantric temples — its only public \"ratings\" are first-party testimonials on its own site, with no verifiable Google/TripAdvisor star rating for this location."
  },
  "ayurveda": {
    "destId": "ayurveda--kottakkal-and-kerala-backwaters",
    "school": "Kottakkal Ayurveda Academy",
    "place": "Kottakkal, Kerala, India",
    "stars": 3.9,
    "count": 39,
    "source": "Justdial",
    "url": "https://www.justdial.com/Malappuram/Kottakkal-Ayurveda-Academy-Kottakkal/9999PX483-X483-140215063358-Y4G2_BZDET",
    "whyPick": "Founded in 1999 and led by principal Dr. Sooraj (BAMS) with a BAMS/BAMS-MD advisory board, the academy runs NSDC- and NIOS-affiliated certificate courses in classical Ayurveda Panchakarma and therapy, and reviewers single out its hands-on Panchakarma and spa-therapy training."
  },
  "traditional-spa-and-hydrotherapy": {
    "destId": "traditional-spa-and-hydrotherapy--budapest",
    "school": "Semmelweis University (Faculty of Health Sciences, physiotherapy & balneotherapy)",
    "place": "Budapest, Hungary",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Semmelweis University's Faculty of Health Sciences (ETK) is the second-largest faculty of an institution that Times Higher Education and QS rank among Central Europe's top universities, and it issues state-recognised physiotherapy degrees that anchor Hungary's deep balneotherapy and thermal-spa rehabilitation tradition."
  },
  "reflexology-and-shiatsu": {
    "destId": "reflexology-and-shiatsu--tokyo",
    "school": "Iokai Shiatsu Center",
    "place": "Tokyo, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founded in 1968 by Shizuto Masunaga, the originator of Zen / Keiraku (Meridian) Shiatsu, and now directed by his son Haruhiko Masunaga, the center teaches Masunaga's own meridian-based method directly from the founding lineage."
  },
  "cold-exposure-wim-hof-method": {
    "destId": "cold-exposure-wim-hof-method--przesieka-karkonosze-mountains",
    "school": "Wim Hof Method Academy",
    "place": "Przesieka, Karkonosze Mountains, Poland",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Przesieka is the original Wim Hof Method training ground: Hof bought a house in this Karkonosze village and runs the official multi-day \"Poland Winter Expedition\" and the annual certification course for WHM instructors here, with cold-exposure sessions led at the nearby Podgórna Waterfall, the only Karkonosze waterfall used for winter swimming."
  },
  "kundalini-yoga": {
    "destId": "kundalini-yoga--espanola-new-mexico",
    "school": "Kundalini Research Institute (KRI)",
    "place": "Espanola, New Mexico, United States",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "KRI is the official nonprofit (founded 1972 by Yogi Bhajan) that issues the globally recognized KRI-certified Kundalini Yoga teacher diploma and stewards the KRI International Teacher Training Academy curriculum used by schools worldwide."
  },
  "scuba-diving": {
    "destId": "scuba-diving--marseille-and-bandol-calanques",
    "school": "Au-Delà Plongée Marseille (PADI 5-Star IDC Center)",
    "place": "Marseille (Calanques), France",
    "stars": 4.9,
    "count": 36,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g1226380-d12514991-Reviews-Au_Dela_Plongee-Le_Rove_Bouches_du_Rhone_Provence_Alpes_Cote_d_Azur.html",
    "whyPick": "A PADI 5-Star IDC Center running full PADI and CMAS instructor-level training (IDC and MSDT) from its own Côte Bleue calanque, where reviewers consistently praise the small, family-scale operation and the personalized, safety-focused instruction over factory-style dive shops."
  },
  "freediving": {
    "destId": "freediving--apnea-academy-italian-mediterranean",
    "school": "Apnea Academy (Umberto Pelizzari)",
    "place": "Apnea Academy (Italy-based; instructor course held in the Mediterranean/Red Sea), Italy",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Apnea Academy is the freediving teaching and certification body founded in 1995 by Umberto Pelizzari, a 17-time world-record holder across all freediving disciplines, and its instructor course is taught by Pelizzari himself alongside a faculty of elite freedivers, making it one of the sport's most authoritative instructor pathways."
  },
  "spearfishing": {
    "destId": "spearfishing--c-te-d-azur-cassis-to-antibes",
    "school": "CREPS PACA (Antibes)",
    "place": "Antibes, Côte d'Azur, France",
    "stars": 4.4,
    "count": null,
    "source": "Google Maps (via centre.contact aggregator, which syncs ratings directly from Google Maps)",
    "url": "https://centre-de-formation.centre.contact/creps-paca-site-d-antibes-4430802.html",
    "whyPick": "CREPS PACA Antibes is the French state sports ministry's accredited training centre that delivers the official BPJEPS \"Plongée subaquatique sans scaphandre\" diploma — the only recognised professional qualification in France for teaching freediving and spearfishing (chasse sous-marine), an 819-hour course run at the Fort Carré site on the Mediterranean."
  },
  "surfing": {
    "destId": "surfing--waikiki-oahu",
    "school": "Hans Hedemann Surf School",
    "place": "Waikiki, Oahu, United States",
    "stars": 4.7,
    "count": 1350,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g60982-d1096631-Reviews-Hans_Hedemann_Surf_School-Honolulu_Oahu_Hawaii.html",
    "whyPick": "Founded by Hans Hedemann, who competed on the world professional surf tour from 1978 to 1990 and reached a #4 world ranking in 1983; reviewers consistently credit the instructors' patience and clear coaching for getting first-timers standing and riding waves within their first lesson."
  },
  "kitesurfing": {
    "destId": "kitesurfing--maui-kite-beach-kanaha",
    "school": "HST Windsurfing & Kitesurfing School",
    "place": "Maui (Kite Beach, Kanaha), United States",
    "stars": 4.8,
    "count": 53,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g60631-d647142-Reviews-HST_Windsurfing_Kitesurfing_School-Kahului_Maui_Hawaii.html",
    "whyPick": "As Maui's oldest and largest water sports school, HST keeps an instructor in the water beside each student, and reviewers repeatedly single out its patient, attentive teaching for first-time kitesurfers."
  },
  "windsurfing-and-wing-foil": {
    "destId": "windsurfing-and-wing-foil--santa-monica-southern-california",
    "school": "Action Sports Maui",
    "place": "Kanaha Beach, Maui, United States",
    "stars": 4.8,
    "count": 138,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g60631-d1074222-Reviews-Action_Sports_Maui-Kahului_Maui_Hawaii.html",
    "whyPick": "Reviewers repeatedly name specific instructors like Martin Verrastro as patient teachers, and praise the school's beachfront setup at Kanaha's sheltered morning bay where instructors can stand in the shallow water to coach beginners directly."
  },
  "rock-climbing": {
    "destId": "rock-climbing--yosemite-valley",
    "school": "Yosemite Mountaineering School & Guide Service",
    "place": "Yosemite Valley, United States",
    "stars": 4.8,
    "count": 33,
    "source": "Google",
    "url": "https://wanderlog.com/place/details/3899204/yosemite-mountaineering-school--guide-service",
    "whyPick": "Operating in Yosemite Valley since 1969, the school is the park's official guide service staffed by guides ranked among the most accomplished big-wall climbers in the world, and reviewers consistently praise named instructors (Bill, Aaron, Nick) for assessing each client's skill and tailoring the day, from the beginner \"Go Climb a Rock\" class to advanced big-wall seminars."
  },
  "ski-and-snowboard-mountain-guiding": {
    "destId": "ski-and-snowboard-mountain-guiding--chamonix-mont-blanc",
    "school": "Chamonix Experience (Chamex)",
    "place": "Chamonix-Mont-Blanc, France",
    "stars": 4,
    "count": 41,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187261-d2573335-Reviews-Chamonix_Experience_Day_Tours-Chamonix_Haute_Savoie_Auvergne_Rhone_Alpes.html",
    "whyPick": "Every guide is fully UIAGM/IFMGA-certified (the international gold standard for mountain guiding), and reviewers repeatedly praise the guides' meticulous attention to safety on off-piste ski, Vallee Blanche, and Mont Blanc routes."
  },
  "skydiving": {
    "destId": "skydiving--eloy-skydive-arizona",
    "school": "AXIS Flight School",
    "place": "Eloy, Arizona (Skydive Arizona), United States",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Run since 2010 by world-champion competitors Niklas Daniel and Brianne Thompson, who personally teach every progressive coaching program for post-A-license skydivers across freefall and canopy disciplines."
  },
  "whitewater-kayaking": {
    "destId": "whitewater-kayaking--nantahala-and-bryson-city-appalachians",
    "school": "Nantahala Outdoor Center (NOC)",
    "place": "Bryson City, North Carolina (Nantahala River), United States",
    "stars": 4.8,
    "count": 1530,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g48984-d1101559-Reviews-Nantahala_Outdoor_Center_Bryson_City-Bryson_City_North_Carolina.html",
    "whyPick": "Founded in 1972 by kayakers Payson and Aurelia Kennedy and Horace Holden, NOC runs a Paddling School the New York Times named the \"Nation's Premier Paddling School,\" teaching whitewater kayaking on the river-level Nantahala River."
  },
  "whitewater-rafting": {
    "destId": "whitewater-rafting--grand-canyon-colorado-river",
    "school": "Northwest Rafting Company",
    "place": "Hood River, Oregon (Estacada/Clackamas River trips), United States",
    "stars": 5,
    "count": 133,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g51909-d2343943-Reviews-Northwest_Rafting_Company-Hood_River_Oregon.html",
    "whyPick": "It runs International Rafting Federation (IRF) guide training workshops, and founder Zach Collier is one of the few IRF-certified instructors in the United States, also teaching Rescue 3 Whitewater Rescue Technician courses."
  },
  "canyoning": {
    "destId": "canyoning--sierra-de-guara-alqu-zar-and-rodellar",
    "school": "Terres d'Aventure (Terdav)",
    "place": "Rodellar valley, Sierra de Guara, Spain",
    "stars": 4.6,
    "count": null,
    "source": "Trustpilot (company-wide TrustScore for terdav.com, not Rodellar-specific)",
    "url": "https://www.trustpilot.com/review/www.terdav.com",
    "whyPick": "Terres d'Aventure is an established French adventure-travel operator whose Sierra de Guara canyoning trips use a Rodellar base; reviewers consistently praise the professional, friendly guides and the descents through the clear-water Mascun and Barazil canyons with natural slides and pools."
  },
  "safari-and-wildlife-guiding": {
    "destId": "safari-and-wildlife-guiding--greater-kruger-makuleke-concession",
    "school": "EcoTraining",
    "place": "Greater Kruger / Makuleke Concession, South Africa",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "EcoTraining runs FGASA-accredited field and safari guide courses out of unfenced bush camps and, at Makuleke, places students in the Greater Kruger's remotest, most biodiverse concession between the Limpopo and Luvuvhu rivers; it has operated for roughly 27 years and trained over 11,000 guides from 33 countries."
  },
  "horsemanship": {
    "destId": "horsemanship--saumur",
    "school": "IFCE — École Nationale d'Équitation / Cadre Noir de Saumur",
    "place": "Saumur, France",
    "stars": 4.5,
    "count": 1274,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187199-d2258835-Reviews-Le_Cadre_Noir-Saumur_Maine_et_Loire_Pays_de_la_Loire.html",
    "whyPick": "France's state riding school, home of the Cadre Noir whose écuyers practice the \"Equestrian art of the Cadre Noir\" inscribed on UNESCO's Intangible Cultural Heritage list, and which trains the country's senior equestrian instructors and Olympic-discipline competitors."
  },
  "wilderness-survival-and-bushcraft": {
    "destId": "wilderness-survival-and-bushcraft--boulder-utah",
    "school": "Boulder Outdoor Survival School (BOSS)",
    "place": "Boulder, Utah, United States",
    "stars": 5,
    "count": 8,
    "source": "Chamber of Commerce business directory",
    "url": "https://www.chamberofcommerce.com/business-directory/utah/boulder/school/9144093-boulder-outdoor-survival-school-boss",
    "whyPick": "Founded in 1968 by Larry Dean Olsen, author of \"Outdoor Survival Skills,\" BOSS is one of the oldest survival schools in the US and is known for primitive field courses that traverse remote southern Utah wilderness on a \"know more, carry less\" principle, carrying no tents, sleeping bags, or backpacks."
  },
  "mountain-biking": {
    "destId": "mountain-biking--marin-county-mount-tamalpais-fairfax",
    "school": "ZEP Techniques / ZEP MTB Camps",
    "place": "Whistler, British Columbia, Canada",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "A pioneer of structured Whistler MTB coaching for 20+ years, ZEP runs a Coach Academy that trains and certifies other instructors, so campers learn from coaches who teach the coaches."
  },
  "trail-and-ultra-running": {
    "destId": "trail-and-ultra-running--auburn-olympic-valley",
    "school": "Western States Endurance Run (WSER) — Memorial Weekend Training Camp",
    "place": "Foresthill / Auburn, California (Western States trail), United States",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Directed by WSER race director Craig Thornley, this Memorial Weekend camp runs the official final 70 miles of the actual 100-mile course over three days, with aid stations staffed by ultrarunning legends including 14-time winner Ann Trason and 5-time winner Tim Twietmeyer."
  },
  "pottery-and-ceramics": {
    "destId": "pottery-and-ceramics--mashiko",
    "school": "Mashiko Ceramic Art Club (Mashiko Tougei Club)",
    "place": "Mashiko, Tochigi, Japan",
    "stars": 3.9,
    "count": 76,
    "source": "Jalan (じゃらんnet)",
    "url": "https://www.jalan.net/kankou/spt_guide000000183643/kuchikomi/",
    "whyPick": "It is documented as the first and oldest pottery class founded in Mashiko (started roughly 40 years ago), and reviewers consistently praise the unlimited clay and the patient, hands-on wheel instruction, with English-speaking staff available."
  },
  "glassblowing": {
    "destId": "glassblowing--murano-venice",
    "school": "Scuola del Vetro Abate Zanetti",
    "place": "Murano, Venice, Italy",
    "stars": 4.4,
    "count": 58,
    "source": "Google (Google Maps)",
    "url": "https://wanderlog.com/place/details/5944883/abate-zanetti-srl-glass-school-of",
    "whyPick": "Founded in 1862 as Murano's official glass-art institute, it runs hands-on furnace courses, and visitors single out the live glassblowing demonstrations led by maestro Giancarlo Signoretto and his team."
  },
  "printmaking": {
    "destId": "printmaking--tokyo-mt-fuji-kawaguchiko",
    "school": "MI-LAB (Mokuhanga Innovation Laboratory) Artist-in-Residence",
    "place": "Echizen, Fukui (relocated from Kawaguchiko / Mt. Fuji in 2024), Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "MI-LAB runs an intensive residential program in water-based mokuhanga (Japanese woodblock printmaking) for international artists, continuing the curriculum of the Nagasawa Art Park residency (1997-2011), and since 2024 sits in the historic Echizen washi paper region where residents also study handmade-paper craft with local mills."
  },
  "textiles-and-weaving": {
    "destId": "textiles-and-weaving--teotitlan-del-valle-oaxaca",
    "school": "Thread Caravan (with Teotitlan del Valle Zapotec master weavers)",
    "place": "Teotitlan del Valle / Mitla, Oaxaca, Mexico",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Thread Caravan runs a week-long intensive floor-loom workshop in Teotitlan del Valle taught directly by Zapotec artisan instructors (partner weaver Susi Vicente Galan Sosa), so participants learn village symbology, natural plant/fruit dyeing, and weave their own wool rug on a two-heddle pedal loom inside the makers' own community."
  },
  "natural-dyeing": {
    "destId": "natural-dyeing--tokushima-awa",
    "school": "Thread Caravan — Exploring Japanese Blues",
    "place": "Tokushima (Awa) — Tokushima city, Kamiyama & Marugame, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Led by natural-dye artist Natalia Munro, the week is built on hands-on time with named Tokushima aizome artisans — Watanabe's indigo-cultivation and katazome studio, the Buaisou workshop, Makiko-san's shibori dyeing, and Takimoto-san's tsutsugaki/kakishibu in Kamiyama — so you learn sukumo-based Japanese indigo at its source."
  },
  "leatherwork": {
    "destId": "leatherwork--florence-santa-croce",
    "school": "Scuola del Cuoio (Leather School of Florence) / SCHOLA Academy",
    "place": "Florence (Santa Croce), Italy",
    "stars": 4.6,
    "count": 741,
    "source": "Google",
    "url": "https://wanderlog.com/place/details/803647/scuola-del-cuoio-srl",
    "whyPick": "Founded in 1950 inside the Monastery of Santa Croce by the Gori and Casini families, it is the largest working leather laboratory in Florence, where students learn vegetable-tanned and gold-tooled leatherwork from resident artisans on-site and reviewers consistently praise the genuine hand-craftsmanship and the chance to watch makers at the bench."
  },
  "jewelry-and-goldsmithing": {
    "destId": "jewelry-and-goldsmithing--florence",
    "school": "Le Arti Orafe Jewellery School (LAO)",
    "place": "Florence, Italy",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founded in 1985 by self-taught goldsmith Giò Carbone as the first contemporary-jewellery school of its kind in Italy, LAO teaches multi-year programs through named specialist faculty (e.g. stone-setter Francesco Carbone-era instructors, hand-engravers Victoria Efremova and Filippo Vinattieri, enamellists Jennifer Wells and Sachiko Chino) and runs official McNeel/Rhino CAD certification, making it one of the most established goldsmithing schools in Europe."
  },
  "tattooing": {
    "destId": "tattooing--yokohama-tokyo",
    "school": "Japan Tattoo Academy (NTA / Nihon Tattoo Academy)",
    "place": "Tokyo, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "NTA is a registered general incorporated association (一般社団法人日本タトゥーアカデミー) running a structured beginner-to-advanced curriculum taught by working Japanese tattoo artists, covering not just technique but design sense plus tattoo culture, history and ethics, with post-graduation support such as partner-studio introductions — and it is named among Japan's top recommended tattoo schools by the industry portal Tattoo Japan."
  },
  "perfumery": {
    "destId": "perfumery--grasse",
    "school": "Grasse Institute of Perfumery (GIP)",
    "place": "Grasse, France",
    "stars": 4.8,
    "count": 24,
    "source": "Google (via Wanderlog)",
    "url": "https://wanderlog.com/place/details/2303460/grasse-institute-of-perfumery",
    "whyPick": "Founded in 2002 by Prodarom (the French fragrance-industry trade union) in Grasse, GIP runs an 18-month \"International Technical Degree in Fragrance Creation and Sensory Evaluation\" limited to 12 students, training perfumers in the historic capital of French perfumery."
  },
  "lutherie-and-instrument-making": {
    "destId": "lutherie-and-instrument-making--cremona",
    "school": "Academia Cremonensis",
    "place": "Cremona, Italy",
    "stars": 4.8,
    "count": 67,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187831-d7171816-Reviews-Academia_Cremonensis-Cremona_Province_of_Cremona_Lombardy.html",
    "whyPick": "Founded and led by master luthier Giovanni Colonna, the academy teaches violin making by Simone Fernando Sacconi's method and bow making by Giovanni Lucchi's, with a 3-year violin-making and 2-year bow-making course in Cremona's historic Mina-Bolzesi palace."
  },
  "guitar-and-music-performance": {
    "destId": "guitar-and-music-performance--boston",
    "school": "Berklee College of Music",
    "place": "Boston, United States",
    "stars": 4.2,
    "count": 42,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g60745-d208219-Reviews-Berklee_College_of_Music-Boston_Massachusetts.html",
    "whyPick": "Berklee is the largest independent college of contemporary music in the world, and its alumni roster — including Quincy Jones, John Mayer, and dozens of Grammy winners — makes its performance training among the most recognized in popular and jazz music."
  },
  "calligraphy-and-lettering": {
    "destId": "calligraphy-and-lettering--xi-an-beijing",
    "school": "China Academy of Art (International College, Xiangshan campus)",
    "place": "Hangzhou, China",
    "stars": 4.9,
    "count": 37,
    "source": "Google",
    "url": "https://wanderlog.com/place/details/8813360/china-academy-of-art-xiangshan-central-campus",
    "whyPick": "The Xiangshan campus was designed by Wang Shu, the first Chinese citizen to win the Pritzker Architecture Prize (2012), who founded and heads the China Academy of Art's architecture program on this site, making it a leading center for Chinese art and design education."
  },
  "italian-cuisine-and-pasta": {
    "destId": "italian-cuisine-and-pasta--bologna",
    "school": "La Vecchia Scuola Bolognese (VSB)",
    "place": "Bologna, Italy",
    "stars": 3.5,
    "count": 101,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187801-d2203642-Reviews-Vecchia_Scuola_Bolognese-Bologna_Province_of_Bologna_Emilia_Romagna.html",
    "whyPick": "Founded by Alessandra Spisni, an internationally known Bolognese sfoglina (hand-rolled-pasta master), the school built its name on teaching the traditional sfoglia and fresh pasta of Emilia-Romagna, and reviewers consistently praise the hands-on, small-group instruction in making tagliatelle, tortelloni, and tortellini by hand."
  },
  "new-basque-cuisine": {
    "destId": "new-basque-cuisine--san-sebasti-n-donostia",
    "school": "Basque Culinary Center",
    "place": "San Sebastián (Donostia), Spain",
    "stars": 4.5,
    "count": 448,
    "source": "Google (via Wanderlog aggregator)",
    "url": "https://wanderlog.com/place/details/408115/basque-culinary-center",
    "whyPick": "It houses the Faculty of Gastronomic Sciences of Mondragon University — the first university-level gastronomy faculty in Spain, founded in 2009 by Mondragon University together with a board of leading Basque chefs, awarding accredited degrees through PhD level."
  },
  "modernist-spanish-cuisine": {
    "destId": "modernist-spanish-cuisine--roses-cala-montjoi-costa-brava",
    "school": "Basque Culinary Center (Faculty of Gastronomic Sciences)",
    "place": "Donostia-San Sebastián (Gipuzkoa), Spain",
    "stars": 4.5,
    "count": 448,
    "source": "Google (via Wanderlog aggregator)",
    "url": "https://wanderlog.com/place/details/408115/basque-culinary-center",
    "whyPick": "It is Spain's first university faculty of Gastronomic Sciences, awarding an official degree affiliated with Mondragon University and founded in 2011 with a board of leading Basque chefs (Arzak, Subijana, Berasategui)."
  },
  "sushi-and-washoku": {
    "destId": "sushi-and-washoku--tokyo-tsukiji-toyosu",
    "school": "Tokyo Sushi Academy",
    "place": "Tokyo, Japan",
    "stars": 5,
    "count": 20,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g14129610-d8779915-Reviews-Tokyo_Sushi_Academy-Tsukiji_Chuo_Tokyo_Tokyo_Prefecture_Kanto.html",
    "whyPick": "Founded in 2002 as Japan's first school dedicated solely to teaching sushi, its Tsukiji campus runs an English-language professional Edomae sushi chef course that ends in a completion certificate, and graduates now work in over 50 countries."
  },
  "thai-cuisine": {
    "destId": "thai-cuisine--bangkok",
    "school": "Le Cordon Bleu Dusit Culinary School",
    "place": "Bangkok, Thailand",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It runs the world's only Professional Thai Cuisine Programme alongside the globally recognised Le Cordon Bleu diploma lineage, and was named Asia's Best Culinary Training Institution 2025."
  },
  "oaxacan-and-mexican-cuisine": {
    "destId": "oaxacan-and-mexican-cuisine--oaxaca",
    "school": "Seasons of My Heart (Susana Trilling)",
    "place": "Oaxaca, Mexico",
    "stars": 4.4,
    "count": 97,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g150801-d584374-Reviews-Seasons_of_My_Heart_Cooking_School-Oaxaca_Southern_Mexico.html",
    "whyPick": "Founded in 1993 by Susana Trilling, author of the cookbook \"Seasons of My Heart\" and host of the PBS series of the same name; reviewers single out her as a deeply professional instructor and the full-day class for its Etla market tour and hands-on, five-course Oaxacan meal."
  },
  "north-indian-cuisine": {
    "destId": "north-indian-cuisine--lucknow",
    "school": "Institute of Hotel Management, Catering Technology & Applied Nutrition (IHM Lucknow)",
    "place": "Lucknow, India",
    "stars": 4.2,
    "count": 583,
    "source": "Justdial",
    "url": "https://www.justdial.com/Lucknow/Institute-Of-Hotel-Management-Catering-Nutrition-Sector-G-Near-Seed-Farm-and-Left-Hand-Side-Of-Purana-Hanuman-Mandir-Aliganj/0522PX522-X522-110328215619-S8E3_BZDET",
    "whyPick": "A government-run institute under India's Ministry of Tourism and affiliated to the NCHMCT, it has trained hospitality and culinary professionals since 1969 and reports placement above 90% with recruiters including ITC, Marriott, Hyatt and Hilton."
  },
  "peruvian-cuisine": {
    "destId": "peruvian-cuisine--lima",
    "school": "Le Cordon Bleu Perú",
    "place": "Lima, Peru",
    "stars": 4.3,
    "count": 273,
    "source": "Google Maps (via Wanderlog)",
    "url": "https://wanderlog.com/place/details/9572939/le-cordon-bleu-institute",
    "whyPick": "Le Cordon Bleu's first Spanish-speaking campus in Latin America (Lima, opened 2000) and named Best Cooking School in Peru at the Somos 2024 Awards, offering Cordon Bleu's classic culinary diplomas focused on Peruvian gastronomy."
  },
  "wine-and-sommellerie": {
    "destId": "wine-and-sommellerie--bordeaux",
    "school": "L'Ecole du Vin de Bordeaux (CIVB Bordeaux Wine School)",
    "place": "Bordeaux, France",
    "stars": 4.6,
    "count": 99,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g187079-d279070-Reviews-Ecole_du_Vin_de_Bordeaux-Bordeaux_Gironde_Nouvelle_Aquitaine.html",
    "whyPick": "Founded in 1989 and run directly by the CIVB (the official Bordeaux Wine Council), the school's professional instructors run tiered tasting workshops from beginner to specialist level for 120,000+ learners worldwide each year, with reviewers praising the knowledgeable instruction and the historic 18th-century setting."
  },
  "sake-and-sommellerie-of-sake": {
    "destId": "sake-and-sommellerie-of-sake--nada-kobe-hyogo",
    "school": "Obata Shuzo - Gakkogura",
    "place": "Sado Island, Niigata, Japan",
    "stars": 4.5,
    "count": 37,
    "source": "Google Maps (via Wanderlog place page)",
    "url": "https://wanderlog.com/place/details/9870510/gakkogura-obata-shuzo",
    "whyPick": "Gakkogura is Obata Shuzo's working brewery built inside a closed 2010 elementary school, led by fifth-generation owner Rumiko Obata (one of Japan's few female brewery chiefs), running a hands-on week-long sake-brewing program that has hosted over 150 participants from around the world."
  },
  "coffee-and-barista": {
    "destId": "coffee-and-barista--yirgacheffe-addis-ababa",
    "school": "African Coffee Campus",
    "place": "Kaffa region & Addis Ababa, Ethiopia",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Its farm-to-cup curriculum is built on the Specialty Coffee Association (SCA) framework across barista skills, green coffee, sensory and roasting, and graduates leave with a certificate qualifying them for professional barista work."
  },
  "mixology-and-bartending": {
    "destId": "mixology-and-bartending--havana",
    "school": "Asociacion de Cantineros de Cuba / Havana Club Rum Museum (Museo del Ron)",
    "place": "Havana, Cuba",
    "stars": 3.8,
    "count": 1509,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g147271-d1771483-Reviews-Museo_del_Ron_Havana_Club-Havana_Ciudad_de_la_Habana_Province_Cuba.html",
    "whyPick": "The associated Asociacion de Cantineros de Cuba traces to the Club de Cantineros founded in 1924, is a member of the International Bartenders Association, and crowned Cuba's first world-champion bartender (Sergio Serrano Rivero, Seville 2003); reviewers of its Museo del Ron home praise the guided walk through rum-production history and the cocktail/rum tasting at the end."
  },
  "cheese-and-fermentation": {
    "destId": "cheese-and-fermentation--poligny-jura",
    "school": "Mons Formation (Mons Fromager-Affineur)",
    "place": "Ambierle (near Roanne), France",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "A Qualiopi-certified professional cheese and dairy training center founded in 2005 by master affineurs Laurent and Hervé Mons, with hands-on aging workshops held in the Maison Mons maturing cellars inside the converted Tunnel de la Collonge."
  },
  "tea-and-tea-ceremony": {
    "destId": "tea-and-tea-ceremony--hangzhou-fujian",
    "school": "Tea Drunk",
    "place": "Wu Yi Shan, Fujian, China",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Tea Drunk's Wu Yi Shan program is an annual hands-on educational tea tour led by founder Shunan Teng, who is the educator behind the TED-Ed lesson \"The History of Tea\" and has lectured at Yale and the Metropolitan Museum of Art, and who harvests and makes Yan Cha (cliff tea) alongside heritage farmers in the region each spring."
  },
  "karate": {
    "destId": "karate--naha-and-shuri-okinawa",
    "school": "Visit Karate Okinawa (Ageshio Japan)",
    "place": "Naha & Shuri, Okinawa, Japan",
    "stars": 5,
    "count": 68,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g298224-d15563177-Reviews-Ageshio_Japan_Co_Ltd-Naha_Okinawa_Prefecture_Kyushu.html",
    "whyPick": "Run by Shorin-Ryu 7th-dan Kinjo (Kenny) Sensei, the program trains at the official Okinawa Karate Kaikan with named local masters, and reviewers repeatedly single out the instructors' depth of knowledge and the well-organized dojo sessions paired with karate-history tours."
  },
  "kung-fu": {
    "destId": "kung-fu--dengfeng-songshan-shaolin-temple-henan",
    "school": "Shaolin Tagou Martial Arts School",
    "place": "Dengfeng (Songshan Shaolin Temple), Henan, China",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founded in 1978 by former Shaolin practitioner Liu Baoshan, it is one of China's largest martial arts schools (reported tens of thousands of students and staff) sitting roughly one kilometer from the Songshan Shaolin Temple, and its students have performed at major events including the Beijing 2008 Olympics opening ceremony."
  },
  "capoeira": {
    "destId": "capoeira--salvador-bahia",
    "school": "Capoeira Engenho — Mestre Grandão (Centro de Treinamento Engenho, Abrantes)",
    "place": "Abrantes, Camaçari (Salvador metro), Bahia, Brazil",
    "stars": 5,
    "count": 3,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g2577884-d26614234-Reviews-Capoeira_Training_Center_Engenho-Abrantes_Camacari_State_of_Bahia.html",
    "whyPick": "The center is led by Mestre Grandão (Antônio Marcos dos Anjos Reis), son of Capoeira Engenho founder Mestre Baiano (Edvaldo dos Santos Reis), whose lineage traces to Mestre Canjiquinha, and reviewers praise it as a welcoming, family-friendly place to learn capoeira directly within Afro-Brazilian tradition."
  },
  "argentine-tango": {
    "destId": "argentine-tango--buenos-aires",
    "school": "DNI Tango",
    "place": "Buenos Aires (Almagro), Argentina",
    "stars": 4.9,
    "count": 195,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g312741-d3182476-Reviews-DNI_Tango-Buenos_Aires_Capital_Federal_District.html",
    "whyPick": "Founded by dancer Dana Frigoli, DNI teaches the structured \"DNI method\" she developed (with faculty including Adrian Ferreyra and Jonathan Lambert), and reviewers consistently praise the instructors' methodical teaching and post-lesson follow-up at its Bulnes 1011 Almagro studio."
  },
  "salsa": {
    "destId": "salsa--havana",
    "school": "Salsabor a Cuba",
    "place": "Havana, Cuba",
    "stars": 4.8,
    "count": 169,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g147271-d8612806-Reviews-Salsabor_a_Cuba_Dance_School-Havana_Ciudad_de_la_Habana_Province_Cuba.html",
    "whyPick": "Ranked #5 of 52 Classes & Workshops in Havana on Tripadvisor, where reviewers repeatedly name individual instructors (such as Gerardo) and praise the patient, one-on-one teaching of authentic Cuban-style salsa, son, rumba and the full Cuban dance repertoire."
  },
  "watchmaking": {
    "destId": "watchmaking--le-sentier-vall-e-de-joux",
    "school": "WOSTEP (Watchmakers of Switzerland Training and Educational Program)",
    "place": "Neuchâtel, Switzerland",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "A WOSTEP diploma is treated as an international benchmark credential by the Swiss watch industry: per the Swiss watch federation (FH) and WOSTEP's own records, 600+ watchmakers and polishers have earned the certified diploma in Neuchâtel and roughly 2,700 more through its accredited partner schools worldwide."
  },
  "wooden-boatbuilding": {
    "destId": "wooden-boatbuilding--lowestoft-suffolk",
    "school": "Boat Building Academy (Lyme Regis)",
    "place": "Lyme Regis, Dorset, United Kingdom",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Founded in 1997 and an approved City & Guilds centre, the Academy runs an internationally recognised 38–40 week residential boat building course that teaches beginners to build boats to professional standards across traditional wood, modern wood and composite construction."
  },
  "cigar-rolling": {
    "destId": "cigar-rolling--havana-and-pinar-del-r-o",
    "school": "ProCigar (Asociacion de Fabricantes de Tabacos de la Republica Dominicana) - ProCigar Festival",
    "place": "La Romana and Santiago de los Caballeros, Dominican Republic",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Run by ProCigar, the Dominican cigar manufacturers' association, the festival takes attendees inside working premium factories and tobacco fields in Santiago (the \"cigar capital of the world\"), where you stand at the rolling galleries and sorting tables and learn the craft directly from the makers behind brands like La Aurora and Davidoff."
  },
  "falconry": {
    "destId": "falconry--abu-dhabi",
    "school": "Forest Barn Falconry School",
    "place": "Forest of Dean, Gloucestershire, United Kingdom",
    "stars": 5,
    "count": 522,
    "source": "Feefo",
    "url": "https://www.feefo.com/reviews/forest-barn-holidays",
    "whyPick": "Its resident falconer, Mark Parker, is a former Head Falconer at the International Birds of Prey Centre and was Oxford University's Consulting Falconer with the Oxford Flight Group, and as a Raptor Awards Assessor he can issue recognised falconry qualifications to course participants."
  },
  "kintsugi-japanese-gold-repair": {
    "destId": "kintsugi-japanese-gold-repair--kyoto",
    "school": "POJ Studio",
    "place": "Kyoto, Japan",
    "stars": 4.3,
    "count": 55,
    "source": "Google Maps (via Wanderlog)",
    "url": "https://wanderlog.com/place/details/4567812/poj-studio",
    "whyPick": "Founded by Tina Koyama and Hana Tsukamoto, POJ (\"Pieces of Japan\") Studio teaches kintsugi using traditional urushi lacquer and real gold sourced from established Kyoto artisans, and reviewers consistently praise the knowledgeable, English-speaking staff and authentic craftsmanship."
  },
  "sichuan-and-chinese-cuisine": {
    "destId": "sichuan-and-chinese-cuisine--chengdu",
    "school": "Sichuan Higher Institute of Cuisine",
    "place": "Chengdu, China",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Now the cuisine college of Sichuan Tourism University (its culinary program dates to the school's 1976 founding), it holds a national-level teaching team and two national-level culinary courses, and is recognized as the institutional home of formal Sichuan-cuisine training in Chengdu."
  },
  "korean-cuisine-hansik": {
    "destId": "korean-cuisine-hansik--seoul",
    "school": "Le Cordon Bleu–Sookmyung Academy",
    "place": "Seoul, South Korea",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "It is Korea's only Le Cordon Bleu campus — a partnership between the 1895-founded Paris institution and Sookmyung Women's University running since 2002 — where French master chefs teach the internationally recognized Diplôme de Cuisine, Diplôme de Pâtisserie, and Le Grand Diplôme."
  },
  "vietnamese-cuisine": {
    "destId": "vietnamese-cuisine--hoi-an",
    "school": "Vy's Market Restaurant & Cooking School (Taste Vietnam)",
    "place": "Hoi An, Vietnam",
    "stars": 4.6,
    "count": 1150,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Restaurant_Review-g298082-d4479883-Reviews-Vy_s_Market_Restaurant-Hoi_An_Quang_Nam_Province.html",
    "whyPick": "Founded by Hoi An chef and author Trinh Diem Vy (Ms. Vy), the school pairs its hands-on Vietnamese classes with a guided local-market tour, and reviewers consistently praise the breadth of authentic regional dishes taught and the freshly-made-to-order food."
  },
  "asado-and-open-fire-cooking": {
    "destId": "asado-and-open-fire-cooking--patagonia-buenos-aires",
    "school": "Francis Mallmann — Wild Cooking in Argentina",
    "place": "Lago La Plata, Chubut (Patagonia), Argentina",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Led by Francis Mallmann, the internationally renowned Argentine chef featured in Netflix's \"Chef's Table,\" who teaches his signature \"Seven Fires\" open-fire and asado techniques in person to small groups (up to ~10) at his remote Patagonian island, La Soplada, on Lago La Plata."
  },
  "whisky-and-distilling": {
    "destId": "whisky-and-distilling--speyside",
    "school": "Spirit of Speyside Whisky School",
    "place": "Speyside, Scotland",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "Run by the Spirit of Speyside Whisky Festival as a 3.5-day immersive course, it pairs tutor-led lectures on every stage of malt whisky making with privileged behind-the-scenes distillery visits across Speyside, the region with Scotland's greatest concentration of working distilleries."
  },
  "fly-fishing": {
    "destId": "fly-fishing--bozeman-and-the-madison-valley",
    "school": "Healing Waters Lodge Fly Fishing Academy",
    "place": "Twin Bridges / Madison Valley, Montana, USA",
    "stars": 5,
    "count": 159,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Hotel_Review-g45387-d2708155-Reviews-Healing_Waters_Lodge-Twin_Bridges_Montana.html",
    "whyPick": "It is an Orvis-endorsed lodge whose owners Mike and Laura Geary won the 2020 Orvis Lodge of the Year award, and its morning academy sessions put all the lodge's guides together to teach beginners hands-on, which reviewers repeatedly single out as knowledgeable and patient instruction."
  },
  "kyudo-japanese-archery": {
    "destId": "kyudo-japanese-archery--kyoto",
    "school": "InsideJapan Tours (private master-archer lesson)",
    "place": "Kyoto, Japan",
    "stars": null,
    "count": null,
    "source": "",
    "url": "",
    "whyPick": "InsideJapan Tours arranges a private one-on-one kyudo lesson with a master archer in Kyoto, where you learn to draw and shoot the two-metre yumi bow by following the instructor's movements and the ritual mind-and-body preparation of each shot — delivered as a guided, individually-coordinated session rather than a drop-in class."
  },
  "dog-sledding-and-mushing": {
    "destId": "dog-sledding-and-mushing--tromso",
    "school": "Active Tromsø",
    "place": "Tromsø, Norway",
    "stars": 4.6,
    "count": 411,
    "source": "Tripadvisor",
    "url": "https://www.tripadvisor.com/Attraction_Review-g190475-d4206829-Reviews-Active_Tromso-Tromso_Troms_Northern_Norway.html",
    "whyPick": "Reviewers consistently praise it as a genuine self-drive musher experience rather than a passenger ride, where owner Tore teaches guests to control their own sled across roughly three hours behind a kennel of 60-plus well-kept dogs."
  },
  "marble-sculpture-and-stone-carving": {
    "destId": "marble-sculpture-and-stone-carving--carrara",
    "school": "Arco Arte Sculpture School",
    "place": "Carrara, Italy",
    "stars": 5,
    "count": 4,
    "source": "TripAdvisor",
    "url": "https://www.tripadvisor.com/Hotel_Review-g660764-d4039760-Reviews-Arco_Arte_Sculpture_Studio-Carrara_Province_of_Massa_Carrara_Tuscany.html",
    "whyPick": "Founded in 1990 by professional sculptor Boutros Romhein, the studio teaches both ancient and modern marble, stone, clay and wood techniques directly from a working sculptor whose pieces are held in venues internationally."
  },
  "bookbinding-and-letterpress": {
    "destId": "bookbinding-and-letterpress--florence",
    "school": "Studiainitalia",
    "place": "Florence, Italy",
    "stars": 4.9,
    "count": 638,
    "source": "Revi.io (independent verified-review platform)",
    "url": "https://revi.io/en/reviews/wwwstudiainitaliacom",
    "whyPick": "Studiainitalia runs its bookbinding course inside a working Florentine bottega with a practising master binder, and its own course page reports the program at 4.95/5 from 37 students who praise making finished books in a single week amid live restoration work; the headline 4.9/5 (638 reviews) here is from the independent Revi platform, where 522 reviews are verified and 98% of customers recommend it."
  }
};
