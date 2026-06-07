# Actor Turn And Visual Evidence Review

Use this reference for current social-cycle runs that use Actor Turn,
`author_mineflayer_action`, generated Mineflayer candidates, PlanBeads, or
bot-view screenshots.

## Current Actor Turn Artifact Map

Do not rely on legacy `action_intent_ref` for current reports. Current Actor
Turn records use:

- `cycles[].action_ref`
- `cycles[].action_attempts[].action_ref`
- `goals/cycle/actions/*.json`
- `goals/cycle/tool-selections/*.json`
- `goals/cycle/mineflayer-codegen-requests/*.json`
- `provider-inputs/*actor-turn*.json`
- `provider-inputs/*mineflayer-codegen*.json`
- `provider-outputs/*actor-turn*.json`
- `evidence/*run_mineflayer_program*.json`
- `evidence/*generated-action-skill-trial*.json`
- `action-skills/candidates/*.json`

If a summary says action kind/action name is `missing` while `action_ref` exists,
the summary is stale for Actor Turn. Read the action refs directly or update the
summarizer before reviewing behavior.

## Verdict Split

Always separate these two verdicts:

- `Recording verdict`: whether the run produced enough truthful artifacts to
  diagnose behavior.
- `Experiment verdict`: whether the NPC behavior met the human-facing Minecraft
  objective.

Examples:

- `Recording verdict: DIAGNOSABLE_FAILURE` when artifacts explain the failure.
- `Experiment verdict: PASSED_RUNTIME_BUT_PRODUCT_WEAK` when `runtime_status` is
  `passed` but the constructed object is not a plausible version of the goal.

This distinction matters because this repo values truthful observability, but
truthful observability is not the same as agent competence.

## Visual Evidence Triage

Screenshots are review evidence from `prismarine-viewer`, not block identity or
progress authority. For every visually suspicious screenshot:

1. Open the image and identify the cycle/phase.
2. Read the capture artifact for bot position, yaw, pitch, and method.
3. Read nearest `observe` / `worldStateSummary` evidence before or after that
   cycle.
4. Compare visible objects against actual block names and coordinates.
5. Classify the visual issue:
   - `real-world-weirdness`: block evidence confirms the strange object exists.
   - `renderer-artifact`: evidence shows ordinary blocks but the viewer renders
     strange colors or models.
   - `camera-obstruction`: leaves, bushes, water, blocks, or the actor's own
     position make the screenshot unusable.
   - `insufficient-visual-evidence`: no nearby observe/world-state artifact can
     explain the screenshot.

Do not say "the NPC placed red/blue blocks" unless runtime block evidence names
those blocks. Newer or version-skewed blocks such as `leaf_litter` may render as
large colored patterned boxes in `prismarine-viewer`.

## Actor Turn Failure Modes

Use these current-architecture categories before blaming generic "planning":

- `tool-contract-conversion-gap`: the model chose a sensible logical tool path,
  but parsed args, schema, candidate source, verifier, repair, or runtime
  contract prevented execution.
- `generated-action-overuse`: the actor repeatedly authors diagnostics or tiny
  generated programs where a visible Action Card or direct primitive should
  suffice.
- `generated-action-underuse`: the actor avoids codegen even when the visible
  tools cannot express the needed bounded Mineflayer behavior.
- `candidate-trial-gap`: generated source runs, but trial evidence does not
  prove the intended world mutation or blocker.
- `episode-narrowing`: Active Episode and Deliberation keep narrowing the task
  into diagnostics or one-cell probes after the broader human objective is no
  longer served.
- `PlanBeads-boundary-gap`: PlanBeads are empty when blockers should have been
  preserved, or PlanBeads start acting like executable strategy.
- `visual-review-gap`: the review reports runtime success without checking
  screenshots and human-visible plausibility.

The preferred fix is not a hidden deterministic Minecraft planner. Prefer:

- better Action Card contracts and schemas;
- better generated-action candidate validation;
- clearer trial evidence and verifier artifacts;
- truthful PlanBead blocker/follow-up preservation;
- better visual capture angles and obstruction labels;
- less over-narrow Active Episode wording after repeated failed diagnostics.

## Review Questions For Generated Mineflayer Runs

Answer these explicitly:

- How many times did Actor Turn choose `author_mineflayer_action`?
- How many generated candidates passed trial, failed trial, or became contract
  rejections?
- Did generated source change the world, or only diagnose local geometry?
- Did codegen receive full ActorTurnInput and the Mineflayer code-generation
  skill body?
- Did the outer tool-call rationale survive into the codegen artifact, or was it
  compressed into a thin action intent?
- Did repeated generated diagnostics help the next action, or just consume
  budget?

## Output Addendum

For current Actor Turn visual runs, add this block after findings:

```text
Recording verdict: ...
Experiment verdict: ...
Visual evidence verdict: ...

What failed:
- ...

What worked:
- ...

Why this matches the repo philosophy:
- Actor Turn should stay the hot path.
- PlanBeads should preserve blockers/followups, not become executable strategy.
- The fix should improve tool contracts, evidence, visual review, or state
  continuity rather than adding a hidden domain planner.
```
