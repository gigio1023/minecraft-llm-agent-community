# Live NPC Dialogue Plan

> Archived historical plan.
> This is not the active implementation plan.
> Use `SPEC.md` as the canonical current plan.

## What This Was

This document originally described a live-provider dialogue probe where two NPCs
would:

- receive structured runtime context;
- choose one bounded action per turn;
- produce visible in-world dialogue;
- leave transcript-visible provider and action evidence.

## Why It Is Archived

After the `main`-based reset, the active build order changed.

The current rebuild focuses first on:

- single-bot boring competence;
- stronger observation and verification;
- transcript and artifact quality;
- single-bot live reconnect;
- a minimal action-skill memory hook.

Live multi-actor dialogue still matters later, but it is not the active first
proof target.

## What We Keep From It

Useful takeaways:

- provider-backed turns should stay bounded to one validated action;
- provider reasoning should never replace runtime verification;
- transcript and traces should expose what the provider saw and proposed;
- dialogue should remain tool-shaped and runtime-visible.

## What We Do Not Take Forward Directly

- this exact live dialogue rollout order;
- making multi-actor live dialogue the next milestone;
- assuming visible dialogue is stronger proof than boring gameplay competence.

## Read Instead

Use these documents for the active direction:

1. `../../../../SPEC.md`
2. `../Architecture/Minimal-Probe.md`
3. `../Setup/Provider-Setup.md`
