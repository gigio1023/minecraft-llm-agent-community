# North, institutions as rules of the game

- author: Douglass C. North. Primary work: *Institutions, Institutional Change and
  Economic Performance* (1990, Cambridge UP).
- source used: WebSearch + SEP "social institutions" (which references North 1990
  but does not quote it at length). The "rules of the game" formulation is North's
  standard, widely cited definition; treated as faithful, wording secondary.

## Primary-source facts

- North: **institutions are "the rules of the game in a society," the "humanly
  devised constraints that structure political, economic and social
  interaction."** They consist of **formal rules** (constitutions, laws, property
  rights) and **informal constraints** (norms, conventions, codes of conduct), plus
  their enforcement characteristics.
- North's crucial distinction: **institutions (the rules) are separate from
  organizations (the players)**. Organizations are groups bound by a common
  purpose; institutions are the constraint structure within which organizations
  act. Institutions reduce uncertainty by providing a stable (not necessarily
  efficient) structure to interaction.

## Interpretation (labeled inference)

- North gives the cleanest separation the repo needs: **rules vs players.** In the
  repo, "institutions" = the access/claim conventions, sanction patterns, and role-
  permission contracts; "organizations" = the actors and their role assignments.
  The runtime's permission **gates** are *formal* institutions; emergent
  norms/conventions (from sanction history) are *informal* institutions.
- Enforcement matters: a rule with no enforcement is not yet an institution. In the
  repo, a `material claim` that is never defended/respected is not yet an
  institution, only a claim plus observed respect/sanction-on-violation makes it
  institutional.

## Mechanically useful vs research contribution

- Mechanically useful: tag the repo's structures by North's split, **formal**
  (runtime permission gates, role contracts: hard, runtime-owned) vs **informal**
  (claim-respect conventions, sanction patterns: soft, evidence-derived, never
  runtime-enforced). This keeps the project's hard rule visible: the runtime owns
  formal constraints; it must NOT enforce informal norms, only observe whether
  actors maintain them.
- Avoid / overclaim: do NOT call an unenforced regularity an institution. Require
  enforcement evidence (respected claim, sanction on violation, conflict
  resolution) before an "institution emerged" claim. Distinguish organization
  (actors+roles, the repo's `organization` ladder rung) from institution (rules).

## WAM layer(s) informed

- **Institutional / Settlement WAM** (formal vs informal rules; rules vs players;
  enforcement as the test of institutional status).
