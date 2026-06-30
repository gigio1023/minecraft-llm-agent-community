# Lane 31 search log: reward models, verifiers, and reward over-optimization

All dates 2026-06-17. Tools: Hugging Face CLI (`hf papers info`, `hf papers search`) as the
primary discovery and verification channel; WebFetch on arxiv.org abstract pages only to
confirm the two seeds HF does not index. LaTeX fetched with `scripts/fetch_arxiv_latex.sh`
(LaTeX-first, polite 3s sleep per call). Each entry: command, rationale, outcome.

## Seed id verification (hf papers info, all 8 lane-brief seeds)

- `hf papers info 2210.10760`
  - rationale: verify the over-optimization scaling-laws seed.
  - outcome: CONFIRMED. "Scaling Laws for Reward Model Overoptimization", Gao, Schulman,
    Hilton, 2022-10-19. Deep-read.
- `hf papers info 2305.20050`
  - outcome: CONFIRMED. "Let's Verify Step by Step". Already deep-read by lane 17
    (`notes/by-paper/2305.20050-lets-verify-step-by-step.md`); CITED, not re-noted, to avoid
    duplication.
- `hf papers info 2312.08935`
  - outcome: CONFIRMED. "Math-Shepherd". Deep-read (new angle: automatic process labels vs a
    deterministic verifier).
- `hf papers info 2209.13085`
  - outcome: CONFIRMED. "Defining and Characterizing Reward Hacking", Skalse et al., 2022.
    Deep-read.
- `hf papers info 2201.03544`
  - outcome: NOT FOUND on HF papers ("Paper '2201.03544' not found on the Hub"). Verified
    instead via WebFetch on https://arxiv.org/abs/2201.03544: "The Effects of Reward
    Misspecification: Mapping and Mitigating Misaligned Models", Pan, Bhatia, Steinhardt,
    ICLR 2022. Valid arXiv paper. LaTeX fetched and deep-read. Logged with HF-not-found caveat;
    NOT fabricated, NOT dropped (decision-relevant cornerstone).
- `hf papers info 2408.15240`
  - outcome: CONFIRMED. "Generative Verifiers (GenRM)". Already deep-read by lane 17
    (`notes/by-paper/2408.15240-generative-verifiers-genrm.md`); CITED, not re-noted.
- `hf papers info 2403.13787`
  - outcome: CONFIRMED. "RewardBench: Evaluating Reward Models for Language Modeling",
    Lambert et al., 2024. Deep-read.
- `hf papers info 1803.04585`
  - outcome: NOT FOUND on HF papers. Verified via WebFetch on
    https://arxiv.org/abs/1803.04585: "Categorizing Variants of Goodhart's Law", Manheim,
    Garrabrant, 2018-03-13. Valid arXiv paper. LaTeX fetched and deep-read. Logged with
    HF-not-found caveat; NOT fabricated.

## Discovery searches (hf papers search) for the new wave-6 angles

- `hf papers search "reward model overoptimization"`
  - rationale: find over-optimization mitigation follow-ups beyond Gao.
  - outcome: surfaced 2310.02743 "Reward Model Ensembles Help Mitigate Overoptimization"
    (logged, breadth). Confirms the Gao setup and tests ensemble conservative optimization.
- `hf papers search "specification gaming reward hacking"`
  - outcome: large dump (saved to tool-results). Confirmed the area; most strong hits already
    in neighbor lanes (Auto MC-Reward 2312.09238, Reward-Hacking-Benchmark 2605.02964 are
    lane-20's). Did not re-log those.
- `hf papers search "Goodhart law overoptimization scaling"`
  - outcome: surfaced 2310.09144 "Goodhart's Law in Reinforcement Learning" (Karwowski et al.,
    incl. Skalse). Verified via `hf papers info 2310.09144` (2023-10-13). Logged as the
    verified Goodhart-in-RL companion (breadth) alongside the HF-unindexed taxonomy 1803.04585.
- `hf papers search "reward hacking benchmark LLM agents"`
  - outcome: surfaced 2502.10325 "Process Reward Models for LLM Agents (AgentPRM)" (verified,
    logged breadth: PRM for agents, analyzes reward hacking on ALFWorld).
- `hf papers search "RewardBench 2 reward model evaluation"` and `"RewardBench 2 reward model"`
  - outcome: surfaced and verified 2506.01937 "RewardBench 2: Advancing Reward Model
    Evaluation" (logged breadth, the harder eval). Also surfaced 2409.13156 "RRM: Robust
    Reward Model Training Mitigates Reward Hacking" (verified, logged breadth: causal data
    augmentation to disentangle prompt-independent artifacts).
- `hf papers search "LLM as judge reliability bias reward"`
  - outcome: confirmed 2507.08794 "One Token to Fool LLM-as-a-Judge" as the judge-as-reward
    cornerstone (deep-read). Most other judge-bias hits (2306.05685, 2410.02736) are lane-17's;
    cited, not re-logged.
- `hf papers search "generative reward model robustness adversarial"`
  - outcome: surfaced 2503.11751 "reWordBench" (deep-read, the invariance-hardening
    cornerstone), 2504.06141 "Adversarial Training of Reward Models" (verified, logged
    breadth), 2507.06419 "Reward Models Can Improve Themselves: Reward-Guided Adversarial
    Failure Mode Discovery" (verified, logged breadth), 2506.14175 "GRAM: A Generative
    Foundation Reward Model" (verified, logged breadth).

## Additional id verifications (hf papers info, breadth candidates)

- `hf papers info 2310.09144` -> CONFIRMED (Goodhart's Law in RL).
- `hf papers info 2503.11751` -> CONFIRMED (reWordBench). Deep-read.
- `hf papers info 2507.08794` -> CONFIRMED (One Token to Fool). Deep-read.
- `hf papers info 2504.06141` -> CONFIRMED (Adversarial Training of Reward Models).
- `hf papers info 2406.06592` -> CONFIRMED (OmegaPRM / Automated Process Supervision). NOT
  logged in lane-31 manifest: it is already cited in lane-17's theme file; cited there, left
  to lane 17 to avoid duplication.
- `hf papers info 2506.01937` -> CONFIRMED (RewardBench 2).
- `hf papers info 2507.06419` -> CONFIRMED (Reward-Guided Adversarial Failure Mode Discovery).
- `hf papers info 2506.14175` -> CONFIRMED (GRAM).
- `hf papers info 2502.10325` -> CONFIRMED (AgentPRM).
- `hf papers info 2310.02743` -> CONFIRMED (Reward Model Ensembles).
- `hf papers info 2409.13156` -> CONFIRMED (RRM).

## LaTeX fetches (scripts/fetch_arxiv_latex.sh, all exit 0)

Batch 1: 2210.10760, 2209.13085, 2201.03544, 2503.11751.
Batch 2: 2312.08935, 2403.13787, 2507.08794, 1803.04585.
All eight extracted to `papers/latex/<id>/` with .tex present (verified file counts: 2210.10760
1 tex, 2209.13085 5, 2201.03544 17, 2503.11751 4, 2312.08935 2, 2403.13787 9, 2507.08794 10,
1803.04585 1).

## Dead ends and decisions

- Two seeds (1803.04585, 2201.03544) are absent from the HF papers index. Decision: verify
  existence on arxiv.org via WebFetch, fetch LaTeX, deep-read, and log with an explicit
  HF-not-found caveat in the manifest (`source_availability: latex`, venue note "not indexed
  by HF papers; verified on arxiv.org"). They are too decision-relevant (the Goodhart taxonomy
  and the phase-transition result) to drop, and the contract forbids fabricating an id, not
  citing an arxiv-verified one HF happens not to index.
- 2305.20050 (Let's Verify) and 2408.15240 (GenRM) are lane-31 seeds but were already deep-read
  by lane 17. Decision: CITE by id in the theme file, do NOT write duplicate by-paper notes
  (extend-don't-duplicate rule). Same for 2306.05685 (judge bias), 2406.06592 (OmegaPRM),
  2605.02964 (Reward Hacking Benchmark, lane 20), 2505.21444 (Can-Self-Train, lane 22).
- A few authors for fast-moving 2025/2026 breadth ids (2507.06419, 2506.14175) were not
  individually re-verified against the paper body; manifest marks the author field "unverified
  author list" rather than asserting names. Title and id are HF-verified.

## Counts

- 8 deep-read (LaTeX, by-paper note each).
- 8 breadth (verified id, manifest + theme cite only).
- 2 of the 8 deep-reads are HF-unindexed but arxiv-verified (1803.04585, 2201.03544).
- 16 manifest lines total. 0 fabricated ids. 0 forbidden punctuation characters
  (verified with grep for em-dash, en-dash, middle-dot, bullet across all lane-31 files).
