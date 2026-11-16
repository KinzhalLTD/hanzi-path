import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    sh=lambda n,f=False: pg.screenshot(path=f'{O}/{n}.png',full_page=f)
    await pg.goto('file://'+P); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="ar"]'); await pg.wait_for_timeout(300)
    await pg.click('.tab[data-k="culture"]'); await pg.wait_for_timeout(300); await sh('01_culture',True)
    await pg.click('[data-c="0"]'); await pg.wait_for_timeout(300); await sh('02_history',True)
    await pg.click('#go'); await pg.wait_for_timeout(300); await sh('03_reader')
    for i in range(12):
      if await pg.locator('#nx').count(): await pg.click('#nx'); await pg.wait_for_timeout(120)
    await sh('04_quiz')
    for i in range(12):
      if await pg.locator('.opt').count(): await pg.locator('.opt').first.click(); await pg.wait_for_timeout(1400)
      if await pg.locator('#dn').count(): break
    await sh('05_result'); await pg.click('#dn'); await pg.wait_for_timeout(3800)
    if await pg.locator('#adx').count(): await pg.click('#adx')
    await pg.click('.tab[data-k="culture"]'); await pg.click('[data-c="3"]'); await pg.wait_for_timeout(300); await sh('06_kitchen')
    await pg.click('[data-r="2"]'); await pg.wait_for_timeout(300); await sh('07_recipe',True)
    await pg.click('#cook'); await pg.wait_for_timeout(300); await sh('08_cook'); await pg.evaluate('closeSheet()')
    await pg.click('.icon-btn#bk') if await pg.locator('#bk').count() else None
    await pg.click('.tab[data-k="culture"]') if await pg.locator('.tab').count() else None
    await pg.click('[data-c="4"]'); await pg.wait_for_timeout(300); await pg.locator('#pad button').nth(2).dispatch_event('pointerdown'); await sh('09_music',True)
    await pg.click('.tab[data-k="games"]'); await pg.wait_for_timeout(300); await sh('10_games',True)
    await pg.click('.gcard[data-k="klotski"]'); await pg.wait_for_timeout(300); await sh('11_tutorial')
    await pg.click('#ok'); await pg.wait_for_timeout(400); await sh('12_klotski')
    box=await pg.locator('#kb [data-i="9"]').bounding_box()
    if box:
      await pg.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2); await pg.mouse.down(); await pg.mouse.move(box['x']+box['width']/2-60,box['y']+box['height']/2,steps=5); await pg.mouse.up(); await pg.wait_for_timeout(300)
    print('moves',await pg.locator('#mv').inner_text()); await sh('13_klotski_moved')
    print('errors',errs); await b.close()
asyncio.run(main())
