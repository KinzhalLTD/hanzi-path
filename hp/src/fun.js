/* ===== Bao 包包 — the app's mascot: a cheeky steamed bun ===== */
function bao(mood='happy',size=72){
  const eyes={happy:'<path d="M37 52q4-5 8 0M63 52q4-5 8 0" stroke="#3b2408" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
    wow:'<circle cx="41" cy="52" r="4.5" fill="#3b2408"/><circle cx="67" cy="52" r="4.5" fill="#3b2408"/><circle cx="42.5" cy="50.5" r="1.4" fill="#fff"/><circle cx="68.5" cy="50.5" r="1.4" fill="#fff"/>',
    oops:'<path d="M36 49l9 6M45 49l-9 6M63 49l9 6M72 49l-9 6" stroke="#3b2408" stroke-width="3" stroke-linecap="round"/>',
    cool:'<rect x="30" y="46" width="20" height="10" rx="4" fill="#1d1512"/><rect x="58" y="46" width="20" height="10" rx="4" fill="#1d1512"/><path d="M50 50h8" stroke="#1d1512" stroke-width="3"/>',
    think:'<circle cx="41" cy="52" r="3.6" fill="#3b2408"/><path d="M62 52h10" stroke="#3b2408" stroke-width="3.2" stroke-linecap="round"/>'}[mood]||'';
  const mouth={happy:'<path d="M46 63q8 8 16 0" stroke="#3b2408" stroke-width="3" fill="#c23b2c" stroke-linecap="round"/>',
    wow:'<ellipse cx="54" cy="66" rx="5" ry="6" fill="#c23b2c" stroke="#3b2408" stroke-width="2.5"/>',
    oops:'<path d="M46 67q8-6 16 0" stroke="#3b2408" stroke-width="3" fill="none" stroke-linecap="round"/>',
    cool:'<path d="M45 63q9 7 18-1" stroke="#3b2408" stroke-width="3" fill="none" stroke-linecap="round"/>',
    think:'<path d="M48 66h12" stroke="#3b2408" stroke-width="3" stroke-linecap="round"/>'}[mood]||'';
  return `<svg class="bao bao-${mood}" width="${size}" height="${size}" viewBox="0 0 108 100" aria-hidden="true">
    <ellipse cx="54" cy="94" rx="34" ry="4" fill="rgba(0,0,0,.35)"/>
    <path d="M10 66C10 38 30 22 54 22s44 16 44 44c0 16-14 24-44 24S10 82 10 66z" fill="#fbf3e2" stroke="#d9c39a" stroke-width="2"/>
    <path d="M54 14c-6 4-10 9-10 14 4-3 7-4 10-4s6 1 10 4c0-5-4-10-10-14z" fill="#f3e6c8" stroke="#d9c39a" stroke-width="2"/>
    <path d="M40 30q6 6 6 14M68 30q-6 6-6 14M54 24v14" stroke="#e6d6b8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="30" cy="64" rx="7" ry="4.5" fill="#f4a7a0" opacity=".75"/><ellipse cx="78" cy="64" rx="7" ry="4.5" fill="#f4a7a0" opacity=".75"/>
    ${eyes}${mouth}</svg>`; }
const QUIPS={
 ar:{ok:['شيه شيه! أنت عبقري 🥢','دماغك أسخن من الشاي الصيني ☕','حتى الباندا صفّقت لك 🐼','ممتاز! كونفوشيوس فخور بك','واو! كأنك وُلدت في بكين','صح! بدأت أشمّ رائحة الطلاقة','هذا ما أسمّيه «هاو» حقيقي 好!','أسرع من قطار شنغهاي السريع 🚄'],
  bad:['ولا يهمّك، حتى أنا كنت عجينًا يومًا 🥟','قريب! النغمات تحبّ تلعب معنا','خطأ صغير، عقل كبير 💪','لا بأس، الصين نفسها بُنيت في 5000 سنة','أوه! حتى الأسد يتعثّر أحيانًا 🦁','جرّب مرة ثانية، أنا أؤمن بك يا بطل'],
  streak:['سلسلة نارية 🔥 لا أحد يوقفك!','أنت على وضع التنين 🐉','الصحون تطير من الحماس! 🍜'],
  perfect:['درس مثالي! سأخبر أمي باو عنك','مئة بالمئة! تستحق طبق زلابية كامل 🥟'],
  idle:['اكتب حرفًا بيدك اليوم ✍️ أصابعك ستتذكّره!','هل جرّبت تشغيل كود بمتغيرات صينية؟ 💻','الموسيقى التي تسمعها عزف حقيقي على الكوتو والشاكوهاتشي 🎶','انطق كلمة أمام الميكروفون وسأعطيك درجة 🎤','تعلّم كلمة واحدة اليوم وسأرقص لك 💃','أنا باو، رفيقك اللذيذ في رحلة الصينية!','هل تعلم؟ أنا مصنوع من عجين وأحلام']},
 en:{ok:['Xièxie! You\'re a genius 🥢','Your brain is hotter than jasmine tea ☕','Even the panda clapped 🐼','Confucius would be proud','Were you born in Beijing?!','Correct! I can smell fluency','Now that\'s a real 好!','Faster than a bullet train 🚄'],
  bad:['No worries — I was just dough once 🥟','Close! Tones love playing tricks','Small slip, big brain 💪','China wasn\'t built in a day either','Even lions trip sometimes 🦁','Try again, champ. I believe in you'],
  streak:['On fire 🔥 nobody can stop you!','Dragon mode activated 🐉','Bowls are flying with excitement 🍜'],
  perfect:['Perfect lesson! I\'m telling Mama Bao','100%! You deserve a whole plate of dumplings 🥟'],
  idle:['Write one character by hand today ✍️ your fingers will remember!','Ever run code with Chinese variable names? 💻','That music is real koto and shakuhachi 🎶','Say a word to the mic and I\'ll score you 🎤','Learn one word today and I\'ll dance 💃','I\'m Bao, your delicious Chinese buddy!','Fun fact: I\'m made of dough and dreams']}};
const quip=k=>{ const a=QUIPS[S.lang||'en'][k]; return a[Math.random()*a.length|0]; };
