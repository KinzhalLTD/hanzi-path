/* ===== Mastery: every quiz answer is remembered per question (S.qa[id] = {n seen, w wrong count, s right streak}).
   Boss fights draw 8 questions from the module's bank: questions you got wrong first (up to 3), then ones you have
   never seen, then the rest at random, so every rematch is different. Weak spots (弱点) re-asks missed questions
   until each one is answered right twice in a row. ===== */
Object.assign(T.ar,{weakT:'نقاط الضعف',weakB:'أسئلة أخطأت فيها، أجب عن كل منها صحيحًا مرتين لتختفي',weakNone:'لا نقاط ضعف الآن. أحسنت!',weakGo:'تدرّب الآن',weakDone:'نقاط الضعف',weakCleared:'أُزيلت من نقاط الضعف'});
Object.assign(T.en,{weakT:'Weak spots',weakB:'Questions you missed. Answer each one right twice to clear it',weakNone:'No weak spots right now. Well done!',weakGo:'Practise now',weakDone:'Weak spots',weakCleared:'cleared from weak spots'});
const FIGHT_N=8;
function qMark(q,ok){ if(!q||!q.id) return; S.qa=S.qa||{}; const a=S.qa[q.id]=S.qa[q.id]||{n:0,w:0,s:0}; a.n++;
  if(ok){ a.s++; if(a.w>0&&a.s>=2){ a.w=0; q.cleared=true; } } else { a.w++; a.s=0; } }
const qAt=id=>{ const [k,i]=id.split('#'); const x=MOD[k]; return x&&x.Q[+i]?[x.Q[+i],x]:null; };
const weakIds=()=>Object.keys(S.qa||{}).filter(id=>S.qa[id].w>0&&qAt(id));
function fightPick(x){ const st=S.qa||{}, ids=x.Q.map((q,i)=>x.k+'#'+i);
  const weak=shuffle(ids.filter(id=>st[id]&&st[id].w>0)).slice(0,3), fresh=shuffle(ids.filter(id=>!st[id]&&!weak.includes(id)));
  const rest=shuffle(ids.filter(id=>!weak.includes(id)&&!fresh.includes(id))), chosen=[...weak,...fresh,...rest].slice(0,Math.min(FIGHT_N,ids.length));
  return shuffle(chosen).map(id=>x.Q[+id.split('#')[1]]); }
function weakCard(){ const n=weakIds().length; if(!n) return '';
  return `<button class="contcard tap weakcard" id="weak"><div class="row" style="gap:12px">${ico('fire','red')}<div class="grow" style="min-width:0;text-align:start"><b>弱点 · ${t('weakT')} <span class="num">(${n})</span></b><div class="sub">${t('weakB')}</div></div><span class="gbtn">${fwdA()}</span></div></button>`; }
function bindWeak(m){ const b=$('#weak',m); if(b) b.onclick=()=>{ SFX.tap(); go('weak'); }; }
SCREENS.weak=(m)=>{ const ids=shuffle(weakIds()).slice(0,10);
  if(!ids.length){ m.insertAdjacentHTML('beforeend',`${topbar()}<div class="result rise">${dragon('cool',110)}<h1>${t('weakNone')}</h1>${navPair(t('back'),'',{bid:'wb'})}</div>`); $('#wb',m).onclick=()=>goBack('home'); return; }
  const qs=ids.map(id=>{ const [q,x]=qAt(id); return qFrom(q,x); }); track('weak_start',{n:qs.length});
  runQuiz(m,{qs,title:'弱点 · '+t('weakT'),onQuit:()=>go('home'),onDone:(r,n,log)=>{ const cleared=log.filter(e=>e.q.cleared).length; addXP(r*3); const c=addCoins(r*2); questEvent('lesson'); save(); r===n?(SFX.win(),confetti(80)):SFX.ok(); checkBadges();
    const left=weakIds().length;
    m.innerHTML=`<div class="result rise">${dragon(r===n?'cool':'happy',110)}<h1>${t('weakDone')}</h1>
      <div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${r}/${n}</b></div><div><span class="sub">✓</span><b class="num">${cleared}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${c}</b></div></div>
      <p class="sub">${cleared} ${t('weakCleared')} · ${left} ${isAr()?'متبقية':'left'}</p>${navPair(t('back'),left?t('weakGo'):'',{bid:'wb',nid:'wn'})}</div>`;
    $('#wb',m).onclick=()=>go('home'); const wn=$('#wn',m); if(wn) wn.onclick=()=>go('weak'); }}); };
