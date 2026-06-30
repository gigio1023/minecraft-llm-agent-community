# Coleman, social capital and the micro-macro boat

- author: James S. Coleman. Primary works: "Social Capital in the Creation of
  Human Capital" (1988, *American Journal of Sociology* 94 Suppl. S95-S120);
  *Foundations of Social Theory* (1990). The "boat" diagram: Coleman 1986/1990.
- source used: WebSearch + the 1988 AJS PDF (faculty.washington.edu, bebr.ufl.edu)
  + reputable summaries. Faithful to Coleman 1988.

## Primary-source facts

- Social capital is defined **by its function**: "not a single entity but a variety
  of different entities, with two elements in common: they all consist of some
  aspect of social structures, and they facilitate certain actions of actors ...
  within the structure."
- **Three forms** of social capital:
  1. **Obligations and expectations** (depend on the trustworthiness of the
     environment): "if A does something for B and trusts B to reciprocate in the
     future, this establishes an expectation in A and an obligation on the part of
     B", a "credit slip" A holds.
  2. **Information channels**: social relations provide information that
     facilitates action.
  3. **Norms and effective sanctions**: norms accompanied by sanctions that
     reward or constrain action.
- **Coleman's boat** (macro-micro-macro): macro social conditions (A) shape
  individual situations/beliefs (B), which drive individual actions (C), which
  aggregate to macro outcomes (D). The hard, often-missing link is C->D (the
  micro-to-macro transition).

## Interpretation (labeled inference)

- Coleman unifies three threads this lane treats separately: obligations
  (Homans/Blau), information (Granovetter), and norms (Bicchieri/Ostrom). For the
  repo, social capital is *the standing state in the ledgers*: outstanding credit
  slips (obligation ledger), who-knows-what (asymmetric-knowledge state), and
  active norms (sanction history).
- The boat is the warning behind the maturity ladder (`proto-social -> organization
  -> settlement -> village -> society`): the project's hardest, least-proven claim is
  the C->D transition, that individual actor turns *aggregate* into a settlement-
  level pattern. The repo should not assert macro emergence from a single run.

## Mechanically useful vs research contribution

- Mechanically useful: a per-actor "social-capital snapshot" derivable purely from
  existing ledgers, count of open credit slips held (creditor side of
  `ObligationLedgerEntry`), exclusive knowledge held (route/resource the actor
  alone has observed), and norms the actor participates in enforcing (sanction
  events authored). All loggable.
- Avoid / overclaim: do NOT claim macro "social capital of the community" emerged.
  The defensible unit is dyadic/individual ledger state. The C->D micro-to-macro
  claim requires multi-episode evidence the repo does not yet have, mark it
  unclaimable for now.

## WAM layer(s) informed

- **Institutional / Settlement WAM** (the micro->macro transition; norms as capital)
  and **Social WAM** (obligations/expectations and information as dyadic capital).
