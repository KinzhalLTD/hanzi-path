"""Certificates test (both apps): none → empty state; pass gates → list, announce once, canvas draws, name input, share (native message carries a PNG)."""
import asyncio, sys
from playwright.async_api import async_playwright
APP, H, O = sys.argv[1], sys.argv[2], sys.argv[3]
async def start(pg, L):
    if APP == 'cp': await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="se"]'); await pg.click('#guest')
    else:
        await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#onew').count(): await pg.click('#onew')
    await pg.evaluate("S.music=false;save()")
GATES = {'cp': "S.gates=S.gates||{};chapOf('se').forEach(ch=>S.gates[gateKey(ch)]={ok:true,p:90});S.gates[gateKey(chapOf('cy')[0])]={ok:true,p:85};save()",
         'hp': "S.gates=S.gates||{};chaptersOf(1).forEach(ch=>S.gates['1-'+ch.c]=1);S.gates['2-0']=1;save()"}
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script("window.__native=[];window.ReactNativeWebView=undefined;")
            await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();go('certs')"); await pg.wait_for_timeout(300)
            if await pg.locator('.certitem').count(): errs.append(f'{L}: certificates before any gate')
            await pg.evaluate(GATES[APP]); await pg.evaluate("go('home')"); await pg.wait_for_timeout(1500)
            if not await pg.locator('#cimg').count(): errs.append(f'{L}: new certificate not announced')
            await pg.fill('#cname', 'Amjad Alqahtani' if L == 'en' else 'أمجد القحطاني'); await pg.wait_for_timeout(700)
            src = await pg.evaluate("document.querySelector('#cimg').src.length")
            if src < 50000: errs.append(f'{L}: certificate image too small ({src})')
            await pg.screenshot(path=f'{O}/{APP}_{L}_cert.png')
            await pg.evaluate("(async()=>{const c=certEarned()[0];const cv=await certCanvas(c);window.__png=cv.toDataURL('image/png');})()"); await pg.wait_for_timeout(500)
            data = await pg.evaluate("window.__png")
            import base64; open(f'{O}/{APP}_{L}_cert_full.png', 'wb').write(base64.b64decode(data.split(',')[1]))
            await pg.evaluate("closeSheet();go('home')"); await pg.wait_for_timeout(1500)
            if await pg.locator('#cimg').count(): errs.append(f'{L}: announced twice')
            await pg.evaluate("closeSheet();go('certs')"); await pg.wait_for_timeout(300)
            n = await pg.locator('.certitem').count(); exp = 6 if APP == 'cp' else (len(await pg.evaluate("chaptersOf(1)")) + 2)
            if n != exp: errs.append(f'{L}: {n} certificates, expected {exp}')
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
            if not await pg.locator('#certb').count(): errs.append(f'{L}: no certificates door on Me')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: overflow')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
