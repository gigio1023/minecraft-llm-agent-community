# Lane D search log: reproducibility norms + Project Sid cautionary

Lane: D. Scope: (1) publishable reproducibility norms for this kind of work, (2) a
verified artifact-status statement for Project Sid. Date: 2026-06-17.

All claims here separate VERIFIED (I fetched and read the body or repo file) from
CLAIM-ONLY (read an abstract or secondary summary). ASCII punctuation only.

## Tools used

- WebFetch (GitHub repo pages, raw README, JMLR/McGill PDFs, arXiv abstract pages).
- WebSearch (norm documents, Sid status, negative-results literature).
- Bash + pdftotext (local extraction of the two checklist PDFs that WebFetch could
  not parse because they returned binary).
- Did NOT use `hf papers` this lane: the targets are norm documents (NeurIPS policy,
  McGill checklist, Papers with Code) and a repo-status check, not arXiv-indexed
  cornerstones needing LaTeX. The arXiv items here (negative results, questionable
  practices, AIvilization, AI-governance repro) were sufficient at
  abstract/secondary level for a norms-and-cautionary lane; flagged claim-only.

## Project Sid artifact status (VERIFIED this pass)

1. WebFetch https://github.com/altera-al/project-sid
   - Result: top level holds exactly four items: `2024-10-31.pdf` (report),
     `README.md`, `visual_abstract.png`, `projectSidVideo.mp4`. No source code, no
     PIANO implementation, no logs, no transcripts, no seeds, no scoring scripts,
     no prompts/configs. Repo is a paper-publication venue, not a code release.
     Last updated 2024-11-04. 1.3k stars, 51 forks. Accessed OK.
2. WebFetch https://raw.githubusercontent.com/altera-al/project-sid/main/README.md
   - Result: README contains only an abstract, an arXiv pointer, and a citation
     block. It makes NO statement about code release, data, logs, a product, a
     future release, OR an explicit decline. It is simply silent on availability.
     Accessed OK.
3. WebFetch https://github.com/orgs/altera-al/repositories
   - Result: the altera-al org has exactly ONE public repository, `project-sid`.
     No separate code repo exists in the org. Accessed OK.
   - Conclusion (VERIFIED): as of 2026-06-17 there is no released runnable artifact
     for Project Sid anywhere under the official org. This matches the old archive's
     2026-06-15 review finding; this pass re-verified it live.
4. WebSearch "project sid PIANO independent reproduction replication ... 2025 2026"
   - Result: found only paper reviews, press coverage, and the arXiv page. No
     independent reimplementation or replication located. (Absence of evidence, not
     proof of absence; recorded as "no independent replication located".)

## Reproducibility / release norms (VERIFIED text where noted)

5. WebSearch "ML Reproducibility Checklist Pineau ... NeurIPS items"
   - Found JMLR 22(164) (arXiv 2003.12206) and the McGill v2.0 checklist PDF.
6. WebFetch https://jmlr.org/papers/volume22/20-303/20-303.pdf
   - WebFetch could not parse (binary). Saved PDF locally and ran pdftotext.
   - VERIFIED extracted text: the report describes three program components (code
     submission policy, reproducibility challenge, the checklist), the checklist
     questions including "Clearly defined error bars" and "A description of results
     with central tendency (e.g. mean) and variation (e.g. stddev)", and the
     adoption statistics (e.g. only 34% of reviewers found checklist answers useful;
     code-at-submission positively associated with reviewer score, p < 1e-08).
7. WebFetch https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf
   - WebFetch could not parse (binary). Saved locally, ran pdftotext.
   - VERIFIED full verbatim v2.0 checklist extracted (5 sections: models/algorithms;
     theoretical claim; datasets; shared code; reported experimental results). Full
     item list captured in notes/by-paper/pineau-ml-reproducibility-2020-checklist.md.
8. WebSearch "NeurIPS Datasets and Benchmarks track ... croissant reproducibility"
   - VERIFIED via NeurIPS official call pages content: accessibility (no personal
     request to PI), open-source code, persistent public hosting (Dataverse, Kaggle,
     Hugging Face, OpenML), small sample for >4GB datasets, mandatory Croissant
     metadata (extended to RAI metadata for 2026 Evaluations and Datasets track),
     open/permissive licenses (CC BY 4.0, CC0). Captured in by-paper note.
9. WebSearch "Papers with Code ML Code Completeness Checklist five items"
   - VERIFIED via Papers with Code / paperswithcode/releasing-research-code: the
     five items are dependencies, training scripts, evaluation scripts, pretrained
     models, results (table + script). These are the official NeurIPS 2020 code
     recommendations. Captured in by-paper note.

## Negative-result and reporting-norm literature

10. WebSearch "negative results reporting machine learning publication bias ..."
    - Found: "Position: Embracing Negative Results in ML" (arXiv 2406.03980, ICML
      2024), "Questionable Practices in Machine Learning" (arXiv 2407.12220),
      "Reproducibility: The New Frontier in AI Governance" (arXiv 2510.11595).
11. WebFetch https://arxiv.org/abs/2406.03980
    - CLAIM-ONLY (abstract-level): core argument is that judging publication merit
      by predictive performance alone creates community inefficiency and wrong
      incentives; the paper calls to normalize publishing negative results. The
      specific taxonomy of negative results was NOT extractable from the abstract
      page; flagged as not-verified-in-body.

## Contrast data point (CLAIM-ONLY)

12. WebSearch "AIvilization arxiv 2602.10429 ... contrast Project Sid"
    - CLAIM-ONLY (abstract + project-site summary): AIvilization v0 (HKUST + Bauhinia
      AI, submitted 2026-02-11) is a publicly deployed large-scale artificial society
      with a unified LLM-agent architecture; project site https://aivilization.ai.
      Recorded only as evidence the large-society line continues after Sid; release
      status of runnable scoring artifacts NOT verified.

## Unresolved / inaccessible

- arXiv 2406.03980 negative-results taxonomy: only abstract read; body not fetched.
- AIvilization v0 (2602.10429): release/scoring-artifact status unverified.
- The old archive's internal Sid review file
  (`project-docs/references/external-project-notes/project-sid-2411-00114-review-2026-06-15.md`,
  token PROJECT_SID_2411_00114_REVIEW) was NOT re-read this pass; I cite the old
  archive's by-theme note (project-sid-critical-review.md) per the reuse rule, and
  independently re-verified the live repo status (items 1-3 above).
