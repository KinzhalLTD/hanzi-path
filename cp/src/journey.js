/* ===== The journey: each track is a road through four chapters (章). A chapter is a place with three modules and ends at
   a gate (关): a 10-question checkpoint test mixed from the chapter's modules. The gate can be taken at any time (test out
   early); passing it (80%) earns the chapter crown (冠) and a reward. Also: labelled Back / Next navigation helpers. ===== */
Object.assign(T.ar,{jChapter:'الفصل',jGate:'بوابة الفصل',jGateD:'عشرة أسئلة من وحدات هذا الفصل. اجتزها بنسبة 80% لتنال التاج والمكافأة.',jGateGo:'ادخل البوابة',
  jGatePass:'عبرت البوابة!',jGateFail:'قريب! راجع الوحدات وحاول مجددًا.',jYouAreHere:'أنت هنا',jCrown:'تاج الفصل',jChapters:'الفصول',jProgress:'تقدّم المسار',
  back:'رجوع',prevLesson:'الدرس السابق',nextLesson:'الدرس التالي',prevMod:'الوحدة السابقة',nextMod:'الوحدة التالية',nextStep:'الخطوة التالية',toPath:'إلى المسار',jGuard:'حارس البوابة'});
Object.assign(T.en,{jChapter:'Chapter',jGate:'Chapter gate',jGateD:'Ten questions from this chapter’s modules. Score 80% to win the crown and the reward.',jGateGo:'Enter the gate',
  jGatePass:'Gate passed!',jGateFail:'So close! Review the modules and try again.',jYouAreHere:'You are here',jCrown:'Chapter crown',jChapters:'Chapters',jProgress:'Track progress',
  back:'Back',prevLesson:'Previous lesson',nextLesson:'Next lesson',prevMod:'Previous module',nextMod:'Next module',nextStep:'Next step',toPath:'To the path',jGuard:'Gate guardian'});

/* arrows that follow the reading direction */
const fwdA=()=>isAr()?'←':'→', backA=()=>isAr()?'→':'←';
/* a two-button footer: [‹ back label] [next label ›] */
function navPair(backLbl,nextLbl,opt={}){ return `<div class="navpair">${backLbl?`<button class="btn ghost navb" id="${opt.bid||'nbk'}"><span class="arr" aria-hidden="true">${backA()}</span><span class="nl">${backLbl}</span></button>`:''}
  ${nextLbl?`<button class="btn navn ${opt.cls||''}" id="${opt.nid||'nnx'}"><span class="nl">${nextLbl}</span><span class="arr" aria-hidden="true">${fwdA()}</span></button>`:''}</div>`; }

/* four places per track: [zh, pinyin, ar, en, ar line, en line, icon, hue] */
const CHAPTERS={
 se:[['码村','mǎ cūn','قرية الشيفرة','Code Village','حيث يبدأ كل مبرمج: المتغيرات والبُنى والخوارزميات.','Where every coder starts: variables, structures and algorithms.','🏘️','#c9271e'],
     ['匠城','jiàng chéng','مدينة الحِرَفيين','Craftsman City','صُنّاع الكود النظيف: الكائنات والأنماط وGit.','Makers of clean code: objects, patterns and Git.','🏯','#b9852c'],
     ['试剑台','shì jiàn tái','منصة اختبار السيف','Sword-Testing Terrace','اختبر كل شيء: الجودة والويب وقواعد البيانات.','Test everything: quality, the web and databases.','⚔️','#2f7d6b'],
     ['云宫','yún gōng','قصر السحاب','Cloud Palace','تصميم الأنظمة وDevOps وطريقة عمل الفرق.','System design, DevOps and how teams ship.','☁️','#3a5a9a']],
 cy:[['城门','chéng mén','بوابة المدينة','City Gate','أسس الأمن والتشفير وإدارة الهويات.','Security foundations, cryptography and identity.','🏰','#c9271e'],
     ['烽火台','fēnghuǒ tái','برج المنارة','Beacon Tower','حراسة الشبكة والويب والكود.','Guarding the network, the web and the code.','🔥','#b9852c'],
     ['暗林','àn lín','الغابة المظلمة','Shadow Forest','التهديدات ومركز العمليات والاستجابة للحوادث.','Threats, the SOC and incident response.','🌲','#2f7d6b'],
     ['天网','tiān wǎng','شبكة السماء','Sky Net','أمن السحابة والحوكمة والاختراق الأخلاقي.','Cloud security, governance and ethical hacking.','🕸️','#3a5a9a']]};
const CH_N=['一','二','三','四'];
const chapOf=tr=>{ const ms=TRACK(tr); return CHAPTERS[tr].map((c,ci)=>({tr,ci,c,mods:ms.slice(ci*3,ci*3+3)})); };
const chapFree=ch=>ch.mods.every(modFree);
const gateKey=ch=>ch.tr+ch.ci;
const gateOk=ch=>!!((S.gates||{})[gateKey(ch)]||{}).ok;
const curChap=tr=>{ const cs=chapOf(tr); return cs.find(ch=>ch.mods.some(m=>!modDone(m.k))||!gateOk(ch))||cs[cs.length-1]; };

/* ---------- the track screen: chapter banners, winding module stones, a gate per chapter ---------- */
SCREENS.track=(m,tr)=>{ tr=tr==='cy'?'cy':'se'; const ms=TRACK(tr), d=ms.filter(x=>modDone(x.k)).length, cur=nextMod(tr), chs=chapOf(tr), cc=chs[curChap(tr).ci], crowns=chs.filter(gateOk).length;
  const X=[50,24,76];
  const node=(x,i)=>{ const s=S.mods[x.k]||{}, free=modFree(x), here=cur&&cur.k===x.k, b=bossOf(x.k);
    return `<div class="pstep" style="--x:${X[i%3]}%"><div class="pcol"><button class="pnode ${s.done?'done':''} ${free?'':'locked'} ${here?'here':''}" data-k="${x.k}" aria-label="${esc(L(x))}">
      <span class="pic">${s.done?'<span class="stampmark">斩</span>':free?x.ic:ICON.lock}</span>${here?`<span class="phere">${dragon('happy',44)}</span>`:''}<span class="pboss" title="${esc(b.name)}">${b.h}</span></button>
      <div class="plabel"><b>${esc(L(x))}</b><span class="zh">${esc(x.zh)}</span>${s.done?stars(s.stars||1):`<span class="pdots" aria-label="${modStepsDone(x.k)}/4">${[0,1,2,3].map(j=>`<i class="${j<modStepsDone(x.k)?'on':''}"></i>`).join('')}</span>`}</div></div></div>`; };
  const chap=ch=>{ const c=ch.c, dn=ch.mods.filter(x=>modDone(x.k)).length, ok=gateOk(ch), free=chapFree(ch), g=(S.gates||{})[gateKey(ch)], isCur=ch===cc;
    return `<section class="chap ${isCur?'cur':''} ${ok?'won':''}" id="ch${ch.ci}" style="--ch:${c[7]}">
      <div class="chban ondark"><div class="chbg" aria-hidden="true">${c[0]}</div>
        <div class="row" style="gap:12px;align-items:center"><div class="chic" aria-hidden="true">${c[6]}</div>
          <div class="grow" style="min-width:0"><span class="eyebrow">第${CH_N[ch.ci]}章 · ${t('jChapter')} ${ch.ci+1}</span><h2>${esc(isAr()?c[2]:c[3])}</h2><span class="chzh"><span class="han">${c[0]}</span> <span class="py">${c[1]}</span></span></div>
          ${ring(dn/3,`${dn}/3`,54)}</div>
        <p class="chline">${esc(isAr()?c[4]:c[5])}</p>
        <div class="row" style="gap:6px;flex-wrap:wrap">${ch.mods.map(x=>`<span class="chboss ${modDone(x.k)?'down':''}" title="${esc(bossOf(x.k).name)}">${bossOf(x.k).h}</span>`).join('')}
          <span class="grow"></span>${ok?`<span class="crown">冠 ${t('jCrown')}</span>`:free?'':`<span class="tag lock">${ICON.lock} ${t('pro')}</span>`}${isCur?`<span class="herechip">${t('jYouAreHere')}</span>`:''}</div></div>
      <div class="pathmap">${ch.mods.map(node).join('')}</div>
      <button class="gate2 ${ok?'won':''} ${free?'':'locked'}" data-g="${ch.ci}"><span class="garch" aria-hidden="true"><b>关</b></span>
        <div class="grow" style="min-width:0;text-align:start"><b>${t('jGate')} · ${esc(isAr()?c[2]:c[3])}</b><div class="sub">${ok?`✓ ${t('jGatePass')} · <span class="num">${Math.round(g.p*100)}%</span>`:g&&g.p!=null?`${t('score')}: <span class="num">${Math.round(g.p*100)}%</span> · ${t('jGateFail')}`:t('jGateD')}</div></div>
        <span class="gbtn">${ok?'↺':free?fwdA():ICON.lock}</span></button></section>`; };
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><div class="grow"><span class="eyebrow">${t('learn')} · <span class="han">${tr==='se'?'软件工程':'网络安全'}</span></span><h1>${TRK[tr].ic} ${TRK[tr].name()}</h1></div></div>
  <div class="seg" id="tsg"><button data-t="se" aria-pressed="${tr==='se'}">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="${tr==='cy'}">🛡️ ${t('trCY')}</button></div>
  <div class="card col jsum" style="gap:10px"><div class="row" style="gap:12px"><div class="grow"><span class="eyebrow">${t('jProgress')}</span><div class="bar ${tr}" style="margin-top:6px"><i style="width:${d/ms.length*100}%"></i></div>
      <div class="sub" style="margin-top:6px"><span class="num">${d}/${ms.length}</span> ${isAr()?'وحوش هُزمت':'bosses defeated'} · <span class="num">${crowns}/4</span> 冠</div></div><button class="btn sm ghost" id="ex">📝 ${t('exam')}</button></div>
    <div class="chjump" role="tablist" aria-label="${t('jChapters')}">${chs.map(ch=>`<button data-j="${ch.ci}" class="${ch===cc?'on':''} ${gateOk(ch)?'won':''}" aria-label="${t('jChapter')} ${ch.ci+1}"><span class="han">${ch.c[0]}</span><i>${gateOk(ch)?'冠':ch.mods.filter(x=>modDone(x.k)).length+'/3'}</i></button>`).join('')}</div></div>
  <div class="journey">${chs.map(chap).join('<div class="road" aria-hidden="true"></div>')}<div class="pend"><span class="brushzh">${tr==='se'?'毕业':'护法'}</span></div></div>
  ${certCard(tr)}`);
  $('#bk',m).onclick=()=>goBack('learn'); $('#ex',m).onclick=()=>go('exam',tr);
  $$('#tsg button',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('track',b.dataset.t); });
  $$('.pnode',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const x=MOD[b.dataset.k]; if(!modFree(x)) return paywall('module'); go('module',x.k); });
  $$('[data-g]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const ch=chs[+b.dataset.g]; if(!chapFree(ch)) return paywall('gate'); gateSheet(ch); });
  $$('[data-j]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const el=$('#ch'+b.dataset.j,m); el&&el.scrollIntoView({behavior:'smooth',block:'start'}); });
  bindCert(m,tr); $$('.pathmap',m).forEach(drawPath);
  const h=$('.pnode.here',m)||$('.chap.cur',m); if(h&&!(NAV.stack.slice(-1)[0]||{}).y&&cc.ci>0) setTimeout(()=>h.scrollIntoView({block:'center',behavior:'smooth'}),250); };

function gateSheet(ch){ const c=ch.c, g=(S.gates||{})[gateKey(ch)];
  sheet(`<div class="col" style="align-items:center;text-align:center;gap:8px"><div class="gatebig ondark" style="--ch:${c[7]}"><b>关</b></div>
    <span class="eyebrow">第${CH_N[ch.ci]}章 · ${esc(isAr()?c[2]:c[3])}</span><h2>${t('jGate')}</h2><p class="sub" style="margin:0">${t('jGateD')}</p>
    <div class="row" style="gap:8px;justify-content:center">${ch.mods.map(x=>`<span class="chboss">${bossOf(x.k).h}</span>`).join('')}</div>
    ${g&&g.p!=null?`<div class="sub">${t('score')}: <b class="num">${Math.round(g.p*100)}%</b></div>`:''}<div class="sub">+50 ${t('bitsCur')} · +30 ${t('xp')} · 冠</div></div>
    <button class="btn block" id="gg">${t('jGateGo')} ${fwdA()}</button>`,s=>{ $('#gg',s).onclick=()=>{ closeSheet(); go('gaterun',{tr:ch.tr,c:ch.ci}); }; }); }

/* the gate guardian: a door god, hearts as in boss fights (3 mistakes allowed in 10) */
SCREENS.gaterun=(m,{tr,c})=>{ const ch=chapOf(tr)[c]; if(!ch||!chapFree(ch)){ go('track',tr); return; }
  const pool=ch.mods.flatMap(x=>x.Q.map(q=>[q,x])); const qs=pick(pool,Math.min(10,pool.length)).map(([q,x])=>qFrom(q,x));
  const guard={k:'gate',e:'🏯',zh:'门神',py:'ménshén',name:t('jGuard'),h:'<span aria-hidden="true">🏯</span>'};
  track('gate_start',{tr,c});
  runQuiz(m,{qs,title:t('jGate'),boss:guard,hearts:Math.ceil(qs.length*.2)+1,onQuit:()=>go('track',tr),onDone:(r,n)=>{ const p=r/n, ok=p>=.8; S.gates=S.gates||{}; const k=gateKey(ch), was=gateOk(ch);
    S.gates[k]={ok:was||ok,p:Math.max((S.gates[k]||{}).p||0,p)}; addXP(r*3); let coins=0;
    if(ok&&!was){ addXP(30); coins=addCoins(50); questEvent('boss'); track('gate_pass',{tr,c}); }
    save(); ok?(SFX.gong(),fireworks(4),confetti(110)):SFX.bad(); checkBadges();
    m.innerHTML=`<div class="result rise">${ok?`<div class="gatebig ondark won" style="--ch:${ch.c[7]}"><b>冠</b></div><h1>${t('jGatePass')}</h1><span class="brushzh">${ch.c[0]} · ${ch.c[1]}</span>`
      :`<div class="bossdown">${dragon('sad',96)}<span class="bossface laugh">🏯</span></div><h1>${t('jGateFail')}</h1>`}
      <div class="kv"><div><span class="sub">${t('score')}</span><b class="num">${r}/${n}</b></div><div><span class="sub">${t('earned')}</span><b class="num">+${r*3+(ok&&!was?30:0)}</b></div><div><span class="sub">${t('bitsCur')}</span><b class="num">+${coins}</b></div></div>
      ${navPair(ok?'':(isAr()?'جولة أخرى':'Try again'),t('toPath'),{bid:'ag',nid:'nx'})}</div>`;
    const ag=$('#ag',m); if(ag) ag.onclick=()=>go('gaterun',{tr,c}); $('#nx',m).onclick=async()=>{ await interstitial(); go('track',tr); }; }}); };
