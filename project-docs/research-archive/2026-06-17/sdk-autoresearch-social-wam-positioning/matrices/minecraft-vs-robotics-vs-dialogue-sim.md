# Minecraft vs robotics sim vs dialogue-only social sim

What this is: why wild, natural Minecraft is scientifically useful for grounded social-WAM research, and
what it can and cannot claim relative to robotics simulators and dialogue-only social simulation.
Backing synthesis: `../notes/by-theme/substrate-comparison-minecraft-robotics-dialogue.md` (lane C).
ASCII punctuation only.

## The one axis that separates the three families

Two properties decide a substrate's fitness for grounded social study:

1. Does it have a deterministic MATERIAL verifier? Can the environment (not a judge) state exactly and
   cheaply who holds what, who controls what, and whether a transfer happened.
2. What does fidelity cost per actor? High physical fidelity raises per-agent compute and caps the
   agent count; society-scale social study wants many cheap deterministic actors.

Minecraft is the only family that scores well on BOTH.

## The matrix

| Property | Minecraft (this repo) | Robotics sim (MuJoCo / Isaac / Habitat 3.0) | Dialogue-only social sim (Generative Agents / SOTOPIA) |
|---|---|---|---|
| Physical layer grounded | Y, deterministic engine truth | Y, high fidelity (the point) | N |
| Material layer (possession/transfer/claim) verifiable | Y, native and cheap | ~ (object pose; not as social state) | N (text only) |
| Social/institutional as VERIFIED state | repo target (built on verified material) | N (co-presence/coordination only) | named but judge-scored, not verified |
| Reality gap to real world | none (engine is truth), so no transfer claim | Yes, inevitable, so transfer IS the claim | n/a (no physical layer) |
| Per-actor cost | low (headless, no GPU) | high (contact physics, rendering, GPU) | lowest |
| Verifier | deterministic runtime, near-$0 | sim-state check for TASKS (Habitat/PARTNR) | LLM/human judge (unreliable, over-rates) |
| Many-actor society feasible | Y | low (fidelity caps agent count) | high count, but ungrounded |
| Real-world physical transfer claim | N | Y | N |
| Pixel/perception realism claim | N (stylized) | Y (Isaac) | n/a |
| Open natural-world tasks | Y (MineDojo 2206.08853) | scene/household tasks | scenario scripts |

## Why Minecraft is scientifically useful

- A deterministic material substrate at society scale with near-zero verification cost. Possession,
  transfer, and control are exact engine facts a runtime verifier reads for free, and many lightweight
  actors co-inhabit one world. That is exactly what a four-layer social predictor needs: a reliable
  physical and material FLOOR under any social claim, and enough actors that "social" means more than a
  dyad.
- Triplet supervision for free. Every validated tool call plus the verifier delta yields an
  (o_t, a_t, o_{t+1}) triplet with no inverse-dynamics model and no human labeling.
- The verified-consequence-vs-plausible-claim distinction that the social-sim literature spent years
  establishing is, in Minecraft, simply a property of the substrate.

## What Minecraft CANNOT claim

- Real-world physical transfer is robotics' claim, paid for with the inevitable sim-to-real gap
  (2009.13303, 2502.13187). A Minecraft result says nothing about a physical robot.
- Pixel-level perception realism is robotics' and pixel-world-model territory (Isaac photorealism);
  Minecraft's renderer is stylized.
- Human-fidelity social claims are no cheap substrate's to make. Dialogue sim has the richest social
  vocabulary and the cheapest actors but no material verifier, so it cannot test material consequence
  at all, and its judge is unreliable (over-rates believability at long context). Minecraft does not
  inherit that ambition; it claims the narrower, provable thing: verified, world-grounded
  social-material trajectories for a named model, partner, and seed.

## One sentence

Robotics sim owns physical transfer and pays the reality gap; dialogue sim owns social vocabulary and
has no material verifier; Minecraft owns the cheap, deterministic, society-scale material substrate that
lets social predictions stand on a verified physical and material floor, which is the floor the other
two cannot give at the same time and cost.

## Implications

- Pitch Minecraft as the MATERIAL-substrate choice, not a robot proxy or a better chatroom: "verified
  material consequence, cheaply, for many actors."
- Keep the verifier non-generative and deterministic; an LLM game master as the material authority would
  throw away the substrate's one decisive edge.
- Label every scenario natural-world vs command-fixtured; only natural-world acquisition grounds a
  material claim.
- Do not claim transfer or perception realism; cite robotics sim and the reality-gap surveys for why
  Minecraft deliberately does not play there.
