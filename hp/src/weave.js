/* ===== Weave: spreads the new features through the whole app instead of leaving them in their own corners.
   Writing, pronunciation, character stories, culture "why" notes, code words, fonts and photos
   now appear inside lessons, review, dictionary, culture, recipes, games, quests and the profile. ===== */
/* --- lookups --- */
function storyOf(h){ if(typeof STORIES==='undefined') return null; for(const c of [...h]){ const s=STORIES.find(x=>x[0]===c); if(s) return s; } return null; }
const CULT_IDX=(()=>{ const m={}; CULTURE.forEach((c,i)=>c.cards.forEach((d,j)=>{ d.zh.split(/\s*·\s*/).concat(d.kw||[]).forEach(z=>{ z=z.replace(/[^㐀-鿿]/g,''); if(z&&!m[z]) m[z]={i,j}; }); })); return m; })();
function cultureOf(h){ const r=CULT_IDX[h]; return r?{...r,d:CULTURE[r.i].cards[r.j],c:CULTURE[r.i]}:null; }
const firstWritable=h=>[...h].find(c=>canWrite(c));
/* --- quick writing sheet, usable from anywhere --- */
function quickWrite(h){ const cs=[...new Set([...h])].filter(canWrite); if(!cs.length) return toast('—'); if(!cs.every(writeFree)) return paywall('write');
  let k=0; const one=()=>sheet(`<div class="col" style="align-items:center;gap:8px"><div class="eyebrow">✍️ ${t('wTrace')} <span class="num">${k+1}/${cs.length}</span></div><div class="wbox paper" style="width:240px">${GRID}<div id="qw"></div><div class="wmsg" id="qm"></div></div><div class="row" style="gap:8px;width:100%"><button class="btn ghost grow" id="qa">▶ ${t('wWatch')}</button><button class="btn grow" id="qs">🔊</button></div></div>`,s=>{
    const box=$('#qw',s); let wr=hwCreate(box,cs[k],{size:236});
    const quiz=()=>{ box.innerHTML=''; wr=hwCreate(box,cs[k],{size:236}); wr.quiz({showHintAfterMisses:2,onCorrectStroke:()=>SFX.tap(),onMistake:()=>haptic('error'),onComplete:d=>{ const st=d.totalMistakes===0?3:d.totalMistakes<=2?2:1; S.written=S.written||{}; S.written[cs[k]]=Math.max(S.written[cs[k]]||0,st); dayCount('writeDay').n++; addXP(2*st); save(); track('write_complete',{char:cs[k],stars:st,mode:'quick'}); SFX.ok(); $('#qm',s).innerHTML=`<span class="stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`; setTimeout(()=>{ if(++k<cs.length) one(); else { closeSheet(); toast('✍️ '+t('wDone')); } },900); }}); };
    $('#qa',s).onclick=()=>{ box.innerHTML=''; wr=hwCreate(box,cs[k],{size:236,showCharacter:false}); wr.animateCharacter({onComplete:quiz}); }; $('#qs',s).onclick=()=>speak(h); quiz(); });
  one(); }
/* --- the "extras" row: write · say · story · culture, shown wherever a word appears --- */
function extrasHTML(w){ const st=storyOf(w.h), cu=cultureOf(w.h), wc=firstWritable(w.h);
  return `<div class="extras">${wc?`<button class="xch" data-x="write">✍️ ${t('xWrite')}</button>`:''}<button class="xch" data-x="say">🎤 ${t('xSay')}</button>${st?`<button class="xch" data-x="story">😄 ${t('xStory')}</button>`:''}${cu?`<button class="xch" data-x="cult">💡 ${t('xWhy')}</button>`:''}</div>`; }
function bindExtras(root,w){ $$('.xch',root).forEach(b=>b.onclick=e=>{ e.stopPropagation(); SFX.tap(); const x=b.dataset.x;
  if(x==='write') quickWrite(w.h); if(x==='say') pronCheck(w.h);
  if(x==='story'){ const s=storyOf(w.h); sheet(`<div class="row" style="gap:14px"><span class="han story-c">${s[0]}</span><p style="margin:0">${esc(isAr()?s[2]:s[1])}</p></div><button class="btn block" id="sw">✍️ ${t('xWrite')} ${s[0]}</button>`,sh=>$('#sw',sh).onclick=()=>quickWrite(s[0])); }
  if(x==='cult'){ const c=cultureOf(w.h); sheet(`<div class="eyebrow">${esc(L2(c.c))}</div><h2 style="margin:4px 0">${esc(L2(c.d))}</h2><p style="margin:0">${esc(isAr()?c.d.bAr:c.d.bEn)}</p>${c.d.wEn?`<div class="why"><b>💡 ${t('why')}</b><p>${esc((isAr()?c.d.wAr:c.d.wEn).replace(/^(Why\?|لماذا؟)\s*/,''))}</p></div>`:''}<button class="btn ghost block" id="cr">📖 ${t('xOpenCulture')}</button>`,sh=>$('#cr',sh).onclick=()=>go('reader',{i:c.i,start:c.j,single:true})); } }); }
/* --- a random "why" fact (science & symbols) for lesson results and the games hub --- */
function whyFact(seed){ const pool=CULTURE.filter(c=>c.k==='symbols'||c.k==='science').flatMap(c=>c.cards.map((d,j)=>({c,d,i:CULTURE.indexOf(c),j}))); return pool[(seed??(Math.random()*1e6|0))%pool.length]; }
function factCardHTML(f){ return `<button class="card row factc" data-fi="${f.i}" data-fj="${f.j}"><span class="han" style="font-size:30px;color:var(--gold2);min-width:56px;text-align:center">${esc(f.d.zh.split(' · ')[0])}</span><div class="grow" style="text-align:start;min-width:0"><div class="eyebrow">💡 ${t('didYouKnow')}</div><b>${esc(L2(f.d))}</b><div class="sub" style="color:var(--ivory);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc((isAr()?f.d.wAr:f.d.wEn).replace(/^(Why\?|لماذا؟)\s*/,''))}</div></div>›</button>`; }
function bindFact(root){ $$('.factc',root).forEach(b=>b.onclick=()=>go('reader',{i:+b.dataset.fi,start:+b.dataset.fj,single:true})); }
/* --- Chinese display font (setting) --- */
const HAN_FONTS={song:['宋','"Noto Serif SC","Songti SC",serif'],hei:['黑','"Noto Sans SC","PingFang SC",sans-serif'],kai:['楷','"Ma Shan Zheng","Kaiti SC",serif'],xing:['行','"Long Cang","Ma Shan Zheng",serif'],fun:['乐','"ZCOOL KuaiLe","Noto Sans SC",sans-serif']};
function applyHanFont(){ const f=HAN_FONTS[S.hanFont||'song']||HAN_FONTS.song; document.documentElement.style.setProperty('--f-han',f[1]); }
/* --- daily quests: a rotating set that covers every part of the app --- */
const QUEST_POOL=[['q1',()=>S.lessonsToday>=1,30],['q2',()=>S.gamesToday>=2,30],['q3',()=>S.todayXP>=50,40],
 ['qW',()=>dayCount('writeDay').n>=3,35],['qP',()=>dayCount('pronAll').n>=3,30],['qC',()=>dayCount('cultDay').n>=2,25],['qK',()=>dayCount('codeDay').n>=1,30]];
function questsToday(){ const s=daySeed(); const extra=QUEST_POOL.slice(3); const a=extra[s%extra.length], b=extra[(s+1)%extra.length]; return [QUEST_POOL[0],a,b]; }

/* --- story narration in the learner's language (legends, culture cards) --- */
let narrating=false;
function narrate(text){ const lang=isAr()?'ar-SA':'en-US'; if(narrating){ narrating=false; try{ if(RN) RN.postMessage(JSON.stringify({type:'speakStop'})); else speechSynthesis.cancel(); }catch(e){} return; }
  narrating=true; try{ musDuck(Math.min(60,2+text.length*.07)); }catch(e){}
  if(RN){ RN.postMessage(JSON.stringify({type:'speak',text,lang,rate:.95})); return; }
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=.95; u.onend=()=>narrating=false; speechSynthesis.speak(u); }catch(e){ narrating=false; } }
