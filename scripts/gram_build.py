"""Grammar syllabus: parse content/gram_*.tsv (file-name order), validate, write out/grammar.json.
Format (one point = header + lines):
  @1                                   level (HSK 1-6); applies to the points that follow
  #key|pattern|markers|ar title|en title
      key      stable id (learner progress is stored by it; never rename)
      pattern  formula shown LTR: Chinese + slot names S V O Adj N Num M Time Place Q (legend in grammar.js)
      markers  comma-separated words that carry the point (blanked in gap exercises); may be empty
  a:<Arabic explanation>               e:<English explanation>
  >zh|pinyin|ar|en                     example (2 or more); pinyin is checked against CC-CEDICT
  !ar tip|en tip                       optional common-mistake / usage tip
  x:wrong zh|right zh                  optional typical error (wrong sentence then the corrected one)
Usage: python3 -I scripts/gram_build.py ROOT CEDICT_BASE_JSON   (prints `errors N`)"""
import json, sys, os, glob, re, importlib.util
ROOT = sys.argv[1]; CED = sys.argv[2] if len(sys.argv) > 2 else None
_spec = importlib.util.spec_from_file_location('pinyin_check', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pinyin_check.py'))
PC = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(PC)
has_ced = PC.load_ced(CED)
errs, warns, pts, keys = [], [], [], set(); lv = None; cur = None
HAN = re.compile(r'[㐀-鿿]')
for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'gram_*.tsv'))):
    for ln, line in enumerate(open(f, encoding='utf-8'), 1):
        line = line.rstrip('\n'); where = f'{os.path.basename(f)}:{ln}'
        if not line.strip() or line.startswith('# '): continue
        if line.startswith('@'):
            lv = int(line[1:].split('|')[0]); cur = None
            if not 1 <= lv <= 6: errs.append(f'{where}: level must be 1-6'); continue
            continue
        if line.startswith('#'):
            x = line[1:].split('|')
            if len(x) != 5 or not all(x[i].strip() for i in (0, 1, 3, 4)): errs.append(f'{where}: point needs key|pattern|markers|ar|en'); cur = None; continue
            if lv is None: errs.append(f'{where}: point before @level'); continue
            if x[0] in keys: errs.append(f'{where}: duplicate key {x[0]}')
            keys.add(x[0])
            cur = {'k': x[0], 'l': lv, 'pt': x[1].strip(), 'mk': [m.strip() for m in x[2].split(',') if m.strip()], 'ar': x[3].strip(), 'en': x[4].strip(), 'xa': '', 'xe': '', 'ex': [], 'tip': None, 'err': []}
            pts.append(cur); continue
        if cur is None: errs.append(f'{where}: line outside a point: {line[:50]}'); continue
        if line.startswith('a:'): cur['xa'] += (' ' if cur['xa'] else '') + line[2:].strip(); continue
        if line.startswith('e:'): cur['xe'] += (' ' if cur['xe'] else '') + line[2:].strip(); continue
        if line.startswith('>'):
            x = line[1:].split('|')
            if len(x) != 4 or any(not v.strip() for v in x): errs.append(f'{where}: example needs zh|pinyin|ar|en'); continue
            x = [v.strip() for v in x]
            if not re.search(r'[A-Za-z0-9]', x[0]): PC.check_line(x[0], x[1], where, errs, warns)
            cur['ex'].append(x); continue
        if line.startswith('!'):
            x = line[1:].split('|')
            if len(x) != 2: errs.append(f'{where}: tip needs ar|en'); continue
            cur['tip'] = [v.strip() for v in x]; continue
        if line.startswith('x:'):
            x = line[2:].split('|')
            if len(x) != 2 or not all(HAN.search(v) for v in x): errs.append(f'{where}: error line needs wrong zh|right zh'); continue
            cur['err'].append([v.strip() for v in x]); continue
        errs.append(f'{where}: unknown line: {line[:50]}')
for p in pts:
    w = f"{p['k']}"
    if not p['xa'] or not p['xe']: errs.append(f'{w}: needs a: and e: explanations')
    if len(p['ex']) < 2: errs.append(f'{w}: needs at least 2 examples')
    for m in p['mk']:
        if not any(m in e[0] for e in p['ex']): warns.append(f'{w}: marker {m} not in any example')
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
json.dump(pts, open(os.path.join(ROOT, 'out', 'grammar.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
by = {}
for p in pts: by[p['l']] = by.get(p['l'], 0) + 1
print('cedict', 'on' if has_ced else 'off'); print('points', len(pts), dict(sorted(by.items())), 'examples', sum(len(p['ex']) for p in pts))
for x in warns: print('warn', x)
for e in errs: print('ERR', e)
print('errors', len(errs))
