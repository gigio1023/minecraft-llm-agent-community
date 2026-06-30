# SPEC

Updated: 2026-06-18

This is the canonical gateway spec for the current rebuild.

The long-term research direction is an **advisory social-material World Action
Model (WAM) for wild Minecraft**. The motivating domain remains Soul-grounded
Minecraft social simulation, but the concrete research object is a predictor of
action-conditioned physical, material, and social consequences.

Minecraft is the embodied substrate: raw world state, inventory, entities,
positions, chat, blocks, tool results, and artifact refs should be preserved
richly enough for actors and predictors to reason about what matters.
The project is not a generic Minecraft LLM benchmark, a race-to-diamond agent,
a fastest-tech tree contest, or a Voyager clone.

Runtime verification is required experiment hygiene. It is not, by itself, a
novel contribution or the main differentiator. The contribution should be framed
around predicted-vs-observed social-material transitions, not around the mere
fact that actions are checked.

## 1. Spec Authority And Governance

`SPEC.md` and the documents under `project-docs/Specification/` define the
long-term project spec. `project-docs/` is the repo-internal project
documentation root. Docusaurus-exposed public docs live under
`docs/public-docs/`, repo-internal review and agent-operation docs live at the
project root, and historical research lives under `project-docs/research-archive/`.
`AGENTS.md` is binding repo-agent guidance for how agents apply that spec in
day-to-day work.
Changing any of these files changes product direction or agent operating rules.

Rules for agents:

- Do not silently edit this spec during unrelated implementation work.
- Do not reinterpret external papers as product requirements.
- Ask for explicit user approval before changing the long-term spec unless the
  user has directly requested a spec update in the current task.
- If implementation behavior and this spec disagree, report the mismatch before
  normalizing either side.
- Keep `SPEC.md` as the entrypoint. Put detailed contracts in split spec docs so
  no single Markdown file becomes the whole architecture.

Detailed governance lives in:

- `project-docs/Specification/Engineering-Governance-And-Testing.md`

## 2. Product Identity And Research Object

The actor is not just an LLM controller attached to Mineflayer.

When `soul.md` or an ActorSoul artifact defines an actor, it is the actor's
identity seed. Short-, mid-, and long-term goals are derived under the
Soul/LifeGoal frame and informed by observed world state, role context, memory,
relationships, obligations, trust, conflict, personal possession, material
claims, public affordances, weak commons, and settlement state.

Gameplay progress matters because it creates observations, material changes,
and social consequences. It is not the top-level objective by itself.

The current research object is separate from the actor:

```text
state_before + actor frame + candidate action
-> advisory predicted_delta
-> Mineflayer execution
-> observed_delta
-> transition row for scoring and analysis
```

The advisory WAM predicts what should change. It never selects the executed
action, fills missing runtime parameters, decides success, closes obligations,
mutates actor truth, or overrides runtime checks. Actor Turn remains the action
selection path and the runtime remains the execution boundary.

Read the product identity spec:

- `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
- `project-docs/Specification/Advisory-Social-Material-WAM.md`

## 2.1 Autonomy Substrate, Not Domain Strategy

The long-term architecture should give the actor more usable context, a clearer
action surface, runtime feedback, hook points, and artifact-grounded memory. It
must not turn one example goal into core runtime strategy.

House, shelter, base, storage, mining, farming, travel, repair, conversation,
and conflict are possible things the actor may notice or care about. None of
them should become an always-on CycleGoal phase, privileged planner object, or
universal checklist unless the active ActorSoul, LifeGoal, WorldEvent, memory,
relationship state, or observation makes that activity relevant in the current
cycle.

Concrete rules:

- Do not add `StructurePlacementPlan`, `ShelterBlueprint`, `HomeBasePlan`, or
  similar domain-specific planning artifacts as mandatory core cycle context.
- Building-oriented artifacts may exist as local inputs to a bounded action
  skill, fixture, or offline design tool, but they are not the runtime's
  general planning language.
- `buildBasicShelter` is one bounded seed action skill. It is not the product
  architecture, default objective, or proof of social simulation by itself.
- The runtime may expose an `action_surface` packet, direct/deferred
  affordances, pre/post action hooks, approval-like gates, runtime status,
  event streams, and review artifacts. Those are substrate capabilities.
- A provider may choose building only when current observation, memory,
  relationship context, or CycleGoal makes building a reasonable action. The
  system should not push every social situation through house construction.
- Do not hide tools or Action Cards through hardcoded Minecraft domain
  heuristics such as item-family, station-family, construction-readiness,
  survival-priority, shelter-first, or single-activity strategy filters. Tool
  visibility and rejection must come from typed readiness/eligibility contracts,
  explicit structured state, schemas, gates, retry constraints, and evidence.

This mirrors the useful lesson from Codex-style tool runtimes: the core system
does not hard-code a strategy for every programming language. It exposes tools,
context, hooks, approvals, events, and evidence so the model can act within a
bounded environment. This repo should do the Minecraft/Soul-grounded equivalent.

## 2.2 Diagnostic Evidence, Intent Contracts, And Compaction

The runtime must make failure diagnosable from artifacts. If a future reviewer,
Codex run, or human maintainer cannot tell whether the actor was boxed in,
walking through unloaded terrain, repeatedly executing an invalid intent, or
working from stale observations, the runtime evidence is insufficient.

World-state claims must be scoped and auditable. For example, "no matching
target was observed" is not just an observation summary; it is an evidence claim
that should include the scan center, radius, vertical range, loaded-world
limitation, raw observed Minecraft names, nearest examples, and artifact refs.
The runtime must not imply that it inspected chunks that Mineflayer had not
loaded.

Provider-facing world context must not become a fixed survival-game taxonomy.
Do not summarize the actor's world under hardcoded material-family,
station-family, construction-readiness, or survival-priority categories. The
substrate should expose raw Minecraft observations, query limits, positions,
distances, and evidence refs; the provider chooses relevance under ActorSoul,
LifeGoal, CycleGoal, action surface, and current evidence.

Context compaction must distinguish bounded facts from evidence-rich state.
Compact inventory counts, vitals, food candidates, retry constraints, and budget
hints are acceptable because they are low-dimensional and easy to audit.
Observation geometry, action/failure history, social pressure, PlanBead work
state, and generated action trials must carry source evidence cards or refs
beside any summary. Summary-only context for those surfaces is information loss.
Use `project-docs/Architecture/Context-Projection-And-Source-Evidence.md` as the
active rule for Actor Turn provider input.

LLM-facing prose must never become hidden runtime policy. Do not parse
`current_state_requirements`, `why_this_action`, Action Card descriptions,
Minecraft Basic Guide text, memory notes, PlanBeads, or provider rationale with
string `includes`, regexes, keyword lists, or similar heuristics to decide tool
visibility, action eligibility, executable parameters, permissions, retry
clearance, generated-source authority, or verifier success. Tool calling plus
strict schemas/enums enforce the flow; within a selected tool/action, the LLM
keeps decision freedom with full context and schema-bound logical parameters.
This side project does not need compatibility compromises that keep prose
parsing or hidden Minecraft-planner behavior in the hot path.
When replacing an active contract, update the producer, provider schema,
validators, tests, docs, and report readers coherently. Do not carry old concept
names into new active schemas as old aliases or source labels. Historical
records can remain readable through explicit audit/import paths, but active
runtime/provider surfaces should expose only current contract names.

`decision_frame` is not a planner result. It must not carry
`parameter_candidates`, `top_eligible_action_cards`,
`recommended_next_action_candidates`, generated chat text, coordinates, recipe
decisions, or other pre-selected action payloads. The Actor Turn LLM chooses
from visible `action_cards` and fills strict tool parameters itself.

Providers may receive a compact `minecraft_basic_guide` for stable Minecraft
mechanics such as item prerequisite flows, station requirements, tool usefulness,
item-vs-world-block distinctions, and repeated-observe limits. This guide is
background mechanics, not a strategy checklist, runtime permission, current
state claim, or proof of progress.

Physical runtime action arguments are a contract, not a hint. Required arguments
for actions such as movement, mining, placement, crafting, storage, inspection,
or building must be present in structured parameters before execution.
Natural-language rationale fields may explain why an action was chosen, but
they are not executable authority. If rationale text mentions a target
coordinate while structured parameters are empty, the runtime should reject or
repair the action and record a runtime action contract failure rather than
silently applying a movement default.

Mineflayer-backed primitives should document the Mineflayer API assumptions they
depend on: loaded-chunk visibility, target lookup, pathfinder behavior, timeout
and cancellation semantics, and the observations needed to check success or
truthful failure.

Long social-cycle runs need context compaction. The provider should not receive
an unbounded raw transcript or a repeated pile of observe/wait/remember records.
Compaction must preserve ActorSoul/LifeGoal continuity, current inventory,
container snapshots, known positions, recent blockers, recent judgments,
world-state diagnostics, action-surface contracts, and artifact refs. It must
not convert provider prose, memory notes, or weak observation into claimed
physical progress.

Actor-owned state that is required for continuity must survive process restarts.
This includes identity, LifeGoal, actor work graph state, memory, relationships,
action skill ownership, evidence, retry gates, provider snapshots, and
checkpoint-ready context. PlanBeads are checkpointed actor-owned issue-like work
items under LifeGoal. The PlanBeadGraph and its ready front guide CycleGoal
selection without becoming executable authority or physical proof. PlanBeads are
repo-owned actor-workspace records, not a dependency on external `bd`, `br`,
`beads-mcp`, `.beads`, or downloaded Beads binaries.

## 3. Complete Spec Reading Map

Read these documents to understand the full spec:

1. `SPEC.md`
   - entrypoint, authority, project identity, non-negotiable rules.
2. `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
   - Soul/ActorSoul identity, LifeGoal continuity, social context, and why
     Minecraft actions matter for social-material consequences.
3. `project-docs/Specification/Advisory-Social-Material-WAM.md`
   - current research spine: advisory WAM object, social-material transition
     rows, prediction-vs-acting separation, autoresearch loop boundary, and
     verification-as-hygiene rule.
4. `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
   - runtime-owned truth, action skills, actor workspace, verifier evidence,
     transcript artifacts, and action-skill lifecycle.
5. `project-docs/Specification/Engineering-Governance-And-Testing.md`
   - spec change governance, implementation style, Detroit-style tests, live
     runs, comments, file size, domain modeling, and documentation rules.
6. `project-docs/Specification/Reference-Adaptation-Guide.md`
   - how to use external research without copying reference architectures.
7. `project-docs/Documentation-Map.md`
   - documentation authority order, active/supporting/historical categories,
     and cleanup rules.
8. `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
   - compact current-goal routing for Actor Turn as hot path and PlanBeads as
     passive actor-owned work state.
9. `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
   - active campaign gates for proving cheap-model Actor Turn behavior.
10. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
   - Active Episode, Actor Turn, Action Cards, Evidence Trace, and branch-only
     Deliberation architecture.
11. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
    - current implementation sequence and acceptance gates for the Actor Turn
      migration.
12. `project-docs/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
   - concrete Soul/LifeGoal/CycleGoal architecture.
13. `project-docs/Architecture/Runtime-Loop-And-Verification.md`
   - hot path, runtime verification, and bounded execution.
14. `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`
   - transcript and artifact persistence contract.
15. `project-docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
   - actor-owned memory and action-skill state.
16. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
   - restart-safe actor state, PlanBead work graph, dependencies, and ready front.
17. `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
    - Actor Turn-only generated Mineflayer action-skill authoring authority.
18. `project-docs/Architecture/Minecraft-Basic-Guide.md`
    - provider-visible basic Minecraft mechanics guide.
19. `project-docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
    - actor profiles, role context, and relationship state.
20. `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
    - current implementation state and next work.
21. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
    - repo-internal whole-project implementation map for current boundaries,
      runtime flow, evidence, and risks.
22. `project-docs/Architecture/Current-Architecture-And-Implementation-Audit.md`
    - latest architecture/implementation cross-check.
23. `project-docs/Agent-Search-Index.md`
    - routing map and search tokens.
24. `project-docs/Terminology.md`
    - canonical terms such as `agent skill` and `action skill`.

Setup docs:

- `project-docs/Setup/Headless-Server.md`
- `project-docs/Setup/Provider-Setup.md`
- `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`

## 4. Non-Negotiable Direction

- Soul/LifeGoal continuity is the top-level simulation frame.
- The active research spine is advisory social-material consequence prediction,
  not task completion, evidence-first benchmarking, or civilization spectacle.
- WorldEvents are event/context records, not raw observation and not a direct
  replacement for LifeGoal.
- Runtime owns physical truth: validation, timeout, cancellation, execution,
  verification, transcript, artifacts, and lifecycle guards.
- Verification is expected hygiene and must not be presented as the
  differentiating research claim.
- Providers propose goals and actions. They do not decide success.
- The advisory WAM predicts deltas. It does not execute, score itself, or
  override runtime checks.
- Reviewers explain and propose repairs. They do not mutate actor truth directly.
- Action skills are Minecraft/Mineflayer runtime behaviors, not Codex/Claude
  agent skills.
- Actor workspace is the source of truth for actor-owned memory, PlanBead work
  graph state, evidence, active/candidate/retired action skills, goals, provider
  snapshots, reviews, and relationships.
- Actor-owned continuity state must be restart-safe. Living multi-cycle work
  should be represented as checkpointed PlanBeads and dependency edges under
  LifeGoal, not as free-form memory notes or hidden domain planners.
- Progress must be backed by world, inventory, position, block, container, chat,
  transcript, or verifier evidence.
- Do not confuse animation, partial motion, optimistic text, reflection, or a
  terminal memory note with success.
- Do not confuse a hidden programming default with a valid action. Missing
  required physical runtime action args are a runtime contract failure unless a
  documented repair path produces structured parameters and records that repair.
- Do not confuse LLM-facing prose with runtime authority. `current_state_requirements`,
  rationale, guide text, PlanBeads, and memory may explain context, but only
  explicit schemas/enums, structured parameters, permission gates,
  retry/safety constraints, source guards, timeouts, verifiers, and evidence
  decide execution.
- Absence claims about observed targets, blocks, items, entities, or hazards
  must be scoped by world-state diagnostic evidence and Mineflayer loaded-world
  limits.
- World context summaries must stay query-neutral and evidence-oriented. They
  must not encode fixed gameplay priorities or domain strategy categories.
- Context compaction must keep evidence refs and current actor state while
  dropping raw repetition. It must not upgrade weak evidence into progress.
- Social simulation must not be expected from persona text alone.
- Social simulation must not be reduced to generic task completion.
- Autonomy support must be implemented as substrate: context, action surface,
  gates, hooks, verification, artifacts, and memory. Do not encode one domain
  goal, such as house or shelter construction, as the core cycle architecture.

## 5. Near-Term Proof

The first meaningful proof is small:

- one bounded actor;
- real Minecraft actions such as gathering, crafting, storage, movement,
  block placement, communication, or settlement maintenance;
- action attempts recorded whether passed, blocked, failed, or no-progress;
- Actor Turn runtime actions derived from ActorSoul, LifeGoal, observation,
  world events, memory, relationships, and prior judgments;
- CycleJudgment written from runtime evidence;
- later cycles retrieve and use prior memory or judgment;
- failures explainable from artifacts without immediate reproduction.

The proof is not:

- a large NPC village;
- persona richness as content;
- an unbounded long-run autonomy demo;
- a generic "find diamonds fast" objective;
- a model-written explanation treated as truth.

## 6. Architecture Summary

The runtime shape is:

```text
ActorSoul + LifeGoal + PlanBeadGraph + observation + world events + memory
-> Actor Turn function-tool selection
-> ActorTurnResolvedAction or full-context generated-action authoring
-> active action skill / primitive gate
-> Mineflayer execution
-> verifier evidence
-> transcript + evidence + memory + CycleJudgment
-> next cycle context
```

The hot path stays bounded:

```text
observe -> choose -> gate -> execute -> verify -> record
```

Slow reflection, repair, review, summarization, and action-skill cleanup happen
from immutable artifacts outside the actor turn.

## 7. Testing And Evidence

This is not a production SaaS project where broad unit-test volume is the main
measure of progress. Unit tests still matter, but they must be small,
Detroit-style, and targeted at owned behavior.

Primary evidence comes from real implementation runs:

- live or managed Minecraft probes;
- social-cycle reports;
- action-skill matrix reports;
- transcript and runtime artifacts;
- provider input/output snapshots;
- verifier output and actor workspace evidence.

Test code should protect narrow invariants and regressions. If a test would pass
after the real runtime behavior is broken, rewrite or delete it.

Detailed testing rules live in:

- `project-docs/Specification/Engineering-Governance-And-Testing.md`

## 8. External References

External research is used for mechanisms, not for product identity.

Reference mechanisms must be translated into this project:

- skill-library work -> actor-owned, evidence-backed action skill promotion;
- curriculum work -> bounded capability scaffolding under ActorSoul/LifeGoal,
  not benchmark optimization;
- reasoning/action work -> Actor Turn tool selection, runtime action,
  evidence, CycleJudgment;
- memory/reflection work -> artifact-grounded memory and review, not claimed
  progress;
- affordance/interface work -> better runtime primitives, gates, context
  packets, and diagnostics.
- tool-runtime work -> direct/deferred action exposure, hookable execution,
  permission gates, event streams, and evidence accounting; not a hidden
  domain strategy.

Detailed reference mapping with links lives in:

- `project-docs/Specification/Reference-Adaptation-Guide.md`

Reference anchors include:

- [Voyager](https://arxiv.org/abs/2305.16291)
- [MineDojo](https://arxiv.org/abs/2206.08853)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [ReAct](https://arxiv.org/abs/2210.03629)
- [Reflexion](https://arxiv.org/abs/2303.11366)
- [SayCan](https://arxiv.org/abs/2204.01691)
- [Inner Monologue](https://arxiv.org/abs/2207.05608)
- [SWE-agent](https://arxiv.org/abs/2405.15793)
- [PsyMem](https://huggingface.co/papers/2505.12814)
- [PersonaGym](https://huggingface.co/papers/2407.18416)
- [Belief-Behavior Consistency](https://huggingface.co/papers/2507.02197)
- [Persona-Environment Behavioral Alignment](https://huggingface.co/papers/2509.16457)
- [Embodied Agent Interface](https://huggingface.co/papers/2410.07166)
- [OpenAI Codex](https://github.com/openai/codex)

## 9. Current State Is Not The Spec

Current implementation status, commands, and matrix results change often. Keep
those details in handoff and audit docs, not as the long-term spec itself.

Current-state references:

- `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
- `project-docs/Architecture/Current-Architecture-And-Implementation-Audit.md`

As of this spec update, the current action-skill evidence baseline is described
in the architecture audit, including the fresh 14/14 live matrix after the
`buildBasicShelter` anchor fix. Future current-run results should update handoff
or audit docs, not silently rewrite the long-term product direction.
