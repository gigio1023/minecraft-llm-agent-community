# Mutual NPC Interaction Probe Review

Date: 2026-05-19  
Repo: [minecraft-llm-agent-community](https://github.com/naem1023/minecraft-llm-agent-community)

## Bottom line

`mutual_npc_interaction_probe_v1` now runs against a real local Docker-backed
Minecraft server and finishes with all three interaction categories marked
`passed`.

The successful live artifact is:

`data/evidence/mutual_npc_interaction_probe_v1-1779166592708.json`

A preserved copy is stored at:

`docs/superpowers/reports/artifacts/2026-05-19-mutual-npc-interaction-probe-transcript.json`

## What this probe adds beyond v0

The first probe proved that one bot could run a bounded
`observe -> move_to -> say -> wait -> say -> remember` loop while the runtime
owned the `busy -> available` transition.

This second probe keeps the provider deterministic, but expands the runtime in
three concrete ways:

1. `npc_b` now acts instead of only existing as gated state.
2. movement and attention are part of the proof, not just chat delivery.
3. one small world action, dropping a `paper` marker, changes a later NPC
   response.

## Final verdict from the live transcript

From `data/evidence/mutual_npc_interaction_probe_v1-1779166592708.json`:

- `conversationTurnState: passed`
- `spatialAttentionApproach: passed`
- `materialEnvironmentHandoff: passed`
- final status: `success`
- final reason: `both NPCs responded to each other's dialogue and world actions`

## What actually happened

### 1. Conversation and turn state

`npc_a` approached `npc_b` and said:

`"Jun, can you confirm the marker?"`

`npc_b` heard that line in its observation state and answered with a
runtime-owned busy reply before becoming available later in the sequence.

Relevant transcript evidence:

- step 3: `npc_a` used `say`
- step 4: `npc_b` used `reply_to` with `result: "busy_reply"`

### 2. Spatial attention and approach

The movement part is no longer hand-wavy. In the successful run:

- step 2: `npc_a` used `move_to`
- distance changed from `12.73` to `0.97`
- `arrived: true`
- step 6: `npc_b` used `look_at_actor`

That is enough to show that the proof is reacting to distance and facing, not
only chat text.

### 3. Material handoff

The first live attempt on this slice still failed the material category. The
important part is why.

The dropped paper entity did exist, but the runtime observed too early and also
looked at the wrong fields. Mineflayer exposed the dropped entity as:

- `name: "item"`
- `displayName: "Item"`
- stack data in entity metadata, not in a paper-specific display name

The fix had two parts:

1. `observeWorld()` now checks item metadata, not only `name` and
   `displayName`.
2. `dropItem()` now waits until the dropped item entity is visible before it
   returns, so the next observation does not race the server update.

After that change, the successful transcript shows:

- step 7: `npc_a` used `drop_item`
- step 9: `npc_b` used `reply_to`
- step 9 observation includes `markerEntitySeen: true`

That is the key evidence that the world action changed the later response.

## Notable implementation detail

The proof still uses deterministic providers. This is intentional. The runtime,
tool validation, movement, transcript shape, and item timing had to be made
reliable before introducing a live model provider.

So the correct reading is:

- the interaction is real
- the server run is real
- the bounded tool loop is real
- the provider is still staged and deterministic

## Known runtime caveat

The successful run printed the transcript path and exited `0`, but Docker
cleanup still produced the known bounded-timeout warning during
`docker compose down -v`.

That warning does not invalidate the transcript. The runtime keeps the success
result and transcript path even if teardown is noisy later, which matches the
behavior already used for `v0`.

## Files that matter most for review

1. `probe/src/mutual/runMutualProbe.ts`
2. `probe/src/mutual/tools/index.ts`
3. `probe/src/mutual/tools/observeWorld.ts`
4. `probe/src/mutual/tools/dropItem.ts`
5. `probe/src/mutual/mutualLoop.ts`
6. `data/evidence/mutual_npc_interaction_probe_v1-1779166592708.json`

## Next questions

The next useful questions are narrower now:

1. Should `npc_b` get a richer memory/action loop, or is the next priority
   still movement quality?
2. Should the transcript record the actual reply text in addition to the tool
   result status?
3. Should the Docker management timeout be raised so cleanup warnings are less
   common in OrbStack?
