# Server (one deploy for both apps): AI tutor, teams/licences, Firestore rules, team dashboard

Everything lives in `server/` (identical in the Hanzi Path `main` branch and the Cipher Path branch) and goes to the
shared Firebase project `hanzi-path-64170`:
- `functions/index.js` → Cloud Functions `tutor` (docs/AI_TUTOR.md) and `org` (docs/TEAMS.md)
- `firestore.rules` → rules for both apps (`users`, `cipher_users`, `org_members`, `orgs`); replaces any older rules file
- `dashboard/index.html` → Firebase Hosting site `kinzhal-teams` (https://kinzhal-teams.web.app)

## One-time deploy – Google Cloud Shell, copy-paste
Needs the Blaze plan, an Anthropic API key and the RevenueCat secret key. Replace the e-mail with yours (the seller
account that may create licences).
```bash
gcloud config set project hanzi-path-64170
npm i -g firebase-tools
rm -rf ~/kz && git clone --depth 1 https://github.com/KinzhalLTD/hanzi-path ~/kz && cd ~/kz/server/functions && npm install && cd ..
echo "SUPER_ADMINS=YOUR_EMAIL@example.com" > functions/.env
firebase login --no-localhost
firebase hosting:sites:create kinzhal-teams --project hanzi-path-64170
firebase functions:secrets:set ANTHROPIC_API_KEY --project hanzi-path-64170
firebase functions:secrets:set REVENUECAT_SECRET --project hanzi-path-64170
firebase deploy --only functions,firestore:rules,hosting --project hanzi-path-64170
# let the dashboard use Google sign-in on its own domain
TOKEN=$(gcloud auth print-access-token); API=https://identitytoolkit.googleapis.com/admin/v2/projects/hanzi-path-64170/config
CUR=$(curl -s -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: hanzi-path-64170" $API | python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(sorted(set(d.get('authorizedDomains',[])+['kinzhal-teams.web.app','kinzhal-teams.firebaseapp.com']))))")
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: hanzi-path-64170" -H "Content-Type: application/json" "$API?updateMask=authorizedDomains" -d "{\"authorizedDomains\":$CUR}" | head -c 300
```
Later updates: `cd ~/kz && git pull && cd server && firebase deploy --only functions,firestore:rules,hosting --project hanzi-path-64170`.
The function URLs must match `TUTOR_URL` and `ORG_URL` in `mobile/src/firebase.js` of both apps
(`https://us-central1-hanzi-path-64170.cloudfunctions.net/tutor` and `/org`).
