# Ostrom, IAD framework, action situations, rules-in-use, eight design principles

- authors: Elinor Ostrom
- primary works: *Governing the Commons* (1990, Cambridge UP); *Understanding
  Institutional Diversity* (2005, Princeton UP); "Background on the Institutional
  Analysis and Development Framework" (2011, Policy Studies Journal 39(1)).
- sources used (secondary catalogs, the original 2011 PSJ PDF mirror failed TLS,
  Ostrom Workshop page returned 503): Wikipedia IAD entry (cites Ostrom 2005),
  SEP "social institutions", agrariantrust.org for the eight principles (paraphrase
  wording, flagged below). Treat exact wording as secondary; the structure is
  faithful to Ostrom 2005/2011.
- relevance: the most directly operational anchor for `weak commons` /
  `public affordance` in this repo. Handle carefully, the repo deliberately
  demotes heavy shared-commons economy (see caution at end).

## Primary-source facts (faithful to Ostrom 2005/2011)

- The focal unit is the **action arena** = an **action situation** + the
  participants/actors in it. Outcomes feed back through evaluative criteria.
- An **action situation** has working parts: participants; positions (roles);
  allowable actions; potential outcomes; action-outcome linkages (the
  transformation function from actions to outcomes); the control each participant
  has over those linkages; the information available; and the net costs and
  benefits assigned to actions and outcomes.
- Three classes of **exogenous variables** shape the action arena: (1)
  biophysical / material conditions; (2) attributes of the community (shared
  norms, culture, common understanding); (3) **rules-in-use** (the "dos and
  don'ts learned on the ground that may not exist in any written document").
- Seven **rules-in-use** types (Ostrom 2005, *Understanding Institutional
  Diversity*): position, boundary, choice, aggregation, information, payoff (pay-
  off), and scope rules.
- **Eight design principles** of long-enduring common-pool-resource institutions
  (Ostrom 1990; wording below is secondary paraphrase from agrariantrust.org):
  1. Clearly defined boundaries (who may withdraw; the resource boundary).
  2. Congruence: appropriation/provision rules match local conditions and needs.
  3. Collective-choice arrangements: those affected by rules can change them.
  4. Monitoring: monitors are drawn from or accountable to the users.
  5. Graduated sanctions: violations punished in proportion to severity/context.
  6. Conflict-resolution mechanisms: rapid, low-cost, accessible.
  7. Minimal recognition of rights to organize (no outside authority overrides).
  8. Nested enterprises: governance organized in layers for larger systems.

## Interpretation (labeled inference)

- The action-situation working parts are almost a specification of a benchmark
  scenario record: the repo's per-issue declaration (`issue_id`, world trigger,
  actors, each actor's stake, valid resolution space, required evidence, score
  dimensions, from Material-Claims-And-Social-Economy-Benchmark-Plan) is an IAD
  action situation in disguise. Positions ≈ repo `role`; payoff/scope/boundary
  rules ≈ the repo's permission gates and claim ledger.
- The eight principles are mostly *organization/settlement-level* tests, i.e. they
  belong to the Institutional WAM layer and only become measurable once multiple
  actors repeatedly use the same affordance over cycles.

## Mechanically useful vs research contribution

- Mechanically useful: principles 1 (boundaries → who holds a `material claim`),
  4-5 (monitoring + graduated sanctions → sanction/violation ledger entries), 6
  (conflict resolution → repair/restitution events) are directly loggable in the
  repo's existing `MaterialClaimLedgerEntry` / `ObligationLedgerEntry` and a
  to-be-added sanction record.
- Avoid / overclaim: do NOT build a full commons-governance economy. The repo's
  `weak commons` is intentionally a *lightweight* category, not Ostrom's
  full common-pool-resource institution. Use the principles as
  *measurement checklists* for `weak_commons_*` and `public_*` scenarios, not as
  a target architecture the runtime must enforce. The runtime must not enforce a
  norm; it observes whether actors maintain one.

## WAM layer(s) informed

- **Institutional / Settlement WAM** (design principles, rules-in-use), with
  **Material / Economic WAM** (boundaries, appropriation) and **Social WAM**
  (monitoring, graduated sanctions, conflict resolution) feeding it.
