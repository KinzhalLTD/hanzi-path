#!/usr/bin/env bash
# Rebuild out/hsk_words.json from the HSK source list + all hand-written content files.
set -e; cd "$(dirname "$0")/.."
python3 -I scripts/merge_hsk.py sources/complete-hsk-vocabulary/complete.json out/batch01_hsk1.json out/hsk_words.json \
  content/ar_l12.tsv content/hsk12.tsv content/hsk3.tsv content/hsk4.tsv \
  content/hsk5a.tsv content/hsk5b.tsv content/hsk5c.tsv content/hsk5d.tsv \
  content/hsk6a.tsv content/hsk6b.tsv content/hsk6c.tsv content/hsk6d.tsv content/hsk6e.tsv content/hsk6f.tsv content/hsk6g.tsv content/hsk6h.tsv \
  content/en_l123.tsv content/ex_en_b1.tsv
