# Repo Agent Notes

## Current Direction

This repository is a rebuild staging area for a headless Minecraft agent-loop
runtime.

Do not revive the old Voyager-style architecture as the active path.

The current implementation goal is not a full village simulator.
It is a small, bounded, observable runtime that can later grow into a social
simulation seed.

Immediate target:

- one bot that can perform boring gameplay tasks end-to-end;
- transcript and runtime artifacts that explain success, failure, stall, and reconnect;
- reconnect/session lifecycle that stays truthful when explicitly in scope;
- architecture support for per-agent action skill ownership and later bounded
  action skill evolution.

North star:

- a social simulation seed with role pressure, action skill ownership, memory,
  and later human-in-the-loop social play.

Not current delivery targets:

- persona richness as a content goal;
- long-run autonomy as a product goal;
- large multi-bot society behavior before single-bot competence is trustworthy.

## Canonical Docs

Read these first:

1. `SPEC.md`
2. `docs/docs/Agent-Search-Index.md`
3. `docs/docs/Terminology.md`
4. `docs/docs/Architecture/Runtime-Loop-And-Verification.md`
5. `docs/docs/Architecture/Transcript-And-Runtime-Artifacts.md`
6. `docs/docs/Architecture/Actor-Workspace-And-Action-Skill-Memory.md`
7. `docs/docs/Architecture/Async-Reviewer-Sidecars.md`
8. `docs/docs/Architecture/Implementation-Workstreams.md`
9. `docs/docs/Architecture/Minimal-Probe.md`
10. `docs/docs/Setup/Headless-Server.md`
11. `docs/docs/Setup/Provider-Setup.md`

Treat `SPEC.md` as the canonical rebuild spec.

## Terminology

- `agent skill`: Codex/Claude-style capability under `.agents/skills/*/SKILL.md`,
  built or maintained with `skill-builder`.
- `action skill`: Minecraft/Mineflayer-based bundled behavior the runtime can
  validate, execute, verify, and record. Conversation-like actions are action
  skills when they run through the game runtime.
- Do not use bare `skill` in active guidance when the meaning could be confused.

## Search Index

Read `docs/docs/Agent-Search-Index.md` first for routing.

Important search tokens:

- `MINECRAFT_AGENT_LOOP_MIGRATION`
- `HEADLESS_MINEFLAYER_PROBE`
- `MINECRAFT_GAMEPLAY_MODEL`
- `SKILL_VILLAGE_FAILURE`
- `NO_VOYAGER_EVAL_LOOP`
- `NO_MANUAL_CLIENT_GATE`
- `OPENAI_CODEX_PROVIDER`
- `GAME_RUNTIME_CODEX_AUTH`
- `CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH`
- `SOCIAL_SIMULATION_SEED`
- `SPEED_BOUNDED_SOCIAL_SIMULATION`
- `LIVE_TRANSCRIPT_FIRST`
- `CHECKPOINT_READY_RUNTIME`
- `MINIMAL_ACTION_SKILL_MEMORY_HOOK`
- `GENERATED_ACTION_SKILL_LEGACY_STORE`
- `PER_NPC_ASYNC_REVIEWER`
- `IMPLEMENTATION_WORKSTREAMS`
- `ACTION_SKILL`
- `AGENT_SKILL`

## Design Rules

- Use Minecraft as an experiment accelerator.
- The first meaningful proof is not a big society. It is boring competence plus
  strong observability.
- Keep implementation aggressively simple. Prefer small, named modules over large files.
- If a TypeScript file becomes large, split it by responsibility before adding more behavior.
- Keep functions small and single-purpose.
- Avoid runner files that mix config, provider calls, reconnect, transcript,
  persistence, and gameplay execution in one place.
- Use clear directory boundaries:
  - `gameplay/` for progression, curriculum, primitives, seed action skills,
    verification;
  - `runtime/` for loop, actions, session, and orchestration;
  - `memory/` and `runtime/state/` for agent and runtime state;
  - `skills/` for seed/generated action skill ownership and execution;
  - `provider/` for model calls and tracing;
  - `transcript/` for transcript and artifact persistence.
- Do not let quick probes become permanent monoliths.
- Do not expect social simulation from persona text alone.
- Add Minecraft task pressure first: resource gathering, crafting, storage,
  movement, scarcity, and shared/private inventory.
- Mineflayer provides the game client API.
- Prefer bounded TypeScript helpers and bounded action skill bundles over raw
  eval.
- Human visual inspection is optional. Prefer transcript, checkpoint-like runtime
  artifacts, structured logs, and optional viewer evidence.
- Failures should be explainable from artifacts without immediate reproduction.
- Progress must be real. Do not confuse partial motion, initial animation, or
  optimistic status text with success.
- Actor workspace is the source of truth for actor-owned action skill state.
- Treat `build/generated-skills` as legacy exploratory output, not as active or
  candidate actor-owned action skill memory.
- Keep tests small and Detroit-style. Use them to protect real owned behavior,
  not to simulate a fake feeling of coverage.
- Live transcript is the primary evidence of runtime value.

## TypeScript Commenting Rules

These rules are based on the Google TypeScript Style Guide, TypeScript JSDoc
reference, TSDoc, TypeDoc, DefinitelyTyped, and VS Code/TypeScript ecosystem
practice.

- Prefer readable names, narrow functions, and explicit types before adding a
  comment. A comment should not restate what TypeScript already proves.
- Use `/** ... */` documentation comments for exported APIs, cross-module
  contracts, and code a caller needs to understand. Use `//` comments for local
  implementation notes.
- Comments should explain why a runtime boundary exists, what invariant is being
  protected, what failure mode is being rejected, or what Minecraft/Mineflayer
  behavior is non-obvious.
- For gameplay code, prioritize comments around verification, timeout,
  cancellation, reconnect/session freshness, fake-progress rejection, actor
  workspace initialization, action skill ownership, and transcript semantics.
- Do not add decorative section banners, obvious parameter descriptions, or
  comments that merely narrate the next line of code.
- Keep comments short enough to review. If a comment needs a long explanation,
  prefer extracting a named helper or adding a design doc section.
- Keep comments current when behavior changes. A stale comment is worse than no
  comment because this repo relies on artifacts and code to diagnose real runs.
- When documenting generated or candidate action skills, state the primitive
  boundary and evidence required for promotion. Do not imply autonomous runtime
  trust before verification exists.
- During comment passes, explicitly inspect every TypeScript file with zero
  comments. Either add a high-signal contract/invariant comment or leave it
  uncommented only when the file is a trivial CLI/re-export/declarative constant.
- Configuration comments should explain non-obvious defaults, auth boundaries,
  artifact locations, and destructive-vs-non-destructive behavior. Do not label
  obvious scalar defaults.

Reference anchors:

- Google TypeScript Style Guide: `https://google.github.io/styleguide/tsguide.html`
- TypeScript JSDoc Reference:
  `https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html`
- TSDoc approach: `https://tsdoc.org/pages/intro/approach/`
- TypeDoc TSDoc support:
  `https://typedoc.org/documents/Doc_Comments.TSDoc_Support.html`
- DefinitelyTyped contribution guidance:
  `https://definitelytyped.org/guides/contributing.html`
- VS Code TypeScript/JSDoc hover behavior issue:
  `https://github.com/microsoft/vscode/issues/215550`

## Testing Rules

- Keep tests aggressively small, direct, and Detroit-style.
- Prefer tests that prove one important owned behavior or regression.
- Use tests to reject fake success and hidden dependencies.
- Do not add broad mocks or snapshot-heavy suites.
- If a test would still pass after the real logic was broken, rewrite or delete it.
- Do not add elaborate tests for persona richness or long-run autonomy yet.

## Documentation Rules

- Keep `SPEC.md`, `README.md`, `docs/docs/intro.md`, and
  `docs/docs/Agent-Search-Index.md` aligned.
- If a plan becomes historical rather than active, mark it clearly as archived or
  deprecated instead of leaving it ambiguous.
- Prefer one canonical definition doc over several drifting ones.
- Never use absolute local paths in committed docs.

## Auth Rule

When this repo says "Codex auth" for gameplay, it means game-runtime provider
auth for the `openai-codex` provider. It does not mean Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not inspect or print raw tokens. Do not start a browser/device login flow
unless the auth store is missing, expired, rejected by a live smoke, or the user
explicitly asks to refresh provider auth.
