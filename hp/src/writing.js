/* ===== Writing studio 写字: stroke order, tracing, writing from memory, stroke basics,
   funny character stories and calligraphy styles. Stroke data: Hanzi Writer data (Arphic Public License). ===== */
const HWD=__STROKES__;
const canWrite=c=>!!HWD[c];
const FREE_WRITE=new Set([...(byLevel[1]||[]).flatMap(w=>[...w.h]),...'一十人八小地口三川月国永']);
const writeFree=c=>S.pro||FREE_WRITE.has(c)||(typeof STORIES!=='undefined'&&STORIES.some(s=>s[0]===c));
function hwCreate(el,c,opt={}){ return HanziWriter.create(el,c,Object.assign({width:opt.size||260,height:opt.size||260,padding:14,showOutline:true,strokeColor:'#1d1512',radicalColor:'#b3261e',outlineColor:'rgba(29,21,18,.13)',drawingColor:'#1d1512',drawingWidth:22,highlightColor:'#e8b65c',strokeAnimationSpeed:1.1,delayBetweenStrokes:180,
  charDataLoader:(ch,done)=>done(HWD[ch])},opt)); }
const GRID=`<svg class="mizi" viewBox="0 0 100 100" aria-hidden="true"><rect x="1" y="1" width="98" height="98" fill="none" stroke="#b3261e" stroke-width="1.2"/><path d="M1 1L99 99M99 1L1 99M50 1V99M1 50H99" stroke="#b3261e" stroke-width=".5" stroke-dasharray="3 3" opacity=".55"/></svg>`;
/* --- content --- */
const STROKES8=[['一','横','héng','Horizontal','أفقية','Left to right, like a calm horizon.','من اليسار إلى اليمين، مثل أفق هادئ.'],
 ['十','竖','shù','Vertical','عمودية','Top to bottom, straight like a bamboo stalk.','من الأعلى إلى الأسفل، مستقيمة كعود خيزران.'],
 ['人','撇','piě','Left-falling','مائلة يسارًا','Sweeps down to the left, fast and thinning, like a bird\'s wing.','تنزل نحو اليسار بسرعة وتنحف، كجناح طائر.'],
 ['八','捺','nà','Right-falling','مائلة يمينًا','Slides down to the right and widens at the end, like a foot pressing.','تنزل نحو اليمين وتتسع في آخرها، كقدم تضغط.'],
 ['小','点','diǎn','Dot','نقطة','A short tap of the brush, like a raindrop.','نقرة قصيرة بالفرشاة، كقطرة مطر.'],
 ['地','提','tí','Rising','صاعدة','Flicks up to the right. Watch the last stroke of 土 in 地.','تنطلق صاعدة نحو اليمين. انظر آخر ضربة في 土 داخل 地.'],
 ['口','折','zhé','Turning','منكسرة','Goes across then turns down in ONE stroke without lifting the brush.','تسير أفقيًا ثم تنعطف للأسفل بضربة واحدة دون رفع الفرشاة.'],
 ['小','钩','gōu','Hook','خطّاف','Ends with a sharp little kick, like a fishing hook.','تنتهي بركلة صغيرة حادّة، كخطّاف الصيد.']];
const RULES7=[['十','先横后竖','Horizontal before vertical','الأفقي قبل العمودي'],['八','先撇后捺','Left-falling before right-falling','المائلة يسارًا قبل المائلة يمينًا'],['三','从上到下','Top to bottom','من الأعلى إلى الأسفل'],['川','从左到右','Left to right','من اليسار إلى اليمين'],['月','从外到内','Outside before inside','الخارج قبل الداخل'],['国','先里头后封口','Fill the inside, then close the door','املأ الداخل ثم أغلق الباب'],['小','先中间后两边','Middle before the sides','الوسط قبل الجانبين']];
const STORIES=[
 ['人','A person walking: two legs striding forward. Simple!','إنسان يمشي: ساقان تخطوان إلى الأمام. بهذه البساطة!'],
 ['大','A person stretching both arms wide: "The fish was THIS big!"','إنسان يفتح ذراعيه على اتساعهما: «كانت السمكة بهذا الحجم!»'],
 ['天','A big person with a line above the head: that\'s the sky. You can\'t go higher.','إنسان كبير وفوق رأسه خط: هذه السماء، لا شيء أعلى منها.'],
 ['太','Big + one extra dot = TOO big. One dot too many!','كبير + نقطة إضافية = كبير جدًا. نقطة زائدة واحدة!'],
 ['日','The sun. In oracle bones it was a circle with a dot; scribes found squares easier to carve.','الشمس. في نقوش العظام كانت دائرة فيها نقطة، ثم صارت مربعة لأن نحت المربع أسهل.'],
 ['月','A crescent moon wearing two belts.','هلال يلبس حزامين.'],
 ['明','Sun + moon together = BRIGHT. Double the light!','شمس + قمر معًا = مُضيء. ضوء مضاعف!'],
 ['木','A tree: branches up, roots down.','شجرة: أغصان للأعلى وجذور للأسفل.'],
 ['林','Two trees = woods.','شجرتان = غابة صغيرة.'],
 ['森','Three trees = a deep FOREST. Chinese loves counting in threes.','ثلاث أشجار = غابة كثيفة. الصينية تحب العدّ بالثلاثات.'],
 ['休','A person leaning on a tree = REST. Even pandas agree.','إنسان يستند إلى شجرة = راحة. حتى الباندا توافق.'],
 ['好','A woman with her child = GOOD. The happiest picture in Chinese.','امرأة مع طفلها = جيد. أسعد صورة في اللغة الصينية.'],
 ['家','A pig under a roof = HOME. Ancient families kept pigs inside; a pig meant a wealthy house!','خنزير تحت سقف = بيت. كانت العائلات قديمًا تربّي الخنازير في البيت، فوجود خنزير يعني بيتًا ميسورًا!'],
 ['男','A field 田 + strength 力 = MAN, the one who ploughs the field.','حقل 田 + قوة 力 = رجل، فهو من يحرث الحقل.'],
 ['囚','A person stuck in a box = PRISONER. Poor guy.','إنسان محبوس داخل صندوق = سجين. يا للمسكين.'],
 ['从','One person following another = FOLLOW.','إنسان يتبع إنسانًا آخر = يتبع.'],
 ['众','Three people = a CROWD. Two is company, three is a crowd!','ثلاثة أشخاص = حشد.'],
 ['品','Three mouths = TASTE, QUALITY. Everyone has an opinion about the food.','ثلاثة أفواه = تذوّق وجودة. الكل لديه رأي في الطعام.'],
 ['尖','Small on top of big = SHARP, pointed. Like a cone.','صغير فوق كبير = مدبّب وحادّ، كالمخروط.'],
 ['看','A hand over the eye = to LOOK, like shading your eyes to see far away.','يد فوق العين = ينظر، كمن يظلّل عينيه ليرى بعيدًا.'],
 ['忍','A knife blade over the heart = ENDURE. Patience hurts!','نصل سكين فوق القلب = يصبر ويتحمّل. الصبر مؤلم!'],
 ['鲜','Fish 鱼 + sheep 羊 = FRESH, delicious. A seafood-and-lamb feast!','سمك 鱼 + خروف 羊 = طازج ولذيذ. وليمة سمك ولحم!'],
 ['炎','Fire on top of fire = BLAZING hot. Basically Riyadh in August.','نار فوق نار = حرّ لاهب. باختصار: الرياض في أغسطس.'],
 ['山','Three mountain peaks, the middle one is the tallest.','ثلاث قمم جبلية، والوسطى أعلاها.'],
 ['火','Flames dancing with sparks on both sides.','لهب يتراقص وشرارات على الجانبين.'],
 ['水','Water flowing in the middle, splashing to both sides.','ماء يجري في الوسط ويتطاير إلى الجانبين.'],
 ['雨','Raindrops falling under a cloud.','قطرات مطر تتساقط تحت غيمة.'],
 ['闪','A person flashing through a doorway 门 = FLASH, dodge!','إنسان يمرّ بسرعة عبر الباب 门 = يومض ويراوغ!'],
 ['回','A box inside a box: going round and round and coming BACK.','صندوق داخل صندوق: تدور وتدور ثم تعود.'],
 ['笑','Bamboo leaves on top look like smiling eyes, and the person below is bending over laughing.','أوراق الخيزران في الأعلى تشبه عيونًا مبتسمة، والإنسان في الأسفل ينحني من الضحك.'],
 ['哭','Two eyes full of tears over a dog: crying so loud it sounds like howling.','عينان مليئتان بالدموع فوق كلب: بكاء عالٍ كأنه عواء.'],
 ['王','Three lines (heaven, people, earth) joined by one line = KING, who connects them all.','ثلاثة خطوط (السماء، الناس، الأرض) يربطها خط واحد = الملك الذي يصل بينها.'],
 ['国','A treasure 玉 locked inside walls = COUNTRY.','كنز 玉 محاط بأسوار = دولة.'],
 ['爱','Love. The traditional 愛 had a heart 心 in the middle; the simplified form lost it, and Chinese people still joke about "love without a heart".','حب. الشكل التقليدي 愛 فيه قلب 心 في الوسط، والشكل المبسّط فقده، ولا يزال الصينيون يمزحون: «حبّ بلا قلب».'],
 ['信','A person standing by their word 言 = TRUST.','إنسان يقف عند كلمته 言 = ثقة.'],
 ['鸣','Mouth + bird = to CHIRP, sing.','فم + طائر = يغرّد.']];
const FONTS=[['Ma Shan Zheng','楷书','kǎishū','Regular brush script','الخط النظامي بالفرشاة','The standard script of brush writing, matured in the Tang dynasty. Every stroke is clear: this is how children learn to write.','الخط القياسي للكتابة بالفرشاة، نضج في عهد أسرة تانغ. كل ضربة فيه واضحة، وبه يتعلّم الأطفال الكتابة.'],
 ['Long Cang','行书','xíngshū','Running script','الخط الجاري','Semi-cursive: strokes flow into each other. The most famous piece ever, Wang Xizhi\'s Lantingji Xu (353 CE), is in running script.','شبه متّصل: الضربات تنساب بعضها في بعض. أشهر عمل خطّي على الإطلاق، «مقدمة جناح الأوركيد» لوانغ شي تشي (353م)، مكتوب بهذا الخط.'],
 ['Liu Jian Mao Cao','草书','cǎoshū','Cursive (grass) script','الخط العشبي','Wild and fast, like grass in the wind. Beautiful art, and even Chinese readers sometimes can\'t read it!','سريع وجامح كالعشب في الريح. فنّ جميل، وأحيانًا لا يستطيع حتى الصينيون قراءته!'],
 ['Zhi Mang Xing','草书','cǎoshū','Free-hand cursive','خط حرّ متّصل','Another cursive hand, loose and personal, popular for posters and tea-shop signs.','خط متّصل آخر، حرّ وشخصي، شائع في الملصقات ولافتات محلات الشاي.'],
 ['Noto Serif SC','宋体','sòngtǐ','Song (print) style','خط سونغ الطباعي','Born from woodblock printing in the Song and Ming dynasties: thin horizontals, thick verticals. Books and newspapers use it.','وُلد من الطباعة بالقوالب الخشبية في عهدي سونغ ومينغ: أفقيات رفيعة وعموديات سميكة. تستخدمه الكتب والصحف.'],
 ['Noto Sans SC','黑体','hēitǐ','Hei (sans-serif) style','خط هي الحديث','"Black style": even, modern strokes for screens, road signs and apps like this one.','«الخط الأسود»: ضربات متساوية وحديثة للشاشات ولافتات الطرق والتطبيقات مثل هذا التطبيق.'],
 ['ZCOOL KuaiLe','快乐体','kuàilè tǐ','"Happy" display font','خط «السعادة»','A modern playful font, literally named "happy". Great for birthday cards and memes.','خط حديث مرح، اسمه حرفيًا «سعيد». مناسب لبطاقات أعياد الميلاد والميمز.'],
 ['ZCOOL XiaoWei','小薇体','xiǎowēi tǐ','Elegant display font','خط أنيق','A refined modern serif with a literary feel, popular for book covers and café menus.','خط حديث راقٍ بطابع أدبي، شائع لأغلفة الكتب وقوائم المقاهي.']];
const OLD_SCRIPTS=[['甲骨文','jiǎgǔwén','Oracle bone script','خط عظام العرافة','c. 1250 BCE: carved on bones and turtle shells for divination; pictures you can still recognise.','نحو 1250 ق.م: نُقش على العظام وأصداف السلاحف للعرافة؛ صور ما زال بإمكانك التعرّف عليها.'],
 ['篆书','zhuànshū','Seal script','خط الأختام','Unified by the First Emperor in 221 BCE. Still used today on red name seals 印章, like the ones in this app.','وحّده الإمبراطور الأول عام 221 ق.م، وما زال يُستخدم في الأختام الحمراء 印章 مثل أختام هذا التطبيق.'],
 ['隶书','lìshū','Clerical script','الخط الرسمي (لي شو)','Han-dynasty office script: flat, wide characters with a wavy "silkworm head, swallow tail" stroke.','خط الدواوين في عهد هان: حروف عريضة مسطّحة وضربة متموّجة تُسمّى «رأس دودة القزّ وذيل السنونو».']];
/* --- practice: watch, trace, write from memory --- */
function writePractice(m,chars,{title='',back,onFinish}={}){ chars=chars.filter(canWrite); if(!chars.length) return back&&back(); if(chars.some(c=>!writeFree(c))){ chars=chars.filter(writeFree); if(!chars.length){ back&&back(); return paywall('write'); } toast(t('writeSomeLocked')); }
  let k=0, mode='trace', writer=null, total=0;
  function stage(){ const c=chars[k], w=byH[c]||W.find(x=>x.h.includes(c)), story=STORIES.find(s=>s[0]===c);
    m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx">✕</button><div class="bar grow"><i style="width:${(k/chars.length*100).toFixed(1)}%"></i></div><span class="sub num">${k+1}/${chars.length}</span></div>
     ${title?`<div class="eyebrow" style="text-align:center">${esc(title)}</div>`:''}
     <div class="row" style="justify-content:center;gap:10px"><span class="py" style="font-size:22px">${esc(w?w.p:'')}</span><button class="speak sm" id="sp">🔊</button><span class="sub">${w?mean(w,1):''}</span></div>
     <div class="wbox paper">${GRID}<div id="hw"></div><div class="wmsg" id="wmsg"></div></div>
     <div class="seg" id="wm">${[['watch','▶ '+t('wWatch')],['trace','✍️ '+t('wTrace')],['memory','🧠 '+t('wMemory')]].map(([x,l])=>`<button data-x="${x}" aria-pressed="${mode===x}">${l}</button>`).join('')}</div>
     ${story?`<div class="card row" style="gap:12px"><span style="font-size:26px">😄</span><div class="sub" style="color:var(--ivory)">${esc(isAr()?story[2]:story[1])}</div></div>`:''}
     <div class="row" style="gap:8px"><button class="btn ghost grow" id="again">↺ ${t('tryAgain')}</button><button class="btn grow" id="nx">${k<chars.length-1?t('next'):t('done')}</button></div>`;
    $('#qx',m).onclick=()=>back&&back(); $('#sp',m).onclick=()=>speak(w?w.h:c);
    $$('#wm button',m).forEach(b=>b.onclick=()=>{ mode=b.dataset.x; SFX.tap(); run(); $$('#wm button',m).forEach(x=>x.setAttribute('aria-pressed',x===b)); });
    $('#again',m).onclick=run; $('#nx',m).onclick=()=>{ SFX.tap(); if(k<chars.length-1){ k++; mode='trace'; stage(); } else finish(); };
    speak(c); run(); }
  function run(){ const c=chars[k], box=$('#hw',m), msg=$('#wmsg',m); box.innerHTML=''; msg.textContent=''; const size=Math.min(300,innerWidth-80);
    writer=hwCreate(box,c,{size,showOutline:mode!=='memory',showCharacter:mode==='watch'});
    if(mode==='watch'){ writer.loopCharacterAnimation(); msg.textContent=t('wWatchD'); return; }
    let miss=0; msg.textContent=mode==='trace'?t('wTraceD'):t('wMemoryD');
    writer.quiz({showHintAfterMisses:mode==='trace'?2:3,highlightOnComplete:true,
      onMistake:()=>{ miss++; haptic('error'); if(miss===2) msg.textContent=quip('bad'); },
      onCorrectStroke:d=>{ SFX.tap(); msg.textContent=`${d.strokeNum+1} / ${d.strokeNum+1+d.strokesRemaining}`; },
      onComplete:d=>{ const st=d.totalMistakes===0?3:d.totalMistakes<=2?2:1; total+=st; track('write_complete',{char:c,stars:st,mode}); SFX[st===3?'win':'ok'](); if(st===3) confetti(50);
        S.written=S.written||{}; S.written[c]=Math.max(S.written[c]||0,st); dayCount('writeDay').n++; const xp=(mode==='memory'?6:3)*st; addXP(xp); save();
        msg.innerHTML=`<span class="stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span> +${xp} XP · ${esc(st===3?quip('perfect'):quip('ok'))}`; } }); }
  function finish(){ const c=addCoins(5+total*2); SFX.win(); confetti(80);
    m.innerHTML=`<div class="result rise"><div class="bao-dance">${bao('cool',110)}</div><h1>${t('wDone')}</h1><div class="han" style="font-size:44px;letter-spacing:.15em;color:var(--gold2)">${chars.join('')}</div>
      <div class="row" style="justify-content:center;font:800 22px Inter">${coinHTML} +${c}</div><button class="btn block" id="dn">${t('done')}</button></div>`;
    $('#dn',m).onclick=()=>{ onFinish&&onFinish(); back&&back(); }; }
  stage(); }
/* --- hub --- */
SCREENS.writehub=(m,tab)=>{ tab=tab||S.wtab2||'today'; S.wtab2=tab; const l=curLevel(), u=unitsOf(l), cu=Math.min(curUnit(l),u.length-1);
  const todayChars=[...new Set((u[cu]||[]).flatMap(w=>[...w.h]))].filter(canWrite).slice(0,8);
  const done=Object.keys(S.written||{}).length;
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero ph" style="min-height:170px">${photo('dict',0,'','bg')}<span class="eyebrow">${t('wSub')}</span><h1>${t('writeTitle')}</h1><div class="sub" style="color:var(--ivory)"><span class="num">${done}</span> ${t('wWritten')}</div></div>
   <div class="seg" id="wt">${[['today','✍️ '+t('wToday')],['basics','笔 '+t('wBasics')],['stories','😄 '+t('wStories')],['fonts','书 '+t('wFonts')]].map(([x,l2])=>`<button data-x="${x}" aria-pressed="${tab===x}">${l2}</button>`).join('')}</div><div id="wb" class="col" style="gap:12px"></div>`);
  const b=$('#wb',m);
  if(tab==='today'){ b.innerHTML=`<div class="paper col" style="gap:10px"><div class="stamp">写</div><div class="sub" style="font-weight:600;color:var(--ink2)">HSK ${l} · ${t('unit')} ${cu+1}</div>
      <div class="han" style="font-size:40px;letter-spacing:.12em;text-align:start">${todayChars.join(' ')||'—'}</div><button class="btn block" id="go">✍️ ${t('wStart')}</button></div>
     <h2>${t('wPickChar')}</h2><input class="search" id="wq" placeholder="${t('wTypeChar')}" maxlength="8"><div class="chargrid" id="cg"></div>
     ${l>4?`<div class="fine">${t('wHsk56')}</div>`:''}`;
    const grid=q=>{ const pool=q?[...q].filter(canWrite):[...new Set((byLevel[l]||[]).flatMap(w=>[...w.h]))].filter(canWrite).slice(0,60);
      $('#cg',b).innerHTML=pool.map(c=>`<button class="wc ${S.written&&S.written[c]?'ok':''} ${writeFree(c)?'':'lk'}" data-c="${c}"><span class="han">${c}</span>${writeFree(c)?'':'<b class="lkb">🔒</b>'}${S.written&&S.written[c]?`<i>${'★'.repeat(S.written[c])}</i>`:''}</button>`).join('')||`<div class="sub">—</div>`;
      $$('[data-c]',b).forEach(x=>x.onclick=()=>writeFree(x.dataset.c)?go('write',{chars:[x.dataset.c]}):paywall('write')); };
    grid(''); $('#wq',b).oninput=e=>grid(e.target.value.trim()); $('#go',b).onclick=()=>todayChars.length&&go('write',{chars:todayChars,title:'HSK '+l}); }
  if(tab==='basics'){ b.innerHTML=`<div class="card col" style="gap:4px"><h3>${t('w8')}</h3><div class="sub">${t('w8D')}</div></div>
     <div class="col" style="gap:8px">${STROKES8.map(([c,n,p,en,ar,dEn,dAr],i)=>`<button class="card row stroke-row" data-s="${i}"><span class="han" style="font-size:34px;color:var(--gold2);min-width:44px">${n}</span><div class="grow" style="text-align:start"><b>${p} · ${isAr()?ar:en}</b><div class="sub">${esc(isAr()?dAr:dEn)}</div></div><span class="han" style="font-size:28px">${c}</span></button>`).join('')}</div>
     <div class="card col" style="gap:4px"><h3>${t('w7')}</h3><div class="sub">${t('w7D')}</div></div>
     <div class="col" style="gap:8px">${RULES7.map(([c,zh,en,ar],i)=>`<button class="card row stroke-row" data-r="${i}"><span class="han" style="font-size:30px;color:var(--gold2);min-width:44px">${c}</span><div class="grow" style="text-align:start"><b class="han">${zh}</b><div class="sub">${isAr()?ar:en}</div></div><span>▶</span></button>`).join('')}</div>`;
    const demo=(c,head)=>sheet(`<div class="col" style="align-items:center;gap:10px"><h3>${head}</h3><div class="wbox paper" style="width:220px;height:220px">${GRID}<div id="dm"></div></div><div class="row" style="gap:8px;width:100%"><button class="btn ghost grow" id="rp">↺</button><button class="btn grow" id="tr">✍️ ${t('wTrace')}</button></div></div>`,s=>{
      let wr=hwCreate($('#dm',s),c,{size:220,showCharacter:false}); wr.animateCharacter(); $('#rp',s).onclick=()=>{ wr.hideCharacter(); wr.animateCharacter(); }; $('#tr',s).onclick=()=>go('write',{chars:[c]}); });
    $$('[data-s]',b).forEach(x=>x.onclick=()=>{ const s=STROKES8[+x.dataset.s]; demo(s[0],`${s[1]} ${s[2]} · ${isAr()?s[4]:s[3]}`); });
    $$('[data-r]',b).forEach(x=>x.onclick=()=>{ const r=RULES7[+x.dataset.r]; demo(r[0],`${r[1]} · ${isAr()?r[3]:r[2]}`); }); }
  if(tab==='stories'){ b.innerHTML=`<div class="sub">${t('wStoriesD')}</div><div class="col" style="gap:8px">${STORIES.map(([c,en,ar])=>`<button class="card row stroke-row" data-c="${c}"><span class="han story-c">${c}</span><div class="grow sub" style="color:var(--ivory);text-align:start">${esc(isAr()?ar:en)}</div><span>✍️</span></button>`).join('')}</div>
     <button class="btn block" id="allst">✍️ ${t('wStoriesAll')}</button>`;
    $$('[data-c]',b).forEach(x=>x.onclick=()=>go('write',{chars:[x.dataset.c]})); $('#allst',b).onclick=()=>go('write',{chars:pick(STORIES.map(s=>s[0]),8),title:t('wStories')}); }
  if(tab==='fonts'){ const txt=S.fontTxt||'汉字之路';
    b.innerHTML=`<div class="sub">${t('wFontsD')}</div><input class="search" id="ft" value="${esc(txt)}" maxlength="12">
     <div class="col" style="gap:10px">${FONTS.map(([f,zh,p,en,ar,dEn,dAr])=>`<div class="card col" style="gap:6px"><div class="row"><b class="grow">${zh} <span class="py">${p}</span> · ${isAr()?ar:en}</b><span class="sub ltr" style="font-size:11px">${f}</span></div>
        <div class="fsample" style="font-family:'${f}',serif">${esc(txt)}</div><div class="sub">${esc(isAr()?dAr:dEn)}</div></div>`).join('')}</div>
     <h2>${t('wOld')}</h2><div class="col" style="gap:8px">${OLD_SCRIPTS.map(([zh,p,en,ar,dEn,dAr])=>`<div class="card col" style="gap:4px"><b><span class="han">${zh}</span> <span class="py">${p}</span> · ${isAr()?ar:en}</b><div class="sub">${esc(isAr()?dAr:dEn)}</div></div>`).join('')}</div>`;
    $('#ft',b).oninput=e=>{ S.fontTxt=e.target.value||'汉字'; save(); $$('.fsample',b).forEach(x=>x.textContent=S.fontTxt); }; }
  $$('#wt button',m).forEach(x=>x.onclick=()=>{ SFX.tap(); go('writehub',x.dataset.x); });
};
SCREENS.write=(m,a)=>writePractice(m,a.chars,{title:a.title,back:()=>go('writehub')});
