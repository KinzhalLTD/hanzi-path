# AI tutor (both apps)

What it does
- **Why?** button after a wrong answer (Hanzi Path lessons; Cipher Path quizzes and lesson checks) → a short explanation.
- **Chat** (Me → AI tutor, route `tutor`): Hanzi Path = Chinese conversation partner at the learner's HSK level
  (Chinese / pinyin / translation, gentle corrections, 🔊 reads Bao's Chinese); Cipher Path = ask 龙宝 about code and
  defensive security.
- Limits: sign-in required; PRO (or Kinzhal Pass) 40 messages a day, free 3 a day (the 4th opens the paywall, src
  `tutor`). Browser = labelled demo, no calls.

How it works
`client (tutor.js) → native bridge "tutor" (adds the Firebase ID token) → Cloud Function tutor (server/functions)
→ checks the token, the plan (RevenueCat REST, entitlements pro / kinzhal_pass), the daily count (Firestore
tutor_usage/{uid}) → Claude Messages API (model claude-haiku-5-5, ≤ 350 tokens) → answer`.
The Claude key and the RevenueCat secret live only in Google Secret Manager. One function serves both apps
(`app: 'hp'|'cp'`), deployed once to Firebase project `hanzi-path-64170`.

## Deploy (owner)
One Cloud Shell block deploys the tutor, the teams function, the Firestore rules and the dashboard: see docs/SERVER.md.

The URL it prints must match `TUTOR_URL` in `mobile/src/firebase.js` of both apps
(`https://us-central1-hanzi-path-64170.cloudfunctions.net/tutor`).

Cost control: set a monthly spend limit in the Anthropic console; tune `LIMIT` and `MODEL` in
`server/functions/index.js` and redeploy.

Privacy: add the "AI tutor" paragraph (already in Cipher Path `website/privacy.html`) to Hanzi Path's privacy page, and
in App Store Connect → App Privacy declare "User Content – Other user content" (not linked to identity, used for app
functionality).

Test: `python3 scripts/test_tutor.py hp|cp <phone-shell html> OUT` → `errors []` (web demo + native mock: sign-in,
request shape, reply, daily limit → paywall).
