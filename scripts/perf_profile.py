"""CPU profiler for Hanzi Path: where does main-thread time go?
Records a V8 CPU profile (Chrome DevTools Protocol) for startup and for each given route, then aggregates self time
per function (with file line) so hot spots are obvious. Usage:
  python3 scripts/perf_profile.py HTML [--cpu 4] [--top 15] ["go('sector',1)" ...]"""
import sys, json, asyncio, argparse, collections
from playwright.async_api import async_playwright

def hot(prof, top):
    nodes = {n['id']: n for n in prof['nodes']}; self_t = collections.Counter()
    dt = prof.get('timeDeltas', []); samples = prof.get('samples', [])
    for s, d in zip(samples, dt):
        cf = nodes[s]['callFrame']; key = f"{cf['functionName'] or '(anon)'} :{cf['lineNumber'] + 1}" if cf['url'] or cf['functionName'] else cf['functionName'] or '(program)'
        if cf['functionName'] in ('(idle)', '(program)', '(garbage collector)') : key = cf['functionName']
        self_t[key] += d / 1000
    total = sum(self_t.values())
    return round(total), [(k, round(v, 1)) for k, v in self_t.most_common(top)]

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('html'); ap.add_argument('routes', nargs='*'); ap.add_argument('--cpu', type=float, default=4); ap.add_argument('--top', type=int, default=15)
    a = ap.parse_args()
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); await pg.goto('file://' + a.html); await pg.wait_for_timeout(400)
        await pg.click('.lang button[data-l="ar"]')
        if await pg.locator('#onew').count(): await pg.click('#onew')
        cdp = await ctx.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate', {'rate': a.cpu})
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 200})
        await cdp.send('Profiler.start'); await pg.reload(); await pg.wait_for_timeout(1500)
        prof = (await cdp.send('Profiler.stop'))['profile']; print('== startup', *hot(prof, a.top), sep='\n')
        for r in a.routes:
            await pg.evaluate("go('me')"); await pg.wait_for_timeout(300)
            await cdp.send('Profiler.start')
            await pg.evaluate(f"(async()=>{{ for(let i=0;i<5;i++){{ go('me'); {r}; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); }} }})()")
            prof = (await cdp.send('Profiler.stop'))['profile']; print('==', r, '(x5 incl. go(me))', *hot(prof, a.top), sep='\n')
        await b.close()
asyncio.run(main())
