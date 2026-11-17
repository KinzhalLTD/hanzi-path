/* ===== Photo banners: Canva-generated images (PHOTOS) with a painted SVG scene as fallback ===== */
const SCENE={
 home:{sky:['#2a0f0a','#8a3b1c','#f2b45a'],sun:[.72,.42,'#ffd88a'],m:'karst',x:'raft'},
 history:{sky:['#1a0907','#6e2112','#e8964a'],sun:[.2,.45,'#ffc777'],m:'ridge',x:'wall'},
 traditions:{sky:['#07040a','#1c0b1a','#3a1020'],sun:[.8,.22,'#f7e1a8'],m:'low',x:'lanterns'},
 society:{sky:['#120807','#3d150d','#a8502a'],sun:[.5,.5,'#f3b866'],m:'low',x:'roof'},
 kitchen:{sky:['#0d0706','#2a120b','#5a2412'],m:'none',x:'bowl'},
 music:{sky:['#0b0606','#2a0f0c','#4f1a12'],sun:[.5,.35,'#e8b65c'],m:'none',x:'strings'},
 dict:{sky:['#0e0908','#241712','#4a3020'],m:'none',x:'brush'},
 games:{sky:['#0c0606','#33120d','#6b2516'],m:'none',x:'tiles'},
 science:{sky:['#03040c','#0d1430','#2a2050'],m:'none',x:'stars'},
 symbols:{sky:['#140606','#3a0e0b','#7a1d12'],sun:[.5,.45,'#f3c060'],m:'none',x:'lanterns'},
 legends:{sky:['#07060f','#1a1030','#3a2050'],sun:[.72,.3,'#f6efd0'],m:'peaks',x:'clouds'},
 s_eng:{sky:['#140806','#4a1d0e','#d48a3a'],sun:[.8,.35,'#ffd28a'],m:'low',x:'city'},
 s_med:{sky:['#06100e','#0f2a26','#2f5a50'],m:'none',x:'tea'},
 s_trans:{sky:['#0b0610','#2a1030','#a0402a'],sun:[.2,.4,'#ffc27a'],m:'low',x:'city'},
 s_sci:{sky:['#03040c','#0d1430','#2a2050'],m:'none',x:'stars'},
 s_modern:{sky:['#0c0608','#2d0f14','#7a2a1c'],sun:[.8,.3,'#f6cf86'],m:'none',x:'lanterns'},
 s_tech:{sky:['#05060f','#121a3a','#3a2a5a'],sun:[.85,.25,'#f3e3b0'],m:'none',x:'city'},
 s_mep:{sky:['#040a12','#0e2238','#2f6f8a'],sun:[.2,.32,'#bfe6ff'],m:'none',x:'city'},
 s_cons:{sky:['#120804','#3a1a08','#d07a2a'],sun:[.7,.42,'#ffd08a'],m:'low',x:'city'},
 s_infra:{sky:['#04100e','#0f2e2a','#4a8a7a'],sun:[.35,.3,'#e8f6d0'],m:'peaks',x:'clouds'},
 s_acc:{sky:['#140606','#3a0e0b','#7a1d12'],sun:[.5,.45,'#f3c060'],m:'peaks',x:'clouds'},
 hsk1:{sky:['#16100a','#4a3218','#c8a060'],sun:[.75,.4,'#ffe2a0'],m:'low',x:'tea'},
 hsk2:{sky:['#0c0608','#2d0f14','#7a2a1c'],sun:[.8,.3,'#f6cf86'],m:'none',x:'lanterns'},
 hsk3:{sky:['#07120c','#163a22','#6f9b5a'],sun:[.5,.25,'#e7f0b0'],m:'low',x:'bamboo'},
 hsk4:{sky:['#05060f','#121a3a','#3a2a5a'],sun:[.85,.25,'#f3e3b0'],m:'none',x:'city'},
 hsk5:{sky:['#140a08','#5a2a14','#d9a04f'],sun:[.3,.38,'#ffd690'],m:'none',x:'roof'},
 hsk6:{sky:['#0f0a10','#4a2a3a','#f0b070'],sun:[.62,.5,'#ffe0a0'],m:'peaks',x:'clouds'}};
function rng(seed){ let s=0; for(const ch of seed) s=(s*31+ch.charCodeAt(0))>>>0; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }
function ridge(r,base,amp,step,sharp){ let d=`M0 100L0 ${base}`, y=base; for(let x=0;x<=400;x+=step){ y=base-(sharp?Math.abs(Math.sin(x/37+r()*3))*amp:(r()*amp)); d+=`L${x} ${y.toFixed(1)}`; } return d+'L400 100Z'; }
function sceneSVG(key){ const c=SCENE[key]||SCENE.home, r=rng(key), id='g'+key; let s=`<svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset=".6" stop-color="${c.sky[1]}"/><stop offset="1" stop-color="${c.sky[2]}"/></linearGradient><radialGradient id="${id}s"><stop offset="0" stop-color="${c.sun?c.sun[2]:'#000'}" stop-opacity=".9"/><stop offset="1" stop-color="${c.sun?c.sun[2]:'#000'}" stop-opacity="0"/></radialGradient></defs><rect width="400" height="100" fill="url(#${id})"/>`;
  if(c.sun) s+=`<circle cx="${c.sun[0]*400}" cy="${c.sun[1]*100}" r="46" fill="url(#${id}s)"/><circle cx="${c.sun[0]*400}" cy="${c.sun[1]*100}" r="9" fill="${c.sun[2]}"/>`;
  const L=['rgba(0,0,0,.28)','rgba(0,0,0,.45)','rgba(0,0,0,.7)'];
  if(c.m==='karst') [[62,26,9],[74,22,7],[88,14,6]].forEach(([b,a,st],i)=>s+=`<path d="${ridge(r,b,a,st,1)}" fill="${L[i]}"/>`);
  if(c.m==='ridge'||c.m==='peaks') [[58,30,14],[72,26,11],[86,18,9]].forEach(([b,a,st],i)=>s+=`<path d="${ridge(r,b,a,st,c.m==='peaks')}" fill="${L[i]}"/>`);
  if(c.m==='low') [[80,10,16],[90,8,12]].forEach(([b,a,st],i)=>s+=`<path d="${ridge(r,b,a,st,0)}" fill="${L[i+1]}"/>`);
  const X={
   raft:`<path d="M250 86h34l-3 3h-28z" fill="#120806"/><path d="M266 86v-12" stroke="#120806" stroke-width="1.2"/><path d="M0 92h400" stroke="rgba(255,220,150,.25)" stroke-width=".6"/>`,
   wall:Array.from({length:22},(_,i)=>{const x=40+i*14,y=64-Math.sin(i/3)*10;return `<rect x="${x}" y="${y}" width="13" height="5" fill="#1a0a06"/><rect x="${x}" y="${y-2.5}" width="5" height="2.5" fill="#1a0a06"/>`;}).join('')+`<path d="M180 52h22l-3-6h-16z" fill="#1a0a06"/><rect x="184" y="52" width="14" height="12" fill="#1a0a06"/>`,
   lanterns:Array.from({length:9},(_,i)=>{const x=24+i*44+(r()*10),y=18+r()*30,sz=7+r()*5;return `<path d="M${x} 0V${y-sz}" stroke="rgba(232,182,92,.5)" stroke-width=".5"/><ellipse cx="${x}" cy="${y}" rx="${sz}" ry="${sz*1.15}" fill="#d63a22"/><ellipse cx="${x}" cy="${y}" rx="${sz*.55}" ry="${sz*1.1}" fill="#ff7a3a" opacity=".55"/><circle cx="${x}" cy="${y}" r="${sz*2.6}" fill="#ff8a3a" opacity=".12"/><path d="M${x} ${y+sz*1.15}v6" stroke="#e8b65c" stroke-width="1.4"/>`;}).join(''),
   roof:`<path d="M60 70Q200 46 340 70L350 66Q200 36 50 66Z" fill="#1a0a06"/><path d="M90 70h220v30H90z" fill="#140805"/>${[0,1,2,3,4,5].map(i=>`<rect x="${110+i*32}" y="76" width="10" height="24" fill="#5a160d"/>`).join('')}<path d="M80 60Q200 30 320 60" stroke="#e8b65c" stroke-width="1" fill="none" opacity=".6"/>`,
   bowl:`<ellipse cx="200" cy="92" rx="190" ry="10" fill="#1b0c08"/><path d="M140 70q60 34 120 0z" fill="#3a1208"/><path d="M140 70h120" stroke="#e8b65c" stroke-width="1.2"/>${[0,1,2].map(i=>`<path d="M${180+i*20} 62q-8-12 0-24t0-24" stroke="rgba(255,240,220,.35)" stroke-width="2" fill="none"/>`).join('')}<path d="M262 58l70-30M266 62l70-28" stroke="#c99a52" stroke-width="2"/><ellipse cx="80" cy="80" rx="34" ry="12" fill="#5a3a20"/><ellipse cx="80" cy="76" rx="34" ry="10" fill="#7a5530"/>${[0,1,2].map(i=>`<circle cx="${66+i*14}" cy="74" r="6" fill="#f3e9d6"/>`).join('')}`,
   strings:Array.from({length:16},(_,i)=>`<path d="M30 ${40+i*3.6}L370 ${30+i*2.4}" stroke="rgba(247,216,148,${.25+i*.03})" stroke-width=".7"/>`).join('')+`<path d="M20 92L380 74L380 80L20 100Z" fill="#3a1208"/>`+Array.from({length:6},(_,i)=>`<circle cx="${60+i*60}" cy="${12+r()*20}" r="2.4" fill="#f4a7a0" opacity=".7"/>`).join(''),
   brush:`<rect x="40" y="58" width="200" height="34" fill="#efe3c8" opacity=".9"/><path d="M70 72q30-10 50 4t40-2" stroke="#1d1512" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="200" y="78" width="12" height="12" fill="#b3261e"/><path d="M300 20l20 60" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M318 76l6 16-10-6z" fill="#1d1512"/><ellipse cx="340" cy="90" rx="30" ry="7" fill="#1b1310"/>`,
   tiles:Array.from({length:7},(_,i)=>`<g transform="translate(${50+i*44} ${60-(i%2)*4}) rotate(${(r()-.5)*14})"><rect width="30" height="38" rx="4" fill="#f3e9d6"/><rect y="30" width="30" height="8" rx="3" fill="#2e7d4f"/><text x="15" y="24" font-size="16" text-anchor="middle" fill="${i%3?'#b3261e':'#1d5a3a'}" font-family="serif">${'中發東南西北萬'[i]}</text></g>`).join(''),
   stars:Array.from({length:70},()=>`<circle cx="${r()*400}" cy="${r()*100}" r="${r()*.9+.2}" fill="#f3e9d6" opacity="${.3+r()*.7}"/>`).join('')+`<circle cx="300" cy="40" r="18" fill="#e8dcc0"/><circle cx="294" cy="36" r="3" fill="#cbbd9c"/><g stroke="#e8b65c" fill="none" stroke-width="1.2" opacity=".8"><circle cx="110" cy="58" r="30"/><ellipse cx="110" cy="58" rx="30" ry="10" transform="rotate(-25 110 58)"/><ellipse cx="110" cy="58" rx="10" ry="30"/></g><path d="M95 100l15-12 15 12z" fill="#3a2a1a"/>`,
   tea:`<ellipse cx="200" cy="88" rx="60" ry="9" fill="#1b0f08"/><path d="M160 60q40 34 80 0z" fill="#e9dcc0"/><ellipse cx="200" cy="60" rx="40" ry="6" fill="#9a8a3a"/>${[0,1].map(i=>`<path d="M${192+i*14} 52q-6-10 0-20t0-20" stroke="rgba(255,250,235,.4)" stroke-width="2" fill="none"/>`).join('')}<path d="M290 82q0-26 26-26t26 26z" fill="#3a1d10"/><path d="M342 70q14-4 16-14" stroke="#3a1d10" stroke-width="4" fill="none"/>`,
   bamboo:Array.from({length:14},(_,i)=>{const x=10+i*29+r()*8,w=4+r()*3;return `<rect x="${x}" y="0" width="${w}" height="100" fill="rgba(12,40,20,${.45+r()*.4})"/>${[20,45,70].map(y=>`<rect x="${x-.5}" y="${y+r()*8}" width="${w+1}" height="1.4" fill="rgba(0,0,0,.35)"/>`).join('')}`;}).join('')+`<path d="M180 0L120 100M230 0L200 100" stroke="rgba(255,250,200,.12)" stroke-width="14"/>`,
   city:Array.from({length:18},(_,i)=>{const x=i*23,h=20+r()*45+(i===8?28:0),w=16+r()*6;return `<rect x="${x}" y="${82-h}" width="${w}" height="${h}" fill="#070812"/>${Array.from({length:6},()=>`<rect x="${x+2+r()*(w-5)}" y="${84-h+r()*h*.9}" width="2" height="2" fill="#f3d38a" opacity="${.4+r()*.5}"/>`).join('')}`;}).join('')+`<path d="M188 34v-14M182 40h12" stroke="#070812" stroke-width="3"/><circle cx="188" cy="46" r="6" fill="#070812"/><rect x="0" y="82" width="400" height="18" fill="#0a0d22"/>${Array.from({length:12},()=>`<rect x="${r()*400}" y="${84+r()*14}" width="${6+r()*14}" height=".8" fill="#f3d38a" opacity=".35"/>`).join('')}`,
   clouds:Array.from({length:7},(_,i)=>`<ellipse cx="${i*64+r()*20}" cy="${78+r()*10}" rx="${50+r()*30}" ry="${10+r()*6}" fill="rgba(255,236,214,${.22+r()*.2})"/>`).join('')+`<path d="M300 40q6-14 4-26M300 30q-10-2-16 4M302 24q10 0 14 6" stroke="#140a0a" stroke-width="2" fill="none"/>`};
  return s+(X[c.x]||'')+'</svg>'; }
const PHOTOS=__PHOTOS__;
function photo(key,h=150,inner='',cls=''){ const src=PHOTOS[key];
  return `<div class="photo ${cls}" style="height:${h}px">${src?`<div class="pimg" style="background-image:url(${src})"></div>`:`<div class="pimg">${sceneSVG(key)}</div>`}<div class="pfade"></div>${inner?`<div class="pin">${inner}</div>`:''}</div>`; }
