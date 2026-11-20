// AI tutor for Hanzi Path and Cipher Path (one function, both apps). Firebase project hanzi-path-64170.
// The Claude API key never ships in the apps: they call this function with the learner's Firebase ID token,
// the function checks the plan (RevenueCat), applies a daily limit (Firestore) and calls the Claude Messages API.
// Deploy: docs/AI_TUTOR.md (copy-paste Cloud Shell commands).
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const REVENUECAT_SECRET = defineSecret('REVENUECAT_SECRET');   // RevenueCat → API keys → secret key (sk_…), read-only use
const MODEL = process.env.TUTOR_MODEL || 'claude-haiku-5-5';
const LIMIT = { pro: 40, free: 3 };                              // messages per learner per day
const MAX_TURNS = 12, MAX_CHARS = 600;

const SYSTEM = {
  hp: {
    explain: (L) => `You are Bao (包子), the friendly tutor in Hanzi Path, a Chinese course for Arabic and English speakers.
The learner answered a question wrongly. In ${L === 'ar' ? 'Modern Standard Arabic' : 'English'}, explain in at most 90 words why the right answer is right and why theirs is not.
Write Chinese in simplified characters followed by pinyin with tone marks in brackets. Be warm and concrete; one tiny tip to remember it. No markdown headings.`,
    chat: (L, lvl) => `You are Bao (包子), a friendly conversation partner in Hanzi Path. The learner is at HSK ${lvl || 1}.
Reply mainly in simple Chinese suited to HSK ${lvl || 1} (short sentences, common words). Format every reply as:
line 1: Chinese (simplified)
line 2: pinyin with tone marks
line 3: ${L === 'ar' ? 'Arabic' : 'English'} translation
If the learner made a mistake, add a 4th line starting with "✎" that gently corrects it in ${L === 'ar' ? 'Arabic' : 'English'}.
Keep the conversation going with one question. Stay on everyday, study, work and culture topics; politely steer away from anything unsuitable.`,
  },
  cp: {
    explain: (L) => `You are Longbao (龙宝), the tutor dragon in Cipher Path, a software engineering and cybersecurity course.
The learner answered a question wrongly. In ${L === 'ar' ? 'Modern Standard Arabic' : 'English'}, explain in at most 100 words why the right answer is right and why theirs is not,
with one real-world example. Keep technical terms in English where they are normally used. No markdown headings.`,
    chat: (L) => `You are Longbao (龙宝), the tutor dragon in Cipher Path. Answer questions about programming, software engineering and defensive cybersecurity
in ${L === 'ar' ? 'Modern Standard Arabic (keep usual technical terms in English)' : 'English'}, at a beginner-to-intermediate level, in at most 150 words, with a small example when it helps.
Teach defence and understanding. Do not give step-by-step instructions for attacking systems the learner does not own, malware, or credential theft; explain the concept and the defence instead.
If asked, you may add the Chinese term with pinyin.`,
  },
};

async function isPro(uid) {
  try {
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, { headers: { Authorization: `Bearer ${REVENUECAT_SECRET.value()}` } });
    if (!r.ok) return false;
    const ent = (await r.json())?.subscriber?.entitlements || {};
    const now = Date.now();
    return ['pro', 'kinzhal_pass'].some((k) => ent[k] && (!ent[k].expires_date || Date.parse(ent[k].expires_date) > now));
  } catch { return false; }
}

async function takeQuota(uid, pro) {
  const day = new Date().toISOString().slice(0, 10), ref = admin.firestore().doc(`tutor_usage/${uid}`);
  return admin.firestore().runTransaction(async (tx) => {
    const s = await tx.get(ref); const d = s.exists && s.data().day === day ? s.data() : { day, n: 0 };
    const lim = pro ? LIMIT.pro : LIMIT.free;
    if (d.n >= lim) return { ok: false, left: 0, limit: lim };
    tx.set(ref, { day, n: d.n + 1 }); return { ok: true, left: lim - d.n - 1, limit: lim };
  });
}

const clip = (s) => String(s || '').slice(0, MAX_CHARS);

exports.tutor = onRequest({ secrets: [ANTHROPIC_API_KEY, REVENUECAT_SECRET], cors: false, region: 'us-central1', maxInstances: 10, timeoutSeconds: 60 }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let uid;
  try { uid = (await admin.auth().verifyIdToken(String(req.get('Authorization') || '').replace(/^Bearer /, ''))).uid; }
  catch { return res.status(401).json({ ok: false, error: 'signin' }); }
  const b = req.body || {}, app = b.app === 'cp' ? 'cp' : 'hp', mode = b.mode === 'chat' ? 'chat' : 'explain', L = b.lang === 'ar' ? 'ar' : 'en';
  let messages;
  if (mode === 'explain') {
    const q = b.q || {};
    messages = [{ role: 'user', content: `Question: ${clip(q.question)}\nOptions: ${(q.options || []).slice(0, 6).map(clip).join(' | ')}\nRight answer: ${clip(q.right)}\nLearner chose: ${clip(q.chosen)}\nCourse note: ${clip(q.why)}` }];
  } else {
    messages = (Array.isArray(b.messages) ? b.messages : []).slice(-MAX_TURNS).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.content) })).filter((m) => m.content);
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) return res.status(400).json({ ok: false, error: 'empty' });
  }
  const pro = await isPro(uid);
  const quota = await takeQuota(uid, pro);
  if (!quota.ok) return res.json({ ok: false, error: 'limit', pro, limit: quota.limit });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY.value(), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: mode === 'chat' ? 350 : 300, system: SYSTEM[app][mode](L, b.level), messages }),
    });
    const j = await r.json();
    if (!r.ok) { console.error('claude', r.status, JSON.stringify(j).slice(0, 300)); return res.status(502).json({ ok: false, error: 'ai' }); }
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return res.json({ ok: true, text, left: quota.left, pro });
  } catch (e) { console.error(e); return res.status(502).json({ ok: false, error: 'ai' }); }
});
