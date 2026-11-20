import asyncio, sys
from playwright.async_api import async_playwright
APP, H = sys.argv[1], sys.argv[2]
FAKE = "window.__w=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); if(m.type==='widget') __w.push(m.data); if(m.id) setTimeout(()=>window.__fromNative({id:m.id,ok:true}),20); }};"
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.add_init_script(FAKE); await pg.goto('file://' + H); await pg.wait_for_timeout(3200)
        d = await pg.evaluate("__w[0]||widgetData()")
        if not d or not d.get('word') or not d['word'].get('h') or not d['word'].get('m'): errs.append(f'no word {d}')
        if 'streak' not in d: errs.append('no streak')
        if not await pg.evaluate("__w.length"): errs.append('nothing sent to native')
        print(d); await b.close()
    print('errors', errs)
asyncio.run(main())
