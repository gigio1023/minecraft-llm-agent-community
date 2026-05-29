---
sidebar_position: 4
---

# Reference Adaptation Guide

This is the literature-translation spec.

External references are useful, but they are not product specs. Every reference
must be translated through the project's Soul-grounded social-simulation goal.

For each paper, ask two questions:

1. What mechanism does this teach?
2. How should that mechanism be adapted to Soul-grounded Minecraft social
   simulation?

## Minecraft And Embodied Agent References

### Voyager

Reference: [Voyager](https://arxiv.org/abs/2305.16291)

Mechanism:

- automatic curriculum;
- executable skill library;
- environment feedback;
- self-verification and iterative improvement.

Adaptation:

- keep the idea of skill accumulation;
- implement it as actor-owned action skill lifecycle;
- require current-run evidence for promotion;
- do not revive raw eval or a global skill library detached from actor memory.

### MineDojo

Reference: [MineDojo](https://arxiv.org/abs/2206.08853)

Mechanism:

- open-ended Minecraft needs task diversity, knowledge, and scalable agent
  architecture.

Adaptation:

- build a repo-local Minecraft knowledge layer and explicit verifier contracts;
- do not let "open-ended" become unbounded runtime authority;
- keep tasks meaningful under Soul/LifeGoal context.

### Embodied Agent Interface

Reference: [Embodied Agent Interface](https://huggingface.co/papers/2410.07166)

Mechanism:

- separate goal interpretation, subgoal decomposition, action sequencing,
  transition modeling, hallucination errors, affordance errors, and planning
  errors.

Adaptation:

- social-cycle reports should classify failures by surface:
  Soul/LifeGoal framing, context packet, action-skill availability, primitive
  affordance, planner choice, verifier, terrain/world state, or provider
  failure.

## Reasoning, Action, And Affordances

### ReAct

Reference: [ReAct](https://arxiv.org/abs/2210.03629)

Mechanism:

- reasoning and acting interleave;
- environment feedback updates plans and handles exceptions.

Adaptation:

- use CycleGoal -> ActionIntent -> evidence -> CycleJudgment;
- do not treat chain-of-thought as authority;
- store concise, artifact-grounded judgments for the next cycle.

### Inner Monologue

Reference: [Inner Monologue](https://arxiv.org/abs/2207.05608)

Mechanism:

- language feedback from the environment improves embodied planning.

Adaptation:

- provide compressed world/social state and recent blocker summaries;
- do not dump raw transcript as the main context.

### SayCan

Reference: [SayCan](https://arxiv.org/abs/2204.01691)

Mechanism:

- language chooses among feasible skills/affordances.

Adaptation:

- active action skills and role-safe primitives are the actor's body;
- social context may influence allowed actions, but cannot grant tools.

### SWE-agent

Reference: [SWE-agent](https://arxiv.org/abs/2405.15793)

Mechanism:

- the action interface strongly shapes agent performance.

Adaptation:

- improve Minecraft primitive UX, verifier diagnostics, and context packets
  before increasing provider authority.

### Codex-Style Tool Runtime

Reference: [OpenAI Codex](https://github.com/openai/codex)

Mechanism:

- tools are registered, exposed, and dispatched through a runtime boundary;
- some tools are direct, some are deferred/searchable, and some are hidden;
- pre/post tool hooks, permission gates, sandbox policy, event streams, and
  goal accounting shape what the model can safely do;
- the core system provides context and action surfaces rather than
  hard-coding task strategies for each programming language.

Adaptation:

- expose Minecraft primitives and actor-owned action skills through an
  `action_surface` packet;
- keep direct/deferred affordance exposure separate from domain strategy;
- use pre/post action hooks and verifier artifacts to explain success, partial
  progress, blockers, and unsafe attempts;
- do not translate "house-building MCP demo" into core architecture. Translate
  it into better tool descriptions, schemas, hooks, and verifier evidence.

## Social Simulation And Persona References

### Generative Agents

Reference: [Generative Agents](https://arxiv.org/abs/2304.03442)

Mechanism:

- observation, memory, reflection, and planning support believable social
  behavior.

Adaptation:

- keep memory and reflection artifact-grounded;
- do not let reflection text count as Minecraft progress;
- use Soul/LifeGoal to avoid generic social roleplay.

### PsyMem

Reference: [PsyMem](https://huggingface.co/papers/2505.12814)

Mechanism:

- role-playing reliability needs psychological attributes and explicit memory
  control, not only text descriptions.

Adaptation:

- treat `soul.md`/ActorSoul as structured identity seed;
- connect it to memory and relationship artifacts;
- avoid relying on a single persona prompt.

### PersonaGym

Reference: [PersonaGym](https://huggingface.co/papers/2407.18416)

Mechanism:

- persona adherence needs evaluation; bigger models do not automatically solve
  it.

Adaptation:

- evaluate Soul consistency from actions, judgments, and memory, not just
  generated prose.

### Belief-Behavior Consistency

Reference: [Belief-Behavior Consistency](https://huggingface.co/papers/2507.02197)

Mechanism:

- role-playing agents can say one thing and behave another way.

Adaptation:

- compare provider-stated rationale with actual executed tools and verifier
  evidence;
- track mismatches as review findings or guardrail memory.

### Persona-Environment Behavioral Alignment

Reference: [Persona-Environment Behavioral Alignment](https://huggingface.co/papers/2509.16457)

Mechanism:

- behavior is a function of person plus environment.

Adaptation:

- put Soul and environment context in the same context packet;
- include scarcity, shelter, chest, obligations, trust, conflict, and settlement
  state when relevant;
- never privilege one context source, such as shelter, as the default
  architecture for all cycles.

### Social Simulation Realism

References:

- [Do Not Trust Generative Agents To Mimic Communication Unless Benchmarked](https://huggingface.co/papers/2506.21974)
- [Generative Agent Simulations of 1,000 People](https://huggingface.co/papers/2411.10109)
- [SALM](https://huggingface.co/papers/2505.09081)

Mechanism:

- social simulation needs empirical/behavioral validation, stable memory, and
  long-run consistency metrics.

Adaptation:

- start with local realism metrics:
  - did the actor follow Soul/LifeGoal context?
  - did relationships or obligations change action selection?
  - did memory retrieval affect later cycles?
  - did settlement state affect action selection?
  - did evidence contradict the actor's stated rationale?

## Memory References

References:

- [Reflexion](https://arxiv.org/abs/2303.11366)
- [Memory for Autonomous LLM Agents](https://huggingface.co/papers/2603.07670)
- [Controllable Memory Usage](https://huggingface.co/papers/2601.05107)
- [Intrinsic Memory Agents](https://huggingface.co/papers/2508.08997)

Mechanism:

- memory is a write/manage/read loop;
- reflection can improve future behavior;
- memory overuse can anchor behavior;
- agent-specific memory helps role consistency.

Adaptation:

- write memory only from evidence or clearly marked inference;
- separate episodic, procedural, social, belief, and guardrail memory;
- retrieve memory by objective, item/block, action skill, relationship, and
  recent blocker;
- avoid all-or-nothing memory injection;
- never let memory replace current-run verification.

## Rule Of Use

If applying a reference would make the actor ignore Soul/LifeGoal continuity,
relationships, obligations, or social consequences in favor of generic
task-completion performance, reject that application or reframe it.
