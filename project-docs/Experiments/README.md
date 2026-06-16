---
sidebar_position: 39
---

# Experiment Archive

Search token: `EXPERIMENT_ARCHIVE_INDEX`.

Status: active archive policy for benchmark, provider-smoke, and live-runtime
experiments.

Recorded: 2026-06-13.

This directory is the repo-owned home for experiment records that should not
remain only in ignored scratch paths such as `tmp/`.

## Purpose

Use this archive to preserve enough evidence to compare Minecraft LLM runtime
runs over time:

- benchmark target and success criteria;
- provider, model, and reasoning configuration;
- world scenario, seed, fresh-world status, and actor workspace path;
- raw `social-cycle-run-report/v1` JSON;
- generated review summaries;
- final inventory, world, verifier, and blocker evidence;
- provider usage, cost-relevant usage fields, and latency;
- screenshots or other visual evidence when enabled;
- HTML reports when a run is meant for human comparison.

## Layout

```text
project-docs/Experiments/
  README.md
  INDEX.md
  catalog.json
  raw/YYYY-MM-DD/...
  YYYY-MM-DD/<named-experiment>/...
```

`raw/YYYY-MM-DD/` preserves selected raw artifacts copied from scratch space.
Named dated experiment directories contain curated summaries, HTML reports, and
assets that are meant to be read directly.

Current curated reports:

- `2026-06-13/qwen-comparison-worksite/index.html`
- `2026-06-14/qwen-60-cycle-dual-camera/index.html`
- `2026-06-14/qwen-60-cycle-dual-camera/review-and-next-benchmark.md`
- `2026-06-14/natural-seed-candidate-9137002542963915989-smoke/README.md`
- `2026-06-14/placed-furnace-natural-60/index.html`
- `2026-06-14/placed-furnace-natural-60/README.md`
- `2026-06-15/grounded-social-trajectory-smoke/index.html`
- `2026-06-15/borrowed-tool-qwen-plus-smoke/index.html`

## Required Run Metadata

Every new benchmark run should record:

- absolute date in the filename or parent directory;
- provider id and exact model id;
- reasoning configuration, or an explicit note that the provider has no
  confirmed equivalent setting;
- cycle count and `max_actions_per_cycle`;
- world scenario id, seed, and whether the world was reset;
- whether each model/run used its own fresh world;
- benchmark target and milestone scoring logic;
- raw report path and actor workspace path;
- provider usage ledger path;
- visual evidence status and screenshot count.

For open-world social interaction runs, also record:

- active actor ids and whether each actor had a separate Mineflayer bot;
- whether actors co-occupied the loaded world and could observe each other;
- seeded scenario facts versus events produced by the actors during the run;
- material claim, obligation, relationship, memory, and cross-actor consequence
  refs;
- which evidence comes from live Minecraft runtime artifacts and which evidence
  is only provider-authored interpretation.

## Scoring Boundary

Do not create benchmark sets that score tool schema compliance, structured
argument formatting, or provider-level function-call transport. Those are
required runtime/provider contracts, not the benchmark target.

Allowed benchmark targets are Minecraft behavior and runtime evidence:

- objective reached or not reached;
- milestone progress;
- cycles to objective;
- wall time and provider latency;
- provider usage and estimated cost inputs;
- verifier pass/fail/blocker patterns;
- repeated-action loops and recovery behavior;
- screenshot-backed visible state when visual evidence is enabled.

Tool-call or schema failures may still appear in the review as post-run
diagnostics. They should not be the benchmark's primary scoring dimension.

## Tmp Import Policy

On 2026-06-13, selected experiment-like files under `tmp/` were copied into
`raw/YYYY-MM-DD/` and indexed in `INDEX.md` and `catalog.json`.

Selection included benchmark reports, social-cycle reports, provider smokes,
objective runs, planner-provider reports, manual-server checks, seed-scout
reports, and action-skill matrix artifacts. Checklist-only or focused unit-test
scratch files were intentionally excluded unless they were part of a dated
runtime experiment.

`tmp/` remains scratch space. The durable experiment record is this directory.
