// Analytics → Google Analytics 4 (the reports Firebase shows) through the GA4 Measurement Protocol.
// Why not 'firebase/analytics': the Firebase JS SDK only runs in browsers (isSupported() is false in React Native),
// so events were silently dropped. The Measurement Protocol is a plain HTTPS call – no native module, works in Expo.
// Setup (docs/GROWTH.md → Analytics): GA4 property → Admin → Data streams → add a Web stream (any URL, e.g. the
// privacy site) → copy its Measurement ID (G-…) → "Measurement Protocol API secrets" → Create → paste both below.
// Only anonymous product events are sent (no names, e-mails or answers); the client id is a random id made by the app.
import { AppState } from 'react-native';

export const GA4_MEASUREMENT_ID = 'G-PASTE_MEASUREMENT_ID';
export const GA4_API_SECRET = 'PASTE_API_SECRET';
const ON = /^G-[A-Z0-9]+$/.test(GA4_MEASUREMENT_ID) && !/PASTE/.test(GA4_API_SECRET);

let queue = [], clientId = null, userId = null, timer = null;
const session = Date.now();
const clean = (o) => { const r = {}; for (const [k, v] of Object.entries(o || {})) { if (v == null || k === 'cid') continue;
  const key = k.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40); r[key] = typeof v === 'number' ? v : String(v).slice(0, 100); } return r; };

export function setUser(uid) { userId = uid || null; }

/** ev: snake_case name ≤ 40 chars; props.cid (from the web app) is the stable anonymous client id. */
export function logEvent(ev, props = {}) {
  if (!ON) return;
  if (props.cid) clientId = String(props.cid);
  queue.push({ name: String(ev).replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40), params: { ...clean(props), session_id: String(session), engagement_time_msec: 100 } });
  if (queue.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 8000);
}

export async function flush() {
  clearTimeout(timer); timer = null;
  if (!ON || !queue.length || !clientId) return;
  const events = queue.splice(0, 25);
  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, ...(userId ? { user_id: userId } : {}), events }),
    });
  } catch { queue.unshift(...events.slice(0, 50)); }
  if (queue.length) timer = setTimeout(flush, 3000);
}

AppState.addEventListener('change', (s) => { if (s !== 'active') flush(); });
export const analyticsReady = ON;
