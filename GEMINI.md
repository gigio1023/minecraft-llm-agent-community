# Gemini Agent Repo Guidance

`AGENTS.md` is the binding authority for this repository. This file exists so
Gemini-based agent sessions see the same operating rules quickly. If this file
and `AGENTS.md` disagree, follow `AGENTS.md` and update this file only when the
user has approved an operating-rule change.

## Read First

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `docs/blog-doc/Documentation-Map.md`
5. `docs/blog-doc/Agent-Search-Index.md`
6. `docs/blog-doc/Terminology.md`
7. `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md`
8. `docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md`

## Project Direction

This repo is a bounded, observable headless Minecraft runtime for a
Soul-grounded social simulation seed. It is not a Voyager clone, a Minecraft
benchmark project, or a house-building architecture.

Providers propose goals, actions, and judgments. Runtime code owns Minecraft
truth: schemas, structured args, permission gates, Mineflayer execution,
verification, artifacts, actor workspace state, and provider usage records.

PlanBeads are structured actor-owned work state for concerns an LLM actor would
otherwise forget or blur in free-form prose. They should make the NPC more
flexible under changing Minecraft/social context, not checklist-bound. Do not
let PlanBeads grant executable authority, action permissions, physical success,
or retry-constraint clearance.

## Change Discipline

Follow `KARPATHY_GUIDELINES` from `AGENTS.md`:

- state assumptions and success criteria before non-trivial work;
- prefer the simplest implementation that satisfies the current request;
- make surgical changes and avoid unrelated cleanup;
- verify with the smallest meaningful command, and use live runtime artifacts
  when behavior matters.

## Documentation Boundary

Docusaurus-exposed docs live under `docs/blog-doc/`. Repo-internal review and
agent-operation docs live at the project root. Historical research, old public
plans, and raw paper dumps live under `docs/research-archive/`.

Do not add new public docs under `docs/docs/`. Do not treat archived research as
an active build instruction unless an active spec or handoff promotes it.

## Provider Cost And Auth

Live provider calls must be explicit and usage-guarded. Gameplay Codex auth is
the repo-local game-runtime provider auth store, not Codex CLI login. Do not
inspect or print raw tokens.
