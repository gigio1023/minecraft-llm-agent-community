# Collect Logs: Request-Ceiling Failure Review

Date: 2026-07-12

Recording verdict: `DIAGNOSABLE_FAILURE`

Experiment verdict: invalid measurement; not capability evidence

## Claim table

| Claim | Result | Evidence |
| --- | --- | --- |
| Goal delivery | Verified | Both Actor Turn inputs contain the exact `collect_logs` case id, natural-language goal, and suite 1.3.1 manifest hash. |
| Evaluator separation | Verified for saved inputs | Neither Actor Turn input contains target predicates, milestones, completion policy, or allowed evidence kinds. |
| Physical progress | Not observed | Inventory remained empty; `collect_logs` was blocked and reported no reachable low log within 24 blocks. |
| Request ceiling | Violated | The run-local ledger records 11 OpenAI HTTP requests against the approved maximum of 8. |
| Provider tokens | Within token ceiling | Ledger totals are 39,627 tokens against the approved maximum of 300,000. |
| Final report readiness | Failed | The exception occurred before final provider usage, normalized report, budget status, and suite index were written. |
| Visual behavior | Not recorded | No screenshot or video reference exists. |

## Run identity

- capability run: `capability-collect_logs-753cf1c4-a49c-421f-b789-2d259fe63003`;
- social run: `social-cycle-a0ea54b7-8ae8-4e65-b47c-5af45b7afcdf`;
- actor: `npc_b`;
- provider/model: `openai-api:gpt-5.4-mini`, reasoning `low`;
- suite: 1.3.1;
- scenario: `natural-safe-spawn-v1`, fresh world, seed `9066`;
- Minecraft: 1.21.11;
- requested runtime: 2 cycles, at most 2 actions per cycle;
- completed runtime: one recorded cycle with two action attempts;
- approved maximum: 8 requests / 300,000 tokens / 360,000 ms;
- observed ledger usage: 11 requests, 37,689 input tokens, 1,938 output tokens, 512 thinking tokens, and 39,627 total tokens.

Command:

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

## What happened

World setup passed. The first Actor Turn selected `Observe`. The second selected
the actor-owned `collectLogs` action with structured empty parameters, which is
valid for that action. Runtime evidence then reported a truthful blocker: the
nearest reachable oak-log hints were about 30.5 blocks away, outside the
primitive's 24-block collection radius. Inventory stayed empty.

The next cycle invoked Deliberation. OpenAI Responses was running in background
mode, so each logical provider stage used one initial response request plus
polling requests. The capability runner checked its request ceiling only when
control returned between stages. Three logical provider stages therefore
produced 11 HTTP requests before the runner could stop, exceeding the approved
maximum of 8.

After the ceiling had already been crossed, the runner correctly decided not to
start another action. It then tried to create a context-driven Deliberation
branch for that empty stopping cycle. With no new action or judgment evidence,
the branch had an empty `evidence_refs` array and strict validation raised
`Invalid DeliberationBranch`. This exception prevented final report settlement.

## What was recorded

- approved retry preflight: `preflight/approved-retry-collect-logs.json`;
- archived partial run:
  `project-docs/experiments/raw/2026-07-12/gpt54mini-v4-repaired-stage1/02-collect-logs-request-overrun-invalid/`;
- two Actor Turn inputs and outputs;
- one Deliberation input and output;
- two observe artifacts and one `collect_logs` artifact;
- one evidence-linked branch from the completed first cycle;
- a SHA-256-bound relocation record linking the raw report to its archived
  workspace and approved preflight;
- the ignored local provider ledger, which is the only complete usage source
  for this interrupted run.

All 12 unique refs in the partial raw report resolve. Publishable readiness
still fails, correctly, because `provider_usage` was never finalized in the raw
report. The raw report's intermediate `runtime_status: blocked` is not a valid
final outcome.

## Provider-free correction

Request-bounded OpenAI social-cycle runs now disable background Responses
polling and internal provider retries. One provider stage therefore maps to one
HTTP request, allowing the runner to recheck the case ceiling before another
stage starts. Unbounded runs retain their previous provider configuration.

Deliberation branch persistence now requires a non-empty evidence reference and
is suppressed while a target, budget, provider, or runtime stop is active. The
strict branch validator remains unchanged.

The preflight test that assumed an empty real ledger was also isolated onto a
temporary ledger. This prevents current user usage from changing test results.

Validation:

- focused provider, runner, and early-completion tests: 30 pass;
- full probe suite: 753 pass;
- `bun run typecheck`: pass;
- docs build: pass;
- `git diff --check`: pass.

## What is not proven

- GPT-5.4 Mini has not completed `collect_logs`.
- Target or milestone evaluation did not finish for this run.
- Early target stopping remains untested with current live provider evidence.
- The corrected request accounting has not yet been exercised by a live call.
- The model's proposed next-cycle movement was never executed.
- No conclusion about broader Minecraft competence or social behavior follows.

## Next experiment

After committing the correction, refresh the same-day preflight with the 11
requests / 39,627 tokens already recorded locally. Ask for a new approval for
one `collect_logs` run capped at 5 requests / 150,000 tokens. With two cycles,
two actions per cycle, no hidden retries, and no background polling, five is the
maximum number of provider stages in this run shape. Do not run
`craft_wooden_pickaxe` until that run produces a complete, auditable result.
