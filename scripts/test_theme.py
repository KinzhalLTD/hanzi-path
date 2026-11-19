"""Theme toggle test (phone-shell HTML): the top-bar button and the Me → Appearance switch change the theme, the
choice is saved and applied again after a reload, the native app is told (status bar), nothing overflows, in both
languages; screenshots to OUT.
Usage: python3 scripts/test_theme.py HTML OUT"""
import sys, asyncio, json
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]
STATE = "({t:S.theme, attr:document.documentElement.dataset.theme||'', bg:getComputedStyle(document.body).backgroundColor, fg:getComputedStyle(document.body).color, meta:(document.querySelector('meta[name=\"theme-color\"]')||{}).content||'', ow:document.scrollingElement.scrollWidth-innerWidth})"
def lum(c):
    v = [int(x) for x in c[c.index('(') + 1:c.index(')')].split(',')[:3]]; return (v[0] * 299 + v[1] * 587 + v[2] * 114) / 1000
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('ar', 'en'):
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            await ctx.add_init_script("window.__native=[]; window.ReactNativeWebView={postMessage:m=>{try{window.__native.push(JSON.parse(m))}catch(e){}}};")
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(L + ': ' + str(e)[:200]))
            pg.on('console', lambda m: m.type == 'error' and 'ERR_' not in m.text and errs.append(L + ' console: ' + m.text[:160]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click(f'.lang button[data-l="{L}"]'); await pg.wait_for_timeout(200)
            if await pg.locator('#onew').count(): await pg.click('#onew'); await pg.wait_for_timeout(200)
            await pg.evaluate("go('home')"); await pg.wait_for_timeout(300)
            s = await pg.evaluate(STATE)
            if s['attr'] or s['t'] == 'light' or lum(s['bg']) > 60: errs.append(f'{L}: app should start dark {s}')
            btn = pg.locator('.topbar [data-act="theme"], [data-act="theme"]').first
            if not await btn.count(): errs.append(L + ': no theme button in the top bar'); continue
            box = await btn.bounding_box()
            if not box or box['width'] < 30 or box['height'] < 30 or box['x'] < 0 or box['x'] + box['width'] > 390: errs.append(f'{L}: theme button box {box}')
            if not await btn.get_attribute('aria-label'): errs.append(L + ': theme button has no label')
            await pg.screenshot(path=f'{O}/th_{L}_dark.png')
            # 1. top-bar button → light
            await btn.click(); await pg.wait_for_timeout(600)
            s = await pg.evaluate(STATE)
            if s['t'] != 'light' or s['attr'] != 'light' or lum(s['bg']) < 180 or lum(s['fg']) > 90 or s['meta'] != '#f3eadb': errs.append(f'{L}: light not applied {s}')
            if s['ow'] > 1: errs.append(f'{L}: light home overflows by {s["ow"]}px')
            if await pg.evaluate("document.documentElement.classList.contains('theming')"): errs.append(L + ': transition class not removed')
            if await pg.locator('[data-act="theme"]').first.get_attribute('aria-pressed') != 'true': errs.append(L + ': aria-pressed not updated')
            nat = await pg.evaluate("window.__native.filter(m=>m.type==='theme').map(m=>m.theme)")
            if nat[-1:] != ['light']: errs.append(f'{L}: native not told about light {nat}')
            await pg.screenshot(path=f'{O}/th_{L}_light.png')
            # 2. survives a reload (no dark flash state left behind) and every main tab renders
            await pg.reload(); await pg.wait_for_timeout(500)
            s = await pg.evaluate(STATE)
            if s['t'] != 'light' or s['attr'] != 'light' or lum(s['bg']) < 180: errs.append(f'{L}: light not restored after reload {s}')
            for r in ("go('dict')", "go('games')", "go('culture')", "go('grammar')", "go('talk')", "go('level',1)", "go('me')"):
                await pg.evaluate(r); await pg.wait_for_timeout(250); s = await pg.evaluate(STATE)
                if s['attr'] != 'light' or s['ow'] > 1: errs.append(f'{L}: {r} {s}')
                if not await pg.locator('[data-act="theme"]').count() and await pg.locator('.topbar').count(): errs.append(f'{L}: {r} top bar lost the theme button')
            # 3. Me → Appearance switch
            seg = pg.locator('#thm button')
            if await seg.count() != 2: errs.append(f'{L}: Appearance switch has {await seg.count()} options'); continue
            on = await pg.evaluate("[...document.querySelectorAll('#thm button')].findIndex(b=>b.classList.contains('on')||b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-selected')==='true')")
            await pg.locator('#thm').scroll_into_view_if_needed(); await pg.screenshot(path=f'{O}/th_{L}_me_light.png')
            await seg.nth(1 - on if on in (0, 1) else 0).click(); await pg.wait_for_timeout(600)
            s = await pg.evaluate(STATE)
            if s['t'] != 'dark' or s['attr'] or lum(s['bg']) > 60 or s['meta'] != '#0d0908': errs.append(f'{L}: Me switch did not return to dark {s} (was on index {on})')
            nat = await pg.evaluate("window.__native.filter(m=>m.type==='theme').map(m=>m.theme)")
            if nat[-1:] != ['dark']: errs.append(f'{L}: native not told about dark {nat}')
            saved = await pg.evaluate("(()=>{for(let i=0;i<localStorage.length;i++){try{const v=JSON.parse(localStorage.getItem(localStorage.key(i))); if(v&&typeof v==='object'&&'theme' in v) return v.theme}catch(e){}} return null})()")
            if saved != 'dark': errs.append(f'{L}: saved theme is {saved}')
            await pg.locator('#thm').scroll_into_view_if_needed(); await pg.screenshot(path=f'{O}/th_{L}_me_dark.png')
            # 4. fast double tap ends where it started, no errors
            await pg.evaluate("go('home')"); await pg.wait_for_timeout(250)
            t = pg.locator('[data-act="theme"]').first; await t.click(); await t.click(); await pg.wait_for_timeout(600)
            s = await pg.evaluate(STATE)
            if s['t'] != 'dark' or s['attr']: errs.append(f'{L}: double tap left {s}')
            print(L, 'ok', s['t'], 'native', nat)
            await ctx.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
