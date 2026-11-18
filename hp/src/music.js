/* ===== Hanzi Path soundtrack v3: living, adaptive score =====
   Recorded instruments (FluidR3 GM soundfont, CC BY 3.0) standing in for Chinese ones:
   koto → 古筝 guzheng, shamisen → 琵琶 pipa, shakuhachi → 笛子 dizi, fiddle → 二胡 erhu,
   pizzicato bass, taiko 大鼓, woodblock 木鱼, tubular bells 编钟, glockenspiel 铃.
   v3 adds: an arrangement that changes every pass (4 rotating sections with ornaments, passing
   notes and a breakdown), layers that build up with the learner's answer streak, mood playlists,
   ambient soundscapes (rain, stream, wind, temple, night), a mastering compressor, and a player sheet. */
const SAMPLES=__SAMPLES__;
const MUS={cur:null,key:null,want:null,node:null,timer:null,master:null,duck:null,rev:null,buf:{},ready:false,loading:null,unlocked:false,
  ev:[],ei:0,t0:0,base:0,len:0,lap:0,spb:.8,L:{},int:0,streak:0,intT:null,manual:null};
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } return AC; }
function musVol(){ return S.music===false?0:(S.mv??.6); }
function fxVol(){ return S.fxv??.9; }
function b64buf(u){ const b=atob(u.split(',')[1]); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a.buffer; }
function musInit(){ const c=ac(); if(!c) return null; if(MUS.master) return c;
  MUS.duck=c.createGain(); MUS.an=c.createAnalyser(); MUS.an.fftSize=64; MUS.an.smoothingTimeConstant=.82;
  MUS.duck.connect(c.destination); MUS.duck.connect(MUS.an);
  MUS.comp=c.createDynamicsCompressor(); MUS.comp.threshold.value=-20; MUS.comp.knee.value=12; MUS.comp.ratio.value=3; MUS.comp.attack.value=.01; MUS.comp.release.value=.3; MUS.comp.connect(MUS.duck);
  MUS.master=c.createGain(); MUS.master.gain.value=musVol()*.85; MUS.master.connect(MUS.comp);
  MUS.fx=c.createGain(); MUS.fx.gain.value=fxVol(); MUS.fx.connect(c.destination); MUS.fx.connect(MUS.an);
  MUS.amb=c.createGain(); MUS.amb.gain.value=0; MUS.amb.connect(MUS.duck);
  const len=c.sampleRate*2.6, ir=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)*(i<c.sampleRate*.012?i/(c.sampleRate*.012):1); }
  MUS.rev=c.createConvolver(); MUS.rev.buffer=ir; const rg=c.createGain(); rg.gain.value=.3; MUS.rev.connect(rg); rg.connect(MUS.master); MUS.revFx=c.createGain(); MUS.revFx.gain.value=.18; MUS.rev.connect(MUS.revFx); MUS.revFx.connect(MUS.fx);
  return c; }
/* samples decode without blocking taps: fetch() turns each data: URI into bytes natively (no atob loop on the main
   thread) and decodeAudioData runs off-thread; the first touch only resumes audio, loading starts a moment later */
function b64async(u){ try{ return fetch(u).then(r=>r.arrayBuffer()).catch(()=>b64buf(u)); }catch(e){ return Promise.resolve(b64buf(u)); } }
function loadSamples(){ if(MUS.loading) return MUS.loading; const c=musInit(); if(!c) return Promise.resolve();
  const jobs=[]; for(const inst in SAMPLES) for(const m in SAMPLES[inst]) jobs.push(b64async(SAMPLES[inst][m]).then(buf=>new Promise(res=>{ try{ c.decodeAudioData(buf,b=>{ (MUS.buf[inst]=MUS.buf[inst]||{})[m]=b; res(); },()=>res()); }catch(e){ res(); } })).catch(()=>{}));
  MUS.loading=Promise.all(jobs).then(()=>{ MUS.ready=true; }); return MUS.loading; }
const SUSTAIN={fiddle:1,shakuhachi:1};
const MIXV={koto:1,shamisen:.8,fiddle:.75,shakuhachi:.85,pizzicato:.55,taiko:.6,woodblock:.32,agogo:.3,glockenspiel:.5,tinkle:.6,tubular:.6,timpani:.7};
/* one recorded note, pitch-shifted from the nearest sample. out = raw destination (sfx); dest = music layer */
function note(inst,midi,t,vel=1,dur=.5,out,dest){ const c=AC, B=MUS.buf[inst]; if(!c||!B) return; let best=null,bd=99;
  for(const k in B){ const d=Math.abs(midi-k); if(d<bd){ bd=d; best=+k; } } if(best===null) return;
  const s=c.createBufferSource(); s.buffer=B[best]; s.playbackRate.value=Math.pow(2,(midi-best)/12);
  const g=c.createGain(), v=Math.max(.0001,vel*(out?1:(MIXV[inst]||1))), end=t+(SUSTAIN[inst]?dur+.18:Math.min(s.buffer.duration,dur+1.4));
  g.gain.setValueAtTime(SUSTAIN[inst]?0:v,t); if(SUSTAIN[inst]) g.gain.linearRampToValueAtTime(v,t+.06);
  g.gain.setValueAtTime(v,Math.max(t+.07,end-.2)); g.gain.linearRampToValueAtTime(.0001,end);
  /* light stereo spread per instrument so the ensemble breathes */
  let last=g; if(c.createStereoPanner&&!out){ const pn=c.createStereoPanner(); pn.pan.value={koto:-.25,shamisen:.3,fiddle:.2,shakuhachi:-.1,pizzicato:0,taiko:0,woodblock:.35,glockenspiel:-.35}[inst]||0; g.connect(pn); last=pn; }
  s.connect(g); last.connect(out||dest||MUS.node); if(MUS.rev&&!out){ const w=c.createGain(); w.gain.value=inst==='taiko'||inst==='woodblock'?.15:.55; last.connect(w); w.connect(MUS.rev); }
  s.start(t); s.stop(end+.05); }
/* ---------- jianpu parser: 1–7 degrees, #/b accidentals, ' up, , down, _ halves, . dotted, - hold, 0 rest ---------- */
const DEG=[0,2,4,5,7,9,11];
function jianpu(src,root){ const out=[]; let t=0;
  src.split(/\s+/).filter(Boolean).forEach(tok=>{ if(tok==='|') return; if(tok==='-'){ if(out.length) out[out.length-1].d+=1; t+=1; return; }
    const m=tok.match(/^([#b]?)([0-7])([',]*)(\.?)(_*)(\.?)$/); if(!m) return; let d=1/Math.pow(2,m[5].length); if(m[4]||m[6]) d*=1.5;
    if(m[2]!=='0'){ let p=root+DEG[+m[2]-1]+(m[1]==='#'?1:m[1]==='b'?-1:0); for(const ch of m[3]) p+=ch==="'"?12:-12; out.push({t,p,d}); } t+=d; });
  return {notes:out,len:Math.ceil(t)}; }
const CHORDS=[[0,[0,4,7]],[2,[2,5,9]],[5,[5,9,0]],[7,[7,11,2]],[9,[9,0,4]]];
function harmonise(notes,len,bar,root){ const bars=Math.ceil(len/bar), ch=[];
  for(let b=0;b<bars;b++){ const w={}; notes.filter(n=>n.t>=b*bar&&n.t<(b+1)*bar).forEach(n=>{ const pc=((n.p-root)%12+12)%12; w[pc]=(w[pc]||0)+n.d*(n.t===b*bar?1.6:1); });
    let best=CHORDS[0],bs=-1; CHORDS.forEach(c=>{ let s=c[1].reduce((a,pc)=>a+(w[pc]||0),0); if(c[0]===0) s+=.35; if(b===bars-1&&c[0]===0) s+=3; if(s>bs){ bs=s; best=c; } }); ch.push(best); }
  return ch; }
const PENT5=[0,2,4,7,9];
function snapPenta(p,root){ let best=p,bd=99; for(let o=-2;o<=2;o++) PENT5.forEach(d=>{ const q=root+d+12*o+Math.floor((p-root)/12)*12; const dd=Math.abs(q-p); if(dd<bd||(dd===bd&&q<best)){ bd=dd; best=q; } }); return best; }
/* ---------- the pieces ---------- */
const SONGS={
 jasmine:{zh:'茉莉花',en:'Jasmine Flower',ar:'زهرة الياسمين',pd:1,bar:4,mel:`3 3_ 5_ 6_ 1'_ 1'_ 6_ | 5 5_ 6_ 5 - | 3 3_ 5_ 6_ 1'_ 1'_ 6_ | 5 5_ 6_ 5 - | 5 5 5 3_ 5_ | 6 6 5 - | 3 2_ 3_ 5 3_ 2_ | 1 1_ 2_ 1 - | 3_ 2_ 1_ 3_ 2 3_ 5_ | 6_ 1'_ 5 - - | 2 3_ 5_ 2_ 3_ 1_ 6,_ | 5, - - - | 6,_ 1_ 2 3_ 1_ 2_ 1_ | 6,_ 5,_ 5, - - |`,
   info:{en:'Folk song from Jiangsu, known since the 1700s. Puccini quoted it in his opera Turandot.',ar:'أغنية شعبية من جيانغسو تعود إلى القرن الثامن عشر، واقتبسها بوتشيني في أوبرا توراندوت.'}},
 farewell:{zh:'送别',en:'Farewell',ar:'الوداع',pd:1,bar:4,mel:`5 3_ 5_ 1' - | 6 1' 5 - | 5 1_ 2_ 3 2_ 1_ | 2 - - - | 5 3_ 5_ 1'. 7_ | 6 1' 5 - | 5 2_ 3_ 4. 7,_ | 1 - - - | 6 1' 1' - | 7 6_ 7_ 1' - | 6_ 7_ 1'_ 6_ 6_ 5_ 3_ 1_ | 2 - - - | 5 3_ 5_ 1'. 7_ | 6 1' 5 - | 5 2_ 3_ 4. 7,_ | 1 - - - |`,
   info:{en:'Li Shutong wrote these words in 1915 to an American tune by John Ordway. Every Chinese school still sings it at graduation.',ar:'كتب لي شوتونغ كلماتها عام 1915 على لحن أمريكي لجون أوردواي، وما زالت المدارس الصينية تغنّيها في حفلات التخرّج.'}},
 newyear:{zh:'新年好',en:'Happy New Year',ar:'سنة سعيدة',pd:1,bar:3,mel:`1_ 1_ 1 5, | 3_ 3_ 3 1 | 1_ 3_ 5 5 | 4_ 3_ 2 - | 2_ 3_ 4 4 | 3_ 2_ 3 1 | 1_ 3_ 2 5, | 7,_ 2_ 1 - |`,
   info:{en:'The children’s song every family sings at Spring Festival, set to an old English round.',ar:'أغنية الأطفال التي تغنّيها كل عائلة في عيد الربيع، على لحن إنجليزي قديم.'}},
 tigers:{zh:'两只老虎',en:'Two Tigers',ar:'نمران',pd:1,bar:4,mel:`1 2 3 1 | 1 2 3 1 | 3 4 5 - | 3 4 5 - | 5_ 6_ 5_ 4_ 3 1 | 5_ 6_ 5_ 4_ 3 1 | 1 5, 1 - | 1 5, 1 - |`,
   info:{en:'The same melody as Frère Jacques, sung in China as “Two tigers, one has no ears, one has no tail!”',ar:'لحن «الأخ جاك» نفسه، يغنّيه الصينيون: «نمران، أحدهما بلا أذنين والآخر بلا ذيل!»'}},
 teahouse:{zh:'茶馆',en:'Teahouse',ar:'بيت الشاي',bar:4,mel:`5 6_ 1'_ 6 5 | 3 5_ 6_ 5 - | 2 3_ 5_ 3 2 | 1 2_ 3_ 2 - | 5 6_ 1'_ 2' 1' | 6 1'_ 6_ 5 - | 3 5_ 6_ 5 3 | 2 3_ 2_ 1 - |`,
   info:{en:'Steam over a pot of oolong while players shuffle tiles.',ar:'بخار إبريق شاي الأولونغ بينما يخلط اللاعبون القطع.'}},
 generals:{zh:'点将',en:'Generals Assemble',ar:'استدعاء القادة',bar:4,mel:`6, 6,_ 1_ 2 3 | 6 5_ 3_ 2 - | 3 3_ 5_ 6 5 | 3 2_ 1_ 6, - | 1 1_ 2_ 3 5 | 6 6_ 5_ 3 2 | 3 5_ 3_ 2_ 1_ 6, | 6, - - - |`,
   info:{en:'A march in the minor yu 羽 mode, for the river battles of Chinese chess.',ar:'مارش بنمط «يو» الحزين، لمعارك النهر في الشطرنج الصيني.'}},
 pass:{zh:'华容',en:'Narrow Pass',ar:'الممرّ الضيّق',bar:4,mel:`3 - 5 6 | 5 - 3 2 | 1 - 2 3 | 2 - - - | 3 - 5 1' | 6 - 5 3 | 2 - 3 2 | 1 - - - |`,
   info:{en:'Named after Huarong Pass, where Cao Cao escaped in the Three Kingdoms.',ar:'سُمّيت بممرّ هوارونغ حيث نجا تساو تساو في عصر الممالك الثلاث.'}},
 garden:{zh:'园林',en:'Scholar Garden',ar:'حديقة العالِم',bar:4,mel:`1' 6 5 6 | 1' - 2' - | 6 5 3 5 | 6 - - - | 5 3 2 3 | 5 6 1' 6 | 5 3 2 3 | 1 - - - |`,
   info:{en:'Rockeries, a moon gate and koi ponds in a Suzhou garden.',ar:'صخور وبوّابة القمر وبرك أسماك الكوي في حديقة من سوجو.'}},
 market:{zh:'夜市',en:'Night Market',ar:'السوق الليلي',bar:4,mel:`1_ 1_ 2_ 3_ 5 3 | 2_ 2_ 3_ 5_ 6 5 | 6_ 5_ 3_ 5_ 6_ 1'_ 6 | 5 - - - | 3_ 3_ 5_ 6_ 1' 6 | 5_ 3_ 2_ 3_ 5 3 | 2_ 3_ 2_ 1_ 6,_ 1_ 2 | 1 - - - |`,
   info:{en:'Sizzling woks, lanterns and skewers at a night market.',ar:'أزيز المقالي والفوانيس والأسياخ في سوق ليلي.'}},
 study:{zh:'书院',en:'Study Hall',ar:'قاعة الدرس',bar:4,mel:`5 - 3 - | 2 - 1 - | 2 - 3 5 | 3 - - - | 6 - 5 - | 3 - 2 - | 3 - 2 1 | 1 - - - |`,
   info:{en:'Slow and spacious so it never competes with the voice of the lesson.',ar:'هادئة وواسعة كي لا تنافس صوت الدرس أبدًا.'}},
 ink:{zh:'墨香',en:'Ink & Paper',ar:'عبق الحبر',bar:4,mel:`0 0 5 - | 6 - - - | 0 0 3 - | 2 - - - | 0 0 1' - | 6 - 5 - | 0 0 3 - | 5 - - - |`,
   info:{en:'Grinding an ink stick on the stone before the first stroke.',ar:'طحن عصا الحبر على الحجر قبل الضربة الأولى.'}},
 moon:{zh:'月光',en:'Moonlight',ar:'ضوء القمر',bar:3,mel:`5 - 3 | 2 1 2 | 3 - - | 6, 1 2 | 3 5 6 | 5 - - | 3 2 1 | 6, 1 2 | 1 - - |`,
   info:{en:'A lullaby waltz for Chang’e on the moon and the Mid-Autumn night.',ar:'تهويدة لتشانغ إي على القمر وليلة منتصف الخريف.'}},
 dragon:{zh:'龙舟',en:'Dragon Boats',ar:'قوارب التنين',bar:4,mel:`1 1_ 1_ 6, 1 | 2 2_ 2_ 1 2 | 3 5_ 3_ 2 1 | 2 - - 0 | 5 5_ 5_ 3 5 | 6 6_ 5_ 3 2 | 1 2_ 3_ 2_ 1_ 6, | 1 - - 0 |`,
   info:{en:'Drummers drive the rowers at the Duanwu festival race.',ar:'الطبّالون يقودون المجدّفين في سباق عيد قوارب التنين.'}},
 silk:{zh:'丝路',en:'Silk Road',ar:'طريق الحرير',bar:4,drone:1,mel:`1 b2_ 3_ 4 5 | 4_ 3_ b2_ 3_ 1 - | 5 b6_ 5_ 4 3 | 4 3_ b2_ 1 - | 1' b7_ b6_ 5 4 | 3 4_ 5_ 3 b2 | 1 b2_ 3_ 4_ 3_ b2_ 1_ | 1 - - - |`,
   info:{en:'Chinese plucked strings meet the Arabic Hijaz maqam and the maqsum drum rhythm, like caravans from Chang’an to Baghdad.',ar:'الأوتار الصينية تلتقي بمقام الحجاز العربي وإيقاع المقسوم، كقوافل من تشانغآن إلى بغداد.'}},
 bamboo:{zh:'竹林',en:'Bamboo Grove',ar:'غابة الخيزران',bar:4,mel:`3 - 5 - | 6 5 3 - | 2 - 3 - | 5 - - - | 6 - 1' - | 6 5 3 2 | 3 - 2 - | 1 - - - |`,
   info:{en:'Wind through bamboo, for deep focus and long reading.',ar:'الريح بين أعواد الخيزران، للتركيز العميق والقراءة الطويلة.'}}};
Object.values(SONGS).forEach(s=>s.name=`${s.zh} ${s.en}${s.pd?'':' (original)'}`);
/* track = song + arrangement */
const TRACKS={
 home:   {song:'jasmine', root:65,bpm:76, lead:'koto',     lead2:'shakuhachi',acc:'flow', bass:1,perc:'soft', vol:.9},
 lesson: {song:'study',   root:65,bpm:66, lead:'koto',     lead2:'koto',      acc:'flow', bass:1,perc:'none', vol:.42,adapt:1},
 dict:   {song:'ink',     root:62,bpm:58, lead:'koto',     lead2:'shakuhachi',acc:'pad',  bass:0,perc:'none', vol:.5},
 culture:{song:'farewell',root:63,bpm:70, lead:'fiddle',   lead2:'koto',      acc:'flow', bass:1,perc:'none', vol:.75},
 kitchen:{song:'market',  root:67,bpm:112,lead:'shamisen', lead2:'koto',      acc:'pluck',bass:1,perc:'busy', vol:.75},
 mahjong:{song:'teahouse',root:64,bpm:92, lead:'shamisen', lead2:'shakuhachi',acc:'flow', bass:1,perc:'soft', vol:.7,adapt:1},
 xiangqi:{song:'generals',root:62,bpm:98, lead:'fiddle',   lead2:'shamisen',  acc:'pluck',bass:1,perc:'march',vol:.75,adapt:1},
 klotski:{song:'pass',    root:62,bpm:72, lead:'koto',     lead2:'shakuhachi',acc:'pad',  bass:1,perc:'none', vol:.65,adapt:1},
 riddles:{song:'newyear', root:67,bpm:120,lead:'shakuhachi',lead2:'shamisen', acc:'pluck',bass:1,perc:'festive',vol:.75,adapt:1},
 idioms: {song:'garden',  root:63,bpm:76, lead:'shakuhachi',lead2:'koto',     acc:'flow', bass:1,perc:'none', vol:.65,adapt:1},
 tangram:{song:'tigers',  root:67,bpm:100,lead:'koto',     lead2:'shamisen',  acc:'pluck',bass:1,perc:'soft', vol:.65,adapt:1},
 checkers:{song:'teahouse',root:69,bpm:100,lead:'koto',    lead2:'fiddle',    acc:'pluck',bass:1,perc:'soft', vol:.7,adapt:1},
 code:   {song:'market',  root:62,bpm:96, lead:'koto',     lead2:'shamisen',  acc:'flow', bass:1,perc:'soft', vol:.55,adapt:1},
 write:  {song:'farewell',root:60,bpm:60, lead:'koto',     lead2:'koto',      acc:'pad',  bass:0,perc:'none', vol:.45},
 pad:    {song:'ink',     root:62,bpm:50, lead:null,       lead2:null,        acc:'pad',  bass:0,perc:'none', vol:.3},
 moon:   {song:'moon',    root:64,bpm:84, lead:'koto',     lead2:'shakuhachi',acc:'flow', bass:1,perc:'none', vol:.7},
 dragon: {song:'dragon',  root:65,bpm:126,lead:'shakuhachi',lead2:'shamisen', acc:'pluck',bass:1,perc:'dragon',vol:.72,adapt:1},
 silk:   {song:'silk',    root:62,bpm:96, lead:'shamisen', lead2:'fiddle',    acc:'drone',bass:1,perc:'maqsum',vol:.72},
 bamboo: {song:'bamboo',  root:62,bpm:60, lead:'shakuhachi',lead2:'koto',     acc:'flow', bass:0,perc:'none', vol:.55},
 sectors:{song:'garden',  root:65,bpm:84, lead:'koto',     lead2:'fiddle',    acc:'pluck',bass:1,perc:'soft', vol:.6}};
Object.values(TRACKS).forEach(tr=>tr.name=SONGS[tr.song].name);
const PLAYLISTS={calm:['lesson','bamboo','dict','klotski','moon','write'],festive:['riddles','dragon','kitchen','tangram','xiangqi'],classic:['home','culture','silk','mahjong','idioms','moon']};
const ALL_TRACKS=['home','culture','silk','moon','dragon','bamboo','mahjong','idioms','kitchen','riddles','xiangqi','klotski','tangram','lesson','dict','code','write'];
const PERC={none:[],soft:[['woodblock',79,[0],.35],['woodblock',72,[2],.25]],busy:[['woodblock',79,[0,1,1.5,2,3],.32],['taiko',43,[0],.5]],
  march:[['taiko',36,[0,2,2.5],.8],['taiko',48,[1,3],.35]],festive:[['taiko',43,[0,1.5,2],.65],['woodblock',79,[.5,1,2.5],.3],['agogo',72,[1],.25]],
  dragon:[['taiko',36,[0,1,2,3],.75],['taiko',48,[.5,2.5],.35],['woodblock',79,[1.5,3.5],.28]],
  maqsum:[['taiko',36,[0,2],.7],['woodblock',79,[.5,1.5,3],.32],['woodblock',72,[3.5],.18]]};
/* ---------- the arranger: a new arrangement on every pass ----------
   section 0: theme on lead   1: theme on lead2 with grace notes and glissandi
   2: variation with passing notes, octave doubling and full drive   3: breakdown (bells + pad), rolled cadence */
function arrange(tr,lap){ const sg=SONGS[tr.song], {notes,len}=jianpu(sg.mel,tr.root), bar=sg.bar, L=Math.ceil(len/bar)*bar, sec=lap%4, ev=[];
  const ch=sg.drone?Array.from({length:L/bar},()=>[0,[0,7,12]]):harmonise(notes,L,bar,tr.root);
  const night=MUS.night, R=(a=>()=>{ a=(a*16807+lap*7+1)%2147483647; return a/2147483647; })(lap*97+tr.root);
  const lead=sec===0?tr.lead:sec===1?tr.lead2:sec===2?(tr.lead||tr.lead2):null;
  const push=(t,i,p,v,d,l)=>ev.push({t,i,p,v,d,l});
  if(lead){ notes.forEach((n,k)=>{ let p=n.p, v=(n.t%bar===0?.95:.78)*(lead==='fiddle'?.75:1), d=n.d;
      if(lead==='shakuhachi'&&p<tr.root+5) p+=12;
      if(sec===1&&n.d>=1&&k>0&&!sg.drone){ const gp=lead==='shakuhachi'||lead==='fiddle'?snapPenta(p-2,tr.root):snapPenta(p+2,tr.root); if(gp!==p) push(n.t-.12,lead,gp,v*.45,.12,'lead'); }
      if(sec===2&&!sg.drone){ const nx=notes[k+1]; if(nx&&n.d>=1&&Math.abs(nx.p-n.p)>=3&&Math.abs(nx.p-n.p)<=7&&nx.t-n.t>=1){ d=n.d-.5; const mid=snapPenta(Math.round((n.p+nx.p)/2),tr.root); if(mid!==n.p&&mid!==nx.p) push(n.t+d,lead,mid+(lead==='shakuhachi'&&mid<tr.root+5?12:0),v*.6,.5,'lead'); }
        if(lead==='koto'&&n.t%bar===0) push(n.t,'koto',p+12,v*.35,d,'lead'); }
      push(n.t,lead,p,v,d,'lead'); }); }
  if(sec===3&&tr.lead) notes.filter(n=>n.d>=1||n.t%bar===0).forEach(n=>push(n.t,'glockenspiel',Math.max(84,n.p+24-(n.p+24>98?12:0)),.5,n.d,'lead'));
  ch.forEach(([r,pcs],b)=>{ const t0=b*bar, base=tr.root-12+r-(r>5?12:0), tones=[base,base+(pcs[1]-pcs[0]+12)%12,base+7,base+12], lastBar=b===ch.length-1;
    if(tr.bass&&!(sec===3&&b%2)){ push(t0,'pizzicato',base-12,.75,1,'bass'); if(bar===4&&sec!==3) push(t0+2,'pizzicato',sg.drone?base-12:base-5,.5,1,'bass'); if(sec===2&&bar===4) push(t0+3.5,'pizzicato',base-12+(R()<.5?2:-3),.35,.5,'bass'); }
    const acc=sec===3?'pad':tr.acc;
    if(acc==='flow'){ const pats=[[0,2,1,3,2,1,3,2],[0,1,2,3,2,1,2,3],[0,2,3,2,1,2,3,1]], pat=pats[(lap+b)%3]; for(let k=0;k<bar*2;k++) push(t0+k/2,'koto',tones[pat[k%8]],(k%2?.28:.38)*(night?.85:1),.6,'acc'); }
    if(acc==='pluck'){ for(let k=0;k<bar;k++){ push(t0+k+.5,'shamisen',tones[1],.3,.3,'acc'); push(t0+k+.5,'shamisen',tones[2],.25,.3,'acc'); } if(sec===2) push(t0,'koto',tones[3],.3,1,'acc'); }
    if(acc==='pad'){ push(t0,'fiddle',tones[1]+12,.18,bar-.2,'acc'); push(t0,'koto',tones[0],.35,2,'acc'); push(t0+bar/2,'koto',tones[2],.25,2,'acc'); }
    if(acc==='drone'){ push(t0,'fiddle',tr.root-12,.16,bar-.1,'acc'); push(t0,'koto',tr.root,.3,2,'acc'); push(t0+bar/2,'koto',tr.root+7,.22,2,'acc'); }
    if(sec!==3) (PERC[tr.perc]||[]).forEach(([inst,p,beats,v])=>beats.forEach(bt=>{ if(bt<bar) push(t0+bt,inst,p,v*(b%2&&bt===0?.8:1),.3,'perc'); }));
    /* drive layer: silent until the learner is on a streak (adaptive) */
    if(tr.adapt&&sec!==3){ push(t0,'taiko',36,.55,.3,'drive'); if(bar===4){ push(t0+2,'taiko',43,.4,.3,'drive'); } for(let k=0;k<bar*2;k++) push(t0+k/2,'woodblock',k%2?72:79,k%2?.14:.2,.2,'drive');
      if(b%2===1) push(t0+bar-.5,'glockenspiel',tones[2]+24>98?tones[2]+12:tones[2]+24,.25,.5,'drive'); }
    if(lastBar&&sec===3){ [0,2,4,7,12].forEach((s,k)=>push(t0+bar-1+k*.07,'koto',tr.root+s,.32,1.2,'acc')); push(t0+bar-1,'tubular',60,.22,2,'acc'); } });
  if(sec===1&&tr.acc==='flow') for(let k=0;k<9;k++) push(-.5+k*.055,'koto',tr.root+[0,2,4,7,9,12,14,16,19][k],.3,.4,'acc');
  ev.sort((a,b)=>a.t-b.t); return {ev,len:L}; }
/* ---------- scheduler ---------- */
function musTick(){ const c=AC, tr=MUS.cur; if(!c||!tr||!MUS.ready) return; const ahead=c.currentTime+.35;
  for(let guard=0;guard<400;guard++){ if(MUS.ei>=MUS.ev.length){ MUS.base+=MUS.len; MUS.lap++;
      if(S.mmode&&S.mmode!=='auto'&&S.mmode!=='fav'&&MUS.lap%4===0){ const pl=PLAYLISTS[S.mmode]; if(pl){ const nx=pl[(pl.indexOf(MUS.key)+1)%pl.length]; setTimeout(()=>musPlay(nx,{force:1}),0); return; } }
      const a=arrange(tr,MUS.lap); MUS.ev=a.ev; MUS.len=a.len; MUS.ei=0; }
    const e=MUS.ev[MUS.ei]; const tt=MUS.t0+(MUS.base+e.t)*MUS.spb; if(tt>ahead) break;
    if(tt>c.currentTime-.05&&!(e.l==='drive'&&MUS.int===0)){ const hum=(Math.random()-.5)*.014; note(e.i,e.p,Math.max(c.currentTime,tt+hum),e.v*(.92+Math.random()*.12),e.d*MUS.spb,null,MUS.L[e.l]); }
    MUS.ei++; } }
/* ---------- adaptive intensity: the drive layer joins as the answer streak grows ---------- */
const INT_GAIN={perc:[.75,1,1.15],drive:[0,.45,.9],acc:[.9,1,1.06],lead:[1,1,1.04],bass:[.9,1,1.1]};
function setIntensity(n){ n=Math.max(0,Math.min(2,n)); if(MUS.night) n=Math.min(n,1); if(S.madapt===false) n=0; MUS.int=n; if(!AC) return; const t=AC.currentTime;
  for(const l in MUS.L) MUS.L[l].gain.setTargetAtTime((INT_GAIN[l]||[1,1,1])[n]*(MUS.night&&l==='perc'?.7:1),t,.6); }
function streakHit(ok){ if(ok){ MUS.streak++; const n=MUS.streak>=6?2:MUS.streak>=3?1:0; if(n>MUS.int){ setIntensity(n); if(n===2&&MUS.ready&&MUS.cur) [0,4,7,12].forEach((s,k)=>fx('koto',(MUS.cur.root||65)+12+s,.4,.6,k*.06)); } }
  else { MUS.streak=0; setIntensity(0); }
  clearTimeout(MUS.intT); MUS.intT=setTimeout(()=>{ MUS.streak=0; setIntensity(0); },30000); }
/* ---------- control ---------- */
function moodKey(key){ const m=S.mmode||'auto'; if(MUS.manual) return MUS.manual;
  if(m==='fav'&&S.mfav&&TRACKS[S.mfav]) return S.mfav;
  const pl=PLAYLISTS[m]; if(pl) return pl.includes(MUS.key)?MUS.key:pl[Math.floor(Math.random()*pl.length)];
  return key; }
function isNight(){ const h=new Date().getHours(); return (h>=22||h<6)&&(S.mmode||'auto')==='auto'; }
function musPlay(key,opt={}){ if(!TRACKS[key]) key="home"; if(!opt.force) MUS.want=key; const eff=opt.force?key:moodKey(key); if(opt.force) MUS.manual=null;
  if(MUS.key===eff&&MUS.node) return; MUS.key=eff;
  if(!MUS.unlocked||musVol()===0) return; const c=musInit(); if(!c) return; if(c.state==='suspended') c.resume();
  if(MUS.node){ const old=MUS.node; try{ old.gain.cancelScheduledValues(c.currentTime); old.gain.setValueAtTime(old.gain.value,c.currentTime); old.gain.linearRampToValueAtTime(0,c.currentTime+1.6);}catch(e){} setTimeout(()=>{try{old.disconnect();}catch(e){}},1800); }
  const tr=TRACKS[eff]; MUS.cur=tr; MUS.night=isNight(); MUS.lap=0; MUS.base=0; MUS.ei=0; MUS.spb=60/(tr.bpm*(MUS.night?.92:1));
  const a=arrange(tr,0); MUS.ev=a.ev; MUS.len=a.len;
  MUS.node=c.createGain(); MUS.node.gain.setValueAtTime(0,c.currentTime); MUS.node.gain.linearRampToValueAtTime(tr.vol,c.currentTime+1.6); MUS.node.connect(MUS.master);
  MUS.L={}; ['lead','acc','bass','perc','drive'].forEach(l=>{ const g=c.createGain(); g.gain.value=(INT_GAIN[l]||[1])[0]; g.connect(MUS.node); MUS.L[l]=g; });
  setIntensity(tr.adapt?MUS.int:0);
  loadSamples().then(()=>{ if(MUS.cur!==tr) return; MUS.t0=AC.currentTime+.3; if(!MUS.timer) MUS.timer=setInterval(musTick,50); musTick(); });
  try{ document.dispatchEvent(new CustomEvent('hp-music')); }catch(e){} }
function musStop(){ if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null;} if(MUS.node&&AC){ const n=MUS.node; try{ n.gain.setValueAtTime(n.gain.value,AC.currentTime); n.gain.linearRampToValueAtTime(0,AC.currentTime+.5);}catch(e){} setTimeout(()=>{try{n.disconnect();}catch(e){}},600); } MUS.node=null; MUS.cur=null; MUS.key=null; }
function musSetVol(v){ v=+v; if(v>0) S.mvLast=v; S.mv=v; S.music=v>0; save();
  if(v===0){ musStop(); return; } if(MUS.master&&AC) MUS.master.gain.setTargetAtTime(v*.85,AC.currentTime,.1);
  if(!MUS.node){ const k=MUS.want||trackFor(route); MUS.key=null; musPlay(k); } }
function musNext(dir=1){ const pl=PLAYLISTS[S.mmode]||ALL_TRACKS; let i=pl.indexOf(MUS.key); if(i<0) i=dir>0?-1:0; const nx=pl[(i+dir+pl.length)%pl.length];
  if(!musVol()) musSetVol(S.mvLast||.6); musPlay(nx,{force:1}); if(!PLAYLISTS[S.mmode]) MUS.manual=nx; }
function musDuck(sec=1.8){ if(!MUS.duck||!AC) return; const g=MUS.duck.gain, t=AC.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(.2,t,.06); g.setTargetAtTime(1,t+sec,.4); }
const CULT_TRACK={music:'pad',kitchen:'kitchen',legends:'moon',traditions:'dragon',history:'silk',science:'bamboo',symbols:'idioms',society:'culture'};
function trackFor(r){ const n=r.name;
  if(n==='game') return TRACKS[r.arg]?r.arg:'home';
  if(n==='lesson'||n==='review') return 'lesson';
  if(n==='dict'||n==='word'||n==='builder') return 'dict'; if(n==='sectors'||n==='sector'||n==='accents') return 'sectors';
  if(n==='write'||n==='writehub') return 'write';
  if(n==='code'||n==='codeunit') return 'code';
  if(n==='recipe') return 'kitchen';
  if(n==='section') return CULT_TRACK[(CULTURE[r.arg]||{}).k]||'culture';
  if(n==='reader') return Object.values(CULT_TRACK).includes(MUS.want)?MUS.want:'culture';
  if(n==='culture') return 'culture';
  return 'home'; }
/* a manual pick holds until the learner moves to a different part of the app */
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('.tab'); if(t) MUS.manual=null; },true);
function musUnlock(){ if(MUS.unlocked) return; MUS.unlocked=true; const c=ac(); if(c&&c.state==='suspended') c.resume(); setTimeout(loadSamples,60); const k=MUS.want||trackFor(route); MUS.key=null; musPlay(k); ambStart(S.amb||'none'); }
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,musUnlock,{passive:true}));
document.addEventListener('visibilitychange',()=>{ if(!AC) return; if(document.hidden) AC.suspend(); else if(MUS.unlocked) AC.resume(); });
/* ---------- ambient soundscapes (synthesised live, never loop-identical) ---------- */
const AMB={kind:'none',nodes:[],timer:null};
const AMB_LIST=[['none','—','None','بلا'],['rain','雨','Rain on tiles','مطر على القرميد'],['stream','溪','Mountain stream','جدول جبلي'],['wind','风','Desert wind','ريح الصحراء'],['temple','寺','Temple bells','أجراس المعبد'],['night','夜','Summer night','ليلة صيفية']];
function noiseBuf(brown){ const c=AC, k=brown?'_bn':'_wn'; if(MUS[k]) return MUS[k]; const n=c.sampleRate*4, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); let last=0;
  for(let i=0;i<n;i++){ const w=Math.random()*2-1; if(brown){ last=(last+.02*w)/1.02; d[i]=last*3.5; } else d[i]=w; } MUS[k]=b; return b; }
function ambSrc(brown,dest,chain){ const c=AC, s=c.createBufferSource(); s.buffer=noiseBuf(brown); s.loop=true; s.loopStart=Math.random()*2; let n=s; chain.forEach(x=>{ n.connect(x); n=x; }); n.connect(dest); s.start(c.currentTime+.01,Math.random()*3); AMB.nodes.push(s); return s; }
function lfo(param,rate,depth){ const c=AC, o=c.createOscillator(), g=c.createGain(); o.frequency.value=rate; g.gain.value=depth; o.connect(g); g.connect(param); o.start(); AMB.nodes.push(o); }
function filt(type,f,q=.7){ const x=AC.createBiquadFilter(); x.type=type; x.frequency.value=f; x.Q.value=q; return x; }
function gain(v){ const g=AC.createGain(); g.gain.value=v; return g; }
function blip(f0,f1,dur,v,type='sine'){ const c=AC, t=c.currentTime+.01, o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(MUS.amb); o.start(t); o.stop(t+dur+.05); }
function drop(){ const c=AC, t=c.currentTime+.01, s=c.createBufferSource(); s.buffer=noiseBuf(false); const f=filt('bandpass',2200+Math.random()*4200,7), g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.04+Math.random()*.06,t+.003); g.gain.exponentialRampToValueAtTime(.0001,t+.05); s.connect(f); f.connect(g); g.connect(MUS.amb); s.start(t,Math.random()*3,.08); }
function windBed(level){ const lp=filt('lowpass',520), g=gain(level); ambSrc(true,MUS.amb,[lp,g]); lfo(g.gain,.07,level*.6); lfo(lp.frequency,.045,220);
  const bp=filt('bandpass',900,12), wg=gain(level*.18); ambSrc(false,MUS.amb,[bp,wg]); lfo(bp.frequency,.05,320); }
function ambStop(){ if(AMB.timer){ clearInterval(AMB.timer); AMB.timer=null; } AMB.nodes.forEach(n=>{ try{ n.stop(); }catch(e){} try{ n.disconnect(); }catch(e){} }); AMB.nodes=[]; }
function ambStart(kind){ S.amb=kind; const c=musInit(); if(!c) return; ambStop(); AMB.kind=kind; MUS.amb.gain.setTargetAtTime(kind==='none'?0:(S.av??.5)*.9,c.currentTime,.4); if(kind==='none'||!MUS.unlocked) return;
  if(kind==='rain'){ ambSrc(false,MUS.amb,[filt('highpass',900),filt('lowpass',6500),gain(.2)]); ambSrc(true,MUS.amb,[filt('lowpass',300),gain(.35)]); AMB.timer=setInterval(()=>{ for(let k=0;k<3;k++) if(Math.random()<.55) setTimeout(drop,Math.random()*60); },70); }
  if(kind==='stream'){ const b1=filt('bandpass',520,.6); ambSrc(true,MUS.amb,[b1,gain(.9)]); lfo(b1.frequency,.13,240); const b2=filt('bandpass',2300,1.3); ambSrc(false,MUS.amb,[b2,gain(.07)]); lfo(b2.frequency,.37,700);
    AMB.timer=setInterval(()=>{ if(Math.random()<.35){ const f=380+Math.random()*520; blip(f,f*1.6,.07,.025); } },120); }
  if(kind==='wind') windBed(.9);
  if(kind==='temple'){ windBed(.35); let n=0; AMB.timer=setInterval(()=>{ n++; if(MUS.ready&&n%(14+Math.floor(Math.random()*12))===0) note('tubular',[48,55,60][Math.floor(Math.random()*3)],.3,4,MUS.amb);
      if(MUS.ready&&n%37===0) [0,1.1,2.2].forEach(d=>setTimeout(()=>note('woodblock',72,.22,.3,MUS.amb),d*1000)); },1000); }
  if(kind==='night'){ windBed(.18); AMB.timer=setInterval(()=>{ if(Math.random()<.7){ const f=4200+Math.random()*500, v=.012+Math.random()*.018; [0,55,110].forEach(d=>setTimeout(()=>blip(f,f*.98,.03,v,'triangle'),d)); }
      if(Math.random()<.04) blip(620,480,.25,.02); },700); } }
function ambVol(v){ S.av=+v; save(); if(MUS.amb&&AC) MUS.amb.gain.setTargetAtTime(AMB.kind==='none'?0:v*.9,AC.currentTime,.2); }
/* ---------- player sheet ---------- */
const INST_INFO={koto:['古筝','guzheng','Guzheng zither','القانون الصيني «قوتشنغ»',60],shamisen:['琵琶','pípa','Pipa lute','العود الصيني «بيبا»',64],shakuhachi:['笛子','dízi','Dizi flute','الناي «ديزي»',72],fiddle:['二胡','èrhú','Erhu fiddle','الربابة «إرهو»',64],
  pizzicato:['贝斯','bèisī','Bass','الباص',43],taiko:['大鼓','dàgǔ','Big drum','الطبل الكبير',36],woodblock:['木鱼','mùyú','Wooden fish','السمكة الخشبية',79],glockenspiel:['铃','líng','Bells','الأجراس',88],tubular:['编钟','biānzhōng','Bronze bells','الأجراس البرونزية',60]};
function trackInsts(tr){ const s=new Set([tr.lead,tr.lead2].filter(Boolean)); if(tr.acc==='flow'||tr.acc==='pad'||tr.acc==='drone') s.add('koto'); if(tr.acc==='pluck') s.add('shamisen'); if(tr.acc==='pad'||tr.acc==='drone') s.add('fiddle'); if(tr.bass) s.add('pizzicato'); (PERC[tr.perc]||[]).forEach(p=>s.add(p[0])); s.add('glockenspiel'); return [...s].filter(i=>INST_INFO[i]); }
const MOODS=[['auto','自','Auto','تلقائي'],['calm','静','Calm','هادئ'],['festive','乐','Festive','احتفالي'],['classic','雅','Classic','كلاسيكي'],['fav','♥','Favorite','المفضّلة']];
function musicSheet(){ const A=isAr(), key=MUS.key||MUS.want||trackFor(route), tr=TRACKS[key], sg=SONGS[tr.song], on=musVol()>0, mode=S.mmode||'auto';
  const T=(ar,en)=>A?ar:en;
  sheet(`<div class="msheet">
   <div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">🎶 ${T('الموسيقى والأجواء','Music & ambience')}</h3><canvas id="mviz" width="120" height="34" style="width:120px;height:34px"></canvas></div>
   <div class="mnow"><div class="mzh brush">${sg.zh}</div><div class="grow" style="min-width:0"><b>${A?sg.ar:sg.en}</b>${sg.pd?`<span class="mtag">${T('تراث','Traditional')}</span>`:`<span class="mtag">${T('مؤلَّفة للتطبيق','Original')}</span>`}
     <div class="sub" style="color:var(--ivory);margin-top:4px">${A?sg.info.ar:sg.info.en}</div>
     <div class="sub" style="margin-top:4px">♩ <span class="num">${Math.round(tr.bpm*(MUS.night?.92:1))}</span> BPM · ${T('القسم','Section')} <span class="num" id="msec">${(MUS.lap%4)+1}</span>/4${tr.adapt?` · ⚡ ${T('تتفاعل مع أدائك','reacts to your streak')}`:''}</div></div></div>
   <div class="mctl"><button class="mbtn" id="mprev" aria-label="previous">⏮</button><button class="mbtn big" id="mplay" aria-label="play">${on?'⏸':'▶'}</button><button class="mbtn" id="mnext" aria-label="next">⏭</button><button class="mbtn ${S.mfav===key?'fav':''}" id="mfav" aria-label="favorite">${S.mfav===key?'♥':'♡'}</button></div>
   <div class="mlbl">${T('الآلات في هذه المقطوعة · المس للاستماع','Instruments in this piece · tap to hear')}</div>
   <div class="minst">${trackInsts(tr).map(i=>{ const x=INST_INFO[i]; return `<button class="mi" data-ins="${i}"><span class="han">${x[0]}</span><small>${x[1]}</small><em>${A?x[3]:x[2]}</em></button>`; }).join('')}</div>
   <div class="mlbl">${T('المزاج','Mood')}</div>
   <div class="mseg">${MOODS.map(([k,zh,en,ar])=>`<button data-mode="${k}" class="${mode===k?'on':''}"><span class="han">${zh}</span>${A?ar:en}</button>`).join('')}</div>
   <div class="mrow"><span>🎵 ${T('الموسيقى','Music')}</span><input type="range" id="mv" min="0" max="1" step=".05" value="${musVol()}"></div>
   <div class="mrow"><span>🔔 ${T('المؤثرات','Effects')}</span><input type="range" id="fxv" min="0" max="1" step=".05" value="${S.sound===false?0:fxVol()}"></div>
   <div class="mlbl">${T('الأجواء المحيطة · تعمل حتى مع إيقاف الموسيقى','Ambience · plays even with music off')}</div>
   <div class="mseg amb">${AMB_LIST.map(([k,zh,en,ar])=>`<button data-amb="${k}" class="${(S.amb||'none')===k?'on':''}"><span class="han">${zh}</span>${A?ar:en}</button>`).join('')}</div>
   <div class="mrow"><span>🌿 ${T('مستوى الأجواء','Ambience level')}</span><input type="range" id="av" min="0" max="1" step=".05" value="${S.av??.5}"></div>
   <label class="mrow chk"><span>⚡ ${T('موسيقى تتصاعد مع إجاباتك الصحيحة المتتالية','Music builds up with your answer streak')}</span><input type="checkbox" id="madapt" ${S.madapt===false?'':'checked'}></label>
   <div class="sub" style="font-size:11.5px;opacity:.7">${T('آلات مسجّلة حقيقية (FluidR3، CC BY 3.0) تؤدّي أدوار الآلات الصينية. في الليل تهدأ الموسيقى تلقائيًا.','Real recorded instruments (FluidR3, CC BY 3.0) voice the Chinese ones. After 10 pm the music automatically calms down.')}</div></div>`,
  sh=>{ const re=()=>setTimeout(musicSheet,60);
    $('#mplay',sh).onclick=()=>{ musUnlock(); musSetVol(musVol()?0:(S.mvLast||.6)); re(); refreshMusChip(); };
    $('#mnext',sh).onclick=()=>{ musUnlock(); musNext(1); re(); }; $('#mprev',sh).onclick=()=>{ musUnlock(); musNext(-1); re(); };
    $('#mfav',sh).onclick=()=>{ S.mfav=S.mfav===key?null:key; if(S.mfav){ S.mmode='fav'; toast('♥ '+sg.zh); } save(); re(); };
    $$('[data-ins]',sh).forEach(b=>b.onclick=()=>{ musUnlock(); const i=b.dataset.ins, r=INST_INFO[i][4]; if(i==='taiko'||i==='woodblock'||i==='tubular') fx(i,r,.9,1.5); else [0,2,4,7].forEach((s,k)=>fx(i,r+s,.8,.7,k*.18)); });
    $$('[data-mode]',sh).forEach(b=>b.onclick=()=>{ S.mmode=b.dataset.mode; if(S.mmode==='fav'&&!S.mfav) S.mfav=key; MUS.manual=null; save(); musUnlock(); musPlay(MUS.want||trackFor(route)); re(); });
    $('#mv',sh).oninput=e=>{ musUnlock(); musSetVol(e.target.value); refreshMusChip(); }; $('#mv',sh).onchange=re;
    $('#fxv',sh).oninput=e=>{ const v=+e.target.value; S.fxv=v; S.sound=v>0; save(); if(MUS.fx&&AC) MUS.fx.gain.setTargetAtTime(v,AC.currentTime,.05); }; $('#fxv',sh).onchange=()=>SFX.ok();
    $$('[data-amb]',sh).forEach(b=>b.onclick=()=>{ musUnlock(); ambStart(b.dataset.amb); save(); $$('[data-amb]',sh).forEach(x=>x.classList.toggle('on',x===b)); });
    $('#av',sh).oninput=e=>ambVol(e.target.value);
    $('#madapt',sh).onchange=e=>{ S.madapt=e.target.checked; save(); setIntensity(S.madapt?MUS.int:0); };
    const cv=$('#mviz',sh), g=cv.getContext('2d'), arr=new Uint8Array(32);
    (function draw(){ if(!document.body.contains(cv)) return; g.clearRect(0,0,120,34); if(MUS.an) MUS.an.getByteFrequencyData(arr);
      for(let i=0;i<16;i++){ const v=(arr[i+1]||0)/255, h=Math.max(2,v*32); g.fillStyle=`rgba(226,183,90,${.35+v*.65})`; g.fillRect(i*7.5,34-h,5,h); }
      const s=$('#msec',sh); if(s) s.textContent=(MUS.lap%4)+1; requestAnimationFrame(draw); })(); }); }
function refreshMusChip(){ $$('[data-act="mus"]').forEach(b=>b.textContent=musVol()?'🎶':'🔇'); }
if(!document.getElementById('musCSS')) document.head.insertAdjacentHTML('beforeend',`<style id="musCSS">
.msheet{display:flex;flex-direction:column;gap:10px}
.mnow{display:flex;gap:12px;align-items:flex-start;background:linear-gradient(135deg,rgba(226,183,90,.16),rgba(150,30,30,.12));border:1px solid rgba(226,183,90,.3);border-radius:16px;padding:12px}
.mzh{font-size:34px;color:var(--gold2);line-height:1.1;white-space:nowrap}
.mtag{display:inline-block;margin-inline-start:6px;font-size:10.5px;padding:1px 7px;border-radius:99px;border:1px solid rgba(226,183,90,.45);color:var(--gold2);vertical-align:middle}
.mctl{display:flex;justify-content:center;gap:14px;align-items:center}
.mbtn{width:46px;height:46px;border-radius:50%;border:1px solid rgba(226,183,90,.35);background:rgba(255,255,255,.04);color:var(--ivory);font-size:18px}
.mbtn.big{width:60px;height:60px;font-size:24px;background:linear-gradient(180deg,var(--gold2),var(--gold3));color:#2a1a07;border:0}
.mbtn.fav{color:#ff6b6b;border-color:#ff6b6b}
.mlbl{font-size:12px;opacity:.75;margin-top:4px}
.minst{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.minst::-webkit-scrollbar{display:none}
.mi{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:78px;padding:8px 6px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--ivory)}
.mi .han{font-size:20px;color:var(--gold2)}.mi small{font-size:10.5px;opacity:.8}.mi em{font-style:normal;font-size:10.5px;opacity:.7;text-align:center}
.mseg{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.mseg.amb{grid-template-columns:repeat(3,1fr)}
.mseg button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 2px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--ivory);font-size:11.5px}
.mseg button .han{font-size:17px;color:var(--gold2)}.mseg button.on{background:rgba(226,183,90,.22);border-color:var(--gold2)}
.mrow{display:flex;align-items:center;gap:10px;justify-content:space-between;font-size:13.5px}.mrow input[type=range]{flex:1;max-width:58%;accent-color:#e2b75a}
.mrow.chk input{width:20px;height:20px;accent-color:#e2b75a}
</style>`);
/* ---------- sound effects from the same recordings (synth fallback until samples load) ---------- */
function fx(inst,midi,vel=1,dur=.6,delay=0){ if(!S.sound) return false; const c=musInit(); if(!c) return false; if(c.state==='suspended') c.resume(); loadSamples();
  if(!MUS.buf[inst]) return false; const g=c.createGain(); g.gain.value=1; g.connect(MUS.fx); const w=c.createGain(); w.gain.value=.4; g.connect(w); w.connect(MUS.rev);
  note(inst,midi,c.currentTime+.01+delay,vel,dur,g); return true; }
function gongSynth(f=98,v=1){ const c=AC; if(!c) return; const t=c.currentTime+.01; [[1,.22,3.2],[1.48,.09,2.2],[2.31,.05,1.4],[3.1,.03,.9]].forEach(([m,a,dc])=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.setValueAtTime(f*m,t); o.frequency.exponentialRampToValueAtTime(f*m*.985,t+dc); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(a*v,t+.006); g.gain.exponentialRampToValueAtTime(.0001,t+dc); o.connect(g); g.connect(MUS.fx||c.destination); o.start(t); o.stop(t+dc+.1); }); }
const SYN=Object.assign({},SFX);
/* correct answers ring in the key of the music that is playing, so effects sound part of the score */
const keyRoot=()=>MUS.cur?60+((MUS.cur.root-60)%12+12)%12:67;
Object.assign(SFX,{
  tap:()=>fx('woodblock',79,.45,.2)||SYN.tap(),
  ok:()=>{ streakHit(true); const r=keyRoot()+12, up=Math.min(MUS.streak,6); if(!fx('koto',r+PENT5[up%5]+(up>=5?12:0),.9,.8)) return SYN.ok(); fx('koto',r+7+(up>=3?5:0),.85,1,.09); fx('glockenspiel',Math.max(84,r+24),.35,1,.16); },
  bad:()=>{ streakHit(false); if(!fx('shamisen',52,.8,.4)) return SYN.bad(); fx('shamisen',51,.7,.5,.13); fx('taiko',43,.35,.4); },
  win:()=>{ const r=keyRoot(); if(!fx('koto',r,.7,.6)) return SYN.win(); [0,2,4,7,9,12,14,16,19,24].forEach((s,i)=>fx('koto',r+s,.75,.9,i*.05)); fx('taiko',36,.9,1,.5); fx('tubular',60,.6,2.5,.5); gongSynth(110,.8); musDuck(2.5); },
  gong:()=>{ if(!fx('tubular',48,.9,3)) return SYN.gong(); fx('timpani',36,.9,2); gongSynth(98,1); musDuck(3); },
  coin:()=>{ if(!fx('glockenspiel',96,.55,.6)) return SYN.coin(); fx('glockenspiel',100,.5,.8,.07); } });
function kotoNote(midi){ if(!fx('koto',midi,.95,1.6)) return false; return true; }
