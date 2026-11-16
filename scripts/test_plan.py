import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300); await pg.click('.lang button[data-l="en"]'); await pg.wait_for_timeout(300)
    r=await pg.evaluate("""async()=>{ const out={};
      for(let i=0;i<6;i++){ pronCheck('你好'); await new Promise(r=>setTimeout(r,60)); closeSheet(); }
      out.pronDay=S.pronDay.n; out.paywallAfterPron=S.kpi.paywall_view||0;
      out.freeWrite=[writeFree('你'),writeFree('爱'),writeFree('经')];
      S.adCount=0; window.simAd=()=>Promise.resolve({ok:true}); for(let i=0;i<20;i++) await interstitial(); out.adsToday=S.adsDay.n;
      go('writehub','today'); out.locked=document.querySelectorAll('.wc.lk').length;
      S.pro=true; out.freeWritePro=writeFree('经'); S.pro=false;
      out.kpi=S.kpi; return out; }""")
    print(r)
    await pg.evaluate("paywall('test')"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/pay_en.png')
    await pg.evaluate("closeSheet();S.lang='ar';save();paywall('test')"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/pay_ar.png')
    print('errors',errs); await b.close()
asyncio.run(main())
