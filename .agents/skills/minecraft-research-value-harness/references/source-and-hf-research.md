# Source And HF Research Rules

Use this when a claim depends on current literature, AI-agent systems, research
benchmarks, or public project artifacts.

## Source Priority

Prefer:

1. official papers, arXiv/OpenReview/ACL/PMLR/Nature pages;
2. upstream GitHub repositories and README files;
3. official project pages or system cards;
4. benchmark datasets and rubrics;
5. third-party summaries only after primary sources.

For each source, record:

- URL;
- source type;
- date accessed;
- what it teaches mechanically;
- what it does not prove;
- how it changes the proposed Minecraft claim.

## HF CLI

The `hf` CLI is installed. Use it for Hugging Face paper and dataset discovery.

Useful commands:

```bash
hf papers search "query" --limit 10 --format json
hf papers info PAPER_ID --format json
hf papers read PAPER_ID --format auto
hf datasets info DATASET_ID --format json
hf skills list --format json
```

Use HF results as discovery and metadata. Read primary project pages or papers
for detailed claims when a decision depends on them.

## Query Patterns

For research-value harness work:

```text
proposal soundness AI scientist benchmark
LLM research idea generation execution gap
automated experimental design model discovery benchmark
AI agent scientific discovery benchmark
Minecraft LLM agent social simulation Mineflayer
Project Sid Minecraft AI agents reproducibility
```

For close prior-work proximity:

```text
Voyager Minecraft LLM agent skill library
MineDojo embodied agent benchmark Minecraft
Generative Agents social simulation LLM
DiscoveryWorld automated scientific discovery agents
PaperBench AI agents replicate research
ScienceAgentBench data-driven scientific discovery agents
```

## Evidence Boundary

Separate:

- sourced fact;
- local repo fact;
- inference;
- hypothesis;
- recommendation.

Do not cite a paper for a claim it does not make. Do not use search result
snippets as evidence. Label preprints, promotional posts, and unreproduced
technical reports.

## Research References Worth Knowing

These are starting points, not a closed bibliography:

- SoundnessBench: proposal-stage soundness and optimism bias.
- Can LLMs Generate Novel Research Ideas?: novelty vs feasibility and
  self-evaluation failure.
- The Ideation-Execution Gap: idea-stage promise can collapse after execution.
- BoxingGym: experimental design as uncertainty reduction.
- AI co-scientist: generate/debate/evolve hypothesis loop.
- AI Scientist / AI Scientist-v2: end-to-end automation and its risks.
- Agent Laboratory: human-owned idea plus agent-assisted research workflow.
- PaperBench / ResearchClawBench / ScienceAgentBench: rubric and judge
  calibration patterns.
- DiscoveryWorld / DiscoveryBench: embodied or data-driven discovery evaluation.
