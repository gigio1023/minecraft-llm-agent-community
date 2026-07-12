# GPT-5.4 Mini Repaired Stage 1 Campaign

Status: the first approved attempt ended during world setup before any provider
request. The invalid fixed seed is repaired and verified provider-free; a new
approval is required before repeating `collect_logs` with suite 1.3.1.

## Provider-Free Result

The repaired Stage 1 behavior was checked with `deterministic-social` for
`collect_logs` and `craft_wooden_pickaxe` under suite 1.3.0. Suite 1.3.1 changes
only the `collect_logs` fixed seed. After that change, the current
`collect_logs` declaration and setup path were checked again with a
provider-free capability run.

- every saved Actor Turn carried the selected `case_id`, exact natural-language
  goal, and manifest hash;
- no target predicate, milestone sequence, completion policy, evidence list, or
  recommended action sequence appeared in Actor Turn input;
- all 32 Action Cards remained present with shared guidance;
- raw report, normalized report, budget status, and 468 combined actor-workspace
  artifact refs resolved;
- both provider-free runs recorded zero provider requests and zero tokens;
- deterministic non-completion remained `target: unknown`,
  `failure_class: budget_exhausted`, and
  `action_selection_result: no_measurable_progress`.

The three archived 2026-07-11 raw reports have no
`capability_case_context`. Passing each actual raw report through the current
suite/evaluator returned `interpretation_status: unverifiable` and
`failure_class: unverifiable`; none can become current capability evidence.

## Proposed Live Allowance

Only `openai-api:gpt-5.4-mini` is in scope. The complete two-run allowance is:

- at most 32 provider requests;
- at most 1,200,000 total tokens;
- estimated peak of 4 requests and 180,000 tokens per minute;
- `collect_logs`: 2 cycles, at most 2 actions per cycle, 8 requests, 300,000
  tokens, and 360,000 ms;
- if and only if that run is a valid measurement, `craft_wooden_pickaxe`: 8
  cycles, at most 1 action per cycle, 24 requests, 900,000 tokens, and 720,000
  ms.

The prior two comparable runs used 13 requests and 290,352 total tokens before
the Action Card input reduction. The proposed allowance remains deliberately
larger to cover repair output or bounded code generation without approaching the
10,000,000-token OpenAI mini shared daily pool.

## First Approved Attempt

The first approved `collect_logs` attempt stopped before Actor Turn with
`world_setup_failed`. It used no provider requests or tokens. The fixed seed was
the scenario id string `natural-safe-spawn-v1`; on Minecraft `1.21.11` that
world had safe ground but no loaded log within the scenario's declared 32-block
bound. This is invalid setup evidence, not actor behavior.

A provider-free fresh-world smoke with the less village-biased seed `9066`
passed the same scenario validation on Minecraft `1.21.11`. It selected ordinary
natural ground and observed oak logs 28.46 blocks away. Suite 1.3.1 therefore
replaces only the invalid `collect_logs` fixed seed with `9066`; action access,
goal wording, predicates, milestones, and budgets are unchanged. A second live
attempt requires a refreshed preflight and explicit user approval under the Goal.

## Current Preflight Result

`preflight/approved.json` records the user's approval of the 32-request /
1,200,000-token campaign ceiling and resolved the preflight to `allowed`. It
authorized the first `collect_logs` attempt, which consumed zero provider
requests and zero tokens before setup failed. Because the suite declaration was
then changed, that approval is not reused for the repaired attempt.

`preflight/dashboard-usage-2026-07-12.json` records a read-only observation of
the logged-in OpenAI Usage dashboard with both date bounds set to `2026-07-12`.
It showed 0 requests, 0 total tokens, `$0.00` total spend, and July organization
spend of `$0.00 / $120.00`. The local ledger also contains 0 OpenAI requests
and 0 tokens for that UTC day. `preflight/planning.json` was regenerated with
that exact-day observation and is the unapproved input from which
`preflight/approved.json` was produced.

`preflight/prior-dashboard-context.json` preserves the earlier 89-request,
1,248,539-token dashboard snapshot only as historical context. Its period was
ambiguous and belongs to the previous UTC day, so the preflight correctly did
not count it and it is not current approval evidence.

`preflight/dashboard-eligibility-2026-07-12.md` records a `$3.80` positive
credit balance, API input/output sharing enabled for all projects, and the
dashboard's complimentary-daily-token enrollment message. The repo policy
matrix identifies `gpt-5.4-mini` as part of the applicable mini shared pool.

Before another live command, the exact-day preflight must be refreshed against
the committed suite 1.3.1 declaration and the user must explicitly approve the
single repaired `collect_logs` attempt. The smallest requested ceiling is 8
requests / 300,000 tokens; `craft_wooden_pickaxe` remains out of scope until the
repeated run is a valid measurement.

## Commands After Approval

Run log collection first and review its evidence before any second run:

```bash
cd probe
bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case collect_logs \
  --provider openai-api \
  --model gpt-5.4-mini \
  --online \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --max-wall-time-ms 360000 \
  --max-provider-requests 8 \
  --max-total-tokens 300000 \
  --out ../tmp/gpt54mini-v4-repaired-stage1/02-collect-logs-seed-9066
```

Stop if goal delivery, structured arguments, evidence attribution, target
evaluation, early stopping, usage accounting, or artifact references are
invalid. Only after that review may the wooden-pickaxe command run with 8
cycles, 1 action per cycle, 24 requests, 900,000 tokens, and 720,000 ms.
