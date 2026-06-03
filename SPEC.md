# SPEC

Updated: 2026-05-25

This is the canonical gateway spec for the current rebuild.

The long-term product direction is a **Soul-grounded Minecraft social
simulation seed**. Minecraft is the observation/evidence substrate: raw world
state, inventory, entities, positions, chat, blocks, tool results, and artifact
refs should be preserved richly enough for the model to decide what matters.
The project is not a generic Minecraft LLM benchmark, a race-to-diamond agent,
a fastest-tech tree contest, or a Voyager clone.

## 1. Spec Authority And Governance

`SPEC.md` and the documents under `docs/blog-doc/Specification/` define the
long-term project spec. `docs/blog-doc/` is the Docusaurus-exposed documentation
root. Repo-internal review and agent-operation docs live at the project root,
and historical research lives under `docs/research-archive/`. `AGENTS.md` is
binding repo-agent guidance for how agents apply that spec in day-to-day work.
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

- `docs/blog-doc/Specification/Engineering-Governance-And-Testing.md`

## 2. Product Identity

The actor is not just an LLM controller attached to Mineflayer.

When `soul.md` or an ActorSoul artifact defines an actor, it is the actor's
identity seed. Short-, mid-, and long-term goals are derived under the
Soul/LifeGoal frame and informed by observed world state, role context, memory,
relationships, obligations, trust, conflict, shared/private inventory, and
settlement state.

Gameplay progress matters because it creates observations, evidence, and social
consequences. It is not the top-level objective by itself.

Read the product identity spec:

- `docs/blog-doc/Specification/Soul-Grounded-Social-Simulation.md`

## 2.1 Autonomy Substrate, Not Domain Strategy

The long-term architecture should give the actor more usable context, a clearer
action surface, verifier-backed feedback, hook points, and artifact-grounded
memory. It must not turn one example goal into core runtime strategy.

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
  affordances, pre/post action hooks, approval-like gates, verifier status,
  event streams, and review artifacts. Those are substrate capabilities.
- A provider may choose building only when current observation, memory,
  relationship context, or CycleGoal makes building a reasonable action. The
  system should not push every social situation through house construction.

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

Providers may receive a compact `minecraft_basic_guide` for stable Minecraft
mechanics such as item prerequisite flows, station requirements, tool usefulness,
item-vs-world-block distinctions, and repeated-observe limits. This guide is
background mechanics, not a strategy checklist, runtime permission, current
state claim, or proof of progress.

Physical `ActionIntent` arguments are a contract, not a hint. Required arguments
for actions such as movement, mining, placement, crafting, storage, inspection,
or building must be present in structured args before execution. Natural-language
fields may explain why an action was chosen, but they are not executable
authority. If `why_this_action` mentions a target coordinate while structured
`args` are empty, the runtime should reject or repair the intent and record an
`ActionIntent` contract failure rather than silently applying a movement default.

Mineflayer-backed primitives should document the Mineflayer API assumptions they
depend on: loaded-chunk visibility, target lookup, pathfinder behavior, timeout
and cancellation semantics, and the evidence needed to verify success or
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
2. `docs/blog-doc/Specification/Soul-Grounded-Social-Simulation.md`
   - Soul/ActorSoul identity, LifeGoal continuity, social context, and what
     counts as social simulation progress.
3. `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`
   - runtime-owned truth, action skills, actor workspace, verifier evidence,
     transcript artifacts, and action-skill lifecycle.
4. `docs/blog-doc/Specification/Engineering-Governance-And-Testing.md`
   - spec change governance, implementation style, Detroit-style tests, live
     runs, comments, file size, domain modeling, and documentation rules.
5. `docs/blog-doc/Specification/Reference-Adaptation-Guide.md`
   - how to use external research without copying reference architectures.
6. `docs/blog-doc/Documentation-Map.md`
   - documentation authority order, active/supporting/historical categories,
     and cleanup rules.
7. `docs/blog-doc/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
   - concrete Soul/LifeGoal/CycleGoal architecture.
8. `docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md`
   - hot path, runtime verification, and bounded execution.
9. `docs/blog-doc/Architecture/Transcript-And-Runtime-Artifacts.md`
   - transcript and artifact persistence contract.
10. `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
   - actor-owned memory and action-skill state.
11. `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md`
   - restart-safe actor state, PlanBead work graph, dependencies, and ready front.
12. `docs/blog-doc/Architecture/Social-Actor-Profiles-And-Relationships.md`
    - actor profiles, role context, and relationship state.
13. `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md`
    - current implementation state and next work.
14. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
    - repo-internal whole-project implementation map for current boundaries,
      runtime flow, evidence, and risks.
15. `docs/blog-doc/Architecture/Current-Architecture-And-Implementation-Audit.md`
    - latest architecture/implementation cross-check.
16. `docs/blog-doc/Agent-Search-Index.md`
    - routing map and search tokens.
17. `docs/blog-doc/Terminology.md`
    - canonical terms such as `agent skill` and `action skill`.

Setup docs:

- `docs/blog-doc/Setup/Headless-Server.md`
- `docs/blog-doc/Setup/Provider-Setup.md`

## 4. Non-Negotiable Direction

- Soul/LifeGoal continuity is the top-level simulation frame.
- WorldEvents are event/context records, not raw observation and not a direct
  replacement for LifeGoal.
- Runtime owns physical truth: validation, timeout, cancellation, execution,
  verification, transcript, artifacts, and lifecycle guards.
- Providers propose goals and actions. They do not decide success.
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
  required physical `ActionIntent` args are a runtime contract failure unless a
  documented repair path produces structured args and records that repair.
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
- CycleGoal and ActionIntent derived from ActorSoul, LifeGoal, observation,
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
-> CycleGoal
-> ActionIntent
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

- `docs/blog-doc/Specification/Engineering-Governance-And-Testing.md`

## 8. External References

External research is used for mechanisms, not for product identity.

Reference mechanisms must be translated into this project:

- skill-library work -> actor-owned, evidence-backed action skill promotion;
- curriculum work -> bounded capability scaffolding under ActorSoul/LifeGoal,
  not benchmark optimization;
- reasoning/action work -> CycleGoal, ActionIntent, evidence, CycleJudgment;
- memory/reflection work -> artifact-grounded memory and review, not claimed
  progress;
- affordance/interface work -> better runtime primitives, gates, context
  packets, and diagnostics.
- tool-runtime work -> direct/deferred action exposure, hookable execution,
  permission gates, event streams, and evidence accounting; not a hidden
  domain strategy.

Detailed reference mapping with links lives in:

- `docs/blog-doc/Specification/Reference-Adaptation-Guide.md`

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

- `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md`
- `docs/blog-doc/Architecture/Current-Architecture-And-Implementation-Audit.md`

As of this spec update, the current action-skill evidence baseline is described
in the architecture audit, including the fresh 14/14 live matrix after the
`buildBasicShelter` anchor fix. Future current-run results should update handoff
or audit docs, not silently rewrite the long-term product direction.
