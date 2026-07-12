# OpenAI Dashboard Eligibility Observation

Observed at: `2026-07-12T11:10:46.000Z`

This is a read-only observation of the logged-in `OpenAI Coxwave Hackathon`
organization. No setting was changed and no provider request was made.

## Billing

The organization Billing overview showed:

- plan: `Pay as you go`;
- credit balance: `$3.80`;
- auto recharge: off, with API requests documented to stop when the balance
  reaches `$0`.

The positive credit balance satisfies the repo preflight requirement to confirm
that the account is not at a zero balance before requesting approval.

## Complimentary-token enrollment

The Data controls → Sharing page showed:

- `Share inputs and outputs with OpenAI` selected as `Enabled for all projects`;
- the page message: `You're enrolled for complimentary daily tokens.`

The other two sharing controls were disabled and are not relevant to the API
input/output complimentary-token enrollment.

The repo policy matrix separately identifies `gpt-5.4-mini` as a model in the
OpenAI mini shared token pool. This observation does not replace the exact-day
usage record or explicit operator approval.

## Remaining authority

The campaign remains unauthorized until the user explicitly approves the newly
proposed current-day maximum of 32 requests and 1,200,000 total tokens. The
earlier instruction to use GPT-5.4 Mini predates this exact allowance and is not
reused as current authority.
