# Lane 25 (I2) search log: automated algorithm and program discovery

All work 2026-06-17. Tools: `hf papers search` (HF CLI, authenticated as naem1023),
WebSearch, WebFetch, and `scripts/fetch_arxiv_latex.sh`. Punctuation: ASCII only.

## Seed id verification (key correction up front)

Three named seeds are Nature-only with NO arXiv preprint (DeepMind publishes these
directly to Nature). This was verified, not assumed:
- FunSearch = Nature 10.1038/s41586-023-06924-6 (2024). No arXiv. Used the open-access
  PMC mirror PMC10794145 and the practical reimplementation arXiv 2503.11061.
- AlphaTensor = Nature 10.1038/s41586-022-05172-4 (2022). No arXiv. Code on GitHub.
- AlphaDev = Nature 10.1038/s41586-023-06004-9 (2023). No arXiv.
Verified-with-arXiv seeds: AlphaEvolve 2506.13131, DreamCoder 2006.08381, DiscoPOP
2406.08414, EoH 2401.02051, ReEvo 2402.01145, STOP 2310.02304 (cite to lane 27),
LLM-SR 2404.18400. New finds: AlphaResearch 2511.08522, EvoTrace/EvoReplay 2605.20086,
"Mathematical exploration at scale" 2511.02864, and the many AlphaEvolve descendants below.

## Commands run (chronological)

1. `hf papers search "FunSearch mathematical discovery large language models" --limit 8`
   -> rationale: locate FunSearch; found the practical reimplementation 2503.11061 (FunSearch
   itself is Nature-only, confirmed below) and several symbolic-discovery neighbors.
2. `hf papers search "AlphaEvolve coding agent algorithm discovery" --limit 8`
   -> AlphaEvolve 2506.13131 verified; plus CodeEvolve 2510.14150, "Mathematical exploration
   and discovery at scale" 2511.02864, SATLUTION 2509.07367, DeepEvolve 2510.06056, MLEvolve
   2606.06473, multiagent-algorithm-discovery 2602.16928, and the skeptic 2605.20086.
3. `hf papers search "AlphaDev faster sorting ..." --limit 5` and
   `hf papers search "AlphaTensor matrix multiplication ..." --limit 5`
   -> mostly noise (Nature papers not HF-indexed under those queries). Confirmed Nature-only
   via web (step 6/7).
4. `hf papers search "DreamCoder wake-sleep library learning program induction" --limit 6`
   -> DreamCoder 2006.08381 verified.
5. `hf papers search "DiscoPOP discovering preference optimization objectives LLM" --limit 6`
   -> DiscoPOP 2406.08414 verified.
6. `WebSearch "AlphaDev faster sorting algorithms Mankowitz Nature 2023 arXiv"`
   -> confirmed Nature 10.1038/s41586-023-06004-9, no arXiv; LLVM libc++ upstream; 2-70% speedups.
7. `WebSearch "AlphaTensor Fawzi Nature 2022 ... arXiv"` and
   `WebSearch "FunSearch Romera-Paredes Nature 2024 ... arXiv id"`
   -> both confirmed Nature-only (s41586-022-05172-4; s41586-023-06924-6); no arXiv preprints.
8. `hf papers search "Evolution of Heuristics ... LLM"` / `"ReEvo reflective evolution ..."`
   / `"LLM symbolic regression equation discovery scientific"`
   -> EoH 2401.02051, ReEvo 2402.01145, AEL 2311.15249, CALM 2505.12285, STOP 2310.02304,
   AlphaResearch 2511.08522, LLM-SR family (2404.18400 confirmed in step 11), LLM-SRBench 2504.10415.
9. `bash scripts/fetch_arxiv_latex.sh` for: 2506.13131 alphaevolve; 2006.08381 dreamcoder;
   2406.08414 discopop; 2401.02051 eoh; 2402.01145 reevo; 2605.20086
   what-evolutionary-coding-agents-evolve; 2511.08522 alpharesearch.
   -> all 7 returned `latex=tarball_extracted` (tex files: 14, 2, 2, 10, 19, 14, 7).
10. Deep-read (Read tool) the LaTeX of all 7: AlphaEvolve (intro/methods/results/related/
    discussion), EvoTrace (intro/experiments/discussion), EoH (method), ReEvo (evolution),
    DiscoPOP (discovery/results/analysis/limitations), DreamCoder (intro + abstraction-sleep),
    AlphaResearch (abstract + method/environment).
11. `WebFetch` PMC10794145 (FunSearch full text; redirect to pmc.ncbi.nlm.nih.gov followed)
    -> extracted exact results: cap set size 512 in n=8; capacity 2.2180 -> 2.2202; bin packing
    OR1 5.30% vs best-fit 5.81%, Weibull 100k 0.03% vs 3.79%; program-over-object rationale;
    efficient-evaluator requirement; proofs out of scope.
    `WebSearch "LLM-SR symbolic regression ..."` -> LLM-SR 2404.18400 (ICLR 2025 Oral) confirmed.

## Counts

- Sources logged in manifest: 23 (10 with by-paper notes; 13 breadth/extension).
- LaTeX downloaded and deep-read: 7 (2506.13131, 2006.08381, 2406.08414, 2401.02051,
  2402.01145, 2605.20086, 2511.08522).
- PDF-only: 0.
- Abstract/web-only (incl. the 3 Nature-only seeds): 16.

## Notes / honesty

- AlphaTensor, AlphaDev, FunSearch facts are from Nature abstracts + open-access mirrors +
  Wikipedia, NOT from LaTeX (no arXiv source exists). Numeric claims are as-stated by those
  sources; marked as such in the by-paper notes.
- The skeptic paper 2605.20086 is anonymized in the arXiv LaTeX (NeurIPS 2026 submission
  template); dataset/code are public under ZIB-IOL. Author names not asserted.
- Did not deep-read the AlphaEvolve descendants (CodeEvolve, SATLUTION, DeepEvolve, MLEvolve,
  2602.16928, 2511.02864); abstract-level only, logged for breadth.
