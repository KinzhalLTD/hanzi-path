# Hanzi Path – notes for Claude sessions

- Source lives in `hp/src/*.js`; never edit `hp/dist/` by hand. Build with `bash scripts/build.sh` (must print "build OK").
- Module order and placeholders (`__SAMPLES__`, `__PHOTOS__`, `__CHARS__`, `__STROKES__`, `__SECEXT__`, `__KL__`, `__TANGRAMS__`) are defined in `scripts/build_hp.py`.
- Content: HSK TSV formats are 8 fields `hanzi|pinyin|arabic|english|ex zh|ex pinyin|ex ar|ex en` or 7 fields (no English gloss). After editing, run `bash scripts/merge_all.sh` then build.
- Validate pinyin against CC-CEDICT with `scripts/check_content.py` before merging. Polyphonic characters need hand-checked readings.
- Bilingual UI: every string needs Arabic and English (`hp/src/i18n.js` or inline `isAr()?…:…`). Check RTL layout.
- Run `python3 scripts/regress.py hp/dist/hanzi-path.html /tmp/r.png` and the relevant `scripts/test_*.py` after changes; they must report `errors []`.
- Owner works on Windows and prefers copy-paste commands (e.g. Google Cloud Shell) over click-by-click steps.
- Bundle ID `space.kinzhal.hanzipath`; Firebase project `hanzi-path-64170`.
