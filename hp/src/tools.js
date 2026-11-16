/* ===== Learning tools (no translation): rich word entries with character breakdown,
   sentence analyser, pronunciation check, wordbook, word builder, daily card, check-in calendar ===== */
const CH=__CHARS__;               // {c:{char:[radical,components,type,hint,semantic,phonetic]}, m:{component:[en,ar,py]}}
const byH={}; W.forEach(w=>{ if(!byH[w.h]) byH[w.h]=w; });
const isHan=c=>/[㐀-鿿]/.test(c);
/* --- segmentation: greedy longest match against the HSK lexicon --- */
function segment(s){ const out=[]; let i=0; const a=[...s];
  while(i<a.length){ if(!isHan(a[i])){ let j=i; while(j<a.length&&!isHan(a[j])) j++; out.push({t:a.slice(i,j).join('')}); i=j; continue; }
    let hit=null; for(let n=Math.min(4,a.length-i);n>0;n--){ const k=a.slice(i,i+n).join(''); if(byH[k]){ hit={t:k,w:byH[k]}; break; } }
    if(!hit) hit={t:a[i]}; out.push(hit); i+=[...hit.t].length; }
  return out; }
function analyseHTML(s){ return `<div class="seg-sent">${segment(s).map(x=>x.w?`<button class="tok" data-w="${x.w.id}"><span class="py">${esc(x.w.p)}</span><span class="han">${esc(x.t)}</span></button>`:isHan(x.t)?`<span class="tok plain"><span class="py">&nbsp;</span><span class="han">${esc(x.t)}</span></span>`:`<span class="punct han">${esc(x.t)}</span>`).join('')}</div>`; }
function bindTokens(root){ $$('.tok[data-w]',root).forEach(b=>b.onclick=e=>{ e.stopPropagation(); const w=byId[b.dataset.w]; speak(w.h); SFX.tap();
  sheet(`<div class="row" style="gap:14px"><span class="han" style="font-size:44px;font-weight:700;color:var(--gold2)">${esc(w.h)}</span><div class="grow"><div class="py" style="font-size:20px">${esc(w.p)}</div><div>${mean(w,3)}</div><span class="soon">HSK ${w.l}</span></div><button class="speak" id="tsp">🔊</button></div>
    <button class="btn block" id="topen">📖 ${t('openEntry')}</button>`,s=>{ $('#tsp',s).onclick=()=>speak(w.h); $('#topen',s).onclick=()=>go('word',w.id); }); }); }
/* --- pronunciation check: native speech recognition in the app, Web Speech API in browsers --- */
function hear(){ return new Promise(res=>{ if(RN){ native('listen',{lang:'zh-CN'}).then(r=>res(r&&r.text||null)); return; }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return res(undefined);
  const r=new SR(); r.lang='zh-CN'; r.interimResults=false; r.maxAlternatives=4; let done=false; const fin=v=>{ if(!done){ done=true; res(v); } };
  r.onresult=e=>fin([...e.results[0]].map(a=>a.transcript).join('|')); r.onerror=()=>fin(null); r.onend=()=>fin(null);
  try{ r.start(); }catch(e){ fin(null); } setTimeout(()=>{ try{ r.stop(); }catch(e){} },7000); }); }
function lcs(a,b){ const d=Array(b.length+1).fill(0); for(const x of a){ let p=0; for(let j=1;j<=b.length;j++){ const t=d[j]; d[j]=x===b[j-1]?p+1:Math.max(d[j],d[j-1]); p=t; } } return d[b.length]; }
function pronScore(target,heard){ const T=[...target].filter(isHan); let best=0, bestAlt='';
  (heard||'').split('|').forEach(h=>{ const H=[...h].filter(isHan); const s=T.length?Math.round(lcs(T,H)/Math.max(T.length,H.length)*100):0; if(s>=best){ best=s; bestAlt=h; } }); return {score:best,heard:bestAlt}; }
async function pronCheck(target){ if(!S.pro){ const c=dayCount('pronDay'); if(c.n>=PLAN.freePron){ toast(t('pronLimit')); return paywall('pron'); } c.n++; save(); } track('pron_check'); try{ musDuck(8); }catch(e){}
  sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px"><div class="eyebrow">🎤 ${t('sayIt')}</div><div class="han" style="font-size:34px;font-weight:700">${esc(target)}</div><div class="mic-pulse">🎤</div><div class="sub">${t('listening')}</div></div>`);
  const h=await hear();
  if(h===undefined){ sheet(`<div class="col" style="text-align:center;gap:10px"><div style="font-size:40px">🎙️</div><p>${t('micNA')}</p><button class="btn block" id="lp">🔊 ${t('listenRepeat')}</button></div>`,s=>$('#lp',s).onclick=()=>speak(target)); return; }
  if(!h){ sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px">${bao('think',80)}<h3>${t('notHeard')}</h3><div class="row" style="gap:8px;width:100%"><button class="btn ghost grow" id="pl">🔊 ${t('listenAgain')}</button><button class="btn grow" id="ag">🎤 ${t('tryAgain')}</button></div></div>`,s=>{ $('#pl',s).onclick=()=>speak(target); $('#ag',s).onclick=()=>pronCheck(target); }); return; }
  const {score,heard}=pronScore(target,h); const g=score>=85?['🌟',t('pronGreat'),'cool']:score>=60?['👍',t('pronGood'),'happy']:['🔁',t('pronAgain'),'oops'];
  if(score>=85){ SFX.ok(); addXP(2); } else if(score<60) SFX.bad();
  S.pron=(S.pron||0)+1; dayCount('pronAll').n++; save();
  sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px">${bao(g[2],80)}<div style="font:800 46px Inter;color:${score>=85?'#7be3b0':score>=60?'var(--gold2)':'#ff9a8f'}">${score}<span style="font-size:20px">%</span></div><h3>${g[0]} ${g[1]}</h3>
    <div class="sub">${t('weHeard')}</div><div class="han" style="font-size:24px">${heard?esc(heard):'—'}</div>
    <div class="row" style="gap:8px;width:100%"><button class="btn ghost grow" id="pl">🔊 ${t('listenAgain')}</button><button class="btn grow" id="ag">🎤 ${t('tryAgain')}</button></div></div>`,s=>{ $('#pl',s).onclick=()=>speak(target); $('#ag',s).onclick=()=>pronCheck(target); }); }
/* --- character breakdown --- */
const TYPE_NAME={p:['Sound + meaning','صوت + معنى'],i:['Combined meaning','معنى مركّب'],g:['Picture','صورة']};
function compMean(x){ const m=CH.m[x]; if(!m) return ''; const ar=isAr(); return ar?(m[1]||m[0]):m[0]; }
function charHTML(c){ const d=CH.c[c]; if(!d) return ''; const [rad,comps,ty,hint,sem,pho]=d; const ar=isAr();
  let why='';
  if(ty==='p'&&sem&&pho) why=ar?`الجزء <b class="han">${sem}</b> (${esc(compMean(sem))}) يدلّ على المعنى، والجزء <b class="han">${pho}</b> (يُنطق ${esc((CH.m[pho]||[])[2]||'')}) يدلّ على النطق.`:`<b class="han">${sem}</b> (${esc(compMean(sem))}) gives the meaning and <b class="han">${pho}</b> (said ${esc((CH.m[pho]||[])[2]||'')}) gives the sound.`;
  else if(ty&&comps.length>1) why=ar?`يجمع معاني أجزائه: ${[...comps].map(x=>`<b class="han">${x}</b> ${esc(compMean(x))}`).join(' + ')}.`:(hint?esc(hint)+'.':'');
  else if(ty==='g') why=ar?'رسم مبسّط للشيء نفسه، تطوّر من النقوش القديمة.':(hint?esc(hint)+'.':'A simplified drawing of the thing itself.');
  if(!ar&&ty!=='p'&&hint&&!why.includes(esc(hint))) why+=' '+esc(hint)+'.';
  return `<div class="charbox"><div class="bigc han">${c}</div><div class="grow col" style="gap:6px;min-width:0">
     <div class="row" style="gap:6px;flex-wrap:wrap"><span class="soon">${t('radical')} <b class="han">${rad}</b> ${esc(compMean(rad))}</span>${ty?`<span class="soon">${TYPE_NAME[ty][ar?1:0]}</span>`:''}</div>
     ${comps.length>1||comps!==c?`<div class="comps">${[...comps].filter(x=>x!==c).map(x=>`<span><b class="han">${x}</b><small>${esc(compMean(x)||((CH.m[x]||[])[2]||''))}</small></span>`).join('<i>+</i>')}</div>`:''}
     ${why?`<div class="sub" style="color:var(--ink2);line-height:1.6">💡 ${why}</div>`:''}${(()=>{ const s=typeof STORIES!=='undefined'&&STORIES.find(x=>x[0]===c); return s?`<div class="sub" style="color:#5a4a40;line-height:1.6">😄 ${esc(isAr()?s[2]:s[1])}</div>`:''; })()}<button class="xch light" data-qw="${c}">✍️ ${t('xWrite')}</button></div></div>`; }
/* --- wordbook --- */
const inBook=id=>!!(S.book&&S.book[id]);
function toggleBook(id){ S.book=S.book||{}; if(S.book[id]) delete S.book[id]; else { S.book[id]=Date.now(); SFX.coin(); } save(); }
/* --- full word entry --- */
SCREENS.word=(m,id)=>{ const w=byId[id]; if(!w) return go('dict'); track('word_view'); const chars=[...new Set([...w.h])].filter(c=>CH.c[c]);
  const fam=W.filter(x=>x.id!==w.id&&[...w.h].some(c=>x.h.includes(c))).sort((a,b)=>a.l-b.l||a.fq-b.fq).slice(0,14);
  const homo=W.filter(x=>x.id!==w.id&&x.p===w.p).slice(0,6);
  const tab=S.wtab||'mean';
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"></div><button class="icon-btn" id="bm" aria-label="wordbook" style="color:${inBook(w.id)?'var(--gold2)':'inherit'}">${inBook(w.id)?'★':'☆'}</button></div>
   <div class="paper col rise" style="gap:10px"><div class="stamp">${w.code?'码':w.sector?'业':w.l+'级'}</div>
     <div class="han wordhead" style="font-size:64px;font-weight:700;line-height:1.05;text-align:start;color:#6a120d">${esc(w.h)}</div>
     <div class="row" style="gap:10px"><span class="py" style="font-size:24px;color:var(--red)">${esc(w.p)}</span><button class="speak" id="sp">🔊</button><button class="speak" id="mic">🎤</button>${[...w.h].some(canWrite)?'<button class="speak" id="wr">✍️</button>':''}</div>
     <div class="row" style="gap:6px;flex-wrap:wrap"><span class="soon" style="color:var(--red);border-color:rgba(179,38,30,.4)">${w.code?'💻 IT':w.sector?'🏭 '+((SECTORS.find(s=>s.k===w.sector)||{})[isAr()?'ar':'en']||''):'HSK '+w.l}</span>${w.t!==w.h?`<span class="soon" style="color:var(--ink2)">${t('trad')} <span class="han">${esc(w.t)}</span></span>`:''}${w.mw&&w.mw.length?`<span class="soon" style="color:var(--ink2)">${t('mw')} <span class="han">${esc(w.mw.join(' / '))}</span></span>`:''}${(w.pos||[]).slice(0,2).map(p=>`<span class="soon" style="color:var(--ink2)">${esc(p)}</span>`).join('')}</div>
     <ol style="margin:0;padding-inline-start:22px;font-size:18px">${meaningList(w).map(a=>`<li ${meanIsFallback(w)?'class="ltr"':''}>${esc(a)}</li>`).join('')}</ol>${extrasHTML(w)}</div>
   <div class="seg" id="wt">${[['mean',t('example')],['char',t('chars')],['fam',t('family')]].map(([k,l])=>`<button data-t="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
   <div id="wbody"></div>`);
  function body(){ const b=$('#wbody',m), k=S.wtab||'mean';
    if(k==='mean') b.innerHTML=w.ex?`<div class="card col" style="gap:10px"><div class="sub">${t('tapWords')}</div>${analyseHTML(w.ex.zh)}<div>${esc(isAr()?w.ex.ar:(w.ex.en||''))}</div>
        <div class="row" style="gap:8px"><button class="btn ghost sm grow" id="exs">🔊 ${t('listenAgain')}</button><button class="btn sm grow" id="exm">🎤 ${t('readAloud')}</button></div></div>`:`<div class="card sub">${t('noExample')}</div>`;
    if(k==='char') b.innerHTML=`<div class="col" style="gap:10px">${chars.map(charHTML).join('')||`<div class="card sub">—</div>`}</div><div class="fine">${t('charCredit')}</div>`;
    if(k==='fam') b.innerHTML=`<div class="card col" style="gap:4px"><h3>${t('family')}</h3><ul class="list">${fam.map(x=>`<li data-id="${x.id}"><span class="han">${esc(x.h)}</span><span class="py">${esc(x.p)}</span><span class="lv">HSK${x.l}</span><span style="min-width:0;font-size:14px">${mean(x)}</span></li>`).join('')||'<li>—</li>'}</ul></div>
       ${homo.length?`<div class="card col" style="gap:4px"><h3>${t('homophones')}</h3><div class="sub">${t('homophonesD')}</div><ul class="list">${homo.map(x=>`<li data-id="${x.id}"><span class="han">${esc(x.h)}</span><span class="py">${esc(x.p)}</span><span class="lv">HSK${x.l}</span><span style="min-width:0;font-size:14px">${mean(x)}</span></li>`).join('')}</ul></div>`:''}`;
    bindTokens(b); const es=$('#exs',b); if(es) es.onclick=()=>speak(w.ex.zh); const em=$('#exm',b); if(em) em.onclick=()=>pronCheck(w.ex.zh);
    $$('li[data-id]',b).forEach(li=>li.onclick=()=>go('word',+li.dataset.id)); $$('[data-qw]',b).forEach(x=>x.onclick=()=>quickWrite(x.dataset.qw)); }
  $$('#wt button',m).forEach(x=>x.onclick=()=>{ S.wtab=x.dataset.t; $$('#wt button',m).forEach(y=>y.setAttribute('aria-pressed',y===x)); body(); });
  $('#bk',m).onclick=()=>history.length&&S._wback?go(S._wback.name,S._wback.arg):go('dict');
  $('#sp',m).onclick=()=>speak(w.h); $('#mic',m).onclick=()=>pronCheck(w.h); const wrb=$('#wr',m); if(wrb) wrb.onclick=()=>go('write',{chars:[...new Set([...w.h])].filter(canWrite),title:w.h});
  $('#bm',m).onclick=e=>{ toggleBook(w.id); e.currentTarget.textContent=inBook(w.id)?'★':'☆'; e.currentTarget.style.color=inBook(w.id)?'var(--gold2)':'inherit'; toast(inBook(w.id)?t('saved'):t('removed')); };
  speak(w.h); body(); bindExtras(m,w); };
/* --- word builder (生词本 + study modes) --- */
const RAD_TOP=(()=>{ const n={}; W.forEach(w=>[...w.h].forEach(c=>{ const d=CH.c[c]; if(d&&CH.m[d[0]]&&CH.m[d[0]][1]) (n[d[0]]=n[d[0]]||new Set()).add(w.id); })); return Object.entries(n).map(([r,s])=>[r,[...s]]).sort((a,b)=>b[1].length-a[1].length).slice(0,40); })();
function builderWords(mode,arg){ const lv=curLevel();
  if(mode==='book') return Object.keys(S.book||{}).map(Number).map(id=>byId[id]).filter(Boolean);
  if(mode==='wrong') return Object.entries(S.wrong||{}).sort((a,b)=>b[1]-a[1]).map(([id])=>byId[id]).filter(Boolean);
  if(mode==='rad'){ const r=RAD_TOP.find(x=>x[0]===arg); return r?r[1].map(id=>byId[id]).sort((a,b)=>a.l-b.l||a.fq-b.fq):[]; }
  if(mode==='freq') return (byLevel[lv]||[]).filter(w=>!S.srs[w.id]).sort((a,b)=>a.fq-b.fq);
  return shuffle(W.filter(w=>w.l<=Math.max(lv,1)+1)); }
SCREENS.builder=(m,arg)=>{ const st=Object.assign({mode:'book',rad:null},arg||{});
  const modes=[['book','⭐',t('wordbook')],['wrong','❌',t('mistakes')],['rad','部',t('byRadical')],['freq','📈',t('mostCommon')],['rand','🎲',t('randomMix')]];
  const list=st.mode==='rad'&&!st.rad?[]:builderWords(st.mode,st.rad); const set=list.slice(0,10);
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><h1 class="grow">${t('builder')}</h1><span class="brush" style="font-size:34px;color:var(--gold)">生词</span></div>
   <div class="sub">${t('builderD')}</div>
   <div class="modes">${modes.map(([k,i,l])=>`<button class="mode ${st.mode===k?'on':''}" data-m="${k}"><b>${i}</b><span>${l}</span></button>`).join('')}</div>
   ${st.mode==='rad'?`<div class="radgrid">${RAD_TOP.map(([r,ids])=>`<button class="rad ${st.rad===r?'on':''}" data-r="${r}"><b class="han">${r}</b><small>${esc(compMean(r))}</small><i class="num">${ids.length}</i></button>`).join('')}</div>`:''}
   ${st.mode==='rad'&&!st.rad?`<div class="card sub">${t('pickRadical')}</div>`:list.length?`<div class="paper col" style="gap:10px"><div class="stamp">学</div><h2><span class="num">${list.length}</span> ${t('words')}</h2>
      <div class="han" style="font-size:26px;text-align:start;line-height:1.5">${set.map(w=>esc(w.h)).join(' ')}</div>
      <div class="steps3"><span>① ${t('learnStep')}</span><span>② ${t('practiceStep')}</span><span>③ ${t('testStep')}</span></div>
      <button class="btn block" id="go">${t('startSet')} · <span class="num">${set.length}</span></button></div>
      <ul class="list">${list.slice(0,60).map(w=>`<li data-id="${w.id}"><span class="han">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="lv">${st.mode==='wrong'?'✕'+S.wrong[w.id]:'HSK'+w.l}</span><span style="min-width:0;font-size:14px">${mean(w)}</span></li>`).join('')}</ul>`
    :`<div class="card col" style="align-items:center;text-align:center">${bao('think',70)}<p style="margin:0">${st.mode==='book'?t('bookEmpty'):t('wrongEmpty')}</p></div>`}`);
  $('#bk',m).onclick=()=>go('dict');
  $$('[data-m]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('builder',{mode:b.dataset.m}); });
  $$('[data-r]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('builder',{mode:'rad',rad:b.dataset.r}); });
  $$('li[data-id]',m).forEach(li=>li.onclick=()=>{ S._wback={name:'builder',arg:st}; go('word',+li.dataset.id); });
  const g=$('#go',m); if(g) g.onclick=()=>{ route={name:'lesson',arg:{custom:1}}; render(); const mm=$('main'); const pool=W.filter(w=>w.l<=Math.max(...set.map(x=>x.l)));
    runQuiz(mm,{intro:set,questions:makeQuestions(set,pool).concat(makeQuestions(set,pool).filter(q=>q.k!=='pairs')),back:()=>go('builder',st),onDone:()=>{ S.lessonsToday++; if(st.mode==='wrong') set.forEach(w=>{ if((S.wrong[w.id]||0)>0) S.wrong[w.id]--; if(!S.wrong[w.id]) delete S.wrong[w.id]; }); save(); route={name:'builder',arg:st}; }}); };
};
/* --- daily card: word, idiom and culture fact of the day --- */
function daySeed(){ return today().split('-').join('')|0; }
function todayCard(){ const s=daySeed(), lv=curLevel(), pool=byLevel[lv]||W, w=pool[s%pool.length], id=IDIOMS[s%IDIOMS.length];
  const cards=CULTURE.flatMap((c,i)=>c.cards.map((d,j)=>({c,i,d,j}))), f=cards[(s*7)%cards.length];
  return `<div class="card col today" style="gap:12px"><div class="row"><h3 class="grow">${t('today')}</h3><span class="brush" style="color:var(--gold);font-size:22px">每日</span></div>
    <button class="trow" id="tw"><span class="tlab">${t('wordOfDay')}</span><span class="han tbig">${esc(w.h)}</span><span class="grow col" style="min-width:0"><span class="py">${esc(w.p)}</span><span class="sub" style="color:var(--ivory)">${mean(w,1)}</span></span>›</button>
    <div class="trow"><span class="tlab">${t('idiomOfDay')}</span><span class="grow col" style="min-width:0"><span class="han" style="font-size:24px;font-weight:700;color:var(--gold2)">${id.h}</span><span class="py">${id.p}</span><span class="sub" style="color:var(--ivory)">${esc(isAr()?id.ar:id.en)}</span></span>
      <span class="col" style="gap:6px"><button class="speak sm" id="tis">🔊</button><button class="speak sm" id="tim">🎤</button></span></div>
    ${(()=>{ const c=[...new Set((byLevel[lv]||[]).flatMap(x=>[...x.h]))].filter(ch=>canWrite(ch)&&writeFree(ch)); const ch=c[(s*3)%Math.max(1,c.length)]; return ch?`<button class="trow" id="tch"><span class="tlab">${t('charOfDay')}</span><span class="han tbig">${ch}</span><span class="grow col" style="min-width:0;text-align:start"><b>✍️ ${t('xWrite')}</b><span class="sub" style="color:var(--ivory)">${esc((byH[ch]&&meaning(byH[ch],1))||'')}</span></span>›</button>`:''; })()}
    <button class="trow" id="tf"><span class="tlab">${t('factOfDay')}</span><span class="grow col" style="min-width:0;text-align:start"><b>${esc(L2(f.d))}</b><span class="sub" style="color:var(--ivory);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(isAr()?(f.d.wAr||f.d.bAr):(f.d.wEn||f.d.bEn))}</span></span>›</button>
    <div class="row" style="gap:8px"><button class="btn ghost sm grow" id="tbld">🧩 ${t('builder')}</button><button class="btn ghost sm grow" id="tcal">📅 ${t('checkin')}</button></div></div>`; }
function bindToday(m){ const s=daySeed(), lv=curLevel(), pool=byLevel[lv]||W, w=pool[s%pool.length], id=IDIOMS[s%IDIOMS.length];
  const cards=CULTURE.flatMap((c,i)=>c.cards.map((d,j)=>({c,i,d,j}))), f=cards[(s*7)%cards.length];
  const q=x=>$(x,m); if(!q('#tw')) return;
  q('#tw').onclick=()=>{ S._wback={name:'home'}; go('word',w.id); }; q('#tis').onclick=()=>speak(id.h); q('#tim').onclick=()=>pronCheck(id.h);
  q('#tf').onclick=()=>go('reader',{i:f.i,start:f.j,single:true}); const tch=q('#tch'); if(tch) tch.onclick=()=>quickWrite(tch.querySelector('.han').textContent); q('#tbld').onclick=()=>go('builder'); q('#tcal').onclick=checkinSheet; }
/* --- check-in calendar --- */
function checkinSheet(){ const d=new Date(), y=d.getFullYear(), mo=d.getMonth(), first=new Date(y,mo,1).getDay(), n=new Date(y,mo+1,0).getDate(); const days=S.days||{};
  const key=k=>`${y}-${String(mo+1).padStart(2,'0')}-${String(k).padStart(2,'0')}`; const cnt=Object.keys(days).filter(k=>k.startsWith(key(1).slice(0,8))).length;
  const wd=isAr()?['ح','ن','ث','ر','خ','ج','س']:['S','M','T','W','T','F','S'];
  sheet(`<div class="row"><h2 class="grow">📅 ${t('checkin')}</h2><span class="brush" style="font-size:26px;color:var(--gold)">打卡</span></div>
   <div class="kv"><div><span class="sub">🔥 ${t('streak')}</span><b class="num">${S.streak}</b></div><div><span class="sub">${t('thisMonth')}</span><b class="num">${cnt}</b></div><div><span class="sub">❄ ${t('freeze')}</span><b class="num">${S.freezes}</b></div></div>
   <div class="sub" style="text-align:center;margin:6px 0">${d.toLocaleString(isAr()?'ar':'en',{month:'long',year:'numeric'})}</div>
   <div class="cal">${wd.map(x=>`<b>${x}</b>`).join('')}${Array(first).fill('<span></span>').join('')}${Array.from({length:n},(_,i)=>{ const k=key(i+1), on=days[k], isT=i+1===d.getDate(); return `<span class="${on?'on':''} ${isT?'td':''}">${on?'印':i+1}</span>`; }).join('')}</div>
   <div class="sub" style="text-align:center">${t('checkinD')}</div>`); }
