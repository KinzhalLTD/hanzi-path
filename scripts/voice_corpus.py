"""Voice corpus: every Chinese line Hanzi Path speaks, with a stable id, voice, pack and (for words) numbered pinyin.
Reads the built app (so it sees exactly the data the app ships), writes content/voice/corpus.json, which
scripts/voice_gen.py turns into studio recordings (Google Chirp 3 HD) in Cloud Shell.

  id    voiceKey(v, text) = cyrb53(v + '|' + text without whitespace), base 36. hp/src/voice.js computes the same key
        at runtime, so any speak() call whose text is in the corpus plays the recording.
  v     'n' narrator (male by default, matched to the owner's reference recording), 'p' conversation partner (female)
  pk    pack the clip goes into: h1..h6 (HSK words and examples by level), gram, talk, sec, misc
  py    numbered pinyin for words ("hai2 zi5"); sent as a custom pronunciation so polyphonic characters are read the
        way the app teaches them (行 háng/xíng, 还 hái/huán, 长 cháng/zhǎng …)
Usage: python3 scripts/voice_corpus.py hp/dist/hanzi-path.html   (prints entries, characters per pack)"""
import sys, os, json, re, asyncio, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location('pinyin_check', os.path.join(ROOT, 'scripts', 'pinyin_check.py'))
PC = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(PC)

M32 = 0xFFFFFFFF
def _imul(a, b): return ((a & M32) * (b & M32)) & M32
def cyrb53(s, seed=0):
    """Same as cyrb53 in hp/src/voice.js (iterates UTF-16 code units like String.charCodeAt)."""
    h1, h2 = (0xdeadbeef ^ seed) & M32, (0x41c6ce57 ^ seed) & M32
    b = s.encode('utf-16-le')
    for i in range(0, len(b), 2):
        ch = b[i] | (b[i + 1] << 8)
        h1 = _imul(h1 ^ ch, 2654435761); h2 = _imul(h2 ^ ch, 1597334677)
    h1 = _imul(h1 ^ (h1 >> 16), 2246822507); h1 ^= _imul(h2 ^ (h2 >> 13), 3266489909)
    h2 = _imul(h2 ^ (h2 >> 16), 2246822507); h2 ^= _imul(h1 ^ (h1 >> 13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1 & M32)
def b36(n):
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; o = ''
    while True:
        n, r = divmod(n, 36); o = d[r] + o
        if not n: return o
def norm(t): return re.sub(r'[\s·・]+', '', t)
def voice_key(v, t, py=None): return b36(cyrb53(v + '|' + norm(t) + ('#' + py if py else '')))

HAN = re.compile(r'[㐀-鿿]')
OK = re.compile(r'^[㐀-鿿　-〿！-～0-9％%·…—“”‘’、\s]+$')   # Chinese text with Chinese punctuation only
CH_OK = OK.pattern[2:-3]   # the allowed character class without brackets
def speakable(t):   # Chinese, or a term with a short Latin part (Y型过滤器, C35混凝土), never code
    if not t or not HAN.search(t) or len(t) > 90: return False
    if OK.match(t): return True
    rest = re.sub('[' + CH_OK + ']', '', t)
    return bool(re.fullmatch(r'[A-Za-z0-9]*', rest)) and len(HAN.findall(t)) >= 2 and all(len(x) <= 4 for x in re.findall(r'[A-Za-z]+', t))
def numbered(zh, py):
    """'xuésheng' for 学生 -> 'xue2 sheng5'; None when syllables don't line up one-to-one with characters."""
    if not py: return None
    syl, bad = PC.syllables(py)
    n = len(HAN.findall(zh))
    if bad or not syl or len(syl) != n or n != len(zh) or 'r' in syl: return None
    return ' '.join(PC.plain(s) + str(PC.tone(s)) for s in syl)

JS = r"""() => { const out = []; const add = (t, v, pk, py, src) => { if (typeof t === 'string') out.push([t.trim(), v, pk, py || '', src]); };
  W.slice().sort((a, b) => a.l - b.l).forEach(w => { add(w.h, 'n', 'h' + w.l, w.p, 'word'); });
  W.slice().sort((a, b) => a.l - b.l).forEach(w => { if (w.ex) add(w.ex.zh, 'n', 'h' + w.l, '', 'example'); (w.mw || []).forEach(x => add(x, 'n', 'h' + w.l, '', 'mw')); });
  try { GR().forEach(p => { p.ex.forEach(e => add(e[0], 'n', 'gram', '', 'grammar')); p.err.forEach(e => add(e[1], 'n', 'gram', '', 'grammar-right')); p.mk.forEach(m => add(m, 'n', 'gram', '', 'marker')); }); } catch (e) {}
  TALK.forEach(d => { add(d.zh, 'n', 'talk', '', 'talk-title'); d.scenes.forEach(s => { add(s.zh, 'n', 'talk', '', 'scene'); if (s.pz) add(s.pz, 'n', 'talk', '', 'partner-name');
    s.turns.forEach(tn => { if (tn.p) { add(tn.p[0], 'p', 'talk', '', 'partner'); add(tn.p[0], 'n', 'talk', '', 'partner-n'); } (tn.o || []).forEach(o => add(o.zh, 'n', 'talk', '', 'reply')); }); }); });
  SECTORS.forEach(s => { add(s.zh, 'n', 'sec', '', 'sector'); s.topics.forEach(tp => { add(tp.zh, 'n', 'sec', '', 'topic'); (tp._w || []).forEach(w => { add(w.h, 'n', 'sec', w.p, 'term'); if (w.ex) add(w.ex.zh, 'n', 'sec', '', 'term-ex'); }); });
    (s.ex || []).forEach(e => add(Array.isArray(e) ? e[0] : e.zh, 'n', 'sec', '', 'sec-ex')); });
  try { for (const k in FEST) { add(FEST[k].g[0], 'n', 'misc', '', 'festival'); FEST[k].w.forEach(w => add(w[0], 'n', 'misc', '', 'festival')); } } catch (e) {}
  add(typeof VOICE_TEST==='string'?VOICE_TEST:'你好！我们一起学习中文吧。', 'n', 'misc', '', 'settings');
  try { for (const side of ['r', 'b']) for (const k in XQ_CH[side]) out.push([XQ_CH[side][k], 'n', 'misc', XQ_PY[k][side], 'xiangqi', 1]); } catch (e) {}
  try { IDIOMS.forEach(x => Array.isArray(x) ? add(x[0], 'n', 'misc', x[1], 'idiom') : add(x.h, 'n', 'misc', x.p, 'idiom')); } catch (e) {}
  // generic sweep of the remaining data tables (culture, recipes, places, stories, riddles, code units …)
  const seen = new WeakSet(); const sweep = (o, d) => { if (o == null || d > 9) return; if (typeof o === 'string') { add(o, 'n', 'misc', '', 'sweep'); return; }
    if (typeof o !== 'object' || seen.has(o)) return; seen.add(o); for (const k in o) { if (k === 'py' || k === 'p' || k === 'en' || k === 'ar') continue; sweep(o[k], d + 1); } };
  ['CULTURE', 'RECIPES', 'RIDDLES', 'STORIES', 'PLACES', 'RULES7', 'OLD_SCRIPTS', 'GAMES', 'CODE_UNITS', 'QUESTS', 'QUEST_POOL', 'NEWS', 'XQ_INFO', 'PLAN'].forEach(n => { try { sweep(eval(n), 0); } catch (e) {} });
  return out; }"""

async def collect(html):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto('file://' + os.path.abspath(html)); await pg.wait_for_timeout(600)
        rows = await pg.evaluate(JS)
        js_ids = await pg.evaluate("(x)=>x.map(([v,t])=>voiceKey(v,t))", [[r[1], r[0]] for r in rows[:400]]) if await pg.evaluate("typeof voiceKey==='function'") else None
        alt = [r for r in rows if len(r) > 5][:5]
        if alt and js_ids:
            ja = await pg.evaluate("(x)=>x.map(([v,t,p])=>voiceKey(v,t,p))", [[r[1], r[0], r[3]] for r in alt])
            if any(voice_key(r[1], r[0], r[3]) != j for r, j in zip(alt, ja)): sys.exit('hash mismatch for reading-specific keys')
        await b.close()
    return rows, js_ids

def main():
    html = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'hp', 'dist', 'hanzi-path.html')
    rows, js_ids = asyncio.run(collect(html))
    if js_ids:   # the runtime hash must match this one exactly
        bad = [i for i, (r, j) in enumerate(zip(rows[:400], js_ids)) if voice_key(r[1], r[0]) != j]
        if bad: sys.exit(f'hash mismatch between Python and JS for {len(bad)} rows, first: {rows[bad[0]][:2]}')
    out, seen = [], {}
    for row in rows:
        t, v, pk, py, src = row[:5]; alt = len(row) > 5
        if not speakable(t): continue
        if alt:   # a reading-specific recording: key includes the reading, py is already numbered
            k = voice_key(v, t, py)
            if k not in seen: seen[k] = {'id': k, 'v': v, 't': t, 'pk': pk, 'src': src, 'py': py}; out.append(seen[k])
            continue
        k = voice_key(v, t)
        if k in seen:
            e = seen[k]
            if not e.get('py') and py: e['py'] = numbered(t, py) or e.get('py')
            continue
        e = {'id': k, 'v': v, 't': t, 'pk': pk, 'src': src}
        np = numbered(t, py) if py and len(t) <= 6 else None
        if np: e['py'] = np
        seen[k] = e; out.append(e)
    for e in out:
        if not e.get('py'): e.pop('py', None)
    os.makedirs(os.path.join(ROOT, 'content', 'voice'), exist_ok=True)
    json.dump(out, open(os.path.join(ROOT, 'content', 'voice', 'corpus.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    by = {}
    for e in out: d = by.setdefault(e['pk'], [0, 0]); d[0] += 1; d[1] += len(e['t'])
    print('entries', len(out), 'characters', sum(len(e['t']) for e in out), 'with pinyin', sum(1 for e in out if 'py' in e), 'hash check', 'ok' if js_ids else 'skipped (voice.js not built yet)')
    for k in sorted(by): print(f'  {k:5} {by[k][0]:6} clips {by[k][1]:7} chars')

if __name__ == '__main__': main()
