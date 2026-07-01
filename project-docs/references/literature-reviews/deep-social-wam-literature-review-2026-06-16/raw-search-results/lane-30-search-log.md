# Lane 30 search log: calibration and predictor evaluation

Wave 6, lane 30. Date: 2026-06-16/17 (Asia/Seoul). Discovery channel: Hugging Face CLI (hf 1.16.1),
`hf papers info` for verification and `hf papers search` for discovery. LaTeX fetched via
scripts/fetch_arxiv_latex.sh. No provider/API calls, no runtime edits.

## Step 1: verify the six candidate seed ids (all PASSED)

Command pattern: `hf papers info <id>`.

| seed id | result | verified title |
|---|---|---|
| 1706.04599 | PASS | On Calibration of Modern Neural Networks (Guo, Pleiss, Sun, Weinberger; Cornell) |
| 2107.07511 | PASS | A Gentle Introduction to Conformal Prediction and Distribution-Free UQ (Angelopoulos, Bates) |
| 2108.13264 | PASS | Deep RL at the Edge of the Statistical Precipice (rliable; Agarwal et al.) |
| 1709.06560 | PASS | Deep Reinforcement Learning that Matters (Henderson et al.) |
| 2304.15004 | PASS | Are Emergent Abilities of Large Language Models a Mirage? (Schaeffer, Miranda, Koyejo) |
| 2306.05685 | PASS | Judging LLM-as-a-judge with MT-Bench and Chatbot Arena (Zheng et al.) |

All six ids verified correct against the team-lead's brief; none needed correcting or dropping.

## Step 2: extend-don't-duplicate check

Listed notes/by-theme/ and notes/by-paper/. Findings:
- 2306.05685 ALREADY has a by-paper note (notes/by-paper/2306.05685-judging-llm-as-judge.md). Decision:
  CITE it for the eval-reliability angle only; do NOT duplicate. Logged in manifest pointing at the
  existing note path.
- 2509.00559 (S3AP) ALREADY has a by-paper note. Decision: EXTEND it with a lane-30 section on scoring
  the predictor of deltas separately from action success (per the brief), rather than create a new
  file.
- General benchmark validity and LLM-judge unreliability are owned by
  notes/by-theme/benchmark-validity-and-evaluation.md (lane 3) and
  notes/by-theme/wam-training-evaluation-and-open-problems.md (lane 10). Decision: do NOT re-cover;
  the new theme file points at both and adds only the calibration/conformal/selective/few-seed angle.

## Step 3: HF discovery searches (for additional sources)

Queries run via `hf papers search` (output saved to a tool-results dump, ~82KB):
1. "selective prediction abstention deep learning"
2. "calibration large language models"
3. "expected calibration error pitfalls"

What HF returned (signal): a large field of calibration and selective-prediction papers. Relevant hits
surfaced: 2107.11277 (Reject Option survey), 2311.08298 (LLM confidence/calibration survey),
2407.01032 (selective-classification evaluation flaws), 2402.16300 (conformalized selective
regression), 1909.10155 (verified uncertainty calibration), 2309.12236 (smooth ECE), 2401.13835
(calibration gap model-vs-human confidence in LLMs), 2606.03437 (LLMs overconfident in their own
responses).

Dead ends / noise filtered out: the "selective" query returned a large cluster of MACHINE UNLEARNING
and "selective attention/pruning/kernel" papers (2403.01267, 2308.07707, 2410.02703, 1903.06586,
2510.07822, 2506.00876, 2501.09705, 2512.18035, etc.) that share the word "selective" but are
unrelated to selective PREDICTION / abstention. Dropped all of these.

## Step 4: verify the additional candidate ids (all PASSED)

`hf papers info` on the three chosen additions:

| id | result | title | how used |
|---|---|---|---|
| 2107.11277 | PASS | Machine Learning with a Reject Option: A survey (Hendrickx et al., KU Leuven) | deep-read cornerstone (abstention) |
| 2311.08298 | PASS | A Survey of Confidence Estimation and Calibration in LLMs (Geng et al.) | breadth (abstract-level) |
| 2407.01032 | PASS | Overcoming Common Flaws in Evaluation of Selective Classification Systems (Traub et al.) | breadth (abstract-level, claim-only) |

## Step 5: LaTeX fetch + deep read

`scripts/fetch_arxiv_latex.sh` succeeded for all attempted ids:
- 1706.04599 (18 tex files) -> read main.tex, tex/introduction.tex, tex/definitions.tex (ECE, MCE,
  NLL, reliability diagram, perfect calibration).
- 2107.07511 (2 tex files, large single main.tex 163KB) -> read core conformal (coverage theorem,
  recipe, score-function caveat), Selective Classification (Learn-then-Test), Conformal under
  Distribution Drift (weighted conformal, 2*sum(w_i*eps_i) bound).
- 2108.13264 (12 tex files) -> read intro.tex (recommendations table), formalism.tex (CIs, IQM,
  point-estimate-as-random-variable).
- 1709.06560 (2 tex files) -> read main.tex in full (random-seed t=-9.09 p=0.0016 result, power
  analysis, Swimmer local-optimum, codebase variance).
- 2304.15004 (8 tex files) -> read 00_main.tex (abstract) and 02_analytical_model.tex (metric-choice
  mechanism; Brier score removes apparent emergence).
- 2107.11277 (11 tex files) -> fetched; read at taxonomy/section level plus abstract (ambiguity vs
  novelty rejection; predictive + rejective quality).

2311.08298 and 2407.01032 were NOT LaTeX-fetched; read at abstract level via `hf papers info` and
logged as source_availability=abstract.

## Step 6: deliverables written

- 6 new by-paper notes (1706.04599, 2107.07511, 2108.13264, 1709.06560, 2304.15004, 2107.11277).
- 1 combined breadth note (2311.08298 + 2407.01032).
- Extended the existing S3AP note (2509.00559) with a lane-30 section.
- Cited the existing 2306.05685 note (no duplication).
- Theme file: notes/by-theme/research-area-calibration-and-predictor-evaluation.md.
- Lane brief: notes/subagent-briefs/lane-30-calibration-and-predictor-evaluation.md.
- Manifest: raw-search-results/lane-30-manifest.jsonl (10 JSON lines, validated well-formed).
- This search log.

## ids verified vs rejected (summary)

- Verified and used: 1706.04599, 2107.07511, 2108.13264, 1709.06560, 2304.15004, 2306.05685 (cited),
  2509.00559 (extended), 2107.11277, 2311.08298, 2407.01032. Total 10 verified.
- Rejected as off-topic (word-collision on "selective"): the machine-unlearning / selective-attention
  cluster listed in Step 3. None logged in the manifest.
- No id was fabricated. No id returned not-found. The one claim-only status (2407.01032) reflects
  abstract-level reading, not a verification failure.

## ASCII check

All lane-30 deliverables checked with `grep -nE '[---]'` and a non-ASCII byte scan; zero forbidden
characters (long dash, middle dot, bullet) and zero non-ASCII bytes in lane-30-authored content. The
3 non-ASCII lines in the S3AP note predate this lane (other-lane content) and were not altered.
