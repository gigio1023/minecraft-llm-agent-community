# Lane 14 (G3): Affordances, and causal / counterfactual world models

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 14. Manifest fragment: `raw-search-results/lane-14-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-affordances-and-causal-world-models.md`.

## Why this area (tie to the query)

The query has two phrases this lane owns: "future action opportunities" (= affordances: what an
action makes newly possible or blocks) and "predict and evaluate how actions TRANSFORM state" (=
causal/counterfactual reasoning: the effect of an intervention, and what-if). These are two distinct
but linked research fields the wave-1/2 files do not survey.

## What to nail down (source-backed, taught plainly)

Part A, affordances:
- Define affordance (Gibson's ecological term: an action possibility an environment offers an agent),
  learned affordance, affordance-conditioned policy/planning.
- Key threads: affordance learning in robotics/vision, affordances for RL exploration and planning,
  "what becomes possible" prediction.

Part B, causal and counterfactual world models:
- Define: causal model vs correlational model, intervention (do-operator), counterfactual,
  causal dynamics, structural causal model.
- Key threads: causal RL / causal dynamics learning, counterfactual reasoning in model-based RL,
  why causal structure helps generalization and credit assignment.
- Connect to evaluation: the WAM survey's proposed "Counterfactual Consistency" metric (cite
  `wam-training-evaluation-and-open-problems.md`, do not redo it).

## Seed sources (verify IDs before fetching)

- Affordances: Gibson 1979 (book, docs-level); a learned-affordance robotics work (e.g. "Learning to
  Act from Affordances" or affordance-conditioned manipulation; verify and pick 1-2); affordances for
  exploration in RL (verify).
- Causal world models: "Causal Dynamics Learning for Task-Independent State Abstraction" 2206.13452
  (verify, deep-read); a causal-RL survey (e.g. 2302.xxxx, verify); "Model-based RL with causal
  structure" (verify); counterfactual data augmentation / CoDA (1910.xxxx, verify).
- Counterfactual reasoning + world models (a representative recent work, verify).

## Layer tie and deliverable

Affordances tie to "future action opportunities" across all layers (a physical affordance: a placed
crafting table enables crafting; a social affordance: a returned tool restores a borrowing relation).
Causal/counterfactual ties to the advisory WAM's core job (predict the EFFECT of a candidate action;
answer "what if Alice lends the pickaxe?"). In the theme file give the 4-layer mapping and a closing
"relevance to the original query": how affordance prediction realizes "future action opportunities"
and how causal/counterfactual modeling is exactly the advisory predict-and-evaluate function, with
mechanically-useful vs research-contribution split.

Write: the theme file, by-paper notes for your cornerstones (one affordance + one causal world-model
work at minimum), manifest + search-log fragments, lane brief
`notes/subagent-briefs/lane-14-affordances-and-causal-world-models.md`. Tag rows `world-model`,
`physical-wam`, `social-wam`, `validity` as apt.
