# Cipher Path – in-app purchases (App Store + RevenueCat)

The app side is finished (`mobile/src/purchases.js`, paywall, restore). Set up the accounts once, then paste **one value**,
the RevenueCat public SDK key (`appl_…`), into `mobile/src/purchases.js` (`RC_IOS_KEY`). The paid-apps agreement, bank and tax
forms from Hanzi Path already cover this app.

## 1. Register the app
1. https://developer.apple.com/account/resources/identifiers → **+** → App IDs → App → Bundle ID (explicit) `space.kinzhal.cipherpath` → Register.
2. App Store Connect → **Apps → + → New App**: iOS · Name **Cipher Path** (or *Cipher Path: Code & Security*) · Primary language English (U.S.) ·
   Bundle ID `space.kinzhal.cipherpath` · SKU `CIPHERPATH001`.

## 2. Products (App Store Connect → your app → Monetization)
Subscription group `Cipher Path Pro` (display name EN **Cipher Path PRO**, AR **مسار الشيفرة PRO**):

| Type | Reference name | Product ID | Price (Saudi Arabia) |
|---|---|---|---|
| Auto-renewable, 1 month | Pro Monthly | `space.kinzhal.cipherpath.pro.monthly` | SAR 29.99 |
| Auto-renewable, 1 year | Pro Yearly | `space.kinzhal.cipherpath.pro.yearly` | SAR 179.99 (optional 1-week free trial) |
| Non-consumable | Pro Lifetime | `space.kinzhal.cipherpath.pro.lifetime` | SAR 449.99 |

Localization (name ≤ 30, description ≤ 45 characters):

| Product | English name | English description | Arabic name | Arabic description |
|---|---|---|---|---|
| pro.monthly | PRO Monthly | All modules, labs and exams, no ads | PRO شهري | كل الوحدات والمختبرات والاختبارات بلا إعلانات |
| pro.yearly | PRO Yearly | Best value: everything unlocked, no ads | PRO سنوي | الأوفر: كل شيء مفتوح وبلا إعلانات |
| pro.lifetime | PRO Lifetime | Pay once, keep PRO forever | PRO مدى الحياة | ادفع مرة واحدة واحتفظ بـ PRO للأبد |

Review notes for each product: “PRO unlocks all 24 modules, all labs, unlimited practice exams, certificates and all conversations, and removes ads.
The paywall opens from the PRO chip at the top of every screen, from Me → Get PRO, and from any locked item.”

## 3. RevenueCat
1. App Store Connect → Users and Access → Integrations → **In-App Purchase** key: reuse the Hanzi Path key (Key ID + Issuer ID + the .p8 you kept)
   or generate a new one. **The .p8 goes only to RevenueCat; never send it to anyone or commit it.**
2. https://app.revenuecat.com → **Create project** `Cipher Path` → **+ App Store** app: bundle `space.kinzhal.cipherpath`, upload the key.
3. Paste RevenueCat's **App Store Server Notifications URL** into App Store Connect → Cipher Path → App Information (Production and Sandbox, Version 2).
4. Products: add the three IDs above. Entitlement **`pro`** → attach all three.
5. API keys → copy the **App Store public SDK key** (`appl_…`) → paste it in Cloud Shell:
```bash
cd ~/cipher-path && sed -i "s/appl_PASTE_PUBLIC_SDK_KEY/appl_YOURKEY/" mobile/src/purchases.js && git commit -am "RevenueCat key" && git push
```

## 4. TestFlight checklist (sandbox account)
- [ ] Paywall shows Apple prices in riyals; Yearly shows the trial if you set one
- [ ] Buy Monthly → PRO unlocks (all modules open, ads stop)
- [ ] Cancel the purchase sheet → nothing changes
- [ ] Reinstall → Restore purchases brings PRO back
- [ ] Terms of Use and Privacy Policy open from the paywall
