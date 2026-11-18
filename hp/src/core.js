/* ---------- state ---------- */
const KEY='hanzipath.v2';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const DEFAULT={lang:null,goal:50,sound:true,xp:0,coins:100,todayXP:0,day:today(),streak:0,lastActive:null,freezes:0,srs:{},units:{},pro:false,
  plays:{},best:{},lessons:0,games:0,adCount:0,quests:{},chestDay:null,owned:{tiles_classic:1},tileStyle:'classic',wins:{},notify:{},gamesToday:0,lessonsToday:0,refCode:null};
let S=Object.assign({},DEFAULT);
try{const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(j) S=Object.assign(S,j);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function rollDay(){ const d=today(); if(S.day===d) return;
  // streak protection: if a day was missed and a freeze is owned, keep the streak
  const y=new Date(Date.now()-864e5); const yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
  if(S.lastActive&&S.lastActive!==yd&&S.lastActive!==d){ if(S.freezes>0){S.freezes--; S.lastActive=yd;} else S.streak=0; }
  S.day=d; S.todayXP=0; S.plays={}; S.quests={}; S.gamesToday=0; S.lessonsToday=0; save(); }
rollDay();
const t=k=>(T[S.lang||'en'][k]??T.en[k]??k);
const isAr=()=>S.lang==='ar';
function applyLang(){ try{applyHanFont();}catch(e){} document.documentElement.lang=S.lang||'en'; document.documentElement.dir=isAr()?'rtl':'ltr'; }
/* ---------- data ---------- */
const byLevel={}; W.forEach(w=>{(byLevel[w.l]=byLevel[w.l]||[]).push(w);});
const byId={}; W.forEach(w=>byId[w.id]=w);
const UNIT=10, FREE_SAMPLE_UNITS=2;
const unitsOf=l=>{const a=byLevel[l]||[],u=[];for(let i=0;i<a.length;i+=UNIT)u.push(a.slice(i,i+UNIT));return u;};
const unitFree=(l,i)=>S.pro||l===1||i<FREE_SAMPLE_UNITS;
const meaningList=w=>isAr()?(w.ar||w.en||[]):(w.en&&w.en.length?w.en:(w.ar||[]));
const meaning=(w,n=2)=>meaningList(w).slice(0,n).join(isAr()?'، ':'; ');
const meanIsFallback=w=>isAr()&&!w.ar;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mean=(w,n)=>meanIsFallback(w)?`<span class="ltr">${esc(meaning(w,n))}</span>`:`<span>${esc(meaning(w,n))}</span>`;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(a,n)=>shuffle(a).slice(0,n);
const learnedIds=()=>Object.keys(S.srs).map(Number);
const fmt=n=>Number(n).toLocaleString('en-US');
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
/* tones */
const TM={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'}; const UN={}; for(const v in TM)[...TM[v]].forEach((c,i)=>UN[c]=[v,i+1]);
const hasTone=p=>/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p);
function retone(py){ const ch=[...py]; const idx=ch.map((c,i)=>UN[c]?i:-1).filter(i=>i>=0); if(!idx.length) return null;
  const k=idx[Math.random()*idx.length|0]; const [v,tn]=UN[ch[k]]; let nt; do{nt=1+(Math.random()*4|0);}while(nt===tn); ch[k]=TM[v][nt-1]; return ch.join(''); }
function toneOptions(py){ const s=new Set([py]); let g=0; while(s.size<4&&g++<40){const r=retone(py); if(r) s.add(r);} return shuffle([...s]); }
/* ---------- native bridge (Expo WebView) with web fallbacks ---------- */
const RN=window.ReactNativeWebView; const pending={};
function native(type,payload){ return new Promise(res=>{ const id=Math.random().toString(36).slice(2); pending[id]=res; RN.postMessage(JSON.stringify({type,id,...payload})); setTimeout(()=>{ if(pending[id]){ pending[id]({ok:false,timeout:true}); delete pending[id]; } },120000); }); }
window.__fromNative=msg=>{ try{const m=typeof msg==='string'?JSON.parse(msg):msg; if(m.id&&pending[m.id]){pending[m.id](m); delete pending[m.id];} if(m.type==='pro'){ const was=!!S.pro; S.pro=!!m.active; save(); if(was!==S.pro){ if(S.pro) toast(t('proOn')); render(); } }
  if(m.type==='ads'){ window.__adPrivacy=!!m.privacy; }
  if(m.type==='prices'){ window.__prices=Object.assign({},window.__prices||{},m.prices||{}); window.__trialOk=m.trial!==false; }}catch(e){} };
function speak(text,rate=.8){ if(!S.sound) return; try{musDuck((1.4+text.length*.35)*.8/rate);}catch(e){} if(RN){ RN.postMessage(JSON.stringify({type:'speak',text,lang:'zh-CN',rate})); return; }
  try{const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=rate;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){} }
/* KPI events from the financial plan (Features sheet). The native app forwards them to analytics. */
const PLAN={freePron:5,adsPerDay:6,freeCodeUnits:3,freeSampleUnits:2,freePlays:3};
function track(ev,props={}){ try{ S.kpi=S.kpi||{}; S.kpi[ev]=(S.kpi[ev]||0)+1; if(RN) RN.postMessage(JSON.stringify({type:'track',ev,props})); }catch(e){} }
function dayCount(key){ const d=today(); S[key]=S[key]&&S[key].d===d?S[key]:{d,n:0}; return S[key]; }
function haptic(kind){ if(RN) RN.postMessage(JSON.stringify({type:'haptic',kind})); else if(navigator.vibrate) try{navigator.vibrate(kind==='error'?[30,40,30]:12);}catch(e){} }
function simAd(rewarded){ return new Promise(res=>{ const d=document.createElement('div'); d.className='adsim'; let n=rewarded?5:3;
  d.innerHTML=`<div class="sub">${t('ad')} · demo</div><div style="font:800 24px Inter">AdMob</div><div class="num" style="font-size:40px" id="adn">${n}</div><button class="btn ghost sm" id="adx" disabled>${t('close')}</button>`;
  document.body.appendChild(d); const iv=setInterval(()=>{n--; $('#adn',d).textContent=n; if(n<=0){clearInterval(iv); $('#adx',d).disabled=false;}},1000);
  $('#adx',d).onclick=()=>{d.remove(); res({ok:true});}; }); }
function interstitial(){ if(S.pro) return Promise.resolve(); S.adCount++; save(); if(S.adCount%2) return Promise.resolve(); const c=dayCount('adsDay'); if(c.n>=PLAN.adsPerDay) return Promise.resolve(); c.n++; save(); track('ad_shown',{format:'interstitial'}); return adWrap(RN?native('interstitial',{}):simAd(false)); }
/* music and voice pause while an ad plays, then fade back */
function adWrap(p){ try{ if(AC&&AC.state==='running') AC.suspend(); }catch(e){} return p.then(r=>{ try{ if(AC&&MUS.unlocked&&!document.hidden) AC.resume(); }catch(e){} return r; }); }
function rewarded(){ track('ad_rewarded'); return adWrap(RN?native('rewarded',{}):simAd(true)).then(r=>{ if(r&&r.unavailable) toast(t('adNone')); return !!(r&&r.ok!==false&&!r.unavailable); }); }
/* In the native app Pro comes ONLY from a verified App Store purchase (RevenueCat entitlement "pro"). The web preview simulates. */
function purchase(sku){ return RN?native('purchase',{sku}):Promise.resolve({ok:true,active:/^pro_/.test(sku),demo:true}); }
const LEGAL={terms:'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',privacy:'https://hanzi-path-64170.web.app/privacy.html'};
function openUrl(url){ if(RN) RN.postMessage(JSON.stringify({type:'openUrl',url})); else window.open(url,'_blank','noopener'); }
function restorePurchases(){ return RN?native('restore',{}):Promise.resolve({ok:false}); }
/* prices: the native app replaces these with localized App Store prices */
const PRICES={ar:{monthly:'29.99 ر.س',yearly:'179.99 ر.س',yearlyPm:'15 ر.س',lifetime:'449 ر.س',c1:'9.99 ر.س',c2:'19.99 ر.س',c3:'39.99 ر.س'},
  en:{monthly:'$7.99',yearly:'$47.99',yearlyPm:'$4.00',lifetime:'$119.99',c1:'$2.99',c2:'$5.99',c3:'$9.99'}};
const price=k=>(window.__prices&&window.__prices[k])||PRICES[S.lang||'en'][k];
/* ---------- sound ---------- */
let AC=null;
function tone(freq,dur,type='sine',vol=.12,delay=0){ if(!S.sound) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+delay; o.type=type; o.frequency.setValueAtTime(freq,t0);
  g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+.01); g.gain.exponentialRampToValueAtTime(.0001,t0+dur); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+dur+.05);}catch(e){} }
const SFX={ tap:()=>tone(660,.08,'triangle',.05),
  ok:()=>{tone(784,.18,'sine',.11);tone(1175,.28,'sine',.08,.08);},
  bad:()=>{tone(220,.22,'triangle',.1);tone(196,.25,'triangle',.08,.1);},
  win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.45,'sine',.1,i*.11)),
  gong:()=>{tone(98,1.8,'sine',.22);tone(147,1.4,'sine',.08,.02);tone(392,.9,'triangle',.04,.02);},
  coin:()=>{tone(1319,.09,'square',.04);tone(1760,.16,'square',.04,.07);} };
/* ---------- celebration fx ---------- */
function confetti(n=70){ const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;z-index:95;pointer-events:none'; c.width=innerWidth*devicePixelRatio; c.height=innerHeight*devicePixelRatio; document.body.appendChild(c);
  const x=c.getContext('2d'); x.scale(devicePixelRatio,devicePixelRatio); const cols=['#f7d894','#e8b65c','#d23a2f','#f3e9d6','#b9852c'];
  const P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.42,vx:(Math.random()-.5)*9,vy:-Math.random()*11-4,r:Math.random()*360,vr:(Math.random()-.5)*14,s:4+Math.random()*6,c:cols[Math.random()*cols.length|0],sh:Math.random()<.3}));
  let f=0; (function step(){ x.clearRect(0,0,innerWidth,innerHeight); P.forEach(p=>{p.vy+=.32;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr; x.save();x.translate(p.x,p.y);x.rotate(p.r*Math.PI/180);x.fillStyle=p.c;
    if(p.sh){x.font=`${p.s*3}px "Ma Shan Zheng",serif`;x.fillText('福',-p.s,p.s);} else x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); x.restore();});
    if(++f<120) requestAnimationFrame(step); else c.remove(); })(); }
function floatText(txt,el){ const r=el?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0}; const d=document.createElement('div');
  d.textContent=txt; d.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top}px;transform:translate(-50%,0);z-index:96;font:800 20px Inter;color:#f7d894;text-shadow:0 2px 10px rgba(0,0,0,.8);pointer-events:none;transition:transform .9s ease-out,opacity .9s`;
  document.body.appendChild(d); requestAnimationFrame(()=>{d.style.transform='translate(-50%,-60px)';d.style.opacity='0';}); setTimeout(()=>d.remove(),950); }
/* ---------- progress, coins, quests ---------- */
const rankOf=xp=>{let r=0; RANK_XP.forEach((v,i)=>{if(xp>=v) r=i;}); return r;};
function addXP(n){ rollDay(); const before=S.todayXP, r0=rankOf(S.xp); S.xp+=n; S.todayXP+=n; S.days=S.days||{}; S.days[today()]=1;
  const d=today(); if(S.lastActive!==d){ const y=new Date(Date.now()-864e5); const yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0'); S.streak=(S.lastActive===yd)?S.streak+1:1; S.lastActive=d; track('streak_day',{streak:S.streak}); }
  save(); if(before<S.goal&&S.todayXP>=S.goal){ toast('🎯 '+t('goalDone')); }
  const r1=rankOf(S.xp); if(r1>r0) setTimeout(()=>{ SFX.gong(); confetti(90); toast(`${t('rankUp')} ${RANK_HAN[r1]} · ${t('ranks')[r1]}`); },400); }
function addCoins(n){ const m=S.pro?Math.round(n*1.5):n; S.coins+=m; save(); SFX.coin(); return m; }
function spend(n){ if(S.pro) return true; if(S.coins<n){ toast(t('notEnough')); shop(); return false; } S.coins-=n; save(); updateTop(); return true; }
const QUESTS=[['q1',()=>S.lessonsToday>=1,30],['q2',()=>S.gamesToday>=2,30],['q3',()=>S.todayXP>=50,40]];
/* ---------- srs ---------- */
const INTERVALS=[0,1,2,4,7,15,30,60];
function srsMark(id,ok){ if(!ok){ S.wrong=S.wrong||{}; S.wrong[id]=(S.wrong[id]||0)+1; } const r=S.srs[id]||{b:0,d:0}; r.b=ok?Math.min(r.b+1,7):1; r.d=Date.now()+INTERVALS[r.b]*864e5; S.srs[id]=r; }
const dueIds=()=>Object.entries(S.srs).filter(([,r])=>r.d<=Date.now()).map(([k])=>+k);
const unitDone=(l,i)=>!!S.units[l+'-'+i];
function curUnit(l){ const u=unitsOf(l); for(let i=0;i<u.length;i++) if(!unitDone(l,i)) return i; return u.length; }
function curLevel(){ for(let l=1;l<=6;l++){ if(curUnit(l)<unitsOf(l).length) return l; } return 6; }
/* ---------- ui helpers ---------- */
function toast(msg){ $$('.toast').forEach(x=>x.remove()); const d=document.createElement('div'); d.className='toast rise'; d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),2400); }
let sheetEl=null;
function closeSheet(){ if(sheetEl){sheetEl.remove();sheetEl=null;} }
function sheet(html,bind){ closeSheet(); sheetEl=document.createElement('div'); sheetEl.className='sheet'; sheetEl.innerHTML=`<div class="rise"><div class="grab"></div>${html}</div>`;
  sheetEl.onclick=e=>{ if(e.target===sheetEl) closeSheet(); }; document.body.appendChild(sheetEl); bind&&bind(sheetEl.firstElementChild); }
const coinHTML='<span class="coin">金</span>';
const lampImg=()=>`<img class="lamp" src="${ART.lamp}" alt="">`;
/* ---------- router ---------- */
let route={name:'home'}; let cleanup=null;
/* navigation keeps a small history: going back to the previous screen (back button, tab of the parent list)
   restores where the learner was scrolled; every screen change gets a short enter animation (see feel.js) */
const NAV={stack:[]};
/* scroll a horizontal strip so el is centred (or at the start edge) without moving the page vertically; RTL-safe */
function hCenter(box,el,start){ if(!box||!el) return; try{ const b=box.getBoundingClientRect(), r=el.getBoundingClientRect();
  const d=start?(isAr()?r.right-b.right:r.left-b.left):(r.left+r.width/2)-(b.left+b.width/2); box.scrollBy({left:d,behavior:'auto'}); }catch(e){} }
function navKey(n,a){ return JSON.stringify([n,a===undefined?null:a]); }
function go(name,arg){ if(cleanup){try{cleanup();}catch(e){} cleanup=null;} $$('.feedback').forEach(f=>f.remove()); closeSheet();
  const st=NAV.stack, k=navKey(name,arg), top=st[st.length-1]; if(top) top.y=window.scrollY;
  let back=false, y=0;
  if(st.length>1&&st[st.length-2].k===k){ st.pop(); back=true; y=st[st.length-1].y||0; }
  else if(top&&top.k===k){ y=0; }
  else if(TABS.some(x=>x[0]===name)&&arg===undefined) NAV.stack=[{k,y:0}];
  else { st.push({k,y:0}); if(st.length>30) st.shift(); }
  route={name,arg}; render();
  if(y){ const sc=$('#app > .screen'); if(sc){ sc.classList.add('cvoff'); window.scrollTo(0,y); requestAnimationFrame(()=>sc.classList.remove('cvoff')); } else window.scrollTo(0,y); }
  else window.scrollTo(0,0);
  if(typeof screenEnter==='function') screenEnter(back); }
const TABS=[['home','家'],['dict','词'],['culture','文'],['games','戏'],['me','我']];
function updateTop(){ $$('[data-coins]').forEach(e=>e.textContent=fmt(S.coins)); $$('[data-xp]').forEach(e=>e.textContent=fmt(S.xp)); $$('[data-streak]').forEach(e=>e.textContent=S.streak); }
function topbar(){ return `<div class="topbar"><div class="logo"><div class="seal">汉</div><div class="wordmark"><b>HANZI PATH</b><span>${isAr()?'مسار هانزي':'汉字之路'}</span></div></div>
  <div class="chips"><button class="chip bellc" data-act="bell" aria-label="notifications">🔔${typeof unread==='function'&&unread()?`<i class="badge num">${unread()}</i>`:''}</button><button class="chip" data-act="mus" aria-label="music">${musVol()?'🎶':'🔇'}</button><button class="chip" data-act="streak">🔥 <span class="num" data-streak>${S.streak}</span></button><button class="chip" data-act="shop">${coinHTML} <span class="num" data-coins>${fmt(S.coins)}</span></button>${S.pro?'<span class="chip" style="color:var(--gold2)">PRO</span>':`<button class="chip" data-act="pro" style="color:#2a1a07;background:linear-gradient(180deg,var(--gold2),var(--gold3));border:0">PRO</button>`}</div></div>`; }
function bindTop(m){ $$('[data-act="shop"]',m).forEach(b=>b.onclick=shop); $$('[data-act="pro"]',m).forEach(b=>b.onclick=paywall);
  $$('[data-act="mus"]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); musicSheet(); });
  $$('[data-act="bell"]',m).forEach(b=>b.onclick=inboxSheet);
  $$('[data-act="streak"]',m).forEach(b=>b.onclick=checkinSheet); }
/* which tab owns a route (the tab bar stays mounted between screens; only its highlight changes) */
function tabOf(n){ return TABS.some(x=>x[0]===n)?n:['level','review','writehub','code','codeunit','talk','grammar','gpoint'].includes(n)?'home':['word','builder','sectors','sector','accents'].includes(n)?'dict':['section','recipe'].includes(n)?'culture':''; }
function render(){
  applyLang(); rollDay();
  const app=$('#app'); let tb=$('#app > .tabbar'); [...app.children].forEach(c=>{ if(c!==tb) c.remove(); });
  if(!S.lang){ if(tb) tb.remove(); SCREENS.onboard(app); musPlay('home'); return; }
  const full=['lesson','game','reader','recipe','write','placement','talkscene','gpractice'].includes(route.name);
  const m=document.createElement('main'); m.className='screen'+(full?' full':''); app.insertBefore(m,tb);
  if(!full){ m.insertAdjacentHTML('afterbegin','<div class="glow"></div>'); }
  (SCREENS[route.name]||SCREENS.home)(m,route.arg); bindTop(m);
  if(full){ if(tb) tb.remove(); }
  else {
    if(!tb||tb.dataset.lang!==S.lang){ if(tb) tb.remove(); tb=document.createElement('div'); tb.className='tabbar'; tb.dataset.lang=S.lang;
      tb.innerHTML=`<nav>${TABS.map(([k,h])=>`<button class="tab" data-k="${k}"><b>${h}</b>${t(k)}</button>`).join('')}</nav>`;
      app.appendChild(tb); $$('.tab',tb).forEach(b=>b.onclick=()=>{SFX.tap(); go(b.dataset.k);}); }
    const cur=tabOf(route.name); $$('.tab',tb).forEach(b=>{ if(b.dataset.k===cur) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  }
  musPlay(trackFor(route));
}
const SCREENS={};
