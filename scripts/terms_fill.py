"""Append Chinese terms to modules from simple candidate lists, filling pinyin from CC-CEDICT.

Usage: python3 -I scripts/terms_fill.py ROOT CEDICT_JSON CANDIDATES.txt [--target 100] [--write]

CANDIDATES.txt: '+module-key' lines, then 'zh|ar|en' lines (optional 4th field = pinyin to use as is).
Terms already in any module (or repeated in the list) are skipped; each module is filled up to --target terms.
Pinyin comes from the longest CC-CEDICT words; a word with several readings is reported as 'ambiguous'
unless the candidate line gives its pinyin. With --write the new T lines are appended to the module's
rich pack (content/mod_9_NN_<key>.tsv). Then run curr_build.py to validate (must print errors 0)."""
import sys, os, re, glob, json, unicodedata
ROOT, CED = sys.argv[1], sys.argv[2]
CAND = sys.argv[3]
TARGET = int(sys.argv[sys.argv.index('--target') + 1]) if '--target' in sys.argv else 100
WRITE = '--write' in sys.argv

ced = {}
for e in json.load(open(CED, encoding='utf-8')):
    if len(e['s']) > 1 and e['pn'][:1].isupper(): continue
    ced.setdefault(e['s'], [])
    r = e['pn'].lower().replace('u:', 'v')
    if r not in ced[e['s']]: ced[e['s']].append(r)

MARK = {'a': 'āáǎà', 'e': 'ēéěè', 'i': 'īíǐì', 'o': 'ōóǒò', 'u': 'ūúǔù', 'v': 'ǖǘǚǜ'}
def mark(syl):
    m = re.match(r'([a-z]+)([1-5])$', syl)
    if not m: return syl
    s, t = m.group(1), int(m.group(2))
    s2 = s.replace('v', 'ü')
    if t == 5: return s2
    base = s
    if 'a' in base: i = base.index('a')
    elif 'e' in base: i = base.index('e')
    elif 'ou' in base: i = base.index('o')
    else: i = max(base.rfind(c) for c in 'iouv')
    ch = MARK[base[i]][t - 1]
    return (base[:i] + ch + base[i+1:]).replace('v', 'ü')
def word_py(r):
    out = ''
    for j, s in enumerate(r.split()):
        p = mark(s)
        if j and p[0] in 'aeoāáǎàēéěèōóǒò': out += "'"
        out += p
    return out

PREF = dict(x.split(':') for x in """假:jia3 强:qiang2 号:hao4 尾:wei3 叉:cha1 红:hong2 中:zhong1 大:da4 无:wu2 度:du4 并:bing4 查:cha2 隆:long2 空:kong1 泡:pao4 化:hua4 那:na4 和:he2 数:shu4 重:chong2 写:xie3 氏:shi4 体:ti3 可:ke3 浅:qian3 上:shang4 区:qu1 单:dan1 长:chang2 行:xing2 还:hai2 的:de5 了:le5 得:de2 地:di4 着:zhe5 发:fa1 为:wei4 处:chu4 分:fen1 间:jian1 量:liang4 种:zhong3 应:ying1 相:xiang1 将:jiang1 只:zhi3 便:bian4 传:chuan2 转:zhuan3 降:jiang4 系:xi4 少:shao3 好:hao3 乐:le4 参:can1 角:jiao3 冲:chong1 露:lu4 背:bei4 薄:bao2 解:jie3 都:dou1 要:yao4 调:diao4 差:cha1 当:dang1 正:zheng4 省:sheng3 藏:cang2 弹:tan2 盛:sheng4 沉:chen2 屏:ping2 识:shi2 似:si4 奇:qi2 结:jie2 给:gei3 看:kan4 漂:piao1 塞:sai1 散:san4 扫:sao3 少:shao3 舍:she3 尽:jin4 卡:ka3 系:xi4 吐:tu3 曲:qu1 模:mo2 恶:e4 校:xiao4 率:lv4 刺:ci4 朝:chao2 宿:su4 骨:gu3 横:heng2 薄:bao2 期:qi1 剥:bo1 削:xue1 圈:quan1 待:dai4 载:zai4 供:gong1 占:zhan4 伪:wei3 呼:hu1 担:dan1 劲:jin4 片:pian4 晃:huang4 落:luo4 混:hun4 称:cheng1 拓:tuo4 内:nei4 外:wai4 栏:lan2 囊:nang2 夹:jia1 华:hua2 尺:chi3 别:bie2 兴:xing1 炮:pao4 鲜:xian1 宁:ning2 似:si4 估:gu1 合:he2 斗:dou4 汗:han4 抹:mo3 约:yue1 绿:lv4 页:ye4 脏:zang1 读:du2 倒:dao4 压:ya1 会:hui4 与:yu3 撒:sa1 侧:ce4 同:tong2 沙:sha1 远:yuan3""".split())
WPREF = {"结果": "jie2 guo3", "同行": "tong2 hang2", "外传": "wai4 chuan2"}
def auto(zh):
    i, words, amb = 0, [], []
    while i < len(zh):
        for n in range(min(8, len(zh) - i), 0, -1):
            w = zh[i:i+n]
            if w in ced: break
        else:
            return None, [zh[i]]
        rs = ced[w]
        rs_nn = [r for r in rs if not r.endswith('5') or len(rs) == 1]
        uniq = sorted(set(rs_nn or rs))
        if PREF.get(w) in rs: uniq = [PREF[w]]
        elif WPREF.get(w) in rs: uniq = [WPREF[w]]
        if len(uniq) > 1: amb.append(f'{w}={"/".join(uniq)}')
        words.append(word_py(uniq[0]))
        i += n
    return ' '.join(words), amb

existing = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'content/mod_*.tsv'))):
    cur = None
    for ln in open(f, encoding='utf-8'):
        if ln[:1] in '@+': cur = ln[1:].split('|')[0].strip()
        elif ln.startswith('T|'): existing.setdefault(cur, []).append(ln.split('|')[1])
seen = {w for v in existing.values() for w in v}

plan, cur = {}, None
for ln in open(CAND, encoding='utf-8'):
    ln = ln.strip()
    if not ln or ln.startswith('#'): continue
    if ln.startswith('+'): cur = ln[1:]; plan.setdefault(cur, []); continue
    plan[cur].append(ln.split('|'))

bad = 0
for k, rows in plan.items():
    need = TARGET - len(existing.get(k, []))
    out = []
    for r in rows:
        if len(out) >= need: break
        zh, ar, en = r[0], r[1], r[2]
        if zh in seen: continue
        if len(r) > 3: py, amb = r[3], []
        else:
            py, amb = auto(zh)
            if py is None: print(f'NOPY {k} {zh} (char {amb[0]})'); bad += 1; continue
            if amb: print(f'AMB  {k} {zh} {py}  [{"; ".join(amb)}]')
        seen.add(zh); out.append(f'T|{zh}|{py}|{ar}|{en}')
    print(f'{k}: have {len(existing.get(k, []))}, adding {len(out)} (need {need})' + ('' if len(out) >= need else '  SHORT'))
    if WRITE and out:
        f = glob.glob(os.path.join(ROOT, f'content/mod_9_*_{k}.tsv'))[0]
        s = open(f, encoding='utf-8').read().rstrip('\n') + '\n' + '\n'.join(out) + '\n'
        open(f, 'w', encoding='utf-8').write(s)
print('nopy', bad)
