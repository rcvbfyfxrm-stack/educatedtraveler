"""One-time retheme of the Atlas from Warm-Dark to the three colours (white ground, ink type, sea).
Rewrites colour tokens and literals in the generator sources and the preserved sheets. Idempotent."""
import re, sys, pathlib
SEA, SEA_RGB, INK_RGB = '#4e7b78', '78,123,120', '14,22,21'
def alpha_text(a):                      # light-on-dark alphas, read again as ink-on-white
    a = float(a)
    if a >= .8: return '1'
    if a >= .5: return '.72'
    if a >= .28: return '.6'
    return ('%.2f' % a).lstrip('0')
def retheme(s):
    # tokens: the dark ground becomes --ground (white); light type becomes --type (ink)
    s = re.sub(r'--ink2\s*:\s*#14110d', '--surface:#ffffff', s)
    s = re.sub(r'--ink\s*:\s*#0d0b09', '--ground:#ffffff', s)
    s = re.sub(r'--paper\s*:\s*#f3ede2', '--type:#0e1615', s)
    s = re.sub(r'--ember\s*:\s*#[0-9a-fA-F]{6}', '--ember:' + SEA, s)
    s = re.sub(r'--sea\s*:\s*#7fa8a5', '--sea:' + SEA, s)
    s = re.sub(r'--gold\s*:\s*#[0-9a-fA-F]{6}', '--gold:' + SEA, s)
    s = re.sub(r'var\(--ink2([,)])', r'var(--surface\1', s)
    s = re.sub(r'var\(--ink([,)])', r'var(--ground\1', s)
    s = re.sub(r'var\(--paper([,)])', r'var(--type\1', s)
    # literals
    s = re.sub(r'rgba\(\s*243\s*,\s*237\s*,\s*226\s*,\s*([0-9.]+)\s*\)', lambda m: 'rgba(%s,%s)' % (INK_RGB, alpha_text(m.group(1))), s)
    s = re.sub(r'rgba\(\s*(?:13\s*,\s*11\s*,\s*9|20\s*,\s*17\s*,\s*13|28\s*,\s*24\s*,\s*19)\s*,\s*([0-9.]+)\s*\)', r'rgba(255,255,255,\1)', s)
    s = re.sub(r'rgba\(\s*(?:127\s*,\s*168\s*,\s*165|210\s*,\s*138\s*,\s*82|231\s*,\s*181\s*,\s*78)\s*,\s*([0-9.]+)\s*\)', r'rgba(%s,\1)' % SEA_RGB, s)
    for old in ('#14110d', '#0d0b09'): s = re.sub(old, '#ffffff', s, flags=re.I)
    s = re.sub('#f3ede2', '#0e1615', s, flags=re.I)
    # the letter sheet (the note a visitor writes to Arnaud): paper becomes a white sheet with a hairline
    s = re.sub(r'--sheet\s*:\s*#(?:efe6d3|0e1615)', '--sheet:#ffffff', s, flags=re.I)
    s = re.sub(r'--sheet-edge\s*:\s*#e2d6bd', '--sheet-edge:rgba(14,22,21,.16)', s, flags=re.I)
    s = re.sub(r'--sheet-ink\s*:\s*#2c231a', '--sheet-ink:#0e1615', s, flags=re.I)
    s = re.sub(r'--sheet-faint\s*:\s*#6f6350', '--sheet-faint:rgba(14,22,21,.62)', s, flags=re.I)
    for old, new in (('#efe6d3', '#ffffff'), ('#ece1cc', '#ffffff'), ('#e2d6bd', 'rgba(14,22,21,.16)'), ('#2c231a', '#0e1615'), ('#6f6350', 'rgba(14,22,21,.62)')):
        s = re.sub(old, new, s, flags=re.I)
    for old in ('#7fa8a5', '#d28a52', '#e0a877', '#e0915f', '#f0c27a', '#e7b54e',
                '#6fa3a0', '#c9a24a', '#cf8f6e', '#bf8088', '#94ad86'):   # sea, ember, gold, the five worlds
        s = re.sub(old, SEA, s, flags=re.I)
    return s
if __name__ == '__main__':
    for p in map(pathlib.Path, sys.argv[1:]):
        a = p.read_text(); b = retheme(a)
        if a != b: p.write_text(b); print('rethemed', p)
