# Short Human Brief: Should this project become WAM-based, and how?

Date: 2026-06-16. One-screen decision brief. Backing: `final-literature-review.md`,
`../notes/by-theme/hierarchical-wam-for-minecraft-societies.md`, `../matrices/`.

## The decision in three sentences

Yes, make the project WAM-based — but as a **structured-state, advisory,
hierarchical** World Action Model, not a pixel/video one. A WAM means
`p(future state, action | current state)` — predict how an action transforms the
world; the canonical definition (arXiv 2605.12090) is explicitly
modality-independent, so a typed *social-material* state predictor is squarely a
WAM, not a misuse of the term. Keep it advisory: it predicts deltas before an
action and is scored against Mineflayer verifier evidence after; it never acts,
fills arguments, or overrides the verifier.

## What should the project goal be?

> Predict and evaluate how Minecraft actions transform physical state, material
> economy, social relations, memory, and future opportunities — verified against
> deterministic runtime evidence, with prediction accuracy scored separately from
> acting outcome.

Hierarchy: **Physical → Material → Social → Institutional**. Physical must verify
before social claims are meaningful (a social "Bob can now mine" rides on a physical
"Bob holds a pickaxe, durability>0"). This is the empty cell no surveyed system
fills: game/world models predict pixels with zero social-material state (even
Solaris, the only multiplayer Minecraft world model); Minecraft multi-agent
benchmarks stop at task completion; LLM social simulation scores dialogue
plausibility, not verified world consequence.

## What should we build NEXT (in order)

1. **Freeze a transition-row schema** (`social-material-transition/v1`) and a
   post-run logger that joins artifacts the runtime *already emits*
   (`social-cycle-review-summary/v1`, `settlement-state/v1`,
   `grounded-social-trajectory-report/v1`). Auto-labeled by the verifier at ~$0.
2. **A provider-free zero-shot delta-predictor harness** (given state + candidate
   action, predict the delta; score against verified delta). Run later under the
   existing quota guard.
3. **Evaluate the Social WAM now, cheaply**, by predicting the **relationship-ledger
   enum transition** (that verifier already exists) — before building material
   ledgers.
4. **First social benchmark: `borrowed_tool_v1`** (request → lend/refuse → use →
   return/debt/repair), replacing today's decision-only, keyword-scored seed with
   typed-delta + ledger scoring and live handoff evidence.
5. Then the material-claim/obligation/public-affordance ledgers and a two-actor live
   scenario, which unlock the rest of the family ladder.

## What should we NOT build yet

- A pixel/video Minecraft world model (costly, fidelity≠control, hidden social
  state isn't in pixels; reuse pixel weights only as an optional human-review
  sidecar).
- A learned WAM from scratch, or adapting VPT/STEVE/Oasis weights as the predictor
  (wrong modality; the LLM zero-shot harness comes first).
- Anything that lets the WAM act, gate serving, or override the verifier.
- Institutional-scale claims (norms, routines, civilization) — least-proven layer;
  needs multi-actor, multi-episode evidence; avoid Project-Sid-style framing.
- An LLM judge as the primary social score.

## What literature most strongly supports this

- **WAM survey (2605.12090)**: defines WAM, names *hierarchical world-action
  modeling* an open challenge, and flags that the field lacks joint
  prediction-vs-outcome metrics — both of which a Mineflayer verifier supplies by
  construction.
- **S3AP / Social World Models (2509.00559)**: a structured social world model
  already beats free text and shows world-modeling is separable from acting — but it
  scores on dialogue; our move is to make the predicted next-state a *verified*
  delta.
- **GovSim (2404.16698)**: ability to model others correlates **r=0.83** with
  survival — a Social-WAM capability is the bottleneck, not dialogue fluency.
- **Dreamer 4 / DreamerV3**: structured/latent (not pixel) world modeling does the
  hard Minecraft work cheaply — the feasibility proof.
- **SimBench / belief-behavior / Don't-Trust**: the overclaim guardrails — verify
  behavior against the world; never claim human-society fidelity.

## Bottom line

The repo is already most of the way there: it has the runtime seam
(`ActorTurnExpectedOutcome` + `evaluateExpectedOutcomeAgainstDeltas`), a working
relationship-ledger verifier, and artifacts that auto-label transitions for free.
The WAM reframing is low-risk, additive, and occupies a genuinely empty, defensible
research niche — provided it stays advisory, structured, small-N, and verified.
