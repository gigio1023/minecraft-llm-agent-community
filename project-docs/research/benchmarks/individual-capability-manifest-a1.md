# Slice A1 / A1R: Individual Capability Manifest And Typed Predicates

Search token: `CAPABILITY_MANIFEST_V1_A1`.

Status: **accepted after A1R repair** on `codex/capability-gated-social-sandbox-v4`
(2026-07-11). Provider-free. No live Minecraft server or provider call.

History:

- Initial implementation committed as `26c1f93f`
  (`probe: add individual-capability-manifest loader and predicates`).
- Review found evidence-rule counterexamples that still passed. A1 was reopened.
- A1R repaired the contract in a **new** commit after `26c1f93f`. This document
  was **not** part of `26c1f93f`; it was reconciled with the repair.

Authority:

- research direction:
  `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
- build order and acceptance:
  `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
- this page is an **implementation / reference note**, not the document that
  defines V4 research direction

## 1. Why this slice exists

V4 refuses to read social behavior from actors that cannot do basic Minecraft
work. Stage 1 therefore measures **individual Minecraft competence** with
dataset-free cases: a manifest declares goals, typed targets, milestones, and
budgets; the actor still chooses its own actions.

A1 is intentionally **not** the scientific headline. It is the competence
control so later social sandbox runs cannot launder Minecraft inability into
social claims.

## 2. What A1 / A1R delivered

| Piece | Path | Role |
| --- | --- | --- |
| Types | `probe/src/benchmarks/capability/types.ts` | manifest, closed evidence kinds, predicate algebra (no `evidence_kind_seen`) |
| Minecraft ids | `probe/src/benchmarks/capability/minecraftIds.ts` | normalize + validate through `minecraft-data("1.21.11")` |
| Loader | `probe/src/benchmarks/capability/loader.ts` | recursive allowlist validation, integer budgets, seed invariants, unique ids, capability DAG |
| Evidence bag | `probe/src/benchmarks/capability/evidenceBag.ts` | evidenced values with non-empty refs + `origin: setup \| run` |
| Predicates | `probe/src/benchmarks/capability/predicates.ts` | three-valued eval; no fabricated `settlement:*` refs; setup cannot pass |
| Public exports | `probe/src/benchmarks/capability/index.ts` | stable import surface |
| Suite | `probe/benchmarks/capability/individual-capability-v1.json` | `collect_logs` (incl. `pale_oak_log`), `craft_table`, `place_table` |
| Negative fixtures | `probe/benchmarks/capability/fixtures/` | id, budget, op, strategy, nested keys, fractional budgets, evidence kinds, seeds, dup ids, cycles, removed op |
| Tests | `probe/test/individualCapabilityManifest.test.ts`, `probe/test/capabilityPredicates.test.ts` | loader + offline predicate regressions |

## 3. A1R repairs (mandatory review findings)

### 3.1 Removed `evidence_kind_seen`

Arbitrary `fact.kind` + constraint matching could return `passed` for
`provider_rationale`. The op was removed from types, loader, evaluator, and
tests. Closed `allowed_evidence_kinds` rejects prose/video/screenshot kinds.

### 3.2 Evidence-bearing observed values

`CapabilityEvidenceBagV1` no longer stores bare inventory/held/position maps.
Each scoring surface uses `EvidencedValueV1<T>`:

```ts
{ value: T; evidence_refs: [string, ...string[]]; origin: "setup" | "run" }
```

A predicate may return `passed` only when the required value is present, refs
are non-empty, and `origin === "run"` (except scenario center anchors for
`position_within`, which may be setup while actor position remains run-owned).
Missing refs → `unknown`, never fabricated `settlement:inventory_counts` /
`settlement:held_item` / `settlement:actor_position`.

### 3.3 Strict recursive allowlist loader

Unknown keys are rejected at every object level (manifest, case, budgets,
predicates, milestones, seed/completion policies). Budgets use positive
integers. `fresh` seed policies may not carry seeds. Duplicate case/milestone
ids and `required_capabilities` cycles fail closed. Unknown suite capability
refs must use `external:<id>`.

### 3.4 Suite corrections

- `collect_logs` includes `pale_oak_log` (present in Minecraft 1.21.11 data).
- `place_table` documents that `position_ref: "placed_crafting_table"` must be
  bound by A2 to a **current-run** placement artifact; without run-origin named
  position + positioned block evidence, evaluation is `unknown`.

### 3.5 Setup cannot become progress

Fixture/setup inventory, blocks, and containers tagged `origin: "setup"` cannot
satisfy acquisition or placement targets.

## 4. Design decisions retained

- Manifest declares evaluation, not strategy (unknown keys / planner fields fail).
- Three-valued predicates: `passed | failed | unknown`.
- Offline bag evaluation, not furnace metrics as generic authority.
- Hand-written validate/assert/load pattern (no new schema dependency).
- Minecraft ids through `minecraft-data`, not custom synonym lists.
- `block_observed_at` requires positioned run-origin block facts.

### 4.1 Current long-horizon extension

Suite `1.4.0` adds `prepare_first_iron_batch` as the primary A5 case. The
minimal cases remain calibration and failure-localization probes; they are not
the main provider comparison.

The long case uses `first-iron-batch-flat-benchmark-v1` with empty starting
inventory and fixed exposed wood, stone, coal ore, and iron ore. Setup
availability is never progress. The final evaluator requires all of:

- `raw_iron >= 3`;
- `coal >= 1`;
- `stone_pickaxe` in inventory or hand;
- a current-run observed placed furnace.

Three raw iron is enough for the first iron pickaxe after smelting. The target
stops before smelting because furnace operation is not yet a verified runtime
action. `mine_block` now maps iron ore to raw iron and refuses iron extraction
without a stone-tier-or-better pickaxe.

`capability_progress.milestone_first_observations` records the first action,
cycle, wall time, provider request/token counts, and evidence refs for each
milestone. This preserves acquisition history for items later consumed by
crafting or placement.

## 5. How to use the API (offline)

```ts
import {
  loadIndividualCapabilityManifestFromFile,
  evaluateCapabilityPredicate,
  type CapabilityEvidenceBagV1
} from "../src/benchmarks/capability/index.js";

const manifest = loadIndividualCapabilityManifestFromFile(
  "benchmarks/capability/individual-capability-v1.json"
);

const bag: CapabilityEvidenceBagV1 = {
  schema: "capability-evidence-bag/v1",
  actor_id: "npc_a",
  inventory: {
    value: { oak_log: 2 },
    evidence_refs: ["evidence/cycle-0001-collect.json"],
    origin: "run"
  },
  available: {
    inventory: true,
    held_item: false,
    position: false,
    blocks: false,
    containers: false
  }
};

const result = evaluateCapabilityPredicate(manifest.cases[0].target, bag);
// result.status: "passed" | "failed" | "unknown"
```

## 6. Validation evidence for A1R

```bash
cd probe && bun test test/individualCapabilityManifest.test.ts test/capabilityPredicates.test.ts
cd probe && bun test
cd probe && bun run typecheck
cd docs && npm run build
git diff --check
```

Results at A1R acceptance: focused tests 29/29; full probe suite 607/607;
typecheck clean; docs build clean; no provider call.

## 7. Explicit non-goals (still out of A1)

- normalized `individual-capability-report/v1` builder (A2)
- capability CLI / live runner (A3)
- provider-backed batches (A5; requires quota preflight + user approval)
- goal continuity, interdependent social scenarios, phenomenon records
- editing `socialCycleRunner.ts` for free-form benchmark replacement

## 8. What A2 must take from this

1. Adapt saved social-cycle reports and actor workspace refs into
   `CapabilityEvidenceBagV1` with real artifact refs and correct `origin`.
2. Do not import furnace milestone scoring as generic schema authority.
3. Map clean runtime exit without target evidence to `failed` or
   `unverifiable`, never `passed`.
4. Keep fixture setup evidence out of actor progress credit.
5. Join budgets, usage, stalls, blockers, and failure classes onto the
   normalized report while reusing A1 predicate evaluation unchanged.
6. Do not weaken A1R to make old settlement-only artifacts pass; missing
   source refs remain `unverifiable`.

## 9. Related files

- Plan acceptance:
  `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
- Routing: `project-docs/orientation/agent-search-index.md` (`CAPABILITY_MANIFEST_V1_A1`)
- Successor prompt: `handoff-prompt.md` (repo root)
