/* ===== Learning: onboarding, home, tracks, module path (lessons → quiz → Chinese terms → dialogue → lab), exams ===== */
const TRK={se:{ic:'💻',name:()=>t('trSE')},cy:{ic:'🛡️',name:()=>t('trCY')}};
const quizPass=p=>p>=.7, quizStars=p=>p>=1?3:p>=.85?2:p>=.7?1:0;
function modStepsDone(k){ const s=S.mods[k]||{}; return ['L','Q','T','D'].filter(x=>s[x]).length; }
function checkModDone(m){ const s=mst(m.k); if(!s.done&&s.L&&s.Q&&s.T&&s.D){ s.done=today(); save(); addXP(40); addCoins(30); track('module_done',{k:m.k}); return true; } return false; }

SCREENS.onboard=app=>{ let step=0, lang=null;
  const draw=()=>{ app.innerHTML=`<main class="screen full" style="justify-content:center;gap:22px"><div class="glow"></div>
    <div class="col rise" style="align-items:center;gap:14px;text-align:center"><div class="seal" style="width:76px;height:76px;font-size:36px">码</div>
      <h1 style="font-size:30px">Cipher Path · مسار الشيفرة</h1><p class="sub" style="max-width:36ch">${step?t('welcomeB'):'Software engineering & cybersecurity, with professional Chinese · هندسة البرمجيات والأمن السيبراني مع الصينية المهنية'}</p></div>
    ${step===0?`<div class="col" style="gap:10px"><div class="sub" style="text-align:center">Choose your language · اختر لغتك</div><div class="lang grid2"><button class="btn ghost" data-l="ar">العربية</button><button class="btn ghost" data-l="en">English</button></div></div>`
    :`<div class="col" style="gap:10px"><h2 style="text-align:center">${t('pickGoal')}</h2>
      ${[['se','💻',t('goalSE')],['cy','🛡️',t('goalCY')],['zh','中',t('goalZH')]].map(([k,ic,txt])=>`<button class="track ${k}" data-g="${k}"><span class="ti">${ic}</span><b class="grow">${txt}</b><span aria-hidden="true">›</span></button>`).join('')}</div>`}</main>`;
    $$('[data-l]',app).forEach(b=>b.onclick=()=>{ lang=b.dataset.l; S.lang=lang; applyLang(); step=1; SFX.tap(); draw(); });
    $$('[data-g]',app).forEach(b=>b.onclick=()=>{ S.focus=b.dataset.g; save(); track('onboard',{lang:S.lang,goal:S.focus}); SFX.ok(); route={name:'home'}; render(); }); };
  draw(); };

SCREENS.home=m=>{ const h=new Date().getHours(); const tr=S.focus==='cy'?'cy':'se'; const nm=nextMod(tr)||nextMod(tr==='se'?'cy':'se');
  const due=dueIds().length, dailyDone=S.dailyDone===today();
  m.insertAdjacentHTML('beforeend',`${topbar()}
  <div class="hero"><span class="eyebrow">${h<12?t('greetM'):t('greetA')} · ${t('ranks')[rankOf(S.xp)]}</span><h1>${t('welcomeT')}</h1></div>
  ${nm?`<button class="contcard tap" id="cont" style="text-align:start"><div class="row"><span class="tag ${nm.tr}">${TRK[nm.tr].name()}</span><span class="sub grow">${nm.ti+1}/${TRACK(nm.tr).length}</span>${modFree(nm)?'':`<span class="tag lock">${t('pro')}</span>`}</div>
    <div class="row" style="align-items:flex-start"><div class="grow"><h2>${nm.ic} ${esc(L(nm))}</h2><p class="sub" style="margin-top:4px">${esc(L(nm,'sa','se'))}</p></div><div class="zhbig">${esc(nm.zh)}</div></div>
    <div class="bar"><i style="width:${modStepsDone(nm.k)*25}%"></i></div><span class="btn block">${modStepsDone(nm.k)?t('continue'):t('startTrack')} →</span></button>`:''}
  <div class="row card" style="gap:14px">${ring(S.todayXP/S.goal,`${Math.min(100,Math.round(S.todayXP/S.goal*100))}%`)}<div class="grow"><b>${t('dailyGoal')}</b><div class="sub"><span class="num">${S.todayXP}/${S.goal}</span> ${t('xp')}</div><div class="sub"><span style="color:var(--zh)">●</span> <span class="num">${S.streak}</span> ${t('streak')}</div></div></div>
  <button class="daily" id="daily"><span style="font-size:26px">${dailyDone?'✅':'🧩'}</span><div class="grow"><b>${t('daily')}</b><div class="sub">${dailyDone?t('dailyDone'):t('dailyB')}</div></div><span class="tag" style="color:var(--amber)">+40 ${t('bitsCur')}</span></button>
  <div class="col" style="gap:10px">${['se','cy'].map(k=>{ const ms=TRACK(k), d=ms.filter(x=>modDone(x.k)).length; return `<button class="track ${k}" data-tr="${k}"><span class="ti">${TRK[k].ic}</span><div class="grow"><b>${TRK[k].name()}</b><div class="bar ${k}" style="margin-top:6px"><i style="width:${d/ms.length*100}%"></i></div></div><span class="sub num">${d}/${ms.length}</span></button>`; }).join('')}
    <button class="track zh" id="tzh"><span class="ti">中</span><div class="grow"><b>${t('trZH')}</b><div class="sub"><span class="num">${Object.keys(S.srs).length}</span> ${t('learned')}${due?` · <span class="num">${due}</span> ${t('due')}`:''}</div></div><span aria-hidden="true">›</span></button></div>
  <div class="grid2">${[['codelab','⌨️','codeLabs'],['ctf','🔓','ctf'],['phish','🎣','phish'],['logs','📜','logs']].map(([k,ic,n])=>`<button class="ltile" data-lab="${k}"><span class="li">${ic}</span><b>${t(n)}</b><span class="sub">${t(n+'B')}</span></button>`).join('')}</div>`);
  const c=$('#cont',m); if(c) c.onclick=()=>{ SFX.tap(); go('module',nm.k); };
  $('#daily',m).onclick=()=>{ SFX.tap(); go('daily'); };
  $$('[data-tr]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.tr); });
  $('#tzh',m).onclick=()=>{ SFX.tap(); go('zh'); };
  $$('[data-lab]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); openLab(b.dataset.lab); }); };

SCREENS.learn=m=>{ m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero"><span class="eyebrow">${t('learn')}</span><h1>${t('trSE')} · ${t('trCY')}</h1></div>
  ${['se','cy'].map(k=>{ const ms=TRACK(k), d=ms.filter(x=>modDone(x.k)).length; return `<button class="track ${k}" data-tr="${k}"><span class="ti">${TRK[k].ic}</span><div class="grow"><b>${TRK[k].name()}</b><div class="sub"><span class="num">${ms.length}</span> ${t('modules')} · <span class="num">${ms.reduce((a,x)=>a+x.L.length,0)}</span> ${t('lessons')}</div><div class="bar ${k}" style="margin-top:6px"><i style="width:${d/ms.length*100}%"></i></div></div><span class="sub num">${d}/${ms.length}</span></button>`; }).join('')}
  <button class="card tap row" id="ex" style="gap:12px"><span style="font-size:26px">📝</span><div class="grow"><b>${t('exam')}</b><div class="sub">${t('examB')}</div></div><span aria-hidden="true">›</span></button>`);
  $$('[data-tr]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.tr); }); $('#ex',m).onclick=()=>{ SFX.tap(); go('exam'); }; };

SCREENS.track=(m,tr)=>{ tr=tr==='cy'?'cy':'se'; const ms=TRACK(tr), d=ms.filter(x=>modDone(x.k)).length;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${isAr()?'→':'←'}</button><div class="grow"><span class="eyebrow">${t('learn')}</span><h1>${TRK[tr].ic} ${TRK[tr].name()}</h1></div></div>
  <div class="seg" id="tsg"><button data-t="se" aria-pressed="${tr==='se'}">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="${tr==='cy'}">🛡️ ${t('trCY')}</button></div>
  <div class="row card"><div class="grow"><div class="bar ${tr}"><i style="width:${d/ms.length*100}%"></i></div><div class="sub" style="margin-top:6px"><span class="num">${d}/${ms.length}</span> ${t('done')}</div></div><button class="btn sm ghost" id="ex">📝 ${t('exam')}</button></div>
  <div class="col" style="gap:8px">${ms.map(x=>{ const s=S.mods[x.k]||{}, free=modFree(x);
    return `<button class="modc ${s.done?'done':''} ${free?'':'locked'}" data-k="${x.k}"><span class="mi">${x.ic}</span><div class="grow"><div class="row" style="gap:6px"><span class="sub num">${x.ti+1}</span><b class="grow">${esc(L(x))}</b></div><div class="zh">${esc(x.zh)} <span class="py" style="font-size:11px">${esc(x.py)}</span></div>
      <div class="bar" style="height:5px;margin-top:6px"><i style="width:${modStepsDone(x.k)*25}%"></i></div></div>${free?(s.done?stars(s.stars||1):''):`<span class="tag lock">${ICON.lock}</span>`}</button>`; }).join('')}</div>
  ${certCard(tr)}`);
  $('#bk',m).onclick=()=>goBack('learn'); $('#ex',m).onclick=()=>go('exam',tr);
  $$('#tsg button',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.t); });
  $$('.modc',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const x=MOD[b.dataset.k]; if(!modFree(x)) return paywall(); go('module',x.k); });
  bindCert(m,tr); };

SCREENS.module=(m,k)=>{ const x=MOD[k]; if(!x) return SCREENS.learn(m); if(!modFree(x)){ m.insertAdjacentHTML('beforeend',topbar()); return paywall(); }
  const s=mst(x.k), lab=CODE_LABS.find(l=>l.mod===x.k);
  const step=(id,n,label,sub,done)=>`<button class="step ${done?'done':''}" data-s="${id}"><span class="sn">${done?'✓':n}</span><div class="grow"><b>${label}</b><div class="sub">${sub}</div></div><span aria-hidden="true">›</span></button>`;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${isAr()?'→':'←'}</button><span class="tag ${x.tr}">${TRK[x.tr].name()} · <span class="num">${x.ti+1}</span></span><div class="grow"></div>${s.done?stars(s.stars||1):''}</div>
  <div class="mhero"><div class="row" style="align-items:flex-start"><div class="grow"><h1>${x.ic} ${esc(L(x))}</h1><p class="sub" style="margin-top:6px">${esc(L(x,'sa','se'))}</p></div></div>
    <div class="row"><span class="zhbig">${esc(x.zh)}</span><button class="speak" id="say" aria-label="🔊">🔊</button></div><span class="py">${esc(x.py)}</span></div>
  <div class="steps">${step('L',1,t('stepL'),`<span class="num">${x.L.length}</span> ${t('lessons')}`,s.L)}${step('Q',2,t('stepQ'),s.Qb!=null?`${t('score')}: <span class="num">${Math.round(s.Qb*100)}%</span>`:`<span class="num">${x.Q.length}</span> ${t('questions')}`,s.Q)}
    ${step('T',3,t('stepT'),`<span class="num">${x.T.length}</span> · ${x.T.slice(0,3).map(w=>`<span class="han">${esc(w.h)}</span>`).join(' · ')}`,s.T)}${step('D',4,t('stepD'),`<span class="num">${x.D.length}</span> · ${t('dialog')}`,s.D)}
    ${lab?step('lab','⌨',t('stepLab'),esc(L(lab))+' · <span class="han">'+esc(lab.zh)+'</span>',!!S.labs[lab.k]):''}</div>`);
  $('#bk',m).onclick=()=>goBack('learn'); $('#say',m).onclick=()=>speak(x.zh);
  $$('.step',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const id=b.dataset.s;
    if(id==='L') go('lesson',{k,i:0}); if(id==='Q') go('quizrun',{k}); if(id==='T') go('practice',{k}); if(id==='D') dialogSheet(x); if(id==='lab') openCodeLab(lab.k); }); };

function dialogSheet(x){ let playing=false;
  sheet(`<div class="row"><h2 class="grow">💬 ${t('dialog')}</h2><button class="btn sm ghost" id="pa">▶</button></div><span class="han" style="color:var(--zh)">${esc(x.zh)}</span>
    <div class="dlg">${x.D.map((d,i)=>`<div class="dl ${d.s}"><span class="who">${d.s}</span><div class="grow"><div class="zhline han">${esc(d.zh)}</div><div class="py" style="font-size:13px">${esc(d.py)}</div><div class="sub" dir="auto">${esc(L(d))}</div></div><button class="speak" data-i="${i}" aria-label="🔊">🔊</button></div>`).join('')}</div>
    <button class="btn block" id="dd">${t('done')} ✓</button>`,el=>{
    $$('.speak',el).forEach(b=>b.onclick=()=>{ const d=x.D[+b.dataset.i]; speak(d.zh,{voice:d.s==='A'?'n':'p'}); });
    $('#pa',el).onclick=async()=>{ if(playing){ playing=false; stopVoice(); return; } playing=true; for(const d of x.D){ if(!playing) break; await speak(d.zh,{voice:d.s==='A'?'n':'p'}); await new Promise(r=>setTimeout(r,350)); } playing=false; };
    $('#dd',el).onclick=()=>{ playing=false; stopVoice(); const s=mst(x.k); if(!s.D){ s.D=1; save(); addXP(5); } closeSheet(); const fin=checkModDone(x); render(); if(fin) moduleDone(x); }; }); }

function moduleDone(x){ SFX.win(); confetti(110); const s=mst(x.k);
  sheet(`<div class="result" style="padding-top:4px"><div class="big">🏅</div><h1>${t('modDone')}</h1><h3>${x.ic} ${esc(L(x))}</h3>${stars(s.stars||1)}<div class="sub">+40 ${t('xp')} · +30 ${t('bitsCur')}</div>
    <button class="btn block" id="nx">${t('next')} →</button></div>`,el=>{ $('#nx',el).onclick=async()=>{ closeSheet(); await interstitial(); const n=nextMod(x.tr); n&&modFree(n)?go('module',n.k):go('track',x.tr); }; }); }

SCREENS.lesson=(m,{k,i})=>{ const x=MOD[k], n=x.L.length; i=Math.max(0,Math.min(n-1,i|0)); const l=x.L[i];
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar"><i style="width:${(i+1)/n*100}%"></i></div><span class="sub num">${i+1}/${n}</span></div>
  <div class="lcard rise"><span class="eyebrow">${x.ic} ${esc(L(x))}</span><h2>${esc(L(l,'ta','te'))}</h2><div class="lbody">${rich(L(l,'a','e'))}</div>${l.c?codeHTML(l.c):''}</div>
  ${i===0?`<div class="card row" style="gap:10px"><span class="han" style="font-size:22px;color:var(--zh)">${esc(x.zh)}</span><span class="py grow">${esc(x.py)}</span><button class="speak" id="say" aria-label="🔊">🔊</button></div>`:''}
  <div class="grow"></div><div class="row">${i>0?`<button class="btn ghost" id="pv">${isAr()?'→':'←'}</button>`:''}<button class="btn grow" id="nx">${i<n-1?t('next')+' →':t('finish')+' ✓'}</button></div>`;
  $('#qx',m).onclick=()=>go('module',k); const sy=$('#say',m); if(sy) sy.onclick=()=>speak(x.zh);
  const pv=$('#pv',m); if(pv) pv.onclick=()=>{ SFX.tap(); route={name:'lesson',arg:{k,i:i-1}}; render(); window.scrollTo(0,0); };
  $('#nx',m).onclick=()=>{ SFX.tap(); if(i<n-1){ route={name:'lesson',arg:{k,i:i+1}}; render(); window.scrollTo(0,0); return; }
    const s=mst(k); if(!s.L){ s.L=1; save(); addXP(10); } const fin=checkModDone(x); go('module',k); if(fin) moduleDone(x); }; };

/* ---------- quiz engine (learn mode: feedback after each answer; exam mode: feedback at the end) ---------- */
const qFrom=(q,mod)=>{ const o=q.o.map((p,j)=>({h:inl(isAr()?p[0]:p[1]),ok:j===0})); return {q:inl(L(q,'qa','qe')),opts:shuffle(o),why:inl(L(q,'wa','we')),mod}; };
function runQuiz(m,{qs,title,exam,seconds,onDone,onQuit}){ let i=0, right=0, timer=null, end=seconds?Date.now()+seconds*1000:0; const log=[];
  const prev=cleanup; cleanup=()=>{ clearInterval(timer); prev&&prev(); };
  const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  if(seconds) timer=setInterval(()=>{ const left=Math.max(0,Math.round((end-Date.now())/1000)); const el=$('#qt',m); if(el) el.textContent=fmtT(left); if(!left){ clearInterval(timer); finish(); } },500);
  function draw(){ const q=qs[i]; $$('.feedback').forEach(f=>f.remove());
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar"><i style="width:${i/qs.length*100}%"></i></div>${seconds?`<span class="timer num" id="qt">${fmtT(Math.round((end-Date.now())/1000))}</span>`:`<span class="sub num">${i+1}/${qs.length}</span>`}</div>
      <span class="eyebrow">${esc(title)}${q.mod?' · '+esc(L(q.mod)):''}</span><div class="qtext rise">${q.q}</div>
      <div class="col" style="gap:10px">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span><span class="grow">${o.h}</span></button>`).join('')}</div>`;
    $('#qx',m).onclick=()=>{ clearInterval(timer); onQuit(); };
    $$('.opt',m).forEach(b=>b.onclick=()=>{ if(m.dataset.lock) return; const o=q.opts[+b.dataset.j]; log.push({q,ok:o.ok,pick:o}); if(o.ok){ right++; S.right=(S.right||0)+1; }
      if(exam){ SFX.tap(); i++; i<qs.length?draw():finish(); return; }
      m.dataset.lock=1; $$('.opt',m).forEach((x,j)=>{ x.disabled=true; if(q.opts[j].ok) x.classList.add('right'); else if(x===b) x.classList.add('wrong'); else x.classList.add('dim'); });
      o.ok?(SFX.ok(),haptic('success')):(SFX.bad(),haptic('error'));
      const f=document.createElement('div'); f.className='feedback '+(o.ok?'good':'bad'); f.innerHTML=`<div><b class="v">${o.ok?'✓ '+t('correct'):'✕ '+t('wrong')}</b><div class="sub" style="color:var(--text)">${q.why}</div><button class="btn block" id="fn">${t('next')} →</button></div>`;
      document.body.appendChild(f); $('#fn',f).onclick=()=>{ f.remove(); delete m.dataset.lock; i++; i<qs.length?draw():finish(); }; }); }
  function finish(){ clearInterval(timer); $$('.feedback').forEach(f=>f.remove()); save(); onDone(right,qs.length,log); }
  draw(); }

SCREENS.quizrun=(m,{k})=>{ const x=MOD[k]; const qs=shuffle(x.Q).map(q=>qFrom(q));
  runQuiz(m,{qs,title:t('quiz'),onQuit:()=>go('module',k),onDone:(r,n)=>{ const p=r/n, s=mst(k); s.Qb=Math.max(s.Qb||0,p); const ok=quizPass(p);
    if(ok){ s.Q=1; s.stars=Math.max(s.stars||0,quizStars(p)); } addXP(r*3); const c=ok?addCoins(10+r):0; save(); ok?(SFX.win(),confetti(60)):SFX.bad(); track('quiz',{k,p});
    m.innerHTML=`<div class="result rise"><div class="big num">${Math.round(p*100)}%</div><h1>${ok?t('quizPass'):t('retry')}</h1>${ok?stars(quizStars(p)):`<p class="sub">${t('quizFail')}</p>`}
      <div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${r}/${n}</b></div><div><span class="sub">${t('earned')}</span><b class="num">+${r*3}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${c}</b></div></div>
      <div class="row" style="width:100%"><button class="btn ghost grow" id="ag">↺ ${t('again')}</button><button class="btn grow" id="nx">${t('next')} →</button></div></div>`;
    $('#ag',m).onclick=()=>go('quizrun',{k}); $('#nx',m).onclick=()=>{ const fin=checkModDone(x); go('module',k); if(fin) moduleDone(x); }; }}); };

SCREENS.exam=(m,tr)=>{ tr=tr==='cy'?'cy':'se'; const best=S.exams[tr]; const used=S.examDay===today()&&!S.pro;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${isAr()?'→':'←'}</button><div class="grow"><span class="eyebrow">${t('learn')}</span><h1>📝 ${t('exam')}</h1></div></div>
  <div class="seg" id="esg"><button data-t="se" aria-pressed="${tr==='se'}">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="${tr==='cy'}">🛡️ ${t('trCY')}</button></div>
  <div class="card col" style="gap:10px"><p>${t('examB')}</p>${best!=null?`<div class="sub">${t('score')}: <b class="num">${Math.round(best*100)}%</b></div>`:''}${S.pro?'':`<div class="sub">${t('examFree')}</div>`}
  <button class="btn block" id="go">${used?ICON.lock+' ':''}${t('examStart')}</button></div>`);
  $('#bk',m).onclick=()=>goBack('learn'); $$('#esg button',m).forEach(b=>b.onclick=()=>go('exam',b.dataset.t));
  $('#go',m).onclick=()=>{ if(used) return paywall(); S.examDay=today(); save(); go('examrun',{tr}); }; };

SCREENS.examrun=(m,{tr})=>{ const pool=TRACK(tr).flatMap(x=>x.Q.map(q=>[q,x])); const qs=pick(pool,20).map(([q,x])=>qFrom(q,x)); track('exam_start',{tr});
  runQuiz(m,{qs,title:t('exam'),exam:true,seconds:20*60,onQuit:()=>go('exam',tr),onDone:(r,n,log)=>{ const p=r/n; S.exams[tr]=Math.max(S.exams[tr]||0,p); addXP(r*4); const c=addCoins(r*2); save(); SFX.win(); if(p>=.7) confetti(80);
    const per={}; log.forEach(e=>{ const k=e.q.mod.k; per[k]=per[k]||[0,0,e.q.mod]; per[k][1]++; if(e.ok) per[k][0]++; });
    m.innerHTML=`<div class="result rise"><span class="eyebrow">${t('examRes')} · ${TRK[tr].name()}</span><div class="big num">${Math.round(p*100)}%</div>
      <div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${r}/${n}</b></div><div><span class="sub">${t('earned')}</span><b class="num">+${r*4}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${c}</b></div></div></div>
      <div class="card col" style="gap:8px"><b>${t('byModule')}</b>${Object.values(per).map(([a,b,x])=>`<div class="row"><span class="grow">${x.ic} ${esc(L(x))}</span><span class="num ${a===b?'':''}" style="color:${a===b?'var(--good)':a/b>=.5?'var(--amber)':'var(--bad)'}">${a}/${b}</span></div>`).join('')}</div>
      ${log.filter(e=>!e.ok).map(e=>`<div class="card col" style="gap:6px"><div class="sub">${esc(L(e.q.mod))}</div><b>${e.q.q}</b><div style="color:var(--bad)">✕ ${e.pick.h}</div><div style="color:var(--good)">✓ ${e.q.opts.find(o=>o.ok).h}</div><div class="sub">${e.q.why}</div></div>`).join('')}
      <button class="btn block" id="dn">${t('finish')}</button>`;
    $('#dn',m).onclick=async()=>{ await interstitial(); go('exam',tr); }; }}); };

/* ---------- certificates ---------- */
function certCard(tr){ const ok=TRACK(tr).every(x=>modDone(x.k));
  return `<div class="card col" style="gap:10px"><b>🎓 ${t('certs')}</b>${ok?`<button class="btn block" id="cert">${t('certT')} · ${TRK[tr].name()}</button>`:`<div class="sub">${t('certLocked')} · <span class="num">${TRACK(tr).filter(x=>modDone(x.k)).length}/${TRACK(tr).length}</span></div>`}</div>`; }
function bindCert(m,tr){ const b=$('#cert',m); if(!b) return; b.onclick=()=>{ if(!S.pro) return paywall();
  const d=Object.values(S.mods).map(x=>x.done).filter(Boolean).sort().pop()||today();
  sheet(`<div class="cert ondark"><div class="seal" style="margin:0 auto">码</div><span class="eyebrow" style="color:#5eead4">${t('certT')}</span><h2 id="cn">${esc(S.certName||'—')}</h2>
    <div>${TRK[tr].name()}</div><div class="han">${tr==='se'?'软件工程':'网络安全'}</div><div class="sub num">${d} · Cipher Path</div></div>
    <input class="field" id="ci" maxlength="40" placeholder="${t('certName')}" value="${esc(S.certName||'')}"><button class="btn block" id="sh">${t('share')}</button>`,el=>{
    $('#ci',el).oninput=e=>{ S.certName=e.target.value; save(); $('#cn',el).textContent=S.certName||'—'; };
    $('#sh',el).onclick=()=>{ const txt=`${S.certName||''} · ${t('certT')}: ${TRK[tr].name()} · Cipher Path`; RN?RN.postMessage(JSON.stringify({type:'share',text:txt})):(navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast('✓')).catch(()=>{})); }; }); }; }
