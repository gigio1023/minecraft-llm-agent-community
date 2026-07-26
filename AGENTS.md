# Repo Agent Notes

This file is the binding repo-agent guide. Keep it thin: put hard gates,
conflict rules, and routing here; put procedures in `.agents/skills/*/SKILL.md`
or canonical docs under `project-docs/`.

## Binding Authority

When guidance conflicts, prefer this order:

1. Current user instruction.
2. `SPEC.md`.
3. `AGENTS.md`.
4. `project-docs/specification/*`.
5. `project-docs/orientation/terminology.md`.
6. Active handoff, architecture, setup, and research docs routed by
   `project-docs/orientation/agent-search-index.md`.
7. Repo-local agent skills under `.agents/skills/`.
8. Global or external skills.

`CLAUDE.md` is only an adapter for Claude Code. `GEMINI.md` is intentionally not
part of this repo's active agent guidance surface.

<!-- gigio-project-setup:start -->
## Durable Project Intent

`PROJECT.md` is the durable intent digest for significant judgments and
completion claims. Consult it after `SPEC.md` and this file; it summarizes but
does not override their authority or the active V4 central and implementation
plans.

The human-owned top half of `PROJECT.md` requires current-turn user approval
before editing. Keep the model-updated bottom half current from repository
evidence and supersede settled decisions instead of silently relitigating them.

Local task plans live under the gitignored `.plans/` directory. Use
`gigio-write-plan` to plan sizable chosen work and `gigio-execute-plan` to
execute or resume one of those plans.
<!-- gigio-project-setup:end -->

## Read First

1. `SPEC.md`
2. `AGENTS.md`
3. `PROJECT.md`
4. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
5. `project-docs/orientation/documentation-map.md`
6. `project-docs/orientation/agent-search-index.md`
7. `project-docs/orientation/terminology.md`
8. Active docs selected from the search index for the task.

Do not bulk-read every long spec for narrow work. Use the search index and
agent skills to load the relevant slice.

## Mandatory Agent Skill Routing

Use repo-local agent skills for repeated workflows instead of re-inventing the
procedure in free form:

- Provider quota, reset-window, model availability, or live benchmark requests:
  use `.agents/skills/provider-quota-preflight/SKILL.md` before any provider
  HTTP request.
- Minecraft runtime run review, transcript analysis, visual evidence review,
  action-skill matrix failure, or behavior-loop diagnosis:
  use `.agents/skills/minecraft-agent-runtime-review/SKILL.md`.
- Experiment/report writing, HTML/static report preparation, model-comparison
  summaries, or "보고서" requests:
  use `.agents/skills/minecraft-run-report-author/SKILL.md`.
- Research direction, novelty, Goldilocks gates, paper-worthiness, or experiment
  design:
  use `.agents/skills/minecraft-research-value-harness/SKILL.md`.
- Mineflayer generated action source, helper allowlists, schemas, verifiers, or
  action-skill candidate review:
  use `.agents/skills/mineflayer-code-generation/SKILL.md`.

If a skill is triggered, read its `SKILL.md` before task actions. Skill
procedures are not executable authority; repo runtime schemas, gates, and
verification still decide behavior.

## External Skill Compatibility

External or global skills, including Ponytail-style minimalism or Matt
Pocock-style engineering/review skills, are advisory harnesses only. They must
not override:

- repo product direction;
- runtime authority and schema validation;
- provider-cost and quota gates;
- documentation governance;
- terminology;
- test strategy and evidence requirements;
- the ban on prose-derived executable authority.

If an external skill says "keep it simple", interpret that as the minimum
verified substrate that preserves evidence, quota checks, reports, and runtime
truth. Do not use it to skip required artifacts.

## TypeScript Runtime Rule

This repo is TypeScript-first and Bun is the only runtime for repo TypeScript.
Run `.ts` entrypoints with `bun run <path.ts>` or executable scripts whose
shebang is `#!/usr/bin/env bun`.

Do not execute repo `.ts` files with `node`, `ts-node`, `tsx`, `npx tsx`, or a
child process derived from `process.execPath`. Tests use `cd probe && bun test`;
type checks use `cd probe && bun run typecheck`.

Node may still be used for non-TypeScript host diagnostics such as
`node -p "process.platform + '/' + process.arch"` or for toolchains that are not
repo `.ts` entrypoints, but Node is not a runtime for this repo's TypeScript.

## Current Direction

This repository is a rebuild staging area for a bounded, observable headless
Minecraft runtime. It is not a Voyager clone, a fastest-tech-tree benchmark, a
house-building architecture, or a pre-committed village simulator.

The active research plan is
`project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
(V4, 2026-07-11, user-approved). It replaces the V3 lived-vs-told experiment
and its implementation plan, which are superseded audit trail and must not
drive builds or runs.

The active build order and acceptance gates live in
`project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
(`CAPABILITY_GATED_SOCIAL_SANDBOX_IMPLEMENTATION_PLAN`).

The active sequence is:

1. establish non-social Minecraft competence with dataset-free scenario
   benchmarks, target predicates, milestones, budgets, and runtime evidence;
2. establish autonomous goal continuity: intermediate goal creation,
   persistence, revision, interruption recovery, and evidence-grounded closure;
3. run capable actors in materially interdependent economic, cooperative, and
   quest scenarios without scripting their social response;
4. record long-run structured evidence, metrics, and synchronized video to
   discover recurring social phenomena;
5. select narrow controlled experiments only after a phenomenon is worth
   explaining.

Initial sessions should be small enough to debug and attribute. Actor count,
role assignment, model heterogeneity, and scenario pressure are adjustable
experimental parameters after the competence, continuity, and observability
surfaces work. Never use scale to hide missing individual capability,
interaction-poor scenarios, or unattributable evidence.

Standing requirements:

- produce truthful `transition-row/v1` records; labels come from runtime
  evidence, never from tool names, scenario text, or actor self-report;
- individual benchmark success comes from declared target-state predicates and
  verifier evidence, not provider prose or video;
- social scenarios must declare the individual capabilities they depend on and
  cite current benchmark evidence for them;
- goal continuity artifacts may prove retained work state but never physical
  completion without runtime evidence;
- interdependent scenarios may create reasons to exchange, cooperate, compete,
  or negotiate, but must not prescribe the observed social conclusion;
- social-response windows close only after each other active actor completed
  at least one subsequent Actor Turn slot or a declared timeout;
- log `(state_before, executed_action, observed_delta)` independently of the
  actor's self-declared expected outcome;
- keep prediction quality, acting outcome (intent), physical competence
  (execution), social consequence, continuity, robustness, and efficiency
  separate in reports.
- screenshots and video are review evidence paired with same-run structured
  artifacts; pixels alone never prove Minecraft or social state;
- discovery runs may iterate without a global preregistered kill condition, but
  scenario versions, negative runs, and alternative explanations must remain
  visible;
- benchmark, logging, verification, and sandbox construction are systems or
  measurement work until a recurring phenomenon supports a controlled claim.

The old V3 lived-vs-told, V2 co-actor-legibility, and WAM-era branches are
historical inputs only. Prediction or legibility may return as a mechanism in a
future controlled study, but not because an older plan already exists. "WAM"
remains retired as a banner term.

Runtime evidence, verification, screenshots, ledgers, seed/reset records, and
scoring scripts are mandatory audit hygiene. Do not present them as the
research contribution by themselves.

## Zero-Cost Implementation Rule

Search token: `ZERO_COST_IMPLEMENTATION_RULE`.

All repo implementation is produced with AI coding tools. For direction,
design, and review decisions, treat marginal implementation cost as near zero.

Consequences:

- "It is already implemented / already written / already designed" is never
  evidence for keeping a direction, architecture, schema, pipeline, protocol,
  or document. Sunk implementation is an anti-pattern rationale and must be
  rejected wherever it appears in plans, reviews, or handoffs.
- Direction and design decisions must be argued from research value,
  falsifiability, baseline pressure, and current evidence, as if a
  from-scratch rebuild were free. Re-derive the decision; do not inherit it.
- Prefer replacing or deleting wrong-shaped artifacts over accreting
  compatibility layers around them. Preserve the audit trail by superseding
  and archiving, not by keeping stale artifacts active.
- The converse guard also holds: free implementation is not license for fake
  ambition. More code, schemas, protocols, gates, or documents is not more
  research. Volume earns nothing.
- Zero cost applies to implementation labor only. Provider tokens, quotas,
  live-run budgets, recorded run evidence, data integrity, and user attention
  remain scarce. The provider quota preflight, runtime authority gates, and
  evidence rules stay fully binding.

## Runtime Authority Gates

Runtime code owns Minecraft truth. Provider text, memory notes, PlanBeads,
Action Card descriptions, Minecraft Basic Guide prose, and rationale fields are
context only.

Never parse LLM-facing prose with string `includes`, regexes, keyword lists, or
similar heuristics to decide:

- tool visibility or action eligibility;
- primitive arguments;
- permissions;
- retry clearance;
- generated-code authority;
- physical success.

Use strict tool calls, schemas, enums, typed state, permission gates, retry
constraints, Mineflayer execution, verifier output, transcript artifacts, and
actor workspace evidence.

Do not add hidden Minecraft domain planners. Do not pre-select actions through
`decision_frame`, material-family summaries, construction-readiness, shelter
phases, survival-priority filters, `deposit_candidates`, open-social-request
summaries, or other provider-facing candidate compression. Use typed facts and
source evidence cards instead.

Physical actions require structured executable parameters before execution. Do
not silently convert missing target/item/count args into movement or gameplay
defaults. Reject, repair, or ask for a valid action, then record the contract
failure.

## Action Skill Authoring Gate

New Minecraft action skill creation during social-cycle runtime must originate
only from Actor Turn action selection via `author_mineflayer_action`.

Background reviewers, async sidecars, PlanBead operations, archived generated
source importers, and offline maintenance scripts must not originate new NPC
action skill candidates during runtime. They may review, patch, reject, retire,
supersede, promote, or re-trial an existing Actor Turn candidate with evidence.

Generated Mineflayer candidates must be schema-bound, helper-limited, timed,
verified, and recorded in actor workspace evidence. A passed trial is not active
action skill authority until lifecycle promotion succeeds.

Use:

- `project-docs/runtime/actor-turn/actor-turn-tool-calling-and-full-context-codegen.md`
- `project-docs/runtime/action-skills/action-selection-gated-action-skill-authoring-plan.md`
- `.agents/skills/mineflayer-code-generation/SKILL.md`

## PlanBeads Authority Boundary

PlanBeads are structured actor-owned work state for continuity under changing
Minecraft/social context. They are not executable authority and must not supply
missing primitive args, action permissions, physical success, retry clearance,
or generated-source authority.

CycleJudgment may carry malformed PlanBead operation candidates. The guarded
PlanBead applier owns per-operation validation and must record accepted or
rejected operation artifacts instead of hiding proposal failures.

PlanBeads are repo-owned TypeScript/JSON actor-workspace records. Do not shell
out to `bd`, `br`, `beads-mcp`, `.beads`, or downloaded Beads binaries for NPC
state.

## Provider Cost And Quota Gate

Live provider calls must be explicit, budgeted, and auditable.

Before any provider-backed benchmark, long run, model comparison, or "can we run
this model?" request, run the `provider-quota-preflight` agent skill and its
script with the exact `(provider_id, model)` candidates and whole-run estimate.

Treat these statuses as not runnable:

- `blocked`
- `unbudgeted`
- `needs_dashboard_approval` unless the user explicitly approves after checking
  the provider dashboard

OpenAI API is never approved by local ledger alone. Dashboard/free-tier state or
explicit user approval is required before an OpenAI provider-backed run.

Provider budget blockers are provider setup/budget blockers, not actor behavior
or action skill failures. Reports and final answers for provider-backed runs
must include the preflight result or explain why the run was provider-free.

## Report Authoring Gate

For experiment reports, model-comparison reports, HTML/static reports, or run
summaries, use `minecraft-run-report-author` before drafting.

Reports must separate:

- what was run: command, scenario, seed, provider/model, cycle count, visual
  profile, and actor;
- what was recorded: report JSON, actor workspace, provider snapshots, evidence
  refs, visual artifacts, retry constraints, and usage ledger;
- what happened: outcome counts, verified mutations, blockers, loops, social
  signals, and durable state changes;
- what is not proven: missing refs, weak screenshots, provider failures, budget
  caveats, stale artifacts, or local-only assets;
- what to do next: one narrow follow-up experiment or code fix.

Screenshots are review-only evidence. Never infer block identity, material
state, progress, or social consequence from pixels alone. Pair screenshots with
same-cycle or neighboring runtime evidence.

## Research And Reference Boundary

External Minecraft-agent, LLM-agent, Codex/MCP, Ponytail, Matt Pocock, Voyager,
MineDojo, ReAct, Reflexion, Generative Agents, SayCan, SWE-agent, or similar
references are mechanisms to adapt, not product specs to copy.

When using literature or external agent guidance, state both:

1. what the reference teaches mechanically;
2. how this repo should adapt or reject it under Soul/LifeGoal continuity,
   social-material Minecraft constraints, runtime evidence, and provider
   authority rules.

Reject recommendations that make actors ignore Soul/LifeGoal continuity,
relationships, obligations, material stakes, or social consequences in favor of
generic task completion.

## Documentation Governance

`SPEC.md` and `project-docs/specification/*` are long-term specs. `AGENTS.md` is
binding repo-agent guidance. `CLAUDE.md` is a short adapter. Editing any of
these files changes product direction or agent operating rules and requires the
user's current-turn approval.

Keep these aligned when their authority surface changes:

- `SPEC.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `project-docs/orientation/overview.md`
- `project-docs/orientation/documentation-map.md`
- `project-docs/orientation/terminology.md`
- `project-docs/orientation/agent-search-index.md`

Internal docs live under `project-docs/`. Public Docusaurus docs live under
`docs/public-docs/`. Literature references and raw source material live under
`project-docs/references/`. Superseded plans and historical public docs live
under `project-docs/archive/`.

Do not add new public docs under `docs/docs/`. Do not put internal setup notes,
provider access, budget state, dated handoffs, or agent operating rules under
`docs/public-docs/` or `docs/blog/`.

## Terminology

Use `project-docs/orientation/terminology.md` as normative vocabulary.

Required distinctions:

- `agent skill`: Codex/Claude-style capability under `.agents/skills/*/SKILL.md`.
- `action skill`: Minecraft/Mineflayer behavior validated, executed, verified,
  and recorded by the runtime.

Do not use bare `skill` where the meaning could be confused. Avoid AI-slop terms
listed in the terminology doc.

## Platform-Sensitive Execution

This repo moves between Apple Silicon macOS and Linux ARM. Before platform-
sensitive setup, check:

```bash
uname -s
uname -m
node -p "process.platform + '/' + process.arch"
docker info
```

Platform-sensitive work includes Docker/Compose, Podman, Colima, OrbStack,
`DOCKER_HOST`, native dependencies, Java/Minecraft server startup, file
watchers, executable permissions, auth flows, exposed ports, and browser/device
auth. Record environment blockers with command, platform, and failure mode.

## Thinking And Change Discipline

Search token: `KARPATHY_GUIDELINES`.

Before non-trivial edits, state assumptions, intended change boundary, and
verifiable success criteria. Prefer the smallest implementation that solves the
current request. Touch only files required by the request and required
alignment. Do not add speculative abstractions, provider paths, action skills,
or domain planners.

For behavior work, do not stop at green unit tests. Prefer truthful runtime
artifacts: reports, helper events, verifier output, actor workspace files,
transcripts, and provider usage records. If verification cannot run, record the
exact command and blocker.

## Testing Rules

Keep tests small, direct, and Detroit-style. Use them to reject fake success and
hidden dependencies. A test that would pass after real logic is broken should be
rewritten or deleted.

When behavior matters, current-run evidence is stronger than broad mocks or
snapshot-heavy suites.

## Commit And Push Discipline

After completing requested repo changes, commit the work before the final
response unless the user explicitly asks to leave it uncommitted, the work is an
exploratory diff for review, or a blocking condition must be reported first.

Important completed work must not remain only as local dirty state. Important
work includes provider-backed experiments, reports, architecture/governance
changes, active plan updates, runtime contract changes, transition-row or
seed/reset artifacts, and work the user asks to record.

Follow `CONTRIBUTING.md`: scoped commits, precise subjects, and bodies with
`Why:`, `What changed:`, `Validation:`, and `Notes:` when useful. Commit bodies
for non-trivial work must be detailed enough that `git log --show` explains the
work without opening the full diff. Do not sweep unrelated dirty files into
commits.

## User Communication

Use the user's language when practical. For this repo, Korean explanations are
often appropriate, while file paths, commands, schema names, and canonical
terms stay exact.

For non-trivial work, report:

- what was inspected or changed;
- why it mattered under repo rules;
- what evidence or command output supports the result;
- what remains blocked, risky, stale, or intentionally deferred.
