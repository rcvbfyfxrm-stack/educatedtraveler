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
    status: 'open',
    teaser: 'Five days in Martin Lippo’s Barcelona laboratory — sous-vide, textures, spheres, foams, liquid nitrogen — 35 hours hands-in, in English, built for working chefs off boats first. You leave with the techniques, a signed certificate, a portfolio shot by his team, and the full recipe dossiers.',
    when: 'October 2026',
    note: 'Confirmed at 10 paid by 15 September — or everyone is refunded in full. First word goes to the Circle.',
    extras: 'Around the five days, optional add-ons are taking shape — among them a three-Michelin-star dinner with a private table and eyes in the kitchen, an open-fire day, and a Barcelona source day — announced once confirmed, nothing sold until it’s booked and real. Stay optional too: a shared cohort apartment with your own private room, or arrange your own.',
    master: 'Martin Lippo',
    dates: '22–26 October 2026',
    url: '/barcelona'
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
    var extras = w.extras
      ? '<p class="text-paper-faint text-xs mt-4 pt-4" style="border-top:1px solid rgba(243,237,226,0.09)">' + w.extras + '</p>'
      : '';
    if (open && w.url) {
      // whole card is the link
      var cta = '<span class="btn-primary inline-block px-7 py-3 rounded-full text-sm">See the week →</span>';
      return '<a href="' + w.url + '" class="panel p-7 md:p-9 text-left reveal in block" style="text-decoration:none;color:inherit;cursor:pointer">' +
        head + title + body + cta + extras + '</a>';
    }
    var foot = '<p class="text-paper-faint text-xs">' + w.note + '</p>';
    return '<div class="panel p-7 md:p-9 text-left reveal in">' + head + title + body + foot + extras + '</div>';
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
