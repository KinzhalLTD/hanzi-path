"""Hanzi Path performance lab: measures how the app feels on a phone.

Runs the phone-shell build in Chromium with a phone viewport and a CPU slowdown (default 4x, a conservative
stand-in for an older iPhone WKWebView) and reports:
  bundle      bytes on disk and gzip size
  startup     ms from navigation to the first interactive screen (median of N cold runs), script time, JS heap
  routes      ms from go(route) to the next painted frame, for the main screens (median / p95)
  scroll      frame intervals while scrolling long screens: avg fps and janky frames (> 1.5 x 16.7 ms)
  taps        Event Timing API: input delay + processing + paint for real taps (p75, like INP)
  longtasks   main-thread tasks > 50 ms during the session
Usage:
  python3 scripts/perf_lab.py HTML OUT.json [--cpu 4] [--runs 5]
  python3 scripts/perf_lab.py --compare BEFORE.json AFTER.json      (prints a table of changes)"""
import sys, json, gzip, os, asyncio, statistics as st, argparse

ROUTES = ["go('home')", "go('dict')", "go('games')", "go('culture')", "go('me')", "go('sectors')", "go('sector',1)",
          "go('talk')", "go('level',1)", "go('lesson',{l:1,i:0})", "go('word',W[3].id)", "go('write',{chars:['你']})",
          "go('code')", "go('section',0)", "go('talkscene',{d:'eng',i:0})", "go('game','mahjong')"]
SCROLL = ["go('dict')", "go('sector',1)", "go('home')", "go('culture')", "go('level',2)"]
TAPS = ["go('home')", "go('dict')", "go('games')", "go('me')"]

def pct(xs, p):
    if not xs: return 0
    xs = sorted(xs); k = (len(xs) - 1) * p; f = int(k); c = min(f + 1, len(xs) - 1)
    return round(xs[f] + (xs[c] - xs[f]) * (k - f), 1)

async def fresh(b, html, cpu, state):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=3)
    if state: await ctx.add_init_script(f"try{{localStorage.setItem({json.dumps(state[0])},{json.dumps(state[1])})}}catch(e){{}}")
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': cpu}); await cdp.send('Performance.enable')
    await pg.add_init_script("""window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(e.duration))).observe({type:'longtask',buffered:true})}catch(e){}
      window.__ev=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>{ if(e.interactionId) __ev.push(e.duration)})).observe({type:'event',durationThreshold:16,buffered:true})}catch(e){}""")
    return ctx, pg, cdp

async def startup(b, html, cpu, state):
    ctx, pg, cdp = await fresh(b, html, cpu, state)
    await pg.goto('file://' + html, wait_until='commit')
    await pg.wait_for_function("document.querySelector('#app .screen, #app .lang')", timeout=60000, polling=16)
    t = await pg.evaluate("performance.now()")
    await pg.wait_for_timeout(800)   # let deferred work run, then sample totals
    m = {x['name']: x['value'] for x in (await cdp.send('Performance.getMetrics'))['metrics']}
    lt = await pg.evaluate("__lt")
    await ctx.close()
    return {'ready_ms': round(t, 1), 'script_ms': round(m.get('ScriptDuration', 0) * 1000, 1), 'task_ms': round(m.get('TaskDuration', 0) * 1000, 1),
            'heap_mb': round(m.get('JSHeapUsedSize', 0) / 1048576, 1), 'longtasks_ms': [round(x) for x in lt]}

FRAME = "()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now()))))"

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('html', nargs='?'); ap.add_argument('out', nargs='?')
    ap.add_argument('--cpu', type=float, default=4); ap.add_argument('--runs', type=int, default=5); ap.add_argument('--compare', nargs=2)
    a = ap.parse_args()
    if a.compare: return compare(*a.compare)
    from playwright.async_api import async_playwright
    html = os.path.abspath(a.html); raw = open(html, 'rb').read()
    rep = {'file': os.path.basename(html), 'cpu': a.cpu, 'bundle': {'kb': len(raw) // 1024, 'gzip_kb': len(gzip.compress(raw, 6)) // 1024}}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # one warm-up session to finish onboarding and capture a realistic saved state
        ctx, pg, cdp = await fresh(b, html, 1, None)
        await pg.goto('file://' + html); await pg.wait_for_timeout(500)
        await pg.click('.lang button[data-l="ar"]'); await pg.wait_for_timeout(200)
        if await pg.locator('#onew').count(): await pg.click('#onew')
        await pg.evaluate("S.coins=500;S.pro=true;save()")
        state = await pg.evaluate("(()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(localStorage.getItem(k).includes('\"lang\"')) return [k,localStorage.getItem(k)]}})()")
        await ctx.close()
        runs = [await startup(b, html, a.cpu, state) for _ in range(a.runs)]
        rep['startup'] = {k: round(st.median([r[k] for r in runs]), 1) for k in ('ready_ms', 'script_ms', 'task_ms', 'heap_mb')}
        rep['startup']['longest_task_ms'] = max((max(r['longtasks_ms'] or [0]) for r in runs))
        # interactive session
        ctx, pg, cdp = await fresh(b, html, a.cpu, state)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
        await pg.goto('file://' + html); await pg.wait_for_timeout(1500)
        rt = {}
        for r in ROUTES:
            xs = []
            for _ in range(3):
                await pg.evaluate("try{closeSheet()}catch(e){}"); await pg.evaluate("go('me')"); await pg.wait_for_timeout(120)
                xs.append(await pg.evaluate(f"(async()=>{{const t=performance.now(); {r}; const f=await ({FRAME})(); return f-t; }})()"))
            rt[r] = round(st.median(xs), 1)
        rep['routes'] = {'median_ms': round(st.median(rt.values()), 1), 'p95_ms': pct(list(rt.values()), .95), 'slowest': sorted(rt.items(), key=lambda x: -x[1])[:5], 'all': rt}
        sc = {}
        for r in SCROLL:
            await pg.evaluate(r); await pg.wait_for_timeout(400)
            fr = await pg.evaluate("""(async()=>{ const el=document.scrollingElement; const max=el.scrollHeight-innerHeight; const out=[]; let last=performance.now();
              for(let i=0;i<90;i++){ el.scrollTop=Math.min(max,(i+1)*max/90); await new Promise(r=>requestAnimationFrame(r)); const n=performance.now(); out.push(n-last); last=n; } return out; })()""")
            fr = fr[1:]; sc[r] = {'fps': round(1000 / st.mean(fr), 1), 'jank': sum(1 for x in fr if x > 25), 'worst_ms': round(max(fr), 1)}
        rep['scroll'] = {'avg_fps': round(st.mean(v['fps'] for v in sc.values()), 1), 'jank_frames': sum(v['jank'] for v in sc.values()), 'screens': sc}
        await pg.evaluate("__ev.length=0;__lt.length=0")
        for r in TAPS:
            await pg.evaluate(r); await pg.wait_for_timeout(300)
            n = await pg.evaluate("document.querySelectorAll('.screen button:not([disabled])').length")
            for i in range(min(n, 8)):
                await pg.evaluate(r); await pg.wait_for_timeout(150)
                el = pg.locator('.screen button:not([disabled])').nth(i)
                try: await el.tap(timeout=1500, force=True); await pg.wait_for_timeout(250)
                except Exception: pass
                await pg.evaluate("try{closeSheet()}catch(e){}")
        ev = await pg.evaluate("__ev"); lt = await pg.evaluate("__lt")
        rep['taps'] = {'count': len(ev), 'p75_ms': pct(ev, .75), 'max_ms': round(max(ev or [0]), 1)}
        rep['longtasks'] = {'count': len(lt), 'total_ms': round(sum(lt)), 'max_ms': round(max(lt or [0]))}
        rep['errors'] = errs
        await b.close()
    json.dump(rep, open(a.out, 'w'), indent=1, ensure_ascii=False)
    s = rep['startup']
    print(f"bundle {rep['bundle']['kb']} KB (gzip {rep['bundle']['gzip_kb']} KB) | startup {s['ready_ms']} ms, script {s['script_ms']} ms, heap {s['heap_mb']} MB, longest task {s['longest_task_ms']} ms")
    print(f"routes median {rep['routes']['median_ms']} ms p95 {rep['routes']['p95_ms']} ms | scroll {rep['scroll']['avg_fps']} fps, {rep['scroll']['jank_frames']} janky | taps p75 {rep['taps']['p75_ms']} ms | longtasks {rep['longtasks']}")
    print('slowest routes', rep['routes']['slowest']); print('errors', errs)

def compare(a, b):
    A, B = json.load(open(a)), json.load(open(b))
    rows = [('Bundle size (KB)', A['bundle']['kb'], B['bundle']['kb']), ('Gzip size (KB)', A['bundle']['gzip_kb'], B['bundle']['gzip_kb']),
            ('Startup to first screen (ms)', A['startup']['ready_ms'], B['startup']['ready_ms']), ('Startup script time (ms)', A['startup']['script_ms'], B['startup']['script_ms']),
            ('JS heap after start (MB)', A['startup']['heap_mb'], B['startup']['heap_mb']), ('Longest startup task (ms)', A['startup']['longest_task_ms'], B['startup']['longest_task_ms']),
            ('Screen switch median (ms)', A['routes']['median_ms'], B['routes']['median_ms']), ('Screen switch p95 (ms)', A['routes']['p95_ms'], B['routes']['p95_ms']),
            ('Scroll fps', A['scroll']['avg_fps'], B['scroll']['avg_fps']), ('Janky scroll frames', A['scroll']['jank_frames'], B['scroll']['jank_frames']),
            ('Tap response p75 (ms)', A['taps']['p75_ms'], B['taps']['p75_ms']), ('Long tasks total (ms)', A['longtasks']['total_ms'], B['longtasks']['total_ms'])]
    for n, x, y in rows:
        ch = '' if not x else f"{(y - x) / x * 100:+.0f}%"
        print(f"{n:30} {x:>9} → {y:<9} {ch}")
    return rows

if __name__ == '__main__': asyncio.run(main())
