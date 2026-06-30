# Research Value Rubric

Use this when deciding whether something is a meaningful research direction or
just polished implementation work.

## Research Gap Types

### Knowledge Gap

Something important is not yet known.

Good shape:

```text
It is unknown whether observed interaction history in Minecraft adds predictive
signal beyond LLM prior for a specific social-material layer.
```

Weak shape:

```text
We do not yet have logs.
```

Missing logs are an engineering gap unless the logging method itself is the
research object.

### Methodological Gap

Existing methods cannot answer the question well.

Good shape:

```text
Existing Minecraft agent work optimizes task completion or skill acquisition,
but does not isolate action-conditioned social-material consequences from
actor competence and language priors.
```

Weak shape:

```text
We need a structured schema.
```

A schema is support infrastructure unless it enables a measurement no prior
method could make.

### Evidence Gap

A claim is plausible but under-supported.

Good shape:

```text
Public Minecraft society claims lack reproducible raw runs, scoring scripts, or
independent logs, so their mechanisms cannot be inspected.
```

Weak shape:

```text
We should add evidence-backed verification.
```

Evidence is required, but evidence alone is not the contribution.

### Contradictory Gap

Existing results or claims conflict.

Good shape:

```text
Prompted multi-agent social behavior appears rich in demos, but controlled
embodied environments often collapse into task loops or scripted interactions.
```

Weak shape:

```text
Some papers disagree.
```

Name the conflict and the observation that could discriminate between sides.

### Population / Application Gap

A method works in one domain, population, or environment but may not transfer.

Good shape:

```text
LLM social simulation results in dialogue or sandboxed environments may not
transfer to Minecraft actors whose social state is mediated by place, resources,
access, proximity, and embodied action.
```

Weak shape:

```text
Nobody applied it to Minecraft.
```

Application novelty is weak unless Minecraft changes what can be measured or
what mechanisms matter.

## Other Value Types

Use these when `research gap` is not the right frame.

- Scientific value: reveals a phenomenon or mechanism.
- Methodological value: creates a way to measure or test what was previously
  hard to isolate.
- Measurement value: defines a target or rubric that makes future claims less
  ambiguous.
- Dataset value: creates reusable data with baselines and clear limitations.
- Systems value: makes a new experimental substrate possible.
- Negative-result value: rules out an attractive but weak direction.
- Engineering hygiene: necessary implementation quality, not a research
  contribution.

## Soundness Scores

Score 1-5. A paper-worthy direction usually needs no score below 3, and the key
dimensions should reach 4 after revision.

| Dimension | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Object clarity | slogan | bounded object but fuzzy labels | observable object and scope |
| Gap quality | absent | plausible but under-sourced | close prior-work comparison |
| Significance | nice-to-have | useful internal signal | reviewer-relevant question |
| Falsifiability | only success imagined | weak failure case | clear result can weaken claim |
| Baseline pressure | no baseline | baseline named | baseline can kill the claim |
| Observability | self-report | partial artifact | independent observed target |
| Confound control | ignored | named | measurable or ablated |
| Feasibility | requires big build | small but vague | cheap uncertainty-reducing run |
| Negative-result value | none | cleanup value | narrows or kills branch usefully |

## Kill Signals

- The contribution is "verified", "structured", "validated", or "reproducible"
  without a substantive claim.
- The claim depends on actor self-report as ground truth.
- The experiment only proves that Mineflayer code can execute actions.
- The LLM prior likely already solves the prediction target.
- The proposed social behavior can be explained by prompting, scripted fixture,
  or evaluator imagination.
- The plan cannot name what result would make it stop.
- The plan scales society before small non-degenerate runs exist.
