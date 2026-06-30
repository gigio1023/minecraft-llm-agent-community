# Homans & Blau, social exchange

- authors: George C. Homans (*Social Behavior: Its Elementary Forms*, 1961,
  Harcourt); Peter M. Blau (*Exchange and Power in Social Life*, 1964, Wiley).
- source used: WebSearch + reputable summaries (Duke theory notes, infed.org).
  Secondary for wording.

## Primary-source facts

- Homans: elementary social behavior is at least two people interacting where one
  rewards or punishes the other. Behaviorist propositions, e.g. the **success
  proposition** ("the more often a person's action is rewarded, the more likely the
  person is to perform that action") and a fairness/distributive-justice
  expectation over rewards and costs.
- Blau: mutual bonds emerge as people who **incur obligations reciprocate**; but
  the **imbalance** from *unilateral* benefit (one gives, the other cannot
  reciprocate equally) **engenders superior status / power** for the giver.
  Concepts: exchange, reciprocity, imbalance, power. Blau distinguishes social
  exchange (diffuse, unspecified future obligations, trust-dependent) from economic
  exchange (specified terms).

## Interpretation (labeled inference)

- Blau's "unilateral benefit → obligation → power asymmetry" is the exact
  mechanism behind the repo's first scenario `borrowed_tool_with_return_or_debt_v1`:
  Alice lends, Bob owes, and until Bob returns/repairs, the relationship is
  imbalanced. Trust rises on reciprocation, the lender gains standing on repeated
  unreciprocated giving.
- Homans' success proposition predicts a *behavioral* regularity (rewarded help is
  repeated) that is directly testable across cycles, and is the kind of social
  delta a Social WAM should forecast.

## Mechanically useful vs research contribution

- Mechanically useful: the obligation/credit ledger is literally Blau's exchange
  bookkeeping. The repo's `ObligationLedgerEntry` (kind ∈ {promise, loan, debt,
  repair, favor, ...}, status ∈ {open, fulfilled, refused, violated, ...}) is a
  faithful operationalization. A predictable delta: `lend_item` → open loan
  obligation created; `return_item` → obligation fulfilled + trust up; loss →
  obligation violated + trust/friction down. Power asymmetry is observable as a
  standing net-creditor balance in the ledger.
- Avoid / overclaim: do NOT claim "felt indebtedness" or "felt gratitude." Record
  the ledger entry and the verified return/loss; the obligation is a *behavioral
  bookkeeping fact*, not an emotion. "Power" here is a ledger asymmetry, not a
  psychological dominance claim.

## WAM layer(s) informed

- **Material / Economic WAM** (resource transfer, who owes whom) and **Social WAM**
  (obligation creation, reciprocation, trust update, exchange-derived standing).
