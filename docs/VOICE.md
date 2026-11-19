# Studio voice (Google Chirp 3 HD)

Hanzi Path plays natural studio recordings for every Chinese word and sentence it speaks: words, word examples, grammar examples, conversation lines (narrator voice + a male partner voice), sector terms and culture words. Lines without a recording, and the web version, use the best voice installed on the phone (premium → enhanced → standard).

## Record the voice (one command in Cloud Shell)

Use a Google Cloud project **with billing enabled** (Text-to-Speech requires a billing account even inside the free tier).

```bash
cd ~/hanzi-path && git pull && gcloud config set project YOUR_PROJECT_ID && bash scripts/voice_cloudshell.sh
```

What it does:
1. Enables the Text-to-Speech API on the project.
2. Installs `ffmpeg` if missing (trims silence, compresses to mono 24 kHz MP3 at 32 kbit/s).
3. Records every line in `content/voice/corpus.json` (about 14,600 lines and 85,000 characters). Words are sent with their pinyin, so polyphonic characters are read the way the app teaches them.
4. Packs the clips into `mobile/assets/voice/*.bin` with `index.json`, regenerates `mobile/src/voicePacks.js`, commits and pushes.

The next EAS build then includes the studio voice. In the app, Me → Voice speed shows “studio voice · N recordings”.

## Cost and time

- Chirp 3 HD: the first 1,000,000 characters each month are free, then US$30 per million. A full recording uses about 85,000 characters, so a normal run costs nothing.
- It takes roughly 20–60 minutes, depending on Google's rate limits. Keep the Cloud Shell tab open.
- If it stops, run the same command again. Finished clips are cached in `~/.hanzi-voice`, so only the missing lines are recorded.

## After adding content

New words, grammar or conversations need recordings too:

1. Rebuild the corpus and commit it: `python3 scripts/voice_corpus.py hp/dist/hanzi-path.html`. This needs Playwright, so it runs in the dev environment.
2. Run the Cloud Shell command again. Only the new lines are recorded.

## Options

```bash
bash scripts/voice_cloudshell.sh --female Aoede --male Orus   # other Chirp 3 HD voices
bash scripts/voice_cloudshell.sh --limit 20                   # quick trial: 20 lines per pack
python3 scripts/voice_gen.py --pack-only                      # repack from the cache without recording
```

## How playback works

- `hp/src/voice.js` turns each spoken line into a key, `cyrb53(voice + '|' + text)`. That is the same key `scripts/voice_corpus.py` writes, so nothing else needs to match. The web app asks the native side for the clip.
- `mobile/src/voice.js` reads the clip's bytes straight out of the bundled pack. Packs are never unpacked onto the phone.
- The clip plays in the web view. Speed is Slow 0.72×, Normal or Fast 1.15×, with pitch kept, and music is ducked while it plays.
- Tests: `python3 scripts/test_voice.py mobile/assets/web/hanzi-path.html OUT [ROOT_WITH_PACKS]`.
