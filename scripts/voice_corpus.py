"""Voice corpus: every Chinese line Cipher Path speaks, with a stable id, voice, pack and (for words) numbered pinyin.
Reads the built app (so it sees exactly the data the app ships), writes content/voice/corpus.json, which
scripts/voice_gen.py turns into studio recordings (Google Chirp 3 HD) in Cloud Shell.

  id    voiceKey(v, text) = cyrb53(v + '|' + text without whitespace), base 36. cp/src/voice.js computes the same key
        at runtime, so any speak() call whose text is in the corpus plays the recording.
  v     'n' narrator, 'p' partner, and the cast m1-m5 / f1-f3 (VOICE_CAST in cp/src/voice.js): every conversation partner
        and module-dialogue speaker has a voice of their own; learner replies are recorded in 'n' and 'f3'
  pk    pack the clip goes into: terms, dlg, talk, misc
  py    numbered pinyin for words ("hai2 zi5"); sent as a custom pronunciation so polyphonic characters are read the
        way the app teaches them (行 háng/xíng, 还 hái/huán, 长 cháng/zhǎng …)
Usage: python3 scripts/voice_corpus.py cp/dist/cipher-path.html   (prints entries, characters per pack)"""
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
  // Chinese terms of every module, their example sentences (term card) and the module titles: narrator
  MODS.forEach(m => { add(m.zh, 'n', 'terms', m.py, 'module'); m.T.forEach(w => add(w.h, 'n', 'terms', w.p, 'term')); });
  // module dialogues: each module has its own pair of cast voices (dlgVoice); the term card replays lines with the narrator
  MODS.forEach((m, i) => m.D.forEach(d => { add(d.zh, dlgVoice(i, d.s), 'dlg', '', 'dialogue'); add(d.zh, 'n', 'dlg', '', 'term-example'); }));
  // conversations: the narrator announces the scene, the partner has a cast voice, the learner's replies in both learner voices
  TALK.forEach(d => d.scenes.forEach(s => { add(s.zh, 'n', 'talk', '', 'scene'); const pv = SCENE_CAST[d.k + '/' + s.k] || 'p';
    s.turns.forEach(tn => { if (tn.p) add(tn.p[0], pv, 'talk', '', 'partner'); (tn.o || []).filter(o => o.t === 'A').forEach(o => { add(o.zh, 'n', 'talk', '', 'reply'); add(o.zh, 'f3', 'talk', '', 'reply-f'); }); }); }));
  CODE_LABS.forEach(l => add(l.zh, 'n', 'misc', '', 'lab'));
  add('网络安全', 'n', 'misc', '', 'settings'); add('你好，我是新来的工程师。', 'n', 'misc', '', 'settings'); add('你好，我是新来的工程师。', 'f3', 'misc', '', 'settings');
  add(typeof VOICE_TEST === 'string' ? VOICE_TEST : '你好！我们一起学习中文吧。', 'n', 'misc', '', 'settings');
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
    html = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'cp', 'dist', 'cipher-path.html')
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
