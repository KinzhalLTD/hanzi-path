import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300)
    async def shot(n,full=False): await pg.wait_for_timeout(400); await pg.screenshot(path=f'{O}/w_{n}.png',full_page=full)
    for L in ['en','ar']:
      if L=='en': await pg.click('.lang button[data-l="en"]'); await pg.wait_for_timeout(200); await pg.click('#onew')
      else: await pg.evaluate("S.lang='ar';save();go('home')")
      await pg.wait_for_timeout(300); await pg.evaluate("document.querySelector('.ptiles').scrollIntoView()"); await shot(L+'_home')
      await pg.evaluate("go('writehub','today')"); await shot(L+'_hub')
      await pg.evaluate("go('writehub','basics')"); await pg.click('[data-r="5"]'); await pg.wait_for_timeout(1500); await shot(L+'_rule'); await pg.evaluate('closeSheet()')
      await pg.evaluate("go('writehub','stories')"); await shot(L+'_stories')
      await pg.evaluate("go('writehub','fonts')"); await pg.wait_for_timeout(1500); await shot(L+'_fonts',True)
      await pg.evaluate("go('write',{chars:['好','家']})"); await shot(L+'_trace')
      # simulate drawing first stroke of 好 along its median
      box=await pg.locator('#hw svg').first.bounding_box()
      med=await pg.evaluate("HWD['好'].medians[0]")
      sz=box['width']; pad=14; sc=(sz-2*pad)/1024
      pts=[(box['x']+pad+x*sc, box['y']+pad+(900-y)*sc) for x,y in med]
      await pg.mouse.move(*pts[0]); await pg.mouse.down()
      for pt in pts[1:]: await pg.mouse.move(*pt,steps=6)
      await pg.mouse.up(); await shot(L+'_stroke1')
      await pg.click('#wm button[data-x="watch"]'); await pg.wait_for_timeout(1500); await shot(L+'_watch')
      await pg.evaluate("go('code')"); await shot(L+'_code',True)
      await pg.evaluate("go('codeunit',{i:1,step:1})"); await shot(L+'_lab')
      await pg.click('.copt >> nth=0'); await pg.wait_for_timeout(900); await shot(L+'_labres',True)
      await pg.evaluate("go('codeunit',{i:6,step:1})"); await pg.click('.copt >> nth=0'); await pg.wait_for_timeout(900); await shot(L+'_err')
      await pg.evaluate("document.querySelector('details.play').open=true; document.querySelector('#ed').value='while(true){}'"); await pg.click('#run'); await pg.wait_for_timeout(2200); await shot(L+'_loop')
      await pg.evaluate("go('codeunit',{i:7,step:2})"); await shot(L+'_dlg',True)
      await pg.evaluate("go('codeunit',{i:8,step:3})"); await shot(L+'_fact')
      await pg.evaluate("go('codeunit',{i:0,step:0})"); await pg.click('#go'); await shot(L+'_cwords')
      await pg.evaluate("const r=Math.random; Math.random=()=>0.1; window.__q=makeQuestions(byLevel[1].filter(w=>w.h.length==1).slice(0,4),byLevel[1]); Math.random=r; route={name:'lesson',arg:{custom:1}}; render(); runQuiz(document.querySelector('main'),{questions:window.__q,back:()=>go('home')})")
      await pg.evaluate("document.querySelector('.feedback')&&0"); await shot(L+'_wq')
      await pg.evaluate("go('word',byH['变量'].id)"); await shot(L+'_cw')
    print('errors',errs); await b.close()
asyncio.run(main())
