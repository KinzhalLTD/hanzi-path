# Hanzi Path 汉字之路

Chinese for Arabic and English speakers: all of HSK 1–6 (4,995 words), each with an Arabic meaning,
corrected pinyin and a four-language example sentence, plus culture, legends, writing practice, traditional
games, a Chinese-for-programmers path, 9 industry vocabularies (979 terms), Chinese dialects and an adaptive soundtrack.

Live preview: https://claude.ai/artifact/3aHGcsoEvxkHoZ4BPCV31Q

## Layout
| Path | What |
|---|---|
| `hp/src/` | App source modules (JS + CSS) |
| `hp/dist/hanzi-path.html` | Built single-file app (generated, committed so the native app can bundle it) |
| `content/` | Hand-written content: HSK `hsk*.tsv`, sector terms `sec_*.tsv`, English glosses |
| `out/` | Generated data used by the build (word list, stroke data, character data, instrument samples) |
| `art/` | Game art and photos (embedded as webp in `photos.json`; sector originals in `art/sectors/`) |
| `sources/` | Upstream HSK list (complete-hsk-vocabulary, MIT) |
| `vendor/` | Hanzi Writer (MIT) |
| `native/` | Expo / React Native wrapper: WebView bridge, Firebase auth + sync, notifications |
| `docs/` | Setup guides |
| `scripts/` | Build, content validation and Playwright tests |

## Build
```bash
bash scripts/merge_all.sh   # only after editing content/*.tsv
bash scripts/build.sh       # writes hp/dist/hanzi-path.html
```
Validate a content batch (needs `out/cedict_base.json`, generated from CC-CEDICT by `scripts/parse_cedict.py`):
```bash
python3 -I scripts/check_content.py content/hsk6a.tsv out/cedict_base.json out/hsk_words.json 6
python3 -I scripts/sec_ext.py . content/sec_a.tsv content/sec_b.tsv content/sec_c.tsv
```
Tests (Playwright + Chrome, 390×844): `python3 scripts/regress.py hp/dist/hanzi-path.html /tmp/r.png`,
`python3 scripts/test_music3.py hp/dist/hanzi-path.html /tmp`, and the other `scripts/test_*.py`.

## Native app
- Bundle ID: `space.kinzhal.hanzipath`
- Firebase project: `hanzi-path-64170` (Auth: Apple + Google, Firestore `users/{uid}`, rules in `native/firestore.rules`)
- See `docs/FIREBASE_SETUP.md`. The web build shows a labelled demo login; inside the native WebView the same buttons use real accounts.

## Credits
See `NOTICE.md`.
