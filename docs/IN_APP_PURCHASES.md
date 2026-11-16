# Hanzi Path – In-app purchases (App Store + RevenueCat)

The app side is finished (`native/purchases.js`, paywall, shop, restore). You do the account setup below once,
then send Claude **one value**: the RevenueCat public App Store SDK key (starts with `appl_`).

Order matters: **Step 1 can take a few days to approve – start it first.**

---

## 1. App Store Connect → Business (paid apps agreement)
1. https://appstoreconnect.apple.com → **Business**.
2. **Paid Apps** agreement → **View and Agree to Terms**.
3. Add a **bank account** for KinzhalLTD.
4. Complete **tax forms** (a non-US company usually fills **W-8BEN-E**; your accountant should confirm).
5. Wait until the agreement status shows **Active**. Products cannot be bought, even in testing, before this.

## 2. Register the app (skip if it already exists)
1. https://developer.apple.com/account/resources/identifiers → **+** → App IDs → App →
   Bundle ID **explicit** `space.kinzhal.hanzipath` → tick **Sign In with Apple** (and **In-App Purchase** is on by default) → Register.
2. App Store Connect → **Apps → + → New App**: Platform iOS · Name **Hanzi Path** (or *Hanzi Path – Learn Chinese* if taken) ·
   Primary language English (U.S.) · Bundle ID `space.kinzhal.hanzipath` · SKU `HANZIPATH001`.

## 3. Create the products
App Store Connect → your app → **Monetization**.

### 3a. Subscriptions (Monetization → Subscriptions)
Create a **subscription group**: reference name `Hanzi Path Pro`.
Group display name – English: **Hanzi Path Pro** · Arabic: **هانزي باث برو**.

| Reference name | Product ID | Duration | Price (Saudi Arabia) |
|---|---|---|---|
| Pro Monthly | `space.kinzhal.hanzipath.pro.monthly` | 1 month | SAR 29.99 |
| Pro Yearly | `space.kinzhal.hanzipath.pro.yearly` | 1 year | SAR 179.99 |

On **Pro Yearly → Subscription Prices → Introductory Offers → +**: all countries · type **Free** · duration **1 week**.
Set the Saudi price and let Apple fill the other countries automatically.

### 3b. Lifetime and coins (Monetization → In-App Purchases)
| Type | Reference name | Product ID | Price (SAR) |
|---|---|---|---|
| Non-Consumable | Pro Lifetime | `space.kinzhal.hanzipath.pro.lifetime` | 449.99 (nearest price point) |
| Consumable | 600 Coins | `space.kinzhal.hanzipath.coins.600` | 9.99 |
| Consumable | 1,500 Coins | `space.kinzhal.hanzipath.coins.1500` | 19.99 |
| Consumable | 3,500 Coins | `space.kinzhal.hanzipath.coins.3500` | 39.99 |

The app always shows Apple's real localized price, so exact price points are never hard-coded.

### 3c. Localization for every product (display name ≤ 30, description ≤ 45 characters)
| Product | English name | English description | Arabic name | Arabic description |
|---|---|---|---|---|
| pro.monthly | Pro Monthly | All HSK 1–6, writing and coding, no ads | برو شهري | كل HSK والكتابة والبرمجة بلا إعلانات |
| pro.yearly | Pro Yearly | Best value: everything unlocked, no ads | برو سنوي | الأفضل قيمة: كل شيء مفتوح بلا إعلانات |
| pro.lifetime | Pro Lifetime | Pay once, keep Pro forever | برو مدى الحياة | ادفع مرة واحدة واحتفظ ببرو للأبد |
| coins.600 | 600 Coins | Coins for hints, themes and streak saves | ٦٠٠ عملة | عملات للتلميحات والسمات وحماية السلسلة |
| coins.1500 | 1,500 Coins | Coins for hints, themes and streak saves | ١٬٥٠٠ عملة | عملات للتلميحات والسمات وحماية السلسلة |
| coins.3500 | 3,500 Coins | Coins for hints, themes and streak saves | ٣٬٥٠٠ عملة | عملات للتلميحات والسمات وحماية السلسلة |

### 3d. Review information (each product)
- **Screenshot:** upload `docs/iap/paywall-review-en.png` (780 × 1688).
- **Review notes:** “Pro unlocks all HSK levels, unlimited writing practice, the advanced coding path, all sector vocabularies and removes ads. The paywall opens from Profile → Go Pro, from the shop (coin icon), and when a free limit is reached. Restore Purchases is on the paywall and in Profile. Sign-in is optional and not required to purchase.”

New products are submitted together with the first app version (App Store Connect adds them to the version page).

## 4. In-App Purchase key for RevenueCat
App Store Connect → **Users and Access → Integrations → In-App Purchase → Generate In-App Purchase Key** →
name `RevenueCat` → **Download the .p8 once** and note the **Key ID** and the **Issuer ID** shown on the page.
Give these to **RevenueCat only** (step 5). **Never send the .p8 to anyone else or commit it to GitHub.**

## 5. RevenueCat (https://app.revenuecat.com) – free up to US$2,500 monthly tracked revenue, then 1%
1. Sign up → **Create project** `Hanzi Path`.
2. **Apps & providers → + App Store**: App name `Hanzi Path iOS`, Bundle ID `space.kinzhal.hanzipath`,
   upload the **In-App Purchase key (.p8)** with its Key ID and Issuer ID → Save.
3. Copy the **App Store Server Notifications URL** RevenueCat shows → App Store Connect → your app →
   **App Information → App Store Server Notifications** → paste it for **Production** and **Sandbox** (Version 2).
4. **Product catalog → Products → + New**: add the 6 product IDs from step 3.
5. **Entitlements → + New**: identifier **`pro`** → attach **pro.monthly, pro.yearly, pro.lifetime** (not the coins).
6. (Optional) **Offerings → default** with packages Monthly, Annual, Lifetime – lets you change the paywall later without an app update.
7. **API keys** → copy the **App Store public SDK key** (`appl_…`) → **send it to Claude**. It is public and safe to ship.

## 6. Packages (Claude adds these to the Expo project)
```bash
npx expo install react-native-purchases
```
RevenueCat needs a development or production build (EAS / TestFlight); it does not run in Expo Go.

## 7. Test before submitting (TestFlight = free sandbox purchases)
App Store Connect → Users and Access → **Sandbox → Test Accounts → +** (use an email that is not an Apple Account).
On the iPhone: Settings → App Store → **Sandbox Account** → sign in with it, then test:

- [ ] Paywall shows Apple prices in riyals (and in your test account's country currency)
- [ ] Yearly shows the 7-day free trial; a second test account that already used it shows no trial
- [ ] Buy Monthly → Pro unlocks, ads disappear
- [ ] Cancel the purchase sheet → nothing changes, no error
- [ ] Delete and reinstall → **Restore Purchases** brings Pro back
- [ ] Sign in with Apple on a second device → Pro appears there too
- [ ] Let a sandbox subscription expire (renewals are accelerated: a year lasts about an hour) → Pro switches off by itself
- [ ] Buy each coin pack → coins added, Pro unchanged
- [ ] Terms of Use and Privacy Policy links open from the paywall

## How it works (for reference)
- `native/purchases.js` configures RevenueCat, loads localized prices and trial eligibility, buys, restores,
  and links purchases to the Firebase account (`Purchases.logIn(uid)`).
- The web app receives `{type:'prices'}` and `{type:'pro', active}` messages. **Pro is set only from the verified
  `pro` entitlement** – it is excluded from cloud sync, so it cannot be copied or faked.
- Paywall meets App Review 3.1.2: plan name, length and price, auto-renew terms, trial terms, Restore,
  Terms of Use (Apple standard EULA) and Privacy Policy links (hosted at `https://hanzi-path-64170.web.app/privacy.html` – deployed with the website step).
