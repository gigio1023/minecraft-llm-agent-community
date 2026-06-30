# Papers with Code: ML Code Completeness Checklist (NeurIPS 2020 code recs)

- Sources: Papers with Code "ML Code Completeness Checklist" (Stojnic et al.) and
  the GitHub repo paperswithcode/releasing-research-code. These are the official
  NeurIPS 2020 code-submission recommendations.
- Access: WebSearch summaries of the Medium post and the GitHub README. Item list
  VERIFIED (consistent across both the Papers-with-Code post and the repo).
- Why in this lane: this is the code-side complement to the Pineau paper checklist.
  It is a scoreable five-item bar for a released repository.

## The five items (VERIFIED). A repo scores 0-5, one tick each:

1. Dependencies: a way to set up the environment / a dependency spec.
2. Training scripts: a way to train or fit the model(s) described in the paper.
3. Evaluation scripts: a script to compute the trained model's performance or run
   the experiments.
4. Pretrained models: free access to trained model weights.
5. Results: a table or plot of the main results AND a script to reproduce them.

Reported correlate: repos with all five had the highest GitHub stars (median 196,
mean 2,664). Not causal, but the field treats the five-item bar as the norm.

## Interpretation for the repo (labeled inference)

- Items 1, 3, 5 map directly: dependency spec, an evaluation/scoring script, and a
  results table with a one-command reproduction. The repo's deterministic verifier
  makes item 5 unusually clean (the score IS the verifier output, not a learned
  metric).
- Items 2 and 4 are partly "n/a by design": the repo does not train a policy from
  scratch as its contribution; the actor is a provider-driven LLM and the WAM is
  advisory. The honest move is to mark these n/a with a comment (the checklist
  explicitly allows "not applicable"), not to fake a training script.
- Project Sid scores 0/5 on this checklist (no dependencies, no training, no eval,
  no weights, no results-reproduction script; only a report PDF). That is the
  cleanest one-line statement of the cautionary gap. See
  notes/by-paper/project-sid-2411-00114-artifact-status.md.
