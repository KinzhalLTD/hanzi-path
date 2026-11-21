"""Apply balanced distractors from content/qa_fix/*.txt to the quiz (Q) and quick-check (C) lines.
Line format: key#i|en1|en2|en3||ar1|ar2|ar3  (Q)  or  key@lesson|en1|en2||ar1|ar2  (C).
Usage: python3 -I scripts/qa_fix.py ROOT"""
import sys, os, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_bias import load
R = sys.argv[1]
fix = {}
for f in sorted(glob.glob(os.path.join(R, 'content/qa_fix/*.txt'))):
    for ln in open(f, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln or ln.startswith('#'): continue
        k, rest = ln.split('|', 1); en, ar = rest.split('||')
        fix[k] = (en.split('|'), ar.split('|'))
Q, C = load()
edits = {}
for k, f, n, x in Q:
    if k in fix:
        en, ar = fix[k]; assert len(en) == 3 == len(ar), k
        for j in range(3): x[5 + 2*j], x[6 + 2*j] = ar[j], en[j]
        edits.setdefault(f, {})[n] = '|'.join(x)
for k, f, n, x in C:
    if k in fix:
        en, ar = fix[k]; assert len(en) == 2 == len(ar), k
        for j in range(2): x[6 + 2*j], x[7 + 2*j] = ar[j], en[j]
        edits.setdefault(f, {})[n] = '|'.join(x)
used = 0
for f, ch in edits.items():
    L = open(f, encoding='utf-8').read().split('\n')
    for n, v in ch.items(): L[n] = v; used += 1
    open(f, 'w', encoding='utf-8').write('\n'.join(L))
print('applied', used, 'of', len(fix))
miss = set(fix) - {k for k, *_ in Q} - {k for k, *_ in C}
if miss: print('unknown keys', sorted(miss))
