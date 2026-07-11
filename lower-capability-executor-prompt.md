# Lower-Capability Executor Prompt: GPT-5.4 Mini Live Validation

> Status: executed on 2026-07-11. Do not execute these live commands again.
> Read the result report under
> `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md`.
> Any rerun requires a new user decision and current-day approval.

Do not optimize for completing the request as broadly as possible.
Optimize for the smallest correct and verifiable change.

Follow this packet literally. Do not redesign the test, add adjacent fixes,
raise a limit, retry a run, or choose another model. If a stated prerequisite
is absent or a command fails, stop and report it. A failed Minecraft objective
is evidence and is not permission to repair the runtime.

## One Outcome

Prepare the capability CLI for explicit per-run limits, verify that preparation
without a provider, then—only after current dashboard approval and an `allowed`
preflight—produce one evidence packet from three serial live Minecraft runs
using only `openai-api:gpt-5.4-mini`.

The approved basis is:

- repository state at or after reviewed commit `abd1c9a9`;
- `project-docs/research/benchmarks/gpt54mini-v4-live-validation-plan.md`;
- `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/planning.json`;
- the ignored local policy
  `local-openai-gpt-5-4-mini-v4-live-validation-cap`.

Do not decide research direction. Do not interpret social behavior. Record raw
outcomes and stop states for a later high-capability reviewer.

## Allowed Changes

You may edit or create only:

1. `probe/src/benchmarks/capability/cli.ts`
2. `probe/test/capabilityCli.test.ts`
3. the preflight and run artifacts explicitly named below

Do not edit manifests, the runner, provider code, usage tracking, Minecraft
runtime code, setup files, active plans, or the ignored daily setting. Do not
commit or push. The high-capability successor reviews and commits the work.

## Phase 1: Repository And Environment Check

From `/Users/gigio/git/minecraft-llm-agent-community`, run:

```bash
git status -sb
git log -5 --oneline --decorate
uname -s
uname -m
node -p "process.platform + '/' + process.arch"
docker info
jq -e '.budgets[] | select(
  .quota_policy_id == "local-openai-gpt-5-4-mini-v4-live-validation-cap" and
  .provider_id == "openai-api" and
  .model == "gpt-5.4-mini" and
  .mode == "enforce" and
  .request_limit_per_day == 120 and
  .total_token_limit_per_day == 4000000
)' build/provider-usage/free-tier-budgets.json
test ! -e tmp/gpt54mini-v4-live-validation
```

Continue only when:

- the branch is exactly `codex/capability-gated-social-sandbox-v4`;
- there are no pre-existing changes to either allowed source/test file;
- Docker is available;
- `tmp/gpt54mini-v4-live-validation` does not already exist;
- the ignored file `build/provider-usage/free-tier-budgets.json` contains an
  enabled `enforce` policy for `openai-api:gpt-5.4-mini` with
  `request_limit_per_day: 120` and `total_token_limit_per_day: 4000000`.

The `jq` command above is the required mechanical check and does not print an
environment variable or secret. If it fails, stop.

## Phase 2: Exact CLI Preparation

In `probe/src/benchmarks/capability/cli.ts`, make only these changes:

1. Import `loadRepoDotEnv` from `../../config/loadRepoDotEnv.js`.
2. Immediately after computing `repoRoot` in `main`, call:

   ```ts
   loadRepoDotEnv(repoRoot, {
     overrideKeys: ["OPENAI_API_KEY"]
   });
   ```

   Do not log its return value or any secret.
3. Add these optional fields to `ParsedArgs`:

   ```ts
   maxWallTimeMs?: number;
   maxProviderRequests?: number;
   maxTotalTokens?: number;
   ```

4. Parse exactly these flags using the existing `parsePositiveInt` helper:

   - `--max-wall-time-ms`
   - `--max-provider-requests`
   - `--max-total-tokens`

5. Pass the three supplied values to the runner's existing `budgetOverrides`:

   ```ts
   budgetOverrides: {
     max_wall_time_ms: parsed.maxWallTimeMs,
     max_provider_requests: parsed.maxProviderRequests,
     max_total_tokens: parsed.maxTotalTokens
   }
   ```

Do not add a new usage tracker, timer, cancellation mechanism, retry path,
provider default, or abstraction.

In the new `probe/test/capabilityCli.test.ts`, add one direct subprocess test:

- create a temporary output directory;
- run the capability CLI through Bun with the real manifest;
- use `--case collect_logs --offline --cycles 1
  --max-actions-per-cycle 1 --max-wall-time-ms 30000
  --max-provider-requests 2 --max-total-tokens 1000`;
- require exit code 0;
- read the produced `suite-index.json`, follow its single run entry to
  `budget-status.json`, and require these exact declared values:
  `30000`, `2`, and `1000`;
- remove the temporary directory in cleanup.

Follow existing CLI subprocess-test style if one exists. Do not mock the runner
or assert only stdout text.

## Phase 3: Provider-Free Verification

Run in this order:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
bun test test/capabilityCli.test.ts test/capabilityBudgetStopping.test.ts test/capabilityRunnerSmoke.test.ts
bun run typecheck
bun test
cd /Users/gigio/git/minecraft-llm-agent-community
git diff --check
```

If any command fails, stop. Report the command, exit state, and smallest useful
error excerpt. Do not expand the change to make an unrelated test pass.

## Phase 4: Human Approval Check

Do not create the approval note yourself and do not treat this prompt as
approval.

Require this file to exist:

`project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md`

It must state that the user checked the OpenAI dashboard after the current
`00:00 UTC` quota reset and approved exactly
`openai-api:gpt-5.4-mini`, at most 120 requests and 4,000,000 tokens for the UTC
day. It must include UTC timestamp and quota-day key. If the note is absent,
stale, ambiguous, or names another model, stop without a provider request.

## Phase 5: Approved Preflight

From the repository root, run exactly:

```bash
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate openai-api:gpt-5.4-mini \
  --estimate-requests 120 \
  --estimate-input-tokens 3000000 \
  --estimate-output-tokens 600000 \
  --estimate-thinking-tokens 400000 \
  --estimate-total-tokens 4000000 \
  --estimate-requests-per-minute 4 \
  --estimate-input-tokens-per-minute 100000 \
  --estimate-output-tokens-per-minute 20000 \
  --estimate-thinking-tokens-per-minute 20000 \
  --estimate-total-tokens-per-minute 140000 \
  --operator-approved \
  --approval-note-file project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md \
  --out project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/approved.json
```

Read `approved.json`. Continue only when:

- `final_status` is exactly `allowed`;
- `results` contains exactly one entry whose `providerId` is `openai-api` and
  whose `model` is `gpt-5.4-mini`;
- every entry in `results[0].quota_checks` is `allowed`;
- projected usage does not exceed 120 requests or 4,000,000 tokens;
- the current UTC-day ledger plus the next run's full maximum fits every
  matching daily policy.

Any other status means stop.

## Phase 6: Live Run 1 — Natural Log Collection

Run exactly:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
SOCIAL_CYCLE_REASONING=low OPENAI_JSON_MAX_RETRIES=0 OPENAI_RESPONSES_BACKGROUND=0 \
  bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case collect_logs \
  --provider openai-api \
  --model gpt-5.4-mini \
  --repeat 1 \
  --cycles 2 \
  --max-actions-per-cycle 2 \
  --max-wall-time-ms 360000 \
  --max-provider-requests 24 \
  --max-total-tokens 700000 \
  --out ../tmp/gpt54mini-v4-live-validation/01-collect-logs
```

Do not retry. Run these exact checks:

```bash
OUT=../tmp/gpt54mini-v4-live-validation/01-collect-logs
jq -e '.runs | length == 1 and .[0].provider_id == "openai-api" and .[0].model == "gpt-5.4-mini"' "$OUT/suite-index.json"
RAW_REF=$(jq -r '.runs[0].raw_report_ref' "$OUT/suite-index.json")
BUDGET_REF=$(jq -r '.runs[0].budget_status_ref' "$OUT/suite-index.json")
NORMALIZED_REF=$(jq -r '.runs[0].normalized_report_ref' "$OUT/suite-index.json")
DECLARATION_REF=$(jq -r '.runs[0].declaration_ref' "$OUT/suite-index.json")
RAW_REPORT="$OUT/$RAW_REF"
test -f "$RAW_REPORT"
test -f "$OUT/$BUDGET_REF"
test -f "$OUT/$NORMALIZED_REF"
test -f "$OUT/$DECLARATION_REF"
jq -e '.observed.provider_requests <= 24 and .observed.total_tokens <= 700000' "$OUT/$BUDGET_REF"
bun run probe:social-cycle-audit -- "$RAW_REPORT" \
  --audit-report "$OUT/audit.json"
```

Stop if any check or audit fails.

If evidence is complete, a Minecraft target pass, partial result, or target miss
may all continue. Authentication, billing, quota, rate, provider, environment,
runtime setup, audit, or missing-evidence failure must stop the campaign.

Before Run 2, rerun preflight for all remaining planned work:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate openai-api:gpt-5.4-mini \
  --estimate-requests 76 \
  --estimate-total-tokens 2300000 \
  --estimate-requests-per-minute 4 \
  --operator-approved \
  --approval-note-file project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md \
  --out project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/remaining-after-01.json
```

Continue only when `final_status` is `allowed` and the next run's entire maximum
fits the current UTC-day policies.

## Phase 7: Live Run 2 — Wooden Pickaxe

Run exactly:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
SOCIAL_CYCLE_REASONING=low OPENAI_JSON_MAX_RETRIES=0 OPENAI_RESPONSES_BACKGROUND=0 \
  bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case craft_wooden_pickaxe \
  --provider openai-api \
  --model gpt-5.4-mini \
  --repeat 1 \
  --cycles 8 \
  --max-actions-per-cycle 1 \
  --max-wall-time-ms 720000 \
  --max-provider-requests 56 \
  --max-total-tokens 1800000 \
  --out ../tmp/gpt54mini-v4-live-validation/02-wooden-pickaxe
```

Do not retry. Run:

```bash
OUT=../tmp/gpt54mini-v4-live-validation/02-wooden-pickaxe
jq -e '.runs | length == 1 and .[0].provider_id == "openai-api" and .[0].model == "gpt-5.4-mini"' "$OUT/suite-index.json"
RAW_REF=$(jq -r '.runs[0].raw_report_ref' "$OUT/suite-index.json")
BUDGET_REF=$(jq -r '.runs[0].budget_status_ref' "$OUT/suite-index.json")
NORMALIZED_REF=$(jq -r '.runs[0].normalized_report_ref' "$OUT/suite-index.json")
DECLARATION_REF=$(jq -r '.runs[0].declaration_ref' "$OUT/suite-index.json")
RAW_REPORT="$OUT/$RAW_REF"
test -f "$RAW_REPORT"
test -f "$OUT/$BUDGET_REF"
test -f "$OUT/$NORMALIZED_REF"
test -f "$OUT/$DECLARATION_REF"
jq -e '.observed.provider_requests <= 56 and .observed.total_tokens <= 1800000' "$OUT/$BUDGET_REF"
bun run probe:social-cycle-audit -- "$RAW_REPORT" \
  --audit-report "$OUT/audit.json"
```

Stop if any check fails or if a non-actor failure listed above occurs.

Before Run 3, run:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate openai-api:gpt-5.4-mini \
  --estimate-requests 20 \
  --estimate-total-tokens 500000 \
  --estimate-requests-per-minute 4 \
  --operator-approved \
  --approval-note-file project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md \
  --out project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/remaining-after-02.json
```

Continue only when `final_status` is `allowed` and the third run's entire
maximum fits the current UTC-day policies.

## Phase 8: Live Run 3 — Truthful Infeasibility

Run exactly:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community/probe
SOCIAL_CYCLE_REASONING=low OPENAI_JSON_MAX_RETRIES=0 OPENAI_RESPONSES_BACKGROUND=0 \
  bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case acquire_diamond_pickaxe_infeasible \
  --provider openai-api \
  --model gpt-5.4-mini \
  --repeat 1 \
  --cycles 3 \
  --max-actions-per-cycle 1 \
  --max-wall-time-ms 60000 \
  --max-provider-requests 20 \
  --max-total-tokens 500000 \
  --out ../tmp/gpt54mini-v4-live-validation/03-infeasible-diamond-pickaxe
```

Do not retry. Run:

```bash
OUT=../tmp/gpt54mini-v4-live-validation/03-infeasible-diamond-pickaxe
jq -e '.runs | length == 1 and .[0].provider_id == "openai-api" and .[0].model == "gpt-5.4-mini"' "$OUT/suite-index.json"
RAW_REF=$(jq -r '.runs[0].raw_report_ref' "$OUT/suite-index.json")
BUDGET_REF=$(jq -r '.runs[0].budget_status_ref' "$OUT/suite-index.json")
NORMALIZED_REF=$(jq -r '.runs[0].normalized_report_ref' "$OUT/suite-index.json")
DECLARATION_REF=$(jq -r '.runs[0].declaration_ref' "$OUT/suite-index.json")
RAW_REPORT="$OUT/$RAW_REF"
test -f "$RAW_REPORT"
test -f "$OUT/$BUDGET_REF"
test -f "$OUT/$NORMALIZED_REF"
test -f "$OUT/$DECLARATION_REF"
jq -e '.observed.provider_requests <= 20 and .observed.total_tokens <= 500000' "$OUT/$BUDGET_REF"
bun run probe:social-cycle-audit -- "$RAW_REPORT" \
  --audit-report "$OUT/audit.json"
```

Stop if any check fails. Target non-completion is expected; false success,
missing evidence, or a wrongly attributed provider failure is not acceptable.

Finally, run a provider-free ledger check with a one-request, one-token
hypothetical estimate. This command makes no provider request:

```bash
cd /Users/gigio/git/minecraft-llm-agent-community
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate openai-api:gpt-5.4-mini \
  --estimate-requests 1 \
  --estimate-total-tokens 1 \
  --estimate-requests-per-minute 1 \
  --operator-approved \
  --approval-note-file project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md \
  --out project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/final-ledger-check.json
```

Preserve the result even if it is not `allowed`; do not make another provider
request.

## Phase 9: Final Inspection And Report

Do not edit code after live execution. Inspect and report:

- exact branch and final `git status -sb`;
- source/test files changed;
- all verification commands and results;
- approval-note path and approved-preflight path;
- for each scenario: command, start/end time, exit state, capability run ID,
  target/milestone result, runtime status, stop reason, request count, total
  tokens, wall time, suite index, raw report, normalized report, budget status,
  and audit result;
- UTC quota-day totals after the last attempted run;
- whether all three run maxima and the 120-request/4,000,000-token daily maximum
  were respected;
- the exact scenario after which execution stopped, if any;
- what remains unproven.

Do not call a target miss an implementation failure. Do not call provider or
environment failure actor incompetence. Do not claim social behavior, goal
continuity across restarts, general Minecraft competence, or research novelty.

Your final line must say one of:

- `READY FOR HIGH-CAPABILITY REVIEW: all planned evidence is present.`
- `STOPPED SAFELY: <exact reason>; no further provider request was made.`
