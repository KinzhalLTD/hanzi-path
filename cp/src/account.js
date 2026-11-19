/* ===== Accounts: Sign in with Apple / Google (Firebase Auth in the native app) with cloud sync of progress
   (Firestore document cipher_users/{uid}). Same design as Hanzi Path. Guests can use everything; signing in only adds
   backup and sync across devices. The web preview runs a clearly labelled demo. PRO is never taken from synced data
   in the native app: it comes only from the App Store (RevenueCat), which follows the account through linkUser. ===== */
Object.assign(T.ar,{account:'الحساب',saveProgressT:'احفظ تقدّمك',saveProgressB:'سجّل الدخول لحفظ تقدّمك في السحابة ومزامنته بين أجهزتك.',withApple:'المتابعة باستخدام Apple',
  withGoogle:'المتابعة باستخدام Google',guest:'المتابعة كضيف',authDemo:'معاينة الويب: تسجيل دخول تجريبي، والتسجيل الحقيقي يعمل في تطبيق iPhone.',
  authLegal:'بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية.',signedInAs:'تم تسجيل الدخول باسم',loginFail:'تعذّر تسجيل الدخول، حاول مجددًا.',synced:'آخر مزامنة',
  syncNow:'زامن الآن',signOut:'تسجيل الخروج',deleteAccount:'حذف الحساب',delQ:'حذف الحساب؟',delB:'سيُحذف حسابك ونسخة تقدّمك في السحابة نهائيًا. يبقى تقدّمك على هذا الجهاز.',
  delYes:'نعم، احذف حسابي',no:'لا',deleted:'تم حذف الحساب',signUpT:'أنشئ حسابك',signUpB:'حساب واحد يحفظ مستواك وأختامك وسلسلتك على كل أجهزتك.'});
Object.assign(T.en,{account:'Account',saveProgressT:'Save your progress',saveProgressB:'Sign in to back up your progress and sync it across your devices.',withApple:'Continue with Apple',
  withGoogle:'Continue with Google',guest:'Continue as guest',authDemo:'Web preview: demo sign-in. Real sign-in works in the iPhone app.',
  authLegal:'By continuing you agree to the Terms of Use and the Privacy Policy.',signedInAs:'Signed in as',loginFail:'Could not sign in. Please try again.',synced:'Last sync',
  syncNow:'Sync now',signOut:'Sign out',deleteAccount:'Delete account',delQ:'Delete your account?',delB:'Your account and its cloud copy of your progress are deleted for good. Progress on this phone stays.',
  delYes:'Yes, delete my account',no:'No',deleted:'Account deleted',signUpT:'Create your account',signUpB:'One account keeps your rank, seals and streak on all your devices.'});
const AUTH_DEMO=!RN;
async function signIn(provider){ track('login_start',{provider}); let r;
  if(RN) r=await native('auth:'+provider,{});
  else r={ok:true,demo:true,user:{uid:'demo-'+provider,name:isAr()?'متعلّم تجريبي':'Demo learner',email:provider==='apple'?'private@privaterelay.appleid.com':'learner@gmail.com',provider}};
  if(!r||r.ok===false){ if(r&&r.cancelled) return false; toast(t('loginFail')); return false; }
  S.user=r.user; S.guest=false; save(); track('login_success',{provider}); toast(`✓ ${t('signedInAs')} ${r.user.name||r.user.email||''}`); SFX.ok(); await syncNow(true); return true; }
/* what goes to the cloud: progress only (no PRO flag, no account object) */
function syncData(){ const d=Object.assign({},S); delete d.user; delete d.pro; delete d.guest; return d; }
async function syncNow(pull){ if(!S.user) return; if(!RN){ S.syncedAt=Date.now(); save(); return; }
  if(pull){ const r=await native('sync:pull',{uid:S.user.uid}); if(r&&r.ok&&r.data) mergeRemote(r.data); }
  const w=await native('sync:push',{uid:S.user.uid,data:syncData(),updatedAt:Date.now()}); if(w&&w.ok){ S.syncedAt=Date.now(); save(); } }
/* merge: keep the best of both devices */
function mergeRemote(R){ ['xp','coins','streak','freezes','right','bestCombo','hbCount','reviveTok','examTok'].forEach(k=>{ if(typeof R[k]==='number') S[k]=Math.max(S[k]||0,R[k]); });
  ['mods','labs','sec','talk','exams','badges','gates','days'].forEach(k=>{ if(R[k]&&typeof R[k]==='object') S[k]=Object.assign({},R[k],S[k]||{}); });
  if(R.mods) for(const k in R.mods){ const a=S.mods[k]||{}, b=R.mods[k]; S.mods[k]=Object.assign({},b,a,{stars:Math.max(a.stars||0,b.stars||0),Qb:Math.max(a.Qb||0,b.Qb||0)}); if(!a.done&&b.done) S.mods[k].done=b.done; }
  if(R.srs&&typeof R.srs==='object') for(const id in R.srs){ if(!S.srs[id]||R.srs[id].b>S.srs[id].b) S.srs[id]=R.srs[id]; }
  if(!RN) S.pro=S.pro||!!R.pro; save(); }
function signOut(){ if(RN) native('auth:signOut',{}); track('logout'); S.user=null; S.guest=true; save(); render(); }
function deleteAccount(){ sheet(`<h2>${t('delQ')}</h2><p style="margin:0">${t('delB')}</p><button class="btn danger block" id="y">${t('delYes')}</button><button class="btn ghost block" id="n">${t('no')}</button>`,s=>{
  $('#n',s).onclick=closeSheet; $('#y',s).onclick=async()=>{ if(RN){ const r=await native('auth:delete',{uid:S.user&&S.user.uid}); if(!r||r.ok===false){ toast(r&&r.needsRecentLogin?(isAr()?'سجّل الدخول من جديد ثم احذف الحساب.':'Sign in again, then delete the account.'):t('loginFail')); return; } }
    track('account_deleted'); S.user=null; S.guest=true; save(); closeSheet(); toast(t('deleted')); render(); }; }); }
const APPLE_SVG='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-4zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>';
const GOOGLE_SVG='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>';
/* Apple's button first (Apple design guidance), both the same size */
function loginButtons(){ return `<button class="sso apple" data-sso="apple">${APPLE_SVG}<span>${t('withApple')}</span></button><button class="sso google" data-sso="google">${GOOGLE_SVG}<span>${t('withGoogle')}</span></button>`; }
function bindLogin(root,after){ $$('[data-sso]',root).forEach(b=>b.onclick=async()=>{ b.disabled=true; const ok=await signIn(b.dataset.sso); b.disabled=false; if(ok){ closeSheet(); after?after():render(); } }); }
const legalLinks=()=>`<div class="fine">${t('authLegal')} <button class="link" data-lg="terms">${t('terms2')}</button> · <button class="link" data-lg="privacy">${t('privacy')}</button></div>`;
function bindLegal(r){ $$('[data-lg]',r).forEach(b=>b.onclick=()=>openUrl(LEGAL[b.dataset.lg])); }
/* sign-up sheet: offered once after the first module (or from Me) */
function accountSheet(){ track('login_prompt'); S.askedLogin=1; save();
  sheet(`<div class="col" style="align-items:center;text-align:center;gap:8px"><div class="moon">${dragon('happy',84)}</div><h2>${t('signUpT')}</h2><p class="sub" style="margin:0">${t('signUpB')}</p></div>
    <div class="col" style="gap:10px">${loginButtons()}</div><button class="btn ghost block" id="guest">${t('guest')}</button>${AUTH_DEMO?`<div class="fine">${t('authDemo')}</div>`:''}${legalLinks()}`,s=>{
    bindLogin(s); bindLegal(s); $('#guest',s).onclick=()=>{ S.guest=true; save(); closeSheet(); track('login_skip'); }; }); }
function accountCard(){ const u=S.user;
  return `<div class="card col" id="acct" style="gap:10px"><div class="row"><b class="grow">👤 ${t('account')}</b>${u?`<span class="tag">${u.provider==='apple'?'Apple':'Google'}</span>`:''}</div>
   ${u?`<div class="row" style="gap:12px"><div class="avatar">${esc((u.name||u.email||'?')[0].toUpperCase())}</div><div class="grow" style="min-width:0"><b>${esc(u.name||'')}</b><div class="sub" style="overflow:hidden;text-overflow:ellipsis">${esc(u.email||'')}</div><div class="sub">☁ ${t('synced')} ${S.syncedAt?new Date(S.syncedAt).toLocaleTimeString(isAr()?'ar':'en',{hour:'2-digit',minute:'2-digit'}):'—'}</div></div></div>
     <div class="row" style="gap:8px"><button class="btn ghost sm grow" id="sync">↺ ${t('syncNow')}</button><button class="btn ghost sm grow" id="out">${t('signOut')}</button></div><button class="link" id="del" style="color:var(--bad);align-self:flex-start">${t('deleteAccount')}</button>`
    :`<div class="sub">${t('saveProgressB')}</div><div class="col" style="gap:10px">${loginButtons()}</div>`}${AUTH_DEMO?`<div class="fine">${t('authDemo')}</div>`:''}</div>`; }
function bindAccount(m){ bindLogin(m); const q=x=>$(x,m); if(q('#sync')) q('#sync').onclick=async()=>{ await syncNow(true); toast('☁ '+t('synced')); render(); }; if(q('#out')) q('#out').onclick=signOut; if(q('#del')) q('#del').onclick=deleteAccount; }
/* app open: pull + push when signed in; sync again whenever the app goes to the background */
setTimeout(()=>{ try{ if(S.user) syncNow(true); }catch(e){} },500);
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S.user) try{ syncNow(false); }catch(e){} });
