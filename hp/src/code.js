/* ===== 程序员中文 Chinese for Programmers: learn real coding vocabulary by running real code ===== */
const CODE_FREE=PLAN.freeCodeUnits;
CODE_UNITS.forEach((u,ui)=>{ u._w=u.words.map((w,j)=>{ const o={id:90000+ui*100+j,h:w[0],t:w[0],p:w[1],ar:[w[2]],en:[w[3]],l:0,fq:9999,mw:[],pos:[],code:1}; byId[o.id]=o; if(!byH[o.h]) byH[o.h]=o; return o; }); });
const codeFree=i=>S.pro||i<CODE_FREE;
const ERRZH={TypeError:['类型错误','lèixíng cuòwù'],ReferenceError:['引用错误','yǐnyòng cuòwù'],SyntaxError:['语法错误','yǔfǎ cuòwù'],RangeError:['范围错误','fànwéi cuòwù'],Timeout:['超时','chāoshí']};
/* run code in a throw-away Web Worker so even an infinite loop can't freeze the app */
/* worker body: runs the code, waits briefly for timers/promises, optionally runs tests */
const WORKER=`const canon=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}'):JSON.stringify(v);
onmessage=async e=>{const {src,tests}=e.data;const out=[];const con={log:(...a)=>out.push(a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')),error:(...a)=>out.push('✖ '+a.join(' '))};
try{ const AF=Object.getPrototypeOf(async function(){}).constructor;
 if(tests){ const R=[]; for(const [c,ex] of tests){ try{ const v=await new AF('console',src+'\\n;'+c)(con); R.push({c,ex,v:v===undefined?'undefined':v,ok:canon(v)===canon(ex)}); }catch(err){ R.push({c,ex,err:err.name+': '+err.message,ok:false}); } } postMessage({out,tests:R}); return; }
 await new AF('console',src)(con); setTimeout(()=>postMessage({out}),250);
}catch(err){ setTimeout(()=>postMessage({out,err:err.name,msg:err.message}),0); } };`;
function runCode(src,tests){ return new Promise(res=>{ let wk=null; try{ wk=new Worker(URL.createObjectURL(new Blob([WORKER],{type:'text/javascript'}))); }catch(e){ wk=null; }
  if(!wk){ const out=[]; try{ (new Function('console',src))({log:(...a)=>out.push(a.map(String).join(' '))}); res({out}); }catch(err){ res({out,err:err.name,msg:err.message}); } return; }
  const to=setTimeout(()=>{ wk.terminate(); res({out:[],err:'Timeout',msg:'> 2 s',tests:tests?tests.map(([c,ex])=>({c,ex,err:'Timeout 超时',ok:false})):null}); },2000);
  wk.onmessage=e=>{ clearTimeout(to); wk.terminate(); res(e.data); }; wk.onerror=e=>{ clearTimeout(to); wk.terminate(); res({out:[],err:'SyntaxError',msg:e.message||''}); e.preventDefault&&e.preventDefault(); };
  wk.postMessage({src,tests}); }); }
const KW=new Set(['const','let','var','function','return','if','else','for','of','in','while','break','continue','true','false','null','undefined','new','console','log','class','extends','constructor','this','async','await','get','set','throw','try','catch','typeof','switch','case','SELECT','FROM','WHERE','ORDER','BY','OR','AND','git','checkout','commit','push','origin']);
function hiCode(src){ const out=[]; const re=/(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|([㐀-鿿]+)|(\s+)|([^\s])/g; let m;
  while((m=re.exec(src))){ const [s,cm,st,nu,id,zh]=m;
    if(cm) out.push(`<span class="c-cm">${esc(cm)}</span>`); else if(st) out.push(`<span class="c-st">${esc(st).replace(/([㐀-鿿]+)/g,x=>zhTok(x))}</span>`);
    else if(nu) out.push(`<span class="c-nu">${nu}</span>`); else if(id) out.push(KW.has(id)?`<span class="c-kw">${id}</span>`:`<span class="c-id">${id}</span>`);
    else if(zh) out.push(zhTok(zh,'c-zh')); else out.push(esc(s)); }
  return out.join(''); }
function zhTok(z,cls=''){ return segment(z).map(x=>x.w?`<button class="ztok ${cls}" data-w="${x.w.id}">${esc(x.t)}</button>`:`<span class="${cls}">${esc(x.t)}</span>`).join(''); }
function bindZ(root){ $$('.ztok',root).forEach(b=>b.onclick=e=>{ e.stopPropagation(); const w=byId[b.dataset.w]; speak(w.h); sheet(`<div class="row" style="gap:14px"><span class="han" style="font-size:44px;font-weight:700;color:var(--gold2)">${esc(w.h)}</span><div class="grow"><div class="py" style="font-size:20px">${esc(w.p)}</div><div>${mean(w,2)}</div></div><button class="speak" id="zs">🔊</button></div>`,s=>$('#zs',s).onclick=()=>speak(w.h)); }); }
function termHTML(r){ const e=r.err&&ERRZH[r.err]; return `<div class="term"><div class="tbar"><i></i><i></i><i></i><span>终端 zhōngduān · terminal</span></div><pre>${r.out.map(esc).join('\n')}${r.err?`${r.out.length?'\n':''}<span class="t-err">❌ 报错 bàocuò: ${e?`${e[0]} ${e[1]} · `:''}${esc(r.err)}${r.msg?': '+esc(r.msg):''}</span>`:''}${!r.out.length&&!r.err?'<span class="c-cm">(没有输出 · no output)</span>':''}</pre></div>`; }
/* --- hub --- */
const unitSteps=u=>[['📖','cWords'],['💻','cLab'],...(u.challenge?[['🏆','cChallenge']]:[]),['💬','cDialog'],['💡','cFact']];
const unitDoneC=u=>((S.code||{})[u.k]||0)>=unitSteps(u).length;
SCREENS.code=m=>{ S.code=S.code||{}; const done=CODE_UNITS.filter(unitDoneC).length;
  const tiers=[['basic','入门','rùmén',t('tierBasic')],['adv','进阶','jìnjiē',t('tierAdv')]];
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero ph" style="min-height:190px">${photo('hsk4',0,'','bg')}<span class="eyebrow">${t('codeSub')}</span><h1>${t('codeTitle')}</h1>
     <div class="codehero ltr"><span class="c-kw">console</span>.<span class="c-kw">log</span>(<span class="c-st">"你好，世界！"</span>)</div><div class="sub" style="color:var(--ivory)"><span class="num">${done}/${CODE_UNITS.length}</span> ${t('units')} · <span class="num">${Object.keys(S.codeCh||{}).length}</span> 🏆</div></div>
   <div class="sub">${t('codeIntro')}</div>
   ${tiers.map(([tk,zh,py,lab])=>`<div class="row tierh"><span class="brush" style="font-size:30px;color:var(--gold)">${zh}</span><div class="grow"><b>${lab}</b><div class="py">${py}</div></div></div>
   <div class="path">${CODE_UNITS.map((u,i)=>{ if(u.tier!==tk) return ''; const n=unitSteps(u).length, st=Math.min(S.code[u.k]||0,n), lock=!codeFree(i); return `<button class="pnode ${unitDoneC(u)?'done':''} ${lock?'lock':''} ${tk}" data-i="${i}"><span class="pic">${lock?'🔒':unitDoneC(u)?'✓':u.icon}</span><div class="grow" style="text-align:start;min-width:0"><b class="han">${u.zh}</b> <span class="py">${u.p}</span><div class="sub">${isAr()?u.ar:u.en} · <span class="num">${u.words.length}</span> ${t('words')}${u.challenge?' · 🏆':''}</div><div class="bar" style="margin-top:6px"><i style="width:${st/n*100}%"></i></div></div></button>`; }).join('')}</div>`).join('')}
   <div class="fine">${t('codeNote')}</div>`);
  $$('[data-i]',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; SFX.tap(); if(!codeFree(i)) return paywall('code'); go('codeunit',{i}); }); };
/* --- unit: words → code lab → (challenge) → dialogue → fun fact --- */
SCREENS.codeunit=(m,{i,step})=>{ const u=CODE_UNITS[i]; S.code=S.code||{}; const steps=unitSteps(u), N=steps.length, st=S.code[u.k]||0; step=step??Math.min(st,N-1);
  const kind=steps[step][1]; const mark=n=>{ if((S.code[u.k]||0)<n){ S.code[u.k]=n; save(); } }; const nextStep=()=>{ mark(step+1); go('codeunit',{i,step:step+1}); };
  const head=`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"><h2 class="han" style="margin:0">${u.zh}</h2><div class="sub">${isAr()?u.ar:u.en}${u.tier==='adv'?' · 进阶':''}</div></div><span style="font-size:30px">${u.icon}</span></div>
    <div class="csteps" style="grid-template-columns:repeat(${N},1fr)">${steps.map(([ic,l],j)=>`<button class="cstep ${j===step?'on':''} ${st>j?'ok':''}" data-s="${j}"><b>${st>j?'✓':ic}</b><span>${t(l)}</span></button>`).join('')}</div>`;
  m.insertAdjacentHTML('beforeend',head+'<div id="cb" class="col" style="gap:12px"></div>');
  $('#bk',m).onclick=()=>go('code'); $$('[data-s]',m).forEach(b=>b.onclick=()=>go('codeunit',{i,step:+b.dataset.s}));
  const cb=$('#cb',m);
  if(kind==='cWords'){ cb.innerHTML=`<div class="card col" style="gap:6px">${u._w.map(w=>`<div class="row" style="gap:12px"><span class="han" style="font-size:24px;font-weight:700;color:var(--gold2);min-width:96px">${esc(w.h)}</span><div class="grow"><span class="py">${esc(w.p)}</span><div class="sub" style="color:var(--ivory)">${mean(w,1)}</div></div><button class="speak sm" data-sp="${w.id}">🔊</button></div>`).join('')}</div>
      <button class="btn block" id="go">📖 ${t('cLearn')} · <span class="num">${u._w.length}</span></button>`;
    $$('[data-sp]',cb).forEach(b=>b.onclick=()=>speak(byId[b.dataset.sp].h));
    $('#go',cb).onclick=()=>{ route={name:'lesson',arg:{custom:1}}; render(); const mm=$('main'); const pool=CODE_UNITS.flatMap(x=>x._w);
      runQuiz(mm,{intro:u._w.filter(w=>!S.srs[w.id]),questions:makeQuestions(u._w,pool),back:()=>go('codeunit',{i,step}),onDone:()=>{ mark(step+1); route={name:'codeunit',arg:{i,step:step+1}}; }}); }; }
  if(kind==='cLab'){ let li=0; const lab=()=>{ const L=u.labs[li], opts=shuffle(L.q.map((o,j)=>({o,ok:j===0})));
      cb.innerHTML=`<div class="eyebrow">${t('cLab')} <span class="num">${li+1}/${u.labs.length}</span> · ${t('cTapZh')}</div>
        <pre class="code ltr" dir="ltr">${hiCode(L.code)}</pre>
        <div class="sub" style="color:var(--ivory)">❓ ${L.run===false?t('cWhatDoes'):t('cPredict')}</div>
        <div class="col" style="gap:8px">${opts.map((x,j)=>`<button class="opt copt ${L.run===false?'':'ltr'}" ${L.run===false?'':'dir="ltr"'} data-j="${j}">${esc(x.o).replace(/\n/g,'<br>')}</button>`).join('')}</div>
        <div id="res"></div>`;
      bindZ(cb);
      $$('.copt',cb).forEach(b=>b.onclick=async e=>{ if(e.target.closest('.tok')) return; if(cb.dataset.ans) return; cb.dataset.ans=1; const x=opts[+b.dataset.j]; $$('.copt',cb).forEach((y,j)=>{ if(opts[j].ok) y.classList.add('right'); else if(y===b) y.classList.add('wrong'); });
        dayCount('codeDay').n++; save(); if(x.ok){ SFX.ok(); addXP(u.tier==='adv'?6:4); } else SFX.bad(); const r=L.run===false?null:await runCode(L.code);
        $('#res',cb).innerHTML=`${r?termHTML(r):''}<div class="card row" style="gap:10px">${bao(x.ok?'happy':'think',48)}<div class="sub" style="color:var(--ivory)">${esc(isAr()?L.ar:L.en)}</div></div>
          ${r?`<details class="play"><summary>✏️ ${t('cPlay')}</summary><textarea class="code ltr" dir="ltr" id="ed" spellcheck="false">${esc(L.code)}</textarea><button class="btn sm" id="run">▶ ${t('cRun')}</button><div id="pout"></div></details>`:''}
          <button class="btn block" id="nx">${li<u.labs.length-1?t('next'):t('next')+' →'}</button>`;
        const rb=$('#run',cb); if(rb) rb.onclick=async()=>{ SFX.tap(); const rr=await runCode($('#ed',cb).value); $('#pout',cb).innerHTML=termHTML(rr); if(!rr.err) addXP(1); };
        $('#nx',cb).onclick=()=>{ delete cb.dataset.ans; if(li<u.labs.length-1){ li++; lab(); } else nextStep(); }; bindTokens(cb); }); bindTokens(cb); };
    lab(); }
  if(kind==='cChallenge'){ const C=u.challenge; const key=u.k; S.codeDraft=S.codeDraft||{}; let tries=0;
    cb.innerHTML=`<div class="paper col" style="gap:8px"><div class="stamp">题</div><div class="eyebrow" style="color:#8a1a12">🏆 ${t('cChallenge')}</div>${analyseHTML(C.task[0])}
        <details><summary class="sub" style="cursor:pointer;color:#5a4a40">${t('cShowTrans')}</summary><p style="margin:6px 0 0">${esc(isAr()?C.task[1]:C.task[2])}</p></details></div>
      <textarea class="code ltr" dir="ltr" id="ced" spellcheck="false" autocapitalize="off" autocomplete="off" style="min-height:220px">${esc(S.codeDraft[key]||C.start)}</textarea>
      <div class="row" style="gap:8px"><button class="btn grow" id="tst">▶ ${t('cRunTests')}</button><button class="btn ghost sm" id="hnt">💡</button><button class="btn ghost sm" id="rst">↺</button></div>
      <div id="tout"></div>`;
    bindTokens(cb); const ed=$('#ced',cb);
    ed.oninput=()=>{ S.codeDraft[key]=ed.value; save(); };
    ed.onkeydown=e=>{ if(e.key==='Tab'){ e.preventDefault(); const p=ed.selectionStart; ed.setRangeText('  ',p,ed.selectionEnd,'end'); } };
    $('#rst',cb).onclick=()=>{ ed.value=C.start; S.codeDraft[key]=C.start; save(); };
    $('#hnt',cb).onclick=()=>sheet(`<h3>💡 ${t('cHint')}</h3><p>${esc(isAr()?C.hint[0]:C.hint[1])}</p>${tries>=2?`<button class="btn ghost block" id="sol">👀 ${t('cSolution')}</button>`:`<div class="sub">${t('cSolLater')}</div>`}`,s=>{ const so=$('#sol',s); if(so) so.onclick=()=>{ closeSheet(); ed.value=C.sol; S.codeDraft[key]=C.sol; save(); toast(t('cSolLoaded')); }; });
    $('#tst',cb).onclick=async()=>{ SFX.tap(); tries++; $('#tout',cb).innerHTML=`<div class="sub">⏳ 运行测试中… yùnxíng cèshì zhōng</div>`; const r=await runCode(ed.value,C.tests); const T=r.tests||[], pass=T.filter(x=>x.ok).length, all=T.length&&pass===T.length;
      $('#tout',cb).innerHTML=`<div class="term"><div class="tbar"><i></i><i></i><i></i><span>测试 cèshì · tests</span></div><pre>${T.map((x,j)=>`${x.ok?'✅':'❌'} 测试${j+1}  <span class="c-cm">${esc(x.c.replace(/^return /,''))}</span>\n   ${x.ok?'通过 tōngguò':`期望 qīwàng: ${esc(JSON.stringify(x.ex))}\n   实际 shíjì: ${esc(x.err||JSON.stringify(x.v))}`}`).join('\n')}${r.err&&!T.length?`<span class="t-err">❌ ${esc(r.err)}: ${esc(r.msg||'')}</span>`:''}\n\n${all?'<span style="color:#7be3b0">🎉 全部通过！quánbù tōngguò</span>':`<span class="t-err">${pass}/${T.length} 通过</span>`}</pre></div>
        ${all?`<button class="btn block" id="nx">${t('next')} →</button>`:''}`;
      if(all){ SFX.win(); confetti(90); S.codeCh=S.codeCh||{}; track('code_challenge_pass',{unit:key}); if(!S.codeCh[key]){ S.codeCh[key]=1; addXP(30); const c=addCoins(30); toast(`🏆 ${t('cChDone')} +${c}`); } save(); $('#nx',cb).onclick=nextStep; } else { SFX.bad(); if(tries===2) toast('💡 '+t('cHintNow')); } }; }
  if(kind==='cDialog'){ cb.innerHTML=`<div class="sub">${t('tapWords')}</div>${u.dialog.map(([who,zh,ar,en],j)=>`<div class="bub ${j%2?'r':'l'}"><span class="who han">${esc(who)}</span>${analyseHTML(zh)}<div class="sub" style="color:var(--ink2)">${esc(isAr()?ar:en)}</div><div class="row" style="gap:6px"><button class="speak sm" data-z="${j}">🔊</button><button class="speak sm" data-mz="${j}">🎤</button></div></div>`).join('')}
      <button class="btn block" id="nx">${t('next')}</button>`;
    bindTokens(cb); $$('[data-z]',cb).forEach(b=>b.onclick=()=>speak(u.dialog[+b.dataset.z][1])); $$('[data-mz]',cb).forEach(b=>b.onclick=()=>pronCheck(u.dialog[+b.dataset.mz][1]));
    $('#nx',cb).onclick=()=>{ addXP(5); nextStep(); }; }
  if(kind==='cFact'){ const [zh,p,en,ar]=u.fact; const was=unitDoneC(u); cb.innerHTML=`<div class="paper col" style="gap:10px"><div class="stamp">码</div><div class="han" style="font-size:40px;font-weight:700;color:#6a120d;text-align:start">${esc(zh)}</div><span class="py" style="color:var(--red)">${esc(p)}</span><p style="margin:0;font-size:17px;line-height:1.7">${esc(isAr()?ar:en)}</p></div>
      <button class="btn block" id="fin">${was?t('done'):'🏁 '+t('cFinish')}</button>`;
    $('#fin',cb).onclick=()=>{ track('code_unit_complete',{unit:u.k}); if(!was){ mark(N); addXP(20); const c=addCoins(25); SFX.win(); confetti(90); toast(`💻 ${t('cUnitDone')} +${c}`); } go('code'); }; } };
/* --- home tiles for the two new paths --- */
function pathsCard(){ const w=Object.keys(S.written||{}).length, c=CODE_UNITS.filter(unitDoneC).length;
  return `<div class="ptiles"><button class="ptile" id="tw2"><span class="tb">写</span><b>${t('writeTitle')}</b><span class="sub"><span class="num">${w}</span> ${t('wWritten')}</span></button>
    <button class="ptile sect" id="ts2"><span class="tb">业</span><b>${t('secTitle')}</b><span class="sub"><span class="num">${SECTORS.length}</span> ${t('secFields')}</span></button><button class="ptile code" id="tc2"><span class="tb ltr">&lt;/&gt;</span><b>${t('codeTitle')}</b><span class="sub"><span class="num">${c}/${CODE_UNITS.length}</span> ${t('units')}</span></button></div>`; }
function bindPaths(m){ const a=$('#tw2',m), b=$('#tc2',m); if(a) a.onclick=()=>go('writehub'); if(b) b.onclick=()=>go('code'); const c=$('#ts2',m); if(c) c.onclick=()=>go('sectors'); }
