---
sidebar_position: 107
---

# World Scenario Smoke Gates

Search token: `WORLD_SCENARIO_SMOKE_GATES`.

Status: active implementation slice.

## Goal

Do not spend 40/60-cycle provider budget until world-scenario setup is
truthfully proven. The smoke path should separate setup failure, bad natural
spawn, and genuine Actor Turn behavior failure.

## Static Gates

Run from repo root:

```bash
(cd probe && bun test test/worldScenarios.test.ts)
(cd probe && bun run typecheck)
(cd docs && npm run build)
git diff --check
```

Use the parenthesized form so each command starts from the repo root. Do not
copy older command blocks that `cd probe` and then try to `cd docs` from inside
`probe`.

## Runtime Gate Order

1. Focused unit tests for RCON classification, scenario config, validation
   artifact shape, and setup-status aggregation.
2. No-provider or deterministic setup smoke, if the runner supports it, to prove
   manifest and validation artifact creation without model budget.
3. Short provider run, 10 to 20 cycles, with visual evidence enabled.
4. Longer 40/60-cycle provider run only after setup and short-run artifacts are
   reviewed.

## Required Runtime Packet

Any runtime claim should include:

- exact social-cycle report path;
- world-scenario manifest path;
- natural spawn validation artifact path, when applicable;
- screenshot directory, when visual evidence is enabled;
- provider, model, and reasoning settings;
- provider usage totals;
- `setup_status`;
- required and optional setup command failures;
- validation status and top rejection reason if validation failed.

Without those paths, do not treat the run as a behavior verdict.

## Stop Conditions

Stop before provider-heavy runs when:

- a required RCON command fails;
- setup status is absent or ambiguous;
- `natural-safe-spawn-v1` did not use a fresh world;
- spawn validation did not run;
- spawn validation failed;
- the validation artifact omits loaded-world limits;
- manifest/report refs are missing.

These are setup blockers, not Actor Turn failures.

## Review Questions For Short Provider Runs

- Did the scenario setup pass with no hidden required command failure?
- Did natural spawn validation prove a playable ordinary start in loaded-world
  bounds?
- Did the provider consume source evidence and prior action results instead of
  repeating stale context?
- Did repeated non-progress create visible retry or pivot pressure without
  hidden strategy injection?
- Did PlanBeads remain passive, evidence-linked work state rather than
  execution authority?

## Provider-Budget Discipline

World scenarios exist to reduce false conclusions, not to make the actor look
successful. A failed setup smoke is useful evidence and should be recorded as
environment failure. It should not trigger a larger provider run.

## Done Criteria

- Static gates pass or their blockers are recorded with exact commands.
- A setup smoke produces manifest and validation refs before provider cycles.
- A short provider run is reviewed before any longer behavior evaluation.
- Final run reports include enough artifact paths to audit setup truth without
  immediate reproduction.
