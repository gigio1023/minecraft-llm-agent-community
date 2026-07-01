# Self-improvement across domains (wave-5 capstone)

What this is: the synthesis of 6 parallel lanes (lanes 24-29) that mapped the general concept of
machine self-improvement ("자가발전" / autoresearch) across ALL domains, not just robotics, anchored on
the now-PDF-verified ENPIRE note. It extends the wave-4 autoresearch capstone
(`reports/autoresearch-for-wam.md`). ASCII punctuation only; numeric claims are as-stated by their
sources, with environment-verified results distinguished from self-reported ones.

## TL;DR verdict

- The wave-4 thesis is now CONVERGENTLY CONFIRMED across every self-improvement domain, not just
  robotics. Coding-agent autoresearch, algorithm discovery, AutoML, meta-learning theory, automated
  agent design, and the limits literature all reduce to one law: a self-improvement loop improves iff
  it is grounded by a cheap, accurate, EXTERNAL signal on FRESH data; otherwise it collapses, only
  sharpens, or overfits.
- "Autoresearch" is Andrej Karpathy's term for the DIGITAL version (a coding agent automating ML
  research); ENPIRE is its physical extension. The outer loop is method-agnostic (LLM-agent search);
  RL is one inner regime the agent may select, not the framing.
- Wave 5 adds two sharper bounds beyond wave 4: (1) even when it works, self-improvement only
  SHARPENS capability already latent in the base model (data-processing inequality); it does not add
  new social intelligence. (2) The repo's near-$0 runtime verifier is doubly special: it is the cheap
  exact evaluator the discovery and AutoML fields always lacked, AND the fresh external signal that
  prevents model collapse.
- Unchanged: clean loop at Physical/Material, advisory at Social, not a closed loop at Institutional.
  New modesty: expect calibration gains, not emergent social smarts; recursive-self-improvement to
  superintelligence is rhetoric the evidence does not support.

## The reframing (from the PDF-verified anchor)

- The term "autoresearch" is Karpathy's (`github.com/karpathy/autoresearch`: AI agents running
  research on single-GPU nanochat training automatically). The concept is fundamentally digital;
  ENPIRE extends it to the physical world. See `notes/by-paper/enpire.md` (now PDF-verified).
- "Is it RL?" Across the field the outer self-improvement loop is an LLM-agent search over recipes,
  code, prompts, or architectures. RL is one inner regime (ENPIRE's coding agent chooses among
  heuristic learning, behavior cloning, offline/online RL, code-as-policy, hybrid). The repo analog is
  an LLM coding-agent search over prompts, gated skills, or the advisory-WAM predictor, scored by the
  verifier, optionally invoking RL inside.

## The convergent law (six domains, one mechanism)

| Lane | Domain | Strongest datapoint (source) | What it establishes |
|---|---|---|---|
| 24 | Coding-agent autoresearch (digital) | external scorer is necessary but NOT sufficient: an execution verifier still passed 7.8% wrong patches and inflated resolution by 6.4 points (2503.15223); AgentRxiv's self-graded reward was hacked (erased code, fake SOTA, hallucinated numbers, 2503.18102); SlopCodeBench: self-iteration eroded code in 77% of trajectories (2603.24755) | gains are trustworthy only against an external scorer the agent cannot alter, and even then inflate via weak verifier, contamination, and unchecked iteration |
| 25 | Algorithm and program discovery | every success rests on a cheap exact evaluator (FunSearch, AlphaDev, AlphaTensor); discovered artifacts overfit a weak evaluator (DiscoPOP produced NaN off-range losses) and over-report unless held-out-judged | discovery search is powerful exactly where a correctness oracle is cheap and exact; there is no social oracle |
| 26 | AutoML, NAS, learned optimizers | real but EXPENSIVE and search-space-sensitive: NAS cost fell ~1000x (22,400 GPU-hours to 0.5 GPU-day) only after years; AutoML-Zero good algorithms are 1-in-10^12 sparse; VeLO is trained-distribution-bound (breaks past 500M params) | automated self-improvement of a learning system is real but gated by the cost of evaluating candidates; the repo's near-$0 verifier is that missing cheap evaluator |
| 27 | Meta-learning and recursive self-improvement | the only proof of optimality (the Goedel machine, cs/0309048) is practically unrealized; every runnable system (meta-learning, SRWM, Goedel Agent, STOP, DGM) has no guarantee and demonstrates only one or two levels; Schaul (2411.16905): "what can self-correct is behaviour given feedback, but not feedback itself" | the guarantee and the demonstrations are disjoint; nothing shows unbounded recursion; the feedback signal must be external and stay aligned |
| 28 | Automated agent and prompt design | auto-search beats and transfers beyond hand-design (ADAS, OPRO +50% BBH, AFlow), BUT optimization is only as honest as the score: OPRO train accuracy 5-20% above test; PromptBreeder wins with the near-meaningless prompt "SOLUTION"; a plausible prompt merge scored 49.4 vs 71.8 | human plausibility and LLM-judge-of-quality are the WRONG selection criteria; only a held-out verifier score is legitimate |
| 29 | Limits of self-improvement | collapse is the DEFAULT for un-grounded loops, proven three ways (distributional model collapse 2305.17493 / 2307.01850; signal reward-hacking 2505.21444; safety mutual-information loss by DPI 2602.09877); escapable by accumulate-don't-replace (2404.01413) plus external verifier + reset | un-grounded self-training collapses; the two escape routes are exactly the repo's design (fresh verifier-labeled data + verifier + reset) |

## Two bounds wave-5 adds beyond wave-4

1. The SHARPENING bound. By the data-processing inequality, a loop with no external information cannot
   create capability the base model lacks; it amortizes latent knowledge and then plateaus (Sharpening
   2412.01951; tail narrowing 2411.00750; B-STaR exploration decay 2412.17256; Schaul's coverage
   condition). So a verifier-grounded loop makes the advisory WAM better-CALIBRATED where the verifier
   checks it, not socially smarter. State the repo claim as calibration, not emergent intelligence.
2. The repo verifier is doubly special. The discovery and AutoML fields' central problem is the COST of
   evaluating a candidate (NAS GPU-hours, AutoML-Zero sparsity). The self-improvement limits field's
   central failure is COLLAPSE from training on un-verified own output. The repo's runtime verifier
   solves both at once: it is a near-$0 exact evaluator AND a source of fresh, externally-grounded
   labels. One asset addresses both halves of the field's failure mode.

## The repo verifier as the field's missing piece

Across all six domains the binding constraint is the same object: a cheap, accurate, external,
hard-to-game signal on fresh data. Algorithm discovery has it (code correctness) and succeeds; AutoML
pays dearly for it (compute) and is bounded by that cost; self-graded coding agents and self-rewarding
LMs lack it and get hacked or collapse; prompt/agent search overfits the moment the score is an LLM
judge instead of a held-out verifier. The repo already emits exactly this signal: the runtime verifier
auto-labels `(state, action, next-state)` transitions at near-$0. That is why the autoresearch thesis
is admissible HERE specifically, where it fails elsewhere.

## 4-layer admissibility (unchanged, with the sharpening modifier)

| Layer | Loop admissible? | Wave-5 modifier |
|---|---|---|
| Physical | Yes, now | the verifier is the cheap exact evaluator the field lacks; expect calibration gains |
| Material | Yes, with care | same; possession/flow deltas are checkable; sharpening within coverage |
| Social | Advisory only | no external oracle; self-collected social feedback is inadmissible (collapses); stays advisory |
| Institutional | Not a closed loop | contested success, costly reset; the feedback condition fails; human-in-the-loop |

## The 6 area surveys (read for depth)

- `notes/by-theme/research-area-coding-agent-autoresearch.md` (lane 24)
- `notes/by-theme/research-area-automated-algorithm-and-program-discovery.md` (lane 25)
- `notes/by-theme/research-area-automl-nas-and-learned-optimizers.md` (lane 26)
- `notes/by-theme/research-area-meta-learning-and-recursive-self-improvement.md` (lane 27)
- `notes/by-theme/research-area-automated-agent-and-prompt-design.md` (lane 28)
- `notes/by-theme/research-area-self-improvement-limits-and-survey.md` (lane 29)

Companion matrix: `matrices/self-improvement-by-domain.md`. Anchor: `notes/by-paper/enpire.md`.
Wave-4 capstone: `reports/autoresearch-for-wam.md`.

## The honest non-citable surface (the contribution)

- No surveyed system does verifier-grounded self-improvement on STRUCTURED SOCIAL/material state; every
  result is on code, math, ML pipelines, QA, web, or games with crisp evaluators. The transport to a
  Minecraft social-material verifier is the repo's surface, not a citable result.
- The most directly transferable area is automated agent and prompt design (lane 28): the repo actor IS
  an LLM tool-use agent, so DSPy-style "metric + cross-validation" with the runtime verifier as the
  metric is the concrete near-term loop, at the Physical/Material layers only.
- Support, not contribution: verifiers, transcripts, manifests, and search loops are infrastructure. Do
  not reframe the repo as "ENPIRE / AI Scientist / AutoML / a Goedel machine for Minecraft."
- Wave-5 added 6 area surveys, ~48 by-paper notes, and 91 unique sources to the review.
