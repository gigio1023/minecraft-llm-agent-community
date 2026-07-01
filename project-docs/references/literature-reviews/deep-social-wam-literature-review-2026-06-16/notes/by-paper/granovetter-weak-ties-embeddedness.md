# Granovetter, weak ties and embeddedness

- author: Mark S. Granovetter. Primary works: "The Strength of Weak Ties" (1973,
  *American Journal of Sociology* 78(6)); "Economic Action and Social Structure:
  The Problem of Embeddedness" (1985, *AJS* 91(3)).
- source used: WebSearch + the 1973 PDF (Stanford SNAP course copy) + reputable
  summaries. Faithful to Granovetter 1973/1985.

## Primary-source facts

- **Strength of weak ties** (1973): tie strength = a combination of time, emotional
  intensity, intimacy, and reciprocal services. **Weak ties** (acquaintances) more
  often **bridge** otherwise disconnected clusters and thus carry *novel
  information* (e.g. job leads) that strong ties (which share redundant
  information) do not. A bridge is a tie that is the only path between two parts of
  a network.
- **Embeddedness** (1985): economic action is **embedded** in ongoing structures of
  social relations; it is neither atomized (undersocialized) nor a mechanical
  product of internalized norms (oversocialized). Concrete ongoing relations, and
  their history, shape trust and malfeasance more than general morality or
  institutional arrangements do.

## Interpretation (labeled inference)

- Embeddedness is the macro-justification for the repo's whole stance: a single
  Minecraft exchange's meaning and trustworthiness depend on the *ongoing
  relationship*, not on a one-shot transaction. This is why the repo derives trust
  from a *relationship ledger over cycles*, not from one event.
- Weak ties / bridges map onto the `asymmetric_knowledge_v1` scenario family: an
  actor who alone knows a resource/route/danger is a *bridge* for that
  information; whether they share or hoard it is a measurable social act with a
  measurable consequence (another actor gains/loses an option).

## Mechanically useful vs research contribution

- Mechanically useful: (1) a tie-strength proxy is directly the repo's
  `FamiliarityCategory` (stranger -> acquaintance -> teammate -> partner), derivable
  from counted shared interactions. (2) An information-bridge event: log when an
  actor transmits exclusive knowledge (route, hazard, resource location) to another
  via chat, and verify the recipient's later behavior changed (took the route,
  avoided the hazard). That verified behavior-change is the "strength of the weak
  tie" made observable.
- Avoid / overclaim: do NOT compute network-level centrality / bridging claims from
  2-3 actors; with the repo's small actor counts, "weak-tie bridging" is a dyadic
  information-transfer event, not a network-structural result. Mark network-scale
  claims unclaimable until many actors and episodes exist.

## WAM layer(s) informed

- **Social WAM** (information transfer between specific actors; familiarity) and
  **Institutional / Settlement WAM** (embeddedness justifies cross-cycle trust;
  network structure is a longer-horizon, not-yet-claimable target).
