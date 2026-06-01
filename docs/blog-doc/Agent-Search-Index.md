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
| `DOCUMENTATION_BOUNDARY` | Repo-root docs, Docusaurus public docs, and internal archives are distinct surfaces | `Documentation-Map.md`, `README.md`, `docs/README.md` |
| `BLOG_DOC_ROOT` | Docusaurus-exposed docs live under `docs/blog-doc/`; do not add public docs under `docs/docs/` | `Documentation-Map.md`, `docs/sidebars.js`, `docs/docusaurus.config.js` |
| `REPO_INTERNAL_DOCS` | Root docs guide contributors, agents, implementation review, and spec authority | `README.md`, `SPEC.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` |
| `RESEARCH_ARCHIVE` | Historical research, paper dumps, and stale public plans are preserved but not active build instructions | `docs/research-archive/` |
| `KARPATHY_GUIDELINES` | Think before coding, keep changes simple and surgical, and define verifiable success criteria | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md` |

## Product Direction

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `SOUL_GROUNDED_SOCIAL_SIMULATION` | Minecraft is observation and evidence for Soul/LifeGoal-grounded social simulation, not a generic benchmark | `SPEC.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
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
| `ACTOR_MEMORY_OBSERVATION_ACTION_SPACE` | Memory IO, raw observation, and Mineflayer action-space expansion plan | `Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`, `docs/research-archive/hermes-memory-system/`, `probe/src/memory/actorMemory.ts`, `probe/src/runtime/actionSurface.ts` |
| `ACTOR_PERSISTENT_STATE_PLAN_BEADS` | Restart-safe actor work graph: PlanBeads, dependency edges, and ready fronts under LifeGoal | `Architecture/Actor-Persistent-State-And-PlanBeads.md`, `Terminology.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `PLANBEADS_IMPLEMENTATION_CAMPAIGN` | Long-running parallel implementation campaign contract for PlanBeads work | `Architecture/PlanBeads-Implementation-Campaign.md`, `Architecture/Actor-Persistent-State-And-PlanBeads.md`, `Architecture/Implementation-Workstreams.md` |
| `SOCIAL_CYCLE_LLM_INPUT_CLEANUP` | Stage-specific provider input projection for goal mind, action planner, and cycle judgment | `Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`, `probe/src/provider/socialCycleProviderInputs.ts`, `probe/test/socialCycleRunner.test.ts` |
| `ACTION_INTENT_CONTRACT` | Physical actions require structured executable args; prose is not executable authority | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/test/socialActionIntentContracts.test.ts` |
| `ACTION_SELECTION_GATED_ACTION_SKILL_AUTHORING` | New action skill creation starts only from an explicit action-selection ActionIntent mode, with schema-bound parameters, generated Mineflayer helper trials, and actor-workspace evidence | `Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`, `Architecture/Bounded-Action-Skill-Creation.md`, `probe/src/provider/socialActionPlannerProvider.ts`, `probe/src/generatedActionSkills/directExecutor.ts`, `probe/src/skills/proposals/` |
| `RUNTIME_RETRY_CONSTRAINT` | Exact repeated target/args blockers become runtime gates before another Mineflayer call | `Terminology.md`, `Architecture/Future-Works.md`, `probe/src/runtime/retryConstraints.ts` |
| `WORLD_STATE_DIAGNOSTICS` | World scans must be query-neutral and scoped by loaded-world limits | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/src/tools/worldStateScan.ts` |
| `CONTEXT_COMPACTION` | Preserve evidence-linked state without laundering weak evidence into progress | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `probe/src/runtime/goals/socialCycleContextCompaction.ts` |
| `LIVE_TRANSCRIPT_FIRST` | Runtime value is primarily proven through live transcript and artifact evidence | `Architecture/Transcript-And-Runtime-Artifacts.md`, `Architecture/Current-Handoff-And-Next-Work.md` |

## Current Implementation

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW` | Whole-project current implementation map for runtime flow, boundaries, evidence, and risks | `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`, `README.md` |
| `CURRENT_HANDOFF_NEXT_WORK` | Landed work, verified commands, live evidence, and next improvement order | `Architecture/Current-Handoff-And-Next-Work.md`, `Architecture/Future-Works.md` |
| `CURRENT_ARCHITECTURE_IMPLEMENTATION_AUDIT` | Architecture/implementation cross-check snapshot | `Architecture/Current-Architecture-And-Implementation-Audit.md` |
| `REAL_SERVER_SIMULATION_TEST_PLAN` | Live-server simulation protocol and readiness gates | `Architecture/Real-Server-Simulation-Test-Plan.md`, `Setup/Headless-Server.md`, `Setup/Provider-Setup.md` |
| `FUTURE_WORKS` | Substrate follow-ups from live runs and external references, not spec changes | `Architecture/Future-Works.md` |

## Provider And Operations

| Search Token | Meaning | Primary References |
|--------------|---------|--------------------|
| `HEADLESS_MINEFLAYER_PROBE` | Local server and headless Mineflayer runtime setup | `Setup/Headless-Server.md`, `Architecture/Minimal-Probe.md` |
| `PROVIDER_USAGE_GUARD` | Provider usage ledger, budget guard, and post-run usage summaries | `Setup/Provider-Setup.md`, `Architecture/Transcript-And-Runtime-Artifacts.md`, `probe/src/provider/providerUsageTracker.ts` |
| `PROVIDER_FREE_TIER_RESET_WINDOWS` | OpenAI and Gemini API free-tier daily reset windows and KST conversion rules | `Setup/Provider-Free-Tier-Reset-Windows.md`, `Setup/Provider-Setup.md`, `probe/src/provider/providerUsageTracker.ts` |
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
6. `docs/blog-doc/Documentation-Map.md`
7. `docs/blog-doc/Terminology.md`
8. `docs/blog-doc/Specification/Soul-Grounded-Social-Simulation.md`
9. `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`
10. `docs/blog-doc/Specification/Engineering-Governance-And-Testing.md`
11. `docs/blog-doc/Specification/Reference-Adaptation-Guide.md`
12. `docs/blog-doc/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
13. `docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md`
14. `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
15. `docs/blog-doc/Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`
16. `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md`
17. `docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md`
18. `docs/blog-doc/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
19. `docs/blog-doc/Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`
20. `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md`
21. `docs/blog-doc/Setup/Headless-Server.md`
22. `docs/blog-doc/Setup/Provider-Setup.md`
23. `docs/blog-doc/Setup/Provider-Free-Tier-Reset-Windows.md`

## Active vs Archived

Active public docs live under `docs/blog-doc/`. Internal research and historical
material live under `docs/research-archive/`. Do not cite archived material as an
active build instruction unless an active doc explicitly promotes it.
