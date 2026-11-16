import sys,asyncio
from playwright.async_api import async_playwright
F,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+F); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="ar"]')
    await pg.evaluate("go('sectors')"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/x_hub.png',full_page=True)
    for i in range(9):
      await pg.evaluate(f"go('sector',{i})"); await pg.wait_for_timeout(200)
    await pg.evaluate("go('sector',0)"); await pg.wait_for_timeout(300)
    await pg.click('#tt .ttab[data-t="3"]'); await pg.click('#lvf button[data-l="3"]'); await pg.wait_for_timeout(200)
    await pg.screenshot(path=O+'/x_eng_free.png')
    await pg.evaluate("S.pro=true; go('sector',0)"); await pg.wait_for_timeout(300)
    await pg.fill('#sq','腐蚀'); await pg.wait_for_timeout(200); print('search',await pg.locator('#sl li[data-id]').count())
    await pg.fill('#sq',''); await pg.click('#tt .ttab[data-t="2"]'); await pg.wait_for_timeout(200)
    await pg.screenshot(path=O+'/x_eng_pro.png')
    await pg.click('#learn'); await pg.wait_for_timeout(400); await pg.screenshot(path=O+'/x_learn.png')
    print('counts',await pg.evaluate("SECTORS.map(s=>s.k+':'+s._w.length+'/'+s.topics.length).join(' ')"))
    print('missingAr',await pg.evaluate("SECTORS.flatMap(s=>s._w.filter(w=>!secM(s,w).ar)).length"))
    await pg.click('.lang button[data-l="en"]') if await pg.locator('.lang button[data-l="en"]').count() else None
    print('errors',errs); await b.close()
asyncio.run(main())
