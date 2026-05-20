# Agent Search Index & Routing Map

Welcome to the central routing map for the project documentation.

Use this file to find the canonical definition docs, setup docs, and historical
research without confusing archived plans for the active implementation path.

## Important Search Tokens

| Search Token | Core Meaning | Primary References |
|--------------|--------------|-------------------|
| `MINECRAFT_AGENT_LOOP_MIGRATION` | Current bounded-runtime rebuild direction and non-negotiable scope | `SPEC.md`, `Architecture/Runtime-Loop-And-Verification.md`, `AGENTS.md` |
| `HEADLESS_MINEFLAYER_PROBE` | Headless Mineflayer runtime on a local server | `Setup/Headless-Server.md`, `Architecture/Minimal-Probe.md`, `Architecture/Runtime-Loop-And-Verification.md` |
| `MINECRAFT_GAMEPLAY_MODEL` | Real boring gameplay competence before larger social goals | `Architecture/Runtime-Loop-And-Verification.md`, `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md` |
| `SKILL_VILLAGE_FAILURE` | Why the prior village-style direction failed | `Research/2026-05-19-skill-village-failure-report.md` |
| `NO_VOYAGER_EVAL_LOOP` | Do not return to raw eval-based gameplay execution | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `AGENTS.md` |
| `NO_MANUAL_CLIENT_GATE` | No manual GUI client should be required for the first proof | `Setup/Headless-Server.md` |
| `OPENAI_CODEX_PROVIDER` | Provider-backed gameplay paths and auth expectations | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `GAME_RUNTIME_CODEX_AUTH` | Repo-local ignored provider auth storage | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | CLI login and gameplay auth are different concerns | `AGENTS.md` |
| `SOCIAL_SIMULATION_SEED` | Long-term north star: society seed, not immediate product scope | `SPEC.md`, `Architecture/Runtime-Loop-And-Verification.md`, `intro.md` |
| `SPEED_BOUNDED_SOCIAL_SIMULATION` | Social simulation must keep bounded actor turns; long critic/review work cannot block runtime progress | `Architecture/Runtime-Loop-And-Verification.md`, `Architecture/Async-Reviewer-Sidecars.md`, `Architecture/LLM-Context-And-Actor-Workspace.md` |
| `LIVE_TRANSCRIPT_FIRST` | Live transcript is the primary runtime evidence | `Architecture/Transcript-And-Runtime-Artifacts.md`, `AGENTS.md` |
| `CHECKPOINT_READY_RUNTIME` | Phase 1 should be checkpoint-ready even before full arbitrary resume | `Architecture/Transcript-And-Runtime-Artifacts.md`, `SPEC.md` |
| `MINIMAL_ACTION_SKILL_MEMORY_HOOK` | Add per-agent action skill ownership hook now, not full autonomous evolution | `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Terminology.md` |
| `BOUNDED_ACTION_SKILL_CREATION` | Evidence-backed action skill proposals and recipe validation, not hot-loop generated code | `Architecture/Bounded-Action-Skill-Creation.md`, `SPEC.md`, `Terminology.md` |
| `ACTIVE_ACTION_SKILL_GATE` | Runtime provider proposals execute only when backed by actor-owned active action skill records | `SPEC.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Implementation-Workstreams.md` |
| `GENERATED_ACTION_SKILL_LEGACY_STORE` | `build/generated-skills` is legacy debug output, not actor-owned candidate or active action skill memory | `SPEC.md`, `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`, `Architecture/Implementation-Workstreams.md` |
| `PER_NPC_ASYNC_REVIEWER` | One async reviewer sidecar per NPC; global reviewer may summarize only | `Architecture/Async-Reviewer-Sidecars.md`, `Architecture/LLM-Context-And-Actor-Workspace.md`, `Architecture/Implementation-Workstreams.md` |
| `REVIEW_ACTORS_CLI` | Runs queued deterministic per-actor reviewer jobs without blocking runtime turns | `Architecture/Async-Reviewer-Sidecars.md`, `SPEC.md` |
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
3. `Terminology.md`
4. `intro.md`
5. `Architecture/Minimal-Probe.md`
6. `Architecture/Runtime-Loop-And-Verification.md`
7. `Architecture/Transcript-And-Runtime-Artifacts.md`
8. `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
9. `Architecture/Async-Reviewer-Sidecars.md`
10. `Architecture/Implementation-Workstreams.md`
11. `Architecture/Bounded-Action-Skill-Creation.md`
12. `Architecture/LLM-Context-And-Actor-Workspace.md`
13. `Setup/Headless-Server.md`
14. `Setup/Provider-Setup.md`
15. `Research/2026-05-19-local-minecraft-agent-repo-analysis.md`
16. `Research/2026-05-19-skill-village-failure-report.md`
17. `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md`

## Active vs Historical Docs

Treat these as active, project-defining documents:

- `SPEC.md`
- `AGENTS.md`
- `Terminology.md`
- `intro.md`
- `Architecture/Minimal-Probe.md`
- `Architecture/Runtime-Loop-And-Verification.md`
- `Architecture/Transcript-And-Runtime-Artifacts.md`
- `Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `Architecture/Async-Reviewer-Sidecars.md`
- `Architecture/Implementation-Workstreams.md`
- `Architecture/Bounded-Action-Skill-Creation.md`
- `Architecture/LLM-Context-And-Actor-Workspace.md`
- `Setup/Headless-Server.md`
- `Setup/Provider-Setup.md`

Treat these as supporting research or historical context:

- everything under `Research/`
- older probe plans under `Plans/` unless they are explicitly marked active

If a plan describes a path that is no longer the active implementation target,
it should be marked historical or archived rather than silently left as if still
current.
