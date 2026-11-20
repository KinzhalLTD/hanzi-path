"""Festival test for both apps: fake clock on a festival day → banner, celebration sheet, gift once, calendar screen, notification items; RTL/EN; no page errors."""
import asyncio, sys, json
from playwright.async_api import async_playwright
APP, H, O = sys.argv[1], sys.argv[2], sys.argv[3]
CLOCK = """(()=>{ const T=new %s; const D=Date; const off=T-D.now(); class F extends D{ constructor(...a){ if(!a.length){ super(D.now()+off); } else super(...a); } static now(){ return D.now()+off; } } window.Date=F; })();"""
async def start(pg, L):
    if APP == 'cp':
        await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="se"]'); await pg.click('#guest')
    else:
        await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#onew').count(): await pg.click('#onew')
    await pg.evaluate("S.music=false;save()")
async def main():
    errs = []; out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            for when, tag in (("D(2027,1,6,9,0)", 'day'), ("D(2026,11,10,9,0)", 'before')):
                pg = await b.new_page(viewport={'width': 390, 'height': 844})
                await pg.add_init_script(CLOCK % when.replace('D(', 'Date(').replace('new Date', 'Date'))
                pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
                await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
                await pg.evaluate("go('home')"); await pg.wait_for_timeout(1500)
                ban = await pg.evaluate("(document.querySelector('#fban')||{}).textContent||''")
                sh = await pg.evaluate("!!document.querySelector('.fsheet')")
                out[f'{L}-{tag}'] = {'banner': ban.strip()[:80], 'sheet': sh}
                await pg.screenshot(path=f'{O}/{APP}_{L}_{tag}_home.png')
                if tag == 'day':
                    if not sh: errs.append(f'{L}: no celebration sheet on festival day')
                    await pg.screenshot(path=f'{O}/{APP}_{L}_sheet.png')
                    c0 = await pg.evaluate("S.coins"); await pg.click('#fgift'); await pg.wait_for_timeout(300)
                    c1 = await pg.evaluate("S.coins")
                    if c1 <= c0: errs.append(f'{L}: gift gave nothing')
                    await pg.evaluate("closeSheet();festShown=false;go('home')"); await pg.wait_for_timeout(1200)
                    if await pg.evaluate("!!document.querySelector('.fsheet')"): errs.append(f'{L}: celebrated twice')
                    await pg.evaluate("festSheet('spring')"); await pg.wait_for_timeout(300)
                    if await pg.locator('#fgift').count(): errs.append(f'{L}: gift offered twice')
                    await pg.evaluate("closeSheet()")
                else:
                    if 'Winter' not in ban and 'الشتوي' not in ban: errs.append(f'{L}: banner before Dongzhi missing: {ban!r}')
                await pg.evaluate("go('festivals')"); await pg.wait_for_timeout(400)
                await pg.screenshot(path=f'{O}/{APP}_{L}_{tag}_cal.png', full_page=True)
                n = await pg.evaluate("document.querySelectorAll('.fitem').length")
                if n < 10: errs.append(f'{L}: calendar shows {n}')
                it = await pg.evaluate("festItems()")
                out[f'{L}-{tag}-items'] = [len(it), it[0]['title'] if it else None, it[0]['at'] if it else None]
                if not it or len(it) > 14: errs.append(f'{L}: notification items {len(it)}')
                ow = await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1")
                if ow: errs.append(f'{L}-{tag}: horizontal overflow')
                await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
                if not await pg.locator('#fcalb').count(): errs.append(f'{L}: no calendar door on Me')
                await pg.close()
        await b.close()
    print(json.dumps(out, ensure_ascii=False, indent=0)); print('errors', errs)
asyncio.run(main())
