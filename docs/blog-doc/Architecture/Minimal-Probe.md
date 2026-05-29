---
sidebar_position: 2
---

# Minimal Probe

This page describes the active current-phase goal in plain language.

## What The Minimal Probe Is

The minimal probe is not a social-simulation demo.

It is a small runtime proof where:

- a headless actor observes the world;
- chooses one bounded action at a time;
- makes real progress on a boring gameplay task;
- records enough evidence that a human or coding agent can explain failure.

## Current Proof Target

The current proof target should include:

- `collect_logs` working end-to-end in live Minecraft;
- follow-up progression beyond the first log attempt;
- transcript-visible evidence for progress, failure, timeout, or stall;
- actor workspace evidence and provider input snapshots for LLM-backed paths;
- active action-skill gates that reject unsupported provider proposals;
- reviewer output that proposes repairs or relationship updates without
  mutating active runtime state;
- truthful reconnect/session evidence when reconnect is exercised;
- checkpoint-ready runtime artifacts.

Deep reconnect refactoring is not the current implementation driver. The probe
should avoid claiming reconnect success unless runtime tools and verification
state are actually fresh.

## What Makes This Valuable

The value of this probe is not that it looks alive.
The value is that it behaves in a way we can improve.

The minimum bar is:

- real gameplay progress;
- no fake success;
- failures diagnosable from transcript, artifacts, and traces.

## Why This Still Points Toward Social Simulation

The minimal probe is the substrate for later work on:

- role context;
- shared/private memory;
- per-actor action skill ownership;
- bounded action skill evolution;
- multi-actor coordination;
- human-in-the-loop social play.

Those later layers should not be forced into the runtime before the runtime can
reliably handle boring competence.

## Not Current Goals

- persona richness as a content target;
- long-run autonomy as a product target;
- large society behavior before single-actor competence is trustworthy.

## Canonical Spec

For the authoritative rebuild plan, read:

- `../../../SPEC.md`
