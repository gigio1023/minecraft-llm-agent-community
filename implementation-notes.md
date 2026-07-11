# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (successor after review `620955d8`)

## Current focus

Provider-free Work 1 (A3 budget stopping) and Work 2 (B2 artifact-bag loader)
are landed and adversarially repaired. Next gate is user provider approval for
A5 / B3 live. D2 still needs a real D1 selection (fixture ineligible).

Implementation style: default-strength `DietrichGebert/ponytail` at `14a0d79`
via the adaptation in the active implementation plan.

## Accepted (provider-free)

- A1R, A2, A3, A4, B1, B2
- C1/C2 declarations, C3 format/writer, D1 writer/index fixture
- B3 case declarations only (live blocked)

## Partial / blocked

- A5 / B3 live / live multi-actor: exact provider+model, estimate, preflight,
  and approval required
- D2: user must select a D1 candidate (fixture is not eligible)
- Push/PR: only on request
- Live restart survival: offline restart-observation writer exists; no current
  process-restart evidence yet

## Validation snapshot

- `cd probe && bun test` → 725 pass
- `bun run typecheck` → pass
- `cd docs && npm run build` → pass
- `git diff --check` → pass

## Recent commits (this successor wave)

| Commit | Work |
| --- | --- |
| `76db6cc0` | B2 strict artifact-bag loader + restart writer |
| `75a68ec9` | A3 case budget stopping |
| `83b26f85` | B2 assert bags at evaluate entry |
| `c4266841` | A3 budget-stop labeling + always observe wall time |

## Deviations

what the plan said
-> A1 accepted at `26c1f93f`
-> what the code revealed
-> evidence_kind_seen + fabricated settlement refs still passed review counterexamples
-> conservative choice
-> A1R repair commit; do not weaken for old artifacts
-> revisit
-> only if A2 discovers new evidenced surfaces (extend EvidencedValueV1)

what the completion summary said
-> C1/C2 had resolved capability evidence and B2 was accepted
-> what review found
-> social declarations pointed to manifest cases rather than current-run reports;
   restart-required continuity could pass from a single open-work record;
   A3 missing wall/request/token/cost stops; B2 missing bag loader
-> conservative choice
-> convert capability deps to declared gaps; require typed before/after reload;
   finish A3 stops + B2 loader before A5
-> revisit
-> after A5 reports and B3 live restart evidence

what adversarial review said after first A3/B2 land
-> non-wall stops labeled as runtime/actor failure; wall_time often unobserved;
   evaluateGoalContinuity accepted unvalidated bags
-> conservative choice
-> repair commits `c4266841` and `83b26f85`; do not mark complete from first land
-> revisit
-> only if live provider cancel needs deeper HTTP abort than pre-planning check

## Explanation doc

`project-docs/research/benchmarks/v4-implementation-explanation.md`
