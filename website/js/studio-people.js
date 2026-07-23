/* Studio — People tab. The Circle, person by person.
 * Merges launch_waitlist (leads) + profiles (members) by email via the shared
 * Supabase client. RLS: both tables are admin-only SELECT — without an admin
 * session the room stays sealed (same pattern as studio-news.js).
 * Organised by what they love (craft cloud filters) and what they wrote
 * (dreams + letters on warm paper). Renders via window.ET_RENDER_PEOPLE.
 */
(function () {
  "use strict";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const INTENT_LABEL = { timing: "When", length: "Length", depth: "Depth", reach: "Reach" };
  const SOURCE_LABEL = {
    "circle-questionnaire": "/circle", "homepage": "homepage", "homepage-circle": "homepage",
    "join-page": "join page", "barcelona": "/barcelona", "founding-add": "added by hand",
    "founding-list-2": "founding list",
  };

  const pretty = (slug) => {
    const s = String(slug || "").trim();
    if (/\d/.test(s)) return s; // "1-3months" etc — show as stored
    return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  };

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return String(iso || ""); }
  }

  // ---- merge both tables into person records (pure; unit-testable) ----
  function build(waitlist, profiles) {
    const people = new Map();
    const get = (email) => {
      const key = String(email || "").trim().toLowerCase();
      if (!key) return null;
      if (!people.has(key)) people.set(key, {
        email: key, name: "", region: "", profession: "", member: false, portrait: false,
        unsubscribed: false, crafts: [], writings: [], sources: [], intent: [], masters: [], first: null, last: null,
        onList: false, welcomedAt: null, lastIssue: "",
      });
      return people.get(key);
    };
    const seen = (p, iso) => {
      if (!iso) return;
      if (!p.first || iso < p.first) p.first = iso;
      if (!p.last || iso > p.last) p.last = iso;
    };
    const addCraft = (p, label, own) => {
      const t = String(label || "").trim();
      if (!t) return;
      if (!p.crafts.some((c) => c.label.toLowerCase() === t.toLowerCase())) p.crafts.push({ label: t, own: !!own });
    };
    const addWriting = (p, label, text) => {
      const t = String(text || "").trim();
      if (t && !p.writings.some((w) => w.text === t)) p.writings.push({ label, text: t });
    };

    (waitlist || []).forEach((row) => {
      const p = get(row.email);
      if (!p) return;
      seen(p, row.created_at);
      if (row.unsubscribed) p.unsubscribed = true;
      p.onList = true;
      if (row.welcomed_at && (!p.welcomedAt || row.welcomed_at > p.welcomedAt)) p.welcomedAt = row.welcomed_at;
      // rows arrive newest-first; keep the most recent real issue ("welcome" is covered by welcomedAt)
      if (row.last_issue && row.last_issue !== "welcome" && !p.lastIssue) p.lastIssue = row.last_issue;
      const src = SOURCE_LABEL[row.source] || row.source;
      if (src && !p.sources.includes(src)) p.sources.push(src);
      let items = Array.isArray(row.interests) ? row.interests
        : (row.interests && typeof row.interests === "object") ? Object.values(row.interests).flat() : [];
      items.forEach((it) => {
        if (typeof it === "string") return addCraft(p, it, false);
        if (!it || typeof it !== "object") return;
        if (it.kind === "profile") {
          if (it.name && !p.name) p.name = String(it.name).trim();
          if (it.region && !p.region) p.region = String(it.region).trim();
        } else if (it.kind === "discipline") {
          if (it.discipline) addCraft(p, it.discipline, false);
          if (it.open) addCraft(p, it.open, true);
        } else if (it.kind === "intent") {
          ["timing", "length", "depth", "reach"].forEach((k) => {
            const v = String(it[k] || "").trim();
            if (v && !p.intent.some((x) => x[0] === INTENT_LABEL[k])) p.intent.push([INTENT_LABEL[k], v]);
          });
        } else if (it.kind === "dream") {
          addWriting(p, "Their dream week", it.text);
        } else if (it.kind === "mastery") {
          const skill = String(it.skill || "").trim();
          const advanced = it.advanced || (it.perfect === true ? "yes" : "");
          if (skill || it.relation || advanced) {
            const rel = { work: "their work", passion: "a lifelong passion" }[it.relation] || it.relation || "";
            const adv = { yes: "wants to go deeper", curious: "curious about going deeper", no: "" }[advanced] || "";
            p.masters.push({ skill: skill || "(unnamed)", rel, adv });
          }
        }
      });
    });

    (profiles || []).forEach((row) => {
      const p = get(row.email);
      if (!p) return;
      p.member = true;
      seen(p, row.created_at);
      const nm = String(row.first_name || row.name || "").trim();
      if (nm) p.name = nm;
      if (row.location && !p.region) p.region = String(row.location).trim();
      if (row.profession) p.profession = String(row.profession).trim();
      if (row.portrait_completed_at || row.portrait_complete) p.portrait = true;
      const iv = row.interests;
      if (Array.isArray(iv)) iv.forEach((c) => addCraft(p, pretty(c), false));
      else if (iv && typeof iv === "object") Object.values(iv).flat().forEach((c) => addCraft(p, pretty(c), false));
      addWriting(p, "The letter", row.dream_letter);
      addWriting(p, "About them", row.about);
      addWriting(p, "What matters to them", row.what_matters);
      [["When", row.availability], ["Length", row.preferred_duration], ["Reach", row.reach]].forEach(([k, v]) => {
        const s = String(v || "").trim();
        if (s && !p.intent.some((x) => x[0] === k)) p.intent.push([k, pretty(s)]);
      });
    });

    const out = [...people.values()];
    out.forEach((p) => { if (!p.name) p.name = p.email.split("@")[0]; });
    // the ones who wrote you come first; then most recently active
    out.sort((a, b) => (b.writings.length ? 1 : 0) - (a.writings.length ? 1 : 0) || String(b.last).localeCompare(String(a.last)));
    return out;
  }

  // ---- craft cloud ----
  function craftCounts(people) {
    const counts = new Map();
    people.forEach((p) => p.crafts.forEach((c) => {
      const k = c.label;
      counts.set(k, (counts.get(k) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // ---- categories of skill: the five Atlas worlds ----
  // Trust lock: every discipline name below is a live Atlas craft, copied
  // from the /circle questionnaire WORLDS source. A craft maps to exactly
  // one world; anything unrecognised (a person's own words, a legacy name)
  // stays visible in its own bucket so nobody is ever dropped.
  const WORLD_ORDER = ["The Wild", "Kitchen & Cellar", "Craft & Art", "Movement", "Body & Spirit"];
  const WORLD_TEASER = {
    "The Wild": "freediving, sailing, climbing real rock",
    "Kitchen & Cellar": "modernist technique, sushi, boulangerie",
    "Craft & Art": "forging a blade, throwing pottery, the perfumer’s organ",
    "Movement": "Argentine tango, flamenco, capoeira",
    "Body & Spirit": "Ashtanga, breathwork, Vipassana silence",
  };
  const WORLD_DISCS = {
    "The Wild": ["Freediving", "Scuba Diving", "Spearfishing", "Sailing & Yachtmaster", "Surfing", "Kitesurfing",
      "Rock Climbing", "Alpinism & Mountaineering", "Ski-touring & Splitboard", "Paragliding", "Whitewater Kayaking"],
    "Kitchen & Cellar": ["Modernist Spanish Cuisine", "New Basque Cuisine", "Classical French Cuisine", "French Pastry & Patisserie",
      "Bread & Boulangerie", "Sushi & Washoku", "Italian Cuisine & Pasta", "Thai Cuisine", "Oaxacan & Mexican Cuisine",
      "Peruvian Cuisine", "Wine & Sommellerie", "Coffee & Barista"],
    "Craft & Art": ["Pottery & Ceramics", "Woodworking & Joinery", "Blacksmithing & Bladesmithing", "Glassblowing",
      "Photography", "Filmmaking", "Textiles & Weaving", "Natural Dyeing", "Leatherwork", "Jewelry & Goldsmithing",
      "Perfumery", "Lutherie & Instrument-making"],
    "Movement": ["Argentine Tango", "Flamenco & Dance", "Capoeira", "Salsa", "Ecstatic Dance & Movement",
      "Bharatanatyam Indian Classical Dance"],
    "Body & Spirit": ["Hatha & Vinyasa Yoga", "Ashtanga Yoga", "Iyengar Yoga", "Kundalini Yoga", "Pranayama & Breathwork",
      "Vipassana & Meditation", "Ayurveda", "Thai Massage", "Sound Healing", "Tai Chi & Qigong", "Cold Exposure (Wim Hof Method)"],
  };
  const OWN = "In their own words";      // crafts a person typed themselves — real, just off-menu
  const UNPLACED = "Not yet placed";     // raised a hand, hasn't named a craft yet

  // ---- Atlas coverage: is a named skill already a live discipline page? ----
  // Ground truth = the discipline pages that actually exist under /atlas.
  // Regenerate on Atlas growth:
  //   ls website/atlas/*.html | xargs -n1 basename | grep -v -- '--' \
  //     | grep -vx index.html | sed 's/\.html$//'
  // slugify() reproduces the atlas filename rule (verified: all 52 /circle
  // crafts resolve to a live page). A named skill not in this set is one
  // Arnaud must add to the Atlas before he can write the person properly.
  const ATLAS_SLUGS = new Set([
    "adventure-and-off-road-motorcycling","alpinism-and-mountaineering","argentine-tango","asado-and-open-fire-cooking","ashtanga-yoga","avant-garde-and-modernist-technique",
    "ayurveda","bharatanatyam-indian-classical-dance","blacksmithing-and-bladesmithing","bookbinding-and-letterpress","brazilian-jiu-jitsu","bread-and-boulangerie",
    "bush-and-floatplane-flying","calligraphy-and-lettering","canyoning","capoeira","cave-and-technical-diving","caving-and-speleology",
    "cheese-and-fermentation","chocolate-and-confectionery","cigar-rolling","classical-french-cuisine","coffee-and-barista","cold-exposure-wim-hof-method",
    "dog-sledding-and-mushing","ecstatic-dance-and-movement","expedition-sea-kayaking","falconry","filmmaking","flamenco-and-dance",
    "fly-fishing","freediving","french-pastry-and-patisserie","glassblowing","guitar-and-music-performance","hatha-and-vinyasa-yoga",
    "horsemanship","ice-and-mixed-climbing","italian-cuisine-and-pasta","iyengar-yoga","jewelry-and-goldsmithing","karate",
    "kintsugi-japanese-gold-repair","kitesurfing","korean-cuisine-hansik","kundalini-yoga","kung-fu","kyudo-japanese-archery",
    "leatherwork","lutherie-and-instrument-making","lymphatic-drainage","marble-sculpture-and-stone-carving","mixology-and-bartending","modernist-spanish-cuisine",
    "motorsport-and-race-driving","mountain-biking","mountain-leadership-and-trekking","muay-thai","natural-dyeing","new-basque-cuisine",
    "north-indian-cuisine","oaxacan-and-mexican-cuisine","outdoor-leadership-and-wilderness-expeditions","painting-and-fine-art","paragliding","perfumery",
    "peruvian-cuisine","photography","pilates","pottery-and-ceramics","pranayama-and-breathwork","printmaking",
    "reflexology-and-shiatsu","reiki-and-energy-healing","rock-climbing","safari-and-wildlife-guiding","sailing-and-yachtmaster","sake-and-sommellerie-of-sake",
    "salsa","scuba-diving","sichuan-and-chinese-cuisine","ski-and-snowboard-mountain-guiding","ski-touring-and-splitboard","skydiving",
    "sound-healing","spearfishing","surfing","sushi-and-washoku","tai-chi-and-qigong","tantra-and-conscious-intimacy",
    "tattooing","tea-and-tea-ceremony","textiles-and-weaving","thai-cuisine","thai-massage","traditional-spa-and-hydrotherapy",
    "trail-and-ultra-running","viennoiserie","vietnamese-cuisine","vipassana-and-meditation","watchmaking","whisky-and-distilling",
    "whitewater-kayaking","whitewater-rafting","wilderness-survival-and-bushcraft","windsurfing-and-wing-foil","wine-and-sommellerie","wooden-boatbuilding",
    "woodworking-and-joinery",
  ]);
  const slugify = (s) => String(s || "").toLowerCase().replace(/&/g, " and ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const atlasSlug = (label) => { const g = slugify(label); return ATLAS_SLUGS.has(g) ? g : null; };
  const inAtlas = (label) => atlasSlug(label) !== null;

  // A newcomer is anyone who joined the Circle but hasn't had a welcome
  // letter yet — precisely the welcome queue.
  const isNewcomer = (p) => p.onList && !p.welcomedAt;
  // Named skills this person wants that the Atlas doesn't cover yet — the
  // ones to build before writing them. (No named skill ⇒ nothing to add.)
  const atlasGaps = (p) => p.crafts.filter((c) => !inAtlas(c.label)).map((c) => c.label);

  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const CRAFT_WORLD = (function () {
    const m = new Map();
    WORLD_ORDER.forEach((w) => WORLD_DISCS[w].forEach((d) => m.set(norm(d), w)));
    // profiles.interests may store the DB category keys (migration 029) as
    // labels — fold those back to a world so those members categorise too.
    [["ocean", "The Wild"], ["adventure", "The Wild"], ["culinary", "Kitchen & Cellar"],
     ["wellness", "Body & Spirit"], ["creative", "Craft & Art"]].forEach(([k, w]) => m.set(norm(k), w));
    return m;
  })();
  const worldOf = (label) => CRAFT_WORLD.get(norm(label)) || null;

  // every world a person's named crafts touch (Atlas order); [] if none map
  function personWorlds(p) {
    const hit = {};
    p.crafts.forEach((c) => { const w = worldOf(c.label); if (w) hit[w] = 1; });
    return WORLD_ORDER.filter((w) => hit[w]);
  }
  // the group(s) a person belongs to in the catalogue: their worlds, or a fallback bucket
  function placement(p) {
    const ws = personWorlds(p);
    if (ws.length) return ws;
    return [p.crafts.length ? OWN : UNPLACED];
  }
  const peopleInGroup = (people, g) => people.filter((p) => placement(p).indexOf(g) !== -1);
  // groups that actually have someone, in display order (worlds first, buckets last)
  function worldCounts(people) {
    const order = WORLD_ORDER.concat([OWN, UNPLACED]);
    const counts = new Map(order.map((g) => [g, 0]));
    people.forEach((p) => placement(p).forEach((g) => counts.set(g, counts.get(g) + 1)));
    return order.map((g) => [g, counts.get(g)]).filter((e) => e[1] > 0);
  }

  // welcome-queue triage sections
  const READY = "Ready to write";           // every named skill is already in the Atlas
  const ADD_FIRST = "Add to the Atlas first"; // a named skill you must build before writing

  // ---- render ----
  const state = { craft: null, world: null, lettersOnly: false, newOnly: false };

  function chip(label, n, active, own) {
    const border = active ? "var(--ember)" : own ? "rgba(210,138,82,.4)" : "var(--line)";
    const color = active ? "var(--ember)" : own ? "var(--ember)" : "var(--muted)";
    return '<button class="ppl-chip" data-craft="' + esc(label) + '" style="font-family:\'IBM Plex Mono\',monospace; font-size:11px; letter-spacing:.04em; padding:5px 11px; border-radius:999px; border:1px solid ' + border + "; color:" + color + '; background:' + (active ? "rgba(210,138,82,.08)" : "none") + '; margin:0 6px 8px 0;">' +
      esc(label) + (n != null ? ' <span style="opacity:.55;">' + n + "</span>" : "") + "</button>";
  }

  // category-of-skill chip (sea-tinted, distinct from the craft cloud)
  function worldChip(label, n, active) {
    const border = active ? "var(--sea)" : "var(--line)";
    const color = active ? "var(--sea)" : "var(--muted)";
    return '<button class="wld-chip" data-world="' + esc(label) + '" style="font-family:\'IBM Plex Mono\',monospace; font-size:11px; letter-spacing:.05em; text-transform:uppercase; padding:6px 13px; border-radius:8px; border:1px solid ' + border + "; color:" + color + '; background:' + (active ? "rgba(127,168,165,.10)" : "none") + '; margin:0 8px 8px 0;">' +
      esc(label) + (n != null ? ' <span style="opacity:.55;">' + n + "</span>" : "") + "</button>";
  }

  function worldHeader(g, n) {
    const teaser = WORLD_TEASER[g];
    return '<div style="margin:26px 0 4px; display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; border-bottom:1px solid var(--line); padding-bottom:8px;">' +
      '<h2 class="font-serif" style="font-size:18px; margin:0; color:var(--sea);">' + esc(g) + "</h2>" +
      '<span class="font-mono" style="font-size:11px; color:var(--faint);">' + n + " " + (n === 1 ? "person" : "people") + "</span>" +
      (teaser ? '<span class="font-mono" style="font-size:11px; color:var(--faint); font-style:italic; margin-left:auto;">' + esc(teaser) + "</span>" : "") +
      "</div>";
  }

  function paper(w, name) {
    return '<div style="background:#efe6d3; border-radius:8px; padding:16px 18px; margin:10px 0 0;">' +
      '<div class="font-mono" style="font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#6f6350; margin-bottom:8px;">' + esc(w.label) + "</div>" +
      '<p style="color:#2c231a; font-family:Georgia,serif; font-size:14.5px; line-height:1.75; margin:0; white-space:pre-wrap;">' + esc(w.text) + "</p>" +
      '<p style="color:#3a2c1e; font-family:Georgia,serif; font-style:italic; font-size:13px; margin:10px 0 0; text-align:right;">— ' + esc(name) + "</p></div>";
  }

  function personCard(p) {
    const pills =
      '<span class="pill ' + (p.member ? "confirmed" : "in") + '">' + (p.member ? "member" : "lead") + "</span>" +
      (isNewcomer(p) ? ' <span class="pill ready">new · to welcome</span>' : "") +
      (p.portrait ? ' <span class="pill posted">portrait ✓</span>' : "") +
      (p.unsubscribed ? ' <span class="pill none">unsubscribed</span>' : "");
    const meta = [p.region, p.profession].filter(Boolean).map(esc).join(" · ");
    const via = [p.sources.length ? "via " + esc(p.sources.join(", ")) : "", p.first ? "since " + esc(fmtDate(p.first)) : ""].filter(Boolean).join(" · ");
    // what the mail system has actually done for this person (welcomed_at + last_issue stamps)
    const letters = p.onList
      ? (p.welcomedAt
          ? 'welcomed ' + esc(fmtDate(p.welcomedAt))
          : '<span style="color:var(--ember);">never welcomed ⚠</span>') +
        (p.lastIssue ? ' &nbsp;·&nbsp; last letter: <span style="color:var(--muted);">' + esc(p.lastIssue) + "</span>" : "")
      : '<span style="font-style:italic;">not on the letter list</span>';
    // each craft is tagged with its Atlas status: a live discipline page
    // (click through to the place you'll point them at) or ⚠ one to build first.
    const craftChip = (c) => {
      const slug = atlasSlug(c.label);
      const border = slug ? "rgba(127,168,165,.35)" : "rgba(210,138,82,.55)";
      const inner = slug
        ? '<a href="/atlas/' + slug + '" target="_blank" rel="noopener" style="color:var(--paper); text-decoration:none;">' + esc(c.label) + ' <span style="color:var(--sea); font-size:10px;">✓ Atlas</span></a>'
        : esc(c.label) + ' <span style="color:var(--ember); font-size:10px; font-style:italic;">⚠ add to Atlas</span>';
      const own = c.own ? ' <span style="color:var(--faint); font-size:10px; font-style:italic;">· their words</span>' : "";
      return '<span style="display:inline-block; margin:0 6px 6px 0; padding:3px 10px; border:1px solid ' + border + '; border-radius:9px; font-size:12px; color:var(--paper);">' + inner + own + "</span>";
    };
    const crafts = p.crafts.length
      ? '<div style="margin:12px 0 0;">' + p.crafts.map(craftChip).join("") + "</div>"
      : '<p style="color:var(--faint); font-size:13px; font-style:italic; margin:12px 0 0;">No crafts named yet.</p>';
    const intent = p.intent.length
      ? '<div class="font-mono" style="font-size:11px; color:var(--faint); margin:10px 0 0;">' + p.intent.map(([k, v]) => esc(k) + ": <span style=\"color:var(--muted);\">" + esc(v) + "</span>").join(" &nbsp;·&nbsp; ") + "</div>"
      : "";
    const masters = p.masters.length
      ? '<div style="margin:12px 0 0;">' + p.masters.map((m) =>
          '<div style="display:inline-block; margin:0 8px 6px 0; padding:6px 12px; border:1px solid rgba(127,168,165,.4); border-left:2px solid var(--sea); border-radius:10px; font-size:12.5px; color:var(--paper);">' +
          '<span style="color:var(--sea); font-family:\'IBM Plex Mono\',monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase;">Masters</span> ' + esc(m.skill) +
          (m.rel ? ' <span style="color:var(--faint);">— ' + esc(m.rel) + '</span>' : '') +
          (m.adv ? ' <span style="color:var(--ember); font-style:italic;">· ' + esc(m.adv) + '</span>' : '') + '</div>').join("") + "</div>"
      : "";
    const writings = p.writings.map((w) => paper(w, p.name)).join("");
    return '<div class="panel" style="padding:22px 24px;">' +
      '<div style="display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;">' +
      '<h3 class="font-serif" style="font-size:21px; margin:0; color:var(--paper);">' + esc(p.name) + "</h3>" + pills +
      '<a class="link-quiet" style="margin-left:auto; font-size:12px; color:var(--sea); text-decoration:none;" href="mailto:' + esc(p.email) + '">Write back →</a></div>' +
      '<div class="font-mono" style="font-size:11.5px; color:var(--sea); margin:6px 0 0;"><a class="link-quiet" style="color:var(--sea); text-decoration:none;" href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a>" + (meta ? ' &nbsp;·&nbsp; <span style="color:var(--muted);">' + meta + "</span>" : "") + "</div>" +
      (via ? '<div class="font-mono" style="font-size:10.5px; color:var(--faint); margin:4px 0 0;">' + via + "</div>" : "") +
      '<div class="font-mono" style="font-size:10.5px; color:var(--faint); margin:4px 0 0;">Letters: ' + letters + "</div>" +
      crafts + masters + intent + writings + "</div>";
  }

  // triage section header (welcome queue): accent = sea (ready) or ember (build first)
  function queueHeader(title, n, sub, accent) {
    return '<div style="margin:24px 0 4px; display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; border-bottom:1px solid var(--line); padding-bottom:8px;">' +
      '<h2 class="font-serif" style="font-size:18px; margin:0; color:' + accent + ';">' + esc(title) + "</h2>" +
      '<span class="font-mono" style="font-size:11px; color:var(--faint);">' + n + " " + (n === 1 ? "person" : "people") + "</span>" +
      (sub ? '<span class="font-mono" style="font-size:11px; color:var(--faint); font-style:italic; margin-left:auto;">' + esc(sub) + "</span>" : "") +
      "</div>";
  }

  function renderBody(body, people) {
    const emptyMsg = '<p style="color:var(--faint); font-size:14px; font-style:italic; margin:14px 0 0;">No one here under that filter.</p>';
    const grid = (list) => '<div style="display:grid; gap:14px; margin:14px 0 6px;">' + list.map(personCard).join("") + "</div>";

    const wrote = people.filter((p) => p.writings.length).length;
    const newcomers = people.filter(isNewcomer).length;
    const realWorlds = worldCounts(people).filter((e) => WORLD_ORDER.indexOf(e[0]) !== -1).length;

    // filters stack: "Wrote to me" and "New — to welcome" each narrow the set.
    let base = people;
    if (state.lettersOnly) base = base.filter((p) => p.writings.length);
    if (state.newOnly) base = base.filter(isNewcomer);

    const clean = !state.world && !state.craft && !state.lettersOnly && !state.newOnly;

    let html =
      '<div class="font-mono" style="font-size:11px; color:var(--faint); margin:0 0 16px;">' +
        people.length + " people &nbsp;·&nbsp; " +
        '<span style="color:var(--ember);">' + newcomers + " to welcome</span> &nbsp;·&nbsp; " +
        wrote + " wrote you something &nbsp;·&nbsp; sorted into " + realWorlds + " skill worlds</div>" +
      '<div style="margin:0 0 14px;">' +
        chip("Everyone", people.length, clean) +
        chip("New — to welcome", newcomers, state.newOnly) +
        chip("Wrote to me", wrote, state.lettersOnly) +
      "</div>";

    if (state.newOnly) {
      // ── the welcome queue, sorted by Atlas readiness ──
      const ready = base.filter((p) => atlasGaps(p).length === 0);
      const add = base.filter((p) => atlasGaps(p).length > 0);
      html += '<p class="font-mono" style="font-size:11px; color:var(--faint); margin:2px 0 4px; line-height:1.7;">Everyone who just joined and still needs a welcome letter — split by whether you can write them now or must add their skill to the Atlas first.</p>';
      if (!base.length) {
        html += '<p style="color:var(--faint); font-size:14px; font-style:italic; margin:14px 0 0;">No one waiting — every joiner has been welcomed. ✓</p>';
      } else {
        html +=
          queueHeader(READY, ready.length, "skill already in the Atlas — point them at the place and write", "var(--sea)") +
          (ready.length ? grid(ready) : '<p style="color:var(--faint); font-size:13px; font-style:italic; margin:8px 0 0;">No one waiting here.</p>') +
          queueHeader(ADD_FIRST, add.length, "named a skill the Atlas doesn’t cover yet — build it, then write", "var(--ember)") +
          (add.length ? grid(add) : '<p style="color:var(--faint); font-size:13px; font-style:italic; margin:8px 0 0;">Nothing to add — every newcomer’s skill is already covered.</p>');
      }
    } else {
      // ── the catalogue, sorted by category of skill ──
      const cloud = craftCounts(base).filter((e) => {
        if (!state.world) return true;
        if (state.world === OWN) return worldOf(e[0]) === null;
        if (state.world === UNPLACED) return false;
        return worldOf(e[0]) === state.world;
      });
      html +=
        '<div class="font-mono" style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin:0 0 8px;">By category of skill</div>' +
        '<div style="margin:0 0 14px;">' +
          worldCounts(base).map((e) => worldChip(e[0], e[1], state.world === e[0])).join("") +
        "</div>";
      if (cloud.length) {
        html += '<div style="margin:0 0 8px; border-bottom:1px solid var(--line); padding-bottom:14px;">' +
          (state.world ? '<div class="font-mono" style="font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin:0 0 8px;">Crafts in ' + esc(state.world) + "</div>" : "") +
          cloud.map((e) => chip(e[0], e[1], state.craft === e[0])).join("") + "</div>";
      }
      if (state.craft) {
        const shown = base.filter((p) => p.crafts.some((c) => c.label === state.craft));
        html += shown.length ? grid(shown) : emptyMsg;
      } else if (state.world) {
        const shown = peopleInGroup(base, state.world);
        html += worldHeader(state.world, shown.length) + (shown.length ? grid(shown) : emptyMsg);
      } else {
        const sections = worldCounts(base).map((e) => {
          const shown = peopleInGroup(base, e[0]);
          return worldHeader(e[0], shown.length) + grid(shown);
        }).join("");
        html += sections || emptyMsg;
      }
    }

    body.innerHTML = html;

    body.querySelectorAll(".wld-chip").forEach((b) => b.addEventListener("click", () => {
      const g = b.getAttribute("data-world");
      state.world = state.world === g ? null : g;
      state.craft = null; // a craft only makes sense inside its world
      renderBody(body, people);
    }));
    body.querySelectorAll(".ppl-chip").forEach((b) => b.addEventListener("click", () => {
      const c = b.getAttribute("data-craft");
      if (c === "Everyone") { state.craft = null; state.world = null; state.lettersOnly = false; state.newOnly = false; }
      else if (c === "Wrote to me") { state.lettersOnly = !state.lettersOnly; }
      else if (c === "New — to welcome") { state.newOnly = !state.newOnly; state.world = null; state.craft = null; }
      else state.craft = state.craft === c ? null : c;
      renderBody(body, people);
    }));
  }

  function note(v, text, extraHtml) {
    v.innerHTML = '<div style="border:1px solid var(--line); border-radius:14px; padding:26px 28px; background:var(--ink-2);">' +
      '<p style="margin:0; color:var(--muted); font-size:14px; line-height:1.8;">' + text + "</p>" + (extraHtml || "") + "</div>";
  }

  function waitForClient(cb, n) {
    n = n || 0;
    if (window.supabaseClient) return cb(window.supabaseClient);
    if (window.supabaseError || n > 100) return cb(null);
    setTimeout(() => waitForClient(cb, n + 1), 50);
  }

  window.ET_RENDER_PEOPLE = function (v) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div style="margin-bottom:26px;">' +
      '<h1 class="font-serif" style="font-size:15px; letter-spacing:.02em; margin:0; color:var(--sea);">The Circle — person by person</h1>' +
      '<p class="font-mono" style="font-size:11px; color:var(--faint); margin:6px 0 0;">Everyone who raised a hand, sorted by the world their skill lives in · what they love · every word they wrote you.</p>' +
      '</div><div id="people-body"></div>';
    v.appendChild(wrap);
    const body = wrap.querySelector("#people-body");
    note(body, "Opening the room…");

    waitForClient((client) => {
      if (!client) return note(body, "Couldn’t reach the Circle (connection issue). The rest of the Studio still works.");
      client.auth.getSession().then((res) => {
        const session = res && res.data ? res.data.session : null;
        if (!session) {
          return note(body,
            "The room is sealed — it opens only for the admin account. Sign in once and come back; the session sticks to this browser.",
            '<p style="margin:12px 0 0;"><a class="link-quiet" style="color:var(--sea); font-size:13px;" href="/join">Sign in →</a></p>');
        }
        Promise.all([
          client.from("launch_waitlist").select("email,interests,source,created_at,unsubscribed,welcomed_at,last_issue").order("created_at", { ascending: false }).limit(500),
          client.from("profiles").select("email,name,first_name,location,profession,about,interests,what_matters,dream_letter,availability,preferred_duration,reach,portrait_complete,portrait_completed_at,created_at").order("created_at", { ascending: false }).limit(500),
        ]).then(([w, pr]) => {
          if (w.error && pr.error) return note(body, "The room answered with an error: " + esc(w.error.message));
          const people = build(w.data || [], pr.data || []);
          if (!people.length) return note(body, "No one yet — the Circle door just opened. They’ll appear here the moment they join.");
          renderBody(body, people);
          if (w.error || pr.error) {
            const warn = document.createElement("p");
            warn.className = "font-mono";
            warn.style.cssText = "font-size:11px; color:var(--ember); margin:14px 0 0;";
            warn.textContent = "One source didn’t answer (" + (w.error ? "waitlist" : "profiles") + ") — showing the rest.";
            body.appendChild(warn);
          }
        });
      });
    });
  };

  // test hook (node): pure builders, no DOM
  window.ET_PEOPLE_TEST = { build, craftCounts, worldOf, personWorlds, placement, worldCounts, slugify, inAtlas, atlasSlug, isNewcomer, atlasGaps };
})();
