# GPT-5.4 Mini V4 Live Validation

Status: completed on 2026-07-11. No rerun is authorized by this report.

Search token: `GPT54MINI_V4_LIVE_VALIDATION_RESULT`.

## Verdicts

Recording verdict: `DIAGNOSABLE_FAILURE`.

All three runs produced declarations, raw reports, normalized reports, budget
status, suite indexes, actor workspaces, provider snapshots, runtime evidence,
and passing report audits. Runtime-review summarization resolved every reported
artifact ref: 14/14 for log collection, 60/60 for wooden-pickaxe crafting, and
22/22 for the infeasible case. Report readiness warned only that each raw report
does not embed a preflight ref; the approved preflight is preserved beside this
report.

Experiment verdict: the provider path and evidence path worked, but the three
runs do not establish the intended individual-capability result.

- The two natural-world cases did not send their manifest top-level goals to
  the Actor Turn input. They therefore tested a generic early-survival prompt,
  not `collect_logs` or `acquire_diamond_pickaxe_infeasible` as declared.
- The controlled wooden-pickaxe case did expose the intended goal. The actor
  made verified multi-step progress through logs, planks, sticks, and a carried
  crafting table, then failed the same table-placement attempt twice.
- The infeasible run stopped truthfully without fabricated progress, but it did
  not test whether the model could reason about the declared diamond-pickaxe
  objective because that objective was absent from provider context.

## Run Identity

All runs used a fresh world, actor `npc_b`, `openai-api:gpt-5.4-mini`, reasoning
`low`, zero JSON retries, disabled background Responses mode, and no visual
capture.

| Case | Scenario / seed | Cycles and actions | Normalized result | Requests | Tokens | Wall time |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| `collect_logs` | `natural-safe-spawn-v1` | 2 / 2 | `blocked`; target unknown | 3 | 60,535 | 33,696 ms |
| `craft_wooden_pickaxe` | `wooden-pickaxe-flat-benchmark-v1` | 8 / 8 | `unverifiable`; two milestones passed | 10 | 229,817 | 83,661 ms |
| `acquire_diamond_pickaxe_infeasible` | `natural-safe-spawn-v1` | 3 / 3 | `failed`; cycle limit reached | 5 | 91,781 | 43,421 ms |
| Total | — | 13 / 13 | no target pass | 18 | 382,133 | 160,778 ms |

Capability run IDs:

- `capability-collect_logs-c698456b-41fe-4fde-8a9e-f79a2b9da755`
- `capability-craft_wooden_pickaxe-ec5983f4-917b-4161-9945-85844614c191`
- `capability-acquire_diamond_pickaxe_infeasible-f63c7702-a0b5-4b83-bdca-3e990289b0dc`

## Findings

### P1 — Natural capability goals never reached Actor Turn

The two natural cases shared the same provider-facing world-event summary:
“begin from the verified natural spawn area, use nearby natural resources, and
make physical early-survival progress.” Neither input named the manifest goal.

Evidence:

- the `collect_logs` Active Episode became “scout a nearby reachable resource
  patch,” and both turns selected `move_to`;
- the infeasible case became “scout a short nearby area for reachable logs,”
  selecting `move_to`, `move_to`, then `observe`;
- `runner.ts` deliberately omits `benchmarkTask`, but no typed replacement
  carries `case_id` and `top_level_goal` into `runSocialCycle`.

Implication: labels and budgets came from the manifest while provider behavior
was driven by a different generic objective. The natural results cannot measure
declared-case competence or truthful infeasibility reasoning.

Smallest next change: pass a typed capability-case context containing
`case_id`, `top_level_goal`, and its manifest hash into the run and provider
input. It is context only; the manifest predicates and runtime evidence remain
the sole scoring source. Add a provider-free test proving two natural cases
produce distinct goal context without exposing hidden action sequences.

### P1 — Empty placement parameters became a gameplay target

In wooden-pickaxe cycles 7 and 8, the model selected the visible
`placeCraftingTable` action with `{}` parameters. The runtime silently converted
the missing target into the cell next to the actor: `{x:8,y:64,z:-2}`. That cell
was an `oak_log`, and the cell above was another non-replaceable `oak_log`, so
both attempts were blocked identically.

Evidence:

- both action refs contain `action_skill_id: placeCraftingTable` and
  `parameters: {}`;
- both placement evidence files record the same target, same block state, and
  the same blocker reason;
- `readPlacementTarget` in `socialCycleExecution.ts` supplies an adjacent-cell
  fallback when no structured target exists;
- after the second failure, the runtime correctly wrote one retry constraint
  with `repeat_count: 2`.

Implication: the run reached the right logical prerequisite but lost it during
structured-action conversion and target selection. This is not evidence that
the model cannot understand the wooden-pickaxe dependency chain. It also
conflicts with the repo rule that
missing physical parameters must not become gameplay defaults.

Smallest next change: require `targetPosition` for the placement action card and
action-skill mapping, expose the nearby structured block coordinates already in
current state, and reject empty parameters before Mineflayer execution. Remove
the adjacent-cell fallback for provider-selected placement. Add a direct test
for empty action-skill parameters and a live provider-free placement smoke with
an explicit replaceable target.

### P2 — Partial crafting competence is real but narrow

The controlled run produced six verified-progress turns before the placement
blocker. Final recorded inventory was two oak logs, two oak planks, four sticks,
and one crafting table. The planks and sticks milestones passed; no wooden
pickaxe inventory or held-item evidence existed.

This supports only the narrow statement that the current model/runtime pair can
carry a fixture-backed crafting objective through several verified material
steps. It does not support a full wooden-pickaxe pass or natural-world
competence.

### P3 — Archive and report linkage is incomplete

The raw reports contain provider usage decisions but do not cite the adjacent
approved preflight. The readiness checker therefore returns `warning`, not a
publishable clean result. Raw copies also preserve their original absolute
`tmp/` workspace paths; matching actor workspaces are archived beside them, but
a future portable importer should record the relocation explicitly.

## What Happened

### Natural log run

The natural spawn and spawn validation passed. The model saw a sampled,
truncated scan containing grass and dirt but no retained logs. It moved east by
three blocks twice. Both movements were physically verified, but neither
advanced the declared target and no inventory evidence existed.

### Wooden-pickaxe run

The fixture setup passed. The actor collected logs twice, crafted materials
across four more turns, and held enough prerequisites to proceed. It then chose
the correct station-placement action twice, but empty parameters resolved to an
occupied log-rack cell. The runtime rejected both attempts and did not claim a
pickaxe.

### Infeasible run

The natural spawn passed. Under the generic survival context, the model moved
east twice and observed once. The declared three-cycle limit ended the case.
The normalized report truthfully recorded `budget_exhausted` on `cycles`, no
inventory evidence, and no false diamond-pickaxe result.

## Claim Table

| Claim | Supported? | Evidence |
| --- | --- | --- |
| Live GPT-5.4 Mini provider and Minecraft path executed | Yes | three raw reports and provider snapshots |
| Logs, planks, sticks, and a crafting table were acquired in the fixture | Yes | cycles 1–6 runtime evidence and final inventory |
| A wooden pickaxe was crafted | No | target unknown; no inventory/held-item evidence |
| Natural `collect_logs` competence was tested | No | declared goal absent from Actor Turn context |
| Diamond-pickaxe infeasibility reasoning was tested | No | declared goal absent from Actor Turn context |
| Failure labels avoided fabricated physical success | Yes | normalized reports, budget status, and audits |
| Social behavior was tested | No | single actor; no social action requirement |
| Visual behavior was reviewed | No | visual capture disabled |
| Provider use stayed within the approved allowance | Yes | final current-day ledger: 18 requests / 382,133 tokens |

## Provider And Daily Usage

The approved maximum was 120 requests and 4,000,000 tokens for the UTC day.
The stricter sum of per-run plans was 100 requests and 3,000,000 tokens. Actual
repository-ledger usage was:

- input: 374,030 tokens;
- output: 8,103 tokens;
- thinking: 2,758 tokens;
- total: 382,133 tokens;
- requests: 18.

The final provider-free ledger check was `allowed`, leaving 102 requests and
3,617,867 tokens under the local campaign maximum. The user-reported dashboard
also showed $0.00 total spend at approval time. No provider call occurred after
the third run.

## Preserved Artifacts

- Approval and preflight records: `preflight/` and `operator-approval.md`
- Raw run archive:
  `project-docs/experiments/raw/2026-07-11/gpt54mini-v4-live-validation/`
- Each run directory contains `suite-index.json`, one capability case directory,
  declaration, raw report, normalized report, budget status, actor workspace,
  and `audit.json`.
- Local usage ledger: `build/provider-usage/provider-usage-ledger.jsonl`
  (ignored local state)

No screenshots, video, Langfuse trace identifier, or USD cost estimate was
recorded. Provider token counts are provider-reported; cost was not invented.

## What Is Not Proven

- general Minecraft competence;
- natural log acquisition for this model;
- ability to craft a wooden pickaxe end to end;
- recognition or planning of an infeasible diamond-pickaxe goal;
- goal continuity across restart;
- multi-actor or social behavior;
- any research claim or model comparison.

## Next Work

Do not rerun these cases unchanged. First repair and test the two P1 findings
provider-free. After review, the smallest useful live follow-up is one natural
`collect_logs` case and one controlled wooden-pickaxe case, each once, under a
new user-approved allowance. The infeasible case should wait until its declared
goal is visibly present in the provider input.
