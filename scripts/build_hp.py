
import json,sys,os,base64
KL_SVG='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#5c110d"/><rect x="30" y="6" width="60" height="78" rx="4" fill="#22140b" stroke="#b9852c" stroke-width="2"/><rect x="45" y="9" width="30" height="30" rx="3" fill="#d23a2f"/><text x="60" y="30" font-size="14" text-anchor="middle" fill="#f7d894" font-family="serif">曹</text><rect x="32" y="9" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="76" y="9" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="45" y="41" width="30" height="14" rx="2" fill="#e8b65c"/><rect x="32" y="41" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="76" y="41" width="12" height="30" rx="2" fill="#e8b65c"/><rect x="45" y="57" width="14" height="14" rx="2" fill="#f3e9d6"/><rect x="61" y="57" width="14" height="14" rx="2" fill="#f3e9d6"/></svg>'''
KL_ART='data:image/svg+xml;base64,'+base64.b64encode(KL_SVG.encode()).decode()
S=sys.argv[1]; src=S+'/hp/src'
W=json.load(open(S+'/out/hsk_words.json',encoding='utf-8'))
keep=('id','h','t','p','l','l3','en','ar','ex','mw')
W=[{k:w[k] for k in keep if k in w and w[k] not in (None,[],'')} for w in W]
art=json.load(open(S+'/art/art.json')); art['klotski']=KL_ART; tg=json.load(open(S+'/tangram/figures.json',encoding='utf-8'))
J=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
content=open(src+'/content.js',encoding='utf-8').read().replace('__TANGRAMS__',J(tg))
js='\n'.join(['const W='+J(W)+';','const ART='+J(art)+';',open(src+'/i18n.js',encoding='utf-8').read(),open(src+'/core.js',encoding='utf-8').read(),open(src+'/fun.js',encoding='utf-8').read(),open(src+'/music.js',encoding='utf-8').read().replace('__SAMPLES__',open(S+'/out/samples.json',encoding='utf-8').read()),open(src+'/photos.js',encoding='utf-8').read().replace('__PHOTOS__',open(S+'/art/photos.json',encoding='utf-8').read() if os.path.exists(S+'/art/photos.json') else '{}'),content,
  open(src+'/screens.js',encoding='utf-8').read(),open(src+'/games1.js',encoding='utf-8').read(),open(src+'/games2.js',encoding='utf-8').read(),open(src+'/culture_data.js',encoding='utf-8').read(),open(src+'/culture_more.js',encoding='utf-8').read(),open(src+'/culture_legends.js',encoding='utf-8').read(),open(src+'/culture.js',encoding='utf-8').read().replace('__KL__',open(S+'/hp/klotski_levels.json',encoding='utf-8').read()),open(src+'/tools.js',encoding='utf-8').read().replace('__CHARS__',open(S+'/out/chars.json',encoding='utf-8').read()),open(src+'/writing.js',encoding='utf-8').read().replace('__STROKES__',open(S+'/out/strokes.json',encoding='utf-8').read()),open(src+'/code_data.js',encoding='utf-8').read(),open(src+'/code_adv.js',encoding='utf-8').read(),open(src+'/code.js',encoding='utf-8').read(),open(src+'/sectors_data.js',encoding='utf-8').read(),open(src+'/sectors.js',encoding='utf-8').read().replace('__SECEXT__',open(S+'/out/sectors_ext.json',encoding='utf-8').read()),open(src+'/weave.js',encoding='utf-8').read(),open(src+'/account.js',encoding='utf-8').read(),open(src+'/icons.js',encoding='utf-8').read(),'render();'])
hwjs=open(S+'/vendor/hanzi-writer.min.js',encoding='utf-8').read().replace('</script','<\\/script')
html=f'''<title>Hanzi Path</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;700&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@500&family=Long+Cang&family=Liu+Jian+Mao+Cao&family=Zhi+Mang+Xing&family=ZCOOL+KuaiLe&family=ZCOOL+XiaoWei&display=swap">
<style>{open(src+'/styles.css',encoding='utf-8').read()}</style>
<div id="app"></div>
<script>{hwjs}</script>
<script>{js.replace("</script","<\\/script")}</script>'''
open(S+'/hp/dist/hanzi-path.html','w',encoding='utf-8').write(html)
open(S+'/hp/dist/app.js','w',encoding='utf-8').write(js)
print(len(html)//1024,'KB')
