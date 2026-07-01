# Lane 32 search log (the LLM as a world model, and reasoning-as-planning)

Wave 6, lane 32 (J2). All dates 2026-06-17. Discovery: Hugging Face CLI first (hf papers info / search).
Punctuation ASCII only.

## Seed verification (hf papers info), all 7 seeds CONFIRMED

- `hf papers info 2305.14992` -> RAP "Reasoning with Language Model is Planning with World Model", Hao et al., EMNLP 2023. CONFIRMED. code github.com/Ber666/RAP.
- `hf papers info 2305.10626` -> "Language Models Meet World Models: Embodied Experiences Enhance Language Models", Xiang et al., NeurIPS 2023. CONFIRMED. (kept breadth: embodied-finetuning, VirtualHome, off-target for inference-time use.)
- `hf papers info 2305.10601` -> "Tree of Thoughts: Deliberate Problem Solving with Large Language Models", Yao et al., NeurIPS 2023. CONFIRMED.
- `hf papers info 2310.04406` -> LATS "Language Agent Tree Search Unifies Reasoning Acting and Planning", Zhou et al., ICML 2024. CONFIRMED.
- `hf papers info 2302.01560` -> DEPS "Describe, Explain, Plan and Select", Wang et al., NeurIPS 2023, Minecraft. CONFIRMED.
- `hf papers info 2411.06559` -> WebDreamer "Is Your LLM Secretly a World Model of the Internet?", Gu et al., COLM 2025. CONFIRMED. code github.com/osu-nlp-group/webdreamer; models osunlp/Dreamer-7B.
- `hf papers info 2303.11366` -> Reflexion, Shinn et al., NeurIPS 2023. CONFIRMED (kept for the world-model-of-self angle only).

## Discovery searches (hf papers search) and what they returned

- `hf papers search "LLM as world model for planning"` -> surfaced LLM-MCTS 2305.14078 (TOP hit, with the MDL principle, NEW cornerstone), plus Deliberate Reasoning 2410.03136, AdaPlanBench 2606.05622, AriGraph 2407.04363, SimuRA 2507.23773, LAW 2312.05230 (NEW conceptual anchor), and neighbor-owned R-WoM 2510.11892, WMA 2410.13232.
- `hf papers search "reasoning as planning with internal world model"` and `"language model simulate action outcomes look-ahead agent"` -> reinforced RAP/WebDreamer/LATS; surfaced Agent Planning with World Knowledge Model 2405.14205, Why Reasoning Fails to Plan 2601.22311 (NEW limits), ProAct 2602.05327, PreAct 2402.11534, Reason-for-Future-Act-for-Now 2309.17382, LLM+P 2304.11477 (contrast: offloads dynamics to a PDDL planner), Compositional Foundation Models 2309.08587, PlanGenLLMs survey 2502.11221, PlanBench 2206.10498.
- `hf papers search "LLM calibration confidence world model prediction wrong"` -> returned the LLM-confidence-calibration cluster (ECE foundation 1706.04599, confidence elicitation 2306.13063, calibration survey 2311.08298, etc.). DECISION: these overlap lane 30 (evaluation and calibration); cited only lightly in the theme's limits part, NOT pulled as lane-32 cornerstones, to avoid duplicating lane 30.
- `hf papers search "Minecraft LLM planning agent open-world"` -> DEPS 2302.01560, DECKARD 2301.12050 (NEW breadth, language-guided world modelling in Minecraft), WALL-E 2.0 2504.15785, "Do Embodied Agents Dream of Pixelated Sheep" (= DECKARD), Voyager 2305.16291 (already owned by Minecraft-agent neighbors), Ghost in the Minecraft 2305.17144, Plancraft 2412.21033, Optimus-2/3. Voyager/Optimus deferred to Minecraft neighbor files.
- `hf papers search "LLM predict next state hallucination dynamics evaluation benchmark"` -> mostly generic hallucination benchmarks (off-target); used only to source WebDreamer's named hallucination failure from its own body.
- `hf papers search "Monte Carlo tree search language model value evaluation reasoning"` -> ToT 2305.10601, LATS 2310.04406, Mastering Board Games (DeepMind) 2412.12119 (NEW breadth, internal-vs-external planning with an LLM), plus the math-MCTS cluster (AlphaMath 2405.03553, rStar-style 2406.07394, AlphaZero-like decoding 2309.17179) which is reward-model-heavy and deferred to lane 31.
- `hf papers search "world model LLM rule learning alignment correction agent"` -> WALL-E 2410.07484 (TOP, NEW cornerstone), WALL-E 2.0 2504.15785, RWML 2602.05842 (already owned by neighbor), R-WoM 2510.11892 (neighbor).

## LaTeX fetch (deep-read cornerstones)

Used the shared `scripts/fetch_arxiv_latex.sh` (sleeps 3s per call, polite to arXiv). All fetches returned
gzip tarballs and extracted cleanly:
- 2305.14992 RAP (7 tex), 2411.06559 WebDreamer (16 tex), 2305.10601 ToT (1 tex), 2310.04406 LATS (13 tex),
  2302.01560 DEPS (34 tex), 2305.14078 LLM-MCTS (8 tex), 2312.05230 LAW (1 tex), 2301.12050 DECKARD (1 tex).
- 2410.07484 WALL-E and 2303.11366 Reflexion were ALREADY present in papers/latex/ from earlier waves; reused.

Deep-read (mechanism + numbers transcribed from LaTeX): RAP, ToT, LATS, WebDreamer, LLM-MCTS, DEPS, WALL-E,
Reflexion, LAW (9 from-LaTeX) plus FLARE (abstract-only). 

Duplicate reconciliation: WALL-E (2410.07484) and Reflexion (2303.11366) already had by-paper notes from
earlier lanes (WALL-E from lane 13; Reflexion from lanes 17/22/34). Per the extend-do-not-duplicate rule, the
two lane-32 notes I drafted for them were DELETED and the lane-32 manifest rows point at the pre-existing
notes (2410.07484-walle-world-alignment-rule-learning.md, 2303.11366-reflexion.md). NEW lane-32 by-paper
notes: RAP, ToT, LATS, WebDreamer, LLM-MCTS, DEPS, LAW (7 new), plus FLARE (8th new note, abstract-only). The
WALL-E and Reflexion mechanisms are still deep-read and carried in this lane's theme file by id.

## Abstract-only / claim-only

- 2601.22311 FLARE "Why Reasoning Fails to Plan": id and abstract verified via hf papers info; body NOT
  deep-read. Mechanism (step-wise greedy myopia in deterministic structured environments) is the citable
  contribution; the LLaMA-8B-beats-GPT-4o numbers are marked claim-only.

## Decisions and dead ends

- Did NOT re-derive neighbor-owned LLM-world-model-that-self-improves sources: WebEvolver 2504.21024,
  WorldLLM 2506.06725, WMA 2410.13232, R-WoM 2510.11892, RWML 2602.05842, From Word to World 2512.18832.
  Cited by id in the theme file, not re-noted.
- Did NOT pull the LLM-confidence-calibration cluster as cornerstones (lane 30 owns evaluation/calibration);
  referenced only as the detector half of the limits discussion.
- Did NOT pull the math-MCTS reward-model cluster (AlphaMath, process reward trees) as cornerstones (lane 31
  owns reward models/verifiers); the relevant structural point (search over an LLM with an external value
  signal) is carried by LATS and WebDreamer.
- Voyager, Optimus-2/3, Ghost-in-the-Minecraft, Plancraft: Minecraft-agent benchmark/skill sources owned by
  `minecraft-agent-benchmarks.md` and `minecraft-multi-agent-social.md`; not re-surveyed here.
- LLM+P 2304.11477 kept as a one-line CONTRAST in the manifest (it argues the LLM should NOT be the dynamics
  model and should offload to a PDDL planner), useful as the boundary of the lane's thesis.

## Ids verified vs rejected

- Verified via hf papers info: 2305.14992, 2305.10626, 2305.10601, 2310.04406, 2302.01560, 2411.06559,
  2303.11366, 2305.14078, 2410.07484, 2312.05230, 2601.22311, 2410.03136, 2405.14205, 2412.12119, 2301.12050,
  2504.15785.
- Verified-by-search-result-title only (kept as breadth, no deep claims): 2304.11477, 2502.13092, 2206.10498.
- Rejected / not pulled: none fabricated. No id was logged without an hf or search-result confirmation.
