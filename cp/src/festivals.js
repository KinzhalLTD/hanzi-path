const FEST_KEYS=["eve", "spring", "lantern", "qingming", "dragon", "qixi", "midautumn", "chongyang", "dongzhi", "laba"];
const FEST_DATES={"2026":["20260216","20260217","20260303","20260405","20260619","20260819","20260925","20261018","20261222","20270115"],"2027":["20270205","20270206","20270220","20270405","20270609","20270808","20270915","20271008","20271222","20280104"],"2028":["20280125","20280126","20280209","20280404","20280528","20280826","20281003","20281026","20281221","20290122"],"2029":["20290212","20290213","20290227","20290404","20290616","20290816","20290922","20291016","20291221","20300111"],"2030":["20300202","20300203","20300217","20300405","20300605","20300805","20300912","20301005","20301222","20310101"],"2031":["20310122","20310123","20310206","20310405","20310624","20310824","20311001","20311024","20311222","20320120"],"2032":["20320210","20320211","20320225","20320404","20320612","20320812","20320919","20321012","20321221","20330108"],"2033":["20330130","20330131","20330214","20330404","20330601","20330801","20330908","20331001","20331221","20340127"],"2034":["20340218","20340219","20340305","20340405","20340620","20340820","20340927","20341020","20341222","20350116"],"2035":["20350207","20350208","20350222","20350405","20350610","20350810","20350916","20351009","20351222","20360105"],"2036":["20360127","20360128","20360211","20360404","20360530","20360828","20361004","20361027","20361221","20370123"],"2037":["20370214","20370215","20370301","20370404","20370618","20370817","20370924","20371017","20371221","20380112"],"2038":["20380203","20380204","20380218","20380405","20380607","20380807","20380913","20381007","20381222","20390102"],"2039":["20390123","20390124","20390207","20390405","20390527","20390826","20391002","20391026","20391222","20400121"],"2040":["20400211","20400212","20400226","20400404","20400614","20400814","20400920","20401014","20401221","20410110"]};
/* ===== Chinese calendar: festivals as in-app celebrations + local notifications (shared by Hanzi Path and Cipher Path).
   Dates 2026–2040 computed from the lunar calendar (lunardate) and solar terms (ephem, China time); see docs/FESTIVALS.md. ===== */
const FAPP=typeof bao==='function'?'hp':'cp';
const FMASCOT=(mood,size)=>FAPP==='hp'?bao(mood,size):dragon(mood,size);
const ZODIAC=[['🐀','鼠','shǔ','الفأر','Rat'],['🐂','牛','niú','الثور','Ox'],['🐅','虎','hǔ','النمر','Tiger'],['🐇','兔','tù','الأرنب','Rabbit'],['🐉','龙','lóng','التنين','Dragon'],['🐍','蛇','shé','الأفعى','Snake'],
  ['🐎','马','mǎ','الحصان','Horse'],['🐐','羊','yáng','الماعز','Goat'],['🐒','猴','hóu','القرد','Monkey'],['🐓','鸡','jī','الديك','Rooster'],['🐕','狗','gǒu','الكلب','Dog'],['🐖','猪','zhū','الخنزير','Pig']];
/* f: id → emoji, zh, pinyin, ar, en, lunar label, about ar/en, greeting [zh,py,ar,en], words [[zh,py,ar,en]…] (Hanzi Path), tip ar/en (Cipher Path) */
const FEST={
 eve:{ic:'🧧',zh:'除夕',py:'Chúxī',ar:'ليلة رأس السنة الصينية',en:"Chinese New Year's Eve",lun:'腊月最后一天',
  a:'آخر ليلة في السنة القمرية. تجتمع العائلات حول «عشاء لمّ الشمل»، ويسهر كثيرون حتى منتصف الليل لاستقبال العام الجديد.',e:'The last night of the lunar year. Families gather for the reunion dinner, and many stay up past midnight to welcome the new year.',
  g:['除夕快乐','Chúxī kuàilè','ليلة سعيدة قبل العام الجديد!',"Happy New Year's Eve!"],
  w:[['年夜饭','nián yè fàn','عشاء لمّ الشمل','reunion dinner'],['守岁','shǒu suì','السهر لاستقبال العام','staying up to see the year in'],['团圆','tuán yuán','لمّ شمل العائلة','family reunion']],
  ta:'قبل منتصف الليل: انسخ صور العائلة احتياطيًا. هي أكثر ما ستحزن عليه إن ضاع الهاتف.',te:'Before midnight: back up your family photos. They are what you would miss most if the phone got lost.'},
 spring:{ic:'🏮',zh:'春节',py:'Chūnjié',ar:'عيد الربيع (رأس السنة الصينية)',en:'Spring Festival (Chinese New Year)',lun:'正月初一',
  a:'أهم عيد في الصين: أظرف حمراء فيها نقود للصغار، وأبيات تهنئة حمراء على الأبواب، وزلابية، ورقصة الأسد. رحلات العودة إلى البيت في موسمه بالمليارات، وتُعدّ أكبر هجرة بشرية سنوية.',e:'The biggest holiday in China: red envelopes with money for children, red couplets on doors, dumplings and lion dances. Trips home in the season run into the billions, the largest yearly human migration.',
  g:['新年快乐','Xīnnián kuàilè','سنة جديدة سعيدة!','Happy New Year!'],
  w:[['红包','hóng bāo','الظرف الأحمر','red envelope'],['春联','chūn lián','أبيات تهنئة العيد','New Year couplets'],['饺子','jiǎo zi','زلابية','dumplings'],['恭喜发财','gōng xǐ fā cái','أتمنى لك الرخاء','wishing you prosperity'],['拜年','bài nián','زيارة التهنئة بالعام','New Year visit']],
  ta:'تنظيف الربيع رقميًا: غيّر كلمة مرور مكررة واحدة وفعّل التحقق بخطوتين. واحذر روابط «الظرف الأحمر» المزيفة؛ المحتالون يحبون الأعياد.',te:'Digital spring cleaning: change one reused password and turn on two-step sign-in. And beware fake "red envelope" payment links; scammers love holidays.'},
 lantern:{ic:'🪔',zh:'元宵节',py:'Yuánxiāojié',ar:'عيد الفوانيس',en:'Lantern Festival',lun:'正月十五',
  a:'أول بدر في العام الجديد يختم احتفالات العيد: فوانيس ملونة، وألغاز تُعلّق عليها ليحلّها المارّة، وكرات أرز حلوة تُسمّى «تانغيوان».',e:'The first full moon of the year closes the New Year celebrations: coloured lanterns, riddles hung on them for passers-by to solve, and sweet rice balls called tangyuan.',
  g:['元宵节快乐','Yuánxiāojié kuàilè','عيد فوانيس سعيد!','Happy Lantern Festival!'],
  w:[['灯笼','dēng lóng','فانوس','lantern'],['灯谜','dēng mí','لغز الفانوس','lantern riddle'],['汤圆','tāng yuán','كرات الأرز الحلوة','sweet rice balls']],
  ta:'لغز الفانوس: طويل وعشوائي، ولا تحتاج أن تحفظني لأن المدير يحفظني. من أنا؟ كلمة مرور صنعها مدير كلمات المرور.',te:"Lantern riddle: I'm long and random, and you don't need to remember me because the manager does. What am I? A password made by a password manager."},
 qingming:{ic:'🌿',zh:'清明节',py:'Qīngmíngjié',ar:'عيد الصفاء (تشينغمينغ)',en:'Qingming Festival',lun:'二十四节气',
  a:'يأتي مع فصل «الصفاء والإشراق» من الفصول الشمسية الأربعة والعشرين. تزور العائلات قبور الأجداد وتنظّفها، ويخرج الناس في نزهات ربيعية ويطيّرون الطائرات الورقية.',e:'It falls on the "clear and bright" solar term, one of the 24 of the year. Families visit and tidy their ancestors\' graves, and people go on spring outings and fly kites.',
  g:['清明安康','Qīngmíng ānkāng','أتمنى لك صفاءً وعافية','Wishing you peace and good health'],
  w:[['扫墓','sǎo mù','تنظيف القبور','tomb sweeping'],['踏青','tà qīng','نزهة ربيعية','spring outing'],['风筝','fēng zheng','طائرة ورقية','kite']],
  ta:'نزهة ربيعية؟ أوقف الاتصال التلقائي بشبكات Wi-Fi قبل أن تخرج؛ الشبكة المزيفة قد تحمل اسم المقهى نفسه.',te:'Spring outing? Turn off auto-join Wi-Fi before you go; a fake hotspot can carry the very same café name.'},
 dragon:{ic:'🐲',zh:'端午节',py:'Duānwǔjié',ar:'عيد قوارب التنين',en:'Dragon Boat Festival',lun:'五月初五',
  a:'سباقات قوارب طويلة برأس تنين يجدّف فيها الفريق على إيقاع طبل واحد، وفطائر أرز ملفوفة بورق الخيزران اسمها «زونغزي». تقول الحكاية إنه يخلّد ذكرى الشاعر تشو يوان.',e:'Races of long dragon-headed boats paddled to one drumbeat, and rice parcels wrapped in bamboo leaves called zongzi. The story says it remembers the poet Qu Yuan.',
  g:['端午安康','Duānwǔ ānkāng','عيد قوارب تنين بخير وعافية','Wishing you a healthy Dragon Boat Festival'],
  w:[['龙舟','lóng zhōu','قارب التنين','dragon boat'],['粽子','zòng zi','فطيرة أرز بورق الخيزران','zongzi rice parcel'],['屈原','Qū Yuán','الشاعر تشو يوان','the poet Qu Yuan']],
  ta:'قارب التنين يفوز حين يجدّف الجميع على إيقاع واحد. وكذلك الفرق التقنية: قائمة واحدة مشتركة لتحديثات الأمان تسرّع الإصلاح.',te:'A dragon boat wins when everyone paddles to one beat. Tech teams too: one shared patch checklist makes fixes faster.'},
 qixi:{ic:'🌌',zh:'七夕节',py:'Qīxījié',ar:'عيد تشيشي',en:'Qixi Festival',lun:'七月初七',
  a:'تحكي الأسطورة عن راعي البقر «نيولانغ» والنسّاجة «تشينو»، نجمين يفرّقهما نهر المجرة، يلتقيان مرة في السنة على جسر يصنعه طائر العقعق.',e:'The legend tells of the cowherd Niulang and the weaver Zhinü, two stars split by the Milky Way, who meet once a year on a bridge made by magpies.',
  g:['七夕快乐','Qīxī kuàilè','عيد تشيشي سعيد!','Happy Qixi!'],
  w:[['牛郎','Niú láng','راعي البقر','the cowherd'],['织女','Zhī nǚ','النسّاجة','the weaver girl'],['鹊桥','què qiáo','جسر العقعق','magpie bridge']],
  ta:'الاحتيال العاطفي يزداد في أيام كهذه: لا ترسل مالًا ولا رموز تحقق لشخص عرفته عبر الإنترنت فقط.',te:'Romance scams rise around days like this: never send money or verification codes to someone you only know online.'},
 midautumn:{ic:'🥮',zh:'中秋节',py:'Zhōngqiūjié',ar:'عيد منتصف الخريف',en:'Mid-Autumn Festival',lun:'八月十五',
  a:'بدر منتصف الخريف رمز لمّ الشمل. تتأمل العائلات القمر وتتشارك كعك القمر. وتحكي الأسطورة عن «تشانغ إه» التي طارت إلى القمر، وباسمها سمّت الصين مسابيرها القمرية.',e:'The mid-autumn full moon stands for reunion. Families admire the moon and share mooncakes. The legend tells of Chang\'e, who flew to the moon, and China named its lunar probes after her.',
  g:['中秋快乐','Zhōngqiū kuàilè','عيد منتصف خريف سعيد!','Happy Mid-Autumn Festival!'],
  w:[['月饼','yuè bǐng','كعك القمر','mooncake'],['赏月','shǎng yuè','تأمّل القمر','admiring the moon'],['嫦娥','Cháng é','تشانغ إه، إلهة القمر','Chang\'e, the moon goddess']],
  ta:'وقت لمّ الشمل: ساعد قريبًا كبيرًا في السن على تفعيل التحقق بخطوتين وقفل الشاشة. أجمل من أي كعكة قمر.',te:'Reunion time: help an older relative turn on two-step sign-in and a screen lock. Better than any mooncake.'},
 chongyang:{ic:'🌼',zh:'重阳节',py:'Chóngyángjié',ar:'عيد التاسع المزدوج',en:'Double Ninth Festival',lun:'九月初九',
  a:'يُصعد فيه إلى الأماكن المرتفعة ويُتأمّل زهر الأقحوان، وهو اليوم الذي جعلته الصين منذ 2013 يومًا لتكريم كبار السن.',e:'People climb to high places and admire chrysanthemums, and since 2013 China has kept it as a day to honour the elderly.',
  g:['重阳安康','Chóngyáng ānkāng','عيد بخير وعافية','Wishing you good health this Double Ninth'],
  w:[['登高','dēng gāo','الصعود إلى مكان مرتفع','climbing heights'],['菊花','jú huā','زهر الأقحوان','chrysanthemum'],['敬老','jìng lǎo','احترام كبار السن','respecting the elderly']],
  ta:'كبار السن أكثر من يستهدفهم المحتالون بالهاتف. علّم والديك: البنك الحقيقي لا يطلب رمز التحقق أبدًا.',te:'Older people are a top target for phone scams. Teach your parents: a real bank never asks for a verification code.'},
 dongzhi:{ic:'❄️',zh:'冬至',py:'Dōngzhì',ar:'الانقلاب الشتوي',en:'Winter Solstice',lun:'二十四节气',
  a:'أطول ليلة في السنة. في الشمال يأكلون الزلابية، وفي الجنوب كرات الأرز الحلوة، ويقول المثل إن «الشتاء الكبير أكبر من العيد».',e:'The longest night of the year. The north eats dumplings and the south sweet rice balls, and an old saying calls it "as big as New Year".',
  g:['冬至快乐','Dōngzhì kuàilè','انقلاب شتوي سعيد!','Happy Winter Solstice!'],
  w:[['冬至','Dōng zhì','الانقلاب الشتوي','winter solstice'],['饺子','jiǎo zi','زلابية','dumplings'],['汤圆','tāng yuán','كرات الأرز الحلوة','sweet rice balls']],
  ta:'أطول ليلة في السنة، ومركز العمليات الأمنية لا ينام. تأكد أن تنبيهات تسجيل الدخول في حساباتك مفعّلة.',te:'The longest night of the year, and the SOC never sleeps. Make sure sign-in alerts are on for your accounts.'},
 laba:{ic:'🥣',zh:'腊八节',py:'Làbājié',ar:'عيد لابا',en:'Laba Festival',lun:'腊月初八',
  a:'يُطهى فيه عصيد «لابا» من أنواع كثيرة من الحبوب والمكسرات والفواكه المجففة، ويُعدّ بداية الاستعداد لعيد الربيع.',e:'Laba porridge is cooked from many grains, nuts and dried fruits, and the day marks the start of preparing for Spring Festival.',
  g:['腊八节快乐','Làbājié kuàilè','عيد لابا سعيد!','Happy Laba Festival!'],
  w:[['腊八粥','là bā zhōu','عصيد لابا','Laba porridge'],['农历','nóng lì','التقويم القمري','the lunar calendar'],['春运','chūn yùn','موسم سفر العيد','the holiday travel rush']],
  ta:'عصيد لابا يخلط حبوبًا كثيرة، والدفاع الجيد يخلط طبقات كثيرة: كلمة مرور، وتحقق بخطوتين، وتحديثات، ونسخ احتياطي.',te:'Laba porridge mixes many grains; good defence mixes many layers: password, two-step sign-in, updates and backups.'}};
const fd=s=>new Date(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8));
const fdayKey=d=>d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
/* all festivals from yesterday on, sorted: [{k, date, ymd, y}] */
function festList(from){ const t0=from||new Date(); const lo=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()); const out=[];
  for(const y in FEST_DATES) FEST_DATES[y].forEach((s,i)=>{ const d=fd(s); if(d>=lo) out.push({k:FEST_KEYS[i],date:d,ymd:s,y:+y}); });
  return out.sort((a,b)=>a.date-b.date); }
const festToday=()=>festList().find(x=>x.ymd===fdayKey(new Date()));
const festDays=x=>Math.round((x.date-new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()))/864e5);
/* zodiac of the lunar year that contains a date (the year turns at Spring Festival) */
function zodiacOf(d){ d=d||new Date(); let y=d.getFullYear(); const sp=FEST_DATES[y]?fd(FEST_DATES[y][1]):new Date(y,1,4); if(d<sp) y--; return {y,z:ZODIAC[((y-2020)%12+12)%12]}; }
const fName=f=>isAr()?f.ar:f.en;
const fDate=d=>d.toLocaleDateString(isAr()?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
/* ---------- celebration sheet (festival day: red envelope gift once per festival) ---------- */
function festSheet(k,x){ const f=FEST[k]; x=x||festList().find(e=>e.k===k); const isDay=x&&festDays(x)===0, key=x?k+x.ymd:'';
  S.festGot=S.festGot||{}; const got=!!S.festGot[key], ar=isAr();
  const extra=FAPP==='hp'?`<div class="fwords">${f.w.map(w=>`<button class="fword" data-zh="${esc(w[0])}"><span class="han">${esc(w[0])}</span><span class="py">${esc(w[1])}</span><span class="sub">${esc(ar?w[2]:w[3])}</span></button>`).join('')}</div>`
    :`<div class="ftip"><b>🛡️ ${ar?'نصيحة العيد الأمنية':'Festival security tip'}</b><p>${esc(ar?f.ta:f.te)}</p></div>`;
  sheet(`<div class="fsheet"><div class="flanterns" aria-hidden="true"><i>🏮</i><i>🏮</i><i>🏮</i></div>
    <div class="col" style="align-items:center;text-align:center;gap:6px"><span class="fbig" aria-hidden="true">${f.ic}</span>
      <div class="han fzh">${esc(f.zh)}</div><div class="py">${esc(f.py)} · ${esc(f.lun)}</div><h2 style="margin:4px 0 0">${esc(fName(f))}</h2>
      ${x?`<div class="sub">${fDate(x.date)}${isDay?'':` · ${festDays(x)} ${ar?'يومًا':'days'}`}</div>`:''}</div>
    <div class="fgreet"><div class="grow"><div class="han" style="font-size:24px">${esc(f.g[0])}</div><div class="py">${esc(f.g[1])}</div><div class="sub">${esc(ar?f.g[2]:f.g[3])}</div></div>
      <button class="speak" id="fsay" aria-label="${ar?'استمع إلى التهنئة':'Listen to the greeting'}">🔊</button></div>
    <p style="margin:0;line-height:1.7">${esc(ar?f.a:f.e)}</p>${extra}
    ${isDay?(got?`<div class="fgot">🧧 ${ar?'استلمت ظرف العيد الأحمر. عيد سعيد!':'Red envelope collected. Happy festival!'}</div>`:`<button class="btn block" id="fgift">🧧 ${ar?'افتح الظرف الأحمر':'Open your red envelope'}</button>`):''}
    <button class="btn ghost block" id="fcal">📅 ${ar?'التقويم الصيني':'Chinese calendar'}</button></div>`,s=>{
    $('#fsay',s).onclick=()=>speak(f.g[0]); $$('.fword',s).forEach(b=>b.onclick=()=>speak(b.dataset.zh));
    $('#fcal',s).onclick=()=>{ closeSheet(); go('festivals'); };
    const g=$('#fgift',s); if(g) g.onclick=()=>{ if(S.festGot[key]) return; S.festGot[key]=1; const c=addCoins(30); addXP(20); save(); confetti(120); try{ SFX.win(); haptic('success'); }catch(e){}
      track('festival_gift',{fest:k,y:x.y}); g.outerHTML=`<div class="fgot rise">🧧 +${c} ${FAPP==='hp'?'🪙':'bits'} · +20 XP</div>`; };
  }); track('festival_open',{fest:k,day:isDay}); }
/* once per festival day, celebrate on launch */
let festShown=false;
function festCheck(){ if(festShown) return; const x=festToday(); if(!x) return; S.festSeen=S.festSeen||{}; const key=x.k+x.ymd; if(S.festSeen[key]) return;
  festShown=true; S.festSeen[key]=1; save(); setTimeout(()=>{ confetti(80); festSheet(x.k,x); },700); }
/* home banner: today's festival, or the next one within 21 days */
function festBanner(){ const x=festList()[0]; if(!x) return ''; const n=festDays(x); if(n>21) return ''; const f=FEST[x.k], ar=isAr();
  return `<button class="card row fbanner${n===0?' today':''}" id="fban" data-k="${x.k}"><span class="fbi" aria-hidden="true">${f.ic}</span><div class="grow" style="text-align:start;min-width:0">
    <b>${n===0?(ar?'اليوم: ':'Today: ')+esc(fName(f)):esc(fName(f))}</b><div class="sub"><span class="han">${esc(f.zh)}</span> · ${n===0?esc(f.g[0])+' 🎉':n===1?(ar?'غدًا':'tomorrow'):(ar?`بعد ${n} يومًا`:`in ${n} days`)}</div></div><span class="fcd num" aria-hidden="true">${n===0?'🧧':n}</span></button>`; }
function festHome(m){ const h=festBanner(); if(!h) return; const host=m.querySelector('.screen')||m; const anchor=host.children[1]||host.firstElementChild; if(!anchor) return;
  anchor.insertAdjacentHTML('afterend',h); const b=$('#fban',m); if(b) b.onclick=()=>{ SFX.tap(); festSheet(b.dataset.k); }; }
/* ---------- calendar screen ---------- */
SCREENS.festivals=m=>{ const ar=isAr(), list=festList().slice(0,14), zo=zodiacOf(), nz=ZODIAC[((zo.y+1-2020)%12+12)%12];
  S.festGot=S.festGot||{}; const seals=Object.keys(S.festGot).length;
  m.innerHTML=`<div class="screen"><div class="row" style="gap:10px"><button class="icon-btn" id="fb" aria-label="${ar?'رجوع':'Back'}">${ar?'›':'‹'}</button><h1 class="grow" style="margin:0">${ar?'التقويم الصيني':'Chinese calendar'} <span class="han" style="font-size:.8em">农历</span></h1></div>
   <div class="card fzod"><span class="fzi" aria-hidden="true">${zo.z[0]}</span><div class="grow"><div class="sub">${ar?'السنة القمرية الحالية':'This lunar year'}</div><b>${ar?'سنة ':'Year of the '}${esc(ar?zo.z[3]:zo.z[4])}</b>
     <div><span class="han">${zo.z[1]}年</span> <span class="py">${zo.z[2]} nián</span></div><div class="sub">${ar?'السنة القادمة: ':'Next: '}${nz[0]} ${esc(ar?nz[3]:nz[4])}</div></div></div>
   <div class="row" style="justify-content:space-between"><b>${ar?'الأعياد القادمة':'Coming festivals'}</b><span class="sub">🧧 ${seals} ${ar?'ظرفًا':'collected'}</span></div>
   <div class="col" style="gap:8px">${list.map(x=>{ const f=FEST[x.k], n=festDays(x); return `<button class="card row fitem${n===0?' today':''}" data-k="${x.k}" data-y="${x.ymd}"><span class="fbi" aria-hidden="true">${f.ic}</span>
     <div class="grow" style="text-align:start;min-width:0"><b>${esc(fName(f))}</b><div class="sub"><span class="han">${esc(f.zh)}</span> · ${esc(f.lun)}</div><div class="sub">${fDate(x.date)}</div></div>
     <span class="fcd num">${n===0?(ar?'اليوم':'Today'):n+(ar?' ي':' d')}</span></button>`; }).join('')}</div>
   <div class="card row" style="gap:10px"><div class="grow"><b>🔔 ${ar?'تنبيهات الأعياد':'Festival notifications'}</b><div class="sub">${ar?'تهنئة صباح كل عيد، وتذكير ليلة رأس السنة':'A greeting on each festival morning, and a New Year\'s Eve reminder'}</div></div>
     <button class="btn sm ${S.festN===false?'ghost':''}" id="fn" aria-pressed="${S.festN!==false}">${S.festN===false?(ar?'تشغيل':'Turn on'):(ar?'مفعّلة ✓':'On ✓')}</button></div>
   <p class="sub" style="margin:0">${ar?'تواريخ الأعياد محسوبة من التقويم القمري الصيني والفصول الشمسية بتوقيت الصين حتى عام 2040.':'Festival dates are worked out from the Chinese lunar calendar and solar terms (China time) up to 2040.'}</p></div>`;
  $('#fb',m).onclick=()=>typeof goBack==='function'?goBack('home'):go('home');
  $$('.fitem',m).forEach(b=>b.onclick=()=>{ SFX.tap(); festSheet(b.dataset.k,list.find(x=>x.ymd===b.dataset.y)); });
  $('#fn',m).onclick=async()=>{ S.festN=S.festN===false; save(); if(S.festN&&RN){ const r=await native('notify:permission',{}); S.pushOk=!!(r&&r.granted); save(); } festReschedule(); render(); }; };
/* notifications for the next 12 months (iOS keeps at most 64 pending; this adds ≤ 13) */
function festItems(){ if(S.festN===false) return []; const ar=isAr(), now=Date.now(), lim=now+365*864e5, out=[];
  festList().forEach(x=>{ const f=FEST[x.k], at=new Date(x.date.getFullYear(),x.date.getMonth(),x.date.getDate(),x.k==='eve'?19:10,0); if(+at<=now||+at>lim) return;
    out.push({id:'fest-'+x.k+x.ymd,at:at.toISOString(),title:`${f.ic} ${f.g[0]} · ${fName(f)}`,body:x.k==='eve'?(ar?'الليلة ليلة رأس السنة الصينية! افتح التطبيق واستلم ظرفك الأحمر غدًا 🧧':'Tonight is Chinese New Year\'s Eve! Open the app tomorrow for your red envelope 🧧')
      :(ar?`${f.g[2]} اليوم ${f.ar}؛ ظرف أحمر ينتظرك في التطبيق 🧧`:`${f.g[3]} It's ${f.en} today; a red envelope is waiting in the app 🧧`)}); });
  return out; }
function festReschedule(){ try{ if(typeof scheduleAll==='function') scheduleAll(); else if(typeof scheduleNative==='function') scheduleNative(); }catch(e){} }
/* hook into the home screen: banner + the festival-day celebration */
{ const _fh=SCREENS.home; SCREENS.home=(m,a)=>{ _fh(m,a); try{ festHome(m); festCheck(); }catch(e){ console.warn('fest',e); } }; }
/* Me → a door to the calendar */
{ const _fm=SCREENS.me; SCREENS.me=(m,a)=>{ _fm(m,a); try{ const host=m.querySelector('.screen')||m, anchor=host.children[1]||host.firstElementChild, zo=zodiacOf(), ar=isAr();
  if(!anchor||$('#fcalb',m)) return; anchor.insertAdjacentHTML('afterend',`<button class="card row fbanner" id="fcalb"><span class="fbi" aria-hidden="true">${zo.z[0]}</span><div class="grow" style="text-align:start;min-width:0"><b>${ar?'التقويم الصيني والأعياد':'Chinese calendar & festivals'}</b><div class="sub"><span class="han">${zo.z[1]}年</span> · ${ar?'سنة '+zo.z[3]:'Year of the '+zo.z[4]}</div></div><span aria-hidden="true">📅</span></button>`);
  $('#fcalb',m).onclick=()=>{ SFX.tap(); go('festivals'); }; }catch(e){} }; }
