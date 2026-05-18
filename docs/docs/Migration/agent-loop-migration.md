---
sidebar_position: 1
---

# Agent Loop Migration

Status: active migration plan
Search tokens: `MINECRAFT_AGENT_LOOP_MIGRATION`, `NO_VOYAGER_EVAL_LOOP`,
`HEADLESS_MINEFLAYER_PROBE`.

## Decision

Do not revive the old project as-is. Start a zero-based, tiny mineflayer probe
and use this repository only as reference material and migration staging.

The old project was valuable because it proved that Minecraft can host LLM
agent experiments. It is not the right active architecture now because it is
centered on a Voyager-style loop:

```text
LLM proposes task
-> LLM writes JavaScript action code
-> runtime evals the code
-> critic checks result
-> skill library stores generated code
```

The new target is different:

```text
NPC observes current world state
-> LLM chooses one allowed tool call and one utterance/reason
-> runtime validates the tool call
-> world returns a structured result
-> NPC updates short memory
-> repeat for a small budget
```

The LLM chooses intent. The runtime owns execution, safety, state mutation, and
termination.

## Why Migrate

The previous setup made development too expensive:

- manual Java server setup;
- Fabric/mod setup;
- manual Minecraft client connection;
- human character in-world as the main inspection path;
- LLM-generated JS execution as the behavior layer;
- too much environment work before a small social result could be observed.

The new setup must remove those costs first.

## What To Preserve

Preserve these ideas from the old repo:

- Minecraft is a useful embodied testbed.
- Mineflayer gives a rich action API for movement, chat, inventory, crafting,
  block interaction, and entity observation.
- Multi-agent behavior is interesting only after one small loop works.
- Logs, observations, and skill traces were useful, but should be replaced by a
  smaller transcript/event-ledger format.

## What To Drop

Drop these for the first proof:

- Voyager as the active runtime;
- generated JS skill execution;
- Chroma skill library;
- broad curriculum/critic agent stack;
- Fabric server setup;
- custom mods;
- manual player-client inspection;
- village/economy scope.

## Migration Shape

The migration should produce a new small runtime, either inside this repo or in
a fresh sibling repo, with this shape:

```text
scripts/
  start-headless-server.*
  run-agent-loop-probe.*

src/
  server/
    local-server-config
  mineflayer/
    create-bot
    observe-world
    tool-registry
    transcript
  agent/
    provider-boundary
    npc-loop
    memory

data/
  evidence/
    probe transcripts and screenshots
```

Do not implement all of that at once. The first coherent slice is only server
bootstrap plus two bots exchanging one tool-loop transcript.
