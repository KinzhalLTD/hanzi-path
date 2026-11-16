import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300); await pg.click('.lang button[data-l="ar"]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=O+'/1_home.png')
    await pg.evaluate("go('lesson',{l:4,i:0})"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/2_intro4.png')
    shot_fb=False; shot_pairs=False
    for n in range(400):
      if await pg.locator('#go').count(): await pg.click('#go'); continue
      if await pg.locator('.pairs').count():
        if not shot_pairs: await pg.screenshot(path=O+'/3_pairs.png'); shot_pairs=True
        ids=await pg.evaluate("[...document.querySelectorAll('.pl:not([disabled])')].map(b=>b.dataset.id)")
        for i in ids:
          await pg.click(f'.pl[data-id="{i}"]'); await pg.click(f'.pr[data-id="{i}"]')
        await pg.wait_for_timeout(800); continue
      if await pg.locator('#nx').count():
        if not shot_fb: await pg.screenshot(path=O+'/4_feedback.png'); shot_fb=True
        await pg.click('#nx'); continue
      if await pg.locator('#dn').count(): await pg.wait_for_timeout(500); await pg.screenshot(path=O+'/5_result.png'); break
      if await pg.locator('.opt').count(): await pg.locator('.opt').first.click(); await pg.click('#ck')
    print('errors',errs); await b.close()
asyncio.run(main())
