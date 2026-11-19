/* ===== Background music: a quiet, low guzheng (古筝) soundtrack, composed live =====
   Recorded koto notes (FluidR3 GM soundfont, CC BY 3.0) stand in for the guzheng; a pizzicato bass and a soft sine drone sit
   underneath. Phrases wander on the D major pentatonic (宫调式) in a low register, with the guzheng's typical grace-note
   slides (滑音) and an occasional upward sweep (刮奏). Everything runs through a warm low-pass and a long hall reverb,
   at a low level under the sound effects; it ducks while a voice speaks and pauses when the app is in the background.
   S.music: false = off · S.mv: 'low' (default) | 'mid'. Music starts on the first tap (browser autoplay rules). ===== */
const MUSIC={on:false,ready:false,loading:null,buf:{},timer:null,nextT:0,beat:0,root:0,phrase:[],rest:0,bus:null,duck:null,master:null,drone:null,rev:null};
const MV={low:.16,mid:.3};
const GZ_PENTA=[0,2,4,7,9];                 // D E F# A B
const GZ_KEY=50;                            // D3
const GZ_ROOTS=[0,7,9,2];                   // D – A – B – E: bass roots, 8 beats each
const GZ_BPM=58;
function musCtx(){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } return AC; }
function musLevel(){ return S.music===false?0:(MV[S.mv]||MV.low); }
function musGraph(){ const c=musCtx(); if(!c) return null; if(MUSIC.master) return c;
  MUSIC.master=c.createGain(); MUSIC.master.gain.value=0; MUSIC.master.connect(c.destination);
  MUSIC.duck=c.createGain(); MUSIC.duck.connect(MUSIC.master);
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3200; lp.Q.value=.4; lp.connect(MUSIC.duck);
  MUSIC.bus=c.createGain(); MUSIC.bus.connect(lp);
  /* long, dark hall: decaying noise impulse */
  const len=c.sampleRate*3.4, ir=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8); }
  MUSIC.rev=c.createConvolver(); MUSIC.rev.buffer=ir; const wet=c.createGain(); wet.gain.value=.5; const wlp=c.createBiquadFilter(); wlp.type='lowpass'; wlp.frequency.value=2200;
  MUSIC.rev.connect(wlp); wlp.connect(wet); wet.connect(MUSIC.duck);
  return c; }
function musLoad(){ if(MUSIC.loading) return MUSIC.loading; const c=musGraph(); if(!c) return Promise.resolve(); const SM=SAMPLES(), jobs=[];
  for(const inst in SM) for(const midi in SM[inst]) jobs.push(fetch(SM[inst][midi]).then(r=>r.arrayBuffer()).then(ab=>new Promise(res=>{ try{ c.decodeAudioData(ab,b=>{ (MUSIC.buf[inst]=MUSIC.buf[inst]||{})[midi]=b; res(); },()=>res()); }catch(e){ res(); } })).catch(()=>{}));
  MUSIC.loading=Promise.all(jobs).then(()=>{ MUSIC.ready=Object.keys(MUSIC.buf.koto||{}).length>0; }); return MUSIC.loading; }
/* one note from the nearest recorded sample, pitch-shifted; a slide (glide) bends into the note like a pressed guzheng string */
function musNote(inst,midi,t,vel,dur,pan=0,glide=0){ const c=AC, B=MUSIC.buf[inst]; if(!c||!B) return; let best=null,bd=99;
  for(const k in B){ const d=Math.abs(midi-k); if(d<bd){ bd=d; best=+k; } } if(best===null) return;
  const s=c.createBufferSource(); s.buffer=B[best]; const r=Math.pow(2,(midi-best)/12);
  if(glide){ s.playbackRate.setValueAtTime(r*Math.pow(2,-glide/12),t); s.playbackRate.linearRampToValueAtTime(r,t+.12); } else s.playbackRate.value=r;
  const g=c.createGain(), end=t+Math.min(s.buffer.duration/r,dur+1.6);
  g.gain.setValueAtTime(vel,t); g.gain.setValueAtTime(vel,Math.max(t+.05,end-.4)); g.gain.linearRampToValueAtTime(.0001,end);
  let last=g; if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=pan; g.connect(p); last=p; }
  s.connect(g); last.connect(MUSIC.bus); const w=c.createGain(); w.gain.value=inst==='koto'?.6:.25; last.connect(w); w.connect(MUSIC.rev);
  s.start(t); s.stop(end+.05); }
const deg=(i,base=GZ_KEY)=>base+GZ_PENTA[((i%5)+5)%5]+12*Math.floor(i/5);
/* a low sine drone on the current root, breathing slowly */
function musDrone(on){ const c=AC; if(!c) return;
  if(MUSIC.drone){ const d=MUSIC.drone; d.g.gain.setTargetAtTime(0,c.currentTime,1.2); setTimeout(()=>{ try{ d.o.forEach(o=>o.stop()); }catch(e){} },5000); MUSIC.drone=null; }
  if(!on) return; const g=c.createGain(); g.gain.value=0; const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=260; g.connect(lp); lp.connect(MUSIC.duck);
  const f=440*Math.pow(2,(GZ_KEY-24-69)/12), o=[f,f*1.5,f*2.005].map((hz,i)=>{ const x=c.createOscillator(); x.type=i===1?'triangle':'sine'; x.frequency.value=hz; const xg=c.createGain(); xg.gain.value=[.5,.18,.12][i]; x.connect(xg); xg.connect(g); x.start(); return x; });
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=.06; lg.gain.value=.012; lfo.connect(lg); lg.connect(g.gain); lfo.start(); o.push(lfo);
  g.gain.setTargetAtTime(.035,c.currentTime,2.5); MUSIC.drone={g,o}; }
/* composer: called ahead of time by the scheduler, one beat at a time */
function musBeat(t){ const b=MUSIC.beat++, spb=60/GZ_BPM, bar=b%8;
  if(bar===0){ MUSIC.root=GZ_ROOTS[Math.floor(b/8)%GZ_ROOTS.length];
    musNote('pizzicato',GZ_KEY-12+MUSIC.root,t,.42,spb*3,0);                                        // bass on the root
    musNote('koto',GZ_KEY-12+MUSIC.root,t+spb*.02,.2,spb*2,-.2); musNote('koto',GZ_KEY-5+MUSIC.root,t+spb*.5,.14,spb*2,.15); }   // low open fifth
  if(bar===4) musNote('pizzicato',GZ_KEY-12+MUSIC.root+7,t,.28,spb*2,0);
  if(bar===6&&Math.random()<.5) musNote('koto',GZ_KEY-12+MUSIC.root+12,t+spb*.5,.12,spb*2,-.3);
  if(MUSIC.rest>0){ MUSIC.rest--; return; }
  if(!MUSIC.phrase.length){ /* new phrase: 3–6 notes wandering from near the root, sometimes opened by a sweep */
    const n=3+(Math.random()*4|0); let i=5+(Math.random()*4|0); const ph=[];
    if(Math.random()<.18){ for(let k=0;k<6;k++) musNote('koto',deg(i-6+k),t+k*.045,.08+k*.015,.6,.1); }
    for(let k=0;k<n;k++){ i+=[-2,-1,-1,1,1,2,0][Math.random()*7|0]; i=Math.max(2,Math.min(12,i)); ph.push({i,d:[1,1,1,.5,2,1.5][Math.random()*6|0]}); }
    MUSIC.phrase=ph; }
  let at=0; while(at<1&&MUSIC.phrase.length){ const nt=MUSIC.phrase.shift(), slide=Math.random()<.22?(Math.random()<.5?2:1):0;
    if(slide===0&&Math.random()<.15) musNote('koto',deg(nt.i+1),t+at*spb-.06,.12,.3,.25);       // grace note above (倚音)
    musNote('koto',deg(nt.i),t+at*spb,.3+Math.random()*.12,spb*nt.d,(Math.random()-.5)*.5,slide);
    if(nt.d<1){ at+=nt.d; continue; } MUSIC.rest=Math.max(0,Math.ceil(nt.d)-1); break; }
  if(!MUSIC.phrase.length&&MUSIC.rest===0) MUSIC.rest=2+(Math.random()*3|0); }
function musTick(){ const c=AC; if(!c||!MUSIC.on||!MUSIC.ready) return; const spb=60/GZ_BPM;
  if(MUSIC.nextT<c.currentTime) MUSIC.nextT=c.currentTime+.1;
  while(MUSIC.nextT<c.currentTime+1.2){ musBeat(MUSIC.nextT); MUSIC.nextT+=spb; } }
async function musStart(){ if(MUSIC.on||S.music===false||document.hidden) return; const c=musGraph(); if(!c) return; MUSIC.on=true;
  try{ if(c.state==='suspended') await c.resume(); }catch(e){} await musLoad(); if(!MUSIC.on) return;
  MUSIC.nextT=c.currentTime+.3; MUSIC.master.gain.cancelScheduledValues(c.currentTime); MUSIC.master.gain.setTargetAtTime(musLevel(),c.currentTime,1.5);
  musDrone(true); clearInterval(MUSIC.timer); MUSIC.timer=setInterval(musTick,250); musTick(); }
function musStop(){ MUSIC.on=false; clearInterval(MUSIC.timer); MUSIC.timer=null; const c=AC; if(c&&MUSIC.master) MUSIC.master.gain.setTargetAtTime(0,c.currentTime,.4); musDrone(false); MUSIC.phrase=[]; MUSIC.rest=0; }
function musSet(level){ /* 'off' | 'low' | 'mid' */ if(level==='off'){ S.music=false; save(); musStop(); } else { S.music=true; S.mv=level; save();
  if(MUSIC.on&&AC) MUSIC.master.gain.setTargetAtTime(musLevel(),AC.currentTime,.4); else musStart(); } refreshMusChip(); track('music',{level}); }
/* voice.js calls this while a clip plays */
function musDuck(sec=1.8){ const c=AC; if(!c||!MUSIC.duck) return; const g=MUSIC.duck.gain, t=c.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(.25,t,.08); g.setTargetAtTime(1,t+sec,.6); }
function refreshMusChip(){ $$('[data-act="mus"]').forEach(b=>{ const on=S.music!==false; b.innerHTML=on?ICON.music:ICON.musicOff; b.setAttribute('aria-pressed',on); }); }
ICON.music=svg('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',16);
ICON.musicOff=svg('<path d="M9 18V9M9 5l11-2v9"/><circle cx="6.5" cy="18" r="2.5"/><path d="M3 3l18 18"/>',16);
/* first tap anywhere starts the music (autoplay rules); background → pause, foreground → resume */
addEventListener('pointerdown',()=>{ if(S.lang&&S.music!==false&&!MUSIC.on) musStart(); },{passive:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(MUSIC.on){ musStop(); MUSIC.paused=true; } } else if(MUSIC.paused){ MUSIC.paused=false; musStart(); } });
