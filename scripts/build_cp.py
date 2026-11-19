"""Build the single-file app cp/dist/cipher-path.html (+ cp/dist/app.js for syntax checks).
Curriculum and conversations are emitted as <script type="application/json"> blocks (parsed once at startup).
Inputs: out/curr.json (scripts/curr_build.py), out/talk.json (scripts/talk_build.py), cp/src/*.js in ORDER."""
import json, sys, os
R = sys.argv[1]; src = R + '/cp/src'
ORDER = ['i18n', 'core', 'voice', 'feel', 'labs_code', 'labs_sec', 'fun', 'learn', 'labs', 'zh', 'games', 'me']
DATA = []
def blk(name, obj):
    text = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    DATA.append(f'<script type="application/json" id="d-{name}">' + text.replace('</', '<\\/') + '</script>')
    return f'__json("d-{name}")'
PRELUDE = 'function __json(id){ const e=document.getElementById(id); const v=JSON.parse(e.textContent); e.remove(); return v; }'
curr = json.load(open(R + '/out/curr.json', encoding='utf-8')); talk = json.load(open(R + '/out/talk.json', encoding='utf-8'))
order = ['soft', 'sec']; talk.sort(key=lambda d: order.index(d['k']) if d['k'] in order else 9)
js = '\n'.join([PRELUDE, 'const CURR=' + blk('curr', curr) + ';', 'const TALK=' + blk('talk', talk) + ';'] +
               [open(f'{src}/{n}.js', encoding='utf-8').read() for n in ORDER] + ['render();'])
css = open(src + '/styles.css', encoding='utf-8').read()
fonts = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+SC:wght@500;700&family=Noto+Serif+SC:wght@600;700&family=Ma+Shan+Zheng&display=swap'
html = f'''<title>Cipher Path</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<style>{css}</style>
<div id="app"></div>
{''.join(DATA)}
<script>{js.replace("</script", "<\\/script")}</script>'''
os.makedirs(R + '/cp/dist', exist_ok=True)
open(R + '/cp/dist/cipher-path.html', 'w', encoding='utf-8').write(html)
open(R + '/cp/dist/app.js', 'w', encoding='utf-8').write(js)
print(len(html) // 1024, 'KB')
