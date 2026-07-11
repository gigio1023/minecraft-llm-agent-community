# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (full path A1R → D1; D2 requires user selection)

## Current focus

Provider-free code reaches D1 formats and fixtures. Review reopened B2 as
partial because its evaluator still lacks a strict saved-evidence loader.
Before the next user decision, A3 needs complete runtime stopping behavior and
B2 needs strict saved-evidence loading. Provider approval matters after those
two implementation gaps are closed. D2 remains a later user selection.

## Accepted (provider-free)

- A1R, A2, A4, B1
- C1/C2 declarations, C3 format/writer, D1 writer/index fixture
- B3 case declarations only (live blocked)

## Partial

- B2 offline evaluator: strict `goal-continuity-artifact-bag/v1` loader and
  runtime restart-observation writer still missing
- A3 runner: cycle/action limits are enforced, but manifest-specific wall-time,
  provider-request, token, and cost limits do not yet stop execution

## Blocked

- A5 / B3 live / live multi-actor: implementation gaps above must close, then
  exact provider+model, estimate, preflight, and approval are required
- D2: user must select a D1 candidate (fixture is not eligible)
- Push/PR: only on request

## Validation snapshot

- `cd probe && bun test` → 688 pass
- `bun run typecheck` → pass
- `cd docs && npm run build` → pass

## Deviations

what the plan said
-> A1 accepted at `26c1f93f`
-> what the code revealed
-> evidence_kind_seen + fabricated settlement refs still passed review counterexamples
-> conservative choice
-> A1R repair commit; do not weaken for old artifacts
-> revisit
-> only if A2 discovers new evidenced surfaces (extend EvidencedValueV1)

what the plan said
-> complete through live social observation
-> what reality revealed
-> no provider/model approved in this wave
-> conservative choice
-> finish all provider-free schemas/CLIs/fixtures; pause at A5/B3-live/D2 approval points
-> revisit
-> when user supplies exact provider approval

what the completion summary said
-> C1/C2 had resolved capability evidence and B2 was accepted
-> what review found
-> social declarations pointed to manifest cases rather than current-run reports;
   restart-required continuity could pass from a single open-work record
-> conservative choice
-> convert checked-in capability dependencies to explicit gaps; require typed
   before/after reload evidence; mark B2 partial until saved-evidence loading exists
-> revisit
-> after A5 produces normalized reports and B2 has a strict loader/runtime writer

## Explanation doc

`project-docs/research/benchmarks/v4-implementation-explanation.md`
