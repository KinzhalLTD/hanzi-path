"""Curriculum: parse content/mod_*.tsv (format in the header of mod_1_se.tsv), validate, write out/curr.json.
Checks: field counts, every module has >= 4 lessons, >= 6 questions, >= 8 terms, an A/B dialogue; quiz options are
distinct; module keys unique; Chinese terms unique; pinyin syllables = Han characters and every word's reading
against CC-CEDICT (shared rules in scripts/pinyin_check.py).
Usage: python3 -I scripts/curr_build.py ROOT CEDICT_BASE_JSON   (must print `errors 0`)"""
import json, sys, glob, os, importlib.util
ROOT = sys.argv[1]; CED = sys.argv[2] if len(sys.argv) > 2 else None
_spec = importlib.util.spec_from_file_location('pinyin_check', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pinyin_check.py'))
PC = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(PC)
if CED: PC.load_ced(CED)
NEED = {'@': 9, 'L': (5, 6), 'Q': 13, 'T': 5, 'D': 6}
def un(s): return s.replace('{pipe}', '|')
def main():
    errs, warns, mods, terms = [], [], [], {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'content', 'mod_*.tsv'))):
        m = None
        for ln, line in enumerate(open(f, encoding='utf-8'), 1):
            line = line.rstrip('\n'); where = f'{os.path.basename(f)}:{ln}'
            if not line or line.startswith('#'): continue
            x = line.split('|'); tag = '@' if x[0].startswith('@') else x[0]
            n = NEED.get(tag)
            if n is None: errs.append(f'{where}: unknown line type {x[0][:12]}'); continue
            ok = len(x) in n if isinstance(n, tuple) else len(x) == n
            if not ok: errs.append(f'{where}: {tag} needs {n} fields, has {len(x)}'); continue
            if any(not v.strip() for v in x[:5 if tag == 'L' else len(x)]): errs.append(f'{where}: empty field'); continue
            if tag == '@':
                k = x[0][1:]
                if any(mm['k'] == k for mm in mods): errs.append(f'{where}: duplicate module {k}')
                if x[1] not in ('se', 'cy'): errs.append(f'{where}: track must be se or cy')
                PC.check_line(x[3], x[4], where, errs, warns)
                m = {'k': k, 'tr': x[1], 'ic': x[2], 'zh': x[3], 'py': x[4], 'ar': x[5], 'en': x[6], 'sa': x[7], 'se': x[8], 'L': [], 'Q': [], 'T': [], 'D': []}
                mods.append(m); continue
            if m is None: errs.append(f'{where}: item before the first @module'); continue
            if tag == 'L':
                m['L'].append({'ta': x[1], 'te': x[2], 'a': un(x[3]), 'e': un(x[4]), 'c': un(x[5]).replace('\\n', '\n') if len(x) > 5 else ''})
            elif tag == 'Q':
                pairs = [(x[i] if x[i] != '=' else x[i + 1], x[i + 1]) for i in (3, 5, 7, 9)]
                if len({p[1] for p in pairs}) != 4 or len({p[0] for p in pairs}) != 4: errs.append(f'{where}: quiz options not distinct')
                m['Q'].append({'qa': x[1] if x[1] != '=' else x[2], 'qe': x[2], 'o': [list(p) for p in pairs], 'wa': x[11], 'we': x[12]})
            elif tag == 'T':
                PC.check_line(x[1], x[2], where, errs, warns)
                if x[1] in terms: errs.append(f'{where}: term {x[1]} already in {terms[x[1]]}')
                terms[x[1]] = m['k']
                m['T'].append({'h': x[1], 'p': x[2], 'ar': x[3], 'en': x[4]})
            elif tag == 'D':
                if x[1] not in ('A', 'B'): errs.append(f'{where}: speaker must be A or B')
                PC.check_line(x[2], x[3], where, errs, warns)
                m['D'].append({'s': x[1], 'zh': x[2], 'py': x[3], 'ar': x[4], 'en': x[5]})
    for m in mods:
        for k, lo in (('L', 4), ('Q', 6), ('T', 8), ('D', 4)):
            if len(m[k]) < lo: errs.append(f'{m["k"]}: only {len(m[k])} {k} items (need {lo})')
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    json.dump(mods, open(os.path.join(ROOT, 'out', 'curr.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    for t in ('se', 'cy'):
        ms = [m for m in mods if m['tr'] == t]
        print(t, 'modules', len(ms), 'lessons', sum(len(m['L']) for m in ms), 'questions', sum(len(m['Q']) for m in ms), 'terms', sum(len(m['T']) for m in ms), 'dialogue lines', sum(len(m['D']) for m in ms))
    for w in warns[:20]: print('warn', w)
    for e in errs[:60]: print('ERR', e)
    print('errors', len(errs))
main()
