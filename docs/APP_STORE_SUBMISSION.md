# Cipher Path – App Store submission kit

Order: website → products (IN_APP_PURCHASES.md) → AdMob ids (ADS.md) → build (BUILD_IOS.md) → listing below → submit.

## 1. Website (privacy, terms, support, app-ads.txt) on Firebase Hosting
A second site inside the existing Firebase project, so nothing new to pay for. In Cloud Shell:
```bash
cd ~/cipher-path/website && npm i -g firebase-tools && firebase login --no-localhost
firebase hosting:sites:create cipher-path-kinzhal --project hanzi-path-64170
firebase target:apply hosting cipher cipher-path-kinzhal --project hanzi-path-64170
firebase deploy --only hosting:cipher --project hanzi-path-64170
```
URLs: `https://cipher-path-kinzhal.web.app/privacy.html` · `/terms.html` · `/support.html` · `/app-ads.txt`.
(If the name is taken, pick another, then replace `cipher-path-kinzhal` in `cp/src/core.js` and `mobile/scripts/check-store.js` and rebuild.)

## 2. Listing – English (U.S.)
- **Name** (≤ 30): Cipher Path: Code & Security
- **Subtitle** (≤ 30): Learn to code, defend, speak
- **Promotional text** (≤ 170): Software engineering and cybersecurity in short lessons and real labs – plus the Chinese your global tech team speaks. New daily challenge every day.
- **Keywords** (≤ 100 bytes): coding,cybersecurity,programming,javascript,ctf,pentest,security,learn,chinese,mandarin,exam
- **Description:**
Cipher Path teaches software engineering and cybersecurity the practical way: read a short lesson, prove it in a lab, and learn how professionals say it in Chinese.

TWO TRACKS, 24 MODULES
• Software engineering: fundamentals, data structures, algorithms and Big-O, object-oriented design, design patterns, Git, testing, web and APIs, databases and SQL, system design, DevOps and cloud, agile.
• Cybersecurity: the CIA triad and risk, cryptography, identity and access, network security, the OWASP Top 10, secure coding, malware and phishing, security operations, incident response and forensics, cloud security and DevSecOps, governance and compliance (ISO 27001, NIST CSF, Saudi NCA controls, PDPL), and ethical hacking methodology.

120 LESSONS, 384 BOSS QUESTIONS
Every boss fight draws 8 questions from a bank of 16, so rematches stay fresh. Chapter gates test a whole chapter, and Weak Spots brings back every question you missed until you get it right twice.

HANDS-ON LABS – SAFE AND LOCAL
• 24 code labs: write real JavaScript, run automatic tests, see what failed and why.
• Phishing detective: tap the red flags in realistic emails.
• Log hunter: find the brute-force login, the SQL injection, the data leaking through DNS.
• Secure code review: spot the vulnerable line and name the flaw, then see the safer fix.
• Cipher workshop: decode Base64, hex, ROT, XOR and more to capture the flag.
• Firewall simulator and a password & hash lab.
Every scenario is fictional and runs on your phone; nothing touches real systems.

TECH CHINESE
241 professional terms with pinyin and audio, spaced-repetition practice, and 12 voiced workplace conversations, each character with a voice of their own: stand-ups, code reviews, release rollbacks, incident calls, audits, a cloud data leak and pen-test scoping.

PLAYFUL BY DESIGN
Meet Lóngbǎo, the debugging dragon who tells terrible programmer jokes. Every module ends with a boss fight against monsters like the Infinite Loop Demon and the Merge Conflict Dragon. Open a red envelope every day, draw your coding fortune, chain answers into firecracker combos, collect 17 imperial seals and rise from Code Apprentice to Code Sage.

ALSO: practice exams with a breakdown by module, certificates, a daily challenge, quick games, streaks, dark and light themes, full Arabic and English.

Cipher Path PRO unlocks every module, lab, exam and conversation and removes ads. Monthly and yearly subscriptions renew automatically unless cancelled at least 24 hours before the end of the period in your App Store account settings. Terms: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ · Privacy: https://cipher-path-kinzhal.web.app/privacy.html

## 3. Listing – Arabic
- **الاسم** (≤ 30): مسار الشيفرة: برمجة وأمن
- **العنوان الفرعي** (≤ 30): تعلّم البرمجة والأمن السيبراني
- **النص الترويجي** (≤ 170): هندسة البرمجيات والأمن السيبراني في دروس قصيرة ومختبرات حقيقية، مع الصينية التي يتحدثها فريقك التقني. تحدٍّ جديد كل يوم.
- **الكلمات المفتاحية** (≤ 100 بايت): برمجة,أمن سيبراني,اختراق أخلاقي,جافاسكربت,صينية,كود
- **الوصف:**
يعلّمك مسار الشيفرة هندسة البرمجيات والأمن السيبراني بطريقة عملية: درس قصير، ثم مختبر يثبت فهمك، ثم المصطلح كما يقوله المحترفون بالصينية.

مساران و24 وحدة
• هندسة البرمجيات: الأساسيات، وهياكل البيانات، والخوارزميات والتعقيد، والتصميم كائني التوجه، وأنماط التصميم، وGit، والاختبار، والويب والواجهات البرمجية، وقواعد البيانات وSQL، وتصميم الأنظمة، وDevOps والسحابة، والمنهجيات الرشيقة.
• الأمن السيبراني: ثالوث السرية والسلامة والإتاحة، والتشفير، وإدارة الهوية، وأمن الشبكات، وقائمة OWASP العشرة، والبرمجة الآمنة، والبرمجيات الخبيثة والتصيد، والعمليات الأمنية، والاستجابة للحوادث، وأمن السحابة، والحوكمة والامتثال (ISO 27001 وNIST وضوابط الهيئة الوطنية للأمن السيبراني ونظام حماية البيانات الشخصية)، ومنهجية الاختراق الأخلاقي.

120 درسًا و384 سؤال معركة
كل معركة تختار 8 أسئلة من بنك من 16 سؤالًا، فلا تتكرر المواجهة. بوابات الفصول تختبر الفصل كاملًا، و«نقاط الضعف» تعيد كل سؤال أخطأت فيه حتى تجيبه صحيحًا مرتين.

مختبرات عملية وآمنة
• 24 مختبر كود: اكتب جافاسكربت حقيقية وشغّل الاختبارات الآلية.
• محقق التصيد، وصائد السجلات، ومراجعة الكود الآمن، وورشة الشيفرات لالتقاط العلم، ومحاكي الجدار الناري، ومختبر كلمات المرور والتجزئة.
كل السيناريوهات خيالية وتعمل على جهازك فقط، ولا تمس أي نظام حقيقي.

الصينية التقنية
241 مصطلحًا مهنيًا بالبينيين والنطق، ومراجعة متباعدة، و12 محادثة عمل مسموعة لكل شخصية فيها صوتها الخاص.

وأيضًا: اختبارات تجريبية، وشهادات، وتحدٍّ يومي، وألعاب سريعة، ومظهر داكن وفاتح، وعربية وإنجليزية كاملتان.

## 4. Category, age rating, privacy
- **Category:** Education (secondary: Developer Tools). **Age rating:** 4+ (no objectionable content; the security content is defensive education).
- **App Privacy** (optional account with Sign in with Apple / Google; guests keep everything on the device):

| Data type | Purpose | Linked to user | Tracking |
|---|---|---|---|
| Name, email address (only when signed in) | App functionality (account, sync) | Yes | No |
| User ID (only when signed in) | App functionality (account, sync, PRO across devices) | Yes | No |
| Other user content: learning progress (only when signed in) | App functionality (cloud sync) | Yes | No |
| Product interaction (Firebase Analytics) | Analytics | No | No |
| Device ID (IDFA, only after the ATT prompt) | Third-party advertising | No | Yes |
| Product interaction, advertising data | Third-party advertising | No | Yes |
| Coarse location (from IP, by the ad SDK) | Third-party advertising | No | Yes |
| Purchase history | App functionality (PRO status, via RevenueCat) | No | No |
| Crash data (ad and purchase SDKs) | App functionality | No | No |

## 5. Notes for App Review
> Cipher Path is an educational app. An account is optional: Sign in with Apple or Google only backs up and syncs progress (Firebase); "Continue as guest" gives full access. Accounts can be deleted in the app: Me → Account → Delete account (guideline 5.1.1(v)).
> The code labs let learners write JavaScript and run it against tests inside a sandboxed Web Worker in the app's web view (guideline 2.5.2 exception for educational apps that let students test code); the code cannot reach the network, other apps or device APIs, and it is never downloaded.
> All security content is defensive education with fictional companies and data (phishing emails, logs, code snippets, encoded "flags"). The app contains no hacking tools and nothing connects to real systems; the ethical-hacking module teaches authorisation, scope, reporting and responsible disclosure.
> To see PRO content, use the sandbox purchase on the paywall (PRO chip at the top of any screen).

## 6. Screenshots
6.9" (1320 × 2868) or 6.5" (1284 × 2778): home, a lesson with code, a code lab passing, phishing detective, cipher workshop, Tech Chinese, conversation, exam result. Arabic set with the same screens.
