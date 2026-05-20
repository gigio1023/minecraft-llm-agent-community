# Evidence Sources

Use this reference when reviewing Minecraft agent behavior in this repo.

## Primary Files

- `data/evidence/<probe-id>-<timestamp>.json`: main transcript payload.
- `data/evidence/<probe-id>-canonical-<timestamp>.json`: canonical append-style
  transcript parts.
- `probe/probe-config.yaml`: spawn coordinates and world config.
- `probe/src/runProbe.ts`: live entrypoint, bot wiring, transcript metadata,
  server/RCON handling.
- `probe/src/runtime/agentLoop.ts`: loop final status, task progression, tool
  execution, verification handoff.
- `probe/src/provider/deterministicProvider.ts`: deterministic tool proposals
  and terminal notes.
- `probe/src/tools/*`: world-facing primitives.
- `probe/src/gameplay/verification/verifyTask.ts`: evidence acceptance rules.

## Useful Commands

List newest evidence:

```bash
ls -lt data/evidence | head -10
```

Summarize a run:

```bash
jq '{probe,bots,metadata:{actor_sessions:.metadata.actor_sessions},stepCount:(.steps|length),final}' \
  data/evidence/<run>.json
```

Inspect per-step behavior:

```bash
jq '.steps[] | {
  actor,
  task:(.task.id // null),
  tool,
  status:.result.status,
  ok:.result.ok,
  timedOut:.result.timedOut,
  verification:(.verification.status // null),
  reason:(.verification.reason // .result.reason // .result.message // null)
}' data/evidence/<run>.json
```

Check for misleading success:

```bash
jq '{final:.final.status, why:.final.why, perActor:.final.per_actor_final}' \
  data/evidence/<run>.json
```

## Langfuse

Only review Langfuse when the run used a provider-backed path and a trace/session
identifier is available. Deterministic provider runs usually have no Langfuse
trace. When a trace exists, compare:

- provider input observation vs transcript observation;
- proposed tool and args vs validated tool call;
- model reasoning/explanation vs actual verification result;
- latency/retry/error spans vs action timeout fields;
- trace completion status vs final artifact status.

Never print raw API keys, auth store contents, cookies, or provider tokens.

## Review Questions

- Did the actor get closer, gain inventory, remove a block, update chest state,
  or change dialogue state?
- Did the verifier use that concrete change?
- Did repeated failure become an honest failure label?
- Did artifacts explain what to change next without rerunning immediately?
- Was the failure caused by environment setup, tool implementation, provider
  proposal, verification, or runtime labeling?
