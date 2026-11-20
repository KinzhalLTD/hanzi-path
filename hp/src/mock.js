/* ===== HSK mock exams: timed practice tests modelled on the HSK sections (listening, reading and, from HSK 3, writing),
   no feedback until the end, a score on the HSK scale (HSK 1–2: 200, pass 120; HSK 3–6: 300, pass 180) and a predicted
   score from the last three mocks. Practice only – not the official test. Free: one mock a week; PRO: unlimited. ===== */
const MOCK={1:{n:[10,10,0],min:20},2:{n:[10,10,0],min:20},3:{n:[10,10,5],min:30},4:{n:[10,12,6],min:35},5:{n:[12,12,6],min:40},6:{n:[12,14,6],min:45}};
const MSEC=[['听力','الاستماع','Listening'],['阅读','القراءة','Reading'],['书写','الكتابة','Writing']];
const weekKey=()=>{ const d=new Date(), j=new Date(d.getFullYear(),0,1); return d.getFullYear()+'w'+Math.ceil(((d-j)/864e5+j.getDay()+1)/7); };
const mockFreeLeft=()=>S.pro||S.mockWeek!==weekKey();
function mockQs(L){ const cfg=MOCK[L], pool=(byLevel[L]||[]).filter(w=>w.ex), all=(byLevel[L]||[]); const used=new Set(), qs=[];
  const take=(f,n)=>{ const out=[]; for(const w of shuffle(pool.slice())){ if(out.length>=n) break; if(used.has(w.id)||!f(w)) continue; used.add(w.id); out.push(w); } return out; };
  const others=w=>pick(all.filter(x=>x.id!==w.id&&x.h!==w.h&&meaning(x)!==meaning(w)),3);
  // listening: hear a word → its characters; hear a sentence → its meaning
  const nl=cfg.n[0], half=Math.ceil(nl/2);
  take(()=>true,half).forEach(w=>qs.push({s:0,k:'listen',w,opts:shuffle([w,...others(w)])}));
  take(w=>w.ex,nl-half).forEach(w=>qs.push({s:0,k:'slisten',w,opts:slistenOptions(w,all)}));
  // reading: word → meaning; sentence gap
  const nr=cfg.n[1], hr=Math.floor(nr/2);
  take(()=>true,hr).forEach(w=>qs.push({s:1,k:'mean',w,opts:shuffle([w,...others(w)])}));
  take(w=>canQ('gap',w),nr-hr).forEach(w=>qs.push({s:1,k:'gap',w,opts:gapOptions(w,all)}));
  // writing: put the words of a sentence in order
  take(w=>canQ('build',w),cfg.n[2]).forEach(w=>qs.push({s:2,k:'build',w,toks:buildTiles(w.ex)}));
  return qs; }
SCREENS.mock=(m,a)=>{ const ar=isAr(); const L=(a&&a.l)||Math.max(1,Math.min(6,curLevel())); S.mocks=S.mocks||{}; const hist=S.mocks[L]||[];
  const max=MOCK[L].n[2]?300:200, pass=MOCK[L].n[2]?180:120, pred=hist.length?Math.round(hist.slice(-3).reduce((s,x)=>s+x.score,0)/Math.min(3,hist.length)):null;
  m.innerHTML=`<div class="screen"><div class="row" style="gap:10px"><button class="icon-btn" id="mb" aria-label="${ar?'رجوع':'Back'}">${ar?'›':'‹'}</button><h1 class="grow" style="margin:0">${ar?'امتحان HSK التجريبي':'HSK mock exam'} <span class="han" style="font-size:.75em">模拟考试</span></h1></div>
    <div class="seg mocklv" role="tablist">${[1,2,3,4,5,6].map(l=>`<button data-l="${l}" aria-pressed="${l===L}">HSK ${l}</button>`).join('')}</div>
    <div class="card col" style="gap:10px"><div class="row" style="justify-content:space-between"><b>HSK ${L}</b><span class="sub">⏱ ${MOCK[L].min} ${ar?'دقيقة':'min'}</span></div>
      ${MSEC.map((s,i)=>MOCK[L].n[i]?`<div class="row" style="justify-content:space-between"><span><span class="han">${s[0]}</span> · ${ar?s[1]:s[2]}</span><span class="num">${MOCK[L].n[i]} ${ar?'سؤالًا':'questions'} · 100</span></div>`:'').join('')}
      <div class="row" style="justify-content:space-between"><b>${ar?'المجموع':'Total'}</b><b class="num">${max} · ${ar?'النجاح':'pass'} ${pass}</b></div></div>
    ${pred!=null?`<div class="card row mockpred"><div class="grow"><div class="sub">${ar?'درجتك المتوقعة (آخر 3 امتحانات)':'Predicted score (last 3 mocks)'}</div><b class="num" style="font-size:28px">${pred}<span class="sub"> / ${max}</span></b></div><span class="chip ${pred>=pass?'ok':''}">${pred>=pass?(ar?'ناجح متوقّع ✓':'On track to pass ✓'):(ar?'تحت درجة النجاح':'Below pass mark')}</span></div>`:''}
    ${hist.length?`<div class="col" style="gap:6px"><b>${ar?'محاولاتك':'Your attempts'}</b>${hist.slice(-5).reverse().map(x=>`<div class="row mockrow"><span class="sub">${new Date(x.d).toLocaleDateString(ar?'ar-SA-u-ca-gregory-nu-latn':'en-GB')}</span><span class="grow"></span><span class="num">${x.sec.map(v=>v==null?'–':v).join(' · ')}</span><b class="num">${x.score}</b></div>`).join('')}</div>`:''}
    <button class="btn block" id="mgo">${mockFreeLeft()?(ar?'ابدأ الامتحان':'Start the exam'):(ar?'🔒 امتحان أسبوعي مجاني · PRO بلا حدود':'🔒 One free mock a week · PRO unlimited')}</button>
    <p class="sub" style="margin:0">${ar?'امتحان تدريبي يحاكي أقسام HSK وتوزيع درجاته، وليس الامتحان الرسمي.':'A practice test modelled on the HSK sections and scoring; not the official exam.'}</p></div>`;
  $('#mb',m).onclick=()=>go('home');
  $$('.mocklv button',m).forEach(b=>b.onclick=()=>{ SFX.tap(); route={name:'mock',arg:{l:+b.dataset.l}}; render(); });
  $('#mgo',m).onclick=()=>{ if(!mockFreeLeft()){ paywall('mock'); return; } if(!S.pro){ S.mockWeek=weekKey(); save(); } track('mock_start',{level:L}); mockRun(m,L); }; };
function mockRun(m,L){ const ar=isAr(), qs=mockQs(L), ans=new Array(qs.length).fill(null), end=Date.now()+MOCK[L].min*60e3; let i=0, tm=null;
  const clock=()=>{ if(route.name!=='mock'){ clearInterval(tm); return; } const s=Math.max(0,Math.round((end-Date.now())/1000)); const el=$('#mclk',m); if(el) el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; if(s<=0) finish(); };
  tm=setInterval(clock,1000);
  function show(){ const q=qs[i], w=q.w, sec=MSEC[q.s]; let prompt='', body='';
    if(q.k==='listen'){ prompt=`<div class="sub">${ar?'استمع واختر الكلمة':'Listen and choose the word'}</div><button class="speak xl" id="sp" aria-label="${ar?'استمع':'Listen'}">🔊</button>`; body=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); }
    if(q.k==='slisten'){ prompt=`<div class="sub">${ar?'استمع إلى الجملة واختر معناها':'Listen to the sentence and choose its meaning'}</div><button class="speak xl" id="sp" aria-label="${ar?'استمع':'Listen'}">🔊</button>`; body=q.opts.map((o,j)=>`<button class="opt" data-j="${j}" style="font-size:15px">${esc(o)}</button>`).join(''); }
    if(q.k==='mean'){ prompt=`<div class="sub">${t('whatMeans')}</div><div class="big han">${esc(w.h)}</div>`; body=q.opts.map((o,j)=>`<button class="opt" data-j="${j}">${mean(o)}</button>`).join(''); }
    if(q.k==='gap'){ const p=w.ex.zh.split(w.h); prompt=`<div class="sub">${t('qGap')}</div><div class="gapline han" dir="ltr" lang="zh">${esc(p[0])}<span class="blank">${'＿'.repeat([...w.h].length)}</span>${esc(p[1])}</div>`; body=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); }
    if(q.k==='build'){ const tiles=q.tiles||(q.tiles=shuffle(q.toks.map((x,j)=>({x,j})))), cur=ans[i]||[];
      prompt=`<div class="sub">${ar?'رتّب الكلمات لتكوين جملة صحيحة':'Put the words in order to make a sentence'}</div><div class="mockline han" dir="ltr" lang="zh">${cur.map(j=>esc(tiles[j].x)).join('')||'&nbsp;'}</div>`;
      body=`<div class="mocktiles" dir="ltr">${tiles.map((tl,j)=>`<button class="opt mtile han" data-t="${j}"${cur.includes(j)?' disabled':''}>${esc(tl.x)}</button>`).join('')}</div><button class="btn ghost sm" id="mclr">${ar?'مسح':'Clear'}</button>`; }
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i style="width:${(i/qs.length*100).toFixed(1)}%"></i></div><span class="chip num" id="mclk">--:--</span></div>
      <div class="row" style="justify-content:space-between"><span class="eyebrow"><span class="han">${sec[0]}</span> · ${ar?sec[1]:sec[2]}</span><span class="sub num">${i+1}/${qs.length}</span></div>
      <div class="prompt rise" style="padding-top:8px">${prompt}</div><div class="opts">${body}</div><div class="grow"></div>
      <div class="navpair"><button class="btn ghost" id="mpv"${i?'':' disabled'}>${ar?'السابق':'Previous'}</button><button class="btn" id="mnx">${i<qs.length-1?(ar?'التالي':'Next'):(ar?'سلّم الامتحان':'Submit')}</button></div>`;
    clock();
    const sp=$('#sp',m); if(sp){ const say=()=>speak(q.k==='listen'?w.h:w.ex.zh); sp.onclick=say; if(ans[i]==null) setTimeout(say,250); }
    $$('.opt[data-j]',m).forEach(b=>{ if(ans[i]===+b.dataset.j) b.classList.add('sel'); b.onclick=()=>{ SFX.tap(); ans[i]=+b.dataset.j; $$('.opt[data-j]',m).forEach(x=>x.classList.toggle('sel',x===b)); }; });
    $$('.mtile',m).forEach(b=>b.onclick=()=>{ SFX.tap(); ans[i]=(ans[i]||[]).concat(+b.dataset.t); show(); });
    const cl=$('#mclr',m); if(cl) cl.onclick=()=>{ ans[i]=null; show(); };
    $('#qx',m).onclick=()=>{ clearInterval(tm); go('mock',{l:L}); };
    $('#mpv',m).onclick=()=>{ if(i){ i--; show(); } };
    $('#mnx',m).onclick=()=>{ if(i<qs.length-1){ i++; show(); } else finish(); }; }
  let done=false;
  function finish(){ if(done) return; done=true; clearInterval(tm);
    const ok=qs.map((q,j)=>{ const a=ans[j]; if(a==null) return false; if(q.k==='slisten') return q.opts[a]===exMeaning(q.w.ex); if(q.k==='build'){ const tl=q.tiles||[]; return a.map(k=>tl[k].x).join('')===q.toks.join(''); } return q.opts[a].id===q.w.id||q.opts[a].h===q.w.h; });
    const sec=[0,1,2].map(s=>{ const idx=qs.map((q,j)=>q.s===s?j:-1).filter(j=>j>=0); return idx.length?Math.round(idx.filter(j=>ok[j]).length/idx.length*100):null; });
    const score=sec.reduce((a,v)=>a+(v||0),0), max=MOCK[L].n[2]?300:200, pass=MOCK[L].n[2]?180:120;
    S.mocks=S.mocks||{}; (S.mocks[L]=S.mocks[L]||[]).push({d:Date.now(),score,sec}); S.mocks[L]=S.mocks[L].slice(-20); save();
    track('mock_done',{level:L,score,pass:score>=pass}); addXP(20+Math.round(score/10));
    qs.forEach((q,j)=>{ try{ srsMark(q.w.id,ok[j]); }catch(e){} }); save();
    const missed=qs.filter((q,j)=>!ok[j]);
    m.innerHTML=`<div class="result rise"><div class="bao-hop">${bao(score>=pass?'cool':'happy',100)}</div><div class="eyebrow">HSK ${L} · ${ar?'امتحان تجريبي':'mock exam'}</div>
      <div class="bigseal num" style="font-size:40px">${score}</div><div class="sub">/ ${max} · ${ar?'النجاح':'pass'} ${pass}</div>
      <h2 style="margin:4px 0">${score>=pass?(ar?'ناجح! 🎉':'Pass! 🎉'):score>=pass*.8?(ar?'قريب جدًا، واصل التدريب':'Close – keep practising'):(ar?'واصل التدريب، وستتحسن درجتك':'Keep practising; your score will climb')}</h2>
      <div class="col" style="gap:6px;width:100%">${MSEC.map((s,k)=>sec[k]==null?'':`<div class="row mockrow"><span><span class="han">${s[0]}</span> · ${ar?s[1]:s[2]}</span><span class="grow"></span><b class="num">${sec[k]} / 100</b></div>`).join('')}</div>
      ${missed.length?`<details class="card" style="width:100%;text-align:start"><summary>${ar?'الكلمات التي أخطأت فيها':'Words you missed'} (${missed.length})</summary><div class="col" style="gap:6px;margin-top:8px">${missed.map(q=>`<div class="row" style="gap:10px"><span class="han" style="font-size:20px">${esc(q.w.h)}</span><span class="py">${esc(q.w.p)}</span><span class="sub grow">${mean(q.w,1)}</span></div>`).join('')}</div></details>`:''}
      <button class="btn block" id="mag">${ar?'عودة إلى الامتحانات':'Back to mock exams'}</button></div>`;
    confetti(score>=pass?120:40); score>=pass?SFX.win():SFX.tap();
    $('#mag',m).onclick=()=>go('mock',{l:L}); }
  show(); }
/* doors: Home (after the placement card) and Me */
function mockCard(){ const ar=isAr(), L=Math.max(1,Math.min(6,curLevel())), h=(S.mocks||{})[L]||[];
  return `<button class="card row fbanner" id="mockc"><span class="fbi" aria-hidden="true">📝</span><div class="grow" style="text-align:start;min-width:0"><b>${ar?`امتحان HSK ${L} التجريبي`:`HSK ${L} mock exam`}</b><div class="sub">${h.length?(ar?`آخر درجة: ${h[h.length-1].score}`:`Last score: ${h[h.length-1].score}`):(ar?'امتحان موقوت بدرجة متوقعة':'Timed test with a predicted score')}</div></div><span aria-hidden="true">⏱</span></button>`; }
{ const _mh=SCREENS.home; SCREENS.home=(m,a)=>{ _mh(m,a); try{ const host=m.querySelector('.screen')||m; const anc=$('#fban',m)||host.children[1]; if(!anc||$('#mockc',m)) return; anc.insertAdjacentHTML('afterend',mockCard()); $('#mockc',m).onclick=()=>{ SFX.tap(); go('mock'); }; }catch(e){} }; }
/* Business Chinese for trading with China: one door to the business conversations (factory visit, MOQ and price,
   shipping and customs, quality complaint, trade fair, negotiation…) and the business vocabulary sector */
{ const _bm=SCREENS.me; SCREENS.me=(m,a)=>{ _bm(m,a); try{ const anc=$('#tutb',m)||$('#certb',m)||$('#fcalb',m); if(!anc||$('#bizb',m)) return; const ar=isAr(), d=TALK.find(x=>x.k==='biz'), n=d?d.scenes.length:0;
  anc.insertAdjacentHTML('afterend',`<button class="card row fbanner" id="bizb"><span class="fbi" aria-hidden="true">🤝</span><div class="grow" style="text-align:start;min-width:0"><b>${ar?'صينية الأعمال: التجارة مع الصين':'Business Chinese: trading with China'}</b><div class="sub">${ar?`${n} محادثة: زيارة مصنع، السعر والكمية، الشحن، الشكاوى`:`${n} conversations: factory visits, MOQ and price, shipping, complaints`}</div></div><span class="han" aria-hidden="true">商</span></button>`);
  $('#bizb',m).onclick=()=>{ SFX.tap(); track('biz_pack_open'); go('talk',{d:'biz'}); }; }catch(e){} }; }
