"""Port The Whole (et-brush.html) into the real site: et.css + home.css + et.js + index.html + the star file."""
import re, sys, pathlib
SRC = pathlib.Path(sys.argv[1]); SITE = pathlib.Path(sys.argv[2])
s = SRC.read_text()
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1).split('\n')
L = lambda a, b: '\n'.join(css[a - 1:b])          # 1-based inclusive, as numbered in whole.css
# ---------- the shared layer ----------
shared = '\n'.join([
'/* EducatedTraveler: the one stylesheet. Three colours: white (ground), ink (type), sea (the one colour).',
'   Sea #4e7b78 on white; #7fa8a5 over a photograph. Paper #f3ede2 only as type on a photograph. */',
L(8, 61), L(95, 122), L(140, 151), L(207, 209), L(230, 236), L(264, 274),
'.wordmark{display:inline-flex;align-items:center;gap:11px;color:#fff;white-space:nowrap}',
'nav.solid .wordmark{color:var(--ink)}',
'.nav-mark{width:24px;height:24px;display:block;flex:0 0 auto;color:var(--paper)}nav.solid .nav-mark{color:var(--ink)}',
'.foot-star{width:min(100%,220px);height:auto;display:block;margin:0 auto 10px;opacity:.88}',
'.btn,.nav-cta,.film,.modal{border-radius:0}.modal{max-width:640px}',
])
# fold the old two-tone wordmark into one colour: drop the <b> rules
shared = re.sub(r'\.wordmark b\{[^}]*\}', '', shared).replace('nav.solid .wordmark b{color:var(--sea)}', '')
home = '\n'.join(['/* the homepage only; everything shared is in /css/et.css */',
    L(63, 94), L(124, 138), L(153, 205), L(211, 228), '.reasons li,.band-facts li,.cn-sticker{border-radius:0}', L(244, 263), L(275, 277)])
(SITE / 'css' / 'et.css').write_text(shared.strip() + '\n'); (SITE / 'css' / 'home.css').write_text(home.strip() + '\n')
# ---------- the body ----------
body = s[s.index('<!-- NAV -->'):]
body = body[:body.rindex('<script>')]
js = s[s.rindex('<script>') + 8: s.rindex('</script>')]
js = js.replace("window.goCircle=function(){ window.open('https://educatedtraveler.app/circle','_blank'); };",
                "window.goCircle=function(){ window.location.href='/circle'; };")
assert "location.href='/circle'" in js
# guard the founder film so et.js runs on every page
js = js.replace("var ROMAN=", "if(!document.getElementById('film')) return;\n  var ROMAN=")
(SITE / 'js' / 'et.js').write_text('/* EducatedTraveler: the bar, reveal-on-scroll, sheets, the Circle door, the founder film. */\n' + js.strip() + '\n')
# images back to their real files, by alt text
live = (SITE / 'index.html').read_text()
alt2src = {a: p for p, a in re.findall(r'<img[^>]*?src="(/images/[^"]+)"[^>]*?alt="([^"]*)"', live)}
alt2src['Arnaud plating a dish in a yacht galley'] = '/images/story/founder/galley.jpg'
def img(m):
    tag = m.group(0); a = re.search(r'alt="([^"]*)"', tag).group(1)
    return re.sub(r'src="data:[^"]+"', 'src="%s"' % alt2src[a], tag)
body = re.sub(r'<img[^>]*src="data:[^"]+"[^>]*>', img, body)
assert 'data:image' not in body.split('<footer>')[0] or True
# the footer star as a file
star = re.search(r'<svg class="foot-comet".*?</svg>', body, re.S).group(0)
svgfile = star.replace('class="foot-comet" ', 'xmlns="http://www.w3.org/2000/svg" ').replace('currentColor', '#0e1615')
svgfile = re.sub(r' role="img" aria-label="[^"]*"', '', svgfile)
(SITE / 'images' / 'mark').mkdir(exist_ok=True); (SITE / 'images' / 'mark' / 'star-brush.svg').write_text(svgfile + '\n')
body = body.replace(star, '<img class="foot-star" src="/images/mark/star-brush.svg" width="220" height="54" alt="">')
# links: site-relative; wordmark one text; rulings
body = body.replace('https://educatedtraveler.app/', '/')
body = body.replace('EDUCATED<b>TRAVELER</b>', '<span>EDUCATED TRAVELER</span>')
assert '<span>EDUCATED TRAVELER</span>' in body
body = body.replace('A week built with a master, in their own working room', 'A week built with a teacher, in their own working room')
wrong = re.search(r'href="(mailto:[^"]+)"', live).group(1)
body = body.replace('<p class="foot-wrong"><a href="/">', '<p class="foot-wrong"><a href="%s">' % wrong)
# collab-notes markers around the strip so build-collab-notes.py keeps writing it
i = body.index('<div class="cn-strip">'); j = body.index('</div>\n    <div class="mcta">', i) + len('</div>')
body = body[:i] + '<!--collab-notes:strip-->\n' + body[i:j] + '\n<!--/collab-notes:strip-->' + body[j:]
for bad in ('data:image', 'class="sky"', 'tailpick', 'foot-comet'): assert bad not in body, bad
# ---------- the head ----------
head = live[:live.index('<style')]
head = head.replace('<link rel="stylesheet" href="/css/collab-notes.css">\n', '')
DESC = 'Learn a real craft where it is still alive, from the teacher, beside your people. A record of where crafts are still taught at the source, with a name and a date on every line.'
head = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + DESC, head)
head = re.sub(r'(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*', r'\g<1>' + DESC, head)
head = head.replace('<link rel="preload" as="image" href="/images/labweek/hero.jpg" fetchpriority="high">', '<link rel="preload" as="image" href="/images/labweek/hero.jpg" fetchpriority="high">\n<link rel="stylesheet" href="/css/et.css">\n<link rel="stylesheet" href="/css/home.css">')
head = head.replace('<body>\n<script>document.documentElement.className+=\' js\';</script>\n', '')
scripts = re.findall(r'<script[^>]*src="[^"]+"[^>]*></script>', live)
tail = '\n'.join(s2 for s2 in scripts if 'plausible' not in s2)
page = head.rstrip() + '\n<body>\n<script>document.documentElement.className+=\' js\';</script>\n\n' + body.strip() + '\n\n<script src="/js/et.js"></script>\n' + tail + '\n</body>\n</html>\n'
for bad in (' free ', 'Free,', 'master'): 
    if bad in page: print('WARN contains', repr(bad), page.count(bad))
(SITE / 'index.html').write_text(page)
print('index', len(live), '->', len(page), '| et.css', len((SITE/'css'/'et.css').read_text()), '| home.css', len((SITE/'css'/'home.css').read_text()), '| et.js', len(js))
