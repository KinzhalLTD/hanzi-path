"""Theme contrast audit: is every piece of text readable in the dark and the light theme?

For each theme and each screen it scrolls through the page, takes real screenshots, and for every visible text element
compares the text colour (computed style) with the pixels actually behind it (the most common colour in the element's
box that is not the text colour, so gradients, photos, overlays and sheets are all measured as rendered).
WCAG contrast: normal text needs 4.5, large text (>= 24 px, or >= 18.7 px bold) needs 3.0.
  hard   contrast < 2.5      clearly unreadable; must be fixed
  aa     below the WCAG AA threshold (reported, grouped; hint text and disabled controls may legitimately sit here)
Usage: python3 scripts/audit_theme.py HTML OUT [THEME ...] [--routes REGEX] [--max 12]
       (themes default to: dark light; prints `hard N` per theme and the worst groups; crops saved to OUT)"""
import sys, os, io, re, json, asyncio, collections
from PIL import Image
from playwright.async_api import async_playwright
_vals = {i + 1 for i, a in enumerate(sys.argv) if a in ('--routes', '--max')}
args = [a for i, a in enumerate(sys.argv) if i and not a.startswith('--') and i not in _vals]; H, O = args[0], args[1]; THEMES = args[2:] or ['dark', 'light']
opt = lambda k, d: (sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d)
RX, MAXG = opt('--routes', ''), int(opt('--max', '12'))
os.makedirs(O, exist_ok=True)
ROUTES = ["go('home')", "go('dict')", "go('games')", "go('culture')", "go('me')", "go('review')", "go('sectors')", "go('sector',1)", "go('accents')", "go('code')",
          "go('codeunit',{i:0})", "go('writehub')", "go('talk')", "go('talkscene',{d:'eng',i:0})", "go('grammar')", "go('gpoint',{k:'g1-shi'})", "go('gpoint',{k:'g3-ba'})",
          "go('gpractice',{k:'g1-hen'})", "go('level',1)", "go('level',4)", "go('lesson',{l:1,i:0})", "go('word',W[3].id)", "go('word',W.find(w=>w.l===5).id)",
          "go('write',{chars:['你','好']})", "go('builder',{mode:'rad'})", "go('section',0)", "go('section',3)", "go('reader',{i:0,start:0})", "go('recipe',0)", "go('placement')",
          "go('game','mahjong')", "go('game','xiangqi')", "go('game','klotski')", "go('game','tangram')", "go('game','riddle')", "go('game','idiom')", "go('game','lantern')",
          "go('home');paywall()", "go('home');shop()", "go('home');musicSheet()", "go('home');inboxSheet()", "go('home');checkinSheet()"]
COLLECT = r"""() => { const out = []; const vh = innerHeight, vw = innerWidth;
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const bar = document.querySelector('.tabbar nav'); const br = bar && !document.querySelector('.sheet') ? bar.getBoundingClientRect() : null;   // text sliding under the floating tab bar is not judged
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set(); let n;
  while ((n = walker.nextNode())) { const t = n.nodeValue.trim(); if (!t || /^[\s\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D\u20E3]+$/u.test(t)) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect();
    if (r.width < 4 || r.height < 6 || r.bottom <= 2 || r.top >= vh - 2 || r.right <= 0 || r.left >= vw) continue;
    if (Math.min(r.bottom, vh) - Math.max(r.top, 0) < r.height * .6) continue;         // mostly cut off by the screen edge: judged on the next scroll step
    if (br && !bar.contains(el) && r.bottom > br.top - 28 && r.top < br.bottom + 4) continue;   // 28: the bar's soft shadow reaches above it
    const top = document.elementFromPoint(Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), Math.min(vh - 1, Math.max(0, r.top + r.height / 2)));
    if (top && !(el.contains(top) || top.contains(el))) continue;                      // covered by something else
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const svg = !!el.closest('svg'); const c = parse(svg && cs.fill && cs.fill !== 'none' ? cs.fill : cs.color); if (!c) continue;
    const shadow = cs.textShadow && cs.textShadow !== 'none';   // text drawn over art with a shadow: reported, never 'hard'
    const clip = (cs.webkitBackgroundClip || cs.backgroundClip) === 'text';
    let path = ''; for (let e = el, k = 0; e && k < 3 && e !== document.body; e = e.parentElement, k++) path = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (path ? ' > ' + path : '');
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height, c: c.slice(0, 3), a: c[3] * op, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight || 400, t: t.slice(0, 24), path, clip, shadow, dis: !!el.closest('[disabled],.lk,.locked,.blocked,[aria-disabled="true"]') }); }
  return out; }"""
def lum(c):
    f = lambda v: (v / 255 / 12.92) if v / 255 <= .03928 else ((v / 255 + .055) / 1.055) ** 2.4
    return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2])
def contrast(a, b):
    la, lb = lum(a), lum(b); return (max(la, lb) + .05) / (min(la, lb) + .05)
def background(img, box, tc):
    """Colour behind the text: the median of the box's pixels that are clearly not the text colour (so gradients,
    photos and anti-aliased glyph edges don't fool it). If almost nothing differs, the text is the background colour."""
    x0, y0, x1, y1 = [int(v) for v in box]; x0, y0 = max(0, x0 - 3), max(0, y0 - 2); x1, y1 = min(img.width, x1 + 3), min(img.height, y1 + 2)
    if x1 - x0 < 2 or y1 - y0 < 2: return None
    px = list(img.crop((x0, y0, x1, y1)).get_flattened_data() if hasattr(Image.Image, 'get_flattened_data') else img.crop((x0, y0, x1, y1)).getdata())
    far = [p for p in px if abs(p[0] - tc[0]) + abs(p[1] - tc[1]) + abs(p[2] - tc[2]) > 96]
    if len(far) < max(4, len(px) * .06): far = px
    far.sort(key=lambda p: p[0] * 3 + p[1] * 6 + p[2]); m = far[len(far) // 2]; return (m[0], m[1], m[2])

async def main():
    summary = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for theme in THEMES:
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click('.lang button[data-l="en"]')
            if await pg.locator('#onew').count(): await pg.click('#onew')
            await pg.evaluate(f"S.pro=true;S.coins=500;S.theme='{theme}';save(); if(typeof applyTheme==='function') applyTheme();")
            await pg.add_style_tag(content='*,*::before,*::after{animation:none!important;transition:none!important}')
            groups = {}; total = aa = 0
            for route in [r for r in ROUTES if not RX or re.search(RX, r)]:
                try: await pg.evaluate("try{closeSheet()}catch(e){}"); await pg.evaluate(route); await pg.wait_for_timeout(350)
                except Exception as e: errs.append(route + ' ' + str(e)[:80]); continue
                sheet = await pg.locator('.sheet').count() > 0
                hgt = 0 if sheet else await pg.evaluate("document.scrollingElement.scrollHeight")
                for step in range(1 if sheet else min(6, max(1, -(-hgt // 760)))):
                    if not sheet: await pg.evaluate(f"scrollTo(0,{step * 760})"); await pg.wait_for_timeout(120)
                    img = Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')
                    for e in await pg.evaluate(COLLECT):
                        if e['clip'] or e['a'] < .05: continue
                        tc0 = e['c']; bg = background(img, (e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h']), tc0)
                        if not bg: continue
                        tc = [tc0[i] * e['a'] + bg[i] * (1 - e['a']) for i in range(3)]
                        cr = contrast(tc, bg); large = e['fs'] >= 24 or (e['fs'] >= 18.66 and e['fw'] >= 700); need = 3.0 if large else 4.5
                        total += 1
                        if cr >= need: continue
                        aa += 1; hard = cr < 2.5 and not e['dis'] and not e['shadow']
                        key = (e['path'], tuple(int(v) for v in tc), bg)
                        g = groups.setdefault(key, {'n': 0, 'cr': cr, 'hard': hard, 't': e['t'], 'routes': set(), 'crop': None})
                        g['n'] += 1; g['routes'].add(route[:34]); g['cr'] = min(g['cr'], cr); g['hard'] = g['hard'] or hard
                        if g['crop'] is None: g['crop'] = img.crop((max(0, int(e['x']) - 30), max(0, int(e['y']) - 14), min(390, int(e['x'] + e['w']) + 30), min(844, int(e['y'] + e['h']) + 14)))
            await pg.close()
            hard = [(k, g) for k, g in groups.items() if g['hard']]
            summary[theme] = {'texts': total, 'aa_fail': aa, 'hard_groups': len(hard), 'hard': sum(g['n'] for _, g in hard), 'errors': errs}
            print(f"== {theme}: {total} text samples, below AA {aa} ({aa * 100 // max(1, total)}%), hard {sum(g['n'] for _, g in hard)} in {len(hard)} groups, page errors {errs}")
            for i, (k, g) in enumerate(sorted(groups.items(), key=lambda x: (not x[1]['hard'], x[1]['cr']))[:MAXG]):
                rgb = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in c)
                print(f"  {'HARD' if g['hard'] else 'aa  '} {g['cr']:.2f} x{g['n']:<3} {rgb(k[1])} on {rgb(k[2])}  “{g['t']}”  {k[0][-70:]}  [{', '.join(sorted(g['routes']))[:60]}]")
                if g['crop']: g['crop'].resize((g['crop'].width * 2, g['crop'].height * 2)).save(os.path.join(O, f'{theme}_{i:02d}.png'))
    json.dump(summary, open(os.path.join(O, 'theme_audit.json'), 'w'), indent=1)
    print('hard', {t: s['hard'] for t, s in summary.items()})
asyncio.run(main())
