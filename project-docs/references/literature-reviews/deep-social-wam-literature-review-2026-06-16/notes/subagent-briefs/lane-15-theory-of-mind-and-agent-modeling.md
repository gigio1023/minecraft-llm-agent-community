# Lane 15 brief: Theory of Mind, agent/opponent modeling, emergent norms

Lane: 15 (G4), wave 3 research-area mapping.
Owned theme file: `notes/by-theme/research-area-theory-of-mind-and-agent-modeling.md`.
Area in one line: the computational field of predicting OTHER agents, their hidden
mental states (ToM), their policy (agent/opponent modeling), and how shared behavior
regularities emerge without central design (emergent norms/conventions).

## Sources reviewed

Counts: 17 sources logged in `raw-search-results/lane-15-manifest.jsonl`. 8 deep-read
from LaTeX, 9 abstract-level. 0 PDF-only. Plus 3 already-covered sources cited, not
rewritten (GovSim 2404.16698, public-sanctions 2106.09012, Bicchieri/Elster).

Deep-read (LaTeX), with by-paper notes:
- 1802.07740 Machine Theory of Mind (ToMnet), Rabinowitz et al., ICML 2018. [required cornerstone]
- 1709.08071 Autonomous Agents Modelling Other Agents (survey), Albrecht and Stone, AIJ 2018. [required cornerstone]
- 2407.07086 Hypothetical Minds, Cross et al., ICLR 2025. [closest mechanical analogue]
- 2411.12977 MindForge, Lica et al., NeurIPS 2025. [Minecraft + ToM]
- 2410.08948 Emergent social conventions in LLM populations, Ashery/Aiello/Baronchelli, Science Advances 2025.
- 2302.08399 Ullman, LLMs Fail on Trivial Alterations to ToM Tasks, 2023. [the balance/critique]
- 2108.01843 Model-Based Opponent Modeling (MBOM), Yu et al., NeurIPS 2022.
- 1709.04326 LOLA, Foerster et al., AAMAS 2018 (LaTeX fetched; covered at method level).

Abstract-level (manifest rows only): 2302.02083 Kosinski (the "emerged" claim),
2310.15421 FANToM, 2402.15052 ToMBench, 2310.19619 situated-ToM landscape,
2310.10701 ToM for multi-agent collaboration, 2412.10270 Cultural Evolution of
Cooperation (Donor Game), 1810.08647 Social Influence as Intrinsic Motivation,
2502.15676 AutoToM, 2401.08743 MMToM-QA.

## Strongest findings (source-backed)

1. Modeling other agents is the Social-layer bottleneck, not dialogue. GovSim
   (2404.16698) found belief-about-others accuracy correlates r=0.83 with community
   survival. This is the empirical core tying this whole area to the query.
2. There is a directly transferable advisory architecture. Hypothetical Minds
   (2407.07086) generates a natural-language prediction of another agent's strategy,
   scores it by predictive fit against observed behavior (Rescorla-Wagner, approx MAP),
   refines it, and lets a validated hypothesis CONDITION the plan while a separate module
   + hardcoded action planner own execution. Reward rises only after a hypothesis
   validates. That is an advisory Social WAM that predicts-and-evaluates but never
   executes, the repo's own rule, demonstrated to beat billion-step MARL on Melting Pot.
3. False belief is a learnable, observability-grounded prediction. ToMnet (1802.07740)
   learns purely from behavior that an agent whose object moved out of sight keeps acting
   on a false belief, and can report belief states explicitly. In Minecraft this maps to
   a loggable, verifiable test (field of view -> belief -> predicted action).
4. Conventions emerge bottom-up in LLM populations, with two cautions. Baronchelli
   (2410.08948): a global convention emerges from purely local coordination (naming
   game), but a collective bias appears even when individuals are unbiased, and a ~25%
   committed minority can flip an established convention. So a settlement WAM cannot
   infer the convention from individual priors, and norm robustness has a measurable
   tipping point.

## Weak or uncertain claims (what I could not verify or what is contested)

- LLM theory of mind is contested. Kosinski (2302.02083) claims it emerged; Ullman
  (2302.08399) shows the successes flip under trivial, principle-preserving perturbations
  (transparent container, cannot read, trusted informant). Balanced verdict: state
  benchmark-bounded performance with documented fragility, never "has ToM."
- ToM/agent-modeling tied to a physical-material substrate is essentially unstudied.
  MindForge (2411.12977) is the only Minecraft-grounded ToM source and its gains are
  cooperative tech-tree progress, not the project's possession/claim/obligation
  questions. Predicting social-material consequences from a ToM model is the gap.
- Emergent cooperation is model- and seed-dependent (Vallinder and Hughes 2412.10270,
  abstract-level), so "LLM societies cooperate" is not a stable claim.
- I did not deep-read LOLA's experiments beyond the verified abstract/method; the
  cooperation-in-IPD result is reported at that level.
- The Hypothetical Minds code_url was not visible on the abstract page, so I left it
  blank in the manifest rather than assert an unverified GitHub URL.

## Implications for this repo

Mechanically useful (borrow now):
- A per-actor advisory Social WAM = the Hypothetical Minds loop: predict the actor's next
  action, score against the verifier-confirmed observed action, keep while it predicts.
  Cheap (only re-hypothesize when the current model stops predicting).
- Prediction-target + false-belief-test schema from ToMnet; BigToM/BDI belief schema from
  MindForge (already on Mineflayer); naming-game + critical-mass robustness test from
  Baronchelli; SanctionEvent schema from public-sanctions (2106.09012).
- Albrecht-Stone taxonomy + "task-adequacy not correctness" rubric for scoping/evaluating.
- Keep recursion shallow (depth 1-2; behavioral game theory and MBOM agree).

Research contribution (and overclaim guardrail):
- Novelty would be tying agent modeling/ToM to the material economy and predicting
  social-material deltas (cost to others, trust shifts), verifier-scored.
- Guardrail (Ullman): never claim the actors/WAM "have theory of mind"; claim only
  bounded predictive accuracy under perception-grounded perturbations, scored against
  verifier evidence. No civilization-scale framing.

## Recommended next questions

1. Can a single advisory "predict the other actor's next Action Card + claimed
   affordance, then score against the verifier" loop be added without it ever gating
   action selection (the repo's hard advisory line)?
2. What is the minimal world-anchored false-belief test in this runtime (perception ->
   belief -> predicted action over a moved container), and does any model pass its
   principle-preserving perturbations (transparent vs opaque storage, in-view vs not)?
3. For emergent conventions, which repo behavior is the cleanest "naming game" (shared
   worksite label, tool-sharing custom, storage-location convention), and what is the
   committed-minority tipping point in the `weak_commons` dispute scenarios?
4. Does predicting another actor's behavior actually improve the predicting actor's
   social-material outcomes in this economy (the GovSim r=0.83 question, but with
   verifier-grounded possession instead of declared numbers)?
