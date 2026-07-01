# Local Minecraft Agent Repo Analysis

Date: 2026-05-19

## Scope

This report is based on local clones of the following repositories, not only web
research:

- `Voyager`
- `mc-multimodal-agent`
- `yearn_for_mines`
- `mineflayer-chatgpt`
- `mindcraft-ce`

## Current Problem Definition

The current probe is a Minecraft-connected LLM loop, but not yet a Minecraft
gameplay agent.

The failure is not that the model is too weak, or that social personas are
underwritten. The runtime gives the model movement, looking, digging, and
generated-code freedom before it gives the model a playable Minecraft task
model. As a result, the model optimizes for visible activity: walk, look at
players, dig grass, collect incidental drops, and narrate. Those actions are
valid Mineflayer calls, but they do not form survival progression.

The deeper issues are:

- No curriculum layer chooses concrete, verifiable next tasks such as obtain
  logs, craft planks, craft a crafting table, make a wooden pickaxe, mine
  cobblestone, craft a furnace, or cook food.
- No seed gameplay action skill layer provides reliable Minecraft operations for
  gather, craft, smelt, equip, inspect chest, collect drops, and bounded
  exploration.
- The existing seed action skills are social/visibility primitives, not survival
  primitives.
- The prompt asks for survival/social behavior before the runtime can verify
  survival progress.
- The main runner is still too large. It mixes CLI, Docker, bot lifecycle,
  provider calls, generated action skill writing/importing, safety wrapping, memory,
  observations, tracing, budget, and actor loops.
- Multi-agent behavior has no task pressure. Personas cannot produce meaningful
  cooperation or competition unless agents need scarce resources, roles, shared
  storage, or conflicting priorities.

## Voyager Findings

Voyager's important implementation is not simply "LLM writes code." It combines
four separate constraints:

- `prompts/curriculum.txt` asks for one immediate, concrete task and forces
  formats like `Mine [quantity] [block]`, `Craft [quantity] [item]`,
  `Smelt [quantity] [item]`, `Kill [quantity] [mob]`, and `Equip [item]`.
- `prompts/action_template.txt` gives action generation the previous code,
  execution error, chat log, biome, time, nearby blocks, nearby entities,
  health, hunger, position, equipment, inventory, chests, task, context, and
  critique.
- `control_primitives/` contains reusable Minecraft operations such as
  `mineBlock`, `craftItem`, `smeltItem`, `placeItem`, `killMob`, and
  `exploreUntil`.
- `skill_library/` stores reusable task-level functions grouped around actual
  Minecraft progression: logs, cobblestone, coal, iron, crafting tables,
  pickaxes, furnaces, chests, shields, food, equipment, and exploration.

The practical lesson: do not ask the LLM to invent Minecraft. Give it a task,
trusted primitives, current state, and execution feedback.

## Other Repo Findings

`mc-multimodal-agent` separates the loop into tools, memory, goals, action skills, and
transcript stores. Its strongest lesson is post-action feedback: many action
tool results are enriched with status, navigation, and fresh visual observation
before the next model turn. It also records action skills as scoped ordered tool steps
with preconditions and success criteria, not just generated code blobs.

`yearn_for_mines` makes the loop explicit as
`perceive -> plan -> execute -> verify -> remember`. Its MCP tools return a new
observation after gather/craft outcomes, so every action result becomes the next
context frame. It also keeps observation formatting compact: vital stats,
inventory, points of interest, and recent events.

`mineflayer-chatgpt` is useful for multi-bot control. It uses an event-driven
brain instead of constant polling, a shared team bulletin, role-specific allowed
actions/action skills, recent failure blocking, a critic step after actions, and safety
overrides for water/buried states. It includes builtin gameplay action skills such as
build house/farm/bridge, craft gear, light area, strip mine, smelt ores,
fishing, and stash setup.

`mindcraft-ce` has a broader action library and action manager. The relevant
parts are interruption/timeouts, concise action output summaries, inventory-aware
crafting, smelting with furnace/fuel checks, world query helpers, auto-eat, and
memory/history chunking. It is larger than this repo should become, but its
action-skill/world helper split is worth copying in simplified TypeScript form.

## Improvement Points

1. Add a gameplay curriculum before further social simulation.
   The model should receive one concrete next task at a time, with a short reason
   and a machine-checkable success condition.

2. Replace social seed action skills with early-game survival seed action skills.
   Start with logs, planks/sticks, crafting table, wooden pickaxe, cobblestone,
   stone pickaxe, furnace, coal, raw iron smelting, chest inspection, dropped
   item collection, and safe bounded exploration.

3. Keep generated TypeScript as an advanced layer, not the base layer.
   Generated action skills should compose trusted `ctx.gameplay.*` helpers. They should
   not directly call raw Mineflayer APIs for common operations.

4. Make each action result include post-action state.
   Every gather/craft/smelt/move/explore/action-skill execution should return compact
   post-state: inventory diff, position diff, nearby resource changes, success
   criteria status, and any error cause.

5. Add task pressure for multi-agent behavior.
   Cooperation and competition should come from roles and resources, for example:
   one bot gathers logs, one crafts tools, one raids/inspects village chests,
   shared chest storage exists, and private-vs-shared inventory is visible.

6. Add failure memory and anti-repeat policy.
   If the same action with the same parameters fails repeatedly, block it for the
   current task and force observe/explore/alternative planning.

7. Split the current runner before adding more behavior.
   The present `skillVillageCli.ts` should become a thin entrypoint. Gameplay,
   generated action skills, observation, actor loops, provider calls, tracing, and
   server lifecycle should live in separate directories.

## Proposed Directory Hierarchy

Use a flat project-doc hierarchy and a clearer probe runtime hierarchy.

```text
docs/
  docs/
    project-docs/orientation/agent-search-index.md
    Migration/
    Analysis-of-Prior-Projects/
  plans/
  reports/
  specs/

probe/src/
  server/
  runtime/
  provider/
  tracing/
  memory/
  observation/
  gameplay/
    curriculum/
    primitives/
    seedSkills/
    verification/
  generatedSkills/
  npc/
    actors/
    loop/
    social/
  cli/
```

Rules for the hierarchy:

- `docs/superpowers` is deprecated. New project notes go under `docs/reports`,
  `docs/specs`, or `docs/plans`.
- `gameplay/` owns Minecraft semantics. It should know recipes, resource
  progression, task selection, and success checks.
- `generatedSkills/` owns writing, screening, importing, and timeout execution
  for generated TypeScript bundles.
- `npc/social/` should only contain persona, utterance, role, and shared-status
  logic. It should not decide how to craft, mine, or smelt.
- CLI files should parse environment/config and call one runner.

## Next Implementation Slice

Do not continue by polishing persona prompts. Build this instead:

1. Introduce `gameplay/primitives` with `mineBlock`, `craftItem`, `smeltItem`,
   `collectDrops`, `inspectInventory`, and `exploreUntilFound`.
2. Introduce `gameplay/curriculum` that selects one early-game task from current
   inventory/world state.
3. Introduce `gameplay/verification` for task success checks.
4. Port 8-12 Voyager-style seed action skills in TypeScript using only the primitives.
5. Refactor `skillVillageCli.ts` into a thin CLI plus small modules before
   running another long NPC simulation.
