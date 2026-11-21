/* ===== Feel: touch response, haptics and screen transitions =====
   - iOS only shows :active pressed states when the page has a touch listener, so one passive listener is installed.
   - Light haptic tick on tab and primary-button presses (native app; ignored in the browser). Kinds: select, light,
     medium, success, error (mobile/src/HanziBridge.js maps them to expo-haptics).
   - screenEnter(): short staggered rise for the top blocks of a screen, mirrored for "back"; respects Reduce Motion.
   - Taps on the active tab scroll the screen back to the top, like native iOS tab bars. */
document.addEventListener('touchstart', () => {}, { passive: true });
const REDUCED = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
let _lastTick = 0;
function tick(kind) { const n = Date.now(); if (n - _lastTick < 60) return; _lastTick = n; if (S.haptics === false) return; haptic(kind || 'select'); }
document.addEventListener('click', e => {   // on release, so a scroll that starts on a button never ticks
  const el = e.target.closest && e.target.closest('.tab,.btn,.ptile,.gcard,.seccard,.jnode,.card.feature,.lang button');
  if (!el || el.disabled) return;
  tick(el.classList.contains('tab') ? 'select' : 'light');
}, { capture: true });
document.addEventListener('click', e => {
  const tb = e.target.closest && e.target.closest('.tab[aria-current="page"]');
  if (tb && route.name === tb.dataset.k && window.scrollY > 0) { e.stopImmediatePropagation(); e.preventDefault(); window.scrollTo({ top: 0, behavior: REDUCED() ? 'auto' : 'smooth' }); }
}, true);
function screenEnter(back) {
  if (REDUCED()) return; const sc = $('#app > .screen'); if (!sc || sc.classList.contains('full')) return;
  sc.classList.remove('enter', 'enter-back'); sc.classList.add(back ? 'enter-back' : 'enter');
  setTimeout(() => sc.classList.remove('enter', 'enter-back'), 520);
}
Object.assign(T.ar,{themeT:'المظهر',themeDark:'داكن',themeLight:'فاتح'});
Object.assign(T.en,{themeT:'Appearance',themeDark:'Dark',themeLight:'Light'});

// Learners flag an exercise that looks wrong (pinyin, meaning, sentence, grammar): a small ⚑ in the feedback sheet.
// Kept in S.reports and sent as GA4 event `content_report` (param id: w<wordId>:<kind> or g<grammarKey>:<kind>).
function addReport(f,id){ const h=f.querySelector('h3'); if(!h||!id) return; const ar=isAr();
  const b=document.createElement('button'); b.className='icon-btn qrep'; b.textContent='⚑'; b.setAttribute('aria-label',ar?'أبلغ عن خطأ في هذا التمرين':'Report a problem with this exercise');
  if(S.reports&&S.reports[id]){ b.disabled=true; b.textContent='✓'; }
  b.onclick=()=>{ S.reports=S.reports||{}; S.reports[id]=Date.now(); save(); try{ track('content_report',{id}); }catch(e){} b.disabled=true; b.textContent='✓'; toast(ar?'شكرًا! سنراجع هذا التمرين.':'Thanks! We will review this exercise.'); };
  h.parentElement.style.position='relative'; h.insertAdjacentElement('afterend',b); }
