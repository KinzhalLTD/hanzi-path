/* ===== Profitability: PRO subscription with a free trial, value-moment paywalls, bits economy (shop + coin packs),
   rewarded ads that the learner chooses (revive, double bits, extra exam, free bits) and capped interstitials at break points.
   Every step of the funnel is tracked (track → Firebase Analytics in the native app). Design and numbers: docs/PROFITABILITY.md ===== */
Object.assign(T.ar,{reviveT:'قلب إضافي وأعد السؤال',reviveOn:'عاد قلبك! أعد المحاولة',reviveTok:'رمز إنعاش',reviveTokB:'قلب إضافي في معركة وحش أو بوابة',examTok:'تذكرة امتحان',examTokB:'امتحان تجريبي إضافي اليوم',
  coinPacks:'حزم البتات',trial7:'7 أيام مجانًا',startTrial:'ابدأ التجربة المجانية',thenPrice:'ثم {p} سنويًا. يمكنك الإلغاء في أي وقت قبل انتهاء التجربة من إعدادات App Store.',
  freeCol:'مجاني',proCol:'PRO',rowMods:'الوحدات',rowLabs:'المختبرات',rowGates:'بوابات الفصول',rowExams:'الامتحانات التجريبية',rowTalk:'محادثات العمل',rowAds:'الإعلانات',rowBits:'مكافأة البتات',rowRevive:'إنعاش في المعارك',
  perDay:'/يوم',unlimited:'بلا حدود',yes:'نعم',noAds:'بلا إعلانات',everyFight:'كل معركة',adOrToken:'إعلان أو رمز',examLimitT:'استخدمت امتحان اليوم',examLimitB:'اختر طريقة لامتحان إضافي:',
  useTicket:'استخدم تذكرة',buyTicket:'اشترِ تذكرة',watchFor:'شاهد إعلانًا',adsLeft:'متبقٍ اليوم',bestDeal:'الأكثر توفيرًا',popular:'الأكثر شيوعًا',buyFail:'لم تكتمل عملية الشراء.',
  unlockAll:'افتح المسار كاملًا',pwModule:'هذه الوحدة جزء من PRO',pwGate:'بوابات الفصول المتقدمة في PRO',pwMilestone:'أنهيت 3 وحدات! تابع بلا حدود',pwExam:'امتحانات بلا حدود مع PRO',pwLab:'هذا المختبر جزء من PRO'});
Object.assign(T.en,{reviveT:'Extra heart and retry',reviveOn:'Heart restored! Try that one again',reviveTok:'Revive token',reviveTokB:'An extra heart in a boss or gate fight',examTok:'Exam ticket',examTokB:'One extra practice exam today',
  coinPacks:'Bit packs',trial7:'7 days free',startTrial:'Start free trial',thenPrice:'Then {p} per year. Cancel any time before the trial ends in App Store settings.',
  freeCol:'Free',proCol:'PRO',rowMods:'Modules',rowLabs:'Labs',rowGates:'Chapter gates',rowExams:'Practice exams',rowTalk:'Workplace conversations',rowAds:'Ads',rowBits:'Bits rewards',rowRevive:'Revive in fights',
  perDay:'/day',unlimited:'Unlimited',yes:'Yes',noAds:'No ads',everyFight:'Every fight',adOrToken:'Ad or token',examLimitT:'You used today’s exam',examLimitB:'Pick a way to take another one:',
  useTicket:'Use a ticket',buyTicket:'Buy a ticket',watchFor:'Watch an ad',adsLeft:'left today',bestDeal:'Best deal',popular:'Most popular',buyFail:'The purchase did not go through.',
  unlockAll:'Unlock the whole path',pwModule:'This module is part of PRO',pwGate:'Advanced chapter gates are part of PRO',pwMilestone:'3 modules done! Keep going without limits',pwExam:'Unlimited exams with PRO',pwLab:'This lab is part of PRO'});
const PLAN2={rewardedPerDay:5,reviveTok:40,examTok:80,freeze:60,packs:[['coins_c1',600,'c1'],['coins_c2',1500,'c2',.25],['coins_c3',3500,'c3',.45]]};
Object.assign(PRICES.ar,{c1:'7.99 ر.س',c2:'14.99 ر.س',c3:'29.99 ر.س'}); Object.assign(PRICES.en,{c1:'$1.99',c2:'$3.99',c3:'$7.99'});
const trialOk=()=>window.__trialOk!==false;
const PW_SRC={module:'pwModule',next:'pwModule',gate:'pwGate',milestone:'pwMilestone',exam:'pwExam',lab:'pwLab'};
/* ---------- paywall: Free vs PRO, yearly with a 7-day trial (when Apple says the learner is eligible) ---------- */
function paywall(src='other'){ track('paywall_view',{src}); let plan='pro_yearly';
  const rows=[['rowMods','6','24'],['rowLabs',isAr()?'محدودة':'Starter',t('unlimited')],['rowGates','2','8'],['rowExams','1'+t('perDay'),t('unlimited')],['rowTalk','1',t('unlimited')],['rowRevive',t('adOrToken'),t('everyFight')],['rowBits','×1','×1.5'],['rowAds',t('yes'),t('noAds')]];
  const plans=()=>[['pro_yearly',t('yearly'),price('yearly'),`≈ ${price('yearlyPm')}${t('perMonth')}`,trialOk()?t('trial7'):t('best')],['pro_monthly',t('monthly'),price('monthly'),'',''],['pro_lifetime',t('lifetime'),price('lifetime'),isAr()?'دفعة واحدة':'One payment','']];
  const cta=()=>plan==='pro_yearly'&&trialOk()?t('startTrial'):t('subscribe');
  const fine=()=>plan==='pro_yearly'&&trialOk()?t('thenPrice').replace('{p}',price('yearly')):plan==='pro_lifetime'?(isAr()?'شراء لمرة واحدة، بلا اشتراك.':'One-time purchase, no subscription.'):t('cancelAny');
  sheet(`<div class="pwhero ondark"><div class="moon sm">${dragon('cool',74)}</div><div class="col" style="gap:4px;min-width:0"><span class="eyebrow">${PW_SRC[src]?t(PW_SRC[src]):t('unlockAll')}</span><h2>${t('payT')}</h2><p class="sub" style="margin:0">${t('payB')}</p></div></div>
    <div class="cmp" role="table"><div class="cmph" role="row"><span></span><span>${t('freeCol')}</span><span class="pro">${t('proCol')}</span></div>${rows.map(([k,a,b])=>`<div role="row"><span>${t(k)}</span><span class="num">${a}</span><span class="num pro">${b}</span></div>`).join('')}</div>
    <div class="col" style="gap:8px" id="pl">${plans().map(([id,n,p,sub,tag])=>`<button class="plan" data-p="${id}" aria-pressed="${id===plan}"><div class="grow"><b>${n}</b>${sub?`<div class="sub">${sub}</div>`:''}</div>${tag?`<span class="ptag">${tag}</span>`:''}<b class="num">${p}</b></button>`).join('')}</div>
    <button class="btn block" id="buy">${cta()}</button><div class="sub fineprint" id="fp" style="text-align:center">${fine()}${RN?'':' · '+t('demo')}</div>
    <div class="row" style="justify-content:center;gap:16px"><button class="link" id="rs">${t('restore')}</button><button class="link" id="tm">${t('terms2')}</button><button class="link" id="pv">${t('privacy')}</button></div>`,el=>{
    $$('.plan',el).forEach(b=>b.onclick=()=>{ plan=b.dataset.p; $$('.plan',el).forEach(x=>x.setAttribute('aria-pressed',x===b)); $('#buy',el).textContent=cta(); $('#fp',el).textContent=fine()+(RN?'':' · '+t('demo')); SFX.tap(); });
    $('#buy',el).onclick=async()=>{ const b=$('#buy',el); b.disabled=true; track('purchase_start',{plan,src}); const r=await purchase(plan); b.disabled=false;
      if(r&&!r.ok&&!r.cancelled) toast(t('buyFail'));
      if(r&&r.ok&&r.active){ track(plan==='pro_yearly'&&trialOk()?'trial_start':'purchase',{plan,src}); if(!RN){ S.pro=true; save(); } closeSheet(); SFX.win(); confetti(140); fireworks(4); toast(t('proOn')); render(); } };
    $('#rs',el).onclick=async()=>{ const r=await restorePurchases(); toast(r&&r.active?t('proOn'):(isAr()?'لا توجد مشتريات':'No purchases found')); };
    $('#tm',el).onclick=()=>openUrl(LEGAL.terms); $('#pv',el).onclick=()=>openUrl(LEGAL.privacy); }); }
/* ---------- break points: first module → sign-up offer; third module → one milestone paywall; otherwise a capped interstitial ---------- */
async function breakPoint(kind,nav){ const done=MODS.filter(x=>modDone(x.k)).length;
  if(!S.user&&!S.askedLogin&&done>=1){ nav(); accountSheet(); return; }
  if(!S.pro&&done>=3&&!S.pwMile){ S.pwMile=1; save(); nav(); paywall('milestone'); return; }
  await interstitial(); nav(); }
/* ---------- rewarded ads: always the learner's choice, capped per day ---------- */
function rewardedLeft(){ return Math.max(0,PLAN2.rewardedPerDay-dayCount('rwDay').n); }
async function rewardedAd(placement){ if(!rewardedLeft()){ toast(isAr()?'انتهت إعلانات المكافأة لليوم':'No more reward ads today'); return false; }
  const ok=await rewarded(placement); if(ok){ dayCount('rwDay').n++; save(); } return ok; }
/* ---------- revive in boss / gate fights: PRO free, else a token, else a rewarded ad ---------- */
const reviveLabel=()=>S.pro?'PRO':(S.reviveTok||0)>0?`🎟 ${S.reviveTok}`:`🎬 ${t('watchFor')}`;
async function reviveUse(){ if(S.pro){ track('revive',{via:'pro'}); return true; }
  if((S.reviveTok||0)>0){ S.reviveTok--; save(); track('revive',{via:'token'}); return true; }
  const ok=await rewardedAd('revive'); if(ok) track('revive',{via:'ad'}); return ok; }
/* ---------- extra exam for free learners ---------- */
function examLimitSheet(tr){ sheet(`<h2>${t('examLimitT')}</h2><p class="sub" style="margin:0">${t('examLimitB')}</p>
  ${(S.examTok||0)>0?`<button class="btn block" id="ut">🎟 ${t('useTicket')} · <span class="num">${S.examTok}</span></button>`:`<button class="btn block" id="bt">🎟 ${t('buyTicket')} · ${coinHTML} <span class="num">${PLAN2.examTok}</span></button>`}
  ${rewardedLeft()?`<button class="btn ghost block" id="wa">🎬 ${t('watchFor')}</button>`:''}<button class="contcard tap" id="gp" style="text-align:start"><b>⚡ ${t('pwExam')}</b><span class="sub">${t('payB')}</span></button>`,s=>{
  const start=()=>{ closeSheet(); go('examrun',{tr}); };
  const ut=$('#ut',s); if(ut) ut.onclick=()=>{ S.examTok--; save(); track('exam_ticket',{via:'token'}); start(); };
  const bt=$('#bt',s); if(bt) bt.onclick=()=>{ if(spend(PLAN2.examTok)){ track('exam_ticket',{via:'bits'}); start(); } };
  const wa=$('#wa',s); if(wa) wa.onclick=async()=>{ if(await rewardedAd('exam')){ track('exam_ticket',{via:'ad'}); start(); } };
  $('#gp',s).onclick=()=>paywall('exam'); }); }
/* ---------- shop: spend bits, earn bits from a rewarded ad, buy bit packs, PRO ---------- */
function shop(){ const item=(id,ic,name,sub,cost,own)=>`<div class="card row" style="gap:12px"><span style="font-size:26px">${ic}</span><div class="grow"><b>${name}</b><div class="sub">${sub}${own!=null?` · <span class="num">${own}</span>`:''}</div></div><button class="btn sm" id="${id}">${coinHTML} ${cost}</button></div>`;
  track('shop_view');
  sheet(`<div class="row"><h2 class="grow">${t('shop')}</h2><span class="chip">${coinHTML}<span class="num" data-coins>${fmtK(S.coins)}</span></span></div>
  ${item('fz','🧊',t('freeze'),t('freezeB'),PLAN2.freeze,S.freezes||0)}${item('rt','❤️',t('reviveTok'),t('reviveTokB'),PLAN2.reviveTok,S.reviveTok||0)}${S.pro?'':item('et','🎟',t('examTok'),t('examTokB'),PLAN2.examTok,S.examTok||0)}
  ${S.pro?'':`<div class="card row" style="gap:12px"><span style="font-size:26px">🎬</span><div class="grow"><b>${t('watchAd')}</b><div class="sub">${t('adReward')} · <span class="num">${rewardedLeft()}</span> ${t('adsLeft')}</div></div><button class="btn sm ghost" id="ad" ${rewardedLeft()?'':'disabled'}>▶</button></div>`}
  <h3 style="margin:6px 0 0">${t('coinPacks')}</h3><div class="packs">${PLAN2.packs.map(([sku,n,k,bonus],i)=>`<button class="pack" data-sku="${sku}" data-n="${n}">${i===1?`<span class="ptag">${t('popular')}</span>`:i===2?`<span class="ptag">${t('bestDeal')}</span>`:''}<span class="pk">${'🪙'.repeat(i+1)}</span><b class="num">${fmt(n)}</b><span class="sub">${t('bitsCur')}</span><span class="pp num">${price(k)}</span></button>`).join('')}</div>
  ${S.pro?'':`<button class="contcard tap" id="gp" style="text-align:start"><b>⚡ ${t('payT')}</b><span class="sub">${t('payB')}</span>${trialOk()?`<span class="ptag" style="align-self:flex-start">${t('trial7')}</span>`:''}</button>`}`,el=>{
  const buyItem=(cost,fn,ev)=>()=>{ if(S.pro||S.coins>=cost){ if(!S.pro) S.coins-=cost; fn(); save(); updateTop(); SFX.coin(); track('shop_buy',{item:ev}); shop(); } else toast(t('notEnough')); };
  $('#fz',el).onclick=buyItem(PLAN2.freeze,()=>S.freezes=(S.freezes||0)+1,'freeze');
  $('#rt',el).onclick=buyItem(PLAN2.reviveTok,()=>S.reviveTok=(S.reviveTok||0)+1,'revive');
  const et=$('#et',el); if(et) et.onclick=buyItem(PLAN2.examTok,()=>S.examTok=(S.examTok||0)+1,'exam');
  const ad=$('#ad',el); if(ad) ad.onclick=async()=>{ closeSheet(); if(await rewardedAd('bits')){ addCoins(25); toast(t('adReward')); } };
  $$('.pack',el).forEach(b=>b.onclick=async()=>{ b.disabled=true; const sku=b.dataset.sku, n=+b.dataset.n; track('purchase_start',{plan:sku,src:'shop'}); const r=await purchase(sku); b.disabled=false;
    if(r&&r.ok){ S.coins+=n; save(); updateTop(); SFX.win(); confetti(60); track('purchase',{plan:sku,src:'shop'}); toast(`+${fmt(n)} ${t('bitsCur')}`); shop(); } else if(r&&!r.cancelled) toast(t('buyFail')); });
  const gp=$('#gp',el); if(gp) gp.onclick=()=>paywall('shop'); }); }
