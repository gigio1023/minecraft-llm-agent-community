# Research area: Affordances, and Causal / Counterfactual World Models

What this area is (one line): two linked computational fields, (A) affordances = modeling which actions a state makes possible or blocks, and (B) causal / counterfactual world models = modeling the EFFECT of an action (an intervention) and answering "what if". Together they own the two phrases in the original query that the wave-1/2 theme files do not survey: "future action opportunities" (A) and "predict and evaluate how actions transform state" (B).

Audience: a newcomer. Every term is defined once, then used. Companions (cite, do not duplicate):
- `wam-foundations.md`: the formal `p(o', a | o, l)` WAM definition.
- `wam-training-evaluation-and-open-problems.md`: owns the survey's proposed Counterfactual-Consistency / Foresight-Conditioned-Success metrics and the eval-decoupling gap. This file connects causal evaluation TO that metric; it does not re-derive it.
- `sociology-grounding-for-social-wam.md`: owns Ostrom / commons; `llm-social-simulation.md`: owns Generative Agents. This file is the technical causal/affordance field only.
- `hierarchical-wam-for-minecraft-societies.md`: owns the multi-layer-architecture question.

---

## Glossary (defined once)

Affordance side:
- Affordance (Gibson, ecological psychology, 1979): an action possibility that an environment offers an agent. Gibson's slogans, as cited by the RL works: "chairs afford sitting, cups afford grasping, doorways afford passage." The key idea is that the possibility is a RELATION between agent and environment, not a property of either alone.
- Learned affordance: a model that predicts, from state, which actions are available or worthwhile, instead of hand-listing them.
- Affordance-conditioned policy / planning: using the afforded subset to restrict what a policy or planner even considers (so it does not branch over the full action space).
- Precondition-based affordance (Abel 2014, Khetarpal 2020): an affordance defined as "the subset of actions available when the state satisfies certain preconditions." This is the framing closest to a typed-eligibility runtime.

Causal side:
- Correlational model: predicts the next state from ALL inputs by fitting observed associations. Picks up spurious correlations (associations that hold in the training data but are not causal).
- Causal model: predicts each variable only from its DIRECT CAUSES (its "parents" in a causal graph), so predictions do not depend on variables that merely co-vary.
- Structural Causal Model (SCM, Pearl): a set of variables, a directed acyclic graph (DAG) of cause->effect edges, and a "structural equation" per variable mapping its parents + noise to its value.
- Intervention / do-operator (do(X=x)): forcing a variable to a value and CUTTING its incoming causes, then propagating. This is how you compute the effect of an action, as opposed to merely observing a correlation. The query's "how actions transform state" is, formally, a do-operation.
- Counterfactual: "what WOULD have happened if, in this same situation, the action had been different?" Pearl's recipe is abduction (infer the hidden noise from what was observed), action (apply the do-intervention), prediction (re-evaluate). It is strictly more than intervention because it conditions on the actual observed outcome first.
- Causal dynamics: a transition model whose structure is the causal graph between state variables across a time step.
- Structural minimality (CoDA): a variable is a parent (a true cause) only if changing it has a nonzero DIRECT effect on the child. The discipline that separates a causal edge from a correlation.

---

## Part A: Affordances (the "future action opportunities" field)

Central question: which small set of actions is worth considering in this state, and how does an action CHANGE that set?

### A.1 Genealogy and key works (source-backed)

- Gibson 1979, "The Ecological Approach to Visual Perception" (book, docs-level, manifest `gibson-1979-ecological-approach`): coined "affordance" as a directly-perceived action possibility offered by the environment. Every RL affordance paper traces here. Mechanically useful: it gives the project the right WORD for "what an action makes newly possible." Not a research contribution by itself.
- Abel et al. 2014/2015 (cited inside GrASP `2202.04772` related work): first RL formalization. An affordance is the action subset available when a state meets PRECONDITIONS expressed by propositional functions; learned in a scaffolded multi-task curriculum; shown to cut planning time. Limited to Object-Oriented MDPs (objects/classes/attributes baked into the state).
- Khetarpal, Ahmed, Comanici, Abel, Precup 2020, "What can I do here? A Theory of Affordances in RL" (`2006.15085`, ICML 2020, abstract-level): the cleanest theory. What it introduced and why it matters: affordances play a DUAL role, (1) faster planning by shrinking the action set per state, and (2) "more efficient and precise learning of transition models," because you only have to model the dynamics of AFFORDED actions, i.e. a PARTIAL transition model. This dual role is the direct bridge from affordances (Part A) to world models (Part B): affordances make the world model cheaper to learn AND to query.
- Veeriah, Zheng, Lewis, Singh 2022, "GrASP: Gradient-Based Affordance Selection for Planning" (`2202.04772`, ICML 2022, LaTeX deep-read, see `notes/by-paper/2202.04772-...`): what it introduced: affordances as parametric state(+goal)->action mappings, learned by backpropagating gradients THROUGH a planner so the planner branches over only K affordances in a continuous action space. Why it matters here: it is the sharpest statement that "future action opportunities" = a learnable, state-conditional restriction of the action set. Honest scope: the authors explicitly do NOT claim SoTA; the gradient-through-planner mechanism targets continuous-action tree search, which this repo (discrete schema-bound tool menu) does not have.
- Robotics/vision affordance-learning thread (abstract-level breadth): VRB "Affordances from Human Videos" (`2304.08488`, CVPR 2023), "Learning Precise Affordances from Egocentric Videos" (`2408.10123`), "Hierarchical Affordance Discovery via Intrinsic Motivation" (`2009.10968`), "Affordance-Guided RL via Visual Prompting" (`2407.10341`), "LLM-Guided Task/Affordance-Level Exploration" (`2509.16615`). What this thread introduced: learning WHERE and HOW to act on objects from video / foundation models. Why it matters less here: it is pixel/grasp-pose centric (contact points, manipulation regions), whereas the repo's affordance is symbolic (which Action Card is eligible). Useful as evidence that "predict what an object affords" is a mature, separable prediction target; not mechanically portable.

### A.2 Sub-threads
- Affordance for PLANNING (shrink the branch factor): Abel, Khetarpal, GrASP.
- Affordance for EXPLORATION (act where something is possible): intrinsic-motivation and LLM-guided affordance exploration (`2009.10968`, `2509.16615`).
- Affordance for PERCEPTION/manipulation (where to grasp/contact): the video/robotics thread (`2304.08488`, `2408.10123`).

---

## Part B: Causal / counterfactual world models (the "predict the effect of an action" field)

Central question: does the model capture the EFFECT of an intervention (do-operator), not just correlations, and can it answer "what if the action were different" (counterfactual)? Why it is wanted: causal structure is the property that makes a predictor generalize to unseen states and assign credit correctly.

### B.1 Genealogy and key works (source-backed)

- Pitis, Creager, Garg 2020, "Counterfactual Data Augmentation using Locally Factored Dynamics (CoDA)" (`2007.02863`, NeurIPS 2020, LaTeX deep-read, see `notes/by-paper/2007.02863-...`): what it introduced: Local Causal Models (LCMs). Globally "there are almost no true zeros" (every variable can influence every other at SOME step), but LOCALLY (between sparse interactions) subprocesses are causally independent; conditioning on that subspace yields a sparser local DAG. CoDA then mints causally-valid counterfactual transitions by SWAPPING independent sub-process slices between two factual transitions, with NO forward dynamics model. Why it matters most here: it operates on structured, object-decomposed transitions and it explicitly names Minecraft as such a setting. The do-operator is taught directly in this paper as the formal object for "the effect of forcing a variable."
- Wang, Xiao, Xu, Zhu, Stone 2022, "Causal Dynamics Learning for Task-Independent State Abstraction (CDL)" (`2206.13452`, ICML 2022, LaTeX deep-read, see `notes/by-paper/2206.13452-...`): what it introduced: learn the causal dynamics graph by a per-edge conditional-independence test (Conditional Mutual Information with a masking architecture), then split state variables into CONTROLLABLE (action descendants), ACTION-RELEVANT (ancestors of controllable, gate the action), and ACTION-IRRELEVANT (ignorable). Why it matters most here: the trichotomy is a near one-to-one typing for an advisory WAM's predicted-delta schema, and CDL's headline result is the generalization claim: dense (correlational) models drop 60-90% accuracy on out-of-distribution states while the causal model holds. This is the empirical backbone for "causal structure helps generalization."
- Zhu et al. 2022, "Offline RL with Causal Structured World Models (FOCUS)" (`2206.01474`, LaTeX skim): what it introduced: a theoretical result that a causal world model has a TIGHTER generalization-error bound than a dense one, plus an algorithm (FOCUS) that recovers and uses the causal structure for offline RL. Why it matters: it is the formal "why causal beats dense" complement to CDL's empirical version. The term "causal structured WORLD MODEL" is theirs.
- Chen et al. 2022, "Adversarial Counterfactual Environment Model Learning (GALILEO)" (`2206.04890`, abstract-level): what it introduced: an environment (action-effect) model trained to be correct on COUNTERFACTUAL data queried by adversarial policies, so it generalizes to actions not in the data. Why it matters: it directly targets "predict the effect of an action you have not seen," the advisory WAM's core job, and shows naive fitting gives unreliable counterfactual predictions.
- CoDA follow-ups and causal-augmentation thread (abstract-level): MoCoDA "Model-based Counterfactual Data Augmentation" (`2210.11287`, NeurIPS 2022, applies a learned locally-factored model to an augmented state/action distribution), and Causal Information Prioritization (`2502.10097`, 2025, uses counterfactual augmentation to prioritize high-impact state features). They extend CoDA's data idea.
- Counterfactual reasoning for agents (recent, abstract-level): "Abduct, Act, Predict (A2P)" (`2509.10401`, 2025) operationalizes Pearl's three-step counterfactual loop (abduction -> intervention -> prediction) as an explicit reasoning scaffold; the embodied-world-model survey (`2510.16732`, 2025) frames world models as internal simulators supporting "forward and counterfactual rollouts," with GAIA-2's driving counterfactual ("what if a pedestrian stepped out now?") as a concrete instance.

### B.2 Surveys (orientation, abstract-level)
- Deng, Jiang, Long, Zhang 2023, "Causal Reinforcement Learning: A Survey" (`2307.01452`, TMLR, LaTeX skim for taxonomy): organizes causal RL by target problem and method.
- Zeng et al. 2023, "A Survey on Causal Reinforcement Learning" (`2302.05209`): splits methods by whether causal info is given a priori, across MDP/POMDP/bandit/DTR.
- 2025 "Unifying Causal Reinforcement Learning" (`2512.18135`): a more recent taxonomy. Use these for the lay of the land; the cornerstones above carry the mechanisms.

### B.3 Sub-threads and why causal structure helps (the newcomer's "why bother")
- Generalization: causal models predict from parents only, so they do not break when a non-causal variable goes out of distribution (CDL's 60-90% gap; FOCUS's tighter bound).
- Credit assignment / sample efficiency: knowing which state dims causally drive a reward lets you ignore the rest (CDL's abstraction; Causal Information Prioritization).
- Counterfactual data without a simulator: local independence lets you mint valid "what if" transitions by swapping sub-blocks (CoDA, MoCoDA).
- Counterfactual EVALUATION: perturb the prediction, check the action responds (the survey's Counterfactual-Consistency, owned by `wam-training-evaluation-and-open-problems.md`).

---

## Maturity and open problems (honest)

- Affordances in RL are well-defined theoretically (Khetarpal 2020) but affordance LEARNING at scale is dominated by pixel/manipulation settings; SYMBOLIC affordance PREDICTION (predicting how a discrete action changes a typed eligibility set) is barely studied as such. PREDICTING the affordance-set DELTA is essentially open.
- Causal dynamics learning is proven on LOW-DIMENSIONAL, FACTORED, FULLY-OBSERVABLE state spaces (CDL's own stated limitation; CoDA assumes a single known decomposition). The assumptions that buy the guarantees (faithfulness, full observability, per-variable-independent transitions, structural minimality with a clean decomposition) are SHAKIER for social state, where intent is hidden, effects are partner-dependent, and social variables are correlated.
- Counterfactual competence in learned latent spaces is, per the 2025 embodied-WM survey, "an active research frontier"; even partial competence is framed as helpful, not solved.
- No surveyed work applies either field to a MINECRAFT SOCIAL/material state. The transport is the repo's contribution surface, not a citable result.

---

## Mapping to the 4 WAM layers

| Layer | Affordance angle (Part A) | Causal/counterfactual angle (Part B) |
| --- | --- | --- |
| Physical | A placed crafting table affords crafting; a mined block opens a path; a 0-durability tool UN-affords mining. Affordance-set delta = the layer's "newly available/blocked affordances" (proven ground: GrASP, Khetarpal). | CDL's controllable/action-relevant/action-irrelevant trichotomy IS physical-consequence typing; CoDA swaps physical sub-processes; do(place block) -> predicted block/inventory delta. Strongest evidence here. |
| Material / economic | Possession/claim changes alter WHO can use a station (a claimed chest is un-afforded to others). | "What if Alice lends the pickaxe?" is a do-intervention on possession; local factorization (CoDA) is the natural template for possession/obligation counterfactuals. Research extension, unproven. |
| Social | A returned tool restores the borrowing relation (re-affords a future request); an accepted promise affords a future ask. "Social affordance" is NOT in the surveyed literature. | A2P's abduction-action-prediction loop is the shape of social what-if ("what if I refuse?"); but social counterfactual validity is unproven and the local-independence test is far less crisp socially. Research contribution. |
| Institutional / settlement | Stable affordance patterns (who routinely may use the shared furnace) = conventions; hierarchical affordance discovery (`2009.10968`) gestures at this but stops at single-agent. | Causal structure over long horizons (which routines cause settlement persistence) is the hierarchical open problem (see `hierarchical-wam-for-minecraft-societies.md`). Least mature. |

Dependency reminder (from the shared contract): physical predictions must be reliable before social ones are meaningful. Both fields agree: CDL/CoDA prove the PHYSICAL/factored case; the social layers are extrapolation.

---

## Relevance to the original query

The query asks whether a hierarchical action-conditioned WAM can "predict and evaluate how Minecraft actions transform ... future action opportunities." This lane shows that phrase decomposes into two studied objects:

1. Affordances ARE "future action opportunities." Predicting how a candidate action changes the AFFORDED SET (what becomes possible or blocked) is the literal realization of that clause. The mechanically-useful import is the precondition-based framing (Abel 2014, Khetarpal 2020): it aligns affordance theory with the repo's existing typed-eligibility gates with NO new planner, and Khetarpal's "affordances enable PARTIAL transition models" justifies a cheap advisory WAM that predicts consequences only for the afforded actions. The research-contribution surface is predicting the affordance-set DELTA across material/social state, which no surveyed work does.

2. Causal / counterfactual modeling IS the advisory WAM's predict-and-evaluate function. Formally, "predict the effect of action a" = compute the post-do(a) next-state distribution; "evaluate what if Alice lends the pickaxe" = a counterfactual query. The mechanically-useful imports are concrete: CDL's controllable/action-relevant/action-irrelevant trichotomy as the typing discipline for the predicted-delta schema; CoDA's structural-minimality + local-factorization to mint cheap counterfactual transitions from the verifier's already-free (o,a,o') triplets and to query effects by re-evaluating only affected sub-blocks; FOCUS/CDL's central finding that a causal (parent-only) model generalizes to unseen states where a dense model collapses (60-90%), which for a SOCIAL WAM is the difference between a prediction that transfers to a new actor pair and one that only memorized seen pairs. The research-contribution surface is showing that result holds for SOCIAL/material state in Minecraft, and connecting the advisory WAM's counterfactual answers to the survey's proposed Counterfactual-Consistency metric (owned by `wam-training-evaluation-and-open-problems.md`) as a structured-state evaluation.

One-sentence tie: affordance prediction operationalizes the query's "future action opportunities," and causal/counterfactual modeling IS the query's "predict and evaluate how actions transform state," so this lane supplies both the formal vocabulary and the load-bearing generalization argument for the advisory WAM, while honestly flagging that every result is proven only on physical/factored state and the social transport is unproven.
