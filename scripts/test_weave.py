import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    async def shot(n,full=False): await pg.wait_for_timeout(350); await pg.screenshot(path=f'{O}/v_{n}.png',full_page=full)
    for L in ['en','ar']:
      if L=='en': await pg.click('.lang button[data-l="en"]')
      else: await pg.evaluate("S.lang='ar';save();go('home')")
      await pg.evaluate("document.querySelector('.today').scrollIntoView()"); await shot(L+'_today')
      await pg.evaluate("go('lesson',{l:1,i:0})"); await shot(L+'_intro')
      await pg.click('.xch[data-x="write"]'); await pg.wait_for_timeout(600); await shot(L+'_qw'); await pg.evaluate('closeSheet()')
      await pg.evaluate("go('word',byH['八'].id)"); await shot(L+'_word8')
      await pg.click('.xch[data-x="cult"]'); await shot(L+'_cultnote'); await pg.evaluate('closeSheet()')
      await pg.evaluate("go('dict')"); await pg.click('#seg button[data-l="9"]'); await shot(L+'_dictit')
      await pg.evaluate("go('games')"); await shot(L+'_games')
      await pg.evaluate("go('reader',{i:0,start:0,single:true})"); await shot(L+'_reader')
      await pg.evaluate("go('recipe',0)"); await shot(L+'_recipe')
      await pg.evaluate("S.hanFont='kai';save();go('me')"); await shot(L+'_me',True)
      await pg.evaluate("S.hanFont='song';save()")
    print('errors',errs); await b.close()
asyncio.run(main())
