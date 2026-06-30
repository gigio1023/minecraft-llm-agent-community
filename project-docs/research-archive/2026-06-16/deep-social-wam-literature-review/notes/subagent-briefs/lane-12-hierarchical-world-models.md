# Lane 12 brief: hierarchical and temporally-abstract world models and RL

Wave-3 research-area lane (G1). Area surveyed: temporal abstraction and hierarchy in reinforcement
learning (RL) and world models, options, feudal/manager-worker hierarchies, skill/subgoal discovery,
hierarchical planning, and hierarchical world models like Director. Owned theme file:
`notes/by-theme/research-area-hierarchical-world-models.md`.

## Lane name

Lane 12 (G1): hierarchical and temporally-abstract world models and RL.

## Sources reviewed (18 total: 6 LaTeX deep-read, 1 LaTeX-fetched, 8 abstract, 2 docs, plus the LLM-decomposition trio counted in the 8 abstract)

Deep-read (LaTeX): Director 2206.04114 (cornerstone), FeUdal Networks 1703.01161, Option-Critic
1609.05140, HIRO 1805.08296, DIAYN 1802.06070, hierarchical-world-model-limits 2406.00483 (maturity
anchor). LaTeX fetched (manifest-level note): HAC / Learning Multi-Level Hierarchies with Hindsight
1712.00948. Abstract-level: VIC 1611.07507, DADS 1907.01657, THICK (ICLR 2024, OpenReview TjCDNssXKU),
humanoid hierarchical WM 2405.18418, Shaj dissertation 2404.16078, Flattening Hierarchies 2505.14975,
DEPS 2302.01560, Plan4MC 2303.16563, GITM 2305.17144. Docs-level canonical: Sutton-Precup-Singh 1999
(options), Dayan-Hinton 1993 (feudal RL).

By-paper notes written: Director, FeUdal, Option-Critic, HIRO, DIAYN, hierarchical-WM-limits.

## Strongest findings (source-backed)

1. **A working academic template for the query's "hierarchical" requirement exists: Director
   (2206.04114).** A high-level manager picks a subgoal *as a discrete code in a learned world-model
   latent* every K=8 steps; a low-level worker reaches the decoded latent goal (max-cosine reward).
   It removed HRL's old need for a hand-specified goal space and beat flat RL on sparse-reward
   long-horizon tasks. This is the direct precedent for "plan a subgoal in a learned latent, then act"
   that a hierarchical WAM needs, with the caveat that Director's manager *acts* while this repo's WAM
   must stay advisory. (LaTeX `papers/latex/2206.04114/method.tex`, `discussion.tex`.)
2. **The field gives the project a precise vocabulary, not a local coinage.** Options
   (Sutton-Precup-Singh 1999; Option-Critic 1609.05140) define a "skill" as initiation set + internal
   policy + termination condition over a semi-MDP, and feudal RL (Dayan-Hinton 1993; FeUdal 1703.01161)
   defines manager/worker with goals as *directions of change*. These map cleanly onto the repo's action
   skills and CycleGoals (initiation = typed eligibility, termination = verifier completion, goal = a
   predicted delta).
3. **Hierarchical world models are promising but unproven, and the newest evidence cuts against naive
   stacking (2406.00483).** A careful stacked hierarchical world model "did not outperform traditional
   methods" and fails via "model exploitation on the abstract level"; HRL also suffers option collapse
   (Option-Critic) and non-stationarity (HIRO), and a 2025 NeurIPS Spotlight (Flattening Hierarchies
   2505.14975) shows a flat policy can match SOTA hierarchical goal-conditioned RL. This is the
   strongest literature justification for keeping the higher (abstract/institutional) WAM layers
   *advisory and verifier-scored*: the exact failure documented (a high-level model exploited by a
   high-level planner) is structurally impossible if the higher-level model never acts.

## Weak or uncertain claims (could not fully verify)

- **THICK has no clean single arXiv id I could confirm.** It is real (ICLR 2024, OpenReview TjCDNssXKU,
  github.com/CognitiveModeling/THICK), but I did not find an arxiv.org/abs id in the time budget;
  recorded at abstract/repo level keyed on OpenReview. I did NOT fabricate an arXiv id. This is the
  biggest single unverified item.
- **Dayan-Hinton 1993 and Sutton-Precup-Singh 1999 are docs-level (no arXiv).** Their primary-source
  content for this brief is drawn through papers that cite them (Vezhnevets et al. 2017; Bacon et al.
  2016; Schiewer et al. 2024), not from the originals directly.
- **The LLM-decomposition trio (DEPS, Plan4MC, GITM) is abstract-level only.** Their deep behavior is
  another lane's job (Minecraft-agent themes); here they are logged only as the "high-level semantic
  decomposition" half of the survey's hierarchical-WAM challenge.
- **Seed corrections (recorded in the search log):** 1712.00948 title is "Learning Multi-Level
  Hierarchies with Hindsight" (HAC is the method name, not the title); guessed id 2408.13384 was a
  cosmology paper (rejected, not logged); 2404.16078 is a Shaj PhD dissertation, not the Gumbsch THICK
  paper.

## Implications for this repo (mechanically useful vs research contribution)

- **Mechanically useful (borrow):** the options vocabulary (initiation/policy/termination, SMDP) as the
  name for the repo's skills/subgoals; subgoal-conditioned prediction as a structure (predict and score
  the coarse delta a subgoal would cause over the cycles it spans, against accumulated verified deltas);
  a static fixed-interval temporal abstraction as a defensible simplification when the goal is
  prediction not peak control (2406.00483); the DADS principle that a good subgoal is one whose outcome
  is predictable and verifiable.
- **Research contribution (do NOT adopt as runtime authority):** every method here *acts* by RL
  (FeUdal's transition policy gradient, Option-Critic's option gradients, HIRO's off-policy correction,
  Director's manager learned in imagination, DIAYN's MI objective). The repo's WAM is advisory and the
  LLM proposes while the runtime verifies, so this area is the architectural ancestor of a hierarchical
  *advisory* WAM, not a control loop to import. Cite as lineage. (Cross-ref the capstone
  `hierarchical-wam-for-minecraft-societies.md` for the project's own empty-cell contribution.)

## Recommended next questions

1. Concretely, what is the *coarse delta schema* for a multi-cycle subgoal (for example "maintain the
   shared chest over N cycles"), and how is it scored against accumulated verified deltas without
   letting the abstract model gain any authority? (This is the project's version of THICK's adaptive
   coarse time scale, kept advisory.)
2. Should the repo's subgoal selection use the DADS "predictable-outcome" filter, that is, only model
   subgoals whose post-state the verifier can cleanly check, and skip subgoals whose effects are not
   verifiable?
3. Given 2406.00483 and 2505.14975, is *any* explicit institutional-layer hierarchy worth the
   complexity for the project's small-N goals, or should the institutional layer be expressed as
   *observed recurring verified sequences* (a routine = repeated verified behavior, per the capstone)
   rather than a learned high-level model at all?

## Connections to existing themes (cite, do not duplicate)

- `wam-lineage-rl-and-latent-dynamics.md`: the flat world-model lineage (Dreamer/PlaNet/MuZero/TD-MPC2)
  this lane adds the hierarchy axis to; Director reuses DreamerV2's vector-of-categoricals and the
  Dreamer imagination training.
- `hierarchical-wam-for-minecraft-societies.md`: the project's recommended advisory 4-layer WAM; this
  lane is its academic footing and supplies the maturity caveats for the institutional layer.
- `wam-foundations.md`, `wam-training-evaluation-and-open-problems.md`: the WAM survey's
  hierarchical-world-action-modeling open challenge, which this lane maps the field onto (not re-derived).
- `minecraft-vla-and-visual-policy.md`, `minecraft-agent-benchmarks.md`: deep behavior of the
  LLM-decomposition Minecraft agents (DEPS/Plan4MC/GITM) cited here only at abstract level.
