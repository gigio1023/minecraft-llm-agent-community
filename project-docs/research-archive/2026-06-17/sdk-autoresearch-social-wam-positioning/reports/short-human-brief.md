# Short human brief: how to position this project, and what not to claim

Date: 2026-06-17. One-screen decision brief. Backing: `final-positioning-report.md` and the four lane
syntheses. ASCII punctuation only.

## The decision in three sentences

Position the project on ONE cell no prior work occupies: an advisory, structured world model that
predicts the physical, material, and social consequences of actions in an embodied Minecraft world, and
the measurement of whether embodied LLM actors actually sustain obligation, trust, repair, and
continuation that such a model can predict. The three things that sound like rival directions
(autoresearch, WAM-based research, LLM mineflayer code generation) are not rivals: the WAM is the
OBJECT, the autoresearch loop is the METHOD that improves it, and code generation is part of the
SUBSTRATE the actor uses. Keep the world model advisory: it predicts and proposes, it does not act, fill
arguments, or mark progress. (Scoring against engine state rather than a self-judge is assumed; it is
how Minecraft works, not the point.)

## The strongest recommended direction

Predict-and-measure. Build the predictor p(o' | o, l) for the physical-material-social delta of an
action (possession, claim, obligation, trust), and report PREDICTION accuracy separately from ACTING
outcome. That per-transition social-material prediction-accuracy measurement is one no surveyed paper
reports. The loop, the benchmark, and reading engine state to check a prediction are how you improve and
measure it, not the headline.

Why this is defensible (and not overclaimed): the 4-way intersection is empty across 560+ old sources
and 10 new 2025-2026 works, but every single axis is crowded and two position papers already name the
physical-plus-social frontier. So the novelty is the INTERSECTION under the verifier-owns-truth rule,
never any one axis.

## What to build next (order)

0. Substrate fix first. The 2026-06-04 run looped (the actor never varied actions, never authored a
   skill, never used PlanBeads). Fix that before any WAM work.
1. Freeze a transition-row schema and a post-run logger over artifacts the runtime already emits;
   stand up the deterministic scoring script, seed ledger, and held-out-scenario discipline (mostly
   provider-free).
2. Measure a zero-shot prompt-based WAM's per-transition prediction accuracy on verified
   Physical/Material deltas (under the existing quota guard).
3. First social benchmark borrowed_tool_v1 (request, lend or refuse, use, return or debt or repair)
   with typed-delta + ledger scoring.
4. Wire the SDK loop at Physical/Material only (Claude Agent SDK or Codex headless, verifier as the
   metric, verifier isolated from the agent), then climb to Social with two actors.

## What NOT to claim

- Not "we log everything, therefore research." Evidence, logs, ledgers, seeds, scoring scripts are
  support and audit surface, not the contribution.
- Not "structured state" as the novelty (an implementation detail).
- Not human-society fidelity, civilization-scale emergence, or an LLM judge's score as ground truth.
- Not real-world physical transfer or pixel-perception realism (those are robotics' claims).
- Not a copy of Voyager, MineStudio, Project Sid, or Generative Agents as a product spec. Borrow
  mechanisms, not shapes.

## The cautionary anchor

Project Sid, re-verified 2026-06-17, ships a report PDF, README, image, and video, and nothing
runnable: 0/5 on the Papers-with-Code code bar, every metric unreproduced. It is the nearest neighbor
(embodied many-agent society) AND the clearest warning. The project's inverse posture (small-N,
world-verified, deterministic scoring released) is a strong reproducibility position, but that strength
is hygiene, not the contribution.

## Bottom line

The repo already owns the cheap measurement substrate: it reads Physical and Material transitions from
engine state at near-$0 and logs them. That is assumed plumbing. The missing object and the defensible
contribution is the advisory social-material WAM and the question of whether sustained,
materially-grounded social behavior can be predicted at all. Keep it advisory, structured, and small-N,
and the niche is genuinely open.
