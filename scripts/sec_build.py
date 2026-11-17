"""Sector vocabulary: parse content/sec_*.tsv (in file-name order), validate, assign stable ids, write out/sectors_ext.json.
Format:  @sector   #topicKey|zh|ar|en   term: zh|pinyin|ar|en|level(1 core, 2 professional, 3 advanced)   >example: zh|pinyin|ar|en
A sector or topic may appear again in a later file: its terms are appended (lets new files extend existing topics).
Stable ids: content/sector_ids.json maps sector -> {term: index}. Learners' progress is stored by id, so existing
indices never change; new terms get the next free index. The app uses id = 95000 + sectorIndex*1000 + index for index < 1000, else 300000 + sectorIndex*10000 + index (secId in sectors.js).
Usage: python3 -I scripts/sec_build.py ROOT CEDICT_BASE_JSON   (prints `errors N`; CEDICT optional)"""
import json, sys, os, glob, re, importlib.util
ROOT = sys.argv[1]; CED = sys.argv[2] if len(sys.argv) > 2 else None
_spec = importlib.util.spec_from_file_location('pinyin_check', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pinyin_check.py'))
PC = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(PC)
has_ced = PC.load_ced(CED)
REG_PATH = os.path.join(ROOT, 'content', 'sector_ids.json')
reg = json.load(open(REG_PATH, encoding='utf-8')) if os.path.exists(REG_PATH) else {}
out = {}; errs = []; warns = []; cur = None; topic = None
for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'sec_*.tsv'))):
    for ln, line in enumerate(open(f, encoding='utf-8'), 1):
        line = line.rstrip('\n'); where = f'{os.path.basename(f)}:{ln}'
        if not line or line.startswith('# '): continue
        if line.startswith('@'):
            cur = line[1:].strip(); out.setdefault(cur, {'topics': [], 'ex': []}); topic = None; continue
        if line.startswith('#'):
            x = line[1:].split('|')
            if len(x) != 4: errs.append(f'{where}: topic needs 4 fields'); continue
            topic = next((t for t in out[cur]['topics'] if t['k'] == x[0]), None)
            if not topic: topic = {'k': x[0], 'zh': x[1], 'ar': x[2], 'en': x[3], 'terms': []}; out[cur]['topics'].append(topic)
            continue
        if line.startswith('>'):
            x = line[1:].split('|')
            if len(x) != 4 or any(not v.strip() for v in x): errs.append(f'{where}: example needs 4 fields'); continue
            PC.check_line(x[0], x[1], where, errs, warns); out[cur]['ex'].append(x); continue
        x = line.split('|')
        if len(x) != 5 or any(not v.strip() for v in x) or x[4] not in ('1', '2', '3'):
            errs.append(f'{where}: term needs zh|pinyin|ar|en|level(1-3): {line[:60]}'); continue
        if topic is None: errs.append(f'{where}: term before any #topic'); continue
        x[4] = int(x[4])
        if not re.search(r'[A-Za-z0-9±]', x[0]): PC.check_line(x[0], x[1], where, errs, warns)
        topic['terms'].append(x)
# duplicates inside a sector (first one wins at runtime) and id allocation
for k, v in out.items():
    seen = {}; ids = reg.setdefault(k, {}); nxt = max(ids.values(), default=-1) + 1
    for t in v['topics']:
        keep = []
        for x in t['terms']:
            if x[0] in seen: warns.append(f'{k}: duplicate {x[0]} in {t["k"]} (first in {seen[x[0]]})'); continue
            seen[x[0]] = t['k']; keep.append(x)
            if x[0] not in ids: ids[x[0]] = nxt; nxt += 1
        t['terms'] = keep
    if nxt > 10000: errs.append(f'{k}: {nxt} ids, the id scheme allows 10000 per sector')
    v['ids'] = ids
json.dump(reg, open(REG_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
json.dump(out, open(os.path.join(ROOT, 'out', 'sectors_ext.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('cedict', 'on' if has_ced else 'off'); print('terms', {k: sum(len(t['terms']) for t in v['topics']) for k, v in out.items()})
for w in warns: print('warn', w)
for e in errs: print('ERR', e)
print('errors', len(errs))
