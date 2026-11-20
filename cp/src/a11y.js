/* ===== Accessibility: names for icon-only controls (VoiceOver reads "Listen", not "button"), a text-size setting
   (S.fs 1 / 1.15 / 1.3 scales the whole interface), and the OS reduce-motion preference (styles.css). Checked by
   scripts/audit_a11y.py (must report a11y issues 0). ===== */
const A11Y_NAMES=[['.speak',()=>isAr()?'استمع':'Listen'],['#hn',()=>isAr()?'تلميح':'Hint'],['#pa',()=>isAr()?'تشغيل الحوار كاملًا':'Play the whole dialogue'],
  ['#xk',()=>isAr()?'مفتاح XOR':'XOR key'],['.editor .keys button',b=>(isAr()?'أدخل ':'Insert ')+b.textContent.trim()]];
function a11yName(root){ if(!root||!root.querySelectorAll) return;
  A11Y_NAMES.forEach(([sel,fn])=>{ (root.matches&&root.matches(sel)?[root]:[]).concat([...root.querySelectorAll(sel)]).forEach(b=>{ if(!b.getAttribute('aria-label')) b.setAttribute('aria-label',fn(b)); }); }); }
new MutationObserver(ms=>{ for(const m of ms) m.addedNodes.forEach(n=>{ if(n.nodeType===1) a11yName(n); }); }).observe(document.body,{childList:true,subtree:true});
a11yName(document.body);
/* text size: zoom keeps the layout's proportions; the layout is checked at 130 % by audit_layout --fs 1.3 */
function applyTextSize(){ const z=+S.fs||1; try{ document.getElementById('app').style.zoom=z===1?'':z; }catch(e){} }
applyTextSize();
