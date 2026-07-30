# Provider Capability Experiment Plan — Qwen 3.8, Qwen 3.7, GPT-5.4

Search token: `PROVIDER_CAPABILITY_EXPERIMENT_2026_07_24`.

Status: `preflight-ready` as a plan; no live provider request is authorized by
this document.

Recorded: 2026-07-24 (`Asia/Seoul`).

This is the subordinate execution plan for V4 Stage 1 / implementation step
A5. It is not a new research direction and does not change the active
capability-gated social-sandbox spine.

## Decision

```yaml
schema_version: research-decision/v1
decision: >
  Use qwen3.8-max-preview for one complete long-horizon first-iron-batch case,
  then use Qwen 3.7 Plus and exact gpt-5.4 as bounded diagnostic comparators.
  Keep Qwen 3.7 Max as an optional matched rerun after the first results.
verdict: preflight-ready
evidence_used:
  - operator-provided Qwen 3.8 preview notice
  - operator-provided Qwen Ambassador monthly quotas
  - operator-copied OpenAI dashboard eligibility notice
  - individual-capability-v1 manifest version 1.4.0
  - repaired V4 Stage 1 runtime and prior gpt-5.4-mini validation artifacts
alternatives_considered:
  - full all-model suite immediately
  - GPT-5.6 candidates
  - model ranking from one seed
strongest_objection: >
  Provider transports and reasoning configurations differ, and OpenAI says
  tool use is excluded from complimentary usage; observed differences may not
  be model-capability differences.
accepted_risk: >
  The first waves are diagnostic substrate measurements, not a publishable
  ranking. Every failure remains attributed to provider, contract, runtime,
  verifier, or actor behavior before interpretation.
next_action: >
  Obtain explicit approval for one exact-provider canary at a time, save a
  current-window preflight, and execute P0 serially.
what_not_to_do_next: >
  Do not run GPT-5.6, substitute snapshots, parallelize Model Studio calls,
  start a multi-actor social run, or promote one-seed scores into a model rank.
```

## Provider Availability Record

The words "free", "available", and "nearly unlimited" refer to different
constraints and must not be treated as synonyms.

| Candidate | Access evidence | Enforced quota | Billing/free conclusion | Planned role |
| --- | --- | --- | --- | --- |
| `alibaba-model-studio-api:qwen3.8-max-preview` | Preview administrator notice and configured Model Studio credentials | 120 RPM, 500K TPM per person; no announced aggregate token cap | Large capacity is confirmed. Billing treatment is not established by the notice, so preflight still requires operator acknowledgement. | Primary complete A5 batch |
| `modelscope-api:Qwen-Ambassador/Qwen3.7-Plus` | Operator-provided Ambassador allocation | 10,000 API calls per UTC calendar month | Locally budgeted by API calls; current provider-side remaining quota still needs checking before execution. | First diagnostic comparator |
| `modelscope-api:Qwen-Ambassador/Qwen3.7-Max` | Operator-provided Ambassador allocation | 2,500 API calls per UTC calendar month | Same caveat as Plus; preserve the smaller pool until its comparison adds information. | Optional matched comparator |
| `openai-api:gpt-5.4` | Exact alias appears in operator-copied active dashboard notice | Shared 1,000,000 tokens per UTC day | Eligible model alias does not prove every request is complimentary. Project sharing, positive balance, current dashboard usage, and request type still govern. Tool use is specifically excluded by the supporting Help Center article. | Selected OpenAI comparator |

GPT-5.5, all GPT-5.6 variants, and dated OpenAI snapshots are excluded. The
operator-provided dashboard list is the only model-candidate authority for
OpenAI complimentary usage in this repo.

Qwen 3.8 is Model Studio, not ModelScope. Qwen 3.7 Max and Plus are ModelScope
Ambassador models. Their credentials, endpoints, ledgers, and quota units must
remain separate.

## Research Object

The object is the current runtime/model configuration's ability to complete
declared, verifier-backed individual Minecraft capability cases under fixed
case manifests and strict budgets.

The experiment does not ask which model is universally best. It asks:

1. whether each provider path can carry the exact Stage 1 contract;
2. whether the actor produces verified physical progress rather than plausible
   prose;
3. where failures occur after separating provider transport, schema/tool
   contract, runtime execution, verifier evidence, and actor behavior;
4. whether a model is non-degenerate enough to justify continuity and later
   social-sandbox work.

Basic Minecraft competence is a control and substrate gate. It is not the
project's research contribution.

## Experiment Sketch

```yaml
schema_version: experiment-sketch/v1
uncertainty_to_reduce: >
  Whether the repaired V4 Stage 1 path yields comparable verifier-backed
  capability evidence with Qwen 3.8, Qwen 3.7, and GPT-5.4, and whether any
  apparent difference survives provider/runtime failure attribution.
hypothesis: >
  Qwen 3.8 will preserve enough state across the full wood-to-stone-to-iron
  dependency chain to reach a ready-to-smelt first iron batch; bounded
  comparator lanes will reveal whether stalls are shared substrate defects or
  configuration-specific.
candidate_layer: measurement substrate
independent_variable: exact provider/model configuration
observed_target: target predicates, milestones, failure class, and resource use
baseline: deterministic provider-free harness calibration
run_protocol: P0 canary, P1 Qwen 3.8 batch, P2 bounded comparators, P3 replication
minimum_data: >
  One artifact-complete P1 batch; P2 only after P1 is diagnosable; three seeds
  only for cases/configurations selected for P3.
artifacts_needed: >
  declaration, raw and normalized reports, budget status, suite index, actor
  workspace, provider snapshots, usage ledger refs, preflight, commands, and
  dashboard observation where required.
evaluator: manifest target/milestone predicates over runtime evidence
stop_condition: >
  quota gate, provider/billing error, model mismatch, artifact corruption,
  common substrate blocker, or declared case budget.
negative_result_interpretation: >
  A provider incompatibility, common runtime blocker, or honest target failure
  narrows the next repair or model decision; none becomes evidence of social
  capability.
cost_bound: >
  P1: 80 requests and 3.5M tokens estimated on Qwen 3.8. Each P2 Qwen lane:
  36 requests on the same case. GPT-5.4 campaign: 12 requests and 600K tokens
  maximum in one UTC day, including canary, with no request permitted to cross
  the remaining pool.
```

## Fixed Configuration

- Capability manifest:
  `probe/benchmarks/capability/individual-capability-v1.json`, version `1.4.0`.
- Main case: `prepare_first_iron_batch`.
- Fixture: `first-iron-batch-flat-benchmark-v1`.
- Actor: `npc_b`.
- Provider retries: `0`.
- OpenAI Responses background mode: disabled whenever a case has a request
  ceiling.
- Runs are serial. Only one Model Studio-backed process may exist at a time.
- Exact model ids are mandatory on every command.
- Qwen 3.8 keeps service-default `reasoning_effort=xhigh`; thinking cannot be
  disabled.
- GPT-5.4 uses `SOCIAL_CYCLE_REASONING=high` for this plan. This differs from
  Qwen 3.8's forced configuration, so cross-provider results are diagnostic and
  not a compute-matched ranking.
- Qwen 3.7 configuration and returned reasoning metadata must be recorded
  exactly as observed; do not invent a common reasoning level.
- No provider path may derive Minecraft success from provider prose.

## Command Contract

All commands run from the repo root. The output paths below are placeholders
for a newly declared execution date; do not reuse planning-day approval.

GPT-5.4 preflight:

```bash
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate openai-api:gpt-5.4 \
  --estimate-requests 12 \
  --estimate-input-tokens 360000 \
  --estimate-output-tokens 120000 \
  --estimate-thinking-tokens 120000 \
  --estimate-total-tokens 600000 \
  --estimate-requests-per-minute 1 \
  --estimate-total-tokens-per-minute 100000 \
  --external-already-used <current-utc-day-dashboard-observation.json> \
  --out <run-root>/preflight/gpt-5.4.json
```

First GPT-5.4 capability lane, only after P0 and an approved current-day
preflight:

```bash
cd probe
SOCIAL_CYCLE_REASONING=high \
OPENAI_JSON_MAX_RETRIES=0 \
OPENAI_RESPONSES_BACKGROUND=0 \
bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case prepare_first_iron_batch \
  --provider openai-api \
  --model gpt-5.4 \
  --repeat 1 \
  --max-provider-requests 8 \
  --max-total-tokens 450000 \
  --out <run-root>/gpt-5.4
```

Qwen capability lanes use the same command shape with the exact provider and
model from the tables. Apply the per-case request/token ceiling from P1 or P2.
Never use an environment model fallback.

## P0 — Compatibility And Billing Canary

Run one candidate at a time. Re-run preflight immediately before each canary.
No later phase inherits approval from an earlier UTC day or quota window.

### P0-A: Qwen 3.8

- One offline social cycle, one maximum action.
- Ceiling: 3 provider requests, 200K total tokens, 100K estimated peak tokens
  in one UTC minute.
- Verify exact model acceptance, `reasoning_content` retention, JSON stages,
  required tool-call shape, abort behavior, provider usage records, and raw
  provider output.
- Continue only if the artifacts are complete and preflight is `allowed` after
  operator billing acknowledgement.

### P0-B: Qwen 3.7 Plus

- Same one-cycle offline shape.
- Ceiling: 3 API calls.
- Verify ModelScope endpoint/model availability, JSON and tool-call
  compatibility, and monthly ledger increments.
- Qwen 3.7 Max receives a canary only if P2 later selects it.

### P0-C: GPT-5.4

1. Run one JSON-only provider canary under an explicit per-request approval.
2. Inspect the OpenAI dashboard after the request.
3. Only with a second explicit approval, run one offline Actor Turn canary that
   requires a function tool.
4. Inspect the dashboard again and record whether tool traffic was counted as
   complimentary or billed.

Combined GPT-5.4 canary ceiling: 3 requests and 150K tokens. A model-list match
is not enough to skip the tool-use check.

If the repository lacks a provider-only JSON canary for OpenAI, implement and
test that bounded diagnostic first. Do not substitute a Minecraft run for the
missing billing classification check.

## Main Goal And Why It Is Difficult

The actor receives one Minecraft outcome:

> Prepare the worksite for its first iron tool: keep at least three
> `raw_iron` and one `coal` in inventory, retain a `stone_pickaxe` in inventory
> or hand, and place one `furnace`.

Three raw iron is the exact material quantity for an iron pickaxe after
smelting, and one coal can fuel that batch. The current runtime cannot yet
operate a furnace, so the target stops at a truthful ready-to-smelt state
instead of pretending that iron ingots or an iron pickaxe are attainable.

The shortest legitimate Minecraft dependency graph still requires the actor
to:

- obtain and transform wood;
- create and place a crafting table;
- craft a wooden pickaxe;
- mine enough stone for both a stone pickaxe and a furnace;
- upgrade to stone tier before iron ore can yield `raw_iron`;
- acquire coal and three raw iron;
- craft and place the furnace while retaining the final inventory state.

This sequence is not included in model input. The manifest owns it only as an
evaluator-side explanation. The fixture exposes fixed wood, stone, coal ore,
and iron ore so a missing random vein cannot masquerade as a planning failure.
Fixture blocks never count as progress.

## P1 — First Complete Long-Horizon A5 Run

Provider/model: `alibaba-model-studio-api:qwen3.8-max-preview`.

Run `prepare_first_iron_batch` once with a ceiling of 80 provider requests and
3.5M total tokens. The ceiling includes no retry reserve. The run may end
early only when the complete target passes or another declared stop condition
holds.

These ceilings are stopping limits, not spending targets. Target completion
ends the case early. The run is complete when it has a truthful terminal
artifact, including a blocked or failed outcome.

At every newly observed milestone, and at final settlement:

1. inspect declaration, raw report, normalized report, budget status, and suite
   index;
2. audit `capability_progress.milestone_first_observations`, including the
   first action/cycle, wall time, provider requests, tokens, and evidence refs;
3. audit report and actor-workspace refs;
4. compare run usage with the case ceiling and current UTC-minute ledger;
5. stop on provider, billing, auth, quota, environment, model-id, or artifact
   failure.

## P2 — Bounded Diagnostic Comparators

P2 starts only when P1 artifacts are complete enough to distinguish substrate
failure from actor behavior.

Run order:

1. a 36-request Qwen 3.8 truncation of `prepare_first_iron_batch`, so the
   smaller ModelScope lanes have a matched budget;
2. `modelscope-api:Qwen-Ambassador/Qwen3.7-Plus` on the same case with the same
   36-request ceiling;
3. `openai-api:gpt-5.4` on the same case, conditional on the P0 tool-use
   billing result;
4. `modelscope-api:Qwen-Ambassador/Qwen3.7-Max`, only if Max can resolve an
   uncertainty left by Plus and Qwen 3.8.

Qwen comparator ceiling per model: 36 API calls on the one declared case.
Compare milestone trajectories at the same request cutoff; do not compare a
36-request partial run directly with Qwen 3.8's 80-request completion result.

GPT-5.4 does not receive a full-budget comparator in the first UTC day. It
begins the same long case, with a combined day-level campaign ceiling of 12
requests and 600K tokens including P0. Treat the result only as an
early-trajectory diagnostic. Keep 400K of the 1M shared pool outside the
campaign so a large final request or dashboard mismatch does not automatically
reach the provider limit.

Do not continue the GPT-5.4 lane when:

- the tool canary is billed or cannot be classified;
- current dashboard usage is missing or stale;
- the exact UTC-day external observation is absent;
- the next request could cross the 600K campaign ceiling;
- any other model in the shared large pool consumed unrecorded capacity.

## P3 — Replication Gate

Replication is earned, not automatic.

Select at most two non-degenerate configurations. Repeat
`prepare_first_iron_batch` on three fresh resets of the versioned fixture. Do
not call these three seeds: the command fixture deliberately fixes resource
layout, so the repeats measure execution stability rather than world
robustness. Natural-world replication requires a later declared scenario and
must not be improvised.

P3 may support a narrow robustness statement. It still does not establish a
general model ranking because provider transport, reasoning effort, latency,
and token accounting differ.

## Baselines And Falsifiers

Baseline:

- deterministic provider-free calibration proves harness wiring and truthful
  failure handling;
- it is not a behavioral competitor to an LLM;
- historical `gpt-5.4-mini` runs are defect-discovery evidence, not a matched
  GPT-5.4 baseline.

The model-capability interpretation is falsified or deferred when:

- all candidates fail at the same action contract or runtime step;
- apparent score differences disappear after removing provider/runtime errors;
- target success lacks same-run verifier evidence;
- one configuration received materially more actions, tokens, wall time, or
  hidden retries;
- world/reset artifacts are not comparable;
- GPT-5.4 tool calls are outside the complimentary offer and no paid-run
  approval exists.

## Measurements

Report separately:

- target status and passed milestone ids;
- time and provider usage at every milestone's first observation, first
  progress, and target completion;
- provider requests, input/output/reasoning/total tokens, and wall time;
- executable tool-call contract failures;
- runtime action outcomes and verifier evidence;
- no-progress and repeated-action patterns;
- provider/auth/quota/billing failures;
- environment and seed/reset failures.

Do not collapse prediction quality, acting outcome, physical competence,
continuity, social consequence, robustness, and efficiency into one score.

## Required Artifacts

Every live lane preserves:

- current-window preflight JSON and exact command;
- operator approval note where required;
- OpenAI external dashboard observation before and after GPT-5.4 canaries;
- case declaration;
- raw social-cycle report;
- normalized capability report;
- budget status and suite index;
- actor workspace and provider input/output refs;
- provider usage ledger refs;
- world scenario, seed/reset, verifier, and implementation revision;
- start/end time, exit status, and observed blocker.

Do not record API keys, workspace secrets, or raw `.env` values.

## Planning Preflight Snapshot

Planning checks ran at `2026-07-24 00:06 KST`, which was still UTC quota day
`2026-07-23`:

| Planned lane | Estimate | Result |
| --- | --- | --- |
| Qwen 3.8 P1 | 80 requests, 3.5M tokens total, 100K tokens/minute peak estimate | `needs_dashboard_approval`; rate/token-minute checks allowed, operator billing acknowledgement missing |
| Qwen 3.7 Plus P2 | 36 requests | `allowed`; local July ledger showed 0 matching requests before projection |
| Qwen 3.7 Max optional P2 | 36 requests | `allowed`; local July ledger showed 0 matching requests before projection |
| GPT-5.4 P0 plus first capability lane | 12 requests, 600K tokens total, 100K tokens/minute peak estimate | `needs_dashboard_approval`; exact model matched the 1M pool, local UTC-day usage was 0, and projected usage was 600K |

The GPT-5.4 planning check used the final campaign ceiling. It must still be
rerun for the actual UTC day with a current dashboard observation before
execution. Planning output is not live authorization.

## Stop Conditions

Stop before the next provider request when any condition holds:

- preflight is `blocked`, `unbudgeted`, or `needs_dashboard_approval`;
- the command's exact provider/model differs from this plan;
- retries are enabled or Model Studio work is concurrent;
- declared request/token/wall ceilings are absent or weaker;
- the next request may cross a pool or campaign ceiling;
- approval or dashboard evidence is for another UTC day;
- a request type's complimentary classification is unknown;
- provider usage cannot be reconciled with the ledger;
- runtime artifacts are missing, corrupt, or outside the declared root;
- continuing requires an unplanned implementation change.

No B3 continuity run, multi-actor social sandbox, model-heterogeneous society,
visual campaign, or headline research claim is authorized here.

## Interpretation And Next Decision

- P0 failure means provider compatibility or billing classification is not ready.
- P1 artifact-complete failure is still a valid A5 result if attribution is
  truthful.
- A common blocker across models sends work back to the substrate.
- A model-specific failure justifies a bounded repair or model-choice decision,
  not a general capability claim.
- Only P3 evidence may justify a narrow robustness comparison.
- Stage 2 continuity starts only after a selected actor configuration has
  current Stage 1 evidence.
