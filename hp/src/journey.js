/* ===== The journey: each HSK level is a road across China. Units are grouped into chapters (one place each),
   every chapter ends at a gate (关) — a checkpoint test that can also be taken early to test out of the chapter. ===== */
Object.assign(T.ar,{jChapter:'المحطة',jGate:'بوابة الاختبار',jGateD:'اختبار قصير على كلمات هذه المحطة. انجح لتحصل على التاج والمكافأة.',jGateEarly:'تعرف هذه الكلمات؟ اجتز البوابة الآن لتتخطّى المحطة.',
  jGateGo:'ادخل البوابة',jGatePass:'عبرت البوابة!',jGateFail:'قريب! راجع الكلمات وحاول مجددًا.',jNeed:'تحتاج {n}% للعبور',jYouAreHere:'أنت هنا',jUnits:'دروس',jMastery:'متوسط الإتقان',jOpen:'افتح',jReward:'مكافأة البوابة'});
Object.assign(T.en,{jChapter:'Stop',jGate:'Gate test',jGateD:'A short test on this stop’s words. Pass it to earn the crown and the reward.',jGateEarly:'Already know these words? Pass the gate now to skip this stop.',
  jGateGo:'Enter the gate',jGatePass:'Gate passed!',jGateFail:'So close! Review the words and try again.',jNeed:'You need {n}% to pass',jYouAreHere:'You are here',jUnits:'lessons',jMastery:'Average mastery',jOpen:'Open',jReward:'Gate reward'});

// 30 real places; chapters walk through them in order, level by level
const PLACES=[
 ['长城','Great Wall','سور الصين العظيم','Over 21,000 km of walls built across 2,000 years; the Ming sections are the ones most people visit.','يمتد أكثر من 21 ألف كيلومتر وبُني على مدى ألفي عام، وأشهر أجزائه اليوم من عهد أسرة مينغ.','#8a5a2b'],
 ['故宫','Forbidden City','المدينة المحرّمة','Home of 24 emperors in Beijing, with about 9,000 rooms and yellow roofs only the emperor could use.','قصر 24 إمبراطورًا في بكين، فيه نحو 9 آلاف غرفة، والسقوف الصفراء كانت حكرًا على الإمبراطور.','#9c2a1e'],
 ['西湖','West Lake','البحيرة الغربية','In Hangzhou; poets praised it for a thousand years and Longjing green tea grows on its hills.','في هانغتشو، تغنّى بها الشعراء ألف عام، وعلى تلالها يُزرع شاي لونغجينغ الأخضر.','#2f6f63'],
 ['黄山','Yellow Mountain','جبل هوانغشان','Granite peaks above a sea of clouds; its twisted pines appear in classic Chinese ink painting.','قمم غرانيتية فوق بحر من الغيوم، وصنوبره الملتوي حاضر في لوحات الحبر الصينية.','#4b5a6b'],
 ['兵马俑','Terracotta Army','جيش الطين','More than 8,000 clay soldiers guarding the first emperor’s tomb near Xi’an — no two faces alike.','أكثر من 8 آلاف جندي من الطين يحرسون قبر أول إمبراطور قرب شيآن، ولا يتشابه وجهان.','#8b5e3c'],
 ['西安','Xi’an','شيآن','Start of the Silk Road, where caravans left for Central Asia and Arabia; its Great Mosque dates to 742.','بداية طريق الحرير نحو آسيا الوسطى وجزيرة العرب، وجامعها الكبير يعود إلى عام 742.','#a0522d'],
 ['泉州','Quanzhou','تشيوانتشو','The Arab merchants’ “Zaitun”; Ibn Battuta landed here and called it one of the greatest ports in the world.','«الزيتون» عند التجار العرب؛ نزل فيها ابن بطوطة ووصفها بأنها من أعظم موانئ العالم.','#1f5f7a'],
 ['桂林','Guilin','قويلين','Karst hills along the Li River, so famous that they are printed on the 20-yuan note.','تلال كارستية على نهر لي، شهيرة لدرجة أنها مطبوعة على ورقة العشرين يوانًا.','#2e7d5b'],
 ['上海','Shanghai','شنغهاي','China’s biggest city; the Bund’s old banks face the towers of Pudong across the river.','أكبر مدن الصين؛ مباني «البوند» القديمة تقابل أبراج بودونغ على الضفة الأخرى.','#3a4a8a'],
 ['成都','Chengdu','تشنغدو','Home of the giant panda research base, spicy hotpot and slow afternoons in teahouses.','موطن مركز أبحاث الباندا، والقدر الحار، وأمسيات بيوت الشاي الهادئة.','#3f7a3a'],
 ['丽江','Lijiang','ليجيانغ','An old town of canals and wooden houses of the Naxi people, who still write with pictographs.','بلدة قديمة من القنوات والبيوت الخشبية لشعب ناشي الذي ما زال يكتب بالرموز التصويرية.','#7a5a2e'],
 ['布达拉宫','Potala Palace','قصر بوتالا','Rises 3,700 m above sea level in Lhasa, with more than 1,000 rooms climbing the hill.','يرتفع 3700 متر عن سطح البحر في لاسا، وفيه أكثر من ألف غرفة تتسلّق التلة.','#8a2f2f'],
 ['敦煌','Dunhuang','دونهوانغ','Desert oasis of the Silk Road; the Mogao Caves hold 1,000 years of Buddhist paintings.','واحة صحراوية على طريق الحرير، وكهوف موقاو فيها رسوم عمرها ألف عام.','#b0782f'],
 ['喀什','Kashgar','كاشغر','A trading crossroads for 2,000 years; its Sunday bazaar still draws traders from across Central Asia.','ملتقى تجاري منذ ألفي عام، وسوق الأحد فيه ما زال يجمع التجار من آسيا الوسطى.','#a3622e'],
 ['苏州','Suzhou','سوتشو','City of classical gardens and canals; “Heaven above, Suzhou and Hangzhou below.”','مدينة الحدائق الكلاسيكية والقنوات: «في السماء جنة، وعلى الأرض سوتشو وهانغتشو».','#3e6e5a'],
 ['少林寺','Shaolin Temple','معبد شاولين','Birthplace of Chan Buddhism and Shaolin kung fu, on Mount Song in Henan.','مهد بوذية تشان وفنون شاولين القتالية، على جبل سونغ في خنان.','#7a4a22'],
 ['张家界','Zhangjiajie','تشانغجياجيه','Sandstone pillars over 200 m tall rising from the forest, often wrapped in mist.','أعمدة من الحجر الرملي يزيد ارتفاعها على 200 متر تخرج من الغابة وسط الضباب.','#3c6b47'],
 ['香港','Hong Kong','هونغ كونغ','A harbour city of 7 million where Cantonese, English and Mandarin meet.','مدينة ميناء يسكنها 7 ملايين، تلتقي فيها الكانتونية والإنجليزية والماندرين.','#2c3e78'],
 ['哈尔滨','Harbin','هاربين','Winters reach −30 °C; its Ice and Snow Festival carves whole castles from river ice.','تصل حرارة شتائها إلى 30 تحت الصفر، ومهرجان الجليد ينحت قلاعًا كاملة من جليد النهر.','#2f5d8a'],
 ['洛阳','Luoyang','لوويانغ','Capital of 13 dynasties, famous for peonies and the Longmen cliff carvings.','عاصمة 13 أسرة حاكمة، تشتهر بزهور الفاوانيا ومنحوتات لونغمن الصخرية.','#8a3a5a'],
 ['杭州','Hangzhou','هانغتشو','Marco Polo called it the finest city in the world; today it is a centre of tech companies.','وصفها ماركو بولو بأنها أجمل مدن العالم، واليوم هي مركز لشركات التقنية.','#2f6f6f'],
 ['九寨沟','Jiuzhaigou','جيوتشايقو','Turquoise lakes and waterfalls coloured by minerals, in the mountains of Sichuan.','بحيرات فيروزية وشلالات تلوّنها المعادن في جبال سيتشوان.','#1f7a7a'],
 ['南京','Nanjing','نانجينغ','“Southern capital”, with one of the longest city walls ever built still standing.','«العاصمة الجنوبية»، وفيها من أطول أسوار المدن الباقية في العالم.','#5a4a7a'],
 ['大理','Dali','دالي','Bai people’s old town between Erhai Lake and the Cangshan mountains.','بلدة شعب باي القديمة بين بحيرة إرهاي وجبال تسانغشان.','#4a6a8a'],
 ['长江三峡','Three Gorges','الممرات الثلاثة','Cliffs along the Yangtze, Asia’s longest river, now beside the world’s largest dam.','منحدرات على نهر اليانغتسي أطول أنهار آسيا، بجوار أكبر سد في العالم.','#3d5a4a'],
 ['曲阜','Qufu','تشوفو','Hometown of Confucius; his family lived here for more than 2,000 years.','مسقط رأس كونفوشيوس، وعاشت عائلته فيها أكثر من ألفي عام.','#7a5530'],
 ['平遥','Pingyao','بينغياو','A walled Ming-dynasty town where China’s first banks were founded.','مدينة مسوّرة من عهد مينغ، وفيها تأسست أولى مصارف الصين.','#8a6a3a'],
 ['青岛','Qingdao','تشينغداو','Seaside city of red roofs and beaches on the Yellow Sea.','مدينة ساحلية ذات أسطح حمراء وشواطئ على البحر الأصفر.','#2f5a7a'],
 ['深圳','Shenzhen','شنتشن','A fishing village in 1980, now a city of 17 million and a world centre for electronics.','قرية صيد عام 1980، واليوم مدينة 17 مليونًا ومركز عالمي للإلكترونيات.','#3a3a8a'],
 ['北京','Beijing','بكين','Capital for over 800 years; the 2008 Summer and 2022 Winter Olympics were both held here.','عاصمة منذ أكثر من 800 عام، واستضافت أولمبياد صيف 2008 وشتاء 2022.','#9a2a2a'],
];
const CH_SIZE={1:4,2:5,3:6,4:8,5:10,6:10};
const GATE_PASS=80;
function chaptersOf(L){ const u=unitsOf(L), n=CH_SIZE[L], out=[]; let base=0; for(let l=1;l<L;l++) base+=Math.ceil(unitsOf(l).length/CH_SIZE[l]);
  for(let i=0,c=0;i<u.length;i+=n,c++) out.push({c,from:i,to:Math.min(u.length,i+n),place:PLACES[(base+c)%PLACES.length]}); return out; }
const gateDone=(L,c)=>!!(S.gates&&S.gates[L+'-'+c]);
function unitMastery(ws){ if(!ws.length) return 0; return ws.reduce((a,w)=>a+mastery(w.id),0)/ws.length; }
const placeName=p=>isAr()?p[2]:p[1], placeFact=p=>isAr()?p[4]:p[3];

function journeyHTML(L){ const u=unitsOf(L), cu=curUnit(L); let k=0;
  return `<div class="journey" id="jr">${chaptersOf(L).map(ch=>{ const p=ch.place, done=Array.from({length:ch.to-ch.from},(_,j)=>unitDone(L,ch.from+j)).filter(Boolean).length, n=ch.to-ch.from;
    const reach=ch.from<=cu||done>0, g=gateDone(L,ch.c);
    const nodes=Array.from({length:n},(_,j)=>{ const i=ch.from+j, ws=u[i], d=unitDone(L,i), free=unitFree(L,i), open=free&&(d||i<=cu), m=unitMastery(ws), side=['0','-1','-1.4','-1','0','1','1.4','1'][(k++)%8];
      return `<div class="jstep" style="--x:${side}"><button class="jnode ${d?'done':open?(i===cu?'cur':''):'locked'}" data-i="${i}" ${open?'':'data-locked="1"'} style="--m:${(m/5*360).toFixed(0)}deg" aria-label="${t('unit')} ${i+1}">
        <span class="jring"></span><span class="jface">${free?esc(ws[0].h[0]):'🔒'}</span></button>
        ${i===cu&&open?`<div class="jhere"><div class="bao-hop">${bao('happy',46)}</div><span>${t('jYouAreHere')}</span></div>`:''}
        <small><span class="num">${i+1}</span>${d&&m>=.5?` ${crownsHTML(Math.round(m),8)}`:''}</small></div>`; }).join('');
    return `<section class="jchap ${done===n?'clear':''}" style="--pc:${p[5]}">
      <header class="jbanner"><div class="jart" aria-hidden="true"><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path d="M0 90 L0 62 Q40 30 70 52 T140 40 T210 56 T270 34 T320 50 L320 90Z" fill="rgba(0,0,0,.28)"/><path d="M0 90 L0 74 Q60 52 110 70 T220 66 T320 72 L320 90Z" fill="rgba(0,0,0,.4)"/></svg><span class="brush">${esc(p[0])}</span></div>
        <div class="jtxt"><div class="eyebrow">${g?'👑 ':''}${t('jChapter')} <span class="num">${ch.c+1}</span> · <span class="num">${done}/${n}</span> ${t('jUnits')}</div><h3>${esc(placeName(p))}</h3><p>${esc(placeFact(p))}</p></div></header>
      <div class="jpath">${nodes}
        <div class="jstep gate"><button class="jgate ${g?'done':reach?'':'locked'}" data-c="${ch.c}" aria-label="${t('jGate')}"><span>关</span></button><small>${g?'👑 ':''}${t('jGate')}</small></div></div></section>`; }).join('')}</div>`; }

/* trail: one smooth curve through every node centre, drawn behind them; the walked part glows gold */
function drawTrail(m){ const jr=$('#jr',m); if(!jr) return; $$('.jpath',jr).forEach(path=>{ path.querySelector('svg.jtrail')?.remove();
  const box=path.getBoundingClientRect(); const pts=$$('.jnode,.jgate',path).map(b=>{ const r=b.getBoundingClientRect(); return [r.left+r.width/2-box.left, r.top+r.height/2-box.top, b.classList.contains('done')]; });
  if(pts.length<2) return; let d=`M${pts[0][0]} ${pts[0][1]}`, dd='', last=-1;
  for(let i=1;i<pts.length;i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i], my=(y0+y1)/2; d+=` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`; }
  pts.forEach((p,i)=>{ if(p[2]) last=i; }); if(last>0){ dd=`M${pts[0][0]} ${pts[0][1]}`; for(let i=1;i<=Math.min(last+1,pts.length-1);i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i], my=(y0+y1)/2; dd+=` C${x0} ${my} ${x1} ${my} ${x1} ${y1}`; } }
  const svg=`<svg class="jtrail" width="${box.width}" height="${box.height}" aria-hidden="true"><path d="${d}" class="t0"/>${dd?`<path d="${dd}" class="t1"/>`:''}</svg>`;
  path.insertAdjacentHTML('afterbegin',svg); }); }

function bindJourney(m,L){ $$('.jnode',m).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(!unitFree(L,i)) return paywall(); if(b.dataset.locked){ SFX.bad(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; } SFX.tap(); go('lesson',{l:L,i}); });
  $$('.jgate',m).forEach(b=>b.onclick=()=>{ const ch=chaptersOf(L)[+b.dataset.c]; if(!unitFree(L,ch.from)) return paywall(); if(b.classList.contains('locked')){ SFX.bad(); return; } gateSheet(L,ch); });
  const draw=()=>drawTrail(m); requestAnimationFrame(()=>requestAnimationFrame(draw)); setTimeout(draw,400);
  const ro=()=>draw(); addEventListener('resize',ro); const prev=cleanup; cleanup=()=>{ removeEventListener('resize',ro); prev&&prev(); };
  const cur=$('.jnode.cur',m); if(cur) setTimeout(()=>{ try{ cur.scrollIntoView({block:'center'}); }catch(e){} },60); }

function gateSheet(L,ch){ const p=ch.place, ws=unitsOf(L).slice(ch.from,ch.to).flat(), early=!Array.from({length:ch.to-ch.from},(_,j)=>unitDone(L,ch.from+j)).every(Boolean);
  sheet(`<div class="col" style="align-items:center;text-align:center;gap:10px"><div class="jgate big done" aria-hidden="true"><span>关</span></div>
    <div class="eyebrow">${esc(placeName(p))} · ${esc(p[0])}</div><h2>${t('jGate')}</h2><p style="margin:0">${early?t('jGateEarly'):t('jGateD')}</p>
    <div class="row" style="gap:8px;justify-content:center"><span class="chip"><span class="num">12</span> ${t('ofWords')}</span><span class="chip">${t('jNeed').replace('{n}',GATE_PASS)}</span><span class="chip">${coinHTML} <span class="num">50</span></span></div>
    <div class="sub">${t('jMastery')}: ${crownsHTML(Math.round(unitMastery(ws)),12)}</div>
    <button class="btn block" id="gg">${t('jGateGo')} →</button></div>`,s=>{ $('#gg',s).onclick=()=>{ closeSheet(); runGate(L,ch,ws); }; }); }

function runGate(L,ch,ws){ route={name:'lesson'}; render(); const mm=$('main'); const set=pick(ws,12);
  // a gate tests recall: start every word at "familiar" level kinds regardless of mastery
  const qs=set.map(w=>{ for(const k of shuffle(['gap','slisten','pinyin','build','han','mean'])){ if(['han','mean'].includes(k)) return {k,w,opts:shuffle([w,...pick((byLevel[L]||W).filter(x=>x.h!==w.h&&meaning(x)!==meaning(w)),3)])}; if(canQ(k,w)){ const q=makeQ(k,w,byLevel[L]); if(q) return q; } } return {k:'mean',w,opts:shuffle([w,...pick(byLevel[L].filter(x=>x.h!==w.h),3)])}; });
  const total=qs.length;
  runQuiz(mm,{questions:qs,back:()=>go('level',L),onDone:()=>{},gate:{place:ch.place,L,onFinish:(correctFirst)=>{
    const pct=Math.round(correctFirst/total*100), pass=pct>=GATE_PASS; track('gate',{level:L,ch:ch.c,pct,pass});
    if(pass){ S.gates=S.gates||{}; S.gates[L+'-'+ch.c]=1; for(let i=ch.from;i<ch.to;i++) S.units[L+'-'+i]=1; save(); }
    return {pass,pct}; }}}); }
