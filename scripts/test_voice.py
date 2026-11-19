"""Voice test: studio clips through a stand-in for the iPhone bridge (answers 'voice' from voice packs the way
mobile/src/voice.js does), the conversation cast and the phone-voice fallback.
Checks: every corpus line's key exists in the packs, the narrator opens a conversation scene, the partner speaks with the
scene's cast voice (SCENE_CAST), the learner reply uses the learner voice, module dialogues use their cast pair, and
lines without a clip fall back to 'speak' with the same cast id.
Usage: python3 scripts/test_voice.py HTML OUT [PACK_ROOT]   (PACK_ROOT holds mobile/assets/voice and content/voice;
       default = this repo; test packs can be made with voice_gen.py against a fake API, see docs/VOICE.md)"""
import sys, os, json, base64, asyncio
from playwright.async_api import async_playwright
H, O = sys.argv[1], sys.argv[2]; R = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ix_path = os.path.join(R, 'mobile', 'assets', 'voice', 'index.json')
idx = json.load(open(ix_path)) if os.path.exists(ix_path) else {'packs': [], 'e': {}}
corpus = json.load(open(os.path.join(R, 'content', 'voice', 'corpus.json'), encoding='utf-8'))
packs = {p: open(os.path.join(R, 'mobile', 'assets', 'voice', p + '.bin'), 'rb').read() for p in idx['packs']}
clips = {k: base64.b64encode(packs[idx['packs'][p]][o:o + l]).decode() for k, (p, o, l) in idx['e'].items()}
BRIDGE = """(clips)=>{ window.__log=[]; window.__played=[];
  window.ReactNativeWebView={ postMessage(s){ const m=JSON.parse(s); if(['voice','speak','voiceInfo'].includes(m.type)) __log.push(m.type+':'+(m.voice||m.k||''));
    const reply=r=>setTimeout(()=>window.__fromNative(Object.assign({id:m.id},r)),5);
    if(m.type==='voiceInfo') reply({ok:true,clips:Object.keys(clips).length});
    else if(m.type==='voice') reply(clips[m.k]?{ok:true,b64:clips[m.k]}:{ok:false,miss:true});
    else if(m.id) reply({ok:true}); } };
  const play=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){ __played.push(this.playbackRate); this.muted=true; return play.call(this); }; }"""
async def main():
    errs = []
    if idx['e']:
        miss = [e for e in corpus if e['id'] not in idx['e']]
        if miss: errs.append(f'{len(miss)} corpus lines have no clip, first: {miss[0]["t"]}')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.add_init_script(f"({BRIDGE})({json.dumps(clips)})")
        await pg.goto('file://' + os.path.abspath(H)); await pg.wait_for_timeout(400)
        await pg.click('[data-l="en"]'); await pg.click('[data-g="se"]'); await pg.click('#guest'); await pg.wait_for_timeout(200)
        await pg.evaluate("S.pro=true; S.music=false; save()")
        # conversation: narrator, partner cast voice, learner voice
        sc = await pg.evaluate("(()=>{ const d=TALK.find(x=>x.k==='sec'), s=d.scenes[2]; return {title:s.zh, p:s.turns[0].p[0], a:s.turns[0].o.find(o=>o.t==='A').zh, pv:SCENE_CAST['sec/'+s.k]}; })()")
        keys = await pg.evaluate("(x)=>({t:voiceKey('n',x.title), p:voiceKey(x.pv,x.p), a:voiceKey('n',x.a), af:voiceKey('f3',x.a)})", sc)
        await pg.evaluate("__log.length=0; go('talkscene',{d:'sec',i:2})"); await pg.wait_for_timeout(4500)
        log = await pg.evaluate("__log")
        if sc['pv'] != 'f1': errs.append(f'audit scene should be voiced by f1, got {sc["pv"]}')
        for what, k in (('narrator scene title', keys['t']), ('partner line in cast voice', keys['p'])):
            if not any(k in x for x in log) and not any(x == 'speak:' + (sc['pv'] if 'partner' in what else 'n') for x in log): errs.append(f'{what} not requested: {log[:6]}')
        await pg.locator('.tkopt').first.wait_for(timeout=8000)
        await pg.evaluate("__log.length=0"); await pg.locator('.tkopt:has(.han)').filter(has_text=sc['a']).first.click(); await pg.wait_for_timeout(800)
        log2 = await pg.evaluate("__log")
        if not any(keys['a'] in x or x == 'speak:n' for x in log2): errs.append(f'learner reply not spoken with the learner voice: {log2}')
        await pg.evaluate("S.myVoice='f'; save()")
        fv = await pg.evaluate("myVoice()");
        if fv != 'f3': errs.append('female learner voice should be f3')
        # module dialogue cast
        pair = await pg.evaluate("[dlgVoice(MOD['se-ds'].i,'A'), dlgVoice(MOD['se-ds'].i,'B')]")
        if pair[0] == pair[1]: errs.append(f'dialogue pair uses one voice {pair}')
        await pg.evaluate("__log.length=0; dialogSheet(MOD['se-ds'])"); await pg.click('.sheet #pa'); await pg.wait_for_timeout(5000)
        log3 = await pg.evaluate("__log")
        want = await pg.evaluate("(()=>{ const x=MOD['se-ds']; return x.D.slice(0,2).map(d=>voiceKey(dlgVoice(x.i,d.s),d.zh)); })()")
        if clips and not all(any(k in x for x in log3) for k in want): errs.append(f'dialogue lines not requested with their cast voices: {log3[:6]}')
        played = await pg.evaluate("__played.length")
        if clips and not played: errs.append('no studio clip played')
        await pg.screenshot(path=os.path.join(O, 'voice_talk.png'))
        await b.close()
    print('clips', len(clips), 'errors', errs)
os.makedirs(O, exist_ok=True); asyncio.run(main())
