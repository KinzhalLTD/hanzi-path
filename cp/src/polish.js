/* ===== Polish: a Chinese-instrument sound engine, a Chinese-style icon set, daily quests (每日任务) with a treasure
   chest, and the week-of-lanterns streak calendar. Loaded right after core.js; everything else calls into it. ===== */

/* ---------- sound: guzheng plucks on the pentatonic scale, wood block, taiko drum, bronze bells, gong ---------- */
const SND={ctx:null,out:null,noise:null};
function sctx(){ if(!S.sound) return null; try{ if(!SND.ctx){ const A=window.AudioContext||window.webkitAudioContext; SND.ctx=new A();
      const comp=SND.ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; const g=SND.ctx.createGain(); g.gain.value=.9; comp.connect(g).connect(SND.ctx.destination); SND.out=comp;
      const len=SND.ctx.sampleRate*.6, buf=SND.ctx.createBuffer(1,len,SND.ctx.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; SND.noise=buf; }
    if(SND.ctx.state==='suspended') SND.ctx.resume(); return SND.ctx; }catch(e){ return null; } }
const PENTA=[0,2,4,7,9];                                   // gōng shāng jué zhǐ yǔ
const note=(i,base=523.25)=>base*Math.pow(2,(PENTA[((i%5)+5)%5]+12*Math.floor(i/5))/12);
function pluck(f,t=0,vol=.16,len=.9){ const c=sctx(); if(!c) return; const t0=c.currentTime+t;
  const g=c.createGain(), lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(5200,t0); lp.frequency.exponentialRampToValueAtTime(700,t0+len*.8); lp.Q.value=2;
  g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+.004); g.gain.exponentialRampToValueAtTime(.0001,t0+len);
  [['triangle',1,1],['sawtooth',1.003,.35],['sine',2,.25]].forEach(([ty,m,a])=>{ const o=c.createOscillator(), og=c.createGain(); o.type=ty; o.frequency.setValueAtTime(f*m*1.012,t0); o.frequency.exponentialRampToValueAtTime(f*m,t0+.05); og.gain.value=a; o.connect(og).connect(lp); o.start(t0); o.stop(t0+len+.05); });
  lp.connect(g).connect(SND.out); }
function noiseHit(t,dur,freq,q,vol,type='bandpass'){ const c=sctx(); if(!c) return; const t0=c.currentTime+t, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
  s.buffer=SND.noise; f.type=type; f.frequency.value=freq; f.Q.value=q; g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(.0001,t0+dur); s.connect(f).connect(g).connect(SND.out); s.start(t0); s.stop(t0+dur+.02); }
function wood(t=0,vol=.22,f=1900){ noiseHit(t,.045,f,9,vol); const c=sctx(); if(!c) return; const t0=c.currentTime+t, o=c.createOscillator(), g=c.createGain(); o.frequency.value=f*.5; g.gain.setValueAtTime(vol*.5,t0); g.gain.exponentialRampToValueAtTime(.0001,t0+.05); o.connect(g).connect(SND.out); o.start(t0); o.stop(t0+.06); }
function drum(t=0,vol=.5){ const c=sctx(); if(!c) return; const t0=c.currentTime+t, o=c.createOscillator(), g=c.createGain(); o.frequency.setValueAtTime(120,t0); o.frequency.exponentialRampToValueAtTime(48,t0+.28);
  g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(.0001,t0+.42); o.connect(g).connect(SND.out); o.start(t0); o.stop(t0+.45); noiseHit(t,.08,900,1,vol*.35,'lowpass'); }
function bell(f,t=0,vol=.09,len=1.2){ const c=sctx(); if(!c) return; const t0=c.currentTime+t;
  [[1,1],[2.76,.45],[5.4,.22],[8.9,.1]].forEach(([m,a],i)=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.value=f*m; g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol*a,t0+.003); g.gain.exponentialRampToValueAtTime(.0001,t0+len/(1+i*.6)); o.connect(g).connect(SND.out); o.start(t0); o.stop(t0+len); }); }
function gongS(t=0,vol=.32){ const c=sctx(); if(!c) return; const t0=c.currentTime+t;
  [[72,1,2.6],[108,.5,2.2],[151,.35,1.8],[227,.2,1.4],[301,.12,1]].forEach(([f,a,len])=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.setValueAtTime(f*1.02,t0); o.frequency.exponentialRampToValueAtTime(f,t0+.4);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol*a,t0+.04); g.gain.exponentialRampToValueAtTime(.0001,t0+len); o.connect(g).connect(SND.out); o.start(t0); o.stop(t0+len+.05); });
  noiseHit(t,.9,3200,.6,vol*.12); }
function whoosh(t=0,vol=.1){ const c=sctx(); if(!c) return; const t0=c.currentTime+t, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=SND.noise;
  f.type='bandpass'; f.Q.value=1.2; f.frequency.setValueAtTime(400,t0); f.frequency.exponentialRampToValueAtTime(2600,t0+.22); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+.08); g.gain.exponentialRampToValueAtTime(.0001,t0+.3);
  s.connect(f).connect(g).connect(SND.out); s.start(t0); s.stop(t0+.32); }
Object.assign(SFX,{
  tap:()=>wood(0,.16,2100),
  ok:()=>{ pluck(note(2),0,.15,.7); pluck(note(4),.07,.15,.9); bell(note(9),.12,.05,.8); },
  bad:()=>{ pluck(note(-6),0,.14,.45); drum(.02,.22); },
  win:()=>{ [0,1,2,3,4,5,7].forEach((n,i)=>pluck(note(n),i*.07,.13,.9)); bell(note(10),.5,.08,1.6); drum(0,.35); },
  coin:()=>{ bell(2093,0,.07,.5); bell(2637,.07,.06,.6); },
  gong:()=>gongS(),
  hit:()=>{ drum(0,.45); noiseHit(.01,.12,2400,2,.18); },
  scan:()=>{ for(let i=0;i<5;i++) wood(i*.045,.1,1500+i*250); },
  open:()=>whoosh(0,.07),
  stamp:()=>{ drum(0,.38); wood(.02,.2,700); },
  combo:n=>{ pluck(note(Math.min(14,n)),0,.13,.6); if(n>=5) bell(note(Math.min(14,n)+5),.05,.05,.7); },
  quest:()=>{ [2,4,7].forEach((n,i)=>bell(note(n),i*.09,.07,.9)); },
  chest:()=>{ drum(0,.4); [0,2,4,5,7,9,10].forEach((n,i)=>pluck(note(n),.12+i*.06,.12,1)); gongS(.6,.22); bell(note(12),.6,.07,1.8); }
});

/* ---------- icons: Chinese-flavoured line icons (24 px grid, currentColor) ---------- */
Object.assign(ICON,{
  home:svg('<path d="M2.5 9.5L12 4l9.5 5.5"/><path d="M4.5 9q-.5 2-2.5 2.5M19.5 9q.5 2 2.5 2.5"/><path d="M6 11v9h12v-9"/><path d="M10 20v-5h4v5"/>'),
  learn:svg('<rect x="6" y="4.5" width="12" height="15" rx="1"/><path d="M4 4.5h16M4 19.5h16"/><path d="M9 9h6M9 12h6M9 15h3.5"/>'),
  labs:svg('<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M7 9.5l3 2.5-3 2.5M12.5 14.5h4.5"/>'),
  me:svg('<rect x="5" y="3" width="14" height="12" rx="2"/><path d="M9 7h6M12 7v5M9 10h6"/><path d="M8 21h8M12 15v6"/>'),
  coin:svg('<circle cx="12" cy="12" r="9"/><rect x="9.6" y="9.6" width="4.8" height="4.8"/><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2"/>',16),
  speak:svg('<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16 9.5q2 2.5 0 5M18.5 7q4 5 0 10"/>',18),
  close:svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',18),
  hint:svg('<path d="M12 2.5v2M8.5 5h7"/><path d="M7.5 5.5q-2.5 6.5 0 12.5h9q2.5-6-0-12.5"/><path d="M12 5.5q-2.2 6.5 0 12.5M12 5.5q2.2 6.5 0 12.5"/><path d="M9 18v2.5h6V18"/>',18),
  scroll:svg('<rect x="6" y="4.5" width="12" height="15" rx="1"/><path d="M4 4.5h16M4 19.5h16"/><path d="M9 9h6M9 12h6M9 15h3.5"/>'),
  chest:svg('<path d="M3 11h18v9H3z"/><path d="M3 11q0-6 9-6t9 6"/><path d="M10.5 11v3.5h3V11"/><path d="M7 6.5v4.5M17 6.5v4.5"/>'),
  quest:svg('<path d="M5 21V3.5"/><path d="M5 4h12l-2.5 4L17 12H5"/>'),
  shield:svg('<path d="M12 3l8 3v6q0 6-8 9-8-3-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>'),
  fish:svg('<path d="M2.5 12q5-6.5 12-3.5l4.5-3.5v14l-4.5-3.5q-7 3-12-3.5z"/><circle cx="7" cy="11" r=".9" fill="currentColor"/><path d="M11 9.5q1.5 2.5 0 5"/>'),
  logs:svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 11h7M9 14h7M9 17h4.5"/>'),
  review:svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M9 8.5l-2 2 2 2M12 8.5l2 2-2 2"/>'),
  key:svg('<circle cx="8" cy="15.5" r="4.5"/><path d="M11.2 12.3L20 3.5M16.5 7l3 3M14.3 9.2l2 2"/>'),
  wall:svg('<path d="M3 20.5V9.5h3V6.5h3v3h3V6.5h3v3h3V6.5h3v14z"/><path d="M3 14.5h18M8 14.5v6M14 14.5v6"/>'),
  lock2:svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="9" cy="15.5" r=".9" fill="currentColor"/><circle cx="12" cy="15.5" r=".9" fill="currentColor"/><circle cx="15" cy="15.5" r=".9" fill="currentColor"/>'),
  code:svg('<path d="M8.5 6.5L3 12l5.5 5.5M15.5 6.5L21 12l-5.5 5.5"/><path d="M13.5 4.5l-3 15"/>'),
  tile:svg('<rect x="6" y="3" width="12" height="18" rx="2.5"/><circle cx="12" cy="9" r="2.2"/><path d="M9 15.5h6"/>'),
  puzzle:svg('<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z"/>'),
  sticks:svg('<path d="M8 21l-2-15M12 21V4M16 21l2-15"/><path d="M7 21h10"/>'),
  trophy:svg('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5q0 4 4 4.5M16 6h3.5q0 4-4 4.5"/><path d="M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>'),
  chat:svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
  play:svg('<path d="M8 5v14l11-7z"/>',18),
  retry:svg('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>',18),
  back:svg('<path d="M15 5l-7 7 7 7"/>',20),
  fwd:svg('<path d="M9 5l7 7-7 7"/>',20),
  exam:svg('<path d="M7 3h10v18H7z"/><path d="M10 7h4M10 10.5h4"/><path d="M9.5 15l1.5 1.5 3-3"/>'),
  fire:svg('<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',16)
});
ICON.bit=ICON.coin; coinHTML=`<span class="ltr coin" style="color:var(--amber);display:inline-flex">${ICON.coin}</span>`;
/* medallion: an icon in a coloured enamel disc (red, gold, jade, blue, ink) */
const ico=(name,tone='red',size='')=>`<span class="ico ${tone} ${size}" aria-hidden="true">${ICON[name]||''}</span>`;
const backIcon=()=>isAr()?ICON.fwd:ICON.back;

/* ---------- daily quests 每日任务: three seeded quests, each pays bits; all three open the treasure chest ---------- */
const QUEST_POOL=[['right',10,'أجب 10 إجابات صحيحة','Answer 10 questions right'],['right',20,'أجب 20 إجابة صحيحة','Answer 20 questions right'],['lab',1,'حلّ مختبرًا واحدًا','Solve 1 lab'],['lab',3,'حلّ 3 مختبرات','Solve 3 labs'],
  ['term',8,'تدرّب على 8 مصطلحات صينية','Practise 8 Chinese terms'],['boss',1,'اهزم وحشًا واحدًا','Defeat 1 boss'],['combo',5,'اصنع 5 متتالية','Hit a 5-combo'],['xp',60,'اجمع 60 نقطة خبرة','Earn 60 XP'],['lesson',3,'اقرأ 3 دروس','Read 3 lessons'],['talk',1,'أكمل محادثة عمل','Finish a conversation']];
function quests(){ const d=today(); if(!S.qd||S.qd.d!==d){ const r=seeded('quest'+d); const pool=QUEST_POOL.slice(), pick3=[]; const kinds=new Set();
    while(pick3.length<3&&pool.length){ const q=pool.splice(Math.floor(r()*pool.length),1)[0]; if(kinds.has(q[0])) continue; kinds.add(q[0]); pick3.push({k:q[0],goal:q[1],n:0,a:q[2],e:q[3],done:0}); }
    S.qd={d,q:pick3,chest:0}; save(); } return S.qd; }
function questEvent(kind,n=1,max=false){ try{ const qd=quests(); let changed=false;
  qd.q.forEach(q=>{ if(q.k!==kind||q.done) return; q.n=max?Math.max(q.n,n):q.n+n; changed=true;
    if(q.n>=q.goal){ q.n=q.goal; q.done=1; setTimeout(()=>{ SFX.quest(); haptic('success'); toast(`📜 ${isAr()?'مهمة منجزة':'Quest done'}: ${isAr()?q.a:q.e} · +15`); S.coins+=15; save(); updateTop(); },300); } });
  if(changed) save(); }catch(e){} }
const questsDone=()=>quests().q.every(q=>q.done);
function questWidget(){ const qd=quests(), all=questsDone();
  return `<div class="card quests"><div class="row"><span class="brushzh" style="font-size:20px">每日任务</span><b class="grow">${isAr()?'مهام اليوم':'Daily quests'}</b><span class="sub num">${qd.q.filter(q=>q.done).length}/3</span></div>
    ${qd.q.map(q=>`<div class="qrow ${q.done?'done':''}">${ico(q.done?'shield':'quest',q.done?'jade':'gold','sm')}<div class="grow"><div class="qt">${esc(isAr()?q.a:q.e)}</div><div class="bar thin"><i style="width:${q.n/q.goal*100}%"></i></div></div><span class="num sub">${q.n}/${q.goal}</span></div>`).join('')}
    <button class="chestbtn ${qd.chest?'opened':all?'ready':''}" id="chest" ${qd.chest||!all?'aria-disabled="true"':''}>${ico('chest',qd.chest?'ink':all?'red':'ink')}<div class="grow"><b>${isAr()?'صندوق الكنز':'Treasure chest'} 宝箱</b><div class="sub">${qd.chest?(isAr()?'فُتح اليوم ✓':'Opened today ✓'):all?(isAr()?'جاهز! اضغط لفتحه':'Ready! Tap to open'):(isAr()?'أنجز المهام الثلاث لفتحه':'Finish all three quests to open')}</div></div></button></div>`; }
function bindQuests(m){ const b=$('#chest',m); if(!b) return; b.onclick=()=>{ const qd=quests(); if(qd.chest) return; if(!questsDone()){ SFX.bad(); b.classList.add('nudge'); setTimeout(()=>b.classList.remove('nudge'),400); return; }
  qd.chest=1; const amt=60+Math.min(40,S.streak*4); const freeze=seeded('chest'+today())()<.35; if(freeze) S.freezes=(S.freezes||0)+1; save(); SFX.chest(); haptic('success'); fireworks(5); confetti(120);
  sheet(`<div class="result" style="padding-top:4px"><div class="chestbig">${ICON.chest}</div><span class="brushzh">宝箱 · bǎoxiāng</span><h1 class="num">+${amt} ${t('bitsCur')}</h1>${freeze?`<div class="sub">🧊 +1 ${t('freeze')}</div>`:''}<button class="btn block" id="ok">${t('close')}</button></div>`,el=>{ $('#ok',el).onclick=()=>{ closeSheet(); render(); }; });
  addCoins(amt); }; }

/* ---------- week of lanterns: one lantern per day for the last 7 days, lit when you studied ---------- */
function weekWidget(){ const days=[], wd=isAr()?['أحد','اثن','ثلا','أرب','خمي','جمع','سبت']:['Su','Mo','Tu','We','Th','Fr','Sa'];
  for(let i=6;i>=0;i--){ const dt=new Date(Date.now()-i*864e5); days.push({k:ymd(dt),w:wd[dt.getDay()],today:i===0}); }
  return `<div class="card week"><div class="row"><span style="color:var(--red);display:inline-flex">${ICON.fire}</span><b class="grow"><span class="num">${S.streak}</span> ${t('streak')}</b>${S.freezes?`<span class="tag" style="color:var(--se)">🧊 <span class="num">${S.freezes}</span></span>`:''}</div>
    <div class="lrow">${days.map(d=>`<div class="lday ${(S.days||{})[d.k]?'lit':''} ${d.today?'today':''}"><i></i><span>${d.w}</span></div>`).join('')}</div></div>`; }
