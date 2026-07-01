# Data and Training Feasibility for a Social-Material WAM

Lane 5 of the deep social-WAM literature review. Read
`prompts/00-shared-lane-contract.md` for shared definitions. This file decides,
brutally practically, whether and how this repo should build a World Action Model
(WAM), grounded in (a) what the canonical WAM data literature actually costs and
(b) what this repo's Mineflayer runtime already produces for free.

Jargon defined on first use. "WAM" = a model of `p(o', a | o, l)` that both
forecasts a future state `o'` and proposes an action `a` aligned to it. "Verifier"
= the repo's runtime check that certifies whether a proposed action actually
changed the world (movement, inventory, container, block, chat), rejecting
"fake progress". "Auto-label" = a training label produced by a program, not a human.

## 1. The one fact that drives everything

The canonical WAM data ecosystem is robot teleoperation + portable human demos +
simulation + egocentric video. It is huge, expensive, and pixel-first. From the
WAM survey data section (arXiv 2605.12090, `050-data.tex`): OXE has 1M+
trajectories across 22 robots; SynGrasp-1B has 10M simulated grasps; Ego4D has
3,670 hours of video; DreamDojo 43,827 hours. Every dataset column is a pixel or
sensor modality (RGB, depth, proprioception, point cloud, tactile, audio). A grep
of the survey's evaluation and opportunities sections returns zero hits for
"minecraft", "structured state", or "symbolic".

Two reference points show what *Minecraft* pixel data costs:

- **VPT** (arXiv 2206.11795) had to pay contractors $20/hour to record video plus
  an actions JSONL plus a Minecraft state file, because web Minecraft video has no
  action labels. ~4,500 hours used cost ~$90,000; ~$160k total. The expensive part
  is buying a labeled seed so an Inverse Dynamics Model can pseudo-label the rest.
- **Oasis** (Decart/Etched, 2024) trained a pixel diffusion world model on
  "millions of hours" of gameplay; it runs one frame per keystroke at 360-720p,
  20 fps, on NVIDIA H100, and drifts after a few minutes.

**This repo's structural advantage:** its Mineflayer runtime is a deterministic
world where before/after state is exactly observable, and the verifier already
certifies what changed. So the repo gets simulation-grade `(o_t, a_t, o_{t+1})`
ground truth, the exact triplet the WAM survey calls the WAM advantage, as a
typed JSON record, per Actor Turn, at roughly **$0 marginal labeling cost**. It
never renders a pixel, never trains an IDM, never buys contractor hours. That
contrast is the backbone of the feasibility argument below.

Be honest about the flip side: the repo's runs are cheap to *label* but not free
to *generate*. Each social-cycle run consumes a live LLM provider call per turn and
real wall-clock Minecraft time. Volume is bounded by provider budget and run
throughput, not by annotation. So "cheap data" means cheap labels on moderate
volume, not internet-scale.

## 2. The five build options, judged

### Option A: Train a WAM from scratch (pixel)

Reproduce VPT/Oasis-style pixel pretraining on Minecraft video.

- Data: tens of thousands of hours of video; for action grounding, a labeled seed
  (VPT: ~100 h minimum, ~2,000 h for best IDM).
- Compute: VPT/Oasis scale = many H100-days to H100-months. Oasis needs an H100
  just to *infer* at framerate.
- Verdict: **reject.** Wrong modality (pixels, not typed social-material state),
  enormous cost, and it would not even produce possession/obligation predictions.
  The project rule is "runtime owns physical truth"; a pixel WM would re-learn,
  noisily and expensively, facts Mineflayer already reports exactly.

### Option B: Adapt existing Minecraft weights (VPT / STEVE-1 / Optimus-2)

Fine-tune a released pixel policy/world model.

- STEVE-1 (arXiv 2306.00937) is a cheap anchor: instruction-tuned VPT for **$60**.
  But it consumes raw pixels and emits mouse/keyboard, and predicts behavior, not
  social-material consequences.
- Optimus-2 MGOA (arXiv 2502.19902): 8 atomic gather/craft tasks, pixel + low-level
  action, single-actor. No social content.
- Verdict: **reject as a predictor; keep as contrast.** Modality and scope mismatch.
  These weights know "how to move a mouse to mine a log from pixels," not "if Bob
  takes the shared pickaxe, Carol can no longer mine and a borrowing obligation
  forms." There is no transfer path worth the integration cost.

### Option C: LLM as zero-shot / few-shot delta predictor (provider-free in design)

Use a prompt-shaped harness where, given `state_before` + `candidate_action`, an
LLM predicts the delta and consequences; score predictions against the verifier's
actual deltas. Design it provider-agnostic; run it later under the existing usage
guard.

- Data needed to *start*: none beyond a held-out set of already-logged transitions
  for scoring.
- Cost: only the eventual inference calls, which the repo already meters via
  `provider_usage` and budget guards. The harness itself is provider-free code.
- Fit: **high, and it is the correct first move.** It needs no training, exploits
  the LLM's existing world knowledge, and directly tests the project's real
  question: can a model anticipate social-material consequences well enough to be
  an *advisory* WAM (the contract forbids it from filling args or overriding verifiers).
- Caveat: this is evaluation/elicitation, not a learned model. It establishes the
  ceiling and the eval harness before anyone trains anything.

### Option D: Structured transition dataset from runtime logs (the asset)

Emit, per Actor Turn, a typed transition ROW (schema in §4) from artifacts the
runtime already writes. Auto-labeled by the verifier.

- Data: every cycle of every social run becomes K rows; a 40-cycle run is ~40 rows
  today. The `social-cycle-review-summary/v1` artifact already materializes most of
  a row per cycle (see §3).
- Label cost: ~$0 (verifier + inventory/container deltas + social-event ledger).
- Fit: **highest.** This is the unique, defensible asset. It is the WAM survey's
  prized `(o_t, a_t, o_{t+1})` triplet, in a modality (typed social-material state)
  that no public dataset covers, produced cheaply.
- Honesty: volume is the constraint. Hundreds to low-thousands of rows in 2 months
  is realistic from logged runs; not millions. That is fine for evaluation and for
  a small symbolic model, not for pixel-scale pretraining.

### Option E: Small symbolic / learned transition model, or fine-tuned adapter

Once Option D has K rows, train a small model that maps
`(state_before, candidate_action) -> predicted_delta` (and a social head for
`social_delta`). Could be a tiny tabular/GBDT model for physical deltas, or a
small fine-tuned LLM adapter for the social/obligation head.

- Data: the Option D rows. Physical deltas are largely deterministic functions of
  typed state, so a small model (or even rules) can hit high accuracy; the social
  head is the part worth learning.
- Cost: small. Adapter fine-tune on hundreds-thousands of rows is hours on one GPU,
  not H100-months.
- Fit: **medium-high, but sequenced after C and D.** Only worth doing once the
  zero-shot harness (C) shows where the LLM is weak and the dataset (D) has enough
  social rows. Latent-action methods (LAPA, arXiv 2410.11758) are explicitly *not*
  needed here: LAPA invents an action vocabulary from pixels via VQ-VAE because
  video lacks labels; this repo already has a typed action vocabulary and typed
  deltas, so latent-action discovery adds entanglement risk for no gain. Keep LAPA
  only as the fallback if the project ever wants to mine raw unlabeled pixel runs.

### Verdict ordering

C and D first, in parallel (harness + ROW logging), then E if warranted. A and B
rejected for build; B kept as contrast in the writeup. This matches the project
rule that a WAM stays **advisory**: Option C/D/E all predict-and-score; none fills
args, marks progress true, or overrides the verifier.

## 3. What the runtime already emits (real artifacts)

Grounded in real report JSON inspected this lane (not hypothetical):

- `social-cycle-run-report` (e.g. `tmp/social-cycle-...-20260607T152128Z.json`):
  `cycles[]` each with `provider_input_refs`, `provider_output_refs`,
  `evidence_refs`, `judgment_ref`, `verifier_status`, `action_attempts[]`. Plus
  `settlement_state` (schema `settlement-state/v1`), `postcondition_results`,
  `plan_bead_operation_results`, `provider_usage` (token totals + budget).
- `action_attempts[].runtime_result.last_tool_result` carries the **verified
  physical delta** directly: `beforePosition`, `afterPosition`, `distanceMoved`,
  `requestedTarget`/`target`, `action_parameter_contract` (the typed candidate
  action), and `runtime_hooks[]` whose post hook sets
  `progress_classification: verified|...`.
- `social-cycle-review-summary/v1` (the `...-review-summary.json`) already
  materializes a near-row per cycle in `rows[]`:
  `cycle_id, attempt_id, action_kind, primitive_or_skill, verifier_status,
  judgment_outcome (verified_progress | partial_verified_progress | no_progress |
  blocked), what_happened, evidence_count, world_scan_refs, world_scan_counts,
  movement_contract_status, retry_constraint_blocked`. A 50-cycle run shows this row
  shape generalizing across `collectLogs`, `craft_item`, `place_block`,
  `build_pattern`, `mine_block`, `author_mineflayer_action`.
- `settlement-state/v1` carries the material-economy state: `inventory_counts`,
  `shared_storage{status,items,evidence_refs}`, `known_positions{actor, crafting_table,
  shared_chest, shelter}`, `available_action_skill_ids` (incl. the social/economic
  skills `approachAndRequestItem`, `depositSharedItems`, `handoffItemAtChest`,
  `waitForBusyCrafter`), `blocker_histogram`.
- `grounded-social-trajectory-report/v1`
  (`project-docs/experiments/curated/2026-06-15/grounded-social-trajectory-smoke/report.json`) carries the
  **social-event ledger**: `events[]` typed as `request | promise | shared_deposit |
  shared_inspect | ...` with `actor_id, target_actor_id, item_id, count, container_id,
  evidence_refs` (refs chain to `inventory:...`, `container:...`, `transcript:...`,
  and prior `event:...`). Scored `dimensions[]` (physical_contribution,
  social_exchange, cross_actor_consumption) each cite `evidence_event_ids`.
- `benchmark-score-bundle/v1`
  (`project-docs/experiments/curated/2026-06-14/placed-furnace-natural-60/scored-summary.json`) shows
  auto-label rules already exist as `evidence_rule` strings per milestone
  (e.g. "1 if craft evidence produced an item ending in `_planks` at least once").

So the ingredients of a transition ROW already exist across these artifacts; what
is missing is a single per-action record that joins them and adds an explicit
`predicted_delta` slot.

## 4. The concrete dataset ROW schema (tied to real fields)

One row = one Actor Turn action attempt. Field names map to the real artifacts in
§3. `predicted_delta` is the only genuinely new field (it captures the advisory
WAM's forecast, which is currently implicit in `expected_outcome` /
`success_evidence` on the Action Card tool call).

```jsonc
{
  // identity (from review-summary rows[] / cycles[])
  "row_id": "social-cycle-1381e729/npc_b/cycle-0001-action-01",
  "run_id": "social-cycle-1381e729-...",
  "actor_id": "npc_b",
  "cycle_id": "cycle-0001",
  "attempt_id": "cycle-0001-action-01",
  "provider_model": "gpt-5.4-mini",        // from report.provider

  // STATE_BEFORE: typed, bounded (from settlement-state/v1 at turn start
  // + source_evidence_bundle refs; NOT pixels)
  "state_before": {
    "inventory_counts": {},                 // settlement_state.inventory_counts
    "shared_storage": {"status": "unknown", "items": []},
    "known_positions": {                    // settlement_state.known_positions
      "actor_position": {"x":0.5,"y":64,"z":0.5},
      "crafting_table": {"status":"unknown"},
      "shared_chest": {"status":"unknown"}
    },
    "available_action_skill_ids": ["approachAndRequestItem","depositSharedItems", "..."],
    "open_obligations": [],                  // from social-event ledger (promises not yet fulfilled)
    "relationship_refs": [],                 // actor workspace relationship edges
    "recent_blockers": [],                   // settlement_state.blocker_histogram
    "world_scan_refs": [],                   // world-state-summary/v1 refs
    "cycle_goal_summary": "Scout a nearby reachable area ..."
  },

  // CANDIDATE_ACTION: the typed tool selection (from provider-output /
  // action_parameter_contract); prose rationale kept as context, never as label
  "candidate_action": {
    "action_kind": "use_primitive",         // use_primitive | use_action_skill | author_mineflayer_action
    "primitive_or_skill": "move_to",        // review-summary.rows[].primitive_or_skill
    "parameters": {"target": {"kind":"scout","source":"direction_distance","direction":"north","distance":4}},
    "expected_outcome": "position_delta",   // Action Card tool enum
    "why_this_action": "..."                // context only
  },

  // PREDICTED_DELTA: advisory WAM forecast (NEW field; today implicit in
  // expected_outcome/success_evidence). For zero-shot harness (Option C) this is
  // the model's prediction; for logged rows it can be backfilled from
  // expected_outcome as a weak baseline.
  "predicted_delta": {
    "physical": {"position_delta": true, "inventory_delta": {}, "container_delta": {}, "block_delta": {}},
    "social": {"obligation_created": null, "obligation_fulfilled": null, "item_transfer": null},
    "future_constraints_predicted": []      // e.g. "actor distance to worksite decreases"
  },

  // VERIFIED_DELTA: ground truth, AUTO-LABELED by the verifier (from
  // runtime_result.last_tool_result + runtime_hooks)
  "verified_delta": {
    "verifier_status": "passed",            // passed | failed | not_applicable
    "judgment_outcome": "no_progress",      // verified_progress | partial_verified_progress | no_progress | blocked
    "progress_classification": "verified",  // runtime_hooks[post].progress_classification
    "physical": {
      "before_position": {"x":0.5,"y":64,"z":0.5},
      "after_position": {"x":0.5,"y":64,"z":-2.5},
      "distance_moved": 3,
      "inventory_delta": {}, "container_delta": {}, "block_delta": {}
    },
    "what_happened": "Runtime classifier saw verifier=passed, tools=move_to ..."
  },

  // SOCIAL_DELTA: typed social events caused by this action (from
  // grounded-social-trajectory-report/v1 events[] joined on cycle+actor)
  "social_delta": {
    "events": [],                           // e.g. {"type":"shared_deposit","item_id":"oak_log","count":1,"target_actor_id":null,"container_id":"shared_chest_spawn"}
    "dimension_findings": []                // from report.dimensions[].findings
  },

  // EVIDENCE_REFS: immutable artifact pointers that justify every label above
  "evidence_refs": [
    "evidence/cycle-0001-action-01-move_to.json",
    "judgments/cycle-0001-action-01-judgment.json",
    "provider-outputs/actor-turn-cycle-0001-action-01-...-out.json"
  ],

  // FUTURE_CONSTRAINTS: what this action enabled/blocked downstream (physical
  // dependency the contract requires be visible: "Bob can now mine" needs "Bob has
  // a pickaxe durability>0"). Derived from next-turn settlement-state diff.
  "future_constraints": {
    "newly_available_action_skill_ids": [],
    "newly_blocked": [],
    "preconditions_satisfied": []           // settlement_state.checklist transitions
  }
}
```

Schema notes:

- `verified_delta` and `social_delta` and `future_constraints` are 100%
  auto-labelable from existing artifacts (verifier, inventory/container snapshots,
  social-event ledger, next-turn settlement-state diff). This is the cheap core.
- `predicted_delta` is the only field needing either (a) the LLM harness output
  (Option C) or (b) human spot-checking for an eval gold set.
- Physical predictions must be reliable before social ones are meaningful (shared
  contract §3): `future_constraints.preconditions_satisfied` makes the physical->
  social dependency explicit and checkable.

## 5. Auto-label vs human-label split

| Field | Label source | Cost |
| --- | --- | --- |
| `state_before` (typed) | runtime artifacts (`settlement-state/v1`, source-evidence refs) | auto, $0 |
| `candidate_action` | provider-output tool call (`action_parameter_contract`) | auto, $0 |
| `verified_delta` (physical) | verifier + `last_tool_result` before/after | auto, $0 |
| `judgment_outcome` | runtime classifier (`social-cycle-review-summary/v1`) | auto, $0 |
| `social_delta.events` | social-event ledger (`grounded-social-trajectory-report/v1`) | auto if ledger emitted; today partly scripted in smokes |
| `future_constraints` | next-turn settlement-state diff | auto, $0 |
| `predicted_delta` | LLM harness (Option C) OR weak baseline from `expected_outcome` | provider call (metered) |
| social-event **correctness** gold set | human spot-check (did a "promise" really occur?) | human, small (N≈100-300) |
| relationship/obligation **semantics** | human schema design + small labeled set | human, one-time |

The honest gap: the social-event ledger in the **smoke** runs
(`grounded-social-trajectory-report/v1`) is partly hand-authored
(`evt-001-request-wood` etc. are scripted fixtures). For real auto-labeling at
scale, the runtime must emit social events from actual multi-actor transcript +
inventory/container evidence, not from a scripted scenario. That emitter is the main
piece of *new* infrastructure required (it is support, not the research
contribution).

## 6. Feasibility horizons

### 2 weeks: smallest useful thing (no training)

1. Freeze the §4 ROW schema as a typed record (`social-material-transition/v1`).
   Reuse `social-cycle-review-summary/v1` field names so it is a join, not a rewrite.
2. Add a logger that, post-run, joins existing artifacts
   (`run-report` + `review-summary` + `settlement-state` + social ledger) into one
   ROW JSONL per run. Auto-labels `verified_delta`, `judgment_outcome`,
   `future_constraints` from artifacts already present. Zero new model.
3. Build a **provider-free** zero-shot delta-predictor harness (Option C): given
   `state_before` + `candidate_action`, prompt template -> `predicted_delta`; score
   against `verified_delta`/`social_delta`. Wire it to the existing usage guard but
   ship it without running a paid model.
4. Hand-label a small eval set of N≈50-100 transitions (correct social-event tags +
   correct predicted-delta) from existing logged runs.

Output: a transition dataset format, a few hundred auto-labeled physical rows from
existing runs, a scoring harness, and a tiny human gold set. Defensible, cheap,
training-free.

### 2 months: a real structured dataset + first learned baseline

1. Ship the social-event emitter so multi-actor runs auto-emit
   `social_delta.events` from real transcript + inventory/container evidence (the
   one piece of new support infra).
2. Accumulate **K ≈ several hundred to low-thousands** of rows from logged social
   runs (volume bounded by run throughput + provider budget, not annotation).
3. Run the Option C harness for real under the usage guard; produce a
   prediction-vs-evidence scorecard (physical-delta accuracy, social-event
   precision/recall, obligation-prediction calibration).
4. Train a **small** transition model (Option E): rules/GBDT for physical deltas,
   a small fine-tuned adapter for the social/obligation head. Compare to the
   zero-shot LLM baseline.

Output: a structured social-material transition dataset (the unique asset), a
scoring harness with numbers, and a first learned baseline that is honest about its
small size.

### 6 months: benchmark families + model comparison

1. **Dyadic benchmark family**: held-out transitions for request/promise/refusal/
   borrow/lend/return/repair, scored by social-event precision/recall and
   obligation-prediction calibration.
2. **Settlement benchmark family**: longer-horizon `future_constraints` prediction
   (does the model anticipate that hoarding the shared pickaxe blocks others;
   does post-goal continuation persist?).
3. Model comparison: zero-shot LLM (Option C) vs small learned head (Option E) vs
   optional larger fine-tuned adapter, all kept **advisory** (predict-and-score,
   never gate serving, matches the repo's observe-only rule).
4. Optional contrast: report where pixel models (VPT/Optimus-2/Oasis) are simply
   inapplicable, to make the modality argument concrete for reviewers.

Output: dyadic + settlement evaluation suites, a model comparison table, and a
defensible claim that a structured social-material WAM is feasible to *evaluate*
cheaply, with a small learned baseline, without claiming pixel-scale generality.

## 7. What is NOT cheap (honesty section)

- **Run generation** is metered: each cycle is a live provider call + Minecraft
  wall-clock. So data volume is moderate, not internet-scale.
- **Social-event auto-emission** at scale is real new work; today's social ledgers
  are partly scripted smoke fixtures.
- **Social-event correctness** needs a human gold set; "did a promise really occur"
  is not fully derivable from inventory deltas.
- **Multi-actor runs** are heavier to operate than single-actor; the richest social
  rows need ≥2 live actors.
- A learned social head will be **small-data** for a while; resist overclaiming its
  generality. Per the shared contract, the WAM stays advisory regardless of how good
  the predictor gets.

## 8. Mechanically useful vs research contribution (summary)

- Mechanically useful (engineering this repo can borrow): VPT's auto-label paradigm
  (here the verifier *is* the IDM, for free); LAPA's cascaded predict-`o'`-then-`a`
  framing (as a scoring structure, not as latent-action discovery); the WAM survey's
  `(o,a,o')` triplet unit (as typed fields). The logger, emitter, and scoring
  harness are **support infrastructure**, not the contribution.
- Research contribution (modest, defensible): a *structured social-material*
  transition representation and benchmark, a quadrant the canonical pixel WAM data
  landscape leaves empty, that is cheap to label because Mineflayer verifier
  evidence auto-labels it. The contribution is the representation + evaluation, not
  the tooling and not "we have logs".
