# GPT-5.5 Medium Natural Village Spot Check

Status: completed on 2026-06-30.

This is an OpenAI `gpt-5.5` + `SOCIAL_CYCLE_REASONING=medium` one-cycle
natural-village spot check. It is not a 30-cycle lane and must not be weighted
like the Qwen Plus, Qwen Max, or GPT-5.4 mini 30-cycle comparison runs.

## Why This Is Small

The requested 30-cycle GPT-5.5 medium comparison is blocked by quota policy.
The saved 30-cycle preflight projects `220` requests and `1.3M` total tokens,
which exceeds the OpenAI large-model daily pool guard and the local GPT-5.5
request cap.

A one-cycle spot check was locally allowed after operator-approved preflight:

- planned: `4` requests / `120k` total tokens;
- actual: `2` requests / `37,276` total tokens;
- OpenAI daily large-model ledger before this run: `0` requests for the current
  UTC day;
- local GPT-5.5 monthly cap after this run: `82 / 85` requests.

## Protocol

- Provider/model: `openai-api:gpt-5.5`
- Reasoning: `medium`
- Scenario: `natural-village-spawn-v1`
- Seed: `4167799982467607063`
- Minecraft server version for visual evidence: `1.21.4`
- Actor: `npc_b`
- Cycles: `1`
- Max actions per cycle: `1`
- Fresh world: yes
- Visual profile: `report`
- OpenAI background polling: disabled
- OpenAI JSON retries: `0`

Before the OpenAI run, a deterministic provider-free visual setup smoke was run
on the same scenario. Its gameplay status was `blocked`, as expected for this
placeholder lane, but `visual-evidence-audit/v1` passed.

## Result

Runtime status: `passed`.

The actor selected and executed `collect_logs`. Runtime evidence records:

- block: `cherry_log`
- target: `{x:12,y:112,z:14}`
- `beforeLogCount:0`
- `afterLogCount:1`
- `inventoryDelta:1`
- `blockRemoved:true`
- verifier: `passed`

The resulting `transition-row/v1` is a partial row tagged
`physical_control` and `material_stake`. It has no observed other actor in
scope, so the social-response layer is `unknown_social_response`.

## Interpretation

This result is useful as a first-action comparison point:

- GPT-5.5 medium chose the same obvious early material move that good Minecraft
  priors should choose: gather a nearby log.
- The run proves the current GPT-5.5 medium path can execute one natural-village
  Actor Turn with report-grade visual capture under the local quota guard.
- It does not answer 30-cycle continuity, blocker recovery, social response,
  or no-regret-core readiness.

Do not use this as evidence that GPT-5.5 is better or worse than the 30-cycle
lanes. Use it only as a small baseline/control for first-step physical
competence and provider-path viability.

## Artifacts

- Summary: `summary.json`
- Report: `reports/gpt-5.5-medium.json`
- Review: `reports/gpt-5.5-medium-review.md`
- Review summary: `reports/gpt-5.5-medium-review-summary.json`
- Deterministic visual smoke: `reports/deterministic-visual-smoke.json`
- Preflights: `preflight/`
- Logs: `logs/`
- Screenshot copies: `screenshots/gpt-5.5-medium/`
- Runtime artifact copies: `runtime-artifacts/`
