# Natural Village Minecraft Agent Evaluation

This repository now includes a small Minecraft LLM-agent evaluation artifact.
The completed run used Qwen Plus and Qwen Max through ModelScope for two lanes,
alongside OpenAI and Gemini reference lanes, but the artifact is about the
harness, evidence, and natural-village task rather than a provider-specific
benchmark.

It is a personal open-source experiment, not a general model leaderboard. The
question is narrower:

```text
In the same fresh natural Minecraft village world, can an LLM-backed actor keep
making grounded material progress for 30 cycles, and can the run leave enough
evidence to inspect what actually happened?
```

## Public Contribution Artifacts

Use these public links for the four contribution slots after publication:

- Rich visual report blog:
  `<PUBLIC_DOCUSARUS_RICH_VISUAL_REPORT_URL>`
- Cookbook/tutorial blog:
  `<PUBLIC_DOCUSARUS_COOKBOOK_BLOG_URL>`
- Repo artifact index:
  `<PUBLIC_REPO_ARTIFACT_URL>`
- X post:
  `<PUBLIC_X_POST_URL>`

Expected Docusaurus URLs:

- `https://naem1023.github.io/minecraft-llm-agent-community/blog/natural-village-model-comparison`
- `https://naem1023.github.io/minecraft-llm-agent-community/blog/provider-lane-cookbook`

Current branch repo artifact URL:

```text
https://github.com/gigio1023/minecraft-llm-agent-community/blob/research/docs/QWEN_NATURAL_VILLAGE_EVAL.md
```

## Local Artifact Index

- Final self-contained HTML report:
  `project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html`
- Combined comparison JSON:
  `project-docs/Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/combined-model-comparison-30cycle-analysis.json`
- Qwen 30-cycle base experiment:
  `project-docs/Experiments/2026-06-29/goal-oriented-natural-village-30cycle-qwen/`
- Gemini extension experiment:
  `project-docs/Experiments/2026-06-30/goal-oriented-natural-village-gemini-30cycle-extension/`
- Cookbook blog:
  `docs/blog/2026-06-30-qwen-modelscope-minecraft-agent-cookbook.md`
- Supporting public-docs cookbook:
  `docs/public-docs/qwen-modelscope-minecraft-agent-cookbook.md`
- Rich visual report blog:
  `docs/blog/2026-06-30-qwen-minecraft-agent-visual-report.mdx`

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

Start with the cookbook blog:

```text
docs/blog/2026-06-30-qwen-modelscope-minecraft-agent-cookbook.md
```

Then inspect the final report:

```text
project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html
```

The final report embeds screenshots as data URIs so it can be opened locally
without broken image paths.

For a more shareable visual explanation, read:

```text
docs/blog/2026-06-30-qwen-minecraft-agent-visual-report.mdx
```

## Contribution Fit

This repo artifact can be shared as an open-source Minecraft LLM-agent
evaluation contribution with a concrete ModelScope/Qwen use case because it
provides:

- a ModelScope/Qwen Plus and Qwen Max use case inside a broader provider-lane
  harness;
- comparable ModelScope, OpenAI, and Gemini lanes;
- concrete Minecraft runtime artifacts;
- model-comparison observations;
- a reproducible cookbook blog and rich visual report.

It avoids company/internal context and should be treated as a personal technical
experiment.
