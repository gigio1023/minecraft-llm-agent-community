# Qwen Ambassador Contribution Package

Date: 2026-06-30

Prepared from the private local contribution guide for the June 2026 submission
window.

Goal: submit four meaningful, publicly shared Qwen-related contributions in one
monthly form.

## Recommended Four Contributions

### 1. Docusaurus Blog Post / Rich Visual Report

Title: A Minecraft Natural Village Model Run

Public link:
`<PUBLIC_DOCUSARUS_RICH_VISUAL_REPORT_URL>`

Expected Docusaurus URL after publication:
`https://naem1023.github.io/minecraft-llm-agent-community/blog/natural-village-model-comparison`

Type: blog / article / evaluation

Short description:
A rich visual field report for a personal Minecraft LLM-agent experiment with
multiple provider-backed lanes. The concrete run used Qwen Plus and Qwen Max
through ModelScope alongside GPT-5.4 mini and Gemini 3.1 Flash Lite on the same
30-cycle natural-village task. It includes
Minecraft screenshots, model cards, outcome bars, material timelines, provider
cost bars, caveats, and artifact links.

Local source:
`docs/blog/2026-06-30-qwen-minecraft-agent-visual-report.mdx`

### 2. Docusaurus Blog Post / Cookbook Tutorial

Title: Cookbook: Run Provider Lanes in the Minecraft LLM-Agent Harness

Public link:
`<PUBLIC_DOCUSARUS_COOKBOOK_BLOG_URL>`

Expected Docusaurus URL after publication:
`https://naem1023.github.io/minecraft-llm-agent-community/blog/provider-lane-cookbook`

Type: blog / cookbook / reproducible tutorial

Short description:
A reproducible operator note showing how provider-backed lanes are run in the
Minecraft LLM-agent harness. It uses ModelScope Qwen Plus/Max as the concrete
example, but focuses on provider setup, provider-free visual smoke, quota
preflight shape, run commands, review-summary commands, artifact inspection
points, expected metrics, and caveats.

Local source:
`docs/blog/2026-06-30-qwen-modelscope-minecraft-agent-cookbook.md`

### 3. Open-Source Project / Repository Artifact

Title: Natural Village Minecraft Agent Evaluation

Public link:
`<PUBLIC_REPO_ARTIFACT_URL>`

Current branch URL:
`https://github.com/gigio1023/minecraft-llm-agent-community/blob/research/docs/QWEN_NATURAL_VILLAGE_EVAL.md`

Type: project / open-source artifact index / evidence bundle

Short description:
A repo-level landing document for the natural-village Minecraft agent
evaluation. It indexes the final HTML report, combined comparison JSON,
provider-lane experiment folders, Docusaurus blog posts, cookbook material, and
selected raw artifacts so readers can inspect the evidence behind the public
write-ups. The ModelScope/Qwen lanes are the concrete use case, not the whole
point of the artifact.

Local source:
`QWEN_NATURAL_VILLAGE_EVAL.md`

### 4. Social Post

Title: Minecraft Agent Evaluation X Post

Public link:
`<PUBLIC_X_POST_URL>`

Type: social post

Short description:
A concise public X post linking the Minecraft agent evaluation and final report.
The post may mention that the ModelScope lanes used Qwen Plus/Max, but should
frame the public artifact around the natural-village harness, runtime evidence,
screenshots, and material progress observations.

Local source:
`project-docs/external-activities/2026-06-30-qwen-ambassador-x-post.md`

## Why These Four Count Separately

The four links should not look like the same artifact pasted four times. They
have distinct jobs:

- visual report: what happened and what the model-comparison evidence showed;
- cookbook blog: how to reproduce provider-backed lanes, using ModelScope Qwen as
  the concrete example;
- repo artifact: where the raw reports, screenshots, summaries, and scripts
  live;
- X post: public social distribution that points readers back to the report.

The public-docs cookbook page may remain as supporting documentation, but the
contribution slot should use the cookbook blog post above.

## Why Not LinkedIn As The Fourth?

The operating guide recommends avoiding LinkedIn for now because the account can
surface employer identity. A second Docusaurus blog post is safer and stronger:
it is public, technical, useful to another developer, and still includes a
concrete ModelScope/Qwen example without making the whole project provider-specific.

## Form Submission Notes

- Submit the monthly form once with all four contributions.
- Use public URLs only.
- Keep wording personal and technical.
- Avoid employer names, internal systems, or claims that this is an official
  benchmark.
- Keep public copy centered on the Minecraft harness and use ModelScope/Qwen as
  the concrete model-provider example rather than the headline.

## Public URL Checklist

Before submitting, replace placeholders:

- `<PUBLIC_DOCUSARUS_RICH_VISUAL_REPORT_URL>`
- `<PUBLIC_DOCUSARUS_COOKBOOK_BLOG_URL>`
- `<PUBLIC_REPO_ARTIFACT_URL>`
- `<PUBLIC_X_POST_URL>`
- `<PUBLIC_DOCUSARUS_RICH_VISUAL_REPORT_URL>` in the X draft

If GitHub Pages is not published today, use GitHub blob URLs for the blog,
cookbook, and repo artifact on the `research/docs` branch. Confirm whether the
public Pages URL is under `naem1023.github.io` or another account before
submitting the monthly form.
