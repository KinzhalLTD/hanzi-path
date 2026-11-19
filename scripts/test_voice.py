"""Voice test: studio clips through a stand-in for the iPhone bridge, plus the phone-voice fallback.
The stand-in answers 'voice' from real voice packs (mobile/assets/voice or a test pack made by voice_gen.py) the same
way mobile/src/voice.js does, so keys, offsets, MP3 decoding, speeds, partner voice and stop are all exercised.
Usage: python3 scripts/test_voice.py HTML OUT [PACK_ROOT]   (PACK_ROOT holds mobile/assets/voice and content/voice)"""
import sys, os, json, base64, asyncio
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]; R = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx = json.load(open(os.path.join(R, 'mobile', 'assets', 'voice', 'index.json'))) if os.path.exists(os.path.join(R, 'mobile', 'assets', 'voice', 'index.json')) else {'packs': [], 'e': {}}
corpus = {e['id']: e for e in json.load(open(os.path.join(R, 'content', 'voice', 'corpus.json'), encoding='utf-8'))}
packs = {p: open(os.path.join(R, 'mobile', 'assets', 'voice', p + '.bin'), 'rb').read() for p in idx['packs']}
clips = {k: base64.b64encode(packs[idx['packs'][p]][o:o + l]).decode() for k, (p, o, l) in list(idx['e'].items())[:400]}
BRIDGE = """(clips)=>{ window.__log=[]; window.__played=[];
  window.ReactNativeWebView={ postMessage(s){ const m=JSON.parse(s); __log.push(m.type+(m.voice?':'+m.voice:'')+(m.k?':'+m.k:''));
    const reply=r=>setTimeout(()=>window.__fromNative(Object.assign({id:m.id},r)),5);
    if(m.type==='voiceInfo') reply({ok:true,clips:Object.keys(clips).length});
    else if(m.type==='voice') reply(clips[m.k]?{ok:true,b64:clips[m.k]}:{ok:false,miss:true});
    else if(m.type==='speak') reply({ok:true});
    else if(m.id) reply({ok:true}); } };
  const play=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){ __played.push({rate:this.playbackRate,pitch:this.preservesPitch}); this.muted=true; return play.call(this); }; }"""
async def main():
    errs = []
    sample = [(corpus[k]['t'], corpus[k]['v']) for k in clips if k in corpus][:12]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.add_init_script(f"({BRIDGE})({json.dumps(clips)})")
        await pg.goto('file://' + H); await pg.wait_for_timeout(400)
        await pg.click('.lang button[data-l="ar"]')
        if await pg.locator('#onew').count(): await pg.click('#onew')
        await pg.evaluate("S.sound=true;save()")
        # 1 every sampled studio line plays from its clip, decodes and finishes
        for t, v in sample:
            r = await pg.evaluate("""async([t,v])=>{ __log.length=0; __played.length=0; const t0=performance.now(); await say(t,{voice:v}); return {ms:performance.now()-t0, log:__log.slice(), played:__played.length, key:voiceKey(v,t)}; }""", [t, v])
            if r['played'] != 1 or any(x.startswith('speak') for x in r['log']): errs.append(f'studio clip not used for {t[:12]} ({v}): {r}')
        print('studio lines played', len(sample))
        # 2 decoding: the clip really is audio with a duration
        d = await pg.evaluate("""async(t)=>{ const u=await studioClip('n',t); const a=new Audio(u); await new Promise(r=>{a.onloadedmetadata=r; a.onerror=r; a.load();}); return a.duration; }""", sample[0][0])
        print('decoded duration', d)
        if not d or d != d or d <= 0: errs.append('clip does not decode as audio')
        # 3 speeds: slow plays at 0.72 with pitch kept
        await pg.evaluate("S.vSpeed='slow'"); r = await pg.evaluate("async(t)=>{ __played.length=0; await say(t); return __played[0]; }", sample[0][0])
        if not r or abs(r['rate'] - .72) > .01 or not r['pitch']: errs.append(f'slow speed wrong: {r}')
        await pg.evaluate("S.vSpeed='normal'")
        # 4 a line with no clip falls back to the phone voice, with the partner voice flag
        r = await pg.evaluate("async()=>{ __log.length=0; await say('这句话没有录音。',{voice:'p'}); return __log.slice(); }")
        if not any(x == 'speak:p' for x in r): errs.append(f'fallback did not ask the phone voice for the partner voice: {r}')
        # 5 stop cuts a playing clip and resolves the promise
        r = await pg.evaluate("async(t)=>{ const p=say(t); setTimeout(stopVoice,30); const t0=performance.now(); await p; return performance.now()-t0; }", sample[-1][0])
        if r > 1500: errs.append(f'stop did not end playback quickly ({r:.0f} ms)')
        # 6 sound off: silent
        r = await pg.evaluate("async(t)=>{ S.sound=false; __log.length=0; await say(t); S.sound=true; return __log.length; }", sample[0][0])
        if r: errs.append('spoke with sound off')
        # 7 conversation: partner lines use the male voice
        await pg.evaluate("__log.length=0; go('talkscene',{d:'eng',i:0})"); await pg.wait_for_timeout(600)
        for _ in range(3):   # start the conversation if it waits for a tap, then let the partner speak
            st = pg.locator('.screen button.btn:visible').first
            if await pg.evaluate("__log.some(x=>x.startsWith('voice')||x.startsWith('speak'))"): break
            if await st.count(): await st.click(); await pg.wait_for_timeout(1500)
        lg = await pg.evaluate("__log.slice()")
        if not any(x.startswith('voice') or x == 'speak:p' for x in lg): errs.append(f'conversation partner did not speak: {lg[:6]}')
        # 7b karaoke: words of the sentence on screen light up while it plays
        await pg.evaluate("go('gpoint',{k:'g1-shi'})"); await pg.wait_for_timeout(300)
        on = await pg.evaluate("async()=>{ const p=say('我是学生。'); let n=0; for(let i=0;i<12;i++){ await new Promise(r=>setTimeout(r,60)); n=Math.max(n,document.querySelectorAll('.tok.say-on').length); } await p; return [n, document.querySelectorAll('.tok.say-on').length]; }")
        if on[0] != 1 or on[1] != 0: errs.append(f'karaoke highlight wrong: max lit {on[0]}, left lit {on[1]}')
        # 7c chess: reading-specific key (车 as jū) differs from the plain word key
        kk = await pg.evaluate("[voiceKey('n','车'), voiceKey('n','车','ju1'), voiceKey('n','夏 · 商'), voiceKey('n','夏商')]")
        if kk[0] == kk[1] or kk[2] != kk[3]: errs.append(f'voice keys wrong: {kk}')
        # 8 settings: voice speed + status + test button
        await pg.evaluate("go('me')"); await pg.wait_for_timeout(500)
        st = await pg.evaluate("(document.querySelector('#vst')||{}).textContent||''")
        print('settings status', st)
        if not st or '·' not in st: errs.append('voice status missing in settings')
        await pg.locator('#vsp button[data-v="slow"]').click(); await pg.wait_for_timeout(150)
        if await pg.evaluate("S.vSpeed") != 'slow': errs.append('speed setting not saved')
        await pg.screenshot(path=os.path.join(O, 'voice_settings.png'))
        # 9 browser (no bridge): fallback uses speechSynthesis without errors
        pg2 = await b.new_page(); pg2.on('pageerror', lambda e: errs.append('web: ' + str(e)[:200]))
        await pg2.goto('file://' + H); await pg2.wait_for_timeout(300); await pg2.click('.lang button[data-l="en"]')
        if await pg2.locator('#onew').count(): await pg2.click('#onew')
        await pg2.evaluate("S.sound=true; Promise.race([say('你好',{voice:'p'}), new Promise(r=>setTimeout(r,2500))])")
        await b.close()
    print('errors', errs)
asyncio.run(main())
