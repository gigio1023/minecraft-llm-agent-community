# Search log (aggregate)

What this is: the top-level record of how this investigation was run. Per-lane raw query logs are in
`raw-search-results/lane-{A,B,C,D}-search-log.md`; this file summarizes tools, per-lane queries, what
was found, and what is unresolved or inaccessible. Date: 2026-06-17. ASCII punctuation only.

## Method

- Built on the 560-source 2026-06-16 archive (`../../2026-06-16/deep-social-wam-literature-review/`):
  reused theme files, by-paper notes, matrices, and the Project Sid root review by path (cited, not
  rewritten). New primary-source research was run only for this framing's deltas.
- Four parallel background lanes (A SDK loops, B cross-product novelty, C substrate, D reproducibility +
  Sid). Each wrote by-paper notes, a theme synthesis, a brief, a manifest fragment, and a search log.
- Constraint honored: no live paid LLM provider benchmark, no provider API call, no runtime source edit,
  no edit to repo-root AGENTS.md / README.md / SPEC.md / CLAUDE.md / GEMINI.md. Only the archive was
  written.

## Tools used

- Hugging Face CLI (`hf papers search`, `hf papers read`, `hf papers info`) as a primary discovery
  channel (lanes A, B, C).
- WebSearch and WebFetch for official docs (Claude Agent SDK, OpenAI Codex), GitHub repos and raw
  READMEs, arXiv abstract pages, and norm documents.
- Bash `grep` over the old archive manifest and notes; `pdftotext` for two checklist PDFs WebFetch could
  not parse (lane D).
- Read over old-archive theme files, by-paper notes, and matrices.

## Per-lane queries and findings

- Lane A (SDK loops): fetched the Claude Agent SDK overview (final URL code.claude.com), OpenAI Codex
  agent-approvals/agents-sdk/subagents pages, GEPA via `hf papers info 2507.19457` + GitHub, OpenHands
  2407.16741 via `hf papers info` + abstract + README. Found that today's SDKs expose the loop
  primitives the autoresearch thesis needs (loop-as-library, hooks, sandboxes, approval policies,
  subagents, MCP) and that DSPy/MIPRO and GEPA optimize a software surface against a fixed user-supplied
  metric.
- Lane B (novelty): `hf papers search` on social-world-model / self-improving-embodied / world-model-
  multi-agent queries plus WebSearch; verified 10 new 2025-2026 works at abstract level (EvolvingAgent
  2502.05907, MineEvolve 2603.13131, SimWorld 2512.01078, AIvilization 2602.10429, position papers
  2510.21219 and 2604.22748, and others). Found the 4-way intersection empty; closest triple
  EvolvingAgent (single-actor, physical, self-judged).
- Lane C (substrate): `hf papers read 2310.13724` (Habitat 3.0 speed paragraph), WebFetch on the two
  sim-to-real surveys (2009.13303, 2502.13187) and PARTNR (2411.00081). Found Minecraft is the only
  family that is both deterministically material-verifiable and cheap at society scale.
- Lane D (reproducibility + Sid): WebFetch on the altera-al GitHub org, the project-sid repo, and its
  raw README; `pdftotext` on the Pineau ML Reproducibility Checklist and JMLR report; WebSearch on
  NeurIPS D&B norms and Papers-with-Code. Verified live (2026-06-17) that Project Sid ships only a report
  PDF, README, image, and video (0/5 on the Papers-with-Code code bar; every metric unreproduced).

## Unresolved, inaccessible, or claim-only (carried into the reports)

- OpenHands (2407.16741): the full PDF body was not text-extractable on fetch; its architecture facts
  (event stream, AgentSkills, multi-agent delegation) are from the abstract, a secondary summary, and
  the README, not the paper body. Flagged source_availability abstract.
- GEPA (2507.19457): the arXiv HTML returned "6% / six tasks" while the Hugging Face authoritative
  summary returned "10% / four tasks". Resolved in favor of the HF summary; all GEPA numbers are
  claim-only pending a LaTeX body read.
- Lane B's 10 new sources are all abstract-level (no full LaTeX deep-read); EvolvingAgent's
  self-verification and MineEvolve's typed-feedback claims are abstract-quoted. The empty-4-way verdict
  is bounded by Hugging Face / web / arXiv indexing as of 2026-06-17, not a proof of non-existence.
- Lane C's Habitat 3.0, PARTNR, and sim-to-real survey numbers are claim-only (abstract + speed
  paragraph, no full LaTeX); MuJoCo/Isaac throughput figures are web-claim-only context.
- Lane D: the negative-results taxonomy (2406.03980) was read at abstract level only; AIvilization
  (2602.10429) scoring-artifact status is unverified. No source was inaccessible via WebFetch; the
  arXiv API curl path failed and was replaced by WebFetch on abstract pages.

## Manifest

- 52 unique sources after merge and dedup (`source-manifest.jsonl`): 19 LaTeX, 3 PDF-only, 30
  abstract/repo/docs. 0 bad JSON, 0 broken notes_path, no duplicate arXiv id. Same-paper rows (Project
  Sid 2411.00114; AIvilization 2602.10429) were reconciled to one source each, preferring the
  new-archive note.
