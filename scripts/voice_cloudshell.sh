#!/usr/bin/env bash
# One command in Google Cloud Shell: record the Hanzi Path studio voice and push the voice packs to GitHub.
#   cd ~/hanzi-path && bash scripts/voice_cloudshell.sh            (uses the current gcloud project)
#   PROJECT=my-project bash scripts/voice_cloudshell.sh             (or name the project)
# Safe to re-run: finished recordings are cached in ~/.hanzi-voice, so a re-run only records new or failed lines.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only || echo "(git pull skipped)"
PROJECT="${PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
if [ -z "$PROJECT" ]; then echo "Set a project first: gcloud config set project YOUR_PROJECT_ID"; exit 1; fi
echo "== Project: $PROJECT"
gcloud services enable texttospeech.googleapis.com --project "$PROJECT"
command -v ffmpeg >/dev/null || { echo "== Installing ffmpeg (trims silence, compresses clips)"; sudo apt-get install -y -qq ffmpeg >/dev/null || true; }
python3 scripts/voice_gen.py --project "$PROJECT" --yes "$@"
du -sh mobile/assets/voice
git add mobile/assets/voice mobile/src/voicePacks.js
if git diff --cached --quiet; then echo "== Voice packs unchanged"; exit 0; fi
git commit -q -m "Studio voice packs (Google Chirp 3 HD)"
if git push -q; then echo "== Done: voice packs pushed. Next EAS build includes the studio voice."
else echo "== Recorded and committed, but git push failed here. Build from this folder (npx eas-cli build -p ios) or push with your GitHub token."; fi
