/* ===== Icon system: one consistent set of line icons drawn for Hanzi Path.
   Controls keep their emoji in the source for readability; this layer swaps them for crisp SVG icons
   (in buttons, chips, labels and toasts) everywhere in the app, including content added later. ===== */
const IC={
 speak:'<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.2a3.8 3.8 0 0 1 0 5.6M18.3 6.6a7.6 7.6 0 0 1 0 10.8"/>',
 mute:'<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
 brush:'<path d="M19.5 3.5 10.2 12.8"/><path d="M10.2 12.8c-2.2-.3-4.4 1-4.6 3.6-.1 1.4-.9 2.4-2.1 2.6 2.9 1.9 7.3 1.4 8.7-1.6.8-1.7.3-3.6-2-4.6z"/><path d="M15.6 7.4l1 1"/>',
 headphones:'<path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/><rect x="3.5" y="14.5" width="4" height="6" rx="1.4"/><rect x="16.5" y="14.5" width="4" height="6" rx="1.4"/>',
 bulb:'<path d="M9.5 17.5h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.8.7 1.3 1.6 1.3 2.6v1.3h5v-1.3c0-1 .5-1.9 1.3-2.6A6 6 0 0 0 12 3z"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8.3 14.2a4.4 4.4 0 0 0 7.4 0"/><path d="M9 9.6h.01M15 9.6h.01" stroke-width="2.6"/>',
 flame:'<path d="M12 21a6 6 0 0 0 6-6c0-4.2-3.2-6.3-4.3-10.5-2 1.6-3 3.6-3 5.6-1-.6-1.8-1.7-2-3C6.8 9.2 6 11.4 6 15a6 6 0 0 0 6 6z"/><path d="M12 21a2.6 2.6 0 0 0 2.6-2.6c0-1.7-1.4-2.6-2.6-4.2-1.2 1.6-2.6 2.5-2.6 4.2A2.6 2.6 0 0 0 12 21z"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v3"/>',
 music:'<path d="M9 18V5.5l11-2.5v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/>',
 trophy:'<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6H5.2a3.2 3.2 0 0 0 3.3 4.4M16 6h2.8a3.2 3.2 0 0 1-3.3 4.4M12 13.5V17M8.5 21h7M9.5 17h5v4h-5z"/>',
 book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5V21M8 7.5h8M8 11h6"/>',
 code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.8 4.5l-3.6 15"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke-width="2.4"/>',
 blocks:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M17 13.5v7M13.5 17h7"/>',
 play:'<path d="M7.5 4.5 19 12 7.5 19.5z"/>',
 replay:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.5v4h4"/>',
 star:'<path d="M12 3.3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.7l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
 check:'<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
 bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 1.8H4.2z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 chat:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
 clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4.2l2.8 1.8M9.5 2.5h5"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" stroke-width="2.6"/>',
 chart:'<path d="M4 4v16h16"/><path d="M7.5 15l4-4.5 3 3 5-6"/>',
 flag:'<path d="M5.5 21V4M5.5 4.5h12l-2.2 4 2.2 4h-12"/>',
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 gift:'<rect x="4" y="10" width="16" height="10.5" rx="1.6"/><path d="M3 7h18v3H3zM12 7v13.5"/><path d="M12 7c-1.4-3.6-5.6-3.4-5.2-.6.2 1 1.6.6 5.2.6zM12 7c1.4-3.6 5.6-3.4 5.2-.6-.2 1-1.6.6-5.2.6z"/>',
 sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2 2.2.8-2.2.8L19 22l-.8-2.2-2.2-.8 2.2-.8z"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9c-2.6-2.6-3.6-5.6-3.6-9s1-6.4 3.6-9z"/>',
 cog:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
 share:'<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'};
const icon=(n,cls='')=>`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;
const EMO={'🔊':'speak','🔇':'mute','🎤':'mic','✍':'brush','✏':'brush','🎧':'headphones','💡':'bulb','😄':'smile','🔥':'flame','🔒':'lock','🎶':'music','🎵':'music','🏆':'trophy','📖':'book','💻':'code','📅':'calendar','🧩':'blocks','▶':'play','↺':'replay','⭐':'star','✓':'check','✅':'check','🔔':'bell','👤':'user','💬':'chat','⏱':'clock','🎲':'dice','📈':'chart','🏁':'flag','👀':'eye','✕':'x','🎁':'gift','✦':'sparkle','✨':'sparkle','🌐':'globe','⚙':'cog'};
const EMO_RE=new RegExp('('+Object.keys(EMO).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\uFE0F?','g');
const ICON_SEL='button,.chip,.eyebrow,.cstep,.tlab,.toast,.xch,.mode b,.statgrid span,.sub,.btn,h2,h3,summary,.perks li,.soon';
function iconize(root){ if(!root||!root.querySelectorAll) return; const els=root.matches&&root.matches(ICON_SEL)?[root,...root.querySelectorAll(ICON_SEL)]:root.querySelectorAll(ICON_SEL);
  els.forEach(el=>{ if(el.closest('.bubble,.feedback .bubble,pre,textarea,.term,.han,.fsample')) return;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); const hits=[]; let n; while((n=walker.nextNode())){ EMO_RE.lastIndex=0; if(EMO_RE.test(n.nodeValue)&&!n.parentElement.closest('.bubble,pre,textarea,.term')) hits.push(n); }
    hits.forEach(tn=>{ const span=document.createElement('span'); span.className='icwrap'; span.innerHTML=esc(tn.nodeValue).replace(EMO_RE,(m,e)=>icon(EMO[e])); tn.replaceWith(span); }); }); }
let icPending=false; const icObs=new MutationObserver(()=>{ if(icPending) return; icPending=true; requestAnimationFrame(()=>{ icPending=false; icObs.disconnect(); iconize(document.body); icObs.observe(document.body,{childList:true,subtree:true,characterData:true}); }); });
icObs.observe(document.body,{childList:true,subtree:true,characterData:true});
