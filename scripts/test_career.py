"""Career paths: list and readiness, steps open the right screens, interview practice (reveal → rate → next), readiness
moves, AI mock interview is PRO-gated and sends mode 'interview' with the role, job-ready certificate when complete.
Usage: python3 scripts/test_career.py HTML OUT"""
import asyncio, sys
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]
FAKE = """window.__sent=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); if(m.type==='tutor') __sent.push(m.req);
  const r=m.type==='tutor'?{ok:true,text:'Q1: Tell me about yourself.',left:39}:{ok:true}; if(m.id) setTimeout(()=>window.__fromNative({id:m.id,...r}),40); }};"""
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script(FAKE); await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="cy"]'); await pg.click('#guest')
            await pg.evaluate("S.music=false;S.pro=false;save();closeSheet();go('home')"); await pg.wait_for_timeout(800); await pg.evaluate("closeSheet()")
            if not await pg.locator('#carc').count(): errs.append(f'{L}: no career card on home')
            await pg.evaluate("go('careers')"); await pg.wait_for_timeout(300)
            if await pg.locator('.careercard').count() != 2: errs.append(f'{L}: careers list')
            await pg.locator('.careercard').first.click(); await pg.wait_for_timeout(300)
            p0 = await pg.evaluate("careerScore('soc').pct")
            await pg.locator('.cstep').first.click(); await pg.wait_for_timeout(300)
            if await pg.evaluate("route.name") != 'module': errs.append(f'{L}: step did not open module')
            await pg.evaluate("go('career','soc')"); await pg.wait_for_timeout(200); await pg.click('#ivp'); await pg.wait_for_timeout(200)
            for k in range(3):
                await pg.click('#rev'); await pg.wait_for_timeout(80)
                if not await pg.locator('.ivkey').count(): errs.append(f'{L}: key points not shown')
                await pg.locator('.ivrate button').nth(2).click(); await pg.wait_for_timeout(120)
            await pg.screenshot(path=f'{O}/career_{L}_iv.png')
            p1 = await pg.evaluate("careerScore('soc').pct")
            if p1 <= p0: errs.append(f'{L}: readiness did not move ({p0}→{p1})')
            await pg.evaluate("go('career','soc')"); await pg.wait_for_timeout(200); await pg.click('#ivai'); await pg.wait_for_timeout(300)
            if not await pg.evaluate("!!document.querySelector('.sheet #buy')"): errs.append(f'{L}: AI interview not PRO-gated')
            await pg.evaluate("closeSheet();S.pro=true;S.user={uid:'u',name:'T'};go('career','soc')"); await pg.wait_for_timeout(200); await pg.click('#ivai'); await pg.wait_for_timeout(300)
            await pg.locator('.tchip').first.click(); await pg.wait_for_timeout(500)
            req = await pg.evaluate("__sent[0]||null")
            if not req or req.get('mode') != 'interview' or req.get('role') != 'soc': errs.append(f'{L}: interview request {req}')
            await pg.screenshot(path=f'{O}/career_{L}_ai.png')
            await pg.evaluate("""CAREERS.dev.items.forEach(([t,k,n])=>{ if(t==='mod'){S.mods[k]=Object.assign(S.mods[k]||{},{done:'x',L:1,Q:1});} if(t==='code'){S.labs=S.labs||{};S.labs[k]=1;} if(t==='sec'){S.sec=S.sec||{};S.sec[k]={};for(let j=0;j<n;j++)S.sec[k][j]=1;} });
              S.iv=S.iv||{}; S.iv.dev={}; CAREERS.dev.iv.forEach((_,i)=>S.iv.dev[i]=2); save()""")
            if not await pg.evaluate("certEarned().some(c=>c.id==='job-dev')"): errs.append(f'{L}: no job-ready certificate')
            if await pg.evaluate("careerScore('dev').pct") != 100: errs.append(f'{L}: dev readiness not 100')
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
            if not await pg.locator('#carb').count(): errs.append(f'{L}: no career door on Me')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: overflow')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
