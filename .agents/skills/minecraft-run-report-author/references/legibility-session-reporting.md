# Legibility Session Reporting

Use this reference when the primary artifact is `legibility-session/v1`,
`transition-row/v1`, `public-history/v1`, `experiment-declaration/v1`,
`legibility-prediction/v1`, or `legibility-score-report/v1`.

## Table Of Contents

- Required Bundle
- Fast Artifact Queries
- Claim Boundaries
- Common Mistakes

## Required Bundle

For a publishable legibility report, expect one directory containing:

- `session.json`
- `public-history.json`
- `experiment-declaration.json`
- `predictions.json`
- `score-report.json`
- `transition-rows/*.json`
- evidence and actor-workspace refs named by the rows

Run the bundled readiness check on `session.json` before prose:

```bash
bun run .agents/skills/minecraft-run-report-author/scripts/report-readiness-check.ts \
  <bundle>/session.json --publishable
```

## Fast Artifact Queries

Summarize the run shape:

```bash
jq '{session_id, actor_routes, slot_count: (.slot_events|length), chat_count: (.chat_events|length), response_window_count: (.response_windows|length), row_count: (.transition_rows|length)}' <bundle>/session.json
```

Summarize row labels and response-window closure:

```bash
jq '.transition_rows[] | {row_id, actor_id, condition, action_kind: .executed_action.action_kind, physical: .observed_delta.physical.classes, material: .observed_delta.material.classes, social: .observed_delta.social_response.classes, close_reason: .observed_delta.social_response.response_window.close_reason, label_locked_at: .timestamps.label_locked_at}' <bundle>/session.json
```

Summarize predictor results:

```bash
jq '.metrics[] | {predictor_arm, condition, layer, support, macro_f1, majority_macro_f1, lift, rer_brier, auc_lift_over_0_5}' <bundle>/score-report.json
```

Check public-history leakage:

```bash
jq '.leakage_checks' <bundle>/public-history.json
```

## Claim Boundaries

Say what the bundle proves at the right level:

- A provider-free fixture proves the substrate path runs, not live Minecraft behavior.
- A valid transition row proves a recorded observed delta, not predictor quality.
- A positive lift value proves only the scored arm beat its declared baseline on the reported support.
- `support=2` is a smoke result, not a research conclusion.
- Public-history leakage checks passing means the export obeyed its local allowlist; it is not proof that every future predictor prompt is leak-free.

Always separate:

- acting outcome;
- physical competence;
- social response;
- material access;
- prediction quality;
- continuity and robustness;
- provider cost/quota state.

## Common Mistakes

- Do not infer material transfer from chat alone in live runs. Provider-free fixture rows may use scripted fixture evidence, but live claims need runtime inventory/container/world evidence.
- Do not count `predicted_delta` inside `transition-row/v1`; rows are labels and observed deltas only.
- Do not join predictions by actor name, timestamp, or prompt order. The join key is `row_id` after labels are locked.
- Do not call a score "model superiority" unless the run is a declared model comparison with quota/preflight artifacts and a meaningful sample.
- Do not describe screenshots as source of block identity without neighboring runtime evidence.
