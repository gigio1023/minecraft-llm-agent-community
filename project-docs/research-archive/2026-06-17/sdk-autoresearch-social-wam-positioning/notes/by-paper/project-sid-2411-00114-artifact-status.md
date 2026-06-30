# Project Sid (2411.00114): artifact status, re-verified 2026-06-17

- Source: Project Sid (Altera.AL, arXiv 2411.00114, v1 2024-10-31); public GitHub
  wrapper https://github.com/altera-al/project-sid.
- Access: live WebFetch of the repo page, the raw README, and the org repo list,
  all on 2026-06-17, all accessed OK. This note records ARTIFACT STATUS only. For
  the claim-by-claim plausibility-vs-verified analysis, do NOT rewrite it here, cite
  the old archive note
  ../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/project-sid-critical-review.md
  and the old archive matrix
  ../../../../2026-06-16/deep-social-wam-literature-review/matrices/reproducibility-matrix.md
  (Sid = claim-only).

## What is actually released (VERIFIED 2026-06-17)

The github.com/altera-al/project-sid repository top level holds exactly four items:
- `2024-10-31.pdf` (the technical report)
- `README.md`
- `visual_abstract.png`
- `projectSidVideo.mp4`

The altera-al GitHub org has exactly ONE public repository (this one). No separate
code repo exists in the org. Last repo update 2024-11-04.

The README contains only an abstract, an arXiv pointer, and a citation block. It
makes NO statement about code release, data, logs, a product, a future release, or
an explicit decline. It is silent on availability.

Therefore, NOT released (VERIFIED absent): PIANO source code, the Minecraft server
setup, prompts/configs for the reported runs, raw chat/action transcripts, action
logs, world seeds, replay artifacts, scoring scripts. No independent reimplementation
or replication was located via web search (recorded as "none located," not proof of
nonexistence).

Papers-with-Code five-item code-completeness score for this repo: 0/5 (no
dependencies, no training, no evaluation, no weights, no results-reproduction
script). See notes/by-paper/paperswithcode-code-completeness-checklist.md.

## Artifact-status table (claim -> evidence available? -> reproduced?)

Claims restated from the old archive's by-theme note (primary-source facts the Sid
report states). The right column is THIS lane's verified artifact status. All
metrics are unreproduced because no scoring artifact is released.

| Sid claim / metric | Released evidence to re-derive it? | Status |
|---|---|---|
| PIANO architecture (parallel modules + bottlenecked Cognitive Controller) | report text + figures only; no source | described, code unreleased -> unreproduced |
| Single-agent competence: ~17 unique items/agent in 30 min; ~320 items across 49 agents in 4h | no logs, no item-count scoring script, no seeds | claim-only -> unreproduced |
| Relationship / sentiment graphs (LM-scored 0-10) | no transcripts, no LM-scoring prompts/scripts | claim-only -> unreproduced |
| Perceived vs true likeability (LM-inferred "true" value) | no data, no inference scripts | claim-only -> unreproduced |
| Specialization / roles (GPT-4-labeled from rolling social-goal windows) | no goal histories, no labeling script | claim-only -> unreproduced |
| Food distribution under scarcity (gift vs inferred sentiment) | no event logs; transfer is a world event but unreleased | claim-only -> unreproduced (the transfer would be verifiable IF released) |
| Collective rules / taxation compliance (% inventory deposited per tax window) | no inventory/deposit logs, no window definitions | claim-only -> unreproduced (this is the MOST verifiable signal IF released) |
| Cultural / religion spread ("Pastafarianism" keyword frequency over 500 agents) | no goal/chat logs, no keyword script | claim-only -> unreproduced (and keyword-frequency is weak even if released) |
| Scale: up to ~500 (cultural) / ~1000+ attempts hitting server limits | report statement only | claim-only -> unreproduced; scale is a technical variable, not a social signal |

## The honest one-line statement (use this, do not soften)

Project Sid releases a report PDF, a README, a visual abstract, and a video, and
nothing runnable. Every reported Sid metric (item diversity, sentiment, likeability,
specialization, food distribution, taxation compliance, cultural spread) is
UNREPRODUCED: no released code, logs, seeds, prompts, or scoring scripts exist to
re-derive any of them, and no independent replication was found. Cite Sid to
constrain novelty and to lift case DESIGNS (especially the taxation-compliance
lifecycle, the only signal that was already a real material transition), never as a
reproduced baseline.
