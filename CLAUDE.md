# Claude Code Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file is only a
Claude Code adapter so Claude sessions find the repo rules quickly. If this file
and `AGENTS.md` disagree, follow `AGENTS.md`.

## Read Order

1. `SPEC.md`
2. `AGENTS.md`
3. `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
4. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
5. `project-docs/orientation/documentation-map.md`
6. `project-docs/orientation/agent-search-index.md`
7. `project-docs/orientation/terminology.md`
8. Task-relevant docs routed by the search index or repo-local agent skills.

`GEMINI.md` no longer exists and is not part of the active guidance surface.

## Current Direction (pointer)

Active target: the capability-gated Minecraft social sandbox
(`ACTIVE_CENTRAL_PLAN`, V4 2026-07-11). First verify individual Minecraft
competence and autonomous goal continuity; then run capable actors in
interdependent economic, cooperative, and quest scenarios; record long-run
evidence, metrics, and video; and choose controlled studies from recurring
phenomena. Standing requirements live in `AGENTS.md` (Current Direction) and
the V4 plan above. The V3 lived-vs-told and V2 co-actor-legibility plans are
superseded audit trail; do not build or run from them.

## Use Repo-Local Agent Skills

Use `.agents/skills/*/SKILL.md` for repeated procedures instead of duplicating
them here:

- provider quota checks: `.agents/skills/provider-quota-preflight/SKILL.md`
- run/report authoring: `.agents/skills/minecraft-run-report-author/SKILL.md`
- runtime review: `.agents/skills/minecraft-agent-runtime-review/SKILL.md`
- research direction: `.agents/skills/minecraft-research-value-harness/SKILL.md`
- Mineflayer codegen: `.agents/skills/mineflayer-code-generation/SKILL.md`

## Non-Negotiable Rules

Runtime code owns Minecraft truth. Provider prose, memory, PlanBeads, report
text, screenshots, and rationale fields do not supply executable parameters,
permissions, physical success, retry clearance, or generated-source authority.

Do not parse LLM-facing prose with string heuristics to decide runtime policy.
Use schemas, typed state, tool calls, permission gates, retry constraints,
Mineflayer execution, verifier output, and artifacts.

Live provider calls require the repo quota preflight. OpenAI API calls require
dashboard or explicit user approval when the preflight says so.

Repo TypeScript runs on Bun only. Use `bun run <path.ts>`, `bun test`, and
`bun run typecheck`; do not execute repo `.ts` files through `node`, `ts-node`,
`tsx`, `npx tsx`, or `process.execPath`.

Implementation here is AI-generated; treat marginal implementation cost as
near zero. "It is already implemented" is never a reason to keep a direction,
design, schema, or document — sunk implementation is an anti-pattern
rationale. Argue every direction decision from research value, falsifiability,
baselines, and current evidence, as if a from-scratch rebuild were free. The
converse also holds: more code or docs is not more research. Provider tokens,
quotas, recorded run evidence, and data integrity remain scarce and gated.
Binding detail: `AGENTS.md` (`ZERO_COST_IMPLEMENTATION_RULE`).

## Commit Discipline

After completing requested repo changes, commit the work before the final
response unless the user explicitly asks to leave it uncommitted, the work is an
exploratory diff for review, or a blocker must be reported first.

Follow `CONTRIBUTING.md` for commit scope, subject lines, and detailed commit
bodies. Non-trivial commit bodies must include `Why:`, `What changed:`, and
`Validation:` so the commit log explains the work without opening the full diff.

## External Skill Conflict Rules

Global skills such as Ponytail or Matt Pocock-style skills are advisory only.
They must not override `AGENTS.md`, repo-local agent skills, provider quota
gates, runtime authority, documentation governance, terminology, or evidence
requirements.

Interpret external minimalism as the smallest verified repo-compliant change,
not as permission to skip reports, quota checks, runtime artifacts, or tests.
