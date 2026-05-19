---
sidebar_position: 2
---

# Project Roadmap & Goals

Our immediate goal is to demonstrate a stable "NPC Tool-Loop"—a system where a Minecraft NPC can perceive its environment, make decisions using an LLM, and execute those decisions reliably.

## The Minimal Viable Proof

We are building a scenario where two NPCs, `NPC_A` and `NPC_B`, must interact to solve a simple problem:

1. **Perception**: `NPC_A` observes the world and sees `NPC_B`.
2. **Decision**: `NPC_A` decides to approach `NPC_B` and ask a question.
3. **Social Awareness**: If `NPC_B` is busy (e.g., crafting), `NPC_A` must decide whether to wait or try again later.
4. **Conclusion**: `NPC_A` records the result in its memory and the session transcript is saved.

## Core Tool Set

To keep the initial research focused, we use a minimal set of validated tools:

- `observe()`: Gather data about surroundings.
- `move_to(target)`: Navigate to a specific actor or coordinate.
- `say(target, text)`: Communicate with another NPC.
- `wait(duration)`: Pause for a short period.
- `remember(note)`: Store a key fact in local memory.

## Future Milestones

Once the basic tool-loop is proven stable, we plan to expand into:

- **Shared Economy**: NPCs managing shared chests and crafting dependencies.
- **Role-Based Societies**: Clear divisions of labor (e.g., Gatherers vs. Crafters).
- **Survival Challenges**: Introducing scarcity and hostile entities to observe emergent cooperation.
- **Dynamic Skill Generation**: Allowing NPCs to "learn" new complex behaviors over time.

## Success Criteria

A simulation run is considered successful when:
- Multiple bots join and stay connected to a headless server.
- The transcript shows logical turn-taking and tool usage.
- The agents successfully navigate social state (e.g., waiting for a busy partner).
- A structured data artifact is produced for every run.
