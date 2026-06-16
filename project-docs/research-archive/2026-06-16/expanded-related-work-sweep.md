# Expanded Related Work Sweep

Date: 2026-06-16

Search token: `EXPANDED_RELATED_WORK_SWEEP_2026_06_16`.

Status: research archive. This note expands the active research direction beyond
the first Project Sid and NitroGen passes. It focuses on references useful for a
Minecraft-based, evidence-grounded social simulation seed.

This is not a runtime authority spec. External papers are references. The active
runtime remains the repo-owned Mineflayer/action-skill, ActorSoul/LifeGoal, and
evidence-artifact direction.

## Research Question

```text
Which existing research helps define and evaluate open-world Minecraft social
trajectories, especially multi-agent coordination, material/resource claims,
obligation lifecycle, memory continuity, and validation boundaries?
```

## Search Method

Source families checked:

- primary paper pages: arXiv, OpenReview, ACL Anthology, PMLR, project pages;
- official code/project pages: GitHub, AI Habitat, MineDojo/CraftJarvis pages;
- wider context: venue pages and survey/position papers for validation warnings.

Search rounds:

- confirm: Minecraft LLM agents, Mineflayer/MineStudio/MCU, MineCollab, MineLand;
- disconfirm: social-simulation validity warnings, SimBench, Sim2Real,
  "do not trust" papers;
- widen: embodied multi-agent collaboration, economic games, MARL social
  benchmarks, human-robot collaboration.

## Claim Ledger

| Claim | Status | Evidence | Local interpretation |
| --- | --- | --- | --- |
| Minecraft now has many serious task/evaluation frameworks. | Supported. | MineDojo, MCU, MineStudio, MineExplorer, Odyssey, MineCollab, MineLand. | "Can play Minecraft" is no longer a strong contribution. The local contribution must be social/evidence/continuity. |
| Recent Minecraft benchmarks are still mostly task-centric or collaboration-centric. | Supported with inference. | MCU, Odyssey, MineExplorer, MineCollab all score tasks, milestones, planning, construction, resource collection, or collaboration. | Use these as competence gates and scenario generators, not as the top-level research claim. |
| The closest new benchmark direction is open-ended multi-agent coordination, not visual control. | Supported. | ALEM, Multi-Agent Craftax, Melting Pot, MineLand, MineCollab, PARTNR. | Separate base survival/task progress from coordination/social reward. |
| Social/economic benchmarks offer better metric vocabulary than Minecraft task success alone. | Supported. | GLEE, MultiAgentBench, SOTOPIA, AgentSense, Lifelong SOTOPIA. | Import metrics such as fairness, efficiency, role contribution, coordination quality, and long-history retention. |
| Social simulation claims need strict validation boundaries. | Supported. | SimBench, LLM Social Simulations Require a Boundary, Mind the Sim2Real Gap, Don't Trust Generative Agents. | Do not claim human society simulation. Claim grounded Minecraft social behavior with measurable artifacts. |

## Highest-Value Additional References

### MineExplorer

References:

- arXiv HTML: https://arxiv.org/html/2605.30931v2
- GitHub: https://github.com/meituan-longcat/MineExplorer

What it teaches mechanically:

- MineExplorer separates general open-world reasoning from Minecraft-specific
  mechanics.
- It builds composite tasks from latent dependency graphs and rule-based
  milestone checkers.
- It uses a multi-agent benchmark-construction workflow: task selector, scene
  designer, milestone agent, Minecraft expert, and validator.
- It reports that strong models handle many single-hop tasks but degrade under
  hidden prerequisites and longer trajectories.
- It explicitly finds that larger models or thinking modes do not automatically
  become better open-world agents.

How to adapt locally:

- Adopt latent dependency graphs for benchmark design, but make them social
  dependency graphs:

```text
request -> promise/refuse -> material movement -> verified action ->
memory/relationship update -> later consequence
```

- Use rule-based milestone checks for inventory, position, placed blocks,
  container state, chat events, and memory updates.
- Use multi-agent benchmark construction only offline. The runtime actor must
  not see hidden answer graphs.
- Add negative controls where a social request is impossible, unsafe, or
  blocked, so the benchmark can score refusal/repair instead of only success.

What not to absorb:

- Do not filter away Minecraft-specific knowledge if the scenario intentionally
  tests Minecraft social life. Instead, label whether a milestone is
  commonsense, Minecraft-mechanical, or social.
- Do not replace local action-skill verification with VLM/human-like trajectory
  judgment.

### MCU And MineStudio

References:

- MCU OpenReview: https://openreview.net/forum?id=hrdLhNDAzp
- MCU GitHub: https://github.com/CraftJarvis/MCU
- MCU PMLR: https://proceedings.mlr.press/v267/zheng25j.html
- MineStudio arXiv: https://arxiv.org/html/2412.18293v3
- MineStudio GitHub: https://github.com/CraftJarvis/MineStudio

What they teach mechanically:

- MCU provides thousands of composable Minecraft atomic tasks, task
  initialization variation, and automated trajectory evaluation.
- MCU's public task subset includes combat, crafting, tool use, mining,
  building, decoration, finding, exploration, and trapping tasks.
- MineStudio is an engineering framework for simulator, trajectory storage,
  model templates, offline/online training, inference, and benchmark execution.

How to adapt locally:

- Use MCU-like task categories as a competence pool below the social benchmark.
- Use a smaller local manifest of executable tasks that can become social
  pressure sources:

```text
craft_to_clock, build_a_house, explore_chest, find_village, smelt_beef,
plant_wheats, build_a_wall, light_up_the_surroundings
```

- Add a social wrapper around task goals:

```text
who needs it, who owns inputs, who promised it, who is blocked, who benefits,
what future action should change because of it
```

What not to absorb:

- Do not make MCU task score the primary paper figure. It should be a base
  competence axis.
- Do not adopt VLM-only video evaluation as the source of truth when local
  structured artifacts can verify inventory/block/container/chat state.

### Plancraft

Reference:

- OpenReview: https://openreview.net/forum?id=nSV8Depcpx

What it teaches mechanically:

- Plancraft evaluates planning, tool use, RAG, and decision-making through a
  Minecraft crafting GUI.
- It includes intentionally unsolvable examples so agents must decide whether a
  task can be solved at all.

How to adapt locally:

- Add "unsatisfied social request" benchmark cases:

```text
Actor A asks for an item that Actor B does not have.
Actor B must inspect evidence, say no or propose an alternative, and avoid fake
completion.
```

- Score truthful impossibility detection, repair proposal, and later memory.

What not to absorb:

- Do not reduce open-world social simulation to crafting puzzle planning.

### Odyssey

References:

- arXiv: https://arxiv.org/abs/2407.15325
- GitHub: https://github.com/zju-vipa/odyssey

What it teaches mechanically:

- Odyssey argues that Minecraft agents get stuck when their action set is too
  narrow.
- It provides 40 primitive skills, 183 compositional skills, a Minecraft Wiki
  instruction dataset, and capability benchmarks.

How to adapt locally:

- Use Odyssey as evidence that action-skill breadth matters before expecting
  rich social behavior.
- Prioritize robust boring action skills: gather, craft, place, store, retrieve,
  handoff, inspect, navigate, recover.

What not to absorb:

- Do not add a hidden universal dependency planner that silently resolves every
  Minecraft goal. That would conflict with the local anti-hidden-planner rule.
- Do not make autonomous item collection the research objective.

### Echo: Experience Transfer For Multimodal Minecraft Agents

Reference:

- arXiv HTML: https://arxiv.org/html/2604.05533v1

What it teaches mechanically:

- Echo proposes explicit transfer dimensions for memory:

```text
structure, attribute, procedure, function, interaction
```

- It treats memory as reusable experience for cross-task transfer, not only a
  static log.

How to adapt locally:

- Extend actor memory and PlanBeads with evidence-linked dimensions:

```text
physical structure: where things are
material attribute: what items/tools/stations are available
procedure: what sequence worked or failed
function: what an item/place/social affordance is for
interaction: who did what with whom and what changed
```

What not to absorb:

- Do not let memory text become executable authority. It should inform Actor
  Turn reasoning and cite artifacts, not bypass runtime validation.

### Parallelized Planning-Acting In Minecraft

Reference:

- arXiv HTML: https://arxiv.org/html/2503.03505v2

What it teaches mechanically:

- It decouples planning and acting threads.
- It keeps a centralized memory containing observations, chat logs, and action
  history.
- It supports passive and active communication and interruptible execution.

How to adapt locally:

- Useful for future async sidecar/runtime scheduling design:

```text
observe/chat/memory can update while an action skill runs
interrupts must be explicit runtime events with evidence and cancellation rules
```

What not to absorb:

- Do not let a planner thread preempt atomic Mineflayer actions without a local
  cancellation contract.
- Do not make centralized memory the only social truth; actor-owned memory and
  artifact provenance still matter.

### MineLand

Reference:

- arXiv HTML: https://arxiv.org/html/2403.19267v1

What it teaches mechanically:

- MineLand targets large-scale Minecraft multi-agent interaction.
- It adds limited multimodal senses, physical needs, communication distance, and
  interruptible action code.
- It explicitly blends daily-life state such as hunger/sleep with task-oriented
  activity.
- It finds that limited senses encourage communication, and physical needs
  affect survival-oriented behavior.

How to adapt locally:

- Add controlled social pressure variables:

```text
distance-limited chat
limited local observation
hunger/night/danger pressure
role-specific access to tools or knowledge
interruptible social messages during long actions
```

- Treat physical needs as social pressure sources, not as a whole new
  civilization simulator.

What not to absorb:

- Do not import raw code execution as the action authority.
- Do not overclaim large-scale society from short Mineflayer episodes.

### MineCollab / MindCraft

Reference:

- arXiv HTML: https://arxiv.org/html/2504.17950v1

What it teaches mechanically:

- MineCollab uses cooking, crafting, and construction tasks that require
  collaboration through resource sharing, recipe/knowledge transfer, and
  blueprint coordination.
- It reports that communication quality is a major bottleneck and that
  performance drops when agents must communicate detailed plans.
- It evaluates multiple agents in partially observable Minecraft settings.

How to adapt locally:

- This remains the closest direct Minecraft benchmark family.
- Convert task suites into open-loop social trajectories:

```text
from "make a meal together" to
"someone promises food/tool help, transfers or fails to transfer resources,
remembers the obligation, repairs blockers, and continues after the local task"
```

What not to absorb:

- Do not stop at bounded cooking/crafting/construction success.
- Do not equate chat volume or task completion with social life.

### ALEM, Craftax, Multi-Agent Craftax, And Melting Pot

References:

- ALEM arXiv HTML: https://arxiv.org/html/2606.08340v1
- ALEM GitHub: https://github.com/alem-world/alem-env
- Multi-Agent Craftax arXiv: https://arxiv.org/abs/2511.04904
- Craftax project: https://craftaxenv.github.io
- Crafter arXiv: https://arxiv.org/abs/2109.06780
- Melting Pot blog: https://deepmind.google/blog/melting-pot-an-evaluation-suite-for-multi-agent-reinforcement-learning/
- Melting Pot paper: https://proceedings.mlr.press/v139/leibo21a.html

What they teach mechanically:

- ALEM is very close in spirit: long-horizon open-ended multi-agent
  coordination with role pressure, communication, resource trade, crafting, and
  separate base/coordination reward.
- Craftax/Crafter show compact open-world survival benchmarks with achievement
  progress and fast iteration.
- Melting Pot emphasizes generalization to novel social situations and partners.

How to adapt locally:

- Split scoring into:

```text
base Minecraft progress
social coordination progress
material transfer correctness
memory/continuity progress
cost/latency/action efficiency
```

- Add partner/seed generalization:

```text
same actor soul + different seed
same seed + different partner model
same task pressure + different resource asymmetry
```

What not to absorb:

- Do not replace Minecraft with a simplified gridworld for the main project.
  Use these as methodology references or cheap ablation environments only.

### PARTNR, TEACh, And CoELA

References:

- PARTNR arXiv: https://arxiv.org/abs/2411.00081
- PARTNR project: https://aihabitat.org/partnr/
- PARTNR GitHub: https://github.com/facebookresearch/partnr-planner
- TEACh arXiv: https://arxiv.org/abs/2110.00534
- TEACh GitHub: https://github.com/alexa/teach
- CoELA arXiv: https://arxiv.org/abs/2307.02485
- CoELA project: https://umass-embodied-agi.github.io/CoELA/

What they teach mechanically:

- Human/robot or multi-agent embodied tasks often depend on spatial, temporal,
  and heterogeneous capability constraints.
- TEACh shows the value of commander/follower dialogue where the embodied actor
  asks questions to resolve ambiguity and recover from mistakes.
- CoELA shows a modular embodied cooperation structure: perception, memory,
  communication, planning, execution.

How to adapt locally:

- Use heterogeneous capability constraints in Minecraft:

```text
one actor has the axe
one actor remembers the chest
one actor can craft
one actor is near the village
one actor is hungry or threatened
```

- Add clarification and recovery as first-class social events.

What not to absorb:

- Do not introduce an all-knowing commander as the normal runtime. Use
  commander/follower only as a benchmark scenario variant.

### GLEE And MultiAgentBench

References:

- GLEE arXiv HTML: https://arxiv.org/html/2410.05254v2
- GLEE GitHub: https://github.com/eilamshapira/GLEE
- MultiAgentBench arXiv HTML: https://arxiv.org/html/2503.01935v1
- MultiAgentBench ACL: https://aclanthology.org/2025.acl-long.421/
- MARBLE GitHub: https://github.com/ulab-uiuc/MARBLE

What they teach mechanically:

- GLEE parameterizes bargaining, negotiation, and persuasion, and measures
  efficiency, fairness, and self-gain.
- MultiAgentBench uses milestone KPIs, role assignments, coordination
  protocols, and communication/planning scores across cooperative and
  competitive settings.

How to adapt locally:

- Define a lightweight Minecraft social economy:

```text
personal possession
requested transfer
loan/return
compensation
shared use of weak public affordances
misuse/repair
```

- Use fairness/efficiency only when there is a real material constraint:

```text
scarce tool time, scarce food, scarce station access, night safety, distance
```

What not to absorb:

- Do not turn the project into abstract text-only bargaining.
- Do not make "shared resources" the ideology of the system. Shared resources
  should remain weak public affordances unless a scenario needs stronger common
  ownership.

### SOTOPIA, AgentSense, And Lifelong SOTOPIA

References:

- SOTOPIA project: https://sotopia.world/
- SOTOPIA arXiv: https://arxiv.org/abs/2310.11667
- AgentSense ACL PDF: https://aclanthology.org/2025.naacl-long.257.pdf
- Lifelong SOTOPIA OpenReview: https://openreview.net/forum?id=XdcuqZRhjQ

What they teach mechanically:

- Social interaction needs scenario goals, character/relationship context, and
  multi-turn evaluation.
- Lifelong social evaluation reveals long-history degradation even when agents
  have access to prior interactions.

How to adapt locally:

- Use social event types and long-history continuity metrics:

```text
request, promise, refusal, warning, apology, repair, debt, gratitude, conflict
```

- Make memory evidence-backed, compacted, and testable across episodes.

What not to absorb:

- Do not score only role-play believability. Minecraft state must constrain the
  social claim.

### AgentSociety And SocioVerse

References:

- AgentSociety arXiv: https://arxiv.org/abs/2502.08691
- AgentSociety GitHub: https://github.com/tsinghua-fib-lab/agentsociety/
- SocioVerse arXiv: https://arxiv.org/abs/2504.10157

What they teach mechanically:

- LLM social simulators increasingly focus on population scale, interventions,
  surveys, and macro-level social patterns.

How to adapt locally:

- Borrow intervention logic:

```text
same seed, same actors, change one social pressure variable
```

- Use small populations first. Two or three actors with verified material state
  are more defensible than a large village with weak evidence.

What not to absorb:

- Do not claim population-level human social science validity from Minecraft NPC
  traces.

### Validation And Boundary Papers

References:

- SimBench arXiv: https://arxiv.org/abs/2510.17516
- LLM-Based Social Simulations Require a Boundary: https://arxiv.org/abs/2506.19806
- Don't Trust Generative Agents: https://arxiv.org/abs/2506.21974
- Mind the Sim2Real Gap in User Simulation: https://arxiv.org/html/2603.11245v1
- Validation is the central challenge for generative social simulation:
  https://link.springer.com/article/10.1007/s10462-025-11412-6

What they teach mechanically:

- Simulation fidelity must be measured relative to a concrete target.
- Stronger models do not automatically produce more faithful social simulation.
- Mean alignment can hide variance collapse and homogenized behavior.
- Human realism, behavioral realism, and internal benchmark success are different
  claims.

How to adapt locally:

- The first paper claim should be:

```text
we measure grounded Minecraft social trajectories
```

not:

```text
we simulate real society
```

- Report limitations as first-class results:

```text
model agreement can be fake progress
memory can launder claims
task success can reduce social quality
more reasoning/cost can fail to improve trajectories
```

What not to absorb:

- Do not make human-fidelity validation a blocker for the first Minecraft
  benchmark. It is a later layer.

## Synthesis: Where The Project Should Sit

The project should be positioned between four existing research clusters:

| Cluster | Existing focus | Local gap |
| --- | --- | --- |
| Minecraft task agents | open-world tasks, skills, exploration, crafting, building | social consequences are usually secondary or bounded to task collaboration |
| Embodied multi-agent collaboration | coordination, role asymmetry, communication, planning | often household/grid/sim tasks, not persistent Minecraft material state |
| LLM social/economic benchmarks | goals, bargaining, fairness, social intelligence | mostly text/world-model based, not block/inventory/container verified |
| LLM social simulation validation | empirical realism, boundary setting, simulation validity | warns against overclaiming but does not provide Minecraft substrate |

That yields a tighter contribution:

```text
An evidence-grounded benchmark and runtime for Minecraft social trajectories,
where speech, obligation, memory, resource movement, and post-goal continuation
are constrained by verified world artifacts.
```

## Recommended Benchmark Direction

Name shape:

```text
Grounded Minecraft Social Trajectory Benchmark
```

Core idea:

```text
Do not ask whether agents can merely complete a Minecraft task.
Ask whether a social event changes verified Minecraft state and constrains
future behavior.
```

Suggested scenario families:

| Family | Scenario | Main variable | Main metric |
| --- | --- | --- | --- |
| Asymmetric possession | One actor owns a needed tool or material. | ownership, transfer, return. | obligation lifecycle and material flow correctness. |
| Asymmetric knowledge | One actor knows a recipe/location/route. | clarification, instruction, memory. | communication-action coherence and later recall. |
| Weak public affordance | A table/furnace/chest/path marker is public-use but lightly owned. | contribution, use, misuse, repair. | public-use events and repair quality. |
| Role pressure | Actors have different LifeGoals or duties. | role conflict, priority, refusal. | fairness/efficiency tradeoff and relationship update. |
| World pressure | Hunger, night, mobs, distance, scarce tool time. | interruption, safety, prioritization. | recovery, truthful blocker handling, post-goal continuation. |
| Partner generalization | Same actor meets a different model/role. | unfamiliar partner behavior. | robustness across partner and seed matrix. |

Primary outcome families:

```text
base Minecraft progress
social coordination progress
material claim correctness
obligation lifecycle completion
memory/relationship continuity
post-goal continuation
cost, latency, actions, cycles
```

Paper-quality figure ideas:

- base progress vs coordination progress, inspired by ALEM/Craftax scoring;
- obligation lifecycle Sankey from request to fulfillment/block/repair;
- material flow graph by actor/item/container;
- milestone survival curve: cycles to first verified social consequence;
- seed/model/partner robustness matrix;
- cost-normalized trajectory score;
- communication-action mismatch rate over cycles;
- after-success continuation timeline.

## Implementation Implications

Immediate harness priorities:

1. Social event schemas:

```text
request, promise, refusal, handoff, warning, apology, repair, obligation_update
```

2. Material claim schemas:

```text
personal_possession, requested_transfer, loan, return, compensation,
weak_public_affordance, misuse
```

3. Evidence refs on every social score:

```text
chat event, inventory delta, container delta, placed block, world scan,
action verifier, memory update, relationship update
```

4. Negative controls:

```text
impossible request, missing item, unsafe request, unavailable partner,
conflicting LifeGoals
```

5. Separate score axes:

```text
task success is not social success
social claim is not material truth
memory text is not proof
reasoning effort is not quality
```

## What To Read Next In Depth

Priority A:

- MineExplorer: benchmark construction, milestone checks, hidden dependency
  difficulty.
- ALEM: base reward vs coordination reward, memory/communication analysis.
- MineCollab: Minecraft collaborative tasks and communication bottleneck.
- GLEE: fairness/efficiency metrics for material exchange.

Priority B:

- PARTNR and TEACh: embodied dialogue and heterogeneous capability constraints.
- Echo: memory taxonomy and transfer dimensions.
- MCU/MineStudio: task pool and standardized Minecraft evaluation.

Priority C:

- SimBench and Boundary papers: validation language for the paper.
- Melting Pot and Multi-Agent Craftax: social/partner generalization logic.

## Final Research Takeaway

The best next research move is not to build a bigger fake village.

The best move is to build a small but hard-to-fake benchmark where:

```text
social speech creates an obligation;
the obligation requires verified Minecraft action;
the material world records whether it happened;
memory and relationship state carry the consequence forward;
the run continues after success or failure;
models are compared by trajectory quality, cost, latency, and robustness.
```
