"""Growth test (both apps): funnel events, paywall variant b, White Friday sale (strike price, no trial, sale sku), Kinzhal Pass card, cross-promo gating."""
import asyncio, sys, json
from playwright.async_api import async_playwright
APP, H, O = sys.argv[1], sys.argv[2], sys.argv[3]
CLOCK = """(()=>{ const T=new Date(%s); const D=Date; const off=T-D.now(); class F extends D{ constructor(...a){ if(!a.length){ super(D.now()+off); } else super(...a); } static now(){ return D.now()+off; } } window.Date=F; })();"""
async def start(pg, L):
    if APP == 'cp': await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="se"]'); await pg.click('#guest')
    else:
        await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#onew').count(): await pg.click('#onew')
    await pg.evaluate("S.music=false;save()")
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script(CLOCK % '2026,10,27,12,0')
            await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            k = await pg.evaluate("S.kpi")
            if not k.get('first_open'): errs.append(f'{L}: no first_open')
            if not await pg.evaluate("!!S.cid&&/^[ab]$/.test(S.pwv)"): errs.append(f'{L}: cid/variant')
            await pg.evaluate("S.pwv='b';S.pro=false;closeSheet&&closeSheet();go('home')"); await pg.wait_for_timeout(1300)
            await pg.evaluate("closeSheet();paywall('module')"); await pg.wait_for_timeout(500)
            sb = await pg.evaluate("(document.querySelector('.salebar')||{}).textContent||''")
            if 'White Friday' not in sb and 'الجمعة البيضاء' not in sb: errs.append(f'{L}: no sale banner: {sb!r}')
            if not await pg.locator('.sheet s.was').count(): errs.append(f'{L}: no struck price')
            if not await pg.locator('.sheet .perday').count(): errs.append(f'{L}: variant b per-day missing')
            if not await pg.locator('#pass').count(): errs.append(f'{L}: no pass card')
            if await pg.evaluate("saleSku('pro_yearly')") != 'pro_yearly_sale': errs.append(f'{L}: sale sku')
            await pg.screenshot(path=f'{O}/{APP}_{L}_paywall.png', full_page=False)
            ov = await pg.evaluate("document.querySelector('.sheet .rise').scrollWidth>document.querySelector('.sheet .rise').clientWidth+1")
            if ov: errs.append(f'{L}: paywall overflow')
            await pg.evaluate("void buyPass()"); await pg.wait_for_timeout(1300)
            if not await pg.evaluate("S.pro"): errs.append(f'{L}: pass purchase (demo) did not unlock')
            await pg.evaluate("S.pro=false;S.adCount=4;S.promoAt=0"); 
            if await pg.evaluate("promoDue()"): errs.append(f'{L}: promo shown without app ids')
            await pg.evaluate("APP_IDS.hp='1';APP_IDS.cp='2'")
            if not await pg.evaluate("promoDue()"): errs.append(f'{L}: promo not due with ids')
            await pg.evaluate("closeSheet();void interstitial()"); await pg.wait_for_timeout(400)
            if not await pg.locator('#pget').count(): errs.append(f'{L}: promo sheet missing')
            await pg.screenshot(path=f'{O}/{APP}_{L}_promo.png')
            await pg.close()
            # outside a sale: no banner, trial wording back
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script(CLOCK % '2026,11,10,12,0')
            await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();S.pro=false;paywall('module')"); await pg.wait_for_timeout(400)
            if await pg.locator('.salebar').count(): errs.append(f'{L}: sale banner outside a sale')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
