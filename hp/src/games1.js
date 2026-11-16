/* ===== Mahjong Solitaire 麻将: match each character tile with its meaning tile ===== */
const MJ_LAYOUTS=[
  ()=>{const p=[];for(const y of[0,2,4,6])for(const x of[0,2,4,6,8,10])p.push({x,y,z:0});for(const y of[2,4])for(const x of[2,4,6,8])p.push({x,y,z:1});for(const y of[2,4])for(const x of[4,6])p.push({x,y,z:2});return p;},
  ()=>{const p=[];for(const y of[0,2,4,6,8])for(const x of[0,2,4,6,8,10])p.push({x,y,z:0});for(const y of[2,4,6])for(const x of[2,4,6,8])p.push({x,y,z:1});for(const y of[3,5])for(const x of[4,6])p.push({x,y,z:2});return p;}
];
function mjFree(t,all){ if(t.gone) return false; const live=all.filter(o=>!o.gone&&o!==t);
  if(live.some(o=>o.z===t.z+1&&Math.abs(o.x-t.x)<2&&Math.abs(o.y-t.y)<2)) return false;
  const L=live.some(o=>o.z===t.z&&o.x===t.x-2&&Math.abs(o.y-t.y)<2), R=live.some(o=>o.z===t.z&&o.x===t.x+2&&Math.abs(o.y-t.y)<2); return !(L&&R); }
function mjDeal(pos,pairs){ // assign pairs to positions in a guaranteed removable order
  for(let tries=0;tries<200;tries++){ const tiles=pos.map(p=>({...p,gone:false})); const order=shuffle(pairs.map((_,i)=>i)); let ok=true;
    for(const pi of order){ const free=tiles.filter(t=>!t.gone&&t.pair===undefined&&mjFree(t,tiles)); if(free.length<2){ok=false;break;}
      const [a,b]=pick(free,2); a.pair=pi; a.kind='h'; b.pair=pi; b.kind='m'; a.gone=b.gone=true; }
    if(ok){ tiles.forEach(t=>t.gone=false); if(Math.random()<.5) tiles.forEach(t=>{}); return tiles; } }
  return null; }
GAME.mahjong=m=>{
  const layout=MJ_LAYOUTS[(S.wins.mahjong||0)>=2?1:0](); const n=layout.length/2;
  const words=pick(gamePool(2).filter(w=>meaning(w,1).length<=16),n);
  let tiles=mjDeal(layout,words); let sel=null, score=0, matches=0, t0=Date.now(), lastMatch=0;
  m.innerHTML=`${gameHeader('mahjong',`<button class="icon-btn" id="hint" aria-label="${t('hint')}">💡</button>`)}
    <div class="hud"><div><span>★</span><b class="num" id="sc">0</b></div><div><span>${t('time')}</span><b class="num" id="tm">0:00</b></div><div><span>${isAr()?'أزواج':'Pairs'}</span><b class="num" id="pr">0/${n}</b></div></div>
    <div class="sub" style="text-align:center">${t('matchHelp')}</div>
    <div class="mjwrap" id="mj"></div>
    <div class="toolbar"><button class="btn sm ghost" id="hint2">💡 ${t('hint')} ${S.pro?'':`· ${coinHTML} 15`}</button><button class="btn sm ghost" id="shuf">🔀 ${t('shuffle')} ${S.pro?'':`· ${coinHTML} 25`}</button></div>`;
  bindGameX(m);
  const wrap=$('#mj',m); const W0=Math.min(m.clientWidth||360,520); const tw=Math.min(56,(W0-24)/6.3), th=tw*1.3;
  const maxY=Math.max(...layout.map(p=>p.y)); wrap.style.width=(6*tw+16)+'px'; wrap.style.height=((maxY/2+1)*th+18)+'px';
  const style={classic:'',jade:'filter:hue-rotate(95deg) saturate(.6)',night:'filter:invert(.92) hue-rotate(180deg) sepia(.35)'}[S.tileStyle]||'';
  function draw(){ wrap.innerHTML=tiles.map((tl,i)=>{ const w=words[tl.pair]; const free=mjFree(tl,tiles);
      const inner=tl.kind==='h'?`<span class="han" style="font-size:${[...w.h].length>1?tw*.36:tw*.58}px">${esc(w.h)}</span><span class="tp">${esc(w.p)}</span>`:`<span class="tm" ${meanIsFallback(w)?'dir="ltr"':''}>${esc(meaning(w,1))}</span>`;
      return `<button class="tile ${tl.gone?'gone':''} ${free?'':'blocked'} ${sel===i?'sel':''}" data-i="${i}" style="left:${tl.x/2*tw+10-tl.z*6}px;top:${tl.y/2*th+16-tl.z*8}px;width:${tw-2}px;height:${th-2}px;z-index:${tl.z*100+tl.y*6+tl.x};${style}">${inner}</button>`; }).join('');
    $$('.tile',wrap).forEach(b=>b.onclick=()=>tap(+b.dataset.i)); }
  function tap(i){ const tl=tiles[i]; if(tl.gone) return; if(!mjFree(tl,tiles)){ const b=$(`[data-i="${i}"]`,wrap); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
    if(tl.kind==='h') speak(words[tl.pair].h);
    if(sel===null||sel===i){ sel=sel===i?null:i; SFX.tap(); draw(); return; }
    const a=tiles[sel]; if(a.pair===tl.pair&&a.kind!==tl.kind){ a.gone=tl.gone=true; matches++; const now=Date.now(); const combo=now-lastMatch<4000; lastMatch=now; const g=10+(combo?8:0); score+=g; SFX.ok(); haptic('success');
        srsMark(words[tl.pair].id,true); floatText('+'+g,$(`[data-i="${i}"]`,wrap)); sel=null; draw(); hud();
        if(matches===n){ const secs=Math.round((Date.now()-t0)/1000); score+=Math.max(0,300-secs); S.wins.mahjong=(S.wins.mahjong||0)+1; save(); clearInterval(iv); setTimeout(()=>endGame(m,'mahjong',score),500); return; }
        if(!movesLeft()) toast(t('noMoves'));
    } else { SFX.bad(); sel=i; draw(); } }
  function movesLeft(){ const f=tiles.filter(x=>!x.gone&&mjFree(x,tiles)); return f.some(a=>f.some(b=>b!==a&&b.pair===a.pair&&b.kind!==a.kind)); }
  function hud(){ $('#sc',m).textContent=fmt(score); $('#pr',m).textContent=matches+'/'+n; }
  const iv=setInterval(()=>{ const s=Math.round((Date.now()-t0)/1000); const e=$('#tm',m); if(e) e.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); },1000); cleanup=()=>clearInterval(iv);
  function hint(){ const f=tiles.map((x,i)=>[x,i]).filter(([x])=>!x.gone&&mjFree(x,tiles)); for(const [a,i] of f) for(const [b,j] of f) if(i!==j&&a.pair===b.pair&&a.kind!==b.kind){ if(!spend(15)) return; draw(); [i,j].forEach(k=>$(`[data-i="${k}"]`,wrap).classList.add('hint')); return; }
    toast(t('noMoves')); }
  function reshuffle(){ if(!spend(25)) return; const live=tiles.filter(x=>!x.gone); const pairs=[...new Set(live.map(x=>x.pair))]; const pos=live.map(({x,y,z})=>({x,y,z}));
    const nt=mjDeal(pos,pairs.map(p=>p)); if(!nt) return; nt.forEach(x=>x.pair=pairs[x.pair]); tiles=tiles.filter(x=>x.gone).concat(nt); sel=null; draw(); SFX.tap(); }
  $('#hint',m).onclick=hint; $('#hint2',m).onclick=hint; $('#shuf',m).onclick=reshuffle; draw();
};
/* ===== Lantern Riddles 灯谜 ===== */
GAME.riddles=m=>{
  const rounds=pick(RIDDLES,8), allA=RIDDLES.map(r=>r.a); let r=0, score=0, streak=0, hintUsed=false;
  function q(){ const R=rounds[r]; hintUsed=false; const opts=shuffle([R.a,...pick(allA.filter(a=>a!==R.a),3)]);
    m.innerHTML=`${gameHeader('riddles')}<div class="bar"><i style="width:${r/rounds.length*100}%"></i></div>
     <div class="lanternbox rise"><img src="${ART.lantern}" alt=""><div class="q"><span class="eyebrow">灯谜 · ${r+1}/${rounds.length}</span><div class="han">${esc(R.q)}</div><div class="sub" style="color:#f3e9d6">${t('riddleHelp')}</div></div></div>
     <div class="opts">${opts.map(o=>`<button class="opt" data-o="${o}"><span class="han" style="font-size:40px">${o}</span></button>`).join('')}</div>
     <div id="hx" class="sub" style="text-align:center;min-height:22px"></div>
     <button class="btn sm ghost" id="hb" style="align-self:center">💡 ${t('showHint')} ${S.pro?'':`· ${coinHTML} 10`}</button>`;
    bindGameX(m);
    $('#hb',m).onclick=()=>{ if(hintUsed||!spend(10)) return; hintUsed=true; $('#hx',m).textContent=isAr()?R.hAr:R.hEn; $('#hb',m).remove(); };
    $$('.opt',m).forEach(b=>b.onclick=()=>{ const ok=b.dataset.o===R.a; $$('.opt',m).forEach(x=>{ x.onclick=null; if(x.dataset.o===R.a) x.classList.add('right'); else if(x===b) x.classList.add('wrong'); });
      if(ok){ streak++; const g=(hintUsed?10:20)+streak*2; score+=g; SFX.ok(); floatText('+'+g,b); } else { streak=0; SFX.bad(); }
      speak(R.a);
      const f=document.createElement('div'); f.className='feedback rise '+(ok?'good':'bad');
      f.innerHTML=`<div><div class="row"><span class="han" style="font-size:44px;font-weight:700">${R.a}</span><div class="grow"><span class="py">${R.p}</span><div>${isAr()?R.ar:R.en}</div></div></div><div class="sub" style="color:#e9dccb">${isAr()?R.hAr:R.hEn}</div><button class="btn block ${ok?'jade':'red'}" id="nx">${t('next')}</button></div>`;
      document.body.appendChild(f); $('#nx',f).onclick=()=>{ f.remove(); r++; r<rounds.length?q():endGame(m,'riddles',score); }; }); }
  q();
};
/* ===== Idiom Chain 成语接龙 ===== */
GAME.idioms=m=>{
  const succ=h=>IDIOMS.filter(x=>x.h[0]===h[3]&&x.h!==h);
  const starters=IDIOMS.filter(x=>succ(x.h).length);
  let cur=pick(starters,1)[0], r=0, score=0, chain=1, timer=null, left=20; const ROUNDS=12; const used=new Set([cur.h]);
  const card=(x,hl,sm)=>`<div class="idiom ${sm?'sm':''}">${[...x.h].map((c,i)=>`<span class="${hl==='last'&&i===3||hl==='first'&&i===0?'hl':''}">${c}</span>`).join('')}</div>`;
  const tr=x=>isAr()?x.ar:x.en;
  function round(){
    let next=succ(cur.h).filter(x=>!used.has(x.h)); if(!next.length) next=succ(cur.h);
    if(!next.length){ toast('🎉 '+t('chainDone')); score+=chain*10; chain=1; cur=pick(starters.filter(x=>!used.has(x.h)),1)[0]||pick(starters,1)[0]; used.add(cur.h); next=succ(cur.h); }
    const right=pick(next,1)[0]; const wrong=pick(IDIOMS.filter(x=>x.h[0]!==cur.h[3]&&x.h!==cur.h),2); const opts=shuffle([right,...wrong]);
    m.innerHTML=`${gameHeader('idioms',`<span class="chip">⛓ ${chain}</span>`)}<div class="timerbar"><i id="tb" style="width:100%"></i></div>
      <div class="paper col rise" style="align-items:center;text-align:center;gap:10px"><div class="stamp">接</div>${card(cur,'last')}<div class="py" style="color:var(--red)">${esc(cur.p)}</div><div style="font-weight:600">${esc(tr(cur))}</div></div>
      <div class="sub" style="text-align:center">${t('idiomHelp')} <span class="han" style="color:var(--gold2);font-size:20px;font-weight:700">${cur.h[3]}</span></div>
      <div class="col">${opts.map((o,j)=>`<button class="opt" data-j="${j}" style="flex-direction:column;gap:6px">${card(o,'first',true)}<span class="sub">${esc(tr(o))}</span></button>`).join('')}</div>
      <div class="hud"><div><span>${isAr()?'الجولة':'Round'}</span><b class="num">${r+1}/${ROUNDS}</b></div><div><span>★</span><b class="num">${score}</b></div><div><span>${t('combo')}</span><b class="num">⛓${chain}</b></div></div>`;
    bindGameX(m); speak(cur.h); left=20; clearInterval(timer);
    timer=setInterval(()=>{ left--; const tb=$('#tb',m); if(tb) tb.style.width=(left/20*100)+'%'; if(left<=0){ clearInterval(timer); answer(-1); } },1000); cleanup=()=>clearInterval(timer);
    function answer(j){ clearInterval(timer); const o=opts[j]; const ok=!!o&&o.h[0]===cur.h[3];
      $$('.opt',m).forEach((b,k)=>{ b.onclick=null; if(opts[k].h[0]===cur.h[3]) b.classList.add('right'); else if(k===j) b.classList.add('wrong'); });
      if(ok){ const g=10+left+chain*3; score+=g; chain++; SFX.ok(); floatText('+'+g,$$('.opt',m)[j]); cur=o; used.add(o.h); } else { SFX.bad(); chain=1; cur=right; used.add(right.h); }
      setTimeout(()=>{ r++; r<ROUNDS?round():(clearInterval(timer),endGame(m,'idioms',score)); },ok?700:1500); }
    $$('.opt',m).forEach(b=>b.onclick=()=>answer(+b.dataset.j));
  }
  round();
};
