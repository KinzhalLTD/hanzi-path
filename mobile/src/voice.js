// Voice for the web app (see hp/src/voice.js):
//  - voice: reads one studio clip (MP3 bytes) out of a bundled voice pack by its key and returns it as base64.
//  - speak: the best installed system voice (premium > enhanced > compact) for the narrator 'n'; the partner 'p' gets a
//    different voice of similar quality (or a higher pitch), and the promise resolves when the line has finished.
import { Asset } from 'expo-asset';
import * as FS from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { INDEX, PACKS } from './voicePacks';

const packUris = {};
async function packUri(name) {
  if (packUris[name]) return packUris[name];
  const mod = PACKS[name];
  if (!mod) return null;
  const asset = Asset.fromModule(mod);
  if (!asset.localUri) await asset.downloadAsync();
  packUris[name] = asset.localUri || asset.uri;
  return packUris[name];
}

export async function voiceClip({ k }) {
  const e = INDEX.e && INDEX.e[k];
  if (!e) return { ok: false, miss: true };
  const uri = await packUri(INDEX.packs[e[0]]);
  if (!uri) return { ok: false, miss: true };
  const b64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64, position: e[1], length: e[2] });
  return { ok: true, b64 };
}

export function voiceInfo() {
  return { ok: true, clips: INDEX.e ? Object.keys(INDEX.e).length : 0, voices: INDEX.voices || null };
}

let voices = null;
const MALE = /(li-?mu|yun|maged|tarik|hamed|aaron|arthur|daniel|fred|gordon|rishi|tom|alex|evan|nathan)/i;
async function ranked(lang, male) {
  if (!voices) voices = await Speech.getAvailableVoicesAsync().catch(() => []);
  const norm = (s) => String(s || '').toLowerCase().replace('_', '-');
  const L = norm(lang), base = L.split('-')[0];
  let pool = voices.filter((v) => norm(v.language) === L);
  if (!pool.length) pool = voices.filter((v) => norm(v.language).startsWith(base));
  const q = (v) => (/premium/i.test(v.identifier) ? 3 : (v.quality === 'Enhanced' || /enhanced/i.test(v.identifier)) ? 2 : 1);
  const score = (v) => q(v) * 10 + (MALE.test(v.name) === male ? 1 : 0);
  return pool.sort((a, b) => score(b) - score(a)).map((v) => ({ id: v.identifier, q: q(v) }));
}
// The voice cast (same table as VOICE_CAST in cp/src/voice.js): gender + pitch/rate so every character sounds different.
const CAST = { n: ['m', 1, 1], p: ['f', 1, 1], m1: ['m', 1.04, 1.04], m2: ['m', 0.88, 0.93], m3: ['m', 1.1, 1.08], m4: ['m', 0.95, 0.98], m5: ['m', 0.92, 1.02],
  f1: ['f', 0.96, 0.95], f2: ['f', 1.12, 1.06], f3: ['f', 1.03, 1] };
// narrator: best quality (male breaks ties); everyone else: a different voice of their gender and similar quality, spread over
// the cast, else the narrator's voice with the character's pitch
async function pickVoice(lang, role) {
  const [g, pitch, rate] = CAST[role] || CAST.n;
  const nar = (await ranked(lang, true))[0];
  if (role === 'n') return { id: nar && nar.id, pitch: 1, rate: 1 };
  const pool = (await ranked(lang, g === 'm')).filter((v) => !nar || (v.id !== nar.id && v.q >= nar.q - 1));
  const ids = Object.keys(CAST).filter((k) => k !== 'n' && CAST[k][0] === g), ix = Math.max(0, ids.indexOf(role));
  if (pool.length) return { id: pool[ix % pool.length].id, pitch, rate };
  return { id: nar && nar.id, pitch: pitch * (g === 'f' ? 1.18 : 1.08), rate };
}

export async function speakNative({ text, lang = 'zh-CN', rate = 0.8, voice = 'n' }) {
  Speech.stop();
  const { id, pitch, rate: r2 } = await pickVoice(lang, voice);
  return new Promise((res) => {
    const done = () => res({ ok: true });
    Speech.speak(text, { language: lang, rate: Math.max(0.3, Math.min(1.5, rate * (r2 || 1))), pitch, voice: id, onDone: done, onStopped: done, onError: done });
    setTimeout(done, 4000 + String(text).length * 600); // never leave the web app waiting
  });
}
