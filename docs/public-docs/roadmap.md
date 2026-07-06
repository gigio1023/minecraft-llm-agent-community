---
sidebar_position: 5
---

# Roadmap

The project is rebuilding from a small reliable core rather than starting with a
large village simulation. The active research target is embodied co-actor
legibility: whether public interaction history makes another actor's
social/material response more predictable than strong baselines.

## Current Target

- a 2-3 actor shared Minecraft session;
- per-actor provider routing, including deterministic scripted responders;
- cross-actor observation and chat capture;
- response windows that close only after other actors have a real turn to
  respond or a declared timeout fires;
- truthful `transition-row/v1` rows with observed deltas and evidence refs;
- public-history export that excludes private ActorSoul, memory, PlanBeads, and
  provider IO;
- offline prediction join and scoring after labels are locked.

## Next Layer

- Session 1: a provider-free deterministic end-to-end smoke with a scripted
  responder and a trivial history predictor that should show lift;
- Session 2: a preregistered live pilot across scripted, stable-soul, and
  resampled-soul conditions;
- decision artifacts that apply the preregistered stop-results before any public
  claim;
- richer ActorSoul, memory, relationship, and generated action-skill work only
  where it feeds the measured experiment.

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
  before the legibility substrate produces a decision.

The public milestone is simple: a small runtime where observers can inspect what
was public before an action, what happened afterward, which labels were locked,
which predictor arms were scored, and what result would make the project stop.
