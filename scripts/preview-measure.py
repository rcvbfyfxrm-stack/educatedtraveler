#!/usr/bin/env python3
"""Render the drafted Measures as a page, so a grade can be READ before it is signed.

"I draft, you sign" only works if the reading is easy, and a JSON blob in a terminal
is not reading. This renders each waiting draft through atlas_hub.measure_html() — the
same function the site uses, not a lookalike — inside the Atlas's own tokens, so what
you approve is what would ship.

It writes OUTSIDE website/ on purpose. A drafted grade must not be one stray path away
from being published, and a preview living in the deploy directory is exactly that.

    python3 scripts/preview-measure.py [--out /path/to/file.html]
"""
import argparse
import html
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import atlas_hub

ROOT = Path(__file__).resolve().parent.parent
DRAFTS = ROOT / "data/atlas-measure-drafts.json"
DEFAULT_OUT = Path("/private/tmp/claude-501/-Users-callierapca/measure-drafts.html")

CSS = """
:root{--ink:#0d0b09;--ink2:#14110d;--paper:#f3ede2;--sea:#7fa8a5;--ember:#d28a52;
 --line:rgba(243,237,226,.09);--muted:rgba(243,237,226,.56);--faint:rgba(243,237,226,.34)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:var(--ink);color:var(--paper);
 font-weight:300;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:880px;margin:0 auto;padding:0 24px}
section{padding:40px 0;border-bottom:1px solid var(--line)}
h1{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:34px;line-height:1.12;margin:10px 0 14px}
h2{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:24px;margin-bottom:14px}
.mono{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.08em;
 text-transform:uppercase;color:var(--sea)}
.meta{font-size:13px;opacity:.6}
a{color:var(--sea)}
.hdr{padding:44px 0 8px;border-bottom:1px solid var(--line)}
.tag{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10px;
 letter-spacing:.16em;text-transform:uppercase;color:#14110d;background:var(--ember);
 border-radius:5px;padding:3px 9px;margin-bottom:12px}
.cmd{font-family:'IBM Plex Mono',monospace;font-size:12.5px;background:var(--ink2);
 border:1px solid var(--line);border-left:2px solid var(--sea);border-radius:8px;
 padding:12px 15px;margin-top:14px;color:var(--muted);overflow-x:auto;white-space:pre}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    a = ap.parse_args()

    drafts = (json.loads(DRAFTS.read_text()) if DRAFTS.exists() else {}).get("drafts", {})
    if not drafts:
        print("No drafted Measures waiting.")
        return 0

    body = ""
    for craft in sorted(drafts):
        m = dict(drafts[craft])
        # the published block prints checker and date; a draft has neither yet, and
        # saying so IS the point of the page
        m.setdefault("checker", "— unsigned —")
        m.setdefault("date", "not yet signed")
        body += (f'<div class="wrap" style="padding-top:34px"><span class="tag">Draft '
                 f'&middot; not on the site</span><h2 style="margin-bottom:4px">'
                 f'{html.escape(craft)}</h2>'
                 f'<p class="meta">Renders exactly like this once signed.</p></div>'
                 + atlas_hub.measure_html(m)
                 + f'<div class="wrap"><div class="cmd">python3 scripts/sign-measure.py '
                   f'{html.escape(craft)} --as "Arnaud Callier"\npython3 scripts/sign-measure.py '
                   f'{html.escape(craft)} --reject</div></div>')

    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Measure drafts — {len(drafts)} waiting</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<header class="hdr"><div class="wrap"><div class="mono">Waiting for a signature</div>
<h1>{len(drafts)} drafted Measure{'s' if len(drafts) != 1 else ''}</h1>
<p style="opacity:.8;max-width:62ch">Graded from entries already verified on each craft's own
page. None of this is on the site, and none of it can get there until you sign it — the build
refuses a Measure with no checker. Read one, then run the command under it.</p></div></header>
{body}
<div class="wrap" style="padding:34px 0 60px"><p class="meta">Written by
scripts/preview-measure.py, outside website/ so a draft is never one path away from
being published.</p></div>
</body></html>"""
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(page)
    print(f"{len(drafts)} draft(s) → {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
