// npm run check:store – checks everything the App Store build needs before you spend an EAS build on it.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));
const errors = [], warnings = [];
const need = (ok, msg) => { if (!ok) errors.push(msg); };
const warn = (ok, msg) => { if (!ok) warnings.push(msg); };

const { expo } = JSON.parse(read('app.json'));
const ios = expo.ios || {};
const plist = ios.infoPlist || {};
const plugin = (n) => (expo.plugins || []).find((p) => (Array.isArray(p) ? p[0] : p) === n);

need(ios.bundleIdentifier === 'space.kinzhal.cipherpath', 'ios.bundleIdentifier must be space.kinzhal.cipherpath');
need(expo.name === 'Cipher Path', 'app name must be Cipher Path');
need(/^\d+\.\d+\.\d+$/.test(expo.version || ''), 'version must look like 1.0.0');
need(plist.ITSAppUsesNonExemptEncryption === false, 'ITSAppUsesNonExemptEncryption must be false');
need(!plist.NSMicrophoneUsageDescription, 'remove the microphone text: this app never records audio');

// icon: 1024×1024, no transparency
need(exists(expo.icon || ''), `icon ${expo.icon} missing`);
if (exists(expo.icon || '')) {
  const b = fs.readFileSync(path.join(root, expo.icon));
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20), colorType = b[25];
  need(w === 1024 && h === 1024, `icon must be 1024×1024 (is ${w}×${h})`);
  need(colorType === 2, 'icon must be RGB without transparency');
}

// privacy manifest
const api = (ios.privacyManifests?.NSPrivacyAccessedAPITypes || []).map((t) => t.NSPrivacyAccessedAPIType);
for (const t of ['UserDefaults', 'FileTimestamp', 'SystemBootTime', 'DiskSpace'])
  need(api.includes(`NSPrivacyAccessedAPICategory${t}`), `privacy manifest missing ${t}`);

// ads: Cipher Path needs its own AdMob app and units (docs/ADS.md)
const ads = plugin('react-native-google-mobile-ads');
const appId = Array.isArray(ads) ? ads[1].iosAppId || '' : '';
need(/^ca-app-pub-\d+~\d+$/.test(appId), 'AdMob iosAppId missing');
need(!appId.startsWith('ca-app-pub-3940256099942544'), "AdMob iosAppId is Google's sample id: create the Cipher Path app in AdMob and paste its id in app.json and src/ads.js");
need(Array.isArray(ads) && !!ads[1].userTrackingUsageDescription, 'ATT usage description missing');
need(Array.isArray(ads) && (ads[1].skAdNetworkItems || []).length >= 40, 'SKAdNetwork list looks incomplete');
need(!!plugin('expo-tracking-transparency'), 'expo-tracking-transparency plugin missing');
const adsJs = read('src/ads.js');
need(/__DEV__\s*\?/.test(adsJs) && adsJs.includes('TestIds'), 'ads.js must use test ads in development');
need(/interstitial: 'ca-app-pub-\d+\/\d+'/.test(adsJs) && /rewarded: 'ca-app-pub-\d+\/\d+'/.test(adsJs), 'AdMob ad unit ids missing in src/ads.js (interstitial and rewarded)');

// purchases
const pur = read('src/purchases.js');
const rcKey = (pur.match(/RC_IOS_KEY = '([^']+)'/) || [])[1] || '';
need(/^appl_[A-Za-z0-9]{10,}$/.test(rcKey), 'RevenueCat key not set (src/purchases.js RC_IOS_KEY must be the appl_… key of the Cipher Path app)');
need(pur.includes("'space.kinzhal.cipherpath.pro.yearly'"), 'product ids must be space.kinzhal.cipherpath.pro.*');

// web app
const web = 'assets/web/cipher-path.html';
need(exists(web), 'web app missing – run npm run sync-web');
if (exists(web)) {
  const html = read(web);
  need(html.includes('viewport-fit=cover'), 'web app shell has no phone viewport');
  need(html.includes('cipher-path-kinzhal.web.app/privacy.html'), 'privacy policy link missing in the web app');
  need(!/hanzi-path-64170|space\.kinzhal\.hanzipath/.test(html), 'web app still references Hanzi Path');
}
for (const w of warnings) console.log('warning:', w);
if (errors.length) { for (const e of errors) console.log('✗', e); console.log(`\ncheck:store – ${errors.length} problem(s)`); process.exit(1); }
console.log('check:store OK – ready for: npx eas-cli@latest build -p ios --profile production');
