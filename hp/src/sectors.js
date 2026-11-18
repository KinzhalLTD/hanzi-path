/* ===== Sector vocabulary 行业词汇 + Chinese accents 方言 ===== */
const SECTOR_EXT=__SECEXT__;
const SEC_LV={1:{zh:'基础',ar:'أساسي',en:'Core',c:'#7fbf8e'},2:{zh:'专业',ar:'مهني',en:'Professional',c:'#e2b75a'},3:{zh:'高级',ar:'متقدّم',en:'Advanced',c:'#e07a6a'}};
const SEC_META={};
// term index -> id: the first 1000 terms of a sector keep the original range; later terms use a wider range (no collisions)
const secId=(si,j)=>j<1000?95000+si*1000+j:300000+si*10000+j;
SECTORS.forEach((s,si)=>{ if(s.codeLink) s.terms=CODE_UNITS.filter(u=>u.tier==='basic').flatMap(u=>u.words).slice(0,20);
  const core={k:'core',zh:'核心词汇',ar:'المفردات الأساسية',en:'Core terms',terms:s.terms.map(w=>[w[0],w[1],w[2],w[3],1])};
  const ext=SECTOR_EXT[s.k]||{topics:[],ex:[]}; const seen=new Set(core.terms.map(w=>w[0]));
  s.topics=[core].concat(ext.topics.map(t=>Object.assign({},t,{terms:t.terms.filter(w=>!seen.has(w[0])&&seen.add(w[0]))}))).filter(t=>t.terms.length);
  s.ex=s.ex.concat(ext.ex||[]); let j=0;
  s.topics.forEach((t,ti)=>{ t._w=t.terms.map(w=>{ let o=byH[w[0]];
      if(!o||o.sector&&o.sector!==s.k){ o={id:secId(si,ext.ids&&w[0] in ext.ids?ext.ids[w[0]]:j),h:w[0],t:w[0],p:w[1],ar:[w[2]],en:[w[3]],l:0,fq:9999,mw:[],pos:[],sector:s.k}; byId[o.id]=o; if(!byH[o.h]) byH[o.h]=o; }
      else if(!(o.ar&&o.ar.length)) o.ar=[w[2]];
      j++; SEC_META[s.k+':'+o.id]={ar:w[2],en:w[3],lv:w[4],ti}; return o; }); });
  s._w=s.topics.flatMap(t=>t._w); });
// shown order: engineering fields side by side (ids depend on the array index, so the array itself is append-only)
const SEC_ORDER=(()=>{ const want=['eng','mep','cons','infra','it','tech','med','biz','trans','sci','modern','hist']; const ix=want.map(k=>SECTORS.findIndex(s=>s.k===k)).filter(i=>i>=0); SECTORS.forEach((s,i)=>{ if(!ix.includes(i)) ix.push(i); }); return ix; })();
// trade groups for large sectors: chips above the topic tabs filter which topics are shown
const SEC_GROUPS={mep:[['mech','暖通机械','الميكانيك والتكييف','Mechanical & HVAC',['hvac','pipe','valve','pumpfan','duct','refr','heat','insul','equip','gas']],
  ['elec','电气','الكهرباء','Electrical',['power','cable','light','earth','motor','elv','inst']],['plumb','给排水','السباكة','Plumbing',['plumb','fixture','drain','wtreat']],
  ['fire','消防','الحريق','Fire',['fire']],['gen','通用','عام','General',['conv','work','tc','tool','om','unit']]]};
const sstrip=x=>(x||'').normalize('NFD').replace(/[\u0300-\u036f\s']/g,'').toLowerCase();
const secFree=(ti)=>S.pro||ti===0;
const secM=(s,w)=>SEC_META[s.k+':'+w.id]||{ar:(w.ar||[])[0],en:(w.en||[])[0],lv:1,ti:0};
const secLearned=s=>s._w.filter(w=>S.srs[w.id]).length;
function speakIn(text,lang){ if(!S.sound) return; try{musDuck(2);}catch(e){} if(RN){ RN.postMessage(JSON.stringify({type:'speak',text,lang})); return; }
  try{ const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
const ACC_LANG={yue:'zh-HK',tw:'zh-TW'};
if(!document.getElementById('secCSS')) document.head.insertAdjacentHTML('beforeend',`<style id="secCSS">
.secbar{height:4px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px}.secbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold3),var(--gold2))}
.sstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.sstats div{background:rgba(255,255,255,.04);border:1px solid rgba(226,183,90,.18);border-radius:14px;padding:10px;text-align:center}.sstats b{display:block;font-size:20px;color:var(--gold2)}
.ttabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:none}.ttabs::-webkit-scrollbar{display:none}
.ttab{flex:0 0 auto;min-width:118px;text-align:start;border:1px solid rgba(226,183,90,.22);background:rgba(255,255,255,.03);color:var(--ivory);border-radius:14px;padding:9px 12px;display:flex;flex-direction:column;gap:2px}
.ttab .tz{font-family:var(--hanfont,'Noto Serif SC'),serif;font-size:17px;color:var(--gold2)}.ttab small{opacity:.7;font-size:11.5px}
.ttab.on{background:linear-gradient(180deg,rgba(226,183,90,.25),rgba(226,183,90,.08));border-color:var(--gold2)}
.lvf{display:flex;gap:6px;flex-wrap:wrap}.lvf button{border:1px solid rgba(255,255,255,.14);background:transparent;color:var(--ivory);border-radius:999px;padding:5px 12px;font-size:13px}.lvf button.on{background:var(--gold2);color:#2a1a07;border-color:var(--gold2)}
.lvb{font-size:10.5px;border-radius:6px;padding:1px 6px;border:1px solid currentColor;white-space:nowrap}
.ssearch{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(226,183,90,.25);color:var(--ivory);border-radius:12px;padding:10px 12px;font-size:15px}
.seclist li .lvb{margin-inline-start:6px}.seclist li.done .han{color:var(--gold2)}
</style>`);
SCREENS.sectors=m=>{ S.sec=S.sec||{}; const tot=SECTORS.reduce((a,s)=>a+s._w.length,0);
  m.insertAdjacentHTML('beforeend',`${topbar()}<div class="hero ph" style="min-height:180px">${photo('s_tech',0,'','bg')}<span class="eyebrow">${t('secSub')}</span><h1>${t('secTitle')}</h1><div class="sub" style="color:var(--ivory)"><span class="num">${tot}</span> ${t('words')} · <span class="num">${SECTORS.length}</span> ${t('secFields')} · <span class="num">${SECTORS.reduce((a,s)=>a+s.topics.length,0)}</span> ${t('secTopicsN')}</div></div>
   <div class="secgrid">${SEC_ORDER.map(i=>[SECTORS[i],i]).map(([s,i],n)=>{ const L=secLearned(s); return `<button class="seccard${SECTORS.length%2&&n===SECTORS.length-1?' wide':''}" data-i="${i}">${photo(s.photo,96,`<span class="brush" style="font-size:28px;color:var(--gold2);text-shadow:0 2px 10px #000">${s.zh}</span>`)}<div class="sc-meta"><b>${s.icon} ${isAr()?s.ar:s.en}</b><span class="sub"><span class="num">${s._w.length}</span> ${t('words')} · <span class="num">${s.topics.length}</span> ${t('secTopicsN')}</span><div class="secbar"><i style="width:${Math.round(100*L/s._w.length)}%"></i></div></div></button>`; }).join('')}
     <button class="seccard wide" id="acc">${photo('s_acc',96,`<span class="brush" style="font-size:28px;color:var(--gold2);text-shadow:0 2px 10px #000">方言</span>`)}<div class="sc-meta"><b>🗣 ${t('accTitle')}</b><span class="sub">${t('accSub')}</span></div></button></div>`);
  $$('[data-i]',m).forEach(b=>b.onclick=()=>{ SFX.tap(); go('sector',+b.dataset.i); });
  $('#acc',m).onclick=()=>go('accents'); };
SCREENS.sector=(m,i)=>{ const s=SECTORS[i]; track('sector_open',{sector:s.k}); S._secT=S._secT||{}; let ti=S._secT[s.k]||0, lv=0, q='';
  if(ti>=s.topics.length) ti=0;
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"><h2 style="margin:0">${s.icon} ${isAr()?s.ar:s.en}</h2><div class="py">${s.zh} · ${s.p}</div></div></div>
   ${photo(s.photo,150,`<span class="brush" style="font-size:46px;color:var(--gold2);text-shadow:0 2px 14px #000">${s.zh}</span>`)}
   ${TALK.some(d=>d.sec===s.k)?`<button class="card row" id="stk" style="cursor:pointer;text-align:start;width:100%"><span class="brush" style="font-size:30px;color:var(--gold2)">谈</span><div class="grow"><b>💬 ${t('tkTitle')}</b><div class="sub"><span class="num">${TALK.find(d=>d.sec===s.k).scenes.length}</span> ${t('tkScenes')}</div></div>›</button>`:''}
   <div class="sstats"><div><b class="num">${s._w.length}</b><span class="sub">${t('words')}</span></div><div><b class="num">${s.topics.length}</b><span class="sub">${t('secTopicsN')}</span></div><div><b class="num">${secLearned(s)}</b><span class="sub">${t('secLearnedN')}</span></div></div>
   ${s.codeLink?`<button class="btn ghost block" id="tocode">💻 ${t('codeTitle')}</button>`:''}
   <h3 style="margin-bottom:4px">${t('secTopicsT')}</h3>${SEC_GROUPS[s.k]?`<div class="lvf" id="tg"><button data-g="" class="on">${t('secAll')}</button>${SEC_GROUPS[s.k].map(g=>`<button data-g="${g[0]}">${g[1]} · ${isAr()?g[2]:g[3]}</button>`).join('')}</div>`:''}<div class="ttabs" id="tt">${s.topics.map((tp,k)=>`<button class="ttab${k===ti?' on':''}" data-t="${k}"><span class="tz">${tp.zh}</span><b style="font-size:13.5px">${secFree(k)?'':'🔒 '}${isAr()?tp.ar:tp.en}</b><small><span class="num">${tp._w.length}</span> ${t('words')} · <span class="num">${tp._w.filter(w=>S.srs[w.id]).length}</span> ✓</small></button>`).join('')}</div>
   <div class="lvf" id="lvf">${[0,1,2,3].map(k=>`<button data-l="${k}" class="${k===lv?'on':''}">${k?SEC_LV[k].zh+' · '+(isAr()?SEC_LV[k].ar:SEC_LV[k].en):t('secAll')}</button>`).join('')}</div>
   <input class="ssearch" id="sq" placeholder="${t('secSearch')}" autocomplete="off">
   <button class="btn block" id="learn"></button>
   <div id="lock"></div>
   <ul class="list seclist" id="sl"></ul>
   ${s.ex.length?`<h3>${t('secExamples')} · <span class="num">${s.ex.length}</span></h3><div class="col" style="gap:10px">${s.ex.map(([zh,py,ar,en],j)=>`<div class="card col" style="gap:8px">${analyseHTML(zh)}<div class="sub" style="color:var(--ivory)">${esc(isAr()?ar:en)}</div><div class="row" style="gap:6px"><button class="speak sm" data-z="${j}">🔊</button><button class="speak sm" data-mz="${j}">🎤</button></div></div>`).join('')}</div>`:''}`);
  const cur=()=>{ const tp=s.topics[ti]; let ws=q?s._w:tp._w; if(lv) ws=ws.filter(w=>secM(s,w).lv===lv);
    if(q){ const n=q.toLowerCase(); ws=ws.filter(w=>{ const mt=secM(s,w); return w.h.includes(q)||sstrip(w.p).includes(sstrip(n))||(mt.ar||'').includes(q)||(mt.en||'').toLowerCase().includes(n); }); } return ws; };
  const draw=()=>{ const ws=cur(), free=secFree(ti)||q&&false;
    $('#sl',m).innerHTML=ws.map((w,j)=>{ const mt=secM(s,w), L=SEC_LV[mt.lv], lk=!secFree(mt.ti); return `<li data-id="${w.id}" class="${lk?'lk':''}${S.srs[w.id]?' done':''}"><span class="han">${esc(w.h)}</span><span class="py">${esc(w.p)}</span><span class="lv">${lk?'🔒':j+1}</span><span style="min-width:0;font-size:14px">${esc(isAr()?mt.ar:mt.en)} <span class="lvb" style="color:${L.c}">${L.zh}</span></span></li>`; }).join('')||`<li class="sub" style="justify-content:center">—</li>`;
    const can=ws.filter(w=>secFree(secM(s,w).ti));
    $('#learn',m).innerHTML=can.length?`📖 ${t('secLearn')} · <span class="num">${Math.min(10,can.length)}</span> / <span class="num">${can.length}</span>`:(S.pro?'—':`🔒 ${t('secUnlock')} · PRO`); $('#learn',m).disabled=!can.length&&S.pro;
    $('#lock',m).innerHTML=S.pro?'':`<div class="sub" style="text-align:center">🔒 ${t('secFreeNote')}</div>`;
    $$('li[data-id]',$('#sl',m)).forEach(li=>li.onclick=()=>{ if(li.classList.contains('lk')) return paywall('sector'); S._wback={name:'sector',arg:i}; go('word',+li.dataset.id); }); };
  draw(); requestAnimationFrame(()=>hCenter($('#tt',m),$('#tt .ttab.on',m)));
  $$('#tt .ttab',m).forEach(b=>b.onclick=()=>{ SFX.tap(); ti=+b.dataset.t; S._secT[s.k]=ti; q=''; $('#sq',m).value=''; $$('#tt .ttab',m).forEach(x=>x.classList.toggle('on',x===b)); draw(); });
  $$('#tg button',m).forEach(b=>b.onclick=()=>{ SFX.tap(); const g=(SEC_GROUPS[s.k]||[]).find(x=>x[0]===b.dataset.g); $$('#tg button',m).forEach(x=>x.classList.toggle('on',x===b));
    $$('#tt .ttab',m).forEach(x=>{ x.hidden=!!g&&!g[4].includes(s.topics[+x.dataset.t].k); });
    const first=$$('#tt .ttab',m).find(x=>!x.hidden); if(first&&first.hidden===false&&!first.classList.contains('on')&&g) first.click(); hCenter($('#tt',m),first,true); });
  $$('#lvf button',m).forEach(b=>b.onclick=()=>{ lv=+b.dataset.l; $$('#lvf button',m).forEach(x=>x.classList.toggle('on',x===b)); draw(); });
  $('#sq',m).oninput=e=>{ q=e.target.value.trim(); draw(); };
  $('#bk',m).onclick=()=>go('sectors'); bindTokens(m); const tk=$('#stk',m); if(tk) tk.onclick=()=>go('talk',{d:TALK.find(d=>d.sec===s.k).k}); if(s.codeLink) $('#tocode',m).onclick=()=>go('code');
  $$('[data-z]',m).forEach(b=>b.onclick=()=>speak(s.ex[+b.dataset.z][0])); $$('[data-mz]',m).forEach(b=>b.onclick=()=>pronCheck(s.ex[+b.dataset.mz][0]));
  $('#learn',m).onclick=()=>{ const set=cur().filter(w=>secFree(secM(s,w).ti)); if(!set.length) return paywall('sector');
    const fresh=shuffle(set.filter(w=>!S.srs[w.id])), old=shuffle(set.filter(w=>S.srs[w.id])); const pick10=fresh.concat(old).slice(0,10);
    route={name:'lesson',arg:{custom:1}}; render(); const mm=$('main');
    runQuiz(mm,{intro:pick10.filter(w=>!S.srs[w.id]),questions:makeQuestions(pick10,s._w),back:()=>go('sector',i),onDone:()=>{ S.sec=S.sec||{}; S.sec[s.k]=1; track('sector_lesson',{sector:s.k,topic:s.topics[ti].k}); save(); route={name:'sector',arg:i}; }}); }; };
SCREENS.accents=m=>{ track('accents_open');
  m.insertAdjacentHTML('beforeend',`<div class="row"><button class="icon-btn" id="bk">${isAr()?'›':'‹'}</button><div class="grow"><h2 style="margin:0">🗣 ${t('accTitle')}</h2><div class="sub">${t('accSub')}</div></div><span class="brush" style="font-size:34px;color:var(--gold)">方言</span></div>
   ${photo('s_acc',140)}<div class="card sub" style="color:var(--ivory)">${t('accIntro')}</div>
   ${ACCENTS.map(a=>`<div class="card col accc" style="gap:10px"><div class="row" style="gap:10px"><span class="brush" style="font-size:32px;color:var(--gold2)">${a.zh}</span><div class="grow"><b>${isAr()?a.ar:a.en}</b><div class="sub">📍 ${isAr()?a.whereAr:a.whereEn}</div></div></div>
     <div class="sub" style="color:var(--ivory)">${esc(isAr()?a.noteAr:a.noteEn)}</div>
     <table class="acct"><thead><tr><th>${t('accStd')}</th><th>${isAr()?a.ar:a.en}</th></tr></thead><tbody>${a.pairs.map(([std,rom,loc,py,en,ar],j)=>`<tr><td><span class="han">${std}</span><div class="py">${py}</div><div class="sub">${esc(isAr()?ar:en)}</div></td><td><button class="accb" data-a="${a.k}" data-t="${esc(loc)}"><span class="han" style="font-size:20px;color:var(--gold2)">${loc}</span><div class="py" style="color:var(--ivory)">${esc(rom)}</div></button></td></tr>`).join('')}</tbody></table></div>`).join('')}`);
  $('#bk',m).onclick=()=>go('sectors');
  $$('.accb',m).forEach(b=>b.onclick=()=>{ const l=ACC_LANG[b.dataset.a]; if(l) speakIn(b.dataset.t,l); else { speak(b.dataset.t); toast(t('accTts')); } }); };
