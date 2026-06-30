# Minecraft-Specific Pressure Tests

This project has unusual affordances: Minecraft is embodied and open-ended,
Mineflayer can execute code, the actor can author new action skills, and LLMs
already know many Minecraft mechanics. A useful harness must account for all of
that instead of pretending every verified action is research.

## What Is Easy Here

These can be important engineering milestones, but they are weak research
claims by themselves:

- Mineflayer executes a generated action.
- The action skill passes schema and permission checks.
- The bot completes a Minecraft task.
- A verifier confirms inventory, block, or position change.
- A log has a clean schema.
- The LLM predicts obvious physical/material deltas from Minecraft common
  knowledge, such as mining wood causing logs to enter inventory.
- 100 repeated tests pass for a deterministic primitive.

If 100/100 success proves only that implementation is robust, the value is
engineering hygiene.

## What Could Be Research Value

Candidate values:

- A layer where plain LLM Minecraft prior is insufficient, but observed
  interaction history adds predictive signal.
- A way to separate action consequence prediction from acting competence.
- A measurement target for social-material deltas that does not collapse into
  dialogue sentiment or actor self-report.
- Evidence that some attractive Minecraft-society framing has no learnable
  signal under cheap conditions.
- A negative result that prevents the project from building a large promotional
  society demo before the substrate is ready.
- A transition dataset with baselines, null cases, and explicit limitations that
  future work can challenge.

## Required Separations

Report separately:

- action generation works vs consequence prediction works;
- generated Mineflayer code passes vs actor chooses useful actions;
- actor task completion vs predicted delta accuracy;
- physical/material delta vs social response;
- current observation vs interaction history;
- LLM prior vs history-grounded prediction;
- dialogue/social prose vs observed other-actor behavior;
- implementation verification vs research contribution.

## Baselines For This Project

Use at least one relevant baseline in every research claim:

- `LLM-prior`: predict from `state_before + action`, no history.
- `history-grounded`: same predictor with pre-action interaction history.
- `majority/no_response`: especially for social response windows.
- `scripted heuristic`: simple Minecraft rules or Mineflayer routine.
- `single actor`: remove multi-actor interaction.
- `dialogue-only`: if social interpretation could come only from chat.
- `actor-success`: acting outcome without prediction, reported separately.

## The No-Regret Core Constraint

Before the Goldilocks preflight, the correct verdict for most ambitious claims
is `core-first`.

Do not select a headline until:

- 2-3 actors run without 60-cycle degeneracy;
- `transition-row/v1` rows are independent of `expected_outcome`;
- observed deltas are layer-tagged;
- other-actor response windows are captured;
- cost discipline is respected.

The preflight thresholds are inputs to a gate, not proof of the final project.

## Mineflayer Code Generation Pressure

Mineflayer code generation can make new actions possible. Ask what that changes
for research:

- Does it expand the action distribution enough to escape degenerate rows?
- Does it make a new consequence layer observable?
- Does it create confounds because action success now depends on generated code
  quality?
- Does the generated action have a verifier and evidence refs?
- Is success measured after schema/permission/runtime checks, not from prose?

Do not call action-skill authoring the research contribution unless the paper is
about safe action-skill generation itself.

## LLM Minecraft Prior Pressure

LLMs know many Minecraft facts. That creates a hard baseline.

Physical/material predictions may be too easy:

- mining;
- crafting;
- placing;
- pathing;
- inventory transfer;
- chest use.

Treat easy physical/material layers as controls unless the experiment shows a
non-obvious action-conditioned consequence.

Social/material layers may be interesting only when:

- another actor can observe the action;
- the response window is bounded;
- response classes are observable;
- history before the action changes prediction;
- social meaning is tied to place, possession, access, need, conflict, repair,
  or obligation, not just chat text.

## Project Sid And Viral Society Claims

Use sensational Minecraft-civilization reports as hypotheses, not proof.

Extract:

- case design;
- proposed metrics;
- failure modes;
- prompt/config ideas.

Do not inherit:

- civilization-scale language;
- religions/laws/taxes before small dynamics work;
- claims without reproducible code, raw logs, scoring scripts, or independent
  replication.
