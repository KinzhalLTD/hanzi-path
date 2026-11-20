/* ===== Teams & classes (shared by Hanzi Path and Cipher Path; keep both copies identical): a learner joins a company
   or school licence with a code; the seat gives PRO (granted natively from org_members, never by this page) and the
   learner's progress summary appears on the team dashboard (dashboard/index.html). docs/TEAMS.md ===== */
const MAPP=typeof bao==='function'?'hp':'cp';
{ const _fn=window.__fromNative; window.__fromNative=m=>{ try{ const x=typeof m==='string'?JSON.parse(m):m; if(x&&x.type==='org'){ m=x; S.org=m.org&&m.org.id?m.org:null; save(); if(['me','home'].includes(route.name)) render(); teamPush(true); return; } }catch(e){} return _fn&&_fn(m); }; }
function teamSummary(){ const b={xp:S.xp||0,streak:S.streak||0,last:today(),certs:(typeof certEarned==='function'?certEarned().length:0)};
  try{ if(MAPP==='hp'){ b.level=curLevel(); b.words=Object.keys(S.srs||{}).length; const ms=S.mocks||{}; b.mock=Object.keys(ms).map(l=>({l:+l,best:Math.max(...ms[l].map(x=>x.score))})).sort((a,c)=>c.l-a.l)[0]||null; b.talk=Object.keys(S.talk||{}).length; }
    else { b.mods=MODS.filter(x=>modDone(x.k)).length; b.labs=Object.keys(S.labs||{}).length; b.gates=Object.values(S.gates||{}).filter(g=>g&&g.ok).length; if(typeof careerScore==='function'){ b.soc=careerScore('soc').pct; b.dev=careerScore('dev').pct; } } }catch(e){}
  return b; }
let teamPushed=0;
function teamPush(force){ if(!RN||!S.org||!S.user) return; if(!force&&Date.now()-teamPushed<10*60e3) return; teamPushed=Date.now(); native('org:push',{summary:teamSummary()}); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) teamPush(true); });
setInterval(()=>teamPush(false),60e3);
async function teamCall(action,payload){ if(!RN){ await new Promise(r=>setTimeout(r,300));
    if(action==='join'){ if(String(payload.code||'').replace(/\W/g,'').length<6) return {ok:false,error:'code'}; S.org={id:'demo',name:isAr()?'فريق تجريبي':'Demo team',active:true,demo:true}; save(); return {ok:true,org:S.org}; }
    if(action==='leave'){ S.org=null; save(); return {ok:true}; } return {ok:true}; }
  if(!S.user) return {ok:false,error:'signin'}; return native('org:call',{action,payload}); }
function teamSheet(){ const ar=isAr(), o=S.org;
  sheet(o?`<div class="col" style="gap:12px;align-items:center;text-align:center"><span class="fbi" aria-hidden="true" style="font-size:44px">🏫</span><h2 style="margin:0">${esc(o.name||'')}</h2>
      <div class="sub">${o.active?(ar?'مقعدك في الترخيص فعّال: PRO مفعّل عبر جهتك.':'Your licence seat is active: PRO through your organisation.'):(ar?'انتهى ترخيص جهتك. تواصل مع مسؤولها.':'Your organisation\'s licence has ended. Contact its admin.')}</div>
      <p class="sub" style="margin:0">${ar?'يرى مسؤول جهتك ملخص تقدّمك فقط (النقاط، السلسلة، المستوى أو الوحدات، الشهادات) ولا يرى إجاباتك أو رسائلك.':'Your organisation\'s admin sees only a progress summary (XP, streak, level or modules, certificates), never your answers or messages.'}</p>
      <button class="btn ghost block" id="tlv">${ar?'مغادرة الفريق':'Leave the team'}</button></div>`
    :`<div class="col" style="gap:12px"><div class="row" style="gap:10px"><span class="fbi" aria-hidden="true" style="font-size:40px">🏫</span><div class="grow"><h2 style="margin:0">${ar?'انضم إلى فصل أو شركة':'Join a class or company'}</h2><div class="sub">${ar?'أدخل الرمز الذي أعطاك إياه معلّمك أو مديرك.':'Enter the code your teacher or manager gave you.'}</div></div></div>
      <input class="certname" id="tcode" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="${ar?'مثال: K7M2Q9X':'e.g. K7M2Q9X'}" aria-label="${ar?'رمز الانضمام':'Join code'}" dir="ltr" style="text-transform:uppercase;letter-spacing:.2em;text-align:center;font-weight:700">
      <button class="btn block" id="tjoin">${ar?'انضم':'Join'}</button>
      <p class="sub" style="margin:0">${ar?'للجهات: تراخيص للشركات والمدارس مع لوحة متابعة للتقدّم. تواصل معنا من صفحة الدعم.':'For organisations: company and school licences with a progress dashboard. Contact us from the support page.'}</p></div>`,s=>{
    const lv=$('#tlv',s); if(lv) lv.onclick=async()=>{ lv.disabled=true; const r=await teamCall('leave',{}); if(r&&r.ok){ S.org=null; save(); track('team_leave'); closeSheet(); render(); toast(ar?'غادرت الفريق':'You left the team'); } else lv.disabled=false; };
    const jb=$('#tjoin',s); if(jb) jb.onclick=async()=>{ const code=$('#tcode',s).value.trim(); if(!code) return; jb.disabled=true;
      const r=await teamCall('join',{code,name:(S.user&&S.user.name)||S.certName||''}); jb.disabled=false;
      if(r&&r.ok){ track('team_join'); closeSheet(); confetti(80); toast((ar?'انضممت إلى ':'You joined ')+((r.org&&r.org.name)||'')); render(); return; }
      const e=r&&r.error; toast(e==='signin'?(ar?'سجّل الدخول أولًا':'Sign in first'):e==='code'?(ar?'الرمز غير صحيح':'That code is not valid'):e==='full'?(ar?'لا توجد مقاعد متبقية في هذا الترخيص':'No seats left in this licence'):e==='expired'?(ar?'انتهى هذا الترخيص':'This licence has ended'):(ar?'تعذّر الانضمام، حاول لاحقًا':'Could not join, try again later'));
      if(e==='signin'&&typeof accountSheet==='function') accountSheet(); }; }); }
{ const _tm2=SCREENS.me; SCREENS.me=(m,a)=>{ _tm2(m,a); try{ const anc=$('#carb',m)||$('#bizb',m)||$('#tutb',m)||$('#certb',m); if(!anc||$('#teamb',m)) return; const ar=isAr(), o=S.org;
  anc.insertAdjacentHTML('afterend',`<button class="card row fbanner" id="teamb"><span class="fbi" aria-hidden="true">🏫</span><div class="grow" style="text-align:start;min-width:0"><b>${o?esc(o.name||''):(ar?'انضم إلى فصل أو شركة':'Join a class or company')}</b><div class="sub">${o?(o.active?(ar?'PRO عبر ترخيص جهتك ✓':'PRO through your licence ✓'):(ar?'انتهى الترخيص':'Licence ended')):(ar?'لديك رمز من معلّم أو مدير؟':'Got a code from a teacher or manager?')}</div></div></button>`);
  $('#teamb',m).onclick=()=>{ SFX.tap(); teamSheet(); }; }catch(e){} }; }
