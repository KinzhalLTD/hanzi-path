# Hanzi Path – beta test plan (TestFlight)

Goal: prove with real learners that Arabic speakers learn Chinese with the app, come back, and are willing to pay. Run it for 3 weeks with 20–50 testers.

## 1. Who to invite
- 10–20 Arabic speakers starting Chinese (university Chinese departments in Saudi Arabia, students of the national Chinese-in-schools programme, people preparing for HSK 1–3).
- 5–10 professionals who deal with Chinese companies (engineering, MEP, construction, trade, logistics) – for the sector vocabulary and workplace conversations.
- 2–3 expert reviewers: a native Mandarin speaker, an Arabic–Chinese translator, and a Chinese teacher who knows HSK.

## 2. Ship the build (copy-paste in Cloud Shell)
```bash
cd ~/hanzi-path/mobile && npm ci && npm run check:store && npx expo export --platform ios
npx eas-cli@latest build -p ios --profile production --auto-submit
```
Then in App Store Connect → TestFlight → External testing: add a group "Beta", paste the testers' emails, and send. Apple's beta review usually takes about a day.

## 3. What the app already measures (GA4 events)
| Question | Event / metric | Good result |
|---|---|---|
| Do people start? | `onboarding_complete` → first `lesson_complete` | ≥ 60% finish lesson 1 |
| Do they come back? | `return_d` (day 1 / day 7) | D1 ≥ 40%, D7 ≥ 20% |
| Do they learn? | `review_complete`, `gate`, `mock_done` score | median HSK mock ≥ 70% after 2 weeks for HSK 1 testers |
| Is anything wrong? | `content_report` (⚑ button on every exercise and grammar answer) | every reported id fixed within a week |
| Would they pay? | `paywall_view` → `purchase_start` | ≥ 5% start checkout |

Report ids look like `w1234:gap` (word id and exercise kind) or `g2-guo:` (grammar key), so each report points straight at the item to fix.

## 4. Expert review
Export the review sheets and send them to the reviewers:
```bash
cd ~/hanzi-path && python3 -I scripts/review_export.py "$PWD"
```
- `docs/review/vocabulary.csv` (all HSK words with their example sentences): the native speaker checks pinyin, meaning and that each example sentence sounds natural; the translator checks the Arabic.
- `docs/review/grammar.csv` (335 grammar points with explanations, examples and common mistakes): the Chinese teacher.
- `docs/review/culture_quiz.csv` (culture quiz questions): anyone careful with history and facts.
Each row has a Verdict (OK / Fix) and a Comment column. Send the filled files back to Claude to apply the fixes.

## 5. Survey at the end of week 2 (5 questions)
1. Which Chinese can you now use that you could not before? (open)
2. How likely are you to recommend the app to a friend? (0–10)
3. Which part helped most: lessons, review, grammar, writing, conversations, games, HSK mock? (pick up to 2)
4. What almost made you stop using it? (open)
5. Would you pay 29.99 SAR a month or 179.99 SAR a year for PRO? (yes / maybe / no)

## 6. Decide
- NPS ≥ 40, D7 ≥ 20% and expert sheets fixed → submit to the App Store.
- Weak D7 → look at where people stop (GA4 funnel) and shorten that step first.
