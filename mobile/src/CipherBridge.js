// Cipher Path – native side of the WebView bridge (Expo, iOS first).
// Handles: in-app purchases (RevenueCat), ads (AdMob + consent), local notifications, speech, haptics, sharing,
// theme (status bar), and analytics events (kept on device until an analytics service is added).
// No accounts and no cloud sync: progress stays on the device.
// Messages arrive from the web app as JSON: {type, id?, ...payload}; replies go back via window.__fromNative({id, ...}).
import React, { useRef, useEffect, useState } from 'react';
import { Share, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { setStatusBarStyle } from 'expo-status-bar';
import { voiceClip, voiceInfo, speakNative } from './voice';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { initPurchases, buy, restore } from './purchases';
import { initAds, showInterstitial, showRewarded, showPrivacyOptions } from './ads';

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
      const a = await initAds({ getPro: () => store.current.pro === true });   // consent form → ATT → AdMob
      store.current.ads = { type: 'ads', privacy: !!a.privacyRequired };
      push(store.current.ads);
    })();
  }, []);

  const handlers = {
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
    share: async ({ text }) => Share.share({ message: text }),
    track: async () => {},
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
