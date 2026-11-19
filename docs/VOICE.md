# Cipher Path – studio voices and the conversation cast

Every character has a voice of their own:
- **Narrator** (`n`) reads the terms, module titles and opens each conversation by announcing the scene.
- **Conversation partners** each have their own voice, chosen to match the role (`SCENE_CAST` in `cp/src/voice.js`).
  Team lead Lin, senior engineer Zhou, Ma from ops, Wang the PM, Director Liu, security engineer Wang, incident lead Chen,
  auditor Liu (female), IT director Zhao and developer Li all sound different.
- **Module dialogues** use a different pair of voices per module (`DLG_CAST`).
- **The learner's replies** use a male or a female voice (Me → Your voice in conversations).

| Cast id | Studio voice (Google Chirp 3 HD) | Phone fallback |
|---|---|---|
| n | Charon (or the narrator chosen for Hanzi Path) | best male voice |
| p | Kore | female |
| m1 / m2 / m3 / m4 / m5 | Puck / Iapetus / Fenrir / Orus / Algieba | male voices, different pitch and speed |
| f1 / f2 / f3 | Aoede / Leda / Despina | female voices, different pitch and speed |

Until the studio clips are recorded the app uses the phone's Chinese voices, spread over the cast with a different
pitch and speed per character, so the characters already sound different.

## Record the studio voices (Google Cloud Shell, copy-paste)
The whole corpus is 625 clips and about 6,300 characters. That is far inside the Text-to-Speech free monthly quota for
Chirp 3 HD voices, so it should cost nothing, but check your quota on the Cloud console.
```bash
cd ~ && (git clone -b cipher-path https://github.com/KinzhalLTD/hanzi-path.git cipher-path 2>/dev/null || (cd cipher-path && git pull --ff-only))
cd ~/cipher-path && bash scripts/voice_cloudshell.sh
```
- The script turns on the Text-to-Speech API on your current project, records only lines that are not in `~/.cipher-voice` yet,
  packs them into `mobile/assets/voice/*.bin`, writes `mobile/src/voicePacks.js`, commits and pushes.
- If you ran the Hanzi Path audition before, the same narrator voice and speed are reused. To audition again:
  `bash scripts/voice_cloudshell.sh --audition`.
- The next EAS build then includes the studio voices (about 1.7 MB).

After any content change that adds spoken Chinese: `python3 scripts/voice_corpus.py cp/dist/cipher-path.html`, commit
`content/voice/corpus.json`, and run the Cloud Shell command again (it records only the new lines).
