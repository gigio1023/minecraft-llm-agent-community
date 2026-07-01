# Contract addendum: SDK-autoresearch / social-WAM positioning investigation (2026-06-17)

Every lane agent reads this file first. It is self-contained. Follow it exactly.

## 0. What this investigation is

A focused POSITIONING study for a Minecraft LLM-agent research project. The owner is deciding how to
position the project around three stacked ideas: (1) World Action Models / world models, (2) Minecraft
as a wild, natural, reproducible open-world substrate, (3) social-consequence modeling grounded in
material world dynamics, improved by (4) an autoresearch / SDK-style coding-agent loop. This is a
research-synthesis task, not an implementation task.

The central concern is NOT generic benchmarking, structured state, or evidence logging as the
contribution. Evidence, logs, seeds, ledgers, scoring scripts are SUPPORT infrastructure, an audit
surface. The real question: can embodied LLM-controlled actors in natural Minecraft worlds sustain
socially meaningful behavior where action consequences affect material state, opportunity, memory,
obligation, trust, conflict, repair, and continuation beyond a single scripted task.

## 1. Standing mission constraints (hard rules, do not violate)

- Do NOT run live paid LLM provider benchmarks. Do NOT make provider API calls.
- Do NOT modify any runtime source code in the project.
- Do NOT edit the repo-root files AGENTS.md, README.md, SPEC.md, CLAUDE.md, GEMINI.md. (You only WRITE
  inside the archive output dir named in section 4. The archive's own README is written by the
  coordinator, not by lanes.)
- Keep every claim source-backed. SEPARATE primary-source verified facts from author claims and from
  your interpretation. Mark claim-only numbers as "claim-only".
- Treat Project Sid (PIANO) as a CAUTIONARY / reference case: extract useful case designs and metrics,
  but clearly LABEL any claim as unreproduced when code, raw logs, scoring scripts, or runnable
  artifacts are absent.
- Do NOT frame the project as evidence-first benchmarking, and do NOT position "structured state" as
  the research novelty. Structured state is an implementation detail.
- Do NOT copy Voyager, MineStudio, Project Sid, or Generative Agents as product specs. Translate
  MECHANISMS, not product shapes.

## 2. The project lens (use this vocabulary, keep claims inside it)

- Social WAM is NOT a model that only predicts trust/obligation/relationship labels. Social prediction
  matters only if grounded in physical and material world dynamics. The object of interest is an
  action-conditioned predictor p(o' | o, l): given an observation o and a latent/action l, predict the
  next observation o', where o' includes physical, material, AND social-material deltas.
- Four-layer hierarchy (a prediction at layer N is only meaningful if the layers below it are
  reliable):
    1. Physical: blocks, position, inventory counts, reachability, durability, health.
    2. Material / economic: possession, control, transfer, claims over resources.
    3. Social: obligation, trust, gratitude, conflict, repair, cooperation, reputation.
    4. Institutional / settlement: persistent norms, roles, commons maintenance, settlement continuity.
- The repo already has a DETERMINISTIC runtime verifier that auto-labels (state, action, next-state) at
  the Physical and Material layers at near-zero cost. This verifier is the project's central asset. The
  one rule the whole literature enforces: an external deterministic verifier may SCORE; a learned reward
  model, an LLM judge, or the actor scoring its own success is INADMISSIBLE (it over-optimizes, hacks,
  or collapses). The repo's term for the failure is "progress laundering".
- The WAM is ADVISORY: it predicts and proposes; it must never select the executed action, fill action
  arguments, mark progress true, or override the verifier.

## 3. The reuse base (extend, do not duplicate)

A deep 560-source archive already exists at (absolute path):
`/Users/user/git/ad-agent-metrics/research/wam/project-docs/references/literature-reviews/deep-social-wam-literature-review-2026-06-16/`

It has 252 by-paper notes under `notes/by-paper/`, 41 theme files under `notes/by-theme/`, 15 matrices,
and `source-manifest.jsonl` (560 rows). Many papers are already downloaded as LaTeX under
`papers/latex/<arxiv_id>/`.

RULES for reuse:
- Before searching, READ the existing theme files and by-paper notes relevant to your lane (your
  lane-specific brief names them). Cite an existing by-paper note by its path; do NOT rewrite it.
- Write a NEW by-paper note ONLY for a source not already noted in that archive. Keep new notes in THIS
  investigation's `notes/by-paper/`.
- If a paper's LaTeX is already downloaded in the old archive, reuse it (read it there); do not
  re-download.
- Your job is the DELTA this positioning framing needs, plus a synthesis note for your lane.

## 4. Output location and deliverables (per lane)

Output dir (absolute):
`/Users/user/git/ad-agent-metrics/research/wam/project-docs/references/literature-reviews/sdk-autoresearch-social-wam-positioning-2026-06-17/`

Each lane writes, under that dir:
- `notes/by-paper/<id>-<slug>.md` for each NEW source you deep-read (NOT already in the old archive).
- one synthesis note in `notes/by-theme/<your-lane-file>.md` (named in your brief).
- `notes/subagent-briefs/<your-lane-file>.md`: a short brief (scope, sources reviewed count, strongest
  findings, weak/uncertain claims, implications for the repo, recommended next questions, one-line tie
  to the thesis, deconfliction).
- `raw-search-results/<your-lane>-manifest.jsonl`: one JSON object per source you touched (schema
  below).
- `raw-search-results/<your-lane>-search-log.md`: queries run, tools used, what was found, what is
  unresolved or inaccessible.

## 5. Manifest schema (one JSON object per line, match exactly so it merges)

```
{"id": "<arxiv_id or stable slug>", "title": "...", "authors": "...", "year": 2026,
 "venue": "...", "url": "https://...", "arxiv_id": "<or empty>", "code_url": "<or empty>",
 "data_url": "<or empty>", "hf_url": "<or empty>", "downloaded_latex_path": "<or empty>",
 "downloaded_pdf_path": "<or empty>", "source_availability": "latex|pdf|abstract|repo|docs",
 "reproducibility_status": "full|partial|none|n/a", "relevance_tags": ["..."],
 "lane": <your lane letter as a string, e.g. "A">, "notes_path": "notes/by-paper/<id>-<slug>.md"}
```
- `id` must be unique and stable. For non-arXiv tools (an SDK, a GitHub repo), use a readable slug like
  `claude-agent-sdk`, `openai-codex-sdk`, `dspy`, `swe-agent`.
- If you only cite an EXISTING old-archive note (no new note), still add a manifest row, set
  `notes_path` to the OLD archive relative path prefixed with `../../../2026-06-16/deep-social-wam-literature-review/`
  and `source_availability` to what the old note recorded.

## 6. Tooling and honesty

- Use the Hugging Face CLI as a primary discovery channel: `hf papers search "<query>"`,
  `hf papers read <id>`, `hf papers info <id>`, `hf models list --search`, `hf datasets list --search`.
  Record the exact command in your search-log.
- Use WebSearch / WebFetch actively for official docs and repos (SDK docs, GitHub READMEs, benchmark
  docs). Record exact URLs and an access note (accessed, paywalled, 404, partial).
- For arXiv papers prefer LaTeX source. If you fetch new LaTeX, you may use the old archive's
  `scripts/fetch_arxiv_latex.sh` pattern, or `hf paper` read. Use PDF only when LaTeX is unavailable.
- HONESTY: only claim you read what you actually fetched. If a source is inaccessible, say so in the
  search-log and set its manifest `source_availability` accordingly. Distinguish a number you verified
  in the body from a number quoted in an abstract (claim-only).

## 7. Writing style (enforced)

- ASCII punctuation only. Use `-`, `:`, `,`, `.`. Do NOT use em-dash, en-dash, middle-dot, the bullet
  character, smart quotes, ellipsis character, or arrow glyphs. (Markdown list dashes `-` are fine.)
- Define jargon on first use.
- Do not use the Korean word for contract; if writing Korean, use the loaned word for spec/규약.
- Lead with the mechanism and the number, then the interpretation.
