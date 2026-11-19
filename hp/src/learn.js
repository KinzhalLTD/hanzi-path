/* ===== Learning engine v2: sentence exercises, contextual pinyin, mastery, adaptive lessons, placement test =====
   Exercise kinds added to runQuiz: build (order the words), gap (fill the blank), slisten (hear a sentence, pick its
   meaning), pinyin (type it with tones), tonepair (hear a 2-syllable word, pick its tone pattern). */
Object.assign(T.ar,{qBuild:'رتّب الكلمات لتكوّن الجملة',qGap:'أكمل الفراغ',qSListen:'استمع للجملة: ماذا تعني؟',qPinyin:'اكتب البينيين مع النغمات',qTonePair:'استمع: ما نغمات الكلمة؟',
  pyHelp:'اكتب رقم النغمة بعد كل مقطع: ni3hao3 ← nǐhǎo',pyAlmost:'الحروف صحيحة، راجع النغمات',slow:'ببطء',clearAll:'مسح',
  mastery:'الإتقان',masteryN:['جديدة','تعرّفت','تتذكّر','تفهم','تتقن','خبير'],lvlUp:'كلمات ارتفع إتقانها',
  plT:'اختبار تحديد المستوى',plSub:'٥ دقائق تقريبًا · نبدأ من مستواك الحقيقي',plIntro:'تعرف بعض الصينية؟ أجب عن أسئلة قصيرة تزداد صعوبة. سنفتح لك المستويات التي تعرفها ونبدأ من حيث يجب أن تبدأ.',
  plStart:'ابدأ الاختبار',plDontKnow:'لا أعرف',plResult:'مستواك المقترح',plApply:'ابدأ من HSK {l}',plKeep:'سأبدأ من البداية',plDone:'تم! فتحنا المستويات التي تعرفها وأضفنا كلماتها للمراجعة الذكية.',
  plCard:'تعرف بعض الصينية؟',plCardSub:'اختبار قصير يحدّد مستواك',plNew:'أنا جديد على الصينية',plKnow:'أعرف بعض الصينية',plAsk:'هل تعرف الصينية من قبل؟',
  sentence:'الجملة',ofWords:'كلمة'});
Object.assign(T.en,{qBuild:'Put the words in order',qGap:'Fill the gap',qSListen:'Listen: what does the sentence mean?',qPinyin:'Type the pinyin with tones',qTonePair:'Listen: which tones?',
  pyHelp:'Type the tone number after each syllable: ni3hao3 → nǐhǎo',pyAlmost:'Right letters, check the tones',slow:'Slow',clearAll:'Clear',
  mastery:'Mastery',masteryN:['New','Seen','Familiar','Known','Strong','Mastered'],lvlUp:'Words that levelled up',
  plT:'Placement test',plSub:'About 5 minutes · start at your real level',plIntro:'Know some Chinese already? Answer short questions that get harder. We unlock the levels you know and start you where you should be.',
  plStart:'Start the test',plDontKnow:'I don’t know',plResult:'Your suggested level',plApply:'Start at HSK {l}',plKeep:'I’ll start from the beginning',plDone:'Done! The levels you know are unlocked and their words added to smart review.',
  plCard:'Know some Chinese?',plCardSub:'A short test finds your level',plNew:'I’m new to Chinese',plKnow:'I know some Chinese',plAsk:'Have you learned Chinese before?',
  sentence:'Sentence',ofWords:'words'});

/* ---------- pinyin: split into syllables and align with the characters of a sentence ---------- */
const PY_SYL=new Set(`a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu fa fan fang fei fen feng fo fou fu da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nun nuo nv nve la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lv lve ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ka kai kan kang kao ke kei ken keng kong kou ku kua kuai kuan kuang kui kun kuo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo ran rang rao re ren reng ri rong rou ru rua ruan rui run ruo za zai zan zang zao ze zei zen zeng zi zong zou zu zuan zui zun zuo ca cai can cang cao ce cen ceng ci cong cou cu cuan cui cun cuo sa sai san sang sao se sen seng si song sou su suan sui sun suo ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun wa wai wan wang wei wen weng wo wu e ei en eng er o ou m n ng hm`.split(' '));
const PY_SOLO=new Set(['m','n','ng','hm']);
const pyPlain=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,m=>m==='\u0308'?m:'').replace(/u\u0308/g,'v').replace(/ü/g,'v').toLowerCase();
function pySplitWord(w){ const o=[...w.normalize('NFC')], p=pyPlain(w); if([...p].length!==o.length) return null; const memo={};
  const go=i=>{ if(i===p.length) return []; if(i in memo) return memo[i];
    for(let n=Math.min(6,p.length-i);n>0;n--){ const s=p.slice(i,i+n); if(!PY_SYL.has(s)||(PY_SOLO.has(s)&&p.length!==n)||(i>0&&/^[aeo]/.test(s))) continue;   // mid-word a/e/o needs an apostrophe
      const r=go(i+n); if(r) return memo[i]=[o.slice(i,i+n).join(''),...r];
      if(p[i+n]==='r'&&s!=='e'){ const r2=go(i+n+1); if(r2) return memo[i]=[o.slice(i,i+n).join(''),'r',...r2]; } }   // erhua: 哪儿 nǎr
    return memo[i]=null; };
  return go(0); }
function pySyllables(py){ const out=[]; for(const w of py.replace(/[^A-Za-zÀ-ɏ\u0300-\u036fü'’\- ]+/g,' ').split(/[\s'’\-]+/).filter(Boolean)){ const r=pySplitWord(w); if(!r) return null; out.push(...r); } return out; }
/** pinyin for each Han character of zh, taken from the sentence's own pinyin (so 银行 háng, 地铁 dì are right); null if they don't line up */
const _alignCache=new Map();
function alignPy(zh,py){ const k=zh+'|'+py; if(_alignCache.has(k)) return _alignCache.get(k);
  // Latin/digit tokens written the same in both lines (C35, Y型, PPR管) carry no syllables: drop them from the pinyin
  const lat=new Set((zh.match(/[A-Za-z0-9]+/g)||[]).map(x=>x.toLowerCase())); const py2=py?py.split(/(\s+)/).filter(w=>!lat.has(w.replace(/[^A-Za-z0-9]/g,'').toLowerCase())||/[\u0300-\u036fāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(w)).join(''):'';
  const hs=[...zh].filter(c=>isHan(c)||c==='〇'), s=py2?pySyllables(py2):null; const r=s&&s.length===hs.length?s:null; _alignCache.set(k,r); return r; }

/* tone numbers <-> marks */
const TONE_MARK={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',v:'ǖǘǚǜ'};
function sylTone(s){ const d=s.normalize('NFD'); if(/\u0304/.test(d)) return 1; if(/\u0301/.test(d)) return 2; if(/\u030c/.test(d)) return 3; if(/\u0300/.test(d)) return 4; return 5; }
function markSyl(base,tone){ base=base.replace(/u:|ü/g,'v'); if(!tone||tone===5) return base.replace(/v/g,'ü');
  let i=base.search(/[ae]/); if(i<0) i=base.indexOf('ou'); if(i<0){ const m=[...base].map((c,j)=>/[aeiouv]/.test(c)?j:-1).filter(j=>j>=0); i=m.length?m[m.length-1]:-1; }
  if(i<0) return base; const c=base[i]; return (base.slice(0,i)+TONE_MARK[c][tone-1]+base.slice(i+1)).replace(/v/g,'ü'); }
const numToMarks=s=>s.replace(/([a-zü:v]+)([1-5])/gi,(_,b,n)=>markSyl(b.toLowerCase(),+n));
/** normalise any pinyin answer to ["ni3","hao3"]; tone 5 = neutral; returns null if it can't be read */
function pyNorm(input){ let s=input.trim().toLowerCase().replace(/u:/g,'v').replace(/ü/g,'v'); if(!s) return null;
  if(/[1-5]/.test(s)){ const parts=s.replace(/[^a-z1-5]/g,'').match(/[a-z]+[1-5]?/g)||[]; const out=[];
    for(const p of parts){ const tone=/[1-5]$/.test(p)?+p.slice(-1):5, base=p.replace(/[1-5]$/,''); const sp=pySplitWord(base); if(!sp) return null;
      sp.forEach((x,j)=>out.push(pyPlain(x)+(j===sp.length-1?tone:5))); } return out; }
  const syl=pySyllables(s.replace(/v/g,'ü')); return syl?syl.map(x=>pyPlain(x)+sylTone(x)):null; }

/* analyser with contextual pinyin: replaces the lexicon reading when the sentence pinyin lines up */
function analyseHTML2(zh,py){ const al=alignPy(zh,py); if(!al) return analyseHTML(zh); let k=0;
  return `<div class="seg-sent">${segment(zh).map(x=>{ const n=[...x.t].filter(c=>isHan(c)||c==='〇').length; const p=al.slice(k,k+n).join(''); k+=n;
    if(x.w) return `<button class="tok" data-w="${x.w.id}"><span class="py">${esc(p||x.w.p)}</span><span class="han">${esc(x.t)}</span></button>`;
    if(n) return `<span class="tok plain"><span class="py">${esc(p)||'&nbsp;'}</span><span class="han">${esc(x.t)}</span></span>`;
    return `<span class="punct han">${esc(x.t)}</span>`; }).join('')}</div>`; }

/* ---------- mastery 0–5 from the spaced-repetition box ---------- */
const MASTERY_OF_BOX=[0,1,2,3,3,4,4,5];
const mastery=id=>{ const r=S.srs[id]; return r?MASTERY_OF_BOX[Math.min(7,r.b)]:0; };
function crownsHTML(n,size=13){ return `<span class="crowns" aria-label="${t('mastery')} ${n}/5" style="--cs:${size}px">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`; }

/* ---------- question builders ---------- */
const exSentence=w=>w.ex&&w.ex.zh?w.ex:null;
const exMeaning=ex=>isAr()?ex.ar:(ex.en||ex.ar);
function buildTiles(ex){ const toks=segment(ex.zh).filter(x=>[...x.t].some(c=>isHan(c))).map(x=>x.t);
  return toks.length>=3&&toks.length<=8&&[...ex.zh].length<=20?toks:null; }
function canQ(k,w){ const ex=exSentence(w);
  if(k==='build') return ex&&buildTiles(ex);
  if(k==='gap') return ex&&ex.zh.split(w.h).length===2&&[...w.h].length<=4;
  if(k==='slisten') return !!ex&&!!exMeaning(ex);
  if(k==='pinyin') return [...w.h].length<=3&&!!pyNorm(w.p);
  if(k==='tonepair'){ const s=pySyllables(w.p); return [...w.h].length===2&&s&&s.length===2&&s.every(x=>sylTone(x)<5); }
  return true; }
function gapOptions(w,pool){ const n=[...w.h].length, zh=w.ex.zh;
  let c=pool.filter(x=>x.h!==w.h&&[...x.h].length===n&&!zh.includes(x.h)&&meaning(x)!==meaning(w));
  const ok=x=>x.h!==w.h&&!zh.includes(x.h)&&meaning(x)!==meaning(w);
  if(c.length<3) c=W.filter(x=>x.l<=Math.max(2,w.l)&&[...x.h].length===n&&ok(x));
  if(c.length<3) c=W.filter(x=>[...x.h].length===n&&ok(x));
  if(c.length<3) c=W.filter(x=>Math.abs([...x.h].length-n)<=1&&ok(x));
  return shuffle([w,...pick(c,3)]); }
function slistenOptions(w,pool){ const mine=exMeaning(w.ex); const seen=new Set([mine]);
  const c=shuffle(pool.concat(byLevel[w.l]||[])).filter(x=>x.ex&&x.id!==w.id).map(x=>exMeaning(x.ex)).filter(s=>s&&!seen.has(s)&&seen.add(s)).slice(0,3);
  return shuffle([mine,...c]); }
const TONE_GLYPH=['','ˉ','ˊ','ˇ','ˋ'];
function tonePairOptions(w){ const s=pySyllables(w.p).map(sylTone), key=s.join('-'); const all=new Set([key]);
  while(all.size<4){ all.add(`${1+(Math.random()*4|0)}-${1+(Math.random()*4|0)}`); } return shuffle([...all]); }
function makeQ(k,w,pool){
  if(k==='gap') return {k,w,opts:gapOptions(w,pool)};
  if(k==='slisten') return {k,w,opts:slistenOptions(w,pool)};
  if(k==='tonepair') return {k,w,opts:tonePairOptions(w)};
  if(k==='build'){ const toks=buildTiles(w.ex); const extra=pick(pool.filter(x=>[...x.h].length<=2&&!toks.includes(x.h)&&!w.ex.zh.includes(x.h)),toks.length>=6?1:2).map(x=>x.h); return {k,w,toks,tiles:shuffle([...toks,...extra])}; }
  if(k==='pinyin') return {k,w};
  return null; }

/* adaptive mix: recognition for new words, recall and sentences as mastery grows; weak older words woven in */
const KINDS_BY_M=[['mean','han','listen','gap'],['mean','han','listen','gap','tone'],['gap','slisten','tone','tonepair','han'],['build','gap','slisten','pinyin','tonepair'],['build','pinyin','slisten','tonepair','write'],['build','pinyin','write','slisten']];
function lessonPlan(words,pool,{review=false}={}){ const qs=[]; const others=w=>pick(pool.filter(x=>x.id!==w.id&&x.h!==w.h&&meaning(x)!==meaning(w)),3);
  const legacy=(k,w)=>{ if(k==='tone'&&!hasTone(w.p)) k='mean'; return {k,w,opts:k==='tone'?toneOptions(w.p):k==='write'?[]:shuffle([w,...others(w)])}; };
  const one=(w,prefer)=>{ const m=mastery(w.id); let kinds=shuffle(prefer||KINDS_BY_M[m]);
    for(const k of kinds){ if(k==='write'&&!([...w.h].length<=2&&[...w.h].every(c=>typeof canWrite==='function'&&canWrite(c)))) continue; if(!canQ(k,w)) continue;
      const q=['mean','han','listen','tone','write'].includes(k)?legacy(k,w):makeQ(k,w,pool); if(q) return q; }
    return legacy('mean',w); };
  words.forEach(w=>qs.push(one(w)));
  if(!review){ // every new lesson practises real sentences: at least one gap, one listening sentence and one build
    const need=[['gap',['gap']],['slisten',['slisten']],['build',['build']]];
    for(const [k,pref] of need){ if(qs.some(q=>q.k===k)) continue; const w=shuffle(words).find(x=>canQ(k,x)); if(w) qs.push(one(w,pref)); }
    // weave in up to 3 weak or due words from earlier lessons (spacing + interleaving)
    const ids=new Set(words.map(w=>w.id)); const weak=Object.entries(S.wrong||{}).sort((a,b)=>b[1]-a[1]).map(([id])=>byId[+id]).filter(w=>w&&!ids.has(w.id));
    const due=dueIds().map(id=>byId[id]).filter(w=>w&&!ids.has(w.id)); const extra=[...new Set([...weak.slice(0,6),...shuffle(due).slice(0,4)])].slice(0,3);
    extra.forEach(w=>{ const q=one(w,['gap','pinyin','slisten','han']); q.rev=1; qs.push(q); });
  }
  const out=shuffle(qs); // easy first: recognition before production
  const rank={mean:0,han:0,listen:1,tone:1,gap:2,slisten:2,tonepair:2,pinyin:3,build:3,write:3};
  out.sort((a,b)=>(rank[a.k]??1)-(rank[b.k]??1)+(Math.random()-.5)*1.2);
  if(words.length>=4) out.splice(Math.min(3,out.length),0,{k:'pairs',ws:pick(words,4)});
  return out; }

/* ---------- renderers (called from runQuiz.ask with its context) ---------- */
function sentenceReveal(w){ const ex=w.ex; return `<div class="paper excard col" style="gap:4px;padding:14px">${analyseHTML2(ex.zh,ex.py)}<div class="sub" style="color:var(--ink2)">${esc(ex.py)}</div><div>${esc(exMeaning(ex))}</div></div>`; }
const LEARN_Q={
  gap(q,C){ const w=q.w, ex=w.ex, parts=ex.zh.split(w.h);
    C.m.innerHTML=`${C.head()}<div class="prompt rise" style="padding-top:10px"><div class="sub">✏️ ${t('qGap')}</div>
      <div class="gapline han" id="gl" dir="ltr" lang="zh">${esc(parts[0])}<span class="blank" id="bl">${'＿'.repeat([...w.h].length)}</span>${esc(parts[1])}</div>
      <div class="meaning" style="font-size:16px">${esc(exMeaning(ex))}</div><button class="speak sm" id="sp" aria-label="🔊">🔊</button></div>
      <div class="opts">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han" style="font-size:24px">${esc(o.h)}</span></button>`).join('')}</div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    C.bindX(); $('#sp',C.m).onclick=()=>speak(ex.zh); let sel=null;
    $$('.opt',C.m).forEach(b=>b.onclick=()=>{ SFX.tap(); $$('.opt',C.m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel=+b.dataset.j; $('#bl',C.m).textContent=q.opts[sel].h; $('#bl',C.m).classList.add('on'); $('#ck',C.m).disabled=false; });
    $('#ck',C.m).onclick=()=>{ if(sel===null) return; const ok=q.opts[sel].id===w.id; const rj=q.opts.findIndex(o=>o.id===w.id);
      $$('.opt',C.m).forEach((b,j)=>{ b.disabled=true; if(j===rj) b.classList.add('right'); else if(j===sel) b.classList.add('wrong'); });
      $('#bl',C.m).textContent=w.h; $('#bl',C.m).classList.add(ok?'right':'fix'); speak(ex.zh); C.verdict(ok,w,q,sentenceReveal(w)); }; },
  slisten(q,C){ const w=q.w, ex=w.ex, right=exMeaning(ex);
    C.m.innerHTML=`${C.head()}<div class="prompt rise" style="padding-top:12px"><div class="sub">🎧 ${t('qSListen')}</div>
      <div class="row" style="gap:12px;justify-content:center"><button class="speak xl" id="sp" aria-label="🔊">🔊</button><button class="speak" id="sl" aria-label="${t('slow')}">🐢</button></div></div>
      <div class="opts one">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}" style="font-size:15.5px;min-height:58px">${esc(o)}</button>`).join('')}</div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    C.bindX(); const play=r=>speak(ex.zh,r); $('#sp',C.m).onclick=()=>play(); $('#sl',C.m).onclick=()=>play(.55); setTimeout(()=>play(),250); let sel=null;
    $$('.opt',C.m).forEach(b=>b.onclick=()=>{ SFX.tap(); $$('.opt',C.m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel=+b.dataset.j; $('#ck',C.m).disabled=false; });
    $('#ck',C.m).onclick=()=>{ if(sel===null) return; const ok=q.opts[sel]===right, rj=q.opts.indexOf(right);
      $$('.opt',C.m).forEach((b,j)=>{ b.disabled=true; if(j===rj) b.classList.add('right'); else if(j===sel) b.classList.add('wrong'); }); C.verdict(ok,w,q,sentenceReveal(w)); }; },
  build(q,C){ const w=q.w, ex=w.ex; let ans=[];
    C.m.innerHTML=`${C.head()}<div class="prompt rise" style="padding-top:8px"><div class="sub">🧩 ${t('qBuild')}</div><div class="meaning" style="font-size:17px">${esc(exMeaning(ex))}</div></div>
      <div class="bline" id="bline" dir="ltr" lang="zh" aria-live="polite"></div><div class="bbank" id="bbank" dir="ltr" lang="zh"></div>
      <div class="row" style="justify-content:center"><button class="btn ghost sm" id="bclr">↺ ${t('clearAll')}</button></div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    C.bindX(); const tiles=q.tiles.map((h,j)=>({h,j}));
    const draw=()=>{ $('#bline',C.m).innerHTML=ans.map((x,k)=>`<button class="btile on" data-k="${k}"><span class="han">${esc(x.h)}</span></button>`).join('')||`<span class="sub">${t('sentence')} · <span class="num">${q.toks.length}</span> ${t('ofWords')}</span>`;
      $('#bbank',C.m).innerHTML=tiles.map(x=>`<button class="btile" data-j="${x.j}" ${ans.includes(x)?'disabled aria-hidden="true"':''}><span class="han">${esc(x.h)}</span></button>`).join('');
      $('#ck',C.m).disabled=ans.length<2;
      $$('#bbank .btile',C.m).forEach(b=>b.onclick=()=>{ const x=tiles[+b.dataset.j]; if(ans.includes(x)) return; ans.push(x); SFX.tap(); speak(x.h); draw(); });
      $$('#bline .btile',C.m).forEach(b=>b.onclick=()=>{ ans.splice(+b.dataset.k,1); SFX.tap(); draw(); }); };
    draw(); $('#bclr',C.m).onclick=()=>{ ans=[]; draw(); };
    $('#ck',C.m).onclick=()=>{ const ok=ans.map(x=>x.h).join('')===q.toks.join(''); $$('.btile',C.m).forEach(b=>b.disabled=true); $('#bline',C.m).classList.add(ok?'right':'wrong'); speak(ex.zh); C.verdict(ok,w,q,sentenceReveal(w)); }; },
  pinyin(q,C){ const w=q.w, target=pyNorm(w.p);
    C.m.innerHTML=`${C.head()}<div class="prompt rise" style="padding-top:8px"><div class="sub">⌨️ ${t('qPinyin')}</div><div class="big han">${esc(w.h)}</div><div class="meaning" style="font-size:16px">${mean(w)}</div></div>
      <div class="col" style="gap:8px"><input class="search pyin" id="pin" dir="ltr" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text" placeholder="pin1yin1">
      <div class="pyprev" id="prev" dir="ltr">&nbsp;</div>
      <div class="tonekeys" dir="ltr">${[1,2,3,4,5].map(n=>`<button class="tk" data-n="${n}" aria-label="tone ${n}"><b>${n}</b><span>${['ā','á','ǎ','à','a'][n-1]}</span></button>`).join('')}<button class="tk" data-n="v" aria-label="ü"><b>ü</b><span>v</span></button></div>
      <div class="sub" style="text-align:center">${t('pyHelp')}</div></div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    C.bindX(); const inp=$('#pin',C.m), prev=()=>{ $('#prev',C.m).textContent=numToMarks(inp.value.replace(/v/g,'ü'))||'\u00a0'; $('#ck',C.m).disabled=!inp.value.trim(); };
    inp.oninput=prev; setTimeout(()=>{ try{inp.focus();}catch(e){} },350);
    $$('.tk',C.m).forEach(b=>b.onclick=()=>{ inp.value+=b.dataset.n; prev(); SFX.tap(); try{inp.focus();}catch(e){} });
    inp.onkeydown=e=>{ if(e.key==='Enter'&&!$('#ck',C.m).disabled) $('#ck',C.m).click(); };
    $('#ck',C.m).onclick=()=>{ const got=pyNorm(inp.value); const ok=!!got&&got.join(' ')===target.join(' ');
      const close=!ok&&got&&got.map(x=>x.replace(/\d/,'')).join(' ')===target.map(x=>x.replace(/\d/,'')).join(' ');
      inp.disabled=true; inp.classList.add(ok?'right':'wrong'); speak(w.h); $$('.tk',C.m).forEach(b=>b.disabled=true);
      C.verdict(ok,w,q,`<div class="row" style="gap:10px;justify-content:center"><span class="han" style="font-size:28px">${esc(w.h)}</span><span class="py" style="font-size:22px">${esc(w.p)}</span></div>${close?`<div class="sub" style="text-align:center">🎵 ${t('pyAlmost')}</div>`:''}`); }; },
  tonepair(q,C){ const w=q.w, key=pySyllables(w.p).map(sylTone).join('-');
    const lab=k=>k.split('-').map(n=>`<span class="tglyph t${n}">${TONE_GLYPH[n]}</span><span class="num">${n}</span>`).join('<i class="tsep">+</i>');
    C.m.innerHTML=`${C.head()}<div class="prompt rise" style="padding-top:12px"><div class="sub">🎵 ${t('qTonePair')}</div>
      <div class="row" style="gap:12px;justify-content:center"><button class="speak xl" id="sp" aria-label="🔊">🔊</button><button class="speak" id="sl" aria-label="${t('slow')}">🐢</button></div></div>
      <div class="opts">${q.opts.map((o,j)=>`<button class="opt tpair" data-j="${j}" dir="ltr">${lab(o)}</button>`).join('')}</div>
      <div class="grow"></div><button class="btn block" id="ck" disabled>${t('check')}</button>`;
    C.bindX(); $('#sp',C.m).onclick=()=>speak(w.h); $('#sl',C.m).onclick=()=>speak(w.h,.5); setTimeout(()=>speak(w.h),250); let sel=null;
    $$('.opt',C.m).forEach(b=>b.onclick=()=>{ SFX.tap(); $$('.opt',C.m).forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); sel=+b.dataset.j; $('#ck',C.m).disabled=false; });
    $('#ck',C.m).onclick=()=>{ if(sel===null) return; const ok=q.opts[sel]===key, rj=q.opts.indexOf(key);
      $$('.opt',C.m).forEach((b,j)=>{ b.disabled=true; if(j===rj) b.classList.add('right'); else if(j===sel) b.classList.add('wrong'); });
      C.verdict(ok,w,q,`<div class="row" style="gap:10px;justify-content:center"><span class="han" style="font-size:28px">${esc(w.h)}</span><span class="py" style="font-size:22px">${esc(w.p)}</span><span class="sub">${mean(w)}</span></div>`); }; },
};

/* ---------- placement test: adaptive staircase over HSK 1–6 ---------- */
function placementQs(l){ const pool=(byLevel[l]||[]).filter(w=>w.ex); const ws=pick(pool,4);
  return ws.map((w,j)=>{ const k=j%2?'gap':(j%4===0?'mean':'han'); if(k==='gap'&&canQ('gap',w)) return {k,w,opts:gapOptions(w,pool)};
    const opts=shuffle([w,...pick(pool.filter(x=>x.h!==w.h&&meaning(x)!==meaning(w)),3)]); return {k:k==='gap'?'mean':k,w,opts}; }); }
SCREENS.placement=m=>{
  m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="grow"></div></div>
    <div class="result rise"><div class="bao-hop">${bao('think',110)}</div><span class="brush" style="font-size:44px;color:var(--gold)">定级</span><h1>${t('plT')}</h1><div class="sub">${t('plSub')}</div>
    <p style="margin:0">${t('plIntro')}</p><div class="row" style="justify-content:center;gap:6px">${[1,2,3,4,5,6].map(l=>`<span class="chip">HSK ${l}</span>`).join('')}</div>
    <button class="btn block" id="go">${t('plStart')} →</button></div>`;
  $('#qx',m).onclick=()=>go('home');
  $('#go',m).onclick=()=>{ track('placement_start'); let lvl=1, best=0, qs=placementQs(1), i=0, right=0; const total=6*4;
    const run=()=>{ const q=qs[i], w=q.w; let prompt='', opts='';
      if(q.k==='mean'){ prompt=`<div class="sub">${t('whatMeans')}</div><div class="big han">${esc(w.h)}</div>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}">${mean(o)}</button>`).join(''); }
      if(q.k==='han'){ prompt=`<div class="sub">${t('pickHan')}</div><div class="meaning">${mean(w)}</div>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); }
      if(q.k==='gap'){ const p=w.ex.zh.split(w.h); prompt=`<div class="sub">${t('qGap')}</div><div class="gapline han" dir="ltr" lang="zh">${esc(p[0])}<span class="blank">${'＿'.repeat([...w.h].length)}</span>${esc(p[1])}</div><div class="meaning" style="font-size:16px">${esc(exMeaning(w.ex))}</div>`; opts=q.opts.map((o,j)=>`<button class="opt" data-j="${j}"><span class="han">${esc(o.h)}</span></button>`).join(''); }
      const done=(lvl-1)*4+i;
      m.innerHTML=`<div class="qhead"><button class="icon-btn" id="qx" aria-label="${t('close')}">✕</button><div class="bar grow"><i style="width:${(done/total*100).toFixed(1)}%"></i></div><span class="chip">HSK ${lvl}</span></div>
        <div class="prompt rise" style="padding-top:12px">${prompt}</div><div class="opts">${opts}</div><div class="grow"></div><button class="btn ghost block" id="dk">${t('plDontKnow')}</button>`;
      $('#qx',m).onclick=()=>go('home');
      const next=ok=>{ if(ok) right++; i++;
        if(i<qs.length) return run();
        if(right>=3){ best=lvl; if(lvl<6){ lvl++; qs=placementQs(lvl); i=0; right=0; return run(); } }
        result(); };
      $$('.opt',m).forEach(b=>b.onclick=()=>{ const ok=q.opts[+b.dataset.j].id===w.id; $$('.opt',m).forEach(x=>x.disabled=true); b.classList.add(ok?'right':'wrong'); SFX[ok?'ok':'tap'](); setTimeout(()=>next(ok),420); });
      $('#dk',m).onclick=()=>next(false); };
    const result=()=>{ const start=Math.min(6,best+1); track('placement_done',{level:start});
      m.innerHTML=`<div class="result rise"><div class="bao-dance">${bao(best?'cool':'happy',120)}</div><div class="eyebrow">${t('plResult')}</div>
        <div class="bigseal" style="font-size:44px">${start}级</div><h1>HSK ${start}</h1>
        <div class="medals" style="justify-content:center">${[1,2,3,4,5,6].map(L=>`<span class="medal ${L<=best?'done':L===start?'on':''}" aria-label="HSK ${L}">${L}</span>`).join('')}</div>
        ${best?`<button class="btn block" id="ap">${t('plApply').replace('{l}',start)} →</button>`:''}<button class="btn ${best?'ghost':''} block" id="kp">${best?t('plKeep'):t('plApply').replace('{l}',1)+' →'}</button></div>`;
      confetti(best?80:40); SFX.win(); S.placed=1; save();
      const ap=$('#ap',m); if(ap) ap.onclick=()=>{ applyPlacement(best); toast(t('plDone')); go('home'); };
      $('#kp',m).onclick=()=>go('home'); };
    run(); };
};
/** levels up to `best` count as known: units done, words enter spaced review gently (spread over 6 weeks) */
function applyPlacement(best){ const now=Date.now(); for(let L=1;L<=best;L++){ unitsOf(L).forEach((u,i)=>{ S.units[L+'-'+i]=1; u.forEach((w,j)=>{ if(!S.srs[w.id]) S.srs[w.id]={b:3,d:now+(1+((w.id*7+j)%42))*864e5}; }); }); } save(); }
function placementCard(){ if(S.placed||S.xp>300) return ''; return `<button class="card row" id="plc" style="cursor:pointer;text-align:start;width:100%;background:linear-gradient(120deg,rgba(63,174,127,.22),var(--surface) 65%)"><span class="brush" style="font-size:34px;color:var(--jade)">定级</span><div class="grow"><h3>${t('plCard')}</h3><div class="sub">${t('plCardSub')}</div></div>›</button>`; }
function bindPlacementCard(m){ const b=$('#plc',m); if(b) b.onclick=()=>{ SFX.tap(); go('placement'); }; }
