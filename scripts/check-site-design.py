#!/usr/bin/env python3
"""check-site-design: every page wears the three-colour design (Nov 2026).

Fails when a page in website/ carries the retired Warm-Dark palette (ink #0d0b09, surface
#14110d, ember #d28a52, paper type rgba(243,237,226,..)) or a link home still
spells the old wordmark. Paper stays legal in css/et.css:
it is the type colour on a photograph. A redirect stub (meta refresh, no body) is skipped.
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "website"
OLD = re.compile(r"#0d0b09|#14110d|#d28a52|rgba\(\s*243\s*,\s*237\s*,\s*226", re.I)
bad = []
for f in sorted(SITE.rglob("*.html")):
    t = f.read_text(errors="replace")
    if 'http-equiv="refresh"' in t and len(t) < 4000:
        continue
    rel = f.relative_to(SITE)
    m = OLD.search(t)
    if m:
        bad.append(f"{rel}: the retired dark palette ({m.group(0)})")
    # the wordmark: wherever the name links home, it is the spark + EDUCATED TRAVELER
    for a in re.findall(r'<a[^>]*href="/"[^>]*>(?:(?!</a>).){0,600}?</a>', t, re.S):
        if "EDUCATED" in a and "/images/mark/spark.svg" not in a and "nav-mark" not in a:
            bad.append(f"{rel}: the old wordmark ({re.sub(r'<[^>]+>', '', a).strip()[:40]})")
for f in sorted((SITE / "css").glob("*.css")) + sorted((SITE / "js").glob("*.js")):
    if f.name in ("et.css", "home.css"):   # paper is the type colour on a photograph
        continue
    m = OLD.search(f.read_text(errors="replace"))
    if m:
        bad.append(f"{f.relative_to(SITE)}: the retired dark palette ({m.group(0)})")
if bad:
    print("check-site-design: FAIL"); [print("  · " + b) for b in bad]; sys.exit(1)
print(f"check-site-design: OK — every page in three colours")
