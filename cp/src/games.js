/* ===== Quick games: 60-second rounds. Term sprint (Chinese → meaning), bits & hex conversions, ports & services ===== */
const GAMES={
  sprint:()=>{ const w=TERMS[Math.random()*TERMS.length|0], o=pick(TERMS.filter(x=>x.tr===w.tr&&mean(x)!==mean(w)),3);
    return {q:`<div class="gbig han">${esc(w.h)}</div><div class="py">${esc(w.p)}</div>`,opts:shuffle([w,...o]).map(x=>({h:esc(mean(x)),ok:x===w})),say:w.h}; },
  bits:()=>{ const n=Math.random()*256|0, kind=Math.random()*3|0, bin=v=>v.toString(2).padStart(8,'0'), hex=v=>'0x'+v.toString(16).toUpperCase().padStart(2,'0');
    const near=()=>{ const s=new Set([n]); while(s.size<4){ const d=[1,2,4,8,16,32,64,128][Math.random()*8|0]; s.add((n^d)&255); } return shuffle([...s]); };
    const opts=near();
    if(kind===0) return {q:`<div class="sub">${isAr()?'حوّل إلى ثنائي':'To binary'}</div><div class="gbig">${n}</div>`,opts:opts.map(v=>({h:`<span class="mono">${bin(v)}</span>`,ok:v===n}))};
    if(kind===1) return {q:`<div class="sub">${isAr()?'حوّل إلى عشري':'To decimal'}</div><div class="gbig" style="font-size:30px">${bin(n)}</div>`,opts:opts.map(v=>({h:`<span class="num">${v}</span>`,ok:v===n}))};
    return {q:`<div class="sub">${isAr()?'حوّل إلى سداسي عشري':'To hex'}</div><div class="gbig">${n}</div>`,opts:opts.map(v=>({h:`<span class="mono">${hex(v)}</span>`,ok:v===n}))}; },
  ports:()=>{ const p=PORTS[Math.random()*PORTS.length|0], o=pick(PORTS.filter(x=>x!==p),3); const rev=Math.random()<.35;
    return rev?{q:`<div class="sub">${isAr()?'ما منفذ':'Which port is'}</div><div class="gbig" style="font-size:34px">${esc(p[1])}</div>`,opts:shuffle([p,...o]).map(x=>({h:`<span class="num">${x[0]}</span>`,ok:x===p}))}
      :{q:`<div class="sub">${isAr()?'أي خدمة على المنفذ':'Which service uses port'}</div><div class="gbig">${p[0]}</div>`,opts:shuffle([p,...o]).map(x=>({h:esc(x[1]),ok:x===p}))}; }
};
SCREENS.game=(m,k)=>{ if(!GAMES[k]) return go('labs'); let score=0, streak=0, end=Date.now()+60000, iv=null, started=false;
  const prev=cleanup; cleanup=()=>{ clearInterval(iv); prev&&prev(); }; S.best=S.best||{};
  const intro=()=>{ m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><span class="eyebrow grow">${t('arcade')}</span></div>
    <div class="gstage rise"><div class="gbig ${k==='sprint'?'han':''}" style="color:var(--acc)">${k==='sprint'?'中':k==='bits'?'01':'🔌'}</div><h1>${t(k)}</h1><p class="sub">${t(k+'B')}</p>${S.best[k]?`<div class="sub">★ <span class="num">${S.best[k]}</span></div>`:''}<button class="btn block" id="go">${t('start')} ▶</button></div>`;
    $('#qx',m).onclick=()=>go('labs'); $('#go',m).onclick=()=>{ started=true; end=Date.now()+60000; iv=setInterval(()=>{ const l=Math.max(0,Math.ceil((end-Date.now())/1000)); const el=$('#tm',m); if(el) el.textContent=l+'s'; if(!l) over(); },250); round(); }; };
  const round=()=>{ const r=GAMES[k]();
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><span class="timer num" id="tm">${Math.ceil((end-Date.now())/1000)}s</span><div class="grow"></div><b class="num">★ ${score}</b>${streak>2?`<span class="tag" style="color:var(--amber)">×2</span>`:''}</div>
      <div class="gstage">${r.q}</div><div class="grid2">${r.opts.map((o,j)=>`<button class="opt" data-j="${j}" style="justify-content:center;min-height:64px">${o.h}</button>`).join('')}</div>`;
    $('#qx',m).onclick=()=>{ clearInterval(iv); go('labs'); }; if(r.say) speak(r.say);
    $$('.opt',m).forEach(b=>b.onclick=()=>{ const o=r.opts[+b.dataset.j]; if(o.ok){ streak++; score+=streak>2?2:1; SFX.ok(); haptic('light'); b.classList.add('right'); setTimeout(round,180); }
      else { streak=0; SFX.bad(); haptic('error'); b.classList.add('wrong'); $$('.opt',m).forEach((x,j)=>{ if(r.opts[j].ok) x.classList.add('right'); }); setTimeout(round,650); } }); };
  const over=()=>{ clearInterval(iv); const best=score>(S.best[k]||0); if(best) S.best[k]=score; addXP(Math.min(30,score)); const c=addCoins(Math.min(25,score)); save(); SFX.win(); if(best&&score) confetti(70); track('game',{k,score});
    m.innerHTML=`<div class="result rise"><div class="big num">${score}</div><h1>${best&&score?'🏆 ★':t('score')}</h1><div class="sub">★ <span class="num">${S.best[k]||0}</span> · +${c} ${t('bitsCur')}</div>
      <div class="row" style="width:100%"><button class="btn ghost grow" id="ag">↺ ${t('again')}</button><button class="btn grow" id="dn">${t('finish')}</button></div></div>`;
    $('#ag',m).onclick=()=>go('game',k); $('#dn',m).onclick=async()=>{ await interstitial(); go('labs'); }; };
  intro(); };
