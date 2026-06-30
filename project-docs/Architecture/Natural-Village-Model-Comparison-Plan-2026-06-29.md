# Natural Village Model Comparison Plan

Status: active near-term run plan.

Search token: `NATURAL_VILLAGE_MODEL_COMPARISON`.

Visual evidence rule: follow
`project-docs/Architecture/Minecraft-Visual-Evidence-Capture-Protocol.md`
(search token `MINECRAFT_VISUAL_EVIDENCE_CAPTURE`). Screenshots are
renderer-assisted review context, not block identity authority. Pair any image
used in a report with same-cycle or neighboring `observe`, `worldStateSummary`,
`world-state-scan/v1`, natural-spawn validation, or verifier evidence.

This plan narrows the next no-regret-core comparison work without changing the
central research spine. The current comparison target is not prediction lift,
society dynamics, or a model leaderboard. It is a goal-oriented embodied
behavior smoke:

```text
Given the same natural village-adjacent start, can a provider turn observation
and the visible action surface into one concrete, verifier-passed Minecraft
action with a non-empty material/physical delta and report-grade visual audit?
```

That is deliberately modest. It checks whether the runtime and provider path can
close a real action loop under natural-world pressure before the project spends
budget on larger Goldilocks or society-observable claims.

## Why Change The World Profile

The recent controls are too artificial for the next step. Flat fixtures and
forced primitive sequences are useful for debugging, but they remove the world
pressure that should make social-material consequences interesting.

The opposite failure is also real: random natural seeds often put an actor in
dense leaves, tree tops, water edges, or obstructed forest undergrowth. Those
runs burn provider turns on `observe`, `wait`, or blocked movement before they
produce meaningful action-consequence evidence.

The next world profile should therefore be:

```text
natural generated world
near village affordances
no resource grant
no cleared pad
no starter structure
safe-spawn validation before Actor Turn
setup failure separated from actor behavior
```

## Active Scenario

Use:

```text
natural-village-spawn-v1
```

Default seed:

```text
4167799982467607063
```

Source evidence:

```text
project-docs/Experiments/2026-06-13/seed-scout-plain-natural/candidates/plains-village-cherry-nearby/
```

The seed-scout validation passed and observed village-adjacent blocks near the
selected start: `dirt_path`, `oak_planks`, `cobblestone`, `oak_fence`, `torch`,
`mossy_cobblestone`, and `oak_door`. The run should still treat validation as
setup evidence only.

This scenario does not count village blocks as actor progress. Progress begins
only after runtime action evidence.

## Provider Lanes

Completed goal-oriented comparison bundle:

```text
project-docs/Experiments/2026-06-29/goal-oriented-natural-village-model-comparison/
```

Executed lanes in that bundle:

```text
modelscope-api:Qwen-Ambassador/Qwen3.7-Plus
modelscope-api:Qwen-Ambassador/Qwen3.7-Max
openai-api:gpt-5.5
openai-api:gpt-5.4-mini
```

Requested but not executed:

```text
openai-api:gpt-5.5-mini
```

`gpt-5.5-mini` was blocked by provider-quota preflight because no local or
built-in budget policy matched it. The executed mini comparison used the
policy-backed `gpt-5.4-mini` fallback. Do not rewrite that result as a
`gpt-5.5-mini` result.

The executed runs used `--visual-profile report`, Minecraft `1.21.4`, one
cycle, one action, `natural-village-spawn-v1`, and produced
`visual_evidence.audit.status: "passed"`. All four selected or executed a
`collect_logs` path, passed the runtime verifier, and wrote a `transition-row/v1`
with `inventory_gain`; Qwen Max used the action-skill route, while the others
used the primitive route.

This is not a claim that one model is better. It shows that all executed
provider lanes can close the same goal-oriented competence baseline. The next
useful comparison needs more pressure: obstructed movement, longer distance to
useful affordances, competing social/material requests, or a requirement to
preserve continuity over multiple cycles.

OpenAI API runs still require provider quota preflight and explicit operator
approval. Do not run `openai-api:gpt-5.5` just because a previous smoke was
under cap.

Historical comparison evidence exists, but it is not no-regret-core evidence:

```text
project-docs/Experiments/2026-06-14/placed-furnace-natural-60/
```

That bundle compared Qwen 3.7 Max, Qwen 3.7 Plus, and `gpt-5.4-mini` on a
natural-world placed-furnace task. It is useful for visualization and intuition,
but it does not contain the current `transition-row/v1` shared-session artifact
contract.

## First Run Shape

Provider-free setup smoke:

```bash
cd probe
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-spawn-deterministic-1.json
```

Small provider comparison after fresh preflight:

```bash
cd probe
bun run src/runtime/noRegretManagedBatchCli.ts \
  --provider modelscope-api \
  --model Qwen-Ambassador/Qwen3.7-Plus \
  --actors npc_b,npc_c \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --scenario-family borrow_refuse_return_tool_v1 \
  --scenario-family shared_station_public_affordance_v1 \
  --scenario-family co_presence_divergence_v1 \
  --scenario-narrowing-reason "natural village-adjacent small control; below no-regret pilot thresholds"
```

OpenAI comparison shape after dashboard approval:

```bash
cd probe
bun run src/runtime/noRegretManagedBatchCli.ts \
  --provider openai-api \
  --model gpt-5.5 \
  --actors npc_b,npc_c \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --scenario-family borrow_refuse_return_tool_v1 \
  --scenario-family shared_station_public_affordance_v1 \
  --scenario-family co_presence_divergence_v1 \
  --scenario-narrowing-reason "OpenAI comparison lane; dashboard-approved small control, below no-regret pilot thresholds"
```

Current limitation: the shared-session Actor Turn smoke CLI records a
`--world-scenario` string but does not yet apply scenario world config or
safe-spawn validation to the live-smoke server. Use `probe:social-cycle` or
`noRegretManagedBatchCli` for this scenario until shared-session scenario
application is wired.

## Comparison Metrics

Do not make a leaderboard headline. Compare providers as substrate stress tests
for goal-oriented Minecraft behavior.

Goal-oriented competence:

- verifier-passed action count
- first non-observe executable action cycle
- selected action matches stated CycleGoal
- action rationale cites concrete observed affordances
- fallback plan names the actual blocker class if blocked
- `transition-row/v1` contains non-empty physical/material delta
- inventory/material delta after action
- repeated low-value action ratio
- visual audit status and capture completeness

Basic efficiency:

- `provider_requests`
- `total_tokens`
- `tokens_per_transition_row`
- `tokens_per_executed_action`
- `tokens_per_non_empty_delta`
- `tokens_per_material_stake_row`
- `latency_ms_avg` and `latency_ms_p95` when available

No-regret-core quality:

- valid or partial `transition-row/v1` count
- row contract failure count
- action class count
- dominant `(actor_id, action_kind, target_signature)` ratio
- bounded response-window count
- interaction-opportunity row count
- material-stake row count
- non-empty physical/material/social delta rows
- seed/reset count and whether it counts toward the pilot
- setup failure versus actor/runtime failure

Project-specific natural-world metrics:

- spawn validation status
- visual-evidence capture count, failure count, camera modes, renderer trust,
  and paired state-evidence refs for any screenshot used in a report
- loaded-world trap indicators: leaf/log dominated immediate area, blocked
  feet/head cell, hazard near start, no loaded log within scan radius
- village affordance evidence: path, door, torch, chest-like storage,
  workstations, fences, farm/crop blocks, nearby beds or houses when observed
- action-to-affordance use: whether the actor uses village affordances after
  observing them, not just whether blocks exist
- recovery from obstructed terrain: turns spent before first non-observe
  executable action

Social-material metrics:

- other actor entered response window
- other actor used, avoided, contested, repaired, or ignored changed affordance
- possession/access event observed
- shared storage interaction observed
- refusal/request/help/repair event observed through runtime evidence, not prose

Interpretation:

- A provider with lower tokens but no material-stake rows is not "better".
- A provider with more actions but repeated low-value actions is not "better".
- A provider that reaches easy Minecraft milestones may still fail the
  social-material target.
- The useful comparison is whether a model helps the substrate produce more
  varied, grounded, non-degenerate transition rows under the same world pressure.
