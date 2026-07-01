# Lane D brief: reproducibility norms + Project Sid cautionary case

## Scope

Two outputs: (1) the concrete release checklist this project must meet to be
publishable; (2) a verified, honest Project Sid artifact-status statement so Sid is
used as a cautionary reference, not a model to copy. Tied to the framing rule:
reproducibility infra is support/audit surface, not the contribution.

## Sources reviewed

- 9 new sources this lane (manifest rows): Sid repo re-verification, Pineau ML
  Reproducibility Checklist (JMLR 2021 + v2.0 PDF), Papers-with-Code 5-item code
  bar, NeurIPS Datasets and Benchmarks track norms, Embracing Negative Results
  (2406.03980), Questionable Practices in ML (2407.12220), Reproducibility as AI
  governance (2510.11595), AIvilization v0 (2602.10429).
- 3 existing old-archive notes cited (not rewritten): project-sid-critical-review,
  benchmark-validity-and-evaluation, reproducibility-matrix.
- Verbatim checklist text extracted locally via pdftotext from two binary PDFs.

## Strongest findings (verified)

- Sid releases NOTHING runnable: live re-verification 2026-06-17 shows the altera-al
  org has one public repo, project-sid, top level = report PDF + README + image +
  video. README is silent on code (no release, no promise, no decline). 0/5 on the
  Papers-with-Code code-completeness bar. Every Sid metric is UNREPRODUCED.
- A concrete, well-established publishable bar exists and is enumerated verbatim:
  Pineau v2.0 checklist (dependencies, training/eval code, README results table with
  precise command, hyper-parameter ranges + selection, exact run count, metric
  definition, central tendency + variation, runtime/compute), Papers-with-Code 5
  items, NeurIPS D&B hosting/Croissant/license norms.
- Negative-result reporting is a credibility lever, not a courtesy (2406.03980,
  2510.11595): suppressing failed runs reproduces publication bias and yields
  evidentially weak claims.

## Weak / uncertain claims (flagged)

- 2406.03980 negative-results taxonomy: abstract-level only, body not fetched.
- 2407.12220 questionable-practices catalog: secondary/abstract-level only.
- AIvilization v0 (2602.10429): abstract-level; release/scoring-artifact status NOT
  verified. Used only to show the large-society trend continues, not as a repro
  example either way.
- "No independent Sid replication exists": absence of evidence from web search, not
  proof of nonexistence.

## Implications for the repo

- Build the release around a DETERMINISTIC verifier scoring script + raw world logs
  + pinned seeds/env + held-out scenarios + negative/cost/failure traces. That is
  the exact artifact set Sid lacks.
- Mark training-code and pretrained-weights items n/a-with-reason (advisory WAM, not
  a trained policy), do not fake them.
- Position the audit surface as support infrastructure. Do NOT claim
  reproducibility/structured-state as the novelty; do NOT frame as evidence-first
  benchmarking.

## Recommended next questions

- Does AIvilization v0 release a scoring harness? If yes, it is a better-than-Sid
  reproducibility datapoint; if no, it joins the claim-only column.
- Should the repo pre-register held-out social-material scenarios publicly before the
  first headline run (to harden the falsifiability claim)?
- What is the minimal Croissant + license + hosting plan for a verifier-labeled
  transition log, if any artifact is released?

## One-line tie to the thesis

Project Sid is the cautionary anchor: large emergent-society claims with nothing
runnable; the project's deterministic-verifier release surface is what clears the
publishable bar Sid did not, but that surface is audit infrastructure, not the
social-science contribution.

## Deconfliction

- I cite (not rewrite) the old archive Sid review, validity note, and reproducibility
  matrix. The artifact-status table here is a LIVE re-verification (2026-06-17),
  complementary to the old review's claim-by-claim plausibility analysis.
- Overlap risk with Lane A (SDK authority boundary): I touch the "advisory WAM /
  verifier scores, no progress laundering" rule only as it bears on the SCORING
  SCRIPT admissibility; the authority-boundary mechanics are Lane A's.
- Overlap risk with Lane B (novelty): I assert the cautionary/positioning lesson, not
  the cross-product novelty rows; defer novelty matrix to Lane B.
