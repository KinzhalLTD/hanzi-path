"""Accessibility audit (screen readers): on every main route, in Arabic and English, finds
 - interactive elements (buttons, links, inputs, role=button, tabindex) with no accessible name
   (text, aria-label, aria-labelledby, title, img alt, or a <label>/placeholder for inputs); emoji-only text does not count
 - images without alt that are not hidden from screen readers
 - duplicate ids on the page, and a missing lang/dir on <html>
Usage: python3 scripts/audit_a11y.py HTML OUT   → prints the problems and `a11y issues N` (must be 0)"""
import sys, os, json, asyncio
from playwright.async_api import async_playwright
H, O = os.path.abspath(sys.argv[1]), sys.argv[2]
ROUTES = ["go('home')", "go('learn')", "go('track','se')", "go('track','cy')", "go('module','se-fund')", "go('lesson',{k:'se-fund',i:0})",
          "go('quizrun',{k:'cy-net'})", "go('gaterun',{tr:'se',c:0})", "go('exam','cy')", "go('labs')", "go('codelab','sum')", "go('seclab',{lab:'phish',i:0})",
          "go('seclab',{lab:'logs',i:0})", "go('seclab',{lab:'review',i:2})", "go('ctflab',{i:7})", "go('fwlab',{lv:2})", "go('pwlab')", "go('zh')", "go('terms')",
          "go('practice',{k:'cy-iam'})", "go('talk')", "go('talkscene',{d:'soft',i:0})", "go('game','ports')", "go('game','bits')", "go('me')", "go('weak')",
          "go('home');paywall('module')", "go('home');shop()", "go('home');accountSheet()", "go('module','se-git');dialogSheet(MOD['se-git'])", "go('home');fortuneSheet()"]
CHECK = r"""() => { const out = []; const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const hidden = e => !!e.closest('[aria-hidden="true"]');
  const txt = s => (s || '').replace(/[\s\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}️‍⃣]+/gu, '');
  const name = e => { if (e.getAttribute('aria-label')) return e.getAttribute('aria-label');
    const lb = e.getAttribute('aria-labelledby'); if (lb) return lb.split(/\s+/).map(id => (document.getElementById(id) || {}).textContent || '').join(' ');
    let t = ''; const walk = n => { for (const c of n.childNodes) { if (c.nodeType === 3) t += c.nodeValue; else if (c.nodeType === 1 && !(c.getAttribute('aria-hidden') === 'true')) { if (c.tagName === 'IMG') t += c.alt || ''; else if (c.tagName === 'svg') t += (c.querySelector('title') || {}).textContent || c.getAttribute('aria-label') || ''; else walk(c); } } };
    walk(e); if (txt(t)) return t;
    if (e.title) return e.title;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) { if (e.id && document.querySelector(`label[for="${e.id}"]`)) return 'label'; if (e.closest('label')) return 'label'; if (e.placeholder) return e.placeholder; if (e.type === 'hidden') return 'hidden'; }
    return ''; };
  const path = e => { let p = ''; for (let x = e, k = 0; x && k < 3 && x !== document.body; x = x.parentElement, k++) p = x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (typeof x.className === 'string' && x.className ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (p ? ' > ' + p : ''); return p; };
  for (const e of document.querySelectorAll('button, a[href], input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])')) {
    if (!vis(e) || hidden(e) || e.disabled && e.tagName !== 'BUTTON') continue; if (!txt(name(e)) && name(e) !== 'label' && name(e) !== 'hidden') out.push(['no name', path(e), (e.textContent || '').trim().slice(0, 12)]); }
  for (const e of document.querySelectorAll('img')) { if (!vis(e) || hidden(e)) continue; if (!e.hasAttribute('alt')) out.push(['img no alt', path(e), '']); }
  const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1;
  for (const k in ids) if (ids[k] > 1) out.push(['duplicate id', '#' + k, ids[k]]);
  if (!document.documentElement.lang) out.push(['html lang missing', 'html', '']);
  if (!document.documentElement.dir) out.push(['html dir missing', 'html', '']);
  return out; }"""
async def main():
    os.makedirs(O, exist_ok=True); found = {}; errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ar'):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
            await pg.goto('file://' + H); await pg.wait_for_timeout(400)
            await pg.click(f'[data-l="{L}"]'); await pg.click('[data-g="se"]'); await pg.click('#guest'); await pg.wait_for_timeout(150)
            await pg.evaluate("S.pro=true;S.music=false;S.qa={'se-fund#0':{n:1,w:1,s:0}};S.mods['se-fund']={L:1,Q:1,T:1,D:1,done:'x',stars:3};save()")
            for r in ROUTES:
                try: await pg.evaluate("try{closeSheet()}catch(e){}"); await pg.evaluate(r); await pg.wait_for_timeout(300)
                except Exception as e: errs.append(r + ' ' + str(e)[:80]); continue
                for kind, path, t in await pg.evaluate(CHECK):
                    found.setdefault((kind, path, str(t)), set()).add(f'{L}:{r[:28]}')
            await pg.close()
        await b.close()
    for (kind, path, t), rs in sorted(found.items()): print(f'{kind:14} {path[-80:]:80} “{t}”  [{", ".join(sorted(rs))[:70]}]')
    json.dump({'issues': len(found), 'errors': errs}, open(os.path.join(O, 'a11y.json'), 'w'))
    print('page errors', errs); print('a11y issues', len(found))
asyncio.run(main())
