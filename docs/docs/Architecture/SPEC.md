---
sidebar_position: 1
---

# Architecture Specification

This page is now a thin architecture overview.

The canonical rebuild spec lives in the repo root at:

- `SPEC.md`

Use that file as the source of truth for:

- current product direction;
- current rebuild scope;
- module boundaries;
- workstreams;
- dependency graph;
- validation criteria.

## Current Architecture Summary

The active architecture direction is:

- a small, headless, bounded Minecraft runtime;
- one-bot boring gameplay competence before larger social claims;
- runtime-owned validation, timeout, verification, reconnect, transcript, and artifacts;
- live transcript and runtime artifacts as the primary evidence;
- checkpoint-ready runtime design;
- room for later per-agent action skill ownership and social simulation growth.

## Important Constraints

- do not reintroduce raw gameplay `eval` loops;
- do not optimize for persona richness before competence exists;
- do not optimize for long-run autonomy before short-run boring tasks are reliable;
- do not let quick probes become permanent monoliths.

## Read Next

1. `../../../../SPEC.md`
2. `../Architecture/Minimal-Probe.md`
3. `../Setup/Headless-Server.md`
4. `../Setup/Provider-Setup.md`

## Historical Note

Older architecture and plan docs in this repository may still be useful as
research context, but they should not override the current root `SPEC.md`.
