# Bicchieri & Elster, social norms (empirical vs normative expectations)

- authors: Cristina Bicchieri; Jon Elster
- primary works: Bicchieri, *The Grammar of Society: The Nature and Dynamics of
  Social Norms* (2006, Cambridge UP); Elster, *The Cement of Society* (1989a) and
  *Nuts and Bolts for the Social Sciences* (1989b, both Cambridge UP).
- source used: Stanford Encyclopedia of Philosophy, "Social Norms" (first pub.
  2011, rev. 2023-12-19), fetched directly. Faithful to Bicchieri's own framework.

## Primary-source facts (per SEP, faithful to Bicchieri 2006)

- A **social norm** (Bicchieri) is a behavioral rule that individuals prefer to
  conform to *conditional on* two beliefs holding simultaneously:
  - **Empirical expectation**: the individual believes a sufficiently large subset
    of the relevant group conforms to the rule in situations of type S (a first-
    order belief about what others *do*).
  - **Normative expectation**: the individual believes a sufficiently large subset
    of the group expects them to conform and may sanction non-conformity (a
    second-order belief about what others think one *ought* to do).
  - **Conditional preference to conform**: norm compliance results from the joint
    presence of the conditional preference plus both expectations.
- Taxonomy (Bicchieri):
  - **Convention**: coordination game, shared interest; conformity benefits me if
    others conform; supported by **empirical expectations alone** (e.g. which side
    of the road, fork placement).
  - **Social norm**: mixed-motive game (prisoner's-dilemma-like); conforming is
    "almost never in the immediate interest of the individual"; requires **both**
    empirical and normative expectations.
  - **Descriptive norm**: an observable behavioral pattern lacking normative force.
  - **Moral rule**: an internalized *unconditional* imperative, independent of
    others' behavior or expectations.
- A norm cannot be identified with a recurrent behavioral pattern alone (else
  "shared rules of fairness" would be indistinguishable from "the collective
  morning habit of tooth brushing").
- Elster: norms are **non-outcome-oriented** ("even though a given norm can be
  conceived as a means to achieve some goal, this is usually not the reason why it
  emerged"), sustained by emotions and sanctions rather than pure calculation, and
  distinct from conventions (coordination) and moral norms (unconditional).
- Sanctions are not the whole story: people conform "even in situations of
  complete anonymity, where the probability of being caught transgressing is
  almost zero."

## Interpretation (labeled inference)

- The empirical/normative split is the single most useful distinction for keeping
  the repo honest. **Empirical expectation is loggable** (count observed conforming
  acts in the actor's memory of history). **Normative expectation is NOT directly
  observable**, it is a belief about others' approval; the closest proxy is the
  presence of recorded sanction/approval events in history.
- This gives a clean honesty boundary: the repo may assert "actor has an empirical
  expectation grounded in N observed conforming acts (evidence_refs)"; it may NOT
  assert "actor feels obligated", only "actor's behavior is consistent with a
  norm and the history contains sanction events for the violation type."

## Mechanically useful vs research contribution

- Mechanically useful: model a norm as a record with (situation-type S, observed-
  conformity count = empirical-expectation proxy, observed-sanction events =
  normative-expectation proxy, violation events, repair events). This is the
  bridge between the public-sanctions CNM model (2106.09012) and the repo's
  ledgers.
- Avoid / overclaim: do NOT hardcode a global norm and call it emergent. A norm
  claim must cite observed history. Do NOT claim conventions are norms, a
  coordination regularity (e.g. "everyone deposits logs in the east chest")
  needs only empirical expectation; calling it a *norm* requires recorded
  normative pressure (sanction on deviation).

## WAM layer(s) informed

- **Institutional / Settlement WAM** (norms, conventions, sanctions) and
  **Social WAM** (expectations about specific others).
