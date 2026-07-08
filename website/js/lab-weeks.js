// Lab Weeks — single source of truth for launch cards (homepage + /lab-weeks).
// A Lab Week is the Atlas come true: a named master, his own lab, open enrolment,
// at the source. Strategy lock: no prices here — the numbers live on the one
// commercial page each open Lab Week links to.
//
// TO FLIP A LAUNCH LIVE: change status + fill master/dates/url. Nothing else.
//   status: 'teaser'    → signature-safe: no master name, no dates-as-fact, no link
//           'open'      → master named, dates real, card links to `url`
//           'confirmed' → cohort confirmed (week is running)
//           'done'      → delivered; card becomes part of the record
window.LAB_WEEKS = [
  {
    id: 'lab-week-01',
    number: '01',
    craft: 'The Avant-Garde Kitchen',
    place: 'Barcelona',
    world: 'Kitchen & Cellar',
    status: 'teaser',
    // -- teaser copy (safe before signature) --
    teaser: 'Five days in a working laboratory where the modern techniques — sous-vide, textures, spheres, foams, liquid nitrogen — are taught openly by the chef who runs it. Built for working chefs off boats first.',
    when: 'Autumn 2026',
    note: 'The master is named — and the door opens — the day the terms are signed. First word goes to the Circle.',
    // -- filled at flip (status: 'open') --
    master: null,            // 'Martin Lippo'
    dates: null,             // '22–26 October 2026'
    url: null                // '/barcelona'
  },
  {
    id: 'lab-week-02',
    number: '02',
    craft: 'In the ground',
    place: null,
    world: null,
    status: 'teaser',
    teaser: 'Chosen by the Circle: the craft the most of you name is the door we go knock on next.',
    when: '2027',
    note: 'Tell us below what you would cross an ocean to learn.',
    master: null, dates: null, url: null
  }
];

// Tiny renderer: fills any element with [data-lab-weeks] with the cards.
(function () {
  function card(w) {
    var open = w.status === 'open' || w.status === 'confirmed';
    var head =
      '<div class="flex items-baseline justify-between gap-4 mb-4">' +
        '<p class="eyebrow">Lab Week ' + w.number + (w.place ? ' · ' + w.place : '') + '</p>' +
        '<p class="font-mono text-[10px] uppercase tracking-[0.25em] ' + (open ? '' : 'text-paper-faint') + '"' +
          (open ? ' style="color:var(--ember)"' : '') + '>' +
          (w.status === 'confirmed' ? 'Confirmed — it runs' :
           w.status === 'open' ? 'Doors open' :
           w.status === 'done' ? 'Delivered' : w.when) +
        '</p>' +
      '</div>';
    var title = '<h3 class="font-serif font-light text-2xl md:text-3xl tracking-tight mb-3">' +
      w.craft + (open && w.master ? '<span class="text-paper-muted"> — with ' + w.master + '</span>' : '') +
      '</h3>';
    var body = '<p class="text-paper-muted text-sm leading-relaxed mb-4">' +
      (open && w.dates ? w.teaser + ' <span class="text-paper">' + w.dates + '.</span>' : w.teaser) + '</p>';
    var foot = open && w.url
      ? '<a href="' + w.url + '" class="btn-primary inline-block px-7 py-3 rounded-full text-sm">See the week →</a>'
      : '<p class="text-paper-faint text-xs">' + w.note + '</p>';
    return '<div class="panel p-7 md:p-9 text-left reveal in">' + head + title + body + foot + '</div>';
  }
  function render() {
    document.querySelectorAll('[data-lab-weeks]').forEach(function (el) {
      var limit = parseInt(el.dataset.labWeeks, 10) || window.LAB_WEEKS.length;
      el.innerHTML = window.LAB_WEEKS.slice(0, limit).map(card).join('');
    });
  }
  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', render);
})();
