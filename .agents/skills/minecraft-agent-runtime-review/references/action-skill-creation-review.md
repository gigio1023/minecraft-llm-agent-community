# Action Skill Creation Review

Use this when a run, trace, or human-visible behavior note suggests creating,
promoting, superseding, or retiring a Minecraft action skill.

## Core Rule

In this repo, action skill creation must be evidence-backed recipe creation
first, not hot-loop code generation.

The reviewer should prefer:

```text
runtime evidence -> proposal -> bounded recipe -> validation -> live trial
-> promotion/supersession/retirement
```

Reject:

```text
LLM writes JS/TS -> runtime imports/evals it -> active action skill
```

## What To Check

For each proposed action skill, verify:

- which transcript, artifact, Langfuse trace, or human behavior note triggered it;
- whether the problem is actually a missing primitive, weak verifier, bad target
  selection, or cancellation gap rather than a new action skill;
- whether every required primitive is already implemented;
- whether the actor role can use every primitive;
- whether preconditions are observable;
- whether success is backed by inventory, world, position, or container evidence;
- whether timeout, abort, and stall behavior are explicit;
- whether supersession/retirement history is preserved;
- whether the action skill is kept out of active candidate lists until promoted.

## Reference-Derived Lessons

- Voyager is useful for artifact split and retrieval, but not for `eval`-based
  learned code execution.
- mineflayer-chatgpt is useful for registry/executor/memory separation and
  precondition-vs-real-failure tracking, but not for immediate dynamic JS load.
- mindcraft-ce is useful for action metadata and lifecycle guards, but not for
  `!newAction` as the default architecture.
- yearn_for_mines is useful for spec-first capability changes and bounded macro
  tools, but exact tool-call traces should not become timeless action skill
  truth.

## Review Output

Use this shape:

```text
Action Skill Creation Review
Verdict: KEEP_DRAFT | VALIDATE_RECIPE | LIVE_TRIAL | PROMOTE | SUPERSEDE | RETIRE | REJECT

Evidence trigger:
- ...

Contract gaps:
- ...

Recipe safety:
- primitives:
- role permission:
- verifier:
- timeout/abort:

Lifecycle decision:
- ...

Next implementation slice:
- ...
```

## Gotchas

- Do not create an action skill to hide a primitive bug. If `collect_logs`
  chases stale targets, fix target selection and evidence first.
- Do not promote from provider text, terminal exit code, or "status: success"
  alone.
- Do not permanently blacklist static seed action skills because of a
  precondition miss like "no nearby tree".
- Do not delete failed candidate history. Use it as anti-repeat evidence.
- Generated code is a future reviewed patch path, not the Phase 1 runtime path.
