# Hanzi Path – notes for Claude sessions

- Source lives in `hp/src/*.js`; never edit `hp/dist/` by hand. Build with `bash scripts/build.sh` (must print "build OK").
- Module order and placeholders (`__SAMPLES__`, `__PHOTOS__`, `__CHARS__`, `__STROKES__`, `__SECEXT__`, `__KL__`, `__TANGRAMS__`) are defined in `scripts/build_hp.py`.
- Content: HSK TSV formats are 8 fields `hanzi|pinyin|arabic|english|ex zh|ex pinyin|ex ar|ex en` or 7 fields (no English gloss). After editing, run `bash scripts/merge_all.sh` then build.
- Validate pinyin against CC-CEDICT with `scripts/check_content.py` before merging. Polyphonic characters need hand-checked readings.
- Bilingual UI: every string needs Arabic and English (`hp/src/i18n.js` or inline `isAr()?…:…`). Check RTL layout.
- Run `python3 scripts/regress.py hp/dist/hanzi-path.html /tmp/r.png` and the relevant `scripts/test_*.py` after changes; they must report `errors []`.
- Owner works on Windows and prefers copy-paste commands (e.g. Google Cloud Shell) over click-by-click steps.
- Bundle ID `space.kinzhal.hanzipath`; Firebase project `hanzi-path-64170`.
- In-app purchases: RevenueCat (`mobile/src/purchases.js`), entitlement `pro`. Pro must only come from the native `{type:'pro'}` message, never from cloud sync. Setup steps in `docs/IN_APP_PURCHASES.md`; test with `scripts/test_iap.py`.
- Privacy policy URL is `https://hanzi-path-64170.web.app/privacy.html` (Firebase Hosting, website step).
- Ads: AdMob via `mobile/src/ads.js` (consent → ATT → init), free users only, interstitial at break points (max 6/day), rewarded opt-in. Setup in `docs/ADS.md`; test with `scripts/test_ads.py`.
- iPhone app: Expo SDK 58 project in `mobile/` (follow `mobile/AGENTS.md`: `npx expo install`, never edit `ios/`). It bundles `hp/dist/hanzi-path.html` via `npm run sync-web` (adds the viewport/UTF-8 shell). Before a build run `npm run check:store` and `npx expo export --platform ios`. Build steps in `docs/BUILD_IOS.md`.
- Learning engine v2 (`hp/src/learn.js`): sentence exercises (build/gap/slisten/pinyin/tonepair), contextual pinyin via `alignPy` (sentence pinyin aligned to characters), mastery 0–5 from SRS boxes, adaptive `lessonPlan`, placement test. Journey (`hp/src/journey.js`): chapters per place, gate tests. Test with `scripts/test_learn.py`; layout with `scripts/audit_layout.py` on `mobile/assets/web/hanzi-path.html` (has the phone viewport).
