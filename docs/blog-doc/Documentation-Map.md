---
sidebar_position: 3
---

# Documentation Map

Search token: `DOCUMENTATION_MAP`.

Status: active documentation routing and cleanup policy.

This page defines where documentation belongs. The current split is deliberate:
`docs/blog-doc/` is the Docusaurus-exposed documentation root, while project-root
Markdown and `docs/research-archive/` are repo-internal material.

## Authority Order

When documents disagree, use this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md` and `GEMINI.md`, subordinate to `AGENTS.md`
4. `docs/blog-doc/Specification/*`
5. `docs/blog-doc/Terminology.md`
6. `docs/blog-doc/Agent-Search-Index.md`
7. active architecture docs under `docs/blog-doc/Architecture/`
8. current handoff, audit, setup, and future-work docs
9. internal review docs and research archives

Do not fix a conflict by silently rewriting the spec. If the conflict changes
long-term direction, get explicit user approval first.

## Repo-Internal Documents

These files are managed in the project root because they guide contributors,
agents, reviewers, or implementation review. They are not ordinary Docusaurus
content.

- `README.md`
- `SPEC.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `CONTRIBUTING.md`
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`

The current implementation review document lives at the repo root because it is
an internal whole-project implementation map. Keep large review diagrams there
instead of making `README.md` or the public docs landing page noisy.

## Docusaurus-Exposed Documents

All docs intended for the Docusaurus docs plugin live under:

```text
docs/blog-doc/
```

The Docusaurus URL route can still be `/docs/...`; the repository path is the
source-of-truth distinction. Do not add new Docusaurus docs under `docs/docs/`.

Public docs should explain stable direction, current architecture, setup, and
reviewable current state. Do not expose paper dumps, stale plans, or exploratory
research in the public sidebar.

## Active Public Docs

Orientation:

- `docs/blog-doc/intro.md`
- `docs/blog-doc/Documentation-Map.md`
- `docs/blog-doc/Agent-Search-Index.md`
- `docs/blog-doc/Terminology.md`

Long-term spec:

- `docs/blog-doc/Specification/Soul-Grounded-Social-Simulation.md`
- `docs/blog-doc/Specification/Runtime-Evidence-And-Action-Skills.md`
- `docs/blog-doc/Specification/Engineering-Governance-And-Testing.md`
- `docs/blog-doc/Specification/Reference-Adaptation-Guide.md`

Architecture:

- `docs/blog-doc/Architecture/SPEC.md`
- `docs/blog-doc/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
- `docs/blog-doc/Architecture/Runtime-Loop-And-Verification.md`
- `docs/blog-doc/Architecture/Transcript-And-Runtime-Artifacts.md`
- `docs/blog-doc/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `docs/blog-doc/Architecture/Social-Actor-Profiles-And-Relationships.md`
- `docs/blog-doc/Architecture/Action-Skill-Verification.md`
- `docs/blog-doc/Architecture/Bounded-Action-Skill-Creation.md`
- `docs/blog-doc/Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`
- `docs/blog-doc/Architecture/Actor-Persistent-State-And-PlanBeads.md`
- `docs/blog-doc/Architecture/PlanBeads-Implementation-Campaign.md`
- `docs/blog-doc/Architecture/Social-Cycle-LLM-Input-Cleanup-Plan.md`
- `docs/blog-doc/Architecture/Async-Reviewer-Sidecars.md`

Current state and operations:

- `docs/blog-doc/Architecture/Current-Handoff-And-Next-Work.md`
- `docs/blog-doc/Architecture/Current-Architecture-And-Implementation-Audit.md`
- `docs/blog-doc/Architecture/Future-Works.md`
- `docs/blog-doc/Architecture/Real-Server-Simulation-Test-Plan.md`
- `docs/blog-doc/Setup/Headless-Server.md`
- `docs/blog-doc/Setup/Provider-Setup.md`
- `docs/blog-doc/Setup/OpenAI-Tier3-Free-Usage.md`

Knowledge:

- `docs/blog-doc/Knowledge/Minecraft-Encyclopedia-Research-Brief.md`
- `docs/blog-doc/Knowledge/Minecraft-Encyclopedia/*`

## Internal Archives

Use `docs/research-archive/` for material that may remain useful but should not
shape the active public docs navigation:

- external paper dumps;
- old public `Research/` pages;
- old public `Plans/` pages;
- deep-dive literature notes;
- dated run reports that are no longer current handoff material.

Archived documents preserve context. They are not active implementation
instructions unless an active spec, architecture doc, or handoff explicitly
promotes a section.

## Supporting But Not Sidebar-Primary

Some files remain under `docs/blog-doc/Architecture/` because they are useful
for maintainers, but they should not be treated as top-level product direction:

- `Autonomous-Objective-Evaluation.md`
- `Direct-Generated-Action-Skills.md`
- `Single-Actor-Long-Term-Diamond-Handoff.md`
- `composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md`
- `Social-Simulation-Next-Goal-Handoff.md`
- `Implementation-Workstreams.md`
- `LLM-Context-And-Actor-Workspace.md`
- `Gemini-Native-Audio-Codegen-Verdict.md`
- `composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`

These documents must remain subordinate to the Soul/LifeGoal social runtime and
must not make benchmark progress, diamond acquisition, or generic autonomy look
like the product goal.

## Cleanup Rules

- Prefer one canonical definition doc over several drifting definitions.
- If a document is stale but useful, move it to `docs/research-archive/` or add
  a status note rather than leaving it in public navigation.
- If a document is only Docusaurus starter content, unused visual scaffolding, or
  an unreferenced template, delete it.
- Never use absolute local paths in committed docs.
- When adding Docusaurus docs, update `docs/sidebars.js` only if the page should
  be public navigation, not merely buildable.
- After changing docs structure, run `cd docs && npm run build`.

## 2026-05-26 Cleanup Decision

- Docusaurus-exposed docs were moved from `docs/docs/` to `docs/blog-doc/`.
- Old public `Research/` and `Plans/` pages were moved into
  `docs/research-archive/2026-05-19-public-docs/`.
- Root paper dumps were moved into `docs/research-archive/external-paper-dumps/`.
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` was moved to the project root
  as an internal implementation review map.
- Default Docusaurus template markdown/components/assets were deleted.
