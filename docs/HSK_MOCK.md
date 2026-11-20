# HSK mock exams and Business Chinese

`hp/src/mock.js`
- Route `mock` ({l}) – timed practice test per HSK level, sections like the real exam: 听力 listening (hear a word →
  characters; hear a sentence → meaning), 阅读 reading (word → meaning; sentence gap), 书写 writing from HSK 3 (put the
  words of a sentence in order). Counts and minutes in `MOCK`. Each section is scored /100: HSK 1–2 total 200 (pass 120),
  HSK 3–6 total 300 (pass 180), matching the official scales. No feedback until the end; answers can be changed;
  missed words go back into spaced review. History `S.mocks[level]`, predicted score = mean of the last three.
  Practice only – the app says it is not the official test.
- Free: one mock per calendar week (`S.mockWeek`); PRO unlimited (paywall src `mock`). Home card + Me.
- Business Chinese: four new business scenes in `content/talk_biz.tsv` (factory visit, MOQ and price/payment terms,
  shipping and customs with CIF/FOB and documents, quality complaint), with the existing six; Me → "Business Chinese:
  trading with China" opens them. Rebuild with `scripts/talk_build.py` (errors 0) and the voice corpus.
- Test: `python3 scripts/test_mock.py mobile/assets/web/hanzi-path.html OUT` → `errors []`.
