import sys,asyncio
from playwright.async_api import async_playwright
F,O=sys.argv[1],sys.argv[2]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto('file://'+F); await pg.wait_for_timeout(400); await pg.click('.lang button[data-l="ar"]'); await pg.wait_for_timeout(2500)
    print('home',await pg.evaluate("[MUS.key,!!MUS.node,MUS.ready,AC.state]"))
    print('sections differ',await pg.evaluate("""(()=>{const tr=TRACKS.home; const s=[0,1,2,3,4,5].map(l=>arrange(tr,l).ev.map(e=>e.i+e.p+'@'+e.t.toFixed(2)).join()); return [s[0]!==s[1],s[1]!==s[2],s[2]!==s[3],s[0]!==s[4],s.map(x=>x.split(',').length)]})()"""))
    print('all tracks',await pg.evaluate("Object.keys(TRACKS).map(k=>{const a=arrange(TRACKS[k],2);return k+':'+a.ev.length}).join(' ')"))
    print('silk notes',await pg.evaluate("jianpu(SONGS.silk.mel,62).notes.slice(0,4).map(n=>n.p)"))
    await pg.evaluate("go('lesson',{l:1,i:0})"); await pg.wait_for_timeout(800)
    print('lesson',await pg.evaluate("[MUS.key,MUS.int]"))
    await pg.evaluate("for(let i=0;i<6;i++) SFX.ok()"); await pg.wait_for_timeout(300)
    print('streak',await pg.evaluate("[MUS.streak,MUS.int,MUS.L.drive.gain.value.toFixed(2)]"))
    await pg.evaluate("SFX.bad()"); print('after bad',await pg.evaluate("[MUS.streak,MUS.int]"))
    await pg.evaluate("go('home')"); await pg.wait_for_timeout(500)
    await pg.click('[data-act="mus"]'); await pg.wait_for_timeout(900); await pg.screenshot(path=O+'/msheet_ar.png',full_page=False)
    await pg.click('[data-amb="rain"]'); await pg.wait_for_timeout(1200); print('amb',await pg.evaluate("[S.amb,AMB.nodes.length,MUS.amb.gain.value.toFixed(2)]"))
    await pg.click('[data-mode="calm"]'); await pg.wait_for_timeout(1200); print('calm',await pg.evaluate("[S.mmode,MUS.key]"))
    await pg.evaluate("go('dict')"); await pg.wait_for_timeout(500); print('calm holds',await pg.evaluate("MUS.key"))
    await pg.click('[data-act="mus"]'); await pg.wait_for_timeout(700); await pg.click('#mnext'); await pg.wait_for_timeout(900); print('next',await pg.evaluate("MUS.key"))
    await pg.click('[data-ins="koto"]'); await pg.click('[data-mode="auto"]'); await pg.wait_for_timeout(900); print('auto',await pg.evaluate("[S.mmode,MUS.key]"))
    await pg.click('#mnext'); await pg.wait_for_timeout(900); k=await pg.evaluate("MUS.key"); await pg.evaluate("render()"); await pg.wait_for_timeout(300); print('manual holds',k,await pg.evaluate("MUS.key"))
    await pg.click('#mplay'); await pg.wait_for_timeout(500); print('paused',await pg.evaluate("[!!MUS.node,S.mv,AMB.nodes.length]"))
    await pg.click('#mplay'); await pg.wait_for_timeout(800); print('resumed',await pg.evaluate("[!!MUS.node,S.mv]"))
    await pg.click('[data-amb="temple"]'); await pg.click('[data-amb="night"]'); await pg.click('[data-amb="stream"]'); await pg.click('[data-amb="wind"]'); await pg.wait_for_timeout(500)
    await pg.click('.lang button[data-l="en"]') if await pg.locator('.lang button[data-l="en"]').count() else None
    await pg.evaluate("S.lang='en'; closeSheet(); render(); musicSheet()"); await pg.wait_for_timeout(700); await pg.screenshot(path=O+'/msheet_en.png')
    await pg.evaluate("go('section',CULTURE.findIndex(c=>c.k==='history'))"); await pg.wait_for_timeout(400); print('history',await pg.evaluate("[MUS.want,MUS.key]"))
    await pg.evaluate("musPlay('silk',{force:1})"); await pg.wait_for_timeout(2500); print('silk playing',await pg.evaluate("[MUS.key,MUS.ei,MUS.lap]"))
    print('errors',errs); await b.close()
asyncio.run(main())
