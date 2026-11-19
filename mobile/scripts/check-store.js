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

need(ios.bundleIdentifier === 'space.kinzhal.hanzipath', 'ios.bundleIdentifier must be space.kinzhal.hanzipath');
need(/^\d+\.\d+\.\d+$/.test(expo.version || ''), 'version must look like 1.0.0');
need(ios.usesAppleSignIn === true, 'ios.usesAppleSignIn must be true (Sign in with Apple)');
need(plist.ITSAppUsesNonExemptEncryption === false, 'ITSAppUsesNonExemptEncryption must be false');
need(!!plist.NSMicrophoneUsageDescription, 'microphone usage text missing');

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

// ads
const ads = plugin('react-native-google-mobile-ads');
need(Array.isArray(ads) && /^ca-app-pub-\d+~\d+$/.test(ads[1].iosAppId || ''), 'AdMob iosAppId missing');
need(Array.isArray(ads) && !!ads[1].userTrackingUsageDescription, 'ATT usage description missing');
need(Array.isArray(ads) && (ads[1].skAdNetworkItems || []).length >= 40, 'SKAdNetwork list looks incomplete');
need(!!plugin('expo-tracking-transparency'), 'expo-tracking-transparency plugin missing');
const adsJs = read('src/ads.js');
need(/__DEV__\s*\?/.test(adsJs) && adsJs.includes('TestIds'), 'ads.js must use test ads in development');

// sign-in
const g = plugin('@react-native-google-signin/google-signin');
need(Array.isArray(g) && /^com\.googleusercontent\.apps\./.test(g[1].iosUrlScheme || ''), 'Google sign-in iosUrlScheme missing');
const fb = read('src/firebase.js');
need(!/PASTE|YOUR_/.test(fb), 'firebase.js still has placeholders');

// purchases
const pur = read('src/purchases.js');
const rcKey = (pur.match(/RC_IOS_KEY = '([^']+)'/) || [])[1] || '';
need(/^appl_[A-Za-z0-9]{10,}$/.test(rcKey), 'RevenueCat key not set (src/purchases.js RC_IOS_KEY must be the appl_… key)');

// web app
const web = 'assets/web/hanzi-path.html';
need(exists(web), 'web app missing – run npm run sync-web');
if (exists(web)) {
  const html = read(web);
  need(html.includes('viewport-fit=cover'), 'web app shell has no phone viewport');
  need(html.includes('hanzi-path-64170.web.app/privacy.html'), 'privacy policy link missing in the web app');
}

// studio voice packs (docs/VOICE.md): optional, the app falls back to the phone voice
{ const vi = path.join(__dirname, '..', 'assets', 'voice', 'index.json');
  let n = 0; try { n = Object.keys(JSON.parse(fs.readFileSync(vi, 'utf8')).e || {}).length; } catch (e) {}
  warn(n > 0, 'studio voice not recorded yet: run `bash scripts/voice_cloudshell.sh` in Cloud Shell (docs/VOICE.md); the build will use the phone voice');
  if (n) console.log(`voice: ${n} studio recordings bundled`); }
for (const w of warnings) console.log('warning:', w);
if (errors.length) { for (const e of errors) console.log('✗', e); console.log(`\ncheck:store – ${errors.length} problem(s)`); process.exit(1); }
console.log('check:store OK – ready for: npx eas-cli@latest build -p ios --profile production');
