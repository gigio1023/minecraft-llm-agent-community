# Wave 6 contract addendum (archive extension)

Self-contained brief for wave-6 lanes (30-35). Read this, then README.md, then your assigned existing
theme file(s), before searching. Wave 6 fills the decision-relevant GAPS that the directions report
(reports/research-directions-for-the-repo.md) exposed; it does not re-cover waves 1-5.

## Standing mission constraints (do not violate)

- Do NOT run live paid LLM provider benchmarks. Do NOT make provider API calls. Do NOT modify runtime
  source code (anything under probe/). Do NOT edit the repo-root AGENTS.md, README.md, SPEC.md,
  CLAUDE.md, or GEMINI.md. The archive's OWN files under this research-archive directory are the only
  things you write.
- This is a research synthesis task. Keep every claim source-backed. Separate primary-source facts from
  interpretation. Distinguish environment-verified or proven results from self-reported or claim-only
  ones, in every note.
- Use the Hugging Face CLI as a primary discovery channel (hf papers search, hf papers info,
  hf papers read). Verify every arXiv id with hf papers info before logging it. If an id cannot be
  verified, mark it claim-only and do NOT fabricate an id.
- ASCII punctuation only in everything you write: use - : , . and parentheses. Never use the em-dash
  (the long dash), the middle dot, or the bullet character. This is checked after the wave.

## Project context (the lens)

The repo is an evidence-grounded Minecraft social-simulation seed. A deterministic runtime VERIFIER
auto-labels (state, action, next-state) transitions at near-$0 from Mineflayer execution plus
world/inventory snapshots. The research object is an ADVISORY, structured-state, hierarchical
social-material World Action Model (WAM): a predictor p(o'|o,l) over typed Minecraft and social state,
which predicts deltas and is scored against verified deltas, and which never selects actions or
overrides the verifier.

Four layers, each meaningful only once the layer beneath it verifies:
1. Physical (movement, blocks, world state)
2. Material-Economic (possession, material claims, public affordances, weak commons, obligation/credit)
3. Social (relationships, trust as evidence-moved enums, beliefs about others)
4. Institutional (norms, routines, settlement-level emergence)

Hard line: social prediction matters only when grounded in physical and material dynamics. A social
variable is a ledger value updated from verified events, never a free-floating label or a float.

Directions report hard questions wave 6 should help answer (cite the report where relevant):
clean scenario reset granularity; verifier hardening against instance-only shortcuts; structurally
blocking progress laundering (proposer or actor never the scorer); the sharpening ceiling (calibration,
not new capability); the multi-actor dependency for the social layer; cost posture (structured-state is
cheap, pixels are not); keeping held-out social scenarios fresh.

## The six lanes

- Lane 30: evaluation and calibration for an advisory social-material predictor.
- Lane 31: reward models, verifiers, and reward over-optimization.
- Lane 32: the LLM as a world model and reasoning-as-planning.
- Lane 33: mechanism design, social dilemmas, and institutional grounding.
- Lane 34: long-horizon memory and continuity for agents.
- Lane 35: scenario and environment generation and evaluation freshness.

## Extend, do not duplicate

Before searching, list notes/by-theme/ (it is the source of truth for what already exists) and read
the theme files your lane brief names. Do NOT re-derive sources already deep-read in waves 1-5. Existing
theme files include (non-exhaustive; confirm by listing the directory):
wam-foundations, minecraft-world-models, minecraft-vla-and-visual-policy, minecraft-agent-benchmarks,
minecraft-multi-agent-social, llm-social-simulation, sociology-grounding-for-social-wam,
hierarchical-wam-for-minecraft-societies, wam-lineage-rl-and-latent-dynamics,
wam-generative-video-and-the-world-model-debate, wam-action-models-vla-and-synthesis,
vla-and-the-wam-vs-vla-distinction, wam-training-evaluation-and-open-problems,
research-area-hierarchical-world-models, research-area-structured-object-centric-world-models,
research-area-affordances-and-causal-world-models, research-area-theory-of-mind-and-agent-modeling,
research-area-agent-based-economic-simulation, research-area-memory-and-verifiers,
research-area-agentic-self-improvement-loops, research-area-ai-scientist-automated-discovery,
research-area-llm-reward-and-code-generation, research-area-open-ended-curriculum-and-task-generation,
research-area-self-improvement-from-verifiable-rewards,
research-area-autonomous-experimentation-and-world-model-discovery,
research-area-coding-agent-autoresearch, research-area-automated-algorithm-and-program-discovery,
research-area-automl-nas-and-learned-optimizers, research-area-meta-learning-and-recursive-self-improvement,
research-area-automated-agent-and-prompt-design, research-area-self-improvement-limits-and-survey.

If a source you find is already covered, cite it by id and move on; spend your budget on genuinely new
sources and angles for your lane.

## Deliverables per lane (exact paths and naming)

1. By-paper notes for each deep-read source: notes/by-paper/<arxiv-id-or-stable-slug>-<short-slug>.md.
   Record: full title, authors if available, venue/year, the mechanism (primary facts), the numbers as
   stated, the reproducibility status (environment-verified, self-reported, or claim-only), and one
   "relevance to this repo" paragraph that separates mechanical import from research contribution.
2. One theme file: notes/by-theme/research-area-<your-lane-topic>.md. A source-backed survey of the
   area with a "tie to the project / 4-layer admissibility" section and an explicit "what I could not
   verify" section.
3. One lane brief: notes/subagent-briefs/lane-<NN>-<topic>.md. Sources reviewed (count + list),
   strongest findings (source-backed), weak/uncertain claims, implications for this repo (mechanical vs
   contribution), recommended next questions, one-line tie to the thesis.
4. One manifest: raw-search-results/lane-<NN>-manifest.jsonl. One JSON object per line. Match the
   existing schema exactly: read raw-search-results/lane-28-manifest.jsonl first and copy its field set
   (id, title, the lane tag in a tags or lanes field, source_availability, notes_path, etc.). The
   coordinator merges by id, so the id must be the verified arXiv id or a stable repo slug.
5. One search log: raw-search-results/lane-<NN>-search-log.md (queries run, what HF returned, dead ends,
   ids verified vs rejected).

Depth target: 6 to 10 deep-read cornerstones (LaTeX or paper-read where possible) plus breadth at
abstract/repo level. Quality and verification over raw count.

## Honesty rules

- Never claim a result you did not read. Quote numbers from the source, do not re-derive them.
- If HF returns not-found for an id, mark it claim-only or drop it; never invent an id.
- State plainly where the literature stops (most of these areas have no structured-social-material,
  verifier-grounded instance; that gap is the repo's surface, not a citable result).
