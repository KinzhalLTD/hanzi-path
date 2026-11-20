/* ===== Home-screen widget feed (shared by both apps; keep identical): streak, today's word/term and the next Chinese
   festival go to the native side, which stores them for the iOS widget (mobile/src/widget.js, docs/WIDGET.md). ===== */
const WAPP=typeof bao==='function'?'hp':'cp';
function widgetData(){ const ar=isAr(); let word=null;
  try{ if(WAPP==='hp'){ const s=+today().replace(/-/g,''), lv=curLevel(), pool=byLevel[lv]||W, w=pool[s%pool.length]; word={h:w.h,p:w.p,m:String(mean(w,1)).replace(/<[^>]+>/g,'').replace(/&[a-z#0-9]+;/g,' ').trim()}; }
    else { const s=+today().replace(/-/g,''), w=TERMS[s%TERMS.length]; word={h:w.h,p:w.p,m:ar?w.ar:w.en}; } }catch(e){}
  let fest=null; try{ const f=festList()[0]; if(f&&festDays(f)<=60){ const F=FEST[f.k]; fest={n:ar?F.ar:F.en,zh:F.zh,d:festDays(f),ic:F.ic}; } }catch(e){}
  return {streak:S.streak||0,xp:S.xp||0,done:S.lastActive===today(),word,fest,lang:ar?'ar':'en'}; }
function widgetPush(){ if(!RN) return; try{ RN.postMessage(JSON.stringify({type:'widget',data:widgetData()})); }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) widgetPush(); });
setTimeout(widgetPush,2500);
