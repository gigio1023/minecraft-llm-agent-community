# Questionable Practices in Machine Learning (2407.12220)

- Source: arXiv 2407.12220.
- Access: WebSearch result listing + abstract-level summary. CLAIM-ONLY: I did not
  fetch the full body. Treat the specific catalog of practices as not-verified
  beyond the general framing below.
- Why in this lane: it names the reporting failures a release should avoid, the
  inverse of a reproducibility checklist.

## Framing (VERIFIED at abstract/secondary level)

- The paper catalogs questionable research practices in ML that inflate or
  misrepresent results: forms of data leakage, cherry-picking, and HARKing
  (hypothesizing after results are known), among others. The thrust: many published
  ML results are fragile because of avoidable reporting and methodology choices, not
  because the underlying idea is wrong.

## Interpretation for the repo (labeled inference)

- Each named practice has a direct repo guard:
  - Leakage: the verifier auto-labels from world artifacts, not from the actor's
    own claims, so the "label" cannot leak from the thing being scored. Keep the WAM
    advisory; if it ever fills an action argument or marks progress, that is leakage.
  - Cherry-picking: report all seed/partner runs, including failures (ties to
    2406.03980 negative results). Pre-register the held-out scenario split.
  - HARKing: state the social-material hypotheses (possession, claim, obligation,
    repair, continuity) BEFORE the run, so a result is a test, not a post-hoc story.
- This is the "progress laundering" failure the repo already names, generalized:
  the cautionary lesson is not only Sid-specific, it is the standing ML-methodology
  trap that a deterministic external verifier plus full disclosure is designed to
  dodge.
