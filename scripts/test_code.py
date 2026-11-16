import sys,asyncio
from playwright.async_api import async_playwright
P,O=sys.argv[1],sys.argv[2]
JS="""async()=>{ const rep=[];
 for(const u of CODE_UNITS){ for(const L of u.labs){ if(L.run===false) continue; const r=await runCode(L.code); const got=r.err?(ERRZH[r.err]?ERRZH[r.err][0]+' '+r.err:r.err):r.out.join('\\n'); if(got!==L.q[0]) rep.push(['LAB',u.k,JSON.stringify(got),JSON.stringify(L.q[0])]); }
  if(u.challenge){ const C=u.challenge; const a=await runCode(C.sol,C.tests); const b=await runCode(C.start,C.tests);
   const pa=(a.tests||[]).every(x=>x.ok)&&(a.tests||[]).length; const pb=(b.tests||[]).some(x=>!x.ok);
   if(!pa||!pb) rep.push(['CH',u.k,'sol',pa,'start fails',pb,JSON.stringify(a.tests||a.err)]); } }
 // naive fibonacci must time out
 const nf=await runCode('function 斐波那契(n){return n<2?n:斐波那契(n-1)+斐波那契(n-2)}',CODE_UNITS.find(u=>u.k==='algo').challenge.tests); rep.push(['naive fib',JSON.stringify((nf.tests||[]).map(x=>x.ok)),nf.err]);
 return rep; }"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+P); await pg.wait_for_timeout(300); await pg.click('.lang button[data-l="en"]')
    for r in await pg.evaluate(JS): print(r)
    await pg.evaluate("S.pro=true;save();go('code')"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/c_hub.png',full_page=True)
    i=await pg.evaluate("CODE_UNITS.findIndex(u=>u.k==='ds')")
    await pg.evaluate(f"go('codeunit',{{i:{i},step:2}})"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/c_ch.png')
    await pg.click('#tst'); await pg.wait_for_timeout(1200); await pg.screenshot(path=O+'/c_fail.png',full_page=True)
    await pg.evaluate(f"document.querySelector('#ced').value=CODE_UNITS[{i}].challenge.sol"); await pg.click('#tst'); await pg.wait_for_timeout(1200); await pg.screenshot(path=O+'/c_pass.png',full_page=True)
    j=await pg.evaluate("CODE_UNITS.findIndex(u=>u.k==='git')")
    await pg.evaluate(f"go('codeunit',{{i:{j},step:1}})"); await pg.wait_for_timeout(300); await pg.click('.copt >> nth=0'); await pg.wait_for_timeout(500); await pg.screenshot(path=O+'/c_git.png',full_page=True)
    await pg.evaluate("S.lang='ar';save();go('codeunit',{i:"+str(i)+",step:2})"); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'/c_ch_ar.png')
    print('errors',errs); await b.close()
asyncio.run(main())
