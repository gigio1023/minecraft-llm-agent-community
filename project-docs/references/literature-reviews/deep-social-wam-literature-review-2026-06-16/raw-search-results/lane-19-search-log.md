# Lane 19 search log (AI Scientist and automated scientific discovery)

All searches run 2026-06-17. Discovery via Hugging Face CLI (`hf papers search`) first, then web for the two non-HF seed checks. arXiv ids verified before LaTeX fetch.

## Hugging Face CLI: paper searches

1. `hf papers search "AI Scientist automated scientific discovery" --limit 15`
   - Rationale: anchor query for the area. Confirmed seeds 2408.06292 (v1), 2504.08066 (v2), 2511.02824 (Kosmos). Surfaced new: 2507.23276 (How Far survey), 2509.08713 (Hidden Pitfalls), 2503.08979 (Agentic AI survey), 2603.08127 (EvoScientist), 2505.18705 (AI-Researcher).
2. `hf papers search "automated falsification scientific hypothesis agent" --limit 12`
   - Rationale: falsification angle. Confirmed seed 2411.11910 (AIGS / Baby-AIGS, FalsificationAgent).
3. `hf papers search "AI scientist risk failure modes research integrity" --limit 12`
   - Rationale: honesty/risk angle (lane emphasis). Surfaced 2605.10246 (SciIntegrity-Bench), 2511.04583 (Jr. AI Scientist risk, seed), 2601.03315 (Why LLMs Aren't Scientists Yet), 2605.18661 (AI for Auto-Research roadmap), 2505.23559 (SafeScientist), 2605.26340 (ScientistOne / CoE), 2510.18003 (BadScientist), 2605.23204 (AutoResearch AI survey), 2605.03042 (ARIS), 2502.14297 (Sakana evaluation).
4. `hf papers search "PhysMaster autonomous AI physicist" --limit 8`
   - Rationale: verify seed 2512.19799 (PhysMaster). Confirmed.
5. `hf papers search "AblationBench automated ablation study planning" --limit 8`
   - Rationale: verify seed 2507.08038 (AblationBench). Confirmed; also 2507.13300 (AbGen).
6. `hf papers search "MLE-bench machine learning engineering agents Kaggle" --limit 10`
   - Rationale: verify-then-add MLE-bench. Confirmed 2410.07095 (MLE-bench). (Engineering-loop family is H1/lane-18 territory; logged lightly.)
7. `hf papers search "Agent Laboratory automated machine learning research assistant" --limit 8`
   - Rationale: verify-then-add Agent Laboratory. Confirmed 2501.04227; also 2503.18102 (AgentRxiv), 2510.21652 (AstaBench).
8. `hf papers search "AI co-scientist multi-agent hypothesis generation Gemini" --limit 8`
   - Rationale: verify-then-add Google AI co-scientist. Confirmed 2502.18864 (Towards an AI co-scientist).

## Web (for seeds not in HF results)

9. WebSearch: "RE-Bench METR arxiv evaluating frontier AI R&D capabilities human experts"
   - Rationale: RE-Bench was a verify-then-add seed not surfaced by the HF queries above. Confirmed arXiv 2411.15114 (METR), code github.com/METR/RE-Bench. Captured the human-anchored result (AI 4x humans at 2h, humans overtake at 8h).

## Seed verification outcomes

- 2408.06292 v1: verified, fetched LaTeX.
- 2504.08066 v2: verified, fetched LaTeX.
- 2511.02824 Kosmos: verified, fetched LaTeX. Note: "structured world model" = shared-state coordination, not a predictive dynamics model (flagged in note).
- 2511.02824 page-stated 79.4% statement accuracy: confirmed in LaTeX (line 152), with breakdown 85.5/82.1/57.9.
- 2503.22444 AGS: verified, fetched LaTeX. Position paper; scaling laws are hypothesized, not measured (flagged).
- 2411.11910 AIGS/Baby-AIGS: verified, fetched LaTeX.
- 2512.19799 PhysMaster: verified (abstract-level).
- 2511.04583 Jr. AI Scientist risk: verified, fetched LaTeX.
- 2507.08038 AblationBench: verified (abstract-level).

No wrong seeds. No fabricated ids. ENPIRE (wave anchor) has no arXiv id as of 2026-06-17 (per existing notes/by-paper/enpire.md); not re-searched.

## LaTeX fetches (via scripts/fetch_arxiv_latex.sh, polite 3s sleeps)

`2408.06292 ai-scientist-v1`, `2504.08066 ai-scientist-v2`, `2511.02824 kosmos-ai-scientist`,
`2411.11910 aigs-baby-aigs-falsification`, `2511.04583 jr-ai-scientist-risk`,
`2605.10246 sciintegrity-bench`, `2509.08713 hidden-pitfalls-ai-scientist`,
`2503.22444 ags-robot-scientists`. All returned `latex=tarball_extracted`.

## Pacing note

8 HF paper searches + 1 web search + 8 LaTeX fetches. Small batches, no endpoint hammered. HF CLI authenticated as provided.
