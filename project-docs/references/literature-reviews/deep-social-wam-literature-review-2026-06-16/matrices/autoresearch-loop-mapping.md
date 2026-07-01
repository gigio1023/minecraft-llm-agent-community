# Matrix: ENPIRE-style autoresearch loop mapped to this repo

Wave-4. Maps the autoresearch loop (ENPIRE's 4 modules, and the broader literature's loop parts) onto
this repo's existing cycle, with a build-status verdict per part. Status legend: HAS = already exists
in the repo; PARTIAL = raw material exists, the step does not; MISSING = not present. ASCII only.

## A. ENPIRE modules to repo cycle

ENPIRE = Environment, Policy improvement, Rollout, Evolution (anchor: `notes/by-paper/enpire.md`).

| ENPIRE module | What ENPIRE does | Repo equivalent | Status | Evidence / note |
|---|---|---|---|---|
| Environment: verify | automatic outcome verification | runtime verifier auto-labels `(state, action, next-state)` | HAS | the expensive half of the loop, at near-$0; lanes 18, 22 |
| Environment: reset | automatic clean scene reset | seeded world + scripted preconditions + obligation-ledger reset | MISSING | the real blocker above Material; social runs are not comparable without it (lanes 18, 21) |
| Rollout | budgeted trials, single or fleet, in parallel | the actor cycle (observation, Actor Turn, action, evidence) | PARTIAL | cycle runs; fleet parallelism over headless instances is missing ops |
| Policy Improvement | coding agent generates a policy/code change | a proposer that turns verifier-scored transcripts into a proposed change | MISSING | the change-writing step; mechanism studied in lane 20 (Eureka, CARD, DrEureka) |
| Evolution | agent reads logs, does lit review, rewrites code | transcripts + CycleJudgment + verifier artifacts exist; analysis-to-proposal does not | PARTIAL | raw material persisted; the proposer (above) is the missing analyzer (lanes 18, 19) |

## B. Broader loop components (literature) to repo

| Loop component | Literature source | Repo mapping | Status | Admissible layer |
|---|---|---|---|---|
| Verifiable reward / filter | STaR 2203.14465, RLVR (DeepSeek-R1 2501.12948) | verifier pass/fail on typed deltas | HAS | Physical, Material |
| Keep failures too | V-STaR 2402.06457 | log verifier-FAILED transitions, not only passes | PARTIAL | all (cheap to add) |
| Self-generated curriculum | Absolute Zero 2505.03335, Enhanced POET ANNECS 2003.08536 | auto-generate scenarios, count only solved-and-novel | MISSING | Physical, Material |
| Learnability vs interestingness split | OMNI 2306.01711 | verifier gives learnability; interestingness stays advisory | MISSING | learnability: Physical/Material; interestingness: advisory |
| Look-ahead world model (advisory) | WebEvolver 2504.21024 | advisory WAM scores candidate actions before execution | MISSING | the WAM itself |
| Prompt-level model improvement (no training) | WorldLLM 2506.06725 | refine an advisory WAM by hypotheses, no gradients | MISSING | Physical first |
| Sim-to-real-gap reward | RWML 2602.05842 | predicted delta vs verifier-observed delta, binarized | PARTIAL | Physical, Material |
| Active intervention to learn structure | CausaLab 2605.26029, AIT 2109.02429 | intervene where hypotheses most disagree, gated by permissions | MISSING | Physical, Material |
| Reward/skill code search | Eureka 2310.12931, Auto MC-Reward 2312.09238 | search over gated skills / advisory-WAM predictors, verifier-scored | MISSING | Physical, Material |
| Collapse guardrails | Can-Self-Train 2505.21444 | self/proxy-reward vs verified-outcome divergence, KL from reference | MISSING | all |
| Verifier isolation | Darwin Godel Machine 2505.22954 | keep the verifier's checking logic out of the improved agent | MISSING | all |
| Verifier hardening / invariance probes | LLMs Gaming Verifiers 2604.15149 | relabel actors, perturb scenario; reject instance-only success | MISSING | all (critical for Social) |

## C. The proposer-equals-scorer line (the one rule the literature enforces)

| Mode | Definition | Repo verdict | Source |
|---|---|---|---|
| External-verifier-grounded improvement | environment or runtime verifier scores; agent proposes | ADMISSIBLE | DeepSeek-R1, Absolute Zero, ENPIRE, RWML |
| Self-evaluated improvement | the actor (CycleJudgment prose) scores its own success | INADMISSIBLE (progress laundering) | Can-Self-Train collapse, Auto MC-Reward gaming, SciIntegrity fabrication, Voyager self-verify caution |

## D. Build order implied by A-C

1. Add V-STaR-style failure logging (PARTIAL to HAS, cheap).
2. Build clean Physical/Material scenario reset (MISSING, the gating dependency).
3. Build the proposer (MISSING) with verifier-measured gating and the section-C inadmissible mode
   structurally blocked.
4. Add collapse guardrails and verifier isolation/hardening before climbing toward the Social layer.
5. Fleet ops last (a throughput optimization, not a correctness dependency).
