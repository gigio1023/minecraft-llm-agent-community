# Lane 4 Brief, Sociology / Social Theory Grounding for Social WAM

Lane: 4 (Sociology / Social Theory Grounding). Date: 2026-06-16.

## Sources reviewed (count + list)

13 manifest entries. 10 canonical theory anchors (books / classic journal
articles, grounded via SEP + reputable catalogs; secondary-labeled where the
primary text was not fetched) plus 3 computational operationalizations
(read in depth or well-established).

Theory anchors (by-paper notes written for each):
- Weber, *Economy and Society* 1922 (social action; four ideal types).
- Mead 1934 / Blumer 1969 (symbolic interactionism).
- Goffman 1959/1967/1983 (interaction order, face, frames).
- Homans 1961 / Blau 1964 (social exchange).
- Coleman 1988 (social capital; the micro-macro boat).
- Granovetter 1973/1985 (weak ties; embeddedness).
- North 1990 (institutions as rules of the game).
- Ostrom 1990/2005/2011 (IAD, rules-in-use, eight design principles).
- Bicchieri 2006 / Elster 1989 (social norms: empirical vs normative expectations).
- March & Simon 1958 / Nelson & Winter 1982 (roles, routines, bounded rationality).

Computational operationalizations:
- 2404.16698 GovSim (Ostrom-grounded LLM commons; read in depth via `hf papers read`).
- 2106.09012 norms from public sanctions / Classifier Norm Model (read in depth).
- 2304.03442 Generative Agents (memory/reflection architecture; Lane 3 deepened
  the shared note with full LaTeX detail).

Plus 6 abstract-level computational candidates recorded to the manifest
(2510.14401, 2412.10270, 2404.02491, 2606.14600 LoSoNA, 2011.00620 Social
Chemistry 101, 2502.08691 AgentSociety, 2606.02859 Economy of Minds).

## Strongest findings (source-backed)

1. **A Social-WAM capability, not dialogue fluency, is the cooperation
   bottleneck.** GovSim (2404.16698) reports that the ability to form beliefs about
   other agents correlates 0.83 with community survival, and that the failure to
   sustain cooperation stems from inability to mentally simulate the long-term
   effect of actions on the group equilibrium. This is direct empirical support for
   building a *predictive* social model rather than a better chat policy.
2. **"Norm = classifier over sanction history" is the honest operationalization,
   and it already exists in the literature.** The public-sanctions model
   (2106.09012) states the norm status of a behavior "is determined entirely by
   whether the group has sanctioned similar behavior in the past." Combined with
   Bicchieri's empirical-vs-normative-expectation split (SEP), this gives a precise,
   loggable norm record (conformity count + sanction events) that matches the repo's
   caution against hardcoded global norms.
3. **The repo's existing ledgers already are the social-exchange and commons
   bookkeeping.** Blau's obligation-from-unilateral-benefit maps 1:1 onto
   `ObligationLedgerEntry`; Ostrom's boundaries/monitoring/graduated-sanctions/
   conflict-resolution principles map onto `MaterialClaimLedgerEntry`, a new
   `SanctionEvent`, and `repair` obligations; Coleman's three forms of social
   capital are all derivable from existing per-actor ledger state. Little new schema
   is needed (six minimal `[NEW]` evidence-only records, listed in the matrix).

## Weak or uncertain claims (could not verify)

- Exact canonical wording for Ostrom 2011 (PSJ PDF, TLS error) and the eight
  design principles (P2P page 403; used a secondary paraphrase). Structure is
  faithful; quote-level precision needs the primary books.
- The Institutional-layer constructs (emergent norms, routines, micro->macro
  transition / Coleman's boat) are the least empirically supported. They are
  framed as predictable deltas a WAM would forecast, not as behaviors the current
  runtime demonstrates.
- Whether LLM-turn actors (not gradient-trained MARL policies) can sustain a
  *learned* history-grounded norm is open; transfer from GovSim and the
  public-sanctions model is design-level, not proven in this runtime.

## Implications for this repo

- Mechanically useful: the social-state-variable matrix gives a row-by-row
  translation (construct -> observable -> log record -> predictable delta ->
  verification source -> unclaimable-yet -> scenario -> WAM layer) that reuses the
  repo's exact schemas. The six recommended `[NEW]` records (is_other_oriented,
  information_shared, NormState, SanctionEvent, routine_observed, over_use) are
  post-action evidence only and must not gate execution.
- Research contribution: the contribution is the *social-material transition being
  modeled and verified*, not the ledgers (which are support/audit infrastructure).
  The defensible novelty is predicting and world-verifying social deltas under
  Minecraft constraints, and keeping every social claim a behavioral proxy backed
  by evidence rather than an internal-state assertion.
- Boundaries the repo should hold (each tied to a source): keep commons as
  lightweight `weak commons` (Ostrom is about *full* CPR institutions); never let
  a `[NEW]` record enforce a norm (North's formal/informal split + the repo's
  observe-only rule); never adopt believability as a metric (Generative Agents'
  divergence); require enforcement/recurrence evidence before claiming an
  institution or routine exists.

## Recommended next questions

1. Which two or three `[NEW]` records (likely `SanctionEvent` and `NormState`) are
   worth a runtime spike first, given they unlock the most matrix rows?
2. Can the greedy-newcomer perturbation (GovSim) be ported as a concrete
   `weak_commons_surplus_use_and_dispute_v1` robustness test with inventory-verified
   draws instead of declared numbers?
3. What is the minimum multi-episode evidence that would let the repo make even a
   weak `organization`-rung claim without overclaiming Coleman's micro->macro step?
4. Should the empirical-expectation proxy (conformity count) be computed by the
   runtime from history, or proposed by the provider and then verified? (The repo's
   rule says the runtime owns derived state, so likely the former.)
