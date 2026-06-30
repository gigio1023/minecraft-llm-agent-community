# NeurIPS Datasets and Benchmarks Track: release norms

- Source: NeurIPS Datasets and Benchmarks Track calls for papers (2023, 2025) and
  the 2026 Evaluations and Datasets Track blog posts; neurips.cc official pages.
- Access: WebSearch summaries of the official call pages and NeurIPS blog. Norms
  below VERIFIED as stated on those official pages (not a re-derivation).
- Why in this lane: if the repo positions any released scenario set or labeled
  transition log as a benchmark artifact, this is the venue bar it would meet. (The
  repo's contribution is NOT the benchmark per the contract; this is the bar the
  support artifact should still satisfy if released.)

## Concrete requirements (VERIFIED as stated)

- Accessibility: the dataset must be obtainable WITHOUT a personal request to the
  PI; required code must be open source.
- Hosting: persistent public hosting on a dedicated site (Dataverse, Kaggle, Hugging
  Face, or OpenML), or a bespoke site if needed. For datasets larger than 4GB, ship
  a small inspectable sample for reviewers.
- Documentation: how the data was collected and organized, what it contains, how to
  use it ethically, and how it will be maintained over time.
- Metadata: a Croissant file is mandatory (standardized machine-readable dataset
  metadata). For the 2026 Evaluations and Datasets track, Responsible AI (RAI)
  metadata is required inside that Croissant file.
- Licensing: authors predominantly chose open permissive licenses (CC BY 4.0, CC0).
- Reproducibility: 2025 best practices add more stringent criteria so artifacts
  remain useful and accessible OVER TIME, not just at publication.

## Interpretation for the repo (labeled inference)

- The strongest transferable norms: persistent hosting (not a dead link), a small
  inspectable sample, maintenance commitment, and an open license. A verifier-labeled
  transition log released on Hugging Face with a Croissant file and a held-out
  scenario split would clear this bar.
- "Held-out scenarios" is the D&B-style guard against tuning on the test set: the
  repo should reserve unseen social-material scenarios (new partner, new seed, new
  world) that are scored only once, mirroring train/val/test discipline.
- Caveat (contract): meeting this bar is hygiene, not novelty. A clean benchmark
  release does not make benchmarking the contribution; it makes the audit surface
  credible.
