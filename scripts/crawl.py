"""Whole-app crawler: opens every screen (and every culture card, recipe, game, sector, code unit, conversation),
taps every visible control on it, and reports JS errors, broken text and controls that do nothing.
Checks after every tap:
  - page errors (uncaught exceptions) and console errors
  - visible text containing 'undefined', 'NaN', '[object Object]', '{t(' or a raw i18n key (camelCase key shown as text)
  - horizontal page overflow
  - dead controls: enabled buttons whose tap changes nothing (no DOM change, no route, no sheet, no sound/speech call)
Usage: python3 scripts/crawl.py /abs/phone-shell.html outdir LANG(ar|en) [maxTapsPerScreen] [shard/nshards]"""
import sys, asyncio, json, re, os
from playwright.async_api import async_playwright
H, O, LANG = sys.argv[1], sys.argv[2], sys.argv[3]; MAXT = int(sys.argv[4]) if len(sys.argv) > 4 else 40
SH, NSH = (int(x) for x in (sys.argv[5] if len(sys.argv) > 5 else '0/1').split('/'))
os.makedirs(O, exist_ok=True)

SETUP = """(()=>{ window.__calls=0; const wrap=n=>{ const f=window[n]; if(typeof f!=='function') return; window[n]=function(){ window.__calls++; return f.apply(this,arguments); }; };
  ['speak','speakIn','pronCheck','toast','haptic','paywall','sheet','go','openUrl','confetti','musicSheet','interstitial','rewarded','purchase','native'].forEach(wrap);
  for(const k in SFX){ const f=SFX[k]; if(typeof f==='function') SFX[k]=function(){ window.__calls++; return f.apply(this,arguments); }; }
  window.__mut=0; new MutationObserver(m=>{ window.__mut+=m.length; }).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  window.open=()=>{ window.__calls++; return null; }; })()"""
CHECK = r"""(route)=>{ const issues=[]; const txt=document.body.innerText||'';
  const codeScreen=/^(code|codeunit)/.test(route);
  if(!codeScreen && /\bundefined\b/.test(txt)) issues.push('text:undefined');
  if(/\bNaN\b/.test(txt)) issues.push('text:NaN');
  if(/\[object Object\]/.test(txt)) issues.push('text:[object Object]');
  if(/\$\{|\{t\(/.test(txt)) issues.push('text:template');
  const keys=Object.keys(T.en).filter(k=>/[A-Z0-9]/.test(k)&&k.length>4); const words=new Set(txt.match(/\b[a-z][a-zA-Z0-9]{4,}\b/g)||[]);
  keys.forEach(k=>{ if(words.has(k)) issues.push('rawkey:'+k); });
  if(document.scrollingElement.scrollWidth>innerWidth+1) issues.push('hscroll:'+document.scrollingElement.scrollWidth);
  return issues; }"""
LIST = r"""()=>{ const vis=e=>{ const r=e.getBoundingClientRect(), cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('[hidden]'); };
  const root=document.querySelector('.sheet')||document.body;
  const els=[...root.querySelectorAll('button,a,[role=button],.tok[data-w],input[type=checkbox],select,.cell,.tile,.ttab,.opt,.seccard')].filter(e=>vis(e)&&!e.disabled);
  els.forEach((e,i)=>e.setAttribute('data-crawl',i));
  return els.map((e,i)=>({i, tag:e.tagName, id:e.id, cls:(e.className||'').toString().slice(0,40), txt:(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,30)})); }"""

def states(js):
    out = ["go('home')", "go('dict')", "go('games')", "go('culture')", "go('me')", "go('review')", "go('sectors')", "go('accents')",
           "go('code')", "go('writehub')", "go('talk')", "go('placement')", "go('builder',{mode:'rad'})", "go('builder',{mode:'book'})",
           "go('write',{chars:['你','好']})", "go('word',W[3].id)", "go('word',W.find(w=>w.l===5).id)"]
    out += [f"go('level',{l})" for l in range(1, 7)]
    out += ["go('lesson',{l:1,i:0})", "go('lesson',{l:3,i:2})", "go('lesson',{l:6,i:10})"]
    out += [f"go('section',{i})" for i in range(js['culture'])]
    out += [f"go('reader',{{i:{i},start:{j}}})" for i in range(js['culture']) for j in range(0, js['cards'][i], 3)]
    out += [f"go('recipe',{i})" for i in range(js['recipes'])]
    out += [f"go('game','{g}')" for g in js['games']]
    out += [f"go('sector',{i})" for i in range(js['sectors'])]
    out += [f"go('codeunit',{{i:{i}}})" for i in range(js['code'])]
    out += [f"go('talkscene',{{d:'{d}',i:{i}}})" for d, n in js['talk'] for i in range(n)]
    return out

async def main():
    report = {'pageerror': [], 'console': [], 'issues': {}, 'dead': [], 'states': 0, 'taps': 0}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        cur = {'st': ''}
        pg.on('pageerror', lambda e: report['pageerror'].append(cur['st'] + ' :: ' + str(e)[:220]))
        pg.on('console', lambda m: m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text and report['console'].append(cur['st'] + ' :: ' + m.text[:200]))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await pg.goto('file://' + H); await pg.wait_for_timeout(400)
        await pg.click(f'.lang button[data-l="{LANG}"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#onew').count(): await pg.click('#onew')
        meta = await pg.evaluate("({culture:CULTURE.length,cards:CULTURE.map(c=>c.cards.length),recipes:RECIPES.length,games:GAMES.map(g=>g[1]||g[0]),sectors:SECTORS.length,code:CODE_UNITS.length,talk:TALK.map(d=>[d.k,d.scenes.length])})")
        meta['games'] = await pg.evaluate("GAMES.map(g=>Object.values(g)[1])")
        core = ["go('home')", "go('dict')", "go('games')", "go('culture')", "go('me')", "go('sectors')", "go('talk')", "go('level',2)", "go('sector',1)"]
        plan = [(False, st) for st in core] + [(True, st) for st in states(meta)]
        plan = [x for k, x in enumerate(plan) if k % NSH == SH]
        def dump():
            r = dict(report); r['issues'] = {k: sorted(v)[:8] + ([f'... {len(v)} total'] if len(v) > 8 else []) for k, v in report['issues'].items()}
            json.dump(r, open(f'{O}/crawl_{LANG}_{SH}.json', 'w'), ensure_ascii=False, indent=1)
        for pro, st in plan:
            await pg.evaluate(f"S.pro={'true' if pro else 'false'};S.coins=500;save()")
            if True:
                cur['st'] = ('PRO ' if pro else 'free ') + st; report['states'] += 1
                async def enter():
                    await pg.evaluate("try{closeSheet()}catch(e){}"); await pg.evaluate(st); await pg.wait_for_timeout(260)
                    if await pg.locator('.sheet #ok').count() and "'game'" in st: await pg.click('.sheet #ok'); await pg.wait_for_timeout(200)
                try: await enter()
                except Exception as e: report['pageerror'].append(cur['st'] + ' :: enter ' + str(e)[:160]); continue
                iss = await pg.evaluate(CHECK, st)
                for x in iss: report['issues'].setdefault(x, set()).add(cur['st'])
                ctrls = await pg.evaluate(LIST)
                for c in ctrls[:MAXT]:
                    try:
                        await enter(); await pg.evaluate(SETUP)
                        await pg.evaluate("window.__calls=0;window.__mut=0;window.__r=JSON.stringify(route)")
                        lst = await pg.evaluate(LIST)
                        if c['i'] >= len(lst): continue
                        el = pg.locator(f'[data-crawl="{c["i"]}"]')
                        await el.click(timeout=1500, force=True); report['taps'] += 1
                        await pg.wait_for_timeout(220)
                        res = await pg.evaluate("({calls:window.__calls, mut:window.__mut, route:JSON.stringify(route)!==window.__r, sheet:!!document.querySelector('.sheet')})")
                        if not res['calls'] and not res['mut'] and not res['route'] and not res['sheet'] and c['tag'] in ('BUTTON', 'A'):
                            report['dead'].append(f"{cur['st']} :: {c['tag']}#{c['id']}.{c['cls']} “{c['txt']}”")
                        iss = await pg.evaluate(CHECK, st)
                        for x in iss: report['issues'].setdefault(x, set()).add(cur['st'] + ' → ' + (c['id'] or c['txt'][:14]))
                    except Exception as e:
                        if 'Timeout' not in str(e) and 'not attached' not in str(e) and 'outside of the viewport' not in str(e):
                            report['pageerror'].append(cur['st'] + ' :: tap ' + str(e)[:140])
                dump(); print('done', report['states'], st, flush=True)
        await b.close()
    dump()
    print('states', report['states'], 'taps', report['taps'], 'pageerrors', len(report['pageerror']), 'console', len(report['console']), 'issue types', len(report['issues']), 'dead', len(report['dead']))
asyncio.run(main())
