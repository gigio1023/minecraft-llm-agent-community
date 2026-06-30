# Deep Social WAM Literature Review

Status: complete. Recorded 2026-06-16 (`Asia/Seoul`).

Search token: `DEEP_SOCIAL_WAM_LITERATURE_REVIEW_2026_06_16`.

New to the field? Start with [`reports/wam-field-primer.md`](reports/wam-field-primer.md)
(wave-2 teaching primer: the mental model, a glossary, the lineage as a story, and the
WAM-vs-VLA distinction). For the complete map of which research areas exist and where each
deep theme file sits, read [`reports/wam-research-landscape.md`](reports/wam-research-landscape.md)
(wave-3: 23 areas in 6 clusters, each mapped to the 4 layers). Then come back to the decision
reports below.

For the autoresearch angle (can this WAM improve itself autonomously?), read
[`reports/autoresearch-for-wam.md`](reports/autoresearch-for-wam.md) (wave-4: an ENPIRE-style
verifier-grounded self-improvement loop, what is admissible, and where it stops being trustworthy).
Wave 5 broadens that to the whole self-improvement field across all domains in
[`reports/self-improvement-across-domains.md`](reports/self-improvement-across-domains.md) (the
convergent law, the sharpening bound, and why the repo's verifier is the field's missing piece).

For what to DO with all of it, read
[`reports/research-directions-for-the-repo.md`](reports/research-directions-for-the-repo.md)
(synthesis plus opinion, written against the repo's actual code state: it separates the three layers
people conflate, the OBJECT to build (the advisory predictor), the LOOP that improves it
(autoresearch), and the MEASUREMENT that makes both admissible (the verifier), then gives a phased
path and a curated reusable-asset inventory). Its grounded starting point, the probe/ runtime state as
read from code, is recorded in
[`reports/repo-implementation-state-2026-06-16.md`](reports/repo-implementation-state-2026-06-16.md).

For how to BUILD and MEASURE that loop (the engineering recipes that answer the directions report's
seven hard questions), read
[`reports/building-and-measuring-the-loop.md`](reports/building-and-measuring-the-loop.md) (wave-6:
the two-axis evaluation protocol, the verifier-hardening probe suite, the predict-vs-observe advisory
loop, verifier-gated memory, contracts-as-ledger, and the comparable-scenario plus freshness kit).

Start here (decision track): [`reports/short-human-brief.md`](reports/short-human-brief.md)
(decision brief), then [`reports/final-literature-review.md`](reports/final-literature-review.md)
(main deliverable), then
[`notes/by-theme/hierarchical-wam-for-minecraft-societies.md`](notes/by-theme/hierarchical-wam-for-minecraft-societies.md)
(the recommended formulation).

Final tallies (waves 1 + 2 + 3 + 4 + 5 + 6 merged): 560 unique sources (`source-manifest.jsonl`); 250
with LaTeX downloaded; 2 PDF-only; 308 abstract/repo/docs-level; 252 by-paper notes; 41 theme
files; 15 matrices; 35 lane briefs; 35 parallel lanes completed. The single most important
finding: a structured-state, advisory, hierarchical social-material WAM sits in an empty cell
no surveyed system fills, and the repo's verifier auto-labels the needed
`(state, action, next-state)` transitions for ~$0. Wave 4 (autoresearch) adds the corollary: an
ENPIRE-style verifier-grounded self-improvement loop is the way to improve that WAM autonomously,
but only as far up the 4 layers as the verifier stays accurate, and never by letting the agent
score its own success. Wave 5 (self-improvement across all domains) confirms that corollary
convergently outside robotics and adds the sharpening bound: such a loop makes the WAM
better-calibrated where the verifier checks it, not socially smarter. Wave 6 (building and measuring
the loop) turns the directions report's seven hard questions into literature-backed engineering recipes
and confirms the empty cell from six more directions (evaluation, verifiers, LLM-as-world-model,
mechanism design, memory, scenario generation).

Wave 2 (2026-06-16) deepened the WAM foundations for a reader new to the field: 5 added lanes
(world-model lineage; generative/video world models and the "is video a world model?" debate;
action models, VLA, and the WAM synthesis; VLA in depth and the WAM-vs-VLA distinction;
training, evaluation, and open problems), the field primer, a unified lineage timeline, and a
focused WAM-vs-VLA distinction matrix. See the "Wave 2" section below.

## Purpose

Determine what kind of hierarchical World Action Model (WAM) is feasible,
defensible, and valuable for this evidence-grounded Minecraft social-simulation
repo. This expands the existing seed
(`../social-wam-research-frame.md`) into a deep, source-verified, hierarchical
formulation, and answers: what a WAM is; how it differs from a simulator,
planner, VLA, visual policy, model-based RL agent, LLM tool-use agent, and
Mineflayer runtime; what to predict (pixels vs latent vs symbolic vs
social-material deltas); whether existing weights help; what data and benchmark
to build; and what is feasible in 2 weeks / 2 months / 6 months.

This is research synthesis. No provider/API calls, no runtime source edits, no
edits to `AGENTS.md` / `README.md` / `SPEC.md` / `CLAUDE.md` / `GEMINI.md`.
Evidence tooling is support infrastructure, not the research contribution.

## The 4-layer WAM hierarchy

1. Physical WAM - physical consequences (movement, mining, crafting, placing,
   inventory/block/container deltas, vitals, durability, time, failure modes).
2. Material / Economic WAM - possession + resource flow (who has/controls what,
   scarcity, claims, borrow/lend, weak commons, public affordances, costs to others).
3. Social WAM - embodied social consequences (request, promise, refuse, accept,
   warn, handoff, return, repair, blame, gratitude, trust, reputation, obligation).
4. Institutional / Settlement WAM - routines, roles, division of labor, norms,
   ownership practice, weak-commons maintenance, settlement persistence, post-goal
   continuation.

Canonical WAM definition used throughout (arXiv 2605.12090): VLA `p(a|o,l)`;
World Model `p(o'|o,a)`; WAM `p(o',a|o,l)` (joint future-state + action), split
into Cascaded vs Joint. WAM is modality-independent - pixels are one proxy; the
project's structured-state social-material instantiation is inside the
definition's implicit-state branch.

## Directory layout

- `source-manifest.jsonl` - one JSON per source (coordinator-merged from lane
  fragments in `raw-search-results/lane-*-manifest.jsonl`).
- `search-log.md` - all commands/searches/dates/rationale (coordinator + lanes).
- `papers/{latex,pdf,metadata}/` - LaTeX-first source, PDF fallback, fetch metadata.
- `notes/by-paper/` - detailed per-source notes (extraction schema).
- `notes/by-theme/` - 41 cross-source theme syntheses.
- `notes/subagent-briefs/` - one brief per lane.
- `matrices/` - 15 comparison matrices.
- `reports/` - `final-literature-review.md` (main), `short-human-brief.md`.
- `prompts/` - the shared lane contract + 6 dispatched lane briefs.
- `scripts/fetch_arxiv_latex.sh` - LaTeX-first arXiv fetch helper (tested).
- `raw-search-results/` - raw discovery dumps + per-lane manifest/log fragments.

## Lanes (parallel subagents)

| Lane | Name | Brief |
|---|---|---|
| 1 | WAM Foundations & Game World Models | `prompts/lane-1-wam-foundations.md` |
| 2 | Minecraft Agent / VLA / Visual Policy / Benchmarks | `prompts/lane-2-minecraft-vla-policy-agents.md` |
| 3 | LLM Social Simulation & Social Benchmarks | `prompts/lane-3-llm-social-simulation.md` |
| 4 | Sociology / Social Theory Grounding | `prompts/lane-4-sociology-grounding.md` |
| 5 | Data & Training Feasibility | `prompts/lane-5-data-training-feasibility.md` |
| 6 | Repo Adaptation & Benchmark Design | `prompts/lane-6-repo-adaptation-benchmark.md` |

All lanes obey `prompts/00-shared-lane-contract.md`.

## Wave 2: WAM foundations deepening (2026-06-16)

Wave 2 expands the WAM-itself foundations for a newcomer (it does not redo the wave-1
application analysis). All wave-2 lanes obey `prompts/00-shared-lane-contract.md` plus
`prompts/wam-deep-00-contract-addendum.md` (pedagogical lens, extend-don't-duplicate).

| Lane | Name | Brief | Owned theme file |
|---|---|---|---|
| 7 | World-model lineage (RL + latent dynamics) | `prompts/wam-deep-F1-world-model-lineage.md` | `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md` |
| 8 | Generative/video WMs + the "is video a world model?" debate | `prompts/wam-deep-F2-generative-video-and-debate.md` | `notes/by-theme/wam-generative-video-and-the-world-model-debate.md` |
| 9 | Action models, VLA, and the WAM synthesis | `prompts/wam-deep-F3-action-models-vla-synthesis.md` | `notes/by-theme/wam-action-models-vla-and-synthesis.md` |
| 11 | VLA in depth, and the WAM-vs-VLA distinction | `prompts/wam-deep-F5-vla-in-depth-and-wam-distinction.md` | `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md` |
| 10 | Training, evaluation, and open problems | `prompts/wam-deep-F4-training-eval-open-problems.md` | `notes/by-theme/wam-training-evaluation-and-open-problems.md` |

Coordinator-written wave-2 capstones:
- `reports/wam-field-primer.md` (the newcomer on-ramp; routes into the five theme files).
- `matrices/wam-lineage-timeline.md` (one chronological spine across all three braids).
- `matrices/wam-vs-vla-distinction.md` (Lane 11; the focused VLA-vs-WAM head-to-head plus the
  WAM-as-actuator vs WAM-as-advisory split).

Wave-2 added 29 by-paper notes, including the canonical foundations missing in wave 1:
Ha-Schmidhuber World Models, PlaNet, Dreamer v1/v2/v3, MuZero, TD-MPC2 (lane 7); Genie,
GameNGen, DIAMOND, IRIS, GAIA-1, I-JEPA, V-JEPA 2, the Sora report (lane 8); RT-1, RT-2,
OpenVLA, Octo, pi-0, FAST (lane 9); the VLA survey, Open X-Embodiment, pi-0.5, OpenVLA-OFT,
GR00T N1 (lane 11); DAgger and physics-commonsense benchmarks (lane 10).

## Wave 3: research-area mapping (2026-06-16)

Wave 3 maps the research AREAS relevant to the original query, comprehensively, and researches
the ones not yet covered in depth. It adds 5 area surveys plus the master landscape map. All
wave-3 lanes obey `prompts/00-shared-lane-contract.md` plus
`prompts/wam-deep-00-contract-addendum-wave3.md` (map an area, tie every source to the 4 layers
and the original query, extend-don't-duplicate the existing themes).

| Lane | Research area | Brief | Owned theme file |
|---|---|---|---|
| 12 | Hierarchical / temporally-abstract WMs and RL | `prompts/wam-deep-G1-hierarchical-world-models.md` | `notes/by-theme/research-area-hierarchical-world-models.md` |
| 13 | Structured / object-centric / relational / neuro-symbolic WMs | `prompts/wam-deep-G2-structured-object-centric-world-models.md` | `notes/by-theme/research-area-structured-object-centric-world-models.md` |
| 14 | Affordances + causal / counterfactual WMs | `prompts/wam-deep-G3-affordances-and-causal-world-models.md` | `notes/by-theme/research-area-affordances-and-causal-world-models.md` |
| 15 | Computational ToM, agent/opponent modeling, emergent norms | `prompts/wam-deep-G4-theory-of-mind-and-agent-modeling.md` | `notes/by-theme/research-area-theory-of-mind-and-agent-modeling.md` |
| 16 | Agent-based economic simulation and computational social science | `prompts/wam-deep-G5-agent-based-economic-simulation.md` | `notes/by-theme/research-area-agent-based-economic-simulation.md` |
| 17 | Long-horizon memory + learned verifiers / reward models | `prompts/wam-deep-G6-memory-and-verifiers.md` | `notes/by-theme/research-area-memory-and-verifiers.md` |

Coordinator-written wave-3 capstone: `reports/wam-research-landscape.md` (the complete map of
all 23 research areas across 6 clusters, each tied to the 4 layers, with the empty-cell argument
restated across the landscape). It is the answer to "what research areas exist, all of them".

## Wave 4: autoresearch for WAM (2026-06-17)

Wave 4 adds the "autoresearch" lens (autonomous and automated research and self-improvement loops),
anchored on NVIDIA GEAR's ENPIRE (`notes/by-paper/enpire.md`), and tests one thesis: an ENPIRE-style
loop (reset, rollout, verify, refine) grounded by the runtime verifier is a natural way to improve
the advisory social-material WAM autonomously at near-$0 with no human labels. All wave-4 lanes obey
`prompts/00-shared-lane-contract.md` plus `prompts/wam-deep-00-contract-addendum-wave4.md`.

| Lane | Research area | Brief | Owned theme file |
|---|---|---|---|
| 18 | Agentic self-improvement loops (the loop itself) | `prompts/wam-deep-H1-agentic-self-improvement-loops.md` | `notes/by-theme/research-area-agentic-self-improvement-loops.md` |
| 19 | AI Scientist and automated scientific discovery | `prompts/wam-deep-H2-ai-scientist-automated-discovery.md` | `notes/by-theme/research-area-ai-scientist-automated-discovery.md` |
| 20 | LLM-driven reward, code, and skill generation | `prompts/wam-deep-H3-llm-reward-and-code-generation.md` | `notes/by-theme/research-area-llm-reward-and-code-generation.md` |
| 21 | Open-ended automated curriculum and task generation | `prompts/wam-deep-H4-open-ended-curriculum-task-generation.md` | `notes/by-theme/research-area-open-ended-curriculum-and-task-generation.md` |
| 22 | Self-improvement from verifiable rewards (the signal) | `prompts/wam-deep-H5-self-improvement-verifiable-rewards.md` | `notes/by-theme/research-area-self-improvement-from-verifiable-rewards.md` |
| 23 | Autonomous experimentation and world-model discovery | `prompts/wam-deep-H6-autonomous-experimentation-world-model-discovery.md` | `notes/by-theme/research-area-autonomous-experimentation-and-world-model-discovery.md` |

Coordinator-written wave-4 capstones:
- `reports/autoresearch-for-wam.md` (the verdict: supported at Physical/Material, bounded at Social,
  not a closed loop at Institutional; the cross-lane finding that the success signal must be external
  and accurate, and that self-scoring collapses, fabricates, or games the metric).
- `matrices/autoresearch-loop-mapping.md` (ENPIRE modules and the broader loop components mapped to
  the repo cycle, with HAS / PARTIAL / MISSING build status).

Wave-4 verdict in one line: the literature independently re-derives the repo's own rules (the runtime
owns truth, the agent never scores its own success) as the precondition for any self-improvement loop
to work. The repo already owns the expensive half (verifier-labeled transitions at near-$0); the
missing pieces (clean social-scenario reset, a proposer, fleet ops) are engineering, not science.

## Wave 5: self-improvement across all domains (2026-06-17)

Wave 5 broadened the autoresearch lens to the general concept of machine self-improvement ("자가발전")
across ALL domains, not just robotics, prompted by reading the full ENPIRE paper (the term
"autoresearch" is Karpathy's and the concept is fundamentally digital). The ENPIRE anchor
`notes/by-paper/enpire.md` was upgraded to PDF-verified. All wave-5 lanes obey
`prompts/00-shared-lane-contract.md` plus `prompts/wam-deep-00-contract-addendum-wave5.md`.

| Lane | Research area | Brief | Owned theme file |
|---|---|---|---|
| 24 | Coding-agent autoresearch (digital) and ML/SWE engineering agents | `prompts/wam-deep-I1-coding-agent-autoresearch.md` | `notes/by-theme/research-area-coding-agent-autoresearch.md` |
| 25 | Automated algorithm and program discovery | `prompts/wam-deep-I2-automated-algorithm-and-program-discovery.md` | `notes/by-theme/research-area-automated-algorithm-and-program-discovery.md` |
| 26 | AutoML, NAS, and learned optimizers | `prompts/wam-deep-I3-automl-nas-and-learned-optimizers.md` | `notes/by-theme/research-area-automl-nas-and-learned-optimizers.md` |
| 27 | Meta-learning and recursive self-improvement | `prompts/wam-deep-I4-meta-learning-and-recursive-self-improvement.md` | `notes/by-theme/research-area-meta-learning-and-recursive-self-improvement.md` |
| 28 | Automated agent and prompt/workflow design | `prompts/wam-deep-I5-automated-agent-and-prompt-design.md` | `notes/by-theme/research-area-automated-agent-and-prompt-design.md` |
| 29 | The self-improvement concept and its limits | `prompts/wam-deep-I6-self-improvement-limits-and-survey.md` | `notes/by-theme/research-area-self-improvement-limits-and-survey.md` |

Coordinator-written wave-5 capstones:
- `reports/self-improvement-across-domains.md` (the convergent law across all six domains: a loop
  improves only when grounded by a cheap, accurate, external signal on fresh data; the sharpening
  bound; the repo's verifier as the field's doubly-missing piece).
- `matrices/self-improvement-by-domain.md` (per-domain: what is improved, the signal, whether it
  compounds vs sharpens vs collapses, the bound, and repo relevance).

Wave-5 verdict in one line: the same law that holds for robots holds for code, math, ML pipelines, and
agents. Self-improvement compounds only against a cheap external verifier on fresh data, otherwise it
collapses or merely sharpens; the repo already owns that verifier at the Physical/Material layers.

## Wave 6: building and measuring the loop (2026-06-17)

Wave 6 turns the directions report's seven hard questions (`reports/research-directions-for-the-repo.md`
section 7) into literature-backed engineering recipes: how to MEASURE an advisory predictor, harden the
verifier, use an LLM as an advisory world model, ground the material and institutional layers, give the
actor durable verifier-gated memory, and generate fresh comparable scenarios. All wave-6 lanes obey
`prompts/00-shared-lane-contract.md` plus `prompts/wam-deep-00-contract-addendum-wave6.md`.

| Lane | Research area | Owned theme file |
|---|---|---|
| 30 | Evaluation and calibration for an advisory predictor | `notes/by-theme/research-area-calibration-and-predictor-evaluation.md` |
| 31 | Reward models, verifiers, and reward over-optimization | `notes/by-theme/research-area-reward-models-and-overoptimization.md` |
| 32 | The LLM as a world model and reasoning-as-planning | `notes/by-theme/research-area-llm-as-world-model-and-reasoning-planning.md` |
| 33 | Mechanism design, social dilemmas, and institutional grounding | `notes/by-theme/research-area-mechanism-design-and-cooperative-ai.md` |
| 34 | Long-horizon memory and continuity | `notes/by-theme/research-area-long-horizon-memory-and-continuity.md` |
| 35 | Scenario and environment generation and evaluation freshness | `notes/by-theme/research-area-scenario-generation-and-eval-freshness.md` |

Coordinator-written wave-6 capstones:
- `reports/building-and-measuring-the-loop.md` (the seven hard questions answered with sources and
  recipes).
- `matrices/wave6-hard-questions-to-evidence.md` (each hard question mapped to its lane, source, recipe,
  and the cell still left for the repo to build).

Wave-6 verdict in one line: the field already built the machinery to measure, harden, ground, and feed a
verifier-grounded loop, just never for structured social-material state, so every recipe transfers and
the social validity gate, the social reset, and the per-step social predictor remain the repo's to build.

## Deliverable ownership

| Deliverable | Owner |
|---|---|
| `notes/by-theme/wam-foundations.md` | Lane 1 |
| `notes/by-theme/minecraft-world-models.md` | Lane 1 |
| `notes/by-theme/minecraft-vla-and-visual-policy.md` | Lane 2 |
| `notes/by-theme/minecraft-agent-benchmarks.md` | Lane 2 |
| `notes/by-theme/minecraft-multi-agent-social.md` | Lane 2 |
| `notes/by-theme/minestudio-positioning.md` | Lane 2 |
| `notes/by-theme/llm-social-simulation.md` | Lane 3 |
| `notes/by-theme/benchmark-validity-and-evaluation.md` | Lane 3 |
| `notes/by-theme/project-sid-critical-review.md` | Lane 3 |
| `notes/by-theme/sociology-grounding-for-social-wam.md` | Lane 4 |
| `notes/by-theme/data-and-training-feasibility.md` | Lane 5 |
| `notes/by-theme/hierarchical-wam-for-minecraft-societies.md` | Coordinator (capstone) |
| `matrices/wam-vs-vla-vs-policy-vs-runtime.md` | Lane 1 |
| `matrices/action-space-comparison.md` | Lane 2 |
| `matrices/observation-space-comparison.md` | Lane 2 |
| `matrices/benchmark-metrics-matrix.md` | Lane 3 |
| `matrices/social-state-variable-matrix.md` | Lane 4 |
| `matrices/data-requirements-matrix.md` | Lane 5 |
| `matrices/repo-adaptation-matrix.md` | Lane 6 |
| `matrices/source-comparison-matrix.md` | Coordinator |
| `matrices/reproducibility-matrix.md` | Coordinator (from manifests) |
| `matrices/research-gap-matrix.md` | Coordinator (capstone) |
| `reports/final-literature-review.md` | Coordinator |
| `reports/short-human-brief.md` | Coordinator |
| `source-manifest.jsonl`, `search-log.md` | Coordinator (merge lane fragments) |
