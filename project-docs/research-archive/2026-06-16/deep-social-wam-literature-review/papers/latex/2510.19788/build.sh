#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# arXiv-style compile: no shell-escape. Requires pre-generated tikz/*.pdf and external graphics-only mode.
for _ in 1 2 3; do
  pdflatex -synctex=1 -interaction=nonstopmode -file-line-error main.tex
done
