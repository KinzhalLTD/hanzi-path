# Cipher Path – ads (AdMob + mediation)

Code is finished (`mobile/src/ads.js`): consent form → Apple tracking prompt → AdMob, free users only, interstitials only at break points
(end of a module, lab, exam, game or conversation; every second break, at most 6 a day), rewarded ads only when the learner taps “Watch an ad” in the shop.
Development builds use Google test ads. Until real ids are pasted the app simply runs without ads.

## 1. Create the app and two ad units (AdMob, same account as Hanzi Path)
https://admob.google.com → **Apps → Add app** → iOS → not yet published → name **Cipher Path** → note the **App ID** (`ca-app-pub-…~…`).
**Ad units → Add**: one **Interstitial** and one **Rewarded** → note both ids (`ca-app-pub-…/…`).
Paste them in Cloud Shell (replace the three values):
```bash
cd ~/cipher-path
APP=ca-app-pub-5681105275743934~XXXXXXXXXX; INT=ca-app-pub-5681105275743934/XXXXXXXXXX; REW=ca-app-pub-5681105275743934/XXXXXXXXXX
sed -i "s#ca-app-pub-3940256099942544~1458002511#$APP#" mobile/app.json mobile/src/ads.js
sed -i "s#interstitial: ''#interstitial: '$INT'#; s#rewarded: ''#rewarded: '$REW'#" mobile/src/ads.js
cd mobile && npm run check:store; cd .. && git commit -am "AdMob ids" && git push
```

## 2. Privacy messages (required before real ads)
AdMob → **Privacy & messaging**: European regulations, US state regulations and the IDFA explainer → choose Cipher Path → English + Arabic → Publish.

## 3. app-ads.txt
`website/app-ads.txt` already has your publisher line. Deploy the website (docs/APP_STORE_SUBMISSION.md §1) and set the developer website in the
App Store listing to `https://cipher-path-kinzhal.web.app`.

## 4. Mediation
The adapters for AppLovin, Unity Ads, Liftoff, Mintegral, Pangle and Meta are already in the build (same as Hanzi Path). In each network add
the app (bundle `space.kinzhal.cipherpath`), then add the network as a bidding source in the AdMob mediation groups for the two new ad units.
