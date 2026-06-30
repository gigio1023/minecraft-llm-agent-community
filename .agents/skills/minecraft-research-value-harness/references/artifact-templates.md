# Artifact Templates

Use these as output contracts. Fill only fields supported by evidence or clearly
marked inference.

## `research-claim/v1`

```yaml
schema_version: research-claim/v1
claim_id:
research_object:
conditions:
observable_target:
baseline_that_could_erase_it:
research_gap_type:
value_type:
prior_work_gap:
falsifier:
non_goals:
evidence_refs:
unknowns:
```

## `prior-work-proximity/v1`

```yaml
schema_version: prior-work-proximity/v1
query_log:
  - query:
    tool:
    date:
sources:
  - title:
    url_or_path:
    source_type:
    mechanism_taught:
    closest_overlap:
    gap_remaining:
    caution:
novelty_delta:
weakening_evidence:
```

## `proposal-soundness-review/v1`

```yaml
schema_version: proposal-soundness-review/v1
verdict: kill | defer | core-first | preflight-ready | headline-candidate
scores:
  object_clarity:
  gap_quality:
  significance:
  falsifiability:
  baseline_pressure:
  observability:
  confound_control:
  feasibility:
  negative_result_value:
strongest_objection:
revision_needed:
cheap_disambiguating_test:
why_not_implementation_yet:
```

## `experiment-sketch/v1`

```yaml
schema_version: experiment-sketch/v1
uncertainty_to_reduce:
hypothesis:
candidate_layer:
independent_variable:
observed_target:
baseline:
run_protocol:
minimum_data:
artifacts_needed:
evaluator:
stop_condition:
negative_result_interpretation:
cost_bound:
```

## `negative-result-ledger/v1`

```yaml
schema_version: negative-result-ledger/v1
result:
what_failed:
what_it_rules_out:
what_it_does_not_rule_out:
next_decision: kill | defer | core-first | collect-more | revise-labels
archive_tag:
evidence_refs:
```

## `research-decision/v1`

```yaml
schema_version: research-decision/v1
decision:
verdict: kill | defer | core-first | preflight-ready | headline-candidate
evidence_used:
alternatives_considered:
strongest_objection:
accepted_risk:
next_action:
what_not_to_do_next:
```
