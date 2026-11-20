/* ===== Me: progress, certificates, settings, PRO paywall, shop ===== */
SCREENS.me=m=>{ const r=rankOf(S.xp), nx=RANK_XP[r+1], labsN=Object.keys(S.labs).length+['phish','logs','review','ctf'].reduce((a,k)=>a+secSolved(k),0);
  const seg=(id,opts,cur)=>`<div class="seg" id="${id}">${opts.map(([v,l])=>`<button data-v="${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join('')}</div>`;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero"><span class="eyebrow">${t('profile')}</span><div class="row" style="gap:12px"><span class="sealchip">${RANK_ZH[r]}</span><h1 class="grow">${t('ranks')[r]}</h1></div>
    <div class="bar"><i style="width:${nx?Math.min(100,(S.xp-RANK_XP[r])/(nx-RANK_XP[r])*100):100}%"></i></div><div class="sub"><span class="num">${fmt(S.xp)}</span> ${t('xp')}${nx?` · ${t('ranks')[r+1]} <span class="num">${fmt(nx)}</span>`:''}</div></div>
  <div class="grid2"><div class="stat"><b class="num">${MODS.filter(x=>modDone(x.k)).length}/${MODS.length}</b><span>${t('statMods')}</span></div><div class="stat"><b class="num">${labsN}</b><span>${t('statLabs')}</span></div>
    <div class="stat"><b class="num">${Object.keys(S.srs).length}</b><span>${t('statTerms')}</span></div><div class="stat"><b class="num">${S.right||0}</b><span>${t('statQs')}</span></div></div>
  <div class="card col" style="gap:12px"><div class="row"><b class="grow">印章 · ${isAr()?'الأختام':'Seals'}</b><span class="sub num">${Object.keys(S.badges||{}).length}/${BADGES.length}</span></div><div class="seals">${BADGES.map(b=>sealHTML(b,!!(S.badges||{})[b[0]])).join('')}</div></div>
  <div class="card col" style="gap:10px"><b>🎓 ${t('certs')}</b>${['se','cy'].map(tr=>{ const d=TRACK(tr).filter(x=>modDone(x.k)).length, n=TRACK(tr).length; return `<button class="track ${tr}" data-c="${tr}"><span class="ti">${TRK[tr].ic}</span><div class="grow"><b>${TRK[tr].name()}</b><div class="bar ${tr}" style="margin-top:6px"><i style="width:${d/n*100}%"></i></div></div><span class="sub num">${d}/${n}</span></button>`; }).join('')}</div>
  ${accountCard()}
  ${S.pro?`<div class="card row"><span class="chip pro">PRO</span><span class="grow">${t('proOn')}</span></div>`:`<button class="contcard tap" id="gp" style="text-align:start"><b style="font-size:18px">⚡ ${t('payT')}</b><span class="sub">${t('payB')}</span><span class="btn block">${t('getPro')}</span></button>`}
  <h2>${t('settings')}</h2>
  <div class="card col" style="gap:14px">
    <div class="col" style="gap:6px"><b>${t('language')}</b>${seg('lng',[['ar','العربية'],['en','English']],S.lang)}</div>
    <div class="col" style="gap:6px"><b>${t('theme')}</b>${seg('thm',[['dark','🌙 '+t('dark')],['light','☀️ '+t('light')]],S.theme==='light'?'light':'dark')}</div>
    <div class="col" style="gap:6px"><b>${t('dailyGoal')}</b>${seg('gl',[[20,'20'],[30,'30'],[50,'50'],[80,'80']],S.goal)}</div>
    <div class="col" style="gap:6px"><b>${t('voiceSpeed')}</b>${seg('vsp',[['slow',t('slow')],['normal',t('normal')],['fast',t('fast')]],S.vSpeed||'normal')}<button class="btn ghost sm" id="vt" style="align-self:flex-start">🔊 网络安全</button></div>
    <div class="col" style="gap:6px"><b>${isAr()?'حجم النص':'Text size'}</b>${seg('fs',[['1',isAr()?'عادي':'Standard'],['1.15',isAr()?'كبير':'Large'],['1.3',isAr()?'كبير جدًا':'Extra large']],String(+S.fs||1))}</div>
    <div class="col" style="gap:6px"><b>${isAr()?'صوتك في المحادثات':'Your voice in conversations'}</b>${seg('myv',[['m',isAr()?'رجل':'Male'],['f',isAr()?'امرأة':'Female']],S.myVoice==='f'?'f':'m')}</div>
    <div class="col" style="gap:6px"><b>🎵 ${isAr()?'موسيقى الغوجنغ':'Guzheng music'}</b>${seg('mus',[['off',t('off')],['low',isAr()?'هادئة':'Low'],['mid',isAr()?'متوسطة':'Medium']],S.music===false?'off':(S.mv||'low'))}</div>
    <div class="col" style="gap:6px"><b>${t('sound')}</b>${seg('snd',[['1',t('on')],['0',t('off')]],S.sound?'1':'0')}</div>
    <div class="col" style="gap:6px"><b>${t('reminder')}</b>${seg('rem',[['0',t('off')],['9','09:00'],['20','20:00']],S.remind||'0')}</div>
  </div>
  <div class="card col" style="gap:4px">${[['rs','restore'],['pv','privacy'],['tm','terms2'],['sp','support']].concat(window.__adPrivacy?[['ap','adPrivacy']]:[]).map(([id,k])=>`<button class="link" id="${id}" style="text-align:start">${t(k)}</button>`).join('<hr>')}</div>
  <button class="btn danger block" id="rz">${t('resetAll')}</button><div class="sub" style="text-align:center">Cipher Path 1.0 · Kinzhal</div><div class="sub" style="text-align:center;font-size:11px">${isAr()?'الموسيقى: غوجنغ حقيقي مسجّل (Pufermufin على Freesound، رخصة CC0)':'Music: real recorded guzheng (Pufermufin on Freesound, CC0)'}</div>`);
  const segBind=(id,fn)=>$$(`#${id} button`,m).forEach(b=>b.onclick=()=>{ SFX.tap(); fn(b.dataset.v); });
  segBind('lng',v=>{ S.lang=v; save(); render(); }); segBind('thm',v=>{ if((S.theme==='light'?'light':'dark')!==v) toggleTheme(); render(); });
  segBind('gl',v=>{ S.goal=+v; save(); render(); }); segBind('vsp',v=>{ S.vSpeed=v; save(); render(); speak('网络安全'); }); segBind('fs',v=>{ S.fs=+v; save(); applyTextSize(); render(); }); segBind('myv',v=>{ S.myVoice=v; save(); render(); speak('你好，我是新来的工程师。',{voice:myVoice()}); }); segBind('mus',v=>{ musSet(v); render(); }); segBind('snd',v=>{ S.sound=v==='1'; save(); render(); });
  segBind('rem',v=>{ S.remind=v; save(); render(); if(RN&&v!=='0') native('notify:permission',{}).then(r=>{ if(r&&r.granted) native('notify:schedule',{items:[{id:'daily',repeat:'daily',hour:+v,minute:0,title:'Cipher Path',body:isAr()?'5 دقائق اليوم تحافظ على سلسلتك 🔥':'5 minutes today keeps your streak going 🔥'}]}); }); else if(RN) native('notify:schedule',{items:[]}); });
  $('#vt',m).onclick=()=>speak('网络安全');
  $$('[data-c]',m).forEach(b=>b.onclick=()=>go('track',b.dataset.c));
  const gp=$('#gp',m); if(gp) gp.onclick=()=>paywall('me'); bindAccount(m);
  $('#rs',m).onclick=async()=>{ const r=await restorePurchases(); toast(r&&r.active?t('proOn'):(isAr()?'لا توجد مشتريات':'No purchases found')); };
  $('#pv',m).onclick=()=>openUrl(LEGAL.privacy); $('#tm',m).onclick=()=>openUrl(LEGAL.terms); $('#sp',m).onclick=()=>openUrl(LEGAL.support);
  const ap=$('#ap',m); if(ap) ap.onclick=()=>RN&&native('ads:privacy',{});
  let armed=false; $('#rz',m).onclick=()=>{ if(!armed){ armed=true; toast(t('resetQ')); return; } const keep={lang:S.lang,theme:S.theme,pro:S.pro}; S=Object.assign({},DEFAULT,keep,{srs:{},mods:{},labs:{},sec:{},talk:{},exams:{}}); save(); go('home'); }; };

