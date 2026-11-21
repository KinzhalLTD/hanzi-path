"""Export review sheets for outside experts (open in Excel or Google Sheets).
Usage: python3 -I scripts/review_export.py ROOT -> docs/review/{vocabulary,grammar,culture_quiz}.csv
Reviewers fill the last two columns (Verdict OK/Fix, Comment); send the files back and apply the fixes."""
import sys, os, glob, csv, re
R = sys.argv[1]; O = os.path.join(R, 'docs/review'); os.makedirs(O, exist_ok=True)
def W(name, head, rows):
    with open(os.path.join(O, name), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f); w.writerow(head + ['Verdict (OK/Fix)', 'Comment']); [w.writerow(r + ['', '']) for r in rows]
    return len(rows)
voc = []
for fn in sorted(glob.glob(os.path.join(R, 'content/hsk*.tsv'))):
    for ln in open(fn, encoding='utf-8'):
        if ln.startswith('#') or '|' not in ln: continue
        x = ln.rstrip('\n').split('|'); voc.append([os.path.basename(fn)] + x[:8])
g = []; cur = None
for fn in sorted(glob.glob(os.path.join(R, 'content/gram_*.tsv'))):
    for ln in open(fn, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if ln.startswith('#g') or (ln.startswith('#') and '|' in ln and not ln.startswith('# ')):
            x = ln[1:].split('|'); cur = [x[0], x[1], x[4] if len(x) > 4 else '', x[3] if len(x) > 3 else '', '', '', '', '']; g.append(cur)
        elif cur and ln.startswith('e:'): cur[4] = ln[2:]
        elif cur and ln.startswith('a:'): cur[5] = ln[2:]
        elif cur and ln.startswith('>'): cur[6] += ('\n' if cur[6] else '') + ln[1:]
        elif cur and ln.startswith('x:'): cur[7] += ('\n' if cur[7] else '') + ln[2:]
cq = []
for fn in ['culture_data', 'culture_more', 'culture_legends']:
    src = open(os.path.join(R, f'hp/src/{fn}.js'), encoding='utf-8').read()
    for m in re.finditer(r"q:\{ar:'((?:[^'\\]|\\.)*)',en:'((?:[^'\\]|\\.)*)',o:\[((?:\{[^}]*\},?)+)\]", src):
        os_ = re.findall(r"ar:'((?:[^'\\]|\\.)*)',en:'((?:[^'\\]|\\.)*)'", m.group(3))
        cq.append([fn, m.group(2), os_[0][1], ' / '.join(o[1] for o in os_[1:]), m.group(1), os_[0][0]])
print('vocabulary', W('vocabulary.csv', ['file', 'hanzi', 'pinyin', 'meaning 1', 'meaning 2', 'example zh', 'example pinyin', 'example 1', 'example 2'], voc),
      'grammar', W('grammar.csv', ['key', 'pattern', 'title (en)', 'title (ar)', 'explanation (en)', 'explanation (ar)', 'examples', 'common mistakes (wrong|right)'], g),
      'culture', W('culture_quiz.csv', ['file', 'question (en)', 'right (en)', 'wrong (en)', 'question (ar)', 'right (ar)'], cq))
