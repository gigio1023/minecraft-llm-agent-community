---
sidebar_position: 3
---

# Documentation Map

Search token: `DOCUMENTATION_MAP`.

Status: active documentation routing and cleanup policy.

This repository keeps public docs, active internal docs, reference material, and
archives separate. The split is intentionally path-visible so a reader can tell
whether a file is current authority, implementation support, literature
reference, or historical context before opening it.

## Authority Order

When documents disagree, use this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md`, subordinate to `AGENTS.md`
4. current research spine docs under `project-docs/research/current-spine/`
5. long-term specs under `project-docs/specification/`
6. `project-docs/orientation/terminology.md`
7. `project-docs/orientation/agent-search-index.md`
8. active runtime support docs under `project-docs/runtime/`
9. current setup, handoff, audit, future-work, and run-report docs under
   `project-docs/operations/`
10. reference material under `project-docs/references/`
11. historical material under `project-docs/archive/`

Do not fix a conflict by silently rewriting the spec. If the conflict changes
long-term direction, get explicit user approval first.

## Top-Level Layout

```text
project-docs/
  orientation/        maps, terminology, onboarding, and documentation policy
  specification/      long-term project specs and governance boundaries
  research/           active research spine, benchmark plans, reference synthesis
  runtime/            runtime architecture and implementation-support contracts
  operations/         setup, handoffs, audits, future work, and run reports
  experiments/        curated experiment reports and raw imported run artifacts
  knowledge/          stable Minecraft and Mineflayer background knowledge
  references/         literature reviews, external-project notes, source dumps
  archive/            superseded plans and historical public-doc material
  assets/             internal project-doc images and media assets
  exports/            static exports that are useful but not active docs
  external-activities/ external contribution or community activity packages
```

Keep directory names lowercase kebab-case. Root convention files such as
`README.md`, `SPEC.md`, `AGENTS.md`, and `CLAUDE.md` are exceptions.
Raw source dumps may preserve original upstream filenames.

## Repo-Root Internal Documents

These files stay in the project root because they guide contributors, agents,
reviewers, or implementation review:

- `README.md`
- `SPEC.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`

The current implementation review document lives at the repo root because it is
an internal whole-project implementation map. Keep large review diagrams there
instead of making `README.md` or public docs noisy.

## Public Docusaurus Docs

Docusaurus-exposed docs live under:

```text
docs/public-docs/
```

The generated URL route may still be `/docs/...`; the repository path is the
ownership boundary. Do not put private provider access, operator budget state,
dated handoffs, internal implementation plans, or agent operating rules under
the public docs tree.

Public docs currently include:

- `docs/public-docs/intro.md`
- `docs/public-docs/getting-started.md`
- `docs/public-docs/architecture.md`
- `docs/public-docs/evidence-and-artifacts.md`
- `docs/public-docs/roadmap.md`

## Active Internal Docs

Start from:

- `project-docs/index.md`
- `project-docs/orientation/overview.md`
- `project-docs/orientation/agent-search-index.md`
- `project-docs/orientation/terminology.md`

Current research direction lives under:

- `project-docs/research/current-spine/research-documentation-hierarchy.md`
- `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`
- `project-docs/research/current-spine/research-value-harness.md`
- `project-docs/research/current-spine/no-regret-core-research-protocol.md`
- `project-docs/research/current-spine/transition-row-v1-contract.md`
- `project-docs/research/current-spine/goldilocks-preflight-protocol.md`
- `project-docs/research/current-spine/society-observable-preflight.md`

Long-term specification files live under:

- `project-docs/specification/`

Runtime support docs live under:

- `project-docs/runtime/overview/`
- `project-docs/runtime/actor-turn/`
- `project-docs/runtime/action-skills/`
- `project-docs/runtime/actor-state-and-memory/`
- `project-docs/runtime/planbeads/`
- `project-docs/runtime/evidence-and-verification/`
- `project-docs/runtime/world-scenarios/`
- `project-docs/runtime/provider-and-codegen/`

Operational docs live under:

- `project-docs/operations/setup/`
- `project-docs/operations/handoffs/`
- `project-docs/operations/audits/`
- `project-docs/operations/future-work/`
- `project-docs/operations/run-reports/`

## Experiments

Experiment records live under:

```text
project-docs/experiments/
  index.md
  raw-index.md
  catalog.json
  curated/YYYY-MM-DD/<experiment-slug>/
  raw/YYYY-MM-DD/<artifact-kind>/
```

`curated/` is for reports meant to be read directly. `raw/` preserves selected
run artifacts imported from scratch paths. Do not delete raw artifacts merely
because they are hard to read; add indexes or summaries instead.

## References And Archives

Use `project-docs/references/` for material that remains intellectually useful
but should not be treated as active implementation instruction:

- `project-docs/references/literature-reviews/`
- `project-docs/references/literature-sweeps/`
- `project-docs/references/external-project-notes/`
- `project-docs/references/memory-research/`

Use `project-docs/archive/` for superseded plans and historical public-doc
material:

- `project-docs/archive/superseded-plans/`
- `project-docs/archive/historical-public-docs/`

Archived and reference documents preserve context. They are not active build
instructions unless an active spec, current-spine doc, runtime doc, or handoff
explicitly promotes a section.

## Cleanup Rules

- Prefer one canonical definition doc over several drifting definitions.
- If a document is stale but useful, move it to `project-docs/references/` or
  `project-docs/archive/` and add a status note.
- Do not delete literature, source dumps, experiment artifacts, or historical
  plans just because they are noisy.
- Never use absolute local paths in newly written committed docs.
- When adding public Docusaurus docs, update `docs/sidebars.js` only if the page
  should be public navigation.
- When adding internal docs, update
  `project-docs/orientation/agent-search-index.md` when they become routing
  targets.
- After changing public docs structure, run `cd docs && npm run build`.

## Cleanup History

2026-06-30:

- active internal docs were moved to lowercase topic directories;
- `project-docs/Architecture/` was split into `research/`, `runtime/`, and
  `operations/`;
- `project-docs/Experiments/` became `project-docs/experiments/curated/` and
  `project-docs/experiments/raw/`;
- `project-docs/research-archive/` material was split between
  `project-docs/references/` and `project-docs/archive/`;
- raw papers, literature notes, and experiment artifacts were preserved.

2026-06-07:

- internal project docs moved from the former blog-shaped documentation root to
  `project-docs/`;
- Docusaurus docs plugin reads from `docs/public-docs/`;
- `docs/blog/` remains only for explicitly dated blog posts.
