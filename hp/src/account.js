/* ===== Notifications (in-app inbox + native push scheduling) and accounts (Sign in with Apple / Google
   via Firebase in the native app, with cloud sync). The web build runs a clearly labelled demo. ===== */
/* ---------- notifications ---------- */
const NOTIF_DEFAULT={on:true,time:'20:00',cats:{reminder:true,streak:true,review:true,news:true}};
const nset=()=>{ S.notif=Object.assign({},NOTIF_DEFAULT,S.notif||{}); S.notif.cats=Object.assign({},NOTIF_DEFAULT.cats,S.notif.cats||{}); return S.notif; };
const NEWS=[['legends','📖','nLegends'],['code','💻','nCode'],['write','✍️','nWrite'],['music','🎶','nMusic']];
function inboxAdd(key,ic,title,body,to){ S.inbox=S.inbox||[]; if(S.inbox.some(x=>x.key===key)) return; S.inbox.unshift({key,ic,title,body,to,ts:Date.now(),read:false}); S.inbox=S.inbox.slice(0,40); }
function buildInbox(){ const n=nset(), d=today(), h=new Date().getHours();
  if(!S.inbox||!S.inbox.length) inboxAdd('welcome','👋','nWelcomeT','nWelcomeB',{name:'home'});
  if(n.cats.news) NEWS.forEach(([k,ic,key])=>inboxAdd('news-'+k,ic,key+'T',key+'B',{name:k==='legends'?'culture':k==='code'?'code':k==='write'?'writehub':'me'}));
  if(n.cats.streak&&S.streak>0&&S.lastActive!==d&&h>=17) inboxAdd('streak-'+d,'🔥','nStreakT','nStreakB',{name:'home'});
  if(n.cats.review&&dueIds().length>=5) inboxAdd('review-'+d,'📖','nReviewT','nReviewB',{name:'review'});
  if(S.chestDay!==d) inboxAdd('chest-'+d,'🎁','nChestT','nChestB',{name:'home'});
  save(); }
const unread=()=>(S.inbox||[]).filter(x=>!x.read).length;
const ntext=(k,vars={})=>t(k).replace(/\{(\w+)\}/g,(_,v)=>vars[v]??'');
function inboxSheet(){ buildInbox(); const vars={streak:S.streak,due:dueIds().length};
  sheet(`<div class="row"><h2 class="grow">🔔 ${t('notifications')}</h2><button class="btn ghost sm" id="mr">✓ ${t('markRead')}</button></div>
   <div class="col" style="gap:8px">${(S.inbox||[]).map((x,i)=>`<button class="card row inb ${x.read?'':'new'}" data-i="${i}"><span class="inbi">${x.ic}</span><div class="grow" style="text-align:start;min-width:0"><b>${esc(ntext(x.title,vars))}</b><div class="sub">${esc(ntext(x.body,vars))}</div><div class="sub" style="font-size:11px;opacity:.6">${new Date(x.ts).toLocaleString(isAr()?'ar':'en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>${x.read?'':'<i class="dot"></i>'}</button>`).join('')||`<div class="sub">—</div>`}</div>
   <button class="btn ghost block" id="ns">⚙ ${t('notifSettings')}</button>`,s=>{
    $$('.inb',s).forEach(b=>b.onclick=()=>{ const x=S.inbox[+b.dataset.i]; x.read=true; save(); closeSheet(); track('notif_open',{key:x.key}); go(x.to.name,x.to.arg); });
    $('#mr',s).onclick=()=>{ (S.inbox||[]).forEach(x=>x.read=true); save(); closeSheet(); render(); };
    $('#ns',s).onclick=()=>{ closeSheet(); go('me'); setTimeout(()=>{ const el=$('#notifset'); el&&el.scrollIntoView({behavior:'smooth'}); },300); }; }); }
/* push messages are written by Bao, in the learner's language */
function pushPlan(){ const n=nset(), [hh,mm]=n.time.split(':').map(Number), items=[];
  const lines=isAr()?['🥟 باو يشتاق إليك! درس صغير اليوم؟','🔥 سلسلتك {streak} يومًا… لا تدعها تنطفئ!','✍️ حرف واحد بخط يدك اليوم؟','🎤 قل «你好» وسأعطيك درجة!','🏮 قصة أسطورية جديدة تنتظرك']:['🥟 Bao misses you! A quick lesson today?','🔥 {streak}-day streak… don\'t let it go out!','✍️ One character by hand today?','🎤 Say 你好 and I\'ll score you!','🏮 A new legend is waiting for you'];
  if(n.on&&n.cats.reminder) items.push({id:'daily',repeat:'daily',hour:hh,minute:mm,title:'Hanzi Path 汉字之路',body:lines[daySeed()%lines.length].replace('{streak}',S.streak)});
  if(n.on&&n.cats.streak&&S.streak>0&&S.lastActive!==today()) items.push({id:'streak',at:new Date(new Date().setHours(21,30,0,0)).toISOString(),title:'🔥 '+S.streak,body:lines[1].replace('{streak}',S.streak)});
  if(n.on&&n.cats.review){ const next=Object.values(S.srs).map(r=>r.d).filter(x=>x>Date.now()).sort((a,b)=>a-b)[0]; if(next) items.push({id:'review',at:new Date(Math.max(next,Date.now()+36e5)).toISOString(),title:'复习 · '+t('review'),body:t('nReviewB').replace('{due}','')}); }
  return items; }
function scheduleNative(){ if(!RN) return; RN.postMessage(JSON.stringify({type:'notify:schedule',items:pushPlan()})); }
async function enablePush(){ const ok=await new Promise(res=>sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px">${bao('happy',90)}<h2>${t('pushAskT')}</h2><p style="margin:0">${t('pushAskB')}</p><button class="btn block" id="y">🔔 ${t('pushYes')}</button><button class="btn ghost block" id="n">${t('later')}</button></div>`,s=>{ $('#y',s).onclick=()=>{ closeSheet(); res(true); }; $('#n',s).onclick=()=>{ closeSheet(); res(false); }; }));
  if(!ok) return; track('push_soft_yes'); if(RN){ const r=await native('notify:permission',{}); S.pushOk=!!(r&&r.granted); save(); if(S.pushOk){ scheduleNative(); toast('🔔 '+t('pushOn')); } else toast(t('pushDenied')); } else toast(t('pushWeb')); }
/* ---------- accounts ---------- */
const AUTH_DEMO=!RN;
async function signIn(provider){ track('login_start',{provider}); let r;
  if(RN) r=await native('auth:'+provider,{});
  else r={ok:true,demo:true,user:{uid:'demo-'+provider,name:isAr()?'متعلّم تجريبي':'Demo learner',email:provider==='apple'?'private@privaterelay.appleid.com':'learner@gmail.com',provider}};
  if(!r||r.ok===false){ if(r&&r.cancelled) return; toast(t('loginFail')); return; }
  S.user=r.user; S.guest=false; save(); track('login_success',{provider}); toast(`✓ ${t('signedInAs')} ${r.user.name||r.user.email||''}`); await syncNow(true); render(); }
async function syncNow(pull){ if(!S.user) return; if(!RN){ S.syncedAt=Date.now(); save(); return; }
  if(pull){ const r=await native('sync:pull',{uid:S.user.uid}); if(r&&r.ok&&r.data&&(r.updatedAt||0)>(S.syncedAt||0)) mergeRemote(r.data); }
  const data=Object.assign({},S); delete data.inbox; delete data.user; delete data.pro; const w=await native('sync:push',{uid:S.user.uid,data,updatedAt:Date.now()}); if(w&&w.ok){ S.syncedAt=Date.now(); save(); } }
function mergeRemote(R){ const keepMax=['xp','lessons','games','pron','streak','freezes']; keepMax.forEach(k=>{ if(typeof R[k]==='number') S[k]=Math.max(S[k]||0,R[k]); });
  ['srs','units','written','code','codeCh','cult','book','best','wins','owned'].forEach(k=>{ if(R[k]&&typeof R[k]==='object'){ S[k]=Object.assign({},R[k],S[k]||{}); if(k==='srs') for(const id in R.srs){ if(!S.srs[id]||R.srs[id].b>S.srs[id].b) S.srs[id]=R.srs[id]; } } });
  if(!RN) S.pro=S.pro||!!R.pro; /* native: Pro is restored from the App Store, never from synced data */ S.coins=Math.max(S.coins||0,R.coins||0); save(); }
function signOut(){ if(RN) native('auth:signOut',{}); S.user=null; S.guest=true; save(); track('logout'); render(); }
function deleteAccount(){ sheet(`<h2>${t('delQ')}</h2><p style="margin:0">${t('delB')}</p><button class="btn red block" id="y">${t('delYes')}</button><button class="btn ghost block" id="n">${t('no')}</button>`,s=>{
  $('#n',s).onclick=closeSheet; $('#y',s).onclick=async()=>{ if(RN){ const r=await native('auth:delete',{uid:S.user&&S.user.uid}); if(!r||r.ok===false){ toast(t('loginFail')); return; } } track('account_deleted'); S.user=null; S.guest=true; save(); closeSheet(); toast(t('deleted')); render(); }; }); }
const APPLE_SVG='<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>';
const GOOGLE_SVG='<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>';
function loginButtons(){ return `<button class="btn block sso apple" data-sso="apple">${APPLE_SVG} ${t('withApple')}</button><button class="btn block sso google" data-sso="google">${GOOGLE_SVG} ${t('withGoogle')}</button>`; }
function bindLogin(root){ $$('[data-sso]',root).forEach(b=>b.onclick=async()=>{ closeSheet(); await signIn(b.dataset.sso); }); }
function accountSheet(first){ sheet(`<div class="col" style="align-items:center;text-align:center;gap:8px">${bao('wow',84)}<h2>${t('saveProgressT')}</h2><p class="sub" style="margin:0">${t('saveProgressB')}</p></div>
   ${loginButtons()}<button class="btn ghost block" id="guest">${t('guest')}</button>${AUTH_DEMO?`<div class="fine">${t('authDemo')}</div>`:''}<div class="fine">${t('authLegal')}</div>`,s=>{ bindLogin(s); $('#guest',s).onclick=()=>{ S.guest=true; save(); closeSheet(); track('login_skip'); }; }); }
function accountCard(){ const u=S.user;
  return `<div class="card col" id="acct" style="gap:10px"><div class="row"><h3 class="grow">👤 ${t('account')}</h3>${u?`<span class="soon">${u.provider==='apple'?'Apple':'Google'}</span>`:''}</div>
   ${u?`<div class="row" style="gap:12px"><div class="avatar">${esc((u.name||u.email||'?')[0].toUpperCase())}</div><div class="grow" style="min-width:0"><b>${esc(u.name||'')}</b><div class="sub" style="overflow:hidden;text-overflow:ellipsis">${esc(u.email||'')}</div><div class="sub">☁ ${t('synced')} ${S.syncedAt?new Date(S.syncedAt).toLocaleTimeString(isAr()?'ar':'en',{hour:'2-digit',minute:'2-digit'}):'—'}</div></div></div>
     <div class="row" style="gap:8px"><button class="btn ghost sm grow" id="sync">↺ ${t('syncNow')}</button><button class="btn ghost sm grow" id="out">${t('signOut')}</button></div><button class="btn ghost sm" id="del" style="color:var(--bad);align-self:flex-start">${t('deleteAccount')}</button>`
    :`<div class="sub">${t('saveProgressB')}</div>${loginButtons()}`}${AUTH_DEMO?`<div class="fine">${t('authDemo')}</div>`:''}</div>`; }
function bindAccount(m){ bindLogin(m); const q=x=>$(x,m); if(q('#sync')) q('#sync').onclick=async()=>{ await syncNow(true); toast('☁ '+t('synced')); render(); }; if(q('#out')) q('#out').onclick=signOut; if(q('#del')) q('#del').onclick=deleteAccount; }
function notifCard(){ const n=nset(); const times=['08:00','13:00','17:00','20:00','22:00'];
  return `<div class="card col" id="notifset" style="gap:12px"><div class="row"><h3 class="grow">🔔 ${t('notifications')}</h3><div class="seg" id="non"><button data-v="1" aria-pressed="${n.on}">${t('on')}</button><button data-v="0" aria-pressed="${!n.on}">${t('off')}</button></div></div>
   <div><div class="sub">${t('remindAt')}</div><div class="seg" id="ntime">${times.map(x=>`<button data-v="${x}" aria-pressed="${n.time===x}" class="num">${x}</button>`).join('')}</div></div>
   <div class="col" style="gap:6px">${Object.keys(NOTIF_DEFAULT.cats).map(k=>`<label class="row tog"><span class="grow">${t('nc_'+k)}</span><input type="checkbox" data-c="${k}" ${n.cats[k]?'checked':''}></label>`).join('')}</div>
   ${RN&&S.pushOk?'':`<button class="btn sm" id="push">🔔 ${t('pushEnable')}</button>`}</div>`; }
function bindNotif(m){ const n=nset(); const re=()=>{ save(); scheduleNative(); };
  $$('#non button',m).forEach(b=>b.onclick=()=>{ n.on=b.dataset.v==='1'; re(); render(); }); $$('#ntime button',m).forEach(b=>b.onclick=()=>{ n.time=b.dataset.v; re(); render(); });
  $$('[data-c]',m).forEach(c=>c.onchange=()=>{ n.cats[c.dataset.c]=c.checked; re(); }); const p=$('#push',m); if(p) p.onclick=enablePush; }
/* app open: build the inbox, reschedule pushes, offer sign-in once after a first lesson */
setTimeout(()=>{ try{ buildInbox(); scheduleNative(); if(S.user) syncNow(true); updateTop(); }catch(e){} },400);
