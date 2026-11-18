"""Shared pinyin validation: split pinyin into syllables, compare with Han character count, and check every
dictionary word's reading against CC-CEDICT (tone sandhi of 一/不 and neutral tones allowed). Used by
talk_build.py and sec_build.py (loaded with importlib so it works under python -I)."""
import json, re, unicodedata, os
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
proper = {}   # proper-noun readings: accepted, but never used to decide how ordinary text splits into words
# standard readings that CC-CEDICT lists differently (现代汉语词典 forms) or that occur in running text
VARIANTS = {'下载': ['xia4 zai4'], '负载': ['fu4 zai4'], '负载均衡': ['fu4 zai4 jun1 heng2'], '联轴器': ['lian2 zhou2 qi4'], '泄露': ['xie4 lou4'], '验血': ['yan4 xue4'], '抽血': ['chou1 xie3'],
            '到了': ['dao4 le5'], '血': ['xue4', 'xie3'], '载荷': ['zai4 he4'], '荷载': ['he4 zai4'], '承载': ['cheng2 zai4'], '血压': ['xue4 ya1'],
            '穿着': ['chuan1 zhe5']}  # V+着 (wearing) as well as the noun chuānzhuó
def load_ced(path):
    """CC-CEDICT readings by simplified headword; multi-character proper nouns are skipped."""
    if not path or not os.path.exists(path): return False
    for e in json.load(open(path, encoding='utf-8')):
        rd = tuple(x.lower().replace('u:', 'v') for x in e['pn'].split())
        if len(e['s']) > 1 and e['pn'][:1].isupper(): proper.setdefault(e['s'], set()).add(rd); continue   # 上都 Shàngdū must not split ordinary text
        ced.setdefault(e['s'], set()).add(rd)
    for w, rs in VARIANTS.items():
        for r in rs: ced.setdefault(w, set()).add(tuple(r.split()))
    return True

def reading_ok(word, syls):
    got = tuple(plain(s) + str(tone(s)) for s in syls)
    cands = (ced.get(word) or set()) | proper.get(word, set())
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
    if re.search(r'[0-9A-Za-z]', zh): return   # digits or Latin in the sentence (666, HSK, Wi-Fi): syllable count is not comparable
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

