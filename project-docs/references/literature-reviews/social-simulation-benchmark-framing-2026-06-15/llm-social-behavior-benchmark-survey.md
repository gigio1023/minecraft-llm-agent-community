# LLM Social Behavior Benchmark Survey

Date: 2026-06-15

Search token: `LLM_SOCIAL_BEHAVIOR_BENCHMARK_SURVEY_2026_06_15`.

## Scope

This note records the 2026-06-15 literature sweep for social behavior,
LLM-based NPCs, social simulation, and multi-agent benchmarks. It is a research
archive note, not an active runtime spec. Active implementation guidance should
come from promoted Specification or Architecture docs.

The search used Hugging Face paper search and primary paper/project pages where
available. The goal was not to import an external benchmark wholesale, but to
identify what existing work actually measures and how those measures should be
adapted to this repo's Soul-grounded Minecraft social simulation direction.

## Main Conclusion

Social behavior must be defined for this project, but the useful definition is
operational rather than philosophical.

For benchmark purposes, a social behavior event should require:

1. at least two actors, or one actor interacting with durable shared social
   state;
2. a social act such as request, promise, refusal, handoff, sharing,
   coordination, conflict, repair, or obligation update;
3. an observable consequence in Minecraft world state, inventory, shared
   storage, transcript, relationship state, or memory;
4. evidence refs that make the claim auditable;
5. temporal continuity, so the event can influence later action rather than
   remaining one-off flavor text.

Dialogue alone is not enough. A chat message is a signal. It becomes a social
behavior claim only when it changes obligations, relationships, resource access,
coordination, conflict, or future behavior in an evidence-backed way.

## Benchmark Families

| Family | Representative work | What the benchmark measures | Adaptation for this repo |
| --- | --- | --- | --- |
| Social goal role-play | [SOTOPIA](https://arxiv.org/abs/2310.11667), [AgentSense](https://aclanthology.org/2025.naacl-long.257/), [SI-Bench](https://arxiv.org/html/2510.23182v1) | Social goal completion, implicit reasoning, private information reasoning, response quality, relationship-sensitive communication. | Use social goals, but ground every success claim in Minecraft evidence and ActorSoul/LifeGoal continuity. |
| Process-aware social behavior | [M3-BENCH](https://arxiv.org/html/2601.08462v2) | Behavioral trajectories, reasoning process, and communication content rather than outcome alone. | Score what actors said, what they did, and what later memory/relationship state records. Do not let final success hide incoherent process. |
| Mixed-motive cooperation | [MAgIC](https://arxiv.org/abs/2311.08562), [GLEE](https://arxiv.org/abs/2410.05254), [Concordia Contest](https://openreview.net/forum?id=yG4Fj0voJZ) | Cooperation, deception, rationality, fairness, efficiency, mutual gain, norm enforcement across unfamiliar partners. | Introduce scarcity, shared storage, role duties, optional conflict, and resource fairness without adding a hidden global planner. |
| Lifelong social continuity | [Generative Agents](https://arxiv.org/abs/2304.03442), [Lifelong SOTOPIA](https://openreview.net/forum?id=XdcuqZRhjQ) | Believability, multi-episode memory, goal achievement over repeated interactions, degradation or improvement with history. | Treat memory as evidence-linked actor state. A later cycle should use prior promises, blockers, contributions, and relationship events. |
| Human simulation fidelity | [SimBench](https://arxiv.org/abs/2510.17516), [Mind the Sim2Real Gap](https://arxiv.org/abs/2603.11245), [multi-turn customer behavior simulation](https://arxiv.org/abs/2503.20749) | Agreement with real human choices, user-simulation fidelity, action accuracy, statistical replication, User-Sim Index. | Keep this as a later validation layer. First build faithful artifact records; later compare against human-play or human-judged traces. |
| Minecraft multi-agent collaboration | [VillagerBench](https://aclanthology.org/2024.findings-acl.964/), [MINDCraft / MineCollab](https://mindcraft-minecollab.github.io/), [TeamCraft](https://arxiv.org/abs/2412.05255), [Project Sid](https://arxiv.org/html/2411.00114v1) | Task completion, embodied collaboration, spatial/causal/temporal dependency, role specialization, large-scale civilizational milestones. | Borrow embodied collaboration and dependency metrics, but avoid turning the project into a fixed task-completion or civilization-demo benchmark. |
| Communication barriers and repair | [SocialVeil](https://arxiv.org/abs/2602.05115) | Unresolved confusion and mutual understanding under vagueness, sociocultural mismatch, and emotional interference. | Later add ambiguous requests, social misunderstanding, and repair attempts to test robustness beyond idealized cooperation. |
| Large social simulation platforms | [AgentSociety](https://arxiv.org/abs/2502.08691), [Concordia](https://github.com/google-deepmind/concordia), [Social Simulation Survey](https://arxiv.org/abs/2412.03563) | Population-level phenomena, interventions, social science experiments, grounded or language-mediated agent-based modeling. | Use their framing for society-level questions, but keep this repo's first proof small, embodied, and verifier-backed. |

## What Existing Benchmarks Teach Mechanically

SOTOPIA and AgentSense teach that social evaluation needs scenarios, private or
role-specific goals, and multi-turn interaction. They should not be copied as a
dialogue-only benchmark because this repo's distinctive substrate is physical
Minecraft evidence.

M3-BENCH teaches that outcome-only evaluation is too weak. A model may produce a
reasonable final outcome while its communication, reasoning, and behavior are
misaligned. For this repo, the equivalent decomposition is:

- what the actor said or promised;
- what the actor physically did;
- what the runtime verified;
- what later memory, relationship, or PlanBead state preserved.

MAgIC, GLEE, and Concordia-style evaluations teach that cooperation is only
meaningful under incentives, scarcity, mutual gain, or conflict. In Minecraft,
scarcity and friction are natural: food, tools, shelter, stations, time,
navigation, night, damage, and shared storage all create social pressure.

Generative Agents and Lifelong SOTOPIA teach that social behavior needs
continuity. A single impressive exchange is not society. The important question
is whether remembered obligations and relationships alter future behavior.

SimBench and Sim2Real work warn that plausible generated behavior is not the
same as faithful simulation. Stronger models, more reasoning, or smoother prose
do not automatically mean better social simulation. This repo should treat
artifact-grounded outcomes as primary and human/empirical realism as a later
validation layer.

VillagerBench, MineCollab, TeamCraft, and Project Sid show that Minecraft is a
credible substrate for multi-agent work. Their most useful import is not a
specific architecture, but the idea that social or collaborative ability can be
tested through spatial, causal, temporal, resource, and role dependencies.

## Recommended Social Event Taxonomy

Start with a small taxonomy that can be logged, scored, and expanded later:

| Category | Events |
| --- | --- |
| Communication | `request`, `inform`, `ask`, `promise`, `refuse`, `clarify`, `warn`, `apologize` |
| Coordination | `delegate`, `accept_role`, `synchronize`, `wait_for_actor`, `avoid_duplicate_work` |
| Resource sociality | `deposit_shared`, `withdraw_shared`, `handoff`, `share`, `hoard`, `reserve` |
| Relationship and norms | `thank`, `blame`, `repair`, `trust_update`, `obligation_update`, `rule_reference` |
| Memory continuity | `remember_obligation`, `use_prior_social_fact`, `revise_belief`, `close_obligation` |
| Conflict | `contest_resource`, `deny_request`, `accuse`, `retaliate`, `punish`, `reconcile` |

Do not let this taxonomy become executable authority. It is a reporting and
scoring layer. Runtime action permissions still come from Action Cards, action
skills, validators, and evidence.

## Recommended Benchmark Metrics

| Metric | Meaning |
| --- | --- |
| Social goal completion | Whether the social objective was resolved, not merely stated. |
| Physical grounding | Whether Minecraft world, inventory, block, container, position, or chat artifacts support the claim. |
| Cross-actor dependency | Whether one actor's action changed another actor's options, obligations, memory, or resource state. |
| Communication-action coherence | Whether promises, requests, and explanations match verified behavior. |
| Memory/relationship continuity | Whether prior social events affect later cycles or episodes. |
| Resource economy | Whether private and shared resources move in role-consistent, fair, useful, or intentionally contested ways. |
| Robustness under ambiguity | Whether actors repair confusion, missing resources, or social misunderstanding. |
| Efficiency | Provider calls, tokens, cost, latency, action count, cycle count, and time-to-social-consequence. |
| Post-goal continuation | Whether actors keep responding to new world/social pressure after a local task succeeds. |

## Implication For The Current Repo

The project should use external benchmarks as lenses, not as direct product
specs.

The closest initial evaluation is a hybrid:

```text
SOTOPIA-like social goal completion
+ M3-BENCH-like process-aware trajectory scoring
+ VillagerBench-like embodied dependency and resource constraints
+ repo-owned Minecraft evidence artifacts
```

This supports a benchmark question that is narrower and more defensible than
"do agents form a society?":

```text
Can embodied LLM actors produce durable, evidence-grounded social trajectories
in a natural Minecraft world, where speech, physical action, shared resources,
memory, and relationship state remain coherent across cycles?
```

That benchmark remains aligned with the project goal because it evaluates
social consequences and continuity rather than generic Minecraft task
optimization.

