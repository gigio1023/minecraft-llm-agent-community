# Research Value Harness Protocol

This protocol turns a vague research direction into a decision record. Keep the
work source-grounded and explicit enough that another reviewer can challenge it.

## 1. Intake

Collect:

- the proposed direction or plan section;
- the active central plan constraints;
- local evidence already available;
- claimed research contribution;
- target audience: internal plan, experiment proposal, paper framing, or skill
  design.

If the prompt is vague, write the candidate in this form:

```text
We study <object> under <conditions> by measuring <observable target> against
<baseline>, because <prior work> does not already settle <gap>.
```

If any placeholder cannot be filled, do not proceed as if the claim is formed.
Mark the missing piece.

## 2. Classify The Value

Use `research-value-rubric.md`.

Name both:

- `research_gap_type`: knowledge, methodological, evidence, contradictory,
  population/application, or none;
- `value_type`: scientific, methodological, measurement, systems, dataset,
  negative-result, or engineering hygiene.

The same work can have more than one value type, but do not inflate the label.
If the value is only "we can verify it", call it hygiene.

## 3. Prior-Work Proximity

Find close work before judging novelty. For current AI/ML papers, use web search
and `hf papers search/info`. Record what each source teaches mechanically and
why it does or does not settle the proposed claim.

Do not accept keyword novelty. Compare mechanisms.

## 4. Baseline Pressure

Name the baseline that could make the contribution disappear.

Common baselines:

- plain LLM prior over `state_before + action`;
- grounded prompt with current observation but no history;
- majority or `no_response` baseline;
- scripted/Mineflayer heuristic;
- single-actor version of the setup;
- dialogue-only social state;
- actor task success without prediction;
- human-authored action skill or generated action skill without learned
  consequence prediction.

If no baseline can be named, the claim is not formed.

## 5. Soundness Review

Score and critique the proposal using the rubric. Keep the strongest objection
visible. The review can approve only if it identifies:

- an observable target;
- a plausible research gap;
- a falsifier;
- a baseline;
- a cheap uncertainty-reducing experiment;
- a meaningful negative result.

## 6. Experiment Sketch

Sketch the smallest experiment that can reduce uncertainty. Do not reward scale.

Required:

- uncertainty to reduce;
- independent variable;
- observed target;
- baseline;
- minimum run condition;
- stop/defer condition;
- negative-result interpretation;
- artifacts needed.

## 7. Decision

Use one of:

- `kill`;
- `defer`;
- `core-first`;
- `preflight-ready`;
- `headline-candidate`.

Write `what_not_to_do_next`. This prevents every attractive branch from staying
alive forever.

## 8. If Asked To Implement

For this project, default to docs/skill/templates first. Do not change runtime
code unless the user explicitly asks for runtime implementation and the active
central plan allows it.
