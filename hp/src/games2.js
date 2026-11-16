/* ===== Tangram 七巧板 ===== */
const TG_BASE={L1:[[0,0],[8,0],[4,4]],L2:[[0,0],[4,4],[0,8]],S1:[[8,0],[8,4],[6,2]],Q:[[6,2],[8,4],[6,6],[4,4]],S2:[[4,4],[6,6],[2,6]],P:[[0,8],[2,6],[6,6],[4,8]],M:[[8,4],[8,8],[4,8]]};
const TG_TYPE={L1:'L',L2:'L',S1:'S',S2:'S',Q:'Q',P:'P',M:'M'};
const TG_COL={L1:'#c8332a',L2:'#e8b65c',S1:'#3fae7f',S2:'#5aa0d8',Q:'#f3e9d6',P:'#a35bd1',M:'#e0703a'};
const cen=v=>[v.reduce((s,p)=>s+p[0],0)/v.length,v.reduce((s,p)=>s+p[1],0)/v.length];
GAME.tangram=m=>{
  const idx=(S.tgNext||0)%TANGRAMS.length; const F=TANGRAMS[idx];
  const VW=18, top=.6, ox=(VW-F.w)/2, trayY=top+F.hgt+1.2;
  const targets=Object.entries(F.pieces).map(([n,v])=>{const vv=v.map(([x,y])=>[x+ox,y+top]); return {n,type:TG_TYPE[n],v:vv,c:cen(vv),filled:false};});
  const local={}; for(const n in TG_BASE){ const c=cen(TG_BASE[n]); local[n]=TG_BASE[n].map(([x,y])=>[x-c[0],y-c[1]]); }
  const tray={L1:[4.6,trayY+1.4],L2:[13.4,trayY+2.8],M:[2.9,trayY+7.4],Q:[8.2,trayY+6.6],P:[13.6,trayY+6.6],S1:[5.2,trayY+10.6],S2:[12.6,trayY+10.6]};
  const rot0={L1:0,L2:270,M:0,Q:45,P:0,S1:90,S2:0};
  const P=Object.keys(TG_BASE).map(n=>({n,type:TG_TYPE[n],x:tray[n][0],y:tray[n][1],r:rot0[n],f:false,lock:null}));
  const VH=trayY+12.4; let hints=0; const t0=Date.now(); let drag=null;
  function verts(p){ if(p.lock) return p.lock; const a=p.r*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
    return local[p.n].map(([x,y])=>{ if(p.f) x=-x; return [x*c-y*s+p.x, x*s+y*c+p.y]; }); }
  m.innerHTML=`${gameHeader('tangram',`<button class="icon-btn" id="hint" aria-label="${t('hint')}">💡</button>`)}
    <div class="sub" style="text-align:center">${t('tangramHelp')}</div>
    <div class="tg"><svg id="sv" viewBox="0 0 ${VW} ${VH.toFixed(2)}"></svg></div>
    <div class="toolbar"><button class="btn sm ghost" id="flip">↔ ${t('flip')}</button><button class="btn sm ghost" id="hint2">💡 ${t('hint')} ${S.pro?'':`· ${coinHTML} 20`}</button></div>`;
  bindGameX(m); const sv=$('#sv',m);
  function draw(){ const sil=targets.map(tg=>`<polygon points="${tg.v.map(p=>p.join(',')).join(' ')}" fill="#3b2a22" stroke="#3b2a22" stroke-width=".06"/>`).join('');
    const pcs=P.map((p,i)=>`<polygon data-i="${i}" points="${verts(p).map(q=>q.map(v=>v.toFixed(3)).join(',')).join(' ')}" fill="${TG_COL[p.n]}" stroke="${p.lock?'#f7d894':'rgba(0,0,0,.45)'}" stroke-width="${p.lock?.08:.06}" stroke-linejoin="round" style="cursor:${p.lock?'default':'grab'};${p.lock?'':'filter:drop-shadow(0 .15px .25px rgba(0,0,0,.6))'}"/>`).join('');
    sv.innerHTML=`<line x1="0" x2="${VW}" y1="${trayY-.6}" y2="${trayY-.6}" stroke="rgba(232,182,92,.18)" stroke-width=".04" stroke-dasharray=".3 .3"/>${sil}${pcs}`; }
  const pt=e=>{ const r=sv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*VW,(e.clientY-r.top)/r.height*VH]; };
  sv.addEventListener('pointerdown',e=>{ const el=e.target.closest('polygon[data-i]'); if(!el) return; const p=P[+el.dataset.i]; if(p.lock) return;
    const [x,y]=pt(e); drag={p,dx:x-p.x,dy:y-p.y,sx:x,sy:y,moved:0}; P.splice(P.indexOf(p),1); P.push(p); sv.setPointerCapture(e.pointerId); lastP=p; });
  sv.addEventListener('pointermove',e=>{ if(!drag) return; const [x,y]=pt(e); drag.moved=Math.max(drag.moved,Math.hypot(x-drag.sx,y-drag.sy));
    drag.p.x=Math.min(VW-.5,Math.max(.5,x-drag.dx)); drag.p.y=Math.min(VH-.5,Math.max(.5,y-drag.dy)); draw(); });
  const end=()=>{ if(!drag) return; const p=drag.p; if(drag.moved<.25){ p.r=(p.r+45)%360; SFX.tap(); } drag=null; trySnap(p); draw(); };
  sv.addEventListener('pointerup',end); sv.addEventListener('pointercancel',end);
  let lastP=null;
  function matches(p,tg){ const v=verts(p), c=cen(v); if(Math.hypot(c[0]-tg.c[0],c[1]-tg.c[1])>1.3) return false;
    const dx=tg.c[0]-c[0], dy=tg.c[1]-c[1]; return tg.v.every(q=>v.some(w=>Math.hypot(w[0]+dx-q[0],w[1]+dy-q[1])<.45)); }
  function lockTo(p,tg){ p.lock=tg.v; tg.filled=true; p.x=tg.c[0]; p.y=tg.c[1]; SFX.ok(); haptic('success'); }
  function trySnap(p){ for(const tg of targets){ if(!tg.filled&&tg.type===p.type&&matches(p,tg)){ lockTo(p,tg); check(); return; } } }
  function check(){ if(!P.every(p=>p.lock)) return; draw(); S.tgNext=idx+1; save(); const secs=Math.round((Date.now()-t0)/1000); const score=Math.max(60,300-secs-hints*40);
    SFX.gong(); confetti(90); speak(F.h);
    setTimeout(()=>sheet(`<div class="result"><div class="bigseal" style="font-family:var(--f-han);font-weight:700;font-size:${[...F.h].length>2?34:52}px">${F.h}</div><h2>${t('solved')}</h2><div class="py" style="font-size:22px">${F.p}</div><div style="font-size:20px;font-weight:700">${isAr()?F.ar:F.en}</div><button class="btn block" id="ok">${t('next')}</button></div>`,s=>{
      $('#ok',s).onclick=()=>{ closeSheet(); endGame(m,'tangram',score); }; }),600); }
  function hint(){ const p=P.find(p=>!p.lock); if(!p||!spend(20)) return; hints++;
    const tg=targets.find(tg=>!tg.filled&&tg.type===p.type); lockTo(p,tg); draw(); check(); }
  $('#flip',m).onclick=()=>{ const p=P.find(p=>p.n==='P'); if(p&&!p.lock){ p.f=!p.f; SFX.tap(); trySnap(p); draw(); } };
  $('#hint',m).onclick=hint; $('#hint2',m).onclick=hint; draw();
};
/* ===== Chinese Checkers 跳棋 (you vs computer) ===== */
GAME.checkers=m=>{
  const cells=[]; for(let x=-8;x<=8;x++) for(let y=-8;y<=8;y++){ const z=-x-y; if(Math.abs(z)>8) continue; if((x>=-4&&y>=-4&&z>=-4)||(x<=4&&y<=4&&z<=4)) cells.push({x,y,z}); }
  const key=(x,y)=>x+','+y; const idx={}; cells.forEach((c,i)=>{c.i=i; idx[key(c.x,c.y)]=i;});
  const DIR=[[1,-1],[1,0],[0,1],[-1,1],[-1,0],[0,-1]];
  const occ=new Array(cells.length).fill(0); // 1=you, 2=computer
  cells.forEach(c=>{ if(c.x>=5) occ[c.i]=1; if(c.x<=-5) occ[c.i]=2; });
  const goal=(who,c)=>who===1?c.x<=-5:c.x>=5;
  // screen positions: rotate so your home sits at the bottom
  const raw=cells.map(c=>[Math.sqrt(3)*(c.x+c.z/2),1.5*c.z]); const home=cells.filter(c=>c.x>=5).map(c=>raw[c.i]);
  const hc=[home.reduce((s,p)=>s+p[0],0)/10,home.reduce((s,p)=>s+p[1],0)/10]; const ang=Math.PI/2-Math.atan2(hc[1],hc[0]); const ca=Math.cos(ang), sa=Math.sin(ang);
  const pos=raw.map(([x,y])=>[x*ca-y*sa,x*sa+y*ca]); const mnx=Math.min(...pos.map(p=>p[0])), mxx=Math.max(...pos.map(p=>p[0])), mny=Math.min(...pos.map(p=>p[1])), mxy=Math.max(...pos.map(p=>p[1]));
  const VB=[mnx-1.2,mny-1.2,mxx-mnx+2.4,mxy-mny+2.4];
  function movesFrom(i){ const c=cells[i], res=new Map();
    DIR.forEach(([dx,dy])=>{ const j=idx[key(c.x+dx,c.y+dy)]; if(j!==undefined&&!occ[j]) res.set(j,[i,j]); });
    const q=[[i,[i]]], seen=new Set([i]);
    while(q.length){ const [k,path]=q.shift(); const a=cells[k];
      DIR.forEach(([dx,dy])=>{ const mid=idx[key(a.x+dx,a.y+dy)], to=idx[key(a.x+2*dx,a.y+2*dy)];
        if(mid!==undefined&&to!==undefined&&occ[mid]&&!occ[to]&&to!==i&&!seen.has(to)){ seen.add(to); const p=path.concat(to); res.set(to,p); q.push([to,p]); } }); }
    return res; }
  let sel=null, turn=1, moves=0, last=null, busy=false; const t0=Date.now();
  m.innerHTML=`${gameHeader('checkers')}<div class="sub" style="text-align:center" id="st">${t('ccHelp')}</div><div class="cc"><svg id="sv"></svg></div>
    <div class="hud"><div><span>${isAr()?'حركاتك':'Your moves'}</span><b class="num" id="mv">0</b></div><div><span>${isAr()?'في الهدف':'Home'}</span><b class="num" id="hm">0/10</b></div><div><span>${isAr()?'الحاسوب':'Computer'}</span><b class="num" id="ai">0/10</b></div></div>`;
  bindGameX(m); const sv=$('#sv',m); sv.setAttribute('viewBox',VB.map(v=>v.toFixed(2)).join(' '));
  function draw(targets){ const T=targets||new Map();
    let h=`<defs><radialGradient id="mr" cx=".35" cy=".3"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".6" stop-color="#c8332a"/><stop offset="1" stop-color="#6e1410"/></radialGradient>
      <radialGradient id="mj" cx=".35" cy=".3"><stop offset="0" stop-color="#9ff0c8"/><stop offset=".6" stop-color="#2f9e6e"/><stop offset="1" stop-color="#0f4a32"/></radialGradient></defs>`;
    cells.forEach(c=>{ const [x,y]=pos[c.i]; const homeTint=c.x>=5?'rgba(200,51,42,.22)':c.x<=-5?'rgba(63,174,127,.22)':'rgba(0,0,0,.35)';
      h+=`<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r=".42" fill="${homeTint}" stroke="rgba(232,182,92,.28)" stroke-width=".05"/>`; });
    if(last) last.forEach((k,n)=>{ if(n){ const [a,b]=pos[last[n-1]],[c,d]=pos[k]; h+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="rgba(232,182,92,.55)" stroke-width=".09" stroke-linecap="round"/>`; } });
    cells.forEach(c=>{ const [x,y]=pos[c.i]; if(occ[c.i]) h+=`<circle data-i="${c.i}" cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r=".52" fill="url(#${occ[c.i]===1?'mr':'mj'})" stroke="${sel===c.i?'#f7d894':'rgba(0,0,0,.4)'}" stroke-width="${sel===c.i?.14:.05}" style="cursor:pointer"/>`;
      if(T.has(c.i)) h+=`<circle data-t="${c.i}" cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r=".46" fill="rgba(247,216,148,.28)" stroke="#f7d894" stroke-width=".07" style="cursor:pointer"/>`; });
    sv.innerHTML=h; const cnt=w=>cells.filter(c=>occ[c.i]===w&&goal(w,c)).length;
    $('#mv',m).textContent=moves; $('#hm',m).textContent=cnt(1)+'/10'; $('#ai',m).textContent=cnt(2)+'/10'; return cnt; }
  let curT=null;
  sv.onclick=e=>{ if(busy||turn!==1) return; const tEl=e.target.closest('[data-t]'); if(tEl&&sel!==null){ const to=+tEl.dataset.t; doMove(1,curT.get(to)); return; }
    const pEl=e.target.closest('[data-i]'); if(pEl&&occ[+pEl.dataset.i]===1){ sel=+pEl.dataset.i; curT=movesFrom(sel); SFX.tap(); draw(curT); } };
  function doMove(who,path){ const from=path[0],to=path[path.length-1]; occ[to]=occ[from]; occ[from]=0; last=path; sel=null; curT=null; if(who===1){ moves++; if(path.length>2) floatText('×'+(path.length-1),sv); }
    SFX.tap(); const cnt=draw(); if(cnt(who)===10) return finish(who);
    if(moves>=150) return finish(cnt(1)>=cnt(2)?1:2);
    if(who===1){ turn=2; busy=true; $('#st',m).textContent=t('aiTurn'); setTimeout(aiMove,450); } else { turn=1; busy=false; $('#st',m).textContent=t('yourTurn').replace(/—.*$/,'').trim(); } }
  function aiMove(){ let best=null,bs=-1e9;
    cells.forEach(c=>{ if(occ[c.i]!==2) return; const back=-c.x; movesFrom(c.i).forEach((path,to)=>{ const tc=cells[to]; let s=(tc.x-c.x)*10+back*.8+Math.random()*2;
      if(goal(2,c)&&!goal(2,tc)) s-=40; if(goal(2,tc)) s+=3+tc.x; if(s>bs){bs=s;best=path;} }); });
    if(best) doMove(2,best); else { turn=1; busy=false; } }
  function finish(w){ busy=true; const score=w===1?Math.max(80,600-moves*4):40; if(w===1){ S.wins.checkers=(S.wins.checkers||0)+1; save(); }
    setTimeout(()=>endGame(m,'checkers',score,{win:w===1}),700); }
  draw(); $('#st',m).textContent=t('ccHelp');
  cleanup=()=>{busy=true;};
};
/* ===== Xiangqi 象棋 (you are red) ===== */
const XQ_CH={r:{K:'帅',A:'仕',E:'相',H:'马',R:'车',C:'炮',P:'兵'},b:{K:'将',A:'士',E:'象',H:'马',R:'车',C:'炮',P:'卒'}};
const XQ_INFO={K:{p:{r:'shuài',b:'jiàng'},ar:'القائد العام',en:'general'},A:{p:{r:'shì',b:'shì'},ar:'المستشار',en:'advisor'},E:{p:{r:'xiàng',b:'xiàng'},ar:'الوزير (الفيل)',en:'elephant / minister'},
  H:{p:{r:'mǎ',b:'mǎ'},ar:'الحصان',en:'horse'},R:{p:{r:'jū',b:'jū'},ar:'العربة الحربية',en:'chariot'},C:{p:{r:'pào',b:'pào'},ar:'المدفع',en:'cannon'},P:{p:{r:'bīng',b:'zú'},ar:'الجندي',en:'soldier'}};
const XQ_VAL={K:10000,R:600,C:300,H:280,E:120,A:120,P:40};
function xqInit(){ const b=Array.from({length:10},()=>Array(9).fill(null)); const back='RHEAKAEHR';
  for(let c=0;c<9;c++){ b[0][c]='b'+back[c]; b[9][c]='r'+back[c]; }
  b[2][1]=b[2][7]='bC'; b[7][1]=b[7][7]='rC'; for(const c of[0,2,4,6,8]){ b[3][c]='bP'; b[6][c]='rP'; } return b; }
function xqPseudo(b,col){ const mv=[]; const own=(r,c)=>b[r][c]&&b[r][c][0]===col; const inb=(r,c)=>r>=0&&r<10&&c>=0&&c<9;
  const pal=(r,c)=>c>=3&&c<=5&&(col==='r'?r>=7:r<=2);
  for(let r=0;r<10;r++) for(let c=0;c<9;c++){ const p=b[r][c]; if(!p||p[0]!==col) continue; const k=p[1]; const add=(r2,c2)=>{ if(inb(r2,c2)&&!own(r2,c2)) mv.push([r,c,r2,c2]); };
    if(k==='K') [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ if(pal(r+dr,c+dc)) add(r+dr,c+dc); });
    else if(k==='A') [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{ if(pal(r+dr,c+dc)) add(r+dr,c+dc); });
    else if(k==='E') [[2,2],[2,-2],[-2,2],[-2,-2]].forEach(([dr,dc])=>{ const r2=r+dr,c2=c+dc; if(!inb(r2,c2)) return; if(col==='r'?r2<5:r2>4) return; if(b[r+dr/2][c+dc/2]) return; add(r2,c2); });
    else if(k==='H') [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[1,-2],[-1,2],[1,2]].forEach(([dr,dc])=>{ const lr=r+(Math.abs(dr)===2?dr/2:0), lc=c+(Math.abs(dc)===2?dc/2:0); if(inb(lr,lc)&&!b[lr][lc]) add(r+dr,c+dc); });
    else if(k==='R'||k==='C') [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ let r2=r+dr,c2=c+dc,jumped=false;
      while(inb(r2,c2)){ const q=b[r2][c2];
        if(k==='R'){ if(!q) mv.push([r,c,r2,c2]); else { if(q[0]!==col) mv.push([r,c,r2,c2]); break; } }
        else { if(!jumped){ if(!q) mv.push([r,c,r2,c2]); else jumped=true; } else if(q){ if(q[0]!==col) mv.push([r,c,r2,c2]); break; } }
        r2+=dr; c2+=dc; } });
    else if(k==='P'){ const f=col==='r'?-1:1; add(r+f,c); if(col==='r'?r<=4:r>=5){ add(r,c-1); add(r,c+1); } } }
  return mv; }
function xqKing(b,col){ for(let r=0;r<10;r++) for(let c=0;c<9;c++) if(b[r][c]===col+'K') return [r,c]; return null; }
function xqInCheck(b,col){ const k=xqKing(b,col); if(!k) return true; const o=xqKing(b,col==='r'?'b':'r');
  if(o&&o[1]===k[1]){ let clear=true; for(let r=Math.min(o[0],k[0])+1;r<Math.max(o[0],k[0]);r++) if(b[r][k[1]]){clear=false;break;} if(clear) return true; }
  return xqPseudo(b,col==='r'?'b':'r').some(m=>m[2]===k[0]&&m[3]===k[1]); }
function xqApply(b,m){ const nb=b.map(r=>r.slice()); nb[m[2]][m[3]]=nb[m[0]][m[1]]; nb[m[0]][m[1]]=null; return nb; }
function xqLegal(b,col){ return xqPseudo(b,col).filter(m=>!xqInCheck(xqApply(b,m),col)); }
function xqEval(b){ let s=0; for(let r=0;r<10;r++) for(let c=0;c<9;c++){ const p=b[r][c]; if(!p) continue; let v=XQ_VAL[p[1]];
  if(p[1]==='P'&&(p[0]==='r'?r<=4:r>=5)) v+=50; if(p[1]==='H'||p[1]==='R') v+=8-Math.abs(4-c)*2; s+=p[0]==='b'?v:-v; } return s; }
function xqSearch(b,depth,alpha,beta,col){ const moves=xqLegal(b,col); if(!moves.length) return -100000-depth;
  if(depth===0) return col==='b'?xqEval(b):-xqEval(b);
  moves.sort((x,y)=>(b[y[2]][y[3]]?XQ_VAL[b[y[2]][y[3]][1]]:0)-(b[x[2]][x[3]]?XQ_VAL[b[x[2]][x[3]][1]]:0));
  for(const mv of moves){ const s=-xqSearch(xqApply(b,mv),depth-1,-beta,-alpha,col==='r'?'b':'r'); if(s>alpha) alpha=s; if(alpha>=beta) break; } return alpha; }
function xqBest(b,depth){ const moves=shuffle(xqLegal(b,'b')); let best=null,bs=-1e9;
  moves.sort((x,y)=>(b[y[2]][y[3]]?XQ_VAL[b[y[2]][y[3]][1]]:0)-(b[x[2]][x[3]]?XQ_VAL[b[x[2]][x[3]][1]]:0));
  for(const mv of moves){ const s=-xqSearch(xqApply(b,mv),depth-1,-1e9,-bs,'r'); if(s>bs){bs=s;best=mv;} } return best; }
GAME.xiangqi=m=>{
  let b=xqInit(), sel=null, legal=[], last=null, busy=false, hist=[], plies=0, depth=S.xqHard?3:2; const t0=Date.now();
  const X=c=>(6+11*c), Y=r=>(6+11*r);
  m.innerHTML=`${gameHeader('xiangqi',`<button class="icon-btn" id="und" aria-label="${t('undo')}">↶</button>`)}
    <div class="seg" style="justify-content:center"><button data-d="2" aria-pressed="${depth===2}">${t('easy')}</button><button data-d="3" aria-pressed="${depth===3}">${t('hard')}</button></div>
    <div class="xq" id="bd"></div><div class="card tight pieceinfo row" id="info"></div><div class="sub" id="st" style="text-align:center"></div>`;
  bindGameX(m); const bd=$('#bd',m); bd.style.maxWidth='440px';
  let grid=`<svg viewBox="0 0 100 111"><rect x="0" y="0" width="100" height="111" rx="4" fill="#e7cf9f"/><rect x="2" y="2" width="96" height="107" rx="3" fill="none" stroke="#8a5a26" stroke-width=".5"/>`;
  for(let r=0;r<10;r++) grid+=`<line x1="${X(0)}" x2="${X(8)}" y1="${Y(r)}" y2="${Y(r)}" stroke="#6b4320" stroke-width=".35"/>`;
  for(let c=0;c<9;c++){ if(c===0||c===8) grid+=`<line x1="${X(c)}" x2="${X(c)}" y1="${Y(0)}" y2="${Y(9)}" stroke="#6b4320" stroke-width=".35"/>`; else { grid+=`<line x1="${X(c)}" x2="${X(c)}" y1="${Y(0)}" y2="${Y(4)}" stroke="#6b4320" stroke-width=".35"/><line x1="${X(c)}" x2="${X(c)}" y1="${Y(5)}" y2="${Y(9)}" stroke="#6b4320" stroke-width=".35"/>`; } }
  grid+=`<line x1="${X(3)}" y1="${Y(0)}" x2="${X(5)}" y2="${Y(2)}" stroke="#6b4320" stroke-width=".35"/><line x1="${X(5)}" y1="${Y(0)}" x2="${X(3)}" y2="${Y(2)}" stroke="#6b4320" stroke-width=".35"/><line x1="${X(3)}" y1="${Y(7)}" x2="${X(5)}" y2="${Y(9)}" stroke="#6b4320" stroke-width=".35"/><line x1="${X(5)}" y1="${Y(7)}" x2="${X(3)}" y2="${Y(9)}" stroke="#6b4320" stroke-width=".35"/>`;
  grid+=`<text x="${X(2)}" y="${(Y(4)+Y(5))/2+2.4}" text-anchor="middle" font-size="6.5" fill="#8a5a26" font-family="Ma Shan Zheng,serif">楚 河</text><text x="${X(6)}" y="${(Y(4)+Y(5))/2+2.4}" text-anchor="middle" font-size="6.5" fill="#8a5a26" font-family="Ma Shan Zheng,serif">汉 界</text></svg>`;
  const info=(p,extra='')=>{ if(!p){ $('#info',m).innerHTML=`<span class="sub">${extra}</span>`; return; } const I=XQ_INFO[p[1]], ch=XQ_CH[p[0]][p[1]];
    $('#info',m).innerHTML=`<span class="han" style="font-size:34px;font-weight:700;color:${p[0]==='r'?'var(--red2)':'var(--ivory)'}">${ch}</span><div class="grow"><span class="py">${I.p[p[0]]}</span><div>${isAr()?I.ar:I.en}</div></div><button class="speak" id="sp">🔊</button>`;
    $('#sp',m).onclick=()=>speak(ch); };
  function draw(){ let h=grid;
    if(last) h+=`<div class="last" style="left:${X(last[1])}%;top:${Y(last[0])/111*100}%"></div><div class="last" style="left:${X(last[3])}%;top:${Y(last[2])/111*100}%"></div>`;
    for(let r=0;r<10;r++) for(let c=0;c<9;c++){ const p=b[r][c]; if(p) h+=`<button class="pc ${p[0]} ${sel&&sel[0]===r&&sel[1]===c?'sel':''}" data-r="${r}" data-c="${c}" style="left:${X(c)}%;top:${Y(r)/111*100}%">${XQ_CH[p[0]][p[1]]}</button>`; }
    legal.forEach(mv=>{ h+=`<button class="dot ${b[mv[2]][mv[3]]?'cap':''}" data-r="${mv[2]}" data-c="${mv[3]}" data-m="1" style="left:${X(mv[3])}%;top:${Y(mv[2])/111*100}%"></button>`; });
    bd.innerHTML=h; }
  bd.onclick=e=>{ if(busy) return; const el=e.target.closest('[data-r]'); if(!el) return; const r=+el.dataset.r, c=+el.dataset.c;
    if(el.dataset.m){ const mv=legal.find(x=>x[2]===r&&x[3]===c); if(mv) play(mv); return; }
    const p=b[r][c]; if(p&&p[0]==='r'){ sel=[r,c]; legal=xqLegal(b,'r').filter(x=>x[0]===r&&x[1]===c); SFX.tap(); speak(XQ_CH.r[p[1]]); info(p); draw(); }
    else if(p){ info(p); speak(XQ_CH.b[p[1]]); } };
  function status(){ const chk=xqInCheck(b,'r'); $('#st',m).innerHTML=busy?t('aiTurn'):(chk?`<b style="color:var(--bad)">${t('check_')}</b> · `:'')+(busy?'':t('yourTurn')); }
  function play(mv){ hist.push(b); const cap=b[mv[2]][mv[3]]; b=xqApply(b,mv); last=mv; sel=null; legal=[]; plies++; if(cap){ SFX.ok(); floatText(XQ_CH[cap[0]][cap[1]],bd); } else SFX.tap(); draw();
    if(!xqLegal(b,'b').length) return over(true); busy=true; status();
    setTimeout(()=>{ const am=xqBest(b,depth); if(!am) return over(true); const cap2=b[am[2]][am[3]]; b=xqApply(b,am); last=am; plies++; busy=false; draw(); info(b[am[2]][am[3]]);
      if(cap2) SFX.bad(); else SFX.tap(); if(xqInCheck(b,'r')) { haptic('error'); } if(!xqLegal(b,'r').length) return over(false); if(plies>=300) return over(null); status(); },350); }
  function over(win){ busy=true; const secs=Math.round((Date.now()-t0)/1000); if(win){ S.wins.xiangqi=(S.wins.xiangqi||0)+1; save(); }
    setTimeout(()=>endGame(m,'xiangqi',win?Math.max(200,(depth===3?1500:900)-plies*3):30,{win:!!win,note:win===null?`<div class="sub">${t('draw')}</div>`:''}),600); }
  $('#und',m).onclick=()=>{ if(busy||hist.length===0||!spend(10)) return; b=hist.pop(); last=null; sel=null; legal=[]; plies=Math.max(0,plies-2); draw(); status(); };
  $$('[data-d]',m).forEach(x=>x.onclick=()=>{ depth=+x.dataset.d; S.xqHard=depth===3; save(); $$('[data-d]',m).forEach(y=>y.setAttribute('aria-pressed',y===x)); });
  draw(); info(null,isAr()?'انقر على أي قطعة لتعرف اسمها ومعناها':'Tap any piece to learn its name and meaning'); status();
};
