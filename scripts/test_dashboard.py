"""Team dashboard render test with stubbed Firebase modules: org card, KPIs, members table (sorting), CSV button,
remove confirm, seller tools, Arabic RTL, no horizontal page overflow at phone width. Usage: python3 scripts/test_dashboard.py server/dashboard/index.html OUT"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
H, O = os.path.abspath(sys.argv[1]), sys.argv[2]
NOW = "Date.now()"
STUB = {
 'firebase-app.js': "export const initializeApp=()=>({});",
 'firebase-auth.js': """const u={uid:'u1',getIdToken:async()=>'tok'}; export const getAuth=()=>({currentUser:u}); export const onAuthStateChanged=(a,cb)=>setTimeout(()=>cb(u),10);
   export class GoogleAuthProvider{} export class OAuthProvider{} export const signInWithPopup=async()=>{}; export const signOut=async()=>{};""",
 'firebase-firestore.js': """const ts=ms=>({toMillis:()=>ms}); export const getFirestore=()=>({}); export const collection=(db,...p)=>({p:p.join('/')}); export const query=c=>c; export const where=()=>0; export const orderBy=()=>0;
   const D=Date.now(); export const getDocs=async(q)=>({docs: q.p==='orgs'?[{id:'o1',data:()=>({name:'Acme Trading',app:'both',code:'K7M2Q9X',seats:20,used:3,until:ts(D+2e10),admins:['u1']})}]
     :[['Lina',1500,5,{level:2,words:310,mock:{l:2,best:156},certs:2},{mods:6,labs:4,soc:42,dev:18,xp:300}],['Omar',900,0,{level:1,words:120,certs:0},null],['Sara',2600,12,{level:3,words:640,mock:{l:3,best:201},certs:4},{mods:11,labs:9,soc:77,dev:30,xp:800}]]
       .map(([n,xp,st,h,c],i)=>({id:'m'+i,data:()=>({name:n,joinedAt:ts(D-9e8*(i+1)),seen:ts(D-864e5*i*4),shp:Object.assign({xp,streak:st},h),...(c?{scp:Object.assign({streak:st},c)}:{})})}))});""",
}
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            async def rt(route):
                u = route.request.url
                for k, v in STUB.items():
                    if u.endswith(k): return await route.fulfill(status=200, content_type='application/javascript', body=v)
                if 'cloudfunctions.net/org' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'super': True}))
                if 'fonts.' in u: return await route.fulfill(status=200, content_type='text/css', body='')
                return await route.continue_()
            await pg.route('**/*', rt)
            await pg.add_init_script(f"try{{localStorage.setItem('kt-lang','{L}')}}catch(e){{}}")
            await pg.goto('file://' + H); await pg.wait_for_timeout(800)
            if await pg.locator('section.card').count() < 2: errs.append(f'{L}: org card / seller tools missing')
            rows = await pg.locator('tbody tr').count()
            if rows != 3: errs.append(f'{L}: rows {rows}')
            first = await pg.evaluate("document.querySelector('tbody tr td').textContent")
            if first != 'Sara': errs.append(f'{L}: default sort by XP desc, got {first}')
            await pg.locator('th[data-sort="name"]').click(); await pg.wait_for_timeout(100)
            if await pg.evaluate("document.querySelector('tbody tr td').textContent") != 'Lina': errs.append(f'{L}: name sort')
            await pg.locator('[data-ask]').first.click(); await pg.wait_for_timeout(100)
            if not await pg.locator('[data-rm]').count(): errs.append(f'{L}: remove confirm')
            if L == 'ar' and await pg.evaluate("document.documentElement.dir") != 'rtl': errs.append('ar: not rtl')
            if await pg.evaluate("document.documentElement.scrollWidth>innerWidth+1"): errs.append(f'{L}: page overflow')
            await pg.screenshot(path=f'{O}/dash_{L}.png', full_page=True)
            await pg.set_viewport_size({'width': 1200, 'height': 900}); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{O}/dash_{L}_wide.png', full_page=True)
            await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
