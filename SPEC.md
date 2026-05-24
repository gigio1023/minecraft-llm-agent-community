# SPEC

Updated: 2026-05-24

This is the canonical gateway spec for the current rebuild.

The long-term product direction is a **Soul-grounded Minecraft social
simulation seed**. Minecraft is the pressure/evidence substrate. The project is
not a generic Minecraft LLM benchmark, a race-to-diamond agent, a fastest-tech
tree contest, or a Voyager clone.

## 1. Spec Authority And Governance

`SPEC.md` and the documents under `docs/docs/Specification/` define the long-term
project spec. Changing them changes the product direction.

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

- `docs/docs/Specification/Engineering-Governance-And-Testing.md`

## 2. Product Identity

The actor is not just an LLM controller attached to Mineflayer.

When `soul.md` or an ActorSoul artifact defines an actor, it is the actor's
identity seed. Short-, mid-, and long-term goals are derived under the
Soul/LifeGoal frame and constrained by world pressure, role pressure, memory,
relationships, obligations, trust, conflict, shared/private inventory, and
settlement state.

Gameplay progress matters because it creates real pressure and evidence for
social life. It is not the top-level objective by itself.

Read the product identity spec:

- `docs/docs/Specification/Soul-Grounded-Social-Simulation.md`

## 2.1 Autonomy Substrate, Not Domain Strategy

The long-term architecture should give the actor more usable context, a clearer
action surface, verifier-backed feedback, hook points, and artifact-grounded
memory. It must not turn one example goal into core runtime strategy.

House, shelter, base, storage, mining, farming, travel, repair, conversation,
and conflict are possible social pressures. None of them should become an
always-on CycleGoal phase, privileged planner object, or universal checklist
unless the active ActorSoul, LifeGoal, WorldEvent, memory, relationship state,
or observation makes that pressure relevant in the current cycle.

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
- A provider may choose building only when current pressure makes building a
  reasonable action. The system should not push every social goal through house
  construction.

This mirrors the useful lesson from Codex-style tool runtimes: the core system
does not hard-code a strategy for every programming language. It exposes tools,
context, hooks, approvals, events, and evidence so the model can act within a
bounded environment. This repo should do the Minecraft/Soul-grounded equivalent.

## 3. Complete Spec Reading Map

Read these documents to understand the full spec:

1. `SPEC.md`
   - entrypoint, authority, project identity, non-negotiable rules.
2. `docs/docs/Specification/Soul-Grounded-Social-Simulation.md`
   - Soul/ActorSoul identity, LifeGoal continuity, social pressure, and what
     counts as social simulation progress.
3. `docs/docs/Specification/Runtime-Evidence-And-Action-Skills.md`
   - runtime-owned truth, action skills, actor workspace, verifier evidence,
     transcript artifacts, and action-skill lifecycle.
4. `docs/docs/Specification/Engineering-Governance-And-Testing.md`
   - spec change governance, implementation style, Detroit-style tests, live
     runs, comments, file size, domain modeling, and documentation rules.
5. `docs/docs/Specification/Reference-Adaptation-Guide.md`
   - how to use external research without copying reference architectures.
6. `docs/docs/Documentation-Map.md`
   - documentation authority order, active/supporting/historical categories,
     and cleanup rules.
7. `docs/docs/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
   - concrete Soul/LifeGoal/CycleGoal architecture.
8. `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
   - hot path, runtime verification, and bounded execution.
9. `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
   - transcript and artifact persistence contract.
10. `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
   - actor-owned memory and action-skill state.
11. `docs/docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
    - actor profiles, role pressure, and relationship state.
12. `docs/docs/Architecture/Current-Handoff-And-Next-Work.md`
    - current implementation state and next work.
13. `docs/docs/Architecture/Current-Architecture-And-Implementation-Audit.md`
    - latest architecture/implementation cross-check.
14. `docs/docs/Agent-Search-Index.md`
    - routing map and search tokens.
15. `docs/docs/Terminology.md`
    - canonical terms such as `agent skill` and `action skill`.

Setup docs:

- `docs/docs/Setup/Headless-Server.md`
- `docs/docs/Setup/Provider-Setup.md`

## 4. Non-Negotiable Direction

- Soul/LifeGoal continuity is the top-level simulation frame.
- WorldEvents are pressure, not direct replacement for LifeGoal.
- Runtime owns physical truth: validation, timeout, cancellation, execution,
  verification, transcript, artifacts, and lifecycle guards.
- Providers propose goals and actions. They do not decide success.
- Reviewers explain and propose repairs. They do not mutate actor truth directly.
- Action skills are Minecraft/Mineflayer runtime behaviors, not Codex/Claude
  agent skills.
- Actor workspace is the source of truth for actor-owned memory, evidence,
  active/candidate/retired action skills, goals, provider snapshots, reviews,
  and relationships.
- Progress must be backed by world, inventory, position, block, container, chat,
  transcript, or verifier evidence.
- Do not confuse animation, partial motion, optimistic text, reflection, or a
  terminal memory note with success.
- Social simulation must not be expected from persona text alone.
- Social simulation must not be reduced to generic task completion.
- Autonomy support must be implemented as substrate: context, action surface,
  gates, hooks, verification, artifacts, and memory. Do not encode one domain
  goal, such as house or shelter construction, as the core cycle architecture.

## 5. Near-Term Proof

The first meaningful proof is small:

- one bounded actor;
- real Minecraft actions such as resource gathering, crafting, storage,
  movement, shelter, or settlement maintenance;
- action attempts recorded whether passed, blocked, failed, or no-progress;
- CycleGoal and ActionIntent derived from ActorSoul, LifeGoal, world pressure,
  memory, relationships, and prior judgments;
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
ActorSoul + LifeGoal + world/social pressure + memory
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

- `docs/docs/Specification/Engineering-Governance-And-Testing.md`

## 8. External References

External research is used for mechanisms, not for product identity.

Reference mechanisms must be translated into this project:

- skill-library work -> actor-owned, evidence-backed action skill promotion;
- curriculum work -> bounded Soul/LifeGoal-compatible pressure, not benchmark
  optimization;
- reasoning/action work -> CycleGoal, ActionIntent, evidence, CycleJudgment;
- memory/reflection work -> artifact-grounded memory and review, not claimed
  progress;
- affordance/interface work -> better runtime primitives, gates, context
  packets, and diagnostics.
- tool-runtime work -> direct/deferred action exposure, hookable execution,
  permission gates, event streams, and evidence accounting; not a hidden
  domain strategy.

Detailed reference mapping with links lives in:

- `docs/docs/Specification/Reference-Adaptation-Guide.md`

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

- `docs/docs/Architecture/Current-Handoff-And-Next-Work.md`
- `docs/docs/Architecture/Current-Architecture-And-Implementation-Audit.md`

As of this spec update, the current action-skill evidence baseline is described
in the architecture audit, including the fresh 14/14 live matrix after the
`buildBasicShelter` anchor fix. Future current-run results should update handoff
or audit docs, not silently rewrite the long-term product direction.
