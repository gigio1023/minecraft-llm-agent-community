---
sidebar_position: 104
---

# World Scenario RCON Truthfulness Plan

Search token: `WORLD_SCENARIO_RCON_TRUTHFULNESS_PLAN`.

Status: active implementation slice.

## Goal

Scenario setup command results must reflect Minecraft command outcomes, not only
RCON transport success. If the server returns failure-like text, the manifest
must record a failed command. Required failures block scenario setup; optional
failures remain visible but do not block by themselves.

This is the first slice because a natural spawn run cannot be interpreted while
fixture commands and setup commands can silently fail.

## Current Failure Mode

`runWorldScenarioCommands` currently treats a returned RCON string as success
unless the RCON call throws. That hides command-level failures such as unloaded
positions, bad gamerule names, and incomplete command syntax.

The report layer also needs an aggregate status. `setup_status: "passed"` must
mean all required setup phases passed, not only the final post-bot command list.

## Result Semantics

| Layer | Passed Means | Failed Means |
| --- | --- | --- |
| RCON transport | The command was sent and a response was received. | The RCON call threw or timed out. |
| Command result | The response is not classified as a known failure. | The response matches a narrow known failure signature. |
| Required command | Command result passed. | Scenario setup is blocked. |
| Optional command | Command result passed. | Failure is recorded but setup may continue. |
| `setup_status` | All required pre-bot commands, required post-bot commands, and required validation artifacts passed. | Any required setup or validation phase failed. |

## Narrow Failure Classifier

Start with exact, evidence-backed failure signatures seen in local artifacts or
Minecraft command output. Do not add broad natural-language heuristics.

Initial signatures:

- `That position is not loaded`
- `Incomplete`
- `Incorrect argument for command`
- `Unknown or incomplete command`
- `No player was found`

Classifier output should include:

- `status: "passed" | "failed"`
- `failure_kind` for known failures, such as `unloaded_position`,
  `incomplete_command`, `incorrect_argument`, `unknown_command`, or
  `missing_player`
- the raw command output
- whether the command was required

## Required Vs Optional Commands

Required command failure:

- mark the command `failed`;
- set the phase-level `required_failure`;
- preserve command, output, and failure kind in the manifest;
- prevent provider cycles for scenarios that require that setup.

Optional command failure:

- mark the command `failed`;
- do not set `required_failure`;
- keep the raw output visible so version compatibility issues remain
  inspectable.

Optional commands are allowed only when the scenario contract explains why they
are best-effort. Version compatibility is a valid reason; hiding fixture setup
uncertainty is not.

## Flat Fixture Revalidation

After the classifier is in place, re-run the flat fixture as a controlled lane.
The immediate question is not whether the actor builds well; it is whether the
fixture can prove that the work pad, fixed spawn, and resource rack actually
exist.

If pre-bot `fill` still fails because chunks are not loaded, choose one of these
explicit outcomes:

- move the fixture mutation to a post-bot phase after loaded-world evidence
  exists;
- add a documented chunk-loading strategy and record it as setup evidence;
- downgrade the fixture to a debug lane and prioritize the natural scenario.

Do not keep a flat fixture whose manifest can say `passed` while required setup
commands failed.

## Report And Audit Linkage

Implementation should make the manifest and report mutually reviewable:

- `WorldScenarioManifest.command_runs` keeps all pre-bot and post-bot command
  results with raw outputs.
- The social-cycle report links the manifest and includes `setup_status`.
- Audit/ref collection should include the world-scenario manifest ref so missing
  setup evidence can fail review.
- Later spawn-validation refs should be linked beside command runs, not buried
  only in prose.

## Tests

Focused tests should cover:

- required command output `That position is not loaded` blocks setup;
- optional command output `Incorrect argument for command` records failure
  without blocking;
- successful output remains `passed`;
- aggregate setup status fails when any required pre-bot, post-bot, or
  validation phase fails;
- the flat fixture cannot hide required setup failure text.

Repo-root-safe commands:

```bash
(cd probe && bun test test/worldScenarios.test.ts)
(cd probe && bun run typecheck)
git diff --check
```

## Done Criteria

- Known failure-like RCON output no longer records as `passed`.
- Required setup failure prevents a misleading Actor Turn run.
- Optional failures are visible and non-blocking only when explicitly
  documented.
- `setup_status` is an aggregate truth claim over all required setup phases.
