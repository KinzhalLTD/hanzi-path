# Career paths & interview practice (Cipher Path)

`cp/src/career.js` – `CAREERS.soc` (Junior SOC analyst) and `CAREERS.dev` (Junior developer).
- Path items: modules (`['mod', key]`), code labs (`['code', key]`, done = `S.labs[key]`) and security labs with a round
  count (`['sec', lab, n]`, from `S.sec[lab]`). Tapping a step opens it.
- Interview bank: 14 bilingual questions per path with the key points of a strong answer. Practice = think → reveal →
  rate yourself (0/1/2, `S.iv[path][i]`, +5 XP for "nailed it").
- Readiness = 70 % path items + 30 % interview self-ratings. Home shows the path that matches the learner's focus;
  Me → Career paths & interviews.
- AI mock interview (PRO): the tutor in `interview` mode with the role; the server (`server/functions`, mode
  `interview`) asks one question at a time, gives ✓/↑ feedback and a score out of 10 after five answers. Uses the
  learner's tutor allowance.
- Job-ready certificate (`job-soc` / `job-dev`) when every step is done and every interview question is rated at
  least "partly" – it appears with the other certificates.
- Test: `python3 scripts/test_career.py mobile/assets/web/cipher-path.html OUT` → `errors []`.
