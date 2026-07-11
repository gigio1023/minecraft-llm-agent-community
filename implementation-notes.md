# V4 Implementation Notes

Branch: `codex/capability-gated-social-sandbox-v4`
Handoff: `handoff-prompt.md` (full path A1R → D1; D2 gated)

## Current focus

**A1R accepted.** Next: A2 normalized report adapter (provider-free).

## Assumptions (A1R) — resolved

1. Removing `evidence_kind_seen` is correct; no suite case uses it.
2. Evidence-bearing observed-value objects (`EvidencedValueV1`) chosen over parallel ref maps.
3. Closed `allowed_evidence_kinds` enum excludes prose/video/screenshot authority.
4. Dirty A1 docs preserved and reconciled with A1R.
5. Commit `26c1f93f` stays; A1R is a new commit.

## A1R validation

- focused: 29/29
- full probe: 607/607
- typecheck, docs build, diff-check: pass

## Deviations

what the plan said
-> A1 accepted at `26c1f93f` with fabricated settlement refs and open evidence_kind_seen
-> what the code or runtime revealed
-> review counterexamples still passed
-> the conservative choice taken
-> reopen A1, repair in A1R, do not weaken for old artifacts
-> when to revisit it
-> if A2 discovers more bag surfaces needed, extend EvidencedValueV1 fields without restoring prose matchers

## Provider-backed steps (A5/B3/C*)

Blocked until exact `(provider_id, model)`, estimate, preflight, and user approval.
