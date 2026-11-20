// Cipher Path – native side of the WebView bridge (Expo, iOS first).
// Handles: Sign in with Apple / Google (Firebase Auth), cloud sync (Firestore cipher_users/{uid}), account deletion,
// in-app purchases (RevenueCat), ads (AdMob + consent), local notifications, speech, haptics, sharing,
// theme (status bar) and analytics events (Firebase Analytics). Same design as Hanzi Path's HanziBridge.
// Messages arrive from the web app as JSON: {type, id?, ...payload}; replies go back via window.__fromNative({id, ...}).
import React, { useRef, useEffect, useState } from 'react';
import { Share, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { setStatusBarStyle } from 'expo-status-bar';
import { voiceClip, voiceInfo, speakNative } from './voice';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { OAuthProvider, GoogleAuthProvider, signInWithCredential, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent, setUser as setAnalyticsUser } from './analytics';
import { auth, db, analytics, USERS, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, TUTOR_URL } from './firebase';
import { initPurchases, buy, restore, linkUser } from './purchases';
import { initAds, showInterstitial, showRewarded, showPrivacyOptions } from './ads';

GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID, webClientId: GOOGLE_WEB_CLIENT_ID });
const publicUser = (u, provider) => ({ uid: u.uid, name: u.displayName || '', email: u.email || '', provider });
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

// Folder that holds the bundled page; WebKit may read files only inside it.
const dirOf = (u) => u.slice(0, u.lastIndexOf('/') + 1);

export default function CipherBridge({ uri, onReady }) {
  const web = useRef(null);
  // theme chosen in the web app ('dark' | 'light'): status-bar icons and the colour behind the web view follow it
  const [light, setLight] = useState(false);
  const reply = (id, data) => web.current?.injectJavaScript(`window.__fromNative(${JSON.stringify({ id, ...data })});true;`);
  const push = (data) => web.current?.injectJavaScript(`window.__fromNative&&window.__fromNative(${JSON.stringify(data)});true;`);
  // last known purchase state, re-sent whenever the page (re)loads
  const store = useRef({ pro: null, prices: null, ads: null });
  const sendStore = () => {
    if (store.current.prices) push({ type: 'prices', ...store.current.prices });
    if (store.current.pro !== null) push({ type: 'pro', active: store.current.pro });
    if (store.current.ads) push(store.current.ads);
  };
  useEffect(() => {
    (async () => {
      // purchases first, so ads are never initialised for PRO users
      await initPurchases({
        onPro: (active) => { store.current.pro = active; push({ type: 'pro', active }); },
        onPrices: (p) => { store.current.prices = p; push({ type: 'prices', ...p }); },
      });
      if (auth.currentUser) { setAnalyticsUser(auth.currentUser.uid); linkUser(auth.currentUser.uid); }
      const a = await initAds({ getPro: () => store.current.pro === true });   // consent form → ATT → AdMob
      store.current.ads = { type: 'ads', privacy: !!a.privacyRequired };
      push(store.current.ads);
    })();
  }, []);

  const handlers = {
    // ---------- accounts ----------
    'auth:apple': async () => {
      const rawNonce = Crypto.randomUUID();
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      try {
        const r = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: hashed });
        const cred = new OAuthProvider('apple.com').credential({ idToken: r.identityToken, rawNonce });
        const { user } = await signInWithCredential(auth, cred);
        const name = [r.fullName?.givenName, r.fullName?.familyName].filter(Boolean).join(' ');
        setAnalyticsUser(user.uid); await linkUser(user.uid);
        return { ok: true, user: { ...publicUser(user, 'apple'), name: user.displayName || name } };
      } catch (e) { return { ok: false, cancelled: e.code === 'ERR_REQUEST_CANCELED', error: String(e.message || e) }; }
    },
    'auth:google': async () => {
      try {
        await GoogleSignin.hasPlayServices();
        const r = await GoogleSignin.signIn();
        if (r.type === 'cancelled') return { ok: false, cancelled: true };
        const idToken = r.data?.idToken ?? r.idToken;
        const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        setAnalyticsUser(user.uid); await linkUser(user.uid);
        return { ok: true, user: publicUser(user, 'google') };
      } catch (e) { return { ok: false, error: String(e.message || e) }; }
    },
    'auth:signOut': async () => { await signOut(auth); try { await GoogleSignin.signOut(); } catch {} await linkUser(null); return { ok: true }; },
    // App Store guideline 5.1.1(v): accounts must be deletable inside the app.
    'auth:delete': async () => {
      const u = auth.currentUser; if (!u) return { ok: false };
      try { await deleteDoc(doc(db, USERS, u.uid)); await deleteUser(u); await linkUser(null); return { ok: true }; }
      catch (e) { return { ok: false, needsRecentLogin: e.code === 'auth/requires-recent-login', error: String(e.message || e) }; }
    },
    // ---------- cloud sync: one document per learner ----------
    'sync:pull': async ({ uid }) => {
      if (!auth.currentUser || auth.currentUser.uid !== uid) return { ok: false };
      const s = await getDoc(doc(db, USERS, uid));
      return s.exists() ? { ok: true, data: s.data().progress, updatedAt: s.data().updatedAt } : { ok: true, data: null };
    },
    // ---------- AI tutor: the learner's ID token proves who asks; the server checks the plan and the daily limit ----------
    tutor: async ({ req }) => {
      if (!auth.currentUser) return { ok: false, error: 'signin' };
      try {
        const token = await auth.currentUser.getIdToken();
        const r = await fetch(TUTOR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(req || {}) });
        return await r.json();
      } catch { return { ok: false, error: 'net' }; }
    },
    'sync:push': async ({ uid, data, updatedAt }) => {
      if (!auth.currentUser || auth.currentUser.uid !== uid) return { ok: false };
      await setDoc(doc(db, USERS, uid), { progress: data, updatedAt, serverTime: serverTimestamp() }, { merge: true });
      return { ok: true };
    },
    // ---------- notifications (local, no server needed) ----------
    'notify:permission': async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      return { ok: true, granted: status === 'granted' };
    },
    'notify:schedule': async ({ items }) => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const it of items || []) {
        const trigger = it.repeat === 'daily'
          ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: it.hour, minute: it.minute }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(it.at) };
        if (it.at && new Date(it.at) < new Date()) continue;
        await Notifications.scheduleNotificationAsync({ identifier: it.id, content: { title: it.title, body: it.body }, trigger });
      }
      return { ok: true };
    },
    // ---------- device ----------
    theme: async ({ theme }) => { const l = theme === 'light'; setLight(l); setStatusBarStyle(l ? 'dark' : 'light', true); },
    speak: (p) => speakNative(p),
    voice: (p) => voiceClip(p),
    voiceInfo: async () => voiceInfo(),
    speakStop: async () => Speech.stop(),
    haptic: async ({ kind }) => {
      if (kind === 'error') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (kind === 'select') return Haptics.selectionAsync();
      return Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    },
    share: async ({ text, image }) => Share.share(image ? { url: image, message: text } : { message: text }),   // image: PNG data URL (certificates)
    track: async ({ ev, props }) => { try { logEvent(ev, props || {}); } catch {} },
    // ---------- in-app purchases ----------
    purchase: async ({ sku }) => buy(sku),
    restore: async () => restore(),
    openUrl: async ({ url }) => { if (/^https:\/\//.test(url)) await Linking.openURL(url); },
    // ---------- ads (free users) ----------
    interstitial: async () => showInterstitial(),
    rewarded: async () => showRewarded(),
    'ads:privacy': async () => showPrivacyOptions(),
  };

  const onMessage = async (e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    const h = handlers[msg.type];
    // Unknown request: answer at once so the page never waits for a timeout.
    if (!h) { if (msg.id) reply(msg.id, { ok: false, unsupported: true }); return; }
    try { const r = await h(msg); if (msg.id) reply(msg.id, r || { ok: true }); }
    catch (err) { if (msg.id) reply(msg.id, { ok: false, error: String(err.message || err) }); }
  };

  // Only the bundled page itself loads inside the app; any other link opens in Safari.
  const onNav = (req) => {
    if (req.url.startsWith('file://') || req.url.startsWith('about:') || req.url.startsWith('blob:') || req.isTopFrame === false) return true;
    if (/^https:\/\//.test(req.url)) Linking.openURL(req.url).catch(() => {});
    return false;
  };

  return (
    <WebView ref={web} originWhitelist={['*']} source={{ uri }}
      allowFileAccess allowingReadAccessToURL={dirOf(uri)}
      onMessage={onMessage} onLoadEnd={() => { sendStore(); onReady?.(); }}
      onShouldStartLoadWithRequest={onNav}
      onContentProcessDidTerminate={() => web.current?.reload()}
      allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} javaScriptEnabled domStorageEnabled
      contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      bounces={false} overScrollMode="never" allowsBackForwardNavigationGestures={false}
      setSupportMultipleWindows={false} webviewDebuggingEnabled={__DEV__}
      allowsLinkPreview={false} hideKeyboardAccessoryView={false} keyboardDisplayRequiresUserAction={false}
      style={{ flex: 1, backgroundColor: light ? '#f6eddd' : '#140b0a' }} />
  );
}
