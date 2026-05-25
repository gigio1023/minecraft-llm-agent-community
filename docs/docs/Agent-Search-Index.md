# Agent Search Index & Routing Map

Welcome to the central routing map for the project documentation.

Use this file to find the canonical definition docs, setup docs, and historical
research without confusing archived plans for the active implementation path.

## Important Search Tokens

| Search Token | Core Meaning | Primary References |
|--------------|--------------|-------------------|
| `MINECRAFT_AGENT_LOOP_MIGRATION` | Current bounded-runtime rebuild direction and non-negotiable scope | `SPEC.md`, `Architecture/Runtime-Loop-And-Verification.md`, `AGENTS.md` |
| `HEADLESS_MINEFLAYER_PROBE` | Headless Mineflayer runtime on a local server; use `bun run --cwd probe server:ready` for a user-joinable Docker endpoint | `Setup/Headless-Server.md`, `Architecture/Minimal-Probe.md`, `Architecture/Runtime-Loop-And-Verification.md` |
| `MINECRAFT_GAMEPLAY_MODEL` | Real boring gameplay competence before larger social goals | `Architecture/Runtime-Loop-And-Verification.md`, `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md` |
| `SPEC_GOVERNANCE` | `SPEC.md`, split specification docs, and `AGENTS.md` are long-term product or agent-operation contracts; edits require explicit user approval unless directly requested | `SPEC.md`, `Specification/Engineering-Governance-And-Testing.md`, `AGENTS.md` |
| `DOCUMENTATION_MAP` | Authority order and active/supporting/historical classification for repo docs | `Documentation-Map.md`, `Agent-Search-Index.md`, `SPEC.md` |
| `TERMINOLOGY` | Normative vocabulary for actor/bot/NPC, action skill/agent skill, social-cycle records, platform-sensitive work, and AI-slop wording to avoid | `Terminology.md`, `AGENTS.md`, `Documentation-Map.md` |
| `SOUL_GROUNDED_SOCIAL_SIMULATION` | Minecraft is the pressure/evidence substrate for Soul/ActorSoul-grounded social simulation, not a generic benchmark objective | `SPEC.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `RUNTIME_EVIDENCE_ACTION_SKILLS` | Runtime-owned truth, actor-owned action skills, verifier evidence, transcript artifacts, and settlement pressure state | `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Action-Skill-Verification.md` |
| `ENGINEERING_GOVERNANCE_TESTING` | Small typed modules, structured domain models, high-signal comments, Detroit-style tests, and live-run evidence priority | `Specification/Engineering-Governance-And-Testing.md`, `AGENTS.md` |
| `REFERENCE_ADAPTATION_GUIDE` | How to translate external papers into this repo without copying Voyager/benchmark/product goals | `Specification/Reference-Adaptation-Guide.md`, `SPEC.md`, `AGENTS.md` |
| `AUTONOMY_SUBSTRATE_NOT_DOMAIN_STRATEGY` | Core rule that action surface, hooks, gates, verification, and artifacts are substrate; house/shelter/building must not become always-on cycle architecture | `SPEC.md`, `Specification/Soul-Grounded-Social-Simulation.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `AGENTS.md` |
| `HF_PAPER_SWEEP_VOYAGER_SUCCESSORS` | Hugging Face paper sweep over Voyager successors, Minecraft skill libraries, objective curricula, reviewer loops, and social simulation fit | `docs/research-archive/2026-05-23/hf-paper-sweep-voyager-successors.md`, `Architecture/Direct-Generated-Action-Skills.md`, `Architecture/Autonomous-Objective-Evaluation.md` |
| `AGENT_MEMORY_SYSTEM_LITERATURE_PLAN` | Literature-backed memory system plan for dense Mineflayer substrate and bounded actor-owned action continuity | `docs/research-archive/2026-05-23/agent-memory-system-literature-and-plan.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Direct-Generated-Action-Skills.md` |
| `MINECRAFT_MEMORY_CURRENT_LLM_RESEARCH` | 2026-focused Minecraft and agent-memory research refresh read through the lens of current LLM capability | `docs/research-archive/2026-05-23/minecraft-memory-current-llm-research.md`, `docs/research-archive/2026-05-23/agent-memory-system-literature-and-plan.md`, `Architecture/Direct-Generated-Action-Skills.md` |
| `TYPED_ACTOR_MEMORY` | Actor-owned Minecraft memory schema, direct objective capture, symbolic retrieval, and provider context injection | `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Implementation-Workstreams.md`, `docs/research-archive/2026-05-23/minecraft-memory-current-llm-research.md` |
| `SKILL_VILLAGE_FAILURE` | Why the prior village-style direction failed | `Research/2026-05-19-skill-village-failure-report.md` |
| `NO_VOYAGER_EVAL_LOOP` | Do not return to loose, unverifiable eval-based gameplay execution | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `AGENTS.md` |
| `NO_MANUAL_CLIENT_GATE` | No manual GUI client should be required for the first proof | `Setup/Headless-Server.md` |
| `OPENAI_CODEX_PROVIDER` | Provider-backed gameplay paths and auth expectations | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `GAME_RUNTIME_CODEX_AUTH` | Repo-local ignored provider auth storage | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | CLI login and gameplay auth are different concerns | `AGENTS.md` |
| `SOCIAL_SIMULATION_SEED` | Near-term bounded social-life seed for one actor, and long-term society north star | `SPEC.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/Runtime-Loop-And-Verification.md`, `intro.md` |
| `SPEED_BOUNDED_SOCIAL_SIMULATION` | Social simulation must keep bounded actor turns; long critic/review work cannot block runtime progress | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Async-Reviewer-Sidecars.md`, `Architecture/LLM-Context-And-Actor-Workspace.md` |
| `SOCIAL_ACTOR_PROFILES` | Canonical actor profile, goal stack, and relationship enums for evidence-backed social behavior | `Architecture/Social-Actor-Profiles-And-Relationships.md`, `Architecture/LLM-Context-And-Actor-Workspace.md` |
| `LIVE_TRANSCRIPT_FIRST` | Live transcript is the primary runtime evidence | `Architecture/Transcript-And-Runtime-Artifacts.md`, `AGENTS.md` |
| `CHECKPOINT_READY_RUNTIME` | Phase 1 should be checkpoint-ready even before full arbitrary resume | `Architecture/Transcript-And-Runtime-Artifacts.md`, `SPEC.md` |
| `MINIMAL_ACTION_SKILL_MEMORY_HOOK` | Add per-actor action skill ownership hook now, not full autonomous evolution | `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Terminology.md` |
| `BOUNDED_ACTION_SKILL_CREATION` | Evidence-backed cleanup path for generated or proposed action skills | `Architecture/Bounded-Action-Skill-Creation.md`, `SPEC.md`, `Terminology.md` |
| `ACTIVE_ACTION_SKILL_GATE` | Runtime provider proposals execute only when backed by actor-owned active action skill records | `SPEC.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Implementation-Workstreams.md` |
| `ACTION_SURFACE` | Provider-visible direct/deferred affordance packet for the current actor body; not a domain strategy or single-domain checklist | `Specification/Runtime-Evidence-And-Action-Skills.md`, `SPEC.md`, `Architecture/Future-Works.md`, `probe/src/runtime/actionSurface.ts` |
| `WORLD_STATE_DIAGNOSTICS` | Bounded, query-neutral Mineflayer world scans that make absence claims, raw observed Minecraft names, positions, hazards, and loaded-world limits auditable without hardcoded strategy categories | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Specification/Engineering-Governance-And-Testing.md`, `AGENTS.md` |
| `ACTION_INTENT_CONTRACT` | Required structured args for physical ActionIntents; natural-language rationale is not executable authority and hidden defaults are contract failures | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Specification/Engineering-Governance-And-Testing.md`, `AGENTS.md` |
| `CONTEXT_COMPACTION` | Long-run provider context strategy that preserves Soul/LifeGoal continuity, current evidence-linked state, blockers, diagnostics, action-surface contracts, and artifact refs without laundering weak evidence into progress | `SPEC.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Specification/Engineering-Governance-And-Testing.md`, `AGENTS.md` |
| `ACTION_SKILL_VERIFICATION` | Implemented action skills must have Mineflayer boundary evidence and checked-in protection tests | `Architecture/Action-Skill-Verification.md`, `Architecture/Runtime-Loop-And-Verification.md`, `AGENTS.md` |
| `AUTONOMOUS_OBJECTIVE_EVALUATION` | Supporting bounded objective evidence gates; evaluation track, not the top-level product direction | `Architecture/Autonomous-Objective-Evaluation.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Action-Skill-Verification.md` |
| `DIRECT_GENERATED_ACTION_SKILLS` | Supporting actor-owned direct trial/propagation path; not goal authority and not proof without current-run evidence | `Architecture/Direct-Generated-Action-Skills.md`, `Specification/Runtime-Evidence-And-Action-Skills.md`, `Architecture/Autonomous-Objective-Evaluation.md` |
| `SOUL_LIFE_GOAL_RUNTIME` | Actor soul, persistent life goal, cycle goal, and cycle judgment as the continuity layer for social simulation | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/Social-Actor-Profiles-And-Relationships.md`, `Architecture/Runtime-Loop-And-Verification.md` |
| `ACTOR_SOUL_GOAL_LEDGER` | Durable actor-owned soul/life/cycle goal artifacts under actor workspace, inspired by Codex goal lifecycle but scoped to Minecraft actors | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md` |
| `SOCIAL_LIFE_CYCLE_GOAL` | Per-cycle goal selection from soul, memory, relationships, world state, and previous cycle judgment | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `probe/src/npc/goals/goalStack.ts`, `probe/src/runtime/pressureIntent.ts` |
| `NO_USER_TASK_AS_TOP_LEVEL_GOAL` | External input is a WorldEvent pressure or scenario event; the actor's top-level goal is social life continuity | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/Social-Actor-Profiles-And-Relationships.md` |
| `NO_PROBE_PASSED_AUTONOMY_METRIC` | `probe passed` proves runtime evidence only; use soul/cycle source, builtin, fixture, memory, relationship, and helper-expansion metrics for agency | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/Gemini-Native-Audio-Codegen-Verdict.md`, `Architecture/Current-Handoff-And-Next-Work.md` |
| `COMPOSER_25_SOUL_LIFE_GOAL_RUNTIME_PLAN` | Composer 2.5 handoff for implementing the full Soul/LifeGoal/StrategicGoal/CycleGoal runtime vertical slice with OpenAI API validation | `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `SOUL_CYCLE_VERTICAL_SLICE` | First complete social-life loop: load soul, choose goal, plan action, execute, verify, write judgment, run second cycle with prior judgment | `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md` |
| `WORLD_EVENT_NOT_USER_PROMPT` | External input is modeled as WorldEvent pressure, not a user prompt or actor LifeGoal | `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md` |
| `OPENAI_API_GPT54_MINI_SOCIAL_RUNTIME` | Historical/explicit OpenAI social-cycle provider path; do not use for cost-sensitive tests unless budget state is known | `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`, `Setup/Provider-Setup.md`, `Setup/OpenAI-Tier3-Free-Usage.md` |
| `OBJECTIVE_PHASE_EVIDENCE_GATES` | Opt-in exploration/propagation concepts run as objective phases or direct-generated trials behind runtime evidence gates, not as active product strategy | `SPEC.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md`, `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`, `Architecture/Direct-Generated-Action-Skills.md` |
| `REAL_SERVER_SIMULATION_TEST_PLAN` | Live-server simulation test protocol for connected Mineflayer actors, explicit live provider social cycles, action-skill evidence, provider usage guard, and readiness gates for concrete runtime behavior | `Architecture/Real-Server-Simulation-Test-Plan.md`, `Setup/Headless-Server.md`, `Setup/Provider-Setup.md` |
| `FUTURE_WORKS` | Live-run follow-ups that do not change the long-term spec: long-cycle findings, blocked-retry pivot rules, partial-progress reporting, review summary catch-up, and Minecraft MCP/Codex action-interface reference adaptation | `Architecture/Future-Works.md`, `Architecture/Real-Server-Simulation-Test-Plan.md`, `Architecture/Current-Handoff-And-Next-Work.md` |
| `MCP_HOUSE_BUILDING_REFERENCE` | External Minecraft MCP/Claude examples reinterpreted as action-surface, schema, hook, and verifier references, not as house-building product architecture | `Architecture/Future-Works.md`, `Specification/Reference-Adaptation-Guide.md`, `Architecture/Bounded-Action-Skill-Creation.md` |
| `CURRENT_ARCHITECTURE_IMPLEMENTATION_AUDIT` | Current architecture explanation, implementation cross-check, external research synthesis, and next settlement-cycle gates | `Architecture/Current-Architecture-And-Implementation-Audit.md`, `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Soul-Life-Goal-Runtime-Architecture.md` |
| `MINECRAFT_ENCYCLOPEDIA_RESEARCH_BRIEF` | Handoff prompt for building a versioned repo-local Minecraft knowledge layer instead of relying on stale LLM memory | `Knowledge/Minecraft-Encyclopedia-Research-Brief.md` |
| `MINECRAFT_ACTION_SKILL_KNOWLEDGE` | Minecraft mechanics and data mapped into action skills, runtime primitives, and verifier evidence | `Knowledge/Minecraft-Encyclopedia-Research-Brief.md`, `Architecture/Action-Skill-Verification.md`, `probe/src/gameplay/seedSkills/registry.ts` |
| `VANILLA_MECHANICS_TO_VERIFIERS` | Converts vanilla item/block/recipe/tool mechanics into runtime-observable evidence contracts | `Knowledge/Minecraft-Encyclopedia-Research-Brief.md`, `Architecture/Runtime-Loop-And-Verification.md` |
| `SINGLE_ACTOR_LONG_TERM_DIAMOND_HANDOFF` | Supporting opt-in dependency-chain evidence harness; diamond is not the active product goal | `Architecture/Single-Actor-Long-Term-Diamond-Handoff.md`, `Architecture/composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md`, `Architecture/Direct-Generated-Action-Skills.md`, `Architecture/Autonomous-Objective-Evaluation.md` |
| `COMPOSER_25_SINGLE_ACTOR_LONG_TERM_DIAMOND_PLAN` | Supporting Composer 2.5 plan for the long-objective evaluation harness; not the social-life runtime | `Architecture/composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md` |
| `GEMINI_NATIVE_AUDIO_DIALOG_DEFAULT` | Native Audio Dialog legacy token; dialog/smoke only, not primary codegen | `docs/docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md`, `Setup/Provider-Setup.md` |
| `GEMINI_OPENAI_COMPAT_PLANNER` | OpenAI SDK → Gemini OpenAI-compat chat.completions for planner/codegen experiments | `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts` |
| `PLANNER_PROVIDER_MATRIX` | genai + OpenAI SDK + json_schema structured output matrix | `probe/scripts/experimentPlannerProviderMatrix.ts`, `tmp/planner-provider-matrix-report.json` |
| `OPENAI_TIER3_FREE_USAGE` | OpenAI API (not Codex) free daily token pools for gpt-5.4-mini etc. | `docs/docs/Setup/OpenAI-Tier3-Free-Usage.md` |
| `PROVIDER_USAGE_GUARD` | Provider usage ledger, free-tier budget guard, and post-run usage summaries for Gemini/OpenAI-backed paths | `Setup/Provider-Setup.md`, `Architecture/Transcript-And-Runtime-Artifacts.md`, `probe/src/provider/providerUsageTracker.ts` |
| `GEMINI_API_SOCIAL_PROVIDER` | Social-cycle provider path using Gemini API and Gemma 4 31B (`gemma-4-31b-it`) with budget guardrails | `Setup/Provider-Setup.md`, `README.md`, `probe/src/provider/geminiApiJsonProvider.ts` |
| `SOCIAL_SIMULATION_NEXT_GOAL_HANDOFF` | Future multi-actor expansion handoff for moving from single-actor Soul/LifeGoal evidence to a tiny social exchange loop | `Architecture/Social-Simulation-Next-Goal-Handoff.md`, `SPEC.md`, `Architecture/Social-Actor-Profiles-And-Relationships.md` |
| `CURRENT_HANDOFF_NEXT_WORK` | Current rebuild handoff, landed work, verified commands, live evidence, and next improvement order | `Architecture/Current-Handoff-And-Next-Work.md`, `SPEC.md`, `Architecture/Implementation-Workstreams.md` |
| `GENERATED_ACTION_SKILL_LEGACY_STORE` | `build/generated-skills` is legacy debug output, not actor-owned candidate or active action skill memory | `SPEC.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Implementation-Workstreams.md` |
| `PER_ACTOR_ASYNC_REVIEWER` | One async reviewer sidecar per actor; global reviewer may summarize only | `Architecture/Async-Reviewer-Sidecars.md`, `Architecture/LLM-Context-And-Actor-Workspace.md`, `Architecture/Implementation-Workstreams.md` |
| `REVIEW_ACTORS_CLI` | Runs queued deterministic per-actor reviewer jobs without blocking runtime turns | `Architecture/Async-Reviewer-Sidecars.md`, `SPEC.md` |
| `REVIEW_RELATIONSHIP_APPLIER` | Explicitly applies reviewer relationship event proposals through runtime-owned guards | `Architecture/Async-Reviewer-Sidecars.md`, `Architecture/Social-Actor-Profiles-And-Relationships.md`, `SPEC.md` |
| `RELATIONSHIP_ACTION_PRESSURE` | Enum-derived relationship pressure exposed to provider context without granting tools | `Architecture/Social-Actor-Profiles-And-Relationships.md`, `Architecture/LLM-Context-And-Actor-Workspace.md`, `SPEC.md` |
| `ACTOR_PROVIDER_CONTEXT` | Provider-facing context packet built from actor workspace active skills, candidates, evidence, reviews, and memory | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md` |
| `OPENAI_CODEX_GAMEPLAY_PROVIDER` | Opt-in phase-one gameplay provider selected with `PROBE_GAMEPLAY_PROVIDER=openai-codex` | `Architecture/Runtime-Loop-And-Verification.md`, `Setup/Provider-Setup.md` |
| `OPENAI_CODEX_REVIEWER` | Opt-in per-actor reviewer reasoning selected with `REVIEW_ACTORS_PROVIDER=openai-codex` | `Architecture/Async-Reviewer-Sidecars.md`, `SPEC.md` |
| `ARCHIVE_LEGACY_GENERATED_SKILLS` | Migrates old `build/generated-skills` TypeScript files into actor workspace candidate proposals | `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `SPEC.md` |
| `LLM_CONTEXT_ACTOR_WORKSPACE` | Visual map of current LLM inputs, memory layers, actor workspace, and action skill lifecycle gaps | `Architecture/LLM-Context-And-Actor-Workspace.md`, `static/architecture/llm-context-and-actor-workspace.html`, `Architecture/Bounded-Action-Skill-Creation.md` |
| `IMPLEMENTATION_WORKSTREAMS` | Parallel subagent ownership and merge plan for the next architecture slice | `Architecture/Implementation-Workstreams.md`, `SPEC.md` |
| `ACTION_SKILL` | Minecraft/Mineflayer bundled behavior executed by the game runtime | `Terminology.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Bounded-Action-Skill-Creation.md` |
| `AGENT_SKILL` | Codex/Claude-style `.agents/skills/*/SKILL.md` capability | `Terminology.md`, `.agents/skills/minecraft-agent-runtime-review/SKILL.md` |

## Required Reading Order

For any onboarding developer or agent, read in this order:

1. `SPEC.md`
2. `../../AGENTS.md`
3. `Specification/Soul-Grounded-Social-Simulation.md`
4. `Specification/Runtime-Evidence-And-Action-Skills.md`
5. `Specification/Engineering-Governance-And-Testing.md`
6. `Specification/Reference-Adaptation-Guide.md`
7. `Documentation-Map.md`
8. `Terminology.md`
9. `intro.md`
10. `Architecture/Minimal-Probe.md`
11. `Architecture/Runtime-Loop-And-Verification.md`
12. `Architecture/Transcript-And-Runtime-Artifacts.md`
13. `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
14. `Architecture/Async-Reviewer-Sidecars.md`
15. `Architecture/Implementation-Workstreams.md`
16. `Architecture/Action-Skill-Verification.md`
17. `Architecture/Current-Handoff-And-Next-Work.md`
18. `Architecture/Bounded-Action-Skill-Creation.md`
19. `Architecture/Soul-Life-Goal-Runtime-Architecture.md`
20. `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
21. `Architecture/Real-Server-Simulation-Test-Plan.md`
22. `Architecture/Current-Architecture-And-Implementation-Audit.md`
23. `Architecture/Future-Works.md`
24. `Knowledge/Minecraft-Encyclopedia-Research-Brief.md`
25. `Architecture/LLM-Context-And-Actor-Workspace.md`
26. `Architecture/Social-Actor-Profiles-And-Relationships.md`
27. `Setup/Headless-Server.md`
28. `Setup/Provider-Setup.md`
29. `Research/2026-05-19-local-minecraft-agent-repo-analysis.md`
30. `Research/2026-05-19-skill-village-failure-report.md`
31. `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md`
32. `docs/research-archive/2026-05-23/hf-paper-sweep-voyager-successors.md`
33. `docs/research-archive/2026-05-23/agent-memory-system-literature-and-plan.md`
34. `docs/research-archive/2026-05-23/minecraft-memory-current-llm-research.md`

## Active vs Historical Docs

Treat these as active, project-defining documents:

- `SPEC.md`
- `AGENTS.md`
- `Specification/Soul-Grounded-Social-Simulation.md`
- `Specification/Runtime-Evidence-And-Action-Skills.md`
- `Specification/Engineering-Governance-And-Testing.md`
- `Specification/Reference-Adaptation-Guide.md`
- `Documentation-Map.md`
- `Terminology.md`
- `intro.md`
- `Architecture/Minimal-Probe.md`
- `Architecture/Runtime-Loop-And-Verification.md`
- `Architecture/Transcript-And-Runtime-Artifacts.md`
- `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `Architecture/Async-Reviewer-Sidecars.md`
- `Architecture/Implementation-Workstreams.md`
- `Architecture/Action-Skill-Verification.md`
- `Architecture/Current-Handoff-And-Next-Work.md`
- `Architecture/Bounded-Action-Skill-Creation.md`
- `Architecture/Soul-Life-Goal-Runtime-Architecture.md`
- `Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
- `Architecture/Real-Server-Simulation-Test-Plan.md`
- `Architecture/Current-Architecture-And-Implementation-Audit.md`
- `Architecture/Future-Works.md`
- `Knowledge/Minecraft-Encyclopedia-Research-Brief.md`
- `Architecture/LLM-Context-And-Actor-Workspace.md`
- `Architecture/Social-Actor-Profiles-And-Relationships.md`
- `Setup/Headless-Server.md`
- `Setup/Provider-Setup.md`

Treat these as supporting evaluation, propagation, or handoff tracks subordinate
to the Soul/LifeGoal social runtime:

- `Architecture/Autonomous-Objective-Evaluation.md`
- `Architecture/Direct-Generated-Action-Skills.md`
- `Architecture/Single-Actor-Long-Term-Diamond-Handoff.md`
- `Architecture/composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md`
- `Architecture/Social-Simulation-Next-Goal-Handoff.md`

Treat these as supporting research or historical context:

- everything under `Research/`
- offline retrieval-only research under `docs/research-archive/`
- older probe plans under `Plans/` unless they are explicitly marked active

If a plan describes a path that is no longer the active implementation target,
it should be marked historical or archived rather than silently left as if still
current.
