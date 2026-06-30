# Wave-4 Contract Addendum: Autoresearch for WAM (read after the shared contract)

You are a parallel research subagent in **wave 4** of this literature review. Waves 1-3 produced
a 268-source review covering WAM foundations, the Minecraft/social-simulation application, and 23
research-area surveys. Wave 4 adds a new lens: **autoresearch**, meaning autonomous and automated
research and self-improvement loops, and how that lens bears on this repo's advisory
social-material WAM.

Read `prompts/00-shared-lane-contract.md` first. Every rule there binds you: working root
(`<ROOT>`; write only inside it), no paid LLM / provider / API calls, no runtime edits, no edits
outside `<ROOT>`, every claim source-backed, separate Primary-source facts vs Interpretation vs
Mechanically-useful-vs-research-contribution, Hugging Face CLI first then web, LaTeX-first via
`scripts/fetch_arxiv_latex.sh`, the by-paper note schema, the manifest fragment schema, the
search-log fragment, the per-lane brief. Punctuation: ASCII only, no em-dash, middle-dot, or
bullet-char (use `-`, `:`, `,`, `.`).

## 1. The anchor: ENPIRE (a note already exists, read it)

The wave anchor is NVIDIA GEAR's ENPIRE (Environment, Policy improvement, Rollout, Evolution): an
autoresearch system where frontier coding agents reset a scene, run a policy, verify the outcome,
analyze logs, rewrite code, and repeat, with no human in the loop, hill-climbing dexterous
real-robot policies to roughly 99% success against a verified success signal. The coordinator has
already written `notes/by-paper/enpire.md` (project-page-level; ENPIRE has no arXiv id as of
2026-06-17). Read it and cite it as `enpire`. Do NOT rewrite it; build your area outward from it.

## 2. The original query and the autoresearch thesis (anchor everything to both)

Original query: "Can a hierarchical action-conditioned world model predict and evaluate how
Minecraft actions transform physical state, material economy, social relations, memory, and future
action opportunities in an embodied open world?"

Repo shape (faithful, condensed): an LLM tool-use actor on a Mineflayer runtime where the runtime
owns physical truth; a WAM, if adopted, stays **advisory** (predicts and evaluates typed-delta
consequences, scored against verifier evidence; it never acts, fills args, marks progress, or
overrides the verifier). The 4 layers: Physical; Material/economic; Social; Institutional/settlement.

The wave-4 thesis to TEST (do not assume it):

"An ENPIRE-style autoresearch loop (reset, rollout, verify, refine), driven by a coding agent and
grounded by the runtime VERIFIER as the success signal, is a natural way to autonomously improve
this repo's advisory social-material WAM and/or actor policy at near-zero cost and with no human
labels, because the repo's cycle already emits verifier-scored (state, action, next-state)
transitions. The loop must stay advisory and verifier-grounded: the LLM proposes; the runtime owns
truth; the agent must never score its own success, which is progress laundering, the repo's named
failure mode."

Your lane reports how its sub-area **supports, complicates, bounds, or warns against** this thesis.
Be modest and honest. Flag where the analogy to robot manipulation breaks for an open-ended social
world (no crisp 99% metric, social scenarios costly to reset, contested success at upper layers).

## 3. Your job: map a research area through the autoresearch lens

As in wave 3: define the area for a newcomer, name its central question, trace key works and
sub-threads (source-backed, lead each with "what it introduced and why it matters"), map each
source and the area to the 4 layers, state mechanically-useful vs research-contribution, and give a
one-line tie to the original query AND to the autoresearch thesis. Depth over breadth: deep-read
(LaTeX) ~6-10 cornerstones; abstract-level is fine for the long tail. Note which are LaTeX vs PDF
vs abstract.

## 4. Extend, do not duplicate (the 23 existing theme files)

Cite where you connect; do NOT re-survey. Your brief names the specific siblings to deconflict
against.

- Wave-1: `wam-foundations`, `minecraft-world-models`, `minecraft-vla-and-visual-policy`,
  `minecraft-agent-benchmarks`, `minecraft-multi-agent-social`, `minestudio-positioning`,
  `llm-social-simulation`, `benchmark-validity-and-evaluation`, `project-sid-critical-review`,
  `sociology-grounding-for-social-wam`, `data-and-training-feasibility`,
  `hierarchical-wam-for-minecraft-societies`.
- Wave-2: `wam-lineage-rl-and-latent-dynamics`,
  `wam-generative-video-and-the-world-model-debate`, `wam-action-models-vla-and-synthesis`,
  `vla-and-the-wam-vs-vla-distinction`, `wam-training-evaluation-and-open-problems`.
- Wave-3: `research-area-hierarchical-world-models`,
  `research-area-structured-object-centric-world-models`,
  `research-area-affordances-and-causal-world-models`,
  `research-area-theory-of-mind-and-agent-modeling`,
  `research-area-agent-based-economic-simulation`, `research-area-memory-and-verifiers`.

## 5. Output locations (wave-4 specific)

- Manifest fragment: `raw-search-results/lane-<N>-manifest.jsonl` (your N is 18-23). Same JSON
  schema; add the tags `autoresearch` and `self-improvement` where they apply. The coordinator
  re-runs `scripts/merge_manifest.py` (dedup by `id`, union tags/lanes), so logging a source
  another lane also logged is fine. Do NOT write to `lane-coord-wave4-manifest.jsonl` (that is the
  coordinator's ENPIRE seed) and do NOT edit other lanes' files.
- Search-log fragment: `raw-search-results/lane-<N>-search-log.md`.
- Per-lane brief: `notes/subagent-briefs/lane-<N>-<name>.md`.
- New by-paper notes: `notes/by-paper/<arxiv_id_or_slug>-<slug>.md` (only for deep-read sources).
- Owned theme file: `notes/by-theme/research-area-<name>.md` (named in your brief).

## 6. Scope and honesty

- Verify arXiv ids before fetching (`hf papers search`, web). Correct wrong seeds in your search
  log. Mark anything unverifiable "unverified report claim". Do not fabricate ids, numbers, quotes.
- Many of these systems report **self-evaluated** success. Distinguish environment-verified results
  from self-reported ones explicitly; that distinction is the whole point of this wave.
- Return ONLY a concise summary (<=300 words): files created; counts (sources/LaTeX/PDF/abstract);
  top 5 sources with one line each; 3 strongest findings; one-line tie to the thesis; the biggest
  thing you could not verify. Do not paste long notes back; the coordinator reads your files.
