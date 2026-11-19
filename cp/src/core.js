/* ===== Core: state, theme, native bridge, rewards, sound, router (adapted from the Hanzi Path engine) ===== */
const KEY='cipherpath.v1';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const DEFAULT={lang:null,goal:30,sound:true,haptics:true,xp:0,coins:100,todayXP:0,day:today(),streak:0,lastActive:null,freezes:0,srs:{},mods:{},labs:{},sec:{},talk:{},
  pro:false,adCount:0,theme:'dark',vSpeed:'normal',focus:null,dailyDone:null,examDay:null,exams:{},right:0,hints:0,certName:''};
let S=Object.assign({},DEFAULT);
try{const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(j) S=Object.assign(S,j);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
/* theme: S.theme 'dark' (default) | 'light' → <html data-theme>, browser bar colour and the native status bar */
function applyTheme(){ const light=S.theme==='light'; const r=document.documentElement; if(light) r.dataset.theme='light'; else delete r.dataset.theme;
  let m=document.querySelector('meta[name="theme-color"]'); if(!m){ m=document.createElement('meta'); m.name='theme-color'; document.head.appendChild(m); } m.content=light?'#f6eddd':'#140b0a';
  try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:'theme',theme:light?'light':'dark'})); }catch(e){} }
function toggleTheme(){ S.theme=S.theme==='light'?'dark':'light'; save(); const r=document.documentElement; r.classList.add('theming'); applyTheme(); setTimeout(()=>r.classList.remove('theming'),420);
  $$('[data-act="theme"]').forEach(b=>{ b.innerHTML=ICON[S.theme==='light'?'moon':'sun']; b.setAttribute('aria-pressed',S.theme==='light'); }); return S.theme; }
applyTheme();
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function rollDay(){ const d=today(); if(S.day===d) return; const yd=ymd(new Date(Date.now()-864e5));
  if(S.lastActive&&S.lastActive!==yd&&S.lastActive!==d){ if(S.freezes>0){S.freezes--; S.lastActive=yd;} else S.streak=0; }
  S.day=d; S.todayXP=0; save(); }
rollDay();
const t=k=>(T[S.lang||'en'][k]??T.en[k]??k);
const isAr=()=>S.lang==='ar';
const L=(o,a='ar',e='en')=>isAr()?o[a]:o[e];
function applyLang(){ document.documentElement.lang=S.lang||'en'; document.documentElement.dir=isAr()?'rtl':'ltr'; }
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* inline `code` and paragraphs in lesson text (text is escaped first) */
const rich=s=>esc(s).split('\\n').join('\n').split('\n').map(p=>`<p>${p.replace(/`([^`]+)`/g,'<code>$1</code>')}</p>`).join('');
const inl=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(a,n)=>shuffle(a).slice(0,n);
const fmt=n=>Number(n).toLocaleString('en-US');
const fmtK=n=>{ n=Number(n)||0; const f=(v,u)=>(v>=100?Math.floor(v):Math.floor(v*10)/10)+u; return n<10000?fmt(n):n<1e6?f(n/1e3,'k'):f(n/1e6,'M'); };
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
/* deterministic random from a string (daily challenge, generated firewall rounds) */
function seeded(str){ let h=1779033703^str.length; for(let i=0;i<str.length;i++){ h=Math.imul(h^str.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return ()=>{ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); return ((h^=h>>>16)>>>0)/4294967296; }; }
/* ---------- icons (stroke SVG, currentColor) ---------- */
const svg=(d,w=24)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON={home:svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),learn:svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6M9 11h6"/>'),
  labs:svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>'),me:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  sun:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',16),
  moon:svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',16),flame:svg('<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',16),
  bit:svg('<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M10 9v6M14 9v6"/>',16),play:svg('<path d="M8 5v14l11-7z"/>',18),lock:svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',16)};
/* ---------- curriculum data ---------- */
const MODS=CURR; const MOD={}; MODS.forEach((m,i)=>{ MOD[m.k]=m; m.i=i; m.ti=MODS.filter(x=>x.tr===m.tr).indexOf(m); });
const TRACK=tr=>MODS.filter(m=>m.tr===tr);
const TERMS=[]; const byId={};
MODS.forEach((m,i)=>m.T.forEach((w,j)=>{ const o=Object.assign({id:1000+i*100+j,mod:m.k,tr:m.tr},w); TERMS.push(o); byId[o.id]=o; }));
const FREE_MODS=3, FREE_LABS=3, FREE_ROUNDS=3;
const modFree=m=>S.pro||m.ti<FREE_MODS;
const mst=k=>S.mods[k]||(S.mods[k]={});
const modDone=k=>!!(S.mods[k]&&S.mods[k].done);
const trackPct=tr=>{ const ms=TRACK(tr); return ms.filter(m=>modDone(m.k)).length/ms.length; };
const nextMod=tr=>TRACK(tr).find(m=>!modDone(m.k))||null;
/* ---------- native bridge (Expo WebView) with web fallbacks ---------- */
const RN=window.ReactNativeWebView; const pending={};
function native(type,payload){ return new Promise(res=>{ const id=Math.random().toString(36).slice(2); pending[id]=res; RN.postMessage(JSON.stringify({type,id,...payload})); setTimeout(()=>{ if(pending[id]){ pending[id]({ok:false,timeout:true}); delete pending[id]; } },120000); }); }
window.__fromNative=msg=>{ try{const m=typeof msg==='string'?JSON.parse(msg):msg; if(m.id&&pending[m.id]){pending[m.id](m); delete pending[m.id];}
  if(m.type==='pro'){ const was=!!S.pro; S.pro=!!m.active; save(); if(was!==S.pro){ if(S.pro) toast(t('proOn')); render(); } }
  if(m.type==='ads'){ window.__adPrivacy=!!m.privacy; }
  if(m.type==='prices'){ window.__prices=Object.assign({},window.__prices||{},m.prices||{}); }}catch(e){} };
function speak(text,opt){ return say(text,Object.assign({rate:.85},opt||{})); }
function musDuck(){}   /* voice.js hook: this app has no background music */
const PLAN={adsPerDay:6,freeExamsPerDay:1};
function track(ev,props={}){ try{ S.kpi=S.kpi||{}; S.kpi[ev]=(S.kpi[ev]||0)+1; if(RN) RN.postMessage(JSON.stringify({type:'track',ev,props})); }catch(e){} }
function dayCount(key){ const d=today(); S[key]=S[key]&&S[key].d===d?S[key]:{d,n:0}; return S[key]; }
function haptic(kind){ if(S.haptics===false) return; if(RN) RN.postMessage(JSON.stringify({type:'haptic',kind})); else if(navigator.vibrate) try{navigator.vibrate(kind==='error'?[30,40,30]:12);}catch(e){} }
function simAd(rewarded){ return new Promise(res=>{ const d=document.createElement('div'); d.className='adsim'; let n=rewarded?5:3;
  d.innerHTML=`<div class="sub">${t('ad')} · demo</div><div style="font:800 24px Inter">AdMob</div><div class="num" style="font-size:40px" id="adn">${n}</div><button class="btn ghost sm" id="adx" disabled>${t('close')}</button>`;
  document.body.appendChild(d); const iv=setInterval(()=>{n--; $('#adn',d).textContent=n; if(n<=0){clearInterval(iv); $('#adx',d).disabled=false;}},1000);
  $('#adx',d).onclick=()=>{d.remove(); res({ok:true});}; }); }
/* interstitials only at break points (end of a module, lab or game), every second time, at most 6 a day, never for PRO */
function interstitial(){ if(S.pro) return Promise.resolve(); S.adCount++; save(); if(S.adCount%2) return Promise.resolve(); const c=dayCount('adsDay'); if(c.n>=PLAN.adsPerDay) return Promise.resolve(); c.n++; save(); track('ad_shown',{format:'interstitial'}); return RN?native('interstitial',{}):simAd(false); }
function rewarded(){ track('ad_rewarded'); return (RN?native('rewarded',{}):simAd(true)).then(r=>{ if(r&&r.unavailable) toast(t('adNone')); return !!(r&&r.ok!==false&&!r.unavailable); }); }
/* In the native app PRO comes ONLY from a verified App Store purchase (RevenueCat entitlement "pro"). The web preview simulates it. */
function purchase(sku){ return RN?native('purchase',{sku}):Promise.resolve({ok:true,active:/^pro_/.test(sku),demo:true}); }
const LEGAL={terms:'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',privacy:'https://cipher-path-kinzhal.web.app/privacy.html',support:'https://cipher-path-kinzhal.web.app/support.html'};
function openUrl(url){ if(RN) RN.postMessage(JSON.stringify({type:'openUrl',url})); else window.open(url,'_blank','noopener'); }
function restorePurchases(){ return RN?native('restore',{}):Promise.resolve({ok:false}); }
const PRICES={ar:{monthly:'29.99 ر.س',yearly:'179.99 ر.س',yearlyPm:'15 ر.س',lifetime:'449 ر.س'},en:{monthly:'$7.99',yearly:'$47.99',yearlyPm:'$4.00',lifetime:'$119.99'}};
const price=k=>(window.__prices&&window.__prices[k])||PRICES[S.lang||'en'][k];
/* ---------- sound ---------- */
let AC=null;
function tone(freq,dur,type='sine',vol=.1,delay=0){ if(!S.sound) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  const o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+delay; o.type=type; o.frequency.setValueAtTime(freq,t0);
  g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol,t0+.01); g.gain.exponentialRampToValueAtTime(.0001,t0+dur); o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0+dur+.05);}catch(e){} }
const SFX={tap:()=>tone(880,.05,'square',.025),ok:()=>{tone(660,.12,'sine',.1);tone(990,.2,'sine',.08,.07);},bad:()=>{tone(200,.2,'sawtooth',.05);tone(150,.25,'sawtooth',.04,.08);},
  win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.35,'triangle',.08,i*.08)),coin:()=>{tone(1320,.07,'square',.035);tone(1760,.12,'square',.035,.06);},
  scan:()=>{for(let i=0;i<5;i++) tone(400+i*160,.05,'square',.02,i*.04);},
  gong:()=>{tone(98,1.6,'sine',.2);tone(147,1.2,'sine',.07,.02);tone(392,.8,'triangle',.035,.02);},
  hit:()=>{tone(130,.12,'square',.08);tone(90,.2,'sawtooth',.05,.04);} };
/* ---------- celebration ---------- */
function confetti(n=70){ if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;z-index:95;pointer-events:none'; c.width=innerWidth*devicePixelRatio; c.height=innerHeight*devicePixelRatio; document.body.appendChild(c);
  const x=c.getContext('2d'); x.scale(devicePixelRatio,devicePixelRatio); const cols=['#e2483a','#f2c14e','#ffd978','#ff7a5c','#4fd1a1','#c9271e'];
  const P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.4,vx:(Math.random()-.5)*9,vy:-Math.random()*11-4,s:10+Math.random()*8,c:cols[Math.random()*cols.length|0],g:'福码赢龙01'[Math.random()*6|0]}));
  let f=0; (function step(){ x.clearRect(0,0,innerWidth,innerHeight); P.forEach(p=>{p.vy+=.32;p.vx*=.99;p.x+=p.vx;p.y+=p.vy; x.fillStyle=p.c; x.font=`700 ${p.s+4}px "Ma Shan Zheng","Noto Serif SC",serif`; x.fillText(p.g,p.x,p.y);});
    if(++f<110) requestAnimationFrame(step); else c.remove(); })(); }
function floatText(txt,el){ const r=el?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0}; const d=document.createElement('div');
  d.textContent=txt; d.style.cssText=`position:fixed;left:${r.left+r.width/2}px;top:${r.top}px;transform:translate(-50%,0);z-index:96;font:800 20px Inter;color:var(--acc);pointer-events:none;transition:transform .9s ease-out,opacity .9s`;
  document.body.appendChild(d); requestAnimationFrame(()=>{d.style.transform='translate(-50%,-60px)';d.style.opacity='0';}); setTimeout(()=>d.remove(),950); }
/* ---------- progress, bits, ranks ---------- */
const RANK_XP=[0,150,400,900,1700,2800,4300,6500];
const rankOf=xp=>{let r=0; RANK_XP.forEach((v,i)=>{if(xp>=v) r=i;}); return r;};
function addXP(n){ rollDay(); try{ questEvent('xp',n); }catch(e){} const before=S.todayXP, r0=rankOf(S.xp); S.xp+=n; S.todayXP+=n; S.days=S.days||{}; S.days[today()]=1;
  const d=today(); if(S.lastActive!==d){ const yd=ymd(new Date(Date.now()-864e5)); S.streak=(S.lastActive===yd)?S.streak+1:1; S.lastActive=d; track('streak_day',{streak:S.streak}); }
  save(); if(before<S.goal&&S.todayXP>=S.goal) toast('🎯 '+t('goalDone'));
  const r1=rankOf(S.xp); if(r1>r0) setTimeout(()=>{ SFX.gong(); fireworks(4); toast(`${t('rankUp')} ${RANK_ZH[r1]} · ${t('ranks')[r1]}`); },400);
  try{ checkBadges(); }catch(e){} }
const RANK_ZH=['码徒','码农','程序猿','侠客','大侠','掌门','宗师','码圣'];
function addCoins(n){ const m=S.pro?Math.round(n*1.5):n; S.coins+=m; save(); SFX.coin(); updateTop(); return m; }
function spend(n){ if(S.pro) return true; if(S.coins<n){ toast(t('notEnough')); shop(); return false; } S.coins-=n; save(); updateTop(); return true; }
/* ---------- spaced repetition for Chinese terms ---------- */
const INTERVALS=[0,1,2,4,7,15,30,60];
function srsMark(id,ok){ const r=S.srs[id]||{b:0,d:0}; r.b=ok?Math.min(r.b+1,7):1; r.d=Date.now()+INTERVALS[r.b]*864e5; S.srs[id]=r; }
const dueIds=()=>Object.entries(S.srs).filter(([,r])=>r.d<=Date.now()).map(([k])=>+k).filter(id=>byId[id]);
/* ---------- ui helpers ---------- */
function toast(msg){ $$('.toast').forEach(x=>x.remove()); const d=document.createElement('div'); d.className='toast rise'; d.setAttribute('role','status'); d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),2400); }
let sheetEl=null;
function closeSheet(){ if(sheetEl){sheetEl.remove();sheetEl=null;} }
function sheet(html,bind){ closeSheet(); sheetEl=document.createElement('div'); sheetEl.className='sheet'; sheetEl.innerHTML=`<div class="rise" role="dialog"><div class="grab"></div>${html}</div>`;
  sheetEl.onclick=e=>{ if(e.target===sheetEl) closeSheet(); }; document.body.appendChild(sheetEl); try{ SFX.open(); }catch(e){} bind&&bind(sheetEl.firstElementChild); }
let coinHTML=`<span class="ltr" style="color:var(--amber);display:inline-flex">${ICON.bit}</span>`;
const stars=n=>`<span class="stars" aria-label="${n}/3">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
function ring(p,label,size=72){ const r=30, c=2*Math.PI*r; return `<svg class="ring" viewBox="0 0 72 72" style="width:${size}px;height:${size}px"><circle class="bgc" cx="36" cy="36" r="${r}"/><circle class="fgc" cx="36" cy="36" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-Math.min(1,p))}" transform="rotate(-90 36 36)"/><text x="36" y="41" text-anchor="middle">${label}</text></svg>`; }
/* light syntax colouring for JS/SQL/shell snippets (input is escaped first) */
const KW=new Set('const let var function return if else for of in while break continue true false null undefined new class extends constructor this async await throw try catch typeof switch case import from export default SELECT FROM WHERE JOIN ON GROUP BY ORDER DESC ASC AS SUM INSERT UPDATE SET DELETE BEGIN COMMIT REFERENCES PRIMARY KEY FROM WORKDIR COPY RUN USER CMD git'.split(' '));
function hiCode(src){ return String(src).split('\n').map(line=>{ let out='', m; const re=/(\/\/.*$|^\s*# .*$|-- .*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|([\s\S])/g;
  while((m=re.exec(line))){ if(m[1]) out+=`<span class="c">${esc(m[1])}</span>`; else if(m[2]) out+=`<span class="s">${esc(m[2])}</span>`; else if(m[3]) out+=`<span class="n">${m[3]}</span>`;
    else if(m[4]) out+=KW.has(m[4])?`<span class="k">${m[4]}</span>`:`<span class="f">${esc(m[4])}</span>`; else if(m[5]) out+=KW.has(m[5])?`<span class="k">${m[5]}</span>`:esc(m[5]); else out+=esc(m[6]); }
  return out; }).join('\n'); }
const codeHTML=src=>`<pre class="code">${hiCode(src)}</pre>`;
/* ---------- router ---------- */
let route={name:'home'}; let cleanup=null;
const NAV={stack:[]};
function navKey(n,a){ return JSON.stringify([n,a===undefined?null:a]); }
function go(name,arg){ if(cleanup){try{cleanup();}catch(e){} cleanup=null;} $$('.feedback').forEach(f=>f.remove()); closeSheet(); try{stopVoice();}catch(e){}
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
/* previous screen on the history stack (back buttons) */
function goBack(fallback='home'){ const st=NAV.stack; if(st.length>1){ const [n,a]=JSON.parse(st[st.length-2].k); go(n,a===null?undefined:a); } else go(fallback); }
const TABS=[['home','home'],['learn','learn'],['labs','labs'],['zh','zh'],['me','me']];
function fitTop(){ const tb=$('.topbar'); if(!tb) return; tb.classList.remove('t1','t2','t3'); for(const c of ['t1','t2','t3']){ if(tb.scrollWidth<=tb.clientWidth+1) break; tb.classList.add(c); } }
addEventListener('resize',()=>fitTop());
function updateTop(){ setTimeout(fitTop,0); $$('[data-coins]').forEach(e=>e.textContent=fmtK(S.coins)); $$('[data-streak]').forEach(e=>e.textContent=S.streak); }
function topbar(){ return `<div class="topbar"><div class="logo"><div class="seal" aria-hidden="true">码</div><div class="wordmark"><b>CIPHER PATH</b><span>${isAr()?'مسار الشيفرة · 码道':'码道 · mǎdào'}</span></div></div>
  <div class="chips"><button class="chip" data-act="theme" aria-label="${isAr()?'الوضع الفاتح أو الداكن':'Light or dark theme'}" aria-pressed="${S.theme==='light'}">${ICON[S.theme==='light'?'moon':'sun']}</button>
  <button class="chip" data-act="streak" aria-label="${t('streak')}"><span style="color:var(--zh);display:inline-flex">${ICON.flame}</span><span class="num" data-streak>${S.streak}</span></button>
  <button class="chip" data-act="shop" aria-label="${t('shop')}">${coinHTML}<span class="num" data-coins>${fmtK(S.coins)}</span></button>
  ${S.pro?'<span class="chip pro">PRO</span>':`<button class="chip pro" data-act="pro">PRO</button>`}</div></div>`; }
function bindTop(m){ fitTop(); $$('[data-act="shop"]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); shop(); }); $$('[data-act="pro"]',m).forEach(b=>b.onclick=()=>paywall());
  $$('[data-act="theme"]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); toggleTheme(); if(route.name==='me') render(); });
  $$('[data-act="streak"]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('me'); }); }
function tabOf(n){ return TABS.some(x=>x[0]===n)?n:['track','module','exam'].includes(n)?'learn':['codelab','seclab','pwlab','fwlab','ctflab'].includes(n)?'labs':['terms','talk'].includes(n)?'zh':''; }
function tabLabel(k){ return k==='zh'?`<span class="zhi" aria-hidden="true">中</span>`:ICON[k]; }
function render(){
  applyLang(); rollDay();
  const app=$('#app'); let tb=$('#app > .tabbar'); [...app.children].forEach(c=>{ if(c!==tb) c.remove(); });
  if(!S.lang){ if(tb) tb.remove(); SCREENS.onboard(app); return; }
  const full=['lesson','quizrun','examrun','codelab','seclab','ctflab','fwlab','practice','talkscene','game','daily'].includes(route.name);
  const m=document.createElement('main'); m.className='screen'+(full?' full':''); app.insertBefore(m,tb);
  if(!full) m.insertAdjacentHTML('afterbegin','<div class="glow"></div>');
  (SCREENS[route.name]||SCREENS.home)(m,route.arg); bindTop(m);
  if(full){ if(tb) tb.remove(); }
  else {
    if(!tb||tb.dataset.lang!==S.lang){ if(tb) tb.remove(); tb=document.createElement('div'); tb.className='tabbar'; tb.dataset.lang=S.lang;
      tb.innerHTML=`<nav aria-label="tabs">${TABS.map(([k])=>`<button class="tab" data-k="${k}">${tabLabel(k)}<span>${t(k)}</span></button>`).join('')}</nav>`;
      app.appendChild(tb); $$('.tab',tb).forEach(b=>b.onclick=()=>{SFX.tap(); go(b.dataset.k);}); }
    const cur=tabOf(route.name); $$('.tab',tb).forEach(b=>{ if(b.dataset.k===cur) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  }
}
const SCREENS={};
