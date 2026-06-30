# Wave-2 Contract Addendum: WAM Foundations Deepening (read after the shared contract)

You are a parallel research subagent in **wave 2** of this literature review. Wave 1
(lanes 1-6) already produced a 107-source review oriented toward "should this
Minecraft repo adopt a WAM, and how." Wave 2 exists because the human reader is **new
to the World Action Model / world-model field** and wants the *foundations themselves*
covered much more rigorously and pedagogically.

**Read `prompts/00-shared-lane-contract.md` first.** Every rule there still binds you:
working root (`<ROOT>` = this review directory; write only inside it), no paid LLM /
provider / API calls, no runtime source edits, no edits outside `<ROOT>`, every claim
source-backed, separate Primary-source facts vs Interpretation vs Mechanically-useful-
vs-research-contribution, Hugging Face CLI first then web, LaTeX-first extraction via
`scripts/fetch_arxiv_latex.sh`, the by-paper note schema, the manifest fragment schema,
the search-log fragment, and the per-lane brief.

This addendum layers four things on top.

## 1. Pedagogical lens (the point of wave 2)

The reader does not know this field. So:

- **Define every term on first use** (latent dynamics, RSSM, imagination/rollout,
  inverse-dynamics model, teacher forcing, exposure bias, compounding error,
  autoregressive vs diffusion prediction, value-equivalence, behavior cloning,
  action tokenization, world simulator). A one-line plain definition, then use it.
- For **each paper, lead with "what it introduced and why it mattered"** in plain
  language before the technical detail. A newcomer should learn the *idea*, not just
  the result.
- Build a **genealogy**: who built on whom, what problem each step solved, what the
  next step fixed. Chronology and causal "why" matter more than exhaustiveness.
- Keep claims **modest and source-backed**; mark anything you could not verify as
  "unverified report claim." Do not fabricate arXiv IDs, numbers, or quotes.

## 2. Extend, do not duplicate (what wave 1 already wrote)

These already exist. **Do NOT overwrite or re-derive them.** Cite them, build on them,
and fill the foundational/historical gaps they skipped.

Existing theme files (`notes/by-theme/`):
- `wam-foundations.md`, formal `p(o',a|o,l)` definition, Cascaded vs Joint, WAM vs
  neighbors, what-WAM-predicts, weight-reuse, pixel-vs-structured argument. Wave-1,
  application-first and terse. Your job is the *genealogy and teaching depth* behind it.
- `minecraft-world-models.md`, Solaris, MineWorld, Oasis, Matrix-Game, WildWorld,
  Dreamer-in-Minecraft. **Do not redo the Minecraft pixel-WM survey**; reference it.
- (others: `data-and-training-feasibility.md`, `benchmark-validity-and-evaluation.md`,
  the social/sociology/benchmark themes, not your area.)

Existing by-paper notes you may CITE but must not overwrite: `2605.12090-wam-survey.md`,
`2605.12090-wam-survey-data-section.md`, `2602.15922-dreamzero.md`,
`2603.22078-do-wams-generalize.md`, `2605.06222-when-to-trust-imagination.md`,
`2604.25859-privileged-foresight-distillation.md`, `2410.12822-avid.md`,
`2601.15533-actionable-simulators.md`, `2509.24527-dreamer4.md`,
`2504.08388-mineworld.md`, `2602.22208-solaris.md`, `2603.23497-wildworld.md`,
`2206.11795-vpt.md`, `2410.11758-lapa.md`, `2503.16365-jarvis-vla.md`,
`game-world-models-family.md`.

If your lane needs a deeper or lineage-framed take on one of these, **add your analysis
to your own theme file**, do not rewrite their by-paper note. You MAY create brand-new
by-paper notes for canonical foundations that have NO note yet (most of them do not).

## 3. Output locations (wave-2 specific)

- Manifest fragment: `raw-search-results/lane-<N>-manifest.jsonl` (your N is in the
  lane brief: 7, 8, 9, or 10). Same JSON schema as the shared contract. The coordinator
  re-runs `scripts/merge_manifest.py`, which dedupes by `id` and unions tags/lanes, so
  if you touch a source another lane already logged, just log your row; the merge folds
  it in.
- Search-log fragment: `raw-search-results/lane-<N>-search-log.md`.
- Per-lane brief: `notes/subagent-briefs/lane-<N>-<name>.md`.
- New by-paper notes: `notes/by-paper/<arxiv_id>-<slug>.md`.
- Owned theme file(s): named in your lane brief, under `notes/by-theme/`.

## 4. Scope discipline

- Wave 2 is about **WAM-the-field foundations**, not the repo application. For each
  source add at most a one-line "relevance to this repo" pointer; do NOT re-derive the
  4-layer social-material argument (wave 1 owns that).
- Verify arXiv IDs before fetching (`hf papers search`, or web). Seed IDs in your brief
  are "best-known, verify first", correct them if wrong and note the correction in your
  search log.
- Depth over breadth: deep-read (LaTeX) your ~6-10 cornerstone papers; abstract-level is
  fine for the long tail. Note which are LaTeX vs PDF vs abstract so the coordinator can
  count.
- Punctuation in everything you write: no em-dash, middle-dot, or bullet-char; use ASCII
  `-` for bullets, `:` or commas or periods for clause separation.
