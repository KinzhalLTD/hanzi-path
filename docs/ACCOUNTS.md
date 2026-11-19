# Cipher Path – accounts (Sign in with Apple / Google) and cloud sync

The app side is finished: onboarding offers **Continue with Apple**, **Continue with Google** or **Continue as guest**.
Me → Account has sign in, sync now, sign out and **Delete account** (App Store guideline 5.1.1(v)).
After the first finished module, guests see the sign-up sheet once.

It works the same way as Hanzi Path and uses the **same Firebase project** (`hanzi-path-64170`), where Apple and Google sign-in are already switched on.
Cipher Path is added to that project as a second iOS app. Its progress lives in its own collection, `cipher_users/{uid}`, so it never touches Hanzi Path's `users/{uid}`.
PRO is never read from synced data: it comes only from the App Store (RevenueCat), which follows the account through `Purchases.logIn(uid)`.

You need to do three things.

## 1. Add the Cipher Path iOS app to Firebase (Google Cloud Shell, copy-paste)
```bash
npm i -g firebase-tools
firebase login --no-localhost
firebase apps:create IOS "Cipher Path" --bundle-id space.kinzhal.cipherpath --project hanzi-path-64170
firebase apps:list IOS --project hanzi-path-64170
# copy the App ID of "Cipher Path" (1:745293456497:ios:…) into the next line
firebase apps:sdkconfig IOS PASTE_APP_ID --project hanzi-path-64170 | grep -A1 -E "CLIENT_ID|REVERSED_CLIENT_ID"
```
The last command prints two values. If `CLIENT_ID` is missing, open Firebase console → Authentication → Sign-in method → Google, press **Save**, and run the last line again.

## 2. Allow the new collection (Firestore rules, keeps Hanzi Path's rule)
```bash
mkdir -p ~/kinzhal-rules && cd ~/kinzhal-rules
cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {            // Hanzi Path
      allow read, write, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /cipher_users/{uid} {     // Cipher Path
      allow read, write, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} { allow read, write: if false; }
  }
}
EOF
echo '{"firestore":{"rules":"firestore.rules"}}' > firebase.json
firebase deploy --only firestore:rules --project hanzi-path-64170
```

## 3. Send me the two values
| Value | From | Goes to |
|---|---|---|
| `CLIENT_ID` (`745293456497-….apps.googleusercontent.com`) | step 1 | `mobile/src/firebase.js` → `GOOGLE_IOS_CLIENT_ID` |
| `REVERSED_CLIENT_ID` (`com.googleusercontent.apps.745293456497-…`) | step 1 | `mobile/app.json` → google-signin `iosUrlScheme` |

These are public client identifiers, safe to put in the app. Do not send passwords or private keys.
`npm run check:store` will show both items until they are set.

**Sign in with Apple:** EAS turns on the capability for `space.kinzhal.cipherpath` automatically during the build (`usesAppleSignIn` is set).
If it asks, answer **yes** to "sync capabilities". Nothing else is needed for native iOS sign-in.

## What is synced
The `progress` field holds modules, scores, stars, terms (SRS), labs, security rounds, exams, seals, chapter crowns, streak, bits and settings.
It never holds code typed in the labs, passwords from the password lab, the PRO flag or the account itself.
Merging keeps the best of both devices: maximum XP, bits and streak; the union of finished modules, seals and crowns; and the stronger memory box for each term.
