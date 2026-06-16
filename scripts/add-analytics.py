#!/usr/bin/env python3
"""Insert the privacy-light analytics snippet into the hand-built marketing pages.

The 424 generated Atlas pages get the snippet from build-atlas-pages.py (ANALYTICS const);
this covers the hand-authored public pages. Idempotent — skips pages that already have it.
Admin/cmd (Disallow in robots.txt) and pure auth/app utility pages are intentionally excluded.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "website"
SNIPPET = '<script defer data-domain="educatedtraveler.app" src="https://plausible.io/js/script.js"></script>'

# Public, indexable marketing surface only.
PAGES = [
    "index.html", "about.html", "community.html", "crew.html", "repertoire.html",
    "instructors.html", "survey.html", "join.html", "offerings.html", "vision.html",
    "manifesto.html", "sushi-mastery.html", "modernist-barcelona.html", "barcelona-vermut.html",
]

done, skipped, missing = [], [], []
for name in PAGES:
    p = WEB / name
    if not p.exists():
        missing.append(name); continue
    txt = p.read_text()
    if "plausible.io/js/script.js" in txt:
        skipped.append(name); continue
    idx = txt.lower().find("</head>")
    if idx == -1:
        missing.append(name + " (no </head>)"); continue
    p.write_text(txt[:idx] + SNIPPET + "\n" + txt[idx:])
    done.append(name)

print(f"inserted: {len(done)} -> {', '.join(done) or '(none)'}")
print(f"already had it: {len(skipped)} -> {', '.join(skipped) or '(none)'}")
if missing:
    print(f"WARNING missing/odd: {', '.join(missing)}")
