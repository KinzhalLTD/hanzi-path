import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    async def shot(n,full=False): await pg.wait_for_timeout(250); await pg.screenshot(path=f'{O}/t_{n}.png',full_page=full)
    for L in ['en','ar']:
      if L=='en': await pg.click('.lang button[data-l="en"]')
      else: await pg.evaluate("S.lang='ar';save();go('home')")
      await pg.wait_for_timeout(300)
      await pg.evaluate("document.querySelector('.today').scrollIntoView()"); await shot(L+'_today')
      await pg.evaluate("go('word',byH['朋友'].id)"); await shot(L+'_word')
      await pg.click('#wt button[data-t="char"]'); await shot(L+'_char')
      await pg.click('#wt button[data-t="fam"]'); await shot(L+'_fam')
      await pg.click('#wt button[data-t="mean"]'); await pg.click('.tok[data-w]'); await shot(L+'_tok'); await pg.evaluate('closeSheet()')
      await pg.click('#mic'); await pg.wait_for_timeout(400); await shot(L+'_mic'); await pg.evaluate('closeSheet()')
      await pg.evaluate("S.book={};S.book[byH['朋友'].id]=1;S.book[byH['漂亮'].id]=1;save()")
      await pg.evaluate("go('builder',{mode:'rad',rad:RAD_TOP[2][0]})"); await shot(L+'_rad')
      await pg.evaluate("go('builder',{mode:'book'})"); await shot(L+'_book')
      await pg.click('#go'); await shot(L+'_learn')
      await pg.evaluate("checkinSheet()"); await shot(L+'_cal'); await pg.evaluate('closeSheet()')
      await pg.evaluate("go('section',CULTURE.findIndex(c=>c.k==='symbols'))"); await shot(L+'_sym')
      await pg.evaluate("go('reader',{i:CULTURE.findIndex(c=>c.k==='symbols'),start:8,single:true})"); await shot(L+'_why')
      await pg.evaluate("go('culture')"); await shot(L+'_cul',True)
    print('errors',errs); await b.close()
asyncio.run(main())
