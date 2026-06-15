# minecraft-llm-agent-community

Headless Minecraft runtime-loop research for an evidence-grounded,
Soul-grounded social simulation seed.

This repository is not a Voyager clone, a race-to-diamond benchmark, or a
house-building planner. Minecraft task completion is a competence gate, not the
final research target. The target is to test whether LLM-controlled embodied
actors can sustain socially meaningful behavior in a natural Minecraft world,
where social claims are constrained by verifiable movement, inventory, crafting,
storage, communication, memory, and shared-world consequences.

[Documentation & Web Portal](https://naem1023.github.io/minecraft-llm-agent-community/)

## Current Direction

Near-term proof:

- one actor, one Mineflayer bot;
- ActorSoul and LifeGoal shape intent, but do not replace runtime evidence;
- Actor Turn is the ordinary decision hot path;
- Action Cards expose what the actor can try now;
- generated Mineflayer action authoring starts only from Actor Turn
  `author_mineflayer_action`;
- PlanBeads preserve passive open work, blockers, obligations, and followups;
- Minecraft progress requires runtime execution and verifier-backed artifacts.
- simple target-state benchmarks remain useful only as calibration gates before
  social trajectory evaluation.

Long-term north star:

- an evidence-grounded Minecraft social simulation seed where actors have role
  context, memory, relationships, action skill ownership, obligations, shared
  resources, and visible consequences that persist after one immediate task is
  completed.

Research framing:

- existing Minecraft LLM-agent benchmarks mostly evaluate bounded task
  completion or task-oriented collaboration;
- existing LLM social simulations often lack a verifiable physical substrate;
- this project aims to evaluate persistent, evidence-backed social behavior in
  natural open-world Minecraft seeds, including obligations, resource exchange,
  memory continuity, recovery from blockers, and post-goal continuation.

## Runtime Shape

```mermaid
flowchart LR
  Soul["ActorSoul + LifeGoal"]
  Observe["Observation<br/>world, inventory, actors"]
  Workspace["Actor workspace<br/>memory, PlanBeads, evidence"]
  Input["ActorTurnInput<br/>current_state + source_evidence_bundle"]
  LLM["Actor Turn LLM<br/>one function tool call"]
  Card["Visible Action Card<br/>strict parameters"]
  Author["author_mineflayer_action<br/>full-context codegen request"]
  Runtime["Runtime gates<br/>schema, permissions, retry, verifier"]
  MC["Mineflayer + Minecraft"]
  Evidence["Evidence trace<br/>reports, memory, PlanBeads"]

  Soul --> Input
  Observe --> Input
  Workspace --> Input
  Input --> LLM
  LLM --> Card --> Runtime
  LLM --> Author --> Runtime
  Runtime --> MC --> Evidence --> Workspace
```

The LLM chooses directly, but it does not own Minecraft truth. Structured tool
parameters, generated-source guards, retry constraints, timeouts, Mineflayer
execution, verifiers, and actor-workspace artifacts decide what happened.

## Context Philosophy

The runtime should help the LLM think, not quietly think for it.

Compression is acceptable for bounded facts such as inventory counts, hunger,
health, food candidates, retry constraints, and provider budget status.

Compression is not enough for observation geometry, action/failure history,
social pressure, PlanBead work state, or generated action trials. Those surfaces
must move as compact summaries plus source evidence refs/cards. Summary-only
context is treated as information loss.

Do not add hidden domain planners such as `deposit_candidates`,
`open_social_requests`, generated chat text, shelter-first phases, or hardcoded
recipe/placement strategy filters. If a runtime decision matters, express it as
a typed contract, strict schema, permission gate, retry constraint, or verifier.

## Active Boundaries

- `current_state` is bounded typed context, not proof of success.
- `source_evidence_bundle` preserves bounded raw evidence cards and refs beside
  summaries.
- Action Card `parameters` are executable contracts.
- Natural-language rationale explains intent but never supplies missing args.
- PlanBeads are passive issue-like actor state, not executable authority.
- Actor Turn actions are direct tool selections with schema-bound parameters.
- External Minecraft-agent papers are references to adapt, not product specs.

## Key Documents

Read in this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/Documentation-Map.md`
5. `project-docs/Agent-Search-Index.md`
6. `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
7. `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
8. `project-docs/Architecture/Context-Projection-And-Source-Evidence.md`
9. `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
10. `project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
11. `project-docs/Architecture/Minecraft-Basic-Guide.md`
12. `project-docs/Setup/Headless-Server.md`
13. `project-docs/Setup/Provider-Setup.md`

## Running Checks

Useful focused checks:

```bash
cd probe && bun run typecheck
cd probe && bun test test/actorTurnProviderInput.test.ts
cd docs && npm run build
git diff --check
```

For live Minecraft experiments, use `project-docs/Setup/Headless-Server.md` and
`project-docs/Setup/Provider-Setup.md`. Treat provider quota, Docker platform,
and server lifecycle as part of the evidence story, not as actor behavior.
