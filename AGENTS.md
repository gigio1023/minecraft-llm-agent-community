# Repo Agent Notes

## Active Central Plan (2026-06-27)

The current central plan for this repository is
`project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
(search token `ACTIVE_CENTRAL_PLAN`). Read it before planning new runtime,
predictor, benchmark, or experiment work. It reconciles the dated review in
`project-docs/research-archive/2026-06-27/wam-direction-stress-test-and-reframe/`
(reports `00`-`08`) into one decision-gated sequence:

1. Do not pick a research headline yet. Three framings are live and none is
   provable today: a native action-consequence model (F-native), an advisory
   predictor improved by a verifier-grounded loop (F-loop), and unprompted
   sociality from colliding individual goals (F-society).
2. Build the no-regret core first, because all three need the same thing: a
   non-degenerate 2-3 actor Minecraft runtime that emits per-layer-tagged
   transition rows `(state, action, observed_delta incl. other-actor response)`,
   recorded INDEPENDENTLY of the actor's self-declared `expected_outcome`, under
   the free-tier budget. Fixing the 60-cycle degeneracy is the first task.
3. Run the Goldilocks prediction preflight for F-native/F-loop: does a layer
   exist where the LLM prior is insufficient AND the signal is learnable from
   observed history? Use the separate society-observable preflight for F-society;
   prediction lift alone must not prove or kill the society branch.
4. Defer the loop, the three ledgers, and any foundation-model training until the
   gate returns. Do not build the cathedral before the soil test.

Where it conflicts, this supersedes: the "advisory social-material WAM / empty
cell" HEADLINE framing below and in
`project-docs/Specification/Advisory-Social-Material-WAM.md`; the advisory-ONLY
constraint as a research wall (the central object may be coupled to action and
measured by capability ablation, while the separate-measurement rule is kept);
and the phase ordering in
`project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
(the preflight now precedes the loop and the ledgers).

This does NOT change runtime authority. Verifier-owns-truth, schema/permission
validation, the prose-parsing anti-pattern ban, and the rule that provider /
predictor / PlanBead text never supplies executable parameters or bypasses
runtime checks all still bind. "Advisory wall reopened" is a research-framing
change, not permission for any model output to skip validation.

The "WAM" banner name is historical context in older docs. It is taken and
inverted in robotics (a "World Action Model" there is a policy), so new active
direction docs should prefer concrete names such as action-consequence model,
social-material transition model, advisory consequence predictor, or
`transition-row/v1` depending on the object being discussed.

## Current Direction

This repository is a rebuild staging area for a headless Minecraft runtime
loop.

Do not revive the old Voyager-style architecture as the active path.

The current implementation goal is not a full village simulator and not a
pre-committed WAM/predictor paper. It is the no-regret core from the active
central plan: a small, bounded, observable runtime that can produce truthful
`transition-row/v1` records from a non-degenerate 2-3 actor Minecraft runtime
under the free-tier budget.

Minecraft task completion is a competence gate, not the final research target.
The project goal for the next phase is to test whether a Goldilocks layer exists:
a layer where the LLM prior is insufficient and observed Minecraft history adds
learnable signal. Only after that gate should the repo consider a larger
confirming experiment for F-native, F-loop, or F-society.

For F-society, use `project-docs/Architecture/Society-Observable-Preflight.md`
as the separate branch gate. It asks whether recurring evidence-gated
social-material patterns appear under small embodied constraints. It is not
settled by prediction lift alone.

Immediate target:

- reproduce and root-cause the 60-cycle degeneracy rather than treating it as
  social behavior;
- run a 2-3 actor scenario that produces varied, non-repeating transitions;
- add an independent `transition-row/v1` logger that records
  `(state_before, executed_action, observed_delta)` without using the actor's
  self-declared `expected_outcome` as the target;
- capture other-actor observable responses inside bounded windows;
- keep provider/cost usage within the free-tier discipline.

Candidate north stars, not yet selected:

- F-native: a native action-consequence model that learns action -> consequence
  dynamics;
- F-loop: an advisory consequence predictor improved by a verifier-grounded
  coding-agent loop;
- F-society: unprompted sociality from colliding individual embodied goals in a
  shared Minecraft world.

Any later benchmark or experiment report must distinguish prediction quality,
acting outcome, physical competence, social consequence, continuity, robustness,
and efficiency.

Not current delivery targets:

- persona richness as a content goal;
- long-run autonomy as a product goal;
- large multi-actor society behavior before single-actor competence is trustworthy.
- benchmark-maximization as the top-level research objective.
- presenting runtime verification, logs, screenshots, or scoring scripts as the
  research contribution.

## Minecraft Visual Evidence Rule

Search token: `VISUAL_EVIDENCE_1_21_4_RULE`.

For any Minecraft run whose screenshots will be reviewed, shown in an HTML
report, used in Qwen/OpenAI comparison material, or used to inspect actual NPC
movement later, follow
`project-docs/Architecture/Minecraft-Visual-Evidence-Capture-Protocol.md`
before running the experiment.

Use `PROBE_SERVER_VERSION=1.21.4` for `prismarine-viewer` screenshot runs unless
the user explicitly accepts renderer-skewed images or the runtime has migrated
to a better native-client visual capture path. Do not rely on the default server
version for visual reports. As of 2026-06-29, the repo's default may be newer
than `prismarine-viewer`'s supported visual assets; a `1.21.11` run produced
redstone-like visual artifacts even though runtime block evidence showed normal
village/terrain blocks.

Before provider-backed visual experiments, run a provider-free deterministic
visual setup smoke on the same scenario and inspect the artifacts. The smoke may
exit non-zero if the deterministic actor step blocks; judge setup by the
world-scenario manifest, seed/reset record, natural-spawn validation,
`visual_evidence.captures[]`, and `visual_evidence.audit.status`.

Default visual flag for report-grade NPC runs:

```bash
--visual-profile report
```

This profile is implemented in the runtime/CLI, not just documentation. It
selects the supported `1.21.4` visual path when the CLI owns server setup,
captures every cycle, uses a `960x540` viewport, writes
`visual-evidence-audit/v1`, and fails the run if the report-profile audit fails.
It captures three camera modes: `first_person`, `third_person_follow` from
directly behind the character, and `third_person_high` from a closer elevated
angle anchored to the actor's facing direction. Use `--allow-renderer-skew` only
for explicit renderer debugging, not for HTML reports or model-comparison
screenshots.

Use all report-profile camera modes by default. First-person shows the actor's
local view and obstructions. `third_person_follow` is the main character-centric
review image. `third_person_high` is for immediate surroundings without falling
back to a distant overhead map. Each visual report must pair screenshots with
same-cycle or neighboring state evidence: capture JSON, action evidence,
`observe`, `worldStateSummary`, `world-state-scan/v1`, natural-spawn validation,
verifier artifacts, or `transition-row/v1`.

Screenshots remain review-only evidence. Never infer block identity, progress,
placement, redstone, material state, or social consequence from pixels alone.
If a screenshot looks strange, classify it as `renderer-artifact`,
`camera-obstruction`, `real-world-weirdness`, or
`insufficient-visual-evidence` using the visual evidence protocol.

## Research Value Boundary

Evidence-first benchmarking is not the research goal and must not be presented
as the core contribution. Runtime evidence, transcripts, screenshots, ledgers,
seed/reset records, cost traces, and scoring scripts are support infrastructure:
they make claims checkable, prevent fake progress, and let runs be reviewed.
They are necessary hygiene, not the thing being studied.

Verification is expected engineering hygiene. Do not talk as if "verified
actions" or "verifier-backed evidence" are a novel contribution. Unless this
repo explicitly starts studying a model-based verifier, checking executed
Minecraft actions against runtime observations is simply the baseline standard
for credible embodied-agent experiments.

Before the Goldilocks gate, the research value must come from a more substantive
question:

```text
Is there a Minecraft layer where an LLM prior is insufficient, observed
interaction history provides learnable signal, and the resulting action ->
consequence target is neither trivial engineering hygiene nor promotional
society theater?
```

The broader society question still matters:

```text
What counts as a Minecraft society, organization, settlement, or social life
when embodied actors inhabit a natural world with needs, constraints, memory,
relationships, material stakes, conflict, cooperation, repair, and continuation
beyond one scripted task?
```

Benchmark design should serve the Goldilocks question first: it should produce
independent state/action/observed-delta transition rows, then test whether a
plain LLM prior, a grounded prompt, or a later learned model has real headroom on
the interesting layers. A good benchmark is a lens for seeing whether actors
form and maintain meaningful social patterns under Minecraft constraints. It is
not valuable merely because it records evidence cleanly.

Do not let the project drift into a "reproducibility-only" or
"evidence-first benchmark" paper. Reproducibility and evidence are the audit
surface. The main work is first defining and testing whether a meaningful
social-material consequence target exists:

- what physical/material/social delta a candidate action is expected to cause;
- why actors stay near each other or separate after a material change;
- how needs create dependence, exchange, refusal, conflict, or repair;
- how possession, access, and place become socially meaningful;
- how roles, norms, obligations, trust, and reputation arise or fail to arise;
- how social state changes after the immediate goal is done;
- how the world itself, not just dialogue, shapes collective behavior.

Prediction and acting must be reported separately. A strong actor with a weak
predictor is not the same result as a weak actor with a calibrated predictor.
An advisory consequence predictor branch may inform analysis or future
selection, but it must not select the executed action, fill missing parameters,
declare progress, close obligations, or override runtime checks.

Per the Active Central Plan above, the advisory-ONLY stance is reopened as a
research-framing choice: the central object may be coupled to action and measured
by capability ablation. The separate-measurement rule in this paragraph still
binds, and so do all runtime-authority limits in it (no filling missing
parameters, no declaring progress, no closing obligations, no overriding runtime
checks) - those are runtime safety, not the advisory headline.

Project Sid is a cautionary reference here. It claims broad Minecraft
civilization-scale behavior, but the public artifact is a technical report plus
a thin GitHub wrapper, not a reproducible code/data/log release. Do not imitate
viral civilization framing by scaling actor counts, adding religions, laws,
taxes, or dramatic society labels before the runtime can show why those
phenomena naturally matter in the world. Treat sensational society claims as
hypotheses requiring grounded investigation, not as proof or as a target style.
Do not discard useful Project Sid material: extract case designs, metrics,
failure modes, and prompt/config patterns with exact citation, while labeling
them as unverified report claims until runnable code, raw logs, scoring scripts,
or independent replication exist.

Use `project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
as the active research spine for new direction-setting docs. Use
`project-docs/Specification/Advisory-Social-Material-WAM.md` as a subordinate
historical/reference spec where it does not conflict with the central plan.

## PlanBeads Intent Rule

PlanBeads exist because free-form strings are too weak to manage what an actor is
trying to do, why it matters, what remains open, and how work should survive
context changes. They are a structured state/work-management substrate for
LLM-based actors, not a replacement for actor freedom.

The intended effect is to give the LLM actor more room to behave naturally in
Minecraft and social simulation, because important concerns, blockers,
dependencies, and resumable work are explicit instead of buried in prose.

The primary pain PlanBeads address is forgetting or muddying multi-cycle work
state. Execution and verification remain important, but the first PlanBeads
implementation should not become a verification project for its own sake. It
must prevent silent error hiding, fake completion, and progress laundering, while
keeping the main emphasis on clear state continuity.

The first meaningful proof is context-change behavior:

- the actor is working on concern A;
- a new concern B appears through observation, relationship pressure, blocker,
  or runtime evidence;
- the runtime preserves A's open/in-progress/blocked/deferred state;
- B can be added, prioritized, deferred, or linked without erasing A;
- the next CycleGoal can choose from current observation and the ready front
  without becoming a checklist executor.

Treat it as a design failure if the actor spends more effort maintaining
PlanBeads than acting in the world, or if PlanBeads make the NPC stiff,
checklist-bound, or less capable of free LLM-based behavior. Bead updates should
be small, evidence-linked, and in service of Minecraft action and social
simulation, not a new activity that displaces them.

PlanBeads must never become executable authority. They do not supply missing
primitive args, grant action-skill permissions, decide physical success, clear
runtime retry constraints, or replace runtime action validation. If an
implementation pushes PlanBeads toward deterministic domain planning, reject or
reframe it.

CycleJudgment may carry raw PlanBead operation proposal candidates, including
malformed candidates. Do not make the entire judgment fail only because one
candidate is invalid. The guarded PlanBead applier owns per-operation
validation, acceptance, rejection, and operation-result artifacts. This keeps
LLM proposal freedom visible while preventing unguarded state mutation.

PlanBeads are Beads-inspired, not Beads CLI integration. The runtime must not
shell out to `bd`, `br`, `beads-mcp`, `.beads`, or downloaded Beads binaries for
NPC state. Actor PlanBeads are repo-owned TypeScript/JSON actor-workspace
records under each actor directory. External Beads-style tools may be used only
for repo implementation campaign management, never as Minecraft runtime state
or as a required device-level dependency.

Parallel GPT-5.5-xhigh workers may be used for speed and context isolation, but
parallelism does not change runtime authority. Workers operate under lane
contracts, produce artifacts or patches, and coordinator verification decides
what lands.

## Action Skill Authoring Gate

New Minecraft action skill creation during social-cycle runtime must originate
only from the Actor Turn action-selection stage. The provider may choose
`author_mineflayer_action`, which the runtime resolves into full-context
generated action authoring and trial. Current observation, CycleGoal or Active Episode, memory,
PlanBeads, relationship context, retry constraints, and the action surface must
justify creating a new actor-owned behavior candidate.

Background reviewers, async sidecars, PlanBead operations, archived generated
source importers, and offline maintenance scripts must not originate new action
skill candidates for an NPC during runtime. They may review, patch, reject,
retire, supersede, promote, or re-trial an existing Actor Turn candidate with
evidence. They may also propose PlanBeads that say a new action skill is needed,
but PlanBeads do not create source, parameters, permissions, or executable
authority.

Generated Mineflayer code should be used more actively through this explicit
full-context authoring path. The outer Actor Turn function call is a selection
and rationale boundary only: it must not include generated source and must not
choose a lossy `context_to_preserve` summary. When `author_mineflayer_action`
is selected, the runtime passes the full original `ActorTurnInput`, raw outer
tool call, parsed tool arguments, and Mineflayer code-generation agent skill
markdown into the internal codegen provider. The generated candidate must then
be schema-bound and helper-limited:

- internal codegen output must include an input schema, current parameters,
  generated TypeScript source, helper API version, timeout, verifier, failure
  modes, and promotion policy;
- primitive and action-skill parameters must validate against JSON
  Schema/OpenAPI-style contracts before execution;
- prose fields such as `why_this_action` never supply missing parameters;
- generated source must run through bounded helpers and record helper events,
  post-observation, verifier output, and actor-workspace evidence;
- a passed trial is not active action skill authority until lifecycle promotion
  succeeds.

Use `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
as the active outer-selection spec for this rule. Use
`project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
only for generated candidate, helper allowlist, verifier, trial, and promotion
mechanics after authoring has been selected.

## Tool Calling And Prose-Parsing Anti-Pattern

The strongest current anti-pattern is treating LLM-facing prose as executable
runtime policy. Do not parse `current_state_requirements`, `why_this_action`,
Action Card descriptions, Minecraft Basic Guide text, memory notes, PlanBeads,
or provider rationale with string `includes`, regexes, keyword lists, or similar
text heuristics to decide tool visibility, action eligibility, primitive
arguments, permissions, retry clearance, or generated-code authority.

Tool calling and strict schemas/enums must enforce the Actor Turn flow. The
provider may choose only a visible function tool or `author_mineflayer_action`.
Within that selected tool/action, the LLM keeps decision freedom with full
context, rich rationale, and schema-bound logical parameters. The runtime then
validates explicit structured params, schema conformance, permission gates,
retry/safety constraints, generated-source guardrails, timeouts, verifier output,
and evidence artifacts.

The runtime must not become a hidden Minecraft planner. Do not hide Action Cards
or tools through hardcoded Minecraft domain heuristics such as item-family,
station-family, construction-readiness, survival-priority, shelter-first, or
single-activity strategy filters. If an action should be unavailable or rejected,
represent that with typed readiness/eligibility contracts, structured state,
explicit schemas, permission gates, retry constraints, or verifier evidence.
`decision_frame` is context, not a planner output. Do not add
`parameter_candidates`, `top_eligible_action_cards`,
`recommended_next_action_candidates`, generated chat text, coordinates, recipe
decisions, or other pre-selected action payloads to it.
Do not add provider-facing candidate fields such as `deposit_candidates`,
`open_social_requests`, `obligation_summaries`, `nearby_block_hints`, or
`known_position_summaries`. These fields over-compress social, observation, and
world-state context into hidden preselection. Use bounded typed facts in
`current_state` plus `source_evidence_bundle` cards/refs so the Actor Turn LLM
can reason from the original evidence.
No compatibility compromise is required for this side project when
removing prose parsing or hidden domain-planner behavior.
When replacing an active runtime/provider contract, do the conversion in one
coherent pass instead of preserving old aliases, source names, or shim fields
inside the new contract. Historical artifacts may remain readable through
explicit audit/import code, but active TypeScript types, provider inputs,
schemas, prompts, tests, and docs should use the current concept names only. If
old producer output still exists, normalize it at the boundary into the current
schema and name that field for what it means now, not for the old implementation
that happened to produce it.

## Project Identity vs External References

External Minecraft-agent and LLM-agent papers are references, not product specs.
Do not copy Voyager, MineDojo, ReAct, Reflexion, Generative Agents, SayCan,
SWE-agent, or similar architectures as the active goal.

This project is not a race-to-diamond, fastest-tech-tree, benchmark-maximization,
or generic long-horizon autonomy project. Minecraft is the experimental substrate;
the product direction is a Soul-grounded social simulation seed.

When `soul.md` or an ActorSoul artifact defines an actor, treat it as the actor's
identity seed. Short-, mid-, and long-term goals should be derived under that
Soul/LifeGoal frame, with social context, memory, relationships, role context,
personal possession, material claims, public affordances, weak commons,
obligations, trust, conflict, and settlement state in view. Gameplay progress
matters because it creates observations, consequences, and evidence for social
life, not because the top-level objective is to optimize a Minecraft benchmark.

Use external references by translating their mechanisms into this project:

- skill-library papers imply evidence-backed, actor-owned action skill promotion,
  not raw eval loops or global skill reuse detached from the actor;
- curriculum papers imply bounded capability scaffolding under ActorSoul/LifeGoal, not a
  universal benchmark objective;
- reasoning/action papers imply Actor Turn tool selection -> runtime action ->
  evidence -> CycleJudgment loops, not unconstrained chain-of-thought as authority;
- memory/reflection papers imply artifact-grounded memory and review, not
  reflection text that can claim world progress;
- affordance/interface papers imply better runtime primitives, gates, and context
  packets, not broader provider authority.

When analyzing literature, always state both:

1. what the reference teaches mechanically; and
2. how that mechanism should be adapted to Soul-grounded Minecraft social
   simulation in this repo.

If a recommendation would make the actor ignore Soul/LifeGoal continuity,
relationships, or social consequences in favor of generic task completion, reject
or reframe it.

Do not turn one domain goal into core architecture. House, shelter, base,
storage, mining, farming, travel, repair, conversation, and conflict are
possible context sources, not mandatory CycleGoal phases. Do not add
`StructurePlacementPlan`, `ShelterBlueprint`, `HomeBasePlan`, or similar
building-first planning artifacts as always-on runtime context. If such an
artifact is useful, keep it local to a bounded action skill, fixture, or offline
design tool and make the current Soul/LifeGoal context justify its use.

Codex/MCP-style references should be adapted as autonomy substrate: action
surface, direct/deferred tool exposure, hooks, permission gates, event streams,
verification, and artifacts. Do not adapt them as hidden domain strategy.

WAM, VLA, MineStudio, MineDojo, Voyager, Project Sid, Generative Agents, SOTOPIA,
Concordia, ENPIRE, Codex, Claude Code, SWE-agent, DSPy, and related systems are
all references, not specs. Translate them through the active spine:

1. what action-conditioned consequence prediction they teach;
2. which physical/material/social transition labels they make easier to collect
   or score;
3. whether they are actor policy, predictor, loop method, substrate, or only a
   contrast class.

Do not headline "structured state" or "verified evidence" as the novelty. Before
the Goldilocks gate, the novelty target is not selected; the current job is to
find whether a non-trivial, learnable social-material consequence target exists
beyond LLM prior.

## Canonical Docs

Start with the active central plan -
`project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md` -
which takes precedence over the headline framing in the docs below where they
conflict (see "Active Central Plan" near the top of this file). Then read these:

For screenshot-producing Minecraft runs, also read
`project-docs/Architecture/Minecraft-Visual-Evidence-Capture-Protocol.md`
before starting the server or provider run.

1. `SPEC.md`
2. `AGENTS.md`
3. `project-docs/Architecture/Research-Documentation-Hierarchy.md`
4. `project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md`
5. `project-docs/Architecture/Research-Value-Harness.md`
6. `project-docs/Architecture/Prior-Work-Proximity-Current-Spine-2026-06-29.md`
7. `project-docs/Architecture/No-Regret-Core-Research-Protocol.md`
8. `project-docs/Architecture/Transition-Row-V1-Contract.md`
9. `project-docs/Architecture/Seed-Reset-Record-V1-Contract.md`
10. `project-docs/Architecture/Transition-Row-Label-Codebook.md`
11. `project-docs/Architecture/No-Regret-Core-Scenario-Catalog.md`
12. `project-docs/Architecture/Goldilocks-Preflight-Protocol.md`
13. `project-docs/Architecture/Society-Observable-Preflight.md`
14. `project-docs/Architecture/Research-Decision-Current-Spine-2026-06-29.md`
15. `project-docs/Architecture/No-Regret-Core-Implementation-Campaign.md`
16. `CLAUDE.md`
17. `GEMINI.md`
18. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
19. `project-docs/Specification/Advisory-Social-Material-WAM.md`
20. `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
21. `project-docs/Specification/Evidence-Grounded-Minecraft-Society.md`
22. `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
23. `project-docs/Specification/Engineering-Governance-And-Testing.md`
24. `project-docs/Specification/Reference-Adaptation-Guide.md`
25. `project-docs/Documentation-Map.md`
26. `project-docs/Agent-Search-Index.md`
27. `project-docs/Terminology.md`
28. `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
29. `project-docs/Architecture/Runtime-Loop-And-Verification.md`
30. `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`
31. `project-docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
32. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
33. `project-docs/Architecture/PlanBeads-Implementation-Campaign.md`
34. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
35. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
36. `project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
37. `project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
38. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
39. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
40. `project-docs/Architecture/Minecraft-Basic-Guide.md`
41. `project-docs/Architecture/Async-Reviewer-Sidecars.md`
42. `project-docs/Architecture/Implementation-Workstreams.md`
43. `project-docs/Architecture/Action-Skill-Verification.md`
44. `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
45. `project-docs/Architecture/Minimal-Probe.md`
46. `project-docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
47. `project-docs/Setup/Headless-Server.md`
48. `project-docs/Setup/Provider-Setup.md`
49. `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`

Treat `SPEC.md` as the canonical rebuild spec.

`SPEC.md` and `project-docs/Specification/*` are long-term spec files.
`AGENTS.md` is binding repo-agent guidance for interpreting and applying that
spec. `CLAUDE.md` and `GEMINI.md` mirror these rules for their agent surfaces
and must point back to `AGENTS.md` as the authority when rules conflict. Editing
any of these files changes product direction or agent operating rules, so do not
modify them during routine implementation work unless the user explicitly
approves the update in the current turn. Put dated implementation status,
command output, and volatile evidence in handoff or audit docs instead.

## Terminology

- `agent skill`: Codex/Claude-style capability under `.agents/skills/*/SKILL.md`,
  built or maintained with `skill-builder`.
- `action skill`: Minecraft/Mineflayer-based bundled behavior the runtime can
  validate, execute, verify, and record. Conversation-like actions are action
  skills when they run through the game runtime.
- Do not use bare `skill` in active guidance when the meaning could be confused.
- `project-docs/Terminology.md` is normative. New docs, code comments, prompts,
  report labels, and agent guides must follow it.
- If existing code or docs conflict with `Terminology.md`, either update them or
  add an explicit old-identifier mapping in `Terminology.md`. Do not spread
  outdated wording into new surfaces.
- Avoid AI-slop wording listed in `Terminology.md`, such as "AI brain",
  "magic", "vibes", "smart NPC", broad "autonomous" claims, ambiguous "skill",
  and "persona" as active architecture. Use concrete runtime, Minecraft, and
  schema-backed terms instead.

## Platform-Sensitive Execution

This repo moves between Apple Silicon macOS and Linux ARM. Before running or
changing platform-sensitive setup, server, dependency, or native-binary paths,
check the current platform.

Useful checks:

```bash
uname -s
uname -m
node -p "process.platform + '/' + process.arch"
docker info
```

Platform-sensitive work includes Docker/Compose, Podman, Colima, OrbStack,
`DOCKER_HOST`, native dependencies, binary downloads, Java/Minecraft server
startup, file watchers, shell startup files, executable permissions, browser or
device auth flows, exposed ports, and commands that assume `darwin`, `linux`,
`arm64`, `aarch64`, `x64`, or `amd64`.

Do not assume the host has the same Docker socket, package manager behavior, or
native binary shape as the other ARM platform. If platform setup blocks a run,
record it as an environment blocker with the exact command and platform, not as
actor behavior or action skill failure.

## User Communication Rules

Default to kind, context-rich communication with the user.

The user should be able to understand the agent's intent, work performed,
reasoning, results, and remaining uncertainty without needing to infer hidden
context. Do not hide assumptions, repo-specific implications, or important
tradeoffs inside terse summaries.

When reporting non-trivial work, include:

- what you changed or inspected;
- why that work was necessary;
- what evidence or command output supports the result;
- what remains blocked, risky, stale, or intentionally deferred;
- what terminology or architecture rule shaped the decision.

Avoid the anti-pattern of returning only a compressed final outcome when the
user needs enough context to review, learn, challenge, or extend the work. Keep
small answers small, but do not omit material context for architecture,
debugging, testing, provider/auth, platform-sensitive setup, or documentation
governance work.

Use the user's language when practical. For this repo, Korean explanations are
often appropriate, but keep code identifiers, commands, file paths, schema names,
and canonical terminology exact.

## Thinking, Research, Review, And Change Discipline

Search token: `KARPATHY_GUIDELINES`.

These Karpathy-style rules are binding for coding, research, reviews, refactors,
and implementation planning in this repo. They are adapted from the user-provided
MIT-licensed `karpathy-guidelines` note, derived from Andrej Karpathy's public
observations on common LLM coding mistakes:
`https://x.com/karpathy/status/2015883857489522876`.

### Think Before Coding

- Before non-trivial edits, state the working assumptions, the intended change
  boundary, and the verifiable success criteria.
- If multiple interpretations exist, name them. Do not silently choose the path
  that would change product direction, runtime authority, provider cost, data
  retention, auth, or platform setup.
- If a simpler approach solves the request, say so and prefer it.
- If uncertainty can be resolved from repo context, inspect the repo first. If a
  reasonable assumption would be risky, stop and ask the user instead of hiding
  confusion in code.
- During literature, GitHub, or web research, separate "what the reference
  teaches mechanically" from "how this repo should adapt it." References are not
  specs, and a mechanism that conflicts with Soul/LifeGoal continuity or
  autonomy substrate rules must be rejected or reframed.

### Simplicity First

- Write the minimum code that solves the current problem and can be verified.
- Do not add features, configuration knobs, abstractions, provider paths, action
  skills, or domain planners that were not requested or directly required by the
  current runtime contract.
- Avoid speculative flexibility. If an abstraction has one use and no immediate
  need, keep the implementation direct.
- If a change grows beyond the smallest clear shape, simplify before proceeding.
  Large files should be split by responsibility, but not converted into a
  framework.

### Surgical Changes

- Touch only files that are needed for the user's request and the required
  documentation/test alignment.
- Do not "improve" adjacent code, comments, formatting, terminology, or docs
  unless the current change made them wrong or the user asked for cleanup.
- Match the existing style and ownership boundaries even when another style
  seems preferable.
- Remove imports, variables, helpers, docs, and tests that your own change made
  obsolete. Mention unrelated dead code or stale docs instead of deleting them.
- Every changed line should trace to the request, a verified blocker, or a
  documented repo rule.

### Goal-Driven Execution

- Convert work into explicit success criteria before implementing. For example,
  "reject missing physical args" means "produce a contract-failure artifact and
  pass the focused regression test," not "the bot moved somewhere."
- For multi-step work, keep a short plan with a verification step for each
  material task.
- Loop until the chosen verification has run or until the blocker is recorded
  with the exact command, platform, provider, artifact path, and failure mode.
- Prefer implementation and empirical evidence over expanding test harnesses.
  Unit tests should be minimal, focused, and tied to a real invariant or
  regression. Do not build large test scaffolds, broad mocks, or test-only
  frameworks when a small implementation change plus a concrete run artifact
  would teach more.
- Prefer real runtime evidence when behavior matters. Unit tests protect narrow
  regressions, but social-cycle value is proven by truthful reports, helper
  events, verifier output, actor workspace artifacts, transition rows, seed/reset
  records, provider usage records, and live or managed Minecraft runs.
- Do not treat a passing test suite as completion for runtime, research, or
  Minecraft-behavior work. Completion needs the smallest useful implementation
  plus the strongest practical evidence artifact available under cost/platform
  constraints.

## Search Index

Read `project-docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
- `MINECRAFT_GAMEPLAY_MODEL`
- `SPEC_GOVERNANCE`
- `ACTIVE_CENTRAL_PLAN`
- `NO_REGRET_CORE`
- `NO_REGRET_CORE_RESEARCH_PROTOCOL`
- `NO_REGRET_CORE_IMPLEMENTATION_CAMPAIGN`
- `GOLDILOCKS_GATE`
- `GOLDILOCKS_PREFLIGHT_PROTOCOL`
- `SOCIETY_OBSERVABLE_PREFLIGHT`
- `TRANSITION_ROW_V1`
- `SEED_RESET_RECORD_V1`
- `TRANSITION_ROW_LABEL_CODEBOOK`
- `NO_REGRET_SCENARIO_CATALOG`
- `NO_REGRET_CORE_CURRENT_STATUS_2026_06_29`
- `CURRENT_PRIOR_WORK_PROXIMITY_2026_06_29`
- `CURRENT_RESEARCH_DECISION_2026_06_29`
- `DOCUMENTATION_MAP`
- `DOC_WORK_HIERARCHY`
- `RESEARCH_DOCUMENTATION_HIERARCHY`
- `ARCHIVE_CANDIDATES`
- `ARCHIVED_HANDOFF_PROMPTS`
- `RESEARCH_PLAN_REALIGNMENT_2026_06_29`
- `KARPATHY_GUIDELINES`
- `TERMINOLOGY`
- `SOUL_GROUNDED_SOCIAL_SIMULATION`
- `RUNTIME_EVIDENCE_ACTION_SKILLS`
- `ENGINEERING_GOVERNANCE_TESTING`
- `REFERENCE_ADAPTATION_GUIDE`
- `SKILL_VILLAGE_FAILURE`
- `NO_VOYAGER_EVAL_LOOP`
- `NO_MANUAL_CLIENT_GATE`
- `OPENAI_CODEX_PROVIDER`
- `GAME_RUNTIME_CODEX_AUTH`
- `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH`
- `PROVIDER_USAGE_GUARD`
- `PROVIDER_FREE_TIER_RESET_WINDOWS`
- `GEMINI_API_SOCIAL_PROVIDER`
- `WORLD_STATE_DIAGNOSTICS`
- `MINECRAFT_BASIC_GUIDE`
- `ACTOR_PERSISTENT_STATE_PLAN_BEADS`
- `RUNTIME_ACTION_CONTRACT`
- `RUNTIME_RETRY_CONSTRAINT`
- `CONTEXT_COMPACTION`
- `ADVISORY_SOCIAL_MATERIAL_WAM`
- `SOCIAL_MATERIAL_TRANSITION`
- `VERIFICATION_IS_HYGIENE`
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW`
- `SOCIAL_SIMULATION_SEED`
- `SPEED_BOUNDED_SOCIAL_SIMULATION`
- `LIVE_TRANSCRIPT_FIRST`
- `MINECRAFT_VISUAL_EVIDENCE_CAPTURE`
- `VISUAL_EVIDENCE_1_21_4_RULE`
- `CHECKPOINT_READY_RUNTIME`
- `MINIMAL_ACTION_SKILL_MEMORY_HOOK`
- `ACTION_SKILL_VERIFICATION`
- `CURRENT_HANDOFF_NEXT_WORK`
- `GENERATED_ACTION_SKILL_ARCHIVE`
- `PER_ACTOR_ASYNC_REVIEWER`
- `IMPLEMENTATION_WORKSTREAMS`
- `ACTION_SKILL`
- `AGENT_SKILL`

## Design Rules

- Use Minecraft as an experiment accelerator and embodied social-material
  transition substrate.
- The first meaningful proof is not a big society. It is boring competence plus
  transition rows that separate prediction quality from acting outcome.
- Keep implementation aggressively simple. Prefer small, named modules over large files.
- Keep architecture extensible by making ownership boundaries explicit, not by
  adding general-purpose abstractions early. Prefer small typed modules with
  clear contracts that can grow later without turning the current runtime into a
  framework.
- If a TypeScript file becomes large, split it by responsibility before adding more behavior.
- Split files before adding new behavior when a module starts mixing concerns
  such as CLI parsing, provider calls, runtime orchestration, session lifecycle,
  artifact persistence, and gameplay execution.
- Keep functions small and single-purpose.
- Avoid runner files that mix config, provider calls, reconnect, transcript,
  persistence, and gameplay execution in one place.
- Use clear directory boundaries:
  - `gameplay/` for progression, curriculum, primitives, seed action skills,
    verification;
  - `runtime/` for loop, actions, session, and orchestration;
  - `memory/` and `runtime/state/` for actor and runtime state;
  - `skills/` for seed/generated action skill ownership and execution;
  - `provider/` for model calls and tracing;
  - `transcript/` for transcript and artifact persistence.
- Do not let quick probes become permanent monoliths.
- Do not expect social simulation from persona text alone.
- Add concrete Minecraft observations and consequences first: resource gathering, crafting, storage,
  movement, scarcity, personal possession, material claims, public affordances,
  weak commons, and obligations.
- Mineflayer provides the game client API.
- Prefer bounded TypeScript helpers and bounded action skill bundles over raw
  eval.
- Prefer autonomy substrate over domain-specific strategy encoding. Improve
  context packets, `action_surface`, gates, hooks, runtime feedback, transition
  logging, and actor memory before adding a specialized planner for one activity
  such as house building.
- Preserve enough world-state evidence for post-run diagnosis. A claim such as
  "no matching block was observed" must be backed by a bounded scan or an
  explicit loaded-world limitation, not only by a thin nearest-block summary.
- World-state diagnostics should record the scan center, radius, vertical range,
  dimension, loaded-chunk limitation, raw observed block/entity/item names,
  nearest examples, truncation policy, and evidence refs. Do not imply that
  unloaded chunks were inspected. Reviews and audits should count explicit
  `world-state-summary/v1` or `world-state-scan/v1` schema artifacts as scan
  evidence, not loose old keys such as `nearbyBlocks`.
- Do not expose provider-facing world summaries as fixed material-family,
  station-family, construction-readiness, or survival-priority categories.
  World context is evidence substrate: raw Minecraft names, positions,
  distances, limits, and query refs. The provider decides what matters from
  ActorSoul/LifeGoal, CycleGoal, action surface, and evidence.
- Do expose the compact `minecraft_basic_guide` to social-cycle provider stages
  as stable background mechanics. It should help the provider apply basic item
  flows, station requirements, tool usefulness, item-vs-world-block distinctions,
  blocker recovery, and repeated-observe limits. It is a guide, not a strategy
  checklist, runtime permission, current-state claim, runtime action contract, or
  proof of progress.
- It is acceptable for a specific action skill implementation to query a
  specific Minecraft block or item family as part of its own primitive contract.
  It is not acceptable to turn those families into always-present planner
  context, summary headings, or goal interpretation.
- Treat physical runtime action arguments as a contract. For actions such as
  `move_to`, `mine_block`, `place_block`, `craft_item`, `inspect_chest`,
  `deposit_shared`, or structure/building primitives, required target/item/count
  arguments must be present in structured args before execution.
- Direct `use_primitive` actions must not carry `action_skill_id` or
  `args.actionSkillId`. Actor-owned action skill fallback authority exists only
  after a `use_action_skill` action is resolved by the runtime.
- Safe-looking control actions such as `wait` and `remember` are still runtime
  primitives. They must pass CycleGoal and active action-skill gates.
- Do not silently convert missing physical arguments into movement or gameplay
  defaults. A hidden default that makes the bot move can still be a product
  failure. Reject, repair, or ask the provider for a valid action, then record
  the contract failure in artifacts.
- Natural-language fields such as `why_this_action` explain intent but are not
  executable authority. If prose mentions a coordinate and structured args are
  empty or contradictory, the runtime must treat the structured intent as
  invalid rather than guessing from prose.
- Repeated identical blocker evidence should become a `runtime-retry-constraint/v1`
  gate over the exact runtime action target and structured args. This is a
  runtime safety rule, not a domain strategy or memory suggestion. It must block
  before Mineflayer execution and write evidence when the provider repeats the
  prohibited target/args.
- Use Mineflayer API behavior to shape runtime contracts: target resolution,
  loaded-world visibility, pathfinder limits, timeout/cancellation behavior, and
  verifier evidence should be documented in code or spec when they affect an
  action skill.
- Long social-cycle runs need context compaction. Do not feed unbounded raw
  transcripts or repeated observe/wait/remember records back to the provider.
  Preserve compact, evidence-linked state: ActorSoul/LifeGoal, current
  inventory, container snapshots, known positions, recent blockers, recent
  judgments, world-state diagnostics, action-surface contracts, and artifact
  refs.
- Compaction must not launder weak evidence into progress. Provider text,
  memory notes, `wait`, or repeated observation are context, not physical
  success unless observed world, inventory, position, block, container, chat, or
  transcript evidence supports them.
- Human visual inspection is optional support evidence. When screenshots are
  used, follow `project-docs/Architecture/Minecraft-Visual-Evidence-Capture-Protocol.md`:
  treat `prismarine-viewer` images as review-only evidence, pair them with
  observe/worldStateSummary/world-state-scan artifacts, and never infer block
  identity or progress from pixels alone.
- Failures should be explainable from artifacts without immediate reproduction.
- Progress must be real. Do not confuse partial motion, initial animation, or
  optimistic status text with success.
- Treat interruption-sensitive Minecraft actions as atomic action skill
  boundaries. For example, block breaking must keep Mineflayer digging until
  `bot.dig(...)` resolves or fails; do not stop to check progress mid-dig,
  because that resets block-breaking progress.
- Actor workspace is the source of truth for actor-owned action skill state.
- Actor workspace should also become the source of truth for actor-owned
  PlanBead work graph state when that slice is implemented. The purpose is
  state continuity under changing circumstances, not more planning prose.
- Treat `build/generated-skills` as archived exploratory output, not as active or
  candidate actor-owned action skill memory.
- Prefer structured domain models, typed records, discriminated unions, schemas,
  and validators over ad hoc dictionary blobs. Runtime state, action evidence,
  actor memory, provider packets, relationship context signal, and verifier results
  should be machine-auditable and hard to misread.
- Keep tests small and Detroit-style. Use them to protect real owned behavior,
  not to simulate a fake feeling of coverage.
- Live transcript is the primary evidence of runtime value.

## TypeScript Commenting Rules

These rules are based on the Google TypeScript Style Guide, TypeScript JSDoc
reference, TSDoc, TypeDoc, DefinitelyTyped, and VS Code/TypeScript ecosystem
practice.

- Prefer readable names, narrow functions, and explicit types before adding a
  comment. A comment should not restate what TypeScript already proves.
- This repo should use more explanatory comments than a typical CRUD or library
  project because product policy, runtime authority, evidence semantics, and
  actor-continuity intent are part of the implementation contract. Preserve the
  "why this boundary exists" and "what this code must not imply" background in
  code when it prevents future agents from accidentally changing product
  direction.
- Use `/** ... */` documentation comments for exported APIs, cross-module
  contracts, and code a caller needs to understand. Use `//` comments for local
  implementation notes.
- Comments should explain intent, background, why a runtime boundary exists,
  what invariant is being protected, what failure mode is being rejected, or
  what Minecraft/Mineflayer behavior is non-obvious.
- It is acceptable and often desirable for comments to include project intent,
  design background, and policy constraints when the code implements rules from
  `SPEC.md`, ActorSoul/LifeGoal continuity, PlanBeads, runtime action contracts,
  actor workspace evidence, provider usage/auth boundaries, retry constraints,
  or generated action skill lifecycle. Do not force readers to reconstruct these
  constraints from distant docs when a short local note can prevent misuse.
- For gameplay code, prioritize comments around verification, timeout,
  cancellation, reconnect/session freshness, fake-progress rejection, actor
  workspace initialization, action skill ownership, and transcript semantics.
- For provider-facing code, document which fields are prompt context only and
  which fields may become executable authority after validation. Prose fields,
  memory, PlanBeads, and decision-frame hints should be explicitly described as
  non-authoritative wherever that distinction is easy to blur.
- For Actor Turn function-tool code, comments should make the boundary obvious:
  a visible Action Card function schema is a tool-calling contract, not a hidden
  Minecraft planner. It may require logical parameters such as item names,
  counts, directions, or coordinates, but it must not choose those values from
  prose, heuristics, or domain strategy. The LLM supplies them in strict tool
  args; runtime validation then accepts or rejects them.
- For `author_mineflayer_action` and Mineflayer codegen code, comments should
  distinguish the outer selection call from the internal codegen call. The outer
  call carries detailed rationale and desired behavior; the internal request
  carries the full original `ActorTurnInput`, raw outer tool call, parsed tool
  args, and codegen agent skill markdown. Do not leave future readers guessing
  whether `raw_outer_tool_call` is the Actor Turn output.
- When a module intentionally keeps duplicated-looking context, such as compact
  facts plus source evidence refs, comment the reason: bounded facts help the
  model read quickly, while source evidence prevents lossy summary-only
  decisions. When duplication is only accidental or compatibility-driven, remove
  it instead of documenting it.
- For persistence and artifact code, document what record is the source of truth,
  what evidence survives compaction, and which claims are only diagnostic context
  rather than proof of Minecraft progress.
- Do not add decorative section banners, obvious parameter descriptions, or
  comments that merely narrate the next line of code.
- Keep comments short enough to review. If a comment needs a long explanation,
  prefer extracting a named helper or adding a design doc section.
- Keep comments current when behavior changes. A stale comment is worse than no
  comment because this repo relies on artifacts and code to diagnose real runs.
- When documenting generated or candidate action skills, state the primitive
  boundary and evidence required for promotion. Do not imply autonomous runtime
  trust before verification exists.
- During comment passes, explicitly inspect every TypeScript file with zero
  comments. Either add a high-signal contract/invariant comment or leave it
  uncommented only when the file is a trivial CLI/re-export/declarative constant.
- A file with zero comments is acceptable only after inspection when it is a
  re-export, a tiny CLI shim, a declarative constant table with self-explanatory
  names, or a small pure helper whose behavior and policy implications are
  obvious from types and tests. Large provider, runtime, validation, Mineflayer
  tool, memory, artifact, or lifecycle files should not remain comment-free.
- When the user explicitly requests a comment pass, report whether existing
  guidance was sufficient, then update only comments that clarify contracts,
  invariants, runtime evidence, or non-obvious Mineflayer behavior. Tests may
  receive comments only for non-obvious invariants; do not pad every test with
  narration.
- Configuration comments should explain non-obvious defaults, auth boundaries,
  artifact locations, and destructive-vs-non-destructive behavior. Do not label
  obvious scalar defaults.
- Prefer TSDoc `@remarks` for invariants that must survive refactors (for example,
  “WorldEvent is context, not LifeGoal”). Use `@see` to link architecture docs
  when a module implements a written contract.
- Keep JSDoc tags sparse: `@param` only when the name is not self-explanatory;
  avoid `@returns` on obvious `Promise<void>` helpers.

Reference anchors:

- Google TypeScript Style Guide: `https://google.github.io/styleguide/tsguide.html`
- TypeScript JSDoc Reference:
  `https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html`
- TSDoc approach: `https://tsdoc.org/pages/intro/approach/`
- TypeDoc TSDoc support:
  `https://typedoc.org/documents/Doc_Comments.TSDoc_Support.html`
- DefinitelyTyped contribution guidance:
  `https://definitelytyped.org/guides/contributing.html`
- VS Code TypeScript/JSDoc hover behavior issue:
  `https://github.com/microsoft/vscode/issues/215550`

## Testing Rules

- Keep tests aggressively small, direct, and Detroit-style.
- Tests should exercise real owned behavior through the smallest practical
  public boundary, with minimal mocking and no broad harnesses that can pass
  while the runtime contract is broken.
- Prefer tests that prove one important owned behavior or regression.
- Use tests to reject fake success and hidden dependencies.
- Do not add broad mocks or snapshot-heavy suites.
- If a test would still pass after the real logic was broken, rewrite or delete it.
- Do not add elaborate tests for persona richness or long-run autonomy yet.
- Unit tests protect narrow regressions, but live implementation runs with
  truthful reports, helper events, verifier output, and actor artifacts are the
  primary evidence for runtime value.

## Documentation Rules

- Keep `SPEC.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `project-docs/intro.md`,
  `project-docs/Documentation-Map.md`, `project-docs/Terminology.md`, and
  `project-docs/Agent-Search-Index.md` aligned.
- Internal project docs live under `project-docs/`. This includes specs,
  architecture notes, setup notes, provider/API access notes, handoffs,
  implementation campaigns, terminology, and routing indexes.
- Docusaurus-exposed public docs live under `docs/public-docs/`. These pages
  should explain the project externally: purpose, high-level architecture, basic
  local run instructions, evidence semantics, and roadmap.
- Do not add new public docs under `docs/docs/`.
- Do not put ordinary documentation, specs, architecture notes, setup guides,
  handoffs, reviews, or research notes under `docs/blog/`. `docs/blog/` is only
  for explicitly requested chronological blog posts.
- Do not put internal setup notes, private provider access instructions,
  provider-budget state, dated run handoffs, implementation workstreams, or
  agent operating rules under `docs/public-docs/` or `docs/blog/`.
- Repo-internal review and operation docs belong in the project root when they
  guide branch review or agents directly. Historical research, stale public
  plans, and raw paper dumps belong under `project-docs/research-archive/`.
- When adding or changing project vocabulary, update `project-docs/Terminology.md`
  first, then update affected docs/code comments/prompts to match it.
- If a plan becomes historical rather than active, mark it clearly as archived or
  deprecated instead of leaving it ambiguous.
- Prefer one canonical definition doc over several drifting ones.
- Never use absolute local paths in committed docs.

## Commit And Push Discipline

When an important task is completed, do not leave the result only as local dirty
workspace state. Important tasks include provider-backed Minecraft experiments,
HTML/static reports, architecture or governance changes, active plan updates,
runtime contract changes, transition-row or seed/reset artifacts, and any work
the user asks to record for future review.

Before the final response for such work, prepare a scoped commit unless the user
explicitly says not to commit. If the user asks to push, push the committed
branch after the commit succeeds. Do not use this rule to sweep unrelated dirty
files into the commit.

Follow `CONTRIBUTING.md` exactly:

- split commits when the scope changes;
- stage only files that belong to the commit's stated purpose;
- avoid broad subjects such as `misc`, `cleanup`, `update`, or `wip`;
- use the subject format `<area>: <imperative summary>`;
- include a detailed body with `Why:`, `What changed:`, and `Validation:`;
- add `Notes:` for limitations, follow-ups, skipped validation, budget caveats,
  generated-artifact policy, or intentional omissions.

For experiment/report commits, the body should name the scenario, seed, models,
cycle count, provider preflight result, major outcome counts, visual-capture
status, budget caveats, and which raw artifacts were committed or intentionally
left out. If screenshots are needed for an HTML report, commit the report-local
image assets or explicitly state why the report is local-only.

## Default LLM Planner (Codegen)

For **Mineflayer TypeScript codegen** (long-objective / direct-generated planner),
do **not** use Gemini Native Audio Dialog as a planner path. Recorded verdict:
`project-docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md`.

Use:

- **REST `text-genai`** (`gemini-2.5-flash` via `@google/genai`) with
  structured output (`responseMimeType: "application/json"` plus
  `responseJsonSchema`) — current working path; `--force-path text-genai` on
  long-objective CLI, or
- **Gemini OpenAI-compatible Chat Completions** (OpenAI SDK + same `system`/`user`
  message shape) — evaluate via `probe/scripts/experimentGeminiOpenAiCompatMatrix.ts`.

Native Audio Dialog (`live-transcription`) is not a fallback, recovery path, or
provider order entry for `export async function run(ctx)` generation.

Codegen-friendly defaults (override in ignored `.env`):

```text
GEMINI_PLANNER_PRIMARY=text-genai
PROBE_LONG_OBJECTIVE_PROVIDER_ORDER=text-genai
```

Implementation:

- `probe/src/provider/gemini/textGenai.ts`
- `callGeminiLivePlanner()` is an archived-name facade; active planner calls use
  only the structured REST `text-genai` path.
- Long-objective planning goes through `ObjectivePhasePlannerPort`
  (`probe/src/provider/planner/`) — Gemini, OpenAI Codex, or explicit
  `builtin-planner`
- When LLM output is empty, blocked, or rejected, the runner falls back to
  **builtin phase source**: repo-authored `export async function run(ctx)` templates
  in `builtinPhaseSources.ts`. This is **not** loading an existing seed action skill
  from the gameplay registry; it is the same *execution shape* as a generated
  program, but checked in per phase.
- CLI `--provider deterministic` is kept as an alias for `--provider builtin-planner`

Do not treat optional Gemini smoke CLIs as the main validation loop. They are
shallow wiring checks only.

## Testing Priority

Prefer **real implementation runs** with truthful artifacts over smoke-only
proof:

1. Run the actual command (`probe:long-objective`, `probe:objective`, etc.).
2. Read the report JSON, actor workspace provider snapshots, helper events, and
   verifier output.
3. Feed failures back into substrate or prompt fixes.

Smoke tests (`probe:gemini-planner-smoke`, `probe:gemini-json-smoke`) are
allowed only as quick optional wiring checks. They do not replace Minecraft
current-run verification.

## Provider Cost And Usage Guard

Live provider calls must be explicit and auditable.

- Do not run OpenAI API models for cost-sensitive tests unless the user has
  explicitly selected that provider/model and the local free-tier or paid budget
  is known.
- Prefer `gemini-api` with `gemma-4-31b-it` for lightweight live provider checks
  when `GEMINI_API_KEY` is available.
- Run `probe:gemini-json-smoke` before longer Gemini/Gemma social-cycle tests.
- Provider calls should write usage into provider output snapshots and
  `build/provider-usage/provider-usage-ledger.jsonl`.
- If the user provides provider dashboard usage, encode it in
  `PROVIDER_USAGE_BUDGETS_JSON` or
  `build/provider-usage/free-tier-budgets.json` as `already_used` before running
  long or repeated live provider tests.
- Before long OpenAI or Gemini API free-tier runs, read
  `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md` and use its reset
  windows when deciding whether the budget has refreshed:
  - OpenAI API data-sharing complimentary tokens reset at `00:00 UTC`, which is
    `09:00 KST`.
  - Gemini API `RPD` quotas reset at midnight Pacific time, which is `16:00 KST`
    during PDT and `17:00 KST` during PST. Convert from
    `America/Los_Angeles`; do not assume a fixed KST calendar-day boundary.
- Treat a usage-budget block as a provider setup/budget blocker, not as actor
  behavior or action-skill failure.

Gemini/Gemma free-tier limits are provider/project/tier dependent and can
change. Check current Google AI Studio active limits before long runs. The repo
has a built-in operator guardrail for `gemini-api` + `gemma-4-31b-it`, but that
guardrail is not an official quota guarantee.

## Social Cycle Runtime (Soul / LifeGoal)

Use `probe:social-cycle` for the Soul/LifeGoal/CycleGoal vertical slice. The CLI
defaults to `deterministic-social`; live provider calls require an explicit
provider.

Preferred lightweight live path:

```bash
cd probe
bun run probe:gemini-json-smoke -- \
  --model gemma-4-31b-it \
  --report ../tmp/gemini-json-smoke.json

bun run probe:social-cycle -- \
  --actor npc_b \
  --provider gemini-api \
  --model gemma-4-31b-it \
  --cycles 2 \
  --max-actions-per-cycle 3 \
  --report ../tmp/social-cycle-npc-b-gemma31b.json \
  --no-dashboard
```

This path uses **Gemini API** (`GEMINI_API_KEY` in repo-local `.env`), not
`openai-codex` / `build/provider-auth/openai-codex-auth.json`.

OpenAI API (`OPENAI_API_KEY`) remains available with
`--provider openai-api --model "$OPENAI_MODEL"` but should not be used for
cost-sensitive tests until budget state is known.

`deterministic-social` is for tests and baseline reports only (`builtin_goal_authority`).
Do not use `probe:long-objective` as the social-life runtime.

Canonical plan: `project-docs/Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`.

## Auth Rule

When this repo says "Codex auth" for gameplay, it means game-runtime provider
auth for the `openai-codex` provider. It does not mean Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not inspect or print raw tokens. Do not start a browser/device login flow
unless the auth store is missing, expired, rejected by a live smoke, or the user
explicitly asks to refresh provider auth.
