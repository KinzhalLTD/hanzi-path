# Teams & classes: company and school licences (both apps)

Sold by Kinzhal directly to organisations (invoice, outside the App Store – allowed for enterprise/education services by
App Store guideline 3.1.3(c)). A seat gives PRO in the app(s) the licence covers; the organisation's admin follows
progress on the dashboard.

Flow
1. Seller (an e-mail in `SUPER_ADMINS`) opens https://kinzhal-teams.web.app → Seller tools → creates a licence:
   organisation name, app (Hanzi Path / Cipher Path / both), seats, months, admin e-mail (that person must have signed in
   once to either app or the dashboard). A 7-character join code is generated. "Renew" extends it (function action `renew`).
2. Admin signs in to the dashboard, shares the code. Can copy it, make a new one, see seats used, active this week,
   average XP, a sortable members table (XP, streak, certificates; Hanzi Path: HSK level, words, best mock;
   Cipher Path: modules, labs, SOC/dev readiness), export CSV, and remove members (frees the seat).
3. Learner: Me → Join a class or company → code (sign-in required). The `org` function checks the code, expiry and
   seats, then writes `org_members/{uid}`. The native bridge reads it (`checkOrg`) and sends `{type:'pro'}` with
   `source:'org'` – PRO still comes only from the native side. `{type:'org'}` tells the page the team name.
4. The app writes only its own progress summary (`shp` / `scp`, `seen`) to `orgs/{org}/members/{uid}` when it goes to
   the background and at most every 10 minutes – never answers or messages (the join sheet says so).

Data model, rules and deploy: `server/functions/index.js` (function `org`: whoami, join, leave, remove, newcode,
create, renew), `server/firestore.rules`, `server/dashboard/index.html`, docs/SERVER.md.

Privacy: the privacy policy should say that, for learners who join an organisation, a progress summary is shared with
that organisation's admin (added to Cipher Path `website/privacy.html`; copy it to Hanzi Path's page).
Test: `python3 scripts/test_teams.py hp|cp <phone-shell html> OUT` → `errors []`.
