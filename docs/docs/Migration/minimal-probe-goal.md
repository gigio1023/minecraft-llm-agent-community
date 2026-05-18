---
sidebar_position: 4
---

# Minimal Probe Goal

Status: active first target
Search tokens: `MINECRAFT_AGENT_LOOP_PROBE_V0`, `SMALLEST_PLAYABLE_PROOF`,
`NPC_TOOL_LOOP`.

## Goal

Build the smallest proof that a Minecraft NPC can act like a constrained
tool-using agent, not a scripted branch.

## Scenario

```text
npc_a wants to ask npc_b for a simple answer.
npc_b may be available or busy.
npc_a observes the world.
npc_a moves near npc_b.
npc_a tries to say something.
if npc_b is busy, npc_a waits or rephrases once.
npc_b answers or refuses.
npc_a writes a short memory note.
the run saves a transcript.
```

There is no village yet. There is no economy yet. There is no custom mod yet.

## Tool Set

Keep the first tool set tiny:

- `observe()`
- `move_to(actorOrPosition)`
- `say(targetActor, text)`
- `wait(ticks, reason)`
- `remember(note)`

Optional only after the loop works:

- `inspect_inventory()`
- `inspect_nearby_blocks()`
- `open_container(target)`
- `trade_with_villager(target, tradeIndex)`

## Acceptance Criteria

The first slice is done when:

- a local headless server starts without manual client steps;
- two mineflayer bots join with offline auth;
- `npc_a` completes at least three observe/tool/result iterations;
- one tool result can be blocked or unavailable;
- `npc_a` chooses a different next step after reading that result;
- a transcript artifact is written under `data/evidence/`;
- visual proof is optional, not required.

## Non-Goals

- no broad multi-agent village;
- no Voyager skill DB;
- no LLM-generated JS execution;
- no Fabric/Forge mod dependency;
- no manual Minecraft client proof;
- no live provider dependency before deterministic loop proof.

## Suggested First Commit

First implementation commit should include only:

- package baseline for Node 22;
- local server start script or Docker compose;
- bot connect script;
- transcript writer;
- deterministic fake provider;
- one README section explaining how to run the probe.

Do not add live OpenAI provider in the same commit unless the deterministic
loop already works.
