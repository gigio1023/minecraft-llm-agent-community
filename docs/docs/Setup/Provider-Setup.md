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
