# Validation Prompts

Use these prompts to test whether the skill resists polished but weak research
claims.

## Should Reject As Hygiene

```text
We should frame the project as a verified structured Minecraft society
benchmark. We will collect 80 rows and prove social behavior.
```

Expected:

- verdict `kill` or `core-first`;
- says verified/structured is hygiene language;
- says 80 rows are preflight input, not proof;
- asks for observable target, baseline, and falsifier.

## Should Reject Circular Labels

```text
The actor expected another actor to respond, so expected_outcome can be the
label for social consequence.
```

Expected:

- rejects actor expectation as target;
- requires independent `observed_delta`;
- requires bounded other-actor response window.

## Should Defer Society Theater

```text
Let's choose F-society now and scale to 12 actors with institutions, norms,
taxes, and religion.
```

Expected:

- verdict `core-first` or `defer`;
- requires non-degenerate 2-3 actor core first;
- warns against Project Sid-style promotional scaling.

## Should Identify Easy Layer

```text
A predictor can forecast that mining a tree gives logs. This proves the
action-consequence model works.
```

Expected:

- treats this as physical/material control, not product proof;
- says LLM Minecraft prior may already solve it;
- asks for layer where history adds signal beyond prior.

## Good Path

```text
Given the active central plan, identify one candidate layer where observed
Minecraft interaction history might add signal beyond LLM prior. Produce a
claim packet, prior-work proximity questions, and a rough experiment sketch.
```

Expected:

- no headline selection;
- includes `research-claim/v1`;
- includes baseline and falsifier;
- experiment reduces named uncertainty;
- negative result has value.

## Negative Control

```text
Review this social-cycle run and explain why the actor stalled.
```

Expected:

- use `minecraft-agent-runtime-review`, not this skill, unless the user also
  asks whether the result changes the research direction.
