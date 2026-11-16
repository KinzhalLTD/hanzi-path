import sys,asyncio
from playwright.async_api import async_playwright
F=sys.argv[1]
FAKE="""window.__log=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); __log.push(m.type);
  const r=m.type==='rewarded'?(window.__rw||{ok:true}):m.type==='interstitial'?{ok:true,shown:true}:{ok:true};
  if(m.id) setTimeout(()=>{ window.__acDuring=AC&&AC.state; window.__fromNative({id:m.id,...r}); },80); }};"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(FAKE); await pg.goto('file://'+F); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="en"]'); await pg.wait_for_timeout(1500)
    await pg.evaluate("S.adCount=1; S.pro=false"); await pg.evaluate("interstitial()"); await pg.wait_for_timeout(400)
    print('interstitial: audio during/after',await pg.evaluate("[window.__acDuring, AC.state]"))
    print('rewarded earned',await pg.evaluate("rewarded()"))
    await pg.evaluate("window.__rw={ok:false,unavailable:true}"); print('rewarded unavailable',await pg.evaluate("rewarded()"))
    await pg.evaluate("S.pro=true; S.adCount=1"); await pg.evaluate("window.__log=[]; interstitial()"); print('pro sees ads',await pg.evaluate("__log.includes('interstitial')"))
    await pg.evaluate("window.__fromNative({type:'ads',privacy:true}); go('me')"); await pg.wait_for_timeout(400)
    print('privacy button',await pg.locator('#adp').count()); await pg.click('#adp'); await pg.wait_for_timeout(200); print('log',await pg.evaluate("__log.slice(-1)"))
    print('errors',errs); await b.close()
asyncio.run(main())
