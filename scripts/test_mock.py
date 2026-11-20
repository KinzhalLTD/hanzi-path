"""HSK mock exam + business Chinese door: sections and counts per level, timer, answers kept when going back, score on the
HSK scale, history and prediction, weekly free limit → paywall, PRO unlimited, the new business scenes open. Usage: HTML OUT"""
import asyncio, sys
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
            if await pg.locator('#onew').count(): await pg.click('#onew')
            await pg.evaluate("S.music=false;S.pro=false;S.mockWeek=null;save();go('home')"); await pg.wait_for_timeout(1200); await pg.evaluate("closeSheet()")
            if not await pg.locator('#mockc').count(): errs.append(f'{L}: no mock card on home')
            for lv in (1, 3, 6):
                qs = await pg.evaluate(f"mockQs({lv}).map(q=>q.s)")
                exp = await pg.evaluate(f"MOCK[{lv}].n")
                got = [qs.count(0), qs.count(1), qs.count(2)]
                if got != exp: errs.append(f'{L}: HSK{lv} sections {got} != {exp}')
            await pg.evaluate("go('mock',{l:3})"); await pg.wait_for_timeout(300)
            await pg.click('#mgo'); await pg.wait_for_timeout(300)
            n = await pg.evaluate("document.querySelector('.sub.num').textContent")
            # answer first question, go next and back: kept
            if await pg.locator('.opt[data-j]').count(): await pg.locator('.opt[data-j]').first.click()
            await pg.click('#mnx'); await pg.click('#mpv'); await pg.wait_for_timeout(100)
            if not await pg.locator('.opt.sel').count(): errs.append(f'{L}: answer lost when going back')
            for _ in range(40):
                if not await pg.locator('#mnx').count(): break
                if await pg.locator('.mtile:not([disabled])').count(): await pg.locator('.mtile:not([disabled])').first.click()
                elif await pg.locator('.opt[data-j]').count(): await pg.locator('.opt[data-j]').nth(1).click()
                await pg.click('#mnx'); await pg.wait_for_timeout(30)
            await pg.screenshot(path=f'{O}/mock_{L}_result.png')
            h = await pg.evaluate("(S.mocks[3]||[]).length")
            if h != 1: errs.append(f'{L}: history {h}')
            sc = await pg.evaluate("S.mocks[3][0]")
            if not (0 <= sc['score'] <= 300 and len(sc['sec']) == 3): errs.append(f'{L}: score {sc}')
            await pg.evaluate("go('mock',{l:3})"); await pg.wait_for_timeout(300)
            if not await pg.locator('.mockpred').count(): errs.append(f'{L}: no prediction')
            await pg.click('#mgo'); await pg.wait_for_timeout(400)
            if not await pg.evaluate("!!document.querySelector('.sheet #buy')"): errs.append(f'{L}: weekly limit did not open paywall')
            await pg.evaluate("closeSheet();S.pro=true;go('mock',{l:2})"); await pg.wait_for_timeout(300); await pg.click('#mgo'); await pg.wait_for_timeout(300)
            if not await pg.locator('#mnx').count(): errs.append(f'{L}: PRO could not start')
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
            if not await pg.locator('#bizb').count(): errs.append(f'{L}: no business door')
            await pg.click('#bizb'); await pg.wait_for_timeout(400)
            if await pg.evaluate("route.name") != 'talk': errs.append(f'{L}: business door went to {await pg.evaluate("route.name")}')
            ks = await pg.evaluate("TALK.find(d=>d.k==='biz').scenes.map(s=>s.k)")
            for k in ('factory', 'moq', 'ship', 'claim'):
                if k not in ks: errs.append(f'{L}: scene {k} missing')
            await pg.evaluate("go('talkscene',{d:'biz',i:TALK.find(d=>d.k==='biz').scenes.findIndex(s=>s.k==='ship')})"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'{O}/biz_{L}.png')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: overflow')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
