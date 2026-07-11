# V4 Capability-Gated Social Sandbox — Implementation Explanation

Search token: `V4_IMPLEMENTATION_EXPLANATION_2026_07_11`.

Branch: `codex/capability-gated-social-sandbox-v4`  
Date: 2026-07-11  
Authority: `handoff-prompt.md` + active V4 central/implementation plans.

This page explains **what was built in this handoff wave, why, and what is
still blocked**. It is an implementation/reference note, not a replacement for
the central research plan.

## 1. Highest accepted milestone

Provider-free substrate through **D1 schemas/fixtures** is landed and tested.

| Slice | Status | Meaning |
| --- | --- | --- |
| A1R | accepted | Evidence-rule repair of A1 |
| A2 | accepted | Normalized capability report adapter |
| A3 | accepted | Capability CLI + provider-free smoke |
| A4 | accepted | Basic suite 1.1.0 → later 1.2.0 with B1 |
| A5 | **blocked** | Needs exact provider/model + preflight + approval |
| B1 | accepted | Multi-hop furnace case (manifest-owned) |
| B2 | accepted | Goal-continuity offline evaluator |
| B3 | declarations only | Live runs blocked pending approval |
| C1 | accepted | Interdependent social scenario declaration |
| C2 | accepted | Economic / cooperative / quest families |
| C3 | accepted | Long-run observation bundle (offline) |
| D1 | accepted | Phenomenon catalog + fixture record |
| D2 | **not started** | Requires user-selected D1 phenomenon |

**Do not call V4 complete.** Live capability batches (A5), live continuity runs
(B3), and live multi-actor sandboxes still lack current-run provider-backed
evidence. Schemas and offline smokes are not substitutes for those steps.

## 2. Why this shape

V4 refuses to read social conclusions from actors that cannot do Minecraft work
or keep goals continuous. The build order therefore:

1. make individual competence measurable with typed targets and real evidence;
2. normalize reports so clean process exit cannot fake success;
3. run cases through one declaration-first CLI;
4. add multi-hop and continuity contracts offline;
5. declare interdependent social scenarios without scripting response;
6. define joinable long-run observation and a phenomenon catalog.

Sunk A1 code that fabricated `settlement:*` refs or accepted `provider_rationale`
via `evidence_kind_seen` was **replaced**, not papered over (`ZERO_COST_IMPLEMENTATION_RULE`).

## 3. Commits in order (this wave)

| Commit | Slice |
| --- | --- |
| `2d8dd0f1` | A1R — repair evidence rules |
| `e6c511ae` | A2 — report adapter |
| `1d449fc0` | A3 — runner + smoke |
| `6e5ee5e6` | A4 — suite 1.1.0 |
| `c8cf81b5` | B1 — furnace multi-hop |
| `1bad75d1` | B2 — continuity offline |
| `37edf54b` | C1 — social declaration |
| `d9c82f7b` | C2 — three scenario families |
| `ce91e191` | C3 — observation bundle |
| `755c925b` | D1 — phenomenon catalog |
| `ea9bae2e` | B3 — offline continuity case stubs |

Prior on branch: `26c1f93f` (initial A1), `2c7f2193` (handoff rewrite).

## 4. Module map

```text
probe/src/benchmarks/
  capability/     A1R–A4, B1 (manifest, predicates, report, runner, CLI)
  continuity/     B2–B3 declarations (offline evaluator)
  social/         C1–C2 (scenario declaration + families)
  observation/    C3 (long-run bundle)
  phenomenon/     D1 (catalog)

probe/benchmarks/
  capability/individual-capability-v1.json   (1.2.0, includes furnace hop)
  continuity/goal-continuity-v1.json         (1.1.0, 3 cases; live blocked)
  social/interdependent-social-v1.json
  social/scenarios/{economic,cooperative,quest}-*.json
  observation/fixtures/...
  phenomenon/fixture-asymmetric-tool-share-v1.json
```

CLI:

```bash
cd probe && bun run probe:capability -- \
  --manifest benchmarks/capability/individual-capability-v1.json \
  --case collect_logs \
  --provider deterministic-social \
  --model deterministic-social \
  --out tmp/capability-smoke
```

## 5. Design decisions that matter

### Evidence is run-owned or it is unknown

`CapabilityEvidenceBagV1` uses `EvidencedValueV1` with non-empty artifact refs and
`origin: setup | run`. Setup/fixture inventory cannot satisfy acquisition.
Predicates never invent `settlement:*` strings.

### Prose cannot decide targets

`evidence_kind_seen` was removed. Closed `allowed_evidence_kinds` rejects
provider rationale, memory, video, and screenshots as physical authority.

### Dual status on reports

`runtime_status` and `interpretation_status` are separate. Clean social-cycle
exit without a passed target → `failed` or `unverifiable`, never capability
`passed`.

### Manifests declare evaluation, not strategy

Recursive allowlists reject unknown keys, action orders, recipe steps, and
prescribed social outcomes.

### Social scenarios create pressure, not conclusions

C1/C2 declare asymmetry, activities, and interaction opportunities. They do not
require cooperation, refusal, or partner choice. Opportunity observation enums
keep absent / ignored / attempted / verified distinct for later reports.

### Phenomenon promotion is human-gated

D1 writers default to `candidate`. `selected_for_followup` requires explicit
`reviewer_decision` from `user` or `delegated_reviewer`. The checked-in record
is a **fixture**, not a research result.

## 6. Validation evidence

```bash
cd probe && bun test          # 675 pass (at landing)
cd probe && bun run typecheck
git diff --check
```

Provider-free smoke: `probe/test/capabilityRunnerSmoke.test.ts`.

No live provider HTTP was used in this wave.

## 7. Still blocked / awaiting user

1. **A5** — choose exact `(provider_id, model)`, estimate tokens/RPM, run
   `provider-quota-preflight`, approve, then run a declared batch.
2. **B3 live** — same gate for continuity cases (declarations exist).
3. **Live C2/C3 runs** — multi-actor Minecraft + video capture after capability
   evidence for prerequisites exists.
4. **D2** — only after you select a real D1 candidate (not the fixture).
5. **Push / PR** — not done unless you ask.

## 8. Next smallest action

If continuing without a provider yet: wire a continuity offline smoke CLI
mirroring A3, or harden C3 metric writers against real multi-actor report
fixtures.

If ready for live work: approve one A5 `(provider, model, budget)` and run
`provider-quota-preflight` first.

## 9. Related docs

- Central plan: `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
- Implementation plan: `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
- A1/A1R detail: `project-docs/research/benchmarks/individual-capability-manifest-a1.md`
- Work log: `implementation-notes.md`
- Handoff: `handoff-prompt.md`
