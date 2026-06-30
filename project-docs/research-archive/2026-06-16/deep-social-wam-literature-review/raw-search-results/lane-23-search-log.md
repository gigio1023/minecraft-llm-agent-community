# Lane 23 search log (autonomous experimentation and world-model discovery)

Lane: 23 (H6). Date of all work: 2026-06-17. Discovery order per contract: Hugging Face CLI (`hf`)
first, then web (WebSearch / WebFetch). LaTeX fetched via `scripts/fetch_arxiv_latex.sh`.

## Seed id verification (contract requires verify-before-fetch)

- `2504.21024` WebEvolver: VERIFIED via `hf papers search` (exact title match, top hit). Cornerstone.
- `1705.05363` ICM: VERIFIED via `hf papers search` and `hf papers info` (Pathak et al.).
- `1810.12894` RND: VERIFIED via `hf papers info` (Burda et al., "Exploration by Random Network Distillation").
- `2005.05960` Plan2Explore: SEED CORRECTION-NOTE. `hf papers info 2005.05960` returns
  "Paper not found on the Hub" (HF index gap), but the arXiv id is CORRECT, confirmed via WebSearch
  (arxiv.org/abs/2005.05960v2, "Planning to Explore via Self-Supervised World Models", Sekar et al.,
  ICML 2020). The fetch script pulls directly from arXiv e-print, so the HF gap did not block it.
- WorldLLM: the lane brief named no id. Found correct id `2506.06725` via WebSearch
  ("WorldLLM: Improving LLMs' world modeling using curiosity-driven theory-making", Levy/Colas/
  Oudeyer/Carta/Romac; Inria Flowers, MIT, Hugging Face). Deep-read cornerstone.

## hf papers search queries run (2026-06-17)

1. `hf papers search "web agent self-improvement coevolving world model" --limit 12`
   rationale: locate WebEvolver and adjacent self-improving-agent + world-model work.
   key hits: 2504.21024 (WebEvolver, cornerstone), 2410.13232 (WMA web agent, 44 upvotes),
   2504.07079 (SkillWeaver), 2604.18131 (reward-free self-evolution via world-knowledge exploration),
   2508.07407 (self-evolving-agents survey).
2. `hf papers search "intrinsic motivation curiosity driven exploration" --limit 12`
   rationale: curiosity/intrinsic-motivation cornerstones + social/Minecraft-adjacent variants.
   key hits: 1705.05363 (ICM), 2305.13396 (developmental curiosity + social interaction + world model),
   2503.23631 (intrinsically-motivated humans/agents in Crafter; Entropy/InfoGain/Empowerment),
   2211.10515 (Curiosity in Hindsight: noisy-TV via structural causal models),
   2104.07495 (latent Bayesian surprise).
3. `hf papers search "Plan2Explore self-supervised exploration world model expected information gain" --limit 8`
   rationale: locate Plan2Explore + model-learning exploration. hits: WebEvolver, ICM,
   2510.19788 (Benchmarking World-Model Learning / WorldTest / AutumnBench), 2510.19818 (Semantic World Models),
   2605.12084 (adaptive information-theoretic objectives for robot exploration).
4. `hf papers search "WorldLLM language model world model curiosity experiment" --limit 8`
   rationale: locate WorldLLM (did not surface here; found later by web). hits: 2502.13092 (Text2World),
   2410.13232 (WMA), 2510.11892 (R-WoM retrieval-augmented WM), 2512.18832 (From Word to World: LLMs as
   implicit text WMs), 2602.05842 (RWML, cornerstone), 2606.09032 (Text World Models survey).
5. `hf papers search "active causal discovery intervention learning dynamics" --limit 10`
   rationale: ACTIVE/EXPERIMENTAL causal-discovery angle (the gap wave-3 affordances/causal theme left open).
   key hits: 2109.02429 (Active Interventions neural causal, cornerstone), 2203.02336 (latent interventions),
   2605.26029 (CausaLab, LLM interactive causal-discovery, cornerstone), 2302.10607 (Bayesian causal
   experimental design), 2305.19588 (active causal structure learning with advice).
6. `hf papers search "empowerment intrinsic motivation control influence agents" --limit 6`
   rationale: empowerment + SOCIAL intrinsic motivation (for the anti-social-probing bound).
   hits: 2503.23631, 2410.11155 (latent-predictive empowerment), 2203.03355 (transfer empowerment:
   social intrinsic motivation to react to a partner), 1611.07507 (Variational Intrinsic Control),
   2006.14796 (AvE: Assistance via Empowerment, pro-social empowerment).
7. `hf papers search "Minecraft open-ended skill discovery exploration intrinsic" --limit 8`
   rationale: Minecraft/Crafter-specific exploration (defer to wave-1/2 Minecraft themes; cite, do not re-survey).
   hits: 2503.10684, 2303.16563 (Plan4MC), 2605.30931 (MineExplorer, note already exists), 2305.16291 (Voyager).
8. `hf papers search "model-based reinforcement learning learned world model online adaptation" --limit 6`
   rationale: model-based-RL self-improving-WM long tail. hits: 2601.22149 (DynaWeb, model-based RL of web
   agents), 2401.13034 (online world-model learning), 2605.00080 (robot world-model survey).
9. `hf datasets list --search "world model learning" --limit 8` -> No results (lane is methods-heavy; expected).

## hf papers info calls
- `hf papers info 2005.05960` -> not found on Hub (see correction above).
- `hf papers info 1810.12894` -> verified RND.

## WebSearch queries (2026-06-17)
- "Plan2Explore Planning to Explore via Self-Supervised World Models arXiv Sekar Dreamer 2020"
  -> confirmed 2005.05960, ICML 2020, code at github.com/ramanans1/plan2explore.
- "WorldLLM improving world model LLM curiosity Bayesian inference natural language theories arXiv 2025"
  -> confirmed 2506.06725 (Inria HAL + arXiv html); Bayesian theory induction + curiosity-driven RL.

## LaTeX fetched (all succeeded as tarball_extracted)
fetch_arxiv_latex.sh run for: 2504.21024, 2506.06725, 1705.05363, 2005.05960, 2605.26029, 2109.02429,
2602.05842, 2510.19788, 1810.12894. All 9 returned latex=tarball_extracted (no PDF fallback needed).

## Deconfliction notes
- Dreamer line (1912.01603, 2010.02193, 2301.04104, 2509.24527) and causal-dynamics-learning (2206.13452)
  already have by-paper notes from wave-2/3. Cited, NOT re-surveyed.
- Wave-3 `research-area-affordances-and-causal-world-models` covered correlational-vs-causal models, CoDA,
  CDL passively. This lane EXTENDS it with the ACTIVE/EXPERIMENTAL (intervene-to-learn) angle it did not cover.
- H1 owns policy self-improvement loops; H5 owns the verifiable-reward signal. This lane owns WORLD-MODEL
  improvement and discovery. WebEvolver, RWML, From-Word-to-World touch self-improvement but logged here for
  the world-model-improvement angle (coordinator merge_manifest.py unions tags/lanes).
