# Lane 14 search log (affordances + causal/counterfactual world models)

All runs 2026-06-16. Tool order per contract: Hugging Face CLI (`hf papers`) first, then web (WebSearch/WebFetch) for ID verification and pre-2023 foundational works that the HF papers index under-surfaces.

## Seed-ID verification (contract requires verifying before fetching)

- `2206.13452` Causal Dynamics Learning for Task-Independent State Abstraction (seed, marked "verify"):
  - `hf papers info 2206.13452` -> ERROR "Paper not found on the Hub." (HF Hub papers index does not contain it.)
  - WebSearch confirmed the id IS correct on arXiv: https://arxiv.org/abs/2206.13452 , ICML 2022 (PMLR v162 wang22ae), Wang/Xiao/Xu/Zhu/Stone. CONCLUSION: id valid; HF Hub index just lacks it. Fetched via `fetch_arxiv_latex.sh` (arXiv e-print, not HF). LaTeX extracted OK.
- CoDA counterfactual data augmentation (seed guessed "1910.xxxx", marked "verify"):
  - WebSearch "Pitis Creager Garg Counterfactual Data Augmentation locally factored dynamics NeurIPS 2020" -> correct id is `2007.02863` (NeurIPS 2020). The seed guess 1910.xxxx was WRONG. Corrected to 2007.02863. Code at github.com/spitis/mrl.
- Causal-RL survey (seed guessed "2302.xxxx", marked "verify"):
  - WebSearch returned TWO surveys: Deng et al. `2307.01452` "Causal Reinforcement Learning: A Survey" (TMLR) and Zeng et al. `2302.05209` "A Survey on Causal Reinforcement Learning". The seed "2302.xxxx" = Zeng's. Both valid. Deep-fetched Deng `2307.01452` (LaTeX) as the primary; logged Zeng `2302.05209` as abstract-level. Also found a 2025 `2512.18135` "Unifying Causal Reinforcement Learning" (logged abstract-level).
- GrASP affordance selection (seed "Learning to Act from Affordances", marked "verify pick 1-2"):
  - `hf papers search "affordances reinforcement learning exploration planning"` surfaced `2202.04772` GrASP (Veeriah/Zheng/Lewis/Singh, ICML 2022). Picked as the affordance-for-PLANNING cornerstone. Verified id via the search result + paper text.
- Khetarpal affordances theory (genealogy anchor for GrASP):
  - WebSearch confirmed `2006.15085` "What can I do here? A Theory of Affordances in RL" (ICML 2020, Khetarpal/Ahmed/Comanici/Abel/Precup). Logged abstract-level (genealogy + "affordances enable simpler/partial transition models").
- MoCoDA (CoDA follow-up):
  - WebSearch confirmed `2210.11287` "MoCoDA: Model-based Counterfactual Data Augmentation" (NeurIPS 2022, Pitis/Creager/Mandlekar/Garg). Logged abstract-level.

## hf papers searches run

- `hf papers search "causal dynamics learning task-independent state abstraction" --limit 10`
  - did NOT surface 2206.13452 (HF index gap), but surfaced strong adjacent: `2206.01474` Offline RL with Causal Structured World Models (FOCUS), `2502.10097` Causal Information Prioritization (uses counterfactual augmentation), `2306.02747` COREP, `2206.01474`. Deep-fetched FOCUS (causal STRUCTURED WORLD MODEL, on-target).
- `hf papers search "counterfactual data augmentation model-free reinforcement learning" --limit 10`
  - surfaced `2206.04890` Adversarial Counterfactual Environment Model Learning (GALILEO), `2310.17786`/`2310.18247` DA-for-RL analyses. Logged GALILEO abstract-level (counterfactual action-effect / environment model).
- `hf papers search "affordance learning robotic manipulation" --limit 8`
  - surfaced `2408.10123` Learning Precise Affordances from Egocentric Videos, `2304.08488` Affordances from Human Videos (VRB), `2601.07060` PALM progress-aware affordance for long-horizon, GLOVER++/RoboAfford++. Logged the most representative abstract-level (vision/robotics affordance-learning thread).
- `hf papers search "affordances reinforcement learning exploration planning" --limit 8`
  - surfaced `2202.04772` GrASP (cornerstone), `2006.15085`-adjacent, `2009.10968` Hierarchical Affordance Discovery via Intrinsic Motivation, `2407.10341` Affordance-Guided RL via Visual Prompting, `2509.16615` LLM-Guided Task/Affordance-Level Exploration. Logged the RL/exploration thread.

## web searches run (verification + recent counterfactual-WM)

- WebSearch: Pitis CoDA NeurIPS 2020 -> 2007.02863 (corrected seed).
- WebSearch: Causal Dynamics Learning Wang ICML 2022 -> 2206.13452 valid.
- WebSearch: causal RL survey 2023 -> 2307.01452 (Deng), 2302.05209 (Zeng), 2512.18135 (2025 unifying).
- WebSearch: Khetarpal "What can I do here" -> 2006.15085.
- WebSearch: MoCoDA -> 2210.11287.
- WebSearch: counterfactual world model embodied 2024-2025 -> found `2509.10401` "Abduct, Act, Predict (A2P)" (abduction-action-prediction counterfactual loop), `2510.16732` survey of world models for embodied AI (counterfactual rollouts framed), GAIA-2 driving-counterfactual example. Logged A2P + the embodied-WM survey abstract-level.

## LaTeX fetched (cornerstones, deep-read)

- `bash scripts/fetch_arxiv_latex.sh 2007.02863 coda-counterfactual-data-aug` -> tarball_extracted (CoDA).
- `bash scripts/fetch_arxiv_latex.sh 2206.13452 causal-dynamics-learning` -> tarball_extracted (CDL).
- `bash scripts/fetch_arxiv_latex.sh 2202.04772 grasp-affordance-selection-planning` -> tarball_extracted (GrASP).
- `bash scripts/fetch_arxiv_latex.sh 2307.01452 causal-rl-survey-deng` -> tarball_extracted (causal-RL survey, skim-read for taxonomy).
- `bash scripts/fetch_arxiv_latex.sh 2206.01474 focus-causal-structured-world-models` -> tarball_extracted (FOCUS, skim-read for claims).

## Notes on coverage / non-duplication

- Confirmed via grep over `notes/by-paper/*.md` and `source-manifest.jsonl` that no prior wave surveyed affordances or causal/counterfactual world models as a FIELD. Prior mentions are incidental (CausalMACE 2508.18797 in the multi-agent theme; the WAM survey's Counterfactual-Consistency metric in `wam-training-evaluation-and-open-problems.md`). My lane extends, does not duplicate; I cite the eval theme file for the metric rather than re-deriving it.
- Did not deep-read GAIA-1 (already in corpus, 2309.17080) or Genie (2402.15391); cited from existing notes where the affordance/causal angle touches them.
