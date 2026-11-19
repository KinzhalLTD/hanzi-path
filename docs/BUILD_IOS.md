# Cipher Path – build and upload the iPhone app (no Mac needed)

The iPhone app is the Expo project in `mobile/`. Expo's cloud (EAS) builds it on Apple machines and uploads it to App Store Connect.
Everything runs in **Google Cloud Shell** (https://shell.cloud.google.com): copy, paste, press Enter.

You need: an Expo account (free), your Apple Developer login, the app created in App Store Connect (`docs/IN_APP_PURCHASES.md` step 2),
the RevenueCat key (`docs/IN_APP_PURCHASES.md`) and the AdMob ids (`docs/ADS.md`).

## 1. Get the code (once per Cloud Shell)
Cipher Path lives on the `cipher-path` branch of the Hanzi Path repository, in its own folder:
```bash
git clone -b cipher-path https://github.com/KinzhalLTD/hanzi-path.git ~/cipher-path
cd ~/cipher-path/mobile && nvm install 22 && nvm use 22 && npm ci
```
Already cloned? `cd ~/cipher-path && git pull && cd mobile && npm ci`

## 2. Check the project
```bash
npm run check:store
npx expo-doctor
```
`check:store` must end with **check:store OK**. Until you paste the RevenueCat key and the AdMob ids it lists exactly those items.

## 3. Link to Expo (first time only)
```bash
npx eas-cli@latest login
npx eas-cli@latest init
git add app.json && git commit -m "Link EAS project" && git push
```

## 4. Build and upload
```bash
npx eas-cli@latest build -p ios --profile production --auto-submit
```
First time: log in to Apple → **Yes** to generate the distribution certificate and provisioning profile → **No** to push notifications
(the app only uses local reminders) → choose **Let EAS create an App Store Connect API key**.
After 15–25 minutes of building and 10–30 minutes of processing, the build appears in App Store Connect → TestFlight.

## Updating later
```bash
cd ~/cipher-path && git pull && cd mobile && npm ci && npm run check:store && npx eas-cli@latest build -p ios --profile production --auto-submit
```
For a new App Store version raise `"version"` in `mobile/app.json` (1.0.0 → 1.0.1).

## What is inside
| Path | What |
|---|---|
| `mobile/App.js` | Loads the bundled web app from a local file, keeps the splash until it is ready |
| `mobile/src/CipherBridge.js` | WebView + native messages: purchases, ads, speech, haptics, reminders, sharing, theme |
| `mobile/src/purchases.js`, `ads.js`, `voice.js` | RevenueCat, AdMob, system voices |
| `mobile/plugins/withAdMediation.js` | Adds the mediation adapters to the iOS build |
| `mobile/scripts/sync-web.js` | Copies `cp/dist/cipher-path.html` into the app with the phone shell (runs on EAS automatically) |
| `mobile/scripts/check-store.js` | Pre-flight checks before you spend a build |
