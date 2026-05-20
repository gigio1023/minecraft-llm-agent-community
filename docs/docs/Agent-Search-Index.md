# Agent Search Index & Routing Map

Welcome to the central routing map for the project documentation.

Use this file to find the canonical definition docs, setup docs, and historical
research without confusing archived plans for the active implementation path.

## Important Search Tokens

| Search Token | Core Meaning | Primary References |
|--------------|--------------|-------------------|
| `MINECRAFT_AGENT_LOOP_MIGRATION` | Reset from earlier drifting implementations back to a small runtime from `main` | `SPEC.md`, `AGENTS.md` |
| `HEADLESS_MINEFLAYER_PROBE` | Headless Mineflayer runtime on a local server | `Setup/Headless-Server.md`, `Architecture/Minimal-Probe.md` |
| `MINECRAFT_GAMEPLAY_MODEL` | Real boring gameplay competence before larger social goals | `SPEC.md`, `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md` |
| `SKILL_VILLAGE_FAILURE` | Why the prior village-style direction failed | `Research/2026-05-19-skill-village-failure-report.md` |
| `NO_VOYAGER_EVAL_LOOP` | Do not return to raw eval-based gameplay execution | `SPEC.md`, `AGENTS.md` |
| `NO_MANUAL_CLIENT_GATE` | No manual GUI client should be required for the first proof | `Setup/Headless-Server.md` |
| `OPENAI_CODEX_PROVIDER` | Provider-backed gameplay paths and auth expectations | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `GAME_RUNTIME_CODEX_AUTH` | Repo-local ignored provider auth storage | `Setup/Provider-Setup.md`, `AGENTS.md` |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | CLI login and gameplay auth are different concerns | `AGENTS.md` |
| `SOCIAL_SIMULATION_SEED` | Long-term north star: society seed, not immediate product scope | `SPEC.md`, `intro.md` |
| `LIVE_TRANSCRIPT_FIRST` | Live transcript is the primary runtime evidence | `SPEC.md`, `AGENTS.md` |
| `CHECKPOINT_READY_RUNTIME` | Phase 1 should be checkpoint-ready even before full arbitrary resume | `SPEC.md` |
| `MINIMAL_ACTION_SKILL_MEMORY_HOOK` | Add per-agent action skill ownership hook now, not full autonomous evolution | `SPEC.md`, `Terminology.md` |
| `BOUNDED_ACTION_SKILL_CREATION` | Evidence-backed action skill proposals and recipe validation, not hot-loop generated code | `Architecture/Bounded-Action-Skill-Creation.md`, `SPEC.md`, `Terminology.md` |
| `ACTION_SKILL` | Minecraft/Mineflayer bundled behavior executed by the game runtime | `Terminology.md`, `Architecture/Bounded-Action-Skill-Creation.md` |
| `AGENT_SKILL` | Codex/Claude-style `.agents/skills/*/SKILL.md` capability | `Terminology.md`, `.agents/skills/minecraft-agent-runtime-review/SKILL.md` |

## Required Reading Order

For any onboarding developer or agent, read in this order:

1. `SPEC.md`
2. `../../AGENTS.md`
3. `Terminology.md`
4. `intro.md`
5. `Architecture/Minimal-Probe.md`
6. `Setup/Headless-Server.md`
7. `Setup/Provider-Setup.md`
8. `Research/2026-05-19-local-minecraft-agent-repo-analysis.md`
9. `Research/2026-05-19-skill-village-failure-report.md`
10. `Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md`
11. `Architecture/Bounded-Action-Skill-Creation.md`

## Active vs Historical Docs

Treat these as active, project-defining documents:

- `SPEC.md`
- `AGENTS.md`
- `Terminology.md`
- `intro.md`
- `Architecture/Minimal-Probe.md`
- `Architecture/Bounded-Action-Skill-Creation.md`
- `Setup/Headless-Server.md`
- `Setup/Provider-Setup.md`

Treat these as supporting research or historical context:

- everything under `Research/`
- older probe plans under `Plans/` unless they are explicitly marked active

If a plan describes a path that is no longer the active implementation target,
it should be marked historical or archived rather than silently left as if still
current.
