# Hanzi Path – Firebase setup (Sign in with Apple, Google, cloud sync)

The app is already wired for login, sync, account deletion and notifications. When you finish the steps
below, send me the values in **"What to send me"** and I will paste them in and build.

## 1. Create the project (Firebase console)
1. console.firebase.google.com → **Add project** → name it `hanzi-path` (Analytics: on).
2. **Add app → iOS**. Bundle ID: the same one you use in Replit/App Store Connect, for example `space.kinzhal.hanzipath`.
   Download **GoogleService-Info.plist**.
3. **Build → Authentication → Get started → Sign-in method**:
   - **Google** → Enable → save. Open it again and copy the **Web client ID**.
   - **Apple** → Enable → save (for an iOS-only app nothing else is needed here).
4. **Build → Firestore Database → Create database** → production mode → pick the nearest region offered (for example a Middle East or Europe region).

## 2. Apple Developer (developer.apple.com)
1. Certificates, Identifiers & Profiles → Identifiers → your App ID → tick **Sign In with Apple** → Save.
2. Nothing else is needed for native iOS sign-in.

## 3. Deploy the security rules (copy-paste in Google Cloud Shell)
```bash
npm i -g firebase-tools
firebase login --no-localhost
mkdir hanzi-rules && cd hanzi-rules
cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} { allow read, write: if false; }
  }
}
EOF
echo '{"firestore":{"rules":"firestore.rules"}}' > firebase.json
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

## What to send me
| Value | Where to find it |
|---|---|
| `apiKey`, `projectId`, `messagingSenderId`, `appId`, `measurementId` | Project settings → General → your iOS app (or the plist) |
| **GoogleService-Info.plist** (attach the file) | Downloaded in step 1.2 |
| **iOS client ID** and **REVERSED_CLIENT_ID** | Inside the plist (`CLIENT_ID`, `REVERSED_CLIENT_ID`) |
| **Web client ID** | Authentication → Google provider |
| **Bundle ID** | Your choice, must match App Store Connect |

Do not send passwords or private keys. These values are safe to put in the app.

## What is already built
- **Accounts:** Continue with Apple, Continue with Google, or guest. Apple requires "Sign in with Apple" when Google login is offered, so both are there.
- **Cloud sync:** progress (words, streak, writing, coding, culture, purchases flag) saves to `users/{uid}`; signing in on a new phone merges it.
- **Delete account** inside the app (App Store guideline 5.1.1(v)).
- **Notifications:** daily reminder at the chosen time, streak saver at 21:30, review reminder; scheduled locally on the phone, so no push server or APNs key is needed.
- **Analytics:** every KPI event from the financial plan goes to Firebase Analytics.

## Packages for the Expo app
```bash
npx expo install react-native-purchases react-native-webview expo-speech expo-haptics expo-notifications expo-apple-authentication expo-crypto @react-native-async-storage/async-storage firebase
npm i @react-native-google-signin/google-signin
```
`app.json` additions:
```json
{ "expo": { "ios": { "bundleIdentifier": "space.kinzhal.hanzipath", "usesAppleSignIn": true,
  "infoPlist": { "NSMicrophoneUsageDescription": "Used to check your Chinese pronunciation.", "NSSpeechRecognitionUsageDescription": "Used to score your Chinese pronunciation." } },
  "plugins": ["expo-apple-authentication", "expo-notifications", ["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.745293456497-coheqcrop5suk9p61f9kletsajdoouco" }]] } }
```
