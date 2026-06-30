---
sidebar_position: 5
---

# Roadmap

The project is rebuilding from a small reliable core rather than starting with a
large village simulation. The active research target is an advisory
social-material WAM: a model that predicts how candidate Minecraft actions
change physical state, possession, access, obligations, relationships, and
future action opportunities.

## Current Target

- one actor backed by one Mineflayer bot;
- boring Minecraft tasks completed end to end;
- strong transcript and runtime artifacts;
- truthful stall, failure, and reconnect reporting;
- actor-owned action skill state;
- persistent work state that survives context changes;
- transition rows that separate predicted consequences from observed outcomes.

## Next Layer

- richer ActorSoul and LifeGoal continuity;
- stronger action-surface diagnostics;
- better actor memory and relationship pressure;
- bounded generated action-skill authoring through explicit action selection;
- low-cost social-cycle runs that remain truthful under provider limits;
- a first prompt-based advisory WAM over physical/material deltas;
- dyadic social-material scenarios such as borrow/lend/return/refuse/repair.

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
  supports.

The public milestone is simple: a small runtime where observers can inspect what
was predicted, what happened, why it happened, and what the actor should
remember next.
