# Reference Sweep Beyond Project Sid

Date: 2026-06-16

Search token: `REFERENCE_SWEEP_BEYOND_PROJECT_SID_2026_06_16`.

Status: research archive. This note supports the active synthesis in
`project-docs/Architecture/Research-Direction-Reference-Synthesis.md`, but it is
not itself a runtime spec.

## Scope

This sweep revisits the project direction from first principles after reviewing
Project Sid. The goal is to identify stronger reference families for a
Minecraft-based LLM social simulation paper without making Project Sid the
center of the framing.

The working question is:

```text
What should this repo study if the target is not generic Minecraft task
completion, not a viral civilization demo, and not dialogue-only social
simulation?
```

## Research Audit Method

The sweep followed a `web-research-audit` style process:

- confirm: primary paper pages, ACL Anthology pages, arXiv pages, OpenReview
  pages, project repositories, and project pages;
- disconfirm: methodology papers warning against overclaiming LLM social
  simulations;
- widen: Minecraft collaboration, LLM social intelligence, social simulation
  platforms, economic/game-theoretic multi-agent benchmarks, and human-grounded
  Minecraft dialogue datasets.

Evidence depth is mixed. For many papers, this note uses primary abstract pages
or official project pages rather than full PDF re-reading. Claims below should
therefore be read as reference triage and direction-setting, not as a finished
literature review for submission.

Verdict: `conditional-pass` for research direction. The source diversity is
good enough to set the next research frame, but a paper draft should still run a
full-PDF pass over the final core references.

## Claim Ledger

| Claim | Status | Evidence | Caveat |
| --- | --- | --- | --- |
| Minecraft is established as an embodied/open-world agent substrate. | supported | MineDojo, Voyager, MineCollab, TeamCraft, VillagerBench, CausalMACE. | These works mostly target task ability, exploration, or collaboration, not persistent social life. |
| Existing Minecraft multi-agent benchmarks are usually bounded task-collaboration benchmarks. | supported | VillagerBench, TeamCraft, MineCollab, CausalMACE. | Some works discuss open-ended play or society, but the evaluated protocol is still task-centric. |
| There is older human-grounded Minecraft work on collaborative dialogue and theory of mind. | supported | Collaborative Dialogue in Minecraft, CraftAssist, MindCraft. | These are not modern LLM society papers, but they are strong grounding references. |
| LLM social intelligence benchmarks exist, but are mostly text/role-play settings. | supported | SOTOPIA, AgentSense, Lifelong SOTOPIA. | They provide social scenarios and evaluation logic, not Minecraft physical evidence. |
| Large social simulators exist, but their grounding is usually language/social/digital, not Mineflayer-verified Minecraft state. | supported | Concordia, AgentSociety, SocioVerse, social simulation survey. | Concordia explicitly supports grounded spaces, but Minecraft block/inventory truth is outside its default scope. |
| Social simulation claims need stronger validation boundaries than "agents looked believable." | supported | SimBench, Don't Trust Generative Agents, Mind the Sim2Real Gap, LLM-Based Social Simulations Require a Boundary, reasoning-model mismatch work. | Some cautionary papers are recent preprints; use as methodology warnings, not as final settled fact. |

## Reference Families

### 1. Human-Grounded Minecraft Collaboration

Representative sources:

- [Collaborative Dialogue in Minecraft](https://aclanthology.org/P19-1537/)
- [CraftAssist](https://ai.meta.com/research/publications/craftassist-a-framework-for-dialogue-enabled-interactive-agents/)
- [MindCraft: Theory of Mind Modeling for Situated Dialogue in Collaborative Tasks](https://aclanthology.org/2021.emnlp-main.85/)

What they teach mechanically:

- Minecraft has already been used as a grounded collaborative dialogue
  environment, not only as an RL sandbox.
- The architect/builder setup separates observation authority from physical
  action authority.
- MindCraft introduces asymmetric knowledge, asymmetric skills, partner belief
  tracking, and situated dialogue records.
- These works treat chat, action, and world logs as coupled evidence.

How this repo should adapt them:

- Use them as a stronger root than Project Sid for defining "social action" in
  Minecraft.
- Create social scenarios from asymmetric knowledge, asymmetric tools, partial
  observability, and partner belief state.
- Keep the task physically grounded, but score the social process: requests,
  clarifications, belief updates, handoffs, and repair.
- Do not copy architect/builder as the only scenario. Use it as a minimal
  pattern for communication grounded in visible action.

### 2. Open-Ended Single-Agent Minecraft Competence

Representative sources:

- [MineDojo](https://arxiv.org/abs/2206.08853)
- [Voyager](https://arxiv.org/abs/2305.16291)

What they teach mechanically:

- MineDojo frames Minecraft as a large task and knowledge substrate.
- Voyager shows curriculum, executable skill libraries, environment feedback,
  and self-verification for open-ended Minecraft progress.

How this repo should adapt them:

- Treat individual competence as a gate. Social runs are not meaningful if the
  actor cannot gather, craft, place, move, and recover truthfully.
- Adapt skill-library ideas into actor-owned action skill promotion with
  verifier evidence.
- Reject the idea that tech-tree progress is the top-level product goal.

### 3. Modern Minecraft Multi-Agent Task Collaboration

Representative sources:

- [VillagerAgent / VillagerBench](https://aclanthology.org/2024.findings-acl.964/)
- [TeamCraft](https://arxiv.org/abs/2412.05255)
- [MINDcraft / MineCollab](https://arxiv.org/html/2504.17950v1)
- [S-Agents](https://arxiv.org/abs/2402.04578)
- [MindForge](https://arxiv.org/abs/2411.12977)
- [CausalMACE](https://aclanthology.org/2025.findings-emnlp.777/)
- [HAS](https://arxiv.org/abs/2403.08282)

What they teach mechanically:

- Collaboration in Minecraft can be decomposed into spatial, causal, temporal,
  communication, resource, and role dependencies.
- MineCollab is especially useful because it makes agents coordinate cooking,
  crafting, and construction while sharing resources and communicating under
  resource/time constraints.
- TeamCraft emphasizes generalization across goals, scenes, and agent counts.
- VillagerBench and CausalMACE make dependency graphs explicit.
- MindForge highlights theory-of-mind-style representations, inter-agent
  communication, and multi-component memory for collaborative learning.
- S-Agents and HAS point to organizational structure and dynamic coordination,
  but their evaluated tasks remain building/resource/navigation oriented.

How this repo should adapt them:

- Borrow task dependency metrics, communication-efficiency metrics, resource
  handoff checks, and role-dependency design.
- Do not make a hidden global planner or DAG executor the core runtime.
- Use task collaboration as the lower layer beneath a social-economy benchmark:
  a task matters because it creates obligations, material claims, trust, and
  durable state.
- MineCollab's failure modes are directly useful: agents can talk too much,
  fail to share resources, or share resources without goal alignment. Those are
  social/runtime failures this repo can measure from artifacts.

### 4. LLM Social Intelligence And Lifelong Interaction

Representative sources:

- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [SOTOPIA](https://arxiv.org/abs/2310.11667)
- [AgentSense](https://aclanthology.org/2025.naacl-long.257/)
- [Lifelong SOTOPIA](https://openreview.net/forum?id=XdcuqZRhjQ)

What they teach mechanically:

- Generative Agents made memory, reflection, planning, and emergent social
  behavior a familiar LLM-agent pattern.
- SOTOPIA evaluates social goal completion across role-play scenarios involving
  coordination, collaboration, exchange, and competition.
- AgentSense increases scenario diversity and evaluates both goal completion
  and implicit reasoning.
- Lifelong SOTOPIA argues that multi-episode social interaction degrades unless
  memory and history use are handled well.

How this repo should adapt them:

- Use social goals and multi-turn evaluation, but ground every social claim in
  Minecraft action, inventory, block, container, chat, memory, or relationship
  evidence.
- Treat memory continuity as a central metric, not just prompt context.
- Do not count believable dialogue as society unless it changes future behavior
  or durable state.

### 5. Social Simulation Platforms And Population-Scale Work

Representative sources:

- [Concordia](https://github.com/google-deepmind/concordia)
- [Concordia technical report](https://arxiv.org/html/2312.03664v2)
- [AgentSociety](https://arxiv.org/abs/2502.08691)
- [SocioVerse](https://arxiv.org/abs/2504.10157)
- [From Individual to Society survey](https://arxiv.org/abs/2412.03563)

What they teach mechanically:

- Concordia provides a game-master style loop for generative agent-based models
  in physical, social, or digital environments.
- AgentSociety and SocioVerse emphasize scale, interventions, surveys, and
  population-level analysis.
- The survey divides the field into individual simulation, scenario simulation,
  and society simulation, which is a useful taxonomy for positioning this repo.

How this repo should adapt them:

- Borrow experiment design concepts: interventions, scenario families,
  reproducible runs, and claim boundaries.
- Do not jump to population-scale simulation before the Minecraft runtime can
  produce trustworthy actor-level traces.
- The local equivalent of a "game master" is not an LLM narrator. It is the
  runtime plus Mineflayer plus validators plus artifact ledger.

### 6. Cooperation, Economy, And Mixed-Motive Benchmarks

Representative sources:

- [MAgIC](https://arxiv.org/abs/2311.08562)
- [GLEE](https://arxiv.org/abs/2410.05254)
- [MultiAgentBench](https://aclanthology.org/2025.acl-long.421/)
- [Concordia Contest report](https://openreview.net/forum?id=yG4Fj0voJZ)

What they teach mechanically:

- Social behavior is easier to evaluate when there are incentives, scarcity,
  fairness, efficiency, deception, cooperation, competition, or mutual gain.
- GLEE's economic framing is directly relevant to the user's concern about
  "personal property" and lightweight resource economy.
- MultiAgentBench's milestone-based KPIs and coordination topologies are useful
  for figures, but too broad to become this repo's main target.
- Concordia Contest emphasizes generalization to unfamiliar partners and novel
  mixed-motive scenarios.

How this repo should adapt them:

- Use Minecraft item possession, tool access, time, danger, stations, and shared
  affordances as the lightweight economy.
- Avoid heavy shared-resource ideology. The useful unit is a material claim:
  who holds an item, who can use it, who promised it, who consumed it, and what
  evidence supports that.
- Add conflict and repair gradually after cooperative obligation lifecycles are
  trustworthy.

### 7. Validation And Overclaim Warnings

Representative sources:

- [SimBench](https://arxiv.org/abs/2510.17516)
- [Don't Trust Generative Agents](https://arxiv.org/abs/2506.21974)
- [Mind the Sim2Real Gap](https://arxiv.org/abs/2603.11245)
- [When Reasoning Models Hurt Behavioral Simulation](https://arxiv.org/abs/2604.11840)
- [LLM-Based Social Simulations Require a Boundary](https://arxiv.org/html/2506.19806v1)

What they teach mechanically:

- Behavioral simulation needs validation; plausible output is not enough.
- Stronger reasoning or larger models may improve solving while still harming
  behavioral fidelity in some simulation settings.
- Human-like simulation claims need boundary conditions, heterogeneity, temporal
  consistency, robustness, and ideally human-grounded comparison.

How this repo should adapt them:

- Keep the first research claim narrow: evidence-grounded Minecraft social
  trajectories, not faithful human society.
- Report cost, latency, model settings, retries, stalls, and failed continuity.
- Later compare traces against human play or human judgments. Do not require
  that for the first harness paper, but design artifacts so it becomes possible.

## Stronger Research Framing

The strongest direction is not:

```text
Can LLM agents build a civilization in Minecraft?
```

That framing is too easy to overclaim and too vulnerable to viral-demo
skepticism.

The stronger direction is:

```text
Can LLM-controlled Minecraft actors sustain evidence-grounded social
trajectories in a natural open world, where social claims are constrained by
physical action, material possession, obligations, memory continuity, and
post-goal continuation?
```

This places the repo between two established areas:

- Minecraft agent work already tests open-world embodied competence and
  collaboration.
- LLM social simulation already tests believable interaction, social goals, and
  population dynamics.

The gap is the middle:

```text
We do not yet have a good protocol for evaluating whether embodied LLM actors
can maintain durable social life inside a physically verifiable open world.
```

## Recommended Gap Type

Primary gap: application + methodological.

One-line version:

```text
Existing Minecraft agent benchmarks mostly evaluate task completion or
task-oriented collaboration, while existing LLM social simulations often lack a
live physical substrate with verifiable resource use, movement, crafting,
storage, and environmental consequences.
```

Secondary gap: evidence.

```text
We lack reproducible evidence about whether stronger or more expensive LLMs
actually produce better grounded social trajectories when cost, latency, action
count, resource movement, memory continuity, and recovery are measured.
```

Contradictory gap to keep in view:

```text
General reasoning strength may diverge from social simulation fidelity, so model
comparison should measure social behavior as behavior, not only as problem
solving.
```

## Project Sid Position After This Sweep

Project Sid remains useful, but it should not be the project anchor.

Use it for:

- scenario inspiration;
- failure modes;
- cautionary comparison against civilization-scale claims;
- evidence that Minecraft society claims attract attention and skepticism.

Do not use it for:

- the active architecture;
- the primary research gap;
- the main benchmark method;
- proof that many-agent society is already solved.

The stronger root references for this repo are the combination of:

```text
MindCraft / Collaborative Dialogue in Minecraft
+ MineCollab / VillagerBench / TeamCraft
+ SOTOPIA / Lifelong SOTOPIA / AgentSense
+ Concordia / SimBench-style validation warnings
```

## Suggested Next Literature Pass Before Paper Writing

Before turning this into a paper introduction, full-read these first:

1. MindCraft 2021.
2. Collaborative Dialogue in Minecraft 2019.
3. MINDcraft / MineCollab 2025.
4. VillagerBench 2024.
5. SOTOPIA and Lifelong SOTOPIA.
6. Concordia technical report and Concordia Contest report.
7. SimBench, Mind the Sim2Real Gap, and LLM-Based Social Simulations Require a
   Boundary.

These cover the full path from grounded Minecraft dialogue to modern LLM social
simulation methodology.
