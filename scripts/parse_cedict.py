import json, sys, re, unicodedata
src, dst = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8').read()
t = t[t.index('{'):].rstrip().rstrip(';')
d = json.loads(t)['all']
MARKS = {'a':'āáǎàa','e':'ēéěèe','i':'īíǐìi','o':'ōóǒòo','u':'ūúǔùu','ü':'ǖǘǚǜü'}
def syl(s):
    m = re.fullmatch(r'([A-Za-züÜ:v]+?)([1-5])', s)
    if not m: return s
    base, tone = m.group(1).replace('u:','ü').replace('v','ü').replace('U:','Ü'), int(m.group(2))
    low = base.lower()
    if 'a' in low: i = low.index('a')
    elif 'e' in low: i = low.index('e')
    elif 'ou' in low: i = low.index('o')
    else:
        idx = [k for k,c in enumerate(low) if c in 'iouü']
        if not idx: return base
        i = idx[-1]
    c = low[i]; r = MARKS[c][tone-1]
    if base[i].isupper(): r = r.upper()
    return base[:i] + r + base[i+1:]
def marks(p): return ' '.join(syl(x) for x in p.split())
out=[]
for e in d:
    trad, simp, py, en = e[0], e[1], e[2], e[3]
    out.append({'s':simp,'t':trad,'pn':py,'p':marks(py),'en':en,'cl':e[4] if len(e)>4 else []})
json.dump(out, open(dst,'w',encoding='utf-8'), ensure_ascii=False)
print(len(out), 'entries'); print(out[1000]); print([x for x in out if x['s'] in ('合作','女儿','绿')][:4])
