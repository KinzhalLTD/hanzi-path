import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    async def shot(n,full=False): await pg.wait_for_timeout(400); await pg.screenshot(path=f'{O}/s_{n}.png',full_page=full)
    for L in ['en','ar']:
      if L=='en':
        await pg.click('.lang button[data-l="en"]')
        if await pg.locator('#onew').count(): await pg.click('#onew'); await pg.wait_for_timeout(300)
      else: await pg.evaluate("S.lang='ar';save();go('home')")
      await pg.evaluate("document.querySelector('.ptiles').scrollIntoView()"); await shot(L+'_tiles')
      await pg.evaluate("go('sectors')"); await shot(L+'_hub',True)
      await pg.evaluate("go('sector',1)"); await shot(L+'_med',True)
      await pg.click('#learn'); await shot(L+'_learn')
      await pg.evaluate("go('accents')"); await shot(L+'_acc',True)
      await pg.evaluate("go('dict')"); await pg.fill('#q','焊接'); await pg.wait_for_timeout(200); await shot(L+'_dict')
    print('errors',errs); await b.close()
asyncio.run(main())
