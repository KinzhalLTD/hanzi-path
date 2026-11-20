/* ===== Voice: studio recordings first, the best phone voice as fallback =====
   Studio clips (Google Chirp 3 HD, recorded by scripts/voice_gen.py) ship inside the iPhone app in voice packs.
   Every spoken line is looked up by voiceKey(voice, text) (same cyrb53 hash as scripts/voice_corpus.py); the native
   side returns the clip bytes and it plays here with pitch-preserving speed control. Lines without a clip, and the
   browser version, use the best installed system voice (premium/enhanced first). Voices: 'n' narrator (male studio
   voice, matched to the owner's reference recording), 'p' default partner (female) and the cast (VOICE_CAST: m1–m5, f1–f3),
   so every conversation partner and dialogue speaker has a voice of their own.
   say(text,{voice:'n'|'p', rate, lang, py, hl}) returns a promise that settles when the line has finished (or was cut off),
   so conversations can play turn by turn. Speeds: S.vSpeed = 'slow' | 'normal' (default) | 'fast'. */
function cyrb53(str,seed=0){ let h1=0xdeadbeef^seed, h2=0x41c6ce57^seed;
  for(let i=0,ch;i<str.length;i++){ ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
  h1=Math.imul(h1^(h1>>>16),2246822507); h1^=Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507); h2^=Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0); }
const voiceKey=(v,t,py)=>cyrb53(v+'|'+String(t).replace(/[\s·・]+/g,'')+(py?'#'+py:'')).toString(36);   // py: a reading-specific recording (车 'ju1')
const VOICE={cache:new Map(), cur:null, gen:0, studio:null, clips:0, web:{}};
const vSpeedMul=()=>S.vSpeed==='slow'?0.72:S.vSpeed==='fast'?1.15:1;
/* the voice cast: every character in a conversation or module dialogue has a voice of their own.
   g = gender, c = Chirp 3 HD studio voice (scripts/voice_gen.py), pitch/rate shape the phone voice when no studio clip exists
   (so two characters never sound alike even on a phone with few Chinese voices). 'n' narrator, 'p' default partner. */
const VOICE_CAST={n:{g:'m',c:'Charon',pitch:1,rate:1},p:{g:'f',c:'Kore',pitch:1,rate:1},
  m1:{g:'m',c:'Puck',pitch:1.04,rate:1.04},m2:{g:'m',c:'Iapetus',pitch:.88,rate:.93},m3:{g:'m',c:'Fenrir',pitch:1.1,rate:1.08},m4:{g:'m',c:'Orus',pitch:.95,rate:.98},m5:{g:'m',c:'Algieba',pitch:.92,rate:1.02},
  f1:{g:'f',c:'Aoede',pitch:.96,rate:.95},f2:{g:'f',c:'Leda',pitch:1.12,rate:1.06},f3:{g:'f',c:'Despina',pitch:1.03,rate:1}};
const castOf=v=>VOICE_CAST[v]||VOICE_CAST.n;
/* the learner's own lines: male (narrator) or female voice, Me → Settings */
const myVoice=()=>S.myVoice==='f'?'f3':'n';
/* who speaks in each conversation scene (genders follow the Arabic/English role text) and in each module dialogue */
const SCENE_CAST={'soft/standup':'m1','soft/review':'m2','soft/incident':'m3','soft/product':'f2','soft/interview':'m5','soft/rollback':'f3',
  'sec/phish':'m4','sec/incident':'m5','sec/audit':'f1','sec/pentest':'m2','sec/vulnfix':'m3','sec/cloudleak':'p'};
const DLG_CAST=[['m1','f1'],['f2','m3'],['m4','f3'],['f1','m2'],['m5','p'],['p','m1'],['m3','f2'],['f3','m4']];
const dlgVoice=(modIndex,who)=>DLG_CAST[modIndex%DLG_CAST.length][who==='A'?0:1];
async function voiceInfo(){ if(!RN) return {studio:false,clips:0}; if(VOICE.studio!==null) return {studio:VOICE.studio,clips:VOICE.clips};
  const r=await native('voiceInfo',{}); VOICE.studio=!!(r&&r.ok&&r.clips>0); VOICE.clips=(r&&r.clips)||0; return {studio:VOICE.studio,clips:VOICE.clips}; }
async function studioClip(v,text,py){ if(!RN||VOICE.studio===false) return null; const k=voiceKey(v,text,py);
  if(VOICE.cache.has(k)){ const u=VOICE.cache.get(k); VOICE.cache.delete(k); VOICE.cache.set(k,u); return u; }
  const r=await native('voice',{k}); if(!r||r.unsupported){ VOICE.studio=false; return null; } if(!r.b64) return null;
  const bin=atob(r.b64), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u8],{type:'audio/mpeg'})); VOICE.cache.set(k,url);
  if(VOICE.cache.size>80){ const [ok,ou]=VOICE.cache.entries().next().value; VOICE.cache.delete(ok); try{URL.revokeObjectURL(ou);}catch(e){} }
  return url; }
/* best browser voice per language: quality first; gender only breaks ties (narrator male, partner female), and the
   partner gets a different voice than the narrator when one of similar quality exists, otherwise a raised pitch */
const VOICE_MALE=/(yunxi|yunyang|yunjian|kangkang|li-?mu|male|男|maged|hamed|shakir|tarik|daniel|aaron|arthur|fred|guy|david|mark|alex|tom)/i;
function webVoice(lang,role){ try{ const vs=speechSynthesis.getVoices(); if(!vs.length) return null; const key=lang+role; if(VOICE.web[key]!==undefined) return VOICE.web[key]; const cast=castOf(role), male=cast.g==='m';
  const L=lang.toLowerCase(), base=L.split('-')[0]; let pool=vs.filter(v=>v.lang.toLowerCase().replace('_','-')===L); if(!pool.length) pool=vs.filter(v=>v.lang.toLowerCase().startsWith(base));
  if(base==='zh') pool=pool.filter(v=>!/hk|tw|yue|cantonese|粤/i.test(v.lang+v.name)).concat(pool.filter(v=>/tw/i.test(v.lang))).filter((v,i,a)=>a.indexOf(v)===i);
  const q=v=>(/premium|neural|natural|enhanced|online|xiaoxiao|xiaoyi|yunxi|tingting|lili|google/i.test(v.name)?6:0)+(/premium|neural|natural/i.test(v.name)?4:0)+(v.localService?1:0);
  const sc=v=>q(v)*2+(VOICE_MALE.test(v.name)===male?1:0); const ranked=pool.sort((a,b)=>sc(b)-sc(a));
  let pick=ranked[0]||null;
  if(role!=='n'){ const nar=webVoice(lang,'n'); const same=ranked.filter(v=>v!==nar&&VOICE_MALE.test(v.name)===male&&q(v)>=q(ranked[0])-4);
    const ids=Object.keys(VOICE_CAST).filter(k=>k!=='n'&&castOf(k).g===cast.g), ix=ids.indexOf(role);   // spread the cast over the good voices of that gender
    pick=same.length?same[ix%same.length]:(ranked.find(v=>v!==nar&&q(v)>=q(nar||v)-4)||nar); }
  return VOICE.web[key]=pick; }catch(e){ return null; } }
try{ speechSynthesis.onvoiceschanged=()=>{ VOICE.web={}; }; }catch(e){}
function ttsSay(text,{voice='n',rate=.8,lang='zh-CN'}={}){ const r=Math.max(.35,Math.min(1.4,rate*vSpeedMul()));
  if(RN) return native('speak',{text,lang,rate:r,voice}).then(()=>{});
  return new Promise(res=>{ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=r;
      const wv=webVoice(lang,voice), cast=castOf(voice); if(wv) u.voice=wv; u.pitch=cast.pitch*(voice!=='n'&&wv&&wv===webVoice(lang,'n')?(cast.g==='f'?1.18:1.08):1); u.rate=Math.max(.35,Math.min(1.4,r*cast.rate));
      u.onend=u.onerror=()=>res(); speechSynthesis.speak(u); setTimeout(res,1500+[...text].length*450/r); }catch(e){ res(); } }); }
function stopVoice(){ VOICE.gen++; if(VOICE.cur){ try{ VOICE.cur.pause(); }catch(e){} VOICE.cur=null; }
  try{ if(RN) RN.postMessage(JSON.stringify({type:'speakStop'})); else speechSynthesis.cancel(); }catch(e){} }
function say(text,o={}){ if(!S.sound||!text) return Promise.resolve(); text=String(text).trim(); if(!text) return Promise.resolve();
  const v=o.voice||'n', lang=o.lang||'zh-CN', rate=o.rate||.8, g=++VOICE.gen;
  if(VOICE.cur){ try{ VOICE.cur.pause(); }catch(e){} VOICE.cur=null; }
  // studio clips are Mandarin; regional voices (zh-HK, zh-TW) and other languages stay on the phone voice
  return (async()=>{ const url=lang==='zh-CN'?await studioClip(v,text,o.py):null; if(g!==VOICE.gen) return;
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
/* play several lines in order, alternating voices: [[text,'p'],[text,'n'],…]; returns a stop function */
function sayAll(lines,gap=350){ let stop=false; (async()=>{ for(const [t,v] of lines){ if(stop) return; await say(t,{voice:v}); if(stop) return; await new Promise(r=>setTimeout(r,gap)); } })(); return ()=>{ stop=true; stopVoice(); }; }
const VOICE_TEST='你好！我们一起学习中文吧。';
Object.assign(T.ar,{vSpeed:'سرعة النطق',vSlow:'بطيئة',vNorm:'عادية',vFast:'سريعة',vTest:'جرّب الصوت',vStudio:'صوت استوديو طبيعي · {n} تسجيل',vPhone:'صوت الجهاز'});
Object.assign(T.en,{vSpeed:'Voice speed',vSlow:'Slow',vNorm:'Normal',vFast:'Fast',vTest:'Test the voice',vStudio:'studio voice · {n} recordings',vPhone:'phone voice'});
