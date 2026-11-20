# Chinese calendar & festivals

Shared module `festivals.js` (identical in Hanzi Path `hp/src/` and Cipher Path `cp/src/`; keep them in step).

- 10 festivals: 除夕 eve, 春节, 元宵节, 清明节, 端午节, 七夕, 中秋节, 重阳节, 冬至, 腊八节. Each has the greeting (spoken), a short
  bilingual story, Hanzi Path vocabulary (3–5 words, pinyin checked against CC-CEDICT) and a Cipher Path security tip.
- Dates 2026–2040 in `FEST_DATES`, made by `scripts/festival_dates.py` (pip: lunardate, ephem): lunar dates from the
  Chinese calendar, Qingming and Dongzhi from the sun's longitude (15° / 270°) in China time. Extend the range by
  editing `range(2026, 2041)` and pasting the output.
- In the app: home banner when a festival is ≤ 21 days away (countdown), a celebration sheet the first time the app
  opens on the festival day (lanterns, confetti, greeting audio, red envelope gift once: +30 coins/bits, +20 XP,
  `S.festGot`), the calendar screen (route `festivals`: zodiac year, next 14 festivals, switch), a door on Me.
- Notifications: `festItems()` adds a 10:00 greeting on each festival day (19:00 on New Year's Eve) for the next
  12 months (≤ 13 items; iOS keeps up to 64 pending). Merged with the daily/streak reminders because
  `notify:schedule` replaces the whole set. Switch: `S.festN` (default on).
- Test: `python3 scripts/test_festivals.py hp|cp <phone-shell html> OUT` (fakes the clock on Spring Festival 2027 and
  12 days before the 2026 solstice) → `errors []`.
