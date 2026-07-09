---
sidebar_position: 5
---

# Roadmap

The project is rebuilding from a small reliable core rather than starting with a
large village simulation. The active research target is lived-vs-told causal
social memory: holding the current world state equivalent, does changing only
an actor's social history with a partner change its material behavior; does
lived history (enacted episodes) act differently than told history (an
equivalent narration); and can an observer read the effect from public events
alone?

## Current Target

- a 2-3 actor shared Minecraft session;
- per-actor provider routing, including a history-dependent scripted
  responder as the positive control;
- cross-actor observation and chat capture;
- matched-pair fixtures whose state equivalence is verified by hash before
  interpretation;
- history delivery at four rungs: none, narrated summary, narrated verbatim
  log, and enacted episodes;
- truthful `transition-row/v1` rows with observed deltas and evidence refs;
- a binary material follow-through target read only from typed runtime
  evidence, with intent and execution separated;
- public-history export that excludes private ActorSoul, memory, PlanBeads, and
  provider IO;
- observers that read raw public events only — never previously locked labels.

## Next Layer

- Session A: a provider-free deterministic end-to-end smoke where the
  history-dependent scripted responder must flip its behavior across matched
  histories and a trivial raw-event observer must recover the flip;
- Session B: a preregistered live pilot — narrated rungs first, then the
  enacted rung, then held-out-family observer scoring;
- decision artifacts that apply the preregistered stop-results before any public
  claim;
- richer memory, relationship, and generated action-skill work only where it
  feeds the measured experiment.

## Deferred Investigation

- `WORKSITE_SUPPORT_FUTURE_ITEM`: consider whether physical building tasks need
  a bounded worksite-support concept for local support surfaces, reachable
  placement cells, temporary clearing, and recovery from blocked placement. This
  is a project-local investigation item, not a Minecraft term, not an always-on
  shelter planner, and not executable authority.

## Not The Current Goal

- a race-to-diamond benchmark;
- an always-on house-building planner;
- a generic long-horizon autonomy demo;
- persona text without Minecraft consequences;
- evidence-first benchmarking as the headline;
- treating verified actions as the novel contribution;
- hidden planner heuristics that make the actor look smarter than the evidence
  supports;
- Qwen-AgentWorld, JarvisVLA, VLA, model training, or society-scale branches
  before the lived-vs-told experiment produces a decision.

The public milestone is simple: a small runtime where observers can inspect what
was public before an action, what happened afterward, which labels were locked,
which predictor arms were scored, and what result would make the project stop.
