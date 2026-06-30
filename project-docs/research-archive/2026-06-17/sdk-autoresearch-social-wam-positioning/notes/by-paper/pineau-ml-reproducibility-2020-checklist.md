# ML Reproducibility Checklist (Pineau et al., JMLR 2021 / v2.0 artifact)

- Sources: JMLR 22(164):1-20 "Improving Reproducibility in Machine Learning
  Research (A Report from the NeurIPS 2019 Reproducibility Program)" (arXiv
  2003.12206); and the v2.0 checklist PDF at
  https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf.
- Access: both PDFs returned binary to WebFetch; I saved them and extracted text
  with pdftotext. The verbatim checklist below is VERIFIED from that extraction.
- Why in this lane: this is the canonical concrete release/reporting checklist for
  ML. It is the spine of the repo's publishable-release checklist (synthesis note).

## The NeurIPS 2019 reproducibility program had three components (VERIFIED)

1. A code submission policy (code is an artifact separate from the paper).
2. A community reproducibility challenge (others re-run the work).
3. The ML Reproducibility Checklist embedded in the submission form (Yes / No /
   Not applicable per item, plus a free-form comment field).

The v2.0 note explicitly renames the checklist the "ML Paper Reproducibility
Checklist" and pairs it with a separate "ML Code Submission checklist," stating
"the paper and the code are two separate research artefacts, each with their own
checklist." Relevant to the repo: releasing a paper-grade writeup is not the same
deliverable as releasing runnable code; both are required.

## The v2.0 checklist, verbatim by section (VERIFIED via pdftotext)

For all models and algorithms presented, check if you include:
- A clear description of the mathematical setting, algorithm, and/or model.
- A clear explanation of any assumptions.
- An analysis of the complexity (time, space, sample size) of any algorithm.

For any theoretical claim, check if you include:
- A clear statement of the claim.
- A complete proof of the claim.

For all datasets used, check if you include:
- The relevant statistics, such as number of examples.
- The details of train / validation / test splits.
- An explanation of any data that were excluded, and all pre-processing steps.
- A link to a downloadable version of the dataset or simulation environment.
- For new data collected, a complete description of the data collection process,
  such as instructions to annotators and methods for quality control.

For all shared code related to this work, check if you include:
- Specification of dependencies.
- Training code.
- Evaluation code.
- (Pre-)trained model(s).
- README file includes table of results accompanied by precise command to run to
  produce those results.

For all reported experimental results, check if you include:
- The range of hyper-parameters considered, method to select the best
  hyper-parameter configuration, and specification of all hyper-parameters used to
  generate results.
- The exact number of training and evaluation runs.
- A clear definition of the specific measure or statistics used to report results.
- A description of results with central tendency (e.g. mean) and variation (e.g.
  error bars).
- The average runtime for each result, or estimated energy cost.
- A description of the computing infrastructure used.

## Adoption findings worth quoting (VERIFIED from the JMLR report)

- Reporting that code was provided at submission was positively associated with the
  reviewer score (p < 1e-08).
- When asked whether the checklist answers were useful for evaluating the
  submission, 34% of reviewers responded Yes. Answering "no" to any checklist
  question was NOT associated with higher acceptance, i.e. honest "no" answers were
  not punished. The checklist is meant as a minimal-information report, "not
  necessarily exhaustive."

## Interpretation for the repo (labeled inference)

- Random seeds are not a separate v2.0 line; they are implied by "exact number of
  runs," "specification of all hyper-parameters," and "precise command to produce
  results." A determinism-first project (the repo's Mineflayer world + verifier)
  should make seeds explicit anyway, because its central claim is exact
  re-derivability of (state, action, next-state) labels.
- The most repo-relevant lines: downloadable simulation environment; data exclusion
  and pre-processing disclosure; dependencies; evaluation code; a README results
  table with the precise command; central tendency AND variation; runtime/compute
  description. These map one-to-one onto the repo's release checklist in the
  synthesis note.
- Cross-reference: the old archive's reproducibility matrix
  (../../../../2026-06-16/deep-social-wam-literature-review/matrices/reproducibility-matrix.md)
  classifies the repo's prospective runs as a "strong reproducibility position by
  construction." This checklist is the concrete bar that judgment is measured
  against. But (per the contract) that release surface is support infrastructure,
  not the research contribution.
