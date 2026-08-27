/* ════════════════════════════════════════════════════════════════════
   The Atlas browse page runs on window.ET_ATLAS + window.ET_RATINGS — the
   shapes repertoire.js and atlas-ratings.js used to provide. Those two files
   are no longer served: between them they were 1.3 MB of every school, master,
   course, price and booking URL we hold, free to anyone who asked for them,
   which made gating a page meaningless.

   So this rebuilds those two globals from window.ET_ATLAS_INDEX — the thin
   index the Atlas build generates. The browse page itself is UNCHANGED and
   doesn't know the difference.

   What the index carries, and therefore what this can reconstruct:
     OPEN craft  — every place, with the school, the lineage, the reason to go,
                   the rating. Its page publishes all of that anyway.
     SHORT craft — what the craft is, and the one place it's most alive. Exactly
                   what its own sheet says, and nothing else: no school, no
                   teacher, no course, no price, no rating. None of it is here to
                   leak, because none of it was sent.

   Load order: atlas-index.js → this → the page's own script.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var IDX = window.ET_ATLAS_INDEX || { crafts: [] };
  var crafts = IDX.crafts || [];

  var disciplines = crafts.map(function (c) {
    var dests = (c.dests || []).map(function (x) {
      // On an open card the sentence is the reason to go to THAT PLACE. A craft
      // nobody has asked for has no published reason-to-go, so the same slot
      // carries what the craft actually is — the one line its own short sheet
      // leads with. Both are true of the card they sit on.
      var line = x.why || (c.open ? "" : (c.blurb || ""));
      return {
        id: x.id, place: x.place, country: x.country, region: x.region || "",
        role: x.role || "", communityRank: x.rank || 0, communityLabel: x.rankLabel || "",
        bestSeason: x.season || "", level: x.level || "",
        tripTier: x.tripTier || 0, tripType: x.tripType || "", tripLength: x.tripLength || "",
        englishTaught: x.english === true, instructionLanguage: x.lang || "",
        badges: x.badges || [],
        masters: x.master ? [x.master] : [],
        why: line,
        // The hand-written sentence for this place. A craft nobody has asked for has
        // none — nobody has done the work behind it yet — and that is why a card with
        // one place has nothing to walk and never claims otherwise.
        learn: x.learn || "",
        // schoolsInfo carries only the NAME the card prints — never a URL, a
        // course, a price or a rating link. The page reads .name and .length.
        schoolsInfo: x.school ? [{ name: x.school }]
                              : new Array(x.nSchools || 0).fill(null).map(function () { return {}; }),
        schools: []
      };
    });
    return {
      id: c.id,
      discipline: c.name,
      category: c.cat,
      // A craft nobody has asked for has no credential to claim. The browse card
      // falls back to "Hand-verified" on an empty certShort, and saying that of an
      // unopened craft would be a claim we haven't earned — so it says its state.
      certShort: c.open ? (c.certShort || "") : "Not open yet",
      goldCredential: c.open ? (c.cred || "") : "",
      certBody: "",
      blurb: c.blurb || "",
      // `featured` drives the card's "Our pick for this craft" badge, which is a
      // recommendation in our name — so it may only ever come from a published pick
      // (c.destId), never from list order. The old fallback took dests[0], which is
      // harmless today because the only crafts without a destId have exactly one
      // destination, but the moment such a craft gained a second one it would have
      // started calling first-in-the-array our pick. Trust is the anchor (Arnaud,
      // 2026-08-16): a pick is named only when it beats the field by a clear
      // distance, so a craft with a real choice and no published pick gets no badge.
      featured: c.destId ? { id: c.destId }
              : (dests.length === 1 ? { id: dests[0].id } : {}),
      destinations: dests,
      // Whether the craft is open. BOTH names, and that is not belt-and-braces:
      // the page reads `.open` in three places — countOpen(), the closed-craft
      // count under a place filter, and every DESTS row — while this file only
      // ever set `_open`. So countOpen() returned 0 and the live page said "in the
      // 0 open crafts" whenever a place filter was on, with 34 of them open.
      // Renaming either side would leave the other broken; carrying both is what
      // makes every existing reader correct without touching the page.
      open: !!c.open,
      _open: !!c.open
    };
  });

  window.ET_ATLAS = { generatedAt: IDX.generatedAt || "", disciplines: disciplines };

  var ratings = {};
  crafts.forEach(function (c) {
    if (!c.open || !c.star) return;
    ratings[c.id] = {
      destId: c.destId, stars: c.star.v, count: c.star.n, source: c.star.src,
      school: c.star.school || "", whyPick: c.star.whyPick || ""
    };
  });
  window.ET_RATINGS = ratings;

  /* Mark the cards of crafts that aren't open yet. The page's own renderer is
     untouched; this only adds a class after each repaint, so the card can read
     as quieter without a second card design existing. */
  var SHUT = {};
  crafts.forEach(function (c) { if (!c.open) SHUT[c.id] = 1; });
  function stamp() {
    var cards = document.querySelectorAll(".dcard,.gcard");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var a = card.matches("a") ? card : card.querySelector("a.cardlink");
      var href = a && a.getAttribute("href");
      if (!href) continue;
      var slug = href.split("/atlas/")[1];
      var shut = !!SHUT[slug];
      card.classList.toggle("shut", shut);
      if (!shut) continue;
      // The card ships an empty .cfoot, invisible on an open craft. Here it becomes
      // the one extra line a locked card carries, and it names the mechanism exactly:
      // a letter, to Arnaud, is what opens the craft. "Ask me to open this one" left
      // the reader to guess who "me" was and how you would ask.
      var foot = card.querySelector(".cfoot");
      if (foot) { foot.textContent = "✎ A letter to Arnaud opens this one →"; foot.className = "cfoot askline"; }
    }
  }
  document.addEventListener("et:atlas-render", stamp);
  if (document.readyState !== "loading") setTimeout(stamp, 0);
  else document.addEventListener("DOMContentLoaded", function () { setTimeout(stamp, 0); });
  window.ETAtlasShim = { stamp: stamp, shut: SHUT };
})();
