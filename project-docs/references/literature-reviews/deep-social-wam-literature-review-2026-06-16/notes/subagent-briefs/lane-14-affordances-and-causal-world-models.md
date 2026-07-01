# Lane 14 brief: Affordances, and Causal / Counterfactual World Models (G3)

Lane name: affordances + causal/counterfactual world models (wave-3 research-area mapping).

## Sources reviewed (count + list)

19 manifest rows. LaTeX deep-read (5 fetched, 3 written up as by-paper notes):
- `2206.13452` Causal Dynamics Learning (CDL), ICML 2022 [by-paper note, LaTeX].
- `2202.04772` GrASP gradient-based affordance selection, ICML 2022 [by-paper note, LaTeX].
- `2007.02863` CoDA counterfactual data augmentation, NeurIPS 2020 [by-paper note, LaTeX].
- `2307.01452` Causal RL survey (Deng), TMLR 2023 [LaTeX, skim for taxonomy].
- `2206.01474` FOCUS causal structured world models, 2022 [LaTeX, skim for claims].

Abstract-level (verified IDs, manifest only):
- Affordances: `2006.15085` Khetarpal "What can I do here?" (ICML 2020), `2304.08488` VRB, `2408.10123`, `2009.10968`, `2407.10341`, `2509.16615`, `gibson-1979` (book).
- Causal/counterfactual: `2210.11287` MoCoDA, `2206.04890` GALILEO, `2502.10097` Causal Information Prioritization, `2302.05209` Zeng causal-RL survey, `2512.18135` 2025 unifying survey, `2509.10401` A2P abduction-act-predict, `2510.16732` embodied-WM survey.

Counts: sources found 19; LaTeX downloaded 5; PDF-only 0; abstract-only 14 (1 of which is a book, docs-level).

## Strongest findings (source-backed)

1. CDL (`2206.13452`) gives an almost one-to-one structured-state template for an advisory WAM: it learns a causal dynamics graph over TYPED state variables and splits them into controllable (action descendants), action-relevant (gate the action), and action-irrelevant (ignorable). Its headline empirical result is the generalization argument the whole lane rests on: dense (correlational) models drop 60-90% prediction accuracy on out-of-distribution states while the causal model holds near in-distribution accuracy. That trichotomy maps directly onto the repo's typed-delta schema, and the generalization claim is the reason a causal social WAM would transfer to unseen actor pairs rather than memorize seen ones.

2. CoDA (`2007.02863`) shows you can mint causally-valid counterfactual transitions by swapping locally-independent sub-process slices WITH NO forward dynamics model, and it explicitly names Minecraft as a setting where the needed object-decomposed state exists for free. This fits the repo exactly: the verifier already emits object-decomposed (o,a,o') triplets at ~$0 labeling cost, so counterfactual "what if Alice lends the pickaxe" can in principle be assembled by swapping possession/obligation sub-blocks. The do-operator is the formal object behind the query's "predict the effect of an action."

3. The affordance field (GrASP `2202.04772`, Khetarpal `2006.15085`) supplies the exact formalization of the query's "future action opportunities": an affordance is a state(+goal)-conditional restriction of the action set, and Khetarpal's dual-role result ("affordances enable PARTIAL transition models") is the bridge to world models, it justifies a CHEAP advisory WAM that predicts consequences only for the afforded actions. The precondition-based framing (Abel 2014, Khetarpal 2020) aligns with the repo's existing typed-eligibility gates without adding any planner.

## Weak or uncertain claims (could not verify)

- Every causal/affordance result is proven only on LOW-DIMENSIONAL, FACTORED, FULLY-OBSERVABLE, often PHYSICAL state (robot arms, chemical objects, billiards). Transport to Minecraft SOCIAL/material state is unproven; the guaranteeing assumptions (faithfulness, full observability, per-variable-independent transitions, a clean known decomposition, structural minimality) are shakier socially (hidden intent, partner-dependent effects, correlated social variables). I label all social-layer mappings as research extensions, not citable results.
- Code/repro: CDL and CoDA report public repos (CausalDynamicsLearning, spitis/mrl); I did not clone or run them, so reproducibility is "partial" on author report. GrASP states no code (claim-only). FOCUS/GALILEO claim-only.
- Author lists for several abstract-level rows are marked "(authors per arXiv <id>)" where I did not open the page; IDs themselves are verified.
- Biggest single unverified item: A2P (`2509.10401`) surfaced via a web summary describing it as "DeepScientist-authored"; I did not open the PDF, so treat its provenance and exact claims as an UNVERIFIED REPORT CLAIM. It is cited only as an illustration of the abduction-act-predict counterfactual shape, not as evidence.

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful (borrow as engineering): CDL's controllable/action-relevant/action-irrelevant typing for the predicted-delta schema; CoDA's structural-minimality + local-factorization to (a) enlarge training data and (b) query an action's effect by re-evaluating only affected sub-blocks from already-free verifier triplets; the precondition-based affordance framing as vocabulary for the repo's typed-eligibility gates; Khetarpal's "affordances -> partial transition model" as the argument for a lightweight advisory predictor.
- Research contribution (novel if done here): predicting the affordance-set DELTA across material/social state; transporting CDL's generalization result and CoDA's counterfactual swap to SOCIAL transitions; a "social affordance" notion; and connecting the advisory WAM's counterfactual answers to the survey's Counterfactual-Consistency metric as a structured-state evaluation.
- Hard guardrail: both fields stay ADVISORY. Affordance prediction must not auto-unlock a tool; counterfactual prediction must not act or fill args. The runtime's typed eligibility and verifier remain the authority; the WAM only forecasts what they WILL be. Do NOT import GrASP's gradient-through-planner mechanism (it solves a continuous-action tree-search problem the repo's discrete tool menu does not have, and would add the hidden planner the SPEC forbids).

## Recommended next questions

1. Can the causal graph be recovered OFFLINE from logged verifier triplets (skipping CDL's expensive active exploration), and does the controllable/action-relevant/action-irrelevant split fall out cleanly for typed Minecraft+social state?
2. What is the social analogue of CoDA's "local independence" test (when did two actors actually interact this step), and how often does it misfire vs the crisp physical "arms far apart" case?
3. Is predicting the affordance-set delta (which Action Cards become eligible/ineligible after an action) a tractable, verifiable advisory output, and does its accuracy degrade gracefully (per Khetarpal's partial-transition-model idea) when only afforded actions are modeled?
4. Does CDL's 60-90% dense-vs-causal generalization gap reproduce on a structured social/material delta, i.e. does a parent-only social WAM transfer to unseen actor pairs better than a dense one? (This is the single highest-value experiment the lane points to.)
