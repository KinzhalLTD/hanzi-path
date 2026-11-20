/* ===== Certificates (shared by Hanzi Path and Cipher Path; keep both copies identical): earned by passing chapter gates
   and finishing a level/track, drawn on a canvas as a bilingual Chinese-style certificate, shared as an image
   (LinkedIn, X, WhatsApp…) through the native share sheet. Each has a verification code derived from the learner's id. ===== */
const CAPP=typeof bao==='function'?'hp':'cp';
const CBRAND=CAPP==='hp'?{seal:'汉',zh:'汉字之路',ar:'مسار هانزي',en:'Hanzi Path',web:'hanzi-path-64170.web.app'}:{seal:'码',zh:'码道',ar:'مسار الشيفرة',en:'Cipher Path',web:'cipher-path-kinzhal.web.app'};
/* list of earned certificates: {id, big (level/track), zh, ar, en (what was completed)} */
function certEarned(){ const out=[];
  try{ if(CAPP==='hp'){ for(let L=1;L<=6;L++){ const chs=chaptersOf(L); let all=chs.length>0;
        chs.forEach(ch=>{ if(gateDone(L,ch.c)) out.push({id:`h${L}c${ch.c}`,big:false,zh:`HSK ${L} · ${ch.place[0]}`,ar:`المرحلة ${ch.c+1} من HSK ${L}: ${ch.place[2]}`,en:`HSK ${L}, stage ${ch.c+1}: ${ch.place[1]}`}); else all=false; });
        if(all) out.push({id:`h${L}`,big:true,zh:`汉语水平考试 ${L} 级`,ar:`المستوى ${L} من HSK كاملًا`,en:`HSK level ${L}, complete`}); } }
    else { for(const tr of ['se','cy']){ const chs=chapOf(tr); let all=true; const trn=tr==='se'?['软件工程','هندسة البرمجيات','Software engineering']:['网络安全','الأمن السيبراني','Cybersecurity'];
        chs.forEach(ch=>{ const g=(S.gates||{})[gateKey(ch)]; if(g&&g.ok) out.push({id:`${tr}c${ch.ci}`,big:false,zh:`${trn[0]} · ${ch.c[0]}`,ar:`${trn[1]}: الفصل ${ch.ci+1}، ${ch.c[2]}`,en:`${trn[2]}, chapter ${ch.ci+1}: ${ch.c[3]}`}); else all=false; });
        if(all) out.push({id:tr,big:true,zh:`${trn[0]} 结业`,ar:`مسار ${trn[1]} كاملًا`,en:`${trn[2]} track, complete`}); } } }catch(e){}
  S.certAt=S.certAt||{}; let ch=false; out.forEach(c=>{ if(!S.certAt[c.id]){ S.certAt[c.id]=Date.now(); ch=true; } }); if(ch) save();
  return out.sort((a,b)=>S.certAt[b.id]-S.certAt[a.id]); }
const certName=()=>S.certName||(S.user&&S.user.name)||'';
function certCode(c){ let h=2166136261; for(const ch of (S.cid||'x')+'|'+c.id) { h^=ch.charCodeAt(0); h=Math.imul(h,16777619)>>>0; } const s=h.toString(36).toUpperCase().padStart(7,'0');
  return `${CAPP.toUpperCase()}-${s.slice(0,4)}-${s.slice(4)}${c.id.length%10}`; }
/* draw at 1600×1131 (A-series ratio, landscape) */
async function certCanvas(c){ try{ await document.fonts.ready; }catch(e){} const W=1600,H=1131, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const paper=x.createLinearGradient(0,0,W,H); paper.addColorStop(0,'#fbf3e2'); paper.addColorStop(1,'#f1e2c4'); x.fillStyle=paper; x.fillRect(0,0,W,H);
  x.strokeStyle='#b8862e'; x.lineWidth=10; x.strokeRect(40,40,W-80,H-80); x.lineWidth=2; x.strokeRect(62,62,W-124,H-124);
  // corner cloud marks
  x.fillStyle='#b3261e'; for(const [cx,cy] of [[62,62],[W-62,62],[62,H-62],[W-62,H-62]]){ x.beginPath(); x.arc(cx,cy,14,0,7); x.fill(); }
  const serif='"Noto Serif SC","Songti SC","STSong",serif', ui='Inter,"IBM Plex Sans Arabic","Noto Sans Arabic",system-ui,sans-serif', arf='"IBM Plex Sans Arabic","Noto Naskh Arabic","Geeza Pro",sans-serif';
  x.textAlign='center'; x.fillStyle='#7a1610'; x.font=`700 64px ${serif}`; x.fillText(c.big?'结业证书':'成就证书',W/2,190);
  x.fillStyle='#3b2a1a'; x.font=`600 30px ${ui}`; x.fillText(c.big?'CERTIFICATE OF COMPLETION':'CERTIFICATE OF ACHIEVEMENT',W/2,245);
  x.direction='rtl'; x.font=`600 32px ${arf}`; x.fillText(c.big?'شهادة إتمام':'شهادة إنجاز',W/2,295); x.direction='ltr';
  x.fillStyle='#6b5a44'; x.font=`400 26px ${ui}`; x.fillText('This certifies that  ·  نشهد بأنّ',W/2,370);
  const nm=certName()||'—'; let fs=76; x.font=`700 ${fs}px ${/[؀-ۿ]/.test(nm)?arf:ui}`; while(x.measureText(nm).width>W-360&&fs>40){ fs-=4; x.font=`700 ${fs}px ${/[؀-ۿ]/.test(nm)?arf:ui}`; }
  x.fillStyle='#1d1410'; if(/[؀-ۿ]/.test(nm)) x.direction='rtl'; x.fillText(nm,W/2,470); x.direction='ltr';
  x.strokeStyle='#b8862e'; x.lineWidth=2; x.beginPath(); x.moveTo(W/2-380,500); x.lineTo(W/2+380,500); x.stroke();
  x.fillStyle='#6b5a44'; x.font=`400 26px ${ui}`; x.fillText('has completed  ·  أتمّ بنجاح',W/2,560);
  x.fillStyle='#7a1610'; x.font=`700 46px ${serif}`; x.fillText(c.zh,W/2,640);
  x.fillStyle='#1d1410'; x.font=`600 36px ${ui}`; x.fillText(c.en,W/2,700); x.direction='rtl'; x.font=`600 36px ${arf}`; x.fillText(c.ar,W/2,756); x.direction='ltr';
  const d=new Date(S.certAt[c.id]||Date.now());
  x.font=`400 24px ${ui}`; x.fillStyle='#6b5a44'; x.textAlign='left'; x.fillText(d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),150,930); x.fillText('Date · التاريخ',150,966);
  x.textAlign='right'; x.fillText(certCode(c),W-150,930); x.fillText('Verification code · رمز التحقق',W-150,966);
  // seal
  x.save(); x.translate(W/2,878); x.rotate(-.06); x.fillStyle='#b3261e'; x.globalAlpha=.92; const r=26; x.beginPath(); x.moveTo(-90+r,-90); x.arcTo(90,-90,90,90,r); x.arcTo(90,90,-90,90,r); x.arcTo(-90,90,-90,-90,r); x.arcTo(-90,-90,90,-90,r); x.fill();
  x.globalAlpha=1; x.strokeStyle='#fbf3e2'; x.lineWidth=5; x.strokeRect(-72,-72,144,144); x.fillStyle='#fbf3e2'; x.textAlign='center'; x.font=`700 104px ${serif}`; x.fillText(CBRAND.seal,0,36); x.restore();
  x.textAlign='center'; x.fillStyle='#3b2a1a'; x.font=`700 30px ${ui}`; x.fillText(`${CBRAND.en}  ·  ${CBRAND.zh}`,W/2,1010); x.direction='rtl'; x.font=`600 24px ${arf}`; x.fillText(CBRAND.ar,W/2,1044); x.direction='ltr';
  return cv; }
async function certShare(c){ const cv=await certCanvas(c), url=cv.toDataURL('image/png'), ar=isAr();
  const text=ar?`أتممت «${c.ar}» في تطبيق ${CBRAND.ar} 🎓 رمز التحقق: ${certCode(c)}`:`I completed "${c.en}" in ${CBRAND.en} 🎓 Verification code: ${certCode(c)}`;
  track('cert_share',{cert:c.id});
  if(RN) return native('share',{text,image:url});
  try{ const blob=await (await fetch(url)).blob(), f=new File([blob],'certificate.png',{type:'image/png'}); if(navigator.canShare&&navigator.canShare({files:[f]})) return navigator.share({files:[f],text}); }catch(e){}
  toast(ar?'اضغط على الصورة مطوّلًا لحفظها':'Long-press the picture to save it'); }
function certSheet(c){ const ar=isAr();
  sheet(`<div class="col" style="gap:12px"><div class="row"><h2 class="grow" style="margin:0">🎓 ${ar?'شهادتك':'Your certificate'}</h2></div>
    <div class="certwrap"><img id="cimg" alt="${esc(ar?'شهادة: '+c.ar:'Certificate: '+c.en)}"></div>
    <label class="col" style="gap:6px"><span class="sub">${ar?'الاسم على الشهادة':'Name on the certificate'}</span><input id="cname" class="certname" maxlength="40" value="${esc(certName())}" placeholder="${ar?'اكتب اسمك':'Your name'}"></label>
    <button class="btn block" id="cshare">📤 ${ar?'شارك الشهادة':'Share certificate'}</button></div>`,async s=>{
    const draw=async()=>{ const cv=await certCanvas(c); $('#cimg',s).src=cv.toDataURL('image/png'); }; await draw();
    let tm; $('#cname',s).oninput=e=>{ S.certName=e.target.value.trim(); save(); clearTimeout(tm); tm=setTimeout(draw,250); };
    $('#cshare',s).onclick=()=>{ if(!certName()){ $('#cname',s).focus(); toast(ar?'اكتب اسمك أولًا':'Add your name first'); return; } SFX.tap(); certShare(c); }; }); }
SCREENS.certs=m=>{ const ar=isAr(), list=certEarned();
  m.innerHTML=`<div class="screen"><div class="row" style="gap:10px"><button class="icon-btn" id="cb" aria-label="${ar?'رجوع':'Back'}">${ar?'›':'‹'}</button><h1 class="grow" style="margin:0">🎓 ${ar?'شهاداتي':'My certificates'}</h1></div>
   ${list.length?`<div class="col" style="gap:8px">${list.map(c=>`<button class="card row certitem${c.big?' big':''}" data-id="${c.id}"><span class="certseal" aria-hidden="true">${CBRAND.seal}</span><div class="grow" style="text-align:start;min-width:0"><b>${esc(ar?c.ar:c.en)}</b><div class="sub"><span class="han">${esc(c.zh)}</span> · ${new Date(S.certAt[c.id]).toLocaleDateString(ar?'ar-SA-u-ca-gregory-nu-latn':'en-GB')}</div></div><span aria-hidden="true">📤</span></button>`).join('')}</div>`
   :`<div class="card col" style="align-items:center;text-align:center;gap:8px">${CAPP==='hp'?bao('happy',80):dragon('happy',80)}<b>${ar?'لا شهادات بعد':'No certificates yet'}</b><p class="sub" style="margin:0">${CAPP==='hp'?(ar?'اجتز اختبار بوابة أي مرحلة في رحلة HSK لتحصل على أول شهادة.':'Pass any stage gate on your HSK journey to earn your first certificate.'):(ar?'اجتز بوابة أي فصل في المسار لتحصل على أول شهادة.':'Pass any chapter gate in a track to earn your first certificate.')}</p></div>`}</div>`;
  $('#cb',m).onclick=()=>typeof goBack==='function'?goBack('home'):go('home');
  $$('.certitem',m).forEach(b=>b.onclick=()=>{ SFX.tap(); certSheet(list.find(c=>c.id===b.dataset.id)); }); };
/* announce a newly earned certificate once (checked when Home or Me renders) */
function certCheck(){ const list=certEarned(); S.certSeen=S.certSeen||{}; const n=list.find(c=>!S.certSeen[c.id]); if(!n) return; list.forEach(c=>S.certSeen[c.id]=1); save();
  if(document.querySelector('.sheet')) return; setTimeout(()=>{ if(document.querySelector('.sheet')) return; confetti(70); certSheet(n); },900); }
{ const _ch=SCREENS.home; SCREENS.home=(m,a)=>{ _ch(m,a); try{ certCheck(); }catch(e){} }; }
{ const _cm=SCREENS.me; SCREENS.me=(m,a)=>{ _cm(m,a); try{ const host=m.querySelector('.screen')||m, anchor=$('#fcalb',m)||host.children[1]; if(!anchor||$('#certb',m)) return; const n=certEarned().length, ar=isAr();
  anchor.insertAdjacentHTML('afterend',`<button class="card row fbanner" id="certb"><span class="fbi" aria-hidden="true">🎓</span><div class="grow" style="text-align:start;min-width:0"><b>${ar?'شهاداتي':'My certificates'}</b><div class="sub">${n?(ar?`${n} شهادة جاهزة للمشاركة`:`${n} ready to share`):(ar?'اجتز البوابات لتحصل عليها':'Pass gates to earn them')}</div></div><span class="fcd num">${n}</span></button>`);
  $('#certb',m).onclick=()=>{ SFX.tap(); go('certs'); }; }catch(e){} }; }
