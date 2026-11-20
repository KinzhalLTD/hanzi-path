"""Teams test (both apps): web demo join/leave; native mock: sign-in required, org:call join with code, {type:'org'} shows
the team on Me, error messages, org:push sends a summary with the app's fields, pro only from {type:'pro'}."""
import asyncio, sys
from playwright.async_api import async_playwright
APP, H, O = sys.argv[1], sys.argv[2], sys.argv[3]
FAKE = """window.__calls=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); if(m.type&&m.type.startsWith('org:')) __calls.push(m);
  let r={ok:true}; if(m.type==='org:call') r=m.payload.code==='BAD1234'?{ok:false,error:'code'}:{ok:true,org:{id:'o1',name:'Acme'}};
  if(m.id) setTimeout(()=>{ window.__fromNative({id:m.id,...r}); if(m.type==='org:call'&&r.ok&&m.action==='join') window.__fromNative({type:'org',org:{id:'o1',name:'Acme',active:true}}); },40); }};"""
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
            await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();go('me')"); await pg.wait_for_timeout(300)
            if not await pg.locator('#teamb').count(): errs.append(f'{L}: no team door')
            await pg.click('#teamb'); await pg.fill('#tcode', 'K7M2Q9X'); await pg.click('#tjoin'); await pg.wait_for_timeout(600)
            if not await pg.evaluate("S.org&&S.org.demo"): errs.append(f'{L}: demo join failed')
            await pg.evaluate("closeSheet();go('me')"); await pg.wait_for_timeout(300); await pg.click('#teamb'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{O}/{APP}_{L}_team.png')
            await pg.click('#tlv'); await pg.wait_for_timeout(500)
            if await pg.evaluate("!!S.org"): errs.append(f'{L}: demo leave failed')
            await pg.close()
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script(FAKE); await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();S.user=null;S.pro=false;teamSheet()"); await pg.wait_for_timeout(200)
            await pg.fill('#tcode', 'K7M2Q9X'); await pg.click('#tjoin'); await pg.wait_for_timeout(400)
            if await pg.evaluate("__calls.filter(c=>c.type==='org:call').length"): errs.append(f'{L}: called without sign-in')
            await pg.evaluate("closeSheet();S.user={uid:'u1',name:'Lina'};teamSheet()"); await pg.wait_for_timeout(200)
            await pg.fill('#tcode', 'BAD1234'); await pg.click('#tjoin'); await pg.wait_for_timeout(400)
            if await pg.evaluate("!!S.org"): errs.append(f'{L}: bad code joined')
            await pg.fill('#tcode', 'K7M2Q9X'); await pg.click('#tjoin'); await pg.wait_for_timeout(600)
            c = await pg.evaluate("__calls.filter(c=>c.type==='org:call').pop()")
            if not c or c.get('action') != 'join' or c['payload'].get('code') != 'K7M2Q9X': errs.append(f'{L}: join call {c}')
            if await pg.evaluate("(S.org||{}).name") != 'Acme': errs.append(f'{L}: org message not applied')
            if await pg.evaluate("S.pro"): errs.append(f'{L}: page granted PRO by itself')
            await pg.evaluate("teamPush(true)"); await pg.wait_for_timeout(200)
            sm = await pg.evaluate("(__calls.filter(c=>c.type==='org:push').pop()||{}).summary")
            need = ['xp', 'streak', 'certs'] + (['level', 'words'] if APP == 'hp' else ['mods', 'labs', 'soc', 'dev'])
            if not sm or any(k not in sm for k in need): errs.append(f'{L}: summary {sm}')
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
            if 'Acme' not in await pg.evaluate("document.querySelector('#teamb').textContent"): errs.append(f'{L}: team not on Me')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: overflow')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
