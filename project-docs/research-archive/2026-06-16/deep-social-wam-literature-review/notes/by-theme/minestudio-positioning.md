# MineStudio Positioning — the exact boundary vs this repo's runtime

Lane 2 theme file. This **sharpens** the existing repo analyses; it does not
repeat them. Read those for the full inventory:
- `project-docs/research-archive/2026-06-16/minestudio-reference-check.md`
- `project-docs/research-archive/2026-06-16/minestudio-implementation-analysis.md`

Those already established (at MineStudio commit 278aa85, Oct 2025): 7 components
(simulator, data, models, offline, online, inference, benchmark); **153 task
YAMLs** (76 simple + 77 hard); **671 init commands** (368 `/give`, 93
`/replaceitem`, 56 `/summon`, 49 `/setblock`); VPT/STEVE-1/GROOT/ROCKET model
code; MineRL/Malmo simulator; PyTorch-Lightning offline + Ray online training;
VLM/criteria auto-eval; and the verdict: **reference + future baseline lane, NOT
an active runtime replacement**. This file adds three things: (1) the HF model-
gallery facts I confirmed live, (2) the precise layer boundary, (3) what
MineStudio is and is not in the WAM taxonomy.

## 1. What MineStudio *is* (one line, sharpened)

MineStudio (arXiv 2412.18293, CraftJarvis) is a **packaging + tooling layer over
the MineRL/Malmo visual-policy stack** — it standardizes how you simulate, record,
train, and benchmark **pixel-in / camera-buttons-out** Minecraft policies, and it
re-hosts the canonical weights. It is infrastructure for the *visual-policy*
research community, not an agent and not a world model.

## 2. HF model-gallery facts (confirmed live, 2026-06-16)

The CraftJarvis HF org is MineStudio's model distribution point. Confirmed:
- `MineStudio_VPT.foundation_model_2x` (+ `1x/3x`, `bc_*`, `rl_*` variants) — VPT.
- `MineStudio_STEVE-1.official` — **12,822 downloads**, the most-downloaded
  Minecraft policy on the Hub.
- `MineStudio_GROOT.18w_EMA` — GROOT.
- `MineStudio_ROCKET-1.12w_EMA`, `ROCKET-3-1.5x` — ROCKET line.
- `JarvisVLA-Qwen2-VL-7B` (519 dl) + 2509 OpenHA/CrossAgent/motion-action family.
- Datasets: `minestudio-data-6xx..10xx` (free-play / early-game / house-building /
  obtain-diamond; 6xx alone = **248 GB, no card, viewer unavailable**).

Implication: every public Minecraft visual policy is one `from_pretrained` call
away *if* you adopt the MineStudio/MineRL Python stack. That is the draw — and the
boundary: adopting them means adopting MineRL/Malmo/JDK/Ray/Lightning/GPU, which
the existing analysis already flagged as a Linux/amd64 setup project, not a quick
path on this Apple-Silicon TypeScript repo.

## 3. The exact layer boundary (the sharpened contribution)

| Dimension | MineStudio / MineRL layer | This repo's layer |
| --- | --- | --- |
| **Runtime** | Python, MineRL/Malmo, Gymnasium `MinecraftSim` | TypeScript, **Mineflayer**, Actor Turn loop |
| **Control altitude** | camera/buttons @ 20 Hz (pixel-grounded) | **typed Action Cards** + gated `author_mineflayer_action` |
| **Observation** | 128×128 pixels (inventory withheld from model) | **typed structured state** + source-evidence cards; pixels are support only |
| **Decision-maker** | learned policy net (`p(a\|o)`), or VLM | **LLM proposes one typed tool** with full context; runtime owns execution |
| **Truth source** | env reward / programmatic detector / **VLM-or-human rubric** | **structured in-world evidence** (inventory deltas, container snapshots, verifier output) |
| **Reset** | `FastReset` (kill+teleport, throughput) vs `HardReset` (seeded, fair) | fresh-world same-seed fairness; fast reset explicitly rejected as a fairness protocol |
| **Social/material** | **none** (single-agent visual tasks) | **typed social ledger**: claims, obligations, relationships, memory, weak commons |
| **Unit of progress** | item-in-inventory / task success | **durable social-material consequence** + post-goal continuation |

The boundary in one sentence: **MineStudio owns the low-level visual-policy body
and its training/benchmark plumbing; this repo owns the high-level typed-action,
evidence-grounded, social-material reasoning layer.** They meet only if a
MineStudio policy is used as an *isolated executor baseline* in a separate lane —
never mutating this repo's actor state, PlanBeads, memory, claims, or action-skill
authority (the existing analysis's rule, restated).

## 4. MineStudio in the WAM taxonomy

- It is **not a WAM** (no co-generated predicted future `o'` driving actions).
- It is **not a single agent** — it is a *toolkit* hosting several agents (VPT =
  VLA; STEVE-1/GROOT = goal-conditioned VLA; ROCKET-1 = segmentation-conditioned
  VLA; JarvisVLA = VLM-VLA).
- Its **simulator** is a Physical-layer environment; its **callbacks** are
  recording/setup plumbing; its **auto-eval** is a VLM/rubric audit layer.
- It contributes **nothing** to Material/Social/Institutional layers.

## 5. What to adapt vs avoid (sharpened, non-duplicative)

The existing analysis already lists the benchmark-discipline lessons (small
declarative manifests, separate setup-commands from task-text, record full
episodes, explicit callbacks, simple/hard variants, criteria files, reusable
datasets). Two **sharpenings** Lane 2 adds:

1. **The callback pattern is a *recording/evidence-writer* analogy, not an
   authority analogy.** MineStudio callbacks can mutate the env (commands, mob
   summon, inventory init). In this repo, the equivalent hooks must be
   **evidence writers and typed gates**, never hidden domain planners or
   prose-execution paths. Translate `RecordCallback → transcript/verifier/
   screenshot writer`, `CommandsCallback → explicit world-setup fixture artifact`,
   `TaskCallback → scenario/Active-Episode context` — and drop `FastReset` as a
   fairness protocol.
2. **The 671-command fixture density is the key caution, not the task list.** The
   value to extract is the *labeling discipline*: every scenario must be tagged
   natural-world vs command-fixtured, because MineStudio's strength (controlled,
   command-provisioned competence gates) is precisely what must **not** be counted
   as natural-world social-material evidence in this repo.

## 6. Net positioning

MineStudio is the **best available reference** for Minecraft visual-policy
infrastructure and the **canonical source of public policy weights**. For this
repo it is: (a) an offline benchmark-discipline reference, (b) a future isolated
visual-policy baseline lane, (c) a cautionary example of command-fixture density
and VLM-scoring-as-truth. It is **not** a runtime, **not** a social benchmark, and
**not** a WAM. The repo's active authority (Mineflayer typed actions + structured
evidence + social ledger) stays unchanged; MineStudio sits one clean boundary away.
