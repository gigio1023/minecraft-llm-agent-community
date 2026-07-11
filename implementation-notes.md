# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (full path A1R → D1; D2 gated)

## Current focus

Provider-free path through D1 is landed. Next user decisions: A5 provider
approval, B3 live continuity, or D2 phenomenon selection.

## Accepted (provider-free)

- A1R, A2, A3, A4, B1, B2, C1, C2, C3, D1
- B3 case declarations only (live blocked)

## Blocked

- A5 / B3 live / live multi-actor: need exact provider+model, estimate, preflight, approval
- D2: user must select a D1 candidate (fixture is not eligible)
- Push/PR: only on request

## Validation snapshot

- `cd probe && bun test` → 675 pass
- `bun run typecheck` → pass

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
-> finish all provider-free schemas/CLIs/fixtures; pause at A5/B3-live/D2 gates
-> revisit
-> when user supplies exact provider approval

## Explanation doc

`project-docs/research/benchmarks/v4-implementation-explanation.md`
