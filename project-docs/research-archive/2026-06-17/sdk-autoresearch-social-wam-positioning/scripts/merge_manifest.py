#!/usr/bin/env python3
"""Merge per-lane manifest fragments into the canonical source-manifest.jsonl.

Dedupes by `id`: when a source appears in multiple lanes, union its
relevance_tags and lanes, and prefer non-empty field values. Prints stats used
by the final report (unique sources, LaTeX vs PDF vs abstract counts, per-lane,
per-tag).

Usage: python3 scripts/merge_manifest.py
Run from the deep-social-wam-literature-review root.
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frag_glob = os.path.join(ROOT, "raw-search-results", "lane-*-manifest.jsonl")
out_path = os.path.join(ROOT, "source-manifest.jsonl")

PREFER = [
    "title", "authors", "year", "venue", "url", "arxiv_id", "code_url",
    "data_url", "hf_url", "downloaded_latex_path", "downloaded_pdf_path",
    "source_availability", "reproducibility_status", "notes_path",
]

merged: dict[str, dict] = {}
total_lines = 0
bad_lines = 0

for frag in sorted(glob.glob(frag_glob)):
    with open(frag, encoding="utf-8") as fh:
        for raw in fh:
            raw = raw.strip()
            if not raw:
                continue
            total_lines += 1
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                bad_lines += 1
                continue
            key = str(obj.get("id") or obj.get("arxiv_id") or obj.get("title") or f"row-{total_lines}")
            if key not in merged:
                # normalise lane + tags into lists we can union
                obj["lanes"] = sorted({obj["lane"]} if "lane" in obj else set())
                obj["relevance_tags"] = sorted(set(obj.get("relevance_tags") or []))
                merged[key] = obj
            else:
                cur = merged[key]
                if "lane" in obj:
                    cur["lanes"] = sorted(set(cur.get("lanes", [])) | {obj["lane"]})
                cur["relevance_tags"] = sorted(set(cur.get("relevance_tags", [])) | set(obj.get("relevance_tags") or []))
                for f in PREFER:
                    if not cur.get(f) and obj.get(f):
                        cur[f] = obj[f]

records = list(merged.values())
records.sort(key=lambda r: (r.get("lanes") or [9])[0] if (r.get("lanes")) else 9)

with open(out_path, "w", encoding="utf-8") as out:
    for r in records:
        out.write(json.dumps(r, ensure_ascii=False) + "\n")

# ---- stats ----
def has_latex(r: dict) -> bool:
    return bool(r.get("downloaded_latex_path")) or r.get("source_availability") == "latex"

def is_pdf(r: dict) -> bool:
    return (not has_latex(r)) and (bool(r.get("downloaded_pdf_path")) or r.get("source_availability") == "pdf")

def is_abstract(r: dict) -> bool:
    return r.get("source_availability") in (None, "", "abstract", "repo", "docs") and not has_latex(r) and not is_pdf(r)

latex_n = sum(1 for r in records if has_latex(r))
pdf_n = sum(1 for r in records if is_pdf(r))
abs_n = sum(1 for r in records if is_abstract(r))

per_lane: dict[str, int] = {}
for r in records:
    for ln in (r.get("lanes") or ["?"]):
        per_lane[str(ln)] = per_lane.get(str(ln), 0) + 1

per_tag: dict[str, int] = {}
for r in records:
    for t in (r.get("relevance_tags") or []):
        per_tag[t] = per_tag.get(t, 0) + 1

repro: dict[str, int] = {}
for r in records:
    k = r.get("reproducibility_status") or "unknown"
    repro[k] = repro.get(k, 0) + 1

print(f"fragment lines read : {total_lines}")
print(f"bad/unparsed lines  : {bad_lines}")
print(f"unique sources      : {len(records)}")
print(f"LaTeX downloaded    : {latex_n}")
print(f"PDF-only            : {pdf_n}")
print(f"abstract/repo/docs  : {abs_n}")
print(f"per-lane (with dup across lanes): {dict(sorted(per_lane.items()))}")
print(f"reproducibility     : {dict(sorted(repro.items()))}")
print(f"relevance tags      : {dict(sorted(per_tag.items(), key=lambda kv: -kv[1]))}")
print(f"written             : {out_path}")
