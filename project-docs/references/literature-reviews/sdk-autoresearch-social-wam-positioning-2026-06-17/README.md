# SDK-autoresearch / social-WAM positioning investigation (2026-06-17)

A focused positioning study: how to position this Minecraft LLM-agent project around World Action
Models, Minecraft as a wild reproducible substrate, social consequence grounded in material dynamics,
and a coding-agent (SDK-style) autoresearch loop. This is research synthesis, not implementation.

Output dir note: the launch prompt left `OUTPUT_DIR_RELATIVE` as an unfilled placeholder; the example
path was dated today and named exactly for this task, so it was used:
`project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/` (REPO_ROOT =
`research/wam`).

## The answer in one line

The defensible contribution is one empty cell: an advisory, structured world model that predicts the
physical, material, and social consequences of actions in an embodied Minecraft world, plus the
measurement of whether embodied LLM actors actually sustain obligation, trust, repair, and continuation
that a model can predict. Autoresearch, WAM-based research, and mineflayer code generation are not rival
directions; they are the METHOD, the OBJECT, and the SUBSTRATE of one program. (Scoring against engine
state rather than a self-judge is assumed, not the point.)

## Deliverables (start here)

- `reports/final-positioning-report.md`: full synthesis, thesis, prior-work comparison, gap analysis,
  contributions, roadmap (2 weeks / 2 months / 6 months), risks, and the 8 core questions answered.
- `reports/short-human-brief.md`: one-screen decision brief, the recommended direction, and what not to
  claim.
- `matrices/prior-work-gap-matrix.md`: key prior works scored on Minecraft, WAM, wild setting, social,
  autoresearch, reproducibility, released artifacts, and relevance.
- `matrices/sdk-loop-authority-boundary.md`: what a Codex/Claude/SWE-agent-like loop may improve, what
  it must not decide, and the verifier/scoring boundaries.
- `matrices/minecraft-vs-robotics-vs-dialogue-sim.md`: why Minecraft is scientifically useful and what
  it cannot claim against robotics and dialogue-only sim.
- `notes/by-theme/recommended-research-spine.md`: 5 candidate paper framings, scored, with the
  recommended spine and why.
- `source-manifest.jsonl`: 52 unique sources this investigation used (one JSON object per source).
- `search-log.md`: tools, per-lane queries, what was found, what is unresolved or claim-only.

## The four research lanes

- Lane A (SDK loops): `notes/by-theme/sdk-loop-mechanics-and-authority.md`. The autoresearch loop made
  concrete in today's SDK primitives (Claude Agent SDK, OpenAI Codex, OpenHands, DSPy/MIPRO, GEPA) and
  the authority boundary.
- Lane B (novelty): `notes/by-theme/cross-product-novelty-and-closest-works.md`. The 4-way intersection
  is empty; the closest works per axis and their precise misses.
- Lane C (substrate): `notes/by-theme/substrate-comparison-minecraft-robotics-dialogue.md`. Minecraft as
  the cheap deterministic material substrate at society scale.
- Lane D (reproducibility + Sid): `notes/by-theme/reproducibility-norms-and-sid-cautionary.md`. The
  publishable release checklist and Project Sid's 0/5 artifact status (re-verified 2026-06-17).

## Reuse relationship and source tally

- Built on the 560-source 2026-06-16 archive (`../../2026-06-16/deep-social-wam-literature-review/`):
  reused by path, not re-derived. New primary-source research covered only this framing's deltas.
- This investigation's manifest: 52 unique sources (19 LaTeX, 3 PDF-only, 30 abstract/repo/docs). 22 new
  by-paper notes, 5 theme files (4 lanes + the spine), 4 lane briefs, 3 matrices, 2 reports. Integrity:
  0 bad JSON, 0 broken cross-references, no duplicate arXiv id.

## Standing constraints honored

No live paid LLM provider benchmark; no provider API call; no runtime source edit; no edit to repo-root
AGENTS.md / README.md / SPEC.md / CLAUDE.md / GEMINI.md (only this archive was written). Claims are
source-backed with primary-source facts separated from interpretation and claim-only numbers flagged.
Project Sid is treated as a cautionary case with every claim labeled unreproduced. ASCII punctuation
only.

## Directory layout

- `reports/`: the positioning report and the human brief.
- `matrices/`: the three decision matrices.
- `notes/by-theme/`: the four lane syntheses and the research spine.
- `notes/by-paper/`: 22 new by-paper notes (SDKs, GEPA, OpenHands, Habitat 3.0, PARTNR, sim-to-real,
  EvolvingAgent, MineEvolve, AIvilization, position papers, reproducibility norms, Project Sid status).
- `notes/subagent-briefs/`: the four lane briefs.
- `raw-search-results/`: per-lane manifest fragments and search logs.
- `scripts/`: `merge_manifest.py` (copied from the 2026-06-16 archive; self-contained).
- `prompts/`: the contract addendum every lane read.
- `source-manifest.jsonl`, `search-log.md`, this `README.md`.
