"""Export review sheets for outside experts (open in Excel or Google Sheets).
Usage: python3 -I scripts/review_export.py ROOT  ->  docs/review/{questions,lessons,chinese_terms}.csv
Reviewers fill the last two columns (Verdict: OK / Fix, Comment); send the file back and apply the fixes."""
import sys, os, glob, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_bias import load
R = sys.argv[1]; O = os.path.join(R, 'docs/review'); os.makedirs(O, exist_ok=True)
Q, C = load()
a = lambda x, i: x[i-1] if x[i-1] != '=' else x[i]
with open(os.path.join(O, 'questions.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['id', 'question (en)', 'right answer (en)', 'wrong 1', 'wrong 2', 'wrong 3', 'why (en)', 'question (ar)', 'right answer (ar)', 'why (ar)', 'Verdict (OK/Fix)', 'Comment'])
    for k, _, n, x in Q: w.writerow([k, x[2], x[4], x[6], x[8], x[10], x[12] if len(x) > 12 else '', x[1], a(x, 4), x[11] if len(x) > 11 else '', '', ''])
    for k, _, n, x in C: w.writerow([k, x[3], x[5], x[7], x[9], '', x[11] if len(x) > 11 else '', x[2], a(x, 5), x[10] if len(x) > 10 else '', '', ''])
cur = None; L = []; T = []
for fn in sorted(glob.glob(os.path.join(R, 'content/mod_*.tsv'))):
    for ln in open(fn, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if ln[:1] in '@+': cur = ln[1:].split('|')[0].strip()
        elif ln.startswith('L|'): x = ln.split('|'); L.append([cur, x[2], x[4].replace('\\n', '\n'), x[1], x[3].replace('\\n', '\n')])
        elif ln.startswith('X|'): x = ln.split('|'); L.append([cur, f'lesson {int(x[1])+1} · {x[2]}', x[4].replace('\\n', '\n'), '', x[3].replace('\\n', '\n')])
        elif ln.startswith('T|'): x = ln.split('|'); T.append([cur, x[1], x[2], x[4], x[3]])
with open(os.path.join(O, 'lessons.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['module', 'title / card (en)', 'text (en)', 'title (ar)', 'text (ar)', 'Verdict (OK/Fix)', 'Comment'])
    for r in L: w.writerow(r + ['', ''])
with open(os.path.join(O, 'chinese_terms.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['module', 'Chinese', 'pinyin', 'English', 'Arabic', 'Natural in a Chinese tech workplace? (OK/Fix)', 'Better term or comment'])
    for r in T: w.writerow(r + ['', ''])
print('questions', len(Q) + len(C), 'lesson cards', len(L), 'terms', len(T))
