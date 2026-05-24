# Contributing

This repository is in an active migration toward a small, runtime-owned,
headless Mineflayer probe and Soul/LifeGoal social-cycle runtime. Contributions
should keep that direction explicit in code, docs, tests, and commit history.

## Core Rules

- Keep changes small, reversible, and scoped to one clear purpose.
- Prefer runtime-owned behavior over prompt-only behavior.
- Do not mix unrelated cleanup with feature work.
- Do not revive the old Voyager architecture as the active implementation path.
- Keep tests Detroit-style: small, direct, and focused on real owned behavior.
- Treat `SPEC.md` and `docs/docs/Specification/*` as long-term spec files. Do
  not fold volatile run status into them.
- Use `docs/docs/Terminology.md` terms in docs, comments, prompts, and reports.

## Commit Scope

Split work into separate commits when the scope changes. A reviewer should be
able to read `git log --oneline` and understand the development sequence without
opening every diff.

Good commit boundaries include:

- spec and documentation governance;
- terminology normalization;
- runtime contract or schema changes;
- gameplay primitive or action-skill verification changes;
- social-cycle provider prompt/context changes;
- memory, relationship, or actor workspace persistence changes;
- dashboard or server lifecycle changes;
- tests for one owned behavior or regression.

Do not hide unrelated work inside a broad commit such as `misc`, `cleanup`, or
`update`. If two changes could be reverted independently, they usually deserve
separate commits.

## Commit Message Format

Use detailed commit messages.

### Subject line

Format:

```text
<area>: <imperative summary>
```

Examples:

```text
docs: split long-term spec and document architecture authority
runtime: add settlement state to social-cycle context
probe: verify shelter probes from live actor position
docs: normalize action skill terminology across handoff docs
```

Subject line rules:

- make the area meaningful, such as `docs`, `probe`, `runtime`, `transcript`
- use an imperative verb: `add`, `refactor`, `wire`, `normalize`, `document`
- describe the real work, not a vague status like `update stuff`
- make it specific enough that the log is readable without opening the diff
- avoid status-only messages like `fix tests`, `update docs`, or `wip`

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

Example:

```text
runtime: add settlement state to social-cycle context

Why:
- The social-cycle provider was receiving raw local context without a compact
  runtime-owned settlement progress vector.
- Checklist success must come from evidence, not provider text.

What changed:
- Add settlement-state/v1 and settlement-checklist/v1 domain records.
- Include blocker histograms, known positions, shared storage, and action-skill
  readiness in social-cycle context and reports.
- Record postcondition results for action-skill bundle execution.

Validation:
- cd probe && bun test
- cd probe && bun run typecheck
```

## Commit Content Rules

- Stage only the files that belong to the commit's stated scope.
- Do not include unrelated workspace noise.
- Do not commit generated outputs, credentials, or temporary artifacts unless
  they are explicitly required and safe.
- If a change depends on another change, make that dependency obvious in commit
  order.
- Keep generated or ignored run artifacts out of commits unless the repo
  explicitly tracks them as documentation fixtures.
- When a branch has broad work, prefer several coherent commits over one giant
  commit. The branch can still be reviewed as one PR.

## Validation Expectations

At minimum, run the most relevant validation for the files you touch.

For `probe/` work, this usually means:

```text
cd probe && bun test
cd probe && bun run typecheck
```

For docs work, run:

```text
cd docs && npm run build
```

For action-skill or Minecraft runtime work, include at least one relevant live
or deterministic runtime command in the commit body or PR description when
available. Historical transcript audits are useful, but do not label them fresh
current-run proof.

If only a narrow slice changed, targeted test commands are encouraged before the
 full suite.

## Pull Request Expectations

- The PR title should be as informative as the top commit subject.
- The PR description should summarize the intent, notable changes, validation,
  and known limitations.
- Reviewers should be able to follow the implementation by reading the commits
  in order.
- If `gh` or GitHub app tooling is unavailable, still keep local commit messages
  complete enough that a later PR can use `--fill` safely.
