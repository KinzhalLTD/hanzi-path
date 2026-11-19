/* ===== Fun layer: 龙宝 Lóngbǎo the debugging dragon, jokes, fortune sticks (签), daily red envelope (红包),
   combo streaks with firecrackers, kung-fu ranks, seal achievements (印章) and a bug boss for every module. ===== */

/* ---------- 龙宝: a small red dragon drawn in SVG; moods: happy, cool, wow, sad, think ---------- */
/* Canva artwork (art/canva/longbao_<mood>.png) wins over the drawn SVG when it exists */
const DRAGON_ART={happy:['longbao_happy'],cool:['longbao_cool','longbao_win'],wow:['longbao_win'],sad:['longbao_sad'],think:['longbao_happy']};
function dragon(mood='happy',size=96){ const a=(DRAGON_ART[mood]||[]).map(k=>ART[k]).find(Boolean);
  if(a) return `<img class="dragon art ${mood}" src="${a}" width="${size}" height="${size}" alt="" draggable="false">`;
  return dragonSvg(mood,size); }
function dragonSvg(mood='happy',size=96){ const eyes={happy:'<path d="M37 47q4-5 8 0M55 47q4-5 8 0" stroke="#2a0d08" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
  wow:'<circle cx="41" cy="46" r="4.6" fill="#2a0d08"/><circle cx="59" cy="46" r="4.6" fill="#2a0d08"/><circle cx="42.5" cy="44.5" r="1.5" fill="#fff"/><circle cx="60.5" cy="44.5" r="1.5" fill="#fff"/>',
  sad:'<path d="M37 45q4 4 8 1M55 46q4 3 8-1" stroke="#2a0d08" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M68 40q3 6 0 8q-3-2 0-8z" fill="#8fd3ff"/>',
  think:'<circle cx="41" cy="46" r="3.6" fill="#2a0d08"/><path d="M55 46h8" stroke="#2a0d08" stroke-width="3.2" stroke-linecap="round"/>',
  cool:'<path d="M31 42h38l-2 7q-2 4-7 4h-4q-4 0-5-4l-1-2h-2l-1 2q-1 4-5 4h-4q-5 0-7-4z" fill="#140808"/><path d="M36 44l5 0" stroke="#fff" stroke-width="1.6" opacity=".6"/>'};
  const mouth={happy:'<path d="M43 58q7 7 14 0" stroke="#2a0d08" stroke-width="3" fill="#ff7f6b" stroke-linejoin="round"/>',cool:'<path d="M44 59q7 4 13-1" stroke="#2a0d08" stroke-width="3" fill="none" stroke-linecap="round"/>',
    wow:'<ellipse cx="50" cy="60" rx="5" ry="6" fill="#2a0d08"/>',sad:'<path d="M44 62q6-5 12 0" stroke="#2a0d08" stroke-width="3" fill="none" stroke-linecap="round"/>',think:'<path d="M45 60h9" stroke="#2a0d08" stroke-width="3" stroke-linecap="round"/>'};
  return `<svg class="dragon ${mood}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <path d="M26 30q-10-10-4-22q3 8 8 8q-4-8 0-14q6 12 6 24z" fill="#f2c14e"/><path d="M74 30q10-10 4-22q-3 8-8 8q4-8 0-14q-6 12-6 24z" fill="#f2c14e"/>
    <path d="M38 22q-6-10 2-16q0 8 6 10q2-10 10-12q-2 8 2 12q6-8 12-6q-6 6-4 12z" fill="#ff9a3c"/>
    <path d="M32 66q-16 0-24-10q6 0 10 4" stroke="#f2c14e" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M68 66q16 0 24-10q-6 0-10 4" stroke="#f2c14e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="52" rx="36" ry="34" fill="#d8342a"/><ellipse cx="50" cy="52" rx="36" ry="34" fill="url(#dg)"/>
    <defs><radialGradient id="dg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff7a5c" stop-opacity=".9"/><stop offset="1" stop-color="#8f1710" stop-opacity=".2"/></radialGradient></defs>
    
    <ellipse cx="50" cy="62" rx="20" ry="13" fill="#ffd7a8"/><circle cx="44" cy="58" r="1.6" fill="#a8452f"/><circle cx="56" cy="58" r="1.6" fill="#a8452f"/>
    <ellipse cx="29" cy="58" rx="5" ry="3" fill="#ff8f7a" opacity=".55"/><ellipse cx="71" cy="58" rx="5" ry="3" fill="#ff8f7a" opacity=".55"/>
    ${eyes[mood]||eyes.happy}${mood==='cool'?mouth.cool:''}<g transform="translate(0,6)">${mood==='cool'?'':(mouth[mood]||mouth.happy)}</g>
    <path d="M40 84q10 6 20 0" stroke="#f2c14e" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`; }
const LB=()=>isAr()?'لونغ باو':'Lóngbǎo';

/* ---------- jokes (tap the dragon), quips for right/wrong answers ---------- */
const JOKES=[
 ['لماذا يحب المبرمجون الوضع الداكن؟ لأن الضوء يجذب الحشرات (bugs)!','Why do programmers love dark mode? Because light attracts bugs.'],
 ['كلمة مروري «incorrect». إذا نسيتها يقول لي النظام: your password is incorrect.','My password is "incorrect". When I forget it, the system reminds me: "your password is incorrect".'],
 ['هناك 10 أنواع من الناس: من يفهم الثنائي ومن لا يفهمه.','There are 10 kinds of people: those who understand binary and those who don’t.'],
 ['كتبت كودًا يعمل من أول مرة. استيقظت فورًا.','I wrote code that worked on the first try. Then I woke up.'],
 ['أغلقت كل المنافذ بجدار ناري. الآن لا يستطيع حتى أنا الدخول. أمان مثالي!','I closed every port with the firewall. Now even I can’t get in. Perfect security!'],
 ['الهاكر لا يطرق الباب… يرسل لك «فاتورة_عاجلة.pdf.exe».','Hackers don’t knock. They send “urgent_invoice.pdf.exe”.'],
 ['قال المدير: أصلح الخلل فورًا. فقلت: أي واحد من الـ 99؟','Boss: “Fix the bug now!” Me: “Which of the 99?”'],
 ['git push --force: لأن الشجاعة أحيانًا أهم من الحكمة. (لا تفعلها!)','git push --force: when courage beats wisdom. (Don’t.)'],
 ['المصادقة الثنائية: لأن كلمة «123456» لم تعد تكفي وحدها.','Two-factor authentication: because “123456” can’t carry the team alone anymore.'],
 ['لماذا عبرت الحزمة الجدار الناري؟ لأن القاعدة رقم 1 كانت allow any.','Why did the packet cross the firewall? Rule 1 said “allow any”.'],
 ['在我电脑上能跑！ «يعمل على جهازي!» — أشهر جملة في الصين والعالم.','在我电脑上能跑！“It works on my machine!” — famous in every language.'],
 ['المبرمج الصيني يسمي نفسه 码农: مزارع كود. نزرع الأكواد ونحصد الأخطاء.','Chinese devs call themselves 码农, “code farmers”: we plant code and harvest bugs.'],
 ['التشفير مثل الصداقة: المفتاح الخاص لا تعطه لأحد.','Encryption is like friendship: never share your private key.'],
 ['الفرق بين الفيروس والدودة؟ الدودة لا تحتاج دعوة للحفلة.','Virus vs worm? The worm doesn’t need an invitation to the party.'],
 ['أنا لا أكتب أخطاء، أنا أضيف ميزات غير موثقة.','I don’t write bugs. I write undocumented features.'],
 ['سألت الذكاء الاصطناعي عن كلمة مرور قوية فقال: لا تسألني!','I asked an AI for a strong password. It said: “Don’t ask me!”'],
 ['ثلاث كلمات تخيف المبرمج: «عندي فكرة صغيرة».','Three words that scare developers: “Just a quick change.”'],
 ['التاريخ لا يُمحى… خصوصًا تاريخ Git.','History can’t be erased… especially Git history.'],
 ['اسم الثغرة يوم صفر لأن عدد ساعات نومك صفر بعد اكتشافها.','It’s called a zero-day because that’s how many hours you’ll sleep.'],
 ['龙宝 لا ينفث النار، ينفث الاستثناءات (exceptions).','Lóngbǎo doesn’t breathe fire. He throws exceptions.']];
const QUIP_OK=[['ضربة كونغ فو! 💥','Kung-fu strike! 💥'],['ممتاز كالشاي الأخضر 🍵','Smooth as green tea 🍵'],['龙宝 يرقص فرحًا!','Lóngbǎo is dancing!'],['حتى الإمبراطور معجب 👑','Even the Emperor is impressed 👑'],['厉害! lìhai — رائع!','厉害! lìhai — awesome!'],['الخلل يرتجف أمامك 🐛','The bug is shaking 🐛']];
const QUIP_BAD=[['آخ! لكن الخطأ صديق المبرمج.','Ouch! But errors are a coder’s best friend.'],['龙宝 يقول: 没关系 méi guānxi — لا بأس.','Lóngbǎo says: 没关系 méi guānxi — no worries.'],['حتى سون ووكونغ تعثّر مرة.','Even the Monkey King tripped once.'],['اقرأ رسالة الخطأ… إنها تحاول مساعدتك.','Read the error message. It’s trying to help.'],['خطأ صغير، درس كبير 📜','Small mistake, big lesson 📜']];
const pickL=a=>{ const x=a[Math.random()*a.length|0]; return isAr()?x[0]:x[1]; };

/* ---------- fortune sticks 求签: one per day ---------- */
const FORTUNES=[['上上签','أعلى بركة','Supreme luck','الكود سيعمل من أول مرة اليوم. لا تخبر أحدًا كي لا تُفسد الحظ.','Your code compiles on the first try today. Tell no one, or the luck breaks.'],
 ['上签','بركة عظيمة','Great luck','ستجد الخلل في السطر الذي لم تشك فيه أبدًا.','You will find the bug in the line you trusted most.'],
 ['上签','بركة عظيمة','Great luck','طلب الدمج سيُقبل دون تعليقات. معجزة صغيرة.','Your merge request will be approved without comments. A small miracle.'],
 ['中签','حظ متوسط','Fair luck','احفظ عملك كثيرًا. بطارية الحاسوب تخطط لشيء.','Save often. Your laptop battery is plotting something.'],
 ['中签','حظ متوسط','Fair luck','كوب شاي وحل لغز تشفير: هذه وصفة السعادة اليوم.','A cup of tea and one cipher puzzle: today’s recipe for happiness.'],
 ['上签','بركة عظيمة','Great luck','المهاجم سيختار شركة أخرى اليوم، لأن مصادقتك متعددة العوامل.','Attackers will pick another company today, because you have MFA.'],
 ['中签','حظ متوسط','Fair luck','الاجتماع الذي كان يمكن أن يكون رسالة بريد… سيكون رسالة بريد.','The meeting that could have been an email will be an email.'],
 ['上上签','أعلى بركة','Supreme luck','ستتعلم 10 مصطلحات صينية وتبهر زملاءك في الاجتماع القادم.','You will learn 10 Chinese terms and amaze the next meeting.'],
 ['下签','تحذير لطيف','Gentle warning','لا تنشر يوم الخميس مساءً. الحكماء يعرفون السبب.','Do not deploy on Thursday evening. The wise know why.'],
 ['中签','حظ متوسط','Fair luck','الخلل الذي تطارده يطاردك أيضًا. اكتب اختبارًا وأمسكه.','The bug you hunt is hunting you. Write a test and catch it.'],
 ['上签','بركة عظيمة','Great luck','كلمة مرورك طويلة كسور الصين العظيم. فخور بك.','Your passphrase is as long as the Great Wall. Proud of you.'],
 ['下签','تحذير لطيف','Gentle warning','رسالة «عاجل جدًا» ستصلك اليوم. تمهّل، فقد تكون تصيّدًا.','An “URGENT!!” email arrives today. Breathe; it may be phishing.']];
function fortuneSheet(){ const d=today(); const done=S.fortuneDay===d; const i=done?S.fortuneIdx:Math.floor(seeded('qian'+d)()*FORTUNES.length); const f=FORTUNES[i];
  sheet(`<div class="col" style="align-items:center;gap:14px;text-align:center"><span class="eyebrow">求签 · qiú qiān</span><h2>${isAr()?'عود الحظ اليومي':'Daily fortune stick'}</h2>
    <div class="qtube ${done?'':'shake'}" id="qt"><div class="stick">${done?esc(f[0]):'?'}</div></div>
    <div id="fo">${done?fortuneHTML(f):`<button class="btn" id="draw">🥢 ${isAr()?'هزّ الأنبوب':'Shake the tube'}</button>`}</div></div>`,el=>{
    const b=$('#draw',el); if(b) b.onclick=()=>{ SFX.tap(); haptic('medium'); $('#qt',el).classList.add('go'); setTimeout(()=>{ S.fortuneDay=d; S.fortuneIdx=i; save(); SFX.gong(); $('#qt .stick',el).textContent=f[0]; $('#fo',el).innerHTML=fortuneHTML(f); addCoins(8); checkBadges(); },900); }; }); }
const fortuneHTML=f=>`<div class="fortune rise"><div class="brushzh">${esc(f[0])}</div><b>${esc(isAr()?f[1]:f[2])}</b><p>${esc(isAr()?f[3]:f[4])}</p><span class="sub">+8 ${t('bitsCur')}</span></div>`;

/* ---------- daily red envelope 红包: lucky amounts with 8s, bigger with a streak ---------- */
const HB_AMOUNTS=[18,28,38,58,66,88];
function hongbaoSheet(){ const d=today(), done=S.hbDay===d; const r=seeded('hb'+d+(S.hbCount||0));
  const amt=HB_AMOUNTS[Math.floor(r()*HB_AMOUNTS.length)]+Math.min(30,S.streak*3);
  sheet(`<div class="hbsheet col" style="align-items:center;gap:14px;text-align:center"><span class="eyebrow">红包 · hóngbāo</span><h2>${isAr()?'الظرف الأحمر اليومي':'Daily red envelope'}</h2>
    <button class="hongbao ${done?'open':''}" id="hbx" aria-label="红包"><span class="hbtop"></span><span class="hbseal">${done?'✓':'福'}</span><span class="hbamt num" id="ha">${done?'+'+S.hbLast:''}</span></button>
    <p class="sub">${done?(isAr()?'عد غدًا لظرف جديد. السلسلة تزيد المبلغ!':'Come back tomorrow for a new one. Your streak makes it bigger!'):(isAr()?'اضغط لفتحه. 恭喜发财 gōngxǐ fācái!':'Tap to open. 恭喜发财 gōngxǐ fācái!')}</p></div>`,el=>{
    if(done) return; $('#hbx',el).onclick=()=>{ if(S.hbDay===d) return; S.hbDay=d; S.hbLast=amt; S.hbCount=(S.hbCount||0)+1; save(); $('#hbx',el).classList.add('open'); SFX.coin(); haptic('success');
      setTimeout(()=>{ $('#ha',el).textContent='+'+amt; $('.hbseal',el).textContent='✓'; addCoins(amt); fireworks(); checkBadges(); },380); }; }); }

/* ---------- celebration: firecrackers + falling glyphs ---------- */
function fireworks(n=3){ if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;z-index:95;pointer-events:none'; c.width=innerWidth*devicePixelRatio; c.height=innerHeight*devicePixelRatio; document.body.appendChild(c);
  const x=c.getContext('2d'); x.scale(devicePixelRatio,devicePixelRatio); const P=[], cols=['#ffd978','#f2c14e','#ff6f4f','#e2483a','#fff1c9'];
  for(let k=0;k<n;k++){ const cx=innerWidth*(.2+.6*Math.random()), cy=innerHeight*(.18+.3*Math.random()), col=cols[k%cols.length]; for(let i=0;i<46;i++){ const a=Math.PI*2*i/46, v=2+Math.random()*4.5; P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:60+Math.random()*30,c:col,d:k*12}); } }
  try{ [0,1,2].forEach(i=>{ tone(180+i*60,.12,'square',.04,i*.2); tone(1400,.05,'triangle',.03,i*.2+.05); }); }catch(e){}
  let f=0; (function step(){ x.clearRect(0,0,innerWidth,innerHeight); P.forEach(p=>{ if(f<p.d) return; p.vy+=.06; p.vx*=.985; p.vy*=.985; p.x+=p.vx; p.y+=p.vy; p.l--; if(p.l>0){ x.globalAlpha=Math.min(1,p.l/30); x.fillStyle=p.c; x.beginPath(); x.arc(p.x,p.y,2.2,0,7); x.fill(); } });
    x.globalAlpha=1; if(++f<130) requestAnimationFrame(step); else c.remove(); })(); }

/* ---------- combo: consecutive right answers anywhere; milestones pop firecrackers ---------- */
let COMBO=0;
function comboHit(ok,anchor){ if(!ok){ COMBO=0; $$('.combo').forEach(e=>e.remove()); return 0; } COMBO++; S.bestCombo=Math.max(S.bestCombo||0,COMBO); questEvent('combo',COMBO,true); if(COMBO>=2) setTimeout(()=>SFX.combo(COMBO),120);
  if(COMBO>=3){ $$('.combo').forEach(e=>e.remove()); const d=document.createElement('div'); d.className='combo'; d.innerHTML=`<b class="num">${COMBO}</b> ${isAr()?'ضربات متتالية':'连击 combo'} ${COMBO>=10?'🐉':COMBO>=5?'🧨':'🔥'}`; document.body.appendChild(d); setTimeout(()=>d.remove(),1600); }
  if([5,10,20,30].includes(COMBO)){ fireworks(COMBO>=10?4:2); toast(`${COMBO} ${isAr()?'متتالية! مكافأة':'in a row! Bonus'} +${COMBO} ${t('bitsCur')}`); addCoins(COMBO); }
  return COMBO>=5?2:1; }

/* ---------- bosses: one bug monster per module, fought in the module quiz ---------- */
const BOSSES={'se-fund':['👻','未定义幽灵','wèidìngyì yōulíng','شبح undefined','The Undefined Ghost'],'se-ds':['🐙','乱序章鱼','luànxù zhāngyú','أخطبوط الفوضى','The Unsorted Octopus'],
 'se-algo':['🌀','死循环妖','sǐxúnhuán yāo','شيطان الحلقة اللانهائية','The Infinite Loop Demon'],'se-oop':['🗿','上帝类巨人','shàngdì lèi jùrén','عملاق الصنف الإله','The God-Class Giant'],
 'se-pat':['🍝','面条代码怪','miàntiáo dàimǎ guài','وحش كود المعكرونة','The Spaghetti Code Monster'],'se-git':['🐲','合并冲突龙','hébìng chōngtū lóng','تنين تعارض الدمج','The Merge Conflict Dragon'],
 'se-test':['🐞','幽灵缺陷','yōulíng quēxiàn','الخلل الشبح','The Phantom Bug'],'se-web':['🔥','服务器宕机兽','fúwùqì dàngjī shòu','وحش الخادم المعطّل','The Server-Down Beast'],
 'se-db':['🦥','慢查询树懒','màn cháxún shùlǎn','كسلان الاستعلام البطيء','The Slow-Query Sloth'],'se-sys':['🏯','单点故障巨像','dāndiǎn gùzhàng jùxiàng','عملاق نقطة الفشل الوحيدة','The Single-Point-of-Failure Colossus'],
 'se-ops':['💻','本地能跑精','běndì néng pǎo jīng','عفريت «يعمل على جهازي»','The Works-On-My-Machine Imp'],'se-agile':['🦊','需求变更狐','xūqiú biàngēng hú','ثعلب تغيّر المتطلبات','The Scope-Creep Fox'],
 'cy-found':['🐀','弱口令鼠','ruò kǒulìng shǔ','فأر كلمة المرور الضعيفة','The Weak-Password Rat'],'cy-crypto':['🐸','明文蛤蟆','míngwén háma','ضفدع النص الصريح','The Plaintext Toad'],
 'cy-iam':['🐒','越权猴','yuèquán hóu','قرد تجاوز الصلاحيات','The Privilege-Grabbing Monkey'],'cy-net':['🦀','端口大开蟹','duānkǒu dà kāi xiè','سرطان المنافذ المفتوحة','The Open-Port Crab'],
 'cy-web':['🐍','注入毒蛇','zhùrù dúshé','أفعى الحقن','The Injection Viper'],'cy-code':['🦇','硬编码蝙蝠','yìngbiānmǎ biānfú','خفاش الأسرار المكتوبة','The Hard-Coded Bat'],
 'cy-threat':['🦈','钓鱼老鲨','diàoyú lǎo shā','قرش التصيّد العجوز','The Old Phishing Shark'],'cy-soc':['🦟','误报蚊子','wùbào wénzi','بعوضة الإنذار الكاذب','The False-Alarm Mosquito'],
 'cy-ir':['👹','勒索魔王','lèsuǒ mówáng','ملك الفدية الشرير','The Ransomware Overlord'],'cy-cloud':['🪣','公开存储桶怪','gōngkāi cúnchǔtǒng guài','غول الحاوية المفتوحة','The Open-Bucket Ogre'],
 'cy-grc':['📜','审计饕餮','shěnjì tāotiè','تاوتيه آكل الأوراق','The Paper-Eating Taotie'],'cy-eh':['🥷','范围外幽灵','fànwéi wài yōulíng','نينجا خارج النطاق','The Out-of-Scope Ninja']};
const TAUNTS=[['هاها! حتى المتدرّب يعرف هذه!','Ha! Even the intern knows that one!'],['هل جرّبت إطفاءه وتشغيله من جديد؟','Have you tried turning it off and on again?'],['هذا الخطأ سيذهب إلى الإنتاج يوم الخميس!','That bug ships to production on Thursday!'],['أشمّ رائحة كود بلا اختبارات…','I smell untested code…']];
const HITS=[['ضربة مباشرة!','Direct hit!'],['الوحش يترنّح!','The monster staggers!'],['بوو! سطر نظيف!','Boom! Clean line!'],['ضربة التنين!','Dragon strike!']];
const bossOf=k=>{ const b=BOSSES[k]||['🐛','小虫','xiǎo chóng','خلل صغير','A Small Bug']; const img=ART['boss_'+k]; return {k,e:b[0],zh:b[1],py:b[2],name:isAr()?b[3]:b[4],h:img?`<img class="bossimg" src="${img}" alt="" draggable="false">`:b[0]}; };

/* ---------- seal achievements 印章 ---------- */
const BADGES=[['first','初','chū','الخطوة الأولى','First step',()=>MODS.some(m=>(S.mods[m.k]||{}).L)],
 ['boss','斩','zhǎn','قاتل الوحوش','Monster slayer',()=>Object.values(S.mods).some(m=>m.Q)],
 ['flawless','完','wán','بلا خدش','Flawless',()=>!!S.flawless],
 ['combo10','连','lián','عشرة متتالية','Combo ×10',()=>(S.bestCombo||0)>=10],
 ['streak3','恒','héng','ثلاثة أيام','3-day streak',()=>S.streak>=3],
 ['streak7','毅','yì','أسبوع كامل','7-day streak',()=>S.streak>=7],
 ['lab1','试','shì','أول مختبر','First lab',()=>Object.keys(S.labs).length>=1],
 ['lab10','巧','qiǎo','عشرة مختبرات','10 code labs',()=>Object.keys(S.labs).length>=10],
 ['ctf','密','mì','كاسر الشيفرات','Code breaker',()=>Object.keys((S.sec||{}).ctf||{}).length>=CTF.length],
 ['phish','慧','huì','عين الصقر','Hawk eye',()=>Object.keys((S.sec||{}).phish||{}).length>=PHISH.length],
 ['terms50','文','wén','خمسون مصطلحًا','50 terms',()=>Object.keys(S.srs).length>=50],
 ['talk','言','yán','أول محادثة','First conversation',()=>Object.keys(S.talk||{}).length>=1],
 ['exam','第','dì','ناجح في الامتحان الإمبراطوري','Imperial exam passed',()=>Object.values(S.exams||{}).some(x=>x>=.7)],
 ['hb7','福','fú','سبعة ظروف حمراء','7 red envelopes',()=>(S.hbCount||0)>=7],
 ['owl','夜','yè','بومة الليل','Night owl',()=>!!S.owl],
 ['se','码','mǎ','مهندس برمجيات','Software engineer',()=>TRACK('se').every(m=>modDone(m.k))],
 ['cy','盾','dùn','حارس سيبراني','Cyber guardian',()=>TRACK('cy').every(m=>modDone(m.k))]];
function checkBadges(){ S.badges=S.badges||{}; const h=new Date().getHours(); if(h<4&&S.todayXP>0) S.owl=1; let got=null;
  for(const b of BADGES){ if(!S.badges[b[0]]&&b[5]()){ S.badges[b[0]]=today(); got=b; } }
  if(got){ save(); setTimeout(()=>stampToast(got),500); } }
function stampToast(b){ const d=document.createElement('div'); d.className='stamp'; d.setAttribute('role','status');
  d.innerHTML=`<span class="sealbig">${b[1]}</span><div class="col"><span class="eyebrow">${isAr()?'ختم جديد':'New seal'}</span><b>${esc(isAr()?b[3]:b[4])}</b></div>`;
  document.body.appendChild(d); SFX.stamp(); setTimeout(()=>SFX.gong(),180); haptic('success'); setTimeout(()=>d.classList.add('out'),2600); setTimeout(()=>d.remove(),3100); }
const sealHTML=(b,on)=>`<div class="sealc ${on?'on':''}" title="${esc(isAr()?b[3]:b[4])}"><span class="sealbig">${b[1]}</span><span class="py" style="font-size:11px">${b[2]}</span><span class="sub">${esc(isAr()?b[3]:b[4])}</span></div>`;
