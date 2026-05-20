---
sidebar_position: 8
---

# LLM Context And Actor Workspace

The full visual review is a static HTML page:

```text
docs/static/architecture/llm-context-and-actor-workspace.html
```

It covers:

- current system architecture across stable probe, live dialogue, and exploratory
  generated action skill paths;
- the exact provider-facing message structures for first and later turns;
- memory layers and how they enter provider context;
- actor workspace initialization and current lifecycle gaps;
- initial action skill catalogs;
- how actor-owned action skills should expand from evidence into candidates,
  recipes, trials, promotion, supersession, and retirement.

The key finding is that the actor workspace exists as a non-destructive
filesystem baseline, but the live LLM/action-skill lifecycle does not yet use it
as the source of truth for candidate, active, or retired action skills.

The current spec resolves that gap by making actor workspace the only source of
truth for actor-owned action skill lifecycle state. Legacy generated output
under `build/generated-skills` is debug output only until it is archived,
disabled, or migrated into a validated actor workspace candidate.

For canonical implementation contracts, use:

- `Runtime-Loop-And-Verification.md`
- `Transcript-And-Runtime-Artifacts.md`
- `Actor-Workspace-And-Action-Skill-Memory.md`
- `Async-Reviewer-Sidecars.md`
- `Implementation-Workstreams.md`

This page remains the visual implementation audit and gap map.
