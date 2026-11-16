/* ---------- onboarding ---------- */
SCREENS.onboard=app=>{
  const m=document.createElement('main'); m.className='screen full'; app.appendChild(m);
  m.innerHTML=`<div class="glow"></div><div class="hero" style="min-height:240px">${lampImg()}<div class="seal" style="width:64px;height:64px;font-size:40px;border-radius:16px">汉</div>
   <h1 style="font-size:34px">Hanzi Path<br><span class="sub" style="font-size:18px">مسار هانزي · 汉字之路</span></h1></div>
   <div><h2>Choose your language · اختر لغتك</h2><div class="sub">Meanings and menus · المعاني والقوائم</div></div>
   <div class="lang"><button data-l="ar"><i>阿</i><div class="grow">العربية<div class="sub">تعلّم الصينية بالعربية</div></div>›</button>
   <button data-l="en"><i>英</i><div class="grow">English<div class="sub">Learn Chinese in English</div></div>›</button></div>`;
  $$('.lang button',m).forEach(b=>b.onclick=()=>{ S.lang=b.dataset.l; save(); track('onboarding_complete',{lang:S.lang}); SFX.gong(); go('home'); });
};
/* ---------- home ---------- */
SCREENS.home=m=>{
  const l=curLevel(), u=unitsOf(l), cu=Math.min(curUnit(l),u.length-1), pct=Math.min(1,S.todayXP/S.goal), C=2*Math.PI*33;
  const locked=!unitFree(l,cu); const r=rankOf(S.xp), nx=RANK_XP[r+1];
  const h=new Date().getHours();
  m.insertAdjacentHTML('beforeend',`${topbar()}
  <div class="hero ph">${photo('home',0,'','bg')}<div class="eyebrow">${t('hello')[h<12?0:1]}</div><h1>${t('welcome')}</h1>
    <div class="row" style="gap:10px;margin-top:6px"><div class="bao-hop" id="bao">${bao('happy',56)}</div><div class="bubble" id="baoq">${esc(quip('idle'))}</div></div></div>
  <div class="stats">
    <div class="stat"><span>🔥 ${t('streak')}</span><b class="num">${S.streak}</b></div>
    <div class="stat"><span>✦ ${t('xp')}</span><b class="num">${fmt(S.xp)}</b></div>
    <div class="stat"><span>${t('rank')}</span><b class="brush" style="font-weight:400;font-size:24px;color:var(--gold2)">${RANK_HAN[r]}</b></div>
  </div>
  <div class="paper rise" style="display:flex;flex-direction:column;gap:12px">
    <div class="stamp">${l}级</div>
    <div class="sub" style="font-weight:600">HSK ${l} · ${t('unit')} <span class="num">${cu+1}</span> ${t('of')} <span class="num">${u.length}</span></div>
    <div class="han" style="font-size:40px;font-weight:700;letter-spacing:.12em;text-align:start">${(u[cu]||[]).slice(0,4).map(w=>esc(w.h)).join(' ')}</div>
    <div class="bar"><i style="width:${(curUnit(l)/u.length*100).toFixed(1)}%"></i></div>
    <button class="btn ${locked?'red':''} block" id="cont">${locked?'🔒 '+t('proTitle'):t('cont')+' →'}</button>
  </div>
  <div class="card goal">
    <svg class="ring" viewBox="0 0 78 78" aria-hidden="true"><defs><linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#b9852c"/><stop offset="1" stop-color="#f7d894"/></linearGradient></defs>
      <circle class="bgc" cx="39" cy="39" r="33"/><circle class="fgc" cx="39" cy="39" r="33" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}" transform="rotate(-90 39 39)"/><text x="39" y="45" text-anchor="middle">${Math.round(pct*100)}%</text></svg>
    <div class="grow col" style="gap:6px"><h3>${t('goal')}</h3><div class="sub"><span class="num">${S.todayXP} / ${S.goal}</span> ${t('xp')}</div>
      ${nx?`<div class="sub">${RANK_HAN[r+1]} · <span class="num">${fmt(nx-S.xp)}</span> ${t('xp')} ${t('nextRank')}</div><div class="bar"><i style="width:${((S.xp-RANK_XP[r])/(nx-RANK_XP[r])*100).toFixed(1)}%"></i></div>`:''}</div>
  </div>
  ${todayCard()}
  ${pathsCard()}
  ${chestCard()}
  <div class="card col"><div class="row"><h3 class="grow">${t('quests')}</h3><span class="brush" style="color:var(--gold);font-size:20px">任务</span></div>
    ${questsToday().map(([k,fn,rw])=>{const done=fn(),cl=S.quests[k];return `<div class="row"><span style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:${done?'var(--jade-soft)':'rgba(255,255,255,.05)'};color:${done?'var(--jade)':'var(--faint)'}">${done?'✓':'·'}</span><span class="grow">${t(k)}</span>
      ${cl?`<span class="sub">${t('claimed')}</span>`:`<button class="btn sm ${done?'':'ghost'}" data-q="${k}" ${done?'':'disabled'}>${coinHTML} <span class="num">${rw}</span></button>`}</div>`;}).join('')}</div>
  ${dueIds().length?`<button class="card row" id="rev" style="cursor:pointer;text-align:start"><span class="brush" style="font-size:34px;color:var(--red2)">复</span><div class="grow"><h3><span class="num">${dueIds().length}</span> ${t('due')}</h3><div class="sub">${t('reviewGo')}</div></div><span>›</span></button>`:''}
  <div class="row"><h2 class="grow">${t('level')}</h2><span class="sub">HSK 1–6</span></div>
  <div class="medals" style="margin-bottom:18px">${[1,2,3,4,5,6].map(L=>{const uu=unitsOf(L),dn=uu.every((_,i)=>unitDone(L,i));
    return `<button class="medal ${dn?'done':L===l?'on':''}" data-l="${L}" aria-label="HSK ${L}">${L}${!S.pro&&L>1?'<span class="lk">🔒</span>':''}<small>HSK ${L}</small></button>`;}).join('')}</div>
  <button class="card feature" id="gfeat" style="cursor:pointer;text-align:start;width:100%"><div class="img" style="background-image:url(${ART.mahjong})"></div><div class="txt"><span class="eyebrow">${t('games')}</span><h3>${t('mahjong')}</h3><span class="sub">${t('mahjongD')}</span></div></button>`);
  $('#cont',m).onclick=()=>locked?paywall('level'):go('lesson',{l,i:cu});
  const rv=$('#rev',m); if(rv) rv.onclick=()=>go('review');
  $$('.medal',m).forEach(b=>b.onclick=()=>go('level',+b.dataset.l));
  $$('[data-q]',m).forEach(b=>b.onclick=()=>{ const q=QUEST_POOL.find(x=>x[0]===b.dataset.q); S.quests[q[0]]=1; const g=addCoins(q[2]); floatText('+'+g,b); save(); render(); });
  $('#gfeat',m).onclick=()=>go('games'); bindChest(m); bindToday(m); bindPaths(m);
  $('#bao',m).onclick=()=>{ SFX.ok(); $('#baoq',m).textContent=quip('idle'); const b=$('#bao',m); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); };
};
function chestCard(){ const open=S.chestDay===today();
  return `<div class="card row" style="background:linear-gradient(120deg,rgba(179,38,30,.35),rgba(26,19,17,1) 60%)"><div style="font-size:40px;line-height:1">${open?'🧧':'🎁'}</div><div class="grow"><h3>${t('chest')}</h3><div class="sub">${open?t('chestDone'):'🔥 '+S.streak+' · '+t('streak')}</div></div>${open?'':`<button class="btn sm" id="chest">${t('chestOpen')}</button>`}</div>`; }
function bindChest(m){ const b=$('#chest',m); if(!b) return; b.onclick=()=>{ const base=20+Math.min(S.streak,10)*5+(Math.random()*20|0); S.chestDay=today(); const got=addCoins(base); const fz=(S.streak>0&&S.streak%7===0)?1:0; S.freezes+=fz; save();
  SFX.win(); confetti(60); sheet(`<div class="result"><div class="bigseal">福</div><h2>${t('chestGot')}</h2><div class="row" style="justify-content:center;font:800 34px Inter">${coinHTML} +${got}</div>${fz?`<div class="sub">❄ +1 ${t('freeze')}</div>`:''}
   ${S.pro?'':`<button class="btn red block" id="dbl">▶ ${t('doubleIt')}</button>`}<button class="btn block" id="ok">${t('done')}</button></div>`,s=>{
    $('#ok',s).onclick=()=>{closeSheet();render();}; const d=$('#dbl',s); if(d) d.onclick=async()=>{ if(await rewarded()){ S.coins+=got; save(); toast(t('doubled')); } closeSheet(); render(); }; }); }; }
/* ---------- level path ---------- */
SCREENS.level=(m,L)=>{
  const u=unitsOf(L), cu=curUnit(L);
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"><h2>HSK ${L}</h2><div class="sub"><span class="num">${(byLevel[L]||[]).length}</span> ${t('words')} · <span class="num">${u.length}</span> ${t('units')}</div></div><span class="brush" style="font-size:30px;color:var(--gold)">${['','一','二','三','四','五','六'][L]}级</span></div>
   ${photo('hsk'+L,130,`<span class="brush" style="font-size:44px;color:var(--gold2);text-shadow:0 2px 14px #000">${['','一','二','三','四','五','六'][L]}级</span>`)}
   ${!S.pro&&L>1?`<button class="paper row" id="pw" style="cursor:pointer;text-align:start"><span class="brush" style="font-size:30px;color:var(--red)">锁</span><div class="grow"><b>${t('proTitle')}</b><div class="sub">${t('freeSample')}: ${t('unit')} 1–${FREE_SAMPLE_UNITS}</div></div><span class="btn sm red">PRO</span></button>`:''}
   <div class="path">${u.map((ws,i)=>{const d=unitDone(L,i),free=unitFree(L,i),open=free&&(d||i<=cu);return `<div class="nodewrap"><button class="node ${d?'done':open?(i===cu?'cur':''):'locked'}" data-i="${i}" ${open?'':'data-locked="1"'}><span>${free?esc(ws[0].h[0]):'🔒'}</span></button><small>${t('unit')} ${i+1}</small></div>`;}).join('')}</div>`);
  $('#bk',m).onclick=()=>go('home'); const pw=$('#pw',m); if(pw) pw.onclick=paywall;
  $$('.node',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(!unitFree(L,i)) return paywall(); if(b.dataset.locked) return; go('lesson',{l:L,i}); });
};
/* ---------- quiz engine ---------- */
function makeQuestions(words,pool){ const qs=[]; const others=w=>pick(pool.filter(x=>x.id!==w.id&&x.h!==w.h&&meaning(x)!==meaning(w)),3);
  words.forEach(w=>{ let k=['mean','han','tone','listen'][Math.random()*4|0]; if(k==='tone'&&!hasTone(w.p)) k='mean'; if([...w.h].length<=2&&[...w.h].every(c=>typeof canWrite==='function'&&canWrite(c))&&Math.random()<.22) k='write'; qs.push({k,w,opts:k==='tone'?toneOptions(w.p):k==='write'?[]:shuffle([w,...others(w)])}); });
  const out=shuffle(qs); if(words.length>=4) out.splice(Math.min(3,out.length),0,{k:'pairs',ws:pick(words,4)}); return out; }
function runQuiz(m,{intro,questions,onDone,back}){
  let i=0,correct=0,streak=0,best=0,introI=0,sel=null,answered=false,qStart=0,fast=0; const steps=intro?intro.length:0, total=()=>steps+questions.length, t0=Date.now();
  const head=()=>`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i style="width:${((introI+i)/total()*100).toFixed(1)}%"></i></div>${streak>=3?`<span class="chip">🔥 ${streak}</span>`:''}</div>`;
  const bindX=()=>{ $('#qx',m).onclick=()=>{ $$('.feedback').forEach(f=>f.remove()); back(); }; };
  const wcls=w=>{const n=[...w.h].length; return n>=4?'w4':n===3?'w3':n===2?'w2':'';};
  function card(){ const w=intro[introI];
    m.innerHTML=`${head()}<div class="eyebrow" style="text-align:center">✦ ${t('newWord')}</div>
     <div class="tzg ${wcls(w)} rise"><span class="han">${esc(w.h)}</span></div>
     <div class="prompt"><div class="row" style="gap:14px"><span class="py" style="font-size:26px">${esc(w.p)}</span><button class="speak" id="sp">🔊</button><button class="speak" id="mic">🎤</button></div>
       <div class="meaning">${mean(w,3)}</div>${extrasHTML(w)}</div>
     ${w.ex?`<div class="paper excard col" style="gap:4px;padding:16px"><div class="sub">${t('example')} · ${t('tapWords')}</div>${analyseHTML(w.ex.zh)}<div>${esc(isAr()?w.ex.ar:(w.ex.en||''))}</div></div>`:''}
     <div class="grow"></div><button class="btn block" id="go">${t('got')}</button>`;
    speak(w.h); $('#sp',m).onclick=()=>speak(w.h); $('#mic',m).onclick=()=>pronCheck(w.h); bindTokens(m); bindExtras(m,w); $('#go',m).onclick=()=>{SFX.tap(); introI++; introI<steps?card():ask();}; bindX(); }
  function pairs(q){ let pickL=null, left=4;
    const L=shuffle(q.ws), R=shuffle(q.ws);
    m.innerHTML=`${head()}<div class="prompt rise" style="padding-top:8px"><div class="row" style="gap:10px;justify-content:center">${bao('think',54)}<div class="sub" style="max-width:220px;text-align:start">${t('pairsHelp')}</div></div></div>
      <div class="pairs"><div class="col">${L.map(w=>`<button class="opt pl" data-id="${w.id}"><span class="han" style="font-size:28px">${esc(w.h)}</span></button>`).join('')}</div>
      <div class="col">${R.map(w=>`<button class="opt pr" data-id="${w.id}" style="font-size:14.5px">${mean(w,1)}</button>`).join('')}</div></div>`;
    bindX();
    $$('.pl',m).forEach(b=>b.onclick=()=>{ $$('.pl',m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); pickL=b; speak(byId[b.dataset.id].h); SFX.tap(); });
    $$('.pr',m).forEach(b=>b.onclick=()=>{ if(!pickL) return; if(pickL.dataset.id===b.dataset.id){ [pickL,b].forEach(x=>{ x.classList.remove('sel'); x.classList.add('right'); x.disabled=true; }); SFX.ok(); floatText('+1',b); pickL=null; left--;
        if(!left){ correct++; streak++; best=Math.max(best,streak); confetti(30); setTimeout(()=>{ i++; i<questions.length?ask():finish(); },650); } }
      else { SFX.bad(); b.classList.add('wrong'); setTimeout(()=>b.classList.remove('wrong'),450); streak=0; } }); }
  function writeQ(q){ const w=q.w, cs=[...w.h]; let ci=0, miss=0;
    m.innerHTML=`${head()}<div class="prompt rise" style="padding-top:6px"><div class="sub">✍️ ${t('wWriteIt')}</div><div class="meaning">${mean(w)}</div><div class="row" style="gap:10px;justify-content:center"><span class="py" style="font-size:22px">${esc(w.p)}</span><button class="speak sm" id="sp">🔊</button></div></div>
      <div class="wbox paper" style="margin:0 auto">${GRID}<div id="hw"></div><div class="wmsg" id="wmsg"></div></div><div class="grow"></div><button class="btn ghost block" id="skip">${t('wSkip')}</button>`;
    bindX(); $('#sp',m).onclick=()=>speak(w.h); speak(w.h);
    const next=()=>{ i++; i<questions.length?ask():finish(); };
    const done=()=>{ const ok=miss<=3*cs.length; if(ok){ correct++; streak++; best=Math.max(best,streak); SFX.ok(); haptic('success'); } else { streak=0; SFX.bad(); } srsMark(w.id,ok); S.written=S.written||{}; cs.forEach(c=>S.written[c]=Math.max(S.written[c]||0,ok?2:1)); save();
      $('#wmsg',m).textContent=(ok?'✓ ':'')+quip(ok?'ok':'bad'); $('#skip',m).hidden=true; setTimeout(next,1300); };
    const one=()=>{ const box=$('#hw',m); box.innerHTML=''; const wr=hwCreate(box,cs[ci],{size:Math.min(250,innerWidth-110)}); wr.quiz({showHintAfterMisses:2,onMistake:()=>{ miss++; haptic('error'); },onCorrectStroke:()=>SFX.tap(),onComplete:()=>{ ci++; if(ci<cs.length) setTimeout(one,450); else done(); }}); };
    $('#skip',m).onclick=()=>{ streak=0; srsMark(w.id,false); save(); next(); }; one(); }
  function ask(){ answered=false; sel=null; qStart=Date.now(); const q=questions[i]; if(q.k==='pairs') return pairs(q); if(q.k==='write') return writeQ(q); const w=q.w; let prompt='',opts='',one=false;
    if(q.k==='mean'){ prompt=`<div class="sub">${t('whatMeans')}</div><div class="big han">${esc(w.h)}</div><button class="speak" id="sp">🔊</button>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}">${mean(o)}</button>`).join(''); }
    if(q.k==='han'){ prompt=`<div class="sub">${t('pickHan')}</div><div class="meaning">${mean(w)}</div>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); }
    if(q.k==='listen'){ prompt=`<div class="sub">${t('listen')}</div><button class="speak xl" id="sp">🔊</button>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); setTimeout(()=>speak(w.h),250); }
    if(q.k==='tone'){ prompt=`<div class="sub">${t('pickTone')}</div><div class="big han">${esc(w.h)}</div><div class="meaning" style="font-size:17px">${mean(w)}</div>`; one=true; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="py" style="font-size:21px">${esc(o)}</span></button>`).join(''); }
    m.innerHTML=`${head()}<div class="prompt rise" style="padding-top:12px">${prompt}</div><div class="opts ${one?'one':''}">${opts}</div><div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    bindX(); const sp=$('#sp',m); if(sp) sp.onclick=()=>speak(w.h);
    $$('.opt',m).forEach(b=>b.onclick=()=>{ if(answered) return; SFX.tap(); $$('.opt',m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel=+b.dataset.j; $('#ck',m).disabled=false; });
    $('#ck',m).onclick=()=>{ if(sel===null) return; answered=true; const o=q.opts[sel], ok=q.k==='tone'?o===w.p:o.id===w.id, rj=q.opts.findIndex(x=>q.k==='tone'?x===w.p:x.id===w.id);
      $$('.opt',m).forEach((b,j)=>{ if(j===rj) b.classList.add('right'); else if(j===sel) b.classList.add('wrong'); });
      const quick=ok&&Date.now()-qStart<6000; if(quick) fast++;
      if(ok){ correct++; streak++; best=Math.max(best,streak); SFX.ok(); haptic('success'); if(streak%5===0) confetti(40); } else { streak=0; SFX.bad(); haptic('error'); questions.push({...q,opts:shuffle(q.opts)}); }
      srsMark(w.id,ok); save(); if(q.k!=='listen') setTimeout(()=>speak(w.h),200);
      const f=document.createElement('div'); f.className='feedback rise '+(ok?'good':'bad');
      const mood=ok?(streak>=5?'cool':quick?'wow':'happy'):'oops', line=ok?(streak>=3&&streak%3===0?quip('streak'):quip('ok')):quip('bad');
      f.innerHTML=`<div><div class="row" style="gap:12px;align-items:center"><div class="bao-hop">${bao(mood,58)}</div><div class="grow"><h3 style="color:${ok?'#7be3b0':'#ff9a8f'}">${ok?t('correct')+(streak>=3?` 🔥${streak}`:'')+(quick?' ⚡':''):t('wrong')}</h3><div class="bubble">${esc(line)}</div></div></div>${ok?'':`<div class="row"><span class="han" style="font-size:26px">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="grow">${mean(w)}</span></div>${storyOf(w.h)?`<div class="sub" style="color:var(--ivory)">😄 ${esc(isAr()?storyOf(w.h)[2]:storyOf(w.h)[1])}</div>`:''}${extrasHTML(w)}`}<button class="btn block ${ok?'jade':'red'}" id="nx">${t('next')}</button></div>`;
      document.body.appendChild(f); bindExtras(f,w); $('#ck',m).hidden=true;
      $('#nx',f).onclick=()=>{ f.remove(); i++; i<questions.length?ask():finish(); }; };
  }
  function finish(){ const n0=questions.length-(questions.length-i); const acc=Math.round(correct/questions.length*100); const xp=10+correct*2+fast+(acc===100?10:0); addXP(xp); const c=addCoins(acc===100?15:10);
    const secs=Math.round((Date.now()-t0)/1000); SFX.win(); confetti(acc===100?110:60);
    m.innerHTML=`<div class="result rise"><div class="bao-dance">${bao(acc===100?'cool':acc>=70?'happy':'wow',120)}</div><div class="bubble big">${esc(acc===100?quip('perfect'):quip('ok'))}</div><h1>${t('lessonDone')}</h1>${fast?`<div class="chip" style="margin:0 auto">⚡ ${t('speedBonus')} +${fast}</div>`:''}
      <div class="kv"><div><span class="sub">${t('earned')}</span><b style="color:var(--gold2)">+${xp}</b></div><div><span class="sub">${t('accuracy')}</span><b>${acc}%</b></div><div><span class="sub">${t('combo')}</span><b>🔥${best}</b></div></div>
      <div class="row" style="justify-content:center;font:800 22px Inter">${coinHTML} +${c}</div>
      ${factCardHTML(whyFact())}<button class="btn block" id="dn">${t('next')}</button></div>`;
    bindFact(m); $('#dn',m).onclick=async()=>{ onDone&&onDone(); await interstitial(); render(); };
  }
  steps?card():ask();
}
SCREENS.lesson=(m,a)=>{ if(!a||a.custom) return; const {l,i}=a; const words=unitsOf(l)[i];
  runQuiz(m,{intro:words.filter(w=>!S.srs[w.id]),questions:makeQuestions(words,byLevel[l]),back:()=>go('level',l),
    onDone:()=>{ track('lesson_complete',{level:l,unit:i}); if(!S.user&&!S.guest&&!S.askedLogin){ S.askedLogin=1; setTimeout(()=>accountSheet(true),900); } S.units[l+'-'+i]=1;S.lessons++;S.lessonsToday++;save();route={name:'level',arg:l};}}); };
SCREENS.review=m=>{
  const due=dueIds().map(id=>byId[id]).filter(Boolean);
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><h1 class="grow">${t('review')}</h1><span class="brush" style="font-size:36px;color:var(--red2)">复习</span></div>`);
  if(!due.length){ m.insertAdjacentHTML('beforeend',`<div class="paper col" style="align-items:center;text-align:center"><div class="brush" style="font-size:64px;color:var(--red)">静</div><p style="margin:0">${isAr()?'لا توجد كلمات للمراجعة الآن. تعلّم دروسًا جديدة وستظهر هنا في الوقت المناسب.':'Nothing to review right now. Learn new lessons and words will return here at the right time.'}</p><button class="btn" id="h">${t('cont')}</button></div>`); $('#h',m).onclick=()=>go('home'); return; }
  const set=due.slice(0,S.pro?20:10); const pool=learnedIds().map(id=>byId[id]).filter(Boolean);
  m.insertAdjacentHTML('beforeend',`<div class="paper col"><div class="stamp">复</div><h2><span class="num">${due.length}</span> ${t('due')}</h2><div class="han" style="font-size:28px;text-align:start">${set.slice(0,8).map(w=>esc(w.h)).join(' ')}</div><button class="btn block" id="go">${t('reviewGo')}</button></div>`);
  $('#go',m).onclick=()=>{ route={name:'lesson'}; render(); const mm=$('main'); runQuiz(mm,{questions:makeQuestions(set,pool.length>=6?pool:W.slice(0,60)),back:()=>go('review'),onDone:()=>{ track('review_complete'); S.lessonsToday++;save();route={name:'home'};}}); };
};
/* ---------- dictionary ---------- */
SCREENS.dict=m=>{ let lv=0;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><h1 class="grow">${t('dict')}</h1><span class="brush" style="font-size:36px;color:var(--gold)">词典</span></div>
   ${photo('dict',96)}
   <div class="row" style="gap:8px"><button class="btn ghost sm grow" id="dbk">⭐ ${t('wordbook')} · <span class="num">${Object.keys(S.book||{}).length}</span></button><button class="btn ghost sm grow" id="dbl">🧩 ${t('builder')}</button><button class="btn ghost sm grow" id="dsec">🏭 ${t('secTitle')}</button></div>
   <input class="search" id="q" type="search" placeholder="${t('search')}" autocomplete="off">
   <div class="seg" id="seg">${[0,1,2,3,4,5,6,9].map(L=>`<button data-l="${L}" aria-pressed="${L===0}">${L===9?'💻 IT':L?'HSK '+L:t('all')}</button>`).join('')}</div>
   <div id="det"></div><div class="sub" id="cnt"></div><ul class="list" id="dl"></ul>${S.pro?'':`<div class="banner">${t('ad').toUpperCase()} · BANNER</div>`}`);
  const strip=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ü/g,'u').toLowerCase().replace(/[\s'·\-]/g,'');
  const arN=s=>s.replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
  const DW=W.concat(CODE_UNITS.flatMap(u=>u._w),SECTORS.flatMap(s=>s._w).filter(w=>w.sector)); DW.forEach(w=>{ if(w._s===undefined){ w._s=strip(w.p); w._a=w.ar?arN(w.ar.join(' ')):''; w._e=(w.en||[]).join(' ').toLowerCase(); } });
  function draw(){ const raw=$('#q',m).value.trim(), q=strip(raw), qa=arN(raw), ql=raw.toLowerCase();
    let r=DW.filter(w=>!lv||(lv===9?w.code:w.l===lv));
    if(raw){ r=r.filter(w=>w.h.includes(raw)||w.t.includes(raw)||(q&&w._s.startsWith(q))||(qa&&w._a.includes(qa))||(ql.length>1&&w._e.includes(ql)));
      r.sort((a,b)=>(b.h===raw)-(a.h===raw)||(b._s===q)-(a._s===q)||a.h.length-b.h.length||a.l-b.l); }
    $('#cnt',m).innerHTML=`<span class="num">${fmt(r.length)}</span> ${t('words')}`;
    $('#dl',m).innerHTML=r.slice(0,80).map(w=>`<li data-id="${w.id}"><span class="han">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="lv">${w.code?'IT':w.sector?(SECTORS.find(s=>s.k===w.sector)||{}).icon||'业':'HSK'+w.l}</span><span style="min-width:0;font-size:14px">${mean(w)}</span></li>`).join(''); }
  $('#q',m).oninput=draw; $('#dbk',m).onclick=()=>go('builder',{mode:'book'}); $('#dbl',m).onclick=()=>go('builder'); $('#dsec',m).onclick=()=>go('sectors');
  $$('#seg button',m).forEach(b=>b.onclick=()=>{lv=+b.dataset.l; $$('#seg button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); draw();});
  $('#dl',m).onclick=e=>{ const li=e.target.closest('li'); if(!li) return; SFX.tap(); S._wback={name:'dict'}; go('word',+li.dataset.id); };
  draw();
};
/* ---------- games hub ---------- */
const FREE_PLAYS=3;
const GAMES=[['mahjong','麻将'],['xiangqi','象棋'],['klotski','华容道'],['riddles','灯谜'],['idioms','成语接龙'],['tangram','七巧板'],['checkers','跳棋']];
const ARTK={mahjong:'mahjong',xiangqi:'xiangqi',riddles:'lantern',idioms:'idiom',tangram:'tangram',checkers:'checkers',klotski:'klotski'};
function gamePool(maxLen){ let l=learnedIds().map(id=>byId[id]).filter(Boolean); if(l.length<24) l=l.concat(byLevel[1],byLevel[2]); if(maxLen) l=l.filter(w=>[...w.h].length<=maxLen);
  const seen=new Set(); return l.filter(w=>!seen.has(w.h)&&seen.add(w.h)); }
SCREENS.games=m=>{
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero ph" style="min-height:170px">${photo('games',0,'','bg')}<span class="eyebrow">${t('gamesSub')}</span><h1>${t('gamesTitle')}</h1></div>
   ${factCardHTML(whyFact(daySeed()+7))}<div class="games">${GAMES.map(([k,zh])=>{const left=Math.max(0,FREE_PLAYS-(S.plays[k]||0));return `<button class="gcard" data-k="${k}"><div class="img" style="background-image:url(${ART[ARTK[k]]})"><span class="zh">${zh}</span></div>
     <div class="meta"><b>${t(k)}</b><span>${t(k+'D')}</span><span class="plays">${S.best[k]?`★ <span class="num">${fmt(S.best[k])}</span> · `:''}${S.pro?t('unlimited'):`<span class="num">${left}/${FREE_PLAYS}</span> ${t('playsLeft')}`}</span></div></button>`;}).join('')}</div>
   ${S.pro?'':`<div class="banner">${t('ad').toUpperCase()} · BANNER</div>`}`);
  $$('.gcard',m).forEach(b=>b.onclick=()=>{SFX.tap(); startGame(b.dataset.k);}); bindFact(m);
};
function startGame(k){ track('game_start',{game:k});
  if(!S.pro&&(S.plays[k]||0)>=FREE_PLAYS){ return sheet(`<div class="row"><span class="brush" style="font-size:40px;color:var(--gold)">${GAMES.find(g=>g[0]===k)[1]}</span><h2 class="grow">${t(k)}</h2></div><p style="margin:0">${t('outOfPlays')}</p>
      <button class="btn red block" id="ad">▶ ${t('watchAd')}</button><button class="btn block" id="pp">PRO · ${t('perk2')}</button><button class="btn ghost block" id="cl">${t('later')}</button>`,s=>{
      $('#ad',s).onclick=async()=>{ closeSheet(); if(await rewarded()){ S.plays[k]=FREE_PLAYS-1; save(); toast(t('rewardPlay')); render(); } };
      $('#pp',s).onclick=()=>{closeSheet();paywall();}; $('#cl',s).onclick=closeSheet; }); }
  const begin=()=>{ S.plays[k]=(S.plays[k]||0)+1; S.games++; S.gamesToday++; save(); go('game',k); };
  if(!(S.tut&&S.tut[k])) return tutorial(k,begin); begin();
}
function gameHeader(k,extra=''){ const zh=GAMES.find(g=>g[0]===k)[1];
  return `<div class="gamehead"><button class="icon-btn" id="gx" aria-label="${t('close')}">✕</button><div class="title"><b>${t(k)}</b><span>${zh}</span></div><div class="row" style="gap:6px">${extra}<button class="icon-btn" id="gh" data-k="${k}" aria-label="${t('howTo')}">?</button></div></div>`; }
function bindGameX(m){ $('#gx',m).onclick=()=>go('games'); const h=$('#gh',m); if(h) h.onclick=()=>tutorial(h.dataset.k); }
function endGame(m,k,score,{win=true,note=''}={}){
  const xp=Math.min(40,8+Math.round(score/20)); addXP(xp); const coins=addCoins(win?Math.min(60,10+Math.round(score/25)):5);
  const nb=score>(S.best[k]||0); if(nb) S.best[k]=score; save(); if(win){SFX.win(); confetti(nb?120:70);} else SFX.bad();
  m.innerHTML=`<div class="result rise"><div class="bigseal">${win?(nb?'冠':'赢'):'再'}</div><h1>${win?t('youWin'):t('youLose')}</h1>${note}
    <div class="kv"><div><span class="sub">★</span><b class="num">${fmt(score)}</b></div><div><span class="sub">${t('earned')}</span><b style="color:var(--gold2)">+${xp}</b></div><div><span class="sub">${t('coins')}</span><b style="color:var(--gold2)">+${coins}</b></div></div>
    ${S.pro?'':`<button class="btn red block" id="dbl">▶ ${t('doubleIt')}</button>`}
    <button class="btn block" id="again">${t('again')}</button><button class="btn ghost block" id="bk">${t('back')}</button></div>`;
  const d=$('#dbl',m); if(d) d.onclick=async()=>{ if(await rewarded()){ S.coins+=coins; save(); toast(t('doubled')); d.remove(); } };
  $('#again',m).onclick=async()=>{ await interstitial(); startGame(k); };
  $('#bk',m).onclick=async()=>{ await interstitial(); go('games'); };
}
SCREENS.game=(m,k)=>GAME[k](m);
const GAME={};
/* ---------- profile ---------- */
SCREENS.me=m=>{ const L=learnedIds().length, r=rankOf(S.xp);
  if(!S.refCode){ S.refCode='HP-'+Math.random().toString(36).slice(2,7).toUpperCase(); save(); }
  const nW=Object.keys(S.written||{}).length, nC=CODE_UNITS.filter(unitDoneC).length, nCh=Object.keys(S.codeCh||{}).length, nCu=Object.keys(S.cult||{}).length;
  const ach=[['写',t('a7'),nW>=10],['声',t('a8'),(S.pron||0)>=20],['码',t('a9'),nC>=1],['题',t('a10'),nCh>=1],['文',t('a11'),nCu>=3],['首',t('a1'),S.lessons>=1],['周',t('a2'),S.streak>=7],['百',t('a3'),L>=100],['一',t('a4'),unitsOf(1).every((_,i)=>unitDone(1,i))],['帅',t('a5'),(S.wins.xiangqi||0)>0],['戏',t('a6'),S.games>=10]];
  m.insertAdjacentHTML('beforeend',`${topbar()}
   <div class="paper row" style="gap:16px"><div class="bigseal" style="width:72px;height:72px;border-radius:18px;font:400 36px var(--f-brush);color:var(--gold2);background:linear-gradient(150deg,var(--red2),var(--red-deep));display:grid;place-items:center">${RANK_HAN[r][0]}</div>
     <div class="grow"><div class="sub">${t('rank')}</div><h2>${RANK_HAN[r]} · ${t('ranks')[r]}</h2><div class="sub"><span class="num">${fmt(S.xp)}</span> ${t('xp')} · <span class="num">${L}</span> ${t('learned')}</div></div></div>
   <div class="statgrid"><div><b class="num">${fmt(L)}</b><span>${t('learned')}</span></div><div><b class="num">${nW}</b><span>✍️ ${t('wWritten')}</span></div><div><b class="num">${S.pron||0}</b><span>🎤 ${t('xSay')}</span></div><div><b class="num">${nC}/${CODE_UNITS.length}</b><span>💻 ${t('units')}</span></div><div><b class="num">${nCh}</b><span>🏆 ${t('cChallenge')}</span></div><div><b class="num">${nCu}/${CULTURE.length}</b><span>文 ${t('culture')}</span></div></div>
   ${S.pro?`<div class="card row"><span class="chip" style="color:var(--gold2)">PRO</span><span>${t('proOn')}</span></div>`:`<button class="btn block" id="pp">✦ ${t('proTitle')}</button>`}
   <div class="card col"><div class="row"><h3 class="grow">${t('invite')}</h3><span class="brush" style="color:var(--gold);font-size:22px">朋友</span></div><div class="sub">${t('inviteD')}</div>
     <div class="row"><div class="grow num" style="font:800 20px Inter;letter-spacing:.12em">${S.refCode}</div><button class="btn sm ghost" id="cp">${t('copy')}</button></div></div>
   <h2>${t('achievements')}</h2><div class="ach">${ach.map(([h,n,on])=>`<div class="${on?'on':''}"><b>${h}</b>${n}</div>`).join('')}</div>
   ${accountCard()}
   ${notifCard()}
   <h2>${t('settings')}</h2>
   <div class="card col" style="gap:16px">
     <div><div class="sub">${t('lang')}</div><div class="seg" id="lg"><button data-v="ar" aria-pressed="${S.lang==='ar'}">العربية</button><button data-v="en" aria-pressed="${S.lang==='en'}">English</button></div></div>
     <div><div class="sub">${t('dailyGoal')}</div><div class="seg" id="gl">${[20,50,100,150].map(v=>`<button data-v="${v}" aria-pressed="${S.goal===v}"><span class="num">${v}</span> ${t('xp')}</button>`).join('')}</div></div>
     <div><div class="sub">${t('hanFont')}</div><div class="seg" id="hf">${Object.entries(HAN_FONTS).map(([k,[zh,f]])=>`<button data-v="${k}" aria-pressed="${(S.hanFont||'song')===k}" style="font-family:${f.replace(/"/g,"'")};font-size:20px">${zh} 汉字</button>`).join('')}</div></div>
     <div><div class="sub">🎶 ${t('musicVol')} <span style="opacity:.6">· ${MUS.cur?MUS.cur.name:''}</span></div><div class="seg" id="mvol">${[[0,'off'],[.35,'soft'],[.6,'normal'],[.9,'loud']].map(([v,k])=>`<button data-v="${v}" aria-pressed="${musVol()===v}">${t(k)}</button>`).join('')}</div></div>
     <div><div class="sub">${t('sound')}</div><div class="seg" id="snd"><button data-v="1" aria-pressed="${S.sound}">${t('on')}</button><button data-v="0" aria-pressed="${!S.sound}">${t('off')}</button></div></div>
     <button class="btn ghost block" id="revb">复 ${t('review')} · <span class="num">${dueIds().length}</span></button>
     <button class="btn ghost block" id="shopb">${coinHTML} ${t('shop')}</button>
     <button class="btn ghost block" id="rs">${t('restore')}</button><button class="btn ghost block" id="pv">${t('privacy')}</button>${RN&&window.__adPrivacy?`<button class="btn ghost block" id="adp">${t('adPrivacy')}</button>`:''}
     <button class="btn ghost block" id="rz" style="color:var(--bad)">${t('reset')}</button></div>
   <div class="fine">${t('credit')}</div>`);
  const pp=$('#pp',m); if(pp) pp.onclick=paywall;
  $('#cp',m).onclick=()=>{ const txt=(isAr()?'تعلّم الصينية معي في مسار هانزي! رمز الدعوة: ':'Learn Chinese with me on Hanzi Path! Invite code: ')+S.refCode;
    track('invite_share'); if(RN) RN.postMessage(JSON.stringify({type:'share',text:txt})); navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast(t('copied'))).catch(()=>toast(S.refCode)); };
  $$('#lg button',m).forEach(b=>b.onclick=()=>{S.lang=b.dataset.v;save();render();});
  $$('#gl button',m).forEach(b=>b.onclick=()=>{S.goal=+b.dataset.v;save();render();});
  bindAccount(m); bindNotif(m);
  $$('#hf button',m).forEach(b=>b.onclick=()=>{ S.hanFont=b.dataset.v; save(); SFX.tap(); render(); });
  $$('#mvol button',m).forEach(b=>b.onclick=()=>{ musSetVol(+b.dataset.v); render(); });
  $$('#snd button',m).forEach(b=>b.onclick=()=>{S.sound=b.dataset.v==='1';save();render();});
  $('#shopb',m).onclick=shop; $('#revb',m).onclick=()=>go('review');
  $('#rs',m).onclick=async()=>{ const r=await restorePurchases(); if(r&&r.active){S.pro=true;save();toast(t('proOn'));render();} else toast(t('restored')); };
  $('#pv',m).onclick=()=>openUrl(LEGAL.privacy); const ap=$('#adp',m); if(ap) ap.onclick=()=>native('ads:privacy',{});
  $('#rz',m).onclick=()=>sheet(`<h2>${t('resetQ')}</h2><button class="btn red block" id="y">${t('yes')}</button><button class="btn ghost block" id="n">${t('no')}</button>`,s=>{
    $('#y',s).onclick=()=>{ const keep={lang:S.lang,pro:S.pro,owned:S.owned,refCode:S.refCode}; try{localStorage.removeItem(KEY);}catch(e){} S=Object.assign({},DEFAULT,keep,{day:today()}); save(); closeSheet(); go('home'); };
    $('#n',s).onclick=closeSheet; });
};
/* ---------- shop ---------- */
const TILE_STYLES=[['classic','象牙',0],['jade','翡翠',400],['night','墨夜',800]];
function shop(){
  sheet(`<div class="row"><h2 class="grow">${t('shop')}</h2><span class="chip">${coinHTML} <span class="num" data-coins>${fmt(S.coins)}</span></span></div>
   ${S.pro?'':`<button class="paper row" id="pro" style="cursor:pointer;text-align:start"><span class="brush" style="font-size:34px;color:var(--red)">王</span><div class="grow"><b>${t('proTitle')}</b><div class="sub">${t('perk4')}</div></div><span class="btn sm red">PRO</span></button>`}
   <h3>${t('coinPacks')}</h3><div class="shopgrid">${[['c1',600],['c2',1500],['c3',3500]].map(([k,n],i)=>`<button class="shopitem" data-c="${k}" data-n="${n}"><span style="font-size:${22+i*6}px">${'🪙'.repeat(i+1)}</span><span class="big num">${fmt(n)}</span><span class="sub">${price(k)}</span></button>`).join('')}</div>
   <h3>${t('freeze')}</h3><div class="card row tight"><span style="font-size:28px">❄</span><div class="grow"><div>${t('freezeD')}</div><div class="sub">× <span class="num">${S.freezes}</span></div></div><button class="btn sm" id="fz">${coinHTML} <span class="num">120</span></button></div>
   <h3>${t('themes')}</h3><div class="shopgrid">${TILE_STYLES.map(([k,zh,c])=>{const own=S.owned['tiles_'+k],on=S.tileStyle===k;return `<button class="shopitem" data-t="${k}" data-cost="${c}"><span class="brush" style="font-size:28px;color:var(--gold2)">${zh}</span><span class="sub">${on?t('equipped'):own?t('equip'):`${coinHTML} <span class="num">${c}</span>`}</span></button>`;}).join('')}</div>
   <button class="btn ghost block" id="cl">${t('close')}</button>`,s=>{
    const p=$('#pro',s); if(p) p.onclick=()=>{closeSheet();paywall();};
    $$('[data-c]',s).forEach(b=>b.onclick=async()=>{ const r=await purchase('coins_'+b.dataset.c); if(r&&r.ok){ track('iap_coins',{pack:b.dataset.c}); S.coins+=+b.dataset.n; save(); SFX.coin(); confetti(40); updateTop(); toast('+'+fmt(+b.dataset.n)); } });
    $('#fz',s).onclick=()=>{ if(S.freezes>=3) return toast('❄ max 3'); if(spend(120)){ S.freezes++; save(); toast('❄ +1'); shop(); } };
    $$('[data-t]',s).forEach(b=>b.onclick=()=>{ const k=b.dataset.t,c=+b.dataset.cost; if(S.owned['tiles_'+k]){ S.tileStyle=k; save(); shop(); return; }
      if(S.coins<c) return toast(t('notEnough')); S.coins-=c; S.owned['tiles_'+k]=1; S.tileStyle=k; save(); SFX.coin(); shop(); });
    $$('[data-notify]',s).forEach(b=>b.onclick=()=>{ S.notify[b.dataset.notify]=1; save(); if(RN) RN.postMessage(JSON.stringify({type:'notify',topic:b.dataset.notify})); toast(t('notified')); b.textContent='✓'; });
    $('#cl',s).onclick=closeSheet; });
}
/* ---------- paywall ---------- */
function paywall(src='general'){ let plan='yearly'; track('paywall_view',{src});
  const plans=[['monthly',price('monthly'),t('perMonth')],['yearly',price('yearly'),t('perYear')],['lifetime',price('lifetime'),t('once')]];
  sheet(`<div style="text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center"><div class="seal" style="width:62px;height:62px;font-size:38px;border-radius:16px">汉</div><h1>${t('proTitle')}</h1><div class="sub">${t('proSub')}</div></div>
    <ul class="perks"><li><i>六</i>${t('perk1')}</li><li><i>写</i>${t('perk6')}</li><li><i>码</i>${t('perk7')}</li><li><i>戏</i>${t('perk2')}</li><li><i>静</i>${t('perk3')}</li><li><i>金</i>${t('perk4')}</li></ul>
    <div class="plans" style="margin-top:8px">${plans.map(([k,p,per])=>`<button class="plan" data-k="${k}" aria-pressed="${k===plan}">${k==='yearly'?`<span class="tag">${t('best')}</span>`:''}<b>${t(k)}</b><span class="price num">${p}</span><span class="per">${per}</span></button>`).join('')}</div>
    <div class="sub" style="text-align:center" id="tr"></div>
    <button class="btn block" id="buy"></button><button class="btn ghost block" id="rs">${t('restore')}</button><button class="btn ghost sm" id="lt" style="align-self:center;border:0">${t('later')}</button>
    <div class="fine">${t('legal')}</div><div class="fine" style="display:flex;gap:14px;justify-content:center"><a href="#" id="lterms">${t('termsL')}</a><a href="#" id="lpriv">${t('privacy')}</a></div>`,s=>{
    $('#lterms',s).onclick=e=>{ e.preventDefault(); openUrl(LEGAL.terms); }; $('#lpriv',s).onclick=e=>{ e.preventDefault(); openUrl(LEGAL.privacy); };
    const upd=()=>{ $('#tr',s).innerHTML=plan==='yearly'&&window.__trialOk===false?`<span class="num">${price('yearly')}</span> ${t('perYear')} (≈ <span class="num">${price('yearlyPm')}</span> ${t('perMonth')})`:plan==='yearly'?`${t('trial')} <span class="num">${price('yearly')}</span> ${t('perYear')} (≈ <span class="num">${price('yearlyPm')}</span> ${t('perMonth')})`:''; $('#buy',s).textContent=plan==='yearly'&&window.__trialOk!==false?t('startTrial'):t('buy'); };
    upd(); $$('.plan',s).forEach(b=>b.onclick=()=>{ plan=b.dataset.k; SFX.tap(); $$('.plan',s).forEach(x=>x.setAttribute('aria-pressed',x===b)); upd(); });
    $('#buy',s).onclick=async()=>{ const b=$('#buy',s); b.disabled=true; const r=await purchase('pro_'+plan); b.disabled=false;
      if(r&&!r.ok&&!r.cancelled) toast(t('buyFail')); if(r&&r.ok&&r.active){ track(plan==='yearly'?'trial_start':'purchase',{plan,src}); S.pro=true; save(); closeSheet(); SFX.gong(); confetti(140); toast(t('proOn')); render(); } };
    $('#rs',s).onclick=async()=>{ const r=await restorePurchases(); if(r&&r.active){S.pro=true;save();closeSheet();render();} else toast(t('restored')); };
    $('#lt',s).onclick=closeSheet; }); }
