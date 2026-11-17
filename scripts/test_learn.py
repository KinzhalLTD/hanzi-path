"""Learning engine v2: pinyin helpers, each new exercise kind (answered right and wrong), lesson plan, mastery, placement.
Usage: python3 scripts/test_learn.py /abs/hanzi-path.html outdir"""
import sys, asyncio, json
from playwright.async_api import async_playwright
P, O = sys.argv[1], sys.argv[2]
UNIT = r"""() => { const e=[];
  const eq=(a,b,m)=>{ if(JSON.stringify(a)!==JSON.stringify(b)) e.push(m+': '+JSON.stringify(a)+' != '+JSON.stringify(b)); };
  eq(pyNorm('ni3hao3'),['ni3','hao3'],'num'); eq(pyNorm('nǐ hǎo'),['ni3','hao3'],'marks'); eq(pyNorm('nihao'),['ni5','hao5'],'none');
  eq(pyNorm('lv4se4'),['lv4','se4'],'v'); eq(pyNorm('lǜsè'),['lv4','se4'],'ü'); eq(pyNorm('Xi1an1'),['xi1','an1'],'xian');
  eq(numToMarks('ni3hao3'),'nǐhǎo','n2m'); eq(numToMarks('lüe4'),'lüè','n2m ü'); eq(numToMarks('gou3'),'gǒu','n2m ou'); eq(numToMarks('gui4'),'guì','n2m ui');
  eq(alignPy('银行在超市旁边。','Yínháng zài chāoshì pángbiān.'),['Yín','háng','zài','chāo','shì','páng','biān'],'align');
  eq(alignPy('我们去哪儿？','Wǒmen qù nǎr?'),['Wǒ','men','qù','nǎ','r'],'erhua'); eq(alignPy('明天可能下雨。','Míngtiān kěnéng xià yǔ.')[3],'néng','apostrophe rule');
  let ok=0; W.forEach(w=>{ if(alignPy(w.ex.zh,w.ex.py)) ok++; }); if(ok<4980) e.push('alignment coverage '+ok);
  // every HSK word: question kinds produce valid questions
  const pool=byLevel[2]; let made={}; W.slice(0,800).forEach(w=>{ for(const k of ['gap','slisten','build','pinyin','tonepair']) if(canQ(k,w)){ const q=makeQ(k,w,pool); if(!q) e.push('noq '+k+w.h); made[k]=(made[k]||0)+1;
     if(k==='gap'&&(q.opts.length!==4||q.opts.filter(o=>o.id===w.id).length!==1||q.opts.some(o=>o.id!==w.id&&w.ex.zh.includes(o.h)))) e.push('gap opts '+w.h);
     if(k==='slisten'&&(new Set(q.opts).size!==q.opts.length||!q.opts.includes(exMeaning(w.ex)))) e.push('sl opts '+w.h);
     if(k==='build'&&q.toks.join('')!==w.ex.zh.replace(/[^㐀-鿿〇]/g,'').replace(/./g,c=>c)&&q.toks.join('')!==segment(w.ex.zh).filter(x=>[...x.t].some(isHan)).map(x=>x.t).join('')) e.push('build toks '+w.h);
     if(k==='tonepair'&&q.opts.length!==4) e.push('tp opts '+w.h); } });
  if(Object.keys(made).length<5) e.push('kinds made '+JSON.stringify(made));
  const plan=lessonPlan(unitsOf(1)[0],byLevel[1],{review:false}); const ks=plan.map(q=>q.k); ['gap','slisten','build'].forEach(k=>{ if(!ks.includes(k)) e.push('plan lacks '+k+' '+ks); });
  return {e,made,ks}; }"""
async def answer(pg, right):
    k = await pg.evaluate("window.__q&&__q.k")
    return k
async def main():
    errs=[]; out={}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lang in ['ar','en']:
            pg=await b.new_page(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
            pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
            await pg.goto('file://'+P); await pg.wait_for_timeout(300); await pg.click(f'.lang button[data-l="{lang}"]'); await pg.wait_for_timeout(250)
            # onboarding second step
            if lang=='ar':
                assert await pg.locator('#oknow').count(), 'onboarding level question missing'
            await pg.click('#onew'); await pg.wait_for_timeout(200)
            if lang=='ar':
                r=await pg.evaluate(UNIT); out['unit']=r; errs+=['unit: '+x for x in r['e']]
            # render each kind directly, answer correctly, then wrongly
            for k in ['gap','slisten','build','pinyin','tonepair']:
                for right in [True, False]:
                    await pg.evaluate(f"""(()=>{{ const w=W.filter(w=>w.l<=2).find(w=>canQ('{k}',w)&&w.h.length>=2) ; route={{name:'lesson'}}; render(); const m=$('main');
                      const q=makeQ('{k}',w,byLevel[1]); window.__done=0; runQuiz(m,{{questions:[q],back:()=>{{}},onDone:()=>{{window.__done=1}}}}); window.__q=q; }})()""")
                    await pg.wait_for_timeout(250)
                    if right: await pg.screenshot(path=f'{O}/learn_{lang}_{k}.png')
                    if k in ('gap','tonepair','slisten'):
                        idx=await pg.evaluate(f"""(()=>{{const q=__q; if('{k}'==='gap') return q.opts.findIndex(o=>o.id===q.w.id); if('{k}'==='slisten') return q.opts.indexOf(exMeaning(q.w.ex)); return q.opts.indexOf(pySyllables(q.w.p).map(sylTone).join('-')); }})()""")
                        if not right: idx=(idx+1)%len(await pg.evaluate("__q.opts"))
                        await pg.click(f'.opt[data-j="{idx}"]')
                    elif k=='build':
                        toks=await pg.evaluate("__q.toks"); tiles=await pg.evaluate("__q.tiles")
                        order=toks if right else list(reversed(toks))
                        used=set()
                        for t in order:
                            j=next(i for i,x in enumerate(tiles) if x==t and i not in used); used.add(j)
                            await pg.click(f'#bbank .btile[data-j="{j}"]')
                    elif k=='pinyin':
                        ans=await pg.evaluate("__q.w.p") if right else 'zzz'
                        await pg.fill('#pin', ans)
                    await pg.click('#ck'); await pg.wait_for_timeout(250)
                    good=await pg.locator('.feedback.good').count(); bad=await pg.locator('.feedback.bad').count()
                    if (right and not good) or ((not right) and not bad): errs.append(f'{lang} {k} right={right} good={good} bad={bad}')
                    if right: await pg.screenshot(path=f'{O}/learn_{lang}_{k}_fb.png')
                    await pg.evaluate("$$('.feedback').forEach(f=>f.remove())")
            # tone keypad input
            await pg.evaluate("""(()=>{ const w=byH['中国']; route={name:'lesson'}; render(); runQuiz($('main'),{questions:[makeQ('pinyin',w,byLevel[1])],back:()=>{},onDone:()=>{}}); })()""")
            await pg.wait_for_timeout(200); await pg.fill('#pin','zhong'); await pg.click('.tk[data-n="1"]'); await pg.type('#pin','guo'); await pg.click('.tk[data-n="2"]')
            pv=await pg.text_content('#prev')
            if pv.strip()!='zhōngguó': errs.append('preview '+pv)
            await pg.click('#ck'); await pg.wait_for_timeout(200)
            if not await pg.locator('.feedback.good').count(): errs.append('keypad answer not accepted')
            await pg.evaluate("$$('.feedback').forEach(f=>f.remove())")
            # full HSK1 lesson: answer everything right through the UI where possible -> finish screen with level-ups
            await pg.evaluate("go('lesson',{l:1,i:0})"); await pg.wait_for_timeout(300)
            for _ in range(80):
                if await pg.locator('#go').count(): await pg.click('#go'); await pg.wait_for_timeout(120); continue
                if await pg.locator('#dn').count(): break
                if await pg.locator('#nx').count(): await pg.click('#nx'); await pg.wait_for_timeout(150); continue
                if await pg.locator('.pairs').count():
                    ids=await pg.evaluate("$$('.pl').map(b=>b.dataset.id)")
                    for i in ids:
                        await pg.click(f'.pl[data-id="{i}"]'); await pg.click(f'.pr[data-id="{i}"]')
                    await pg.wait_for_timeout(800); continue
                if await pg.locator('#skip').count(): await pg.click('#skip'); await pg.wait_for_timeout(200); continue
                # answer correctly using the question the engine is showing (exposed for tests as window.__cur)
                kind=await pg.evaluate("window.__cur&&__cur.k")
                if kind=='build':
                    toks=await pg.evaluate("__cur.toks"); tiles=await pg.evaluate("__cur.tiles"); used=set()
                    for t in toks:
                        j=next(i for i,x in enumerate(tiles) if x==t and i not in used); used.add(j); await pg.click(f'#bbank .btile[data-j="{j}"]')
                elif kind=='pinyin': await pg.fill('#pin', await pg.evaluate("__cur.w.p"))
                elif await pg.locator('.opt').count():
                    j=await pg.evaluate("""(()=>{ const q=__cur, w=q.w; if(q.k==='tone') return q.opts.indexOf(w.p); if(q.k==='slisten') return q.opts.indexOf(exMeaning(w.ex));
                       if(q.k==='tonepair') return q.opts.indexOf(pySyllables(w.p).map(sylTone).join('-')); return q.opts.findIndex(o=>o.id===w.id); })()""")
                    await pg.click(f'.opt[data-j="{j}"]')
                if await pg.locator('#ck:not([disabled])').count(): await pg.click('#ck'); await pg.wait_for_timeout(150)
            if not await pg.locator('#dn').count(): errs.append(lang+' lesson did not finish')
            else: await pg.screenshot(path=f'{O}/learn_{lang}_finish.png',full_page=True)
            # journey gate: answer every question right -> gate passed, chapter units done
            await pg.evaluate("S.gates={};S.units={};save();go('level',1)"); await pg.wait_for_timeout(300)
            if await pg.locator('.jnode').count()<10 or not await pg.locator('.jgate').count(): errs.append(lang+' journey not rendered')
            if not await pg.locator('svg.jtrail').count(): errs.append(lang+' trail missing')
            await pg.evaluate("gateSheet(1,chaptersOf(1)[1])"); await pg.wait_for_timeout(200); await pg.click('#gg'); await pg.wait_for_timeout(300)
            for _ in range(40):
                if await pg.locator('#dn').count(): break
                if await pg.locator('#nx').count(): await pg.click('#nx'); await pg.wait_for_timeout(120); continue
                kind=await pg.evaluate("window.__cur&&__cur.k")
                if kind=='build':
                    toks=await pg.evaluate("__cur.toks"); tiles=await pg.evaluate("__cur.tiles"); used=set()
                    for t in toks:
                        j=next(i for i,x in enumerate(tiles) if x==t and i not in used); used.add(j); await pg.click(f'#bbank .btile[data-j="{j}"]')
                elif kind=='pinyin': await pg.fill('#pin', await pg.evaluate("__cur.w.p"))
                else:
                    j=await pg.evaluate("""(()=>{ const q=__cur, w=q.w; if(q.k==='slisten') return q.opts.indexOf(exMeaning(w.ex)); if(q.k==='tonepair') return q.opts.indexOf(pySyllables(w.p).map(sylTone).join('-')); return q.opts.findIndex(o=>o.id===w.id); })()""")
                    await pg.click(f'.opt[data-j="{j}"]')
                await pg.click('#ck'); await pg.wait_for_timeout(120)
            g=await pg.evaluate("[!!(S.gates||{})['1-1'],chaptersOf(1)[1].from,chaptersOf(1)[1].to,Object.keys(S.units).length]")
            if not g[0] or g[3]!=g[2]-g[1]: errs.append(f'{lang} gate result {g}')
            await pg.screenshot(path=f'{O}/learn_{lang}_gate.png')
            await pg.click('#dn'); await pg.wait_for_timeout(400)
            # placement: answer all correctly -> HSK 6 suggestion; apply
            await pg.evaluate("S.placed=0;go('placement')"); await pg.wait_for_timeout(200); await pg.screenshot(path=f'{O}/learn_{lang}_place0.png')
            await pg.click('#go'); n=0
            while await pg.locator('.opt').count() and n<40:
                n+=1
                j=await pg.evaluate("""(()=>{ const big=$('.big.han'), mean=$('.prompt .meaning'), gl=$('.gapline'); const opts=$$('.opt');
                   // find the option that matches: test-only lookup through the word data
                   for(let i=0;i<opts.length;i++){ const tx=opts[i].innerText.trim(); const w=W.find(w=>(big&&w.h===big.innerText.trim()&&meaning(w)===tx)||(gl&&w.ex&&w.ex.zh===gl.innerText.replace(/＿+/,tx))||(!big&&!gl&&mean&&w.h===tx&&meaning(w)===mean.innerText.trim())); if(w) return i; } return 0; })()""")
                await pg.click(f'.opt >> nth={j}'); await pg.wait_for_timeout(480)
            await pg.screenshot(path=f'{O}/learn_{lang}_place1.png')
            lvl=await pg.evaluate("(document.querySelector('h1')||{}).innerText")
            if lang=='en': out['placement']=lvl
            if await pg.locator('#ap').count():
                await pg.click('#ap'); await pg.wait_for_timeout(300)
                cl=await pg.evaluate("curLevel()"); out[lang+'_curLevel']=cl
            await pg.close()
        await b.close()
    print(json.dumps({k:v for k,v in out.items() if k!='unit'},ensure_ascii=False)); print('made',out.get('unit',{}).get('made'))
    print('errors',errs)
asyncio.run(main())
