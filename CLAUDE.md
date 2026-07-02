# Claude Code Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file is only a
Claude Code adapter so Claude sessions find the repo rules quickly. If this file
and `AGENTS.md` disagree, follow `AGENTS.md`.

## Read Order

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/orientation/documentation-map.md`
5. `project-docs/orientation/agent-search-index.md`
6. `project-docs/orientation/terminology.md`
7. Task-relevant docs routed by the search index or repo-local agent skills.

`GEMINI.md` no longer exists and is not part of the active guidance surface.

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
