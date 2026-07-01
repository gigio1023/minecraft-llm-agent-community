# Benchmark Validity and Evaluation: The Overclaim Boundary

Lane 3 theme file. Audience: external-team readers; jargon defined on first use.
This file collects the validity-warning literature and turns it into the concrete
overclaim boundaries the repo must respect, plus how to report social behavior
*as behavior* with cost and failure traces. Companions:
`llm-social-simulation.md` (how social state is defined/measured),
`project-sid-critical-review.md`, `matrices/benchmark-metrics-matrix.md`.

## 1. The thesis: plausibility is not validity

A simulation can produce output a judge finds plausible and still be invalid as
evidence about the world. "Validity" here = the simulation's outputs actually
correspond to the thing being claimed (real human behavior, or, for the repo,
a real change in world state). The validity literature converges, from several
independent directions, on the same point: **plausible output must be validated
against a concrete referent; it is not self-certifying.**

Two terms recur and are worth fixing:

- **Empirical realism** (aka ecological validity): the degree to which simulated
  behavior matches *observed* human behavior, measured in the setting where the
  simulation was fitted (Münker et al., 2506.21974).
- **Algorithmic fidelity**: the extent to which conditioning an LLM on a
  socio-demographic backstory reproduces that group; it must be re-measured for
  each research question (Argyle et al., via Concordia 2312.03664).

## 2. The quantitative ceiling: SimBench

SimBench (Hu et al., ICLR 2026 submission, arXiv 2510.17516) is the largest
standardized test of LLM human-behavior simulation: 20 datasets (moral dilemmas,
economic games, psychological assessments), 130+ countries, harmonized into
single-turn multiple-choice items aggregated to group-level response
distributions; ~10.9M question-group targets; 45 LLMs from 0.5B to 405B. The
metric is the fidelity of a model's predicted response distribution to the true
human distribution, scored to 100.

Findings the repo should treat as hard bounds:

- **Best LLM fidelity = 40.80/100**: "meaningful but modest." Even on the
  *easiest* form of the task (matching a marginal distribution, no interaction),
  the ceiling is low.
- Fidelity scales **log-linearly with model size** but is **not improved by
  inference-time compute**. More "thinking" does not buy better simulation.
- **Alignment-simulation tradeoff**: instruction tuning's mode-seeking objective
  improves low-entropy (consensus) questions but degrades high-entropy
  (pluralistic) ones, a beneficial instruction-following effect plus a harmful
  entropy-reduction effect. This is the concrete mechanism behind "mean alignment
  hides variance collapse": aligned models converge to the consensus answer and
  lose the diversity real populations show.
- Simulation ability correlates most with **knowledge-intensive reasoning
  (MMLU-Pro, r=0.939)**, i.e. with general capability, not anything
  social-specific.
- The authors' own scoping caveat: SimBench predicts *static* group distributions
  and "full human simulation inherently includes interactive and complex dynamics
  not fully captured by static response distributions."

For the repo: SimBench caps optimism (best is ~41/100, non-interactive), tells the
repo not to expect bigger/reasoning models to solve social fidelity, and, by its
own admission, leaves the interactive, world-grounded regime open, which is
exactly where the repo sits.

## 3. The sharpest boundary: empirical realism requires real-world data

"Don't Trust Generative Agents to Mimic Communication on Social Networks Unless
You Benchmarked their Empirical Realism" (Münker, Schwager, Rettinger, EACL 2026,
arXiv 2506.21974) makes the cleanest argument in the lane. Imitating real X users
in English and German, it finds:

1. **Validate empirical realism before simulating**, and report any finding
   *with* the realism score (a "confidence score" L_b, L_r) of its components.
2. **Simulate in the same setting the components were fitted**: English models
   matched real users far better than German; changing setting without retraining
   gives unreliable results.
3. **In-context prompting is often insufficient**; fine-tuning is needed for
   adequate realism.

And the impossibility argument: "you cannot have both, a valid and provable
realistic social simulation without using real-world user data to model agents
and measure their empirical realism." Synthetic personas cannot *prove* realism;
proving it needs individual real data; once you have that you again have a
real-data replica.

For the repo this draws two boundaries. First, a *reporting* boundary: every
social score should travel with its evidence/uncertainty, not stand alone, and a
result fitted on one seed/partner/world must be re-measured before being claimed
for another. Second, a *scope* boundary: the repo must NOT claim to reproduce real
human society (it has no per-actor real-human ground truth). It claims something
narrower and provable: grounded Minecraft social *trajectories*, a behavioral,
world-verified claim, not a human-fidelity claim. This is why the narrower frame
is more defensible, not a weaker one.

## 4. The say-vs-do gap: belief-behavior consistency

"Do Role-Playing Agents Practice What They Preach?" (COLM 2025, arXiv 2507.02197)
measures whether an LLM's **stated beliefs** about how a persona behaves predict
its **actual role-play behavior**, using the Trust Game (Trustor sends money X, it
triples, Trustee returns some) over a GenAgents persona bank. Findings:

- **Systematic belief-behavior inconsistencies at both individual and population
  level**: "even when models appear to encode plausible beliefs, they may fail to
  apply them in a consistent way."
- **Explicit task context during belief elicitation does not improve consistency.**
- **Imposing a researcher's prior tends to undermine alignment** (a controllability
  concern: the model keeps its own disposition even when instructed otherwise).
- **Individual-level forecast accuracy degrades over longer horizons.**

A companion, "Can LLM Agents Simulate Human Trust Behaviors?" (NeurIPS 2024,
arXiv 2402.04559), finds trust behaviors partially emerge but are biased and
model-dependent.

This is the scientific articulation of the repo's central failure mode. Project
Sid's motivating example (an agent verbally agrees to give a pickaxe while its
action module does something else) and the Trust Game inconsistency are the same
class: stated disposition does not predict enacted behavior. The corrective the
repo enforces is the answer this paper implies, verify the *behavior* against an
external referent (the money sent; in Minecraft, the inventory/container delta),
never the stated belief. The "imposed prior undermines consistency" result is also
a caution against scripting social outcomes from persona/soul text: let behavior
emerge, then verify it.

## 5. The validation hierarchy (how to phrase a defensible claim)

Concordia (2312.03664) lays out the cleanest hierarchy of evidence for generative
social simulation, usable verbatim as the repo's methodology framing:

1. **Generalization to new real data** is the gold standard ("direct evidence of
   generalization trumps other forms").
2. **Algorithmic fidelity**: re-measured per research question.
3. **Model comparison**: "it is far easier to argue model A is more trustworthy
   than model B than that either is trustworthy on an absolute scale."
4. **Robustness**: sensitivity analysis over prompt wording / irrelevant details.
5. Parsimony: "make the minimal number of maximally general modeling choices."

It also names unsolved issues: **train-test contamination** ("it is not valid to
simply ask an LLM to play Prisoner's Dilemma", the framing must be hidden), LLMs
**represent stereotypes** of groups rather than their lived experience, and
**individual-fidelity** is unresolved.

For the repo: lead validity claims with model comparison and robustness (cheap,
defensible), treat human-generalization as an eventual gold standard rather than a
first-paper gate, and beware train-test contamination, Minecraft social tropes
(sharing, lending, fairness) are heavily represented in training data, so the repo
should not assume an LLM's "cooperative" behavior is organic; it should measure it
against the world.

## 6. The LLM-judge problem (your evaluator is part of the validity risk)

Several sources show the LLM judge that certifies "plausible" behavior is itself
unreliable in exactly the regimes the repo operates in:

- SOTOPIA (2310.11667): GPT-4 evaluator correlates with humans only on goal
  (r=0.71) and material (r=0.62) dimensions, weakly on diffuse social constructs,
  and tends to over-rate.
- SOTOPIA-pi (2403.08715): LLM evaluators *overestimate* models trained for
  social interaction (an evaluator-side reward-hacking signal).
- Lifelong SOTOPIA (2506.12666): GPT-4 *over-rates believability at long context*,
  precisely the long-run regime the repo cares about, which is why they had to
  add an explicit failure checklist.
- PersonaGym (2407.18416): "expected action" is itself LLM-generated, so the
  PersonaScore judge is grading against an LLM-authored key.

Implication: the repo should not rely on an LLM judge as the primary social score,
especially for long multi-cycle runs. World artifacts (inventory, container,
block, chat events, verifier output) are the anchor; an LLM judge, if used at all,
is a secondary axis with the Lifelong-SOTOPIA-style failure-checklist correction
and human-correlation validation.

## 7. The recurring "more capability ≠ more fidelity" pattern

Independently:

- SimBench: more inference-time compute does not improve simulation fidelity.
- S3AP (2509.00559): a stronger social *agent* is not a better social *world
  model*; the two capabilities are separable.
- (Lane 2's MineExplorer reports the same for open-world agents: larger models /
  thinking modes do not automatically become better agents.)

So the repo must measure social behavior *as behavior*, comparing models on
trajectory quality, not on general reasoning strength, and should expect that the
"smartest" model is not necessarily the best social actor or the best social
predictor.

## 8. How to report social behavior AS behavior (the repo's contract)

Synthesizing the above into a reporting discipline the repo can adopt:

- **Anchor every social score to a verified world delta.** A social claim ("Bob
  trusts Alice more," "Alice lent the pickaxe") must cite the inventory/container/
  chat/verifier artifact that makes it true. No transcript-only social score.
- **Separate prediction from action.** If an advisory social WAM predicts a delta
  (S3AP-style), score prediction accuracy (predicted delta vs verified delta)
  separately from the acting outcome. They are different capabilities.
- **Report cost and failure traces as first-class results.** Cost, latency, action
  count, cycle count; retries, stalls, blocked actions, failed continuity. The
  repo's research frame already lists these; the validity literature says these
  are not footnotes, "model agreement can be fake progress," "task success can
  reduce social quality," "more reasoning can fail to improve trajectories."
- **Always specify the partner/seed.** Partner-dependence is a lane-wide finding
  (SOTOPIA, AgentSense, GLEE, S3AP). A per-model social score without a named
  counterpart is not interpretable.
- **Carry an evidence/uncertainty tag with every finding** (the Don't-Trust
  "confidence score" pattern) and re-measure across settings before generalizing.
- **Lead with model comparison and robustness; treat human-generalization as a
  later gold standard**, not a first-paper requirement (Concordia hierarchy).
- **Watch for variance collapse**, not just mean alignment (SimBench's
  alignment-simulation tradeoff): track whether models collapse to a single
  "default" social move vs producing varied, scenario-appropriate behavior.

## 9. The overclaim boundaries, as a list

The repo must NOT claim:

- that plausible/believable dialogue is social capability (SOTOPIA believability,
  PersonaScore);
- that an LLM judge's social score is ground truth (it over-rates, especially long
  context);
- that matching a survey distribution is interactive social fidelity (SimBench's
  own caveat; ceiling ~41/100);
- that it reproduces real human society or specific real people (no real-human
  ground truth; 1000 People's ~85% ceiling is static self-report only);
- that a stated intention is a social outcome (belief-behavior inconsistency);
- that a result on one seed/partner/world generalizes without re-measurement
  (English-vs-German collapse);
- that a bigger or more-reasoning model is necessarily a better social actor or
  predictor (more compute ≠ fidelity).

The repo MAY defensibly claim:

- that a *named* model, with a *named* partner and seed, produced social-material
  transitions that were *verified* against world artifacts, at a measured cost,
  with its failures and uncertainty reported, and that one model did so more
  reliably than another (model comparison + robustness).

## 10. One-paragraph takeaway

The validity literature is unanimous in the abstract and precise in the
particulars: plausible output is not validity (SimBench caps the best simulator at
~41/100, non-interactive); empirical realism must be measured against real data in
the fitted setting and reported as a confidence score (Don't Trust); stated belief
does not predict enacted behavior (belief-behavior consistency); the LLM judge that
certifies plausibility is itself unreliable, especially at the long contexts the
repo uses; and more model capability does not buy social fidelity. The repo's
defensible posture follows directly: claim *verified, world-grounded, behavioral*
social transitions for a *named* model/partner/seed, with cost and failure traces,
scored by world artifacts rather than an LLM judge, with prediction and action as
separate axes, and never claim human-fidelity, believability, or organic
cooperation that the world has not confirmed.
