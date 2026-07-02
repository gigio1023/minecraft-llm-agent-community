# Minecraft Visual Evidence Capture Protocol

Status: active runtime/reporting protocol.

Search token: `MINECRAFT_VISUAL_EVIDENCE_CAPTURE`.

Operational search token: `VISUAL_EVIDENCE_1_21_4_RULE`.

## Purpose

This protocol defines how this repo records Minecraft images for runtime review,
static reports, and NPC execution artifacts.

The important rule:

```text
Screenshots help humans inspect a run. They are not block identity authority.
```

If a screenshot appears to show a strange block, a redstone-like block, a large
colored cube, missing terrain, or a tiny colored dot, do not report that as world
truth until a runtime artifact names the block. Use `observe`,
`worldStateSummary`, `world-state-scan/v1`, inventory evidence, container
evidence, verifier artifacts, and transition rows as the authority.

## Evidence Order

Use this order when making claims:

1. Runtime state artifacts:
   `observe`, `worldStateSummary`, `world-state-scan/v1`, inventory, container,
   position, verifier output, action evidence, and `transition-row/v1`.
2. World setup artifacts:
   world-scenario manifest, natural-spawn validation, seed/reset record, server
   version, seed, level type, generator settings, and setup command outputs.
3. Visual evidence:
   `prismarine-viewer` screenshots, paired with same-cycle or neighboring state
   artifacts.
4. Human-visible manual notes:
   useful for diagnosing behavior, but still paired with runtime artifacts when
   making block, inventory, or progress claims.

Do not label screenshots directly. Do not say "the actor placed redstone" or
"the image proves a block exists" unless a runtime artifact names that block.

## Current Capture Method

The current headless method is:

```text
prismarine-viewer web view + Playwright/Chrome screenshot
```

Use Minecraft server version `1.21.4` for runs whose screenshots will be shown
in review docs, HTML reports, Qwen/OpenAI comparison posts, or human-facing run
summaries.

Reason: `prismarine-viewer@1.33.0` currently supports visual assets and
block-state rendering through `1.21.4`, while this repo's default server may be
newer, such as `1.21.11`. With a newer server, Mineflayer can receive valid
world state while the viewer renders some block-state ids through older assets.
The visible result can look like redstone dust, redstone blocks, blue/yellow
blocks, patterned cubes, or missing textures even when runtime block evidence
names ordinary blocks. This happened on 2026-06-29 with a `1.21.11` natural
village run and was fixed for visual review by rerunning the same seed/start at
`PROBE_SERVER_VERSION=1.21.4`.

Do not treat this as a model behavior issue. It is a renderer/version-skew
issue. If a run must use a newer Minecraft version for runtime reasons, keep
visual evidence on but mark images as renderer-skewed review context and do not
use them in polished reports unless the state artifacts are shown beside them.

For report-grade runs, use the runtime profile instead of spelling out the
individual screenshot flags:

```bash
cd probe
bun run probe:social-cycle -- \
  --provider deterministic-social \
  --model deterministic-social \
  --world-scenario natural-village-spawn-v1 \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-visual-smoke.json
```

`--visual-profile report` currently enforces the report profile in code:

- `PROBE_SERVER_VERSION=1.21.4` when the CLI owns server version setup;
- fail fast if another server version is already set, unless
  `--allow-renderer-skew` is passed for explicit renderer debugging;
- `first_person`, `third_person_follow`, and `third_person_high` captures;
- interval `1`;
- viewport `960x540`;
- manifest profile `report`;
- final `visual-evidence-audit/v1` written into the run report.

The audit must pass before a visual run is treated as report-ready. It checks
capture completeness and file existence. It does not certify block identity.

Before a provider-backed visual run, run a provider-free visual setup smoke on
the same scenario:

```bash
cd probe
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider deterministic-social \
  --model deterministic-social \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-spawn-visual-setup-smoke.json
```

This deterministic smoke may exit non-zero if the placeholder actor step is
blocked. That is acceptable for a setup smoke. Review the artifact bundle, not
the process exit alone:

- world-scenario manifest exists;
- seed/reset record says `minecraft_version: "1.21.4"`;
- natural-spawn validation passed, when the scenario uses it;
- selected player position matches the scenario start;
- `visual_evidence.captures[]` has initial, cycle-end, and final captures;
- `visual_evidence.audit.status` is `passed`;
- `first_person`, `third_person_follow`, and `third_person_high` image/capture
  JSON files exist;
- no redstone-like renderer artifact dominates the third-person images unless
  paired state evidence names redstone blocks.

For no-regret-core runs, natural-village comparison runs, and static reports
that show Minecraft images, enable visual evidence unless the run is explicitly
documented as non-visual. Use the report profile cameras by default:

- `first_person` shows what the actor sees;
- `third_person_follow` shows the actor from directly behind, close to the
  in-game third-person feel;
- `third_person_high` shows a closer elevated view, still anchored to the
  actor's facing direction instead of a fixed overhead map angle.

Screenshot failure is a diagnostic gap, not actor behavior. It must not fail an
Actor Turn, mark a Minecraft action as failed, or decide a transition row.

## Standard Camera Policy

Use this camera policy unless the user explicitly requests a different visual
evidence profile:

```bash
--visual-profile report
```

Capture phases should include:

- initial: before the first Actor Turn action;
- cycle-end: after each captured cycle's action/judgment path;
- final: after the run closes or blocks.

Use `first_person` for the actor's local view and obstruction diagnosis. Use
`third_person_follow` when reviewing what the character is doing in the world:
it is close, behind the actor, and rotates with the actor's facing direction.
Use `third_person_high` when the immediate surroundings matter: it is higher
than follow view, but no longer pulled back into a distant overhead map. The
actor should remain the subject, and the camera should rotate with the actor's
facing direction. In dense natural starts, leaves or trunks can still obstruct
this view; prefer `third_person_follow` plus `first_person` for actor-centric
review when that happens, and cite state artifacts for block details.

Long runs may increase `--visual-evidence-interval`, but they must still capture
initial and final images. If a run is used to claim behavior over time, prefer
interval `1` until storage/performance becomes a measured blocker.

## Standard Natural Village Visual Run

For natural village-adjacent experiments and model comparison runs, use the
natural-world setup and viewer-supported server version together:

```bash
cd probe
SOCIAL_CYCLE_REASONING=low \
bun run probe:social-cycle -- \
  --provider modelscope-api \
  --model Qwen-Ambassador/Qwen3.7-Plus \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-spawn-qwen-plus-visual.json
```

The current natural-village scenario uses seed `4167799982467607063` and the
validated start `x=8.5, y=110, z=6.5`. Setup may pin spawn and teleport the actor
to that start, but it must not mutate terrain with `fill`, `setblock`, resource
racks, cleared pads, starter structures, or inventory grants.

For OpenAI comparison runs, run provider quota preflight first and keep
background polling off unless request-count budget has explicitly been sized
for it:

```bash
bun run .agents/skills/provider-quota-preflight/scripts/provider-quota-preflight.ts \
  --operator-approved \
  --candidate openai-api:gpt-5.5 \
  --estimate-requests 4 \
  --estimate-total-tokens 120000 \
  --estimate-requests-per-minute 2
```

Then run:

```bash
cd probe
OPENAI_RESPONSES_BACKGROUND=false \
OPENAI_JSON_MAX_RETRIES=0 \
SOCIAL_CYCLE_REASONING=medium \
bun run probe:social-cycle -- \
  --provider openai-api \
  --model gpt-5.5 \
  --actor npc_b \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --world-scenario natural-village-spawn-v1 \
  --visual-profile report \
  --report ../tmp/social-cycle-natural-village-spawn-openai-gpt55-visual.json
```

## Required Artifact Fields

New visual evidence manifests and per-image capture artifacts must carry:

```json
{
  "method": "prismarine-viewer-web-screenshot",
  "renderer_trust": "review_only_not_block_identity",
  "block_identity_authority": "runtime_world_state_scan_or_observe_evidence",
  "state_evidence_pairing": "nearest_same_cycle_observe_or_world_state_scan",
  "known_renderer_limitations": [
    "prismarine-viewer renders from a browser view of the bot's world cache, not a native Minecraft Java F2 screenshot.",
    "If the server/Mineflayer version is newer than the viewer texture set, unsupported or renamed blocks may appear as misleading colored boxes.",
    "Camera angle, foliage, water, close geometry, and third-person clipping can make the image unsuitable for block identity review."
  ]
}
```

The runtime writes each image plus a sibling JSON capture artifact under:

```text
data/actors/social-runs/<run_id>/<actor_id>/visual-evidence/
```

The run report stores the capture list at:

```text
visual_evidence.captures[]
```

## Pairing Rule

When reviewing or reporting an image:

1. Open the image.
2. Open the capture JSON and record:
   cycle id, phase, camera mode, bot position, renderer method, and trust level.
3. Find the same-cycle or neighboring runtime state evidence:
   action evidence refs, `observe`, `worldStateSummary`, `world-state-scan/v1`,
   natural-spawn validation, or verifier output.
4. Use those state artifacts for block names and coordinates.
5. Use the screenshot only for human-facing context:
   camera obstruction, rough construction shape, actor location, or whether the
   scene is visually inspectable.

If no state artifact can explain a visually suspicious image, classify the case
as `insufficient-visual-evidence`, not as a real world claim.

For each report image, record these paired facts in the review note or report
data:

- image path;
- capture JSON path;
- cycle id and phase;
- camera mode;
- bot position/yaw/pitch from capture JSON;
- same-cycle or neighboring action evidence;
- same-cycle or neighboring `observe`, `worldStateSummary`,
  `world-state-scan/v1`, natural-spawn validation, or verifier artifact;
- verdict: `usable-context`, `renderer-artifact`, `camera-obstruction`,
  `real-world-weirdness`, or `insufficient-visual-evidence`.

## Renderer Artifact Triage

Classify suspicious images with one of these labels:

| Label | Use When | Next Action |
|-------|----------|-------------|
| `renderer-artifact` | State artifacts show ordinary blocks, but the screenshot shows strange colors, cubes, or missing textures | Report renderer uncertainty; do not change block labels |
| `camera-obstruction` | Leaves, water, blocks, actor body, or clipping dominate the view | Prefer the other camera and state artifacts |
| `real-world-weirdness` | Runtime artifacts name the strange block or entity | Treat it as world evidence and cite the artifact |
| `insufficient-visual-evidence` | No paired state artifact exists | Rerun with visual evidence plus an observe/world-state scan |

Version skew is a known source of artifacts. A report from a Minecraft
`1.21.x` server may carry a note like:

```text
prismarine-viewer does not list exact bot.version 1.21.11; it may fall back to
the nearest supported texture set.
```

This note means a red, blue, magenta, or patterned visible block may be renderer
output rather than the actual block. Check block names before writing a claim.

Known-good visual-review alignment as of 2026-06-29:

| Component | Version / Setting | Why |
|-----------|-------------------|-----|
| Minecraft server for visual reports | `PROBE_SERVER_VERSION=1.21.4` | Matches `prismarine-viewer` supported assets |
| `prismarine-viewer` | `1.33.0` | Latest npm release observed on 2026-06-29 |
| `prismarine-viewer` supported versions | up to `1.21.4` | Do not assume `1.21.11` screenshots are visually faithful |
| Capture browser | Chrome/Chromium through `playwright-core` | Headless screenshot path |
| Report camera | `both`, third-person preferred in report panels | First-person can be obstructed |

## Report Rules

Static HTML reports and review markdown must follow these rules:

- Caption `prismarine-viewer` images as renderer-assisted visual review.
- Never call them native Java client screenshots.
- Never imply they are scoring authority.
- Show or link the paired state evidence when the image is used to discuss
  blocks, placement, construction, material affordances, or progress.
- Prefer wording like:

```text
Renderer-assisted visual review. Block identity is checked from world-state
scan/observe artifacts.
```

Avoid wording like:

```text
actual proof of block placement
actual Minecraft block evidence
the screenshot shows redstone
```

## NPC Execution Runs

For live NPC execution runs intended for later review, keep visual evidence on:

```bash
--visual-profile report
```

If interval `1` is too heavy for a long run, document the reason and use a
larger interval plus required initial/final captures. Do not present the run as
visually reviewed if no images were captured.

The default no-regret-core review bundle should include:

- run report;
- transition-row batch audit;
- seed/reset record;
- world-scenario manifest;
- natural-spawn validation, when applicable;
- visual-evidence manifest and capture JSON files;
- screenshot directory;
- auto review markdown.

## Future Native Client Path

A true Minecraft Java client screenshot requires a real client or client-side
automation/mod path. That would improve visual fidelity, but it would not change
the authority rule: native screenshots are still human review evidence, while
runtime state artifacts remain the source for block identity and progress.
