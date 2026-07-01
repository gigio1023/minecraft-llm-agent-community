# Lane 5 - Data and Training Feasibility

Read `prompts/00-shared-lane-contract.md` first. You are Lane 5 (N=5).

## Scope

Be brutally practical about whether/how this repo should build a WAM. Decide
among: train from scratch; generate synthetic video; use existing VLM/LLM weights
as a zero-shot/few-shot transition predictor; build a structured transition
dataset from runtime logs; train a small symbolic transition model; fine-tune an
LLM/adapter later; or use MineStudio/VPT/Oasis-style models only as contrast.

## Focus questions (answer concretely, with cost intuition)

- What data is needed for each option? How expensive (compute, GPU, time)?
- What labels can be generated automatically (from Mineflayer verifier evidence,
  inventory/container deltas, world scans, social-event ledgers)?
- What requires human annotation?
- What can be bootstrapped from CURRENT Mineflayer runtime logs? Inspect the
  repo's actual artifact shapes (Read, do not run):
  - `<repo>/project-docs/runtime/evidence-and-verification/transcript-and-runtime-artifacts.md`
  - `<repo>/project-docs/runtime/actor-turn/context-projection-and-source-evidence.md`
  - `<repo>/project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`
  - `<repo>/project-docs/specification/runtime-evidence-and-action-skills.md`
  - any example reports under `<repo>/probe/` or `<repo>/tmp/` or
    `<repo>/project-docs/experiments/curated/` (search for `*.json` report samples,
    transcript artifacts, helper-event logs, provider snapshots).
- What would a single training/eval dataset ROW look like for a structured
  social-material transition WAM? Write the concrete schema:
  `(state_before, candidate_action, predicted_delta) -> (verified_delta,
  evidence_refs, social_delta, future_constraints)`. Make it match real repo
  artifact fields where possible.
- Existing public data/weights usable as a starting consequence predictor:
  check `hf datasets list --search minecraft`, VPT contractor data, MineStudio
  datasets (minestudio-data-6xx..10xx), MineRL/BASALT, STEVE-21K, MGOA (Optimus),
  any social-interaction datasets. Record size, license, modality, and whether
  they fit a structured-state WAM (most are pixel trajectories - note the mismatch).

## Feasibility horizons (REQUIRED output)

Give concrete, defensible scope for:
- 2 weeks: smallest useful thing (e.g., define transition record schema; log it
  from existing runs; an LLM-as-zero-shot delta-predictor harness, provider-free
  in design; a hand-labeled eval set of N transitions).
- 2 months: e.g., a structured transition dataset of K rows from runtime logs;
  a small symbolic transition model or fine-tuned adapter; a prediction-vs-evidence
  scoring harness.
- 6 months: e.g., dyadic + settlement benchmark families; model comparison;
  optional learned baselines.

## Owned deliverables

- `notes/by-theme/data-and-training-feasibility.md` - the option analysis
  (train-from-scratch vs adapt-weights vs LLM-zero-shot vs structured-log dataset
  vs small symbolic model), cost reality, auto-label vs human-label split, the
  concrete dataset ROW schema tied to repo artifacts, and the 2wk/2mo/6mo plan.
- `matrices/data-requirements-matrix.md` - option x {data needed, volume, label
  source (auto/human), compute cost, weights reusable?, time-to-first-result,
  fit to structured social-material WAM, risk}.
- by-paper / by-resource notes for key datasets and the most relevant
  data-centric papers (e.g., WAM survey data section 050-data.tex, LAPA/latent
  action, VPT contractor data, MineStudio data); manifest + search-log; brief.

Caution: the canonical WAM data ecosystem is robot teleoperation + egocentric
video + sim (huge, pixel). This repo's advantage is that Mineflayer verifier
evidence AUTO-LABELS structured transitions cheaply. Make that contrast the
backbone of the feasibility argument. Be honest about what is NOT cheap.
