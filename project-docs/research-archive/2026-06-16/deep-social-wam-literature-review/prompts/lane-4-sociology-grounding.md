# Lane 4 — Sociology / Social Theory Grounding for Social WAM

Read `prompts/00-shared-lane-contract.md` first. You are Lane 4 (N=4).

## Scope

Define "social state" rigorously from social theory, then translate every concept
into Minecraft-operational variables: what can be observed, logged, predicted,
verified, and what cannot yet be claimed. This lane keeps the project honest:
social-science concepts must become measurable Minecraft state, not decorative
theory language.

## Concepts to cover (textbook + key primary sources)

- Max Weber — social action (action oriented toward others; meaning).
- Mead & Blumer — symbolic interactionism (meaning emerges in interaction).
- Goffman — interaction order, face, frames.
- Homans & Blau — social exchange (cost, reward, reciprocity, dependence).
- Coleman — social capital, the micro-macro (Coleman's boat) transition.
- Granovetter — embeddedness, strength of weak ties.
- North — institutions as rules/constraints.
- Ostrom — commons governance, rules-in-use, action situations, the IAD
  framework, design principles (this is the most directly operational anchor for
  weak commons / public affordances — treat carefully).
- Bicchieri & Elster — social norms, empirical vs normative expectations,
  conditional preferences.
- Organizational theory — roles, routines, authority, coordination, incentives
  (e.g., March & Simon, Nelson & Winter routines).

For each: cite a usable source (book/chapter/canonical paper or a solid survey).
Primary sources where feasible; reputable secondary sources otherwise (label as
secondary). Use `hf papers search` and web (Stanford Encyclopedia of Philosophy,
canonical texts) — do not fabricate citations.

## Translation requirement (the core of this lane)

For each concept produce a row: concept -> Minecraft-observable signal -> loggable
event/record -> predictable delta (what a Social/Institutional WAM would predict)
-> verification source (inventory/container/block/chat/memory/relationship ledger)
-> what cannot be claimed yet -> a candidate benchmark scenario that would test it.

Example: Blau "exchange creates obligation" -> observe lend_item event + inventory
transfer -> log obligation-ledger entry (creditor, debtor, item, due) -> predict
"return obligation created; trust rises on return, falls on loss" -> verify via
later inventory return + relationship update -> cannot claim "felt indebtedness",
only behavioral proxy -> scenario `borrowed_tool_v1`.

## Owned deliverables

- `notes/by-theme/sociology-grounding-for-social-wam.md` — each concept: the
  theory (primary-source faithful, jargon defined), the Minecraft operationalization,
  and the honesty boundary (behavioral proxy vs internal state; what the repo may
  NOT claim). Map concepts onto the 4 WAM layers (esp. Social + Institutional).
- `matrices/social-state-variable-matrix.md` — table: social construct x
  {theory source, Minecraft observable, log record/schema, predictable delta,
  verification source, unclaimable-yet, candidate scenario, WAM layer}.
- by-paper notes for the primary theory sources you actually read; manifest +
  search-log fragments; brief.

Caution: behavioral proxies are not internal states. Trust = a relationship
ledger value updated from verified events, not a claim about feelings. Norms =
remembered expectations grounded in observed history + violation/repair events,
not hardcoded global strategy. Keep Ostrom's commons as "weak commons / public
affordances" (the repo deliberately demotes heavy shared-commons economy).
