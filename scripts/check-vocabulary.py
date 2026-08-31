#!/usr/bin/env python3
"""Guard the word. On EducatedTraveler the thing you write to Arnaud is a NOTE.

Run from the repo root, before any push that touched copy:

    python3 scripts/check-vocabulary.py

Why this exists: `main` rebuilds the Atlas nightly, so a copy change to ~500
generated pages conflicts on almost every landing. The safe resolution is to take
upstream whole and re-run the generator — but 18 sheets in
data/atlas-extra-sheets.json are PRESERVED and never rebuilt, so that move silently
reverts them and the rebuild does not put them back. It looks resolved and it isn't.
This script is what notices. It also catches the four ways a naive letter->note
substitution breaks the site, each of which was hit for real while writing it.

Exit 0 and print OK, or print every failure and exit 1.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SELF = Path(__file__).resolve()          # this file quotes every banned string

# The ONLY visible "letter"s allowed on the site. Both are quoted facts: renaming
# them would falsify a source, which is the one thing ET cannot afford.
ALLOWED = {
    "covering letter":   ("website/atlas/chef-at-sea.html", 1),        # what Leiths asks an applicant for
    "Doctor of Letters": ("website/atlas/lymphatic-drainage.html", 2), # Emil Vodder's real art-history title
}

TAGS   = re.compile(r"<[^>]*>")
BLOCKS = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.S | re.I)
WORD   = re.compile(r"\b[Ll]etters?\b")
SCRIPT = re.compile(r"<script([^>]*)>(.*?)</script>", re.S | re.I)

SKIP_PARTS = {"_archive", "__pycache__", ".git", "node_modules"}
TEXT_EXT   = {".html", ".js", ".mjs", ".ts", ".py", ".css", ".json", ".xml", ".txt", ".svg"}

fails = []


def fail(msg):
    fails.append(msg)


def rel(p):
    return str(p.relative_to(ROOT))


# ── read the tree exactly once ───────────────────────────────────────────────
# Four `grep -r` passes plus two read passes made this a 100-second check that
# nobody would run. One pass, held in memory, makes it a three-second one.
corpus = {}
for base in ("website", "scripts", "supabase"):
    for p in (ROOT / base).rglob("*"):
        if not p.is_file() or p.suffix not in TEXT_EXT:
            continue
        if SKIP_PARTS & set(p.parts) or p.resolve() == SELF:
            continue
        corpus[p] = p.read_text(encoding="utf-8", errors="replace")

pages = sorted(p for p in corpus if p.suffix == ".html" and p.parts[-2] != "scripts"
               and str(p).startswith(str(ROOT / "website")))


def occurrences(needle):
    return sum(text.count(needle) for text in corpus.values())


# ── 1 · the word itself ──────────────────────────────────────────────────────
found = {}
for page in pages:
    flat = re.sub(r"\s+", " ", TAGS.sub(" ", BLOCKS.sub(" ", corpus[page])))
    for m in WORD.finditer(flat):
        ctx = flat[max(0, m.start() - 60):m.end() + 60].strip()
        hit = next((k for k in ALLOWED if k.lower() in ctx.lower()), None)
        if hit:
            found[hit] = found.get(hit, 0) + 1
        else:
            fail(f'stray "letter" in {rel(page)} — …{ctx}…')

for phrase, (where, want) in ALLOWED.items():
    got = found.get(phrase, 0)
    if got != want:
        fail(f'"{phrase}" appears {got}x, expected {want}x (in {where}) — '
             "a sweep ate a quoted fact, or a preserved sheet was reverted")

# ── 2 · what a naive substitution destroys ───────────────────────────────────
if (n := occurrences("note-spacing")):
    fail(f"note-spacing found {n}x — letter-spacing was rewritten inside inline CSS")
if (n := occurrences("letter-spacing")) < 1000:
    fail(f"letter-spacing down to {n} (expected thousands) — typography was swept away")
# The latch that relabelled a note as a "letter" past a word count. Its tells were
# LETTER_WORDS (that name existed nowhere else) and isLetter in the two front-end
# files it lived in. NOT to be confused with circle-welcome's own `isLetter`, which
# asks whether a signup's source starts with the preserved `atlas-letter:` key —
# a routing flag, nothing to do with vocabulary. Leave that one alone.
LATCH_HOMES = ("website/circle.html", "website/js/intent-capture.js")
latch = occurrences("LETTER_WORDS") + sum(
    text.count("isLetter") for path, text in corpus.items() if rel(path) in LATCH_HOMES)
if latch:
    fail(f"the note-becomes-a-letter latch is back ({latch} refs) — there is one word for it")
if (n := occurrences("note is automatic")):
    fail(f'"this note is automatic" found {n}x — it collides with the reader\'s own note; '
         'the live line is "This reply is automatic"')

# ── 3 · anchors still resolve ────────────────────────────────────────────────
# #letter is a DOM id, not vocabulary. A sweep that rewrites it breaks every
# "write me about this one" jump link on the Atlas.
for src, body in corpus.items():
    if 'href="#letter"' in body and 'id="letter"' not in body:
        fail(f'{rel(src)} links to #letter but defines no id="letter"')
    if 'href="#note"' in body:
        fail(f'{rel(src)} has href="#note" — the section id is "letter"')

# ── 4 · the pages still parse ────────────────────────────────────────────────
# Split by type= or you get ~300 false failures: JSON-LD is not JavaScript.
have_node = subprocess.run(["which", "node"], capture_output=True).returncode == 0
js_blocks, njson = [], 0
if not have_node:
    print("check-vocabulary: note — node not found, JS blocks not parsed")
for page in pages:
    for attrs, body in SCRIPT.findall(corpus[page]):
        if "src=" in attrs or not body.strip():
            continue
        m = re.search(r'type\s*=\s*["\']([^"\']+)', attrs)
        kind = m.group(1).lower() if m else "text/javascript"
        if "json" in kind:
            njson += 1
            try:
                json.loads(body)
            except Exception as e:
                fail(f"{rel(page)}: JSON-LD does not parse — {e}")
        elif "javascript" in kind or kind == "module":
            js_blocks.append({"where": rel(page), "src": body})

njs = len(js_blocks)
if have_node and js_blocks:
    # System temp, never the repo root: an interrupted run must not leave scratch
    # in a tree that has automations doing `git add -A`.
    checker = ("const vm=require('vm'),fs=require('fs');"
               "for(const b of JSON.parse(fs.readFileSync(process.argv[1],'utf8'))){"
               "try{new vm.Script(b.src);}catch(e){console.log(b.where+' :: '+e.message);}}")
    with tempfile.NamedTemporaryFile("w", suffix=".json", encoding="utf-8") as payload:
        json.dump(js_blocks, payload)
        payload.flush()
        r = subprocess.run(["node", "-e", checker, payload.name], capture_output=True, text=True)
    for line in r.stdout.splitlines():
        if line.strip():
            fail(f"inline script does not parse — {line}")

# ── 5 · a rename that a syntax check cannot see ──────────────────────────────
# A sweep that rewrites prose inside a template literal will happily rewrite the
# identifier in `${esc(letter)}` too. The file still parses; it throws at runtime,
# on send. This is how `${esc(note)}` reached notify-portrait, where the const is
# `letter`. So: any bare `note` inside a ${...} must be declared in that file.
# NB: must not match a plain call like `esc(note)` — that is the very use being
# hunted, and an over-broad "parameter" pattern silently disarms the whole check.
DECLARES = re.compile(r"\b(?:const|let|var|function)\s+note\b"      # declaration
                      r"|\bnote\s*=(?!=)"                          # assignment
                      r"|function[^(){}]*\([^)]*\bnote\b[^)]*\)"   # function parameter
                      r"|\([^)]*\bnote\b[^)]*\)\s*=>"              # arrow parameter
                      r"|\{[^{}]*\bnote\b[^{}]*\}\s*=(?!=)")       # destructuring
INTERP = re.compile(r"\$\{([^{}]*)\}")
BARE = re.compile(r"(?<![\w.$])note(?![\w$])")
for path, body in corpus.items():
    if path.suffix not in {".ts", ".js", ".mjs", ".html", ".py"}:
        continue
    if DECLARES.search(body):
        continue                       # the file has its own `note`; leave it be
    for m in INTERP.finditer(body):
        if BARE.search(m.group(1)):
            fail(f"{rel(path)}: ${{{m.group(1).strip()[:40]}}} uses `note`, which is not "
                 "declared in this file — a prose sweep renamed an identifier")

# ── 6 · the preserved sheets are the ones that get silently reverted ─────────
preserve = json.loads((ROOT / "data/atlas-extra-sheets.json").read_text())["preserve"]
if missing := [s for s in preserve if not (ROOT / "website/atlas" / s).exists()]:
    fail(f"preserved sheets missing from website/atlas/: {', '.join(missing)}")

if fails:
    print("check-vocabulary: FAIL")
    for f in fails:
        print("  -", f)
    sys.exit(1)

print(f"check-vocabulary: OK — {len(pages)} pages, only the {sum(found.values())} quoted "
      f'"letter"s remain, {njs} inline scripts and {njson} JSON-LD blocks parse, '
      f"{len(preserve)} preserved sheets present.")
