/* ===== Labs: code labs (sandboxed worker + tests), phishing, log hunting, secure code review, cipher workshop,
   firewall simulator, password & hash lab, daily challenge. Everything runs locally; nothing touches real systems. ===== */
const SEC_LABS={phish:{ic:'🎣',data:PHISH},logs:{ic:'📜',data:LOGS},review:{ic:'🔍',data:REVIEW},ctf:{ic:'🔓',data:CTF}};
const secSolved=lab=>Object.keys((S.sec||{})[lab]||{}).length;
const roundFree=(lab,i)=>S.pro||i<(lab==='ctf'?4:FREE_ROUNDS);
const labFree=l=>S.pro||CODE_LABS.filter(x=>x.tr===l.tr).indexOf(l)<FREE_LABS;
function secMark(lab,i,score){ S.sec=S.sec||{}; S.sec[lab]=S.sec[lab]||{}; const first=!S.sec[lab][i]; S.sec[lab][i]=Math.max(S.sec[lab][i]||0,score); save(); return first; }
function openLab(k){ if(k==='codelab') return go('labs'); if(k==='pw') return go('pwlab'); if(k==='fw') return go('fwlab',{lv:1}); if(k==='ctf'){ const i=CTF.findIndex((x,j)=>!(S.sec.ctf||{})[j]); return go('ctflab',{i:Math.max(0,i)}); }
  const d=SEC_LABS[k].data, i=d.findIndex((x,j)=>!((S.sec||{})[k]||{})[j]); go('seclab',{lab:k,i:Math.max(0,i)}); }
function openCodeLab(k){ const l=CODE_LABS.find(x=>x.k===k); if(!labFree(l)) return paywall('lab'); go('codelab',k); }

SCREENS.labs=m=>{ const tile=(k,ic,n,prog)=>`<button class="ltile" data-lab="${k}"><div class="row">${ico(...ic.split(':'),'lg')}<div class="grow"></div>${prog?`<span class="sub num">${prog}</span>`:''}</div><b>${t(n)}</b><span class="sub">${t(n+'B')}</span></button>`;
  let tr=S._labTr||'se';
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="lhero"><span class="mono">$ sandbox --safe --local</span><h1>${t('labsT')}</h1><p class="sub">${t('labsB')}</p></div>
  <h2 class="sech"><span class="brushzh">安</span> ${t('trCY')}</h2><div class="grid2">${tile('phish','fish:red','phish',secSolved('phish')+'/'+PHISH.length)}${tile('logs','logs:jade','logs',secSolved('logs')+'/'+LOGS.length)}${tile('review','review:blue','review',secSolved('review')+'/'+REVIEW.length)}${tile('ctf','key:gold','ctf',secSolved('ctf')+'/'+CTF.length)}${tile('fw','wall:red','fw',(S.fwBest||0)+'/3')}${tile('pw','lock2:ink','pw','')}</div>
  <h2>⌨️ ${t('codeLabs')}</h2><p class="sub">${t('codeLabsB')}</p>
  <div class="seg" id="lsg"><button data-t="se" aria-pressed="${tr==='se'}">💻 ${t('trSE')}</button><button data-t="cy" aria-pressed="${tr==='cy'}">🛡️ ${t('trCY')}</button></div><div class="col" id="cl" style="gap:8px"></div>
  <h2 class="sech"><span class="brushzh">玩</span> ${t('arcade')}</h2><div class="grid3">${[['sprint','中'],['bits','01'],['ports','443']].map(([k,ic])=>`<button class="ltile" data-g="${k}" style="min-height:110px"><span class="ico lg ${k==='sprint'?'red':k==='bits'?'blue':'jade'}"><span class="icotxt">${ic}</span></span><b style="font-size:13px">${t(k)}</b><span class="sub num">${S.best&&S.best[k]?'★ '+S.best[k]:''}</span></button>`).join('')}</div>`);
  const drawList=()=>{ $('#cl',m).innerHTML=CODE_LABS.filter(l=>l.tr===tr).map(l=>{ const free=labFree(l), done=!!S.labs[l.k];
    return `<button class="modc ${done?'done':''} ${free?'':'locked'}" data-k="${l.k}"><span class="mi" style="font:600 15px var(--f-mono)">${done?'✓':'{ }'}</span><div class="grow"><b>${esc(L(l))}</b><div class="zh">${esc(l.zh)} <span class="py" style="font-size:11px">${esc(l.py)}</span></div><div class="sub">${esc(L(MOD[l.mod]))}</div></div>${free?'':`<span class="tag lock">${ICON.lock}</span>`}</button>`; }).join('');
    $$('#cl .modc',m).forEach(b=>b.onclick=()=>{ SFX.tap(); openCodeLab(b.dataset.k); }); };
  $$('#lsg button',m).forEach(b=>b.onclick=()=>{ tr=S._labTr=b.dataset.t; $$('#lsg button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); SFX.tap(); drawList(); });
  drawList(); $$('[data-lab]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); openLab(b.dataset.lab); }); $$('[data-g]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('game',b.dataset.g); }); };

/* ---------- code labs: run code in a throw-away Web Worker so even an infinite loop can't freeze the app ---------- */
const WORKER=`const canon=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'):JSON.stringify(v);
onmessage=async e=>{const {src,tests}=e.data;const out=[];const con={log:(...a)=>out.push(a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')),error:(...a)=>out.push('✖ '+a.join(' ')),assert:(c,m)=>{ if(!c) out.push('✖ assertion failed'+(m?': '+m:'')); }};
try{ const AF=Object.getPrototypeOf(async function(){}).constructor;
 if(tests){ const R=[]; for(const [c,ex] of tests){ try{ const v=await new AF('console',src+'\\n;return ('+c+');')(con); R.push({c,ex:canon(ex),v:v===undefined?'undefined':canon(v),ok:canon(v)===canon(ex)}); }catch(err){ R.push({c,ex:canon(ex),err:err.name+': '+err.message,ok:false}); } } postMessage({out,tests:R}); return; }
 await new AF('console',src)(con); setTimeout(()=>postMessage({out}),200);
}catch(err){ setTimeout(()=>postMessage({out,err:err.name,msg:err.message}),0); } };`;
function runCode(src,tests){ return new Promise(res=>{ let wk=null; try{ wk=new Worker(URL.createObjectURL(new Blob([WORKER],{type:'text/javascript'}))); }catch(e){ wk=null; }
  if(!wk){ (async()=>{ const out=[], con={log:(...a)=>out.push(a.map(String).join(' ')),error:(...a)=>out.push('✖ '+a.join(' ')),assert:()=>{}}, canon=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'):JSON.stringify(v);
    const AF=Object.getPrototypeOf(async function(){}).constructor;   // fallback without a worker (no infinite-loop guard)
    try{ if(!tests){ await new AF('console',src)(con); return res({out}); } const R=[]; for(const [c,ex] of tests){ try{ const v=await new AF('console',src+'\n;return ('+c+');')(con); R.push({c,ex:canon(ex),v:v===undefined?'undefined':canon(v),ok:canon(v)===canon(ex)}); }catch(err){ R.push({c,ex:canon(ex),err:err.name+': '+err.message,ok:false}); } } res({out,tests:R}); }
    catch(err){ res({out,err:err.name,msg:err.message}); } })(); return; }
  const to=setTimeout(()=>{ wk.terminate(); res({out:[],err:'Timeout',msg:'> 2 s (infinite loop?)',tests:tests?tests.map(([c,ex])=>({c,ex:JSON.stringify(ex),err:'Timeout',ok:false})):null}); },2000);
  wk.onmessage=e=>{ clearTimeout(to); wk.terminate(); res(e.data); }; wk.onerror=e=>{ clearTimeout(to); wk.terminate(); res({out:[],err:'SyntaxError',msg:e.message||''}); e.preventDefault&&e.preventDefault(); };
  wk.postMessage({src,tests}); }); }
const termHTML=(r,title)=>`<div class="term"><div class="tbar"><i></i><i></i><i></i><span>${esc(title)}</span></div><pre>${[...(r.out||[]).map(esc),r.err?`<span class="trow-bad">✖ ${esc(r.err)}: ${esc(r.msg||'')}</span>`:'',
  ...(r.tests||[]).map(x=>`<span class="${x.ok?'trow-ok':'trow-bad'}">${x.ok?'✔':'✖'} ${esc(x.c)}${x.ok?'':`\n   ${t('expected')}: ${esc(x.ex)}\n   ${t('got')}: ${esc(x.err||x.v)}`}</span>`)].filter(Boolean).join('\n')||'<span class="sub">…</span>'}</pre></div>`;

SCREENS.codelab=(m,k)=>{ const l=CODE_LABS.find(x=>x.k===k); if(!l) return go('labs'); if(!labFree(l)) return paywall('lab');
  S.drafts=S.drafts||{}; let fails=0; const list=CODE_LABS.filter(x=>x.tr===l.tr), li=list.indexOf(l), nx=list[li+1];
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="grow"><span class="eyebrow">${t('codeLabs')} · <span class="num">${li+1}/${list.length}</span></span></div>${S.labs[k]?'<span class="tag ok">✓</span>':''}</div>
  <div class="card col" style="gap:8px"><div class="row"><h2 class="grow">${esc(L(l))}</h2><span class="han" style="color:var(--zh)">${esc(l.zh)}</span><button class="speak" id="say" aria-label="${isAr()?'استمع':'Listen'}">${ICON.speak}</button></div>
    <div class="lbody"><p>${inl(L(l,'pa','pe'))}</p></div><div class="sub">${esc(L(MOD[l.mod]))}</div></div>
  <div class="editor"><textarea id="ed" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="code">${esc(S.drafts[k]||l.start)}</textarea>
    <div class="keys">${['(',')','{','}','[',']',';','"','=','=>','.','!','<','>','+','return','const','⇥'].map(c=>`<button data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
  <div class="row"><button class="btn grow" id="rt">▶ ${t('runTests')}</button><button class="btn ghost sm" id="hn">${ICON.hint}</button><button class="btn ghost sm" id="rs" aria-label="${t('reset')}">↺</button></div>
  <div id="out">${termHTML({},t('tests'))}</div><div id="after"></div>`;
  const ed=$('#ed',m); ed.oninput=()=>{ S.drafts[k]=ed.value; save(); };
  ed.onkeydown=e=>{ if(e.key==='Tab'){ e.preventDefault(); ins('  '); } };
  function ins(s){ const a=ed.selectionStart, b=ed.selectionEnd; ed.value=ed.value.slice(0,a)+s+ed.value.slice(b); ed.selectionStart=ed.selectionEnd=a+s.length; ed.focus(); S.drafts[k]=ed.value; save(); }
  $$('.keys button',m).forEach(b=>b.onclick=()=>{ const c=b.dataset.c; ins(c==='⇥'?'  ':c==='return'||c==='const'?c+' ':c); });
  $('#qx',m).onclick=()=>go('labs'); $('#say',m).onclick=()=>speak(l.zh);
  $('#rs',m).onclick=()=>{ ed.value=l.start; S.drafts[k]=l.start; save(); SFX.tap(); };
  $('#hn',m).onclick=()=>{ sheet(`<h2>💡 ${t('hint')}</h2><p>${inl(L(l,'ha','he'))}</p><button class="btn ghost block" id="sol">${t('showSol')} · ${S.pro||fails>=3?'':`20 ${t('bitsCur')}`}</button><div id="sv"></div>`,el=>{
    $('#sol',el).onclick=()=>{ if(!(S.pro||fails>=3)&&!spend(20)) return; $('#sv',el).innerHTML=codeHTML(l.sol)+`<button class="btn block" id="use" style="margin-top:10px">${t('reset')} → ${t('solution')}</button>`; $('#use',el).onclick=()=>{ ed.value=l.sol; S.drafts[k]=l.sol; save(); closeSheet(); }; }; }); };
  $('#rt',m).onclick=async()=>{ const b=$('#rt',m); b.disabled=true; SFX.scan(); const r=await runCode(ed.value,l.tests); b.disabled=false;
    $('#out',m).innerHTML=termHTML(r,t('tests')); const ok=r.tests&&r.tests.every(x=>x.ok);
    if(ok){ SFX.win(); haptic('success'); confetti(70); const first=!S.labs[k]; S.labs[k]=1; save(); questEvent('lab'); if(first){ addXP(25); addCoins(20); track('lab_done',{k}); }
      $('#after',m).innerHTML=`<div class="card col" style="gap:10px;border-color:var(--good)"><b style="color:var(--good)">✓ ${t('passed')}</b>${first?`<div class="sub">+25 ${t('xp')} · +20 ${t('bitsCur')}</div>`:''}<div class="row"><button class="btn ghost grow" id="bl">${t('labsT')}</button>${nx?`<button class="btn grow" id="nl">${t('next')} →</button>`:''}</div></div>`;
      $('#bl',m).onclick=async()=>{ await interstitial(); go('labs'); }; const n2=$('#nl',m); if(n2) n2.onclick=async()=>{ await interstitial(); openCodeLab(nx.k); };
      requestAnimationFrame(()=>$('#after',m).scrollIntoView({block:'nearest',behavior:'smooth'})); }
    else { fails++; SFX.bad(); haptic('error'); $('#after',m).innerHTML=fails>=3?`<button class="btn ghost block" id="ss">${t('showSol')}</button>`:''; const ss=$('#ss',m); if(ss) ss.onclick=()=>$('#hn',m).click(); } }; };

/* ---------- round navigation shared by the security labs ---------- */
function roundHead(m,lab,i,n,title){ return `<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="grow"><span class="eyebrow">${SEC_LABS[lab]?SEC_LABS[lab].ic:''} ${esc(title)}</span>
  <div class="row" style="gap:5px;margin-top:4px;flex-wrap:wrap">${Array.from({length:n},(_,j)=>{ const sc=((S.sec||{})[lab]||{})[j]; return `<button class="chip" data-r="${j}" style="height:32px;min-width:32px;padding:0 8px;${j===i?'border-color:var(--acc);color:var(--acc)':''}${sc?';background:var(--good-soft)':''}">${roundFree(lab,j)?j+1:ICON.lock}</button>`; }).join('')}</div></div></div>`; }
function bindRounds(m,lab,routeName){ $('#qx',m).onclick=()=>go('labs'); $$('[data-r]',m).forEach(b=>b.onclick=()=>{ const j=+b.dataset.r; if(!roundFree(lab,j)) return paywall('lab'); SFX.tap(); routeName==='ctflab'?go('ctflab',{i:j}):go('seclab',{lab,i:j}); }); }
function roundDone(m,{lab,i,ok,score,msg,daily,next}){ const first=ok&&secMark(lab,i,score); if(ok) questEvent('lab'); if(ok&&first){ addXP(15+score*5); addCoins(10+score*5); }
  if(daily&&ok) dailyReward();
  ok?(SFX.win(),haptic('success'),confetti(50)):(SFX.bad(),haptic('error'));
  const f=document.createElement('div'); f.className='feedback '+(ok?'good':'bad');
  f.innerHTML=`<div><div class="row"><b class="v grow">${ok?t('correct'):t('wrong')}</b>${ok?stars(score):''}</div><div class="sub" style="color:var(--text)">${msg}</div>
    <div class="row">${daily?`<button class="btn block" id="fd">${t('finish')}</button>`:`<button class="btn ghost" id="fa">↺</button><button class="btn grow" id="fn">${next!=null?t('next')+' →':t('finish')}</button>`}</div></div>`;
  document.body.appendChild(f);
  const fd=$('#fd',f); if(fd) fd.onclick=()=>{ f.remove(); go('home'); };
  const fa=$('#fa',f); if(fa) fa.onclick=()=>{ f.remove(); render(); };
  const fn=$('#fn',f); if(fn) fn.onclick=async()=>{ f.remove(); if(next==null){ await interstitial(); return go('labs'); } if(!roundFree(lab,next)) return paywall('lab'); lab==='ctf'?go('ctflab',{i:next}):go('seclab',{lab,i:next}); }; }

SCREENS.seclab=(m,{lab,i})=>{ const d=SEC_LABS[lab].data; i=Math.max(0,Math.min(d.length-1,i|0)); if(!roundFree(lab,i)) return paywall('lab');
  m.innerHTML=roundHead(m,lab,i,d.length,t(lab)); const body=document.createElement('div'); body.className='col'; body.style.gap='14px'; m.appendChild(body); bindRounds(m,lab,'seclab');
  const next=i+1<d.length?i+1:null; ({phish:phishRound,logs:logRound,review:reviewRound})[lab](body,i,(ok,score,msg)=>roundDone(m,{lab,i,ok,score,msg,next})); };

/* phishing: tap red flags, then judge */
const flagParts=s=>{ const out=[]; let rest=s, m; const re=/\[\[([^|\]]+)\|([^|\]]+)\|([^\]]+)\]\]/; while((m=re.exec(rest))){ out.push({t:rest.slice(0,m.index)}); out.push({t:m[1],a:m[2],e:m[3],flag:1}); rest=rest.slice(m.index+m[0].length); } out.push({t:rest}); return out; };
function phishRound(box,i,done){ const p=PHISH[i], e=isAr()?p.a:p.e; let fid=0; const total=[e.from,e.subj,e.body].map(flagParts).flat().filter(x=>x.flag).length;
  const render=s=>flagParts(s).map(x=>x.flag?`<button class="flag" data-f="${fid++}" data-w="${esc(L(x,'a','e'))}">${esc(x.t)}</button>`:esc(x.t)).join('');
  box.innerHTML=`<p class="sub">${t('tapFlags')}</p><div class="mail" id="ml"><div class="mh"><div><span class="sub">${t('from')}:</span> ${render(e.from).replace(/&lt;([\s\S]*)&gt;/,'<span class="addr">&lt;$1&gt;</span>')}</div><div><span class="sub">${t('subject')}:</span> <b>${render(e.subj)}</b></div></div><div class="mb" dir="auto">${render(e.body)}</div></div>
    <div class="sub" id="fc"><span class="num">0</span> ${t('flagsFound')}</div><div class="grid2"><button class="btn danger" id="ph">🎣 ${t('isPhish')}</button><button class="btn ghost" id="lg">✓ ${t('isLegit')}</button></div>`;
  let found=0, decided=false;
  $$('.flag',box).forEach(b=>b.onclick=()=>{ if(decided||b.classList.contains('found')) return; b.classList.add('found'); found++; SFX.tap(); haptic('light'); toast(b.dataset.w); $('#fc',box).innerHTML=`<span class="num">${found}/${total}</span> ${t('flagsFound')}`; });
  const decide=saysPhish=>{ if(decided) return; decided=true; $('#ml',box).classList.add('reveal'); $$('.flag:not(.found)',box).forEach(b=>b.classList.add('missed'));
    const ok=saysPhish===p.phish, score=!ok?0:!p.phish?3:found>=total?3:found>=Math.ceil(total/2)?2:1;
    $$('#ph,#lg',box).forEach(b=>b.disabled=true);
    const list=$$('.flag',box).map(b=>`<li>${b.classList.contains('found')?'✓':'○'} <b>${esc(b.textContent)}</b>: ${esc(b.dataset.w)}</li>`).join('');
    done(ok,score,esc(L(p,'wa','we'))+(list?`<ul style="margin:8px 0 0;padding-inline-start:18px">${list}</ul>`:'')); };
  $('#ph',box).onclick=()=>decide(true); $('#lg',box).onclick=()=>decide(false); }

/* logs: select the attack lines */
function logRound(box,i,done){ const r=LOGS[i]; const sel=new Set();
  box.innerHTML=`<div class="qtext">${esc(L(r,'qa','qe'))}</div><p class="sub">${t('selectLines')}</p><div class="logv">${r.lines.map((l,j)=>`<button class="logl" data-j="${j}" aria-pressed="false">${esc(l)}</button>`).join('')}</div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
  $$('.logl',box).forEach(b=>b.onclick=()=>{ if(box.dataset.done) return; const j=+b.dataset.j; sel.has(j)?sel.delete(j):sel.add(j); b.setAttribute('aria-pressed',sel.has(j)); SFX.tap(); $('#ck',box).disabled=!sel.size; });
  $('#ck',box).onclick=()=>{ box.dataset.done=1; $('#ck',box).disabled=true; const bad=new Set(r.bad); let hit=0, fp=0;
    $$('.logl',box).forEach(b=>{ const j=+b.dataset.j; if(bad.has(j)&&sel.has(j)){ b.classList.add('right'); hit++; } else if(bad.has(j)) b.classList.add('missed'); else if(sel.has(j)){ b.classList.add('wrong'); fp++; } });
    const ok=hit===bad.size&&fp===0, score=ok?3:hit===bad.size?1:0; done(ok||score>0,ok?3:score,esc(L(r,'wa','we'))); }; }

/* secure code review: tap the vulnerable line, then name the flaw */
function reviewRound(box,i,done){ const r=REVIEW[i]; let stage=0, lineOk=false;
  const keys=shuffle([r.v,...pick(Object.keys(VULNS).filter(k=>k!==r.v),3)]);
  box.innerHTML=`<div class="qtext">${t('tapLine')}</div><div class="term"><div class="tbar"><i></i><i></i><i></i><span>review.js</span></div><div style="padding:8px 0">${r.code.map((l,j)=>`<button class="revl" data-j="${j}"><span class="ln">${j+1}</span><span>${hiCode(l)}</span></button>`).join('')}</div></div><div id="st2"></div>`;
  $$('.revl',box).forEach(b=>b.onclick=()=>{ if(stage) return; stage=1; const j=+b.dataset.j; lineOk=j===r.bad; b.classList.add(lineOk?'right':'wrong'); if(!lineOk) $(`.revl[data-j="${r.bad}"]`,box).classList.add('right');
    lineOk?SFX.ok():SFX.bad();
    $('#st2',box).innerHTML=`<div class="qtext">${t('whichVuln')}</div><div class="col" style="gap:8px">${keys.map((k,j)=>`<button class="opt" data-v="${k}"><span class="ol">${'ABCD'[j]}</span><span class="grow">${esc(isAr()?VULNS[k][0]:VULNS[k][1])}</span></button>`).join('')}</div>`;
    $$('.opt',box).forEach(o=>o.onclick=()=>{ if(stage>1) return; stage=2; const ok=o.dataset.v===r.v; $$('.opt',box).forEach(x=>{ x.disabled=true; x.classList.add(x.dataset.v===r.v?'right':x===o?'wrong':'dim'); });
      const score=(lineOk?1:0)+(ok?2:0);
      done(score>=2,score===3?3:score===2?2:1,`${esc(L(r,'wa','we'))}<div style="margin-top:8px"><b>${t('saferFix')}:</b></div>${codeHTML(r.fix)}`); }); }); }

/* ---------- cipher workshop ---------- */
const b64dec=s=>{ s=s.trim().replace(/-/g,'+').replace(/_/g,'/').replace(/\s+/g,''); while(s.length%4) s+='='; const bin=atob(s); return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))); };
const b64enc=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const hexdec=s=>{ const h=s.replace(/[^0-9a-f]/gi,''); return new TextDecoder().decode(Uint8Array.from(h.match(/../g)||[],x=>parseInt(x,16))); };
const hexenc=s=>[...new TextEncoder().encode(s)].map(b=>b.toString(16).padStart(2,'0')).join('');
const bindec=s=>new TextDecoder().decode(Uint8Array.from(s.trim().split(/\s+/).filter(Boolean),x=>parseInt(x,2)));
const rotN=(s,n)=>s.replace(/[a-z]/gi,c=>{ const b=c<='Z'?65:97; return String.fromCharCode(((c.charCodeAt(0)-b+n)%26+26)%26+b); });
const xorHex=(s,k)=>{ const h=s.replace(/[^0-9a-f]/gi,''); return String.fromCharCode(...(h.match(/../g)||[]).map(x=>parseInt(x,16)^k)); };
const TOOLS=[['b64d','Base64 → text',s=>b64dec(s)],['b64e','text → Base64',s=>b64enc(s)],['hexd','Hex → text',s=>hexdec(s)],['hexe','text → Hex',s=>hexenc(s)],['bind','Binary → text',s=>bindec(s)],['urld','URL decode',s=>decodeURIComponent(s)],['rev','Reverse',s=>[...s].reverse().join('')],['rot13','ROT13',s=>rotN(s,13)]];
SCREENS.ctflab=(m,arg)=>{ const daily=arg&&arg.daily; let i=Math.max(0,Math.min(CTF.length-1,(arg&&arg.i)|0)); if(!daily&&!roundFree('ctf',i)) return paywall('lab'); const c=CTF[i];
  m.innerHTML=(daily?`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><span class="eyebrow grow">🧩 ${t('daily')}</span></div>`:roundHead(m,'ctf',i,CTF.length,t('ctf')))+
  `<div class="lhero"><span class="mono">ctf://${esc(c.k)}</span><h2>${esc(L(c,'ta','te'))}</h2><p class="sub">${esc(L(c,'sa','se'))}</p></div>
  <div class="wb"><label class="sub" for="wi">${t('input')}</label><textarea id="wi" spellcheck="false" autocapitalize="off">${esc(c.data)}</textarea>
    <div class="tools">${TOOLS.map(([k,n])=>`<button data-t="${k}">${n}</button>`).join('')}</div>
    <div class="row wrap"><span class="sub">${t('shift')} ROT</span><input type="range" id="sh" min="1" max="25" value="1" style="flex:1;min-width:120px" aria-label="${t('shift')}"><span class="num" id="shv">1</span><button class="btn sm ghost" id="sha">ROT-N</button></div>
    <div class="row wrap"><span class="sub">XOR ${t('key')}</span><input class="field mono" id="xk" type="number" min="0" max="255" value="42" style="width:90px;height:38px"><button class="btn sm ghost" id="xo">Hex ⊕ key</button></div>
    <label class="sub">${t('result')}</label><div class="hashout" id="wo" dir="ltr">…</div><button class="btn sm ghost" id="use">⇡ ${t('useResult')}</button></div>
  <div class="card col" style="gap:8px"><label for="fl"><b>${t('flagIn')}</b></label><input class="field mono" id="fl" placeholder="CP{...}" autocapitalize="off" autocomplete="off" spellcheck="false"><div class="row"><button class="btn grow" id="sb">${t('submit')}</button><button class="btn ghost sm" id="hn">${ICON.hint}</button></div><span class="sub">${t('flagHint')}</span></div>`;
  if(daily) $('#qx',m).onclick=()=>go('home'); else bindRounds(m,'ctf','ctflab');
  const wi=$('#wi',m), wo=$('#wo',m); let last='';
  const show=v=>{ last=v; wo.textContent=v; if(/CP\{[^}]+\}/.test(v)){ wo.innerHTML=esc(v).replace(/(CP\{[^}]+\})/,'<span class="d">$1</span>'); } };
  const apply=f=>{ try{ show(f(wi.value)); SFX.tap(); }catch(e){ wo.textContent='⚠ '+(e.message||'error'); SFX.bad(); } };
  $$('.tools button',m).forEach(b=>b.onclick=()=>apply(TOOLS.find(x=>x[0]===b.dataset.t)[2]));
  $('#sh',m).oninput=e=>{ $('#shv',m).textContent=e.target.value; apply(s=>rotN(s,+e.target.value)); }; $('#sha',m).onclick=()=>apply(s=>rotN(s,+$('#sh',m).value));
  $('#xo',m).onclick=()=>apply(s=>xorHex(s,(+$('#xk',m).value)&255)); $('#use',m).onclick=()=>{ if(last){ wi.value=last; SFX.tap(); } };
  $('#hn',m).onclick=()=>sheet(`<h2>💡 ${t('hint')}</h2><p>${esc(L(c,'ha','he'))}</p>`);
  $('#sb',m).onclick=()=>{ const v=$('#fl',m).value.trim(); const ok=v===c.flag; if(!ok&&!v) return;
    if(!ok){ SFX.bad(); haptic('error'); toast(t('wrong')); return; }
    roundDone(m,{lab:'ctf',i,ok:true,score:3,daily,msg:`<code>${esc(c.flag)}</code>`,next:i+1<CTF.length?i+1:null}); }; };

/* ---------- firewall simulator: generated rules, first match wins, implicit deny ---------- */
const FW_SVC=[[22,'ssh'],[25,'smtp'],[53,'dns'],[80,'http'],[443,'https'],[3306,'mysql'],[3389,'rdp'],[5432,'postgres'],[6379,'redis']];
function fwRound(rnd,lv){ const ri=n=>Math.floor(rnd()*n), srcNets=['10.0.1.0/24','10.0.2.0/24','any'], hosts=['10.0.9.5','10.0.9.6'];
  const rules=[], n=3+lv;
  for(let j=0;j<n-1;j++){ const svc=FW_SVC[ri(FW_SVC.length)]; rules.push({a:rnd()<.6?'allow':'deny',p:lv>=3&&rnd()<.3?'udp':'tcp',src:lv>=2?srcNets[ri(3)]:'any',dst:lv>=3?hosts[ri(2)]:'any',port:svc[0]}); }
  if(lv<3) rules.push({a:'deny',p:'any',src:'any',dst:'any',port:'any'});
  const svc=rnd()<.7?rules[ri(rules.length)].port:FW_SVC[ri(FW_SVC.length)][0];
  const pk={p:lv>=3&&rnd()<.25?'udp':'tcp',src:lv>=2?(rnd()<.5?'10.0.1.':'10.0.2.')+(10+ri(200)):'198.51.100.'+(2+ri(250)),dst:lv>=3?hosts[ri(2)]:'10.0.9.5',port:svc==='any'?443:svc};
  const inNet=(ip,net)=>net==='any'||ip.startsWith(net.split('.').slice(0,3).join('.')+'.');
  const hit=rules.findIndex(r=>(r.p==='any'||r.p===pk.p)&&inNet(pk.src,r.src)&&(r.dst==='any'||r.dst===pk.dst)&&(r.port==='any'||r.port===pk.port));
  return {rules,pk,hit,ans:hit<0?'deny':rules[hit].a}; }
SCREENS.fwlab=(m,arg)=>{ const daily=arg&&arg.daily; const lv=daily?2:Math.max(1,Math.min(3,(arg&&arg.lv)|0||1)); if(!daily&&lv>1&&!S.pro) return paywall('lab');
  const rnd=daily?seeded('fw'+today()):Math.random; const N=daily?5:10; let k=0, right=0;
  const draw=()=>{ const r=fwRound(rnd,lv); const svcName=p=>(FW_SVC.find(x=>x[0]===p)||[0,''])[1];
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><div class="bar"><i style="width:${k/N*100}%"></i></div><span class="sub num">${k+1}/${N}</span></div>
    ${daily?`<span class="eyebrow">🧩 ${t('daily')}</span>`:`<div class="seg" id="lvs">${[1,2,3].map(x=>`<button data-l="${x}" aria-pressed="${x===lv}">${t('level')} ${x}${x>1&&!S.pro?' 🔒':''}</button>`).join('')}</div>`}
    <p class="sub">${t('firstMatch')}</p>
    <div class="card" style="padding:8px;overflow-x:auto"><table class="fwtable"><thead><tr><th>#</th><th>action</th><th>proto</th><th>source</th><th>dest</th><th>port</th></tr></thead><tbody>
      ${r.rules.map((x,j)=>`<tr data-j="${j}"><td>${j+1}</td><td class="${x.a==='allow'?'al':'dn'}">${x.a}</td><td>${x.p}</td><td>${x.src}</td><td>${x.dst}</td><td>${x.port}${svcName(x.port)?' '+svcName(x.port):''}</td></tr>`).join('')}</tbody></table></div>
    <div class="packet"><b>${t('packet')}</b> → ${r.pk.p.toUpperCase()} ${r.pk.src} → ${r.pk.dst}:${r.pk.port} ${svcName(r.pk.port)}</div>
    <div class="grid2"><button class="btn" id="al">✓ ${t('allow')}</button><button class="btn danger" id="dn">✕ ${t('deny')}</button></div><div id="ex"></div>`;
    $('#qx',m).onclick=()=>go(daily?'home':'labs');
    $$('#lvs button',m).forEach(b=>b.onclick=()=>{ const x=+b.dataset.l; if(x>1&&!S.pro) return paywall('lab'); go('fwlab',{lv:x}); });
    const answer=a=>{ $$('#al,#dn',m).forEach(b=>b.disabled=true); const ok=a===r.ans; if(ok) right++; ok?SFX.ok():SFX.bad(); haptic(ok?'success':'error');
      if(r.hit>=0) $(`tr[data-j="${r.hit}"]`,m).classList.add('hit');
      $('#ex',m).innerHTML=`<div class="card col" style="gap:8px;border-color:${ok?'var(--good)':'var(--bad)'}"><b style="color:${ok?'var(--good)':'var(--bad)'}">${ok?'✓ '+t('correct'):'✕ '+t('wrong')} · ${r.ans==='allow'?t('allow'):t('deny')}</b>
        <div class="sub">${r.hit>=0?(isAr()?`القاعدة ${r.hit+1} هي أول قاعدة تطابق الحزمة.`:`Rule ${r.hit+1} is the first rule that matches.`):(isAr()?'لا تطابق أي قاعدة، فالحزمة تُمنع ضمنيًا.':'No rule matches, so the packet is denied implicitly.')}</div><button class="btn block" id="nx">${k+1<N?t('next')+' →':t('finish')}</button></div>`;
      $('#nx',m).onclick=()=>{ k++; if(k<N) return draw(); finish(); }; };
    $('#al',m).onclick=()=>answer('allow'); $('#dn',m).onclick=()=>answer('deny'); };
  const finish=()=>{ const p=right/N, ok=p>=.8; addXP(right*2); if(daily){ if(ok) dailyReward(); } else { if(ok){ S.fwBest=Math.max(S.fwBest||0,lv); addCoins(15); } } save(); ok?(SFX.win(),confetti(60)):SFX.bad();
    m.innerHTML=`<div class="result rise"><div class="big num">${right}/${N}</div><h1>${ok?t('correct'):t('retry')}</h1><p class="sub">${t('firstMatch')}</p>
      <div class="row" style="width:100%"><button class="btn ghost grow" id="ag">↺ ${t('again')}</button><button class="btn grow" id="dn2">${t('finish')}</button></div></div>`;
    $('#ag',m).onclick=()=>go('fwlab',daily?{daily:1}:{lv}); $('#dn2',m).onclick=async()=>{ await interstitial(); go(daily?'home':'labs'); }; };
  draw(); };

/* ---------- password & hash lab ---------- */
/* SHA-256 in plain JS so it works in every web view (crypto.subtle needs a secure context) */
function sha256(str){ const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=[...new TextEncoder().encode(str)], l=b.length*8; b.push(0x80); while(b.length%64!==56) b.push(0); for(let i=7;i>=0;i--) b.push(i>3?0:(l>>>(i*8))&255);
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]; const r=(x,n)=>x>>>n|x<<(32-n);
  for(let o=0;o<b.length;o+=64){ const w=[]; for(let i=0;i<16;i++) w[i]=b[o+i*4]<<24|b[o+i*4+1]<<16|b[o+i*4+2]<<8|b[o+i*4+3];
    for(let i=16;i<64;i++){ const s0=r(w[i-15],7)^r(w[i-15],18)^w[i-15]>>>3, s1=r(w[i-2],17)^r(w[i-2],19)^w[i-2]>>>10; w[i]=(w[i-16]+s0+w[i-7]+s1)|0; }
    let [a,bb,c,d,e,f,g,h]=H; for(let i=0;i<64;i++){ const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0, t2=((r(a,2)^r(a,13)^r(a,22))+((a&bb)^(a&c)^(bb&c)))|0; h=g; g=f; f=e; e=(d+t1)|0; d=c; c=bb; bb=a; a=(t1+t2)|0; }
    H=H.map((x,i)=>(x+[a,bb,c,d,e,f,g,h][i])|0); }
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join(''); }
const COMMON_PW=['123456','password','123456789','12345678','qwerty','abc123','111111','password1','iloveyou','admin','welcome','123123','qwerty123','1q2w3e4r','P@ssw0rd','Passw0rd','letmein','monkey','dragon','football','Aa123456','000000','987654321'];
function pwEntropy(p){ let pool=0; if(/[a-z]/.test(p)) pool+=26; if(/[A-Z]/.test(p)) pool+=26; if(/[0-9]/.test(p)) pool+=10; if(/[^a-zA-Z0-9]/.test(p)) pool+=33; return pool?p.length*Math.log2(pool):0; }
function crackTime(bits,rate){ const s=Math.pow(2,bits)/2/rate; const u=isAr()?[['ثانية',1],['دقيقة',60],['ساعة',3600],['يوم',86400],['سنة',31557600]]:[['seconds',1],['minutes',60],['hours',3600],['days',86400],['years',31557600]];
  if(s<1) return isAr()?'أقل من ثانية':'under a second'; if(s>31557600*1e9) return isAr()?'أكثر من مليار سنة':'over a billion years';
  let k=0; for(let i=0;i<u.length;i++) if(s>=u[i][1]) k=i; const v=s/u[k][1]; return `${v>=100?fmt(Math.round(v)):v.toFixed(1)} ${u[k][0]}`; }
SCREENS.pwlab=m=>{ const salt=[...crypto.getRandomValues(new Uint8Array(8))].map(b=>b.toString(16).padStart(2,'0')).join('');
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="row"><button class="icon-btn" id="bk" aria-label="${t('back')}">${backIcon()}</button><div class="grow"><span class="eyebrow">${t('labsT')}</span><h1>🔑 ${t('pw')}</h1></div></div>
  <div class="card col" style="gap:10px"><label for="pw" class="sub">${t('pwType')}</label><input class="field mono" id="pw" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="correct-horse-battery-staple">
    <div class="meter"><i id="mt" style="width:0%"></i></div><div class="row"><b class="grow">${t('entropy')}</b><span class="num" id="en">0 bits</span></div><div id="cm"></div>
    <div class="col" style="gap:6px" id="ct"></div><span class="sub">🔒 ${t('pwLocal')}</span></div>
  <div class="card col" style="gap:8px"><b>${t('hashLive')}</b><div class="hashout" id="h1">${sha256('')}</div>
    <b style="margin-top:6px">${t('saltDemo')}</b><div class="sub mono" dir="ltr">salt = ${salt}</div><div class="hashout" id="h2">${sha256(salt)}</div></div>
  <div class="card col" style="gap:8px"><b>${t('avalanche')}</b><input class="field mono" id="a1" value="Transfer 100 SAR" aria-label="A"><div class="hashout" id="ha1"></div><input class="field mono" id="a2" value="Transfer 900 SAR" aria-label="B"><div class="hashout" id="ha2"></div><div class="sub" id="df"></div></div>`);
  $('#bk',m).onclick=()=>goBack('labs');
  const upd=()=>{ const p=$('#pw',m).value, common=COMMON_PW.map(x=>x.toLowerCase()).includes(p.toLowerCase()), bits=common?0:pwEntropy(p);
    const pct=Math.min(100,bits/100*100), col=bits<40?'var(--bad)':bits<70?'var(--amber)':'var(--good)';
    $('#mt',m).style.width=pct+'%'; $('#mt',m).style.background=col; $('#en',m).textContent=Math.round(bits)+' bits';
    $('#cm',m).innerHTML=common?`<div class="lock-note" style="border-color:var(--bad);background:var(--bad-soft)">⚠ ${t('pwCommon')}</div>`:'';
    $('#ct',m).innerHTML=p?[[t('crackOnline'),100],[t('crackSlow'),1e4],[t('crackOffline'),1e10]].map(([n,r])=>`<div class="row"><span class="sub grow">${n}</span><b class="num">${common?(isAr()?'فورًا':'instantly'):crackTime(bits,r)}</b></div>`).join(''):'';
    $('#h1',m).textContent=sha256(p); $('#h2',m).textContent=sha256(salt+p); };
  const av=()=>{ const x=sha256($('#a1',m).value), y=sha256($('#a2',m).value); let diff=0; $('#ha1',m).textContent=x;
    $('#ha2',m).innerHTML=[...y].map((c,i)=>c!==x[i]?(diff++,`<span class="d">${c}</span>`):c).join('');
    $('#df',m).innerHTML=`<span class="num">${diff}/64</span> ${isAr()?'خانة تغيّرت':'hex digits changed'}`; };
  $('#pw',m).oninput=upd; $('#a1',m).oninput=av; $('#a2',m).oninput=av; upd(); av(); S.pwSeen=1; save(); };

/* ---------- daily challenge: one round chosen by the date, same for everyone that day ---------- */
function dailyPick(){ const r=seeded('daily'+today()); const kinds=['ctf','logs','review','fw','phish']; const dn=Math.floor(Date.now()/864e5); const kind=kinds[dn%kinds.length];
  const pool=kind==='ctf'?CTF:kind==='logs'?LOGS:kind==='review'?REVIEW:kind==='phish'?PHISH:null; return {kind,i:pool?Math.floor(r()*pool.length):0}; }
function dailyReward(){ if(S.dailyDone===today()) return; S.dailyDone=today(); save(); addCoins(40); addXP(20); track('daily_done'); toast('🧩 '+t('dailyDone')); }
SCREENS.daily=m=>{ const {kind,i}=dailyPick();
  if(kind==='ctf'){ route={name:'ctflab',arg:{i,daily:1}}; return SCREENS.ctflab(m,{i,daily:1}); }
  if(kind==='fw'){ route={name:'fwlab',arg:{daily:1}}; return SCREENS.fwlab(m,{daily:1}); }
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">${ICON.close}</button><span class="eyebrow grow">🧩 ${t('daily')} · ${t(kind)}</span></div>`;
  const body=document.createElement('div'); body.className='col'; body.style.gap='14px'; m.appendChild(body); $('#qx',m).onclick=()=>go('home');
  ({phish:phishRound,logs:logRound,review:reviewRound})[kind](body,i,(ok,score,msg)=>roundDone(m,{lab:kind,i,ok,score,msg,daily:1})); };
