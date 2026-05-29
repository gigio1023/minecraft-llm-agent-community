# Mutual NPC Interaction Probe

> Archived historical plan.
> This is not the active implementation plan.
> Use `SPEC.md` as the canonical current plan.

## What This Was

This document originally described a two-NPC interaction probe focused on:

- visible dialogue;
- approach and attention;
- a small material handoff;
- transcript evidence for the interaction.

## Why It Is Archived

After the `main`-based reset, the repository direction changed.

The active project definition is now:

- first prove boring single-bot competence;
- make failures explainable from transcript and runtime artifacts;
- support single-bot live reconnect;
- leave architecture room for later multi-bot and social simulation work.

That means this older mutual-interaction plan is no longer the implementation
driver.

## What We Keep From It

Useful takeaways:

- transcript-visible interaction evidence matters;
- cause-and-effect across actors should eventually be explicit;
- social interaction should include world consequences, not only chat;
- a later multi-bot probe should remain bounded and observable.

## What We Do Not Take Forward Directly

- this exact implementation sequence;
- this exact probe as the next proof target;
- the assumption that multi-bot interaction should be the first milestone.

## Read Instead

Use these documents for the active direction:

1. `../../../../SPEC.md`
2. `../Architecture/Minimal-Probe.md`
3. `../Agent-Search-Index.md`
