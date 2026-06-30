# Research area: Autonomous experimentation and self-improving / discovered world models

What this area is (one line for a newcomer): loops where a system runs its OWN experiments to learn or
refine a predictive model of its world (the dynamics), rather than only improving a policy against a fixed
model. Central question: can an agent decide what to try, observe the real outcome, and correct its world
model, with little or no human supervision?

This is the most direct of the wave-4 lanes for the original query, because the query asks for a world
model that "predicts and evaluates how actions transform state," and this lane is about a world model that
improves ITSELF by acting. The wave anchor, NVIDIA GEAR's ENPIRE (see `notes/by-paper/enpire.md`), is the
robotics archetype: a coding agent resets a scene, runs a policy, verifies the outcome, rewrites code, and
repeats against a verified success signal. This lane asks the narrower question ENPIRE's "Evolution" module
gestures at: what if the thing being improved is the predictive MODEL, and what does the literature actually
support?

Companions (cite, do not duplicate):
- `notes/by-paper/enpire.md`: the wave anchor (reset-rollout-verify-refine for a robot policy).
- `research-area-affordances-and-causal-world-models.md`: owns PASSIVE causal-dynamics learning (CoDA, CDL).
  This file EXTENDS it with the ACTIVE / EXPERIMENTAL angle (intervene to learn structure).
- `wam-lineage-rl-and-latent-dynamics.md` (Dreamer line): owns model-based latent dynamics. Plan2Explore
  builds on it; cited, not re-surveyed.
- H1 (policy self-improvement) and H5 (the verifiable-reward signal) are sibling wave-4 lanes; this file
  owns WORLD-MODEL improvement and discovery specifically.

Jargon defined on first use throughout. The repo terms used below (advisory WAM, verifier, progress
laundering, material claim, weak commons, Action Card, CycleJudgment) are defined in the shared contract and
`<repo>/SPEC.md`.

---

## Glossary (defined once)

- World model (WM): a predictor of the next state given the current state and action, `p(o'|o,a)`. Advisory
  here means it predicts and evaluates consequences but never acts, fills arguments, marks progress, or
  overrides the verifier (the repo's hard rule).
- Intrinsic motivation / curiosity: an internally generated reward that drives exploration when external
  reward is sparse or absent. The two classic forms used below: prediction-error (reward for being wrong)
  and information-gain / disagreement (reward for reducing model uncertainty).
- Epistemic vs aleatoric uncertainty: epistemic = reducible uncertainty from not having seen enough data
  (worth exploring); aleatoric = irreducible randomness in the world (not worth chasing). Conflating them is
  the "noisy-TV problem": a screen of static is endlessly "novel" to a prediction-error agent.
- Active / experimental causal discovery: choosing which variable to INTERVENE on (do-operation: force a
  variable, observe the effect) to learn the causal structure fastest, as opposed to passively fitting a
  model to whatever data arrives.
- Sim-to-real gap reward: a reward computed as the distance between the model's PREDICTED next state and the
  environment's OBSERVED next state. It is grounded in the environment, not in any model's self-judgment.

---

## Part A: LLM world models that self-improve and double as advisory engines

Central question: can an LLM serve as a world model that both improves from self-collected data AND acts as
a look-ahead engine for action selection, the exact advisory role this repo wants?

### A.1 The clean precedent: WebEvolver

WebEvolver (`2504.21024`, Tencent AI Lab, 2025, LaTeX deep-read) is the cornerstone. What it introduced and
why it matters: an LLM world model `p(o'|o,a)` (predicting the next web page as an accessibility tree) that
**co-evolves** with the agent policy and serves two roles at once: (1) a virtual web server that generates
synthetic multi-step trajectories (depth up to 7) to refine the policy without costly real interaction, and
(2) an imagination engine that does d-step look-ahead at inference, scoring candidate actions before the
runtime executes one (their WMLA mechanism). It reports ~10% success gain over a self-evolving baseline on
live web benchmarks, with no distillation from stronger models. This is precisely the advisory posture: the
WM predicts and evaluates; the real web transition still owns ground truth at execution.

Two honest points from the paper itself. First, the WM hallucinates pages, and the authors accept that
during TRAINING because the downstream signal (rejection sampling against real task success, plus a separate
GPT-4o look-ahead scorer) re-grounds learning. The hallucination is tolerable only because a non-self signal
filters it. Second, its WM is a free-text page generator scored by surface similarity, which is exactly the
surface-form trap the next sub-thread warns about.

### A.2 The most on-target precedent: WorldLLM

WorldLLM (`2506.06725`, Inria Flowers / MIT / Hugging Face, 2025, LaTeX deep-read) is the single closest
match to this lane's question. What it introduced and why it matters: it makes the autoresearch loop literal
with three modules. A **Statistician** (the LLM world model `P(s'|s,a,H)`, where H is a set of natural-
language hypotheses in the prompt) scores how well current hypotheses predict collected transitions. A
**Scientist** (a second LLM as a Bayesian proposal distribution, via the Metropolis algorithm) refines those
hypotheses to raise the Statistician's likelihood on real data. An **Experimenter** (a curiosity-driven RL
policy) collects transitions the current model predicts POORLY (low log-likelihood). The loop alternates,
"inspired by how humans, from children to scientists, actively update their internal world model by
performing experiments." Critically the environment is reward-LESS: curiosity exists only to gather model-
improving data, and the WM is optimized by editing PROMPT-LEVEL hypotheses (no gradient training).

Findings that matter here: (1) giving the model hypotheses always beats no hypotheses, with no weight
updates; (2) prediction-error curiosity (their RL-LogP) explores the full transition space and solves the
environment's tech tree as a byproduct; (3) a naive learning-progress signal (RL-ALP) FAILS, collapsing onto
trivial "walk around" transitions, the abstract version of the noisy-TV problem; (4) natural-language
theories are argued to generalize to syntax changes better than fine-tuning, which overfits surface form.
The authors flag that the result depends on a simple environment where harder transitions are naturally
harder to predict, and would not obviously hold in complex worlds.

### A.3 Adjacent LLM-WM work (abstract-level breadth)

- WMA web agent (`2410.13232`, ICLR 2025, 44 upvotes): a world-model-augmented web agent that predicts
  action outcomes as free-form natural-language state DIFFERENCES (transition-focused observation
  abstraction) and uses them for look-ahead WITHOUT training. Confirms LLMs lack a usable world model by
  default and that a transition-DELTA target (not full next-state) is the tractable prediction object,
  which directly supports the repo's typed-delta framing.
- From Word to World (`2512.18832`, 2025): a three-level study of LLMs as implicit text-based world models;
  gains "depend critically on behavioral coverage and environment complexity," a boundary condition on the
  thesis.
- R-WoM (`2510.11892`, 2025): retrieval-augmented WM for computer-use agents; addresses the COMPOUNDING-error
  problem in long-horizon LLM simulation by grounding in external tutorials, a caution that LLM WMs degrade
  over multi-step rollouts.
- Reward-free self-evolution via world-knowledge exploration (`2604.18131`, 2026) and the Text World Models
  survey (`2606.09032`, 2026) frame the broader space; DynaWeb (`2601.22149`, 2026) is the explicit Dyna-style
  model-based-RL instance for web agents.

---

## Part B: Curiosity and intrinsic motivation (deciding WHICH experiments to run)

Central question: with no external reward, how does an agent decide which transitions to collect so that its
WORLD MODEL improves? This is the data-collection half of every loop in Part A.

### B.1 Genealogy and cornerstones (source-backed)

- ICM (`1705.05363`, Pathak et al., ICML 2017, LaTeX deep-read): curiosity = the forward model's prediction
  error in a feature space learned by an inverse-dynamics model, so the signal only covers what the agent can
  AFFECT. It explicitly raises and partially solves the noisy-TV problem. The point for this lane: prediction-
  error curiosity drives the agent exactly toward where its model is wrong.
- RND (`1810.12894`, Burda et al., ICLR 2019, LaTeX deep-read): novelty = error of a predictor distilling a
  FIXED random network on the observation. Because the target is deterministic, RND sidesteps the noisy-TV
  trap and set the state of the art on Montezuma's Revenge. Lesson: suppress aleatoric novelty.
- Plan2Explore (`2005.05960`, Sekar et al., ICML 2020, LaTeX deep-read): the model-based, look-ahead form.
  An ENSEMBLE of one-step latent models defines an intrinsic reward = ensemble DISAGREEMENT = expected
  information gain about the next observation, and the agent PLANS toward expected novelty inside its Dreamer
  world model. It reaches ~81% (zero-shot) / ~92% (few-shot, 150 episodes) of the task-reward oracle and
  generalizes across tasks. The cleanest statement of "explore specifically to improve the world model," and
  it correctly separates epistemic (chase it) from aleatoric (ignore it) uncertainty.

### B.2 Sub-threads (abstract-level)
- Stochasticity-robust curiosity: Curiosity in Hindsight (`2211.10515`, ICML 2023) uses structural causal
  models to factor out unpredictable aspects so intrinsic reward reflects only predictable dynamics, directly
  connecting curiosity to causal structure (Part C).
- Open-world / Crafter exploration: Intrinsically-Motivated Humans and Agents (`2503.23631`, 2025) compares
  adults, children, and agents in Crafter (a Minecraft-like world) and finds Entropy and EMPOWERMENT (not
  information gain) best track human exploration. Empowerment threads (Variational Intrinsic Control
  `1611.07507`; and the social/pro-social variants in Part D) are the alternative objective family.

---

## Part C: Active / experimental causal discovery (the EXPERIMENTAL angle wave-3 left open)

Central question: which INTERVENTION should the agent run to learn the causal structure of its world
fastest? This is the part the wave-3 affordances/causal theme deferred (it covered passive CoDA/CDL).

### C.1 Cornerstones (source-backed)

- Active Interventions for neural causal models (`2109.02429`, Scherrer et al. 2021, LaTeX deep-read): the
  archetype. Active Intervention Targeting (AIT) scores each candidate single-variable intervention by how
  much its predicted outcome DISAGREES across the DAGs sampled from the current belief, and picks the most
  discriminating one. It recovers structure (measured by structural Hamming distance to the true DAG) with
  far fewer interventions than random targeting, and keeps orienting edges past the point where observational
  data alone stalls. This is "learning to experiment" for the world model's STRUCTURE, and it is the causal-
  structure analog of Plan2Explore's disagreement signal.
- CausaLab (`2605.26029`, 2026, LaTeX deep-read): the LLM-agent reality check, and the load-bearing bound for
  this lane. It puts an LLM agent in a hidden-SCM lab where it intervenes and must both PREDICT a held-out
  value and RECOVER the mechanism. Headline: prediction success does NOT imply mechanism recovery. Concretely,
  observation-only gives 92% prediction accuracy but only 0.47 graph-recovery F1; mixed observation +
  agent-chosen online intervention gives 80% accuracy but 0.80 F1. Swapping a linear mechanism for a quadratic
  one halves accuracy while the recovered GRAPH is preserved ("agents lose the mechanism, not the graph"). A
  named failure is premature stopping (failed runs leave ~half the intervention budget unused), mitigated by a
  consistency check.

### C.2 Sub-thread (abstract-level)
- LLM-driven Bayesian experimental design: BED-LLM (`2508.21184`, 2025) frames an LLM as choosing queries to
  maximize expected information gain, the principled "what should I ask/try next" objective behind both AIT
  and WorldLLM's Experimenter.

The two cornerstones bound each other: AIT shows active intervention is the right idea and is efficient in a
clean, small, fully-observable graph; CausaLab shows that when an LLM actually does it, mechanism recovery
lags prediction even in a clean world. Active intervention beats passive observation for STRUCTURE (mixed >
observation-only on F1, and agent-chosen > injected-offline), which is the constructive result this lane adds
to the affordances/causal theme.

---

## Part D: The social bound (the lane's required caution)

Curiosity and information-gain objectives are value-free: they reward reducing uncertainty regardless of what
the experiment costs others. In a single-agent physics world that is harmless. In a SOCIAL world it is not.
A prediction-error or information-gain Experimenter, told to collect transitions its model predicts poorly,
has a direct incentive toward ANTI-SOCIAL PROBING: take another actor's item, break a claim, or poke an
unpredictable partner "to see what happens," precisely because those outcomes are uncertain. WorldLLM's
RL-LogP collapse (chasing the easiest-to-reach transitions) and the noisy-TV problem (ICM, RND) are the
single-agent shadows of this; the social version is worse because the "noise" is another agent whose
unpredictability is partly irreducible (aleatoric) and partly costly to probe.

The constructive literature is the empowerment-as-assistance thread:
- AvE: Assistance via Empowerment (`2006.14796`, NeurIPS 2020): an agent intrinsically motivated to INCREASE
  ANOTHER agent's empowerment (its control over its own future), a PRO-social intrinsic objective.
- Transfer Empowerment (`2203.03355`, 2022): social intrinsic motivation to reliably react to a partner's
  actions.
- Developmental Curiosity and Social Interaction (`2305.13396`, 2023): a curious infant agent with an
  attentive caregiver learns a better predictive world model of social and physical dynamics; curiosity plus
  CONTINGENT social interaction, not unconstrained probing, builds the model.

Implication (interpretation): any WAM-improvement loop in this repo must constrain exploration by the repo's
material-claim and weak-commons vocabulary. Curiosity may select among AFFORDED, permitted actions (where the
runtime gates already allow the action and no claim is violated); it must not be allowed to motivate taking
others' possessions or degrading the commons as a way to gather model-improving data. The pro-social
empowerment objective is the candidate replacement objective, but it is unproven at this scale.

---

## Mapping to the 4 WAM layers

| Layer | Self-improving LLM WM (A) | Curiosity / info-gain (B) | Active causal discovery (C) | Social bound (D) |
| --- | --- | --- | --- | --- |
| Physical | WebEvolver / WMA predict next state and look ahead; transposes to typed-delta prediction. Strongest fit. | ICM/RND/Plan2Explore cleanest here: verifier gives crisp labels, disagreement targets where the WAM is unsure. | AIT recovers physical-consequence structure (which state vars gate an action's outcome). | Low risk: physical probing rarely harms others. |
| Material / economic | WorldLLM-style hypotheses can encode possession/claim rules; refine from verifier transitions. | Info-gain over possession/claim transitions; subsample "easy" ones (RWML trick). | "Intervene on possession" (lend the pickaxe, observe effect) is a do-operation; AIT's discriminate-hypotheses rule applies. Research extension. | Rising risk: probing a claim can BE a violation. Exploration must respect material claims. |
| Social | LLM WM predicts social deltas (request, promise, refusal); WebEvolver advisory look-ahead is the template. Unproven socially. | Prediction-error curiosity DIRECTLY incentivizes anti-social probing here (Part D). Pro-social empowerment is the candidate fix. | Social causal discovery is far outside AIT's clean-intervention assumptions (hidden intent, entangled vars). CausaLab's prediction != mechanism gap is the warning. | Core risk zone. Curiosity must be subordinated to weak-commons / claim rules. |
| Institutional / settlement | Long-horizon LLM-WM rollouts compound error (R-WoM caution); least mature. | Curiosity saturates as the WM gets confident (Plan2Explore), so it will not, alone, keep probing open-ended institutions. | Causal structure over long horizons is the hierarchical open problem (see `hierarchical-wam-for-minecraft-societies.md`). | Conventions about commons maintenance are the very thing at stake; probing them is destabilizing. |

Dependency reminder (shared contract): physical predictions must be reliable before social ones are
meaningful. Every method here is proven on physical/factored or small synthetic state; the social and
institutional transport is the repo's contribution surface, not a citable result.

---

## Maturity and honest open problems

- LLM world models that self-improve and double as look-ahead engines are demonstrated (WebEvolver, WorldLLM,
  WMA) but only on web/text/tiny-game domains, with single-digit-to-ten-point gains, and they hallucinate /
  compound error over long horizons. None is a structured-state social WM.
- Curiosity / information-gain exploration is mature for single-agent physical RL (ICM, RND, Plan2Explore) and
  has a known failure (chasing irreducible or trivial novelty). It has NO established value-aware variant for
  multi-agent social worlds; the pro-social empowerment thread is the lead but unproven at this scale.
- Active causal discovery is principled (AIT) but proven on small, clean, fully-observable graphs; LLM-driven
  causal discovery (CausaLab) shows a persistent prediction-vs-mechanism gap even there.
- Evaluation of whether an agent actually LEARNED a world model is itself unsolved: WorldTest / AutumnBench
  (`2510.19788`, LaTeX deep-read) separates reward-free exploration from scored tests on derived environments
  (including detecting CHANGES to the dynamics) and finds humans (~90%) far outperform the best frontier model
  (~27.5%), with compute helping in under 60% of environments. The capability the thesis relies on (run
  experiments, update beliefs from contradictory evidence) is exactly where frontier models most visibly fail.

---

## Relevance to the original query and the autoresearch thesis

The original query asks whether a hierarchical action-conditioned WAM can predict and evaluate how Minecraft
actions transform state. This lane is about a WAM that improves ITSELF by acting, so it bears directly on
whether such a WAM is even ATTAINABLE at near-zero cost.

Tie to the autoresearch thesis (support, complicate, bound):
- SUPPORTS: the repo's cycle already emits verifier-scored `(state, action, next-state)` transitions, so an
  ENPIRE-style loop has its "verify outcome" module for free. WebEvolver shows an LLM WM can co-evolve from
  such transitions and serve as an advisory look-ahead engine; WorldLLM shows it can be improved by editing
  prompt-level hypotheses with NO gradient training, scored by likelihood on real collected data; RWML
  (`2602.05842`, LaTeX deep-read) shows a sim-to-real-gap reward (predicted vs environment-observed next state)
  is empirically LESS hackable than LLM-as-judge, the engineering form of "the runtime owns truth, the LLM
  must never score its own success." Active intervention (AIT) and CausaLab's RQ2 show agent-chosen
  interventions recover more structure than passive observation. Together: an advisory, verifier-grounded loop
  to improve a structured Minecraft WAM at near-$0 with no human labels is plausible at the Physical and
  Material layers.
- COMPLICATES / BOUNDS: CausaLab's prediction-vs-mechanism gap (92% accuracy at 0.47 edge-F1) means "the WAM
  predicted this scene right" is necessary but NOT sufficient evidence it learned the mechanism that transfers;
  the loop needs CausaLab-style separate mechanism-recovery scoring and a stopping/consistency check
  (premature-stopping is a real failure). WorldTest shows frontier models are weak world-model LEARNERS today.
  Plan2Explore's saturation and WorldLLM's environment-simplicity caveat mean curiosity will not, by itself,
  keep the loop productive at the open-ended social/institutional layers.
- WARNS: curiosity / information-gain objectives are value-free and, in a social world, directly incentivize
  anti-social probing. Any exploration must be subordinated to the repo's material-claim and weak-commons
  vocabulary, and must stay advisory: a discovered WM predicts, it never executes, fills args, marks progress,
  or overrides the verifier.

One-sentence tie: this lane shows the autoresearch-for-the-WAM loop has a clean LLM precedent (WebEvolver),
a literal experiment-to-improve-your-own-model precedent (WorldLLM), a verifier-grounded reward recipe that
resists self-scoring (RWML), and a principled experiment-selection rule (AIT), but it is bounded by a
prediction-vs-mechanism gap (CausaLab), weak frontier world-model learning (WorldTest), curiosity saturation
(Plan2Explore), and a social-probing risk that forces exploration to respect material claims and the weak
commons.
