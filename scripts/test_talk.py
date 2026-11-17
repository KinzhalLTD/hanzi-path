"""Workplace conversations: data integrity, every scene played through the UI in AR and EN (wrong/weak replies first
on some turns, best reply on others), stars and rewards, PRO gating, entry points, toggles.
Usage: python3 scripts/test_talk.py /abs/hanzi-path.html outdir"""
import sys, asyncio, json
from playwright.async_api import async_playwright
P, O = sys.argv[1], sys.argv[2]
async def main():
    errs = []; info = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ['ar', 'en']:
            pg = await b.new_page(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True)
            pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto('file://' + P); await pg.wait_for_timeout(300)
            await pg.click(f'.lang button[data-l="{lang}"]'); await pg.wait_for_timeout(200); await pg.click('#onew'); await pg.wait_for_timeout(200)
            # data checks
            d = await pg.evaluate("""(()=>{ const e=[]; let n=0, al=0; TALK.forEach(d=>d.scenes.forEach(s=>{ if(s.turns.length!==5) e.push(s.k+' turns');
                s.turns.forEach(tn=>{ const lines=[tn.p,...tn.o.map(o=>[o.zh,o.py])]; lines.forEach(l=>{ n++; if(alignPy(l[0],l[1])) al++; });
                  if(tn.o.map(o=>o.t).join('')!=='ABX') e.push(s.k+' opts'); tn.o.forEach(o=>{ if(!o.ar||!o.en) e.push(s.k+' tr'); if(o.t!=='A'&&(!o.na||!o.ne)) e.push(s.k+' note'); }); }); }));
                return {e,n,al,domains:TALK.map(d=>d.k+':'+d.scenes.length)}; })()""")
            errs += [f'data {x}' for x in d['e']]
            if d['al'] != d['n']: errs.append(f"alignment {d['al']}/{d['n']}")
            info['data'] = d
            # entry points: home tile, sector link, inbox news
            await pg.evaluate("go('home')"); await pg.wait_for_timeout(200)
            if not await pg.locator('#tk2').count(): errs.append(lang + ' home tile missing')
            await pg.click('#tk2'); await pg.wait_for_timeout(250)
            if not await pg.locator('.tkscene').count(): errs.append(lang + ' hub empty')
            await pg.screenshot(path=f'{O}/talk_{lang}_hub.png')
            # free user: scene 2 is locked -> paywall
            await pg.click('.tkscene[data-i="1"]'); await pg.wait_for_timeout(250)
            if not await pg.locator('.sheet').count(): errs.append(lang + ' locked scene did not open paywall')
            await pg.evaluate("closeSheet()")
            await pg.evaluate("go('sector',SECTORS.findIndex(s=>s.k==='med'))"); await pg.wait_for_timeout(250)
            if not await pg.locator('#stk').count(): errs.append(lang + ' sector link missing')
            await pg.click('#stk'); await pg.wait_for_timeout(250)
            cur = await pg.evaluate("$('#tseg button[aria-pressed=\"true\"]').innerText")
            if 'Medical' not in cur and 'الطب' not in cur: errs.append(lang + ' sector link opened ' + cur)
            await pg.evaluate("S.pro=true;save()")
            # play every scene
            total = 0
            doms = await pg.evaluate("TALK.map(d=>d.k)")
            if doms != ['eng', 'mep', 'cons', 'infra', 'biz', 'med', 'soft']: errs.append(f'{lang} domain order {doms}')
            terms = await pg.evaluate("TALK.flatMap(d=>d.scenes.map(s=>[d.k+'/'+s.k, tkTerms(d,s).length]))")
            few = [x for x in terms if x[1] < 2]
            if few: errs.append(f'{lang} scenes with <2 key terms {few}')
            info[lang + '_terms'] = sum(x[1] for x in terms)
            for di, dk in enumerate(doms):
                ns = await pg.evaluate(f"TALK.find(d=>d.k==='{dk}').scenes.length")
                for si in range(ns):
                    await pg.evaluate(f"go('talkscene',{{d:'{dk}',i:{si}}})"); await pg.wait_for_timeout(150)
                    if si == 0 and di == 0: await pg.screenshot(path=f'{O}/talk_{lang}_intro.png')
                    await pg.click('#go')
                    for turn in range(5):
                        await pg.wait_for_selector('.tkopt', timeout=4000)
                        # turn 0: wrong then weak then best; turn 1: hint then best; others: best first
                        order = {0: ['X', 'B', 'A'], 1: ['A']}.get(turn, ['A'])
                        if turn == 1: await pg.click('#thint')
                        for want in order:
                            j = await pg.evaluate(f"""(()=>{{ const tn=TALK.find(d=>d.k==='{dk}').scenes[{si}].turns[{turn}];
                                const btns=$$('.tkopt'); for(const b of btns){{ const zh=b.querySelector('.han').textContent; const o=tn.o.find(o=>o.zh===zh); if(o&&o.t==='{want}') return +b.dataset.j; }} return -1; }})()""")
                            if j < 0: errs.append(f'{lang} {dk}/{si} t{turn} option {want} not found'); break
                            await pg.click(f'.tkopt[data-j="{j}"]'); await pg.wait_for_timeout(80)
                            if want != 'A' and not await pg.locator('.tkfb.' + ('meh' if want == 'B' else 'bad')).count(): errs.append(f'{lang} {dk}/{si} no feedback for {want}')
                        if si == 0 and di == 0 and turn == 0: await pg.screenshot(path=f'{O}/talk_{lang}_turn.png')
                        if si == 0 and di == 2 and turn == 1: await pg.screenshot(path=f'{O}/talk_{lang}_hint.png')
                        await pg.click('#tnx'); await pg.wait_for_timeout(60)
                    await pg.wait_for_selector('#trp', timeout=4000)
                    st = await pg.evaluate(f"S.talk['{dk}/'+TALK.find(d=>d.k==='{dk}').scenes[{si}].k]")
                    # turn0 scores 0, turn1 hinted 2, three best 9 => 11/15 = .73 -> 2 stars
                    if st != 2: errs.append(f'{lang} {dk}/{si} stars {st}')
                    if si == 0 and di == 1: await pg.screenshot(path=f'{O}/talk_{lang}_summary.png', full_page=True)
                    total += 1
            info[lang + '_played'] = total
            # key terms on intro and practice from the summary
            await pg.evaluate("go('talkscene',{d:'mep',i:0})"); await pg.wait_for_timeout(150)
            if await pg.locator('.tkterm').count() < 3: errs.append(lang + ' intro key terms missing')
            await pg.screenshot(path=f'{O}/talk_{lang}_terms.png', full_page=True)
            await pg.click('.tkterm >> nth=0'); await pg.wait_for_timeout(200)
            if not await pg.locator('.sheet #topen').count(): errs.append(lang + ' term tap did not open word sheet')
            await pg.evaluate("closeSheet()")
            await pg.click('#go')
            for turn in range(5):
                await pg.wait_for_selector('.tkopt', timeout=4000)
                j = await pg.evaluate("(()=>{ const tn=TALK.find(d=>d.k==='mep').scenes[0].turns[%d]; for(const b of $$('.tkopt')){ const o=tn.o.find(o=>o.zh===b.querySelector('.han').textContent); if(o&&o.t==='A') return +b.dataset.j; } return -1; })()" % turn)
                await pg.click(f'.tkopt[data-j="{j}"]'); await pg.click('#tnx'); await pg.wait_for_timeout(60)
            await pg.wait_for_selector('#tpr', timeout=4000); await pg.click('#tpr'); await pg.wait_for_timeout(300)
            if not (await pg.locator('#go').count() or await pg.locator('.opt').count() or await pg.locator('.qhead').count()): errs.append(lang + ' term practice did not start')
            # toggles persist and hide pinyin
            await pg.evaluate("go('talkscene',{d:'soft',i:0})"); await pg.wait_for_timeout(150); await pg.click('#go'); await pg.wait_for_selector('.tkopt')
            await pg.click('#tpy'); await pg.click('#ttr'); await pg.wait_for_timeout(100)
            vis = await pg.evaluate("[getComputedStyle($('.tkzh .py')).visibility, getComputedStyle($('.tktr')).display, S.tkPy, S.tkTr]")
            if vis != ['hidden', 'block', 0, 1]: errs.append(f'{lang} toggles {vis}')
            await pg.screenshot(path=f'{O}/talk_{lang}_toggles.png')
            await pg.evaluate("S.tkPy=1;S.tkTr=0;save()")
            await pg.close()
        await b.close()
    print(json.dumps(info, ensure_ascii=False)); print('errors', errs)
asyncio.run(main())
