# GPT-5.4 Mini Repaired Stage 1 Preparation

Status: current UTC-day dashboard usage and account eligibility are recorded;
waiting for explicit user approval. No provider request has been made for this
campaign.

## Provider-Free Result

The repaired suite 1.3.0 was checked with `deterministic-social` for
`collect_logs` and `craft_wooden_pickaxe`.

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

## Current Preflight Result

`preflight/dashboard-usage-2026-07-12.json` records a read-only observation of
the logged-in OpenAI Usage dashboard with both date bounds set to `2026-07-12`.
It showed 0 requests, 0 total tokens, `$0.00` total spend, and July organization
spend of `$0.00 / $120.00`. The local ledger also contains 0 OpenAI requests
and 0 tokens for that UTC day. `preflight/planning.json` was regenerated with
that exact-day observation; every local usage check is below the proposed
allowance, while final status correctly remains `needs_dashboard_approval`.

`preflight/prior-dashboard-context.json` preserves the earlier 89-request,
1,248,539-token dashboard snapshot only as historical context. Its period was
ambiguous and belongs to the previous UTC day, so the preflight correctly did
not count it and it is not current approval evidence.

`preflight/dashboard-eligibility-2026-07-12.md` records a `$3.80` positive
credit balance, API input/output sharing enabled for all projects, and the
dashboard's complimentary-daily-token enrollment message. The repo policy
matrix identifies `gpt-5.4-mini` as part of the applicable mini shared pool.

Before any live command, the user must explicitly approve the 32-request /
1,200,000-token maximum. A new approved preflight must then be saved beside the
planning record. The earlier instruction to use GPT-5.4 Mini predates this exact
allowance and is not reused as current authority.

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
  --out ../tmp/gpt54mini-v4-repaired-stage1/01-collect-logs
```

Stop if goal delivery, structured arguments, evidence attribution, target
evaluation, early stopping, usage accounting, or artifact references are
invalid. Only after that review may the wooden-pickaxe command run with 8
cycles, 1 action per cycle, 24 requests, 900,000 tokens, and 720,000 ms.
