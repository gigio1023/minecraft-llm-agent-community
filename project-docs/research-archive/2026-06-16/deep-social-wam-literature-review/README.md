# Deep Social WAM Literature Review

Status: complete. Recorded 2026-06-16 (`Asia/Seoul`).

Search token: `DEEP_SOCIAL_WAM_LITERATURE_REVIEW_2026_06_16`.

New to the field? Start with [`reports/wam-field-primer.md`](reports/wam-field-primer.md)
(wave-2 teaching primer: the mental model, a glossary, the lineage as a story, and the
WAM-vs-VLA distinction). For the complete map of which research areas exist and where each
deep theme file sits, read [`reports/wam-research-landscape.md`](reports/wam-research-landscape.md)
(wave-3: 23 areas in 6 clusters, each mapped to the 4 layers). Then come back to the decision
reports below.

Start here (decision track): [`reports/short-human-brief.md`](reports/short-human-brief.md)
(decision brief), then [`reports/final-literature-review.md`](reports/final-literature-review.md)
(main deliverable), then
[`notes/by-theme/hierarchical-wam-for-minecraft-societies.md`](notes/by-theme/hierarchical-wam-for-minecraft-societies.md)
(the recommended formulation).

Final tallies (waves 1 + 2 + 3 merged): 268 unique sources (`source-manifest.jsonl`); 104
with LaTeX downloaded; 1 PDF-only; 163 abstract/repo/docs-level; 107 by-paper notes; 23 theme
files; 12 matrices; 17 lane briefs; 17 parallel lanes completed. The single most important
finding: a structured-state, advisory, hierarchical social-material WAM sits in an empty cell
no surveyed system fills, and the repo's verifier auto-labels the needed
`(state, action, next-state)` transitions for ~$0.

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

1. Physical WAM — physical consequences (movement, mining, crafting, placing,
   inventory/block/container deltas, vitals, durability, time, failure modes).
2. Material / Economic WAM — possession + resource flow (who has/controls what,
   scarcity, claims, borrow/lend, weak commons, public affordances, costs to others).
3. Social WAM — embodied social consequences (request, promise, refuse, accept,
   warn, handoff, return, repair, blame, gratitude, trust, reputation, obligation).
4. Institutional / Settlement WAM — routines, roles, division of labor, norms,
   ownership practice, weak-commons maintenance, settlement persistence, post-goal
   continuation.

Canonical WAM definition used throughout (arXiv 2605.12090): VLA `p(a|o,l)`;
World Model `p(o'|o,a)`; WAM `p(o',a|o,l)` (joint future-state + action), split
into Cascaded vs Joint. WAM is modality-independent — pixels are one proxy; the
project's structured-state social-material instantiation is inside the
definition's implicit-state branch.

## Directory layout

- `source-manifest.jsonl` — one JSON per source (coordinator-merged from lane
  fragments in `raw-search-results/lane-*-manifest.jsonl`).
- `search-log.md` — all commands/searches/dates/rationale (coordinator + lanes).
- `papers/{latex,pdf,metadata}/` — LaTeX-first source, PDF fallback, fetch metadata.
- `notes/by-paper/` — detailed per-source notes (extraction schema).
- `notes/by-theme/` — 12 cross-source theme syntheses.
- `notes/subagent-briefs/` — one brief per lane.
- `matrices/` — 10 comparison matrices.
- `reports/` — `final-literature-review.md` (main), `short-human-brief.md`.
- `prompts/` — the shared lane contract + 6 dispatched lane briefs.
- `scripts/fetch_arxiv_latex.sh` — LaTeX-first arXiv fetch helper (tested).
- `raw-search-results/` — raw discovery dumps + per-lane manifest/log fragments.

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
