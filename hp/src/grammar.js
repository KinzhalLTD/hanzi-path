/* ===== Grammar (语法): the HSK 1-6 grammar syllabus. Each point has a word-order pattern, Arabic and English
   explanations, examples with contextual pinyin, a usage tip and typical mistakes, plus practice:
   fill the grammar word, build the sentence, pick the meaning, spot the correct sentence.
   Data: content/gram_*.tsv → scripts/gram_build.py → out/grammar.json (parsed on first use).
   Progress: S.gram[key] = stars 1-3 (keys are stable ids). Free: all of HSK 1 and the first 3 points of each level. ===== */
const GRAM_LOAD=__GRAMMAR__;
let _GR=null;
const GR=()=>_GR||(_GR=GRAM_LOAD());
const grLv=l=>GR().filter(p=>p.l===l);
const grFree=p=>S.pro||p.l===1||grLv(p.l).indexOf(p)<3;
const grByKey=k=>GR().find(p=>p.k===k);
const grT=p=>isAr()?p.ar:p.en;
Object.assign(T.ar,{grTitle:'القواعد',grSub:'语法 · قواعد HSK من 1 إلى 6',grIntro:'كل قاعدة بنمطها وترتيب كلماتها وشرحها وأمثلة مسموعة وخطأ شائع، ثم تمارين قصيرة تثبّتها.',
  grPoints:'قاعدة',grDone:'أتقنتها',grSearch:'ابحث عن قاعدة أو كلمة…',grPattern:'النمط',grOrder:'ترتيب الكلمات في الصينية من اليسار إلى اليمين',grExamples:'أمثلة',grTip:'انتبه',
  grMistake:'خطأ شائع',grWrong:'خطأ',grRight:'صحيح',grPractise:'تدرّب على هذه القاعدة',grLevelPractise:'مراجعة قواعد المستوى',grNext:'القاعدة التالية',grPrev:'السابقة',
  grLegend:'رموز النمط',grQGap:'اختر الكلمة الناقصة',grQBuild:'رتّب الجملة',grQMean:'ما معنى الجملة؟',grQFix:'أي جملة صحيحة؟',grFinish:'أحسنت!',grScore:'إجابات صحيحة من أول مرة',
  grFree:'قواعد المستوى الأول كاملة وأول ثلاث قواعد من كل مستوى مجانًا؛ البقية مع PRO.',grCard:'القواعد',grCardSub:'كل قواعد HSK 1–6 بالعربية مع تمارين',grNone:'لا نتائج',
  grBackList:'كل القواعد',grLevelOf:'قواعد',perk9:'كل قواعد HSK 1–6 مع الشرح والتمارين'});
Object.assign(T.en,{grTitle:'Grammar',grSub:'语法 · HSK 1–6 grammar',grIntro:'Every point with its pattern and word order, a clear explanation, examples you can hear, a common mistake, then short practice to make it stick.',
  grPoints:'points',grDone:'mastered',grSearch:'Search a point or word…',grPattern:'Pattern',grOrder:'',grExamples:'Examples',grTip:'Watch out',
  grMistake:'Common mistake',grWrong:'Wrong',grRight:'Right',grPractise:'Practise this point',grLevelPractise:'Review this level’s grammar',grNext:'Next point',grPrev:'Previous',
  grLegend:'Pattern symbols',grQGap:'Choose the missing word',grQBuild:'Build the sentence',grQMean:'What does it mean?',grQFix:'Which sentence is correct?',grFinish:'Well done!',grScore:'right first time',
  grFree:'All of HSK 1 and the first three points of every level are free; the rest come with PRO.',grCard:'Grammar',grCardSub:'Every HSK 1–6 grammar point, with practice',grNone:'No results',
  grBackList:'All grammar',grLevelOf:'grammar',perk9:'Every HSK 1–6 grammar point with explanations and practice'});
/* slot names used in patterns (Latin words in the pattern string) */
const GR_SLOT={S:['الفاعل','subject'],V:['الفعل','verb'],O:['المفعول','object'],Adj:['الصفة','adjective'],N:['الاسم','noun'],Num:['العدد','number'],M:['المميِّز','measure word'],
  Time:['الزمن','time'],Place:['المكان','place'],Q:['أداة استفهام','question word'],Pron:['الضمير','pronoun'],Statement:['جملة خبرية','statement'],Clause:['جملة','clause'],
  Vehicle:['وسيلة النقل','vehicle'],Name:['الاسم','name'],Surname:['اسم العائلة','surname'],Country:['البلد','country'],VP:['عبارة فعلية','verb phrase'],Dur:['المدة','duration'],
  R:['النتيجة','result'],Dir:['الاتجاه','direction'],Freq:['عدد المرات','frequency'],Deg:['الدرجة','degree'],Person:['الشخص','person'],Topic:['الموضوع','topic'],A:['أ','A'],B:['ب','B'],
  C1:['الجملة الأولى','clause 1'],C2:['الجملة الثانية','clause 2'],Reason:['السبب','reason'],Result:['النتيجة','result'],Cond:['الشرط','condition'],Prep:['حرف جر','preposition'],
  Amount:['الكمية','amount'],Event:['الحدث','event'],X:['X','X'],Y:['Y','Y']};
function grPatternHTML(pt){ return `<div class="grpat" dir="ltr">${pt.split(/([A-Za-z][A-Za-z0-9]*)/).map(x=>{ if(!x) return '';
    const s=GR_SLOT[x]; if(s) return `<span class="grslot" title="${esc(isAr()?s[0]:s[1])}">${esc(isAr()?s[0]:s[1])}</span>`;
    if(/^[A-Za-z]/.test(x)) return `<span class="grslot">${esc(x)}</span>`;
    return x.split(/(\s+)/).map(y=>/^\s+$/.test(y)?' ':/[㐀-鿿]/.test(y)?`<span class="han grzh">${esc(y)}</span>`:`<span class="grop">${esc(y)}</span>`).join(''); }).join('')}</div>`; }
const grStars=n=>`<span class="tkstars" aria-label="${n}/3">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
function grDoneIn(l){ return grLv(l).filter(p=>(S.gram||{})[p.k]).length; }
function gramCard(){ const all=GR().length, done=Object.keys(S.gram||{}).filter(k=>grByKey(k)).length;
  return `<button class="ptile talk gram" id="tgr"><span class="tb">语</span><div class="grow" style="min-width:0"><b>${t('grCard')}</b><span class="sub">${t('grCardSub')}</span></div><span class="chip"><span class="num">${done}/${all}</span></span></button>`; }
/* highlight the grammar words inside rendered example tokens */
function grMark(root,p){ if(!p.mk.length) return; $$('.tok .han',root).forEach(h=>{ const s=h.textContent; if(p.mk.some(m=>s===m||(m.length===1&&s.includes(m))||(m.length>1&&s.includes(m)))) h.closest('.tok').classList.add('grmk'); }); }

SCREENS.grammar=(m,arg)=>{ let L=(arg&&arg.l)||S._grL||1, q=''; const all=GR().length, done=Object.keys(S.gram||{}).filter(k=>grByKey(k)).length;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero grhero"><span class="eyebrow">${t('grSub')}</span><h1>${t('grTitle')}</h1><p style="margin:0;max-width:52ch">${t('grIntro')}</p>
      <div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap"><span class="chip"><span class="num">${all}</span> ${t('grPoints')}</span><span class="chip">✓ <span class="num">${done}</span> ${t('grDone')}</span></div></div>
    <div class="seg grseg" id="gseg">${[1,2,3,4,5,6].map(l=>`<button data-l="${l}" aria-pressed="${l===L}">HSK ${l}<small class="num">${grDoneIn(l)}/${grLv(l).length}</small></button>`).join('')}</div>
    <label class="grsearch"><span aria-hidden="true">🔍</span><input id="gq" type="search" placeholder="${t('grSearch')}" autocomplete="off" enterkeyhint="search"></label>
    <div id="glist" class="col" style="gap:10px"></div>
    <button class="btn block" id="glv">🎯 ${t('grLevelPractise')} · HSK <span id="glvn" class="num">${L}</span></button>
    ${S.pro?'':`<div class="sub" style="text-align:center">${t('grFree')}</div>`}`);
  const card=(p,i)=>{ const st=(S.gram||{})[p.k]||0, free=grFree(p);
    return `<li><button class="card grpt" data-k="${p.k}"><span class="grnum num">${p.l}.${i+1}</span><div class="grow" style="min-width:0;text-align:start">
      <h3>${esc(grT(p))}</h3>${grPatternHTML(p.pt)}</div><div class="col" style="align-items:flex-end;gap:6px">${free?grStars(st):'<span class="chip">🔒 PRO</span>'}</div></button></li>`; };
  const draw=()=>{ S._grL=L; $('#glvn',m).textContent=L; const ql=q.trim().toLowerCase();
    const list=ql?GR().filter(p=>[p.ar,p.en,p.pt,p.xa,p.xe,...p.mk,...p.ex.map(e=>e[0])].join(' ').toLowerCase().includes(ql)):grLv(L);
    $('#glist',m).innerHTML=list.length?`<ul class="grlist">${list.map(p=>card(p,grLv(p.l).indexOf(p))).join('')}</ul>`:`<div class="sub" style="text-align:center;padding:24px">${t('grNone')}</div>`;
    $$('.grpt',m).forEach(b=>b.onclick=()=>{ const p=grByKey(b.dataset.k); SFX.tap(); if(!grFree(p)) return paywall('grammar'); go('gpoint',{k:p.k}); }); };
  $$('#gseg button',m).forEach(b=>b.onclick=()=>{ L=+b.dataset.l; q=''; $('#gq',m).value=''; SFX.tap(); $$('#gseg button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); draw(); });
  $('#gq',m).oninput=e=>{ q=e.target.value; draw(); };
  $('#glv',m).onclick=()=>{ SFX.tap(); if(!grLv(L).some(grFree)) return paywall('grammar'); go('gpractice',{l:L}); };
  draw(); requestAnimationFrame(()=>hCenter($('#gseg',m),$('#gseg [aria-pressed="true"]',m))); };

SCREENS.gpoint=(m,arg)=>{ const p=grByKey(arg&&arg.k); if(!p) return go('grammar'); if(!grFree(p)) { go('grammar',{l:p.l}); return paywall('grammar'); }
  const lv=grLv(p.l), i=lv.indexOf(p), prev=lv[i-1], next=lv[i+1], st=(S.gram||{})[p.k]||0;
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk" aria-label="${t('grBackList')}">${isAr()?'›':'‹'}</button><div class="grow"><div class="eyebrow">HSK ${p.l} · ${t('grTitle')} <span class="num">${p.l}.${i+1}</span></div><h2 style="margin:2px 0 0">${esc(grT(p))}</h2></div>${st?grStars(st):''}</div>
    <div class="card grbox"><div class="eyebrow">${t('grPattern')}</div>${grPatternHTML(p.pt)}${t('grOrder')?`<div class="sub" style="font-size:12.5px">← ${t('grOrder')}</div>`:''}</div>
    <div class="card grexp"><p style="margin:0;line-height:1.75;font-size:16.5px">${esc(isAr()?p.xa:p.xe)}</p></div>
    <h3 style="margin:6px 0 0">${t('grExamples')}</h3>
    <div class="col" style="gap:10px">${p.ex.map((e,j)=>`<div class="paper grex"><div class="row" style="gap:10px;align-items:flex-start"><div class="grow" style="min-width:0">${analyseHTML2(e[0],e[1])}
      <div class="sub" style="color:var(--ink2);margin-top:4px" dir="ltr">${esc(e[1])}</div><div style="margin-top:2px" dir="auto">${esc(isAr()?e[2]:e[3])}</div></div><button class="speak sm" data-j="${j}" aria-label="🔊">🔊</button></div></div>`).join('')}</div>
    ${p.tip?`<div class="card grtip"><b>💡 ${t('grTip')}</b><div style="margin-top:4px;line-height:1.7" dir="auto">${esc(isAr()?p.tip[0]:p.tip[1])}</div></div>`:''}
    ${p.err.length?`<div class="card grerr"><b>⚠️ ${t('grMistake')}</b>${p.err.map(([w,r])=>`<div class="grpair" dir="ltr"><span class="grx">✗</span><span class="han">${esc(w)}</span></div><div class="grpair" dir="ltr"><span class="grok">✓</span><span class="han">${esc(r)}</span><button class="speak sm grsp" data-z="${esc(r)}" aria-label="🔊">🔊</button></div>`).join('')}</div>`:''}
    <button class="btn block" id="gpr">🎯 ${t('grPractise')}</button>
    <div class="row" style="gap:10px">${prev?`<button class="btn ghost grow" id="gpv">${isAr()?'→':'←'} ${t('grPrev')}</button>`:'<span class="grow"></span>'}${next?`<button class="btn ghost grow" id="gnx">${t('grNext')} ${isAr()?'←':'→'}</button>`:''}</div>`);
  bindTokens(m); grMark(m,p);
  $$('.grex .speak',m).forEach(b=>b.onclick=()=>speak(p.ex[+b.dataset.j][0])); $$('.grsp',m).forEach(b=>b.onclick=()=>speak(b.dataset.z));
  $('#bk',m).onclick=()=>go('grammar',{l:p.l}); $('#gpr',m).onclick=()=>{ SFX.tap(); go('gpractice',{k:p.k}); };
  const nav=(x)=>{ SFX.tap(); if(!grFree(x)) return paywall('grammar'); go('gpoint',{k:x.k}); };
  if(prev) $('#gpv',m).onclick=()=>nav(prev); if(next) $('#gnx',m).onclick=()=>nav(next); };

/* ---------- practice ---------- */
const grHan=s=>[...s].filter(c=>/[㐀-鿿〇]/.test(c)).join('');
function grQuestions(p,pool){ const qs=[], lvMk=[...new Set(pool.flatMap(x=>x.mk))];
  p.ex.forEach((e,j)=>{ const mk=[...p.mk].sort((a,b)=>b.length-a.length).find(x=>e[0].includes(x));
    const toks=segment(e[0]).map(x=>x.t).filter(x=>grHan(x)); const want=j%2===0?'gap':'build';
    const gapQ=()=>{ if(!mk) return null; const ds=shuffle(lvMk.filter(x=>x!==mk&&!x.includes(mk)&&!mk.includes(x)&&!e[0].includes(x))).slice(0,3); if(ds.length<2) return null;
      return {k:'gap',p,e,mk,opts:shuffle([mk,...ds])}; };
    const buildQ=()=>toks.length>=3&&toks.length<=8&&new Set(toks).size===toks.length?{k:'build',p,e,toks}:null;
    qs.push((want==='gap'?gapQ()||buildQ():buildQ()||gapQ())||{k:'mean',p,e,opts:null}); });
  p.err.forEach(([w,r])=>qs.push({k:'fix',p,w,r,opts:shuffle([w,r])}));
  if(!qs.some(q=>q.k==='mean')) qs.push({k:'mean',p,e:p.ex[0],opts:null});
  qs.forEach(q=>{ if(q.k==='mean'&&!q.opts){ const right=isAr()?q.e[2]:q.e[3]; const others=shuffle(pool.filter(x=>x!==q.p).flatMap(x=>x.ex)).map(x=>isAr()?x[2]:x[3]).filter(x=>x!==right); q.right=right; q.opts=shuffle([right,...[...new Set(others)].slice(0,3)]); } });
  return qs; }
SCREENS.gpractice=(m,arg)=>{ const one=arg&&arg.k?grByKey(arg.k):null; const L=one?one.l:arg.l; const pool=grLv(L), free=pool.filter(grFree);
  if(one&&!grFree(one)) return go('grammar',{l:L});
  let qs=one?shuffle(grQuestions(one,pool)):shuffle(free).slice(0,10).map(p=>shuffle(grQuestions(p,pool))[0]);
  if(!one) qs=shuffle(qs);
  const back=()=>one?go('gpoint',{k:one.k}):go('grammar',{l:L});
  let i=0, first=0; const orig=qs.length, missed=new Set();
  const head=()=>`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i style="width:${(Math.min(i,orig)/orig*100).toFixed(1)}%"></i></div><span class="chip">HSK ${L}</span></div>`;
  const reveal=e=>`<div class="paper excard col" style="gap:4px;padding:14px">${analyseHTML2(e[0],e[1])}<div class="sub" style="color:var(--ink2)" dir="ltr">${esc(e[1])}</div><div dir="auto">${esc(isAr()?e[2]:e[3])}</div></div>`;
  const verdict=(ok,q,extra)=>{ if(ok){ if(!missed.has(q)) first++; SFX.ok(); haptic('success'); } else { missed.add(q); SFX.bad(); haptic('error'); qs.push(q); }
    const f=document.createElement('div'); f.className='feedback rise '+(ok?'good':'bad');
    f.innerHTML=`<div>${extra||''}<div class="row" style="gap:12px;align-items:center"><div class="bao-hop">${bao(ok?'happy':'oops',58)}</div><div class="grow"><h3 style="color:${ok?'#7be3b0':'#ff9a8f'}">${ok?t('correct'):t('wrong')}</h3><div class="bubble">${esc(quip(ok?'ok':'bad'))}</div></div></div>
      ${ok?'':`<div class="sub" style="color:var(--ivory);margin-top:6px"><b>${esc(grT(q.p))}</b> · ${esc((isAr()?q.p.xa:q.p.xe).split(/(?<=[.。!?؟])\s/)[0])}</div>`}<button class="btn block ${ok?'jade':'red'}" id="nx">${t('next')}</button></div>`;
    document.body.appendChild(f); const ck=$('#ck',m); if(ck) ck.hidden=true; $('#nx',f).onclick=()=>{ f.remove(); i++; i<qs.length?ask():finish(); }; };
  const choose=(q,label,body,opts,isRight,after)=>{ m.innerHTML=`${head()}<div class="prompt rise" style="padding-top:10px"><div class="sub">${label}</div>${body}</div>
      <div class="opts one">${opts.map((o,j)=>`<button class="opt" data-j="${j}" ${q.k==='mean'?'dir="auto"':'dir="ltr" lang="zh"'} style="${q.k==='mean'?'font-size:15.5px':'font-size:22px'};min-height:56px">${q.k==='mean'?esc(o):`<span class="han" style="font-size:${q.k==='gap'?26:22}px">${esc(o)}</span>`}</button>`).join('')}</div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    $('#qx',m).onclick=()=>{ $$('.feedback').forEach(f=>f.remove()); back(); }; let sel=null; if(after) after();
    $$('.opt',m).forEach(b=>b.onclick=()=>{ SFX.tap(); $$('.opt',m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel=+b.dataset.j; $('#ck',m).disabled=false; if(q.k==='gap'){ const bl=$('#bl',m); bl.textContent=opts[sel]; bl.classList.add('on'); } });
    $('#ck',m).onclick=()=>{ if(sel===null) return; const ok=isRight(opts[sel]); const rj=opts.findIndex(isRight);
      $$('.opt',m).forEach((b,j)=>{ b.disabled=true; if(j===rj) b.classList.add('right'); else if(j===sel) b.classList.add('wrong'); });
      if(q.k==='gap'){ const bl=$('#bl',m); bl.textContent=q.mk; bl.classList.add(ok?'right':'fix'); }
      if(q.e) speak(q.e[0]); else speak(q.r); verdict(ok,q,q.e?reveal(q.e):''); }; };
  const ask=()=>{ const q=qs[i]; window.__grq=q;   // read by scripts/test_grammar.py
    if(q.k==='gap'){ const at=q.e[0].indexOf(q.mk), a=q.e[0].slice(0,at), b=q.e[0].slice(at+q.mk.length);
      return choose(q,'✏️ '+t('grQGap'),`<div class="gapline han" dir="ltr" lang="zh">${esc(a)}<span class="blank" id="bl">${'＿'.repeat([...q.mk].length)}</span>${esc(b)}</div><div class="meaning" style="font-size:16px" dir="auto">${esc(isAr()?q.e[2]:q.e[3])}</div>`,
        q.opts,o=>o===q.mk); }
    if(q.k==='mean') return choose(q,'💬 '+t('grQMean'),`<div class="paper" style="padding:14px">${analyseHTML2(q.e[0],q.e[1])}</div><button class="speak sm" id="sp" aria-label="🔊">🔊</button>`,q.opts,o=>o===q.right,()=>{ bindTokens(m); $('#sp',m).onclick=()=>speak(q.e[0]); setTimeout(()=>speak(q.e[0]),250); });
    if(q.k==='fix') return choose(q,'🔎 '+t('grQFix'),`<div class="meaning" style="font-size:15px">${esc(grT(q.p))}</div>`,q.opts,o=>o===q.r);
    // build
    const tiles=shuffle(q.toks.map((h,j)=>({h,j}))); let ans=[];
    m.innerHTML=`${head()}<div class="prompt rise" style="padding-top:8px"><div class="sub">🧩 ${t('grQBuild')}</div><div class="meaning" style="font-size:17px" dir="auto">${esc(isAr()?q.e[2]:q.e[3])}</div></div>
      <div class="bline" id="bline" dir="ltr" lang="zh" aria-live="polite"></div><div class="bbank" id="bbank" dir="ltr" lang="zh"></div>
      <div class="row" style="justify-content:center"><button class="btn ghost sm" id="bclr">↺ ${t('clearAll')}</button></div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    $('#qx',m).onclick=()=>{ $$('.feedback').forEach(f=>f.remove()); back(); };
    const draw=()=>{ $('#bline',m).innerHTML=ans.map((x,k)=>`<button class="btile on" data-k="${k}"><span class="han">${esc(x.h)}</span></button>`).join('')||`<span class="sub">${t('grQBuild')}</span>`;
      $('#bbank',m).innerHTML=tiles.map(x=>`<button class="btile" data-j="${x.j}" ${ans.includes(x)?'disabled aria-hidden="true"':''}><span class="han">${esc(x.h)}</span></button>`).join('');
      $('#ck',m).disabled=ans.length!==tiles.length;
      $$('#bbank .btile',m).forEach(b=>b.onclick=()=>{ const x=tiles.find(y=>y.j===+b.dataset.j); if(ans.includes(x)) return; ans.push(x); SFX.tap(); draw(); });
      $$('#bline .btile',m).forEach(b=>b.onclick=()=>{ ans.splice(+b.dataset.k,1); SFX.tap(); draw(); }); };
    draw(); $('#bclr',m).onclick=()=>{ ans=[]; draw(); };
    $('#ck',m).onclick=()=>{ const ok=ans.map(x=>x.h).join('')===q.toks.join(''); $$('.btile',m).forEach(b=>b.disabled=true); $('#bline',m).classList.add(ok?'right':'wrong'); speak(q.e[0]); verdict(ok,q,reveal(q.e)); }; };
  const finish=()=>{ const r=first/orig, stars=r>=.9?3:r>=.6?2:1; S.gram=S.gram||{}; let xp=0,c=0;
    if(one){ const was=S.gram[one.k]||0; if(stars>was) S.gram[one.k]=stars; if(!was){ xp=addXP(15)||15; c=addCoins(15); } }
    else { xp=addXP(20)||20; c=addCoins(20); }
    save(); track('grammar_practice',{k:one?one.k:'level'+L,stars}); SFX.win(); if(stars===3) confetti(90);
    m.innerHTML=`<div class="col" style="gap:16px;align-items:center;text-align:center;padding-top:24px"><div class="bao-hop">${bao(stars===3?'wow':'happy',96)}</div><h2>${t('grFinish')}</h2>${grStars(stars)}
      <div class="sub"><span class="num">${first}/${orig}</span> ${t('grScore')}</div>${xp||c?`<div class="row" style="gap:8px;justify-content:center"><span class="chip">+${xp} XP</span><span class="chip">🪙 +${c}</span></div>`:''}
      ${one?`<div class="card" style="width:100%;text-align:start"><div class="eyebrow">${t('grPattern')}</div>${grPatternHTML(one.pt)}<div style="margin-top:6px">${esc(grT(one))}</div></div>`:''}
      <button class="btn block" id="gnx2">${one&&grLv(L)[grLv(L).indexOf(one)+1]?t('grNext')+' '+(isAr()?'←':'→'):t('grBackList')}</button><button class="btn ghost block" id="gag">↺ ${t('tkAgain')}</button></div>`;
    $('#gag',m).onclick=()=>go('gpractice',arg);
    $('#gnx2',m).onclick=()=>{ const nx=one&&grLv(L)[grLv(L).indexOf(one)+1]; if(nx&&grFree(nx)) go('gpoint',{k:nx.k}); else if(nx) { go('grammar',{l:L}); paywall('grammar'); } else go('grammar',{l:L}); }; };
  if(!qs.length) return back(); ask(); };
