"""Workplace conversations: parse content/talk_*.tsv, validate, write out/talk.json.
Checks: structure (5 turns of P/A/B/X per scene), every field present, pinyin syllables = Han characters,
and every word's pinyin against CC-CEDICT readings (tone sandhi of 一/不 and neutral tones allowed).
Usage: python3 -I scripts/talk_build.py ROOT CEDICT_BASE_JSON   (CEDICT optional: skips the dictionary check)"""
import json, sys, re, glob, unicodedata, os, importlib.util
ROOT = sys.argv[1]; CED = sys.argv[2] if len(sys.argv) > 2 else None
_spec = importlib.util.spec_from_file_location('pinyin_check', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pinyin_check.py'))
PC = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(PC)
check_line, ced = PC.check_line, PC.ced
PC.load_ced(CED)
def main():
    errs, warns = [], []; domains = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'talk_*.tsv'))):
        dom = scene = turn = None
        for ln, line in enumerate(open(f, encoding='utf-8'), 1):
            line = line.rstrip('\n'); where = f'{os.path.basename(f)}:{ln}'
            if not line or line.startswith('# '): continue
            x = line.split('|')
            if x[0].startswith('@'):
                if len(x) != 6: errs.append(f'{where}: domain needs 6 fields'); continue
                dom = {'k': x[0][1:], 'zh': x[1], 'ar': x[2], 'en': x[3], 'sec': x[4], 'emo': x[5], 'scenes': []}; domains.append(dom); continue
            if x[0].startswith('#'):
                if len(x) != 12: errs.append(f'{where}: scene needs 12 fields, has {len(x)}'); continue
                k = x[0][1:]
                scene = dict(zip(['k', 'zh', 'ar', 'en', 'pz', 'pa', 'pe', 'ma', 'me', 'sa', 'se', 'hsk'], [k] + x[1:]))
                scene['hsk'] = int(scene['hsk']); scene['turns'] = []; dom['scenes'].append(scene); continue
            tag = x[0]
            need = 5 if tag in 'PA' else 7
            if tag not in ('P', 'A', 'B', 'X') or len(x) != need or any(not v.strip() for v in x):
                errs.append(f'{where}: line {tag} needs {need} non-empty fields, has {len(x)}'); continue
            check_line(x[1], x[2], where, errs, warns)
            if tag == 'P': turn = {'p': x[1:5], 'o': []}; scene['turns'].append(turn)
            else: turn['o'].append({'t': tag, 'zh': x[1], 'py': x[2], 'ar': x[3], 'en': x[4], 'na': x[5] if tag != 'A' else '', 'ne': x[6] if tag != 'A' else ''})
    for d in domains:
        if len(d['scenes']) < 5: warns.append(f'{d["k"]}: only {len(d["scenes"])} scenes')
        for s in d['scenes']:
            if len(s['turns']) != 5: errs.append(f'{d["k"]}/{s["k"]}: {len(s["turns"])} turns')
            for i, t in enumerate(s['turns']):
                if [o['t'] for o in t['o']] != ['A', 'B', 'X']: errs.append(f'{d["k"]}/{s["k"]} turn {i+1}: options {[o["t"] for o in t["o"]]}')
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    json.dump(domains, open(os.path.join(ROOT, 'out', 'talk.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    n = sum(len(s['turns']) for d in domains for s in d['scenes'])
    print(f'{len(domains)} domains, {sum(len(d["scenes"]) for d in domains)} scenes, {n} turns, cedict={"on" if ced else "off"}')
    for w in warns: print('warn', w)
    for e in errs: print('ERR', e)
    print('errors', len(errs))
main()
