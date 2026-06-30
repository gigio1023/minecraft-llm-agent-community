---
slug: qwen-minecraft-agent-natural-village
title: "Testing Qwen in a Minecraft LLM Agent: a 30-Cycle Natural Village Run"
authors: [gigio1023]
tags: [qwen, minecraft, llm-agents, evaluation, mineflayer]
---

I tested Qwen Plus and Qwen Max inside a small Minecraft LLM-agent harness,
then compared them with GPT-5.4 mini and Gemini 3.1 Flash Lite on the same
natural-village task.

The point was not to make a leaderboard. I wanted a run where every model had
to act in the same fresh Minecraft world, leave runtime evidence, and fail in
ways that could be inspected later.

<!--truncate-->

## What I Ran

The task was deliberately narrow:

```text
Start near a natural village. Over 30 cycles, keep making concrete Minecraft
progress toward a useful village-adjacent work point: collect logs, craft
planks/sticks, create or place a crafting table, recover from blockers, and
leave reviewable evidence.
```

The completed comparison lanes were:

- Qwen Plus through ModelScope
- Qwen Max through ModelScope
- GPT-5.4 mini through the OpenAI API
- Gemini 3.1 Flash Lite through the Gemini API, with request pacing

Each lane used the same scenario:

- world scenario: `natural-village-spawn-v1`
- seed: `4167799982467607063`
- fresh world per lane
- 30 cycles per completed lane
- report-grade visual profile
- Minecraft server version `1.21.4` for screenshots
- first-person, third-person follow, and third-person high captures every cycle

The final self-contained report is in the repository:

[`project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html`](https://github.com/gigio1023/minecraft-llm-agent-community/blob/research/docs/project-docs/static-exports/final-natural-village-model-comparison-report-2026-06-30.html)

## Why This Was More Useful Than a Simple Prompt Test

A normal prompt comparison can hide too much. A model can say it made progress
without moving the Minecraft bot, changing inventory, placing a block, or
recovering from a real runtime blocker.

This harness separates several things:

- provider output
- selected action
- runtime execution
- verifier result
- inventory/world delta
- visual evidence
- review summary

Screenshots are included, but they are not treated as the source of truth. Block
identity and success claims come from runtime artifacts and verifier output.

## The Short Result

Across the four completed 30-cycle lanes:

| Model | Verified progress | Blocked | No progress | Provider records | Total tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen Plus | 12 | 8 | 10 | 38 | 1.13M |
| Qwen Max | 15 | 8 | 7 | 38 | 1.09M |
| GPT-5.4 mini | 8 | 9 | 13 | 204 | 1.12M |
| Gemini 3.1 Flash Lite | 11 | 19 | 0 | 67 | 1.71M |

Qwen Max produced the deepest material progress in this run: a wooden pickaxe,
six cobblestone, dirt continuation, and the best verified-progress count.

Qwen Plus was slightly less deep, but still gave a clean early crafting-table
chain and retained useful inventory.

GPT-5.4 mini completed the lane, but spent many more provider records and did
not close the same placed-workbench evidence.

Gemini 3.1 Flash Lite completed only after explicit request pacing. Its unpaced
attempt stopped at cycle 6 on the provider token-per-minute window, which is a
quota condition rather than a Minecraft behavior result.

## What Qwen Did Well Here

Qwen was useful in exactly the part of the task I cared about: turning a small
Minecraft situation into concrete material work.

The Qwen lanes did not just produce plausible plans. They left evidence such as
inventory deltas, crafted items, and placed or used workbench state. Qwen Max in
particular pushed past the initial wood/crafting-table loop into tool and
cobblestone work.

That matters because this project is not trying to optimize a Minecraft score.
Minecraft is the substrate for studying whether LLM agents can maintain
grounded action continuity in a shared world.

## What Still Failed

The failures were also useful.

The run exposed:

- movement recovery loops after early crafting progress
- table-crafting and recipe-contract friction
- generated action-skill/provider-contract rejection
- screenshot caveats where a camera can show an impossible-looking cross-section

Those are not only model failures. They are harness failures, action-surface
failures, and verifier-contract failures. The next run should narrow the target
to something like:

```text
Place a crafting table and maintain a safe village-adjacent work point.
```

That would make the recovery target sharper than asking for workbench, shelter,
storage, and long-horizon continuity all at once.

## Reproducible Artifacts

The project includes:

- final HTML report with embedded screenshots
- combined comparison JSON
- per-model review summaries
- provider preflight records
- full run reports
- selected report-grade screenshots
- a final report generator

Start here:

[`QWEN_NATURAL_VILLAGE_EVAL.md`](https://github.com/gigio1023/minecraft-llm-agent-community/blob/research/docs/QWEN_NATURAL_VILLAGE_EVAL.md)

This was a personal open-source experiment using Qwen through ModelScope. It is
small, imperfect, and much more informative than a clean demo that hides the
blockers.
