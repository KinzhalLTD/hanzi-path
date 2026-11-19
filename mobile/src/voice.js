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
// narrator: best quality (male breaks ties); partner: a different voice of similar quality, else the narrator's with a higher pitch
async function pickVoice(lang, role) {
  const nar = (await ranked(lang, true))[0];
  if (role !== 'p') return { id: nar && nar.id, pitch: 1 };
  const alt = (await ranked(lang, false)).find((v) => !nar || (v.id !== nar.id && v.q >= nar.q - 1));
  return alt ? { id: alt.id, pitch: 1 } : { id: nar && nar.id, pitch: 1.18 };
}

export async function speakNative({ text, lang = 'zh-CN', rate = 0.8, voice = 'n' }) {
  Speech.stop();
  const { id, pitch } = await pickVoice(lang, voice);
  return new Promise((res) => {
    const done = () => res({ ok: true });
    Speech.speak(text, { language: lang, rate, pitch, voice: id, onDone: done, onStopped: done, onError: done });
    setTimeout(done, 4000 + String(text).length * 600); // never leave the web app waiting
  });
}
