// Collaborations — single source of truth for launch cards (homepage + /collaborations).
// A collaboration is the Atlas come true: a named master, his own lab, open enrolment,
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
    craft: 'New culinary techniques & technologies',
    place: 'Barcelona',
    world: 'Kitchen & Cellar',
    status: 'done',
    teaser: 'Five days in Martin Lippo’s Barcelona laboratory — textures, spheres, liquid nitrogen, foams, sous-vide — 35 hours hands-in, in English, for working chefs. The week is over; the chefs who were in the room wrote about it.',
    when: 'October 2026',
    note: 'Done. Their notes are on the page.',
    master: 'Martin Lippo',
    dates: '22–26 October 2026',
    // The card facts. Kept here rather than written into a page, so the week has one
    // record and the Atlas cannot quote a length or a cap the launch page disagrees with.
    hours: '35 hours · in English',
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
    var done = w.status === 'done';
    var head =
      '<div class="flex items-baseline justify-between gap-4 mb-4">' +
        '<p class="eyebrow">Collaboration ' + w.number + (w.place ? ' · ' + w.place : '') + '</p>' +
        '<p class="font-mono text-[10px] uppercase tracking-[0.25em] ' + (open ? '' : 'text-paper-faint') + '"' +
          (open ? ' style="color:var(--ember)"' : '') + '>' +
          (w.status === 'confirmed' ? 'Confirmed — it runs' :
           w.status === 'open' ? 'Doors open' :
           w.status === 'done' ? 'Done · October 2026' : w.when) +
        '</p>' +
      '</div>';
    var lock = ((open || done) && w.master)
      ? '<p class="font-serif text-lg md:text-xl mb-2" style="color:var(--paper)">' + w.master +
        ' <span style="color:var(--ember)">&times;</span> <span style="color:var(--sea)">EducatedTraveler</span></p>'
      : '';
    var title = '<h3 class="font-serif font-light text-2xl md:text-3xl tracking-tight mb-3">' +
      w.craft +
      '</h3>';
    var body = '<p class="text-paper-muted text-sm leading-relaxed mb-4">' +
      ((open || done) && w.dates ? w.teaser + ' <span class="text-paper">' + w.dates + '.</span>' : w.teaser) + '</p>';
    var extras = w.extras
      ? '<p class="text-paper-faint text-xs mt-4 pt-4" style="border-top:1px solid rgba(243,237,226,0.09)">' + w.extras + '</p>'
      : '';
    if ((open || done) && w.url) {
      // whole card is the link
      var cta = '<span class="btn-primary inline-block px-7 py-3 rounded-full text-sm">' + (done ? 'Read what the chefs said →' : 'See the week →') + '</span>';
      return '<a href="' + w.url + '" class="panel p-7 md:p-9 text-left reveal in block" style="text-decoration:none;color:inherit;cursor:pointer">' +
        head + lock + title + body + cta + extras + '</a>';
    }
    var foot = '<p class="text-paper-faint text-xs">' + w.note + '</p>';
    return '<div class="panel p-7 md:p-9 text-left reveal in">' + head + lock + title + body + foot + extras + '</div>';
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
