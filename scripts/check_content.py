import json,sys,re,unicodedata
tsv,base,hsk,level=sys.argv[1:5]; level=int(level)
B=json.load(open(base,encoding='utf-8')); idx={}
for e in B: idx.setdefault(e['s'],[]).append(e)
H=[w for w in json.load(open(hsk,encoding='utf-8')) if w['l']==level]; hs={w['h'] for w in H}
def norm(p,tones=True):
    p=unicodedata.normalize('NFD',p.lower())
    if not tones: p=''.join(c for c in p if unicodedata.category(c)!='Mn')
    return re.sub(r"[\s'·\-]",'',unicodedata.normalize('NFC',p))
SYL=r"(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?:ng|n(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|r(?![aeiouāáǎàēéěèīíǐìōóǒòūúǔù]))?"
seen=set(); n=0; issues=[]
for i,line in enumerate(open(tsv,encoding='utf-8'),1):
    line=line.rstrip('\n')
    if not line or line.startswith('#'): continue
    f=line.split('|'); n+=1
    if len(f)==8: f=f[:3]+f[4:]
    if len(f)!=7: issues.append((i,'fields',len(f))); continue
    h,p,ar,ez,ep,ea,ee=f
    if h in seen: issues.append((i,'dup',h)); seen.add(h)
    seen.add(h)
    if h not in hs: issues.append((i,'not in level',h))
    c=idx.get(h,[])
    if c and not any(norm(x['p'],False)==norm(p,False) for x in c): issues.append((i,'pinyin letters',h,p,[x['p'] for x in c][:3]))
    if h not in ez and not all(ch in ez for ch in h): issues.append((i,'headword not in example',h,ez))
    nh=len(re.findall(r'[一-鿿]',ez)); ns=len(re.findall(SYL,ep.lower().replace("'"," ")))
    if nh-ez.count('儿')!=ns-0 and not (nh==ns+ez.count('儿')): issues.append((i,'syllables',h,nh,ns,ep))
print(n,'entries;',len(hs-seen),'level words missing:',sorted(hs-seen)[:20])
for x in issues: print(x)
