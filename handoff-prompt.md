# Successor Prompt: Bounded GPT-5.4 Mini Live Validation

> Status: the live work described below was executed on 2026-07-11. Do not run
> it again. The current result and next provider-free fixes are recorded in
> `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/README.md`.
> A future live run requires a new user decision and current-day approval.

You are the high-capability successor responsible for the first live validation
of the V4 individual-capability path. Prepare the CLI, require current dashboard
approval, supervise the bounded executor instructions, inspect the resulting
Minecraft evidence, and record only conclusions supported by the run.

Use plain engineering and research language. Do not introduce inflated process
terms. Preserve exact file, branch, schema, and command identifiers when they
must be spelled literally.

## Objective

Produce one auditable three-scenario live validation using only
`openai-api:gpt-5.4-mini`, without exceeding the user's daily ceiling. This is
an engineering and runtime validation. It does not establish a social-simulation
result or a research contribution.

## Completion Conditions

The work is complete only when all of the following are true:

1. The capability CLI loads the repository `.env` without exposing secrets and
   accepts the three existing tighter run limits described below.
2. Focused tests, the full probe test suite, typecheck, and `git diff --check`
   pass before any provider call.
3. The user has checked the OpenAI dashboard after the current `00:00 UTC`
   reset, recorded approval, and a new exact preflight result is `allowed`.
4. The three scenarios run serially, once each, with their own request, token,
   and wall-time maxima.
5. Each run preserves its declaration, raw report, normalized report, budget
   status, suite index, actor workspace refs, usage refs, and audit result.
6. The combined planned maximum remains 100 requests and 3,000,000 tokens. The
   ignored local daily setting remains at 120 requests and 4,000,000 tokens,
   leaving reserve for estimation error.
7. A high-capability review uses `minecraft-agent-runtime-review`, followed by
   `minecraft-run-report-author`, before publishing conclusions or changing
   runtime behavior.
8. Important tracked changes and reviewed results are committed in focused
   commits. Do not push unless the user asks.

A Minecraft objective does not need to pass for this work to be complete. A
truthful failure with complete evidence is a useful result. Provider, setup,
usage, or missing-evidence failures must be reported separately from actor
ability.

## Work Boundary

In scope:

- the minimal capability CLI preparation;
- provider-free verification of that preparation;
- current dashboard approval and exact quota preflight;
- the three declared live scenarios;
- per-run report audit and quota recheck;
- high-capability runtime review and a concise run report.

Out of scope:

- B3 live restart continuity;
- multi-actor or social scenarios;
- D2 phenomenon study;
- other models or providers;
- model comparison, automatic retry, parallel execution, reruns, or visual
  capture;
- raising or disabling any request/token maximum;
- unrelated runtime repair discovered during a run.

Require the user's confirmation before:

- accepting OpenAI dashboard eligibility and remaining free allowance;
- increasing a limit or changing provider/model;
- rerunning a scenario;
- pushing the branch.

## Current Repository State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Last reviewed implementation commit at handoff creation: `abd1c9a9`
- State before these planning documents: two commits ahead of origin, clean
- Provider-free validation snapshot: `cd probe && bun test` -> 729 pass;
  `cd probe && bun run typecheck` -> pass; `cd docs && npm run build` -> pass
- No live request has run for this campaign.
- Planning preflight status: `needs_dashboard_approval`
- Current matching UTC-day local ledger at planning time: 0 requests and 0
  tokens

The ignored local file
`build/provider-usage/free-tier-budgets.json` now contains policy
`local-openai-gpt-5-4-mini-v4-live-validation-cap` in `enforce` mode with a
120-request and 4,000,000-token UTC-day maximum. Because it is ignored, verify
its exact contents locally before every live session. Do not weaken or remove
it during this campaign.

## Decisions Already Made

| Topic | Decision | Why |
| --- | --- | --- |
| Provider/model | `openai-api:gpt-5.4-mini` only | User fixed the model and prohibited daily overrun |
| Reasoning/retries | `low`, zero provider retries, background responses disabled | Limits cost and makes every attempted call visible |
| Order | logs, wooden pickaxe, infeasible diamond pickaxe | Start with an open-world smoke, then multi-step action, then failure truthfulness |
| Repeats | exactly one per scenario | No hidden multiplication of usage |
| Concurrency | serial only | Makes usage and failure attribution inspectable |
| CLI approach | expose existing runner limit inputs and reuse `loadRepoDotEnv` | Smallest change that provides explicit live limits |
| Interpretation | engineering validation only | Three narrow runs cannot establish the broader V4 research direction |
| B3 | deferred | There is no ready live restart runner or adapter |

## Scenario Limits

| Order | Case | Cycles | Actions/cycle | Requests | Tokens | Wall time |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | `collect_logs` | 2 | 2 | 24 | 700,000 | 360,000 ms |
| 2 | `craft_wooden_pickaxe` | 8 | 1 | 56 | 1,800,000 | 720,000 ms |
| 3 | `acquire_diamond_pickaxe_infeasible` | 3 | 1 | 20 | 500,000 | 60,000 ms |

The combined per-run maxima are stricter than the local daily setting. Keep the
20-request and 1,000,000-token difference unused as reserve.

## What Is Already Done

- `63eb47df` repaired setup-time accounting, limit-stop status, deep physical
  value validation, and symlink escape handling.
- `abd1c9a9` corrected the A3/B2 completion documentation.
- `project-docs/research/benchmarks/gpt54mini-v4-live-validation-plan.md`
  fixes the scenario design, limits, evidence, interpretation, and stop rules.
- `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/preflight/planning.json`
  records the 120-request/4,000,000-token planning check and its required
  dashboard approval.
- `lower-capability-executor-prompt.md` contains the bounded implementation and
  execution packet. Do not ask the executor to rediscover the plan.

## Required Reading

Read these before edits or provider use:

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/orientation/agent-search-index.md`
5. `project-docs/orientation/terminology.md`
6. `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
7. `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
8. `project-docs/research/benchmarks/gpt54mini-v4-live-validation-plan.md`
9. `project-docs/research/benchmarks/v4-implementation-explanation.md`
10. `implementation-notes.md`
11. `lower-capability-executor-prompt.md`

Before any provider call, use
`.agents/skills/provider-quota-preflight/SKILL.md`. For result review use
`.agents/skills/minecraft-agent-runtime-review/SKILL.md`, then
`.agents/skills/minecraft-run-report-author/SKILL.md`.

## Exact Remaining Work

1. Inspect the branch and confirm there are no overlapping user changes.
2. Make only the CLI and subprocess-test changes specified in
   `lower-capability-executor-prompt.md`.
3. Run all provider-free verification commands from that prompt.
4. Stop and ask the user to check the OpenAI dashboard. Do not infer approval
   from this handoff, the local ledger, an API key, or account balance.
5. After explicit approval, create
   `project-docs/experiments/curated/2026-07-11/gpt54mini-v4-live-validation/operator-approval.md`.
   Record the check time in UTC and KST, quota-day key, exact provider/model,
   dashboard eligibility/free-allowance observation, and the user's approval.
   Do not include secrets or billing identifiers.
6. Run the exact approved preflight command in the executor prompt. Continue
   only if `final_status` is `allowed`.
7. Run the three scenarios in order. After each run, audit its raw report and
   rerun preflight for all remaining planned work. Never retry automatically.
8. Review the evidence with the two required repo agent skills. Preserve a
   Minecraft target miss as data; do not repair code during the campaign.
9. Write the report, update truthful status documentation, run documentation
   checks, and commit focused changes. Do not push without user instruction.

## Known Risks

- The current CLI neither loads `.env` nor accepts the three tighter run-limit
  flags. Provider use before the minimal preparation is prohibited.
- The provider call does not receive the case AbortSignal once a request is
  already in flight. Record actual wall-time overrun; do not claim mid-request
  cancellation.
- The runner does not stop as soon as the target passes. Short cycle counts are
  therefore part of the usage bound.
- OpenAI free allowance depends on dashboard eligibility and current project
  state. A green local ledger is insufficient.
- The campaign daily setting is ignored local state. A new machine or checkout
  will not have it unless reinstalled and verified.
- A valid report audit can still accompany poor Minecraft behavior. Keep report
  integrity and actor competence separate.

## Stop Rules

Stop before the next provider request when any of these is true:

- current-day dashboard approval is absent;
- exact preflight is not `allowed`;
- the ignored 120-request/4,000,000-token daily setting is absent or weaker;
- remaining daily capacity is smaller than the next scenario's full maximum;
- provider/model, environment flags, order, repeat count, or limits differ;
- any authentication, billing, quota, rate, provider, Docker, Minecraft, audit,
  or missing-evidence failure occurs;
- continuing requires an unplanned code/configuration change;
- the worktree has overlapping user changes.

Do not improvise a recovery. Report the exact command, exit state, last safe
artifact, and remaining planned allowance.

## First Actions

1. Run `git status -sb` and `git log -5 --oneline --decorate`.
2. Verify the exact ignored local daily setting and inspect the planning
   preflight JSON.
3. Read the live-validation plan and executor packet.
4. Implement and verify the two-file CLI preparation without provider use.
5. Stop for current dashboard approval if it has not been explicitly recorded.

## Final Delivery

Lead with whether live validation actually ran. Report the exact model, three
scenario outcomes, per-run and UTC-day usage, report-audit status, files and
commits, and what remains unproven. State clearly that no social or research
claim follows from these three runs. Include branch push state.
