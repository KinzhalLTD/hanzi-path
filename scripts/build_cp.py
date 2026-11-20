"""Build the single-file app cp/dist/cipher-path.html (+ cp/dist/app.js for syntax checks).
Curriculum and conversations are emitted as <script type="application/json"> blocks (parsed once at startup).
Inputs: out/curr.json (scripts/curr_build.py), out/talk.json (scripts/talk_build.py), cp/src/*.js in ORDER."""
import json, sys, os
R = sys.argv[1]; src = R + '/cp/src'
ORDER = ['i18n', 'core', 'polish', 'voice', 'feel', 'labs_code', 'labs_sec', 'fun', 'learn', 'journey', 'mastery', 'labs', 'zh', 'games', 'music', 'me', 'account', 'profit', 'festivals', 'growth', 'certificates', 'tutor', 'a11y']
DATA = []
def blk(name, obj):
    text = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    DATA.append(f'<script type="application/json" id="d-{name}">' + text.replace('</', '<\\/') + '</script>')
    return f'__json("d-{name}")'
PRELUDE = 'function __json(id){ const e=document.getElementById(id); const v=JSON.parse(e.textContent); e.remove(); return v; }'
def art():
    # Canva-generated artwork in art/canva/*.png → compressed WebP data URIs (key = file name without extension)
    import glob, base64, io
    from PIL import Image
    out = {}
    def put(name, im):
        b = io.BytesIO(); im.save(b, 'WEBP', quality=82, method=6)
        out[name] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
    for f in sorted(glob.glob(R + '/art/canva/bossgrid_*.png')):
        # 2x2 boss sheet named bossgrid_<key>__<key>__<key>__<key>.png (top-left, top-right, bottom-left, bottom-right)
        keys = os.path.splitext(os.path.basename(f))[0][len('bossgrid_'):].split('__')
        im = Image.open(f).convert('RGB'); w, h = im.size; inset = .05
        for i, k in enumerate(keys[:4]):
            x0, y0 = (i % 2) * w / 2, (i // 2) * h / 2
            put('boss_' + k, im.crop((int(x0 + w * inset / 2), int(y0 + h * inset / 2), int(x0 + w / 2 - w * inset / 2), int(y0 + h / 2 - h * inset / 2))))
    for f in sorted(glob.glob(R + '/art/canva/*.png')):
        if os.path.basename(f).startswith('bossgrid_'): continue
        im = Image.open(f).convert('RGB'); im.thumbnail((360, 360)); put(os.path.splitext(os.path.basename(f))[0], im)
    return out
def gz():
    import base64
    idx = json.load(open(R + '/art/guzheng/index.json'))
    for x in idx: x['d'] = 'data:audio/mpeg;base64,' + base64.b64encode(open(R + '/art/guzheng/' + x['f'], 'rb').read()).decode()
    return idx
curr = json.load(open(R + '/out/curr.json', encoding='utf-8')); talk = json.load(open(R + '/out/talk.json', encoding='utf-8'))
order = ['soft', 'sec']; talk.sort(key=lambda d: order.index(d['k']) if d['k'] in order else 9)
js = '\n'.join([PRELUDE, 'const CURR=' + blk('curr', curr) + ';', 'const TALK=' + blk('talk', talk) + ';', 'const ART=' + blk('art', art()) + ';',
               # real recorded guzheng plucks (art/guzheng, CC0), parsed only when music starts
               'const GZ_SAMPLES=(()=>{let v;return ()=>v||(v=' + blk('gz', gz()) + ');})();'] +
               [open(f'{src}/{n}.js', encoding='utf-8').read() for n in ORDER] + ['render();'])
css = open(src + '/styles.css', encoding='utf-8').read()
fonts = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+SC:wght@500;700&family=Noto+Serif+SC:wght@600;700&family=Ma+Shan+Zheng&display=swap'
html = f'''<title>Cipher Path</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script>(function(){{var l=document.createElement('link');l.rel='stylesheet';l.href='{fonts}';document.head.appendChild(l);}})();</script>
<style>{css}</style>
<div id="app"><div class="boot" role="status" aria-label="Loading · جارٍ التحميل"><div class="boot-zh" aria-hidden="true">码道</div><div class="boot-t">مسار الشيفرة · Cipher Path</div><div class="boot-bar" aria-hidden="true"><i></i></div></div></div>
{''.join(DATA)}
<script>{js.replace("</script", "<\\/script")}</script>'''
os.makedirs(R + '/cp/dist', exist_ok=True)
open(R + '/cp/dist/cipher-path.html', 'w', encoding='utf-8').write(html)
open(R + '/cp/dist/app.js', 'w', encoding='utf-8').write(js)
print(len(html) // 1024, 'KB')
