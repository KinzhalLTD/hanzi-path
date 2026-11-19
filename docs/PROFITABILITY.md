# Cipher Path – profitability system

**Goal:** most revenue comes from the yearly PRO subscription. Bit packs and ads monetise the learners who never subscribe.
Nothing is designed to trick or pressure: every ad except the capped interstitial is the learner's choice, and every price is shown before tapping.

## 1. Revenue streams (all built in the app)
| Stream | Product | Price (US / KSA) | Where it is sold |
|---|---|---|---|
| PRO yearly, **7-day free trial** (Apple intro offer, shown only when Apple says the learner is eligible) | `space.kinzhal.cipherpath.pro.yearly` | $47.99 / SAR 179.99 | Paywall (preselected) |
| PRO monthly | `…pro.monthly` | $7.99 / SAR 29.99 | Paywall |
| PRO lifetime | `…pro.lifetime` | $119.99 / SAR 449.99 | Paywall |
| Bit packs (consumable) | `…bits.600 / .1500 / .3500` | $1.99 / $3.99 / $7.99 (SAR 7.99 / 14.99 / 29.99) | Shop |
| Rewarded ads (opt-in, max 5 a day) | AdMob rewarded | – | Revive in a fight, double bits after a module, extra exam, +25 bits in the shop |
| Interstitial ads | AdMob interstitial | – | Only at break points (end of a module, lab, game or exam); every second break point, max 6 a day, never for PRO |

## 2. What PRO adds (the comparison table on the paywall)
| | Free | PRO |
|---|---|---|
| Modules | 6 (chapter 1 of each track) | 24 |
| Chapter gates | 2 | 8 |
| Labs | the first rounds of every lab | all |
| Practice exams | 1 a day (more with a ticket or an ad) | unlimited |
| Conversations | first one per field | all |
| Revive in fights | ad or token | every fight |
| Bits rewards | ×1 | ×1.5 |
| Ads | yes | none |

## 3. Bits economy (sources and sinks)
- **Sources:** module done +30, boss win +10…16, gate +50, red envelope, quests and chest, labs, exams, rewarded ad +25, bit packs.
- **Sinks:** streak freeze 60, revive token 40, exam ticket 80.
- The shop puts the **revive token** next to the ad option, so a learner who loses a boss fight can choose to pay with time (ad), bits (token) or money (pack / PRO).

## 4. Paywall moments (value first, never on first launch)
| Moment | `paywall_view` src | Rule |
|---|---|---|
| Tap a locked module, gate, lab, conversation or certificate | module / gate / lab / talk / cert | every time |
| "Next module" leads to a locked one | next | every time |
| **3rd module finished** | milestone | once, at the break point instead of an ad |
| Exam limit reached | exam | via the exam sheet (ticket / ad / PRO) |
| PRO chip, Me, shop | topbar / me / shop | always available |

The first finished module offers **sign-up** instead of an ad (accounts raise retention and let PRO follow the learner to a new phone).

## 5. Funnel events (Firebase Analytics, `track()` in the web app → bridge → `logEvent`)
`onboard` → `login_prompt` / `login_success` / `login_skip` → `module_done` → `paywall_view {src}` → `purchase_start {plan,src}` → `trial_start` / `purchase {plan,src}`.
Ads: `ad_shown {format}`, `ad_rewarded {placement}`. Economy: `shop_view`, `shop_buy {item}`, `revive {via}`, `exam_ticket {via}`.
Learning: `quiz`, `gate_start`, `gate_pass`, `streak_day`, `music {level}`.

## 6. Model for 10,000 installs a month (assumptions to replace with real data after launch)
| Assumption | Value |
|---|---|
| Install → trial start | 6% |
| Trial → paid yearly | 40% → 240 yearly subscribers |
| Install → monthly | 0.8% → 80 (average 3 paid months) |
| Install → lifetime | 0.2% → 20 |
| Install → bit pack | 1% → 100 × $3 average |
| Average daily active free users | 1,500 |
| Ads per free DAU per day | 1.5 interstitial + 0.8 rewarded |
| eCPM (blended, varies a lot by country) | $6 interstitial, $10 rewarded |

| Line | Gross (USD) |
|---|---|
| Yearly: 240 × $47.99 | 11,518 |
| Monthly: 80 × $7.99 × 3 | 1,918 |
| Lifetime: 20 × $119.99 | 2,400 |
| Bit packs: 100 × $3 | 300 |
| **In-app purchases** | **16,136** |
| Apple commission at 15% (App Store Small Business Program, under $1M a year) | −2,420 |
| Ads: 1,500 × 30 × (1.5 × $6 + 0.8 × $10) / 1000 | 765 |
| **Net before costs** | **≈ 14,480 per 10,000 installs** |

Running costs are small next to this. Firebase Auth and Firestore fit the free tier at this scale (one small document per signed-in learner). RevenueCat is free up to a monthly revenue threshold, then takes a small percentage, so check revenuecat.com/pricing. Apple Developer is $99 a year. The studio voice clips are a one-time cost.
**Break-even on paid installs** (cost per install you can afford) ≈ net ÷ installs ≈ **$1.45**, before any profit margin. Keep paid campaigns below about $1 per install until real conversion data replaces these assumptions.

## 7. Targets and levers
| KPI | Target | Lever in the app |
|---|---|---|
| D1 / D7 / D30 retention | 40% / 18% / 8% | journey chapters and gates, daily quests, red envelope, streak and freezes, reminders, music and feel |
| Install → paywall view | ≥ 45% | locked chapter 2 visible on the path, milestone paywall after module 3 |
| Paywall → trial | ≥ 12% | trial preselected, Free vs PRO table, source-specific headline |
| Trial → paid | ≥ 40% | real value by day 7: gates, labs, exams; reminder pushes |
| Rewarded opt-in | ≥ 30% of free DAU | revive at the moment of loss, double bits after a module |

**First experiments** (one at a time, two weeks each): trial length 7 vs 3 days; yearly price $47.99 vs $39.99; milestone paywall after module 3 vs 2; revive priced at 40 vs 60 bits.

## 8. Rules that protect the business
- PRO comes only from the App Store entitlement (RevenueCat `pro`), never from synced data or from the web app.
- Trial text appears only when Apple reports eligibility (`checkTrialOrIntroductoryPriceEligibility`). The price after the trial is always shown under the button.
- Ads are never shown to PRO users, never in the middle of a lesson or question, and at most 6 interstitials and 5 rewarded ads a day.
- App Store products to create: see `docs/IN_APP_PURCHASES.md` (subscriptions, lifetime and the three bit packs).
