---
name: minecraft-research-value-harness
description: >
  Judge and design meaningful research directions for this Minecraft LLM-agent
  project before implementation. Use for prompts about "research direction",
  "research gap", "paper-worthy", "experiment design", "Goldilocks gate",
  "WAM/F-native/F-loop/F-society", "논문감", "연구 가치", "실험 설계",
  "유의미한 연구 주제", or when a plan risks hiding behind words like
  verified/structured/validated instead of proving a substantive claim.
---

# Minecraft Research Value Harness

Use this skill to decide whether a proposed Minecraft agent direction is a real
research target, a weak slogan, ordinary engineering hygiene, or a deferred idea
waiting on the no-regret core.

This is an **agent skill** for research judgment. It is not a runtime action
skill, benchmark runner, paper generator, or permission for model text to bypass
runtime authority.

## Quick Start

1. Read the active central plan:
   `project-docs/research/current-spine/central-plan-no-regret-core-and-goldilocks-gate.md`.
2. Read `references/protocol.md` for the end-to-end workflow.
3. If the task asks "is this paper-worthy?", "what is the research gap?", or
   "what experiment should we run?", read `references/research-value-rubric.md`.
4. If the task concerns Minecraft, Mineflayer code generation, action generation,
   LLM Minecraft prior knowledge, F-native/F-loop/F-society, or Goldilocks
   preflight, read `references/minecraft-specific-pressure.md`.
5. If current literature or papers matter, use web search and the installed `hf`
   CLI as described in `references/source-and-hf-research.md`.
6. Produce the requested artifact using `references/artifact-templates.md`:
   `research-claim/v1`, `prior-work-proximity/v1`,
   `proposal-soundness-review/v1`, `experiment-sketch/v1`,
   `negative-result-ledger/v1`, or `research-decision/v1`.

## Default Output

For open-ended research planning, return these sections:

```text
Research Object
Research Gap / Value Type
Prior-Work Proximity
Proposal Soundness
Experiment Sketch
Negative Results To Preserve
Decision
```

Use the verdict labels exactly:

- `kill`: not a research claim yet.
- `defer`: interesting but not testable now.
- `core-first`: blocked on non-degenerate no-regret core.
- `preflight-ready`: no-regret core exists and the candidate can enter
  Goldilocks preflight.
- `headline-candidate`: evidence after preflight supports choosing it.

## Core Rules

- Research value is not the same as clean implementation.
- Verification, schemas, structured logs, and reproducibility are audit
  surfaces unless the project explicitly studies verification itself.
- Do not accept a research claim unless it names a baseline that could erase it.
- Do not accept novelty without close prior-work proximity analysis.
- Do not accept an experiment sketch unless it names the uncertainty it reduces.
- Do not let actor success, Mineflayer action success, code generation success,
  or task completion stand in for prediction quality or social-material insight.
- Do not use the actor's `expected_outcome` as the target label. Ground truth
  must come from independent observed deltas.

## Reference Files

| File | Read when | Contents |
| --- | --- | --- |
| `references/protocol.md` | Any nontrivial use | Workflow from intake to decision |
| `references/research-value-rubric.md` | Judging gap, novelty, paper-worthiness | Research gap and value taxonomy, scoring rules |
| `references/minecraft-specific-pressure.md` | Applying to this repo | Minecraft/Mineflayer/LLM-prior pressure tests |
| `references/source-and-hf-research.md` | Looking up papers or current systems | Web/HF source rules and query patterns |
| `references/artifact-templates.md` | Writing outputs | Artifact schemas and templates |
| `references/validation-prompts.md` | Testing or improving this skill | Positive/negative control prompts |

## Gotchas

- If the candidate sounds good but cannot say what would make it fail, it is not
  ready.
- If 100/100 successful tests would prove only that code works, call that
  engineering hygiene, not research value.
- If Mineflayer code generation enables new actions, ask what consequence target
  becomes measurable because of it.
- If an LLM already knows enough Minecraft mechanics to predict the delta, the
  layer may be too easy for F-native/F-loop and should be treated as a control.
- If a proposal needs many actors, institutions, laws, religion, taxes, or big
  society claims before 2-3 actors are non-degenerate, label it `core-first` or
  `defer`.
- If Project Sid-style material is used, separate useful case ideas from
  unverified promotional claims.
- If a model-generated review approves the idea, still run baseline pressure and
  execution-collapse analysis. Optimistic research self-evaluation is a known
  failure mode.
