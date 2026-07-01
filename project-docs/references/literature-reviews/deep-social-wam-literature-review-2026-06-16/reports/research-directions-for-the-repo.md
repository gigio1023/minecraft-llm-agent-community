# From review to research directions (synthesis + opinion)

What this is: a synthesis-to-action note that answers "given the 5-wave review, what should THIS repo
actually do next." Grounded in two things: the 493-source review (waves 1-5; see README.md and the
three capstones) and a fresh read of the repo's actual code state as of 2026-06-16 (the probe/ runtime,
the verifier, Actor Turn, the evidence trace). Unlike the wave capstones this note is explicitly
OPINION about direction; every factual claim still traces to a review note or to a cited file in
probe/. ASCII punctuation only.

## 1. The reframe that dissolves the confusion

The "many directions" feel confusing because three different KINDS of thing are being compared as if
they were alternatives. They are not alternatives. They stack.

| Layer | Question it answers | The repo's instance | Status today |
|---|---|---|---|
| OBJECT | what is being built or studied | the advisory social-material WAM, the predictor p(o'\|o,l) | does NOT exist as a model yet; the runtime is an actor/policy, not a predictor |
| LOOP | how the object improves | autoresearch (ENPIRE-style reset, rollout, verify, refine) | not built; raw material (transcripts + verifier labels) exists |
| MEASUREMENT | how you know it is real | the deterministic runtime verifier + the grounded-social-trajectory benchmark | verifier exists for Physical and Material; benchmark is spec plus one weak run |

- "Simple LLM mineflayer code generation" is the ACTOR acquiring capability (author_mineflayer_action,
  Voyager-style skill-as-code). It is substrate, not the contribution.
- "WAM-based research" is building the OBJECT: a predictor of the next structured state, a separate
  artifact from the actor. This is the empty cell the review found.
- "Autoresearch" is the LOOP. It can improve either the actor or the WAM, but it is only admissible
  because the MEASUREMENT (the verifier) exists.

Decision implied: pick the OBJECT first (the WAM predictor), use the LOOP to improve it cheaply, lean
on the MEASUREMENT as the moat. The loop and the codegen are means, not the headline.

## 2. Where the repo actually is (grounded, 2026-06-16)

Full snapshot with verified paths: reports/repo-implementation-state-2026-06-16.md.

- Verifier (probe/src/skills/generated/verifierEvaluation.ts): deterministic; helper-event,
  inventory-count, world-scan kinds; covers Physical and Material; Social limited to "say completed";
  Institutional absent.
- Advisory WAM: prompt-based only. No trained model, no next-state prediction. ActorSoul + LifeGoal +
  current_state + source_evidence_bundle feed a one-step tool selection.
- Actor Turn + author_mineflayer_action: working (codegen, trial, verifier, promotion via the active
  action-skill gate).
- Evidence trace: full per-cycle artifacts persisted (provider input/output, resolved action,
  mineflayer result, verifier result, cycle judgment). This IS the dataset.
- PlanBeads: wired, not substantively used.
- Single actor only. Multi-actor and Institutional are spec-only.
- Latest run (2026-06-04, 60-cycle gpt-5.4-mini): PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK. The actor
  stayed on shared-storage verification for all 60 cycles, never selected author_mineflayer_action,
  never used PlanBeads.

Reading: the substrate runs and records honestly, but the actor LOOPS, the predictor does not exist,
and the layers that make "social" meaningful (claims, obligations, weak commons) need multi-actor,
which is not built. That ordering constrains what is admissible right now.

## 3. The genuine novel object (and why it is not the two distractor framings)

The empty cell (waves 1-5; sharpest line in notes/by-theme/minecraft-world-models.md and the wave-5
capstone): a structured-state, advisory, verifier-grounded social-material WAM. Nobody has it. Pixel
world models (MineWorld, Solaris, Oasis, Matrix-Game, Genie) predict pixels and carry no social-material
state. LLM social sims (Generative Agents, SOTOPIA, Concordia, S3AP) carry the constructs but score
plausible dialogue, not verified world consequence.

- Not "ENPIRE for Minecraft": ENPIRE is the LOOP shape, an import, not a contribution.
- Not "Voyager / mineflayer codegen": that is the ACTOR's capability acquisition, substrate.
- The contribution surface: a predictor of structured social-material deltas, scored against the
  hand-authored verifier, improved by the loop, with neither actor nor generator ever scoring itself.

The verifier is doubly special (wave-5 capstone): simultaneously the cheap exact evaluator the
discovery and AutoML fields always lacked AND the fresh external signal that prevents model collapse.
One asset solves both halves of the field's failure mode. That is why this thesis is admissible HERE
specifically, where it fails elsewhere.

## 4. "Is it RL?" (answered)

- The WAM predictor is NOT RL. It is supervised or self-supervised dynamics modeling: predict the next
  structured state, compare to the verifier-observed next state (RWML's predicted-vs-observed delta as
  the signal, 2602.05842). Dreamer 4 (2509.24527) is the feasibility proof that an offline,
  structured-state world model is learnable from logged transitions (offline-only diamonds, 100x less
  data than VPT).
- The ACTOR can optionally be improved by offline RL on verifier-labeled transitions, but that is one
  regime, not the headline.
- The autoresearch LOOP is an LLM-agent search over recipes (prompts, gated skills, the predictor)
  that MAY invoke RL inside. The outer loop is method-agnostic (ENPIRE; wave-4 and wave-5 capstones).
- Opinion: lead with the predictive WAM (cheap, novel, admissible now). Treat RL as an optional inner
  regime. Do not frame the whole program as RL.

## 5. Reference assets to reuse (the pre-built code, benchmarks, datasets; curated for this repo)

Grouped by what each is FOR here. Full inventory: README.md waves 1-3 plus the theme files.

### A. Minecraft substrate and actor (reuse directly)
| Asset | id | Use here |
|---|---|---|
| Mineflayer | npm | already the control layer; keep |
| MineCollab / MindCraft | 2504.17950 | closest existing tool/action-card model; typed givePlayer is the obligation primitive; finding: communication is an instrumental cost (-15% when agents must share plans) |
| Voyager | 2305.16291 | what author_mineflayer_action IS (skill-as-code); also the cautionary case (LLM self-critic as success signal = the progress laundering the verifier replaces) |
| VPT | 2206.11795 | IDM auto-labeling paradigm if action labels are ever needed from raw play |
| MineDojo | 2206.08853 | corpus + MineCLIP for optional creative-task reward; not core |

### B. World-model feasibility (the OBJECT)
| Asset | id | Use here |
|---|---|---|
| Dreamer 4 | 2509.24527 | the anchor: an offline, structured-state WAM is learnable from logged transitions; 100x data efficiency |
| Genie | 2402.15391 | latent action inference from observed deltas (the inverse-verifier idea) if actions must be recovered |
| WebEvolver | 2504.21024 | precedent for an LLM world model trained on the agent's OWN transitions, used as advisory look-ahead (+10% web-agent success) |
| WorldLLM | 2506.06725 | prompt-level WAM refinement by hypotheses, no gradients (the cheapest first predictor) |
| S3AP | 2509.00559 | the structural precedent: p(S_{t+1}\|S,A) for SOCIAL state, advisory, Foresee-and-Act, separable from acting |

### C. Social structure (the layer to climb to, multi-actor)
| Asset | id | Use here |
|---|---|---|
| GovSim | 2404.16698 | strongest motivation: belief-modeling correlates r=0.83 with community survival; the social bottleneck is modeling the other agent, not dialogue fluency |
| Concordia | 2312.03664 | grounded variables (money, possessions) done right, but the Game Master is an LLM; the repo's verifier is the upgrade over an LLM judge |
| Generative Agents | 2304.03442 | evidence-linked memory / reflection-with-citation, the single most transferable mechanism |
| MindForge | 2411.12977 | Mineflayer-based theory-of-mind, chat folded into beliefs, for when multi-actor belief modeling starts |

### D. Loop machinery (the LOOP)
| Asset | id | Use here |
|---|---|---|
| ENPIRE | anchor (notes/by-paper/enpire.md) | the 4-module loop shape (reset, rollout, verify, refine) |
| V-STaR | 2402.06457 | keep verifier-FAILED transitions, not only passes |
| Can-Self-Train | 2505.21444 | the collapse line: the same loop is stable under ground-truth verify and collapses under a self-reward |
| DSPy | 2310.03714 | cheapest concrete loop for the actor's prompts: metric + cross-validation, with the runtime verifier AS the metric |

### Benchmarks to position against
- MineNPC-Task (2601.05215) and MineCollab (2504.17950) are closest mechanically (in-world evidence,
  structured verification) but stop at task success. The repo's Grounded-Social-Trajectory benchmark
  extends past task success to durable obligations, material claims, weak commons, and post-goal
  continuation. That extension is the novelty, not the harness.

## 6. Recommended path (opinion, phased by what the verifier can currently score)

The matrix (matrices/autoresearch-loop-mapping.md) gives the build order; this adds repo-state sequencing.

0. Substrate fix (engineering, not research; gating dependency). Resolve the 2026-06-04 actor-loops
   failure: pivot the Active Episode, let PlanBeads actually carry open work, regenerate CycleGoal from
   evidence. Build a clean Physical/Material scenario reset (seeded world + scripted preconditions +
   ledger reset) so two runs are comparable. Without reset, no loop can measure improvement (the real
   blocker, per the matrix row Environment: reset = MISSING).
1. The novel object, single-actor, Physical/Material. Build the advisory p(o'\|o,l) predictor as a
   SEPARATE artifact from the actor. Start prompt-based (WorldLLM-style) or a small offline predictor
   (Dreamer-4-style structured state) learned from the existing evidence trace. Score the predicted
   delta against the verifier-observed delta (RWML). This is the empty cell, admissible now, near-$0,
   not RL.
2. The loop. Wrap phase 1 in the minimal admissible loop (wave-4 capstone, 5 steps): seeded reset; keep
   pass AND fail transitions; a proposer (coding agent) proposes ONE change to the predictor, a prompt,
   or a gated skill; re-run; gate on a verifier-MEASURED improvement defined up front, never the actor's
   CycleJudgment. WebEvolver is the precedent; DSPy is the cheapest entry for the actor's prompt half.
3. Climb to Social (only after a multi-actor substrate exists). Add the WAM-of-others (S3AP's
   p(A^{-i}\|S)), grounded by a material, claim, and obligation LEDGER where every social variable is a
   value updated from verified events, never a float (sociology-grounding note: trust is a TrustCategory
   enum moved by evidence, not trust: 0.73). Keep it advisory. Expect calibration, not emergent social
   intelligence (the sharpening bound). GovSim's r=0.83 makes modeling-the-other the highest-value
   social target.
- Institutional: not a closed loop. Contested success, costly reset. Human-in-the-loop. Do not claim it.

## 7. Hard questions to settle before building (the consideration points)

Wave 6 turned each of these from an open worry into a literature-backed recipe. See
reports/building-and-measuring-the-loop.md and matrices/wave6-hard-questions-to-evidence.md for the
source and engineering recipe behind each item below.

1. Reset granularity: what exactly is a comparable Physical/Material scenario, and how is the obligation
   ledger reset between runs? (gating; matrix Environment: reset = MISSING)
2. Verifier hardening: invariance probes (relabel actors, perturb the scene) so a success that holds
   only for the exact logged instance is rejected as a shortcut (LLMs Gaming Verifiers 2604.15149).
   Critical before any Social claim.
3. Progress laundering, structurally blocked: the proposer and the actor must never be the scorer
   (Can-Self-Train collapse; Darwin Godel Machine deleted its own detector to win). Isolate the
   verifier's checking logic from the improved agent.
4. The sharpening ceiling: state the repo claim as "better-calibrated where the verifier checks," not
   "socially smarter." A verifier-grounded loop cannot add capability the base model lacks
   (data-processing inequality; wave-5 capstone).
5. Multi-actor dependency: social-material variables (claims, obligations, weak commons) are
   definitionally multi-actor. Single-actor caps you at Physical/Material. Decide when to pay the
   multi-actor cost.
6. Cost posture: structured-state WAM is cheap; pixel WAMs are not (MineWorld 40k-160k tokens per 16
   frames). The structured-state choice is a deliberate cost win; do not drift into pixel prediction.
7. Freshness: held-out social scenarios must stay fresh or the loop overfits (the SWE-rebench
   contamination analog). Social scenarios do not regenerate for free; budget for authoring them.

## 8. What is NOT a contribution (honest surface)

- Importing ENPIRE, AI Scientist, Eureka, RLVR, AutoML, or DSPy mechanisms is method reuse, not a
  result.
- Verifiers, transcripts, manifests, and fleet tooling are infrastructure.
- The defensible novel claim: a verifier-grounded loop that improves an ADVISORY predictor of
  structured social-material deltas, on scenarios the hand-authored runtime verifier labels, keeping
  interestingness and social inference advisory and never self-scored. No surveyed system does this for
  structured social or material state.

## 9. Cross-references

- Wave-4 capstone (the loop): reports/autoresearch-for-wam.md
- Wave-5 capstone (the limits and the law): reports/self-improvement-across-domains.md
- Wave-6 capstone (how to build and measure it): reports/building-and-measuring-the-loop.md
- Wave-6 hard-questions-to-evidence matrix: matrices/wave6-hard-questions-to-evidence.md
- Loop-to-repo build order: matrices/autoresearch-loop-mapping.md
- By-domain matrix: matrices/self-improvement-by-domain.md
- Anchor: notes/by-paper/enpire.md
- Repo implementation snapshot (2026-06-16, read from code): reports/repo-implementation-state-2026-06-16.md
- Wave 1-3 inventory: README.md plus notes/by-theme/*
