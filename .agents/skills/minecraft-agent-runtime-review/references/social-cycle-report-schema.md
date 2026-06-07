# Social-Cycle Report Schema Map

This reference describes the artifact shape used by
`social-cycle-run-report/v1`. Treat `SPEC.md` and repo TypeScript types as
canonical if this map drifts.

## Top-Level Report

Core fields:
- `schema`: should be `social-cycle-run-report/v1`.
- `run_id`: stable id for the experiment.
- `actor_id`: actor under review, usually `npc_b`.
- `provider`: `{ provider_id, model, reasoning }`.
- `runtime_status`: `passed`, `failed`, `blocked`, `timeout`, or
  `environment_blocked`.
- `server`: world mode, seed, Minecraft version, endpoint, and spawn setup.
- `actor_workspace_root_dir`: root used to resolve actor-relative refs.
- `agency_status`: whether Soul/LifeGoal, previous judgments, memory refs,
  world events, fixture dependency, and verified gameplay progress were used.
- `cycles`: ordered cycle records.
- `provider_usage`: run-local usage summary and budget decisions.
- `settlement_state` and `settlement_checklist`: compact current state and
  coarse progress checklist.
- `postcondition_results`: action-skill postcondition records accumulated at
  run level.
- `runtime_retry_constraints`: exact target/args gates created from repeated
  blockers.
- `memory_reuse`: retrieved memory count, memory writes, and previous-judgment
  reuse.

## Cycle Records

Each cycle contains refs, not all inline details:
- `cycle_id`.
- `cycle_goal_ref`: actor workspace JSON under `goals/cycle/`.
- `action_attempts`: current Actor Turn execution attempts and their refs.
- `action_intent_ref`: archived actor workspace JSON under
  `goals/cycle/intents/`, present only for explicit archived planner reports.
- `provider_input_refs`: prompt/context snapshots for Actor Turn, codegen,
  Deliberation, or archived goal/action/judgment stages.
- `provider_output_refs`: provider outputs, parsed payloads, usage records, and
  possible runtime fallback metadata.
- `evidence_refs`: runtime evidence written by executed tools.
- `judgment_ref`: final `cycle-judgment/v1`, possibly provider-authored,
  clamped, or runtime fallback.
- `verifier_status`: passed, failed, or not_applicable.
- `action_attempts`: per-action attempt summary. In the current 100-cycle runs
  there is usually one action attempt per cycle.

## Actor Workspace

Resolve refs against:

```text
<actor_workspace_root_dir>/<actor_id>/<ref>
```

Important subdirectories:
- `goals/cycle/`: `CycleGoal` artifacts.
- `goals/cycle/actions/`: current Actor Turn runtime action artifacts.
- `goals/cycle/intents/`: archived `ActionIntent` artifacts.
- `goals/episodes/`: Active Episode and Deliberation branch artifacts.
- `plan-beads/`: PlanBead records, ready-front snapshots, operation results,
  event logs, and history snapshots when the graph is substantively used.
- `provider-inputs/`: provider-facing context packets. These prove what the
  model was allowed to see.
- `provider-outputs/`: provider raw text, parsed output, proposal refs, usage,
  and runtime fallback markers.
- `evidence/`: runtime tool evidence. These are the primary facts.
- `judgments/`: final `CycleJudgment` artifacts used for memory and next-cycle
  context.
- `memory/`: episodic/procedural/belief/guardrail writes when present.
- `action-skills/`: actor-owned action skill index for the run.
- `world-events/`: explicit world event inputs.

## Summarizer Output

The bundled `scripts/summarize-social-cycle-report.mjs` emits
`minecraft-agent-runtime-review-social-cycle-summary/v1`.

Use these fields as an index before reading individual artifacts:
- `recording`: reference integrity and artifact prefix counts.
- `counts`: outcome, verifier, runtime, action, tool, postcondition, and memory
  layer counts.
- `loop_diagnostics.observation_to_action`: observe-like cycle count and next
  action/outcome distribution.
- `loop_diagnostics.action_surface_utilization`: direct primitives/action
  skills exposed, used, and unused.
- `loop_diagnostics.action_concentration`: distinct action count and top action
  share.
- `loop_diagnostics.social_signals`: visible actor, `say`, shared-storage, and
  relationship-event coverage.
- `loop_diagnostics.evidence_diagnostics`: selected placement, crafting, and
  movement evidence for manual inspection.
- `settlement`: final settlement state, checklist, known positions, and
  blocker histogram.

## Evidence Artifacts

Evidence files usually have:
- `schema`, `actor_id`, `turn_id`, `created_at`, `category`;
- `tool_attempt`: `{ tool, args, result }`;
- optional `verifier_reason`.

For behavior analysis, inspect:
- `tool_attempt.tool`;
- `tool_attempt.result.status`;
- `tool_attempt.result.runtime_hooks`;
- inventory deltas, block positions, movement distance, pathing failures,
  placement targets, crafting results, chest snapshots, and chat/say records;
- `tool_attempt.result.vitals` on observe evidence;
- `tool_attempt.result.worldStateSummary` for raw block/entity scan context.

Observation evidence is context. Physical progress needs a tool result or
verifier-backed world/inventory/container/position/chat mutation.

## Provider Output Snapshots

Provider outputs include:
- `raw_output_text`;
- `parsed_output`;
- `proposal`;
- `usage`.

For reliability analysis, count:
- `usage.status`;
- `proposal.runtime_fallback_judgment`;
- `parsed_output.provider_invalid_errors`;
- `parsed_output.fallback_judgment`;
- provider errors if present.

Fallback judgment preserves the run but indicates the provider emitted a payload
the runtime could not accept as-is.

## Retry Constraints

`runtime-retry-constraint/v1` means the runtime grouped repeated exact runtime
action target + normalized structured args + blocker reason and will block
matching future attempts before Mineflayer execution.

Important fields:
- `action_kind`;
- `target`;
- `args_normalized`;
- `blocker_status`;
- `blocker_reason`;
- `repeat_count`;
- `attempt_refs`;
- `evidence_refs`;
- `rule.runtime_blocks_before_mineflayer`.

Analyze both:
- whether the constraint correctly captured repeated failure; and
- whether later provider choices pivoted or kept hitting the gate.

## Provider Usage

`provider_usage` is an experiment result, not a footnote.

Read:
- `provider_usage.records`;
- `provider_usage.totals[].usage`;
- `provider_usage.budget_status[].status`;
- `provider_usage.budget_status[].projected.day`;
- `provider_usage.budget_status[].budget.total_token_limit_per_day`.

When a run approaches the local cap, recommend stopping or switching to a
cheaper/deterministic provider before more experiments.
