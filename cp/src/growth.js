const SALES=[["cny","20260213","20260303"],["ramadan","20260218","20260322"],["founding","20260220","20260223"],["school","20260815","20260831"],["national","20260920","20260924"],["white","20261125","20261130"],["cny","20270202","20270220"],["ramadan","20270208","20270311"],["founding","20270220","20270223"],["school","20270815","20270831"],["national","20270920","20270924"],["white","20271124","20271129"],["cny","20280122","20280209"],["ramadan","20280128","20280228"],["founding","20280220","20280223"],["school","20280815","20280831"],["national","20280920","20280924"],["white","20281122","20281127"],["ramadan","20290116","20290216"],["cny","20290209","20290227"],["founding","20290220","20290223"],["school","20290815","20290831"],["national","20290920","20290924"],["white","20291121","20291126"],["ramadan","20300105","20300206"],["cny","20300130","20300217"],["founding","20300220","20300223"],["school","20300815","20300831"],["national","20300920","20300924"],["white","20301127","20301202"],["ramadan","20301226","20310126"],["cny","20310119","20310206"],["founding","20310220","20310223"],["school","20310815","20310831"],["national","20310920","20310924"],["white","20311126","20311201"],["ramadan","20311215","20320116"],["cny","20320207","20320225"],["founding","20320220","20320223"],["school","20320815","20320831"],["national","20320920","20320924"],["white","20321124","20321129"],["ramadan","20321204","20330104"],["cny","20330127","20330214"],["founding","20330220","20330223"],["school","20330815","20330831"],["national","20330920","20330924"],["ramadan","20331123","20331225"],["white","20331123","20331128"],["cny","20340215","20340305"],["founding","20340220","20340223"],["school","20340815","20340831"],["national","20340920","20340924"],["ramadan","20341112","20341214"],["white","20341122","20341127"],["cny","20350204","20350222"],["founding","20350220","20350223"],["school","20350815","20350831"],["national","20350920","20350924"],["ramadan","20351101","20351203"],["white","20351121","20351126"]];
/* ===== Growth (shared by Hanzi Path and Cipher Path; keep the two copies identical): funnel events, paywall A/B test,
   seasonal sales, Kinzhal Pass (one subscription for both apps) and cross-promotion of the sister app.
   Design and owner steps: docs/GROWTH.md ===== */
const GAPP=typeof bao==='function'?'hp':'cp';
/* App Store links of both apps: paste the numeric Apple IDs once the apps exist in App Store Connect
   (until then the cross-promo card stays hidden and `npm run check:store` lists it). */
const APP_IDS={hp:'',cp:''};
const appUrl=k=>APP_IDS[k]?'https://apps.apple.com/app/id'+APP_IDS[k]:'';
/* ---------- funnel: install → day N → paywall → trial → paid. Every event carries the paywall variant and a stable client id ---------- */
(function growthBoot(){ try{
  if(!S.cid) S.cid=Date.now().toString(36)+Math.random().toString(36).slice(2,10);
  if(!S.pwv) S.pwv=Math.random()<.5?'a':'b';
  const d=today(); save();
  const _track=track; track=(ev,p={})=>_track(ev,Object.assign({v:S.pwv,app:GAPP,cid:S.cid},p));
  if(!S.inst){ S.inst=d; save(); track('first_open'); }
  if(S.lastOpenDay!==d){ S.lastOpenDay=d; save(); const n=Math.round((new Date(d)-new Date(S.inst))/864e5); track('active_day',{d:n});
    if(n===1||n===7||n===30) track('return_d'+n); }
}catch(e){} })();
/* ---------- seasonal sales (Saudi calendar; Chinese New Year only in Hanzi Path) ---------- */
const SALE_NAMES={ramadan:['🌙','عرض رمضان','Ramadan offer'],founding:['🇸🇦','عرض يوم التأسيس','Founding Day offer'],national:['🇸🇦','عرض اليوم الوطني','National Day offer'],
  school:['🎒','عرض العودة للدراسة','Back-to-school offer'],white:['🏷️','عرض الجمعة البيضاء','White Friday offer'],cny:['🧧','عرض رأس السنة الصينية','Chinese New Year offer']};
const ymdNow=()=>{ const d=new Date(); return ''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'); };
function saleNow(){ const k=ymdNow(); return SALES.find(s=>(s[0]!=='cny'||GAPP==='hp')&&k>=s[1]&&k<=s[2])||null; }
/* a sale is shown only when the discounted product really exists (native price loaded) – never a fake "% off" */
function saleOn(){ if(S.pro) return null; const s=saleNow(); if(!s) return null; const p=(window.__prices||{}).yearlySale||(!RN?(isAr()?'107.99 ر.س':'$28.99'):''); return p?{k:s[0],end:s[2],p}:null; }
const saleSku=sku=>sku==='pro_yearly'&&saleOn()?'pro_yearly_sale':sku;
const pnum=s=>{ const m=String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/,(?=\d{3}\b)/g,'').match(/\d+(?:[.,]\d+)?/); return m?parseFloat(m[0].replace(',','.')):NaN; };
const pfmt=(like,n)=>String(like).replace(/\d+(?:[.,]\d+)?/,n.toFixed(2));
function saleOff(){ const s=saleOn(); if(!s) return 0; const a=pnum(price('yearly')), b=pnum(s.p); return a>0&&b>0&&b<a?Math.round((1-b/a)*100):0; }
function saleBanner(){ const s=saleOn(); if(!s) return ''; const n=SALE_NAMES[s.k]||['🏷️','عرض','Offer'], off=saleOff(), ar=isAr();
  const end=new Date(+s.end.slice(0,4),+s.end.slice(4,6)-1,+s.end.slice(6,8)).toLocaleDateString(ar?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{day:'numeric',month:'long'});
  return `<div class="salebar"><span aria-hidden="true">${n[0]}</span><div class="grow"><b>${ar?n[1]:n[2]}${off?` · ${ar?'خصم':''} ${off}%${ar?'':' off'}`:''}</b><div class="sub">${ar?'على الاشتراك السنوي حتى':'on yearly, until'} ${end}</div></div></div>`; }
/* yearly price label: struck original + sale price during a sale; variant b adds the price per day */
function yearlyLabel(){ const s=saleOn(), ar=isAr(); let h=s?`<s class="was"><bdi>${price('yearly')}</bdi></s> <bdi>${s.p}</bdi>`:price('yearly');
  if(S.pwv==='b'){ const n=pnum(s?s.p:price('yearly')); if(n>0) h+=`<span class="perday">≈ <bdi>${pfmt(s?s.p:price('yearly'),n/365)}</bdi> ${ar?'يوميًا':'a day'}</span>`; }
  return h; }
/* ---------- Kinzhal Pass: both apps, one subscription (needs the shared sign-in to carry over) ---------- */
function passOn(){ return !!((window.__prices||{}).passYearly||!RN); }
function passCard(){ if(S.pro||!passOn()) return ''; const ar=isAr(), p=(window.__prices||{}).passYearly||(ar?'239.99 ر.س':'$63.99');
  return `<button class="passcard" id="pass"><span class="pseals" aria-hidden="true"><i>汉</i><i>码</i></span><div class="grow" style="text-align:start;min-width:0"><b>${ar?'باقة كينجال: التطبيقان معًا':'Kinzhal Pass: both apps'}</b>
    <div class="sub">${ar?'PRO في «مسار هانزي» و«مسار الشيفرة» باشتراك واحد':'PRO in Hanzi Path and Cipher Path with one subscription'}</div></div><span class="num pprice">${p}<span class="sub">${ar?'/سنة':'/yr'}</span></span></button>`; }
async function buyPass(){ track('purchase_start',{plan:'pass_yearly'}); const r=await purchase('pass_yearly');
  if(r&&!r.ok&&!r.cancelled) toast(t('buyFail'));
  if(r&&r.ok&&r.active){ track('purchase',{plan:'pass_yearly'}); if(!RN){ S.pro=true; save(); } closeSheet(); confetti(140); toast(isAr()?'باقة كينجال مفعّلة 🎉':'Kinzhal Pass is on 🎉'); render();
    if(!S.user&&typeof accountSheet==='function') setTimeout(()=>{ toast(isAr()?'سجّل الدخول بالحساب نفسه في التطبيق الآخر لتفعيل الباقة هناك':'Sign in with the same account in the other app to use the pass there'); accountSheet(); },900); } }
/* decorate whichever paywall the app has: sale banner on top, pass card under the plans */
{ const _pw=paywall; paywall=(...a)=>{ _pw(...a); try{ const sh=document.querySelector('.sheet .rise'); if(!sh) return; const sb=saleBanner(); if(sb){ const g=sh.querySelector('.grab'); (g||sh.firstChild).insertAdjacentHTML(g?'afterend':'beforebegin',sb); track('sale_view',{sale:saleOn().k}); }
  const pc=passCard(); const anchor=sh.querySelector('#buy'); if(pc&&anchor){ anchor.insertAdjacentHTML('afterend',`<div class="ordiv"><span>${isAr()?'أو':'or'}</span></div>`+pc); const b=sh.querySelector('#pass'); b.onclick=()=>{ SFX.tap(); buyPass(); }; } }catch(e){ console.warn('growth',e); } }; }
/* ---------- cross-promotion: sometimes the sister app instead of an ad (free users, at most once every 3 days) ---------- */
const OTHER=GAPP==='hp'?{k:'cp',seal:'码',zh:'码道',ar:'مسار الشيفرة',en:'Cipher Path',pa:'هندسة البرمجيات والأمن السيبراني بالعربية والإنجليزية، مع مسار صيني لكل موضوع.',pe:'Software engineering and cybersecurity in Arabic and English, with Chinese for every topic.'}
  :{k:'hp',seal:'汉',zh:'汉字之路',ar:'مسار هانزي',en:'Hanzi Path',pa:'تعلّم الصينية من الصفر حتى HSK 6: كلمات، كتابة، قواعد، ومحادثات بصوت حقيقي.',pe:'Learn Chinese from zero to HSK 6: words, writing, grammar and real-voice conversations.'};
function promoDue(){ if(S.pro||!appUrl(OTHER.k)) return false; const last=S.promoAt||0; return Date.now()-last>3*864e5&&(S.adCount||0)%5===4; }
function promoSheet(){ S.promoAt=Date.now(); save(); track('promo_view',{to:OTHER.k}); const ar=isAr();
  return new Promise(res=>sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px"><div class="seal promoseal">${OTHER.seal}</div><span class="eyebrow">${ar?'من صنّاع هذا التطبيق':'From the makers of this app'}</span>
    <h2 style="margin:0">${ar?OTHER.ar:OTHER.en} <span class="han">${OTHER.zh}</span></h2><p style="margin:0;line-height:1.7">${ar?OTHER.pa:OTHER.pe}</p>
    <button class="btn block" id="pget">${ar?'احصل عليه مجانًا':'Get it free'}</button><button class="btn ghost block" id="pno">${ar?'ليس الآن':'Not now'}</button></div>`,s=>{
    $('#pget',s).onclick=()=>{ track('promo_click',{to:OTHER.k}); openUrl(appUrl(OTHER.k)); closeSheet(); res(); }; $('#pno',s).onclick=()=>{ closeSheet(); res(); }; })); }
{ const _int=interstitial; interstitial=(...a)=>{ if(promoDue()){ S.adCount=(S.adCount||0)+1; save(); return promoSheet(); } return _int(...a); }; }
