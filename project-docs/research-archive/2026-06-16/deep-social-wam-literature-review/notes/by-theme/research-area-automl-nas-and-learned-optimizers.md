# Research area: AutoML, neural architecture search, and learned optimizers

Lane 26 (I3, wave 5) theme file. Audience: a newcomer to this sub-field. Jargon is defined on
first use. ASCII punctuation only (no em-dash, middle-dot, or bullet-char).

This file surveys the classical "machine improves machine learning" lineage: automating the
design of a learning system itself, its model architecture, training pipeline, hyperparameters,
and even its optimizer and learning algorithm. This is self-improvement that long predates LLM
agents. The central question the area answers is: how far can the design of a learning system be
automated, and what does that history teach about cost, search space, and generalization?

Terms used here, defined once:
- **AutoML** (Automated Machine Learning): spending machine compute, instead of human research
  time, to design a learning system.
- **NAS** (Neural Architecture Search): the AutoML subfield that searches for the network
  architecture (which layers, how connected).
- **HPO** (Hyperparameter Optimization): searching the non-learned knobs (learning rate, batch
  size, depth) of a fixed pipeline.
- **Learned optimizer**: an optimizer (the update rule that adjusts weights) that is itself
  trained, rather than hand-designed like SGD or Adam.
- **Meta-training / meta-learning**: training across a DISTRIBUTION of tasks so the learned
  component (architecture, optimizer, loss) works on that class of tasks.
- **GPU-day / GPU-hour / TPU-month**: units of compute (one accelerator running for that
  wall-clock time). The cost currency of this whole area.

## Anchors and how this lane connects

- Original query: can a hierarchical action-conditioned world model predict and evaluate how
  Minecraft actions transform physical state, material economy, social relations, memory, and
  future action opportunities in an embodied open world?
- Wave-4 thesis under test (see `research-area-agentic-self-improvement-loops` and
  `notes/by-paper/enpire.md`, cited not rewritten): an ENPIRE-style loop, a coding agent that
  hill-climbs a target against a runtime VERIFIER as the success signal, is a near-zero-cost,
  no-human-label way to autonomously improve the repo's advisory social-material WAM, IF it stays
  advisory, stays verifier-grounded, and never lets the agent score its own success.
- This lane's role: it is the DEEPEST evidence that automated self-improvement of a learning
  system is REAL but EXPENSIVE and SEARCH-SPACE-SENSITIVE. It informs what an autoresearch loop
  TUNING the repo's advisory-WAM training recipe would look like, and it sets the honest bound:
  these methods assume a clean validation metric and large compute, neither of which the repo
  spends. Most of this lane is reference context, not a mechanical borrow.

Deconflict: lane I2 owns discrete algorithm/program discovery (see
`research-area-program-and-algorithm-discovery` when written); this lane owns ML-pipeline,
architecture, hyperparameter, and optimizer automation. Wave-4 H6 owns world-model discovery
(`research-area-autonomous-experimentation-and-world-model-discovery`); H3 owns reward-code
(`research-area-llm-reward-and-code-generation`). Cited, not redone.

## 1. The lineage: machine improves machine learning, and what it costs

The area is organized by WHICH part of the learning system gets automated, from the narrowest
(one knob) to the widest (the whole algorithm from scratch).

| Sub-area | What is automated | Cornerstone(s) | Cost / search-space lesson |
|---|---|---|---|
| HPO | Non-learned knobs of a fixed pipeline | Hyperband (1603.06560), BOHB (1807.01774) | Cheapest; bandit + early-stopping (Hyperband) and BO+bandit (BOHB) make tuning affordable. Densely-good space. |
| NAS | The architecture | NASNet (1707.07012), ENAS (1802.03268), DARTS (1806.09055), Once-for-All (1908.09791); survey (1808.05377) | Expensive at first (thousands of GPU-days), then driven down ~1000x by tricks (parameter sharing, continuous relaxation). |
| Learned optimizers | The update rule | Learning-to-learn (1606.04474), VeLO (2211.09760), muLO (2406.00153) | Real and tuning-free at scale, but trained-distribution-bound; VeLO cost ~4000 TPU-months. |
| Loss / algorithm discovery | The loss function, or the WHOLE algorithm | GLO (1905.11528), AutoML-Zero (2003.03384) | Drop human priors and you pay for it: AutoML-Zero's generic space has good solutions as rare as 1 in 10^12. |
| LLM-driven AutoML | The AutoML system, by a coding agent | AutoML-in-age-of-LLMs survey (2306.08107) | The bridge to the autoresearch concept: an LLM iteratively proposes + evaluates designs. |

### The NAS cost trajectory (the central number story)

Primary-source GPU costs, all stated in the cited papers (search cost; for DARTS this excludes
selection + from-scratch retrain):

| Method | Search cost | How it got cheaper | Source |
|---|---|---|---|
| NAS (Zoph and Le 2017) | 800 GPUs x 28 days = 22,400 GPU-hours | (baseline) | cited in NASNet (1707.07012) |
| NASNet (cell, 2017) | 500 GPUs x 4 days = 2,000 GPU-hours; 20,000 child models | cheap proxy (CIFAR-10) + transfer the cell | NASNet experiments |
| AmoebaNet (evolution, 2018) | 3,150 GPU-days | (regularized evolution) | cited in DARTS (1806.09055) |
| ENAS (2018) | 0.5 GPU-day (single GPU, <16 h); "1000x" cheaper | parameter sharing across child models | ENAS (1802.03268) |
| DARTS (2018) | 1.5 GPU-days (first order) to 4 GPU-days (second order) | continuous relaxation + gradient-based bilevel search | DARTS Table |

Primary-source fact (NASNet): the original NAS used 800 GPUs for 28 days; NASNet's cell search on
500 GPUs for 4 days was ~7x faster (1707.07012, experiments footnote). Primary-source fact (ENAS):
parameter sharing made search "1000x less expensive than standard Neural Architecture Search,"
finding a CIFAR-10 architecture on a single GPU in <16 hours (1802.03268, abstract). Primary-source
fact (DARTS): it cites "2000 GPU days of reinforcement learning or 3150 GPU days of evolution" and
reduces discovery "to a few GPU days" via continuous relaxation (1806.09055, intro).

Interpretation (flagged): the dominant research activity in NAS for years was not "can we automate
architecture design" (NASNet settled that) but "can we make it affordable." Self-improvement of a
learning system is real; its cost was the problem, and the field spent itself driving the cost down
1000x. That is the honest frame for any repo autoresearch loop: the question is rarely whether
automation works, it is whether the search is affordable on the compute you actually have.

## 2. Search-space sensitivity: the human-prior tradeoff

The NAS survey states the tradeoff plainly: a search space that incorporates prior knowledge "can
reduce the size of the search space and simplify the search. However, this also introduces a human
bias, which may prevent finding novel architectural building blocks that go beyond the current
human knowledge" (1808.05377, Section 1). The survey decomposes every method into three axes,
which double as a design checklist:

1. **Search space**: what designs can be represented at all.
2. **Search strategy**: how to explore it (exploration vs exploitation; avoid premature
   convergence).
3. **Performance estimation strategy**: how to estimate a candidate's quality CHEAPLY (naive full
   train+validate "is unfortunately computationally expensive and limits the number of
   architectures that can be explored").

AutoML-Zero pushes the search-space axis to its limit: drop the human priors and search WHOLE ML
algorithms (model + optimizer + init + loss) over 65 basic math ops (2003.03384). The cost of that
genericity is stark, stated by the authors: existing AutoML spaces "have been constructed to be
dense with good solutions," so on them "advanced techniques are often only marginally superior to
simple random search"; AutoML-Zero's generic space is instead "quite sparse," with good algorithms
for even a trivial task "as rare as 1 in 10^12" (2003.03384, intro). To make evolution viable they
needed small proxy tasks (inputs projected to 8-256 dims for 2k-10k evals/sec/core), functional
equivalence checking (4x), hurdles (5x), and 100-1000 CPU cores for 5 days.

Interpretation (flagged): there is a direct dial between how much human structure you bake into the
search space and how much compute the search costs. A repo autoresearch loop searching a tightly
typed recipe space (a few feature toggles, a reward-shaping parameter) is cheap; a loop searching a
generic "social-prediction program" space is astronomically expensive. The repo should keep the
space small and typed, accepting the human-prior bias, because it cannot spend AutoML-Zero compute.

## 3. Learned optimizers: real, tuning-free at scale, but distribution-bound

Learning to learn by gradient descent by gradient descent (1606.04474) founded the line: cast the
DESIGN of an optimizer as a learning problem, implement the optimizer as an LSTM, and meta-train it
on a class of problems. It anchors the honest bound in theory: by the No Free Lunch theorems, "no
algorithm is able to do better than a random strategy in expectation" over all problems, so
"specialization to a subclass of problems is in fact the only way that improved performance can be
achieved in general" (1606.04474, intro). The demonstrated transfer is real but scoped: the LSTM
optimizer trained on 12,288-parameter tasks generalized to 49,152-parameter tasks, but the CIFAR
result is stated as beating hand-designed optimizers "when transferring to datasets drawn from the
same data distribution" (conclusion).

VeLO (2211.09760) is the scaled endpoint and the single best evidence for both halves of the
thesis. The "real" half: meta-trained with ~4000 TPU-months, VeLO needs no per-problem tuning and,
on >85% of its 83-task benchmark, beats a 1000-trial tuned NAdamW search with a single run. The
"bounded" half is the authors' own limitations section: all failures "occur when VeLO is asked to
optimize tasks which are very unlike tasks in its meta-training distribution." Specifically it
degrades past ~500M parameters (ViT-H/14 650M underperforms; an 8B Transformer on 160B tokens is
unstable and loses to untuned Adafactor "even on a step-for-step basis"), and on training runs
longer than ~200K steps; a 100M LM even forced VeLO to re-introduce a weight-decay hyperparameter
to stay stable (2211.09760, Section "Limitations and Failure Cases"). muLO (2406.00153) confirms
the pattern from the other side: learned optimizers "struggle to optimize unseen tasks, especially
when training networks wider than those seen during meta-training," and a Maximal Update
Parametrization only partially recovers wider-task generalization.

Interpretation (flagged): a meta-learned self-improvement component (optimizer, reward shaper,
predictor) is a SPECIALIST for the distribution it trained on. This is the cleanest bound on the
wave-4 thesis: an autoresearch loop that meta-learns a recipe will help near the cycle/scenario
distribution it tuned on and degrade or break outside it. Even VeLO, the most-scaled learned
optimizer to date, breaks out of distribution. So a repo WAM/recipe tuned by an autoresearch loop
must be scoped, and its OUT-of-distribution failure regime reported, not assumed away.

## 4. The bridge to autoresearch: LLM-driven AutoML

The AutoML-in-age-of-LLMs survey (2306.08107) is the explicit hinge from this classical lineage to
the wave-5 autoresearch concept. Its "Opportunity III: LLMs as components of AutoML systems"
catalogs the coding-agent loop YEARS before ENPIRE applied it to robots:

- GENIUS (Zheng 2023): GPT-4 "iteratively prompts ... for an architecture, which it evaluates, and
  re-prompts GPT-4 with the performance asking for a better architecture" until a stopping
  criterion. An LLM hill-climbing a metric from feedback.
- EvoPrompting (Chen 2023): an LLM implements the crossover and mutation operators of evolutionary
  NAS, with all prior candidates + results as prompt context.
- GPT-NAS (Yu 2023), CAAFE (Hollmann 2023, LLM proposes feature-engineering code + feeds back the
  evaluation), AutoML-GPT and MLCopilot (Zhang 2023), and Tsai (2023, one LLM writes AutoML code,
  another controls it from execution results).

Interpretation (flagged): ENPIRE's "coding agent edits training code and picks the method against a
verified signal" is structurally a descendant of Opportunity III, not a new idea. The survey also
surfaces the exact failure mode the repo guards against: AutoML-GPT "never evaluate a single ML
pipeline ... only use LLMs to simulate the entire AutoML process." That is progress laundering by
another name: an LLM judging which design is best without actually running it. The lesson maps
directly onto the repo's verifier-owns-truth rule: an LLM-driven improvement loop is only
trustworthy when a real, held-out evaluation (the runtime verifier on actual cycles), not the LLM's
own simulation, supplies the signal.

## 5. How this lands on the repo (mechanically useful vs research contribution)

Mechanically useful (reference patterns, not borrows of the research claims):
- Treat any "improve the advisory-WAM training recipe" loop as the three-axis NAS problem: a small
  TYPED recipe space, a search strategy, and a CHEAP performance-estimation strategy. The repo's
  near-$0 verifier on a small fixture of cycles IS the cheap performance-estimation strategy the
  survey says you must have.
- Keep the search space small and typed (accept the human-prior bias) because the repo cannot
  spend AutoML-Zero / VeLO compute. The 1-in-10^12 sparsity result is the warning against a generic
  social-prediction search.
- Do not re-pay the costly evaluation when candidates overlap: ENAS shares weights, AutoML-Zero
  dedups equivalent programs (FEC); the repo analog is reusing verifier evidence / partial rollouts
  across similar recipe candidates.
- Report the failure regime, not just wins: VeLO explicitly studies where it underperforms a tuned
  baseline. Any repo self-improvement loop should state which scenarios the improved WAM does NOT
  help.
- Adopt the evaluation-grounded LLM loop shape (GENIUS, CAAFE: every candidate is actually run) and
  reject the simulation-only shape (AutoML-GPT: LLM predicts the winner without running it).

Research contribution (NOT ours): discovering complete ML algorithms (AutoML-Zero), differentiable
NAS (DARTS), versatile learned optimizers at TPU-month scale (VeLO) are frontier-lab research
programs. The repo does not contribute to AutoML; it at most runs a tiny, verifier-grounded recipe
search.

What to avoid / overclaim:
- Do not claim a small evolutionary or gradient-based loop will "discover" a social-WAM the way
  AutoML-Zero discovered backprop. That needed lab-scale compute against a dense, clean metric.
- Do not assume a meta-learned component generalizes beyond its training distribution. The founding
  learned-optimizer paper claims only same-distribution transfer; the most-scaled one (VeLO) breaks
  out of distribution.
- Do not assume gradient-based recipe search is cheap or stable for the repo: DARTS is cheap only
  because it has a differentiable validation loss and a well-behaved space, and it is still
  initialization-sensitive. The repo's verifier signal is non-differentiable, so DARTS-style methods
  do not transfer mechanically.
- Do not adopt simulation-only LLM AutoML. It violates the repo's premise that the runtime, not the
  LLM, owns truth.

## 6. Tie to the thesis (one paragraph)

This lineage supports the wave-4 thesis in shape and bounds it in scale. It supports it because
automated self-improvement of a learning system is demonstrably real (AutoML-Zero rediscovers
backprop and invents normalized-gradient/weight-averaging; VeLO with zero tuning beats a 1000-trial
search), and because the modern instantiation IS a coding-agent loop hill-climbing a metric
(GENIUS, ENPIRE). It bounds it because every method here assumes a clean validation metric and
pays heavily in compute, and the learned ones are trained-distribution-bound (VeLO breaks past
500M params / 200K steps). The repo's distinctive edge, a near-$0 verifier signal on a narrow,
typed recipe space, is exactly the cheap performance-estimation the field always needed but rarely
had; the repo's distinctive risk is the same one the survey names (an LLM that simulates success
instead of running a real held-out evaluation), which the repo's verifier-owns-truth rule is built
to prevent.
