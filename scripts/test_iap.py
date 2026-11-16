import sys,asyncio
from playwright.async_api import async_playwright
F,O=sys.argv[1],sys.argv[2]
# fake native bridge: answers purchase/restore like the RevenueCat module would
FAKE="""window.__log=[]; window.ReactNativeWebView={postMessage:s=>{ const m=JSON.parse(s); __log.push(m.type);
  const r=m.type==='purchase'?(window.__mode==='cancel'?{ok:false,cancelled:true}:{ok:true,active:/^pro_/.test(m.sku),sku:m.sku}):m.type==='restore'?{ok:true,active:true}:{ok:true};
  if(m.id) setTimeout(()=>window.__fromNative({id:m.id,...r}),50); }};"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(FAKE); await pg.goto('file://'+F); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="ar"]'); await pg.wait_for_timeout(300)
    await pg.evaluate("window.__fromNative({type:'prices',prices:{monthly:'29.99 ر.س',yearly:'179.99 ر.س',yearlyPm:'15.00 ر.س',lifetime:'449.99 ر.س',c1:'9.99 ر.س'},trial:false})")
    await pg.evaluate("paywall('test')"); await pg.wait_for_timeout(500)
    print('trial hidden',await pg.evaluate("[document.querySelector('#buy').textContent, document.querySelector('#tr').textContent.trim().slice(0,40)]"))
    await pg.screenshot(path=O+'/iap_paywall_ar.png')
    await pg.evaluate("window.__mode='cancel'"); await pg.click('#buy'); await pg.wait_for_timeout(300); print('cancel',await pg.evaluate("S.pro"))
    await pg.evaluate("window.__mode='ok'"); await pg.click('#buy'); await pg.wait_for_timeout(400); print('bought',await pg.evaluate("S.pro"))
    await pg.evaluate("window.__fromNative({type:'pro',active:false})"); print('lapsed',await pg.evaluate("S.pro"))
    await pg.evaluate("paywall()"); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.wait_for_timeout(300); print('restored',await pg.evaluate("S.pro"))
    print('sync excludes pro',await pg.evaluate("(()=>{S.user={uid:'u1'}; mergeRemote({pro:true}); const d=Object.assign({},S); delete d.pro; return 'pro' in d})()"))
    await pg.evaluate("S.pro=false; shop()"); await pg.wait_for_timeout(300); c0=await pg.evaluate("S.coins"); await pg.click('[data-c="c1"]'); await pg.wait_for_timeout(400); print('coins +',await pg.evaluate("S.coins")-c0, 'pro still',await pg.evaluate("S.pro"))
    print('log',await pg.evaluate("__log.filter(x=>x!=='track'&&x!=='haptic')"))
    print('errors',errs); await b.close()
asyncio.run(main())
