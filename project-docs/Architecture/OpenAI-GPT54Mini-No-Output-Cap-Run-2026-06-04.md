---
sidebar_position: 99
---

# OpenAI GPT-5.4 Mini No Output Cap Run

Search token: `OPENAI_GPT54MINI_NO_OUTPUT_CAP_RUN_2026_06_04`.

Status: dated runtime experiment record.

Recorded:

- `2026-06-04 23:29:32 KST (+0900)`
- `2026-06-04 14:29:32 UTC`

## Purpose

This run verified the social-cycle provider behavior after removing explicit
provider-side output caps. The goal was to confirm that ordinary OpenAI and
Gemini social-cycle provider requests no longer set `max_completion_tokens`,
`max_output_tokens`, or `max_tokens`, then evaluate the resulting Minecraft
behavior with a fresh-world OpenAI `gpt-5.4-mini` Actor Turn run.

## Implementation Change Under Test

The provider request path no longer exposes or sends output-token cap settings:

- `probe/src/provider/openaiApiJsonProvider.ts`
- `probe/src/provider/openaiApiToolProvider.ts`
- `probe/src/provider/geminiApiJsonProvider.ts`
- `probe/src/provider/geminiApiToolProvider.ts`
- `probe/src/runtime/socialCycleRunner.ts`

The remaining `maxOutputTokens` identifier in
`probe/src/provider/providerUsageTracker.ts` is an internal usage-estimation
field. It is not an API request parameter and does not cap model output.

Experiment scripts and smoke helpers were also cleaned so they no longer
provide `max_completion_tokens`, `max_output_tokens`, or `max_tokens` by
default.

## Run Configuration

Runtime artifacts from the local run:

- Report:
  `tmp/social-cycle-fresh-world-openai-gpt54mini-60-no-output-cap-20260604T133256Z.json`
- Review:
  `tmp/social-cycle-fresh-world-openai-gpt54mini-60-no-output-cap-20260604T133256Z-review.md`
- Review summary:
  `tmp/social-cycle-fresh-world-openai-gpt54mini-60-no-output-cap-20260604T133256Z-review-summary.json`

Run metadata:

- Run id: `social-cycle-48aad79b-7467-45fd-a468-a62e063fa0e7`
- Actor: `npc_b`
- Provider: OpenAI API
- Model: `gpt-5.4-mini`
- Reasoning: `medium`
- Key source: `OPENAI_SERVICE_ACCOUNT`
- World: fresh world, seed `60420266229`
- Minecraft version: `1.21.11`
- Spawn access: prepared at `(0, 71, -6)`
- Shared-storage social smoke: enabled
- Requested cycles: `60`
- Output cap env present: `false`

Scenario goal:

> Fresh-world starter settlement test: establish a modest verified spawn camp,
> use nearby prepared spawn access if available, craft/use planks, sticks, a
> crafting table, and at least one wooden or stone tool if materials allow,
> contribute at least one useful material to shared storage for npc_a, give a
> truthful status update, avoid repeated observe loops, and prefer
> evidence-backed Minecraft actions over memory-only notes.

## Result

The run completed:

- Runtime status: `passed`
- Cycles: `60`
- Provider error: `null`
- Output-cap failure: none
- OpenAI usage records: `114`
- Input tokens: `2,698,946`
- Output tokens: `154,188`
- Thinking tokens: `77,234`
- Total tokens: `2,853,134`
- Budget guard projected day total: `5,967,065 / 9,000,000`
- Budget guard remaining day tokens: `3,032,935`

Validation commands after the implementation change:

- `cd probe && bun test test/normalizeOpenAiJsonPayload.test.ts`
- `cd probe && bun run typecheck`
- `cd docs && npm run build`
- `git diff --check`

All passed.

Fresh-world Minecraft cleanup was also verified. The disposable Minecraft
container stopped after the run; only the existing Langfuse containers remained.

## Positive Evidence

The output cap removal did what it was supposed to do:

- No `incomplete: max_output_tokens` failure occurred.
- OpenAI Responses calls completed without a provider-side completion cap.
- The budget guard still recorded actual provider usage and stayed under the
  local 9M token/day guard.

The actor did produce some verified Minecraft progress:

- Shared storage contribution was verified.
- A crafting table was crafted and later placed.
- Planks/sticks flow executed multiple times.
- Runtime evidence stayed truthful; there was no fake-success claim over missing
  Minecraft state.

Settlement state after the run:

- `shared_chest.status = contributed`
- `crafting_table.status = placed`
- `shelter.status = unknown`
- Final inventory included `birch_planks` and `birch_log`
- Final vitals remained safe: health `20`, food `20`

## Behavioral Diagnosis

The important failure was no longer provider output truncation. The behavior
loop itself was weak.

The Active Episode stayed fixed for all 60 cycles:

```text
Verify the nearby chest as usable shared storage and deposit one oak_log,
then give a brief truthful status update.
```

Every CycleGoal summary was the same. The runtime did not retire or pivot the
episode after the shared-storage work became satisfied.

Action distribution reflected that stale focus:

- `say`: `41`
- `remember`: `21`
- `inspectSharedChest`: `20`
- `observe`: `33`
- `wait`: `33`
- `deposit_shared`: `7`
- `collectLogs`: `5`
- `move_to`: `1`
- `placeCraftingTable`: `1`

The actor was actionful, but too much of that actionfulness was spent on
status, memory notes, and repeated shared-storage inspection. The actor did not
turn the satisfied storage objective into a stronger next physical objective
such as tool completion, shelter construction, or broader camp setup.

## PlanBeads And Codegen Findings

PlanBeads were wired but not substantively used in this run:

- `plan_bead_packet_ref` existed for each cycle.
- `plan_bead_graph_summary.open_count = 0`
- `plan_bead_graph_summary.ready_count = 0`
- `plan_bead_graph_summary.blocked_count = 0`
- `selected_plan_bead_refs = []`
- `plan_bead_operation_result_refs = []`

This is not evidence of durable long-term work continuity. Empty ready-front
packets mean the substrate is present, not that the actor is using it.

Generated Mineflayer authoring also did not occur:

- `author_mineflayer_action` selections: `0`
- Generated action candidates: none in this run

Historical note: at the time of this run, the visible
`author_mineflayer_action` option and `mineflayer_codegen_skill.skill_markdown`
were present in Actor Turn inputs, but the actor always selected existing Action
Cards. Current architecture keeps the generated-code skill markdown out of the
outer Actor Turn input and injects it only into the internal codegen request.

## Runtime Review Conclusion

Verdict: `PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`.

The no-output-cap provider change is verified. The remaining problem is not
model output truncation. The next implementation target should be runtime state
and decision flow:

1. Retire or close Active Episodes when their success signals are met.
2. Regenerate or pivot CycleGoal after satisfied work, repeated no-progress, or
   stale social pressure.
3. Create guarded passive PlanBeads from satisfied work, blockers, and followup
   needs without granting executable authority.
4. Push Actor Turn toward concrete recovery actions when inventory/world state
   makes the current episode impossible or already satisfied.
5. Audit why `author_mineflayer_action` remained unused even when repeated
   status/inspection loops showed missing behavior.

The useful lesson is narrow but important: removing output caps fixed the wrong
failure class. The current behavior blocker is stale episode authority and weak
work-state transition, not insufficient output length.
