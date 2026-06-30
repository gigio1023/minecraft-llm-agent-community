#!/usr/bin/env bash
# fetch_arxiv_latex.sh
#
# Download an arXiv paper's LaTeX source (preferred) and PDF (fallback) into the
# deep-social-wam-literature-review papers/ tree. LaTeX-first by repo research rule.
#
# Usage:
#   ./fetch_arxiv_latex.sh <arxiv_id> [short_slug]
# Example:
#   ./fetch_arxiv_latex.sh 2605.12090 world-action-models-survey
#
# Output layout (relative to the review root):
#   papers/latex/<arxiv_id>/        extracted .tex/.bib/figures (if source is a tarball)
#   papers/latex/<arxiv_id>.<ext>   single-file source when not a tarball
#   papers/pdf/<arxiv_id>.pdf       PDF fallback (only fetched with --pdf or when latex missing)
#   papers/metadata/<arxiv_id>.json line recording what was fetched
#
# Notes:
# - arXiv e-print endpoint returns gzip'd tar, a single gzip'd .tex, or occasionally a PDF.
# - Be polite: this script sleeps 3s after each network call. Do not hammer arXiv.
set -uo pipefail

ID="${1:-}"
SLUG="${2:-}"
if [[ -z "$ID" ]]; then
  echo "usage: $0 <arxiv_id> [slug]" >&2
  exit 2
fi

# Resolve review root from this script's location (scripts/ is one level under root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LATEX_DIR="$ROOT/papers/latex"
PDF_DIR="$ROOT/papers/pdf"
META_DIR="$ROOT/papers/metadata"
mkdir -p "$LATEX_DIR" "$PDF_DIR" "$META_DIR"

UA="deep-social-wam-litreview/1.0 (research; contact: repo agent)"
SRC_URL="https://arxiv.org/e-print/${ID}"
PDF_URL="https://arxiv.org/pdf/${ID}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

latex_status="missing"
pdf_status="not_requested"

echo "[fetch] $ID source -> $SRC_URL"
if curl -fsSL -A "$UA" "$SRC_URL" -o "$tmp/src"; then
  kind="$(file -b "$tmp/src" 2>/dev/null || echo unknown)"
  echo "[fetch] $ID source kind: $kind"
  case "$kind" in
    *gzip*|*"tar archive"*|*XZ*|*"POSIX tar"*)
      dest="$LATEX_DIR/$ID"
      mkdir -p "$dest"
      if tar -xf "$tmp/src" -C "$dest" 2>/dev/null; then
        latex_status="tarball_extracted"
      elif gunzip -c "$tmp/src" > "$dest/main.tex" 2>/dev/null; then
        latex_status="single_gz_tex"
      else
        cp "$tmp/src" "$LATEX_DIR/$ID.raw"
        latex_status="raw_copied"
      fi
      ;;
    *PDF*)
      cp "$tmp/src" "$PDF_DIR/$ID.pdf"
      latex_status="source_was_pdf"
      pdf_status="from_eprint"
      ;;
    *)
      # try tar then gunzip blindly
      dest="$LATEX_DIR/$ID"
      mkdir -p "$dest"
      if tar -xf "$tmp/src" -C "$dest" 2>/dev/null; then
        latex_status="tarball_extracted"
      elif gunzip -c "$tmp/src" > "$dest/main.tex" 2>/dev/null; then
        latex_status="single_gz_tex"
      else
        cp "$tmp/src" "$LATEX_DIR/$ID.raw"
        latex_status="raw_copied_unknown"
      fi
      ;;
  esac
else
  echo "[fetch] $ID source download FAILED" >&2
fi
sleep 3

# PDF fallback: fetch when latex missing, or when --pdf passed as slug-position flag.
if [[ "$latex_status" == "missing" || "$SLUG" == "--pdf" || "${3:-}" == "--pdf" ]]; then
  echo "[fetch] $ID pdf -> $PDF_URL"
  if curl -fsSL -A "$UA" "$PDF_URL" -o "$PDF_DIR/$ID.pdf"; then
    pdf_status="downloaded"
  else
    pdf_status="failed"
  fi
  sleep 3
fi

# Count .tex files for quick verification.
texcount=0
if [[ -d "$LATEX_DIR/$ID" ]]; then
  texcount="$(find "$LATEX_DIR/$ID" -iname '*.tex' | wc -l | tr -d ' ')"
fi

cat > "$META_DIR/$ID.json" <<JSON
{"arxiv_id": "${ID}", "slug": "${SLUG}", "src_url": "${SRC_URL}", "pdf_url": "${PDF_URL}", "latex_status": "${latex_status}", "pdf_status": "${pdf_status}", "tex_file_count": ${texcount}}
JSON

echo "[fetch] $ID done: latex=$latex_status pdf=$pdf_status tex_files=$texcount"
