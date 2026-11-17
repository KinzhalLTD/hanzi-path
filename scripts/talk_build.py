"""Workplace conversations: parse content/talk_*.tsv, validate, write out/talk.json.
Checks: structure (5 turns of P/A/B/X per scene), every field present, pinyin syllables = Han characters,
and every word's pinyin against CC-CEDICT readings (tone sandhi of 一/不 and neutral tones allowed).
Usage: python3 -I scripts/talk_build.py ROOT CEDICT_BASE_JSON   (CEDICT optional: skips the dictionary check)"""
import json, sys, re, glob, unicodedata, os
ROOT = sys.argv[1]; CED = sys.argv[2] if len(sys.argv) > 2 else None
SYL = set("""a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu fa fan fang fei fen feng fo fou fu da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nun nuo nv nve la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lv lve ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ka kai kan kang kao ke kei ken keng kong kou ku kua kuai kuan kuang kui kun kuo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo ran rang rao re ren reng ri rong rou ru rua ruan rui run ruo za zai zan zang zao ze zei zen zeng zi zong zou zu zuan zui zun zuo ca cai can cang cao ce cen ceng ci cong cou cu cuan cui cun cuo sa sai san sang sao se sen seng si song sou su suan sui sun suo ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun wa wai wan wang wei wen weng wo wu e ei en eng er o ou m n ng hm""".split())
SOLO = {'m', 'n', 'ng', 'hm'}
TONE = {'̄': 1, '́': 2, '̌': 3, '̀': 4}
def plain(s):
    d = unicodedata.normalize('NFD', s.lower()); return ''.join('v' if c == '̈' else c for c in d if c not in TONE).replace('uv', 'v').replace('ü', 'v')
def plain_keep(s):  # per original char -> plain char (lengths kept)
    return [plain(c) or c for c in unicodedata.normalize('NFC', s)]
def tone(s):
    for c in unicodedata.normalize('NFD', s):
        if c in TONE: return TONE[c]
    return 5
def split_word(w):
    o = list(unicodedata.normalize('NFC', w)); p = ''.join(plain(c) for c in o)
    if len(p) != len(o): return None
    memo = {}
    def go(i):
        if i == len(p): return []
        if i in memo: return memo[i]
        for n in range(min(6, len(p) - i), 0, -1):
            s = p[i:i+n]
            if s not in SYL or (s in SOLO and len(p) != n) or (i > 0 and s[0] in 'aeo'): continue
            r = go(i + n)
            if r is not None: memo[i] = [''.join(o[i:i+n])] + r; return memo[i]
            if i + n < len(p) and p[i+n] == 'r' and s != 'e':
                r2 = go(i + n + 1)
                if r2 is not None: memo[i] = [''.join(o[i:i+n]), 'r'] + r2; return memo[i]
        memo[i] = None; return None
    return go(0)
def syllables(py):
    out = []
    for w in re.split(r"[\s'’\-]+", re.sub(r"[^A-Za-zÀ-ɏ̀-ͯü'’\- ]+", ' ', py)):
        if not w: continue
        r = split_word(w)
        if r is None: return None, w
        out += r
    return out, None
HAN = re.compile(r'[㐀-鿿〇]')

ced = {}
if CED and os.path.exists(CED):
    for e in json.load(open(CED, encoding='utf-8')):
        if len(e['s']) > 1 and e['pn'][:1].isupper(): continue   # proper nouns (上都 Shàngdū) would mis-split ordinary text
        rd = tuple(x.lower().replace('u:', 'v') for x in e['pn'].split())
        ced.setdefault(e['s'], set()).add(rd)
def reading_ok(word, syls):
    got = tuple(plain(s) + str(tone(s)) for s in syls)
    cands = ced.get(word)
    if not cands: return None
    def match(a, b, ch):
        if a[:-1] != b[:-1]: return False
        if a[-1] == b[-1] or '5' in (a[-1], b[-1]): return True
        return ch in '一不'   # tone sandhi written in the pinyin (yí ge, bú shì)
    for c in cands:
        if len(c) == len(got) and all(match(a, b, ch) for a, b, ch in zip(got, c, word)): return True
    if all(not any(len(c) == len(got) and all(a[:-1] == b[:-1] for a, b in zip(got, c)) for c in cands) for _ in [0]): return 'letters'
    return 'tones'

def check_line(zh, py, where, errs, warns):
    hs = HAN.findall(zh); syl, bad = syllables(py)
    if syl is None: errs.append(f'{where}: cannot read pinyin word "{bad}" in {py}'); return
    if len(syl) != len(hs): errs.append(f'{where}: {len(hs)} characters but {len(syl)} syllables: {zh} / {py}'); return
    if not ced: return
    # accept if ANY segmentation into dictionary words matches the pinyin; otherwise report the greedy split
    hz = ''.join(hs); memo = {}
    def ok(i):
        if i == len(hz): return True
        if i in memo: return memo[i]
        L = next((n for n in range(min(6, len(hz) - i), 1, -1) if hz[i:i+n] in ced), 1)   # longest dictionary word here
        def crossing(n):  # a shorter piece is allowed only if a matching word starts inside the long one and runs past it
            return any(hz[j:j+m] in ced and reading_ok(hz[j:j+m], syl[j:j+m]) is True for j in range(i + n, i + L) for m in range(i + L - j + 1, min(6, len(hz) - j) + 1))
        for n in range(min(6, len(hz) - i), 0, -1):
            w = hz[i:i+n]
            if w not in ced and n > 1: continue
            if n < L and not crossing(n): continue
            r = reading_ok(w, syl[i:i+n]) if w in ced else True
            if r is True and ok(i + n): memo[i] = True; return True
        memo[i] = False; return False
    if ok(0): return
    i = 0
    while i < len(hz):
        for n in range(min(6, len(hz) - i), 0, -1):
            w = hz[i:i+n]
            if w in ced or n == 1: break
        r = reading_ok(w, syl[i:i+n])
        if r == 'letters': errs.append(f'{where}: {w} read as {" ".join(syl[i:i+n])}, CEDICT {sorted(" ".join(x) for x in ced[w])[:3]}')
        elif r == 'tones': errs.append(f'{where}: tones {w} {" ".join(syl[i:i+n])} vs {sorted(" ".join(x) for x in ced[w])[:3]}')
        i += n

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
