#!/usr/bin/env bash
# Build the single-file app: cp/dist/cipher-path.html (+ cp/dist/app.js for syntax checks)
set -e; cd "$(dirname "$0")/.."
python3 -I scripts/build_cp.py "$PWD"
node --check cp/dist/app.js && echo "build OK"
