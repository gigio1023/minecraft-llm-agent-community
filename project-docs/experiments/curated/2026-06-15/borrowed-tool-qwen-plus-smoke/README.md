# Borrowed Tool Qwen Plus Smoke

Date: 2026-06-15 (`Asia/Seoul`)

Search token: `EXPERIMENT_2026_06_15_BORROWED_TOOL_QWEN_PLUS_SMOKE`.

## Purpose

This experiment is the first provider-backed smoke for the Minecraft social
issue framing. It tests `borrowed_tool_with_return_or_debt_v1`, not a public
crafting-table affordance.

The issue is:

```text
Jun / npc_b needs two oak logs but has no axe.
Mara / npc_a has one stone_axe as personal possession.
Jun must request access without violating Mara's material claim.
Mara may lend, lend conditionally, refuse, or ask for clarification.
Jun must then use/return, leave debt, or adapt without pretending success.
```

## Scope

This is a `provider_decision_only` smoke:

- live provider: yes, ModelScope Qwen;
- live Minecraft server: no;
- physical Mineflayer handoff/use/return evidence: no;
- scored target: social issue decision quality over a fixed Minecraft evidence
  packet;
- not scored: tool schema compliance or provider transport behavior.

This makes the result useful as a cheap early benchmark shape check, but it is
not evidence that the runtime can execute the borrowed-tool behavior in
Minecraft yet.

## Provider And Quota

- Provider: `modelscope-api`
- Model: `Qwen-Ambassador/Qwen3.7-Plus`
- Preflight file: `preflight.json`
- Preflight status: `allowed`
- Preflight estimate: 6 API calls, 60,000 total tokens
- Actual provider calls: 3
- Actual usage: 2,976 input tokens, 1,050 output tokens, 4,026 total tokens
- ModelScope Qwen Plus monthly call ledger before preflight: 256 / 10,000 calls
- Projected by preflight estimate: 262 / 10,000 calls
- Actual inferred monthly ledger after run: 259 / 10,000 calls

## Command

```bash
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --candidate modelscope-api:Qwen-Ambassador/Qwen3.7-Plus \
  --estimate-requests 6 \
  --estimate-total-tokens 60000 \
  --estimate-requests-per-minute 1 \
  > project-docs/experiments/curated/2026-06-15/borrowed-tool-qwen-plus-smoke/preflight.json

cd probe
bun run probe:social-issue \
  -- --issue borrowed_tool_with_return_or_debt_v1 \
  --model Qwen-Ambassador/Qwen3.7-Plus \
  --out-dir ../project-docs/experiments/curated/2026-06-15/borrowed-tool-qwen-plus-smoke
```

## Result

- Status: `passed`
- Score: `100 / 100`
- Event trajectory:
  1. `npc_b` requested to borrow `stone_axe`.
  2. `npc_a` conditionally lent `stone_axe` and opened a loan obligation.
  3. `npc_b` used and returned `stone_axe`, fulfilling the loan obligation.

The result is socially coherent under this fixed issue packet. Qwen preserved
personal possession, request, conditional access, obligation, and return
continuity.

## Artifacts

- `report.json`: machine-readable report.
- `index.html`: human-readable report.
- `preflight.json`: ModelScope Qwen quota preflight result.

## Review Notes

This smoke is deliberately small. It shows that the new issue framing is more
socially meaningful than the earlier public crafting-table smoke, but it still
does not test embodiment.

User review after reading the report: the experiment is too simple for the real
research goal. It is a closed provider-decision issue packet, not open-world
Minecraft social interaction. It should not be used as evidence that actors can
socially coordinate inside a natural Minecraft world.

Interpretation boundary:

- it proves Qwen Plus can preserve request, conditional access, obligation, and
  return semantics over a short fixed packet;
- it does not prove live co-presence, physical handoff, tool use, refusal
  handling in a world, multi-actor continuity, or emergent social behavior;
- the next benchmark must use separate Mineflayer bots in a fresh natural world
  and score runtime evidence, not only model-authored events.

Required next step before claiming Minecraft runtime competence:

- add or reuse runtime actions for physical item handoff, pickup/drop, tool
  use, return, and obligation evidence;
- run a live two-actor version with a fresh natural Minecraft world and
  separate actor workspaces;
- record first-person/third-person screenshots only as supporting evidence;
- score physical evidence separately from provider decision quality.
