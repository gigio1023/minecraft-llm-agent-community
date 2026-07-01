# Social WAM Research Frame

Search token: `SOCIAL_WAM_RESEARCH_FRAME_2026_06_16`.

Date: 2026-06-16.

Status: dated research framing. This document records the current research
direction discussion. It is not an active runtime contract.

## Purpose

The current research question should not be framed as "can a Minecraft agent
complete tasks?" or "can a large number of agents look like a civilization?"
Those questions are already heavily covered by task benchmarks, visual-policy
work, Project Sid-style civilization claims, and multi-agent collaboration
benchmarks.

The more precise question for this repo is:

```text
Can an action-conditioned model predict and support verified social-material
state transitions in Minecraft?
```

This is a stronger framing than saying "predict social behavior." Social
behavior is too broad and too easy to reduce to dialogue plausibility. The
target should be social transition modeling under Minecraft constraints:
possession, access, claims, obligations, trust, public affordances, repair,
movement, inventory, crafting, storage, and continuation after an immediate
task.

## VLA, WAM, And The Local Interpretation

Vision-language-action work usually asks for an action policy:

```text
P(action | observation, instruction, history)
```

In Minecraft, this maps to systems that observe pixels or state, read a goal,
and output camera/button actions, primitive actions, or action-skill choices.
VPT is mostly vision-action. STEVE-1 and similar systems add language
conditioning. MineStudio is an important reference for this lane, but it is not
the current runtime.

World action models ask a different question:

```text
P(future state | past state, action, context)
```

The local project should adapt WAM at a structured Minecraft level first, not
as a pixel-video generator and not as low-level human-motion prediction. The
relevant actions are typed Minecraft and social actions:

- physical primitives such as `move_to`, `mine_block`, `place_block`,
  `craft_item`, `inspect_container`, and `deposit_item`;
- action skills such as `gather_logs`, `craft_furnace`, or
  `build_small_shelter`;
- social actions such as `request_item`, `lend_item`, `return_item`,
  `refuse_request`, `repair_failed_promise`, `claim_container`, and
  `share_public_station`.

The WAM-like layer should predict likely consequences and required evidence. It
must not become runtime authority. It should not fill missing primitive
arguments, mark progress true, override verifiers, or replace Actor Turn action
selection.

## Social Theory Anchors

The useful social-science move is to define social behavior as action whose
meaning and consequence are oriented toward other actors, not just action that
contains dialogue.

Mechanically useful anchors:

- Weber: social action is meaningful action oriented toward others.
- Mead and Blumer: meaning emerges through interaction and interpretation.
- Homans and Blau: exchange, reciprocity, costs, rewards, and dependence matter.
- Granovetter: economic behavior is embedded in ongoing relationships.
- Coleman and Putnam: trust, obligations, information channels, and norms are
  forms of social capital.
- North and Ostrom: rules and institutions structure what actors can expect,
  claim, access, sanction, or repair.
- Bicchieri and Elster: norms depend on empirical and normative expectations.
- Coleman and Schelling: micro-level actions can produce macro-level social
  patterns.

For this repo, these concepts should be operationalized as Minecraft-visible
state changes. They should not become decorative theory language.

## Proposed Model Object

Use the working name:

```text
Evidence-Grounded Social WAM
```

or the more conservative paper-facing phrase:

```text
Action-Conditioned Social Transition Modeling in Minecraft
```

Inputs:

- physical state: actor positions, inventory, blocks, containers, stations,
  health, hunger, loaded-world limits, and action-skill evidence;
- social state: relationships, trust, obligations, claims, access rights,
  requests, refusals, promises, repairs, and known conflicts;
- institutional state: local rules, weak commons, public affordances, shared
  station conventions, and settlement norms;
- actor memory: evidence-linked recollections, unresolved PlanBeads, prior
  interaction outcomes, and actor-specific possessions;
- candidate action: a typed primitive, action skill, or social action.

Outputs:

- physical delta: expected changes in inventory, block state, container state,
  position, station availability, or tool durability;
- social delta: expected changes in obligation, trust, claim, access,
  relationship, role, conflict, or repair state;
- future constraints: what becomes easier, harder, expected, risky, blocked, or
  socially required after the action;
- expected evidence: which verifier, ledger, chat, inventory, block, container,
  memory, or transcript artifacts should exist if the transition happened;
- uncertainty and blockers: loaded-world limits, missing evidence, conflicting
  claims, missing tools, failed movement, absent actor, or unfulfilled
  preconditions.

## Example Transition

Candidate action:

```text
lend_item(from=alice, to=bob, item=stone_pickaxe)
```

Expected physical delta:

- Alice loses possession or direct access to one stone pickaxe.
- Bob gains possession or direct access to one stone pickaxe.
- The item may later have lower durability.

Expected social delta:

- A return obligation is created.
- Bob receives temporary access, not permanent ownership.
- Alice's trust in Bob may increase after successful return or decrease after
  loss, delay, or misuse.

Future constraints:

- Bob can attempt stone or ore-related work sooner.
- Alice may be blocked from her own mining work until the item returns or a new
  tool is made.
- A later `return_item` or `repair_failed_promise` action becomes socially
  meaningful.

Expected evidence:

- inventory delta or container delta;
- chat or interaction event expressing request/lend/return;
- obligation ledger entry;
- later fulfillment, violation, or repair artifact.

## Benchmark Implication

The benchmark should evaluate social-material transitions rather than artifact
existence. Evidence remains hygiene and audit surface; it is not the
contribution.

Candidate benchmark families:

- `borrowed_tool_v1`: request, lend, use, return, damage, loss, or repair;
- `claimed_chest_v1`: personal possession, claim violation, apology, or
  restitution;
- `public_furnace_v1`: weak commons without turning shared resources into a
  top-level economy;
- `scarce_food_v1`: need-driven dependence, refusal, prioritization, and repair;
- `failed_promise_v1`: promise, failure, explanation, restitution, and trust
  update;
- `asymmetric_knowledge_v1`: one actor knows a resource, route, danger, or
  station state and must communicate or exploit that knowledge.

Scoring should include:

- transition prediction accuracy;
- evidence-backed physical completion;
- evidence-backed social-state update;
- cost, latency, cycle count, and action count;
- post-goal continuity;
- failure recovery and repair quality;
- distinction between dialogue-only claims and world-backed consequence.

## Boundaries

Do not claim this project is building a full society simulator yet.

Do not compete with MineStudio on visual-policy infrastructure, task manifests,
or MineRL/Malmo simulator depth.

Do not compete with VPT, STEVE-1, or NitroGen as a low-level action policy.

Do not copy Project Sid's civilization-scale framing as a target style.

Do not make an evidence-first benchmark the research contribution. Evidence is
required to make claims reviewable; the research value is the social-material
transition being modeled and tested.

Do use related work as mechanism inventory:

- MineStudio for task manifests, reset/record discipline, callbacks, and
  secondary video review;
- Project Sid for case patterns and cautionary failure modes;
- social-simulation benchmarks for social intelligence and norm scenarios;
- WAM literature for action-conditioned transition modeling;
- VLA literature for future comparisons to policy-only systems.

## First Implementation Direction

The first useful implementation is not a large learned world model. It is a
small logged predictor/evaluator lane:

1. Define typed social-material transition records.
2. Attach them to actor actions and verifier artifacts.
3. Ask models to predict deltas before acting in a quota-guarded benchmark.
4. Compare prediction, action, evidence, and later social state.
5. Keep the predictor advisory until runtime artifacts prove it improves
   continuity without laundering progress.

This keeps the work aligned with the current Actor Turn, action-skill,
PlanBead, artifact, and quota-guarded runtime boundaries.
