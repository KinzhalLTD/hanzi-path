// Hanzi Path – native side of the WebView bridge (Expo, iOS first).
// Handles: Sign in with Apple / Google (Firebase Auth), cloud sync (Firestore), account deletion,
// in-app purchases (RevenueCat), ads (AdMob + consent), local notifications, speech, haptics, sharing and analytics events.
// Messages arrive from the web app as JSON: {type, id?, ...payload}; replies go back via window.__fromNative({id, ...}).
import React, { useRef, useEffect } from 'react';
import { Share, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { OAuthProvider, GoogleAuthProvider, signInWithCredential, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { auth, db, analytics, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './firebase';
import { initPurchases, buy, restore, linkUser } from './purchases';
import { initAds, showInterstitial, showRewarded, showPrivacyOptions } from './ads';

GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID, webClientId: GOOGLE_WEB_CLIENT_ID });
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

const publicUser = (u, provider) => ({ uid: u.uid, name: u.displayName || '', email: u.email || '', provider });

// Folder that holds the bundled page; WebKit may read files only inside it.
const dirOf = (u) => u.slice(0, u.lastIndexOf('/') + 1);

export default function HanziBridge({ uri, onReady }) {
  const web = useRef(null);
  const reply = (id, data) => web.current?.injectJavaScript(`window.__fromNative(${JSON.stringify({ id, ...data })});true;`);
  const push = (data) => web.current?.injectJavaScript(`window.__fromNative&&window.__fromNative(${JSON.stringify(data)});true;`);
  // last known purchase state, re-sent whenever the page (re)loads
  const store = useRef({ pro: null, prices: null });
  const sendStore = () => {
    if (store.current.prices) push({ type: 'prices', ...store.current.prices });
    if (store.current.pro !== null) push({ type: 'pro', active: store.current.pro });
    if (store.current.ads) push(store.current.ads);
  };
  useEffect(() => {
    (async () => {
      // purchases first, so ads are never initialised for Pro users
      await initPurchases({
        onPro: (active) => { store.current.pro = active; push({ type: 'pro', active }); },
        onPrices: (p) => { store.current.prices = p; push({ type: 'prices', ...p }); },
      });
      if (auth.currentUser) linkUser(auth.currentUser.uid);
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
        await linkUser(user.uid);
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
        await linkUser(user.uid);
        return { ok: true, user: publicUser(user, 'google') };
      } catch (e) { return { ok: false, error: String(e.message || e) }; }
    },
    'auth:signOut': async () => { await signOut(auth); try { await GoogleSignin.signOut(); } catch {} await linkUser(null); return { ok: true }; },
    // App Store guideline 5.1.1(v): accounts must be deletable inside the app.
    'auth:delete': async () => {
      const u = auth.currentUser; if (!u) return { ok: false };
      try { await deleteDoc(doc(db, 'users', u.uid)); await deleteUser(u); await linkUser(null); return { ok: true }; }
      catch (e) { return { ok: false, needsRecentLogin: e.code === 'auth/requires-recent-login', error: String(e.message || e) }; }
    },
    // ---------- cloud sync: one document per learner ----------
    'sync:pull': async ({ uid }) => {
      const s = await getDoc(doc(db, 'users', uid));
      return s.exists() ? { ok: true, data: s.data().progress, updatedAt: s.data().updatedAt } : { ok: true, data: null };
    },
    'sync:push': async ({ uid, data, updatedAt }) => {
      await setDoc(doc(db, 'users', uid), { progress: data, updatedAt, serverTime: serverTimestamp() }, { merge: true });
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
    speak: async ({ text, lang = 'zh-CN', rate = 0.8 }) => { Speech.stop(); Speech.speak(text, { language: lang, rate }); },
    speakStop: async () => Speech.stop(),
    haptic: async ({ kind }) => {
      if (kind === 'error') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (kind === 'select') return Haptics.selectionAsync();
      return Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    },
    share: async ({ text }) => Share.share({ message: text }),
    track: async ({ ev, props }) => { try { analytics && logEvent(analytics, ev, props || {}); } catch {} },
    // ---------- in-app purchases ----------
    purchase: async ({ sku }) => buy(sku),
    restore: async () => restore(),
    openUrl: async ({ url }) => { if (/^https:\/\//.test(url)) await Linking.openURL(url); },
    // ---------- ads (free users) ----------
    interstitial: async () => showInterstitial(),
    rewarded: async () => showRewarded(),
    'ads:privacy': async () => showPrivacyOptions(),
    // listen (speech recognition for pronunciation scoring) is wired in the speech module
  };

  const onMessage = async (e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    const h = handlers[msg.type];
    // Unknown request (e.g. 'listen' before speech recognition is added): answer at once so the page never waits for a timeout.
    if (!h) { if (msg.id) reply(msg.id, { ok: false, unsupported: true }); return; }
    try { const r = await h(msg); if (msg.id) reply(msg.id, r || { ok: true }); }
    catch (err) { if (msg.id) reply(msg.id, { ok: false, error: String(err.message || err) }); }
  };

  // Only the bundled page itself loads inside the app; any other link opens in Safari.
  const onNav = (req) => {
    if (req.url.startsWith('file://') || req.url.startsWith('about:') || req.isTopFrame === false) return true;
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
      // native feel: no link-preview pop-ups on long press, no "‹ › Done" bar above the keyboard, and the app can
      // focus the search field itself (dictionary search opens the keyboard directly)
      allowsLinkPreview={false} hideKeyboardAccessoryView keyboardDisplayRequiresUserAction={false}
      style={{ flex: 1, backgroundColor: '#0d0908' }} />
  );
}
