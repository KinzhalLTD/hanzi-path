"""Layout audit: opens every screen and sheet in Arabic and English at iPhone sizes and reports
clipped text, horizontal overflow, elements outside the screen, tiny tap targets and overlaps with the tab bar.
Usage: [FS=1.3] python3 scripts/audit_layout.py /abs/path/cipher-path.html [shots_dir]   (FS = in-app text size to test)
"""
import os, sys, asyncio, json, os
from playwright.async_api import async_playwright

SIZES = [(375, 560), (390, 680), (430, 780), (390, 844)]   # SE / 15 / Pro Max inside the app viewer (top bar), full-screen 15
SCREENS = ["go('home')", "go('learn')", "go('track','se')", "go('track','cy')", "go('module','se-fund')", "go('module','cy-eh')", "go('lesson',{k:'se-fund',i:0})", "go('lesson',{k:'se-ops',i:1})", "go('lesson',{k:'se-ops',i:1,s:-2})", "go('lesson',{k:'cy-eh',i:4,s:-1})", "S.lq['cy-iam#2']=1;go('lesson',{k:'cy-iam',i:2,s:-1})",
  "go('lesson',{k:'cy-grc',i:2})", "go('quizrun',{k:'cy-net'})", "go('exam','cy')", "go('labs')", "go('codelab','sum')", "go('codelab','jwt')", "go('seclab',{lab:'phish',i:2})", "go('seclab',{lab:'logs',i:5})",
  "go('seclab',{lab:'review',i:8})", "go('ctflab',{i:9})", "go('fwlab',{lv:3})", "go('pwlab')", "go('daily')", "go('zh')", "go('terms')", "go('terms',{k:'cy-soc'})", "go('practice',{k:'se-db'})",
  "go('talk')", "go('talkscene',{d:'sec',i:3})", "go('game','sprint')", "go('game','bits')", "go('game','ports')", "go('me')"]
SHEETS = ["go('home');hongbaoSheet()", "go('home');fortuneSheet()", "go('me');shop()", "go('me');paywall()", "go('module','cy-ir');dialogSheet(MOD['cy-ir'])", "go('terms');termSheet(TERMS[42])", "go('module','se-fund');moduleDone(MOD['se-fund'])"]

JS = r"""() => {
  const vw = innerWidth, vh = innerHeight, out = [];
  const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
  const txt = el => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 50);
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const inScrollX = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true; } return false; };
  const sw = document.scrollingElement.scrollWidth;
  if (sw > vw + 1) out.push(['page-hscroll', 'page', `scrollWidth ${sw} > ${vw}`]);
  const root = document.querySelector('.sheet') || document.getElementById('app');
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el) || el.closest('svg') || el.tagName === 'CANVAS') continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    // clipped content: overflow hidden/clip and content taller/wider than box, not an intended line clamp/ellipsis/marquee
    const oy = cs.overflowY, ox = cs.overflowX;
    const clampy = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    if ((oy === 'hidden' || oy === 'clip') && !clampy && el.scrollHeight > el.clientHeight + 3 && txt(el) && el.clientHeight > 0) {
      // ignore decorative absolutely-positioned overflow (glows, seals): only flag if a text node child is cut
      let cut = false;
      const box = el.getBoundingClientRect();
      for (const t of el.querySelectorAll('*')) { if (!t.childNodes.length) continue; const has = [...t.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!has) continue; const tr = t.getBoundingClientRect(); if (tr.height && tr.bottom > box.bottom + 2 && getComputedStyle(t).position !== 'absolute') { cut = true; break; } }
      if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && el.scrollHeight > el.clientHeight + 3) cut = true;
      if (cut) out.push(['clipped-y', name(el), `${el.scrollHeight}>${el.clientHeight} “${txt(el)}”`]);
    }
    if ((ox === 'hidden' || ox === 'clip') && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 3 && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      out.push(['clipped-x', name(el), `${el.scrollWidth}>${el.clientWidth} “${txt(el)}”`]);
    // off-screen horizontally (not inside a horizontal scroller)
    if ((r.right > vw + 1 || r.left < -1) && cs.position !== 'fixed' && !inScrollX(el) && r.width < vw * 3)
      out.push(['offscreen-x', name(el), `${Math.round(r.left)}..${Math.round(r.right)} “${txt(el)}”`]);
    // tap targets
    // an absolutely positioned ::after with negative insets enlarges the touch area without moving the layout
    const pa = getComputedStyle(el, '::after'), ext = pa.position === 'absolute' && pa.content !== 'none' ? k => Math.max(0, -parseFloat(pa[k]) || 0) : () => 0;
    const tw = r.width + ext('left') + ext('right'), th = r.height + ext('top') + ext('bottom');
    if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.tagName === 'A') && (tw < 30 || th < 30) && !el.closest('.seg-sent') && !el.classList.contains('tok'))
      out.push(['small-tap', name(el), `${Math.round(r.width)}x${Math.round(r.height)} “${txt(el)}”`]);
  }
  // text overflowing its button (single-line labels pushed out)
  for (const b of root.querySelectorAll('button,.chip,.btn')) {
    if (!visible(b)) continue; const r = b.getBoundingClientRect();
    for (const c of b.children) { const cr = c.getBoundingClientRect(); if (cr.width && (cr.right > r.right + 2 || cr.left < r.left - 2) && getComputedStyle(c).position !== 'absolute') { out.push(['child-outside-button', name(b), `“${txt(b)}”`]); break; } }
  }
  // sheet must fit: content scrolls inside it
  const sh = document.querySelector('.sheet>div');
  if (sh) { const r = sh.getBoundingClientRect(); if (r.top < 0) out.push(['sheet-top', 'sheet', `top ${Math.round(r.top)}`]); }
  return out;
}"""

async def main():
  path = sys.argv[1]; shots = sys.argv[2] if len(sys.argv) > 2 else None
  if shots: os.makedirs(shots, exist_ok=True)
  report = {}; errs = []
  async with async_playwright() as p:
    b = await p.chromium.launch()
    for (w, h) in SIZES:
      for lang in ['ar', 'en']:
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True, is_mobile=True)
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('file://' + path); await pg.wait_for_timeout(300)
        await pg.click(f'[data-l="{lang}"]'); await pg.click('[data-g="se"]'); await pg.wait_for_timeout(200)
        await pg.evaluate("S.pro=true;S.coins=999;S.music=false;S.fs=" + os.environ.get('FS', '1') + ";save&&save();typeof applyTextSize==='function'&&applyTextSize()")
        for i, st in enumerate(SCREENS + SHEETS):
          try:
            await pg.evaluate(st); await pg.wait_for_timeout(350)
            if 'tutorial' not in st and await pg.locator('.sheet #ok').count() and st.startswith("go('game'"):
              await pg.click('.sheet #ok'); await pg.wait_for_timeout(300)
            res = await pg.evaluate(JS)
          except Exception as e:
            res = [['script-error', st, str(e)[:160]]]
          for kind, el, info in res:
            key = (kind, st, el)
            report.setdefault(key, {'info': info, 'where': []})['where'].append(f'{lang}{w}')
          if shots and (w, h) == (390, 680): await pg.screenshot(path=f'{shots}/{lang}_{i:02d}.png')
          await pg.evaluate("closeSheet&&closeSheet()")
        await pg.close()
    await b.close()
  ignore = {'small-tap'} if '--no-tap' in sys.argv else set()
  rows = [(k, v) for k, v in report.items() if k[0] not in ignore]
  for (kind, st, el), v in sorted(rows):
    print(f'{kind:22} {st[:46]:46} {el[:38]:38} {v["info"][:70]}  [{",".join(sorted(set(v["where"])))[:40]}]')
  print('issues', len(rows))
  print('errors', sorted(set(errs)))

asyncio.run(main())
