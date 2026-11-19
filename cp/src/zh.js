/* ===== Tech Chinese: term bank, spaced-repetition practice (meaning / term / tone / listening), conversations ===== */
const TM={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'}; const UN={}; for(const v in TM)[...TM[v]].forEach((c,i)=>UN[c]=[v,i+1]);
function retone(py){ const ch=[...py]; const idx=ch.map((c,i)=>UN[c]?i:-1).filter(i=>i>=0); if(!idx.length) return null;
  const k=idx[Math.random()*idx.length|0]; const [v,tn]=UN[ch[k]]; let nt; do{nt=1+(Math.random()*4|0);}while(nt===tn); ch[k]=TM[v][nt-1]; return ch.join(''); }
function toneOptions(py){ const s=new Set([py]); let g=0; while(s.size<4&&g++<60){ const r=retone(py); if(r) s.add(r); } return shuffle([...s]); }
const mean=w=>isAr()?w.ar:w.en;

SCREENS.zh=m=>{ const due=dueIds().length, learned=Object.keys(S.srs).length;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero"><span class="eyebrow">中文 · Zhōngwén</span><h1>${t('zhT')}</h1><p>${t('zhB')}</p></div>
  <div class="grid3"><div class="stat"><b class="num">${TERMS.length}</b><span>${t('statTerms')}</span></div><div class="stat"><b class="num">${learned}</b><span>${t('learned')}</span></div><div class="stat"><b class="num" style="color:${due?'var(--zh)':'inherit'}">${due}</b><span>${t('due')}</span></div></div>
  <button class="btn block" id="pr">🎯 ${t('practice')}${due?` · <span class="num">${Math.min(due,12)}</span>`:''}</button>
  <button class="track zh" id="tb"><span class="ti">词</span><div class="grow"><b>${t('termBank')}</b><div class="sub"><span class="num">${TERMS.length}</span> · ${t('trSE')} · ${t('trCY')}</div></div><span aria-hidden="true">›</span></button>
  <button class="track zh" id="tk"><span class="ti">谈</span><div class="grow"><b>${t('talk')}</b><div class="sub">${t('talkB')}</div></div><span class="sub num">${Object.keys(S.talk||{}).length}/${TALK.reduce((a,d)=>a+d.scenes.length,0)}</span></button>
  <h2>${t('byModule')}</h2><div class="col" style="gap:8px">${MODS.map(x=>{ const n=x.T.filter((w,j)=>S.srs[1000+x.i*100+j]).length;
    return `<button class="modc" data-k="${x.k}"><span class="mi">${x.ic}</span><div class="grow"><div class="zh" style="font-size:15px">${esc(x.zh)}</div><div class="sub">${esc(L(x))}</div></div><span class="tag ${x.tr}">${n}/${x.T.length}</span></button>`; }).join('')}</div>`);
  $('#pr',m).onclick=()=>{ SFX.tap(); go('practice',{due:1}); }; $('#tb',m).onclick=()=>{ SFX.tap(); go('terms'); }; $('#tk',m).onclick=()=>{ SFX.tap(); go('talk'); };
  $$('[data-k]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('terms',{k:b.dataset.k}); }); };

function termSheet(w){ const x=MOD[w.mod]; const ex=x.D.find(d=>d.zh.includes(w.h));
  sheet(`<div class="fcard"><div class="h">${esc(w.h)}</div><div class="py" style="font-size:18px">${esc(w.p)}</div><div style="font-size:17px">${esc(mean(w))}</div><button class="speak" id="sp" aria-label="🔊">${ICON.speak}</button></div>
    <div class="row"><span class="tag ${x.tr}">${x.ic} ${esc(L(x))}</span><div class="grow"></div>${S.srs[w.id]?`<span class="tag ok">✓ ${t('learned')}</span>`:''}</div>
    ${ex?`<div class="card col" style="gap:4px"><div class="zhline han">${esc(ex.zh)}</div><div class="py" style="font-size:13px">${esc(ex.py)}</div><div class="sub" dir="auto">${esc(L(ex))}</div><button class="btn sm ghost" id="se" style="align-self:flex-start">🔊</button></div>`:''}
    <button class="btn ghost block" id="gm">${t('learn')}: ${esc(L(x))} →</button>`,el=>{
    $('#sp',el).onclick=()=>speak(w.h); const se=$('#se',el); if(se) se.onclick=()=>speak(ex.zh); speak(w.h);
    $('#gm',el).onclick=()=>{ closeSheet(); modFree(x)?go('module',x.k):paywall(); }; }); }

SCREENS.terms=(m,arg)=>{ const mk=arg&&arg.k; let tr='all', q='';
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><div class="grow"><span class="eyebrow">${t('zhT')}</span><h1>${mk?esc(MOD[mk].zh):t('termBank')}</h1>${mk?`<div class="sub">${esc(L(MOD[mk]))}</div>`:''}</div></div>
  ${mk?`<button class="btn block" id="pm">🎯 ${t('practice')} · <span class="num">${MOD[mk].T.length}</span></button>`:`<input class="field" id="q" type="search" placeholder="${t('search')}" aria-label="${t('search')}">
  <div class="seg" id="fs"><button data-t="all" aria-pressed="true">${t('all')}</button><button data-t="se" aria-pressed="false">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="false">🛡️ ${t('trCY')}</button></div>`}
  <div class="col" id="tl" style="gap:8px"></div>`);
  const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[\s']/g,'');
  const draw=()=>{ const nq=norm(q); const list=TERMS.filter(w=>(mk?w.mod===mk:tr==='all'||w.tr===tr)&&(!nq||norm(w.h+w.p+w.ar+w.en).includes(nq)));
    $('#tl',m).innerHTML=list.length?list.map(w=>`<button class="term-row" data-id="${w.id}"><span class="h">${esc(w.h)}</span><div class="grow"><div class="py" style="font-size:13px">${esc(w.p)}</div><div>${esc(mean(w))}</div></div>${S.srs[w.id]?'<span class="tag ok">✓</span>':''}</button>`).join(''):`<div class="empty">${t('noResults')}</div>`;
    $$('.term-row',m).forEach(b=>b.onclick=()=>{ SFX.tap(); termSheet(byId[b.dataset.id]); }); };
  $('#bk',m).onclick=()=>goBack('zh');
  const qi=$('#q',m); if(qi) qi.oninput=e=>{ q=e.target.value; draw(); };
  $$('#fs button',m).forEach(b=>b.onclick=()=>{ tr=b.dataset.t; $$('#fs button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); draw(); });
  const pm=$('#pm',m); if(pm) pm.onclick=()=>go('practice',{k:mk}); draw(); };

/* practice: new terms are introduced as cards first, then each term gets one question of a random kind */
function makeQs(words,pool){ return words.map(w=>{ const others=pick(pool.filter(x=>x.id!==w.id&&mean(x)!==mean(w)&&x.h!==w.h),3); const kinds=['mean','zh','py','listen']; const k=kinds[Math.random()*kinds.length|0];
  if(k==='py'){ const o=toneOptions(w.p); if(o.length<3) return {w,k:'mean',opts:shuffle([w,...others]).map(x=>({h:esc(mean(x)),ok:x===w}))}; return {w,k,opts:o.map(p=>({h:`<span class="py" style="font-size:18px">${esc(p)}</span>`,ok:p===w.p}))}; }
  if(k==='mean') return {w,k,opts:shuffle([w,...others]).map(x=>({h:esc(mean(x)),ok:x===w}))};
  return {w,k,opts:shuffle([w,...others]).map(x=>({h:`<span class="han" style="font-size:22px">${esc(x.h)}</span>`,ok:x===w}))}; }); }
SCREENS.practice=(m,arg)=>{ const mk=arg&&arg.k; let words;
  if(mk) words=TERMS.filter(w=>w.mod===mk);
  else { const due=dueIds().map(id=>byId[id]); const fresh=TERMS.filter(w=>!S.srs[w.id]&&modFree(MOD[w.mod])); words=(due.length?due:fresh).slice(0,12); if(due.length<8) words=words.concat(fresh.filter(w=>!words.includes(w)).slice(0,Math.max(0,8-words.length))); }
  if(!words.length){ m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button></div><div class="empty">✓</div>`; $('#qx',m).onclick=()=>go('zh'); return; }
  const pool=TERMS.filter(w=>w.tr===words[0].tr), intro=words.filter(w=>!S.srs[w.id]); let ii=0;
  const back=()=>mk?go('module',mk):go('zh');
  function card(){ const w=intro[ii];
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="bar zh"><i style="width:${ii/intro.length*100}%"></i></div><span class="sub num">${ii+1}/${intro.length}</span></div>
    <span class="eyebrow">${t('terms')}</span><div class="fcard rise"><div class="h">${esc(w.h)}</div><div class="py" style="font-size:20px">${esc(w.p)}</div><div style="font-size:18px">${esc(mean(w))}</div><button class="speak" id="sp" aria-label="🔊">${ICON.speak}</button></div>
    <div class="grow"></div><button class="btn block" id="nx">${t('next')} →</button>`;
    $('#qx',m).onclick=back; $('#sp',m).onclick=()=>speak(w.h); speak(w.h);
    $('#nx',m).onclick=()=>{ SFX.tap(); ii++; ii<intro.length?card():quiz(); }; }
  function quiz(){ const qs=makeQs(words,pool); let i=0, right=0;
    const draw=()=>{ const q=qs[i], w=q.w; $$('.feedback').forEach(f=>f.remove());
      const prompt=q.k==='mean'?`<div class="qtext">${t('qMean')}</div><div class="fcard" style="padding:18px"><div class="h">${esc(w.h)}</div><div class="py">${esc(w.p)}</div></div>`
        :q.k==='zh'?`<div class="qtext">${t('qZh')}</div><div class="fcard" style="padding:18px"><div style="font-size:20px;font-weight:600">${esc(mean(w))}</div></div>`
        :q.k==='py'?`<div class="qtext">${t('qPy')}</div><div class="fcard" style="padding:18px"><div class="h">${esc(w.h)}</div><div class="sub">${esc(mean(w))}</div></div>`
        :`<div class="qtext">${t('qListen')}</div><div class="fcard" style="padding:18px"><button class="speak" id="ls" style="width:64px;height:64px;font-size:26px" aria-label="🔊">${ICON.speak}</button></div>`;
      m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="bar zh"><i style="width:${i/qs.length*100}%"></i></div><span class="sub num">${i+1}/${qs.length}</span></div>${prompt}
        <div class="col" style="gap:10px">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="ol">${'ABCD'[j]}</span><span class="grow">${o.h}</span></button>`).join('')}</div>`;
      $('#qx',m).onclick=back; const ls=$('#ls',m); if(ls){ ls.onclick=()=>speak(w.h); speak(w.h); }
      $$('.opt',m).forEach(b=>b.onclick=()=>{ if(m.dataset.lock) return; m.dataset.lock=1; const o=q.opts[+b.dataset.j]; srsMark(w.id,o.ok); comboHit(o.ok); questEvent('term'); if(o.ok) questEvent('right'); if(o.ok) right++;
        $$('.opt',m).forEach((x,j)=>{ x.disabled=true; x.classList.add(q.opts[j].ok?'right':x===b?'wrong':'dim'); }); o.ok?(SFX.ok(),haptic('success')):(SFX.bad(),haptic('error'));
        if(q.k!=='listen') speak(w.h);
        const f=document.createElement('div'); f.className='feedback '+(o.ok?'good':'bad');
        f.innerHTML=`<div><div class="row"><b class="v grow">${o.ok?t('correct'):t('wrong')}</b></div><div class="row" style="gap:10px"><span class="han" style="font-size:24px">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="grow">${esc(mean(w))}</span></div><button class="btn block" id="fn">${t('next')} →</button></div>`;
        document.body.appendChild(f); $('#fn',f).onclick=()=>{ f.remove(); delete m.dataset.lock; i++; i<qs.length?draw():finish(right,qs.length); }; }); };
    draw(); }
  function finish(r,n){ save(); addXP(r*2+5); const c=addCoins(5+r); SFX.win(); if(r===n) confetti(60);
    let fin=false; if(mk){ const s=mst(mk); if(!s.T){ s.T=1; save(); } fin=checkModDone(MOD[mk]); }
    m.innerHTML=`<div class="result rise"><div class="big num">${r}/${n}</div><h1>${r===n?t('correct'):t('practice')}</h1><div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${Math.round(r/n*100)}%</b></div><div><span class="sub">${t('earned')}</span><b class="num">+${r*2+5}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${c}</b></div></div>
      <button class="btn block" id="dn">${t('finish')}</button></div>`;
    $('#dn',m).onclick=()=>{ back(); if(fin) moduleDone(MOD[mk]); }; }
  intro.length?card():quiz(); };

/* ---------- workplace conversations: the partner speaks, the learner chooses the best reply (A best, B weak, X wrong) ---------- */
const TK_FACE={soft:['🧑‍💼','👨‍💻','🧑‍🔧','👩‍💻','👨‍💼'],sec:['🧑‍💻','👨‍💼','👩‍⚖️','👨‍💼','👨‍💻']};
const tkFree=i=>S.pro||i===0;
SCREENS.talk=(m,arg)=>{ let cur=Math.max(0,TALK.findIndex(d=>d.k===((arg&&arg.d)||S._tkD||TALK[0].k)));
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><div class="grow"><span class="eyebrow">职场对话 · zhíchǎng duìhuà</span><h1>${t('talk')}</h1></div></div><p class="sub">${t('talkB')}</p>
    <div class="seg" id="ts">${TALK.map((d,i)=>`<button data-i="${i}" aria-pressed="${i===cur}">${d.emo} ${esc(L(d))}</button>`).join('')}</div><div class="col" id="sl" style="gap:10px"></div>`);
  const draw=()=>{ const d=TALK[cur]; S._tkD=d.k;
    $('#sl',m).innerHTML=d.scenes.map((s,i)=>{ const st=(S.talk||{})[d.k+'/'+s.k]||0; return `<button class="modc" data-i="${i}"><span class="mi">${(TK_FACE[d.k]||[])[i]||d.emo}</span><div class="grow"><div class="zh" style="font-size:14px">${esc(s.zh)}</div><b>${esc(L(s))}</b><div class="sub">${esc(s.pz)} · ${esc(L(s,'pa','pe'))}</div></div>${tkFree(i)?stars(st):`<span class="tag lock">${ICON.lock}</span>`}</button>`; }).join('');
    $$('#sl .modc',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; SFX.tap(); if(!tkFree(i)) return paywall(); go('talkscene',{d:TALK[cur].k,i}); }); };
  $('#bk',m).onclick=()=>goBack('zh'); $$('#ts button',m).forEach(b=>b.onclick=()=>{ cur=+b.dataset.i; $$('#ts button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); SFX.tap(); draw(); }); draw(); };

SCREENS.talkscene=(m,{d:dk,i:si})=>{ const d=TALK.find(x=>x.k===dk), s=d&&d.scenes[si]; if(!s) return go('talk'); if(!tkFree(si)) return paywall();
  const face=(TK_FACE[d.k]||[])[si]||d.emo; let ti=0, score=0, timer=null; const prev=cleanup; cleanup=()=>{ clearTimeout(timer); prev&&prev(); };
  const bubble=(who,zh,py,tr)=>`<div class="tkmsg ${who}" dir="ltr"><span class="tkface">${who==='them'?face:'🙂'}</span><div class="tkbub"><div class="zhline han">${esc(zh)}</div><div class="py" style="font-size:12.5px">${esc(py)}</div><div class="sub" dir="auto">${esc(tr)}</div></div><button class="speak" data-z="${esc(zh)}" data-v="${who==='them'?'p':'n'}" aria-label="🔊" style="width:30px;height:30px">🔊</button></div>`;
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="grow"><b>${esc(L(s))}</b><div class="sub">${esc(s.zh)}</div></div></div>
    <div class="card sub" style="padding:12px">${esc(L(s,'sa','se'))}</div><div class="tklog" id="lg"></div><div class="tkpanel" id="pn"></div>`;
  $('#qx',m).onclick=()=>go('talk',{d:d.k});
  const lg=$('#lg',m), pn=$('#pn',m); const bindSp=el=>$$('.speak',el).forEach(b=>b.onclick=()=>speak(b.dataset.z,{voice:b.dataset.v}));
  const end=()=>requestAnimationFrame(()=>{ window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); });
  function partner(){ const tn=s.turns[ti]; lg.insertAdjacentHTML('beforeend',`<div class="tkmsg them" dir="ltr"><span class="tkface">${face}</span><div class="tkbub"><span class="dots"><i></i><i></i><i></i></span></div></div>`); end(); pn.innerHTML='';
    timer=setTimeout(()=>{ lg.lastElementChild.remove(); lg.insertAdjacentHTML('beforeend',bubble('them',tn.p[0],tn.p[1],isAr()?tn.p[2]:tn.p[3])); bindSp(lg.lastElementChild); speak(tn.p[0],{voice:'p'}); choices(); end(); },600); }
  function choices(){ const tn=s.turns[ti], opts=shuffle(tn.o); let tries=0, done=false;
    pn.innerHTML=`<div class="row"><b class="grow">${isAr()?'اختر ردّك':'Choose your reply'}</b><button class="btn ghost sm" id="hi">${ICON.hint}</button></div>${opts.map((o,j)=>`<button class="tkopt" data-j="${j}" dir="ltr"><span class="han" style="font-size:16px">${esc(o.zh)}</span><span class="py" style="font-size:12px">${esc(o.py)}</span><span class="tr2" dir="auto">${esc(isAr()?o.ar:o.en)}</span></button>`).join('')}<div id="fb"></div>`;
    $('#hi',pn).onclick=()=>{ pn.classList.add('hinted'); SFX.tap(); };
    $$('.tkopt',pn).forEach(b=>b.onclick=()=>{ if(done||b.disabled) return; const o=opts[+b.dataset.j]; tries++; b.disabled=true;
      if(o.t==='A'){ done=true; score+=tries===1?3:tries===2?1:0; b.classList.add('right'); SFX.ok(); haptic('success'); $$('.tkopt',pn).forEach(x=>{ if(x!==b) x.classList.add('dim'); });
        lg.insertAdjacentHTML('beforeend',bubble('me',o.zh,o.py,isAr()?o.ar:o.en)); bindSp(lg.lastElementChild); speak(o.zh);
        $('#fb',pn).innerHTML=`<button class="btn block" id="nx">${t('next')} →</button>`; $('#nx',pn).onclick=()=>{ SFX.tap(); pn.classList.remove('hinted'); ti++; ti<s.turns.length?partner():summary(); }; end(); }
      else { b.classList.add(o.t==='B'?'meh':'wrong'); SFX.bad(); haptic('error'); $('#fb',pn).innerHTML=`<div class="tkfb ${o.t==='B'?'meh':'bad'}"><b>${o.t==='B'?'≈':'✕'}</b> ${esc(isAr()?o.na:o.ne)}</div>`; } }); }
  function summary(){ questEvent('talk'); const max=s.turns.length*3, st=score/max>=.9?3:score/max>=.6?2:1, k=d.k+'/'+s.k; S.talk=S.talk||{}; S.talk[k]=Math.max(S.talk[k]||0,st); addXP(15+score); const c=addCoins(10+st*5); save(); SFX.win(); confetti(st===3?100:50); track('talk_done',{k,st});
    pn.innerHTML=`<div class="card col" style="gap:10px;text-align:center;align-items:center"><h2>✓ ${isAr()?'أكملت المحادثة!':'Conversation complete!'}</h2>${stars(st)}<div class="sub">+${15+score} ${t('xp')} · +${c} ${t('bitsCur')}</div>
      <div class="row" style="width:100%"><button class="btn ghost grow" id="ag">↺</button>${d.scenes[si+1]?`<button class="btn grow" id="ns">${t('next')} →</button>`:`<button class="btn grow" id="dn">${t('finish')}</button>`}</div></div>`; end();
    $('#ag',pn).onclick=()=>go('talkscene',{d:d.k,i:si}); const ns=$('#ns',pn); if(ns) ns.onclick=async()=>{ await interstitial(); tkFree(si+1)?go('talkscene',{d:d.k,i:si+1}):paywall(); };
    const dn=$('#dn',pn); if(dn) dn.onclick=async()=>{ await interstitial(); go('talk',{d:d.k}); }; }
  partner(); };
