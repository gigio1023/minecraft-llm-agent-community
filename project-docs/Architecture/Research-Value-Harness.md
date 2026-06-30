# Research Value Harness

Status: active planning support document. This is not a runtime contract.

Search token: `RESEARCH_VALUE_HARNESS`.

## Purpose

This harness exists to stop the project from mistaking polished implementation
language for research value.

It should be used before rewriting the central plan, choosing a research
headline, proposing a paper framing, or designing an experiment around
F-native, F-loop, F-society, WAM-era ideas, or the Goldilocks gate.

The associated agent skill is:

```text
.agents/skills/minecraft-research-value-harness/SKILL.md
```

## Problem It Solves

The project can already create more structure:

- schemas;
- verifiers;
- logs;
- evidence refs;
- generated Mineflayer action skills;
- reproducible runs.

Those are necessary. They are not automatically research contributions.

The harder question is:

```text
What meaningful claim becomes more or less believable after this Minecraft run?
```

The harness forces every candidate direction to answer that question before it
becomes implementation work.

## Research Gap Types

Use these as labels, not decoration.

| Gap type | Meaning | Minecraft example |
| --- | --- | --- |
| Knowledge gap | We do not know something substantive | Whether observed interaction history adds signal beyond LLM prior for a social-material layer |
| Methodological gap | Existing methods cannot isolate the target | Existing Minecraft agents measure task success, not action-conditioned social-material consequence |
| Evidence gap | A claim is plausible but under-supported | Public Minecraft society claims lack reproducible logs, code, scoring, or independent replication |
| Contradictory gap | Existing claims conflict | Demos show rich society; controlled runs may collapse into repeated loops |
| Population/application gap | A finding may not transfer | Dialogue-only social simulation may not transfer to embodied Minecraft constraints |

If none fits, use a different value label:

- scientific value;
- methodological value;
- measurement value;
- dataset value;
- systems value;
- negative-result value;
- engineering hygiene.

## Core Harness Artifacts

The skill emits these artifacts:

- `research-claim/v1`
- `prior-work-proximity/v1`
- `proposal-soundness-review/v1`
- `experiment-sketch/v1`
- `negative-result-ledger/v1`
- `research-decision/v1`

The artifacts are documented in:

```text
.agents/skills/minecraft-research-value-harness/references/artifact-templates.md
```

The current project-level instances are:

- `Prior-Work-Proximity-Current-Spine-2026-06-29.md`
- `Research-Decision-Current-Spine-2026-06-29.md`

## Decision Labels

Use these labels exactly:

- `kill`: not a research claim yet.
- `defer`: interesting but not testable now.
- `core-first`: blocked on the no-regret core.
- `preflight-ready`: core exists and the candidate can enter Goldilocks
  preflight.
- `headline-candidate`: post-preflight evidence supports selecting it.

Most ambitious claims before non-degenerate 2-3 actor transition rows should be
`core-first`, not headline candidates.

## Minecraft-Specific Pressure

The harness treats these as weak research claims by default:

- Mineflayer can execute generated code.
- The runtime verifies an inventory/block/position delta.
- A deterministic primitive passes many times.
- The LLM predicts obvious Minecraft mechanics.
- Logs are structured and reproducible.
- The actor completes a task.

The harness looks for stronger claims:

- observed history improves consequence prediction beyond an LLM prior;
- action consequence prediction can be separated from acting competence;
- social-material deltas are observable without relying on actor self-report;
- negative results kill or narrow attractive but weak framings;
- Minecraft as an embodied substrate changes what can be measured.

## Relationship To The Central Plan

This document supports the active central plan:

```text
project-docs/Architecture/Central-Plan-No-Regret-Core-And-Goldilocks-Gate.md
```

The harness does not replace the central plan. It provides the review machinery
that should be used before changing it.

The current order remains:

```text
no-regret core -> Goldilocks branch triage -> larger confirming experiment or
branch deferral
```

The harness mainly improves how the project decides whether a proposed headline
or experiment deserves to pass from one stage to the next.

## How To Use

For a new research proposal:

1. Run `minecraft-research-value-harness`.
2. Fill `research-claim/v1`.
3. Run prior-work proximity with web/HF lookup when current papers matter.
4. Run proposal soundness review.
5. If the verdict is not `kill`, sketch the smallest uncertainty-reducing
   experiment.
6. Record negative results as valid outcomes.
7. End with `research-decision/v1`, including `what_not_to_do_next`.

For the current project, the most important `what_not_to_do_next` is usually:

```text
Do not select a headline before the no-regret core and Goldilocks evidence exist.
```
