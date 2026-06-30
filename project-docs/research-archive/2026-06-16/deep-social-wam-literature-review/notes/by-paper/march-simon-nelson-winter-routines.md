# March & Simon / Nelson & Winter, roles, routines, bounded rationality

- authors: James G. March & Herbert A. Simon (*Organizations*, 1958, Wiley);
  Richard R. Nelson & Sidney G. Winter (*An Evolutionary Theory of Economic
  Change*, 1982, Harvard UP).
- source used: WebSearch + reputable summaries (DRUID working paper on routines,
  Springer/Oxford on bounded rationality). Secondary for wording.

## Primary-source facts

- March & Simon: organizations coordinate **boundedly rational** actors (limited
  knowledge and computation) via division of labor, role specialization,
  standard operating procedures, and communication channels that economize on
  attention and reduce uncertainty.
- Nelson & Winter: **routines** are regular, predictable patterns of organizational
  behavior, "the skills of an organization." Routines are the unit of selection
  (the "genes" of the firm, analogous to memes): they are replicated by imitation,
  subject to mutation, and their diffusion determines an organization's survival.
  Routines economize on bounded cognition by relegating repeated decisions to
  semi-automatic patterns; much routine knowledge is **tacit**.

## Interpretation (labeled inference)

- This is the organizational-theory grounding for the repo's `organization` and
  `settlement` ladder rungs and for the `role_dependency_work_order_v1` scenario.
  A **role** (the repo's runtime permission/context contract: gatherer, crafter,
  quartermaster) is March-Simon role specialization. A **routine** is a *repeated,
  cross-cycle work pattern* (e.g. "actor A always restocks the furnace fuel before
  B smelts"), observable as recurring evidence-backed action sequences.
- Routines are the most concrete handle on the repo's hardest goal, *post-goal
  continuation*: a settlement persists because routines persist after any one
  CycleGoal is done.

## Mechanically useful vs research contribution

- Mechanically useful: detect a **routine** as a repeated (≥ N cycles) ordered
  action pattern across actors, grounded in evidence (not in profile labels), this
  is the repo's own rule ("infer roles from repeated evidence-backed actions, not
  from profile labels alone"). A loggable `routine_observed` record: actors,
  ordered action refs, recurrence count, evidence_refs. Predictable delta: once a
  routine exists, a Social/Institutional WAM predicts the next-cycle handoff and
  flags a *broken routine* (someone skipped their step) as a coordination failure.
- Avoid / overclaim: do NOT label a single coordinated episode a "routine" or a
  "division of labor." Require recurrence across cycles with evidence. Tacit
  routine knowledge is by definition not fully observable, claim the *pattern*,
  not the internalized skill.

## WAM layer(s) informed

- **Institutional / Settlement WAM** (roles, routines, division of labor,
  coordination, persistence / post-goal continuation).
