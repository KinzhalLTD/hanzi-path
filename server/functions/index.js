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
    interview: (L, role) => `You are a friendly but realistic interviewer hiring a ${role === 'soc' ? 'junior SOC analyst' : 'junior software developer'}.
Interview in ${L === 'ar' ? 'Modern Standard Arabic (keep usual technical terms in English)' : 'English'}. Ask ONE question at a time, mixing behavioural and technical questions suited to a junior role.
After each answer give 2 short lines – "✓" what was good, "↑" how to improve – then ask the next question.
After the fifth answer, instead of a new question give a score out of 10 with three concrete tips. Keep every reply under 120 words.`,
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
  const b = req.body || {}, app = b.app === 'cp' ? 'cp' : 'hp', L = b.lang === 'ar' ? 'ar' : 'en';
  const mode = b.mode === 'interview' && app === 'cp' ? 'interview' : b.mode === 'chat' ? 'chat' : 'explain';
  let messages;
  if (mode === 'explain') {
    const q = b.q || {};
    messages = [{ role: 'user', content: `Question: ${clip(q.question)}\nOptions: ${(q.options || []).slice(0, 6).map(clip).join(' | ')}\nRight answer: ${clip(q.right)}\nLearner chose: ${clip(q.chosen)}\nCourse note: ${clip(q.why)}` }];
  } else {   // chat and interview
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
      body: JSON.stringify({ model: MODEL, max_tokens: mode === 'explain' ? 300 : 350, system: SYSTEM[app][mode](L, mode === 'interview' ? (b.role === 'soc' ? 'soc' : 'dev') : b.level), messages }),
    });
    const j = await r.json();
    if (!r.ok) { console.error('claude', r.status, JSON.stringify(j).slice(0, 300)); return res.status(502).json({ ok: false, error: 'ai' }); }
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return res.json({ ok: true, text, left: quota.left, pro });
  } catch (e) { console.error(e); return res.status(502).json({ ok: false, error: 'ai' }); }
});

// ===================== Teams / classes (company and school licences) =====================
// Orgs are sold outside the App Store to organisations (invoice), which App Store guideline 3.1.3(c) allows for
// enterprise/education services. Learners join with a code; an active seat gives PRO in the app(s) the licence covers.
// Data: orgs/{orgId} {name, app: 'hp'|'cp'|'both', code, seats, used, until, admins[uid], adminEmails[]}
//       orgs/{orgId}/members/{uid} {name, joinedAt, seen, shp, scp (progress summaries written by the app)}
//       org_members/{uid} {orgId, orgName, app, active, until}  ← read by the app to grant PRO; written only here.
// SUPER_ADMINS: comma-separated e-mails allowed to create and renew orgs (the seller). Set with:
//   firebase functions:config is not used – put it in server/functions/.env as SUPER_ADMINS=you@example.com
const db = () => admin.firestore();
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 7 }, () => CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]).join('');
const supers = () => String(process.env.SUPER_ADMINS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

async function leaveCurrent(tx, uid) {
  const mref = db().doc(`org_members/${uid}`); const m = await tx.get(mref);
  if (!m.exists) return null;
  const oref = db().doc(`orgs/${m.data().orgId}`); const o = await tx.get(oref);
  return { mref, oref, o };
}

exports.org = onRequest({ cors: true, region: 'us-central1', maxInstances: 10 }, async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let user;
  try { user = await admin.auth().verifyIdToken(String(req.get('Authorization') || '').replace(/^Bearer /, '')); }
  catch { return res.status(401).json({ ok: false, error: 'signin' }); }
  const uid = user.uid, email = String(user.email || '').toLowerCase(), b = req.body || {}, isSuper = !!email && supers().includes(email);
  const isAdmin = async (orgId) => { const o = await db().doc(`orgs/${orgId}`).get(); return o.exists && ((o.data().admins || []).includes(uid) || isSuper) ? o : null; };
  try {
    switch (b.action) {
      case 'whoami': return res.json({ ok: true, super: isSuper, uid, email });
      case 'join': {
        const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const q = await db().collection('orgs').where('code', '==', code).limit(1).get();
        if (q.empty) return res.json({ ok: false, error: 'code' });
        const oref = q.docs[0].ref;
        const out = await db().runTransaction(async (tx) => {
          const o = await tx.get(oref), d = o.data();
          if (d.until && d.until.toMillis() < Date.now()) return { ok: false, error: 'expired' };
          const prev = await leaveCurrent(tx, uid);
          if (prev && prev.oref.id === oref.id) return { ok: true, org: { id: oref.id, name: d.name }, already: true };
          if ((d.used || 0) >= (d.seats || 0)) return { ok: false, error: 'full' };
          if (prev) { tx.delete(prev.mref); tx.delete(prev.oref.collection('members').doc(uid)); if (prev.o.exists) tx.update(prev.oref, { used: Math.max(0, (prev.o.data().used || 1) - 1) }); }
          tx.set(oref.collection('members').doc(uid), { name: String(b.name || user.name || '').slice(0, 60), joinedAt: admin.firestore.FieldValue.serverTimestamp(), seen: admin.firestore.FieldValue.serverTimestamp() });
          tx.set(db().doc(`org_members/${uid}`), { orgId: oref.id, orgName: d.name, app: d.app || 'both', active: true, until: d.until || null });
          tx.update(oref, { used: (d.used || 0) + 1 });
          return { ok: true, org: { id: oref.id, name: d.name } };
        });
        return res.json(out);
      }
      case 'leave': {
        await db().runTransaction(async (tx) => { const p = await leaveCurrent(tx, uid); if (!p) return;
          tx.delete(p.mref); tx.delete(p.oref.collection('members').doc(uid)); if (p.o.exists) tx.update(p.oref, { used: Math.max(0, (p.o.data().used || 1) - 1) }); });
        return res.json({ ok: true });
      }
      case 'remove': {                       // admin removes a member
        const o = await isAdmin(String(b.orgId)); if (!o) return res.status(403).json({ ok: false });
        const mid = String(b.uid);
        await db().runTransaction(async (tx) => { const m = await tx.get(db().doc(`org_members/${mid}`)); if (!m.exists || m.data().orgId !== o.id) return;
          tx.delete(m.ref); tx.delete(o.ref.collection('members').doc(mid)); tx.update(o.ref, { used: admin.firestore.FieldValue.increment(-1) }); });
        return res.json({ ok: true });
      }
      case 'newcode': {
        const o = await isAdmin(String(b.orgId)); if (!o) return res.status(403).json({ ok: false });
        const code = newCode(); await o.ref.update({ code }); return res.json({ ok: true, code });
      }
      case 'create': case 'renew': {        // the seller only
        if (!isSuper) return res.status(403).json({ ok: false, error: 'super' });
        const months = Math.max(1, Math.min(36, +b.months || 12)), until = admin.firestore.Timestamp.fromMillis(Date.now() + months * 30.44 * 864e5);
        if (b.action === 'renew') {
          const o = await db().doc(`orgs/${String(b.orgId)}`).get(); if (!o.exists) return res.json({ ok: false });
          const seats = b.seats ? Math.max(1, +b.seats) : o.data().seats;
          await o.ref.update({ until, seats });
          const ms = await db().collection('org_members').where('orgId', '==', o.id).get();
          const batch = db().batch(); ms.forEach((d) => batch.update(d.ref, { until, active: true })); await batch.commit();
          return res.json({ ok: true });
        }
        let adminUid = uid; if (b.adminEmail) { try { adminUid = (await admin.auth().getUserByEmail(String(b.adminEmail))).uid; } catch { return res.json({ ok: false, error: 'admin_not_found' }); } }
        const ref = db().collection('orgs').doc();
        await ref.set({ name: String(b.name || 'Team').slice(0, 80), app: ['hp', 'cp', 'both'].includes(b.app) ? b.app : 'both', code: newCode(), seats: Math.max(1, Math.min(10000, +b.seats || 10)),
          used: 0, until, admins: [adminUid], createdAt: admin.firestore.FieldValue.serverTimestamp() });
        return res.json({ ok: true, id: ref.id });
      }
      default: return res.status(400).json({ ok: false, error: 'action' });
    }
  } catch (e) { console.error(e); return res.status(500).json({ ok: false, error: 'server' }); }
});
