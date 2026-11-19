/* ===== Background music: a real guzheng (古筝), played the way a guzheng player plays =====
   Instrument: 34 real recorded guzheng plucks (art/guzheng, CC0, Freesound "LOVELY CHINESE GUZHENG PLUCKED" by Pufermufin,
   sliced and tuned by sparklecatta-lang). The strings are tuned D F G A C, so every piece is in F gong (宫) pentatonic and
   most notes sound at the pitch they were recorded at (only the recorded tuning offset is corrected).
   Pieces: 茉莉花 Jasmine Flower (Jiangsu folk song), 送别 Farewell (Ordway 1851 / Li Shutong 1915), and three quiet
   originals (月光, 竹林, 园林). Each pass is arranged with real guzheng techniques:
     刮奏 glissando sweeps across the pentatonic strings to open and close a piece
     按音 bends: 4 (B♭) and 7 (E) are not on the strings, so the player plucks the string below and presses it up
     上滑音 slides: a note is sometimes plucked from the string below and pressed up into place
     摇指 tremolo on long notes, 吟 vibrato on held notes, 倚音 grace notes
     left hand: low bass on the downbeat, or flowing broken chords (流水) on the second pass
   Timing and dynamics are humanised. The level stays low under the lesson; it ducks while a voice speaks and pauses
   in the background. S.music: false = off · S.mv: 'low' (default) | 'mid'. Starts on the first tap. ===== */
const MUSIC={on:false,ready:false,loading:null,buf:{},rr:{},timer:null,ev:[],ei:0,t0:0,spb:1,end:0,lap:0,piece:null,beat:0,bus:null,duck:null,master:null,rev:null,paused:false};
const MV={low:.2,mid:.36};
const GZ_PC=new Set([5,7,9,0,2]);                                     // F G A C D
const GZ_STR=[];for(let m=38;m<=88;m++) if(GZ_PC.has(m%12)) GZ_STR.push(m);   // the strings, low to high
const GZ_ROOT=65;                                                      // F4 = 1 (do)
const GZ_PIECES={
 jasmine:{zh:'茉莉花',bar:4,bpm:60,mel:`3 3_ 5_ 6_ 1'_ 1'_ 6_ | 5 5_ 6_ 5 - | 3 3_ 5_ 6_ 1'_ 1'_ 6_ | 5 5_ 6_ 5 - | 5 5 5 3_ 5_ | 6 6 5 - | 3 2_ 3_ 5 3_ 2_ | 1 1_ 2_ 1 - | 3_ 2_ 1_ 3_ 2 3_ 5_ | 6_ 1'_ 5 - - | 2 3_ 5_ 2_ 3_ 1_ 6,_ | 5, - - - | 6,_ 1_ 2 3_ 1_ 2_ 1_ | 6,_ 5,_ 5, - - |`},
 farewell:{zh:'送别',bar:4,bpm:58,mel:`5 3_ 5_ 1' - | 6 1' 5 - | 5 1_ 2_ 3 2_ 1_ | 2 - - - | 5 3_ 5_ 1'. 7_ | 6 1' 5 - | 5 2_ 3_ 4. 7,_ | 1 - - - | 6 1' 1' - | 7 6_ 7_ 1' - | 6_ 7_ 1'_ 6_ 6_ 5_ 3_ 1_ | 2 - - - | 5 3_ 5_ 1'. 7_ | 6 1' 5 - | 5 2_ 3_ 4. 7,_ | 1 - - - |`},
 moon:{zh:'月光',bar:3,bpm:66,mel:`5 - 3 | 2 1 2 | 3 - - | 6, 1 2 | 3 5 6 | 5 - - | 3 2 1 | 6, 1 2 | 1 - - |`},
 bamboo:{zh:'竹林',bar:4,bpm:54,mel:`3 - 5 - | 6 5 3 - | 2 - 3 - | 5 - - - | 6 - 1' - | 6 5 3 2 | 3 - 2 - | 1 - - - |`},
 garden:{zh:'园林',bar:4,bpm:60,mel:`1' 6 5 6 | 1' - 2' - | 6 5 3 5 | 6 - - - | 5 3 2 3 | 5 6 1' 6 | 5 3 2 3 | 1 - - - |`}};
const GZ_ORDER=['jasmine','bamboo','farewell','moon','garden'];
function musCtx(){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } return AC; }
function musLevel(){ return S.music===false?0:(MV[S.mv]||MV.low); }
function musGraph(){ const c=musCtx(); if(!c) return null; if(MUSIC.master) return c;
  MUSIC.master=c.createGain(); MUSIC.master.gain.value=0; MUSIC.master.connect(c.destination);
  MUSIC.duck=c.createGain(); MUSIC.duck.connect(MUSIC.master);
  const shelf=c.createBiquadFilter(); shelf.type='highshelf'; shelf.frequency.value=5200; shelf.gain.value=-4; shelf.connect(MUSIC.duck);
  MUSIC.bus=c.createGain(); MUSIC.bus.connect(shelf);
  /* a wooden hall: short pre-delay, 2.6 s decay, darker tail */
  const len=c.sampleRate*2.6, ir=c.createBuffer(2,len,c.sampleRate), pre=c.sampleRate*.018;
  for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=i<pre?0:(Math.random()*2-1)*Math.pow(1-(i-pre)/(len-pre),3.4); }
  MUSIC.rev=c.createConvolver(); MUSIC.rev.buffer=ir; const wet=c.createGain(); wet.gain.value=.32; const wlp=c.createBiquadFilter(); wlp.type='lowpass'; wlp.frequency.value=3800;
  MUSIC.rev.connect(wlp); wlp.connect(wet); wet.connect(MUSIC.duck);
  return c; }
function musLoad(){ if(MUSIC.loading) return MUSIC.loading; const c=musGraph(); if(!c) return Promise.resolve();
  MUSIC.loading=Promise.all(GZ_SAMPLES().map(x=>fetch(x.d).then(r=>r.arrayBuffer()).then(ab=>new Promise(res=>{ try{ c.decodeAudioData(ab,b=>{ (MUSIC.buf[x.k]=MUSIC.buf[x.k]||[]).push({b,t:x.t,g:Math.pow(10,x.db/20),v:x.v}); res(); },()=>res()); }catch(e){ res(); } })).catch(()=>{})))
    .then(()=>{ MUSIC.ready=Object.keys(MUSIC.buf).length>=10; }); return MUSIC.loading; }
/* one pluck: nearest recorded string, round robin, tuning corrected; optional press-bend (按音/滑音) and vibrato (吟) */
function gzPluck(midi,t,vel,o={}){ const c=AC; if(!c||!MUSIC.ready) return; let k=null,bd=99;
  for(const key in MUSIC.buf){ const d=Math.abs(midi-key); if(d<bd||(d===bd&&+key<midi)){ bd=d; k=+key; } } if(k===null) return;
  const all=MUSIC.buf[k], hard=all.filter(x=>x.v===2), pool=vel>.55&&hard.length?hard:all.filter(x=>x.v===1).length?all.filter(x=>x.v===1):all;
  const i=MUSIC.rr[k]=((MUSIC.rr[k]||0)+1)%pool.length, smp=pool[i];
  const s=c.createBufferSource(); s.buffer=smp.b; const r=Math.pow(2,(midi-k)/12+smp.t/1200);
  s.playbackRate.setValueAtTime(r,t);
  if(o.bend){ const at=t+(o.bendAt||.05); s.playbackRate.setValueAtTime(r,at); s.playbackRate.linearRampToValueAtTime(r*Math.pow(2,o.bend/12),at+(o.bendDur||.12)); }
  const g=c.createGain(), v=Math.max(.0001,vel*smp.g), end=t+Math.min(smp.b.duration/r,(o.dur||3)+.9);
  g.gain.setValueAtTime(v,t); g.gain.setValueAtTime(v,Math.max(t+.05,end-.35)); g.gain.linearRampToValueAtTime(.0001,end);
  if(o.vib){ const lf=c.createOscillator(), lg=c.createGain(); lf.frequency.value=4.6+Math.random(); lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(r*(o.bend?Math.pow(2,o.bend/12):1)*.009,t+.6);
    lf.connect(lg); lg.connect(s.playbackRate); lf.start(t); lf.stop(end); }
  let last=g; if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=Math.max(-.6,Math.min(.6,(midi-62)/40)); g.connect(p); last=p; }   // low strings left, high right
  s.connect(g); last.connect(MUSIC.bus); const w=c.createGain(); w.gain.value=.55; last.connect(w); w.connect(MUSIC.rev);
  s.start(t); s.stop(end+.05); MUSIC.beat++; }
/* ---------- jianpu: 1–7 degrees, #/b, ' up, , down, _ halves, . dotted, - hold, 0 rest ---------- */
const GZ_DEG=[0,2,4,5,7,9,11];
function gzJianpu(src,root){ const out=[]; let t=0;
  src.split(/\s+/).filter(Boolean).forEach(tok=>{ if(tok==='|') return; if(tok==='-'){ if(out.length) out[out.length-1].d+=1; t+=1; return; }
    const m=tok.match(/^([#b]?)([0-7])([',]*)(\.?)(_*)(\.?)$/); if(!m) return; let d=1/Math.pow(2,m[5].length); if(m[4]||m[6]) d*=1.5;
    if(m[2]!=='0'){ let p=root+GZ_DEG[+m[2]-1]+(m[1]==='#'?1:m[1]==='b'?-1:0); for(const ch of m[3]) p+=ch==="'"?12:-12; out.push({t,p,d}); } t+=d; });
  return {notes:out,len:Math.ceil(t)}; }
/* chords that fit the pentatonic melody of each bar (gong, shang, zhi, yu, jue roots) */
const GZ_CH=[[0,[0,7]],[2,[2,9]],[7,[7,2]],[9,[9,4]],[4,[4,9]]];
function gzChords(notes,len,bar,root){ const out=[];
  for(let b=0;b<Math.ceil(len/bar);b++){ const w={}; notes.filter(n=>n.t>=b*bar&&n.t<(b+1)*bar).forEach(n=>{ const pc=((n.p-root)%12+12)%12; w[pc]=(w[pc]||0)+n.d*(n.t===b*bar?1.8:1); });
    let best=GZ_CH[0],bs=-1; GZ_CH.forEach(ch=>{ let s=ch[1].reduce((a,pc)=>a+(w[pc]||0),0)+(w[(ch[0]+4)%12]||0)*.4; if(ch[0]===0) s+=.3; if(b===Math.ceil(len/bar)-1&&ch[0]===0) s+=4; if(s>bs){ bs=s; best=ch; } }); out.push(best[0]); }
  return out; }
const onStr=m=>GZ_PC.has(((m%12)+12)%12);
const strBelow=m=>{ for(let i=GZ_STR.length-1;i>=0;i--) if(GZ_STR[i]<m) return GZ_STR[i]; return null; };
const jit=(a)=>(Math.random()*2-1)*a;
/* glissando across the strings (刮奏), up or down, as events at time tb (beats) lasting about dur beats */
function gzGliss(ev,tb,from,to,vel,dur){ const s=GZ_STR.filter(m=>m>=Math.min(from,to)&&m<=Math.max(from,to)); if(to<from) s.reverse(); const n=s.length;
  s.forEach((m,i)=>ev.push({t:tb+dur*Math.pow(i/n,.85),p:m,v:vel*(0.55+.45*Math.sin(Math.PI*(i+1)/(n+1))),o:{}})); }
/* arrange one pass of a piece: lap 0 plain with a bass, lap 1 flowing left hand + tremolo, lap 2 an octave lower and sparse */
function gzArrange(key,lap){ const P=GZ_PIECES[key], sec=lap%3, root=GZ_ROOT-(sec===2?12:0), {notes,len}=gzJianpu(P.mel,root), bar=P.bar, L=Math.ceil(len/bar)*bar, ch=gzChords(notes,len,bar,root), ev=[], off=sec===0?1.5:.5;
  if(sec===0) gzGliss(ev,0,38,74,.32,1.1);                           // opening sweep
  notes.forEach((n,i)=>{ const t=n.t+off, down=n.t%bar===0, last=i===notes.length-1, nx=notes[i+1], phraseEnd=!nx||nx.t-n.t>n.d+.01||n.d>=2;
    let v=(sec===2?.42:.5)+(down?.08:0)+jit(.05), p=n.p, o={dur:n.d};
    if(!onStr(p)){ const b=strBelow(p); o.bend=p-b; o.bendAt=.02; o.bendDur=.07; p=b; }      // 按音: press the string below up to the note
    else if(n.d>=1&&Math.random()<.2){ const b=strBelow(p); if(b&&p-b<=3){ o.bend=p-b; o.bendAt=.03; o.bendDur=.14; p=b; } }   // 上滑音
    if(phraseEnd||n.d>=1.5) o.vib=1;
    if(!o.bend&&Math.random()<.12&&n.d>=.5){ const up=GZ_STR.find(m=>m>p); if(up) ev.push({t:t-.08,p:up,v:v*.4,o:{}}); }   // 倚音
    if(sec===1&&n.d>=2&&!o.bend){ const reps=Math.floor(n.d*4); for(let r=0;r<reps;r++) ev.push({t:t+r*.25+jit(.015),p,v:(r?.2+.06*Math.sin(r):v),o:{dur:.3}}); }   // 摇指 tremolo
    else ev.push({t:t+jit(.02),p,v,o});
    if(last) o.vib=1; });
  /* left hand */
  ch.forEach((cr,b)=>{ let bass=root-24+cr; while(bass<38) bass+=12; if(bass>53) bass-=12; const t=b*bar+off;
    if(sec===1){ const arp=[bass,bass+7,bass+12,bass+14,bass+12,bass+7].filter(onStr); for(let k=0;k<bar*2;k++) ev.push({t:t+k*.5+jit(.02),p:arp[k%arp.length],v:(k?.18:.36)+jit(.03),o:{dur:.6}}); }
    else { ev.push({t:t+jit(.02),p:bass,v:.36,o:{dur:bar}}); if(sec===0&&bar>=4) ev.push({t:t+2+jit(.02),p:bass+7,v:.2,o:{dur:2}}); } });
  /* close: rolled chord, then a soft sweep down */
  const tEnd=L+off; [root-24,root-17,root-12,root-5,root].forEach((m,i)=>ev.push({t:tEnd+i*.09,p:m,v:.3,o:{vib:1,dur:3}}));
  if(sec!==1) gzGliss(ev,tEnd+1.5,86,62,.16,1.2);
  ev.sort((a,b)=>a.t-b.t); return {ev,len:tEnd+(sec===1?3:4.5)}; }
function gzNextPass(){ const c=AC; if(!MUSIC.piece||MUSIC.lap%3===0){ const i=(GZ_ORDER.indexOf(MUSIC.piece)+1)%GZ_ORDER.length; MUSIC.piece=GZ_ORDER[i]; }
  const P=GZ_PIECES[MUSIC.piece], A=gzArrange(MUSIC.piece,MUSIC.lap); MUSIC.spb=60/(P.bpm*(MUSIC.lap%3===2?.92:1)); MUSIC.ev=A.ev; MUSIC.ei=0;
  MUSIC.t0=Math.max(c.currentTime+.2,MUSIC.end||0); MUSIC.end=MUSIC.t0+A.len*MUSIC.spb; MUSIC.lap++; }
function musTick(){ const c=AC; if(!c||!MUSIC.on||!MUSIC.ready) return; const ahead=c.currentTime+1.2;
  if(MUSIC.end&&MUSIC.end<c.currentTime-2) MUSIC.end=0;                 // after a pause: start fresh
  if(!MUSIC.ev.length||(MUSIC.ei>=MUSIC.ev.length&&MUSIC.end<ahead)) gzNextPass();
  while(MUSIC.ei<MUSIC.ev.length){ const e=MUSIC.ev[MUSIC.ei], at=MUSIC.t0+e.t*MUSIC.spb*(1+.04*Math.max(0,e.t-(MUSIC.ev[MUSIC.ev.length-1].t-2))/2);   // slight ritardando at the end
    if(at>ahead) break; if(at>=c.currentTime-.05) gzPluck(e.p,Math.max(at,c.currentTime),e.v,e.o); MUSIC.ei++; } }
async function musStart(){ if(MUSIC.on||S.music===false||document.hidden) return; const c=musGraph(); if(!c) return; MUSIC.on=true;
  try{ if(c.state==='suspended') await c.resume(); }catch(e){} await musLoad(); if(!MUSIC.on) return;
  MUSIC.master.gain.cancelScheduledValues(c.currentTime); MUSIC.master.gain.setTargetAtTime(musLevel(),c.currentTime,1.2);
  MUSIC.ev=[]; MUSIC.end=0; clearInterval(MUSIC.timer); MUSIC.timer=setInterval(musTick,200); musTick(); }
function musStop(){ MUSIC.on=false; clearInterval(MUSIC.timer); MUSIC.timer=null; const c=AC; if(c&&MUSIC.master) MUSIC.master.gain.setTargetAtTime(0,c.currentTime,.4); MUSIC.ev=[]; MUSIC.end=0; }
function musSet(level){ /* 'off' | 'low' | 'mid' */ if(level==='off'){ S.music=false; save(); musStop(); } else { S.music=true; S.mv=level; save();
  if(MUSIC.on&&AC) MUSIC.master.gain.setTargetAtTime(musLevel(),AC.currentTime,.4); else musStart(); } refreshMusChip(); track('music',{level}); }
/* voice.js calls this while a clip plays */
function musDuck(sec=1.8){ const c=AC; if(!c||!MUSIC.duck) return; const g=MUSIC.duck.gain, t=c.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(.22,t,.08); g.setTargetAtTime(1,t+sec,.6); }
function refreshMusChip(){ $$('[data-act="mus"]').forEach(b=>{ const on=S.music!==false; b.innerHTML=on?ICON.music:ICON.musicOff; b.setAttribute('aria-pressed',on); }); }
ICON.music=svg('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',16);
ICON.musicOff=svg('<path d="M9 18V9M9 5l11-2v9"/><circle cx="6.5" cy="18" r="2.5"/><path d="M3 3l18 18"/>',16);
/* first tap anywhere starts the music (autoplay rules); background → pause, foreground → resume */
addEventListener('pointerdown',()=>{ if(S.lang&&S.music!==false&&!MUSIC.on) musStart(); },{passive:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(MUSIC.on){ musStop(); MUSIC.paused=true; } } else if(MUSIC.paused){ MUSIC.paused=false; musStart(); } });
