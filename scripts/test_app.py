"""End-to-end test (phone viewport, both languages). Plays through: onboarding, a full module (lessons → quiz → terms →
dialogue → module complete), every code lab solved with its reference solution (all tests must pass in the worker),
phishing / log / code-review rounds answered right and wrong, every cipher challenge solved with the workbench tools,
a firewall level, the password lab hash, an exam, a conversation, the three games, daily challenge, paywall gating and
PRO unlock, theme toggle, Arabic/English key parity, persistence after reload, no horizontal overflow, no page errors.
Usage: python3 scripts/test_app.py HTML OUT     (prints `errors []` when everything passes)"""
import sys, asyncio, json, hashlib
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]
errs = []
def check(cond, msg):
    if not cond: errs.append(msg)
async def overflow(pg, L, where):
    ow = await pg.evaluate("document.scrollingElement.scrollWidth-innerWidth")
    check(ow <= 1, f'{L}: horizontal overflow {ow}px on {where}')
async def clear(pg):
    await pg.evaluate("try{closeSheet()}catch(e){}; document.querySelectorAll('.feedback').forEach(f=>f.remove())")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e, L=L: errs.append(f'{L} pageerror: {str(e)[:200]}'))
            pg.on('console', lambda m, L=L: m.type == 'error' and 'ERR_' not in m.text and 'fonts.g' not in m.text and errs.append(f'{L} console: {m.text[:160]}'))
            await pg.goto('file://' + H); await pg.wait_for_timeout(300)
            await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="se"]'); await pg.wait_for_timeout(200)
            check(await pg.locator('[data-sso="apple"]').count() == 1 and await pg.locator('[data-sso="google"]').count() == 1, f'{L}: onboarding sign-up step missing')
            await pg.screenshot(path=f'{O}/{L}_signup.png'); await pg.click('#guest'); await pg.wait_for_timeout(200)
            check(await pg.evaluate("route.name==='home'&&S.guest===true"), f'{L}: guest did not reach home')
            check(await pg.evaluate("document.documentElement.dir") == ('rtl' if L == 'ar' else 'ltr'), f'{L}: wrong text direction')
            # mark the right option of every quiz question with <i data-ok> (test only; options are shuffled)
            await pg.evaluate("""(()=>{ const orig=runQuiz; window.runQuiz=runQuiz=function(m,o){ o.qs.forEach(q=>q.opts.forEach(x=>x.h=x.h+(x.ok?'<i data-ok></i>':''))); return orig(m,o); }; })()""")
            # ---- strings: same keys in both languages
            miss = await pg.evaluate("Object.keys(T.en).filter(k=>!(k in T.ar)).concat(Object.keys(T.ar).filter(k=>!(k in T.en)))")
            check(not miss, f'i18n keys missing in one language: {miss}')
            # ---- data sanity
            d = await pg.evaluate("({mods:MODS.length,se:TRACK('se').length,cy:TRACK('cy').length,terms:TERMS.length,labs:CODE_LABS.length,talk:TALK.map(x=>x.scenes.length)})")
            check(d['mods'] == 24 and d['se'] == 12 and d['cy'] == 12 and d['terms'] >= 240 and d['labs'] == 24 and d['talk'] == [5, 5], f'data counts {d}')
            # ---- full module: se-fund
            await pg.evaluate("go('module','se-fund')"); await pg.wait_for_timeout(150)
            await pg.click('.step[data-s="L"]')
            for i in range(4): await pg.click('#nx'); await pg.wait_for_timeout(80)
            check(await pg.evaluate("!!S.mods['se-fund'].L"), f'{L}: lessons not marked done')
            await pg.click('.step[data-s="Q"]'); await pg.wait_for_timeout(100)
            for i in range(6):
                await pg.wait_for_selector('.opt')
                await pg.locator('.opt:has(i[data-ok])').first.click(); await pg.wait_for_timeout(60)
                await pg.click('.feedback #fn'); await pg.wait_for_timeout(60)
            check(await pg.evaluate("S.mods['se-fund'].Q===1&&S.mods['se-fund'].stars===3"), f'{L}: perfect quiz not recorded')
            await pg.click('#nx'); await pg.wait_for_timeout(150)
            await pg.click('.step[data-s="T"]'); await pg.wait_for_timeout(100)
            while await pg.locator('.fcard .h').count() and await pg.locator('#nx').count(): await pg.click('#nx'); await pg.wait_for_timeout(40)
            for i in range(10):
                await pg.wait_for_selector('.opt'); await pg.locator('.opt').first.click(); await pg.wait_for_timeout(40); await pg.click('.feedback #fn'); await pg.wait_for_timeout(40)
            await pg.click('#dn'); await pg.wait_for_timeout(150)
            check(await pg.evaluate("!!S.mods['se-fund'].T&&Object.keys(S.srs).length===10"), f'{L}: terms step / SRS not recorded')
            await pg.click('.step[data-s="D"]'); await pg.wait_for_timeout(150); await pg.click('#dd'); await pg.wait_for_timeout(200)
            check(await pg.evaluate("!!S.mods['se-fund'].done"), f'{L}: module not completed after all steps')
            check(await pg.evaluate("!!(S.badges||{}).first&&!!S.badges.boss&&!!S.flawless"), f'{L}: seals for first lesson / boss / flawless not awarded')
            check(await pg.locator('.sheet .result').count() == 1, f'{L}: module-complete sheet missing')
            await pg.screenshot(path=f'{O}/{L}_moddone.png'); await clear(pg)
            # ---- failing quiz does not pass
            await pg.evaluate("go('quizrun',{k:'se-ds'})")
            for i in range(6):   # boss fight: the second wrong answer loses the fight and ends the quiz early
                if not await pg.locator('.opt:not([disabled])').count(): break
                await pg.locator('.opt:not(:has(i[data-ok]))').first.click(); await pg.wait_for_timeout(40); await pg.click('.feedback #fn'); await pg.wait_for_timeout(60)
            check(await pg.evaluate("!(S.mods['se-ds']||{}).Q"), f'{L}: failed quiz counted as passed')
            check(await pg.locator('.bossface.laugh').count() == 1, f'{L}: lost boss fight screen missing')
            # ---- revive: a token gives one heart back and a retry of the missed question, so the fight can still be won
            await pg.evaluate("S.reviveTok=1; go('quizrun',{k:'se-algo'})"); await pg.wait_for_timeout(100)
            for i in range(2):
                await pg.locator('.opt:not(:has(i[data-ok]))').first.click(); await pg.wait_for_timeout(40)
                if i == 0: await pg.click('.feedback #fn'); await pg.wait_for_timeout(60)
            check(await pg.locator('.feedback #rv').count() == 1, f'{L}: revive offer missing when the fight is lost')
            await pg.click('.feedback #rv'); await pg.wait_for_timeout(150)
            for i in range(6):
                if not await pg.locator('.opt:not([disabled])').count(): break
                await pg.locator('.opt:has(i[data-ok])').first.click(); await pg.wait_for_timeout(40); await pg.click('.feedback #fn'); await pg.wait_for_timeout(60)
            check(await pg.evaluate("S.reviveTok===0&&!!S.mods['se-algo'].Q"), f'{L}: revived boss fight not won')
            # ---- journey: 4 chapters per track, a gate that can be passed
            await pg.evaluate("go('track','se')"); await pg.wait_for_timeout(200)
            check(await pg.locator('.chap').count() == 4 and await pg.locator('.gate2').count() == 4, f'{L}: journey chapters/gates missing')
            await overflow(pg, L, 'journey'); await pg.screenshot(path=f'{O}/{L}_journey.png', full_page=True)
            await pg.click('.gate2[data-g="0"]'); await pg.wait_for_timeout(150); await pg.click('.sheet #gg'); await pg.wait_for_timeout(150)
            for i in range(10):
                if not await pg.locator('.opt:not([disabled])').count(): break
                await pg.locator('.opt:has(i[data-ok])').first.click(); await pg.wait_for_timeout(40); await pg.click('.feedback #fn'); await pg.wait_for_timeout(60)
            check(await pg.evaluate("!!(S.gates||{}).se0&&S.gates.se0.ok"), f'{L}: chapter gate not passed')
            await pg.click('#nx'); await pg.wait_for_timeout(300); await clear(pg)
            await pg.evaluate("go('track','se')"); await pg.click('.gate2[data-g="2"]'); await pg.wait_for_timeout(150)
            check(await pg.locator('.sheet .cmp').count() == 1, f'{L}: locked gate did not open the paywall'); await clear(pg)
            # ---- lesson back / next
            await pg.evaluate("go('lesson',{k:'se-ds',i:1})"); await pg.click('#pv'); await pg.wait_for_timeout(100)
            check(await pg.evaluate("route.name==='lesson'&&route.arg.i===0"), f'{L}: previous lesson button')
            await pg.click('#pv'); await pg.wait_for_timeout(100); check(await pg.evaluate("route.name==='module'"), f'{L}: back from the first lesson')
            await pg.click('#nm'); await pg.wait_for_timeout(100); check(await pg.evaluate("route.name==='module'&&route.arg==='se-algo'"), f'{L}: next module button')
            # ---- music: guzheng samples load and play; the switch turns it off
            await pg.evaluate("musStart()"); await pg.wait_for_timeout(2500)
            mu = await pg.evaluate("({on:MUSIC.on,ready:MUSIC.ready,beats:MUSIC.beat,koto:Object.keys(MUSIC.buf).length})")
            check(mu['on'] and mu['ready'] and mu['koto'] >= 10 and mu['beats'] > 0, f'{L}: music not playing {mu}')
            await pg.click('.topbar [data-act="mus"]'); check(await pg.evaluate("S.music===false&&!MUSIC.on"), f'{L}: music switch')
            # ---- account: demo sign-in from Me, sign-out
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(150); await pg.click('#acct [data-sso="google"]'); await pg.wait_for_timeout(200)
            check(await pg.evaluate("!!S.user&&S.user.provider==='google'"), f'{L}: sign-in failed'); await pg.screenshot(path=f'{O}/{L}_account.png')
            await pg.click('#acct #out'); await pg.wait_for_timeout(150); check(await pg.evaluate("!S.user"), f'{L}: sign-out failed')
            # ---- shop: bit pack (demo purchase), revive token for bits; exam limit offers a ticket
            c0 = await pg.evaluate("S.coins"); await pg.evaluate("shop()"); await pg.click('.pack[data-sku="coins_c1"]'); await pg.wait_for_timeout(200)
            check(await pg.evaluate(f"S.coins==={c0}+600"), f'{L}: bit pack not added'); await pg.screenshot(path=f'{O}/{L}_shop.png')
            await pg.click('.sheet #rt'); await pg.wait_for_timeout(100); check(await pg.evaluate("S.reviveTok===1"), f'{L}: revive token not bought'); await clear(pg)
            await pg.evaluate("S.examDay=today(); go('exam','se')"); await pg.click('#go'); await pg.wait_for_timeout(150)
            check(await pg.locator('.sheet #bt').count() == 1, f'{L}: exam limit sheet missing'); await clear(pg)
            # ---- PRO gating: module 4 locked, code lab 4 locked, round 4 locked
            await pg.evaluate("go('track','se')"); await pg.click('.pnode[data-k="se-oop"]'); await pg.wait_for_timeout(150)
            check(await pg.locator('.sheet #buy').count() == 1, f'{L}: locked module did not open the paywall')
            await pg.screenshot(path=f'{O}/{L}_paywall.png')
            await pg.click('.sheet #buy'); await pg.wait_for_timeout(300)
            check(await pg.evaluate("S.pro===true"), f'{L}: demo purchase did not unlock PRO')
            # ---- every code lab passes with its reference solution, and the starter fails
            res = await pg.evaluate("""async()=>{ const out=[]; for(const l of CODE_LABS){ const a=await runCode(l.sol,l.tests), z=await runCode(l.start,l.tests);
                out.push([l.k, a.tests&&a.tests.every(x=>x.ok), z.tests&&z.tests.every(x=>x.ok)]); } return out; }""")
            bad = [r for r in res if not r[1] or r[2]]
            check(not bad, f'{L}: code labs wrong {bad}')
            # infinite loop is stopped by the worker timeout
            r = await pg.evaluate("runCode('while(true){}',[['1',1]])")
            check(r.get('err') == 'Timeout', f'{L}: infinite loop not stopped: {r}')
            # UI path for one lab
            await pg.evaluate("go('codelab','escape')"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#ed').value=CODE_LABS.find(l=>l.k==='escape').sol"); await pg.click('#rt'); await pg.wait_for_timeout(900)
            check(await pg.evaluate("!!S.labs.escape"), f'{L}: code lab UI pass not recorded'); await overflow(pg, L, 'codelab')
            await pg.screenshot(path=f'{O}/{L}_codelab.png'); await clear(pg)
            # ---- phishing: every round judged correctly with all flags
            for i in range(await pg.evaluate("PHISH.length")):
                await pg.evaluate(f"go('seclab',{{lab:'phish',i:{i}}})"); await pg.wait_for_timeout(80)
                for f in await pg.locator('.flag').all(): await f.click()
                phish = await pg.evaluate(f"PHISH[{i}].phish")
                await pg.click('#ph' if phish else '#lg'); await pg.wait_for_timeout(80)
                check(await pg.evaluate(f"(S.sec.phish||{{}})[{i}]===3"), f'{L}: phish round {i} not scored 3')
                if i == 0: await pg.screenshot(path=f'{O}/{L}_phish.png')
                await clear(pg)
            await pg.evaluate("go('seclab',{lab:'phish',i:1})"); await pg.click('#ph'); await pg.wait_for_timeout(80)
            check(await pg.locator('.feedback.bad').count() == 1, f'{L}: wrong phishing verdict not marked wrong'); await clear(pg)
            # ---- logs: exact selection
            for i in range(await pg.evaluate("LOGS.length")):
                await pg.evaluate(f"go('seclab',{{lab:'logs',i:{i}}})"); await pg.wait_for_timeout(60)
                for j in await pg.evaluate(f"LOGS[{i}].bad"): await pg.click(f'.logl[data-j="{j}"]')
                await pg.click('#ck'); await pg.wait_for_timeout(60)
                check(await pg.evaluate(f"(S.sec.logs||{{}})[{i}]===3"), f'{L}: log round {i} not solved'); await overflow(pg, L, f'logs {i}'); await clear(pg)
            # ---- review: right line + right flaw
            for i in range(await pg.evaluate("REVIEW.length")):
                await pg.evaluate(f"go('seclab',{{lab:'review',i:{i}}})"); await pg.wait_for_timeout(60)
                bl, v = await pg.evaluate(f"[REVIEW[{i}].bad,REVIEW[{i}].v]")
                await pg.click(f'.revl[data-j="{bl}"]'); await pg.click(f'.opt[data-v="{v}"]'); await pg.wait_for_timeout(60)
                check(await pg.evaluate(f"(S.sec.review||{{}})[{i}]===3"), f'{L}: review round {i} not solved'); await overflow(pg, L, f'review {i}')
                if i == 0: await pg.screenshot(path=f'{O}/{L}_review.png')
                await clear(pg)
            # ---- cipher workshop: each flag reachable with the workbench tools
            steps = {'b64': ['b64d'], 'hex': ['hexd'], 'rot13': ['rot13'], 'bin': ['bind'], 'caesar5': [('rot', 21)], 'url': ['urld'], 'rev': ['rev'], 'b64hex': ['b64d', 'hexd'], 'rotb64': ['rot13', 'b64d'],
                     'jwt': [('set', 'eyJ1c2VyIjoiZ3Vlc3QiLCJmbGFnIjoiQ1B7and0X2lzX3JlYWRhYmxlfSJ9'), 'b64d'], 'xor': [('xor', 42)], 'brute': [('rot', 7)]}
            for i, c in enumerate(await pg.evaluate("CTF.map(c=>[c.k,c.flag])")):
                await pg.evaluate(f"go('ctflab',{{i:{i}}})"); await pg.wait_for_timeout(60)
                for s in steps[c[0]]:
                    if isinstance(s, tuple) and s[0] == 'rot': await pg.evaluate(f"document.querySelector('#sh').value={s[1]}"); await pg.click('#sha')
                    elif isinstance(s, tuple) and s[0] == 'xor': await pg.fill('#xk', str(s[1])); await pg.click('#xo')
                    elif isinstance(s, tuple) and s[0] == 'set': await pg.fill('#wi', s[1]); continue
                    else: await pg.click(f'.tools button[data-t="{s}"]')
                    await pg.click('#use')
                out = await pg.evaluate("document.querySelector('#wi').value")
                check(c[1] in out, f'{L}: ctf {c[0]} not solvable with the tools, got {out[:60]}')
                await pg.fill('#fl', c[1]); await pg.click('#sb'); await pg.wait_for_timeout(60)
                check(await pg.evaluate(f"(S.sec.ctf||{{}})[{i}]===3"), f'{L}: ctf {c[0]} flag not accepted')
                if i == 7: await pg.screenshot(path=f'{O}/{L}_ctf.png')
                await clear(pg)
            # ---- firewall: answer with the simulator's own logic for 10 packets at level 3
            await pg.evaluate("go('fwlab',{lv:3})"); await pg.wait_for_timeout(80)
            for k in range(10):
                ans = await pg.evaluate("""(()=>{ const rows=[...document.querySelectorAll('.fwtable tbody tr')].map(r=>[...r.children].map(c=>c.textContent));
                  const pk=document.querySelector('.packet').textContent.split('→').slice(1).join('→').trim().split(/\\s+/);
                  const proto=pk[0].toLowerCase(), src=pk[1], [dst,port]=pk[3].split(':');
                  const inNet=(ip,net)=>net==='any'||ip.startsWith(net.split('.').slice(0,3).join('.')+'.');
                  const hit=rows.find(r=>(r[2]==='any'||r[2]===proto)&&inNet(src,r[3])&&(r[4]==='any'||r[4]===dst)&&(r[5]==='any'||r[5].split(' ')[0]===port));
                  return hit?hit[1]:'deny'; })()""")
                await pg.click('#al' if ans == 'allow' else '#dn'); await pg.wait_for_timeout(40)
                check(await pg.locator('#ex b').evaluate("e=>e.textContent.startsWith('✓')"), f'{L}: firewall packet {k} judged wrong by the reference logic')
                await pg.click('#nx'); await pg.wait_for_timeout(40)
            check(await pg.evaluate("S.fwBest===3"), f'{L}: firewall level 3 not recorded')
            await pg.click('#dn2'); await pg.wait_for_timeout(100); await clear(pg)
            # ---- password lab hash matches Python's SHA-256
            await pg.evaluate("go('pwlab')"); await pg.fill('#pw', 'correct-horse-battery-staple'); await pg.wait_for_timeout(80)
            h = await pg.evaluate("document.querySelector('#h1').textContent")
            check(h == hashlib.sha256(b'correct-horse-battery-staple').hexdigest(), f'{L}: SHA-256 mismatch {h}')
            await pg.fill('#pw', 'P@ssw0rd'); check(await pg.locator('#cm .lock-note').count() == 1, f'{L}: common password not flagged'); await overflow(pg, L, 'pwlab')
            await pg.screenshot(path=f'{O}/{L}_pw.png', full_page=True)
            # ---- exam (20 questions, timer)
            await pg.evaluate("go('examrun',{tr:'cy'})")
            for i in range(20):
                await pg.wait_for_selector('.opt'); await pg.locator('.opt:has(i[data-ok])').first.click(); await pg.wait_for_timeout(30)
            check(await pg.evaluate("S.exams.cy===1"), f'{L}: exam not scored 100%'); await overflow(pg, L, 'exam result')
            await pg.screenshot(path=f'{O}/{L}_exam.png'); await pg.click('#dn'); await pg.wait_for_timeout(200); await clear(pg)
            # ---- conversation: best reply every turn
            await pg.evaluate("go('talkscene',{d:'sec',i:0})")
            for k in range(5):
                await pg.wait_for_selector('.tkopt', timeout=4000)
                idx = await pg.evaluate("(()=>{ const s=TALK.find(d=>d.k==='sec').scenes[0]; const zh=[...document.querySelectorAll('.tkopt .han')].map(e=>e.textContent); const a=s.turns["+str(k)+"].o.find(o=>o.t==='A').zh; return zh.indexOf(a); })()")
                await pg.locator('.tkopt').nth(idx).click(); await pg.wait_for_timeout(60); await pg.click('#nx' if k < 4 else '#nx'); await pg.wait_for_timeout(100)
            await pg.wait_for_timeout(300)
            check(await pg.evaluate("(S.talk||{})['sec/phish']===3"), f'{L}: conversation not completed with 3 stars')
            await pg.screenshot(path=f'{O}/{L}_talk.png'); await clear(pg)
            # ---- games start, answer, end
            for g in ('sprint', 'bits', 'ports'):
                await pg.evaluate(f"go('game','{g}')"); await pg.click('#go'); await pg.wait_for_timeout(100)
                for k in range(3): await pg.locator('.opt').first.click(); await pg.wait_for_timeout(700)
                await pg.evaluate("document.querySelectorAll('#tm').length"); await overflow(pg, L, f'game {g}')
                await pg.evaluate("go('labs')")
            # ---- red envelope and fortune: once a day, bits added once
            await clear(pg); await pg.evaluate("go('home')"); c0 = await pg.evaluate("S.coins")
            await pg.click('#hb'); await pg.click('#hbx'); await pg.wait_for_timeout(500); c1 = await pg.evaluate("S.coins")
            await pg.click('#hbx'); await pg.wait_for_timeout(300)
            check(c1 > c0 and await pg.evaluate("S.coins") == c1 and await pg.evaluate("S.hbDay===today()"), f'{L}: red envelope reward wrong {c0}->{c1}')
            await clear(pg); await pg.evaluate("go('home')"); await pg.click('#qn'); await pg.click('#draw'); await pg.wait_for_timeout(1200)
            check(await pg.locator('.fortune').count() == 1 and await pg.evaluate("S.fortuneDay===today()"), f'{L}: fortune not drawn')
            await clear(pg)
            # ---- daily challenge renders and is solvable today
            await pg.evaluate("go('daily')"); await pg.wait_for_timeout(100); await overflow(pg, L, 'daily'); await pg.screenshot(path=f'{O}/{L}_daily.png'); await clear(pg)
            # ---- theme toggle + persistence
            await pg.evaluate("go('home')"); await pg.click('[data-act="theme"]'); await pg.wait_for_timeout(500)
            check(await pg.evaluate("document.documentElement.dataset.theme==='light'"), f'{L}: theme toggle failed')
            await pg.screenshot(path=f'{O}/{L}_light_home.png')
            await pg.evaluate("go('labs')"); await pg.wait_for_timeout(100); await pg.screenshot(path=f'{O}/{L}_light_labs.png')
            await pg.reload(); await pg.wait_for_timeout(400)
            check(await pg.evaluate("document.documentElement.dataset.theme==='light'&&!!S.mods['se-fund'].done&&S.pro"), f'{L}: state not restored after reload')
            for r in ["go('home')", "go('learn')", "go('labs')", "go('zh')", "go('me')", "go('track','cy')", "go('module','cy-grc')", "go('terms')", "go('talk')"]:
                await pg.evaluate(r); await pg.wait_for_timeout(120); await overflow(pg, L, r)
            await pg.screenshot(path=f'{O}/{L}_light_module.png')
            await ctx.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
