# Contributing

This repository is in an active migration toward a small, runtime-owned,
 headless Mineflayer probe. Contributions should keep that direction explicit in
 both code and commit history.

## Core Rules

- Keep changes small, reversible, and scoped to one clear purpose.
- Prefer runtime-owned behavior over prompt-only behavior.
- Do not mix unrelated cleanup with feature work.
- Do not revive the old Voyager architecture as the active implementation path.
- Keep tests Detroit-style: small, direct, and focused on real owned behavior.

## Commit Scope

Split work into separate commits when the scope changes, for example:

- docs and planning
- runtime contract changes
- gameplay primitives and curriculum
- shared storage / role / bulletin logic
- transcript or memory architecture

If a reviewer cannot explain the purpose of a commit from `git log --oneline`
 plus the commit body, the commit message is too weak.

## Commit Message Format

Use detailed commit messages.

### Subject line

Format:

```text
<area>: <imperative summary>
```

Examples:

```text
docs: add contribution rules and NPC society implementation spec
probe: add early-game curriculum and runtime-owned crafting progression
probe: add shared chest ledger, role contracts, and team bulletin slice
```

Subject line rules:

- make the area meaningful, such as `docs`, `probe`, `runtime`, `transcript`
- use an imperative verb: `add`, `refactor`, `wire`, `normalize`, `document`
- describe the real work, not a vague status like `update stuff`
- make it specific enough that the log is readable without opening the diff

## Commit Body Format

Every non-trivial commit should include a body with these sections:

```text
Why:
- <problem or motivation>

What changed:
- <concrete change 1>
- <concrete change 2>

Validation:
- <command run>
- <command run>
```

Optional section when useful:

```text
Notes:
- <follow-up, limitation, or intentional omission>
```

## Commit Content Rules

- Stage only the files that belong to the commit's stated scope.
- Do not include unrelated workspace noise.
- Do not commit generated outputs, credentials, or temporary artifacts unless
  they are explicitly required and safe.
- If a change depends on another change, make that dependency obvious in commit
  order.

## Validation Expectations

At minimum, run the most relevant validation for the files you touch.

For `probe/` work, this usually means:

```text
cd probe && bun test
cd probe && bun run typecheck
```

If only a narrow slice changed, targeted test commands are encouraged before the
 full suite.

## Pull Request Expectations

- The PR title should be as informative as the top commit subject.
- The PR description should summarize the intent, notable changes, validation,
  and known limitations.
- Reviewers should be able to follow the implementation by reading the commits
  in order.
