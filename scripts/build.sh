#!/usr/bin/env bash
# Build the single-file app: hp/dist/hanzi-path.html (+ hp/dist/app.js for syntax checks)
set -e; cd "$(dirname "$0")/.."
python3 -I scripts/build_hp.py "$PWD"
node --check hp/dist/app.js && echo "build OK"
