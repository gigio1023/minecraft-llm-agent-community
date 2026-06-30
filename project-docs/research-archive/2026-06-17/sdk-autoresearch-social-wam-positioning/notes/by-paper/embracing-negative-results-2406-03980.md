# Position: Embracing Negative Results in Machine Learning (2406.03980)

- Source: arXiv 2406.03980 (ICML 2024 Position track).
- Access: WebFetch of the abstract page. CLAIM-ONLY: I read the abstract and the
  fetch summary, NOT the full body. The taxonomy of negative-result types was not
  extractable from the abstract; do not cite a specific taxonomy as verified.
- Why in this lane: it is the cleanest published argument that NOT reporting what
  failed harms the field, which is directly the credibility lever for the repo.

## Core argument (VERIFIED at abstract level)

- Judging publication merit by predictive performance alone is harmful: it creates
  inefficiencies in the research community and wrong incentives for researchers.
- Publishing "negative" results (work that did not beat a baseline, ablations that
  failed, approaches that did not pan out) should be normalized; the paper issues a
  call to action and proposes community measures toward that paradigm.

## Supporting context from the same search (VERIFIED at secondary level)

- Publication bias against negative results is linked to more false-positive
  findings in the published record (general-science result, echoed for ML).
- ML tools are trained on the published literature; the absence of negative data
  hampers learning and hides dead-ends from other researchers.

## Interpretation for the repo (labeled inference)

- The repo's stance already treats cost and failure traces as first-class results
  (see old archive benchmark-validity note section 8). This paper is the external
  citation that makes "we report stalls, blocked actions, failed continuity, and
  runs where no model sustained the social-material transition" a credibility
  ASSET, not an embarrassment.
- Concretely: a release should include negative runs (seed/partner combinations
  where the actor failed to repair, hoarded under scarcity, or laundered progress
  that the verifier caught). Suppressing these would reproduce exactly the
  publication bias this paper warns against, and would weaken the falsifiability
  the repo claims as its edge over Sid's headline-only reporting.
