"""Content integrity audit: runs inside the built app and checks every data table.
- i18n: same keys in Arabic and English, no empty values, no key left untranslated (identical AR/EN Latin text)
- HSK words: id unique, level 1-6, hanzi/pinyin/Arabic/English/example present, pinyin syllables = characters
- sectors, conversations, culture, recipes, riddles, idioms, tutorials, quests, stories, songs: empty or missing fields
- generic deep scan of all data constants for undefined/'undefined'/NaN/'[object Object]' and lone ar/en pairs
Usage: python3 scripts/audit_content.py /abs/hanzi-path.html"""
import sys, asyncio, json
from playwright.async_api import async_playwright
JS = r"""() => { const out = {}; const add = (k, v) => { (out[k] = out[k] || []).push(v); };
  // i18n symmetry
  const ka = Object.keys(T.ar), ke = Object.keys(T.en);
  ka.filter(k => !(k in T.en)).forEach(k => add('i18n_missing_en', k)); ke.filter(k => !(k in T.ar)).forEach(k => add('i18n_missing_ar', k));
  for (const k of ka) { const a = T.ar[k], e = T.en[k];
    if (a === '' || a == null) add('i18n_empty_ar', k); if (e === '' || e == null) add('i18n_empty_en', k);
    if (typeof a === 'string' && a === e && /[A-Za-z]{4,}/.test(a) && !/^[A-Z0-9 ·.+\-–:/%()!?]+$/.test(a)) add('i18n_ar_is_english', k + ': ' + a.slice(0, 40)); }
  // HSK words
  const ids = new Set(); const isH = c => /[㐀-鿿〇]/.test(c);
  W.forEach(w => { if (ids.has(w.id)) add('word_dup_id', w.id); ids.add(w.id);
    if (!(w.l >= 1 && w.l <= 6)) add('word_level', w.h);
    if (!w.h || !w.p) add('word_hp', w.id);
    if (!w.ar || !(w.ar.length) || !String(w.ar[0]).trim()) add('word_no_ar', w.h);
    if (!w.en || !(w.en.length) || !String(w.en[0]).trim()) add('word_no_en', w.h);
    if (!w.ex || !w.ex.zh || !w.ex.py || !w.ex.ar || !w.ex.en) add('word_no_example', w.h);
    const syl = pySyllables(w.p); const n = [...w.h].filter(isH).length; if (!syl || syl.length !== n) add('word_pinyin_count', w.h + ' ' + w.p);
    if (w.ex && w.ex.zh && !w.ex.zh.includes(w.h) && [...w.h].length > 1) add('word_example_lacks_headword', w.h);
    if (w.ex && !alignPy(w.ex.zh, w.ex.py)) add('example_pinyin_unaligned', w.h + ': ' + w.ex.zh.slice(0, 20)); });
  // sectors
  SECTORS.forEach(s => { if (!s.topics.length) add('sector_no_topics', s.k);
    s.topics.forEach(t => { if (!t._w.length) add('topic_empty', s.k + '/' + (t.k || t.en)); if (!t.ar || !t.en) add('topic_no_name', s.k + '/' + t.k);
      t._w.forEach(w => { const m = secM(s, w); if (!m.ar || !m.en) add('sector_term_no_meaning', s.k + ': ' + w.h); if (!w.p) add('sector_term_no_pinyin', s.k + ': ' + w.h);
        const syl = pySyllables(w.p.replace(/[A-Za-z0-9]+(?![̀-ͯāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüa-z])/g, m2 => /[aeiouü]/i.test(m2) ? m2 : '')); }); }); });
  // conversations
  TALK.forEach(d => d.scenes.forEach(s => { ['ar','en','sa','se','pa','pe','ma','me'].forEach(f => { if (!s[f]) add('talk_scene_field', d.k + '/' + s.k + '.' + f); }); }));
  // generic deep scan of data constants
  const bad = (v) => v === undefined || v === 'undefined' || (typeof v === 'number' && isNaN(v)) || v === '[object Object]' || v === 'null';
  const scan = (name, obj, path, depth) => { if (depth > 7 || obj == null) return; if (typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach((v, i) => { if (bad(v)) add('bad_value', name + path + '[' + i + ']'); else scan(name, v, path + '[' + i + ']', depth + 1); }); return; }
    const ks = Object.keys(obj);
    if ('ar' in obj && 'en' in obj) { const a = obj.ar, e = obj.en; const emp = x => x == null || (typeof x === 'string' && !x.trim()) || (Array.isArray(x) && !x.length);
      if (emp(a) && !emp(e)) add('missing_ar', name + path); if (emp(e) && !emp(a)) add('missing_en', name + path); }
    ks.forEach(k => { const v = obj[k]; if (k.startsWith('_')) return; if (bad(v) && !['undefined'].includes(k)) add('bad_value', name + path + '.' + k); else if (typeof v === 'object') scan(name, v, path + '.' + k, depth + 1); }); };
  const names = ['CULTURE','RECIPES','RIDDLES','IDIOMS','TUTORIALS','QUESTS','QUEST_POOL','STORIES','SONGS','TRACKS','PLAYLISTS','MOODS','GAMES','CODE_UNITS','SECTORS','ACCENTS','TALK','PLACES','NEWS','PLAN','PRICES','RULES7','OLD_SCRIPTS','FONTS','INST_INFO','AMB_LIST','XQ_INFO','TANGRAMS','KL_LEVELS','MJ_LAYOUTS','LEGAL','SEC_LV','HAN_FONTS'];
  names.forEach(n => { let v; try { v = eval(n); } catch (e) { add('const_missing', n); return; } scan(n, v, '', 0); });
  const counts = {}; for (const k in out) counts[k] = out[k].length; return {counts, out: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.slice(0, 12)]))}; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('file://' + sys.argv[1]); await pg.wait_for_timeout(400)
        r = await pg.evaluate(JS)
        print(json.dumps(r['counts'], ensure_ascii=False))
        for k, v in r['out'].items(): print(k, '→', json.dumps(v, ensure_ascii=False)[:600])
        print('errors', errs); await b.close()
asyncio.run(main())
