---
sidebar_position: 2
---

# Runtime Evidence And Action Skills

This is the execution-truth spec.

The runtime owns Minecraft reality. Providers and reviewers can propose,
interpret, and diagnose, but success belongs to verifier-backed runtime
evidence.

## Runtime Authority

The hot path is:

```text
observe -> choose -> gate -> execute -> verify -> record
```

Required properties:

- every physical action starts from observed state;
- every provider proposal is validated before execution;
- execution is bounded by timeout and cancellation;
- each meaningful primitive emits evidence;
- verifier status comes from world, inventory, position, block, container, chat,
  transcript, or structured tool result evidence;
- optimistic provider text cannot mark success.

## Actor Workspace

Actor workspace is the source of truth for actor-owned runtime state:

- ActorSoul and goal artifacts;
- active/candidate/retired/rejected action skills;
- memory records;
- evidence files;
- provider input/output snapshots;
- review jobs and outputs;
- relationship edges;
- direct-trial artifacts.

An actor's state must not be inferred from a global transcript tail when a typed
workspace artifact exists.

## Action Skills

An action skill is a Minecraft/Mineflayer behavior the runtime can validate,
execute, verify, and record.

Action skills are not Codex/Claude agent skills. Conversation-like behavior is
an action skill when it goes through the Minecraft runtime and leaves runtime
evidence.

Action skill requirements:

- actor owner;
- role compatibility;
- primitive boundary;
- preconditions;
- success verifier;
- evidence refs;
- lifecycle status;
- promotion/retirement/supersession rules.

Generated or candidate action skills may exist, but they must not bypass
runtime gates. `build/generated-skills` remains legacy exploratory output, not
actor-owned action skill memory.

## Verification

A verifier should reject fake progress:

- movement without measured position change;
- crafting without inventory delta;
- mining without item pickup or block/item evidence;
- container interaction without named item movement or snapshot evidence;
- chat without target/text evidence when the action skill requires social
  communication;
- memory-only completion for physical actions.

The verifier should also preserve partial/progressing evidence when useful. A
truthful blocker is better than a false pass.

## Transcript And Artifacts

Every meaningful run should leave artifacts that explain:

- what the provider saw;
- what it proposed;
- what the runtime allowed or blocked;
- what tool ran;
- what changed in the world or inventory;
- what verifier decided;
- what memory or judgment was written;
- what should be tried next.

The artifact trail should be enough to audit failure without immediately
reproducing the world.

## Settlement State

For Soul-grounded social simulation, settlement state is not background flavor.
It is pressure.

The runtime should move toward a compressed settlement state packet containing:

- current inventory counts;
- shared chest snapshot;
- known base, spawn, table, chest, and shelter positions;
- shelter verifier status;
- pending obligations and handoffs;
- recent blockers;
- recent CycleJudgments;
- available action skills and missing primitive blockers.

This packet should be computed from runtime artifacts, not hallucinated by the
provider.

## Current Evidence Belongs In Handoff Docs

Current matrix results and command outputs are implementation state. They should
be documented in current handoff or audit docs, not treated as immutable spec.

Current-state docs:

- `../Architecture/Current-Handoff-And-Next-Work.md`
- `../Architecture/Current-Architecture-And-Implementation-Audit.md`

## References

- [ReAct](https://arxiv.org/abs/2210.03629) supports interleaving reasoning,
  acting, and environment feedback.
- [Inner Monologue](https://arxiv.org/abs/2207.05608) supports planning with
  language feedback from embodied environments.
- [SayCan](https://arxiv.org/abs/2204.01691) supports grounding language choices
  in feasible skills/affordances.
- [Embodied Agent Interface](https://huggingface.co/papers/2410.07166) supports
  evaluating hallucination, affordance, and planning errors separately rather
  than only final success.
- [SWE-agent](https://arxiv.org/abs/2405.15793) is relevant because agent
  performance depends heavily on the action interface.
