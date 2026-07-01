# Recommended research spine

What this is: 3 to 5 candidate paper framings for the project, each scored against the project's own
constraints, with one recommended and the reasoning. Backing: lane A (sdk-loop), lane B (novelty), lane
C (substrate), lane D (reproducibility/Sid), and the 2026-06-16 directions report. ASCII punctuation
only.

## The constraints a framing must satisfy

From the standing mission and the framing rules:

- Positive contribution, not infrastructure. Evidence, logs, ledgers, seeds, scoring scripts are
  SUPPORT and an audit surface, never the headline.
- Not "structured state" as the novelty (an implementation detail).
- Not evidence-first benchmarking ("we log everything, therefore research").
- Falsifiable, and defensible on novelty: lane B shows every single axis is crowded and two position
  papers already name the physical-plus-social frontier, so the only open cell is the INTERSECTION.
- WAM angle concrete: action-conditioned prediction of future physical AND social-material consequence.
- Autoresearch angle concrete: a coding-agent loop proposes code changes; independent runtime evidence
  decides what lands.
- Must not become Project Sid: no civilization-scale claim without released runnable scoring.

## The candidate framings

### F1. The advisory social-material world model (predict-and-verify)

Thesis: an action-conditioned predictor p(o' | o, l) whose predicted next-state is a VERIFIED
physical-material-social delta (possession, claim, obligation, trust), scored against a deterministic
Mineflayer verifier, with per-transition PREDICTION accuracy reported SEPARATELY from acting outcome.
Contribution = the first measurement of social-material prediction accuracy against an external
verifier, kept advisory.
- Novelty (lane B): the empty cell. S3AP (2509.00559) is the closest social WM and is LLM-parsed and
  dialogue-scored; no surveyed work predicts-and-verifies social-material state.
- Avoids the traps: it is a positive predictive claim, not a benchmark or a log pile.

### F2. The self-improvement loop (what it improves, and what it discovers)

Thesis: a coding-agent autoresearch loop improves the advisory predictor, the prompts, and the actor's
gated skills, and the result is a measurement of WHAT it actually improves about predicting
materially-grounded social consequence. Contribution = driving such a loop on an advisory
social-material predictor, which no surveyed loop does (the closest Minecraft loops improve against
their own judgment, or stay single-actor and physical).
- Risk: the loop is method, and on its own it reads as an engineering result unless tied to a claim
  about what gets learned. (That trials are scored against engine state, not a self-judge, is assumed.)

### F3. Grounded social-trajectory benchmark (measurement-first)

Thesis: a small-N reproducible benchmark of evidence-grounded social behavior in natural seeds.
- REJECTED as the headline. This is the evidence-first trap the contract forbids. The benchmark is how
  F1 is measured, not the contribution. Keep it as method, not spine.

### F4. Material consequence as the floor of social simulation (substrate/conceptual)

Thesis: social simulation is only meaningful when social state rides on verified material change;
Minecraft is the substrate that provides that floor cheaply at society scale, which dialogue sim cannot.
- Novelty (lane C): a strong conceptual point, but a position/argument, and lane B shows the
  physical-plus-social framing is already named by 2510.21219 and 2604.22748. As a sole spine it is a
  call-to-action, not a result.

### F5. From civilization claims to verified micro-societies (the anti-Sid framing)

Thesis: replace unreproduced large-society claims with small-N, falsifiable, world-verified
social-material trajectories with released deterministic scoring.
- Novelty (lane D): rhetorically sharp and reproducibility-strong, but defined by contrast to Sid; the
  positive contribution still has to be F1 (the predictor) or it collapses back into evidence-first.

## Recommendation: F1 as the spine, with F2 as the method and F4 as the setting

Pick F1 (the advisory social-material world model, predict-and-verify), carried by F2 (the
verifier-grounded loop) and set in F4 (Minecraft as the material substrate), with F5 as the framing
posture and F3 demoted to method.

Why this is the best single spine:

1. It is the unoccupied cell (lane B). F1 is the one claim no prior work makes: predict-and-VERIFY
   social-material deltas, advisory, embodied. Each ingredient is crowded; the predictor over verified
   social-material state is not.
2. It is a positive contribution, not infrastructure. The headline is a predictor and a new measurement
   (per-transition social-material prediction accuracy), which no surveyed paper reports. Reading engine
   state, the logs, and the benchmark are how the claim is measured, not the claim.
3. It subsumes the others honestly. F2 is HOW you improve the predictor; F4 is WHY Minecraft (the
   material floor); F5 is the posture (small-N vs Sid's unreproduced scale); F3 is the measurement
   apparatus. None of these is strong enough alone, and F1 makes each one a supporting part rather than
   the headline.
4. It is falsifiable and bounded. The advisory rule and the 4-layer hierarchy give a clean failure
   mode: prediction accuracy is reported separately from acting; Physical/Material is where the claim
   is provable today; Social is the unproven contribution surface; Institutional is out of scope.
5. It dodges every named trap: not evidence-first (F3 demoted), not structured-state-as-novelty
   (structure is how the predictor represents o', not the point), not a Sid-style scale claim (F5
   posture), not a copy of Voyager/Sid/Generative Agents as a product spec (those are mechanisms cited,
   not shapes copied).

One-line spine: "An advisory, structured social-material world model predicts the physical, material,
and social consequences of actions in an embodied Minecraft world, and a coding-agent loop improves it."

## What the paper claims, and what it does NOT

- Claims: per-transition prediction accuracy of social-material deltas against a deterministic verifier,
  reported separately from acting; that a verifier-grounded loop improves it where a self-judged loop
  launders progress; all on small-N reproducible trajectories with released deterministic scoring.
- Does NOT claim: human-society fidelity, civilization-scale emergence, an LLM judge's score as ground
  truth, real-world physical transfer, or that the world model may act or override the verifier.
