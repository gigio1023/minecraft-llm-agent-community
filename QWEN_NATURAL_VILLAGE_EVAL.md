# Qwen Natural Village Minecraft Agent Evaluation

This repository now includes a small Qwen-focused Minecraft LLM-agent
evaluation artifact.

It is a personal open-source experiment, not a general model leaderboard. The
question is narrower:

```text
In the same fresh natural Minecraft village world, can an LLM-backed actor keep
making grounded material progress for 30 cycles, and can the run leave enough
evidence to inspect what actually happened?
```

## Public Artifacts

- Final self-contained HTML report:
  `project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html`
- Combined comparison JSON:
  `project-docs/Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/combined-model-comparison-30cycle-analysis.json`
- Qwen 30-cycle base experiment:
  `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/`
- Gemini extension experiment:
  `project-docs/Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/`
- Cookbook:
  `docs/public-docs/qwen-modelscope-minecraft-agent-cookbook.md`
- Blog post:
  `docs/blog/2026-06-30-qwen-minecraft-agent-natural-village.md`

## Completed Lanes

| Lane | Provider | Verified progress | Blocked | No progress | Provider records | Total tokens |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Qwen Plus | ModelScope | 12 | 8 | 10 | 38 | 1.13M |
| Qwen Max | ModelScope | 15 | 8 | 7 | 38 | 1.09M |
| GPT-5.4 mini | OpenAI | 8 | 9 | 13 | 204 | 1.12M |
| Gemini 3.1 Flash Lite paced | Gemini API | 11 | 19 | 0 | 67 | 1.71M |

## What To Take Away

Qwen Max produced the deepest material progression in this run: wooden pickaxe
evidence, six cobblestone, and later material continuation.

Qwen Plus produced a clean early material chain around logs, planks, sticks, and
crafting-table evidence.

The comparison also showed why this kind of harness needs runtime evidence. The
same 30-cycle task exposed movement blockers, table-crafting limitations,
provider-contract rejection, and camera artifacts that would be easy to miss in
a text-only evaluation.

## Reproduction Entry Points

Start with the cookbook:

```text
docs/public-docs/qwen-modelscope-minecraft-agent-cookbook.md
```

Then inspect the final report:

```text
project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html
```

The final report embeds screenshots as data URIs so it can be opened locally
without broken image paths.

## Contribution Fit

This repo artifact can be shared as a Qwen-related open-source project or
evaluation contribution because it provides:

- a Qwen ModelScope use case;
- comparable Qwen Plus and Qwen Max lanes;
- concrete Minecraft runtime artifacts;
- model-comparison observations;
- a reproducible cookbook and final report.

It avoids company/internal context and should be treated as a personal technical
experiment.
