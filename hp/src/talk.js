/* ===== Workplace conversations (职场对话): role-play scenes in engineering, business development, medicine and
   software. Each turn: the partner speaks, the learner picks the best reply (weaker/wrong replies explain why),
   hears it and can say it. Ends with stars, rewards and a phrasebook. Data: content/talk_*.tsv → out/talk.json. ===== */
const TALK=__TALK__;
const TALK_ORDER=['eng','mep','cons','infra','biz','med','soft']; TALK.sort((a,b)=>TALK_ORDER.indexOf(a.k)-TALK_ORDER.indexOf(b.k));
Object.assign(T.ar,{tkTitle:'محادثات العمل',tkSub:'职场对话 · تدرّب على مواقف حقيقية',tkIntro:'تقمّص دورًا في موقف عمل حقيقي: استمع، اختر الرد الأنسب، وانطقه. كل خيار خاطئ يشرح لك السبب.',
  tkScenes:'مواقف',tkYou:'أنت',tkWith:'محاورك',tkStart:'ابدأ المحادثة',tkTurns:'تبادلات',tkPy:'بينيين',tkTr:'ترجمة',tkHint:'أظهر المعاني',tkPick:'اختر ردّك',
  tkBest:'أفضل رد!',tkOk:'مقبول، لكن…',tkNo:'غير مناسب',tkTry:'جرّب ردًا آخر',tkSay:'انطقها',tkNext:'متابعة',tkDone:'أكملت المحادثة!',tkFirst:'أفضل رد من أول مرة',
  tkBook:'عبارات هذا الموقف',tkReplay:'استمع للحوار كاملًا',tkAgain:'أعد المحاولة',tkNextScene:'الموقف التالي',tkFree:'الموقف الأول في كل مجال مجاني؛ البقية مع PRO.',tkTyping:'يكتب…',
  tkCard:'محادثات العمل',tkCardSub:'هندسة · MEP · بناء · بنية تحتية · أعمال · طب · برمجة',tkTerms:'المصطلحات المهنية في هذا الموقف',tkPractise:'تدرّب على هذه المصطلحات',tkVocab:'مفردات المجال',tkStop:'إيقاف',perk8:'محادثات العمل في 4 مجالات مهنية',nTalkT:'جديد: محادثات العمل 💬',nTalkB:'مواقف حقيقية في الهندسة وMEP والبناء والبنية التحتية وتطوير الأعمال والطب والبرمجة.'});
Object.assign(T.en,{tkTitle:'Workplace conversations',tkSub:'职场对话 · practise real situations',tkIntro:'Play a role in a real work situation: listen, choose the best reply and say it. Every weaker answer tells you why.',
  tkScenes:'scenes',tkYou:'You',tkWith:'Talking with',tkStart:'Start the conversation',tkTurns:'exchanges',tkPy:'Pinyin',tkTr:'Translation',tkHint:'Show meanings',tkPick:'Choose your reply',
  tkBest:'Best reply!',tkOk:'Acceptable, but…',tkNo:'Not appropriate',tkTry:'Try another reply',tkSay:'Say it',tkNext:'Continue',tkDone:'Conversation complete!',tkFirst:'Best reply first time',
  tkBook:'Phrases from this scene',tkReplay:'Listen to the whole dialogue',tkAgain:'Try again',tkNextScene:'Next scene',tkFree:'The first scene in every field is free; the rest come with PRO.',tkTyping:'typing…',
  tkCard:'Workplace conversations',tkCardSub:'Engineering · MEP · construction · infrastructure · business · medical · software',tkTerms:'Professional terms in this scene',tkPractise:'Practise these terms',tkVocab:'Field vocabulary',tkStop:'Stop',perk8:'Workplace conversations in 4 professional fields',nTalkT:'New: workplace conversations 💬',nTalkB:'Real situations in engineering, MEP, construction, infrastructure, business development, medicine and software.'});

const tkFree=(d,i)=>S.pro||i===0;
const tkKey=(d,s)=>d.k+'/'+s.k;
const tkL=(o,ar,en)=>isAr()?o[ar]:o[en];
const tkStars=n=>`<span class="tkstars" aria-label="${n}/3">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
const TK_AV={mep:['🧑‍💻','🧑‍🔧','🧑‍🚒','👨‍🔧','👨‍💼'],cons:['👷','👩‍💼','🏗','👨‍💼','👷‍♂️'],infra:['👨‍🔧','👷','👷‍♂️','🧑‍🔬','👮'],eng:['👷','👨‍🔧','🧑‍🏭','👨‍💼','👷‍♂️'],biz:['👩‍💼','👨‍💼','👩‍💼','👨‍💼','🧑‍💼','🧑‍💼'],med:['👩‍⚕️','🧑‍⚕️','🧔','👩‍⚕️','👵'],soft:['🧑‍💻','👨‍💻','🧑‍🔧','👩‍💻','👨‍💼']};
const tkAv=(d,i)=>(TK_AV[d.k]||[])[i]||d.emo;
const TK_COL={mep:'#2f6f8a',cons:'#c0782a',infra:'#2e7d6e',eng:'#b0602a',biz:'#2f6f8a',med:'#2e8a6a',soft:'#5a4aa0'};

/* professional terms that appear in a scene: sector terms (2+ characters) found in its lines, in order of appearance */
const _tkTermCache={};
function tkTerms(d,s){ const key=tkKey(d,s); if(_tkTermCache[key]) return _tkTermCache[key];
  const txt=s.turns.map(tn=>tn.p[0]+tn.o.map(o=>o.zh).join('')).join('|'); const home=SECTORS.find(x=>x.k===d.sec), seen=new Set(), out=[];
  const pools=[home,...SECTORS.filter(x=>x!==home&&['eng','mep','cons','infra','it','biz','med','tech'].includes(x.k))].filter(Boolean);
  // a term counts when the segmenter reads it as a word (so 关系 inside 没关系 does not), or when it is a long compound found verbatim
  const toks=new Set(txt.split('|').flatMap(l=>segment(l).map(x=>x.t)));
  pools.forEach(sec=>sec._w.forEach(w=>{ const n=[...w.h].length; if(n<2||seen.has(w.h)) return; const at=txt.indexOf(w.h); if(at<0||!(toks.has(w.h)||n>=4)) return; seen.add(w.h); out.push({w,sec,at}); }));
  // drop a term when a longer matched term contains it at the same places (风管 inside 风管底标高 stays only if it also appears alone)
  const res=out.filter(x=>!out.some(y=>y!==x&&y.w.h.length>x.w.h.length&&y.w.h.includes(x.w.h)&&txt.split(x.w.h).length===txt.split(y.w.h).length)).sort((a,b)=>a.at-b.at).slice(0,30);
  return _tkTermCache[key]=res; }
const tkTermsHTML=list=>list.length?`<div class="tkterms">${list.map(({w,sec})=>{ const mt=secM(sec,w); return `<button class="tok tkterm" data-w="${w.id}"><span class="han">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="tkm">${esc(isAr()?mt.ar:mt.en)}</span></button>`; }).join('')}</div>`:'';
function talkCard(){ const done=Object.keys(S.talk||{}).length, all=TALK.reduce((a,d)=>a+d.scenes.length,0);
  return `<button class="ptile talk" id="tk2"><span class="tb">谈</span><div class="grow" style="min-width:0"><b>${t('tkCard')}</b><span class="sub">${t('tkCardSub')}</span></div><span class="chip"><span class="num">${done}/${all}</span></span></button>`; }

SCREENS.talk=(m,arg)=>{ const di=Math.max(0,TALK.findIndex(d=>d.k===((arg&&arg.d)||S._tkD||TALK[0].k))); let cur=di;
  const all=TALK.reduce((a,d)=>a+d.scenes.length,0), stars=Object.values(S.talk||{}).reduce((a,b)=>a+b,0);
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero tkhero"><span class="eyebrow">${t('tkSub')}</span><h1>${t('tkTitle')}</h1><p style="margin:0;max-width:52ch">${t('tkIntro')}</p>
      <div class="row" style="gap:8px;margin-top:6px"><span class="chip"><span class="num">${Object.keys(S.talk||{}).length}/${all}</span> ${t('tkScenes')}</span><span class="chip">★ <span class="num">${stars}</span></span></div></div>
    <div class="seg tkseg" id="tseg">${TALK.map((d,i)=>`<button data-i="${i}" aria-pressed="${i===cur}">${d.emo} ${esc(tkL(d,'ar','en'))}</button>`).join('')}</div>
    <div id="tlist" class="col" style="gap:12px"></div>${S.pro?'':`<div class="sub" style="text-align:center">${t('tkFree')}</div>`}`);
  const draw=()=>{ const d=TALK[cur]; S._tkD=d.k;
    $('#tlist',m).innerHTML=d.scenes.map((s,i)=>{ const st=(S.talk||{})[tkKey(d,s)]||0, free=tkFree(d,i);
      return `<button class="card tkscene" data-i="${i}" style="--tc:${TK_COL[d.k]}"><span class="tkav">${tkAv(d,i)}</span><div class="grow" style="min-width:0;text-align:start">
        <div class="eyebrow">${esc(s.zh)} · HSK ${s.hsk}</div><h3>${esc(tkL(s,'ar','en'))}</h3><div class="sub">${t('tkWith')}: ${esc(s.pz)} · ${esc(tkL(s,'pa','pe'))}</div></div>
        <div class="col" style="align-items:flex-end;gap:6px">${free?tkStars(st):'<span class="chip">🔒 PRO</span>'}</div></button>`; }).join('')
      +(SECTORS.find(x=>x.k===d.sec)?`<button class="btn ghost block" id="tvoc">📚 ${t('tkVocab')} · ${esc(isAr()?SECTORS.find(x=>x.k===d.sec).ar:SECTORS.find(x=>x.k===d.sec).en)}</button>`:'');
    $$('.tkscene',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; SFX.tap(); if(!tkFree(TALK[cur],i)) return paywall('talk'); go('talkscene',{d:TALK[cur].k,i}); });
    const v=$('#tvoc',m); if(v) v.onclick=()=>go('sector',SECTORS.findIndex(x=>x.k===d.sec)); };
  $$('#tseg button',m).forEach(b=>b.onclick=()=>{ cur=+b.dataset.i; SFX.tap(); $$('#tseg button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); draw(); });
  draw(); };

SCREENS.talkscene=(m,arg)=>{ const d=TALK.find(x=>x.k===arg.d), si=arg.i, s=d.scenes[si]; if(!s) return go('talk');
  if(!tkFree(d,si)) return paywall('talk');
  const col=TK_COL[d.k], av=tkAv(d,si); S.tkPy=S.tkPy??1; S.tkTr=S.tkTr??0;
  const line=(who,zh,py,tr,extra='')=>`<div class="tkmsg ${who}" dir="ltr"><span class="tkface">${who==='them'?av:'🙂'}</span><div class="tkbub"><div class="tkzh">${analyseHTML2(zh,py)}</div><div class="tktr" dir="auto">${esc(tr)}</div>${extra}<button class="tkplay" aria-label="🔊" data-zh="${esc(zh)}">🔊</button></div></div>`;
  const toggles=()=>`<button class="chip tktg" id="tpy" aria-pressed="${!!S.tkPy}">拼 ${t('tkPy')}</button><button class="chip tktg" id="ttr" aria-pressed="${!!S.tkTr}">译 ${t('tkTr')}</button>`;
  const applyTg=()=>{ m.classList.toggle('tk-nopy',!S.tkPy); m.classList.toggle('tk-tr',!!S.tkTr); };
  const bindTg=()=>{ const a=$('#tpy',m), b=$('#ttr',m); if(a) a.onclick=()=>{ S.tkPy=S.tkPy?0:1; save(); a.setAttribute('aria-pressed',!!S.tkPy); applyTg(); }; if(b) b.onclick=()=>{ S.tkTr=S.tkTr?0:1; save(); b.setAttribute('aria-pressed',!!S.tkTr); applyTg(); }; };
  let timer=null; const prevC=cleanup; cleanup=()=>{ clearTimeout(timer); try{speechSynthesis.cancel();}catch(e){} prevC&&prevC(); };

  function intro(){ m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="grow"></div>${toggles()}</div>
    <div class="tkintro rise" style="--tc:${col}"><div class="tkbanner"><span class="tkbig">${av}</span><span class="brush" style="--n:${[...s.zh].length}">${esc(s.zh)}</span></div>
      <div class="col" style="gap:8px;padding:16px"><div class="eyebrow">${d.emo} ${esc(tkL(d,'ar','en'))} · HSK ${s.hsk}</div><h1 style="margin:0">${esc(tkL(s,'ar','en'))}</h1>
      <p style="margin:0">${esc(tkL(s,'sa','se'))}</p>
      <div class="tkroles"><div><span class="sub">${t('tkYou')}</span><b>${esc(tkL(s,'ma','me'))}</b></div><div><span class="sub">${t('tkWith')}</span><b>${av} ${esc(s.pz)} · ${esc(tkL(s,'pa','pe'))}</b></div></div>
      <div class="sub"><span class="num">${s.turns.length}</span> ${t('tkTurns')} ${(S.talk||{})[tkKey(d,s)]?'· '+tkStars(S.talk[tkKey(d,s)]):''}</div></div></div>
    ${tkTerms(d,s).length?`<div class="card col" style="gap:8px"><b>📘 ${t('tkTerms')} · <span class="num">${tkTerms(d,s).length}</span></b>${tkTermsHTML(tkTerms(d,s))}</div>`:''}
    <div class="grow"></div><button class="btn block" id="go">${t('tkStart')} →</button>`;
    $('#qx',m).onclick=()=>go('talk',{d:d.k}); bindTg(); applyTg(); bindTokens(m); $('#go',m).onclick=()=>{ SFX.tap(); track('talk_start',{scene:tkKey(d,s)}); chat(); }; }

  let ti=0, score=0, firstBest=0, hints=0;
  function chat(){ m.classList.add('tkchat'); window.scrollTo(0,0); m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i id="tbar" style="width:0%"></i></div>${toggles()}</div>
      <div class="tklog" id="tlog"></div><div class="tkpanel" id="tpanel"></div>`;
    $('#qx',m).onclick=()=>go('talk',{d:d.k}); bindTg(); applyTg(); partner(); }
  const log=()=>$('#tlog',m), panel=()=>$('#tpanel',m);
  // scroll inside the chat panes only (never the page): newest line at the bottom of the log, latest feedback visible in the panel
  const paneEnd=el=>{ if(!el) return; try{ el.scrollTo({top:el.scrollHeight,behavior:'smooth'}); }catch(e){ el.scrollTop=el.scrollHeight; } };
  const scrollEnd=()=>requestAnimationFrame(()=>{ paneEnd(log()); paneEnd(panel()); });
  const bindLine=el=>{ bindTokens(el); $$('.tkplay',el).forEach(b=>b.onclick=e=>{ e.stopPropagation(); speak(b.dataset.zh); }); };
  function partner(){ const tn=s.turns[ti]; $('#tbar',m).style.width=(ti/s.turns.length*100)+'%';
    log().insertAdjacentHTML('beforeend',`<div class="tkmsg them typing" dir="ltr"><span class="tkface">${av}</span><div class="tkbub"><span class="tkdots"><i></i><i></i><i></i></span></div></div>`); scrollEnd();
    panel().innerHTML=''; timer=setTimeout(()=>{ log().lastElementChild.remove();
      log().insertAdjacentHTML('beforeend',line('them',tn.p[0],tn.p[1],isAr()?tn.p[2]:tn.p[3])); bindLine(log().lastElementChild); speak(tn.p[0]); scrollEnd(); choices(); },650+Math.random()*350); }
  function choices(){ const tn=s.turns[ti], opts=shuffle(tn.o); let tries=[], hinted=false, done=false;
    panel().innerHTML=`<div class="row" style="gap:8px"><b class="grow">${t('tkPick')}</b><button class="btn ghost sm" id="thint">💡 ${t('tkHint')}</button></div>
      <div class="col tkopts" style="gap:8px">${opts.map((o,j)=>`<button class="tkopt" data-j="${j}" dir="ltr"><span class="han">${esc(o.zh)}</span><span class="py">${esc(o.py)}</span><span class="tktr2" dir="auto">${esc(isAr()?o.ar:o.en)}</span></button>`).join('')}</div><div id="tfb"></div>`;
    requestAnimationFrame(()=>{ paneEnd(log()); const pn=panel(); if(pn) pn.scrollTop=0; }); $('#thint',m).onclick=()=>{ hinted=true; panel().classList.add('hinted'); $('#thint',m).disabled=true; SFX.tap(); };
    $$('.tkopt',m).forEach(b=>b.onclick=()=>{ if(done||b.disabled) return; const o=opts[+b.dataset.j]; tries.push(o.t); b.disabled=true;
      if(o.t==='A'){ done=true; const pts=tries.length===1?(hinted?2:3):tries[0]==='B'?1:0; score+=pts; if(tries.length===1) firstBest++; if(hinted) hints++;
        b.classList.add('right'); SFX.ok(); haptic('success'); if(pts===3) floatText('+3',b);
        $$('.tkopt',m).forEach(x=>{ if(x!==b) x.classList.add('dim'); });
        log().insertAdjacentHTML('beforeend',line('me',o.zh,o.py,isAr()?o.ar:o.en)); bindLine(log().lastElementChild); setTimeout(()=>speak(o.zh),150); scrollEnd();
        $('#tfb',m).innerHTML=`<div class="tkfb good"><b>✓ ${t('tkBest')}</b></div><div class="row" style="gap:10px"><button class="btn ghost grow" id="tsay">🎤 ${t('tkSay')}</button><button class="btn jade grow" id="tnx">${t('tkNext')} →</button></div>`;
        $('#tsay',m).onclick=()=>pronCheck(o.zh); $('#tnx',m).onclick=()=>{ SFX.tap(); ti++; ti<s.turns.length?partner():summary(); };
        scrollEnd();
      } else { b.classList.add(o.t==='B'?'meh':'wrong'); SFX.bad(); haptic('error');
        setTimeout(scrollEnd,30); $('#tfb',m).innerHTML=`<div class="tkfb ${o.t==='B'?'meh':'bad'}"><b>${o.t==='B'?'≈ '+t('tkOk'):'✕ '+t('tkNo')}</b><div>${esc(isAr()?o.na:o.ne)}</div><div class="sub">${esc(isAr()?o.ar:o.en)} · ${t('tkTry')}</div></div>`; } }); }
  function summary(){ const max=s.turns.length*3, pct=score/max, st=pct>=.9?3:pct>=.6?2:1, k=tkKey(d,s); S.talk=S.talk||{}; const prev=S.talk[k]||0; S.talk[k]=Math.max(prev,st);
    S.talkN=(S.talkN||0)+1; const xp=15+score*2; addXP(xp); const c=addCoins(10+st*5); track('talk_done',{scene:k,stars:st}); save();
    SFX.win(); confetti(st===3?110:60); const nx=d.scenes[si+1]; m.classList.remove('tkchat'); window.scrollTo(0,0);
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i style="width:100%"></i></div></div>
      <div class="result rise" style="padding-top:0"><div class="bao-dance">${bao(st===3?'cool':'happy',100)}</div><h1>${t('tkDone')}</h1><div class="tkstars big">${tkStars(st)}</div>
      <div class="kv"><div><span class="sub">${t('tkFirst')}</span><b><span class="num">${firstBest}/${s.turns.length}</span></b></div><div><span class="sub">${t('earned')}</span><b style="color:var(--gold2)">+${xp}</b></div><div><span class="sub">${coinHTML}</span><b>+${c}</b></div></div>
      <div class="card col" style="gap:10px;text-align:start"><h3 style="margin:0">📒 ${t('tkBook')}</h3><button class="btn ghost block" id="trp">▶ ${t('tkReplay')}</button>
        ${s.turns.map(tn=>{ const a=tn.o.find(o=>o.t==='A'); return `<div class="tkph"><div class="row" style="gap:8px;align-items:flex-start"><div class="grow" style="min-width:0" dir="ltr">${analyseHTML2(a.zh,a.py)}</div><button class="speak sm" data-zh="${esc(a.zh)}" aria-label="🔊">🔊</button><button class="speak sm" data-say="${esc(a.zh)}" aria-label="🎤">🎤</button></div><div class="sub" dir="auto">${esc(isAr()?a.ar:a.en)}</div></div>`; }).join('')}</div>
      ${tkTerms(d,s).length?`<div class="card col" style="gap:8px;text-align:start"><b>📘 ${t('tkTerms')}</b>${tkTermsHTML(tkTerms(d,s))}<button class="btn ghost block" id="tpr">🎯 ${t('tkPractise')} · <span class="num">${Math.min(10,tkTerms(d,s).length)}</span></button></div>`:''}
      <div class="row" style="gap:10px"><button class="btn ghost grow" id="tag">↺ ${t('tkAgain')}</button>${nx?`<button class="btn grow" id="tns">${t('tkNextScene')} →</button>`:`<button class="btn grow" id="tdn">${t('next')}</button>`}</div></div>`;
    bindTokens(m); $$('[data-zh]',m).forEach(b=>{ if(b.classList.contains('speak')) b.onclick=()=>speak(b.dataset.zh); }); $$('[data-say]',m).forEach(b=>b.onclick=()=>pronCheck(b.dataset.say));
    const leave=async to=>{ await interstitial(); to(); };
    $('#qx',m).onclick=()=>leave(()=>go('talk',{d:d.k})); $('#tag',m).onclick=()=>go('talkscene',{d:d.k,i:si});
    const pr=$('#tpr',m); if(pr) pr.onclick=()=>{ const terms=tkTerms(d,s), ws=terms.slice(0,10).map(x=>x.w), pool=(SECTORS.find(x=>x.k===d.sec)||terms[0].sec)._w;
      track('talk_terms',{scene:tkKey(d,s)}); route={name:'lesson'}; render(); runQuiz($('main'),{intro:ws.filter(w=>!S.srs[w.id]),questions:makeQuestions(ws,pool),back:()=>go('talkscene',{d:d.k,i:si}),onDone:()=>{ route={name:'talk',arg:{d:d.k}}; }}); };
    const ns=$('#tns',m); if(ns) ns.onclick=()=>leave(()=>tkFree(d,si+1)?go('talkscene',{d:d.k,i:si+1}):paywall('talk'));
    const dn=$('#tdn',m); if(dn) dn.onclick=()=>leave(()=>go('talk',{d:d.k}));
    let playing=false; $('#trp',m).onclick=()=>{ const b=$('#trp',m); if(playing){ playing=false; clearTimeout(timer); b.textContent='▶ '+t('tkReplay'); return; }
      playing=true; b.textContent='■ '+t('tkStop'); const seq=s.turns.flatMap(tn=>[tn.p[0],tn.o.find(o=>o.t==='A').zh]); let k2=0;
      const next=()=>{ if(!playing||k2>=seq.length){ playing=false; b.textContent='▶ '+t('tkReplay'); return; } const z=seq[k2++]; speak(z); timer=setTimeout(next,900+[...z].length*260); }; next(); };
  }
  intro();
};
