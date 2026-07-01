# WAM Research Landscape: the complete map of research areas for the original query

Coordinator capstone, wave 3. Date 2026-06-16. This is the comprehensive map of the
research AREAS (sub-fields) this literature review touches, organized so a newcomer can see
the whole territory at once and where every deep theme file sits. It answers the user's
request: "what research areas exist, all of them in detail, considering the original query."

How to use this file: skim the cluster tables to locate an area, read the per-area line for
its central question and key works, then open the linked theme file for the full,
source-backed treatment. The field primer (`wam-field-primer.md`) teaches the core concepts;
this file maps the territory; the decision reports (`short-human-brief.md`,
`final-literature-review.md`) say what the project should do.

The original query (the anchor every area is mapped to): "Can a hierarchical action-conditioned
world model predict and evaluate how Minecraft actions transform physical state, material
economy, social relations, memory, and future action opportunities in an embodied open world?"

The 4 layers each area is mapped to: Physical, Material/economic, Social, Institutional/
settlement. Standing project rule: the LLM proposes, the runtime owns physical truth, and a WAM
stays advisory (predict and evaluate; never act, fill args, mark progress, or override the
verifier).

Coverage: 23 theme files across 6 clusters, backed by 268 sources (`source-manifest.jsonl`),
107 by-paper notes, 17 lane briefs. Wave 3 added the 5 starred (*) area surveys plus this map.

---

## The 6 clusters at a glance

1. World-model core: what to predict and how (6 areas).
2. Action and the WAM synthesis: producing the action and fusing it with prediction (3 areas).
3. Minecraft as the platform: the embodied open world and its agents (5 areas).
4. Social, multi-agent, and economic: modeling other agents and economies (4 areas).
5. Grounding, memory, and evaluation: theory, memory, verifiers, validity, data (4 areas).
6. The synthesis for this project: the recommended formulation (1 capstone).

A research area is "covered" when a theme file surveys it in depth. Sub-threads named inside an
area (for example skill discovery inside hierarchy, or RAG inside memory) are covered within
that area's file, not as separate areas.

---

## Cluster 1: World-model core (what to predict, and how)

The "predict the world" half of a WAM, and the choices that define it: what representation the
future state lives in (pixels, latent, structured), how to predict over time, and how to judge it.

| Area | Central question | Key works | Layers | Depth file |
|---|---|---|---|---|
| World-model lineage (RL + latent dynamics) | How did learning-to-predict-to-act develop, and why did latent beat pixels for control? | World Models 1803.10122, PlaNet 1811.04551, Dreamer v1-3, MuZero 1911.08265, TD-MPC2 2310.16828 | Physical (base) | `wam-lineage-rl-and-latent-dynamics.md` |
| Generative / video world models + the debate | Does generating realistic video mean understanding the world? | Genie 2402.15391, GameNGen 2408.14837, DIAMOND 2405.12399, IRIS 2209.00588, GAIA-1, Sora report, JEPA / V-JEPA 2 2506.09985 | Physical | `wam-generative-video-and-the-world-model-debate.md` |
| Structured / object-centric / relational / neuro-symbolic WMs (*) | Can a world model predict typed object+relation+symbol state instead of pixels? | C-SWM 1911.12247, Slot Attention 2006.15055, Interaction Networks 1612.00222, GNS 2002.09405, OP3 1910.12827, WALL-E 2410.07484 | All 4 (the representation) | `research-area-structured-object-centric-world-models.md` |
| Hierarchical / temporally-abstract WMs and RL (*) | How to reason and predict at more than one time scale (subgoals over primitives)? | options (Sutton-Precup-Singh), FeUdal 1703.01161, Option-Critic 1609.05140, HIRO 1805.08296, DIAYN 1802.06070, Director 2206.04114 | Institutional, cross-layer | `research-area-hierarchical-world-models.md` |
| Affordances + causal / counterfactual WMs (*) | What does an action make possible (affordance), and what is its effect (intervention/what-if)? | Khetarpal 2006.15085, GrASP 2202.04772, CoDA 2007.02863, CDL 2206.13452, FOCUS 2206.01474 | Physical, Material, Social | `research-area-affordances-and-causal-world-models.md` |
| Training, evaluation, and open problems | How are these trained and judged, and what is unsolved? | WAM survey 2605.12090, DAgger 1011.0686, VideoPhy 2406.03520, Wow IDM-Turing 2601.04137 | cross-layer (method) | `wam-training-evaluation-and-open-problems.md` |

Cluster takeaway: the project's modality lives in the structured / object-centric / relational
area (predict typed deltas, score by ranking, no renderer), with hierarchy supplying the
multi-time-scale axis and affordances/causality supplying "what becomes possible" and "the effect
of an action." The video branch and its debate are why structured (not pixel) is the choice.

---

## Cluster 2: Action and the WAM synthesis

The "produce the action" half, and what fuses prediction + action into a World Action Model.

| Area | Central question | Key works | Layers | Depth file |
|---|---|---|---|---|
| WAM foundations (formal definition) | What exactly is a WAM, and how does it differ from a WM, VLA, video policy? | WAM survey 2605.12090, DreamZero 2602.15922, FFDC 2605.06222, AVID 2410.12822 | cross-layer | `wam-foundations.md` |
| Action models, VLA, and the WAM synthesis | How did action generation develop (BC, VPT, VLA), and how does it become a WAM? | VPT 2206.11795, RT-1 2212.06817, RT-2 2307.15818, OpenVLA 2406.09246, Octo 2405.12213, pi-0 2410.24164 | cross-layer | `wam-action-models-vla-and-synthesis.md` |
| VLA in depth, and the WAM-vs-VLA distinction | Why frame this project as a WAM, not a VLA? | VLA survey 2507.01925, Open X-Embodiment 2310.08864, pi-0.5 2504.16054, GR00T N1 2503.14734, Do-WAMs-Generalize 2603.22078 | cross-layer | `vla-and-the-wam-vs-vla-distinction.md` |

Cluster takeaway: the project's Actor Turn is VLA-shaped by default (perceive then react); going
WAM means adding an advisory prediction of consequences coupled to the action, scored against
verifier evidence. Only the advisory-WAM role (not the actuator-WAM) is admissible here.

---

## Cluster 3: Minecraft as the platform

The embodied open world the query is set in, and the agents and benchmarks built on it.

| Area | Central question | Key works | Layers | Depth file |
|---|---|---|---|---|
| Minecraft and game world models | What do Minecraft/game world models predict, and what gap do they leave? | MineWorld 2504.08388, Solaris 2602.22208, Oasis, Matrix-Game, Dreamer 4 2509.24527, WildWorld 2603.23497 | Physical | `minecraft-world-models.md` |
| Minecraft VLA and visual policy | How do learned visuomotor agents act in Minecraft? | VPT 2206.11795, STEVE-1 2306.00937, GROOT 2310.08235, JARVIS-VLA 2503.16365, Optimus | Physical | `minecraft-vla-and-visual-policy.md` |
| Minecraft agent benchmarks | What do Minecraft agent benchmarks measure (and miss)? | MineDojo 2206.08853, MCU 2310.08367, MineExplorer, MineNPC 2601.05215 | cross-layer (eval) | `minecraft-agent-benchmarks.md` |
| Minecraft multi-agent and social | What do multi-agent Minecraft systems model socially? | MineCollab 2504.17950, Project Sid | Social, Material | `minecraft-multi-agent-social.md` |
| MineStudio positioning | Where does the tooling/platform layer sit? | MineStudio and the platform ecosystem | platform | `minestudio-positioning.md` |

Cluster takeaway: the Minecraft world-model frontier is pixel-centric and social-blind; the
agent/benchmark frontier stops at task completion. The social-material cell is empty on this
platform, which is the project's opening.

---

## Cluster 4: Social, multi-agent, and economic

Modeling other agents, their dialogue, their economies, and the overclaim risk.

| Area | Central question | Key works | Layers | Depth file |
|---|---|---|---|---|
| LLM social simulation | Can LLM agents sustain believable social behavior? | Generative Agents 2304.03442, SOTOPIA 2310.11667, Concordia 2312.03664, GovSim 2404.16698, Social World Models 2509.00559 | Social, Institutional | `llm-social-simulation.md` |
| Computational ToM, agent/opponent modeling, emergent norms (*) | Can a model predict another agent's beliefs, policy, and the norms a group forms? | Machine ToM 1802.07740, Ullman 2302.08399, agent-modeling survey 1709.08071, Hypothetical Minds 2407.07086, MindForge 2411.12977, emergent conventions 2410.08948 | Social, Institutional | `research-area-theory-of-mind-and-agent-modeling.md` |
| Agent-based economic simulation (*) | How do possession, exchange, inequality, and markets emerge from agent actions? | Sugarscape, AI Economist 2004.13332, EconAgent 2310.10436, LLM Economist 2507.15815 | Material, Institutional | `research-area-agent-based-economic-simulation.md` |
| Project Sid critical review | What is overclaimed in civilization-scale agent demos? | Project Sid and the critique | Institutional (caution) | `project-sid-critical-review.md` |

Cluster takeaway: GovSim's r=0.83 (modeling others predicts survival) makes the Social-WAM the
real bottleneck, not dialogue. ToM/agent-modeling supplies the prediction; agent-based economics
supplies the material-economy metrics; both come with hard overclaim cautions (LLM ToM is
contested; "emergent economy" is usually a validation check, not a discovery).

---

## Cluster 5: Grounding, memory, and evaluation

The footing under the social claims: human theory, agent memory, learned verifiers, validity, data.

| Area | Central question | Key works | Layers | Depth file |
|---|---|---|---|---|
| Sociology / social-theory grounding | What do the social sciences say about obligation, exchange, commons, norms? | Goffman, Ostrom, North, Granovetter, social exchange (Homans/Blau), Bicchieri | Social, Institutional | `sociology-grounding-for-social-wam.md` |
| Long-horizon memory + learned verifiers / reward models (*) | How do agents remember across cycles, and how is an advisory predictor scored? | MemGPT 2310.08560, Generative-Agents memory 2304.03442, Reflexion 2303.11366; Let's Verify 2305.20050, GenRM 2408.15240, LLM-as-judge 2306.05685 | Social, Institutional | `research-area-memory-and-verifiers.md` |
| Benchmark validity and evaluation | When is a social/behavioral claim valid (not just plausible)? | SimBench 2510.17516, belief-behavior 2507.02197, Don't-Trust-GenAgents 2506.21974 | cross-layer (validity) | `benchmark-validity-and-evaluation.md` |
| Data and training feasibility | What data trains/evaluates a WAM, and can the runtime supply it? | the (o,a,o') triplet, IDM labeling, the repo's verifier auto-labeling | cross-layer (data) | `data-and-training-feasibility.md` |

Cluster takeaway: the verifier/reward-model field is the academic home of the project's
advisory-WAM-scored-against-evidence design, with the hard rule that a learned LLM judge must not
be the primary social score (it is biased and gameable on exactly the close, free-form, long-context
calls the project makes); memory is the substrate for "memory commitments"; validity is a ladder
the project starts low on.

---

## Cluster 6: The synthesis for this project

| Area | Central question | Depth file |
|---|---|---|
| Hierarchical social-material WAM (capstone) | What is the feasible, defensible formulation for this repo? | `hierarchical-wam-for-minecraft-societies.md` |

This is where all clusters land: a structured-state, advisory, hierarchical social-material WAM
that predicts typed deltas before an action and scores them against Mineflayer verifier evidence.

---

## The areas mapped to the 4 layers (which research feeds which layer)

| Layer | Research areas that feed it (depth files) |
|---|---|
| Physical | World-model lineage; generative/video WMs; structured/object-centric WMs; affordances+causal WMs; Minecraft world models; Minecraft VLA/visual policy. Physical truth itself is the runtime's, not a model's. |
| Material / economic | Structured/relational WMs (possession as graph state); affordances+causal (possession do-interventions); agent-based economic simulation (the metrics: Gini, productivity, utility, specialization); sociology (exchange, commons). |
| Social | Computational ToM / agent modeling (predict the other agent, GovSim r=0.83); LLM social simulation; sociology (obligation, reciprocity, trust); memory (remembered commitments); verifiers (advisory social-delta scoring, with the LLM-judge caution). |
| Institutional / settlement | Hierarchical WMs (multi-cycle horizons); emergent norms/conventions; agent-based economics (mechanism design, division of labor); sociology (institutions, governance); the Project-Sid caution against overclaim. |

Layer dependency (kept visible): physical predictions must be reliable before social ones are
meaningful. A social claim ("Bob can now mine") rests on a physical fact ("Bob holds a pickaxe,
durability > 0"), which the runtime verifies.

---

## Where the project sits: the empty cell, restated across the landscape

Reading the whole map, one cell is empty in every cluster that could fill it:

- World-model core: no structured/object-centric/relational world model predicts social-material
  state (possession, claim, obligation, trust); they predict physical or task-latent state.
- Minecraft platform: no Minecraft/game world model predicts social-material state (even Solaris,
  the only multiplayer one, models multi-view pixels with zero social state).
- Social/economic: ToM and agent modeling predict another agent's behavior but are not tied to a
  verified material substrate; agent-based economics models scalar goods, never a verified embodied
  item with location, access, and durability.
- Grounding: verifiers are mature for checkable domains (math, code) but unproven for embodied
  social outcomes with no answer key, exactly the project's regime.

The defensible contribution is the structured, advisory, verifier-grounded prediction of
social-material transitions in an embodied Minecraft world, hierarchical across Physical -> Material
-> Social -> Institutional, with prediction accuracy scored separately from acting outcome, small-N
and falsifiable. The representation, the dynamics machinery, the agent-modeling loop, the memory
substrate, the verifier discipline, and the economic metrics are all borrowed; the social-material
SEMANTICS predicted in a verified embodied world is the novel part. (Full argument:
`hierarchical-wam-for-minecraft-societies.md`, `final-literature-review.md`, `short-human-brief.md`.)

---

## Full theme-file index (all 23 areas)

World-model core: `wam-lineage-rl-and-latent-dynamics.md`,
`wam-generative-video-and-the-world-model-debate.md`,
`research-area-structured-object-centric-world-models.md`,
`research-area-hierarchical-world-models.md`,
`research-area-affordances-and-causal-world-models.md`,
`wam-training-evaluation-and-open-problems.md`.

Action and WAM synthesis: `wam-foundations.md`, `wam-action-models-vla-and-synthesis.md`,
`vla-and-the-wam-vs-vla-distinction.md`.

Minecraft platform: `minecraft-world-models.md`, `minecraft-vla-and-visual-policy.md`,
`minecraft-agent-benchmarks.md`, `minecraft-multi-agent-social.md`, `minestudio-positioning.md`.

Social/multi-agent/economic: `llm-social-simulation.md`,
`research-area-theory-of-mind-and-agent-modeling.md`,
`research-area-agent-based-economic-simulation.md`, `project-sid-critical-review.md`.

Grounding/memory/evaluation: `sociology-grounding-for-social-wam.md`,
`research-area-memory-and-verifiers.md`, `benchmark-validity-and-evaluation.md`,
`data-and-training-feasibility.md`.

Synthesis: `hierarchical-wam-for-minecraft-societies.md`.

Supporting matrices: `wam-vs-vla-vs-policy-vs-runtime.md`, `wam-vs-vla-distinction.md`,
`wam-lineage-timeline.md`, `research-gap-matrix.md`, `source-comparison-matrix.md`,
`reproducibility-matrix.md`, and the lane matrices (action-space, observation-space,
benchmark-metrics, data-requirements, repo-adaptation, social-state-variable).
