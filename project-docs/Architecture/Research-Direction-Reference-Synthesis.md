---
sidebar_position: 47
---

# Research Direction Reference Synthesis

Search token: `RESEARCH_DIRECTION_REFERENCE_SYNTHESIS`.

Status: active research-direction guide, superseded in headline by
`Specification/Advisory-Social-Material-WAM.md`. This is not a runtime authority
spec; it guides which references, benchmarks, and implementation work should be
prioritized under the active WAM direction.

Recorded: 2026-06-16 (`Asia/Seoul`).

Primary archive:

- `REFERENCE_SWEEP_BEYOND_PROJECT_SID_2026_06_16`:
  `project-docs/research-archive/2026-06-16/reference-sweep-beyond-project-sid.md`
- `NITROGEN_2601_02427_ANALYSIS`:
  `project-docs/research-archive/2026-06-16/nitrogen-2601-02427-analysis.md`
- `EXPANDED_RELATED_WORK_SWEEP_2026_06_16`:
  `project-docs/research-archive/2026-06-16/expanded-related-work-sweep.md`
- `MINESTUDIO_REFERENCE_CHECK_2026_06_16`:
  `project-docs/research-archive/2026-06-16/minestudio-reference-check.md`
- `MINESTUDIO_IMPLEMENTATION_ANALYSIS_2026_06_16`:
  `project-docs/research-archive/2026-06-16/minestudio-implementation-analysis.md`
- `DEEP_SOCIAL_WAM_LITERATURE_REVIEW_2026_06_16`:
  `project-docs/research-archive/2026-06-16/deep-social-wam-literature-review/`
- `SDK_AUTORESEARCH_SOCIAL_WAM_POSITIONING_2026_06_17`:
  `project-docs/research-archive/2026-06-17/sdk-autoresearch-social-wam-positioning/`

Related active docs:

- `Specification/Advisory-Social-Material-WAM.md`
- `Specification/Evidence-Grounded-Minecraft-Society.md`
- `Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
- `Architecture/Project-Sid-Harness-Absorption-Plan.md`
- `Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`

## One-Line Direction

```text
Study whether an advisory social-material World Action Model can predict how
embodied Minecraft actions change physical state, material access, obligations,
relationships, memory, and future action opportunities in wild, reproducible
Minecraft worlds.
```

This is the main research direction beneath the broader Soul-grounded social
simulation motivation. Runtime verification, logs, screenshots, ledgers, and
scoring scripts remain mandatory hygiene, not the differentiating claim.

## Why This Is Better Than A Project Sid-Centered Frame

Project Sid is too broad and too easy to read as a civilization demo. The local
research claim should be smaller and more defensible:

- not "LLM agents create civilization";
- not "agents looked social in Minecraft";
- not "evidence-first reports are the research contribution";
- not "we completed more Minecraft tasks";
- not "persona prompts produced believable flavor."

The project should instead claim:

```text
We build and evaluate an advisory social-material WAM for Minecraft: given
state and a candidate embodied action, the model predicts physical, material,
and social deltas, and those predictions are compared with observed runtime
transitions under natural-world pressure.
```

Audit-clean reporting remains essential, but it is support infrastructure. The
research value is the prediction object and the measurement of social-material
consequence prediction, not the mere existence of evidence.

## Research Gap

Primary gap: application + methodological.

```text
Minecraft LLM-agent work has strong open-world agents, visual policies, task
benchmarks, and collaboration settings, but it mostly measures bounded task
completion, exploration, construction, pixel/world modeling, or task-oriented
coordination. LLM social simulation work has richer social interaction,
memory, and population-scale framing, but often lacks embodied material state
where possession, access, obligations, and future action opportunities are
observed as consequences.
```

Secondary gap: evidence.

```text
We do not yet have reproducible measurements of whether models can predict
social-material transitions, separately from whether they act well, when
measured by physical/material/social delta accuracy, calibration, obligation
lifecycle, material flow, memory continuity, post-goal continuation, action
efficiency, latency, and provider cost.
```

Contradictory gap to track:

```text
Reasoning strength and simulation fidelity can diverge. A model that solves a
task faster may still be a worse social actor if it ignores prior obligations,
over-optimizes, collapses diversity, or launders weak evidence into progress.
```

## Reference Adaptation Map

| Reference family | What it teaches mechanically | Local adaptation |
| --- | --- | --- |
| Collaborative Dialogue in Minecraft, CraftAssist, MindCraft | Grounded dialogue, architect/builder separation, partial observability, partner belief, asymmetric knowledge and skills. | Start social benchmarks from situated dialogue plus checked action outcomes, not from civilization-scale spectacle. |
| MineDojo, Voyager | Open-world task diversity, curriculum, action skill libraries, environment feedback, self-verification. | Use as competence gates and actor-owned action skill inspiration. Do not make tech-tree progress the product goal. |
| VillagerBench, TeamCraft, MINDcraft/MineCollab, CausalMACE, S-Agents, MindForge, HAS | Spatial/causal/temporal dependencies, resource sharing, communication bottlenecks, role/expertise asymmetry, organization structures. | Borrow dependency and resource-flow metrics, but score durable social consequences rather than task completion alone. |
| Generative Agents, SOTOPIA, AgentSense, Lifelong SOTOPIA | Social goals, memory, believability, multi-turn interaction, long-history degradation. | Use social scenario design and continuity scoring; ground claims in Minecraft evidence and ActorSoul/LifeGoal state. |
| Concordia, AgentSociety, SocioVerse, social simulation surveys | Scenario simulation, interventions, game-master style loops, population-scale studies. | Borrow experimental design, but keep the local game master as runtime validators and artifacts, not an LLM narrator. |
| MAgIC, GLEE, MultiAgentBench, Concordia Contest | Mixed motives, cooperation, fairness, rationality, economic games, milestone KPIs, unfamiliar partners. | Add lightweight Minecraft economy through personal possession, claims, obligations, scarcity, and weak public affordances. |
| SimBench, Sim2Real gap, social-simulation boundary work, solver-sampler mismatch | Plausibility is not validity; model strength may not imply faithful behavior; claims need boundaries. | Report social behavior as behavior, with cost and failure traces. Keep human-fidelity claims for a later validation layer. |
| NitroGen, VPT, SIMA, GATO, Game-TARS | Generalist visual game-action policies, action-labeled gameplay data, unified action spaces, and cross-game transfer evaluation. | Treat as a future low-level policy substrate and contrast class. Do not make visual motor-control performance the current social benchmark target. |
| MineExplorer, MCU, MineStudio, Plancraft | Scalable Minecraft task pools, hidden dependency graphs, task manifests, callback-style reset/record loops, rule/VLM milestone checks, solvable and unsolvable planning cases. | Use as competence gates, task pressure sources, manifest/callback design references, and secondary review criteria. Do not make task success, visual-policy control, or VLM scoring the social contribution. |
| WAM, world-model, S3AP/Social World Models, WALL-E, Dreamer, MineWorld/Solaris | Consequence prediction, latent/structured state, action-conditioned next-state modeling, and prediction-vs-acting separation. | Make the predictor advisory and typed: physical/material/social deltas in Minecraft, with acting outcome reported separately from prediction quality. |
| ENPIRE, Codex/Claude SDK loops, SWE-agent, DSPy/GEPA, AI Scientist-style systems | Coding-agent or optimizer loops can propose changes when a locked metric exists. | Use as the method for improving prompts, predictor code, action-skill candidates, scenarios, and report templates. The loop must not own scoring or social truth. |
| ALEM, Craftax, Multi-Agent Craftax, Melting Pot | Open-ended multi-agent coordination, base vs coordination rewards, partner/social generalization, fast ablation environments. | Separate base Minecraft progress from coordination/social progress; add seed/partner/role generalization. |
| MineLand, PARTNR, TEACh, CoELA | Limited senses, physical needs, embodied dialogue, heterogeneous capabilities, human-robot style collaboration. | Add controlled social pressure variables: distance-limited communication, needs, asymmetric tools/knowledge, clarification, and recovery. |

## Expanded Related Work Boundary

The expanded sweep strengthens three boundaries:

1. Minecraft task competence is necessary but not sufficient.
2. Multi-agent coordination is the closest active research neighbor.
3. Social simulation validity must be bounded to what the artifacts actually
   prove.

Most actionable additions:

- use MineExplorer-style hidden dependency graphs and rule-based milestones, but
  turn the graph into social/material dependencies;
- use ALEM-style separate scoring for base progress and coordination progress;
- use GLEE/MultiAgentBench metrics for fairness, efficiency, and contribution
  only when Minecraft material constraints make them real;
- use MineLand/PARTNR/TEACh pressure variables: limited senses, distance,
  physical needs, heterogeneous capabilities, clarification, and recovery;
- use SimBench/boundary papers to avoid claiming human society realism.

The resulting benchmark frame should be:

```text
Do not ask whether agents can merely complete a Minecraft task.
Ask whether a model predicted how a social event would change Minecraft
physical/material/social state and constrain future behavior.
```

## NitroGen Boundary

NitroGen strengthens this repo's direction by contrast. It shows that generalist
gaming research is moving toward large video-action datasets, unified gamepad
action spaces, behavior cloning, and cross-game transfer. That is valuable, but
it addresses a different layer than this repo's current research claim.

Local interpretation:

```text
NitroGen-style models may eventually become a low-level motor substrate.
They do not replace the need to evaluate social consequences, material claims,
obligations, memory continuity, and post-goal continuation.
```

Current boundary:

- do not pivot to visual policy training;
- do not evaluate NitroGen/VPT/SIMA as primary social baselines yet;
- do not replace Mineflayer/action skills with a raw gamepad policy in the
  current harness;
- do borrow the benchmark discipline: unified interface, provenance of action
  labels, transfer splits, and negative controls.

Useful future architecture lane:

```text
Actor Turn chooses social/action intent.
Mineflayer/action skill executes today.
Future vision-action policy may execute low-level control.
Runtime evidence remains authoritative either way.
```

## MineStudio Implementation Boundary

MineStudio has substantial implementation depth. It should not be dismissed as
only a benchmark list or paper artifact. The cloned repo includes a
Gymnasium-style `MinecraftSim`, vendored MineRL/Malmo simulator code, simulator
callbacks, VPT/STEVE-1/GROOT/ROCKET policies, trajectory datasets,
offline/online training, Ray inference, YAML task configs, and VLM/video review
scripts.

Local boundary:

```text
MineStudio is deep in the visual-policy/MineRL/Malmo layer.
This repo's active research target is the Actor Turn/Mineflayer/advisory-WAM
social-material layer.
```

Use MineStudio for:

- task manifest discipline;
- reset and record callback design;
- controlled competence gates;
- secondary video/VLM review ideas;
- future visual-policy baseline lanes.

Do not use MineStudio for:

- replacing the TypeScript Mineflayer runtime;
- making low-level camera/buttons actions actor authority;
- treating command-fixtured tasks as natural-world progress;
- making regex or VLM video scoring runtime truth;
- making short task completion the social-simulation objective.

## Operational Definition Of Society For This Repo

For this project, a Minecraft society is not a large population count.

A minimal society exists when all of these are present:

1. multiple embodied actors, or one actor interacting with durable social state;
2. persistent material claims over items, tools, stations, containers, places,
   or work products;
3. social acts such as request, promise, refusal, handoff, warning,
   coordination, repair, or obligation update;
4. observable consequences in Minecraft state, actor memory, relationship
   state, or future behavior;
5. continuity across cycles and episodes, so earlier events constrain later
   choices;
6. some world pressure such as scarcity, distance, night, hunger, blockers,
   limited tools, limited knowledge, or conflicting priorities.

A village or organization is a stronger form of this:

```text
society + repeated roles + durable places + routinized obligations + norms or
expectations that can be violated, repaired, or revised.
```

This definition intentionally does not require a heavy shared-commons economy.
Minecraft's default economy is personal possession plus transfer. Shared
resources should be treated lightly as public affordances or weak commons, not
as the center of the social system.

## Benchmark Ladder

The benchmark should grow in layers. Each layer must leave artifacts that make
the next layer reviewable.

| Layer | Purpose | Example scenario | Primary score |
| --- | --- | --- | --- |
| 0. Competence gate | Check boring physical ability before social claims. | gather/craft/place/store in a natural seed. | action completion, recovery, cost, and transition rows. |
| 1. Dyadic material claim | Test whether the predictor anticipates how one actor's request/promise changes another actor's physical/material action. | borrow, lend, use, return, or compensate for a tool. | predicted-vs-observed obligation lifecycle and inventory/container deltas. |
| 2. Asymmetric knowledge/resource task | Make collaboration necessary without hard-coding a global planner. | one actor knows a recipe or location; another owns material/tool access. | clarification quality, handoff quality, cross-actor dependency. |
| 3. Weak public affordance | Test light commons without making shared resources the core ideology. | build or maintain a public crafting table, furnace, path marker, chest, or safe waypoint. | public-use event, contribution ledger, misuse/repair. |
| 4. Mixed-motive pressure | Test conflict, fairness, scarcity, refusal, and repair. | two actors need the same scarce tool/time/station for different LifeGoals. | fairness/efficiency tradeoff, repair, relationship update. |
| 5. Post-goal continuation | Test whether social life continues after the local task succeeds. | after the furnace/tool/path is done, actors notice a new need and preserve old obligations. | continuity, new-need response, non-checklist behavior. |

The current Project Sid harness audit is useful mainly for layers 1-2. It is
not the top-level research contribution.

## Metrics For Paper-Quality Figures

Core figures should not center on `no_progress`, `verified_progress`, or
`blocked`. Those are diagnostic labels.

Use these as primary outcome families:

| Metric | What it shows | Figure form |
| --- | --- | --- |
| Transition prediction accuracy | Whether the WAM predicted physical/material/social deltas before action. | calibration plot, per-layer accuracy, or proper-score chart. |
| Time/cycles to first social-material consequence | Whether speech/action caused an observed change in another actor, inventory, storage, place, memory, or relationship. | survival curve or line plot by model. |
| Obligation lifecycle completion | request -> accept/promise/refuse -> attempt -> fulfill/block/defer -> later memory/use. | milestone timeline or state-transition Sankey. |
| Material flow correctness | who had item -> who transferred/used/stored it -> evidence refs. | item-flow graph or inventory delta chart. |
| Cross-actor dependency | whether one actor's action changed another actor's options or next action. | dependency edge count with evidence confidence. |
| Communication-action coherence | whether chat claims match physical actions and blockers. | per-cycle mismatch rate. |
| Memory/relationship continuity | whether later action cites and uses prior social evidence. | continuity retention over cycles/episodes. |
| Post-goal continuation | whether actors keep responding to new world/social pressure after a local success. | after-success activity timeline. |
| Efficiency | provider calls, tokens, cost, latency, action count, cycles to milestone. | cost-normalized score plot. |
| Robustness | success under natural seeds, blockers, partial observability, and repeated runs. | seed/model matrix. |

Supporting diagnostics:

- no progress / checked progress / blocked;
- repeated action rejection;
- world-state scan coverage;
- screenshot evidence;
- quota and provider guard records.

## First Strong Benchmark Candidate

The most defensible first social benchmark should be MindCraft/MineCollab-like,
but adapted to this repo's natural-world, social-material WAM framing:

```text
Two actors start in the same natural seed. Actor A has a LifeGoal reason to make
or use a tool/station. Actor B has either material access, a remembered location,
or a relevant action skill. The actors must communicate, clarify, transfer or
reserve material, perform Minecraft actions, update obligation/memory state,
and continue after the immediate task succeeds or fails. The WAM predicts the
expected physical/material/social deltas before those actions.
```

Do not script the full plan. The scenario should create asymmetry and pressure,
then measure whether predicted deltas and observed deltas reveal a coherent
social-material trajectory.

Minimum required artifacts:

- actor chat events with speaker/target/cycle;
- social event ledger with request/promise/refusal/handoff/repair;
- inventory and container deltas;
- action skill verifier output;
- world-state scan refs for relevant objects;
- actor memory or relationship update refs;
- predicted and observed transition deltas;
- provider usage/cost/latency;
- cycle screenshots as supporting evidence.

## Implementation Priorities

1. Keep strengthening the Actor Turn and action-skill harness so two actors can
   act and talk without hidden planner shortcuts.
2. Add or harden social event schemas for request, promise, refusal, handoff,
   shared use, obligation update, relationship update, and repair.
3. Add material-claim records that distinguish personal possession, transfer,
   public affordance, weak commons, and theft/misuse.
4. Build one natural-seed two-actor asymmetric-resource benchmark before adding
   bigger villages.
5. Make scoring produce paper-style figures around transition prediction
   accuracy, obligation lifecycle, material flow, cross-actor dependency,
   continuity, and cost-normalized progress.
6. Only after that, add three-actor settlement pressure and mixed-motive runs.

## Paper Positioning

Candidate title shape:

```text
Advisory Social-Material World Action Models in Wild Minecraft
```

Candidate abstract claim:

```text
We study whether an advisory World Action Model can predict the physical,
material, and social consequences of embodied Minecraft actions in wild,
reproducible worlds. Unlike task-only Minecraft benchmarks, the evaluation
separates acting outcome from predicted-vs-observed social-material deltas.
Unlike dialogue-only social simulations, the transition targets are grounded in
Minecraft state changes such as possession, access, obligations, and future
action opportunities.
```

This makes the contribution concrete:

- an advisory WAM formulation over typed Minecraft/social state;
- a `social-material-transition/v1` dataset unit;
- prediction-vs-acting evaluation;
- a benchmark ladder as measurement apparatus;
- a coding-agent autoresearch loop as improvement method.
