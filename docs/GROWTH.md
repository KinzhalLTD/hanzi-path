# Growth: analytics, paywall test, seasonal sales, Kinzhal Pass, cross-promotion

`growth.js` is shared by Hanzi Path (`hp/src/`) and Cipher Path (`cp/src/`); keep both copies identical.

## 1. Analytics funnel (owner step: 2 values)
The Firebase JS analytics SDK does not run inside React Native, so events were being dropped. `mobile/src/analytics.js`
now sends them to Google Analytics 4 with the Measurement Protocol (plain HTTPS, no native module).

1. https://analytics.google.com → Admin → the property linked to Firebase project `hanzi-path-64170` → Data streams →
   Add stream → Web → URL `hanzi-path-64170.web.app` (Hanzi Path) / `cipher-path-kinzhal.web.app` (Cipher Path).
2. Open the stream → copy the **Measurement ID** (`G-…`) → "Measurement Protocol API secrets" → Create → copy the secret.
3. Paste both in `mobile/src/analytics.js` of that app (`GA4_MEASUREMENT_ID`, `GA4_API_SECRET`). `npm run check:store`
   lists it until done.

Funnel events (every event carries `v` = paywall variant, `app`, and an anonymous client id):
`first_open` → `onboarding_complete`/`onboard` → `lesson_complete`/`module_done` → `active_day {d}`, `return_d1`,
`return_d7`, `return_d30` → `paywall_view {src}` → `sale_view` → `purchase_start` → `trial_start` / `purchase {plan, sale}`.
In GA4 → Explore → Funnel exploration, use those steps; break down by `v` to read the A/B test.

## 2. Paywall A/B test
`S.pwv` is set once per install (50/50). Variant **b** adds the price per day under the yearly plan; **a** is the control.
Run for at least ~2 weeks / a few hundred paywall views per variant before choosing; then set the winner for everyone by
replacing `Math.random()<.5?'a':'b'` with the winning letter.

## 3. Seasonal sales (owner step: one product per app)
Windows (`SALES` in `growth.js`, 2026–2035, made by `scripts/sales_dates.py` with the Umm al-Qura calendar):
Ramadan (1 Ramadan → 3 Shawwal), Founding Day (20–23 Feb), back to school (15–31 Aug), National Day (20–24 Sep),
White Friday (Wed before Black Friday → Cyber Monday), and Chinese New Year (Hanzi Path only, eve − 3 days → Lantern Festival).

During a window the paywall shows a banner with the real discount and the yearly plan buys `pro_yearly_sale` instead of
`pro_yearly` – **only if that product exists** (its price arrived from the App Store). No product → no banner (no fake "% off").
App Store Connect → the app → Subscriptions → the PRO group → add subscription
`space.kinzhal.hanzipath.pro.yearly.sale` / `space.kinzhal.cipherpath.pro.yearly.sale`, 1 year, suggested 107.99 SAR
(40 % off 179.99), no free trial; in RevenueCat attach it to entitlement `pro`.

Suggested SAR price points: monthly 29.99, yearly 179.99 (7-day trial), lifetime 449, yearly sale 107.99, Kinzhal Pass 239.99/yr.

## 4. Kinzhal Pass – one subscription, both apps (owner step: RevenueCat + 2 products)
1. Put both apps in **one** RevenueCat project (add the second app to the first app's project).
2. RevenueCat → Entitlements → New `kinzhal_pass`.
3. App Store Connect, in each app: a new subscription group "Kinzhal Pass" with
   `space.kinzhal.hanzipath.pass.yearly` / `space.kinzhal.cipherpath.pass.yearly` (1 year, 239.99 SAR).
   Attach both products to `kinzhal_pass` in RevenueCat.
4. Done: the apps already identify learners with the same Firebase uid (shared project), and `isPro()` accepts `pro`
   or `kinzhal_pass`. A pass bought in one app unlocks the other after signing in with the same Apple/Google account;
   the app asks guests to sign in right after buying.
The pass card appears on the paywall only when its product price loaded (or in the web demo).

## 5. Cross-promotion (owner step: Apple IDs)
Free users sometimes see the sister app instead of an interstitial (every 5th break point, at most once per 3 days,
never for PRO). Paste both apps' numeric Apple IDs (App Store Connect → App Information → Apple ID) into
`APP_IDS={hp:'…',cp:'…'}` in **both** `growth.js` files and rebuild. Empty = the card stays hidden.

Test: `python3 scripts/test_growth.py hp|cp <phone-shell html> OUT` → `errors []`.
