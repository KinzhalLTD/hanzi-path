/* ===== Learning: onboarding, home, tracks, module path (lessons → quiz → Chinese terms → dialogue → lab), exams ===== */
const TRK={se:{ic:'💻',name:()=>t('trSE')},cy:{ic:'🛡️',name:()=>t('trCY')}};
const quizPass=p=>p>=.7, quizStars=p=>p>=1?3:p>=.85?2:p>=.7?1:0;
function modStepsDone(k){ const s=S.mods[k]||{}; return ['L','Q','T','D'].filter(x=>s[x]).length; }
function checkModDone(m){ const s=mst(m.k); if(!s.done&&s.L&&s.Q&&s.T&&s.D){ s.done=today(); save(); addXP(40); addCoins(30); track('module_done',{k:m.k}); return true; } return false; }

SCREENS.onboard=app=>{ let step=0, lang=null;
  const draw=()=>{ app.innerHTML=`<main class="screen full onb" style="justify-content:center;gap:20px"><div class="glow"></div><div class="clouds" aria-hidden="true"></div>
    <div class="col rise" style="align-items:center;gap:12px;text-align:center"><div class="moon">${dragon(step===1?'cool':'happy',120)}</div>
      <div class="brushtitle">码道</div><h1 style="font-size:28px">Cipher Path · مسار الشيفرة</h1>
      <p class="sub" style="max-width:36ch">${step===2?t('saveProgressB'):step?t('welcomeB'):'Code, security & Chinese with Lóngbǎo the debugging dragon · البرمجة والأمن والصينية مع التنين لونغ باو'}</p></div>
    ${step===0?`<div class="col" style="gap:10px"><div class="sub" style="text-align:center">Choose your language · اختر لغتك</div><div class="lang grid2"><button class="btn" data-l="ar">العربية</button><button class="btn" data-l="en">English</button></div></div>`
    :step===2?`<div class="col onbacct" style="gap:10px"><h2 style="text-align:center">${t('signUpT')}</h2><p class="sub" style="text-align:center;margin:0">${t('signUpB')}</p>${loginButtons()}
      <button class="btn ghost block" id="guest">${t('guest')}</button>${AUTH_DEMO?`<div class="fine">${t('authDemo')}</div>`:''}${legalLinks()}</div>`
    :`<div class="col" style="gap:10px"><h2 style="text-align:center">${t('pickGoal')}</h2>
      ${[['se','💻',t('goalSE')],['cy','🛡️',t('goalCY')],['zh','中',t('goalZH')]].map(([k,ic,txt])=>`<button class="track ${k}" data-g="${k}"><span class="ti">${ic}</span><b class="grow">${txt}</b><span aria-hidden="true">›</span></button>`).join('')}</div>`}</main>`;
    $$('[data-l]',app).forEach(b=>b.onclick=()=>{ lang=b.dataset.l; S.lang=lang; applyLang(); step=1; SFX.tap(); draw(); });
    const finish=()=>{ SFX.gong(); route={name:'home'}; render(); };
    $$('[data-g]',app).forEach(b=>b.onclick=()=>{ S.focus=b.dataset.g; save(); track('onboard',{lang:S.lang,goal:S.focus}); SFX.tap(); step=2; draw(); });
    if(step===2){ bindLogin(app,finish); bindLegal(app); $('#guest',app).onclick=()=>{ S.guest=true; save(); track('login_skip',{where:'onboard'}); finish(); }; } };
  draw(); };

SCREENS.home=m=>{ const h=new Date().getHours(); const tr=S.focus==='cy'?'cy':'se'; const nm=nextMod(tr)||nextMod(tr==='se'?'cy':'se');
  const due=dueIds().length, dailyDone=S.dailyDone===today(), hb=S.hbDay===today(), qn=S.fortuneDay===today(), r=rankOf(S.xp);
  let jk=Math.floor(seeded('jk'+today())()*JOKES.length);
  m.insertAdjacentHTML('beforeend',`${topbar()}
  <div class="gate"><div class="lanterns" aria-hidden="true"><i></i><i></i></div>
    <div class="row" style="align-items:flex-end;gap:12px"><button class="moon sm" id="lb" aria-label="${LB()}">${dragon(S.todayXP>=S.goal?'cool':'happy',86)}</button>
      <div class="bubble grow" id="jb"><b>${LB()}:</b> <span id="jt">${esc(isAr()?JOKES[jk][0]:JOKES[jk][1])}</span></div></div>
    <div class="row" style="gap:10px;margin-top:6px"><span class="sealchip">${RANK_ZH[r]}</span><div class="grow"><span class="eyebrow">${h<12?t('greetM'):t('greetA')}</span><b style="display:block">${t('ranks')[r]}</b></div>${ring(S.todayXP/S.goal,`${Math.min(100,Math.round(S.todayXP/S.goal*100))}%`,58)}</div></div>
  ${nm?`<button class="contcard scroll tap" id="cont" style="text-align:start"><div class="row"><span class="tag ${nm.tr}">${TRK[nm.tr].name()}</span><span class="sub grow num">${nm.ti+1}/${TRACK(nm.tr).length}</span>${modFree(nm)?'':`<span class="tag lock">${t('pro')}</span>`}</div>
    <div class="row" style="align-items:flex-start"><div class="grow"><h2>${nm.ic} ${esc(L(nm))}</h2><p class="sub" style="margin-top:4px">${esc(L(nm,'sa','se'))}</p></div><div class="zhbig">${esc(nm.zh)}</div></div>
    <div class="row sub" style="gap:6px"><span style="font-size:20px">${bossOf(nm.k).h}</span><span>${isAr()?'الوحش في نهاية الوحدة':'Boss at the end'}: <b>${esc(bossOf(nm.k).name)}</b></span></div>
    <div class="bar"><i style="width:${modStepsDone(nm.k)*25}%"></i></div><span class="btn block">${modStepsDone(nm.k)?t('continue'):t('startTrack')} →</span></button>`:''}
  <div class="grid3 treats"><button class="treat ${hb?'done':''}" id="hb"><span class="ti hbmini">福</span><b>红包</b><span class="sub">${hb?'✓':(isAr()?'ظرف أحمر':'Red envelope')}</span></button>
    <button class="treat ${qn?'done':''}" id="qn">${ico('sticks','gold')}<b>求签</b><span class="sub">${qn?'✓':(isAr()?'عود الحظ':'Fortune')}</span></button>
    <button class="treat ${dailyDone?'done':''}" id="daily">${ico('puzzle','jade')}<b>${isAr()?'تحدي':'Daily'}</b><span class="sub">${dailyDone?'✓':'+40'}</span></button></div>
  ${weakCard()}
  ${questWidget()}${weekWidget()}
  <div class="col" style="gap:10px">${['se','cy'].map(k=>{ const ms=TRACK(k), d=ms.filter(x=>modDone(x.k)).length; return `<button class="track ${k}" data-tr="${k}"><span class="ti">${TRK[k].ic}</span><div class="grow"><b>${TRK[k].name()}</b><div class="bar ${k}" style="margin-top:6px"><i style="width:${d/ms.length*100}%"></i></div></div><span class="sub num">${d}/${ms.length}</span></button>`; }).join('')}
    <button class="track zh" id="tzh"><span class="ti">中</span><div class="grow"><b>${t('trZH')}</b><div class="sub"><span class="num">${Object.keys(S.srs).length}</span> ${t('learned')}${due?` · <span class="num">${due}</span> ${t('due')}`:''}</div></div><span aria-hidden="true">›</span></button></div>
  <h2 class="sech"><span class="brushzh">练</span> ${t('labsT')}</h2>
  <div class="grid2">${[['codelab','code:blue','codeLabs'],['ctf','key:gold','ctf'],['phish','fish:red','phish'],['logs','logs:jade','logs']].map(([k,ic,n])=>`<button class="ltile" data-lab="${k}">${ico(...ic.split(':'),'lg')}<b>${t(n)}</b><span class="sub">${t(n+'B')}</span></button>`).join('')}</div>`);
  const c=$('#cont',m); if(c) c.onclick=()=>{ SFX.tap(); go('module',nm.k); };
  const nextJoke=()=>{ jk=(jk+1)%JOKES.length; const lb=$('#lb',m); lb.classList.remove('hop'); void lb.offsetWidth; lb.classList.add('hop'); SFX.tap(); haptic('light'); $('#jt',m).textContent=isAr()?JOKES[jk][0]:JOKES[jk][1]; };
  $('#lb',m).onclick=nextJoke; $('#jb',m).onclick=nextJoke;
  bindQuests(m);
  $('#hb',m).onclick=()=>{ SFX.tap(); hongbaoSheet(); }; $('#qn',m).onclick=()=>{ SFX.tap(); fortuneSheet(); };
  $('#daily',m).onclick=()=>{ SFX.tap(); go('daily'); }; bindWeak(m);
  $$('[data-tr]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.tr); });
  $('#tzh',m).onclick=()=>{ SFX.tap(); go('zh'); };
  $$('[data-lab]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); openLab(b.dataset.lab); }); checkBadges(); };

SCREENS.learn=m=>{ m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero"><span class="eyebrow">${t('learn')} · 学 xué</span><h1>${t('trSE')} · ${t('trCY')}</h1></div>
  ${['se','cy'].map(k=>{ const ms=TRACK(k), d=ms.filter(x=>modDone(x.k)).length; return `<button class="track ${k} big" data-tr="${k}"><span class="ti">${TRK[k].ic}</span><div class="grow"><span class="brushzh" style="font-size:22px">${k==='se'?'软件工程':'网络安全'}</span><b style="display:block">${TRK[k].name()}</b><div class="sub"><span class="num">${ms.length}</span> ${t('modules')} · <span class="num">${ms.length}</span> ${isAr()?'وحوش':'bosses'} · <span class="num">${ms.reduce((a,x)=>a+x.L.length,0)}</span> ${t('lessons')}</div><div class="bar ${k}" style="margin-top:6px"><i style="width:${d/ms.length*100}%"></i></div></div><span class="sub num">${d}/${ms.length}</span></button>`; }).join('')}
  <button class="card tap row" id="ex" style="gap:12px">${ico('exam','gold','lg')}<div class="grow"><b>${t('exam')}</b><div class="sub">${t('examB')}</div></div><span aria-hidden="true">›</span></button>`);
  $$('[data-tr]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.tr); }); $('#ex',m).onclick=()=>{ SFX.tap(); go('exam'); }; };

/* dashed river joining the stones: measured after layout, redrawn on resize */
function drawPath(map){ if(!map) return; const go=()=>{ const r={width:map.offsetWidth,height:map.offsetHeight};   /* layout (offset) coordinates: unaffected by the text-size zoom */
    const pts=$$('.pnode',map).map(n=>{ let x=n.offsetWidth/2,y=n.offsetHeight/2,e=n; while(e&&e!==map){ x+=e.offsetLeft; y+=e.offsetTop; e=e.offsetParent; } return [x,y]; }); if(pts.length<2) return;
  let d=`M${pts[0][0]} ${pts[0][1]}`; for(let i=1;i<pts.length;i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i], my=(y0+y1)/2; d+=` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`; }
  let svgEl=$('svg.river',map); if(!svgEl){ map.insertAdjacentHTML('afterbegin','<svg class="river" aria-hidden="true"><path/></svg>'); svgEl=$('svg.river',map); }
  svgEl.setAttribute('width',r.width); svgEl.setAttribute('height',r.height); $('path',svgEl).setAttribute('d',d); };
  requestAnimationFrame(go); const ro=window.ResizeObserver?new ResizeObserver(go):null; if(ro){ ro.observe(map); const prev=cleanup; cleanup=()=>{ ro.disconnect(); prev&&prev(); }; } }
SCREENS.module=(m,k)=>{ const x=MOD[k]; if(!x) return SCREENS.learn(m); if(!modFree(x)){ m.insertAdjacentHTML('beforeend',topbar()); return paywall('module'); }
  const s=mst(x.k), lab=CODE_LABS.find(l=>l.mod===x.k);
  const step=(id,n,label,sub,done)=>`<button class="step ${done?'done':''}" data-s="${id}"><span class="sn">${done?'✓':n}</span><div class="grow"><b>${label}</b><div class="sub">${sub}</div></div><span aria-hidden="true">›</span></button>`;
  const ms=TRACK(x.tr), pv=ms[x.ti-1], nx=ms[x.ti+1], ch=chapOf(x.tr)[Math.floor(x.ti/3)], nd=['L','Q','T','D'].find(q=>!s[q]);
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row mhead"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><span class="tag ${x.tr}">${TRK[x.tr].name()} · <span class="num">${x.ti+1}</span></span><span class="tag chtag" style="--ch:${ch.c[7]}"><span class="han">${ch.c[0]}</span> · ${t('jChapter')} <span class="num">${ch.ci+1}</span></span><div class="grow"></div>${s.done?stars(s.stars||1):''}</div>
  <div class="mhero"><div class="row" style="align-items:flex-start"><div class="grow"><h1>${x.ic} ${esc(L(x))}</h1><p class="sub" style="margin-top:6px">${esc(L(x,'sa','se'))}</p></div></div>
    <div class="row"><span class="zhbig">${esc(x.zh)}</span><button class="speak" id="say" aria-label="${isAr()?'استمع':'Listen'}">${ICON.speak}</button></div><span class="py">${esc(x.py)}</span></div>
  <div class="steps">${step('L',1,t('stepL'),`<span class="num">${x.L.length}</span> ${t('lessons')}`,s.L)}${step('Q',2,`${bossOf(x.k).h} ${isAr()?'قاتل':'Fight'} ${esc(bossOf(x.k).name)}`,s.Qb!=null?`${t('score')}: <span class="num">${Math.round(s.Qb*100)}%</span>`:`<span class="num">${x.Q.length}</span> ${t('questions')}`,s.Q)}
    ${step('T',3,t('stepT'),`<span class="num">${x.T.length}</span> · ${x.T.slice(0,3).map(w=>`<span class="han">${esc(w.h)}</span>`).join(' · ')}`,s.T)}${step('D',4,t('stepD'),`<span class="num">${x.D.length}</span> · ${t('dialog')}`,s.D)}
    ${lab?step('lab','⌨',t('stepLab'),esc(L(lab))+' · <span class="han">'+esc(lab.zh)+'</span>',!!S.labs[lab.k]):''}</div>
  ${nd?`<button class="btn block" id="ns">${t('nextStep')}: ${{L:t('stepL'),Q:esc(bossOf(x.k).name),T:t('stepT'),D:t('stepD')}[nd]} ${fwdA()}</button>`:''}
  ${navPair(pv?t('prevMod'):t('toPath'),nx?t('nextMod'):t('toPath'),{bid:'pm',nid:'nm',cls:'ghost'})}
  <div class="navhint sub">${pv?`${pv.ic} ${esc(L(pv))}`:''}<span class="grow"></span>${nx?`${esc(L(nx))} ${modFree(nx)?nx.ic:ICON.lock}`:''}</div>`);
  $('#bk',m).onclick=()=>goBack('learn'); $('#say',m).onclick=()=>speak(x.zh);
  const ns=$('#ns',m); if(ns) ns.onclick=()=>{ SFX.tap(); const b=$(`.step[data-s="${nd}"]`,m); b&&b.click(); };
  $('#pm',m).onclick=()=>{ SFX.tap(); pv?go('module',pv.k):go('track',x.tr); };
  $('#nm',m).onclick=()=>{ SFX.tap(); if(!nx) return go('track',x.tr); modFree(nx)?go('module',nx.k):paywall('module'); };
  $$('.step',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const id=b.dataset.s;
    if(id==='L') go('lesson',{k,i:0}); if(id==='Q') go('quizrun',{k}); if(id==='T') go('practice',{k}); if(id==='D') dialogSheet(x); if(id==='lab') openCodeLab(lab.k); }); };

function dialogSheet(x){ let playing=false;
  sheet(`<div class="row"><h2 class="grow">💬 ${t('dialog')}</h2><button class="btn sm ghost" id="pa">▶</button></div><span class="han" style="color:var(--zh)">${esc(x.zh)}</span>
    <div class="dlg">${x.D.map((d,i)=>`<div class="dl ${d.s}"><span class="who">${d.s}</span><div class="grow"><div class="zhline han">${esc(d.zh)}</div><div class="py" style="font-size:13px">${esc(d.py)}</div><div class="sub" dir="auto">${esc(L(d))}</div></div><button class="speak" data-i="${i}" aria-label="${isAr()?'استمع':'Listen'}">${ICON.speak}</button></div>`).join('')}</div>
    <button class="btn block" id="dd">${t('done')} ✓</button>`,el=>{
    $$('.speak',el).forEach(b=>b.onclick=()=>{ const d=x.D[+b.dataset.i]; speak(d.zh,{voice:dlgVoice(x.i,d.s)}); });
    $('#pa',el).onclick=async()=>{ if(playing){ playing=false; stopVoice(); return; } playing=true; await speak(x.zh,{voice:'n'}); for(const d of x.D){ if(!playing) break; await new Promise(r=>setTimeout(r,300)); await speak(d.zh,{voice:dlgVoice(x.i,d.s)}); } playing=false; };
    $('#dd',el).onclick=()=>{ playing=false; stopVoice(); const s=mst(x.k); if(!s.D){ s.D=1; save(); addXP(5); } closeSheet(); const fin=checkModDone(x); render(); if(fin) moduleDone(x); }; }); }

function moduleDone(x){ SFX.gong(); fireworks(4); confetti(110); const s=mst(x.k); checkBadges();
  sheet(`<div class="result" style="padding-top:4px"><div class="moon">${dragon('cool',110)}</div><span class="brushzh">恭喜 gōngxǐ!</span><h1>${t('modDone')}</h1><h3>${x.ic} ${esc(L(x))}</h3>${stars(s.stars||1)}<div class="sub">+40 ${t('xp')} · +30 ${t('bitsCur')}</div>
    ${S.pro?'':`<button class="btn ghost block" id="db">🎬 ${isAr()?'ضاعف البتات بمشاهدة إعلان':'Double the bits with an ad'} · +30</button>`}${navPair(t('toPath'),t('nextMod'),{bid:'tp',nid:'nx'})}</div>`,el=>{ $('#tp',el).onclick=()=>{ closeSheet(); breakPoint('module',()=>go('track',x.tr)); };
    const db=$('#db',el); if(db) db.onclick=async()=>{ db.disabled=true; if(await rewarded('double')){ addCoins(30); db.remove(); toast('×2 '+t('bitsCur')); } else db.disabled=false; };
    $('#nx',el).onclick=()=>{ closeSheet(); const n=nextMod(x.tr); if(n&&!modFree(n)){ go('track',x.tr); return paywall('next'); } breakPoint('module',()=>n?go('module',n.k):go('track',x.tr)); }; }); }

/* ---------- lesson = bites: info card(s) → fun card → quick check (must be answered right to go on) ---------- */
const FUNK={fact:['معلومة طريفة','Fun fact'],joke:['نكتة المبرمجين','Dev joke'],story:['قصة حقيقية','True story'],myth:['خرافة شائعة','Myth buster']};
const FUNR={fact:['لم أكن أعرف هذا! 🤯','I did not know that! 🤯'],joke:['هههه، فهمتها 😄','Ha! Got it 😄'],story:['قصة لا تُنسى 📜','What a story 📜'],myth:['انكشفت الخرافة 🔍','Myth busted 🔍']};
const lSteps=l=>{ const ps=L(l,'a','e').split(/\\n|\n/).filter(x=>x.trim()); const st=ps.map((p,j)=>({t:'info',p,last:j===ps.length-1})); if(l.f) st.push({t:'fun'}); if(l.q) st.push({t:'check'}); return st; };
const lqId=(k,i)=>k+'#'+i;
SCREENS.lesson=(m,{k,i,s})=>{ const x=MOD[k], n=x.L.length; i=Math.max(0,Math.min(n-1,i|0)); const l=x.L[i], st=lSteps(l), ns=st.length;
  s=s==null?0:Math.max(0,Math.min(ns-1,s<0?ns+(s|0):s|0)); const p=st[s]; S.lq=S.lq||{}; const solved=()=>!!S.lq[lqId(k,i)];
  const ar=isAr(), lastStep=s===ns-1;
  const goStep=(ii,ss)=>{ route={name:'lesson',arg:{k,i:ii,s:ss}}; render(); window.scrollTo(0,0); };
  const seg=st.map((q,j)=>`<i class="${j<s?'on':j===s?'cur':''} k-${q.t}"></i>`).join('');
  const kindLbl=p.t==='info'?(ar?'معلومة':'Learn'):p.t==='fun'?(ar?'استراحة مرح':'Fun break'):(ar?'فحص سريع':'Quick check');
  let body='';
  if(p.t==='info') body=`<div class="lcard rise"><span class="eyebrow">${x.ic} ${esc(L(x))}</span><h2>${esc(L(l,'ta','te'))}</h2><div class="lbody">${rich(p.p)}</div>${p.last&&l.c?codeHTML(l.c):''}</div>
    ${i===0&&s===0?`<div class="card row" style="gap:10px"><span class="han" style="font-size:22px;color:var(--zh)">${esc(x.zh)}</span><span class="py grow">${esc(x.py)}</span><button class="speak" id="say" aria-label="${ar?'استمع':'Listen'}">${ICON.speak}</button></div>`:''}`;
  else if(p.t==='fun'){ const f=l.f, K=FUNK[f.k]||FUNK.fact, R=FUNR[f.k]||FUNR.fact;
    body=`<div class="lfun rise k-${f.k}"><div class="lfun-top"><span class="lfun-ic" aria-hidden="true">${f.i}</span><span class="chip">${ar?K[0]:K[1]}</span></div>
      <p class="lfun-t">${inl(L(f,'a','e'))}</p></div>
      <div class="lreact rise" style="animation-delay:.15s">${dragon(f.k==='joke'?'happy':'cool',64)}<div class="bubble">${ar?R[0]:R[1]}</div></div>`; }
  else { const q=l.q, ok0=solved(); const opts=shuffle(q.o.map((o,j)=>({h:inl(ar?o[0]:o[1]),ok:j===0})));
    body=`<div class="lcheck rise"><span class="eyebrow">⚡ ${ar?'سؤال سريع قبل أن تكمل':'Quick one before you go on'}</span><h2 class="lq">${inl(L(q,'qa','qe'))}</h2>
      <div class="col" style="gap:10px">${opts.map((o,j)=>`<button class="opt lcopt${ok0&&o.ok?' right':''}" data-ok="${o.ok?1:0}"${ok0?' disabled':''}><span class="ol">${'ABC'[j]}</span><span class="grow">${o.h}</span></button>`).join('')}</div>
      <div id="lfb" class="lfb" role="status" aria-live="polite">${ok0?`<b>✓</b> ${inl(L(q,'wa','we'))}`:''}</div></div>`; }
  const nextLbl=lastStep?(i<n-1?t('nextLesson'):t('finish')+' ✓'):p.t==='info'&&st[s+1]&&st[s+1].t==='fun'?(ar?'استراحة مرح':'Fun break'):st[s+1]&&st[s+1].t==='check'?(ar?'إلى السؤال':'To the question'):t('next');
  const backLbl=s>0?t('back'):i>0?t('prevLesson'):t('back');
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="lsteps" aria-hidden="true">${seg}</div><span class="sub num" aria-label="${ar?'الدرس':'Lesson'} ${i+1}/${n}">${i+1}/${n}</span></div>
  <div class="lkind sub"><span>${kindLbl}</span><span class="num">${s+1}/${ns}</span></div>
  ${body}
  <div class="grow"></div>${navPair(backLbl,nextLbl,{bid:'pv',nid:'nx'})}`;
  $('#qx',m).onclick=()=>go('module',k); const sy=$('#say',m); if(sy) sy.onclick=()=>speak(x.zh);
  const nx=$('#nx',m); if(p.t==='check'&&!solved()){ nx.disabled=true; nx.setAttribute('aria-disabled','true'); }
  if(p.t==='fun'){ try{ SFX.open(); haptic('light'); }catch(e){} }
  if(p.t==='check'){ const q=l.q; let tries=0;
    $$('.lcopt',m).forEach(b=>b.onclick=()=>{ if(solved()) return; tries++; const fb=$('#lfb',m);
      if(b.dataset.ok==='1'){ S.lq[lqId(k,i)]=1; save(); b.classList.add('right'); $$('.lcopt',m).forEach(o=>o.disabled=true); SFX.ok(); try{ haptic('success'); }catch(e){}
        const Q=QUIP_OK[Math.random()*QUIP_OK.length|0]; fb.innerHTML=`<b>${ar?Q[0]:Q[1]}</b> ${inl(L(q,'wa','we'))}`; fb.className='lfb ok rise';
        if(tries===1){ confetti(40); addXP(3); } nx.disabled=false; nx.removeAttribute('aria-disabled'); nx.classList.add('pulse'); try{ questEvent('right'); }catch(e){} }
      else { b.classList.add('wrong'); b.disabled=true; SFX.bad(); try{ haptic('error'); }catch(e){} const Q=QUIP_BAD[Math.random()*QUIP_BAD.length|0];
        fb.innerHTML=`<b>${ar?Q[0]:Q[1]}</b> ${ar?'جرّب خيارًا آخر.':'Try another option.'}`; fb.className='lfb bad rise'; } }); }
  $('#pv',m).onclick=()=>{ SFX.tap(); if(s>0) return goStep(i,s-1); if(i===0) return go('module',k); goStep(i-1,-1); };
  nx.onclick=()=>{ if(nx.disabled) return; SFX.tap(); if(!lastStep) return goStep(i,s+1);
    questEvent('lesson'); if(i<n-1){ SFX.open(); return goStep(i+1,0); }
    const ms=mst(k); if(!ms.L){ ms.L=1; save(); addXP(10); } const fin=checkModDone(x); go('module',k); if(fin) moduleDone(x); }; };

/* ---------- quiz engine (learn mode: feedback after each answer; exam mode: feedback at the end; boss mode: HP and hearts) ---------- */
const qFrom=(q,mod)=>{ const o=q.o.map((p,j)=>({h:inl(isAr()?p[0]:p[1]),ok:j===0})); return {q:inl(L(q,'qa','qe')),opts:shuffle(o),why:inl(L(q,'wa','we')),mod,id:mod?mod.k+'#'+mod.Q.indexOf(q):null}; };
function runQuiz(m,{qs,title,exam,seconds,boss,hearts:H0,onDone,onQuit}){ let i=0, right=0, timer=null, end=seconds?Date.now()+seconds*1000:0; const log=[];
  const hearts0=boss?(H0||qs.length-Math.ceil(qs.length*.7)+1):0; let hearts=hearts0, revived=false;
  const prev=cleanup; cleanup=()=>{ clearInterval(timer); prev&&prev(); };
  const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  if(seconds) timer=setInterval(()=>{ const left=Math.max(0,Math.round((end-Date.now())/1000)); const el=$('#qt',m); if(el) el.textContent=fmtT(left); if(!left){ clearInterval(timer); finish(); } },500);
  const bossBox=()=>`<div class="boss" id="bs"><div class="row"><span class="bossface" id="bf">${boss.h}</span><div class="grow" style="min-width:0"><span class="brushzh" style="font-size:18px">${esc(boss.zh)}</span><b style="display:block">${esc(boss.name)}</b>
      <div class="hp"><i id="hp" style="width:${100-right/qs.length*100}%"></i></div></div></div>
      <div class="row" style="justify-content:space-between"><span class="hearts" aria-label="${hearts}">${'❤️'.repeat(hearts)}${'🖤'.repeat(hearts0-hearts)}</span><span class="taunt" id="tn">${esc(pickL(TAUNTS))}</span></div></div>`;
  function draw(){ const q=qs[i]; $$('.feedback').forEach(f=>f.remove());
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="bar"><i style="width:${i/qs.length*100}%"></i></div>${seconds?`<span class="timer num" id="qt">${fmtT(Math.round((end-Date.now())/1000))}</span>`:`<span class="sub num">${i+1}/${qs.length}</span>`}</div>
      ${boss?bossBox():`<span class="eyebrow">${esc(title)}${q.mod?' · '+esc(L(q.mod)):''}</span>`}<div class="qtext rise">${q.q}</div>
      <div class="col" style="gap:10px">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span><span class="grow">${o.h}</span></button>`).join('')}</div>`;
    $('#qx',m).onclick=()=>{ clearInterval(timer); COMBO=0; onQuit(); };
    $$('.opt',m).forEach(b=>b.onclick=()=>{ if(m.dataset.lock) return; const o=q.opts[+b.dataset.j]; log.push({q,ok:o.ok,pick:o}); qMark(q,o.ok); if(o.ok){ right++; S.right=(S.right||0)+1; }
      comboHit(o.ok); if(o.ok) questEvent('right');
      if(exam){ SFX.tap(); i++; i<qs.length?draw():finish(); return; }
      m.dataset.lock=1; $$('.opt',m).forEach((x,j)=>{ x.disabled=true; if(q.opts[j].ok) x.classList.add('right'); else if(x===b) x.classList.add('wrong'); else x.classList.add('dim'); });
      o.ok?(SFX.ok(),haptic('success')):(SFX.bad(),haptic('error'));
      if(boss){ const bs=$('#bs',m); if(o.ok){ SFX.hit(); $('#hp',m).style.width=(100-right/qs.length*100)+'%'; $('#bf',m).classList.add('ouch'); $('#tn',m).textContent=pickL(HITS); floatText('-'+Math.round(100/qs.length)+' HP',$('#bf',m)); }
        else { hearts--; bs.classList.add('shake'); $('#tn',m).textContent=pickL(TAUNTS); $('.hearts',m).innerHTML='❤️'.repeat(hearts)+'🖤'.repeat(hearts0-hearts); } }
      let lost=boss&&hearts<=0; const canRevive=lost&&!revived&&!exam, f=document.createElement('div'); f.className='feedback '+(o.ok?'good':'bad');
      f.innerHTML=`<div><div class="row"><b class="v grow">${o.ok?t('correct'):t('wrong')}</b><span class="sub">${esc(pickL(o.ok?QUIP_OK:QUIP_BAD))}</span></div><div class="sub" style="color:var(--text)">${q.why}</div>
        ${canRevive?`<button class="btn block revive" id="rv">❤️ ${t('reviveT')} · ${reviveLabel()}</button>`:''}<button class="btn ${canRevive?'ghost ':''}block" id="fn">${lost?(isAr()?'النتيجة':'See result'):t('next')+' '+fwdA()}</button></div>`;
      document.body.appendChild(f); $('#fn',f).onclick=()=>{ f.remove(); delete m.dataset.lock; i++; (i<qs.length&&!lost)?draw():finish(); };
      const rv=$('#rv',f); if(rv) rv.onclick=async()=>{ rv.disabled=true; if(await reviveUse()){ revived=true; lost=false; hearts=1; log.pop(); qs[i]=Object.assign({},q,{opts:shuffle(q.opts)}); f.remove(); delete m.dataset.lock; draw(); SFX.ok(); toast('❤️ '+t('reviveOn')); } else rv.disabled=false; }; }); }
  function finish(){ clearInterval(timer); $$('.feedback').forEach(f=>f.remove()); save(); onDone(right,qs.length,log,hearts===hearts0); }
  draw(); }

SCREENS.quizrun=(m,{k})=>{ const x=MOD[k], b=bossOf(k); const qs=fightPick(x).map(q=>qFrom(q,x));
  runQuiz(m,{qs,title:t('quiz'),boss:b,onQuit:()=>go('module',k),onDone:(r,n,log,flawless)=>{ const p=r/n, s=mst(k); s.Qb=Math.max(s.Qb||0,p); const ok=quizPass(p);
    if(ok){ s.Q=1; s.stars=Math.max(s.stars||0,quizStars(p)); if(flawless) S.flawless=1; questEvent('boss'); } addXP(r*3); const c=ok?addCoins(10+r):0; save(); ok?(SFX.gong(),fireworks(3),confetti(60)):SFX.bad(); track('quiz',{k,p}); checkBadges();
    m.innerHTML=`<div class="result rise">${ok?`<div class="bossdown"><span class="bossface gone">${b.h}</span><span class="stampmark big">斩</span></div><h1>${isAr()?'هزمت':'You defeated'} ${esc(b.name)}!</h1><span class="brushzh">${esc(b.zh)} · ${esc(b.py)}</span>${stars(quizStars(p))}`
      :`<div class="bossdown">${dragon('sad',96)}<span class="bossface laugh">${b.h}</span></div><h1>${esc(b.name)} ${isAr()?'فاز هذه المرة':'wins this round'}</h1><p class="sub">${esc(pickL(TAUNTS))} ${t('quizFail')}</p>`}
      <div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${r}/${n}</b></div><div><span class="sub">${t('earned')}</span><b class="num">+${r*3}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${c}</b></div></div>
      <div class="row" style="width:100%"><button class="btn ghost grow" id="ag">↺ ${ok?t('again'):(isAr()?'جولة ثأر':'Rematch')}</button><button class="btn grow" id="nx">${t('next')} →</button></div></div>`;
    $('#ag',m).onclick=()=>go('quizrun',{k}); $('#nx',m).onclick=()=>{ const fin=checkModDone(x); go('module',k); if(fin) moduleDone(x); }; }}); };

SCREENS.exam=(m,tr)=>{ tr=tr==='cy'?'cy':'se'; const best=S.exams[tr]; const used=S.examDay===today()&&!S.pro;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><div class="grow"><span class="eyebrow">${t('learn')}</span><h1>📝 ${t('exam')}</h1></div></div>
  <div class="seg" id="esg"><button data-t="se" aria-pressed="${tr==='se'}">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="${tr==='cy'}">🛡️ ${t('trCY')}</button></div>
  <div class="card col" style="gap:10px"><p>${t('examB')}</p>${best!=null?`<div class="sub">${t('score')}: <b class="num">${Math.round(best*100)}%</b></div>`:''}${S.pro?'':`<div class="sub">${t('examFree')}</div>`}
  <button class="btn block" id="go">${used?ICON.lock+' ':''}${t('examStart')}</button></div>`);
  $('#bk',m).onclick=()=>goBack('learn'); $$('#esg button',m).forEach(b=>b.onclick=()=>go('exam',b.dataset.t));
  $('#go',m).onclick=()=>{ if(used) return examLimitSheet(tr); S.examDay=today(); save(); go('examrun',{tr}); }; };

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
function bindCert(m,tr){ const b=$('#cert',m); if(!b) return; b.onclick=()=>{ if(!S.pro) return paywall('cert');
  const d=Object.values(S.mods).map(x=>x.done).filter(Boolean).sort().pop()||today();
  sheet(`<div class="cert ondark"><div class="seal" style="margin:0 auto">码</div><span class="eyebrow" style="color:#5eead4">${t('certT')}</span><h2 id="cn">${esc(S.certName||'—')}</h2>
    <div>${TRK[tr].name()}</div><div class="han">${tr==='se'?'软件工程':'网络安全'}</div><div class="sub num">${d} · Cipher Path</div></div>
    <input class="field" id="ci" maxlength="40" placeholder="${t('certName')}" value="${esc(S.certName||'')}"><button class="btn block" id="sh">${t('share')}</button>`,el=>{
    $('#ci',el).oninput=e=>{ S.certName=e.target.value; save(); $('#cn',el).textContent=S.certName||'—'; };
    $('#sh',el).onclick=()=>{ const txt=`${S.certName||''} · ${t('certT')}: ${TRK[tr].name()} · Cipher Path`; RN?RN.postMessage(JSON.stringify({type:'share',text:txt})):(navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast('✓')).catch(()=>{})); }; }); }; }
