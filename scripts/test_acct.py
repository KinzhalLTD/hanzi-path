import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    async def shot(n,full=False): await pg.wait_for_timeout(450); await pg.screenshot(path=f'{O}/a_{n}.png',full_page=full)
    for L in ['en','ar']:
      if L=='en': await pg.click('.lang button[data-l="en"]')
      else: await pg.evaluate("S.lang='ar';save();go('home')")
      await pg.wait_for_timeout(600); await shot(L+'_home')
      await pg.click('[data-act="bell"]'); await shot(L+'_inbox'); await pg.evaluate('closeSheet()')
      await pg.evaluate("accountSheet()"); await shot(L+'_login')
      await pg.click('[data-sso="apple"]'); await pg.wait_for_timeout(300)
      await pg.evaluate("go('me')"); await shot(L+'_me',True)
      await pg.evaluate("go('culture')"); await shot(L+'_culture',True)
      await pg.evaluate("go('reader',{i:CULTURE.findIndex(c=>c.k==='legends'),start:3,single:true})"); await shot(L+'_legend')
      await pg.evaluate("go('lesson',{l:1,i:0})"); await shot(L+'_lesson')
      await pg.evaluate("signOut()")
    print('icons:',await pg.evaluate("document.querySelectorAll('svg.ic').length"))
    print('errors',errs); await b.close()
asyncio.run(main())
