# Minecraft LLM Agent Observation Loop Research

Date: 2026-05-19

## Scope

Recent Minecraft LLM agent projects from roughly 2025-2026, with emphasis on
Mineflayer-style observation, action feedback, memory, and multi-agent context.

## Findings

- `mc-multimodal-agent` uses an OpenClaw-style turn loop: build prompt from
  memory, run a model/tool loop, store transcript events, record tool outcomes,
  and compact durable memory. Its important setting is automatic post-action
  observation: movement, digging, placing, crafting, and action skill execution append
  fresh status/navigation/visual context after the tool runs.
- `yearn_for_mines` exposes Minecraft through MCP and names the loop directly:
  `perceive -> plan -> execute -> verify -> remember`. Observation is split into
  tools such as `observe`, `find_block`, `get_inventory`, `get_nearby_items`,
  `get_events`, and HUD/status queries.
- `Mindcraft CE` and MineCollab avoid dumping all state into every prompt. Agents
  actively query observations like nearby blocks, inventory, nearby players,
  craftable items, and task state. The paper notes that language agents need
  environment feedback and affordance-grounded actions more than raw visual or
  unfiltered world state.
- `Atlas / mineflayer-chatgpt` builds a per-bot world context on every decision
  loop, records per-bot memory, and injects a shared team bulletin containing
  each bot's current action, position, and status. It also tracks failed actions
  and forces different approaches after repeated failures.
- Voyager remains relevant despite being older: generated code improves through
  iterative prompting using environment feedback, execution errors, and
  self-verification. The key lesson is not to trust generated code to return
  meaningful values; the runtime must capture environment feedback and errors.
- Recent research such as Optimus-2 and PillagerBench frames the core learning
  unit as an observation-action sequence. The action alone is not enough; the
  next decision needs the previous observation, attempted action, and new
  observation/diff.

## Implications For This Probe

- Do not rely on generated Mineflayer action skills to return useful data. Most actions
  are side effects (`lookAt`, movement, chat, dig), so `undefined` is expected.
- The runtime should automatically capture `preObservation`, helper call events,
  `postObservation`, and a compact `diff` after each action skill execution.
- LLM history should look like a normal chat, but its user messages should carry
  current NPC perspective plus post-action feedback from the prior step.
- System prompt should include compact "Mineflayer affordance" text so the
  model knows what it can observe and do without bloating every user message.
- The assistant history should avoid reinforcing long generated code when
  possible. Keep the model's prior decision visible, but add runtime feedback as
  the authoritative signal.
