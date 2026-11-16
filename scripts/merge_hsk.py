import json, sys, re
hsk, b1, out, *glossfiles = sys.argv[1:]
H = json.load(open(hsk, encoding='utf-8'))
B = {e['hanzi']: e for e in json.load(open(b1, encoding='utf-8'))}
G = {}; E = {}; X = {}
for gf in glossfiles:
    for line in open(gf, encoding='utf-8'):
        line=line.strip()
        if line and not line.startswith('#'):
            f=line.split('|')
            if len(f)==3 and f[1]=='EX': X[f[0]]=f[2]; continue
            if len(f)==2: E[f[0]]=[x.strip() for x in f[1].split(';')]
            elif len(f)==3: G[f[0]]=(f[1],f[2].split(';'),None)
            elif len(f)==7: G[f[0]]=(f[1],f[2].split(';'),{'zh':f[3],'py':f[4],'ar':f[5],'en':f[6]})
            elif len(f)==8: G[f[0]]=(f[1],f[2].split(';'),{'zh':f[4],'py':f[5],'ar':f[6],'en':f[7]}); E[f[0]]=[x.strip() for x in f[3].split(';')]
BAD = re.compile(r'^(surname|variant of|old variant|abbr\.|archaic|\(archaic|used in|Japanese variant|see )', re.I)
def best(forms):
    good = [f for f in forms if f['meanings'] and not BAD.match(f['meanings'][0]) and not f['transcriptions']['pinyin'][:1].isupper()]
    return (good or forms)[0]
words, seen = [], set()
for e in H:
    old = [int(l.split('-')[1]) for l in e['level'] if l.startswith('old-')]
    if not old: continue
    new = [int(l.split('-')[1]) for l in e['level'] if l.startswith('new-')]
    f = best(e['forms'])
    w = {'id': len(words)+1, 'h': e['simplified'], 't': f['traditional'], 'p': f['transcriptions']['pinyin'], 'l': min(old), 'l3': min(new) if new else None,
         'en': [m for m in f['meanings'] if not BAD.match(m)][:3] or f['meanings'][:2], 'r': e.get('radical',''), 'fq': e.get('frequency') or 999999}
    if e['simplified'] in G:
        g=G[e['simplified']]; w['p'], w['ar'] = g[0], g[1]
        if g[2]: w['ex']=g[2]
    b = B.get(e['simplified'])
    if b: w.update(ar=b['ar'], ex=b['examples'][0], mw=b['measure'], p=b['pinyin'], pos=b['pos'])
    if e['simplified'] in E: w['en']=E[e['simplified']]
    words.append(w); seen.add(e['simplified'])
for h,b in B.items():
    if h not in seen:
        words.append({'id': len(words)+1, 'h': h, 't': b['trad'], 'p': b['pinyin'], 'l': 1, 'l3': None, 'en': E.get(h,[]), 'r': '', 'fq': 999999,
                      'ar': b['ar'], 'ex': b['examples'][0], 'mw': b['measure'], 'pos': b['pos']})
for w in words:
    if 'ex' in w and w['h'] in X and not w['ex'].get('en'): w['ex']=dict(w['ex'],en=X[w['h']])
words.sort(key=lambda w: (w['l'], w['fq']))
for i,w in enumerate(words,1): w['id']=i
json.dump(words, open(out,'w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
from collections import Counter
print('total', len(words), sorted(Counter(w['l'] for w in words).items()))
print('Arabic by level', sorted(Counter(w['l'] for w in words if 'ar' in w).items()))
print('sample fixes', [(w['h'],w['p']) for w in words if w['h'] in ('要','吧','离','着','也','妻子','便宜','长','行','了')])
print('L3 sample', [(w['h'],w['p'],w['en'][:1]) for w in words if w['l']==3][:8])
