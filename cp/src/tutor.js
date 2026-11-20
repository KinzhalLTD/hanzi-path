/* ===== AI tutor (shared by Hanzi Path and Cipher Path; keep both copies identical).
   "Why?" explanations for a wrong answer and a chat (Hanzi Path: Chinese conversation partner at your HSK level;
   Cipher Path: ask 龙宝 anything about code and security). Runs on Claude through the `tutor` Cloud Function
   (server/functions, docs/AI_TUTOR.md): the API key stays on the server, PRO gets 40 messages a day, free 3,
   sign-in required. In a browser it runs a labelled demo. ===== */
const TAPP=typeof bao==='function'?'hp':'cp';
const TNAME=TAPP==='hp'?['باو','Bao']:['لونغباو','Longbao'];
const tFace=(m,s)=>TAPP==='hp'?bao(m,s):dragon(m,s);
const tLevel=()=>{ try{ return TAPP==='hp'?curLevel():0; }catch(e){ return 1; } };
async function tutorAsk(req){ const ar=isAr(); req=Object.assign({app:TAPP,lang:ar?'ar':'en',level:tLevel()},req);
  if(!RN){ await new Promise(r=>setTimeout(r,500)); return {ok:true,demo:true,left:2,text:req.mode==='chat'
    ?(TAPP==='hp'?'你好！今天你想聊什么？\nNǐ hǎo! Jīntiān nǐ xiǎng liáo shénme?\n'+(ar?'مرحبًا! عمّ تريد أن نتحدث اليوم؟':'Hi! What would you like to talk about today?'):(ar?'(عرض تجريبي) في التطبيق يجيبك لونغباو بالذكاء الاصطناعي عن أي سؤال في البرمجة والأمن.':'(Demo) In the app, Longbao answers any coding or security question with AI.'))
    :(ar?'(عرض تجريبي) في التطبيق يشرح لك المعلّم سبب صحة الإجابة الصحيحة ولماذا لم تكن إجابتك هي الأفضل، مع مثال.':'(Demo) In the app, the tutor explains why the right answer is right and why yours was not, with an example.')}; }
  if(!S.user) return {ok:false,error:'signin'};
  const r=await native('tutor',{req}); return r||{ok:false,error:'net'}; }
function tutorErr(r){ const ar=isAr();
  if(r.error==='signin'){ toast(ar?'سجّل الدخول لاستخدام المعلّم الذكي':'Sign in to use the AI tutor'); if(typeof accountSheet==='function') accountSheet(); return; }
  if(r.error==='limit'){ if(!S.pro){ toast(ar?'انتهت أسئلتك المجانية اليوم':'Free tutor questions used up for today'); paywall('tutor'); } else toast(ar?'وصلت حد اليوم (40). نلتقي غدًا!':'Daily limit reached (40). See you tomorrow!'); return; }
  toast(ar?'تعذّر الوصول إلى المعلّم. حاول لاحقًا.':'Could not reach the tutor. Try again later.'); }
/* explain a wrong answer: q = {question, options[], right, chosen, why} */
async function tutorExplain(q){ const ar=isAr(); track('tutor_explain');
  sheet(`<div class="col" style="gap:12px"><div class="row" style="gap:10px">${tFace('happy',56)}<div class="grow"><b>${ar?TNAME[0]+' يشرح':TNAME[1]+' explains'}</b><div class="sub">${ar?'معلّم بالذكاء الاصطناعي':'AI tutor'}</div></div></div>
    <div class="tutbox" id="tx" aria-live="polite"><span class="tdots"><i></i><i></i><i></i></span></div><div class="sub" id="tl"></div>
    <button class="btn ghost block" id="tc">${ar?'اسأل سؤالًا آخر':'Ask a follow-up'}</button></div>`,async s=>{
    $('#tc',s).onclick=()=>{ closeSheet(); go('tutor',{seed:q}); };
    const r=await tutorAsk({mode:'explain',q}); const box=$('#tx',s); if(!box) return;
    if(!r.ok){ box.textContent='—'; closeSheet(); tutorErr(r); return; }
    box.innerHTML=tutText(r.text); $('#tl',s).textContent=tLeft(r); }); }
const tLeft=r=>r.demo?(isAr()?'عرض تجريبي':'Demo'):r.left!=null?(isAr()?`متبقٍ اليوم: ${r.left}`:`${r.left} left today`):'';
const tutText=t=>esc(t).replace(/\n/g,'<br>');
/* chat screen */
SCREENS.tutor=(m,arg)=>{ const ar=isAr(); S.tutLog=S.tutLog||[]; if(arg&&arg.seed&&!arg.used){ arg.used=1; S.tutLog.push({role:'user',content:(ar?'لم أفهم: ':'I did not get this: ')+arg.seed.question+' → '+arg.seed.right}); }
  const intro=TAPP==='hp'?(ar?'تحدّث مع باو بالصينية على مستواك. يكتب لك الصينية والبينيين والترجمة، ويصحّح أخطاءك بلطف.':'Chat with Bao in Chinese at your level. Bao writes Chinese, pinyin and a translation, and gently fixes your mistakes.')
    :(ar?'اسأل لونغباو أي شيء عن البرمجة والأمن السيبراني.':'Ask Longbao anything about programming and cybersecurity.');
  const chips=TAPP==='hp'?['你好！','我想点咖啡。','你周末做什么？']:(ar?['ما الفرق بين التشفير والتجزئة؟','اشرح لي REST API','كيف أحمي كلمة المرور؟']:['Hashing vs encryption?','Explain a REST API','How do I store passwords safely?']);
  const bubble=x=>`<div class="tmsg ${x.role==='user'?'me':'them'}">${x.role==='user'?'':`<span class="tface" aria-hidden="true">${TAPP==='hp'?'🥟':'🐉'}</span>`}<div class="tbub"${TAPP==='hp'&&x.role!=='user'?' dir="auto"':''}>${tutText(x.content)}${TAPP==='hp'&&x.role!=='user'?`<button class="speak sm tsay" aria-label="${ar?'استمع':'Listen'}">🔊</button>`:''}</div></div>`;
  m.innerHTML=`<div class="screen tutor"><div class="row" style="gap:10px"><button class="icon-btn" id="tb" aria-label="${ar?'رجوع':'Back'}">${ar?'›':'‹'}</button><h1 class="grow" style="margin:0">${ar?'المعلّم الذكي':'AI tutor'}</h1><button class="btn ghost sm" id="tclr">${ar?'محادثة جديدة':'New chat'}</button></div>
    <div class="card row" style="gap:12px">${tFace('happy',56)}<p class="grow" style="margin:0">${intro}</p></div>
    <div class="tlog" id="tlog">${S.tutLog.map(bubble).join('')}</div>
    <div class="tchips">${chips.map(c=>`<button class="chip tchip">${esc(c)}</button>`).join('')}</div>
    <form class="trow" id="tf"><input class="certname" id="tin" maxlength="300" autocomplete="off" placeholder="${TAPP==='hp'?(ar?'اكتب بالصينية أو البينيين…':'Type in Chinese or pinyin…'):(ar?'اكتب سؤالك…':'Type your question…')}" aria-label="${ar?'رسالتك':'Your message'}"><button class="btn" id="tsend">${ar?'أرسل':'Send'}</button></form>
    <div class="sub" id="tl" style="text-align:center">${S.pro?'':(ar?'3 رسائل مجانية يوميًا · 40 مع PRO':'3 free messages a day · 40 with PRO')}</div></div>`;
  const log=$('#tlog',m), bindSay=()=>$$('.tsay',m).forEach(b=>b.onclick=()=>{ const zh=(b.parentElement.innerHTML.split('<br>')[0]||'').replace(/<[^>]+>/g,''); speak(zh.replace(/&[a-z]+;/g,'')); });
  bindSay();
  const send=async txt=>{ txt=txt.trim(); if(!txt) return; S.tutLog.push({role:'user',content:txt}); S.tutLog=S.tutLog.slice(-20); save();
    log.insertAdjacentHTML('beforeend',bubble({role:'user',content:txt})+`<div class="tmsg them" id="ttyp"><span class="tface" aria-hidden="true">${TAPP==='hp'?'🥟':'🐉'}</span><div class="tbub"><span class="tdots"><i></i><i></i><i></i></span></div></div>`);
    window.scrollTo(0,document.body.scrollHeight); track('tutor_chat');
    const r=await tutorAsk({mode:'chat',messages:S.tutLog}); const ty=$('#ttyp',m); if(ty) ty.remove();
    if(!r.ok){ S.tutLog.pop(); save(); log.lastElementChild&&log.lastElementChild.remove(); tutorErr(r); return; }
    S.tutLog.push({role:'assistant',content:r.text}); save(); log.insertAdjacentHTML('beforeend',bubble({role:'assistant',content:r.text})); bindSay();
    $('#tl',m).textContent=tLeft(r); window.scrollTo(0,document.body.scrollHeight);
    if(TAPP==='hp'){ const zh=r.text.split('\n')[0]; if(/[一-鿿]/.test(zh)) speak(zh); } };
  $('#tf',m).onsubmit=e=>{ e.preventDefault(); const i=$('#tin',m); send(i.value); i.value=''; };
  $$('.tchip',m).forEach(c=>c.onclick=()=>send(c.textContent));
  $('#tb',m).onclick=()=>typeof goBack==='function'?goBack('home'):go('home');
  $('#tclr',m).onclick=()=>{ S.tutLog=[]; save(); render(); };
  if(arg&&arg.seed&&S.tutLog.length&&S.tutLog[S.tutLog.length-1].role==='user'&&arg.used===1){ arg.used=2; const last=S.tutLog.pop(); send(last.content); } };
/* doors: Me and Home */
{ const _tm=SCREENS.me; SCREENS.me=(m,a)=>{ _tm(m,a); try{ const anchor=$('#certb',m)||$('#fcalb',m); if(!anchor||$('#tutb',m)) return; const ar=isAr();
  anchor.insertAdjacentHTML('afterend',`<button class="card row fbanner" id="tutb"><span class="fbi" aria-hidden="true">${TAPP==='hp'?'🥟':'🐉'}</span><div class="grow" style="text-align:start;min-width:0"><b>${ar?'المعلّم الذكي':'AI tutor'}</b><div class="sub">${TAPP==='hp'?(ar?'محادثة صينية مع باو':'Chinese conversation with Bao'):(ar?'اسأل لونغباو أي سؤال':'Ask Longbao anything')}</div></div><span class="chip">AI</span></button>`);
  $('#tutb',m).onclick=()=>{ SFX.tap(); go('tutor'); }; }catch(e){} }; }
