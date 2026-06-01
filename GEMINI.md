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
9. `docs/blog-doc/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`

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

CycleJudgment may carry raw PlanBead operation proposal candidates. A malformed
candidate should remain visible as a rejected operation-result artifact from the
guarded PlanBead applier, not disappear by failing the whole judgment.

PlanBeads are Beads-inspired TypeScript/JSON runtime records in actor
workspaces. They are not external Beads CLI integration, and this runtime must
not require `bd`, `br`, `beads-mcp`, `.beads`, or downloaded Beads binaries for
NPC state.

## Action Skill Authoring

During social-cycle runtime, new Minecraft action skill creation starts only
when the action planner chooses `author_and_trial_action_skill`. Background
reviewers, PlanBeads, async sidecars, and legacy generated-code importers may
review, patch, re-trial, reject, promote, retire, or supersede an existing
candidate, but they must not originate a new NPC action skill candidate.

Generated Mineflayer code should be used through that explicit author-and-trial
path with schema-bound parameters, generated TypeScript source, helper API
version, timeout, verifier, failure modes, promotion policy, helper-event
evidence, and post-observation. Prose never supplies missing executable
parameters.

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
