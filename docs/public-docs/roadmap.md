---
sidebar_position: 5
---

# Roadmap

The project is rebuilding from a small reliable core rather than starting with a
large village simulation.

## Current Target

- one actor backed by one Mineflayer bot;
- boring Minecraft tasks completed end to end;
- strong transcript and runtime artifacts;
- truthful stall, failure, and reconnect reporting;
- actor-owned action skill state;
- persistent work state that survives context changes.

## Next Layer

- richer ActorSoul and LifeGoal continuity;
- stronger action-surface diagnostics;
- better actor memory and relationship pressure;
- bounded generated action-skill authoring through explicit action selection;
- low-cost social-cycle runs that remain truthful under provider limits.

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
- hidden planner heuristics that make the actor look smarter than the evidence
  supports.

The public milestone is simple: a small runtime where observers can inspect what
happened, why it happened, and what the actor should remember next.
