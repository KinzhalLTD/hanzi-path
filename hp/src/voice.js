/* ===== Voice: studio recordings first, the best phone voice as fallback =====
   Studio clips (Google Chirp 3 HD, recorded by scripts/voice_gen.py) ship inside the iPhone app in voice packs.
   Every spoken line is looked up by voiceKey(voice, text) (same cyrb53 hash as scripts/voice_corpus.py); the native
   side returns the clip bytes and it plays here with pitch-preserving speed control. Lines without a clip, and the
   browser version, use the best installed system voice (premium/enhanced first; a male voice for 'm' when there is one).
   say(text,{voice:'f'|'m', rate, lang}) returns a promise that settles when the line has finished (or was cut off),
   so conversations can play turn by turn. Speeds: S.vSpeed = 'slow' | 'normal' (default) | 'fast'. */
function cyrb53(str,seed=0){ let h1=0xdeadbeef^seed, h2=0x41c6ce57^seed;
  for(let i=0,ch;i<str.length;i++){ ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
  h1=Math.imul(h1^(h1>>>16),2246822507); h1^=Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507); h2^=Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0); }
const voiceKey=(v,t,py)=>cyrb53(v+'|'+String(t).replace(/[\s·・]+/g,'')+(py?'#'+py:'')).toString(36);   // py: a reading-specific recording (车 'ju1')
const VOICE={cache:new Map(), cur:null, gen:0, studio:null, clips:0, web:{}};
const vSpeedMul=()=>S.vSpeed==='slow'?0.72:S.vSpeed==='fast'?1.15:1;
async function voiceInfo(){ if(!RN) return {studio:false,clips:0}; if(VOICE.studio!==null) return {studio:VOICE.studio,clips:VOICE.clips};
  const r=await native('voiceInfo',{}); VOICE.studio=!!(r&&r.ok&&r.clips>0); VOICE.clips=(r&&r.clips)||0; return {studio:VOICE.studio,clips:VOICE.clips}; }
async function studioClip(v,text,py){ if(!RN||VOICE.studio===false) return null; const k=voiceKey(v,text,py);
  if(VOICE.cache.has(k)){ const u=VOICE.cache.get(k); VOICE.cache.delete(k); VOICE.cache.set(k,u); return u; }
  const r=await native('voice',{k}); if(!r||r.unsupported){ VOICE.studio=false; return null; } if(!r.b64) return null;
  const bin=atob(r.b64), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u8],{type:'audio/mpeg'})); VOICE.cache.set(k,url);
  if(VOICE.cache.size>80){ const [ok,ou]=VOICE.cache.entries().next().value; VOICE.cache.delete(ok); try{URL.revokeObjectURL(ou);}catch(e){} }
  return url; }
/* best browser voice per language (and a male one for 'm' when installed) */
const VOICE_MALE=/(yunxi|yunyang|yunjian|kangkang|li-?mu|male|男|maged|hamed|shakir|tarik|daniel|aaron|arthur|fred|guy|david|mark|alex|tom)/i;
function webVoice(lang,male){ try{ const vs=speechSynthesis.getVoices(); if(!vs.length) return null; const key=lang+(male?'m':'f'); if(VOICE.web[key]!==undefined) return VOICE.web[key];
  const L=lang.toLowerCase(), base=L.split('-')[0]; let pool=vs.filter(v=>v.lang.toLowerCase().replace('_','-')===L); if(!pool.length) pool=vs.filter(v=>v.lang.toLowerCase().startsWith(base));
  if(base==='zh') pool=pool.filter(v=>!/hk|tw|yue|cantonese|粤/i.test(v.lang+v.name)).concat(pool.filter(v=>/tw/i.test(v.lang))).filter((v,i,a)=>a.indexOf(v)===i);
  const sc=v=>(/premium|neural|natural|enhanced|online|xiaoxiao|xiaoyi|yunxi|tingting|lili|google/i.test(v.name)?6:0)+(/premium|neural|natural/i.test(v.name)?4:0)+(v.localService?1:0)+(male?(VOICE_MALE.test(v.name)?8:0):(VOICE_MALE.test(v.name)?-8:0));
  return VOICE.web[key]=pool.sort((a,b)=>sc(b)-sc(a))[0]||null; }catch(e){ return null; } }
try{ speechSynthesis.onvoiceschanged=()=>{ VOICE.web={}; }; }catch(e){}
function ttsSay(text,{voice='f',rate=.8,lang='zh-CN'}={}){ const r=Math.max(.35,Math.min(1.4,rate*vSpeedMul()));
  if(RN) return native('speak',{text,lang,rate:r,voice}).then(()=>{});
  return new Promise(res=>{ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=r;
      const wv=webVoice(lang,voice==='m'); if(wv) u.voice=wv; if(voice==='m'&&!(wv&&VOICE_MALE.test(wv.name))) u.pitch=.82;
      u.onend=u.onerror=()=>res(); speechSynthesis.speak(u); setTimeout(res,1500+[...text].length*450/r); }catch(e){ res(); } }); }
function stopVoice(){ VOICE.gen++; if(VOICE.cur){ try{ VOICE.cur.pause(); }catch(e){} VOICE.cur=null; }
  try{ if(RN) RN.postMessage(JSON.stringify({type:'speakStop'})); else speechSynthesis.cancel(); }catch(e){} }
function say(text,o={}){ if(!S.sound||!text) return Promise.resolve(); text=String(text).trim(); if(!text) return Promise.resolve();
  const v=o.voice||'f', lang=o.lang||'zh-CN', rate=o.rate||.8, g=++VOICE.gen;
  if(VOICE.cur){ try{ VOICE.cur.pause(); }catch(e){} VOICE.cur=null; }
  return (async()=>{ const url=lang==='zh-CN'?await studioClip(v,text,o.py):null;   // studio = Mandarin; regional voices (zh-HK, zh-TW) stay on the phone if(g!==VOICE.gen) return;
    const el=lang.startsWith('zh')?sayTarget(text,o.hl):null; let unhl=()=>{};
    if(url){ const a=new Audio(url); a.preservesPitch=true; a.webkitPreservesPitch=true; a.playbackRate=Math.max(.5,Math.min(1.5,vSpeedMul()*rate/.8));
      VOICE.cur=a; a.onloadedmetadata=()=>{ const s=(a.duration||2)/a.playbackRate; try{ musDuck(s+.4); }catch(e){} unhl(); unhl=karaoke(el,s); };
      await new Promise(res=>{ a.onended=a.onerror=a.onpause=()=>res(); a.play().catch(()=>res()); });
      unhl(); if(VOICE.cur===a) VOICE.cur=null; return; }
    const est=(.35+[...hanOf(text)].length*.27)*.8/rate/vSpeedMul();
    try{ musDuck(est+1); }catch(e){} unhl=karaoke(el,est);
    await ttsSay(text,{voice:v,rate,lang}); unhl(); })(); }
/* karaoke: while a line plays, light up its words in the sentence on screen (found automatically: the visible token
   group whose characters spell the line; o.hl can name the element). Word timing = clip length split by character count. */
const hanOf=s=>[...String(s)].filter(c=>/[\u3400-\u9fff〇]/.test(c)).join('');
function sayTarget(text,hl){ if(hl) return hl; const want=hanOf(text); if([...want].length<3) return null; let best=null;
  const groups=new Set(); document.querySelectorAll('.tok').forEach(t=>{ if(t.parentElement) groups.add(t.parentElement); });
  groups.forEach(g=>{ if(!g.isConnected||!g.getClientRects().length) return; if(hanOf([...g.querySelectorAll(':scope > .tok')].map(t=>(t.querySelector('.han')||t).textContent).join(''))===want) best=g; });
  return best; }
function karaoke(el,secs){ const toks=el?[...el.querySelectorAll(':scope > .tok')]:[]; if(!toks.length||!(secs>0)) return ()=>{};
  const w=toks.map(t=>Math.max(.4,[...hanOf((t.querySelector('.han')||t).textContent)].length)); const tot=w.reduce((a,b)=>a+b,0); let acc=0;
  const off=()=>toks.forEach(x=>x.classList.remove('say-on'));
  const tm=toks.map((t,i)=>{ const at=acc/tot*secs*1000; acc+=w[i]; return setTimeout(()=>{ off(); t.classList.add('say-on'); },at); });
  tm.push(setTimeout(off,secs*1000+250)); return ()=>{ tm.forEach(clearTimeout); off(); }; }
/* play several lines in order, alternating voices: [[text,'m'],[text,'f'],…]; returns a stop function */
function sayAll(lines,gap=350){ let stop=false; (async()=>{ for(const [t,v] of lines){ if(stop) return; await say(t,{voice:v}); if(stop) return; await new Promise(r=>setTimeout(r,gap)); } })(); return ()=>{ stop=true; stopVoice(); }; }
const VOICE_TEST='你好！我们一起学习中文吧。';
Object.assign(T.ar,{vSpeed:'سرعة النطق',vSlow:'بطيئة',vNorm:'عادية',vFast:'سريعة',vTest:'جرّب الصوت',vStudio:'صوت استوديو طبيعي · {n} تسجيل',vPhone:'صوت الجهاز'});
Object.assign(T.en,{vSpeed:'Voice speed',vSlow:'Slow',vNorm:'Normal',vFast:'Fast',vTest:'Test the voice',vStudio:'studio voice · {n} recordings',vPhone:'phone voice'});
