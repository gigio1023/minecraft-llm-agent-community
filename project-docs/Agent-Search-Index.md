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
| `DOCUMENTATION_BOUNDARY` | Repo-root docs, internal project docs, Docusaurus public docs, and archives are distinct surfaces | `Documentation-Map.md`, `README.md`, `docs/README.md` |
| `PROJECT_DOCS_ROOT` | Internal specs, architecture notes, setup notes, handoffs, terminology, and routing live under `project-docs/` | `Documentation-Map.md`, `AGENTS.md`, `SPEC.md` |
| `PUBLIC_DOCS_ROOT` | Docusaurus-exposed public docs live under `docs/public-docs/`; do not add internal docs under this tree | `Documentation-Map.md`, `docs/README.md`, `docs/sidebars.js`, `docs/docusaurus.config.js` |
| `BLOG_ROOT` | `docs/blog/` is only for explicitly dated public blog posts, not internal docs or setup notes | `Documentation-Map.md`, `docs/blog/` |
| `REPO_ROOT_INTERNAL_DOCS` | Root docs guide contributors, agents, implementation review, and spec authority | `README.md`, `SPEC.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` |
| `RESEARCH_ARCHIVE` | Historical research, paper dumps, and stale public plans are preserved but not active build instructions | `project-docs/research-archive/` |
| `KARPATHY_GUIDELINES` | Think before coding, keep changes simple and surgical, and define verifiable success criteria | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md` |

## Product Direction

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `SOUL_GROUNDED_SOCIAL_SIMULATION` | Minecraft is observation and evidence for Soul/LifeGoal-grounded social simulation, not a generic benchmark | `SPEC.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `EVIDENCE_GROUNDED_MINECRAFT_SOCIETY` | Operational definition of society, organization, settlement, and village for this repo's Minecraft social simulation target | `Specification/Evidence-Grounded-Minecraft-Society.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md` |
| `PROJECT_SID_2411_00114_REVIEW` | Primary overlap review for Project Sid's many-agent Minecraft civilization work and this repo's narrower evidence-grounded social microeconomy gap | `research-archive/Project-Sid-2411-00114-Review-2026-06-15.md`, `Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md` |
| `PROJECT_SID_HARNESS_ABSORPTION` | First-pass active plan for absorbing Project Sid as NPC harness robustness: action awareness, chat/action coherence, cross-actor causality, and continuity audit | `Architecture/Project-Sid-Harness-Absorption-Plan.md`, `Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`, `probe/src/objectives/socialTrajectory/harnessAudit.ts` |
| `RESEARCH_DIRECTION_REFERENCE_SYNTHESIS` | Active synthesis of Project Sid-adjacent and non-Sid references: grounded Minecraft dialogue, multi-agent Minecraft collaboration, LLM social intelligence, social simulation platforms, economic/mixed-motive benchmarks, and validation warnings | `Architecture/Research-Direction-Reference-Synthesis.md`, `research-archive/2026-06-16/reference-sweep-beyond-project-sid.md` |
| `REFERENCE_SWEEP_BEYOND_PROJECT_SID_2026_06_16` | Dated literature sweep for research direction beyond Project Sid, including human-grounded Minecraft collaboration, MineCollab, SOTOPIA-style social evaluation, Concordia-style social simulation, and SimBench-style validation warnings | `research-archive/2026-06-16/reference-sweep-beyond-project-sid.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `NITROGEN_2601_02427_ANALYSIS` | Dated analysis of NitroGen as a generalist visual game-action foundation model: useful as future low-level policy substrate and contrast class, not as the current Minecraft social benchmark target | `research-archive/2026-06-16/nitrogen-2601-02427-analysis.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `EXPANDED_RELATED_WORK_SWEEP_2026_06_16` | Expanded literature sweep for Minecraft social-trajectory research: MineExplorer, MCU, MineStudio, Plancraft, Odyssey, Echo, MineLand, ALEM, Craftax, Melting Pot, PARTNR, TEACh, GLEE, MultiAgentBench, and validation-boundary papers | `research-archive/2026-06-16/expanded-related-work-sweep.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `MINESTUDIO_REFERENCE_CHECK_2026_06_16` | Dedicated CraftJarvis/MineStudio check: useful task manifests, callbacks, trajectory recording, visual-policy baselines, and VLM review criteria, but not a direct replacement for the TypeScript Mineflayer Actor Turn runtime | `research-archive/2026-06-16/minestudio-reference-check.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `MINESTUDIO_IMPLEMENTATION_ANALYSIS_2026_06_16` | Parallel subagent implementation analysis of the cloned MineStudio repo: simulator, reset fairness, callbacks, benchmark assets, VPT/STEVE/GROOT/ROCKET models, data/training/inference, and local adaptation boundaries | `research-archive/2026-06-16/minestudio-implementation-analysis.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `SOCIAL_WAM_RESEARCH_FRAME_2026_06_16` | Dated research frame for treating this repo as action-conditioned social transition modeling in Minecraft: WAM-like prediction of evidence-backed physical and social deltas, not dialogue plausibility or civilization spectacle | `research-archive/2026-06-16/social-wam-research-frame.md`, `Architecture/Research-Direction-Reference-Synthesis.md` |
| `AUTONOMY_SUBSTRATE_NOT_DOMAIN_STRATEGY` | Improve context, action surface, gates, hooks, verification, artifacts, and memory without encoding one domain goal as architecture | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Future-Works.md` |
| `REFERENCE_ADAPTATION_GUIDE` | External references are mechanisms to adapt, not product specs to copy | `Specification/Reference-Adaptation-Guide.md`, `AGENTS.md` |
| `NO_VOYAGER_EVAL_LOOP` | Do not revive loose generated-code gameplay execution as the active path | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Action-Skill-Verification.md` |
| `NO_USER_TASK_AS_TOP_LEVEL_GOAL` | User input is scenario context; the actor's durable frame is Soul/LifeGoal continuity | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Specification/Soul-Grounded-Social-Simulation.md` |

## Runtime And Evidence

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `RUNTIME_EVIDENCE_ACTION_SKILLS` | Runtime-owned truth, action skill ownership, verification, transcripts, and artifacts | `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Action-Skill-Verification.md` |
| `ACTION_SKILL` | Minecraft/Mineflayer bundled behavior validated, executed, verified, and recorded by the runtime | `Terminology.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md` |
| `AGENT_SKILL` | Codex/Claude-style repo capability under `.agents/skills/*/SKILL.md` | `Terminology.md`, `AGENTS.md` |
| `ACTION_SURFACE` | Provider-visible direct/deferred affordance packet for the current actor body | `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Future-Works.md`, `probe/src/runtime/actionSurface.ts` |
| `ACTOR_EPISODE_ACTOR_TURN` | Target replacement for the per-cycle goal/action/judgment hot path: Active Episode, Actor Turn, Action Cards, Evidence Trace, branch-only Deliberation | `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`, `Terminology.md` |
| `LOW_COST_SOCIAL_SIMULATION_CAMPAIGN` | Campaign-level spec, gates, social proof scenarios, and implementation sequence for proving cheap-model Actor Turn behavior | `Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`, `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md` |
| `GROUNDED_SOCIAL_TRAJECTORY_BENCHMARK` | Legacy provider-free smoke contract for evidence-backed social trajectories; useful for ledger/report sanity, not the main social-economy target | `Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`, `Experiments/2026-06-15/grounded-social-trajectory-smoke/README.md`, `probe/src/objectives/socialTrajectory/` |
| `MATERIAL_CLAIMS_SOCIAL_ECONOMY_BENCHMARK` | Active benchmark direction for personal possession, material claims, public affordances, weak commons, obligations, continuity, and cost-aware model comparison | `Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`, `Specification/Evidence-Grounded-Minecraft-Society.md`, `Terminology.md` |
| `PASSIVE_PLANBEADS_ACTOR_TURN_GOAL` | Compact `/goal` companion for the current pivot: Actor Turn as hot path, PlanBeads as passive issue-like state, branch-only Deliberation | `Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`, `Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`, `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`, `Architecture/Current-Handoff-And-Next-Work.md` |
| `ACTOR_TURN_TOOL_CALLING_FULL_CONTEXT_CODEGEN` | Actor Turn target: direct Responses function-tool selection, no provider/codegen-facing compressed planner action, no prose/regex hidden policy, and full original ActorTurnInput passed into Mineflayer codegen | `Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`, `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`, `Architecture/Current-Handoff-And-Next-Work.md` |
| `CONTEXT_PROJECTION_SOURCE_EVIDENCE` | Actor Turn context rule: bounded facts may be compacted, but observation/action/social/work history must carry source evidence cards and refs beside summaries | `Architecture/Context-Projection-And-Source-Evidence.md`, `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `AGENTS.md` |
| `ACTOR_MEMORY_OBSERVATION_ACTION_SPACE` | Memory IO, raw observation, and Mineflayer action-space expansion plan | `Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`, `project-docs/research-archive/hermes-memory-system/`, `probe/src/memory/actorMemory.ts`, `probe/src/runtime/actionSurface.ts` |
| `ACTOR_PERSISTENT_STATE_PLAN_BEADS` | Restart-safe actor work graph: PlanBeads, dependency edges, and ready fronts under LifeGoal | `Architecture/Actor-Persistent-State-And-PlanBeads.md`, `Terminology.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `PLANBEADS_IMPLEMENTATION_CAMPAIGN` | Long-running parallel implementation campaign contract for PlanBeads work | `Architecture/PlanBeads-Implementation-Campaign.md`, `Architecture/Actor-Persistent-State-And-PlanBeads.md`, `Architecture/Implementation-Workstreams.md` |
| `SOCIAL_CYCLE_LLM_INPUT_CLEANUP` | Input projection cleanup retained as supporting context; active Actor Turn provider input uses bounded `current_state` plus `source_evidence_bundle` | `Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`, `Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`, `probe/src/provider/socialCycleProviderInputs.ts`, `probe/test/socialCycleRunner.test.ts` |
| `ACTOR_EPISODE_IMPLEMENTATION_PLAN` | Detailed campaign plan and acceptance gates for making cheap-model Actor Turn behavior actionful, truthful, and socially visible | `Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`, `.agents/skills/minecraft-agent-runtime-review/references/social-cycle-analysis-rubric.md` |
| `RUNTIME_ACTION_CONTRACT` | Physical actions require structured executable parameters; prose is not executable authority | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/test/socialCycleExecution.test.ts`, `probe/test/actorTurnProviderInput.test.ts` |
| `ACTION_SELECTION_GATED_ACTION_SKILL_AUTHORING` | New action skill creation starts only from explicit Actor Turn `author_mineflayer_action` selection, with schema-bound parameters, generated Mineflayer helper trials, and actor-workspace evidence | `Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`, `Architecture/Bounded-Action-Skill-Creation.md`, `probe/src/provider/socialActorTurnProvider.ts`, `probe/src/runtime/goals/actorEpisode/resolver.ts`, `probe/src/skills/proposals/` |
| `MINECRAFT_BASIC_GUIDE` | Provider-visible compact Minecraft mechanics guide for prerequisite flows, station requirements, blocker recovery, and repeated-observe limits | `Architecture/Minecraft-Basic-Guide.md`, `Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`, `Knowledge/Minecraft-Encyclopedia/Index.md`, `probe/src/provider/socialCycleProviderInputs.ts` |
| `RUNTIME_RETRY_CONSTRAINT` | Exact repeated target/args blockers become runtime gates before another Mineflayer call | `Terminology.md`, `Architecture/Future-Works.md`, `probe/src/runtime/retryConstraints.ts` |
| `WORKSITE_SUPPORT_FUTURE_ITEM` | Future investigation item for making physical work locations explicit without adding a hidden shelter/building planner | `Architecture/Future-Works.md` |
| `WORLD_STATE_DIAGNOSTICS` | World scans must be query-neutral and scoped by loaded-world limits | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/src/tools/worldStateScan.ts` |
| `CONTEXT_COMPACTION` | Preserve evidence-linked state without laundering weak evidence into progress | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/src/runtime/goals/socialCycleContextCompaction.ts` |
| `LIVE_TRANSCRIPT_FIRST` | Runtime value is primarily proven through live transcript and artifact evidence | `Architecture/Transcript-And-Runtime-Artifacts.md`, `Architecture/Current-Handoff-And-Next-Work.md` |

## Current Implementation

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW` | Whole-project current implementation map for runtime flow, boundaries, evidence, and risks | `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`, `README.md` |
| `CURRENT_HANDOFF_NEXT_WORK` | Landed work, verified commands, live evidence, and next improvement order | `Architecture/Current-Handoff-And-Next-Work.md`, `Architecture/Future-Works.md` |
| `CURRENT_ARCHITECTURE_IMPLEMENTATION_AUDIT` | Dated architecture/implementation cross-check snapshot, superseded for Actor Turn hot-path authority by the current architecture review | `Architecture/Current-Architecture-And-Implementation-Audit.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` |
| `OPENAI_GPT54MINI_NO_OUTPUT_CAP_RUN_2026_06_04` | Dated 60-cycle OpenAI `gpt-5.4-mini` run verifying provider output-cap removal and exposing stale Active Episode / empty PlanBeads behavior weakness | `Architecture/OpenAI-GPT54Mini-No-Output-Cap-Run-2026-06-04.md`, `Architecture/Current-Handoff-And-Next-Work.md` |
| `ROOFLESS_HUT_FLAT_SCENARIO_RUN_2026_06_08` | Dated 40-cycle OpenAI `gpt-5.4-mini` fixture run; later RCON-output review found setup manifests were not truthful enough to prove the worksite/resource fixture existed | `Architecture/Roofless-Hut-Flat-Scenario-Run-2026-06-08.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Setup/World-Scenario-Testing.md`, `probe/src/server/worldScenarios.ts` |
| `NATURAL_SAFE_SPAWN_WORLD_SCENARIO_RESEARCH_2026_06_10` | Dated research/handoff for replacing flat fixture assumptions with a natural safe-spawn scenario and fixing RCON-output setup truthfulness first | `Architecture/Natural-Safe-Spawn-World-Scenario-Research-2026-06-10.md`, `Architecture/Current-Handoff-And-Next-Work.md`, `Setup/World-Scenario-Testing.md`, `probe/src/server/worldScenarios.ts` |
| `WORLD_SCENARIO_TRUTHFULNESS_NATURAL_SPAWN_PLAN` | Active implementation plan for RCON-output setup truthfulness, flat fixture revalidation, and `natural-safe-spawn-v1` spawn-validation artifacts | `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Architecture/Natural-Safe-Spawn-World-Scenario-Research-2026-06-10.md`, `Setup/World-Scenario-Testing.md`, `probe/src/server/worldScenarios.ts`, `probe/src/server/worldScenarioRcon.ts`, `probe/src/server/naturalSpawnValidation.ts` |
| `WORLD_SCENARIO_RCON_TRUTHFULNESS_PLAN` | RCON output classification, required/optional command semantics, flat-fixture revalidation, and aggregate setup status | `Architecture/World-Scenario-RCON-Truthfulness-Plan.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `probe/src/server/worldScenarios.ts`, `probe/test/worldScenarios.test.ts` |
| `NATURAL_SAFE_SPAWN_SCENARIO_CONTRACT` | Contract for the natural safe-spawn world scenario: fresh default world, no terrain/resource mutation, and bounded setup-only spawn policy | `Architecture/Natural-Safe-Spawn-Scenario-Contract.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Setup/World-Scenario-Testing.md`, `probe/src/server/worldScenarios.ts` |
| `NATURAL_SPAWN_VALIDATION_ARTIFACT_CONTRACT` | Artifact and linkage contract for post-bot Mineflayer loaded-world spawn validation before provider cycles | `Architecture/Natural-Spawn-Validation-Artifact-Contract.md`, `Architecture/Natural-Safe-Spawn-Scenario-Contract.md`, `probe/src/runtime/socialCycleRunner.ts`, `probe/src/runtime/goals/types.ts` |
| `WORLD_SCENARIO_SMOKE_GATES` | Static and runtime smoke gates that must pass before provider-heavy Actor Turn behavior evaluation | `Architecture/World-Scenario-Smoke-Gates.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Setup/World-Scenario-Testing.md` |
| `NATURAL_SAFE_SPAWN_SMOKE_RUN_2026_06_13` | Dated deterministic setup smoke showing `natural-safe-spawn-v1` manifest and spawn-validation artifacts pass without provider usage | `Architecture/Natural-Safe-Spawn-Smoke-Run-2026-06-13.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Setup/World-Scenario-Testing.md` |
| `REAL_SERVER_SIMULATION_TEST_PLAN` | Live-server simulation protocol and readiness gates | `Architecture/Real-Server-Simulation-Test-Plan.md`, `Setup/Headless-Server.md`, `Setup/Provider-Setup.md` |
| `WORLD_SCENARIO_TESTING` | Separates fixture probes from natural survival/social runs, with explicit world setup artifacts that never count as actor progress | `Setup/World-Scenario-Testing.md`, `Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`, `Setup/Headless-Server.md`, `probe/src/server/worldScenarios.ts`, `probe/src/server/naturalSpawnValidation.ts` |
| `FUTURE_WORKS` | Substrate follow-ups from live runs and external references, not spec changes | `Architecture/Future-Works.md` |
| `EXPERIMENT_ARCHIVE_INDEX` | Dated archive for benchmark, provider-smoke, and live-runtime experiment records imported from scratch space and curated into reports | `Experiments/README.md`, `Experiments/INDEX.md`, `Experiments/catalog.json` |
| `EXPERIMENT_2026_06_13_BENCHMARKS` | 2026-06-13 ModelScope Qwen smokes and model-comparison benchmark review, including the 8-cycle limitations and 50-cycle rerun standard | `Experiments/2026-06-13/README.md`, `Experiments/raw/2026-06-13/benchmarks/` |

## Provider And Operations

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `HEADLESS_MINEFLAYER_PROBE` | Local server and headless Mineflayer runtime setup | `Setup/Headless-Server.md`, `Architecture/Minimal-Probe.md` |
| `PROVIDER_USAGE_GUARD` | Provider usage ledger, budget guard, and post-run usage summaries | `Setup/Provider-Setup.md`, `Architecture/Transcript-And-Runtime-Artifacts.md`, `probe/src/provider/providerUsageTracker.ts` |
| `PROVIDER_FREE_TIER_RESET_WINDOWS` | OpenAI and Gemini API free-tier daily reset windows and KST conversion rules | `Setup/Provider-Free-Tier-Reset-Windows.md`, `Setup/Provider-Setup.md`, `probe/src/provider/providerUsageTracker.ts` |
| `MODELSCOPE_QWEN_API_ACCESS` | ModelScope private Qwen API-Inference endpoint, model ids, token storage, response-header quota checks, and future `modelscope-api` usage guard shape | `Setup/ModelScope-Qwen-API-Access.md`, `Setup/Provider-Setup.md` |
| `GEMINI_API_SOCIAL_PROVIDER` | Lightweight live social-cycle provider path using Gemini API / Gemma | `Setup/Provider-Setup.md`, `README.md`, `probe/src/provider/geminiApiJsonProvider.ts` |
| `OPENAI_CODEX_PROVIDER` | Game-runtime provider auth for `openai-codex`, not Codex CLI login | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `GAME_RUNTIME_CODEX_AUTH` | Repo-local ignored gameplay auth store | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | Codex CLI auth and gameplay provider auth are different concerns | `AGENTS.md`, `Setup/Provider-Setup.md` |

## Required Reading Order

For any onboarding developer or agent, read in this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md` or `GEMINI.md` when using those agents
4. `README.md`
5. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
6. `project-docs/Documentation-Map.md`
7. `project-docs/Terminology.md`
8. `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
9. `project-docs/Specification/Evidence-Grounded-Minecraft-Society.md`
10. `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
11. `project-docs/Specification/Engineering-Governance-And-Testing.md`
12. `project-docs/Specification/Reference-Adaptation-Guide.md`
13. `project-docs/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
14. `project-docs/Architecture/Runtime-Loop-And-Verification.md`
15. `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
16. `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
17. `project-docs/Architecture/Context-Projection-And-Source-Evidence.md`
18. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
19. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
20. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
21. `project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
22. `project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
23. `project-docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
24. `project-docs/Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`
25. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
26. `project-docs/Architecture/PlanBeads-Implementation-Campaign.md`
27. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
28. `project-docs/Architecture/Minecraft-Basic-Guide.md`
29. `project-docs/Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`
30. `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
31. `project-docs/Setup/Headless-Server.md`
32. `project-docs/Setup/Provider-Setup.md`
33. `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`
34. `project-docs/Setup/ModelScope-Qwen-API-Access.md`

## Active vs Archived

Active internal project docs live under `project-docs/`. Public Docusaurus docs
live under `docs/public-docs/`. Historical material lives under
`project-docs/research-archive/`. Do not cite archived material as an active build
instruction unless an active internal doc explicitly promotes it.
