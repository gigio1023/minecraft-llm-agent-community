# GPT-5.4 Mini V4 Live Validation Plan

Search token: `GPT54MINI_V4_LIVE_VALIDATION`.

Status: planned; no live provider request has run.

Recorded: 2026-07-11 (`Asia/Seoul`).

This plan tests the V4 capability path with a real LLM and live Minecraft. It
does not test research novelty, compare models, or establish social behavior.
Its value is to find failures hidden by unit tests: provider transport,
Minecraft setup, action choice, physical execution, saved evidence, report
normalization, usage recording, and truthful stopping.

## Fixed Provider And Model

- Provider: `openai-api`
- Model: `gpt-5.4-mini`
- Reasoning: `low`
- Provider retries: `0`
- OpenAI Responses background mode: disabled for this short validation
- Repeats: `1` per scenario

No other external model or provider may be used. Provider-free tests may still
use deterministic local code because they make no external model request.

## Why These Three Scenarios

| Order | Capability case | Live setting | What it can reveal |
| --- | --- | --- | --- |
| 1 | `collect_logs` | 2 cycles, 2 actions per cycle, natural world | Whether the model can inspect a real spawn, select a useful action, mutate inventory, and produce resolvable evidence |
| 2 | `craft_wooden_pickaxe` | 8 cycles, 1 action per cycle, controlled flat fixture | Whether the model can carry a multi-step objective across turns without receiving the hidden action sequence |
| 3 | `acquire_diamond_pickaxe_infeasible` | 3 cycles, 1 action per cycle, natural world | Whether an implausible objective ends without fabricated success and whether the short wall-time result remains truthful |

The controlled crafting case is not natural-world competence. It isolates
multi-step action choice. The natural log case supplies the open-world check.
The infeasible case is a failure-quality check, not an expectation that the
model obtains a diamond pickaxe.

## Usage Limits

The documented OpenAI mini/nano complimentary pool is shared and limited to
10,000,000 tokens per UTC day. The existing local setting stops this model at
9,000,000 tokens. This campaign adds a stricter ignored local setting:

- maximum 120 requests per UTC day;
- maximum 4,000,000 tokens per UTC day.

The three cases have stricter combined limits:

| Case | Request maximum | Token maximum | Wall time maximum |
| --- | ---: | ---: | ---: |
| `collect_logs` | 24 | 700,000 | 360,000 ms |
| `craft_wooden_pickaxe` | 56 | 1,800,000 | 720,000 ms |
| `acquire_diamond_pickaxe_infeasible` | 20 | 500,000 | 60,000 ms |
| Combined | 100 | 3,000,000 | — |

The remaining 20 requests and 1,000,000 tokens are reserve for estimate error.
The stricter campaign setting remains installed until the user reviews the
campaign. Do not raise, remove, disable, or switch it to tracking mode during
this work.

OpenAI dashboard eligibility is still authoritative. The planning preflight at
`project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/planning.json`
reports `needs_dashboard_approval`. No live request may run until the user has
checked the dashboard after the current `00:00 UTC` reset and approved the
campaign in a dated note.

## Required CLI Preparation

The current capability CLI does not load the repo `.env` and does not expose the
runner's existing tighter limit inputs. Before the live run, make only these
changes:

1. In `probe/src/benchmarks/capability/cli.ts`, load the repo `.env` with
   `loadRepoDotEnv` without printing any value.
2. Add `--max-wall-time-ms`, `--max-provider-requests`, and
   `--max-total-tokens`.
3. Pass those values to the existing `budgetOverrides` input. Do not create a
   second usage or cancellation system.
4. Add one subprocess test in `probe/test/capabilityCli.test.ts` that runs the
   provider-free CLI and proves the three tighter values appear in
   `budget-status.json`.

Run the focused test, full probe test suite, and typecheck before any live
request. A failure stops the campaign; it does not authorize broader repairs.

## Execution Order

Run the cases serially in the order above. Never run them in parallel. Use
`SOCIAL_CYCLE_REASONING=low`, `OPENAI_JSON_MAX_RETRIES=0`, and
`OPENAI_RESPONSES_BACKGROUND=0` for every live command.

After each case:

1. read `suite-index.json`, the normalized report, budget status, and raw report;
2. run the existing social-cycle report audit on the raw report;
3. compare run-scoped usage with the case maximum and the UTC-day ledger;
4. rerun preflight for the remaining planned work;
5. stop if the status is not `allowed`, if any provider/model differs, or if an
   environment, authentication, billing, quota, rate-limit, or evidence error
   occurs.

There are no automatic retries. A failed Minecraft objective is a valid result
when reports and evidence remain truthful. Provider or environment failure is
not actor incompetence.

## Evidence To Preserve

For each case preserve:

- case declaration;
- raw social-cycle report;
- normalized capability report;
- budget status;
- suite index;
- actor workspace and provider input/output refs;
- world scenario, seed/reset, verifier, and provider usage refs;
- report audit result;
- command, environment flags, exit status, start/end time, and UTC quota day.

The lower-capability executor records raw outcomes only. A later high-capability
review must use `minecraft-agent-runtime-review`, then
`minecraft-run-report-author`, before publishing conclusions or changing runtime
code.

## Interpretation

- Passing all three cases shows that the live test path works under these narrow
  conditions. It is not a social-simulation result.
- Failing `collect_logs` or `craft_wooden_pickaxe` locates a capability,
  provider-selection, runtime, or evidence problem for later diagnosis.
- The infeasible case is satisfactory when it avoids false success and records
  a truthful stop, even if no Minecraft milestone is reached.
- If wall time expires during an in-flight provider request, record the actual
  overrun. Do not claim mid-request cancellation; the current provider path does
  not receive the case AbortSignal after a request has started.

## Stop Conditions

Stop before the next provider request when any of these is true:

- dashboard approval is absent or older than the current UTC quota day;
- preflight is `blocked`, `unbudgeted`, or `needs_dashboard_approval`;
- the 120-request or 4,000,000-token local setting is missing or weaker;
- remaining daily capacity is below the next case's full declared maximum;
- model is not exactly `gpt-5.4-mini` or provider is not exactly `openai-api`;
- a command would disable default budgets, use tracking mode, add retries, or
  run cases in parallel;
- Docker/Minecraft setup is unavailable;
- the worktree contains overlapping user changes;
- continuing requires an unplanned code or configuration change.

Do not run B3 restart continuity, multi-actor social scenarios, D2, visual
capture, model comparisons, or reruns in this campaign.
