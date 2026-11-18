import sys,asyncio
from playwright.async_api import async_playwright
P=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto('file://'+P); await pg.wait_for_timeout(400)
    await pg.click('.lang button[data-l="en"]'); await pg.wait_for_timeout(1500)
    if await pg.locator('#onew').count(): await pg.click('#onew'); await pg.wait_for_timeout(300)
    print('home', await pg.evaluate("[MUS.key, !!MUS.node, MUS.bar, AC&&AC.state]"))
    for k in ['dict','culture','games','me']:
      await pg.click(f'.tab[data-k="{k}"]'); await pg.wait_for_timeout(900)
      print(k, await pg.evaluate("[MUS.key, MUS.bar]"))
    for g in ['mahjong','xiangqi','klotski','riddles','idioms','tangram','checkers']:
      await pg.evaluate(f"S.tut=Object.assign(S.tut||{{}},{{{g}:1}}); go('game','{g}')"); await pg.wait_for_timeout(700)
      print(g, await pg.evaluate("[MUS.key, MUS.bar]"))
    await pg.evaluate("go('section',CULTURE.findIndex(c=>c.k==='music'))"); await pg.wait_for_timeout(500); print('sec', await pg.evaluate("MUS.key"))
    await pg.evaluate("SFX.win(); SFX.ok(); SFX.bad(); SFX.coin(); SFX.gong(); speak('你好')"); await pg.wait_for_timeout(1500)
    await pg.evaluate("go('me')"); await pg.click('#mvol button[data-v="0"]'); await pg.wait_for_timeout(300); print('off', await pg.evaluate("[MUS.key,!!MUS.node,S.mv]"))
    await pg.click('#mvol button[data-v="0.9"]'); await pg.wait_for_timeout(600); print('loud', await pg.evaluate("[MUS.key,!!MUS.node,S.mv]"))
    await pg.click('[data-act="mus"]'); await pg.wait_for_timeout(300); print('chip', await pg.evaluate("[!!MUS.node,S.mv]"))
    print('errors',errs); await b.close()
asyncio.run(main())
