# MAML - Finn, Abbeel, Levine 2017 (the canonical meta-learning algorithm)

- **title**: Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
- **authors**: Chelsea Finn, Pieter Abbeel, Sergey Levine (UC Berkeley)
- **year**: 2017
- **venue/source**: ICML 2017
- **arxiv_id**: 1703.03400
- **urls**: paper https://arxiv.org/abs/1703.03400 ; widely re-implemented (the paper's own code is referenced; numerous public reimplementations exist)
- **source availability**: latex (extracted senstive.tex, deep-read)

## Primary-source facts (LaTeX-verified)

- **Research question**: how to train a model so that a *few* gradient steps on a *small* amount of data from a new task produce good generalization on that task (few-shot adaptation), in a way that is agnostic to the model and applicable to classification, regression, and RL.
- **Core idea (the two-loop / bilevel structure, senstive.tex:200-235)**: learn an initialization theta such that, for each task, a small number of inner-loop gradient steps adapts theta to a task-specific theta_i', and the *outer* loop optimizes theta so that the adapted theta_i' performs well.
  - Inner (adaptation) step: `theta_i' = theta - alpha * grad_theta L_i(f_theta)` (one or a few steps).
  - Outer (meta) objective: minimize `sum over tasks of L_i(f_{theta_i'})`, i.e. loss *after* adaptation.
  - Meta-update: `theta <- theta - beta * grad_theta sum_i L_i(f_{theta_i'})`. This differentiates *through* the inner gradient step (a second-order term), though a first-order approximation also works.
- **Framing the paper gives (senstive.tex:117, 200)**: the method "optimizes for models that are easy and fast to fine-tune"; from a dynamical-systems view it maximizes the sensitivity of new-task losses to the parameters, so small parameter changes yield large task-loss improvements. No extra parameters are introduced beyond the model itself (unlike RNN-based meta-learners).
- **Tasks distribution (senstive.tex:131-173)**: meta-learning assumes a distribution p(T) over tasks; meta-training samples tasks, adapts on K examples, evaluates on held-out examples of the same task. For RL (senstive.tex:329-365), each task is an MDP and the model is a policy; "any aspect of the MDP may change across tasks."
- **Results**: state-of-the-art on two few-shot image-classification benchmarks at the time, good few-shot regression, and faster fine-tuning for policy-gradient RL.

## Interpretation (flagged as inference)

- MAML is the cleanest definition of "learning to learn" as bilevel optimization: an inner loop *uses* a learning rule, an outer loop *shapes* the conditions so that learning rule works fast. This is the mechanism the lane's theme is built around; everything from RL^2 (meta-RL in RNN weights) to AI-GAs pillar 2 (meta-learn the learning algorithm) to STOP (meta-improve a code improver) is a variation on "an outer process improves an inner learning process."
- MAML is meta-learning but *not* recursive self-improvement: it is exactly two levels (adapt + meta-update), it converges to a fixed initialization, and it requires a held-out task distribution with ground-truth labels. There is no self-reference (the outer optimizer is not itself meta-learned) and no unbounded recursion. This is the honest baseline: most "self-improvement" in practice is one or two levels like MAML, not the Goedel-machine recursion.
- For this repo: MAML's relevance is conceptual, not mechanical. The repo is not gradient-meta-training a model. But MAML names the structure an autoresearch loop borrows: an *outer* loop (the coding agent / recipe tuner) shapes an *inner* learning process against post-adaptation performance. The repo's outer loop would optimize a recipe so the inner (actor + advisory WAM) does better, scored by the verifier.

## Mechanically useful vs research contribution

- **Mechanically useful**: the bilevel template (optimize the *conditions* of learning against post-adaptation outcome) and the discipline that the meta-objective is measured on *held-out* data, not on the adaptation data. The latter is the meta-learning analogue of the repo's no-train-on-the-test-set / no-progress-laundering rule.
- **Not a contribution to claim**: nothing here is novel for the repo to claim; MAML is a 2017 method import and the repo does no gradient meta-training. Citing MAML is to establish the two-loop vocabulary, not to propose using MAML.
- **For lane I6**: MAML is the demonstrated, narrow end of the self-improvement spectrum (two levels, supervised task distribution, converges). It is the counterexample to "self-improvement = unbounded recursion": the most-cited learning-to-learn method is bounded and label-dependent.

## WAM layer(s) informed

Method-level, cross-layer. Informs the *structure* of any improvement loop over the repo (outer recipe optimization, inner actor/WAM learning, scored on held-out scenarios), not any specific layer's content.
