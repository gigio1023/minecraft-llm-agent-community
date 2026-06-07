---
sidebar_position: 8
---

# LLM Context And Actor Workspace

The full visual review is a static HTML page:

```text
project-docs/static-exports/architecture/llm-context-and-actor-workspace.html
```

It covers:

- current system architecture across stable probe, live dialogue, and exploratory
  generated action skill paths;
- the exact provider-facing message structures for first and later turns;
- memory layers and how they enter provider context;
- actor workspace initialization and action skill lifecycle ownership;
- initial action skill catalogs;
- how actor-owned action skills expand from evidence into candidates,
  recipes, trials, promotion, supersession, and retirement.

The key design is now implemented in the active runtime: actor workspace is the
source of truth for active, candidate, retired, and rejected action skill records.
Provider-facing context is built from actor workspace state, recent evidence,
recent reviews, memory, actor profile, goal stack, and relationships.

Legacy generated output under `build/generated-skills` remains debug or archive
material only. It must be migrated into actor workspace candidate proposals and
validated recipes before it can become actor-owned runtime behavior.

For canonical implementation contracts, use:

- `Runtime-Loop-And-Verification.md`
- `Transcript-And-Runtime-Artifacts.md`
- `Actor-Workspace-And-Action-Skill-Memory.md`
- `Async-Reviewer-Sidecars.md`
- `Implementation-Workstreams.md`
- `Social-Actor-Profiles-And-Relationships.md`

This page remains the visual audit map for the context packet and action skill
lifecycle.
