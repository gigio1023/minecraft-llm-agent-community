---
name: minecraft-run-report-author
description: >
  Write, review, validate, or prepare Minecraft runtime run reports, HTML/static
  reports, model-comparison summaries, Qwen/OpenAI/Gemini writeups, visual
  evidence reports, public artifact summaries, or Korean/English "보고서"
  requests from this repo's social-cycle, action-skill, provider, visual, or
  transition-row artifacts. Use before drafting report prose or publishing
  experiment conclusions.
---

# Minecraft Run Report Author

Use this skill to keep reports evidence-grounded. The goal is not pretty prose;
it is preventing repeated overclaims, missing quota context, broken artifact
refs, and screenshot-only conclusions.

## Quick Start

1. Identify the exact report bundle. Do not use "latest" blindly.
2. If the run used a live provider, locate the preflight artifact or run
   `provider-quota-preflight` before rerunning anything.
3. For `social-cycle-run-report/v1`, run the runtime-review summarizer first:

   ```bash
   node .agents/skills/minecraft-agent-runtime-review/scripts/summarize-social-cycle-report.mjs <report.json>
   ```

4. Run the readiness check before final report prose:

   ```bash
   node .agents/skills/minecraft-run-report-author/scripts/report-readiness-check.mjs <report.json>
   ```

5. If the report will compare models or become a public/HTML artifact, also run
   the focused audit/review commands that apply to the artifact:

   ```bash
   cd probe
   bun run probe:social-cycle-audit -- <report.json> --audit-report <audit.json>
   bun run probe:social-cycle-review -- <report.json> --markdown <review.md>
   bun run probe:social-cycle-benchmark-metrics -- --report <report.json> --out <metrics.json> --html <metrics.html>
   bun run probe:social-cycle-benchmark-score -- --metrics <metrics.json> --out <score.json> --html <score.html>
   ```

## Required Report Shape

Start from evidence, then write prose. Include:

- `Recording verdict`: whether artifacts are complete enough to review.
- `Experiment verdict`: what the run actually supports.
- `Claim table`: material claim, social claim, visual claim, provider/cost
  claim, and exact source artifact/ref for each.
- `Run identity`: command, scenario, seed, actor, provider/model, cycle count,
  visual profile, and date.
- `What happened`: outcome distribution, verified mutations, blockers,
  observation loops, action concentration, retry constraints, and social signals.
- `What was recorded`: report JSON, actor workspace, provider snapshots,
  evidence refs, visual captures, preflight artifacts, usage ledger refs.
- `What is not proven`: missing refs, weak screenshots, provider fallback,
  stale/local-only artifacts, budget caveats, or unsupported research claims.
- `Next experiment`: one narrow follow-up run or implementation fix.

## Evidence Rules

Prefer evidence in this order:

1. Runtime evidence artifacts with verifier-backed world, inventory, container,
   position, chat, helper-event, or tool-result mutation.
2. `transition-row/v1`, seed/reset, natural-spawn validation, and visual audit
   artifacts when relevant.
3. Provider input/output snapshots for what the model saw and emitted.
4. Review-summary markdown as an index, not as the source of truth.
5. Human-visible notes from the user.

Do not count provider prose, memory notes, `wait`, repeated observation, or
screenshots alone as physical/social success.

## Forbidden Claims

Do not claim these unless artifacts explicitly prove them:

- leaderboard result;
- research conclusion;
- model superiority;
- prediction-prior lift;
- durable society/sociality;
- block identity from pixels;
- progress from animation or movement only;
- provider budget safety without preflight and usage evidence.

When in doubt, say what the run recorded and what remains unproven.

## Related Skills

- Use `provider-quota-preflight` before provider-backed reruns or comparisons.
- Use `minecraft-agent-runtime-review` when the report depends on behavior-loop
  diagnosis, action-skill matrix results, or visual artifact interpretation.
- Use `minecraft-research-value-harness` before turning a report into a research
  direction or paper claim.
