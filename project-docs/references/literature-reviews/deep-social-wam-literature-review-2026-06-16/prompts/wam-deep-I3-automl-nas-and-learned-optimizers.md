# Lane 26 (I3): AutoML, neural architecture search, and learned optimizers

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
The classical "machine improves machine learning" lineage: automating model architecture, training
pipeline, hyperparameters, and even the optimizer and learning algorithm itself. Self-improvement
that long predates LLM agents. Central question: how far can the design of a learning system be
automated, and what does that history teach about cost, search space, and generalization?

## Seeds (verify ids before fetching)
- AutoML-Zero (Real et al, 2020, 2003.03384): evolve ML algorithms from near-scratch primitives.
- NAS: NASNet (Zoph & Le, 1707.07012), DARTS (Liu et al, 1806.09055), ENAS (1802.03268); NAS survey
  (Elsken et al, 1808.05377). Verify.
- Learned optimizers: "Learning to learn by gradient descent by gradient descent" (Andrychowicz et
  al, 1606.04474), VeLO (Metz et al, 2211.09760). Verify.
- Hyperparameter optimization: Hyperband (1603.06560), BOHB (1807.01774). Verify; abstract-level ok.
- AutoML survey (one recent). Verify-then-add: Once-for-All, LLM-driven AutoML (AutoML-GPT-style),
  learned-loss-function discovery.

## Owned deliverables
- Theme: `notes/by-theme/research-area-automl-nas-and-learned-optimizers.md`.
- by-paper notes (at least AutoML-Zero, DARTS, one learned-optimizer paper).
- `raw-search-results/lane-26-manifest.jsonl`, `raw-search-results/lane-26-search-log.md`,
  `notes/subagent-briefs/lane-26-automl-nas-and-learned-optimizers.md`.

## Deconflict
- I2 owns discrete algorithm/program discovery; you own ML-pipeline, architecture, hyperparameter,
  and optimizer automation. Wave-4 H6 owns world-model discovery; H3 owns reward-code. Cite, do not redo.

## WAM tie + thesis
This lineage is the deepest evidence that automated self-improvement of a learning system is real but
EXPENSIVE and search-space-sensitive (AutoML-Zero needs enormous compute; NAS search cost was a known
problem). Land the tie modestly: it informs what an autoresearch loop tuning the repo's advisory-WAM
training recipe would look like, and the honest bound is that these methods assume a clean validation
metric and large compute, neither of which the repo spends; the repo's edge is a near-$0 verifier
signal, not a big AutoML search. Most of this lane is reference context, not a mechanical borrow.
