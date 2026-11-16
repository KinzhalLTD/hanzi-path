# Hanzi Path – Ads (AdMob + mediation)

**Built in the app:** `mobile/src/ads.js`, bridge handlers, `app.json` plugins, mediation plugin `mobile/plugins/withAdMediation.js`.

| Item | Value |
|---|---|
| AdMob app ID | `ca-app-pub-5681105275743934~3852621577` |
| Interstitial (used) | `ca-app-pub-5681105275743934/8422421979` |
| Rewarded (used) | `ca-app-pub-5681105275743934/9216628898` |
| App open, Banner, Native, Rewarded interstitial | created, **not used** (kept for later tests) |

## How ads behave
- **Free users only.** Pro users never load or see an ad.
- **Start-up order:** Google consent form (only where the law needs it) → Apple tracking prompt (ATT) → AdMob starts.
- **Interstitial** only at natural breaks: after a lesson, a game or a culture chapter. Every second break at most, max **6 a day**.
- **Rewarded** only when the learner taps it: double coins, an extra game play. The reward is given only if the ad is watched to the end.
- Music and sounds pause during an ad and resume after.
- Ads are rated **PG** (family-friendly), suitable for a learning app.
- Development builds use Google **test ads** automatically. Never tap your own real ads.
- **Settings → Ad privacy choices** appears where Google requires it, such as EU/UK users.

## 1. AdMob console: privacy messages (required before real ads)
https://admob.google.com → **Privacy & messaging**:
1. **European regulations** → Create message → app Hanzi Path → languages English + Arabic → Publish.
2. **US state regulations** → Create message → Hanzi Path → Publish.
3. **IDFA explainer** (iOS) → Create message → Hanzi Path → English + Arabic → Publish.
   Google shows this short explanation, then Apple's tracking prompt appears.

## 2. Payments
AdMob → **Payments** → add the KinzhalLTD bank account and tax info. Earnings are paid monthly once the threshold is reached.

## 3. app-ads.txt (protects your ad revenue)
Put this exact line in a file called `app-ads.txt` at the **root of the developer website** you enter in the App Store listing:
```
google.com, pub-5681105275743934, DIRECT, f08c47fec0942fa0
```
Each mediation network gives you its own line to add (step 4). The website step deploys this file automatically.

## 4. Mediation (more competition → higher eCPM)
The app already contains the adapters for **AppLovin, Unity Ads, Liftoff Monetize, Mintegral, Pangle, Meta Audience Network**.
For each network:
1. Create a publisher account, add the app (iOS, bundle `space.kinzhal.hanzipath`), and create an **Interstitial** and a **Rewarded** placement.
2. Copy its app-ads.txt line(s) into `app-ads.txt`.
3. Copy its **SKAdNetwork ID list** and send it to Claude; it gets merged into `app.json` (`skAdNetworkItems`, which has Google's list today).

Then in AdMob → **Mediation → Create mediation group** (do it twice: iOS Interstitial, iOS Rewarded):
- Ad unit: Interstitial `…/8422421979` (or Rewarded `…/9216628898`).
- **Bidding** ad sources: add AppLovin, Liftoff Monetize, Mintegral, Pangle, Meta, Unity, entering the IDs each network gave you.
- Save. AdMob runs a real-time auction between Google and the networks for every ad.

Notes:
- **Meta Audience Network** needs a verified Meta Business account and usually the app to be live in the App Store first.
- **Start simple:** launch with AdMob alone if you like, then add networks one by one. No app update is needed for networks whose adapter is already in the app.

## 5. Test devices
AdMob → **Settings → Test devices → Add**: your iPhone's IDFA (shown in the Xcode/TestFlight logs, or use the AdMob test-device prompt). Test devices get test ads even in production builds.

## 6. App Store "App Privacy" answers (ads + accounts + purchases)
In App Store Connect → App Privacy, declare (Claude will produce the full answer sheet with the store listing):

| Data type | Used for | Linked to user | Used for tracking |
|---|---|---|---|
| Device ID (IDFA, only with permission) | Third-party advertising | No | **Yes** |
| Advertising data / product interaction | Third-party advertising, analytics | No | **Yes** |
| Coarse location (from IP) | Advertising | No | **Yes** |
| Crash & performance data | App functionality | No | No |
| Name, email (only if the learner signs in) | App functionality (account, sync) | Yes | No |
| User ID | App functionality | Yes | No |
| Purchase history | App functionality (Pro status) | Yes | No |
| Learning progress (other user content) | App functionality (sync) | Yes | No |

Because ads can track with permission, the app asks with Apple's ATT prompt. The tracking purpose text is set in `app.json`.

## 7. Packages (Claude adds these to the Expo project)
```bash
npx expo install react-native-google-mobile-ads expo-tracking-transparency
```
Runs in development/production builds (EAS/TestFlight), not in Expo Go.
