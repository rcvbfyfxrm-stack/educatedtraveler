# Atlas night check

_2026-09-03 — 294 published claims re-read against the pages they came from, across 31 open crafts._

This file is written by `scripts/night-check.py`. It is **not a check** in the sense rule 10 means: no name, no visit, no judgement. It is a machine noticing that a page moved. Nothing here has been changed on the site — that is Arnaud's call, every time.

## Failing 3 nights or more — decide on these

Three nights is past a bad evening. Re-verify by hand and either re-date the entry or take it down. The Standard does not allow a third option: an entry that cannot be confirmed is not softened, it comes off.

_none._

## Started failing tonight

- freediving · Freediving Greece — HTTP 404 — https://www.freediving-club.com/
- kitesurfing · Kiteboarding School of Maui — HTTP 404 — https://www.ksmaui.com/packages/
- ski-touring-and-splitboard · Ski touring Half day — HTTP 404 — https://www.chamonix-guides.com/en/activities/details/ski-touring-half-day
- safari-and-wildlife-guiding · Koiyaki Guiding School — HTTP 404 — https://www.maasaimara.com/entries/koiyaki-guiding-school

## Back to normal

- ashtanga-yoga · K. Pattabhi Jois Ashtanga Yoga Shala (Saraswathi Jois)

## Unreadable, not gone

These answered with a 401, 403, 429 or 451 — a firewall refusing a script, not a school that closed. Never escalated, because a check that cries wolf gets muted. If one matters, open it in a browser; that is the only way to know.

- hatha-and-vinyasa-yoga · Ginseng Yoga — HTTP 403
- ashtanga-yoga · Ashtanga Yoga New York (Eddie Stern) — HTTP 403
- spearfishing · Blue Water Hunter Spearfishing — HTTP 403
- ski-touring-and-splitboard · American Avalanche Institute courses — HTTP 403
- pottery-and-ceramics · Seto Ceramics and Glass Art Center — HTTP 403
- photography · Magnum Photos workshops (Arles) — HTTP 403
- photography · London College of Communication (UAL) — HTTP 403
- photography · Central Saint Martins (UAL) — HTTP 403
- jewelry-and-goldsmithing · Le Arti Orafe Jewellery School (LAO) — HTTP 403
- jewelry-and-goldsmithing · Complete Stone Setting Course — HTTP 403
- jewelry-and-goldsmithing · Introduction to Rhino3D for Goldsmithing (CAD.WE1) — HTTP 403
- italian-cuisine-and-pasta · Bologna Cooking School — HTTP 403
- wine-and-sommellerie · L'Ecole du Vin de Bordeaux (CIVB Bordeaux Wine School) — HTTP 403
- wine-and-sommellerie · Introduction to Tasting — HTTP 403
- wine-and-sommellerie · L'Ecole du Vin de Bordeaux (CIVB) — HTTP 403
- wine-and-sommellerie · UC Davis Department of Viticulture & Enology — HTTP 403
- wildlife-photography · Falmouth University — HTTP 403



## Places we turned down, whose page did not answer

Informational, never escalated. A rejected place going offline is usually the reason it was rejected. What would matter here is the opposite — one coming back — and no status code can tell you that.

- modernist-spanish-cuisine · Espai Sucre — URLError: <urlopen error [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: Hostname mismatch, certificate is not valid for 'espaisucre.com'. (_ssl.c:1010)>
- modern-new-technique-cuisine · Espai Sucre — URLError: <urlopen error [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: Hostname mismatch, certificate is not valid for 'espaisucre.com'. (_ssl.c:1010)>

## Claims with nothing to verify against

These resolve, and that is all we know: no `verify` strings, so the page could have replaced the course, the price and the dates and this would still pass. Adding two or three literal fragments from what we published is what turns an entry into something a machine can keep honest.

- hatha-and-vinyasa-yoga · Rishikesh · Parmarth School of Yoga (Parmarth Niketan Ashram)
- hatha-and-vinyasa-yoga · Rishikesh · Yoga Therapy: Diabetes (residential short course)
- hatha-and-vinyasa-yoga · Rishikesh · Parmarth Niketan (Parmarth School of Yoga)
- hatha-and-vinyasa-yoga · Rishikesh · Sivananda Ashram (Divine Life Society)
- hatha-and-vinyasa-yoga · Rishikesh · Rishikesh Yog Peeth
- hatha-and-vinyasa-yoga · Rishikesh · Yoga Niketan Ashram
- hatha-and-vinyasa-yoga · Mysore · Indea Yoga
- hatha-and-vinyasa-yoga · Mysore · Atmavikasa Centre of Yogic Sciences
- hatha-and-vinyasa-yoga · Mysore · Sthalam 8 Ashtanga Yoga Vedanta Centre
- hatha-and-vinyasa-yoga · Ubud, Bali · The Yoga Barn
- hatha-and-vinyasa-yoga · Ubud, Bali · Radiantly Alive
- hatha-and-vinyasa-yoga · Ubud, Bali · Ubud Yoga Centre
- hatha-and-vinyasa-yoga · Encinitas, California · Soul of Yoga
- ashtanga-yoga · Mysore (Gokulam) · Sharath Yoga Centre (SYC)
- ashtanga-yoga · Mysore (Gokulam) · K. Pattabhi Jois Ashtanga Yoga Shala (Saraswathi Jois)
- ashtanga-yoga · Mysore (Gokulam) · Sthalam 8 Ashtanga Yoga Vedanta Centre
- ashtanga-yoga · London · Stillpoint Yoga London
- ashtanga-yoga · London · Astanga Yoga London (AYL)
- ashtanga-yoga · London · Yoga Place
- vipassana-and-meditation · Igatpuri (Dhamma Giri) · Dhamma Giri - Vipassana International Academy
- vipassana-and-meditation · Igatpuri (Dhamma Giri) · Vipassana Research Institute (VRI)
- vipassana-and-meditation · Igatpuri (Dhamma Giri) · Dhamma Tapovana (long-course centre, Igatpuri)
- vipassana-and-meditation · Yangon · Mahasi Sasana Yeiktha Meditation Centre
- vipassana-and-meditation · Yangon · Chanmyay Yeiktha Meditation Centre
- vipassana-and-meditation · Yangon · International Meditation Centre (U Ba Khin tradition)
- vipassana-and-meditation · Chiang Mai · Wat Ram Poeng (Tapotaram) Northern Insight Meditation Centre
- vipassana-and-meditation · Chiang Mai · Wat Suan Dok (Monk Chat / meditation retreats)
- vipassana-and-meditation · Barre, Massachusetts · Insight Meditation Society (IMS)
- vipassana-and-meditation · Barre, Massachusetts · Barre Center for Buddhist Studies
- sound-healing · Kathmandu (Budhanilkantha) · Pragya Yoga School
- sound-healing · Kathmandu (Budhanilkantha) · 4 Days / 20 Hours Basic Level Singing Bowl Sound Healing Training
- sound-healing · Kathmandu (Budhanilkantha) · 1 Day / 5 Hour Singing Bowl & Gong Workshop
- sound-healing · Kathmandu / Pokhara · Pragya Yoga School (singing bowl & sound therapy training)
- sound-healing · Kathmandu / Pokhara · Himalayan Yoga Academy / Himalayan Yoga Nepal
- sound-healing · Kathmandu / Pokhara · Pokhara Yoga School and Retreat Center
- sound-healing · San Francisco / Bay Area · Globe Institute - Sound Healing Center (Sausalito)
- sound-healing · San Francisco / Bay Area · California Institute of Integral Studies (sound-related programs)
- sound-healing · Glastonbury / South West England · The College of Sound Healing
- sound-healing · Glastonbury / South West England · British Academy of Sound Therapy
- thai-massage · Chiang Mai · Old Medicine Hospital Thai Massage School Shivagakomarpaj (OMH)
- thai-massage · Chiang Mai · Introduction to Thai Massage
- thai-massage · Chiang Mai · One Day Drop-In Pass
- thai-massage · Chiang Mai · Old Medicine Hospital (Thai Massage School Shivagakomarpaj / OMH)
- thai-massage · Chiang Mai · ITM - International Training Massage School
- thai-massage · Chiang Mai · Sunshine Massage School
- thai-massage · Chiang Mai · Chetawan (Wat Pho) Thai Traditional Massage School, Chiang Mai branch
- thai-massage · Bangkok · Wat Pho Thai Traditional Medical and Massage School (Watpo TTM)
- thai-massage · Bangkok · Chetawan Thai Traditional Massage School
- cold-exposure-wim-hof-method · Przesieka, Karkonosze Mountains · Wim Hof Method Academy
- cold-exposure-wim-hof-method · Przesieka, Karkonosze Mountains · WHM Travel Experience (mountain expedition)
- cold-exposure-wim-hof-method · Przesieka, Karkonosze Mountains · Wim Hof Method Academy (Module III, Przesieka)
- cold-exposure-wim-hof-method · Przesieka, Karkonosze Mountains · Official Wim Hof Winter Expedition
- cold-exposure-wim-hof-method · Przesieka, Karkonosze Mountains · Wim Hof Method Travel
- cold-exposure-wim-hof-method · Amsterdam · Wim Hof Method Academy (HQ)
- cold-exposure-wim-hof-method · Amsterdam · Innerfire BV
- cold-exposure-wim-hof-method · Reykjavik & surrounds · Certified WHM Instructors Iceland (activities.wimhofmethod.com)
- freediving · Apnea Academy (Italy-based; instructor course held in the Mediterranean/Red Sea) · Apnea Academy (Umberto Pelizzari)
- freediving · Apnea Academy / Italian Mediterranean · Apnea Academy (Umberto Pelizzari's school)
- freediving · Apnea Academy / Italian Mediterranean · Y-40 Deep Joy (Montegrotto Terme)
- freediving · Dahab (Red Sea) · Freedive Dahab

_251 in total._
