# Wave-5 Contract Addendum: the self-improvement / autoresearch concept across all domains

You are a parallel research subagent in **wave 5**. Waves 1-4 produced a 402-source review:
WAM foundations, the Minecraft/social application, 23 research-area surveys, and (wave 4) 6
autoresearch surveys anchored on ENPIRE. Wave 5 broadens one idea deliberately: the general concept
of machine **self-improvement** ("자가발전"), also called **autoresearch**, across ALL domains, NOT
just robotics. The user asked for this explicitly: research everything studied under the
self-improvement idea, robotics or not, with the coding-agent (Codex-style) angle centered.

Read `prompts/00-shared-lane-contract.md` first. Every rule binds you: working root (`<ROOT>`; write
only inside it), no paid LLM / provider / API calls, no runtime edits, no edits outside `<ROOT>`,
every claim source-backed, separate Primary-source facts vs Interpretation vs
Mechanically-useful-vs-research-contribution, Hugging Face CLI first then web, LaTeX-first via
`scripts/fetch_arxiv_latex.sh`, the by-paper note schema, the manifest fragment schema, the
search-log fragment, the per-lane brief. Punctuation: ASCII only, no em-dash, middle-dot, or
bullet-char (use `-`, `:`, `,`, `.`).

## 1. The anchor, now PDF-verified, and the key reframing

The anchor `notes/by-paper/enpire.md` was upgraded to PDF-verified (the coordinator read the full
29-page paper). Two facts reframe this wave:

- The term "autoresearch" is Andrej Karpathy's (`github.com/karpathy/autoresearch`: AI agents running
  research on single-GPU nanochat training automatically). Autoresearch is fundamentally a DIGITAL
  idea (a coding agent automates algorithmic improvement); ENPIRE is its extension to the physical
  world. Wave 5 maps the DIGITAL and GENERAL self-improvement field that ENPIRE sits on top of.
- The improvement engine is a coding agent that CHOOSES among regimes (heuristic, behavior cloning,
  offline/online RL, code-as-policy, hybrid). RL is one inner-loop option, not the framing. Treat
  "self-improvement" broadly: any loop where a system improves its own policy, code, model,
  architecture, reward, prompt, or training recipe.

## 2. Anchor everything to the original query and the autoresearch thesis

Original query: "Can a hierarchical action-conditioned world model predict and evaluate how Minecraft
actions transform physical state, material economy, social relations, memory, and future action
opportunities in an embodied open world?" Repo shape: an LLM tool-use actor on a Mineflayer runtime
where the runtime owns physical truth; a WAM, if adopted, stays advisory. 4 layers: Physical,
Material/economic, Social, Institutional/settlement.

Wave-4 thesis (still the anchor): an ENPIRE-style loop grounded by the runtime verifier is a natural
way to autonomously improve the advisory social-material WAM or policy at near-$0 with no human
labels, IF it stays advisory and verifier-grounded and never lets the agent score its own success
(progress laundering). Your lane reports how its sub-area supports, complicates, bounds, or warns
against this thesis. Be modest; the broad self-improvement literature is full of speculative
recursive-self-improvement claims, so distinguish demonstrated results from speculation sharply.

## 3. Extend, do not duplicate (29 existing theme files)

Cite where you connect; do NOT re-survey. Your brief names the specific siblings to deconflict
against. The closest neighbors are the wave-4 themes (do not redo them):
`research-area-agentic-self-improvement-loops` (the loop itself, ENPIRE/DGM/EvolveR),
`research-area-ai-scientist-automated-discovery` (paper-writing science),
`research-area-llm-reward-and-code-generation` (Eureka-style reward/skill code),
`research-area-open-ended-curriculum-and-task-generation` (POET/OMNI),
`research-area-self-improvement-from-verifiable-rewards` (RLVR/STaR/self-play),
`research-area-autonomous-experimentation-and-world-model-discovery` (WebEvolver/curiosity). Wave-5
lanes cover the genuinely-uncovered areas: coding-agent autoresearch as a digital phenomenon,
automated algorithm/program discovery, AutoML/NAS/learned optimizers, meta-learning and recursive
self-improvement theory, automated agentic-system and prompt/workflow design, and the
field-level survey + limits of self-improvement.

## 4. Output locations (wave-5 specific)

- Manifest fragment: `raw-search-results/lane-<N>-manifest.jsonl` (your N is 24-29). Same JSON schema;
  add tags `autoresearch` and `self-improvement` where they apply, plus area tags
  (`automl`, `program-synthesis`, `meta-learning`, `agent-design`, `coding-agent`, `limits`). The
  coordinator re-runs `scripts/merge_manifest.py` (dedup by `id`, union tags/lanes), so logging a
  source another lane also logged is fine. Do NOT write to any `lane-coord-*` file or other lanes'
  files.
- Search-log fragment: `raw-search-results/lane-<N>-search-log.md`.
- Per-lane brief: `notes/subagent-briefs/lane-<N>-<name>.md`.
- New by-paper notes: `notes/by-paper/<arxiv_id_or_slug>-<slug>.md` (only for deep-read sources).
- Owned theme file: `notes/by-theme/research-area-<name>.md` (named in your brief).

## 5. Scope and honesty

- Verify arXiv ids before fetching (`hf papers search`, web). Correct wrong seeds in your search log.
  Mark anything unverifiable "unverified report claim". Do not fabricate ids, numbers, or quotes.
- Distinguish demonstrated, measured self-improvement from speculative recursive-self-improvement
  claims and from self-reported (self-graded) results. That distinction is the point of this wave.
- Return ONLY a concise summary (<=300 words): files created; counts (sources/LaTeX/PDF/abstract);
  top 5 sources with one line each; 3 strongest findings; one-line tie to the thesis; the biggest
  thing you could not verify. Do not paste long notes back; the coordinator reads your files.
