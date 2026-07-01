# Shared Lane Contract (read first)

You are a parallel research subagent in a deep literature review for a Minecraft
LLM-agent project. This file is the shared contract every lane obeys. Your
lane-specific brief (`prompts/lane-N-*.md`) layers scope and seed sources on top.

You do not share the coordinator's chat context. This file is self-contained.
When you need more repo grounding, Read the repo files named below directly.

## 0. Absolute working rules (do not violate)

- Working root for ALL artifacts you write:
  `/Users/user/git/ad-agent-metrics/research/wam/project-docs/references/literature-reviews/deep-social-wam-literature-review-2026-06-16/`
  (call this `<ROOT>`). Only write inside `<ROOT>`.
- Do NOT call any paid LLM provider. Do NOT make provider API calls. Do NOT run
  live benchmarks. This is literature synthesis only.
- Do NOT modify runtime source code. Do NOT edit `AGENTS.md`, `README.md`,
  `SPEC.md`, `CLAUDE.md`, `GEMINI.md`, or anything outside `<ROOT>`.
- Keep every claim source-backed. For each non-obvious claim, name the source
  (arXiv id, repo, URL) inline.
- Separate three things explicitly in your notes, with headings:
  1. **Primary-source facts** (what the paper/code/docs actually state or show).
  2. **Interpretation** (your reading, clearly labeled as inference).
  3. **Mechanically useful vs research contribution** (what this repo can borrow
     as engineering vs what would count as a novel research claim).
- Evidence-first infrastructure (logs, transcripts, verifiers, manifests) is
  SUPPORT, not the research contribution. Do not frame evidence tooling as the
  contribution.
- Avoid sensational civilization-scale framing. Prefer modest, defensible claims.
- If LaTeX/source is unavailable, say so; do not fabricate. If you cannot verify
  a claim, mark it "unverified report claim."

## 1. The project you are serving (condensed, faithful)

A headless Minecraft runtime research project ("minecraft-llm-agent-community").
It is NOT a Voyager clone, NOT race-to-diamond, NOT benchmark-maximization, NOT a
Project Sid civilization demo. It evaluates whether LLM-controlled embodied
Minecraft actors can sustain socially meaningful behavior in natural worlds,
where social claims are constrained by verifiable movement, inventory, crafting,
storage, communication, memory, obligations, material claims, public affordances,
weak commons, and post-goal continuation.

Runtime shape (TypeScript + Mineflayer):
`ActorSoul + LifeGoal + PlanBeadGraph + observation + memory -> Actor Turn
(one function-tool selection) -> Action Card or author_mineflayer_action ->
runtime gates (schema, permission, retry, verifier) -> Mineflayer execution ->
evidence trace (transcript, memory, CycleJudgment) -> next cycle.`

Hard project rule: the LLM proposes; the runtime owns physical truth (schemas,
gates, verifiers, artifacts). Prose is never executable authority. A WAM, if
adopted, must stay advisory: it predicts/evaluates consequences; it must not
fill missing args, mark progress true, override verifiers, or replace Actor Turn
selection.

The repo already defines a material-economy vocabulary you must reuse exactly:
`personal possession`, `material claim`, `public affordance`, `weak commons`,
`unclaimed world resource`, `obligation/credit`. And a maturity ladder:
`proto-social -> organization -> settlement -> village -> society`.

For deeper grounding, Read (only as needed for your lane):
- `<repo>/SPEC.md`
- `<repo>/project-docs/references/literature-sweeps/social-wam-research-frame-2026-06-16.md`
  (the existing WAM seed this review expands)
- `<repo>/project-docs/specification/evidence-grounded-minecraft-society.md`
- `<repo>/project-docs/specification/soul-grounded-social-simulation.md`
- `<repo>/project-docs/research/reference-synthesis/research-direction-reference-synthesis.md`
- `<repo>/project-docs/specification/reference-adaptation-guide.md`
where `<repo>` = `/Users/user/git/ad-agent-metrics/research/wam`.

## 2. The canonical WAM definition (use this vocabulary)

From the WAM survey (arXiv 2605.12090, "World Action Models: The Next Frontier
in Embodied AI"), already downloaded at `<ROOT>/papers/latex/2605.12090/`:

- VLA: `p(a | o, l)` - reactive observation->action, no dynamics model.
- World Model (WM): `p(o' | o, a)` - predictive transition only, no action
  selection (a learned simulator).
- WAM: `p(o', a | o, l)` - joint/conditional of future state AND action. Two
  criteria: (1) Forward Predictive Modeling (forecast `o'`, explicitly as pixels
  OR implicitly as physics-grounded latents), (2) Coupled Action Generation
  (actions aligned to anticipated `o'`).
- Cascaded WAM: `p(o',a|o,l) = p(a|o',o,l)-p(o'|o,l)` (imagine-then-execute).
- Joint WAM: directly model `p(o',a|o,l)` (co-optimized shared representation).
- Disambiguation the survey draws: WAM is a modality-INDEPENDENT superset of
  Video Action Models (video is "merely one possible proxy"); future state may be
  "single-image state transitions, dense point clouds, tactile/force." WAM differs
  from Video Policies (those lack an explicit predictive commitment to `o'`).

Key implication for this project (interpretation, flag it as such): a
STRUCTURED-STATE Minecraft WAM (where `o` = typed Minecraft+social state and `o'`
= predicted social-material deltas) is squarely inside the canonical definition's
"implicit physical representation" branch. Pixel/video is one instantiation, not
the definition. The user wants you to test which instantiation is feasible.

## 3. The 4-layer hierarchy this review must populate

1. **Physical WAM**: predicts physical consequences of Minecraft actions -
   movement, reachability, mining, crafting, placing, combat/damage risk,
   inventory deltas, block/container changes, health/hunger/status, tool
   durability, time cost, failure modes, newly available/blocked affordances.
2. **Material / Economic WAM**: possession + resource-flow - who has which item,
   who controls which tool/station/container/place, scarcity, private possession,
   material claims, borrowing/lending, weak commons, public affordances, hoarding
   vs contribution, costs imposed on others.
3. **Social WAM**: embodied social consequences - request, promise, refusal,
   acceptance, warning, handoff, borrow/lend/return, repair, blame, gratitude,
   conflict, cooperation, trust, reputation, relationship expectation, memory
   commitment, future social cost.
4. **Institutional / Settlement WAM**: longer-horizon patterns - routines, roles,
   division of labor, conventions, norms, ownership practices, public-affordance
   use, weak-commons maintenance, settlement persistence, organization-like
   behavior, post-goal continuation.

Physical predictions must be reliable before social predictions are meaningful
(a social claim like "Bob can now mine" depends on a physical fact like "Bob has
a pickaxe with durability > 0"). Keep this dependency visible in your analysis.

## 4. Discovery channels (Hugging Face CLI is primary)

Use `hf` (Hugging Face CLI) first, then web. `hf` is authenticated already.
Useful commands (record the exact ones you run in your search log):
- `hf papers search "<query>" --limit 20`
- `hf papers read <arxiv_id>`  (returns markdown of the paper)
- `hf papers info <arxiv_id>`
- `hf models list --search "<q>" --limit 20` / `hf datasets list --search "<q>"`
- `hf models info <repo>` / `hf datasets info <repo>` / `hf datasets card <repo>`
To load web tools, call ToolSearch first, e.g.
`ToolSearch("select:WebSearch,WebFetch")`, then use WebSearch / WebFetch for
arXiv, Semantic Scholar, Papers with Code, GitHub, project pages, docs.
Be polite: small batches, brief pauses; do not hammer any endpoint.

## 5. LaTeX-first paper extraction

For each PRIMARY source in your lane (your most important ~6-12), download source:
```
bash <ROOT>/scripts/fetch_arxiv_latex.sh <arxiv_id> <short-slug>
```
This writes `papers/latex/<id>/` (extracted .tex/.bib), falls back to
`papers/pdf/<id>.pdf` if source is unavailable, and writes
`papers/metadata/<id>.json`. Then Read the `.tex` directly (intro, method,
experiments, limitations, related work). Prefer LaTeX over PDF over abstract.
For breadth sources (the long tail), a manifest entry + abstract is enough; do
not download everything. Note in your brief which sources are LaTeX vs PDF vs
abstract-only so the coordinator can count.

## 6. For every important source, extract (the source-note schema)

Write one note per major source to `<ROOT>/notes/by-paper/<arxiv_id_or_slug>.md`
with these fields (omit a field only if truly N/A, and say why):
- title, authors, year, venue/source, arxiv_id, urls (paper/code/data/hf)
- research question
- model architecture
- input / output (state and action representation; pixels vs latent vs symbolic)
- action space
- observation / state representation
- dataset shape (size, modality, how collected, row shape)
- training objective
- evaluation protocol + metrics
- limitations (theirs + ones you spot)
- code availability / data availability / model-weight availability
- reproducibility status (reproducible / partial / claim-only) with reason
- **what this repo can adapt** (mechanically useful)
- **what this repo should avoid / what would be overclaim**
- which WAM layer(s) it informs (Physical / Material / Social / Institutional)

## 7. Manifest fragment (one JSON object per line)

Append one line per source you touch to
`<ROOT>/raw-search-results/lane-<N>-manifest.jsonl` (your lane's own file; the
coordinator concatenates). Schema:
```json
{"id":"slug-or-arxiv","title":"","authors":"","year":2026,"venue":"","url":"","arxiv_id":"","code_url":"","data_url":"","hf_url":"","downloaded_latex_path":"","downloaded_pdf_path":"","source_availability":"latex|pdf|abstract|repo|docs","reproducibility_status":"reproducible|partial|claim-only|n/a","relevance_tags":["physical-wam","material-wam","social-wam","institutional-wam","minecraft","world-model","vla","benchmark","sociology","data","validity"],"lane":N,"notes_path":"notes/by-paper/<file>.md"}
```

## 8. Search log fragment

Append the exact commands/searches you ran, with dates and one-line rationale,
to `<ROOT>/raw-search-results/lane-<N>-search-log.md`.

## 9. Subagent brief (your lane summary)

Write `<ROOT>/notes/subagent-briefs/lane-<N>-<name>.md` containing:
- lane name
- sources reviewed (count + list with ids)
- strongest findings (source-backed)
- weak or uncertain claims (what you could not verify)
- implications for this repo (mechanically useful vs research contribution)
- recommended next questions

## 10. Owned synthesis files

Your lane brief names the `notes/by-theme/*.md` file(s) and `matrices/*.md`
file(s) you own. Write those too. Theme files: source-backed prose + tables,
external-team readable, define jargon on first use. Matrices: markdown tables.

## 11. What to return to the coordinator

Write everything to files. Return ONLY a concise summary (<= ~300 words):
- files you created (paths)
- counts: sources found, LaTeX downloaded, PDF-only, abstract-only
- top 5 sources for this lane (id + one line why)
- 3 strongest findings
- biggest gap / what you could not verify
Do not paste long notes back; the coordinator will Read your files.
