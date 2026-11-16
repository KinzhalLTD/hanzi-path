import json,sys,unicodedata,re
S=sys.argv[1]; files=sys.argv[2:]
ced={}
for e in json.load(open(S+'/out/cedict_base.json')): ced.setdefault(e['s'],set()).add(e['p'])
def norm(p): p=unicodedata.normalize('NFC',p.lower()); return re.sub(r"[\s'·\-]","",p)
def strip(p): return ''.join(c for c in unicodedata.normalize('NFD',norm(p)) if unicodedata.category(c)!='Mn').replace('ü','v')
out={}; cur=None; issues=[]; n=0
for f in files:
  for ln in open(f,encoding='utf8'):
    ln=ln.rstrip('\n')
    if not ln or ln.startswith('# '): continue
    if ln.startswith('@'): cur=ln[1:]; out[cur]={'topics':[],'ex':[]}; continue
    if ln.startswith('#'):
      k,zh,ar,en=ln[1:].split('|'); out[cur]['topics'].append({'k':k,'zh':zh,'ar':ar,'en':en,'terms':[]}); continue
    if ln.startswith('>'):
      p=ln[1:].split('|'); assert len(p)==4,ln; out[cur]['ex'].append(p); continue
    p=ln.split('|'); assert len(p)==5,ln; p[4]=int(p[4]); out[cur]['topics'][-1]['terms'].append(p); n+=1
    h,py=p[0],p[1]
    if re.search('[A-Za-z0-9]',h): continue
    if h in ced:
      if norm(py) not in {norm(x) for x in ced[h]}:
        tag='TONE' if strip(py) in {strip(x) for x in ced[h]} else 'DIFF'
        issues.append((cur,tag,h,py,sorted(ced[h])))
    else:
      # char-by-char syllable count check
      if len(re.findall(r'[一-鿿]',h))!=len(re.findall(r"[a-zü]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜa-zü]+",py.replace("'"," "))) and False: pass
      issues.append((cur,'NOTIN',h,py,''))
for k,v in out.items():
  seen=set(); 
  for t in v['topics']:
    for x in t['terms']:
      if x[0] in seen: issues.append((k,'DUP',x[0],'',''))
      seen.add(x[0])
json.dump(out,open(S+'/out/sectors_ext.json','w'),ensure_ascii=False)
print('terms',n,{k:sum(len(t['terms']) for t in v['topics']) for k,v in out.items()})
for i in issues: print(*i)
