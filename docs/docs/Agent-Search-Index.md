# Agent Search Index & Routing Map

Welcome to the central routing map for the **minecraft-llm-agent-community** documentation. This search index helps developers and agent loops locate relevant specs, migration reports, and research.

---

## Important Search Tokens

Use these tokens to search the repository for specific concepts:

| Search Token | Core Meaning | Primary References |
|--------------|--------------|-------------------|
| `MINECRAFT_AGENT_LOOP_MIGRATION` | Transition away from old Voyager architecture | [SPEC.md](../../SPEC.md), [Repo Analysis](Research/2026-05-19-local-minecraft-agent-repo-analysis.md) |
| `HEADLESS_MINEFLAYER_PROBE` | Running lightweight Mineflayer bots inside Docker | [Headless Server Setup](Setup/Headless-Server.md) |
| `MINECRAFT_GAMEPLAY_MODEL` | Primitives and curriculum design for survival | [Gameplay & Seed Skills](Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md) |
| `SKILL_VILLAGE_FAILURE` | Post-mortem of the legacy Voyager village simulation | [Failure Report](Research/2026-05-19-skill-village-failure-report.md) |
| `NO_VOYAGER_EVAL_LOOP` | Ban on letting LLMs write raw JavaScript eval loops | [SPEC.md](../../SPEC.md), [AGENTS.md](../../AGENTS.md) |
| `NO_MANUAL_CLIENT_GATE` | No dependency on manual GUI client connections | [Headless Server Setup](Setup/Headless-Server.md) |
| `OPENAI_CODEX_PROVIDER` | OpenAI Codex model connector settings | [Provider Setup](Setup/Provider-Setup.md) |
| `GAME_RUNTIME_CODEX_AUTH` | Provider credentials store at `build/provider-auth/` | [Provider Setup](Setup/Provider-Setup.md) |
| `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH` | Distinguishing local runtime auth from CLI auth | [AGENTS.md](../../AGENTS.md) |

---

## Required Reading Order

For an onboarding developer or agent, follow this reading order to understand the current architecture:

1. **Search Index & Routing Map** (This file)
2. **Architecture Specification**  
   Understand the core design of the headless, tool-bound multi-agent system.  
   📄 [SPEC.md](../../SPEC.md) | [Docusaurus Architecture Spec](Architecture/SPEC.md)
3. **Headless Server Setup**  
   Configure Docker Compose and the headless Minecraft server runtime.  
   📄 [Headless Server Setup](Setup/Headless-Server.md)
4. **LLM Provider Configuration**  
   Set up local auth storage and structure input observations / output intents.  
   📄 [Provider Setup](Setup/Provider-Setup.md)
5. **Local Minecraft Agent Repo Analysis**  
   Review lessons and structure comparisons from Voyager, Mineflayer-ChatGPT, Mindcraft-CE, and others.  
   📄 [Repo Analysis Report](Research/2026-05-19-local-minecraft-agent-repo-analysis.md)
6. **Skill Village Failure Report**  
   Analyze why the previous open-ended village simulation failed.  
   📄 [Skill Village Failure Report](Research/2026-05-19-skill-village-failure-report.md)
7. **Minecraft Gameplay & Seed Skills**  
   Examine early-game survival curriculum requirements and primitive mappings.  
   📄 [Gameplay & Seed Skills Research](Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills.md)
8. **Minimal Probe Goals**  
   Review the target milestones for the current NPC dialogue and interaction probes.  
   📄 [Minimal Probe Strategy](Architecture/Minimal-Probe.md)
9. **Simulation Plans & Active Probes**  
   Review the step-by-step implementation details for active multi-bot scenarios.  
   📄 [Mutual NPC Interaction Probe](Plans/2026-05-19-mutual-npc-interaction-probe.md) | [Live NPC Dialogue](Plans/2026-05-19-live-npc-dialogue.md)
