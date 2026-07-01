---
sidebar_position: 4
---

# Agent Search Index

Search token: `AGENT_SEARCH_INDEX`.

This is the routing map for humans and repo agents. Use it to find the current
authority documents without treating archived research as active implementation
guidance.

## Document Boundaries

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `DOCUMENTATION_BOUNDARY` | Repo-root docs, internal project docs, Docusaurus public docs, and archives are distinct surfaces | `project-docs/orientation/documentation-map.md`, `README.md`, `docs/README.md` |
| `PROJECT_DOCS_ROOT` | Internal specs, architecture notes, setup notes, handoffs, terminology, and routing live under `project-docs/` | `project-docs/orientation/documentation-map.md`, `AGENTS.md`, `SPEC.md` |
| `PUBLIC_DOCS_ROOT` | Docusaurus-exposed public docs live under `docs/public-docs/`; do not add internal docs under this tree | `project-docs/orientation/documentation-map.md`, `docs/README.md`, `docs/sidebars.js`, `docs/docusaurus.config.js` |
| `BLOG_ROOT` | `docs/blog/` is only for explicitly dated public blog posts, not internal docs or setup notes | `project-docs/orientation/documentation-map.md`, `docs/blog/` |
| `REPO_ROOT_INTERNAL_DOCS` | Root docs guide contributors, agents, implementation review, and spec authority | `README.md`, `SPEC.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` |
| `RESEARCH_ARCHIVE` | Historical research, literature reviews, paper dumps, and stale public plans are preserved but not active build instructions | `project-docs/references/`, `project-docs/archive/` |
| `KARPATHY_GUIDELINES` | Think before coding, keep changes simple and surgical, and define verifiable success criteria | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md` |

## Product Direction

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `ACTIVE_CENTRAL_PLAN` | Current research spine: build the no-regret core first, then use branch gates before selecting F-native, F-loop, or F-society as the headline | `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`, `project-docs/research/current-spine/research-documentation-hierarchy.md`, `AGENTS.md` |
| `NO_REGRET_CORE` | Immediate target: a non-degenerate small Minecraft runtime that records independent `(state_before, executed_action, observed_delta)` transition rows before larger claims | `project-docs/research/current-spine/no-regret-core-research-protocol.md`, `project-docs/research/current-spine/transition-row-v1-contract.md`, `project-docs/research/current-spine/no-regret-core-scenario-catalog.md`, `project-docs/research/current-spine/no-regret-core-implementation-campaign.md` |
| `GOLDILOCKS_GATE` | Branch gate for F-native/F-loop: find whether a layer exists where LLM prior is insufficient and observed history adds learnable signal | `project-docs/research/current-spine/goldilocks-preflight-protocol.md`, `project-docs/research/current-spine/research-decision-current-spine-2026-06-29.md`, `project-docs/research/current-spine/research-value-harness.md` |
| `SOCIETY_OBSERVABLE_PREFLIGHT` | Separate F-society gate: look for recurring social-material patterns under small embodied constraints; prediction lift alone does not decide it | `project-docs/research/current-spine/society-observable-preflight.md`, `project-docs/specification/evidence-grounded-minecraft-society.md`, `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md` |
| `RESEARCH_VALUE_HARNESS` | Research-planning harness for pressure-testing novelty, closest prior work, falsifiable claims, and experiment sketches before implementation | `project-docs/research/current-spine/research-value-harness.md`, `.agents/skills/minecraft-research-value-harness/SKILL.md`, `project-docs/research/current-spine/prior-work-proximity-current-spine-2026-06-29.md` |
| `ADVISORY_SOCIAL_MATERIAL_WAM` | Historical/reference framing and possible F-loop branch: advisory consequence prediction is no longer the selected project headline | `project-docs/specification/advisory-social-material-wam.md`, `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md` |
| `TRANSITION_ROW_V1` | Current data unit for no-regret core work: independent state/action/observed-delta rows, separate from actor self-declared expected outcomes | `project-docs/research/current-spine/transition-row-v1-contract.md`, `project-docs/research/current-spine/transition-row-label-codebook.md`, `project-docs/research/current-spine/seed-reset-record-v1-contract.md` |
| `SOCIAL_MATERIAL_TRANSITION` | Older name for related WAM-era dataset thinking; translate active work to `transition-row/v1` unless quoting archive material | `project-docs/specification/advisory-social-material-wam.md`, `project-docs/orientation/terminology.md`, `project-docs/research/current-spine/transition-row-v1-contract.md` |
| `VERIFICATION_IS_HYGIENE` | Runtime verification, screenshots, logs, ledgers, and scoring scripts are mandatory audit hygiene, not the research contribution by themselves | `project-docs/specification/advisory-social-material-wam.md`, `project-docs/specification/runtime-evidence-and-action-skills.md`, `AGENTS.md`, `project-docs/orientation/terminology.md` |
| `SOUL_GROUNDED_SOCIAL_SIMULATION` | Minecraft is observation and evidence for Soul/LifeGoal-grounded social simulation, not a generic benchmark | `SPEC.md`, `project-docs/specification/soul-grounded-social-simulation.md`, `project-docs/runtime/actor-state-and-memory/soul-life-goal-runtime-architecture.md` |
| `EVIDENCE_GROUNDED_MINECRAFT_SOCIETY` | Operational definition of society, organization, settlement, and village; now interpreted as social-material variables for WAM prediction, not evidence as contribution | `project-docs/specification/evidence-grounded-minecraft-society.md`, `project-docs/specification/advisory-social-material-wam.md`, `project-docs/specification/soul-grounded-social-simulation.md`, `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md` |
| `PROJECT_SID_2411_00114_REVIEW` | Primary overlap review for Project Sid's many-agent Minecraft civilization work and this repo's narrower social-material WAM/microeconomy gap | `project-docs/references/external-project-notes/project-sid-2411-00114-review-2026-06-15.md`, `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md` |
| `PROJECT_SID_HARNESS_ABSORPTION` | First-pass active plan for absorbing Project Sid as NPC harness robustness: action awareness, chat/action coherence, cross-actor causality, and continuity audit | `project-docs/research/reference-synthesis/project-sid-harness-absorption-plan.md`, `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md`, `probe/src/objectives/socialTrajectory/harnessAudit.ts` |
| `RESEARCH_DIRECTION_REFERENCE_SYNTHESIS` | Active synthesis now subordinated to advisory social-material WAM: references are mapped to prediction object, actor substrate, benchmark measurement, or autoresearch method | `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md`, `project-docs/specification/advisory-social-material-wam.md`, `project-docs/references/literature-reviews/deep-social-wam-literature-review-2026-06-16/`, `project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/` |
| `REFERENCE_SWEEP_BEYOND_PROJECT_SID_2026_06_16` | Dated literature sweep for research direction beyond Project Sid, including human-grounded Minecraft collaboration, MineCollab, SOTOPIA-style social evaluation, Concordia-style social simulation, and SimBench-style validation warnings | `project-docs/references/literature-sweeps/reference-sweep-beyond-project-sid-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `NITROGEN_2601_02427_ANALYSIS` | Dated analysis of NitroGen as a generalist visual game-action foundation model: useful as future low-level policy substrate and contrast class, not as the current Minecraft social benchmark target | `project-docs/references/external-project-notes/nitrogen-2601-02427-analysis-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `EXPANDED_RELATED_WORK_SWEEP_2026_06_16` | Expanded literature sweep for Minecraft social-trajectory research: MineExplorer, MCU, MineStudio, Plancraft, Odyssey, Echo, MineLand, ALEM, Craftax, Melting Pot, PARTNR, TEACh, GLEE, MultiAgentBench, and validation-boundary papers | `project-docs/references/literature-sweeps/expanded-related-work-sweep-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `MINESTUDIO_REFERENCE_CHECK_2026_06_16` | Dedicated CraftJarvis/MineStudio check: useful task manifests, callbacks, trajectory recording, visual-policy baselines, and VLM review criteria, but not a direct replacement for the TypeScript Mineflayer Actor Turn runtime | `project-docs/references/external-project-notes/minestudio-reference-check-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `MINESTUDIO_IMPLEMENTATION_ANALYSIS_2026_06_16` | Parallel subagent implementation analysis of the cloned MineStudio repo: simulator, reset fairness, callbacks, benchmark assets, VPT/STEVE/GROOT/ROCKET models, data/training/inference, and local adaptation boundaries | `project-docs/references/external-project-notes/minestudio-implementation-analysis-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `SOCIAL_WAM_RESEARCH_FRAME_2026_06_16` | Dated research frame for treating this repo as action-conditioned social transition modeling in Minecraft: WAM-like prediction of evidence-backed physical and social deltas, not dialogue plausibility or civilization spectacle | `project-docs/references/literature-sweeps/social-wam-research-frame-2026-06-16.md`, `project-docs/research/reference-synthesis/research-direction-reference-synthesis.md` |
| `DEEP_SOCIAL_WAM_LITERATURE_REVIEW_2026_06_16` | 560-source archive defining WAM/VLA distinctions, hierarchical social-material WAM, data requirements, metrics, and autoresearch limits | `project-docs/references/literature-reviews/deep-social-wam-literature-review-2026-06-16/README.md`, `project-docs/references/literature-reviews/deep-social-wam-literature-review-2026-06-16/reports/final-literature-review.md` |
| `SDK_AUTORESEARCH_SOCIAL_WAM_POSITIONING_2026_06_17` | Focused positioning study for advisory social-material WAM plus SDK-style autoresearch loop | `project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/README.md`, `project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/reports/final-positioning-report.md` |
| `AUTONOMY_SUBSTRATE_NOT_DOMAIN_STRATEGY` | Improve context, action surface, gates, hooks, runtime feedback, transition logging, artifacts, and memory without encoding one domain goal as architecture | `SPEC.md`, `project-docs/specification/runtime-evidence-and-action-skills.md`, `project-docs/operations/future-work/future-works.md` |
| `REFERENCE_ADAPTATION_GUIDE` | External references are mechanisms to adapt, not product specs to copy | `project-docs/specification/reference-adaptation-guide.md`, `AGENTS.md` |
| `NO_VOYAGER_EVAL_LOOP` | Do not revive loose generated-code gameplay execution as the active path | `project-docs/runtime/overview/runtime-loop-and-verification.md`, `project-docs/runtime/action-skills/action-skill-verification.md` |
| `NO_USER_TASK_AS_TOP_LEVEL_GOAL` | User input is scenario context; the actor's durable frame is Soul/LifeGoal continuity | `project-docs/runtime/actor-state-and-memory/soul-life-goal-runtime-architecture.md`, `project-docs/specification/soul-grounded-social-simulation.md` |

## Runtime And Evidence

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `RUNTIME_EVIDENCE_ACTION_SKILLS` | Runtime-owned truth, action skill ownership, verification hygiene, transcripts, and artifacts | `project-docs/specification/runtime-evidence-and-action-skills.md`, `project-docs/specification/advisory-social-material-wam.md`, `project-docs/runtime/overview/runtime-loop-and-verification.md`, `project-docs/runtime/action-skills/action-skill-verification.md` |
| `ACTION_SKILL` | Minecraft/Mineflayer bundled behavior validated, executed, verified, and recorded by the runtime | `project-docs/orientation/terminology.md`, `project-docs/runtime/actor-state-and-memory/actor-workspace-and-action-skill-memory.md` |
| `AGENT_SKILL` | Codex/Claude-style repo capability under `.agents/skills/*/SKILL.md` | `project-docs/orientation/terminology.md`, `AGENTS.md` |
| `ACTION_SURFACE` | Provider-visible direct/deferred affordance packet for the current actor body | `project-docs/specification/runtime-evidence-and-action-skills.md`, `project-docs/operations/future-work/future-works.md`, `probe/src/runtime/actionSurface.ts` |
| `ACTOR_EPISODE_ACTOR_TURN` | Target replacement for the per-cycle goal/action/judgment hot path: Active Episode, Actor Turn, Action Cards, Evidence Trace, branch-only Deliberation | `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-implementation-plan.md`, `project-docs/orientation/terminology.md` |
| `LOW_COST_SOCIAL_SIMULATION_CAMPAIGN` | Campaign-level spec, gates, social proof scenarios, and implementation sequence for proving cheap-model Actor Turn behavior | `project-docs/research/benchmarks/low-cost-social-simulation-campaign-spec.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-implementation-plan.md` |
| `GROUNDED_SOCIAL_TRAJECTORY_BENCHMARK` | Legacy provider-free smoke contract for social trajectories; useful for ledger/report sanity and transition-row fixtures, not the headline research target | `project-docs/research/benchmarks/grounded-social-trajectory-benchmark-spec.md`, `project-docs/specification/advisory-social-material-wam.md`, `project-docs/experiments/curated/2026-06-15/grounded-social-trajectory-smoke/README.md`, `probe/src/objectives/socialTrajectory/` |
| `MATERIAL_CLAIMS_SOCIAL_ECONOMY_BENCHMARK` | Reference case library for possession, access, claims, obligations, refusal, repair, public affordances, and weak commons; not the active phase order before Goldilocks | `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md`, `project-docs/research/current-spine/research-documentation-hierarchy.md`, `project-docs/specification/evidence-grounded-minecraft-society.md`, `project-docs/orientation/terminology.md` |
| `PASSIVE_PLANBEADS_ACTOR_TURN_GOAL` | Compact `/goal` companion for the current pivot: Actor Turn as hot path, PlanBeads as passive issue-like state, branch-only Deliberation | `project-docs/runtime/actor-turn/actor-turn-passive-planbeads-goal-brief.md`, `project-docs/research/benchmarks/low-cost-social-simulation-campaign-spec.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-implementation-plan.md`, `project-docs/operations/handoffs/current-handoff-and-next-work.md` |
| `ACTOR_TURN_TOOL_CALLING_FULL_CONTEXT_CODEGEN` | Actor Turn target: direct Responses function-tool selection, no provider/codegen-facing compressed planner action, no prose/regex hidden policy, and full original ActorTurnInput passed into Mineflayer codegen | `project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `project-docs/runtime/action-skills/action-selection-gated-action-skill-authoring-plan.md`, `project-docs/operations/handoffs/current-handoff-and-next-work.md` |
| `CONTEXT_PROJECTION_SOURCE_EVIDENCE` | Actor Turn context rule: bounded facts may be compacted, but observation/action/social/work history must carry source evidence cards and refs beside summaries | `project-docs/runtime/actor-turn/context-projection-and-source-evidence.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `AGENTS.md` |
| `ACTOR_MEMORY_OBSERVATION_ACTION_SPACE` | Memory IO, raw observation, and Mineflayer action-space expansion plan | `project-docs/runtime/actor-state-and-memory/actor-memory-observation-and-action-space-plan.md`, `project-docs/references/memory-research/hermes-memory-system/`, `probe/src/memory/actorMemory.ts`, `probe/src/runtime/actionSurface.ts` |
| `ACTOR_PERSISTENT_STATE_PLAN_BEADS` | Restart-safe actor work graph: PlanBeads, dependency edges, and ready fronts under LifeGoal | `project-docs/runtime/planbeads/actor-persistent-state-and-planbeads.md`, `project-docs/orientation/terminology.md`, `project-docs/specification/soul-grounded-social-simulation.md`, `project-docs/runtime/actor-state-and-memory/soul-life-goal-runtime-architecture.md` |
| `PLANBEADS_IMPLEMENTATION_CAMPAIGN` | Long-running parallel implementation campaign contract for PlanBeads work | `project-docs/runtime/planbeads/planbeads-implementation-campaign.md`, `project-docs/runtime/planbeads/actor-persistent-state-and-planbeads.md`, `project-docs/operations/future-work/implementation-workstreams.md` |
| `SOCIAL_CYCLE_LLM_INPUT_CLEANUP` | Input projection cleanup retained as supporting context; active Actor Turn provider input uses bounded `current_state` plus `source_evidence_bundle` | `project-docs/runtime/actor-turn/social-cycle-llm-input-cleanup-plan.md`, `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`, `probe/src/provider/socialCycleProviderInputs.ts`, `probe/test/socialCycleRunner.test.ts` |
| `ACTOR_EPISODE_IMPLEMENTATION_PLAN` | Detailed campaign plan and acceptance gates for making cheap-model Actor Turn behavior actionful, truthful, and socially visible | `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-implementation-plan.md`, `.agents/skills/minecraft-agent-runtime-review/references/social-cycle-analysis-rubric.md` |
| `RUNTIME_ACTION_CONTRACT` | Physical actions require structured executable parameters; prose is not executable authority | `SPEC.md`, `project-docs/specification/runtime-evidence-and-action-skills.md`, `probe/test/socialCycleExecution.test.ts`, `probe/test/actorTurnProviderInput.test.ts` |
| `ACTION_SELECTION_GATED_ACTION_SKILL_AUTHORING` | New action skill creation starts only from explicit Actor Turn `author_mineflayer_action` selection, with schema-bound parameters, generated Mineflayer helper trials, and actor-workspace evidence | `project-docs/runtime/action-skills/action-selection-gated-action-skill-authoring-plan.md`, `project-docs/runtime/action-skills/bounded-action-skill-creation.md`, `probe/src/provider/socialActorTurnProvider.ts`, `probe/src/runtime/goals/actorEpisode/resolver.ts`, `probe/src/skills/proposals/` |
| `MINECRAFT_BASIC_GUIDE` | Provider-visible compact Minecraft mechanics guide for prerequisite flows, station requirements, blocker recovery, and repeated-observe limits | `project-docs/runtime/overview/minecraft-basic-guide.md`, `project-docs/runtime/actor-turn/social-cycle-llm-input-cleanup-plan.md`, `project-docs/knowledge/minecraft/encyclopedia/index.md`, `probe/src/provider/socialCycleProviderInputs.ts` |
| `RUNTIME_RETRY_CONSTRAINT` | Exact repeated target/args blockers become runtime gates before another Mineflayer call | `project-docs/orientation/terminology.md`, `project-docs/operations/future-work/future-works.md`, `probe/src/runtime/retryConstraints.ts` |
| `WORKSITE_SUPPORT_FUTURE_ITEM` | Future investigation item for making physical work locations explicit without adding a hidden shelter/building planner | `project-docs/operations/future-work/future-works.md` |
| `WORLD_STATE_DIAGNOSTICS` | World scans must be query-neutral and scoped by loaded-world limits | `SPEC.md`, `project-docs/specification/runtime-evidence-and-action-skills.md`, `probe/src/tools/worldStateScan.ts` |
| `CONTEXT_COMPACTION` | Preserve evidence-linked state without laundering weak evidence into progress | `SPEC.md`, `project-docs/specification/runtime-evidence-and-action-skills.md`, `probe/src/runtime/goals/socialCycleContextCompaction.ts` |
| `LIVE_TRANSCRIPT_FIRST` | Runtime value is primarily proven through live transcript and artifact evidence | `project-docs/runtime/evidence-and-verification/transcript-and-runtime-artifacts.md`, `project-docs/operations/handoffs/current-handoff-and-next-work.md` |
| `VISUAL_EVIDENCE_1_21_4_RULE` | Report-grade Minecraft screenshots must use the supported visual capture protocol, three camera modes, and same-cycle state evidence; pixels never prove block identity alone | `project-docs/runtime/evidence-and-verification/minecraft-visual-evidence-capture-protocol.md`, `AGENTS.md`, `probe/src/runtime/visualEvidence.ts` |

## Current Implementation

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW` | Whole-project current implementation map for runtime flow, boundaries, evidence, and risks | `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`, `README.md` |
| `CURRENT_HANDOFF_NEXT_WORK` | Landed work, verified commands, live evidence, and next improvement order | `project-docs/operations/handoffs/current-handoff-and-next-work.md`, `project-docs/operations/future-work/future-works.md` |
| `CURRENT_ARCHITECTURE_IMPLEMENTATION_AUDIT` | Dated architecture/implementation cross-check snapshot, superseded for Actor Turn hot-path authority by the current architecture review | `project-docs/operations/audits/current-architecture-and-implementation-audit.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` |
| `OPENAI_GPT54MINI_NO_OUTPUT_CAP_RUN_2026_06_04` | Dated 60-cycle OpenAI `gpt-5.4-mini` run verifying provider output-cap removal and exposing stale Active Episode / empty PlanBeads behavior weakness | `project-docs/operations/run-reports/openai-gpt54mini-no-output-cap-run-2026-06-04.md`, `project-docs/operations/handoffs/current-handoff-and-next-work.md` |
| `ROOFLESS_HUT_FLAT_SCENARIO_RUN_2026_06_08` | Dated 40-cycle OpenAI `gpt-5.4-mini` fixture run; later RCON-output review found setup manifests were not truthful enough to prove the worksite/resource fixture existed | `project-docs/operations/run-reports/roofless-hut-flat-scenario-run-2026-06-08.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/operations/setup/world-scenario-testing.md`, `probe/src/server/worldScenarios.ts` |
| `NATURAL_SAFE_SPAWN_WORLD_SCENARIO_RESEARCH_2026_06_10` | Dated research/handoff for replacing flat fixture assumptions with a natural safe-spawn scenario and fixing RCON-output setup truthfulness first | `project-docs/runtime/world-scenarios/natural-safe-spawn-world-scenario-research-2026-06-10.md`, `project-docs/operations/handoffs/current-handoff-and-next-work.md`, `project-docs/operations/setup/world-scenario-testing.md`, `probe/src/server/worldScenarios.ts` |
| `WORLD_SCENARIO_TRUTHFULNESS_NATURAL_SPAWN_PLAN` | Active implementation plan for RCON-output setup truthfulness, flat fixture revalidation, and `natural-safe-spawn-v1` spawn-validation artifacts | `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/runtime/world-scenarios/natural-safe-spawn-world-scenario-research-2026-06-10.md`, `project-docs/operations/setup/world-scenario-testing.md`, `probe/src/server/worldScenarios.ts`, `probe/src/server/worldScenarioRcon.ts`, `probe/src/server/naturalSpawnValidation.ts` |
| `WORLD_SCENARIO_RCON_TRUTHFULNESS_PLAN` | RCON output classification, required/optional command semantics, flat-fixture revalidation, and aggregate setup status | `project-docs/runtime/world-scenarios/world-scenario-rcon-truthfulness-plan.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `probe/src/server/worldScenarios.ts`, `probe/test/worldScenarios.test.ts` |
| `NATURAL_SAFE_SPAWN_SCENARIO_CONTRACT` | Contract for the natural safe-spawn world scenario: fresh default world, no terrain/resource mutation, and bounded setup-only spawn policy | `project-docs/runtime/world-scenarios/natural-safe-spawn-scenario-contract.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/operations/setup/world-scenario-testing.md`, `probe/src/server/worldScenarios.ts` |
| `NATURAL_SPAWN_VALIDATION_ARTIFACT_CONTRACT` | Artifact and linkage contract for post-bot Mineflayer loaded-world spawn validation before provider cycles | `project-docs/runtime/world-scenarios/natural-spawn-validation-artifact-contract.md`, `project-docs/runtime/world-scenarios/natural-safe-spawn-scenario-contract.md`, `probe/src/runtime/socialCycleRunner.ts`, `probe/src/runtime/goals/types.ts` |
| `WORLD_SCENARIO_SMOKE_GATES` | Static and runtime smoke gates that must pass before provider-heavy Actor Turn behavior evaluation | `project-docs/runtime/world-scenarios/world-scenario-smoke-gates.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/operations/setup/world-scenario-testing.md` |
| `NATURAL_SAFE_SPAWN_SMOKE_RUN_2026_06_13` | Dated deterministic setup smoke showing `natural-safe-spawn-v1` manifest and spawn-validation artifacts pass without provider usage | `project-docs/operations/run-reports/natural-safe-spawn-smoke-run-2026-06-13.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/operations/setup/world-scenario-testing.md` |
| `REAL_SERVER_SIMULATION_TEST_PLAN` | Live-server simulation protocol and readiness gates | `project-docs/operations/future-work/real-server-simulation-test-plan.md`, `project-docs/operations/setup/headless-server.md`, `project-docs/operations/setup/provider-setup.md` |
| `WORLD_SCENARIO_TESTING` | Separates fixture probes from natural survival/social runs, with explicit world setup artifacts that never count as actor progress | `project-docs/operations/setup/world-scenario-testing.md`, `project-docs/runtime/world-scenarios/world-scenario-truthfulness-and-natural-spawn-implementation-plan.md`, `project-docs/operations/setup/headless-server.md`, `probe/src/server/worldScenarios.ts`, `probe/src/server/naturalSpawnValidation.ts` |
| `FUTURE_WORKS` | Substrate follow-ups from live runs and external references, not spec changes | `project-docs/operations/future-work/future-works.md` |
| `EXPERIMENT_ARCHIVE_INDEX` | Dated archive for benchmark, provider-smoke, and live-runtime experiment records imported from scratch space and curated into reports | `project-docs/experiments/index.md`, `project-docs/experiments/raw-index.md`, `project-docs/experiments/catalog.json` |
| `EXPERIMENT_2026_06_13_BENCHMARKS` | 2026-06-13 ModelScope Qwen smokes and model-comparison benchmark review, including the 8-cycle limitations and 50-cycle rerun standard | `project-docs/experiments/curated/2026-06-13/README.md`, `project-docs/experiments/raw/2026-06-13/benchmarks/` |

## Provider And Operations

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `HEADLESS_MINEFLAYER_PROBE` | Local server and headless Mineflayer runtime setup | `project-docs/operations/setup/headless-server.md`, `project-docs/runtime/overview/minimal-probe.md` |
| `PROVIDER_USAGE_GUARD` | Provider usage ledger, budget guard, and post-run usage summaries | `project-docs/operations/setup/provider-setup.md`, `project-docs/runtime/evidence-and-verification/transcript-and-runtime-artifacts.md`, `probe/src/provider/providerUsageTracker.ts` |
| `PROVIDER_FREE_TIER_RESET_WINDOWS` | OpenAI and Gemini API free-tier daily reset windows and KST conversion rules | `project-docs/operations/setup/provider-free-tier-reset-windows.md`, `project-docs/operations/setup/provider-setup.md`, `probe/src/provider/providerUsageTracker.ts` |
| `MODELSCOPE_QWEN_API_ACCESS` | ModelScope private Qwen API-Inference endpoint, model ids, token storage, response-header quota checks, and future `modelscope-api` usage guard shape | `project-docs/operations/setup/modelscope-qwen-api-access.md`, `project-docs/operations/setup/provider-setup.md` |
| `GEMINI_API_SOCIAL_PROVIDER` | Lightweight live social-cycle provider path using Gemini API / Gemma | `project-docs/operations/setup/provider-setup.md`, `README.md`, `probe/src/provider/geminiApiJsonProvider.ts` |
| `OPENAI_CODEX_PROVIDER` | Game-runtime provider auth for `openai-codex`, not Codex CLI login | `project-docs/operations/setup/provider-setup.md`, `AGENTS.md` |
| `GAME_RUNTIME_CODEX_AUTH` | Repo-local ignored gameplay auth store | `project-docs/operations/setup/provider-setup.md`, `AGENTS.md` |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | Codex CLI auth and gameplay provider auth are different concerns | `AGENTS.md`, `project-docs/operations/setup/provider-setup.md` |

## Required Reading Order

For any onboarding developer or agent, read in this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md` or `GEMINI.md` when using those agents
4. `project-docs/research/current-spine/research-documentation-hierarchy.md`
5. `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`
6. `project-docs/research/current-spine/research-value-harness.md`
7. `project-docs/research/current-spine/no-regret-core-research-protocol.md`
8. `project-docs/research/current-spine/transition-row-v1-contract.md`
9. `project-docs/research/current-spine/goldilocks-preflight-protocol.md`
10. `project-docs/research/current-spine/society-observable-preflight.md`
11. `README.md`
12. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
13. `project-docs/orientation/documentation-map.md`
14. `project-docs/orientation/terminology.md`
15. `project-docs/specification/advisory-social-material-wam.md`
16. `project-docs/specification/soul-grounded-social-simulation.md`
17. `project-docs/specification/evidence-grounded-minecraft-society.md`
18. `project-docs/specification/runtime-evidence-and-action-skills.md`
19. `project-docs/specification/engineering-governance-and-testing.md`
20. `project-docs/specification/reference-adaptation-guide.md`
21. `project-docs/runtime/actor-state-and-memory/soul-life-goal-runtime-architecture.md`
22. `project-docs/runtime/overview/runtime-loop-and-verification.md`
23. `project-docs/runtime/actor-turn/actor-turn-passive-planbeads-goal-brief.md`
24. `project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`
25. `project-docs/runtime/actor-turn/context-projection-and-source-evidence.md`
26. `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-architecture.md`
27. `project-docs/runtime/actor-turn/actor-episode-and-actor-turn-implementation-plan.md`
28. `project-docs/research/benchmarks/low-cost-social-simulation-campaign-spec.md`
29. `project-docs/research/benchmarks/material-claims-and-social-economy-benchmark-plan.md`
30. `project-docs/research/benchmarks/grounded-social-trajectory-benchmark-spec.md`
31. `project-docs/runtime/actor-state-and-memory/actor-workspace-and-action-skill-memory.md`
32. `project-docs/runtime/actor-state-and-memory/actor-memory-observation-and-action-space-plan.md`
33. `project-docs/runtime/planbeads/actor-persistent-state-and-planbeads.md`
34. `project-docs/runtime/planbeads/planbeads-implementation-campaign.md`
35. `project-docs/runtime/action-skills/action-selection-gated-action-skill-authoring-plan.md`
36. `project-docs/runtime/overview/minecraft-basic-guide.md`
37. `project-docs/runtime/actor-turn/social-cycle-llm-input-cleanup-plan.md`
38. `project-docs/operations/handoffs/current-handoff-and-next-work.md`
39. `project-docs/operations/setup/headless-server.md`
40. `project-docs/operations/setup/provider-setup.md`
41. `project-docs/operations/setup/provider-free-tier-reset-windows.md`
42. `project-docs/operations/setup/modelscope-qwen-api-access.md`

## Active vs Archived

Active internal project docs live under `project-docs/`. Public Docusaurus docs
live under `docs/public-docs/`. Reference material lives under
`project-docs/references/`, and historical material lives under
`project-docs/archive/`. Do not cite archived or reference material as an active
build instruction unless an active internal doc explicitly promotes it.
