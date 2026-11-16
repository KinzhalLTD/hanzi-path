# Hanzi Path – build and upload the iPhone app (no Mac needed)

The iPhone app is the Expo project in `mobile/`. Expo's cloud (EAS) builds it on Apple machines and uploads it to App Store Connect.
Everything below runs in **Google Cloud Shell** (https://shell.cloud.google.com) – copy, paste, press Enter.

You need: an Expo account (free, https://expo.dev/signup), your Apple Developer login, and the app already created in App Store Connect
(`docs/IN_APP_PURCHASES.md` step 2).

## 1. Get the code and the right Node version (once per Cloud Shell)
```bash
git clone https://github.com/KinzhalLTD/hanzi-path.git
cd hanzi-path/mobile
nvm install 22 && nvm use 22
npm ci
```
Already cloned before? Use `cd ~/hanzi-path && git pull && cd mobile && npm ci` instead.

## 2. Check the project
```bash
npm run check:store
npx expo-doctor
```
`check:store` must end with **check:store OK**. Before the RevenueCat key is in, it lists only that one problem.

## 3. Link to Expo (first time only)
```bash
npx eas-cli@latest login
npx eas-cli@latest init
```
`init` adds a project ID to `app.json`. Save it to GitHub so every later build uses the same project:
```bash
git config --global user.email "you@example.com"; git config --global user.name "Your Name"
git add app.json && git commit -m "Link EAS project" && git push
```
(If the push asks for a password, send Claude the `projectId` line from `git diff HEAD~1 app.json` instead.)

## 4. Build for the App Store
```bash
npx eas-cli@latest build -p ios --profile production
```
The first time it asks:
- **Log in to your Apple account?** → Yes, then your Apple ID, password and the 2-factor code.
- **Generate a new Apple Distribution Certificate?** → Yes.
- **Generate a new Apple Provisioning Profile?** → Yes.
- **Set up Push Notifications?** → No (the app only uses local reminders).

The build takes about 15–25 minutes. The build number goes up automatically each time.

## 5. Upload to App Store Connect / TestFlight
```bash
npx eas-cli@latest submit -p ios --latest
```
- Choose **Let EAS create an App Store Connect API key** (saved for next time).
- Select the app **Hanzi Path** if asked.

About 10–30 minutes later the build appears in App Store Connect → TestFlight. Install **TestFlight** on your iPhone and test (checklists in `docs/IN_APP_PURCHASES.md` §7 and `docs/ADS.md`).

## Updating the app later
```bash
cd ~/hanzi-path && git pull && cd mobile && npm ci
npm run check:store
npx eas-cli@latest build -p ios --profile production --auto-submit
```
For a new App Store version also raise `"version"` in `mobile/app.json` (1.0.0 → 1.0.1).

## Test build on your own iPhone (optional, before TestFlight)
```bash
npx eas-cli@latest device:create          # open the link on the iPhone, install the profile
npx eas-cli@latest build -p ios --profile preview
```
Open the link EAS prints on the iPhone to install.

## What is inside (for reference)
| Path | What |
|---|---|
| `mobile/App.js` | Loads the bundled web app from a local file, keeps the splash until it is ready |
| `mobile/src/HanziBridge.js` | WebView + native messages: sign-in, sync, purchases, ads, speech, haptics, reminders, sharing |
| `mobile/src/firebase.js`, `purchases.js`, `ads.js` | Firebase, RevenueCat, AdMob |
| `mobile/plugins/withAdMediation.js` | Adds the mediation adapters to the iOS build |
| `mobile/scripts/sync-web.js` | Copies `hp/dist/hanzi-path.html` into the app (runs automatically on EAS) |
| `mobile/scripts/check-store.js` | `npm run check:store` – store readiness check |
| `mobile/eas.json` | Build profiles: development, preview, production |
