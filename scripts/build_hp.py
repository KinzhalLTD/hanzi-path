
import json,sys,os,base64
KL_SVG='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#5c110d"/><rect x="30" y="6" width="60" height="78" rx="4" fill="#22140b" stroke="#b9852c" stroke-width="2"/><rect x="45" y="9" width="30" height="30" rx="3" fill="#d23a2f"/><text x="60" y="30" font-size="14" text-anchor="middle" fill="#f7d894" font-family="serif">曹</text><rect x="32" y="9" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="76" y="9" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="45" y="41" width="30" height="14" rx="2" fill="#e8b65c"/><rect x="32" y="41" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="76" y="41" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="45" y="57" width="14" height="14" rx="2" fill="#f3e9d6"/><rect x="61" y="57" width="14" height="14" rx="2" fill="#f3e9d6"/></svg>'''
KL_ART='data:image/svg+xml;base64,'+base64.b64encode(KL_SVG.encode()).decode()
S=sys.argv[1]; src=S+'/hp/src'
W=json.load(open(S+'/out/hsk_words.json',encoding='utf-8'))
keep=('id','h','t','p','l','l3','en','ar','ex','mw')
W=[{k:w[k] for k in keep if k in w and w[k] not in (None,[],'')} for w in W]
art=json.load(open(S+'/art/art.json')); art['klotski']=KL_ART; tg=json.load(open(S+'/tangram/figures.json',encoding='utf-8'))
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
# Big data tables ship as <script type="application/json"> blocks instead of JS literals. The JS engine never
# compiles them; __json parses one at startup (JSON.parse is much faster than a literal), __lazy parses on
# first use (stroke paths, photos, instrument samples, art, character analysis are only needed on some screens).
DATA=[]
def blk(name,text,lazy):
    text=text.strip()
    json.loads(text)                                   # fail the build on bad JSON
    DATA.append(f'<script type="application/json" id="d-{name}">'+text.replace('</','<\\/')+'</script>')
    return f'__lazy("d-{name}")' if lazy else f'__json("d-{name}")'
rd=lambda f:open(f,encoding='utf-8').read()
PRELUDE='''function __json(id){ const e=document.getElementById(id); const v=JSON.parse(e.textContent); e.remove(); return v; }
function __lazy(id){ let v; const g=()=>v||(v=__json(id));
  return new Proxy({},{get:(t,k)=>g()[k],has:(t,k)=>k in g(),ownKeys:()=>Reflect.ownKeys(g()),
    getOwnPropertyDescriptor:(t,k)=>{ const d=Reflect.getOwnPropertyDescriptor(g(),k); if(d) d.configurable=true; return d; }}); }'''
content=open(src+'/content.js',encoding='utf-8').read().replace('__TANGRAMS__',J(tg))
js='\n'.join([PRELUDE,'const W='+blk('w',J(W),False)+';','const ART='+blk('art',J(art),True)+';',open(src+'/i18n.js',encoding='utf-8').read(),open(src+'/core.js',encoding='utf-8').read(),open(src+'/voice.js',encoding='utf-8').read(),open(src+'/fun.js',encoding='utf-8').read(),open(src+'/music.js',encoding='utf-8').read().replace('__SAMPLES__',blk('samples',rd(S+'/out/samples.json'),True)),open(src+'/photos.js',encoding='utf-8').read().replace('__PHOTOS__',blk('photos',rd(S+'/art/photos.json'),True) if os.path.exists(S+'/art/photos.json') else '{}'),content,
  open(src+'/screens.js',encoding='utf-8').read(),open(src+'/games1.js',encoding='utf-8').read(),open(src+'/games2.js',encoding='utf-8').read(),open(src+'/culture_data.js',encoding='utf-8').read(),open(src+'/culture_more.js',encoding='utf-8').read(),open(src+'/culture_legends.js',encoding='utf-8').read(),open(src+'/culture.js',encoding='utf-8').read().replace('__KL__',open(S+'/hp/klotski_levels.json',encoding='utf-8').read()),open(src+'/tools.js',encoding='utf-8').read().replace('__CHARS__',blk('chars',rd(S+'/out/chars.json'),True)),open(src+'/learn.js',encoding='utf-8').read(),open(src+'/journey.js',encoding='utf-8').read(),open(src+'/talk.js',encoding='utf-8').read().replace('__TALK__',blk('talk',rd(S+'/out/talk.json'),False)),open(src+'/grammar.js',encoding='utf-8').read().replace('__GRAMMAR__',(blk('grammar',rd(S+'/out/grammar.json'),True),'(()=>__json("d-grammar"))')[1]),open(src+'/writing.js',encoding='utf-8').read().replace('__STROKES__',blk('strokes',rd(S+'/out/strokes.json'),True)),open(src+'/code_data.js',encoding='utf-8').read(),open(src+'/code_adv.js',encoding='utf-8').read(),open(src+'/code.js',encoding='utf-8').read(),open(src+'/sectors_data.js',encoding='utf-8').read(),open(src+'/sectors.js',encoding='utf-8').read().replace('__SECEXT__',blk('secext',rd(S+'/out/sectors_ext.json'),False)),open(src+'/weave.js',encoding='utf-8').read(),open(src+'/account.js',encoding='utf-8').read(),open(src+'/festivals.js',encoding='utf-8').read(),open(src+'/growth.js',encoding='utf-8').read(),open(src+'/feel.js',encoding='utf-8').read(),open(src+'/icons.js',encoding='utf-8').read(),'render();'])
hwjs=open(S+'/vendor/hanzi-writer.min.js',encoding='utf-8').read().replace('</script','<\\/script')
html=f'''<title>Hanzi Path</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;700&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@500&family=Long+Cang&family=Liu+Jian+Mao+Cao&family=Zhi+Mang+Xing&family=ZCOOL+KuaiLe&family=ZCOOL+XiaoWei&display=swap">
<style>{open(src+'/styles.css',encoding='utf-8').read()}</style>
<div id="app"></div>
{''.join(DATA)}
<script>{hwjs}</script>
<script>{js.replace("</script","<\\/script")}</script>'''
open(S+'/hp/dist/hanzi-path.html','w',encoding='utf-8').write(html)
open(S+'/hp/dist/app.js','w',encoding='utf-8').write(js)
print(len(html)//1024,'KB')
