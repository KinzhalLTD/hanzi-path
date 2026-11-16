import sys,asyncio
from playwright.async_api import async_playwright
F,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+F); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="ar"]')
    await pg.evaluate("S.pro=true; go('word', byH['一举两得'].id)"); await pg.wait_for_timeout(400); await pg.screenshot(path=O+'/h6_word.png')
    await pg.evaluate("go('level',6)"); await pg.wait_for_timeout(400); await pg.screenshot(path=O+'/h6_level.png')
    await pg.evaluate("go('lesson',{l:6,i:40})"); await pg.wait_for_timeout(500); await pg.screenshot(path=O+'/h6_lesson.png')
    print('errors',errs); await b.close()
asyncio.run(main())
