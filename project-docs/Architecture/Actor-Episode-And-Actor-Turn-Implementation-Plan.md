---
sidebar_position: 41
---

# Actor Episode And Actor Turn Implementation Plan

Search token: `ACTOR_EPISODE_IMPLEMENTATION_PLAN`.

Status: historical implementation campaign plan; superseded for outer Actor Turn
tool selection by `Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`.

Recorded: 2026-06-03 (`Asia/Seoul`).

## Planning Method

Current application rule:

- Keep this plan's Active Episode, evidence trace, Deliberation branching, and
  passive PlanBeads ideas.
- Do not use this plan's older `ActorTurnOutput -> archived planner action` bridge as the
  active hot path.
- Ordinary Actor Turn now selects exactly one strict function tool: a visible
  Action Card with logical `parameters`, or `author_mineflayer_action`.
- Mineflayer codegen receives full `ActorTurnInput`, raw outer function call,
  parsed author args, and injected codegen agent skill markdown.

This plan implements `Low-Cost-Social-Simulation-Campaign-Spec.md`. It should
stay detailed about sequencing, gates, and evidence, but avoid becoming a
line-by-line coding script.

For each remaining slice, use the campaign-slice template from the campaign
spec:

- why now;
- current behavior;
- desired behavior;
- smallest vertical proof;
- out of scope;
- existing surfaces to reuse;
- work lanes;
- acceptance gates;
- required artifacts;
- completion audit.

Parallel workers should own disjoint lanes and return evidence, not merely
opinions. Acceptable lane outputs include a patch, a focused test result, a run
report, a provider input/output audit, a PlanBead operation example, or a
specific rejected expansion.

## Remaining Vertical Slices

These are the next implementation targets after the current Actor Turn bridge
and first low-cost smoke evidence:

| Slice | Why now | Smallest proof | Primary gates |
|-------|---------|----------------|---------------|
| Redundant material crafting control | A 30-cycle cheap-model run can still overuse one broad crafting action after the immediate need is satisfied. | Actor Turn exposes current inventory/evidence and retry context while keeping visible tools available; the provider must choose a schema-valid next action or codegen path, and runtime validators/verifiers decide whether execution was real. | `actionfulness-gate`, `current-state-consumption-gate` |
| Container and station blocker clarity | Chest/table uncertainty can drift into repeated inspection or generated probes instead of a direct useful action. | A blocked open/inspect/container concern produces a clear Action Card or explicit blocker update, not repeated vague generated probes. | `current-state-consumption-gate`, `planbead-lifecycle-gate` |
| PlanBead blocker reconciliation | Repeated failed generated trials or shelter attempts should update durable work state without fake closure. | Repeated related failures produce a guarded PlanBead blocker update with matching evidence refs and no executable fields. | `planbead-continuity-gate`, `planbead-lifecycle-gate` |
| Richer social surface | Shared-storage fixture proof is useful but too thin for broader social simulation. | A low-cost run includes a visible actor, chat target, relationship event, or later actor consumption, and the review cites runtime-visible social consequence refs. | `social-plausibility-gate`, `budget-gate` |
| Generated action quality | Actor Turn can author candidates, but failed trials must become actionable repair evidence instead of noise. | At least one generated candidate either passes trial and remains candidate state awaiting promotion, or fails with source/helper/verifier evidence that guides a repair. | `generated-action-gate`, `actionfulness-gate` |
| Long-run artifact discipline | 60-cycle acceptance needs bounded provider context and exact refs, not swollen hot-path prompts. | A 30/60-cycle report resolves provider, evidence, episode, PlanBead, and usage refs while Actor Turn input remains bounded and compacted. | `actor-turn-cadence-gate`, `budget-gate` |

The slices may be implemented in parallel only when their write scopes are
disjoint. Live-evidence runs should remain sequential after code lanes land so
the run can be attributed to a known implementation state.

Implementation checkpoint, 2026-06-03:

- Phase 0 documentation and routing are implemented.
- Phase 1 initial contract gate is implemented under
  `probe/src/runtime/goals/actorEpisode/`.
- Focused deterministic tests cover contract validation, Action Card output
  boundaries, generated Mineflayer authoring shape, episode false-pass
  rejection, PlanBead satisfied-closure acceptance matching, and artifact-ref
  checks.
- Phase 2/3 initial bridge is implemented: existing `action-surface/v1` packets
  can project direct affordances into `action-card/v1` records, build
  `actor-turn-input/v1`, and expose an Actor Turn provider schema/prompt
  boundary.
- Actor Turn provider snapshots now carry visible Action Cards and strict
  function-tool contracts. Archived action planner snapshots remain only for the
  explicit archived path.
- Runtime Action Resolver now resolves Actor Turn function-tool selections into
  `ActorTurnResolvedAction` and full-context `author_mineflayer_action` codegen
  rather than using a provider-facing archived planner action as the boundary.
- The runner uses Actor Turn as the only ordinary action hot path. Provider
  calls write `actor-turn-input/v1` snapshots and execute resolved Actor Turn
  actions directly.
- The social-cycle CLI can select the bridge with
  `--action-hot-path actor_turn` or `SOCIAL_CYCLE_ACTION_HOT_PATH=actor_turn`.
  Reports record `action_hot_path` so review scripts and humans can tell which
  path produced the artifacts.
- A deterministic offline CLI smoke confirmed that the bridge writes
  `actor-turn-input/v1` snapshots with `active-episode/v1`,
  `minecraft-basic-guide/v1`, and Action Cards. Offline smoke is an artifact
  connectivity check only; because no Minecraft mutation can occur, it is
  expected to finish with a blocked runtime status rather than proving behavior.
- Actor Turn mode now uses a runtime classifier for ordinary turn judgment.
  It writes a `cycle-judgment/v1` compatibility artifact for existing report,
  memory, settlement, and previous-context readers, but it does not call the
  archived CycleJudgment provider and does not create PlanBead operations. This
  cuts one provider call per Actor Turn while keeping branch-time Deliberation
  as the intended PlanBead update path.
- Actor Turn mode now persists `active-episode/v1`, records
  `active_episode_ref` in each cycle, and reuses the same Active Episode across
  non-branch cycles. Continuation cycles write compatibility
  `actor-cycle-goal/v1` records from the Active Episode with `source:
  "runtime_rule"` instead of calling `goal_mind` again.
- The 2-cycle deterministic offline CLI smoke now shows one initial
  `goal_mind` input, four `actor-turn` inputs, zero per-action
  `cycle-judgment` provider inputs, one `active_episode_ref`, and no
  `deliberation_branch_refs`. This proves provider-call cadence and episode
  continuity, not live Minecraft competence.
- A dedicated branch-time Deliberation provider contract is implemented. Its
  output may reframe `active-episode/v1` and carry raw PlanBead operation
  proposals for the guarded applier, but validators reject executable authority
  such as `archived planner action`, `ActionCard`, `primitive_id`, `action_skill_id`,
  generated source, helper settings, `args`, or executable parameters.
- Deterministic Deliberation provider tests prove that branch-time reframing
  writes `deliberation-output/v1`, persists the next Active Episode, and keeps
  `plan_bead_op_proposals` guarded instead of executing them directly.
- Runner branch coverage is implemented for actor_turn mode. A deterministic
  contract-blocked Actor Turn records `branch_recommended`, writes a
  `deliberation-branch/v1`, calls the dedicated Deliberation provider on the
  next cycle, and switches to a new `active_episode_ref` without reintroducing
  per-action CycleJudgment provider calls.
- Actor Turn provider input now includes `actor-turn-current-state/v1`, a
  bounded live projection of inventory, position, vitals, visible actors,
  nearby block hints, world scan, and settlement progress. This is the primary
  cheap-model state surface; evidence refs remain available for audit.
- Action Cards now carry `parameter_hints`. Actor-owned action skill cards
  explicitly say that empty parameters are allowed only when `current_state` or
  recent runtime evidence satisfies their preconditions.
- Deliberation parsing now treats provider `next_episode` as a sparse reframe
  overlay on the current Active Episode. Missing fields such as
  `life_goal_ref`, selected/related PlanBead refs, visible actors, social
  pressure, success signals, and pivot triggers are carried forward by runtime
  defaults. Deliberation still cannot emit executable actions or args.
- A short live OpenAI `gpt-5.4-nano` Actor Turn run after this parser repair
  passed the schema/runtime gate for 3 cycles:
  `tmp/social-cycle-actor-turn-openai-nano-live-3-deliberation-fixed.json`.
  It used 6 provider calls and 38,484 total tokens under the local 9M/day cap.
  This proves sparse Deliberation no longer crashes the run. It does not prove
  behavior quality: the actor inspected a chest, attempted
  `placeCraftingTable` without a carried `crafting_table`, then inspected the
  chest again. Treat this as a behavior-gate failure and an input/card
  precondition clarity finding, not as acceptance of the architecture.
- A second short live OpenAI `gpt-5.4-nano` run after Action Card precondition
  wording improved the first steps but exposed a sharper recipe-contract bug:
  `collect_logs -> collect_logs -> craft_with_table(crafting_table)`. The
  correct path is logs -> planks -> `craft_item` crafting_table -> place or
  reach a crafting_table world block. Direct `craft_with_table` is now treated
  as a table-bound recipe path, not the way to craft planks, sticks, or the
  crafting table item itself.
- A third short live run exposed three implementation gaps that are now part of
  the acceptance surface: Action Card preconditions must be runtime-enforced,
  settlement state must absorb `worldStateSummary` station observations, and
  branch-time Deliberation PlanBead proposals must normalize into guarded
  operation artifacts instead of remaining invalid hints.
- Action Cards now carry `current_state_requirements`. Runtime Action Resolver
  rejects a chosen `requires_current_state_check` card before Mineflayer
  execution when the current state clearly lacks the required inventory, world,
  social, or parameter condition, and the Actor Turn provider gets one repair
  attempt with the rejection summarized as a runtime retry constraint.
- Settlement consolidation now treats a bounded `worldStateSummary` observation
  of `crafting_table` as nearby station evidence with refs, without turning the
  bounded scan into a global absence claim.
- Deliberation parsing now adapts loose branch-time PlanBead hints into
  schema-valid evidence-linked `create` operations when possible. The guarded
  applier still accepts or rejects each operation and remains the only mutation
  authority for the PlanBeadGraph.
- This checkpoint does not yet make Actor Turn the default live social-cycle hot
  path. The remaining proof is live low-cost run evidence that the actor becomes
  more actionful and socially coherent in Minecraft.
- Actor Turn provider input now filters Action Cards whose
  `requires_current_state_check` preconditions are clearly false in
  `current_state`. The filter is provider-facing only; Runtime Action Resolver
  still performs final contract validation and rejects impossible choices before
  Mineflayer execution.
- Parser repair now fills only non-authority explanatory fields
  (`why_this_action`, `expected_evidence`, `fallback_if_blocked`) from nested
  provider parameters or safe defaults when a low-cost provider omits them.
  It does not invent executable parameters, card ids, primitive ids, action
  skill ids, helper allowlists, or source authority.
- `inspect_chest` is now treated as verified container access, not durable
  social-cycle progress by itself. It can update known state, but a run still
  needs later inventory, shared-storage, relationship, block, chat, or other
  episode-relevant mutation to pass behavior gates.
- Generic Mineflayer program runners are excluded from ordinary existing Action
  Cards. Low-cost providers were dumping long TypeScript into the generic
  runner and truncating JSON. Fresh generated source belongs to
  `author_mineflayer_action`; specific promoted actor-owned behaviors can still
  appear as ordinary Action Cards.
- Runtime Action Resolver now rejects table-bound recipes such as
  `wooden_pickaxe` when a provider routes them through the inventory-grid
  `craft_item` card. This turns the live `craft_item(wooden_pickaxe)` failure
  into contract repair before Mineflayer execution.
- Superseded: Runtime Action Resolver must not enforce recipe counts by parsing
  Action Card prose or `current_state_requirements`. Recipe facts belong in
  `minecraft_basic_guide`, current inventory evidence, strict parameters, and
  verifier/runtime outcomes. Actor Turn input may expose context, but it must
  not compute hidden recipe eligibility or reject the provider's choice through
  string matching.
- Superseded: Actor Turn repair input previously removed the rejected Action
  Card. The current direction keeps tool visibility governed by schemas and
  gates, while repair context carries the rejection evidence so the provider can
  change parameters, choose another visible tool, or author a bounded helper.
- Direct `Say` is now a current-state-checked card requiring a visible target
  actor. Actor-owned social action skills that deliver chat must likewise carry
  target visibility when the current single-bot runtime cannot deliver chat to
  an absent actor.
- Deliberation sparse `next_episode.pivot_triggers` now normalize string or
  evidence-less trigger objects into `{ trigger, evidence_refs: [] }` instead
  of aborting the run. Missing evidence refs on branch reframes are not
  executable authority; they are audit context.
- A short live OpenAI `gpt-5.4-nano` Actor Turn run after Action Card filtering
  reached 3 cycles before failing on missing non-authority explanation fields:
  `tmp/social-cycle-actor-turn-openai-nano-live-8-card-filter.json`.
  This is `PARTIAL`: the earlier impossible `inventory has logs` repair crash
  disappeared, but the run still over-valued chest inspection and then exposed
  parser fragility.
- A later short live OpenAI `gpt-5.4-nano` run after table and inventory recipe
  gates passed all 8 cycles and stayed under the local budget:
  `tmp/social-cycle-actor-turn-openai-nano-live-8-say-gate.json`. The run used
  11 provider calls and 60,414 total tokens, with projected day usage at about
  1.14M/9M tokens. It showed a materially better loop:
  `collectLogs -> craftPlanksAndSticks -> craftCraftingTable ->
  placeCraftingTable`, with 7/8 cycles classified as verified progress and no
  no-target `say:unavailable` attempts. This is `PARTIAL/PASS` for bounded
  single-actor competence and `FAIL` for social-plausibility proof, because no
  visible actor, request, relationship, or shared-storage interaction was in
  the scenario. It also leaves a remaining repetition risk: after a table is
  already present, repeated `placeCraftingTable` can still pass as
  `already_present` instead of pivoting to the next useful episode.
- Superseded: the first `current-state-consumption-gate` fix used Action Card
  hiding and resolver rejection for station state. The current direction rejects
  that hidden planner pattern. Crafting-table state is provider context and
  runtime evidence; strict tool args, action-skill schemas, retry constraints,
  and verifier outcomes are executable authority.
- The first `planbead-lifecycle-gate` slice is implemented for ordinary Actor
  Turn runtime evidence. Runtime evidence from `deposit_shared:deposited`,
  `inspect_chest:inspected`, `craft_item:crafted`, and
  `craft_with_table:crafted` can derive conservative PlanBead operations, then
  the guarded PlanBead applier remains the only mutation authority. Movement,
  observation, wait, remember, and provider prose do not close PlanBeads.
- The first social-smoke evaluation slice is implemented at the evidence layer:
  a shared-storage handoff can be evaluated from verified `deposit_shared`
  evidence, postcondition checks, settlement state, and shared-storage checklist
  refs without forcing a provider to choose a specific Action Card.
- The first shared-storage social-smoke setup slice is implemented. The runner
  accepts `--shared-storage-social-smoke`, writes a run-scoped context-only
  request from `npc_a`, and live runs reuse spawn-access setup while seeding a
  small `oak_log` stack. Actor Turn input now carries `shared_storage`, inventory
  counts, and `source_evidence_bundle` world-event cards so cheap models can fill
  `deposit_shared` `itemName`/`count` from current evidence instead of
  free-form prose or hidden social-request candidates.
- Shared-storage request matching was deliberately removed from the provider
  input hot path. The runtime no longer constructs `deposit_candidates`,
  `open_social_requests`, or similar preselected social intent fields. The LLM
  receives the source world event and current inventory and chooses directly.
- Completed shared-storage evidence is preserved in current truth and source
  evidence. It does not hide deposit-oriented Action Cards or force a
  request-satisfied episode status; the Actor Turn LLM or branch-time
  Deliberation must interpret the evidence under the current goal.
- Actor Turn input now carries `decision_frame` ahead of Active Episode. This is
  a compact cheap-model priority projection, not executable authority. It
  exposes `episode_focus_status`, current truths, completed work, recent action
  verdicts, do-not-repeat items, and open progress fronts. It must not expose
  parameter candidates, top eligible Action Cards, recommended next candidates,
  generated chat text, coordinates, recipe decisions, or hidden social-request
    candidates. PlanBeads remain durable work graph context through
  `source_evidence_bundle.plan_bead_cards`; `decision_frame` is the per-turn lens
  that tells the model how to consume current evidence before older episode
  wording.
- `source_evidence_bundle` is now the companion layer for observations, world
  events, recent action details, memory cards, and PlanBead cards. It prevents
  compact current-state facts from becoming summary-only bottlenecks.
- Actor Turn repair now keeps the provider-facing Action Card list and Runtime
  Action Resolver projection aligned. A card removed for a repair attempt is no
  longer accepted through the original projection.
- Runtime Action Resolver now rejects actor-owned action-skill parameters that
  contradict the selected card. The first protected case is
  `craftPlanksAndSticks` with `itemName=oak_log`; logs are ingredients, not the
  crafted output.
- Live shared-storage smoke setup now places the chest with absolute
  namespaced RCON coordinates, and `observe` uses a larger raw world-scan cap so
  low-frequency interaction blocks such as chests are less likely to disappear
  behind common terrain blocks.
- Latest low-cost OpenAI `gpt-5.4-nano` evidence:
  `tmp/social-smoke-openai-nano-2cycle-rerun6.json` passed with
  `inspect_chest -> deposit_shared`, and
  `tmp/social-smoke-openai-nano-3cycle-rerun7.json` passed with completed
  `oak_log` deposit followed by non-repeat Actor Turn inputs. That evidence was
  collected before the direct tool-calling/no-hidden-planner cleanup, so do not
  treat any Action Card hiding in that run as current architecture. The run
  proves the first shared-storage social consequence, but it does not yet prove
  a strong follow-up after completion; the third cycle still preferred
  remember/inspect rather than a richer next action.
- Earlier post-`decision_frame` evidence:
  `tmp/social-smoke-openai-nano-3cycle-decision-frame-v2.json` passed with
  `deposit_shared -> craftPlanksAndSticks -> craftCraftingTable`, 4 provider
  records, and 29,916 total tokens. It proved the social-smoke consequence under
  an older hidden request-satisfaction projection. That input shape is now
  historical because the current architecture keeps Action Cards visible and
  carries source evidence instead of hidden request-satisfaction projections.

This is the implementation plan for
`Actor-Episode-And-Actor-Turn-Architecture.md`. It is a detailed plan, not a
file-by-file implementation script. The purpose is to keep a long campaign
aligned while multiple high-reasoning workers work in parallel.

Use `Low-Cost-Social-Simulation-Campaign-Spec.md` as the campaign-level control
document for cheap-model social proof gates, run-lifecycle versus gate-verdict
separation, Given/When/Then scenarios, and long-run completion criteria. This
implementation plan records the current bridge status and workstream progress.

## Exit Condition

The campaign is done when a low-cost provider can run the new Active Episode
and Actor Turn loop with behavior that is plausibly useful for a Soul/LifeGoal
social simulation seed.

Concretely, a 60 Actor Turn run must show:

- truthful episode pass/fail with exact evidence refs;
- actionful behavior rather than observe/move loops;
- verified mutation through inventory, position, block, container, chat,
  relationship, or shared-storage evidence;
- context continuity when a concern is blocked, deferred, resumed, or replaced;
- at least one social visibility signal, such as chat, shared storage,
  relationship evidence, visible actor context, request, or obligation;
- budget-aware provider usage with no silent quota or free-tier overrun.

This does not require perfect Minecraft competence or a complete society. It
requires enough coherent action, mistakes, pivots, and truthful evidence to make
the next live test worth running.

## Live Acceptance Gates

The next 30/60-cycle runs are evaluated by gates, not by a single `passed`
label.

Gate status labels:

- `PASS`: artifact refs directly prove the gate.
- `PARTIAL`: the intended mechanism fired, but behavior or evidence remains too
  weak to accept the gate.
- `FAIL`: artifacts contradict the gate.
- `UNVERIFIABLE`: the run lacks the refs needed to judge the gate.
- `BLOCKED_ENV`: Minecraft/server/platform setup blocked evaluation.
- `BLOCKED_PROVIDER`: provider auth, quota, budget, or malformed output blocked
  evaluation before runtime behavior could be judged.

| Gate | Pass condition | Failure evidence |
|------|----------------|------------------|
| `actor-turn-cadence-gate` | ordinary turns use Actor Turn without recurring `goal_mind` or CycleJudgment provider calls | provider input snapshots show repeated archived stages without `deliberation-branch/v1` |
| `actionfulness-gate` | at least half of non-branch turns attempt a world, inventory, container, chat, or relationship mutation | observe/wait/move-only loop dominates the action attempts |
| `observe-suppression-gate` | after observe yields `no_progress` and current_state has a world scan, the next turn suppresses observe and uses existing evidence for action or justified movement | repeated observe outputs appear while inventory/world evidence is already present |
| `context-reuse-gate` | once shared storage is inspected, the actor uses the container state for a new action unless another actor/inventory event justifies a fresh inspect | repeated `inspect_chest` passes make the run look productive without changing state |
| `authoring-repair-gate` | malformed generated-action fields are normalized into repairable contract feedback or rejected with artifacts before execution | malformed `author_mineflayer_action` aborts the run without repair or reaches raw execution |
| `episode-anchoring-gate` | non-branch turns are episode-advancing, episode-maintaining, blocked-with-evidence, or justified pivots tied to `active_episode_ref`, selected PlanBeads, social pressure, or branch reason | valid Minecraft actions drift into unrelated movement or resource routines while the recorded episode stays unchanged |
| `current-state-contract-gate` | impossible inventory/world/action-card choices are rejected before Mineflayer and repaired once | missing item/count or missing target reaches Mineflayer repeatedly |
| `recipe-count-gate` | inventory-grid and table-bound recipes expose and enforce exact ingredient counts, including planks, sticks, crafting table, furnace, chest, and pickaxe-like recipes | action chosen with only "has planks" or "has sticks" when counts are insufficient |
| `social-target-gate` | direct chat or chat-delivering action skills are visible only when a target actor or equivalent runtime-deliverable social context exists | `say` targets the actor itself or returns `unavailable` in a single-bot run without social context |
| `planbead-specificity-gate` | accepted creates have concrete title, description, next notes, evidence refs, and acceptance criteria | generic `Branch concern <id>` or only "runtime evidence matching this concern" enters ready front |
| `planbead-dedupe-gate` | duplicate open creates are rejected with operation-result artifacts | same concern appears multiple times in ready front and hides specific beads |
| `ready-front-relevance-gate` | Actor Turn compact hints include high-priority specific beads with priority, next hints, blockers, dependency refs, checkpoint ref, and evidence refs | compact hints only show stale/generic beads while useful beads exist |
| `planbead-lifecycle-gate` | deposit/inspect/craft success updates or closes matching open concerns, or records why they stay open | open bead count only grows after verified success |
| `state-consolidation-gate` | verified inspect/deposit/craft evidence updates settlement state and known positions with refs | shared chest or station evidence exists but current_state still says unknown |
| `social-plausibility-gate` | when social context exists, the run records at least one episode-relevant actor response or consequence: chat, request handling, obligation, handoff/deposit, relationship event, conflict, or a branch that preserves/links the social pressure | the run has only passive visible actors or single-actor resource/crafting behavior |
| `budget-gate` | provider usage remains under the declared free-tier/local budget and reports projected day usage | missing ledger, silent quota failure, or unbounded retries |

A run may pass bounded single-actor Minecraft competence while failing
`social-plausibility-gate`. That is useful progress but not completion of this
campaign.

## Evidence For The Change

The recent 60-cycle run completed all cycles but exposed weak behavior:

- most actions were `observe` or `move_to`;
- final inventory was empty;
- no crafting table, shelter, shared-storage contribution, chat, visible actor,
  or relationship event was established;
- three LLM stages produced high provider volume while responsibility was
  fragmented;
- generic movement could make a run look passed even when the active social or
  settlement concern did not advance;
- PlanBead closure could accept broad runtime success instead of evidence
  matching the bead's concern.

This plan treats those as architecture failures, not prompt-wording failures.

## Planning Method

The campaign adapts harness patterns as coordination discipline:

- use contract-first specs before implementation;
- keep implementation plans as durable markdown artifacts;
- define source-of-truth ownership for every record;
- freeze versioned runtime artifacts early;
- write risky behavior as Given/When/Then examples, not only abstract rules;
- classify acceptance evidence by tier: schema, artifact refs, live Mineflayer
  mutation, and manual social-plausibility review;
- split worker lanes by capability boundary;
- merge only after focused verification and current-worktree review;
- judge behavior from runtime artifacts, not provider prose.

The harness mechanism is not a new Minecraft runtime authority. Runtime truth
still comes from Mineflayer execution, verifier output, transcript, actor
workspace artifacts, provider usage records, and review summaries.

Plan documents should stay plan-shaped. Volatile run logs, long command output,
and dated findings belong in handoff or audit artifacts once they stop changing
the next workstream. The durable plan should keep:

- current exit gates;
- versioned contracts and ownership boundaries;
- worker lanes and merge responsibilities;
- phase deliverables and acceptance evidence;
- live-run commands and review criteria.

## Workstreams

| Workstream | Goal | Acceptance |
|------------|------|------------|
| W0 spec routing | Land the target architecture, plan, terminology, search index, and sidebar routing | Docs build passes and search tokens route to the new docs |
| W1 versioned contracts | Define `active-episode/v1`, `actor-turn-input/v1`, `actor-turn-output/v1`, `action-card/v1`, `evidence-trace/v1`, and `deliberation-branch/v1` | Contract fixtures validate and report refs can resolve |
| W2 Action Cards | Project primitives and actor-owned action skills into unified provider-visible cards | Provider no longer chooses primitive vs action skill as the primary decision |
| W3 Actor Turn provider | Replace hot-path goal plus action planner calls with one Actor Turn call | One turn produces exactly one visible Action Card tool call or `author_mineflayer_action` |
| W4 Runtime Action Resolver | Map Action Cards to existing primitive/action-skill/generated-action paths | Parameters validate before execution and retry constraints block repeated exact blockers |
| W5 Evidence Trace | Append turn evidence with post-action observation where possible | Next Actor Turn can see what changed without mandatory re-observe |
| W6 only-on-branch Deliberation | Move per-cycle goal mind into branch-triggered episode reframing | Deliberation runs only on branch conditions and cannot choose actions |
| W7 PlanBead integration | Keep PlanBeads as durable work graph under Deliberation and compact hints | Ready-front/context artifacts are visible every cycle; generic and duplicate creates are rejected; compact hints preserve actionable fields; old concerns are not silently erased |
| W8 episode review | Replace broad social-cycle pass with episode-specific verdicts and metrics | False pass count is zero in deterministic and live reports |
| W9 live low-cost evaluation | Run 30-turn then 60-turn live gates under usage guard | Actor-turn cadence, actionfulness, current-state, PlanBead, settlement, social-plausibility, and budget gates pass or blockers are classified truthfully |

## Runtime Evidence Matrix

| Artifact or gate | Owner | Proves | Does not prove |
|------------------|-------|--------|----------------|
| deterministic contract tests | runtime/tests | schema, validator, resolver, and artifact-ref contracts | live Minecraft competence |
| offline provider smoke | provider bridge | provider JSON shape and snapshot wiring | world mutation or action usefulness |
| `actor-turn-current-state/v1` | runtime context builder | current bounded state was exposed to provider | that the provider used it correctly |
| Action Card `parameter_hints` | runtime action surface projection | provider saw accepted parameter/precondition guidance | executable permission or success |
| Action Card `current_state_requirements` | Runtime Action Resolver | impossible current-state choices and insufficient recipe counts are stopped before Mineflayer execution | that the next provider repair will choose the best prerequisite |
| `evidence-trace/v1` | runtime classifier | prior turn result and refs are available to the next turn | physical success without verifier evidence |
| `plan_bead_ready_fronts[]` and `plan_bead_packet_ref` | PlanBead ready-front builder | PlanBead graph context was preserved and exposed | PlanBead mutation or satisfaction |
| Actor Turn `source_evidence_bundle.plan_bead_cards` | Actor Turn input builder | high-priority PlanBead context reached the cheap model with next hints, blockers, dependency refs, checkpoint ref, and evidence refs | that the provider used the card correctly |
| `plan_bead_operation_results[]` | guarded PlanBead applier | each proposed mutation was accepted or rejected with reason, including generic or duplicate create rejections | that a satisfied close semantically matched the bead concern unless review checks it |
| settlement state `known_positions` | settlement consolidator | station and shared-chest inspect/deposit evidence reached current state | that the actor will choose the socially best next action |
| social signal artifacts | runtime/social context | visible actors, chat, obligations, relationships, or shared-storage consequences existed | broad social simulation competence |
| live 30/60 Actor Turn run | integrated runtime | cheap-model behavior under budget and real Mineflayer constraints | product readiness or broad social simulation |
| episode review summary | review/audit | pass/fail and failure class are evidence-linked | truth beyond cited artifacts |

## Parallel Worker Lanes

Parallel workers may be used aggressively, but each lane must have a contract
and cannot mutate unrelated state.

| Lane | Focus | Handoff artifact |
|------|-------|------------------|
| Contract lane | Types, schemas, fixtures, compatibility mapping | Contract summary, changed schemas, focused validation command |
| Provider lane | Actor Turn prompt, structured output, budget-aware packet shape | Provider input/output snapshots and token estimate |
| Runtime lane | Action Card resolution, parameter validation, serialized execution, retry constraints | Runtime evidence refs and focused tests |
| Evidence lane | Evidence Trace, post-observation refs, episode review summary | Report sample and audit output |
| PlanBead lane | Selected/related bead hints, branch-time operations, closure criteria | Bead operation results and closure evidence matrix |
| Evaluation lane | 30/60 turn rubric, review script updates, failure classifications | Review summary JSON and manual inspection checklist |
| Docs lane | Terminology, search index, documentation map, handoff | Docs build output and changed-doc map |

Coordinator responsibilities:

- inspect the current worktree before merging worker output;
- keep lane patches disjoint where possible;
- reject patches that revive the three-stage loop as the target architecture;
- run the selected verification commands after integration;
- record live-run blockers as provider, environment, budget, runtime, or actor
  behavior blockers.

## Phase Plan

### Phase 0 - Spec And Routing

Goal: make the new architecture reviewable before implementation.

Deliverables:

- target architecture spec;
- implementation campaign plan;
- terminology entries for Active Episode, Actor Turn, Action Card, Evidence
  Trace, Runtime Action Resolver, Runtime Classifier, and Deliberation;
- search index, documentation map, and sidebar routing.

Verification:

```bash
git diff --check
cd docs && npm run build
```

### Phase 1 - Deterministic Contract Gate

Goal: prove the new contracts can be emitted, validated, and audited without a
live provider or Minecraft server.

Deliverables:

- contract fixtures for one normal turn, one blocked turn, one generated-action
  trial proposal, and one branch-to-Deliberation case;
- report/audit checks for missing refs, false pass, weak evidence promotion,
  and PlanBead closure evidence.

Acceptance:

- all required refs resolve;
- provider prose cannot satisfy a physical or social claim;
- `move_to` cannot satisfy unrelated PlanBead concerns;
- repeated exact blocker fixture creates a retry constraint before the third
  equivalent execution.

### Phase 2 - Action Card And Actor Turn Vertical Slice

Goal: collapse the hot path to one provider choice while preserving runtime
authority.

Deliverables:

- Action Card projection from existing primitives and actor-owned action skills;
- Actor Turn provider input and output snapshots;
- resolver mapping from selected Action Card tools to current executable records;
- compatibility bridge to existing social-cycle report fields.

Acceptance:

- provider sees card descriptions and parameter schemas, not a strategic
  primitive-vs-action-skill taxonomy;
- missing physical parameters fail before Mineflayer execution;
- existing deterministic social-cycle tests still pass or are migrated with
  explicit compatibility notes.

### Phase 3 - Evidence Trace And Runtime Classifier

Goal: make the next turn learn from the previous turn without adding another
mandatory LLM stage.

Deliverables:

- `evidence-trace/v1` entries for action result, verifier status, helper events,
  provider usage, and post-observation;
- Runtime Classifier outcomes for continue, close, defer, blocked, branch, and
  provider-budget-blocker;
- episode review summary metrics.

Acceptance:

- ordinary turns do not require CycleJudgment provider calls;
- episode pass/fail cites evidence trace refs;
- no observe-only or memory-only evidence can create a pass.

### Phase 4 - Only-On-Branch Deliberation

Goal: preserve long-run coherence without calling goal mind every turn.

Deliverables:

- branch condition detector;
- Deliberation provider input/output contract;
- guarded PlanBead operation handoff;
- Active Episode update records.

Acceptance:

- Deliberation fires on meaningful branch conditions, not cycle boundaries;
- non-branch Actor Turn continuation cycles reuse the same
  `active-episode/v1` and do not emit repeated `goal_mind` provider snapshots;
- reports expose `active_episode_ref` and `deliberation_branch_ref` enough for
  audits to prove provider-call cadence;
- Deliberation cannot emit executable actions;
- old concerns remain open, blocked, deferred, completed, or linked when new
  concerns appear.

### Phase 5 - Generated Mineflayer Action Use

Goal: make the actor more active when existing cards cannot solve the immediate
problem.

Deliverables:

- Actor Turn `author_mineflayer_action` choice mapped to the existing
  action-selection-gated generated action skill path;
- generated candidate source, input schema, parameters, helper allowlist,
  verifier, timeout, trial evidence, and actor workspace storage;
- failed and passed trial summaries.

Acceptance:

- generated code is never raw runtime authority;
- helper violations, infinite-loop risks, missing parameters, and verifier
  failures route back as evidence for the next Actor Turn;
- passed trials become actor-owned candidate or promotable records according to
  lifecycle policy, not hidden global skills.

### Phase 6 - Low-Cost Live Gates

Goal: prove the architecture against real Minecraft behavior and budget limits.

Gate order:

1. deterministic contract gate;
2. low-cost provider JSON smoke, 1 to 3 turns;
3. 30 Actor Turns;
4. 60 Actor Turns;
5. episode review and manual stratified inspection.

Provider policy:

- prefer deterministic mode for schema and audit gates;
- use a clearly selected low-cost provider for live gates;
- run provider smoke before long live runs;
- stop or downgrade when budget status is `would_exceed`, provider quota is
  unknown, or headroom is insufficient.

## 30 Actor Turn Acceptance Gate

Hard requirements:

- 30 Actor Turns recorded, or an early stop has a truthful blocker verdict;
- 100 percent of required artifact refs resolve;
- zero misleading episode passes;
- every claimed mutation has runtime evidence;
- movement-only `position_delta` is recorded as context, not verified mutation;
- repeated observe after `no_progress` is either justified by changed context or
  becomes a truthful branch/blocker, not another observe-only turn hidden by
  ad hoc card suppression;
- repeated inspect of unchanged shared storage does not count as another
  mutation;
- malformed `author_mineflayer_action` output either repairs into a valid
  existing/generated action or records a contract blocker before execution;
- live provider calls write usage ledger rows;
- repeated exact blockers create retry constraints before a third equivalent
  execution.

Behavior thresholds:

- non-observe/wait/remember turns are at least 60 percent;
- remember-only turns are at most 10 percent;
- verified mutation turns are at least 30 percent or at least 8 turns;
- at least 80 percent of failed or blocked turns are diagnosable;
- top single action is at most 45 percent of turns;
- at least 5 distinct action families are used;
- at least 2 pivots occur after blocker or observation evidence;
- at least 80 percent of non-branch actions are tied to the Active Episode,
  selected PlanBeads, social pressure, or a recorded branch reason;
- at least one social visibility event appears, and it leads to an episode
  response or preserved social-pressure branch when social context exists.

Passing this gate means the loop is plausible. It does not prove a society.

## 60 Actor Turn Acceptance Gate

Hard requirements:

- all 30-turn hard requirements still pass;
- context compaction preserves evidence refs and does not launder weak evidence
  into progress;
- episode final verdict cites exact turn and evidence refs;
- budget guard never silently overruns.

Behavior thresholds:

- non-observe/wait/remember turns are at least 65 percent;
- verified mutation turns are at least 35 percent or at least 20 turns;
- top single action is at most 35 percent of turns;
- top 3 actions are at most 70 percent of turns;
- at least 7 distinct action families are used;
- exact same blocker target/args is not executed more than twice after
  constraint creation;
- at least 4 meaningful pivots occur;
- movement-only attempts are followed by a fresh observation or an action that
  uses the new position before another movement-only attempt is counted useful;
- at least one multi-step continuity chain survives 3 or more turns;
- at least one actor action becomes socially visible through chat, shared
  storage, relationship evidence, request/obligation, visible actor context, or
  another actor's later context/action.

Passing this gate means the architecture is acceptable for cheap-model
social-simulation experiments.

## Failure Classifications

Episode reviews should use these labels:

- `misleading-success`: pass claim lacks evidence;
- `artifact-gap`: missing refs or insufficient evidence detail;
- `tool-evidence-gap`: tool cannot report what verifier needs;
- `verification-gap`: evidence exists but verifier accepts a weak proxy;
- `provider-schema-gap`: malformed provider outputs recur;
- `action-timidness`: too many observe, wait, or remember turns;
- `reckless-action`: many invalid or unsafe repeated actions;
- `loop-constriction`: choices collapse into one narrow loop;
- `episode-drift`: valid actions no longer relate to the Active Episode,
  selected PlanBeads, social pressure, or recorded branch reason;
- `provider-repeat`: provider repeats blocked target and args;
- `retry-gate-gap`: repeated blocker is not converted into a pre-execution gate;
- `state-consolidation-gap`: verified progress does not update episode or
  actor state;
- `social-surface-gap`: no visible social signal despite social-simulation
  claims;
- `relationship-evidence-gap`: relationship event lacks guarded evidence;
- `episode-continuity-loss`: old concern is erased when new concern appears;
- `compaction-laundering`: compacted context upgrades weak evidence into
  progress;
- `harness-narrowing`: scenario over-shapes behavior into a checklist executor;
- `provider-budget-blocker`: usage guard, quota, or budget blocks the run;
- `environment-blocked`: server, Docker, auth, Java, port, or platform setup
  blocks execution.

## Verification Commands

Use the smallest command that proves the phase, then broaden only when the
surface changes:

```bash
bun run typecheck
bun test probe/test/socialarchived planner actionContracts.test.ts
bun test probe/test/socialCycleRunner.test.ts
git diff --check
cd docs && npm run build
```

Live-run verification must include provider usage summary, actor workspace
artifacts, transcript, evidence refs, and episode review summary. A completed
cycle count is not enough.

## Guardrails

- Do not rename `CycleGoal` into Active Episode without changing authority
  boundaries.
- Do not preserve `goal_mind -> action_planner -> judgment` as the target hot
  path.
- Do not make Deliberation run every turn.
- Do not make PlanBeads a second action planner.
- Do not make Action Cards a domain strategy checklist.
- Do not treat `move_to` as meaningful progress unless the Active Episode
  explicitly accepts travel or scouting as the success signal.
- Do not let generated Mineflayer source execute outside the gated candidate
  trial path.
- Do not optimize for benchmark progress if the behavior ignores ActorSoul,
  LifeGoal, relationships, obligations, or social consequences.
