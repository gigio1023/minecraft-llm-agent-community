---
sidebar_position: 3
---

# Documentation Map

Search token: `DOCUMENTATION_MAP`.

Status: active documentation routing and cleanup policy.

This page defines where documentation belongs. The current split is deliberate:
`project-docs/` is the repo-internal project documentation root,
`docs/public-docs/` is the Docusaurus-exposed public documentation root, and
`project-docs/research-archive/` preserves historical material.

## Authority Order

When documents disagree, use this order:

1. `SPEC.md`
2. `AGENTS.md`
3. `CLAUDE.md` and `GEMINI.md`, subordinate to `AGENTS.md`
4. `project-docs/Specification/*`
5. `project-docs/Terminology.md`
6. `project-docs/Agent-Search-Index.md`
7. active architecture docs under `project-docs/Architecture/`
8. current handoff, audit, setup, and future-work docs
9. internal review docs and research archives

Do not fix a conflict by silently rewriting the spec. If the conflict changes
long-term direction, get explicit user approval first.

## Repo-Root Internal Documents

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

## Internal Project Documents

Internal specs, architecture notes, setup notes, handoffs, provider-access
notes, implementation campaigns, terminology, experiment records, and routing
indexes live under:

```text
project-docs/
```

These documents can be linked from root guides and agent guides, but they are
not part of the public Docusaurus site. Do not put private provider access,
operator budget state, dated handoffs, internal implementation plans, or agent
operating rules under the public docs tree.

## Docusaurus-Exposed Public Documents

All docs intended for the Docusaurus docs plugin live under:

```text
docs/public-docs/
```

The Docusaurus URL route can still be `/docs/...`; the repository path is the
source-of-truth distinction. Do not add new public docs under `docs/docs/` and
do not use `docs/blog/` for ordinary docs.

Public docs should explain the project to external readers: purpose, high-level
architecture, how to run a basic probe, evidence semantics, and roadmap. They
should not expose paper dumps, private access notes, volatile run status,
operator setup, provider quotas, or implementation handoff details.

## Active Public Docs

Public Docusaurus docs:

- `docs/public-docs/intro.md`
- `docs/public-docs/getting-started.md`
- `docs/public-docs/architecture.md`
- `docs/public-docs/evidence-and-artifacts.md`
- `docs/public-docs/roadmap.md`

## Active Internal Project Docs

Orientation:

- `project-docs/intro.md`
- `project-docs/Documentation-Map.md`
- `project-docs/Agent-Search-Index.md`
- `project-docs/Terminology.md`

Long-term spec:

- `project-docs/Specification/Soul-Grounded-Social-Simulation.md`
- `project-docs/Specification/Evidence-Grounded-Minecraft-Society.md`
- `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`
- `project-docs/Specification/Engineering-Governance-And-Testing.md`
- `project-docs/Specification/Reference-Adaptation-Guide.md`

Architecture:

- `project-docs/Architecture/SPEC.md`
- `project-docs/Architecture/Soul-Life-Goal-Runtime-Architecture.md`
- `project-docs/Architecture/Runtime-Loop-And-Verification.md`
- `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Architecture.md`
- `project-docs/Architecture/Actor-Episode-And-Actor-Turn-Implementation-Plan.md`
- `project-docs/Architecture/Low-Cost-Social-Simulation-Campaign-Spec.md`
- `project-docs/Architecture/Grounded-Social-Trajectory-Benchmark-Spec.md`
- `project-docs/Architecture/Material-Claims-And-Social-Economy-Benchmark-Plan.md`
- `project-docs/Architecture/Research-Direction-Reference-Synthesis.md`
- `project-docs/Architecture/Project-Sid-Harness-Absorption-Plan.md`
- `project-docs/Architecture/Actor-Turn-Passive-PlanBeads-Goal-Brief.md`
- `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
- `project-docs/Architecture/Context-Projection-And-Source-Evidence.md`
- `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`
- `project-docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
- `project-docs/Architecture/Social-Actor-Profiles-And-Relationships.md`
- `project-docs/Architecture/Action-Skill-Verification.md`
- `project-docs/Architecture/Action-Selection-Gated-Action-Skill-Authoring-Plan.md`
- `project-docs/Architecture/Minecraft-Basic-Guide.md`
- `project-docs/Architecture/Actor-Memory-Observation-And-Action-Space-Plan.md`
- `project-docs/Architecture/Actor-Persistent-State-And-PlanBeads.md`
- `project-docs/Architecture/PlanBeads-Implementation-Campaign.md`
- `project-docs/Architecture/Async-Reviewer-Sidecars.md`

Current state and operations:

- `project-docs/Architecture/Current-Handoff-And-Next-Work.md`
- `project-docs/Architecture/OpenAI-GPT54Mini-No-Output-Cap-Run-2026-06-04.md`
- `project-docs/Architecture/Roofless-Hut-Flat-Scenario-Run-2026-06-08.md`
- `project-docs/Architecture/Natural-Safe-Spawn-World-Scenario-Research-2026-06-10.md`
- `project-docs/Architecture/World-Scenario-Truthfulness-And-Natural-Spawn-Implementation-Plan.md`
- `project-docs/Architecture/World-Scenario-RCON-Truthfulness-Plan.md`
- `project-docs/Architecture/Natural-Safe-Spawn-Scenario-Contract.md`
- `project-docs/Architecture/Natural-Spawn-Validation-Artifact-Contract.md`
- `project-docs/Architecture/World-Scenario-Smoke-Gates.md`
- `project-docs/Architecture/Natural-Safe-Spawn-Smoke-Run-2026-06-13.md`
- `project-docs/Architecture/Future-Works.md`
- `project-docs/Architecture/Real-Server-Simulation-Test-Plan.md`
- `project-docs/Setup/Headless-Server.md`
- `project-docs/Setup/World-Scenario-Testing.md`
- `project-docs/Setup/Provider-Setup.md`
- `project-docs/Setup/Provider-Free-Tier-Reset-Windows.md`
- `project-docs/Setup/OpenAI-Tier3-Free-Usage.md`
- `project-docs/Setup/ModelScope-Qwen-API-Access.md`
- `project-docs/Experiments/README.md`
- `project-docs/Experiments/INDEX.md`
- `project-docs/Experiments/2026-06-13/README.md`

Knowledge:

- `project-docs/Knowledge/Minecraft-Encyclopedia-Research-Brief.md`
- `project-docs/Knowledge/Minecraft-Encyclopedia/*`

## Internal Archives

Use `project-docs/research-archive/` for material that may remain useful but should not
shape active implementation or public docs navigation:

- external paper dumps;
- old public `Research/` pages;
- old public `Plans/` pages;
- deep-dive literature notes;
- dated run reports that are no longer current handoff material.
- dated literature sweeps such as
  `research-archive/2026-06-15/llm-social-behavior-benchmark-survey.md`.
- direction-setting literature sweeps such as
  `research-archive/2026-06-16/reference-sweep-beyond-project-sid.md`.
- expanded related-work sweeps such as
  `research-archive/2026-06-16/expanded-related-work-sweep.md`.
- single-paper direction analyses such as
  `research-archive/2026-06-16/nitrogen-2601-02427-analysis.md`.

Archived documents preserve context. They are not active implementation
instructions unless an active spec, architecture doc, or handoff explicitly
promotes a section.

## Supporting Internal Docs

Some files remain under `project-docs/Architecture/` because they are useful for
maintainers, but they should not be treated as top-level product direction:

- `Autonomous-Objective-Evaluation.md`
- `Direct-Generated-Action-Skills.md`
- `Single-Actor-Long-Term-Diamond-Handoff.md`
- `composer-2.5-Single-Actor-Long-Term-Diamond-Plan.md`
- `Social-Simulation-Next-Goal-Handoff.md`
- `Implementation-Workstreams.md`
- `LLM-Context-And-Actor-Workspace.md`
- `Gemini-Native-Audio-Codegen-Verdict.md`
- `composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan.md`
- `Bounded-Action-Skill-Creation.md`
- `Social-Cycle-LLM-Input-Cleanup-Plan.md`
- `Current-Architecture-And-Implementation-Audit.md`

These documents must remain subordinate to the Soul/LifeGoal social runtime and
must not make benchmark progress, diamond acquisition, or generic autonomy look
like the product goal.

## Cleanup Rules

- Prefer one canonical definition doc over several drifting definitions.
- If a document is stale but useful, move it to `project-docs/research-archive/` or add
  a status note rather than leaving it in public navigation.
- If a document is only Docusaurus starter content, unused visual scaffolding, or
  an unreferenced template, delete it.
- Never use absolute local paths in committed docs.
- When adding public Docusaurus docs, update `docs/sidebars.js` only if the page
  should be public navigation, not merely buildable.
- When adding internal docs, put them under `project-docs/` and update
  `project-docs/Agent-Search-Index.md` when they become routing targets.
- After changing docs structure, run `cd docs && npm run build`.

## 2026-06-07 Boundary Correction

- Internal project docs moved from the former blog-shaped documentation root to
  `project-docs/`.
- Docusaurus docs plugin now reads from `docs/public-docs/`.
- `docs/blog/` remains only for explicitly dated blog posts.
- Private provider/API access notes, including ModelScope Qwen access, belong in
  `project-docs/Setup/`, not in public docs or blog docs.

## 2026-05-26 Cleanup Decision

- Docusaurus-exposed docs were briefly stored in an internal-docs-shaped public
  tree before the 2026-06-07 boundary correction.
- Old public `Research/` and `Plans/` pages were moved into
  `project-docs/research-archive/2026-05-19-public-docs/`.
- Root paper dumps were moved into `project-docs/research-archive/external-paper-dumps/`.
- `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md` was moved to the project root
  as an internal implementation review map.
- Default Docusaurus template markdown/components/assets were deleted.
