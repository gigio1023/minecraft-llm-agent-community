# AlphaTensor and AlphaDev: RL discovery of provably-correct algorithms

Two DeepMind Nature papers covered together because they share one pattern: cast
algorithm discovery as a single-player game and train deep RL (AlphaZero-style) to
find a provably-correct, faster algorithm, with a domain checker as the oracle.

- **AlphaTensor**: Fawzi, Balog, Huang, et al., "Discovering faster matrix multiplication algorithms with reinforcement learning", Nature 610, 47-53 (2022). DOI 10.1038/s41586-022-05172-4. Code: https://github.com/google-deepmind/alphatensor. NO arXiv preprint.
- **AlphaDev**: Mankowitz, Michi, Zhernov, et al., "Faster sorting algorithms discovered using deep reinforcement learning", Nature 619 (2023), published 2023-06-07. DOI 10.1038/s41586-023-06004-9. NO arXiv preprint.
- **year**: 2022 (AlphaTensor), 2023 (AlphaDev)
- **arxiv_id**: none for either (Nature-only)
- **urls**: AlphaTensor https://www.nature.com/articles/s41586-022-05172-4 ; AlphaDev https://www.nature.com/articles/s41586-023-06004-9 ; AlphaDev open access PMC10247365
- **source availability**: abstract/web-verified (Nature, Wikipedia, PMC). Not LaTeX (no arXiv source). Numeric claims are as-stated by the papers/secondary sources.

## Primary-source facts (web-verified)

### AlphaTensor (matrix multiplication)
- Frames finding a matrix-multiplication algorithm as finding a low-rank decomposition of the matrix-multiplication tensor; rank = number of scalar multiplications. Cast as a single-player game (TensorGame); a trained agent (AlphaZero lineage) plays it.
- Result: discovered algorithms that improve on the state of the art for several tensor sizes; the headline is a rank-47 algorithm for 4x4 matrices over the 2-element field (GF(2)), beating Strassen's recursive rank-49. (AlphaEvolve later found rank-48 over characteristic-0 fields, a different, more general setting; see [[2506.13131-alphaevolve]].)
- The discovered decompositions are EXACT (provably correct) by construction: a decomposition either reconstructs the tensor or it does not, a cheap check.

### AlphaDev (sorting)
- Frames finding a sorting routine as a single-player game over ASSEMBLY instructions; AlphaDev (AlphaZero lineage) builds the program instruction-by-instruction. Reward combines correctness (passes test cases) and latency/length.
- Result: discovered "AlphaDev swap" and "AlphaDev copy" move sequences that each save one assembly instruction; for VarSort4 an algorithm 29 instructions shorter than the human benchmark. Speedups 2%-70% depending on input size. The fixed-size sort routines were upstreamed into the LLVM libc++ standard sort, the first change to that algorithm in over a decade.
- Correctness is checked by a test/verification harness; the search only keeps provably-correct programs.

## Interpretation (flagged as inference)

- These are the RL-native (pre-LLM) members of the algorithm-discovery family. They establish, before any LLM-evolution method, that search graded by an exact correctness checker can discover faster algorithms that beat decades-old human work and ship in production libraries. The LLM-evolution wave (FunSearch, AlphaEvolve) replaced the bespoke RL agent with an LLM proposer but kept the exact-evaluator core.
- They are the strongest "the evaluator can be a cheap exact oracle" data points in the lane: tensor reconstruction and sort-correctness are both fast, deterministic, and unambiguous. This is the property the Physical/Material WAM layers share and the Social layer lacks.
- They also show the narrow-vs-general tradeoff: a bespoke RL agent (AlphaTensor/AlphaDev) is narrower than an LLM coding agent (AlphaEvolve) but can drive the search harder on its single problem. For this repo, the analog is that a verifier-graded search is most reliable when the target is a single well-defined consequence (one delta), less so for open-ended social outcomes.

## Mechanically useful vs research contribution

- **Mechanically useful**: the "cast discovery as a game with a correctness-checking reward, keep only provably-correct candidates" pattern; the demonstration that a fast exact checker is enough signal to find better-than-human algorithms; the production-shipping bar (a discovered artifact is only valuable if it is verified correct, the repo's "it works = artifacts can explain what happened" rule).
- **Not a contribution to copy**: the matmul and sort results are the contributions; do not reframe the repo as "AlphaDev for Minecraft". Also note these are deep-RL methods, not the LLM-agent loop the wave-5 thesis centers on; cite them as the precedent, not the method to import.
- **Bound**: both rely on a crisp, cheap, exact correctness oracle. No analog exists for "is this a good social outcome".

## WAM layer(s) informed

Method-level precedent; Physical/Material (exact-oracle-graded discovery). Evidence that the social layer's missing piece is the exact oracle, not the search.
