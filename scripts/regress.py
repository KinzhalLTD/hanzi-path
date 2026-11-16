import sys,asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(300); await pg.click('.lang button[data-l="ar"]')
    await pg.evaluate("S.pro=true"); 
    for g in ['mahjong','xiangqi','klotski','riddles','idioms','tangram','checkers']:
      await pg.evaluate(f"go('games')"); await pg.click(f'.gcard[data-k="{g}"]'); await pg.wait_for_timeout(300)
      if await pg.locator('#ok').count(): await pg.click('#ok'); await pg.wait_for_timeout(400)
      await pg.click('#gh'); await pg.wait_for_timeout(200); await pg.evaluate('closeSheet()')
      print(g,'ok' if await pg.locator('#gx').count() else 'NO HEADER')
    for k in ['home','dict','culture','me']: await pg.evaluate(f"go('{k}')"); await pg.wait_for_timeout(150)
    await pg.evaluate("go('lesson',{l:1,i:0})"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=sys.argv[2]); print('errors',errs); await b.close()
asyncio.run(main())
