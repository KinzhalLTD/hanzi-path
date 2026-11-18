"""Grammar feature test (phone-shell HTML): hub, levels, search, point screen, practice (answers every question,
right and wrong), stars saved, level review, PRO lock, both languages; screenshots to OUT.
Usage: python3 scripts/test_grammar.py HTML OUT"""
import sys, asyncio, json
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]
async def answer(pg, right=True):
    q = await pg.evaluate("(()=>{const q=window.__grq; return {k:q.k, mk:q.mk, toks:q.toks, right:q.right, r:q.r, opts:q.opts}})()")
    if q['k'] == 'build':
        toks = q['toks'] if right else list(reversed(q['toks']))
        used = set()
        for t in toks:
            n = await pg.locator('#bbank .btile:not([disabled])').count()
            for j in range(n):
                b = pg.locator('#bbank .btile:not([disabled])').nth(j)
                if (await b.inner_text()).strip() == t: await b.click(); break
    else:
        want = {'gap': q['mk'], 'mean': q['right'], 'fix': q['r']}[q['k']]
        idx = q['opts'].index(want) if right else next(j for j, o in enumerate(q['opts']) if o != want)
        await pg.locator('.opt').nth(idx).click()
    await pg.click('#ck'); await pg.wait_for_timeout(120); await pg.click('.feedback #nx'); await pg.wait_for_timeout(120)
    return q['k']
async def main():
    errs = []; kinds = set()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('ar', 'en'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            pg.on('pageerror', lambda e: errs.append(L + ': ' + str(e)[:200]))
            pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and errs.append(L + ' console: ' + m.text[:160]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
            if await pg.locator('#onew').count(): await pg.click('#onew'); await pg.wait_for_timeout(200)
            await pg.click('#tgr'); await pg.wait_for_timeout(300)
            if await pg.evaluate("route.name") != 'grammar': errs.append(L + ': home card does not open grammar')
            n1 = await pg.locator('.grpt').count(); total = await pg.evaluate("GR().length")
            levels = await pg.evaluate("[1,2,3,4,5,6].map(l=>grLv(l).length)")
            print(L, 'points', total, 'per level', levels, 'HSK1 cards', n1)
            if n1 != levels[0]: errs.append(f'{L}: HSK1 list shows {n1} of {levels[0]}')
            await pg.screenshot(path=f'{O}/g_{L}_hub.png')
            await pg.fill('#gq', '吗'); await pg.wait_for_timeout(200)
            if not await pg.locator('.grpt').count(): errs.append(L + ': search 吗 finds nothing')
            await pg.fill('#gq', ''); await pg.wait_for_timeout(100)
            # every point renders (free ones) without errors and has pattern + examples
            keys = await pg.evaluate("GR().filter(grFree).map(p=>p.k)")
            for k in keys:
                await pg.evaluate(f"go('gpoint',{{k:'{k}'}})"); await pg.wait_for_timeout(30)
                ok = await pg.evaluate("({r:route.name, pat:!!document.querySelector('.grbox .grpat'), ex:document.querySelectorAll('.grex').length, h:document.scrollingElement.scrollWidth<=innerWidth+1})")
                if ok['r'] != 'gpoint' or not ok['pat'] or ok['ex'] < 2 or not ok['h']: errs.append(f'{L}: point {k} {ok}')
            await pg.evaluate("go('gpoint',{k:'g1-shi'})"); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{O}/g_{L}_point.png', full_page=True)
            # practise: first one wrong then all right
            await pg.click('#gpr'); await pg.wait_for_timeout(300); first = True; steps = 0
            while await pg.locator('#gag').count() == 0 and steps < 40:
                if first: await pg.screenshot(path=f'{O}/g_{L}_q.png')
                kinds.add(await answer(pg, right=not first)); first = False; steps += 1
            st = await pg.evaluate("S.gram&&S.gram['g1-shi']")
            await pg.screenshot(path=f'{O}/g_{L}_done.png')
            if not st: errs.append(L + ': stars not saved'); 
            if st == 3: errs.append(L + ': got 3 stars despite a wrong answer')
            # practise several points fully right -> 3 stars, covering all question kinds
            for k in ['g1-hen', 'g1-bu', 'g1-ma', 'g1-mw', 'g1-le', 'g1-zai-prep']:
                await pg.evaluate(f"go('gpractice',{{k:'{k}'}})"); await pg.wait_for_timeout(200); steps = 0
                while await pg.locator('#gag').count() == 0 and steps < 30: kinds.add(await answer(pg)); steps += 1
                if await pg.evaluate(f"S.gram['{k}']") != 3: errs.append(f'{L}: {k} not 3 stars when all right')
            # level review
            await pg.evaluate("go('gpractice',{l:1})"); await pg.wait_for_timeout(200); steps = 0
            while await pg.locator('#gag').count() == 0 and steps < 40: kinds.add(await answer(pg)); steps += 1
            if steps < 8: errs.append(f'{L}: level review only {steps} questions')
            # PRO lock on a later level (free user) and level screen link
            lk = await pg.evaluate("(()=>{ const p=GR().find(p=>p.l>1&&!grFree(p)); return p&&p.k })()")
            if lk:
                await pg.evaluate("go('grammar',{l:%d})" % (await pg.evaluate(f"grByKey('{lk}').l")))
                await pg.wait_for_timeout(200); await pg.locator(f'.grpt[data-k="{lk}"]').click(); await pg.wait_for_timeout(300)
                if not await pg.locator('.sheet').count(): errs.append(L + ': locked point did not open paywall')
                await pg.evaluate("closeSheet()")
            await pg.evaluate("go('level',1)"); await pg.wait_for_timeout(200); await pg.click('#glk'); await pg.wait_for_timeout(200)
            if await pg.evaluate("route.name") != 'grammar': errs.append(L + ': level screen grammar link broken')
            await pg.close()
        await b.close()
    print('kinds', sorted(kinds))
    for k in ('gap', 'build', 'mean', 'fix'):
        if k not in kinds: errs.append('question kind never shown: ' + k)
    print('errors', errs)
asyncio.run(main())
