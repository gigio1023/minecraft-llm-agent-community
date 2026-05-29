# Analysis Rubric

## Evidence Order

Prefer evidence in this order:
1. Runtime evidence artifacts with verifier-backed world, inventory, container,
   position, chat, or tool-result mutation.
2. `CycleJudgment` only when it cites matching evidence and does not overclaim.
3. Provider input/output snapshots for model behavior, prompt visibility, and
   payload reliability.
4. Review-summary markdown as a useful index, not as the source of truth.
5. Human-visible notes when provided by the user.

Do not count provider prose, memory notes, `wait`, or observe-only cycles as
physical success.

## Behavior Questions

Answer these directly:
- Did the NPC act from raw observations and allowed action surface, or did it get
  stuck in a narrow scripted loop?
- Which actions created verified mutations?
- Which actions consumed cycles without mutation?
- Did the actor pivot after blockers?
- Did memory/previous judgment help continuity, or did it repeat stale goals?
- Did the settlement checklist advance, or only the low-level runtime?
- Did provider cost scale reasonably with action value?

When reviewing the observation -> action -> long-term goal loop, keep the
claim precise. "Observation is useful" and "the overall loop is weak" can both
be true. Separate these three links:

1. `observation -> next action`: Did an observe-like cycle change the next
   action, and did that next action produce verified progress?
2. `action choice breadth`: Did choices use the exposed Mineflayer-backed action
   surface, or concentrate into a narrow subset such as collect/craft/place?
3. `durable state`: Did verified primitive evidence update settlement,
   relationship, memory, shared storage, or other long-term state?

## Useful Metrics

Report:
- cycle count and requested cycle completion;
- outcome distribution;
- verifier distribution;
- runtime attempt statuses;
- action intent distribution by primitive/action skill;
- executed tool distribution;
- observe/wait/remember share;
- observation-to-next-action distribution;
- action-surface utilization: direct primitives/action skills exposed, used as
  top-level intents, used as executed tools, and unused;
- action concentration: top 5 and top 6 action share over total cycles;
- social signal coverage: visible actors, `say`, shared storage, relationship
  events, obligations, and handoff/deposit actions;
- verified mutation share;
- retry-constraint count and blocked attempts;
- unresolved settlement checklist items;
- provider usage totals and budget headroom;
- artifact ref integrity.

## Finding Priorities

Use P1 when:
- runtime passed but objective evidence is weak enough to mislead product
  direction;
- artifacts cannot support the behavior claim;
- provider output fallback/malformed payloads recur;
- a budget guard is close to exhaustion.

Use P2 when:
- repeated blockers waste cycles but the runtime records them truthfully;
- a prompt or action surface pushes the model toward low-value loops;
- audit policy disagrees with valid evidence categories.

Use P3 for:
- report ergonomics;
- missing convenience summaries;
- naming or documentation clarity that does not change behavior.

## Interpretation Traps

- A high verified-progress count can still be weak if progress repeatedly creates
  disposable local items instead of advancing the checklist.
- A high no-progress count is not automatically bad when it is observation used
  before a correct pivot; it is bad when it dominates the run or fails to change
  later action choice.
- Repeated `collect_logs` can be good early competence and bad long-run agency if
  it becomes the only reliable escape from crafting/placement blockers.
- A healthy observation-to-next-action success rate does not prove a strong NPC
  loop if the next actions all collapse into a small resource loop.
- Exposed action surface is not the same as used action surface. Compare direct
  primitives/action skills offered to the provider against actual top-level
  intents and executed tools.
- If verified primitive evidence exists but checklist/state remains pending,
  prefer `state-consolidation-gap` over vague planner blame.
- If a run has no visible actors, `say`, relationship events, shared-storage
  mutation, or obligations, it mostly evaluates one-actor gameplay continuity,
  not social simulation.
- Deterministic prompts, fixtures, and success checklists can over-shape NPC
  behavior. Flag `harness-narrowing` when the bot appears to optimize the narrow
  harness instead of using raw observation and the Mineflayer body broadly.
- `runtime_retry_constraints` are a positive runtime safety signal and a negative
  planner/action-surface signal at the same time.
- Non-exhaustive world scans are still valuable raw observation; they just cannot
  support absolute absence claims.

## Output Template

```text
Recording verdict: ...
Experiment verdict: ...

Findings
P1 - [category] Short claim.
Evidence: exact counts, refs, or cycles.
Implication: why it matters for NPC behavior or experiment validity.
Next fix: smallest implementation or experiment change.

Behavior story
Short narrative of what the NPC did over the run.

What Was Recorded
Report path, actor workspace, provider inputs/outputs, evidence refs, judgments,
usage, retry constraints, and missing or invalid refs.

Next Experiment
One narrow run or code slice that should be tried next.
```
