"""AI tutor test (both apps): web demo chat + explain sheet; native mock: sign-in required, limit → paywall, answer rendered; the request carries app/lang/messages."""
import asyncio, sys
from playwright.async_api import async_playwright
APP, H, O = sys.argv[1], sys.argv[2], sys.argv[3]
FAKE = """window.__sent=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); if(m.type==='tutor') __sent.push(m.req);
  const r=m.type==='tutor'?(window.__tmode==='limit'?{ok:false,error:'limit',pro:false}:{ok:true,text:'你好！\\nNǐ hǎo!\\nHello!',left:2}):{ok:true};
  if(m.id) setTimeout(()=>window.__fromNative({id:m.id,...r}),40); }};"""
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
            # web demo
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();go('tutor')"); await pg.wait_for_timeout(300)
            await pg.locator('.tchip').first.click(); await pg.wait_for_timeout(1200)
            n = await pg.locator('.tmsg.them').count()
            if n < 1: errs.append(f'{L}: demo reply missing')
            await pg.screenshot(path=f'{O}/{APP}_{L}_tutor.png')
            await pg.evaluate("void tutorExplain({question:'q',options:['a','b'],right:'a',chosen:'b',why:'w'})"); await pg.wait_for_timeout(900)
            if not (await pg.evaluate("(document.querySelector('#tx')||{}).textContent||''")).strip(): errs.append(f'{L}: explain empty')
            await pg.evaluate("closeSheet();go('me')"); await pg.wait_for_timeout(300)
            if not await pg.locator('#tutb').count(): errs.append(f'{L}: no tutor door on Me')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: overflow')
            await pg.close()
            # native mock
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.add_init_script(FAKE); await pg.goto('file://' + H); await pg.wait_for_timeout(400); await start(pg, L)
            await pg.evaluate("closeSheet();S.user=null;go('tutor')"); await pg.wait_for_timeout(300)
            await pg.fill('#tin', 'hi'); await pg.click('#tsend'); await pg.wait_for_timeout(500)
            if await pg.evaluate("__sent.length"): errs.append(f'{L}: sent without sign-in')
            await pg.evaluate("closeSheet();S.user={uid:'u1',name:'T'};S.tutLog=[];go('tutor')"); await pg.wait_for_timeout(300)
            await pg.fill('#tin', 'hello'); await pg.click('#tsend'); await pg.wait_for_timeout(600)
            req = await pg.evaluate("__sent[0]||null")
            if not req or req.get('app') != APP or req.get('lang') != L or req.get('mode') != 'chat' or req['messages'][-1]['content'] != 'hello': errs.append(f'{L}: bad request {req}')
            if '你好' not in await pg.evaluate("document.querySelector('#tlog').textContent"): errs.append(f'{L}: native reply not shown')
            await pg.evaluate("window.__tmode='limit';S.pro=false"); await pg.fill('#tin', 'again'); await pg.click('#tsend'); await pg.wait_for_timeout(600)
            if not await pg.evaluate("!!document.querySelector('.sheet #buy')"): errs.append(f'{L}: limit did not open the paywall')
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
