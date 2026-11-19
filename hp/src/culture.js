/* ===== Culture tab ===== */
const tx=(o,k)=>isAr()?o[k+'Ar']??o.ar:o[k+'En']??o.en;
const L2=o=>isAr()?o.ar:o.en;
SCREENS.culture=m=>{ S.cult=S.cult||{};
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero ph" style="min-height:170px">${photo('traditions',0,'','bg')}<span class="eyebrow">${t('cultureSub')}</span><h1>${t('cultureTitle')}</h1></div>
   <div class="col" style="gap:12px">${CULTURE.map((c,i)=>{ const done=S.cult[c.k];
     return `<button class="card row" data-c="${i}" style="cursor:pointer;text-align:start;gap:14px;background:linear-gradient(120deg,rgba(179,38,30,${.12+i*.04}),var(--surface) 70%)">
       ${photo(c.k,64,`<span class="brush" style="font-size:30px;color:var(--gold2);text-shadow:0 2px 8px #000">${c.zh}</span>`,'thumb')}
       <div class="grow"><h3>${L2(c)}</h3><div class="sub">${isAr()?c.subAr:c.subEn}</div><div class="sub" style="margin-top:4px;color:var(--gold)"><span class="num">${c.cards.length}</span> ${t('lessonCards')}${c.k==='kitchen'?` · <span class="num">${RECIPES.length}</span> ${t('recipes')}`:''}${done?` · ✓ ${done}%`:''}</div></div><span>›</span></button>`; }).join('')}</div>`);
  $$('[data-c]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('section',+b.dataset.c); });
};
SCREENS.section=(m,i)=>{ const c=CULTURE[i];
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"><h2>${L2(c)}</h2><div class="sub">${isAr()?c.subAr:c.subEn}</div></div><span class="brush" style="font-size:36px;color:var(--gold)">${c.zh}</span></div>
   ${photo(c.k,150)}
   <button class="btn block" id="go">📖 ${t('startLesson')} · <span class="num">${c.cards.length}</span> ${t('lessonCards')}</button>
   ${c.k==='music'?musicPad():''}
   ${c.k==='kitchen'?`<h2>${t('recipes')}</h2><div class="col">${RECIPES.map((r,j)=>`<button class="paper row" data-r="${j}" style="cursor:pointer;text-align:start;padding:14px"><span class="han" style="font-size:26px;font-weight:700;color:#6a120d">${r.zh}</span><div class="grow"><b>${L2(r)}</b><div class="sub">⏱ <span class="num">${r.time}</span> ${t('minutes')} · 🍽 <span class="num">${r.serves}</span> · ${'★'.repeat(r.level)}</div></div><span>›</span></button>`).join('')}</div>`:''}
   <h2>${t('topics')}</h2>
   <div class="col">${c.cards.map((d,j)=>`<button class="card tight row" data-j="${j}" style="cursor:pointer;text-align:start"><span class="han" style="font-size:22px;font-weight:700;color:var(--gold2);min-width:84px">${d.zh}</span><div class="grow"><b>${L2(d)}</b><div class="py" style="font-size:12px">${d.p}</div></div></button>`).join('')}</div>`);
  $('#bk',m).onclick=()=>go('culture'); $('#go',m).onclick=()=>go('reader',{i,start:0});
  $$('[data-j]',m).forEach(b=>b.onclick=()=>go('reader',{i,start:+b.dataset.j,single:true}));
  $$('[data-r]',m).forEach(b=>b.onclick=()=>go('recipe',+b.dataset.r));
  if(c.k==='music') bindMusic(m);
};
SCREENS.reader=(m,{i,start,single})=>{ const c=CULTURE[i]; let j=start;
  function show(){ const d=c.cards[j];
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx">✕</button><div class="bar grow"><i style="width:${((j+1)/c.cards.length*100).toFixed(1)}%"></i></div><span class="sub num">${j+1}/${c.cards.length}</span></div>
     <div class="paper col rise" style="gap:12px;min-height:56vh"><div class="stamp">${c.zh[0]}</div>
       <div class="han wordhead" style="font-size:44px;font-weight:700;color:#6a120d;text-align:start;line-height:1.15">${d.zh}</div>
       <div class="row" style="gap:10px"><span class="py" style="color:var(--red);font-size:18px">${d.p}</span><button class="speak" id="sp" style="width:40px;height:40px;font-size:16px">🔊</button><button class="speak" id="cmic" style="width:40px;height:40px;font-size:16px">🎤</button><button class="speak" id="cnar" style="width:40px;height:40px;font-size:16px" aria-label="listen">🎧</button>${firstWritable(d.zh)?'<button class="speak" id="cwr" style="width:40px;height:40px;font-size:16px">✍️</button>':''}</div>
       <h2 style="color:var(--ink)">${L2(d)}</h2><p style="margin:0;font-size:17px;line-height:1.75">${tx(d,'b')}</p>${d.wEn?`<div class="why"><b>💡 ${t('why')}</b><p>${tx(d,'w').replace(/^(Why\?|لماذا؟)\s*/,'')}</p></div>`:''}</div>
     <div class="row"><button class="btn ghost grow" id="pv" ${j===0?'disabled':''}>${t('prev')}</button><button class="btn grow" id="nx">${single?t('done'):j<c.cards.length-1?t('next'):t('quizTime')}</button></div>`;
    dayCount('cultDay').n++; save(); $('#qx',m).onclick=()=>go('section',i); $('#sp',m).onclick=()=>speak(d.zh.replace(/[·\s]/g,'')); const cn=$('#cnar',m); if(cn) cn.onclick=()=>narrate(L2(d)+'. '+tx(d,'b')+(d.wEn?' '+tx(d,'w'):'')); const cm=$('#cmic',m); if(cm) cm.onclick=()=>pronCheck(d.zh.replace(/[·\s]/g,'')); const cw=$('#cwr',m); if(cw) cw.onclick=()=>quickWrite(d.zh.replace(/[^\u3400-\u9fff]/g,''));
    $('#pv',m).onclick=()=>{ if(j>0){ j--; show(); } };
    $('#nx',m).onclick=()=>{ SFX.tap(); if(single) return go('section',i); if(j<c.cards.length-1){ j++; show(); } else quiz(); }; }
  function quiz(){ const qs=shuffle(c.cards.map(d=>d.q)).slice(0,10); let k=0,score=0;
    function ask(){ const q=qs[k]; const opts=shuffle(q.o.map((o,n)=>({o,ok:n===q.a})));
      m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx">✕</button><div class="bar grow"><i style="width:${(k/qs.length*100).toFixed(1)}%"></i></div><span class="sub num">${k+1}/${qs.length}</span></div>
       <div class="prompt rise" style="padding-top:18px"><span class="brush" style="font-size:40px;color:var(--gold)">${c.zh}</span><div class="meaning" style="font-size:21px">${L2(q)}</div></div>
       <div class="opts one">${opts.map((x,n)=>`<button class="opt" data-n="${n}">${esc(L2(x.o))}</button>`).join('')}</div>`;
      $('#qx',m).onclick=()=>go('section',i);
      $$('.opt',m).forEach(b=>b.onclick=()=>{ const ok=opts[+b.dataset.n].ok; $$('.opt',m).forEach((x,n)=>{ x.onclick=null; if(opts[n].ok) x.classList.add('right'); else if(x===b) x.classList.add('wrong'); });
        if(ok){score++; SFX.ok();} else SFX.bad(); setTimeout(()=>{ k++; k<qs.length?ask():finish(); },ok?600:1300); }); }
    function finish(){ const pct=Math.round(score/qs.length*100); track('culture_complete',{chapter:c.k,pct}); S.cult=S.cult||{}; S.cult[c.k]=Math.max(S.cult[c.k]||0,pct); const xp=15+score*3; addXP(xp); const coins=addCoins(pct===100?30:15); save();
      SFX.win(); confetti(pct===100?120:60);
      m.innerHTML=`<div class="result rise"><div class="bigseal">${pct===100?'精':'学'}</div><h1>${L2(c)}</h1>
        <div class="kv"><div><span class="sub">${t('accuracy')}</span><b>${pct}%</b></div><div><span class="sub">${t('earned')}</span><b style="color:var(--gold2)">+${xp}</b></div><div><span class="sub">${t('coins')}</span><b style="color:var(--gold2)">+${coins}</b></div></div>
        <button class="btn block" id="dn">${t('done')}</button></div>`;
      $('#dn',m).onclick=async()=>{ await interstitial(); go('section',i); }; }
    ask(); }
  show();
};
SCREENS.recipe=(m,j)=>{ const r=RECIPES[j]; const steps=isAr()?r.stAr:r.stEn; S.cooked=S.cooked||{};
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"></div><span class="chip">⏱ <span class="num">${r.time}</span> ${t('minutes')}</span></div>
   ${photo('kitchen',130)}
   <div class="paper col" style="gap:8px"><div class="stamp">菜</div><div class="han" style="font-size:40px;font-weight:700;color:#6a120d;text-align:start">${r.zh}</div><div class="extras"><button class="xch" id="rsp">🔊</button><button class="xch" id="rmi">🎤 ${t('xSay')}</button>${firstWritable(r.zh)?`<button class="xch" id="rwr">✍️ ${t('xWrite')}</button>`:''}</div>
     <div class="row" style="gap:10px"><span class="py" style="color:var(--red)">${r.p}</span><button class="speak" id="sp" style="width:38px;height:38px;font-size:15px">🔊</button></div><h2 style="color:var(--ink)">${L2(r)}</h2>
     ${r.noteAr?`<div class="sub">ℹ ${isAr()?r.noteAr:r.noteEn}</div>`:''}</div>
   <h2>${t('ingredients')}</h2>
   <ul class="list">${r.ing.map(([zh,ar,en,q])=>`<li style="grid-template-columns:auto 1fr auto"><span class="han" style="font-size:20px">${zh}</span><span>${isAr()?ar:en}</span><span class="num" style="color:var(--gold)">${q}</span></li>`).join('')}</ul>
   <h2>${t('steps')}</h2>
   <div class="col">${steps.map((s,n)=>`<label class="card tight row" style="align-items:flex-start;cursor:pointer"><input type="checkbox" id="st${n}" style="width:22px;height:22px;accent-color:#e8b65c;margin-top:2px"><span class="num" style="color:var(--gold);font-weight:800">${n+1}</span><span class="grow">${esc(s)}</span></label>`).join('')}</div>
   <button class="btn block" id="cook">👨‍🍳 ${t('cookMode')}</button>`;
  $('#rsp',m).onclick=()=>speak(r.zh); $('#rmi',m).onclick=()=>pronCheck(r.zh); { const x=$('#rwr',m); if(x) x.onclick=()=>quickWrite(r.zh); } $('#bk',m).onclick=()=>go('section',CULTURE.findIndex(c=>c.k==='kitchen')); $('#sp',m).onclick=()=>speak(r.zh);
  $$('[id^=st]',m).forEach(c=>c.onchange=()=>{ SFX.tap(); if($$('[id^=st]',m).every(x=>x.checked)) done(); });
  $('#cook',m).onclick=()=>{ let k=0; (function step(){ sheet(`<div class="eyebrow">${t('steps')} <span class="num">${k+1}/${steps.length}</span></div><div class="bar"><i style="width:${((k+1)/steps.length*100).toFixed(0)}%"></i></div>
      <p style="font-size:24px;line-height:1.6;margin:8px 0;font-weight:600">${esc(steps[k])}</p>
      <div class="row"><button class="btn ghost grow" id="p" ${k?'':'disabled'}>${t('prev')}</button><button class="btn grow" id="n">${k<steps.length-1?t('next'):t('done')}</button></div>`,s=>{
      $('#p',s).onclick=()=>{k--;step();}; $('#n',s).onclick=()=>{ if(k<steps.length-1){k++;SFX.tap();step();} else { closeSheet(); done(); } }; }); })(); };
  function done(){ if(S.cooked[r.zh]) return; S.cooked[r.zh]=1; addXP(20); const c=addCoins(20); save(); SFX.win(); confetti(80); toast(`🍜 ${t('cooked')} +${c}`); }
};
/* pentatonic instrument (guzheng-style pluck) */
const PENTA=[['宫','gōng','do'],['商','shāng','re'],['角','jué','mi'],['徵','zhǐ','sol'],['羽','yǔ','la']];
const PFREQ=[261.63,293.66,329.63,392.00,440.00];
function pluck(f){ if(!S.sound) return; if(kotoNote(Math.round(69+12*Math.log2(f/440)))) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const t0=AC.currentTime;
  [[1,.22,'triangle'],[2,.07,'sine'],[3,.03,'sine']].forEach(([mul,v,tp])=>{ const o=AC.createOscillator(),g=AC.createGain(); o.type=tp; o.frequency.setValueAtTime(f*mul,t0); o.frequency.exponentialRampToValueAtTime(f*mul*.995,t0+1.6);
    g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(v,t0+.005); g.gain.exponentialRampToValueAtTime(.0001,t0+1.8); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+1.9); }); }catch(e){} }
function musicPad(){ const keys=[]; [1,2].forEach(oct=>PENTA.forEach((p,n)=>keys.push({p,f:PFREQ[n]*oct,oct})));
  return `<div class="card col" style="gap:12px"><div class="row"><h3 class="grow">${t('pentaPad')}</h3><span class="brush" style="color:var(--gold);font-size:22px">古筝</span></div>
   <div class="sub">${t('pentaHelp')}</div>
   <div id="pad" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;direction:ltr">${keys.map((k,n)=>`<button data-f="${k.f}" style="border:0;border-radius:12px;padding:14px 0 10px;cursor:pointer;background:linear-gradient(180deg,${k.oct===1?'#f3e9d6,#d9c39a':'#f7d894,#c9902f'});color:#3b2408;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 4px 0 #6b4320">
     <b class="han" style="font-size:24px">${k.p[0]}</b><span style="font:600 10px Inter">${k.p[1]}</span><span style="font:600 10px Inter;opacity:.7">${k.p[2]}${k.oct===2?'′':''}</span></button>`).join('')}</div>
   <button class="btn ghost sm" id="scale">▶ ${t('playScale')}</button></div>`; }
function bindMusic(m){ $$('#pad button',m).forEach(b=>b.onpointerdown=()=>{ pluck(+b.dataset.f); b.style.transform='translateY(3px)'; setTimeout(()=>b.style.transform='',120); });
  $('#scale',m).onclick=()=>{ const seq=[...PFREQ,PFREQ[0]*2,...[...PFREQ].reverse()]; seq.forEach((f,n)=>setTimeout(()=>pluck(f),n*260)); }; }
/* ===== Tutorials ===== */
function tutorial(k,onStart){ const T0=TUTORIALS[k]; const steps=isAr()?T0.ar:T0.en; const zh=GAMES.find(g=>g[0]===k)[1];
  sheet(`<div class="row"><span class="brush" style="font-size:40px;color:var(--gold)">${zh}</span><div class="grow"><div class="eyebrow">${t('howTo')}</div><h2>${t(k)}</h2></div></div>
   <ol style="margin:0;padding-inline-start:22px;display:flex;flex-direction:column;gap:10px;font-size:16px;line-height:1.6">${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
   <div class="paper" style="padding:14px"><div class="sub" style="font-weight:700">💡 ${t('didYouKnow')}</div><div>${esc(isAr()?T0.factAr:T0.factEn)}</div></div>
   <button class="btn block" id="ok">${onStart?t('startGame'):t('done')}</button>`,s=>{ $('#ok',s).onclick=()=>{ closeSheet(); S.tut=S.tut||{}; S.tut[k]=1; save(); onStart&&onStart(); }; }); }
/* ===== Klotski 华容道 ===== */
const KL_CLASSIC=[{n:'曹操',w:2,h:2,x:1,y:0,cc:1},{n:'张飞',w:1,h:2,x:0,y:0},{n:'赵云',w:1,h:2,x:3,y:0},{n:'马超',w:1,h:2,x:0,y:2},{n:'黄忠',w:1,h:2,x:3,y:2},{n:'关羽',w:2,h:1,x:1,y:2},
  {n:'兵',w:1,h:1,x:1,y:3},{n:'兵',w:1,h:1,x:2,y:3},{n:'兵',w:1,h:1,x:0,y:4},{n:'兵',w:1,h:1,x:3,y:4}];
const KL_SOLVED=[{n:'曹操',w:2,h:2,x:1,y:3,cc:1},{n:'张飞',w:1,h:2,x:0,y:0},{n:'赵云',w:1,h:2,x:3,y:0},{n:'马超',w:1,h:2,x:0,y:2},{n:'黄忠',w:1,h:2,x:3,y:2},{n:'关羽',w:2,h:1,x:1,y:0},
  {n:'兵',w:1,h:1,x:1,y:1},{n:'兵',w:1,h:1,x:2,y:1},{n:'兵',w:1,h:1,x:1,y:2},{n:'兵',w:1,h:1,x:2,y:2}];
const klOcc=(P,skip)=>{ const g=Array.from({length:5},()=>Array(4).fill(-1)); P.forEach((p,i)=>{ if(i===skip) return; for(let a=0;a<p.h;a++) for(let b=0;b<p.w;b++) g[p.y+a][p.x+b]=i; }); return g; };
function klCan(P,i,dx,dy){ const p=P[i], g=klOcc(P,i), nx=p.x+dx, ny=p.y+dy; if(nx<0||ny<0||nx+p.w>4||ny+p.h>5) return false;
  for(let a=0;a<p.h;a++) for(let b=0;b<p.w;b++) if(g[ny+a][nx+b]!==-1) return false; return true; }
function klGen(steps){ for(let tries=0;tries<50;tries++){ const P=KL_SOLVED.map(p=>({...p})); let last=null;
    for(let s=0;s<steps;s++){ const mv=[]; P.forEach((p,i)=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ if(klCan(P,i,dx,dy)&&!(last&&last[0]===i&&last[1]===-dx&&last[2]===-dy)) mv.push([i,dx,dy]); }));
      if(!mv.length) P.forEach((p,i)=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ if(klCan(P,i,dx,dy)) mv.push([i,dx,dy]); }));
      const [i,dx,dy]=mv[Math.random()*mv.length|0]; P[i].x+=dx; P[i].y+=dy; last=[i,dx,dy]; }
    const c=P.find(p=>p.cc); if(c.y<=2&&!(c.x===1&&c.y===3)) return P; }
  return KL_CLASSIC.map(p=>({...p})); }
const KL_STARTS=__KL__;
const KL_LEVELS=[0,1,2,3,4,'classic'];
GAME.klotski=m=>{ S.kl=S.kl||0; let lv=Math.min(S.kl,KL_LEVELS.length-1); let P, moves=0; const t0=Date.now();
  function load(){ P=KL_LEVELS[lv]==='classic'?KL_CLASSIC.map(p=>({...p})):KL_STARTS[KL_LEVELS[lv]].P.map(p=>({...p})); moves=0; draw(); }
  m.innerHTML=`${gameHeader('klotski')}
    <div class="seg" id="lv" style="justify-content:center">${KL_LEVELS.map((x,i)=>`<button data-l="${i}" aria-pressed="${i===lv}" ${i>S.kl?'disabled style="opacity:.4"':''}>${x==='classic'?'横刀立马':(isAr()?'مستوى ':'Lv ')+(i+1)}</button>`).join('')}</div>
    <div class="hud"><div><span>${isAr()?'الحركات':'Moves'}</span><b class="num" id="mv">0</b></div><div><span>${isAr()?'المستوى':'Level'}</span><b class="num" id="lvn">${lv+1}</b></div><div><span>★</span><b class="num">${S.best.klotski||0}</b></div></div>
    <div id="kb" style="position:relative;direction:ltr;margin-inline:auto;width:min(84vw,340px);aspect-ratio:4/5;background:linear-gradient(160deg,#3a2414,#22140b);border:6px solid #6b4320;border-bottom-width:6px;border-radius:14px;touch-action:none;box-shadow:0 20px 40px -20px #000"></div>
    <div style="margin:-14px auto 0;width:min(42vw,170px);height:10px;border-radius:0 0 8px 8px;background:var(--red2);box-shadow:0 0 18px rgba(210,58,47,.8)"></div>
    <div class="sub" style="text-align:center">${t('klHelp')}</div>
    <button class="btn sm ghost" id="rs" style="align-self:center">↺ ${t('restart')}</button>`;
  bindGameX(m); const kb=$('#kb',m);
  function draw(){ kb.innerHTML=P.map((p,i)=>`<div data-i="${i}" style="position:absolute;left:${p.x*25}%;top:${p.y*20}%;width:${p.w*25}%;height:${p.h*20}%;padding:3px;transition:left .14s,top .14s">
      <div class="${p.cc?'ondark':''}" style="width:100%;height:100%;border-radius:10px;display:grid;place-items:center;cursor:grab;${p.cc?'background:linear-gradient(150deg,var(--red2),var(--red-deep));color:var(--gold2);box-shadow:inset 0 0 0 2px rgba(247,216,148,.5),0 5px 0 #3b0a07':p.n==='兵'?'background:linear-gradient(160deg,#f3e9d6,#d9c39a);color:#3b2408;box-shadow:0 4px 0 #6b4320':'background:linear-gradient(160deg,#e8b65c,#b9852c);color:#2a1a07;box-shadow:0 4px 0 #6b4320'}">
      <span class="han" style="font-weight:700;font-size:${p.cc?'clamp(26px,9vw,40px)':'clamp(14px,4.6vw,20px)'};${p.h>p.w?'writing-mode:vertical-rl;':''}">${p.n}</span></div></div>`).join('');
    $('#mv',m).textContent=moves; }
  let start=null;
  kb.addEventListener('pointerdown',e=>{ const el=e.target.closest('[data-i]'); if(!el) return; start={i:+el.dataset.i,x:e.clientX,y:e.clientY}; kb.setPointerCapture(e.pointerId); });
  kb.addEventListener('pointerup',e=>{ if(!start) return; const dx=e.clientX-start.x, dy=e.clientY-start.y, i=start.i; start=null; const cell=kb.clientWidth/4;
    let dir=null; if(Math.max(Math.abs(dx),Math.abs(dy))<10){ const opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>klCan(P,i,a,b)); if(opts.length===1) dir=opts[0]; else return; }
    else dir=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];
    let n=Math.max(1,Math.round(Math.max(Math.abs(dx),Math.abs(dy))/cell)), moved=0;
    while(n-->0&&klCan(P,i,dir[0],dir[1])){ P[i].x+=dir[0]; P[i].y+=dir[1]; moved++; }
    if(!moved){ SFX.bad(); return; } moves++; SFX.tap(); haptic('light'); draw();
    const c=P.find(p=>p.cc); if(c.x===1&&c.y===3) win(); });
  function win(){ SFX.gong(); confetti(100); const score=Math.max(60,(lv+1)*120-moves*2); if(lv===S.kl&&S.kl<KL_LEVELS.length-1) S.kl++; S.wins.klotski=(S.wins.klotski||0)+1; save();
    setTimeout(()=>endGame(m,'klotski',score),700); }
  $$('#lv button',m).forEach(b=>b.onclick=()=>{ if(b.disabled) return; lv=+b.dataset.l; $$('#lv button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); $('#lvn',m).textContent=lv+1; load(); });
  $('#rs',m).onclick=load; load();
};
