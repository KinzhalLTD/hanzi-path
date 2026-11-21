# Cipher Path – beta test plan (TestFlight)

Goal: prove with real learners that the app teaches, keeps people coming back, and is worth paying for. Run it for 3 weeks with 20–50 testers.

## 1. Who to invite
- 10–20 university students or graduates in computing / IT (Saudi universities, Tuwaiq Academy, SDAIA and NCA bootcamp alumni).
- 5–10 career switchers aiming at a first tech job.
- 3–5 working professionals (one developer, one SOC analyst, one Mandarin speaker) as expert reviewers.

## 2. Ship the build (copy-paste in Cloud Shell)
```bash
cd ~/cipher-path/mobile && npm ci && npm run check:store && npx expo export --platform ios
npx eas-cli@latest build -p ios --profile production --auto-submit
```
Then in App Store Connect → TestFlight → External testing: add a group "Beta", paste the testers' emails, and send. Apple's beta review usually takes about a day.

## 3. What the app already measures (GA4 events)
| Question | Event / metric | Good result |
|---|---|---|
| Do people start? | `onboard` → first `module_done` | ≥ 50% finish module 1 |
| Do they come back? | `return_d` (day 1 / day 7) | D1 ≥ 40%, D7 ≥ 20% |
| Do they learn? | boss fight score, `weak` re-asks cleared | median boss score ≥ 75% |
| Is anything wrong? | `content_report` (⚑ button in the quiz feedback) | every reported id fixed within a week |
| Would they pay? | `paywall_view` → `purchase_start` | ≥ 5% start checkout |

## 4. Expert review (content and Chinese)
Export the review sheets and send one file to each expert:
```bash
cd ~/cipher-path && python3 -I scripts/review_export.py "$PWD"
```
- `docs/review/questions.csv` and `lessons.csv`: a security analyst and a developer mark each row **OK** or **Fix** with a comment (about 6–8 hours each; split by track).
- `docs/review/chinese_terms.csv`: a Mandarin speaker working in tech marks each term as natural or suggests a better one (about 4 hours).
Send the filled files back to Claude to apply the fixes.

## 5. Survey at the end of week 2 (5 questions)
1. What did you learn that you could use at work or in an interview? (open)
2. How likely are you to recommend the app to a friend? (0–10)
3. Which part was most useful: lessons, labs, boss fights, interview prep, Chinese? (pick up to 2)
4. What almost made you stop using it? (open)
5. Would you pay 29.99 SAR a month or 179.99 SAR a year for PRO? (yes / maybe / no)

## 6. Decide
- NPS ≥ 40, D7 ≥ 20% and expert sheets fixed → submit to the App Store.
- Weak D7 → look at where people stop (GA4 funnel) and shorten that step first.
