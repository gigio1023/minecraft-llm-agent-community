# Research area: hierarchical and temporally-abstract world models and RL

Lane 12 (wave 3) area survey. This file maps the academic field of *temporal abstraction and hierarchy
in reinforcement learning (RL) and world models* for a newcomer, then ties it to the project's original
query and 4-layer stack. Every term is defined on first use. Primary-source facts are separated from
interpretation; "mechanically useful" (engineering this repo can borrow) is kept distinct from "research
contribution" (what would be a novel claim, and is mostly out of scope under the repo's advisory rule).

This area is the academic footing for the word "hierarchical" in the original query and for the WAM
survey's named open challenge: "hierarchical world-action modeling, connecting high-level semantic
decomposition to low-level physical prediction." See `wam-foundations.md` and
`wam-training-evaluation-and-open-problems.md` for that challenge as stated by the survey (arXiv
2605.12090); this file does not re-derive it.

## What this area is (one line)

How to make an agent reason and predict at more than one time scale: a slow high level that names
abstract goals (subgoals, options, skills) and a fast low level that executes primitive actions, and
(more recently) world models that predict at multiple temporal resolutions so a subgoal can be planned
in a learned latent before any primitive action is taken.

## Scope and what it does NOT duplicate

- The general world-model lineage (Dreamer, PlaNet, MuZero, TD-MPC2, the latent-vs-pixel argument) is
  already covered in `wam-lineage-rl-and-latent-dynamics.md`. This file cites it and adds the *hierarchy*
  axis those flat agents lack.
- The project's own recommended 4-layer advisory WAM is the capstone in
  `hierarchical-wam-for-minecraft-societies.md`. This file is the *academic field behind* that capstone:
  it shows the project's layering is an instance of a real research area, not a local invention.
- Minecraft LLM agents that use a high-level planner over low-level controllers (DEPS, Plan4MC, GITM)
  are surveyed for behavior in `minecraft-vla-and-visual-policy.md` and `minecraft-agent-benchmarks.md`;
  here they appear only as the "high-level semantic decomposition" half of the survey's hierarchical-WAM
  challenge, cited at abstract level.

## Glossary (defined once)

- **Temporal abstraction**: treating a multi-step behavior as a single decision, so the agent does not
  reason at the clock rate of primitive actions. The reason hierarchy exists.
- **Option** (Sutton, Precup, Singh 1999): the formal object for a "skill" = an *initiation set* (where
  it can start) + an *internal policy* (what to do while it runs) + a *termination condition* (when to
  stop). A one-step option is a primitive action, so options generalize actions.
- **Semi-MDP (SMDP)**: the decision process you get when actions take variable amounts of time (because
  options run for several steps). A Markov decision process (MDP) plus a fixed option set is an SMDP,
  hence options sit "between MDPs and semi-MDPs."
- **Subgoal**: a target state or condition the low level should reach next; the unit a high level hands
  down.
- **Manager / worker (feudal) hierarchy**: the two-level form where a *manager* sets a goal and a
  *worker* achieves it; the manager says *what*, not *how* (Dayan and Hinton 1993).
- **Skill**: a reusable behavioral primitive ("open a door", "navigate to the chest"). In the options
  language a skill is an option; in skill-discovery work it is a latent-conditioned policy.
- **Skill / option / subgoal discovery**: *learning* the repertoire of skills or the goal space
  automatically, instead of hand-specifying it. The hardest, least-solved part of the area.
- **Goal-conditioned policy**: a policy that takes a goal as input and is rewarded for reaching it; one
  policy serves many goals.
- **Hierarchical planning**: searching or reasoning over abstract subgoals first, then refining into
  primitive actions, rather than planning entirely at the primitive level.
- **Hierarchical world model**: a world model that predicts at multiple temporal resolutions (a fine
  level for next-step dynamics, a coarse level for "what changes after many steps"), so a high level can
  plan a subgoal in a learned latent.
- **Non-stationarity (in HRL)**: because the low level keeps learning, a fixed high-level goal produces
  different low-level behavior over time, so the high level chases a moving target.
- **Option collapse / degeneracy**: when learned options degenerate so that either one option does
  everything (no abstraction) or options never terminate; the classic failure of automatic option
  learning.
- **Model exploitation (on the abstract level)**: a high-level planner finds actions that look good in
  an imperfect *abstract* world model but fail in reality; the central failure diagnosed for stacked
  hierarchical world models.

## Genealogy: what each work introduced and why it matters

The field refines one skeleton over three decades: a slow high level issues abstract goals; a fast low
level executes; and (recently) a learned world model lets the high level plan a subgoal in latent space
before acting.

### A. Classical foundations (the vocabulary)

- **Feudal RL (Dayan and Hinton 1993; docs-level, no arXiv).** Introduced the manager/worker idea:
  levels of an agent communicate by explicit goals; a higher level says *what* to achieve, not *how*,
  and is rewarded for the goal being reached. It is the conceptual root of every manager/worker method
  below. (Primary-source fact via Vezhnevets et al. 2017, which cites it as its inspiration.)
- **Options framework (Sutton, Precup, Singh 1999, "Between MDPs and Semi-MDPs: A Framework for
  Temporal Abstraction in Reinforcement Learning", Artificial Intelligence 112(1-2):181-211, DOI
  10.1016/S0004-3702(99)00052-1; docs-level canonical reference).** Introduced the *option* as the
  formal unit of temporal abstraction (initiation + policy + termination) and proved an MDP + options is
  an SMDP. This is the precise definition of "skill" the project should adopt as vocabulary.

### B. Deep HRL (learn the hierarchy end-to-end)

- **FeUdal Networks / FuN (Vezhnevets et al. 2017, 1703.01161; LaTeX deep-read).** The deep-network
  realization of feudal RL: a Manager emits a *directional goal* in a learned latent at a slow time
  scale; a Worker emits primitive actions at every tick, with an intrinsic reward for following the
  goal direction; no gradients flow between them. Its novelties (a *transition policy gradient* that
  trains the Manager on the direction the agent actually moved, and *directional* rather than absolute
  goals) are reused widely. What it fixed: turned the 1993 idea into a single differentiable agent.
  Honest caveat (per Director's related-work): FuN "did not demonstrate clear benefits over an LSTM
  baseline," so the genealogy is central but the empirical win was contested.
- **Option-Critic (Bacon, Harb, Precup 2016, 1609.05140; LaTeX deep-read).** "The first end-to-end
  approach for learning options": derives policy gradient theorems for options and learns each option's
  internal policy *and* termination condition jointly with the policy over options, from reward alone,
  no subgoals. What it fixed: option discovery stopped being a heuristic two-stage pipeline. Its known
  failure, *option collapse* (options degenerate to one primitive step, or never terminate), is the
  clearest single piece of evidence that skill discovery is unsolved.
- **HIRO (Nachum, Gu, Lee, Levine 2018, 1805.08296; LaTeX deep-read).** The canonical *goal-conditioned*
  HRL agent: a higher level proposes a *target state* as the goal for a lower-level goal-conditioned
  policy, both trained off-policy for sample efficiency. Its signature contribution is the
  *off-policy correction* (relabel a stale high-level goal to the one that best explains the low-level
  actions actually taken), a patch for HRL's **non-stationarity**. What it fixed: made HRL
  sample-efficient and the goal space generic (a learned state, not hand-built XY coordinates).
- **HAC / Learning Multi-Level Hierarchies with Hindsight (Levy, Konidaris, Platt, Saenko 2017,
  1712.00948; ICLR 2019; LaTeX fetched).** Trains a 3-level hierarchy by treating each level *as if the
  level below were already optimal* (using hindsight goal relabeling), which stabilizes simultaneous
  multi-level learning. What it fixed: instability of learning several levels at once. Caveat (per
  Director): it "required semantic goal spaces."

### C. Skill discovery (learn the repertoire bottom-up, no task reward)

- **VIC, Variational Intrinsic Control (Gregor, Rezende, Wierstra 2016, 1611.07507; abstract-level).**
  First to discover *intrinsic options* by maximizing the mutual information between options and their
  termination states; also yields an empowerment measure. The progenitor of the MI skill-discovery
  thread.
- **DIAYN, Diversity is All You Need (Eysenbach, Gupta, Ibarz, Levine 2018, 1802.06070; LaTeX
  deep-read).** The canonical instance: learn diverse, distinguishable skills with *no reward* by
  maximizing the mutual information between a skill label and the states it visits, under a
  maximum-entropy policy; the skills compose hierarchically and serve as HRL primitives or pretraining.
  Honest caveat: "diverse" is not "useful for a given task," and discovered skills are sensitive to the
  state representation and the MI estimator.
- **DADS, Dynamics-Aware Discovery of Skills (Sharma, Gu, Levine, Kumar, Hausman 2019, 1907.01657;
  abstract-level).** The most world-model-relevant variant: discover skills whose *outcomes are easy to
  predict* by co-learning skill dynamics, so model-based planning over the skills becomes easy. It
  tightens the bridge between skill discovery and world models, and supplies a selection principle: a
  *good* subgoal is one whose consequence is predictable (and, for this repo, verifiable).

### D. Hierarchical world models (plan a subgoal in a learned latent)

- **Director, Deep Hierarchical Planning from Pixels (Hafner, Lee, Fischer, Abbeel 2022, 2206.04114;
  LaTeX deep-read, the lane cornerstone).** Puts the manager/worker hierarchy *inside* a Dreamer world
  model: a goal autoencoder compresses the 1024-dim latent into a small discrete code; a manager picks a
  latent goal code every fixed K=8 steps (maximizing task + exploration reward); a worker reaches the
  decoded latent goal via a max-cosine reward. What it fixed: removed the need for a hand-specified goal
  space (the manager invents its goal space *from pixels* in the world model's latent) and beat flat RL
  on very sparse-reward long-horizon tasks (egocentric 3D maze, etc.). It is the single best academic
  template for "plan a subgoal in a learned latent, then act," with the crucial caveat that Director's
  manager *acts* whereas this repo's WAM must stay advisory. Stated limits foreshadow the field's
  frontier: the manager treats its goal space as a black box, the fixed-interval switch is rigid, goals
  are single points (not distributions/masks), and >2 levels would need *temporally-abstract dynamics*.
- **THICK, Learning Hierarchical World Models with Adaptive Temporal Abstractions from Discrete Latent
  Dynamics (Gumbsch, Sajid, Martius, Butz; ICLR 2024; OpenReview TjCDNssXKU; code
  github.com/CognitiveModeling/THICK; abstract-level, no clean single arXiv id found, recorded as
  ICLR/OpenReview).** Learns the temporal hierarchy *adaptively*: the low-level world model is guided to
  update parts of its latent only sparsely in time, and the high-level model predicts the sparse
  changes, giving an emergent (not hand-fixed) coarse time scale for long-horizon, explainable planning.
  This directly attacks Director's limitation that >2 levels need temporally-abstract dynamics.
- **Hierarchical World Models as Visual Whole-Body Humanoid Controllers (Hansen, Jyothir S V, Sobal,
  LeCun, Wang, Su 2024, 2405.18418; abstract-level).** A two-tier world model where a high-level agent
  generates commands from visual observations for a low-level agent to execute, both reward-trained,
  controlling a 56-DoF humanoid from vision with no hand-crafted rewards or motion primitives. Concrete
  evidence the hierarchical-world-model pattern scales to high-dimensional embodied control.
- **Exploring the Limits of Hierarchical World Models in RL (Schiewer, Subramoney, Wiskott 2024,
  2406.00483; LaTeX deep-read, the maturity anchor).** A careful *stacked* hierarchical world model
  (world models at several temporal resolutions, agents proposing goals top-down, static temporal
  abstraction) that **did not outperform flat methods** on final returns, and diagnoses *model
  exploitation on the abstract level* as the central obstacle. The honest counterweight to Director's
  success: deep multi-level hierarchical world models are promising but not yet a reliable, solved tool.
- **Learning World Models With Hierarchical Temporal Abstractions: A Probabilistic Perspective (Shaj
  2024, 2404.16078; abstract-level; a PhD dissertation, not the Gumbsch paper of a similar name).** A
  probabilistic treatment of multi-level temporal-abstraction world models; recorded for completeness of
  the modern hierarchical-world-model cluster.

### E. The skeptical edge (is hierarchy even necessary?)

- **Flattening Hierarchies with Policy Bootstrapping (Zhou and Kao 2025, 2505.14975; NeurIPS 2025
  Spotlight; abstract-level).** Argues that hierarchical methods add complexity (modular timescale-
  specific policies + subgoal generation) that hinders scaling, and shows a *flat* policy trained by
  bootstrapping on subgoal-conditioned policies "matches or surpasses" state-of-the-art hierarchical
  offline goal-conditioned RL on long-horizon tasks, without a generative model over goals. It does not
  claim hierarchy is useless, but it is direct recent evidence that the *benefit* of explicit hierarchy
  is contested, which the maturity note must carry.

## Maturity and open problems (be honest)

HRL is powerful in principle and genuinely helps in specific regimes (Director on sparse-reward mazes),
but it is notoriously finicky, and several core problems are unsolved:

1. **Skill / subgoal / option discovery is unsolved.** Automatic option learning suffers *option
   collapse* (Option-Critic; corroborated by 2406.00483: unregularized variable-length abstractions
   "tend to degenerate to either one-step (i.e. no) temporal abstraction or to abstractions that span
   the whole sequence"). MI skill discovery (DIAYN) yields *diverse* but not necessarily *task-useful*
   skills. As 2406.00483 puts it, "finding expressive and diverse temporal abstractions without manual
   intervention or the injection of domain specific knowledge is still an open research question."
2. **Non-stationarity / moving target.** Two-level RL hierarchies fight the problem that the low level's
   drift changes the high level's effective action space (HIRO's off-policy correction is a patch).
   Imagination-based hierarchical world models (Director) sidestep it by making the high level's data
   on-policy in the model, which is a major reason they are attractive, but it depends on a good model.
3. **Model exploitation on the abstract level.** The newest and sharpest finding (2406.00483): the
   high-level (coarse) world model is exactly where a high-level planner exploits model error, and a
   carefully built stacked hierarchical world model failed to beat flat methods because of it.
4. **Deep (more than two levels) hierarchy is largely unrealized.** Director notes >2 levels needs
   temporally-abstract dynamics to avoid exponentially longer batches; THICK is an early attempt at the
   adaptive coarse time scale this requires; it is not a settled capability.
5. **The benefit of explicit hierarchy is contested.** Flattening Hierarchies (2025) shows a flat
   policy can match SOTA hierarchical goal-conditioned RL, so "use a hierarchy" is not automatically the
   right move; the design must justify the added machinery.

Net: temporal abstraction is a real, well-defined research area with a clear vocabulary (options,
skills, manager/worker) and a working hierarchical-world-model exemplar (Director), but automatic
discovery, deep multi-level hierarchy, and abstract-level model reliability are open. Any claim this
project makes about multi-level/institutional reasoning must be stated as a hypothesis with these
caveats, not as a solved capability.

## Mapping the area to the project's 4 layers

The repo's layers are Physical, Material/Economic, Social, Institutional/Settlement (see
`hierarchical-wam-for-minecraft-societies.md` and the shared contract). This area maps mainly to the
*cross-layer dependency* and the *Institutional* layer, and supplies vocabulary the other layers reuse.

| Area concept | Layer(s) it informs | How it bears on the project |
|---|---|---|
| Option = initiation + policy + termination (Sutton-Precup-Singh; Option-Critic) | Cross-layer (defines the unit) | Gives a formal name to the repo's "action skill" and "CycleGoal": initiation = typed eligibility/readiness contract, termination = verifier-backed completion. |
| Manager/worker, directional goals (Dayan-Hinton; FeUdal) | Cross-layer; Institutional | The "slow goal over fast primitives" split is the shape of a physical subgoal pursued under a longer social/settlement goal; "goal as direction of change" maps to predicted deltas. |
| Goal-conditioned target state + non-stationarity (HIRO) | Physical; Cross-layer | Argues for pinning a predicted goal's meaning to *fixed verifier evidence* (which the runtime owns) rather than to a drifting learned goal. |
| Skill discovery, predictable-outcome skills (DIAYN, DADS) | Cross-layer | Selection principle: an advisory WAM should model subgoals whose post-state is distinguishable and *verifiable*, not arbitrary ones. |
| Hierarchical world model: plan subgoal in latent (Director, THICK, 2405.18418) | Institutional/Settlement; Cross-layer | The architectural template for predicting at multiple temporal resolutions, so a WAM can reason about multi-cycle routines and post-goal continuation, not just one action. |
| Abstract-level model exploitation; hierarchy may be unnecessary (2406.00483, 2505.14975) | Institutional/Settlement (maturity) | Tempers institutional claims; justifies keeping the higher (abstract) WAM layers *advisory* and verifier-scored, and justifies a simple static temporal abstraction over a fragile learned one. |

Layer-dependency reminder (from the shared contract): physical predictions must be reliable before
social ones are meaningful. Hierarchy does not change this; it adds a *temporal* axis on top of the
*semantic* layering. A high-level social/settlement subgoal ("maintain the shared chest") still bottoms
out in physical subgoals ("deposit 8 planks") whose success the verifier owns.

## Relevance to the original query (mechanically useful vs research contribution)

The original query asks for a *hierarchical* action-conditioned world model. This area supplies the
academic footing for the "hierarchical" requirement and for the survey's hierarchical-WAM open
challenge (connect high-level semantic decomposition to low-level physical prediction).

- **Mechanically useful (borrow as engineering / vocabulary):**
  1. *The options vocabulary* (initiation set, internal policy, termination condition, policy over
     options, SMDP) as the precise language for the repo's action skills and subgoals, so the hierarchy
     reads as an instance of a known framework rather than a local coinage.
  2. *Subgoal-conditioned prediction* as a structure: an advisory WAM can predict and score consequences
     *conditioned on a named subgoal* at a coarser time scale (Director's manager/worker shape), so it
     can reason about a multi-cycle routine, not only the next single action. This is the direct answer
     to "how would temporal abstraction let an advisory WAM reason about multi-cycle social/settlement
     horizons": predict the coarse delta a subgoal would cause and score it against the accumulated
     verified deltas over the cycles the subgoal spanned.
  3. *Static, fixed-interval temporal abstraction* as a defensible simplification when the goal is
     prediction/observation rather than peak control (2406.00483), avoiding option collapse and the
     moving-target problem.
  4. *The predictable-and-verifiable selection principle* (DADS): model the subgoals whose effects are
     cleanly checkable, not arbitrary latent goals.

- **Research contribution (NOT to adopt as runtime authority, cite as lineage):** every method here
  *acts* by RL, training a manager/worker or options to *select* behavior (FeUdal's transition policy
  gradient, Option-Critic's option gradients, HIRO's off-policy correction, Director's manager learned
  in imagination, DIAYN's MI objective). The repo's WAM is advisory: it predicts and evaluates, and the
  LLM proposes while the runtime verifies. So this area is the conceptual and architectural ancestor of
  a *hierarchical advisory WAM*, not a control loop to import. The genuinely novel, defensible thing the
  project could add on top of this area is the empty cell named in
  `hierarchical-wam-for-minecraft-societies.md`: action-conditioned, *structured social-material*
  transition prediction across temporal resolutions, scored against deterministic verifier evidence,
  with prediction and action kept as separate axes, small-N and falsifiable.

One-sentence tie: this area gives the project an academic name and a working template (Director) for
predicting at multiple time scales, so its 4-layer advisory WAM can reason about multi-cycle social and
settlement horizons as subgoal-conditioned predictions, while the field's open problems (skill discovery,
abstract-level model exploitation, contested benefit of hierarchy) require those longer-horizon claims to
stay modest and verifier-scored.
