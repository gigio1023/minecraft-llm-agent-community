---
sidebar_position: 2
---

# Provider Setup

Provider-backed gameplay paths are optional during the rebuild.

Deterministic mode must remain usable without live provider access.

## Current Rule

The runtime owns validation, execution, verification, transcript, and artifacts.

The provider only proposes the next bounded action.

## Auth Store

When this repo says "Codex auth" for gameplay, it means runtime provider auth,
not Codex CLI login.

Use an ignored repo-local auth store such as:

```text
build/provider-auth/openai-codex-auth.json
```

Do not commit or print raw tokens.

## Provider Role In The Current Rebuild

Provider-backed paths are useful for:

- next action proposal;
- later trace inspection.

## Gameplay Provider Switch

Phase-one gameplay uses the deterministic provider by default.

To opt into the live OpenAI Codex gameplay provider:

```bash
PROBE_GAMEPLAY_PROVIDER=openai-codex bun run probe:v0
```

The live gameplay provider receives:

- current observation;
- current deterministic task;
- last tool result;
- active action skill ids and allowed primitives;
- actor workspace context containing active action skills, candidates, recent
  evidence, recent reviews, and memory.

The provider still returns only one bounded runtime primitive. Runtime action
skill gates and verification decide whether the proposed action can execute or
counts as progress.

## Reviewer Provider Switch

Per-actor review jobs use the deterministic reviewer by default.

To opt into the OpenAI Codex reviewer:

```bash
REVIEW_ACTORS_PROVIDER=openai-codex bun run review:actors npc_b
```

The reviewer receives immutable review jobs plus actor workspace context. It can
write findings and draft candidate proposal hints only; active action skill
mutation remains forbidden.

Provider-backed paths are not allowed to silently replace:

- runtime verification;
- transcript evidence;
- checkpoint-like runtime artifacts;
- deterministic baseline coverage.

## Trace Expectations

When provider-backed paths are used, Langfuse traces should help answer:

- what input context the provider saw;
- what bounded proposal it returned;
- whether a malformed or weak proposal contributed to failure.

Trace evidence is supplementary to transcript and runtime artifacts, not a
replacement for them.
