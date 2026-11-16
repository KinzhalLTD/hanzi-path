import json,sys,os
S=sys.argv[1]; sys.path.insert(0,S+'/scripts'); from radicals import RAD
W=json.load(open(S+'/out/hsk_words.json'))
chars=set(c for w in W for c in w['h'])
single={w['h']:w for w in W if len(w['h'])==1}
D={}
for line in open(S+'/mmah/dictionary.txt',encoding='utf-8'):
  j=json.loads(line); D[j['character']]=j
TY={'pictophonetic':'p','ideographic':'i','pictographic':'g'}
out={}
for c in chars:
  j=D.get(c)
  if not j: continue
  comps=[x for x in j.get('decomposition','') if not ('⿰'<=x<='⿿') and x!='？']
  e=j.get('etymology') or {}
  out[c]=[j.get('radical',''),''.join(comps),TY.get(e.get('type'),''),(e.get('hint') or '').replace('\xa0',' '),e.get('semantic',''),e.get('phonetic','')]
comp={}
py=lambda x:(D.get(x,{}).get('pinyin') or [''])[0]
for x in set(ch for v in out.values() for ch in v[1]+v[0]+v[4]+v[5]):
  if x in RAD: comp[x]=RAD[x]+[py(x)]
  elif x in single and single[x].get('ar'): comp[x]=[single[x]['en'][0] if single[x].get('en') else '', single[x]['ar'][0].split('؛')[0],py(x)]
  elif x in D and D[x].get('definition'): comp[x]=[D[x]['definition'].split(';')[0].split(',')[0],'',py(x)]
json.dump({'c':out,'m':comp},open(S+'/out/chars.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),len(comp),os.path.getsize(S+'/out/chars.json')//1024,'KB',sum(1 for v in comp.values() if not v[1]),'comps w/o arabic')
