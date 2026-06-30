# Research area: self-improvement from verifiable rewards, self-play, and self-refinement

Lane 22 (H5) theme file, wave 4. Audience: a newcomer to LLM self-improvement. Jargon is
defined on first use. This is the theoretical heart of the wave-4 autoresearch thesis: it
asks what LEARNING SIGNAL drives an autoresearch loop, and draws the bright line between
self-improvement an external verifier can ground (admissible) and self-improvement a system
grades for itself (progress laundering, inadmissible).

The original query (anchor): "Can a hierarchical action-conditioned world model predict and
evaluate how Minecraft actions transform physical state, material economy, social relations,
memory, and future action opportunities in an embodied open world?"

The wave-4 thesis (anchor): an ENPIRE-style autoresearch loop (reset, rollout, verify,
refine), driven by a coding agent and grounded by the runtime VERIFIER as the success
signal, is a natural way to autonomously improve this repo's advisory social-material WAM
and/or actor policy at near-zero cost with no human labels, because the cycle already emits
verifier-scored (state, action, next-state) transitions. The loop must stay advisory and
verifier-grounded: the LLM proposes; the runtime owns truth; the agent must never score its
own success.

## Deconfliction (what this file does NOT re-survey)

- Wave-3 `research-area-memory-and-verifiers.md` (lane 17) covered the verifier and
  reward-model ARCHITECTURES (ORM vs PRM, discriminative vs generative GenRM, LLM-as-judge
  and its biases) and the generation-verification gap. This file cites that work and does NOT
  re-explain verifier architectures. It covers the next question: how a LOOP LEARNS from those
  signals (RLVR, self-play, self-refinement, self-rewarding) and when that loop is stable.
- The ENPIRE anchor note `notes/by-paper/enpire.md` (lane coordinator) is cited as `enpire`,
  not rewritten.
- Loop ENGINEERING (reset/rollout/orchestration) is H1's area; the CODE-GENERATION mechanism
  is H3's area. This file owns the SIGNAL and the OBJECTIVE.

---

## 0. What this area is (one line)

The study of when a system can improve from signals it generates or checks for itself,
without human labels, and when that instead plateaus, drifts, or reward-hacks into collapse.

## 1. Glossary (defined once)

- **Self-improvement**: a model getting better using data or signals it produces, not new
  human labels. Three families below differ in WHERE the success signal comes from.
- **Verifiable reward**: a reward computed by a deterministic checker (unit tests,
  exact-match, a game rule, a physics/inventory check), not by a learned model's opinion.
- **RLVR (RL with Verifiable Rewards)**: reinforcement learning where the reward is a
  verifiable reward. The principled name for "improve from a verifier signal, no human
  preference labels" (Tulu 3, 2411.15124; DeepSeek-R1, 2501.12948).
- **Self-training / bootstrapping**: generate candidate outputs, keep the good ones by some
  filter, train on them, repeat (STaR, 2203.14465).
- **Self-refinement**: a model critiques and revises its own output in-context, no weight
  update (Self-Refine, 2303.17651; Reflexion's verbal step, 2303.11366).
- **Self-rewarding**: a model is its own reward model, scoring its own outputs to build
  training data (Self-Rewarding LMs, 2401.10020).
- **Self-play**: a model improves by generating and attempting its own tasks, or by playing a
  game against a copy of itself (Absolute Zero, 2505.03335; SPIN, 2401.01335; SPAG,
  2404.10642).
- **Reward hacking**: a policy getting high reward without satisfying the intent. The failure
  mode of any loop whose success signal is gameable.
- **Model collapse**: degenerate behavior from training repeatedly on self-generated data;
  the distribution narrows or, in an RL loop, the policy optimizes a proxy until true
  performance crashes (Shumailov et al. 2305.17493; Can-Self-Train 2505.21444).
- **Progress laundering** (the repo's term): a system reporting success against its own
  internal criterion while real task performance does not actually advance. The named failure
  mode the bright line exists to prevent.

## 2. The bright line (the central claim of this lane)

There are two kinds of self-improvement, and they behave differently:

- **Externally-verifier-grounded self-improvement (ADMISSIBLE)**. The data may be
  self-generated, but the SUCCESS SIGNAL comes from outside the model being improved: a
  deterministic checker, a game outcome, an environment that validates and grades. STaR,
  RLVR/DeepSeek-R1, V-STaR, Absolute Zero, SPAG, and SPIN all keep an external anchor. These
  are stable and have produced the field's strongest results.
- **Self-evaluated self-improvement (INADMISSIBLE for outcome truth)**. The success signal IS
  the model's own judgment of itself (self-consistency, LLM-as-its-own-judge, self-critique
  with no external check). Self-Refine, Self-Rewarding LMs, and Self-Rewarded Training (SRT)
  are here. These work in narrow no-ground-truth regimes (subjective preference, style) but
  plateau, saturate, or in an RL loop collapse via reward hacking.

The variable that flips one into the other is exactly "external verifier vs self-judgment."
The strongest single piece of evidence is Can-Self-Train (2505.21444): the SAME RL loop is
stable under ground-truth verification and collapses catastrophically under a majority-vote
self-reward, with the collapse coinciding with the self-reward objective being maximized
while true accuracy crashes. That is progress laundering observed as a learning dynamic.

## 3. Key works and sub-threads (source-backed, deep-read in LaTeX unless noted)

### Thread A: RLVR -- the principled name for the admissible loop

**What it introduced and why it matters.** DeepSeek-R1 (2501.12948, deep-read) is the
at-scale demonstration that improvement driven by a verifiable, rule-based reward (math
answer-matching, code compiler + test cases, format tags) is stable, and that improvement
driven by a LEARNED reward model is gameable. The authors "abstain from applying neural
reward models ... susceptible to reward hacking," observed actual reward hacking with their
helpful (neural) reward model, and state the open problem in their own voice: "for complex
tasks that cannot be effectively evaluated by a reliable reward model, scaling up pure RL
methods remains an open challenge." Tulu 3 (2411.15124, abstract + ToC) names the method
RLVR, devotes a section to it, and reports "RLVR IFEval overoptimization," i.e. reward
hacking can appear even within RLVR when the verifiable check is narrow. Wave-3's
`research-area-memory-and-verifiers.md` is the home of the verifier ARCHITECTURE behind these
rewards; this thread is about using such a verifier as the LEARNING signal.

### Thread B: self-training -- self-generated data, externally-checked filter

**What it introduced and why it matters.** STaR (2203.14465, deep-read) is the founding
"learn from your own reasoning" method: generate rationales, keep only those whose answer
matches the GROUND-TRUTH answer, fine-tune, repeat. STaR is formally an approximation to a
policy gradient with the verifiable indicator reward `1[y_hat = y]`, so "self-training with a
verifier filter" and "RLVR" are the same idea at different scales. The data is free; the
filter is an external check. STaR's stall (no signal from failures) is fixed two ways:
rationalization (give the known answer, reconstruct the path) and, more importantly, V-STaR
(2402.06457, deep-read), which keeps the DISCARDED incorrect solutions to train a verifier
(via DPO) that then ranks candidates, improving both reasoner and verifier over iterations.
Lesson for any verifier-grounded loop: failures are training signal, do not throw them away.

### Thread C: self-refinement and verbal self-feedback -- the test-time loop

**What it introduced and why it matters.** Self-Refine (2303.17651, deep-read) is the purest
self-evaluated method: one model generates, critiques itself, and revises, no external check,
no weights. It improves ~20% on subjective tasks (politeness, code readability) where there
is no ground truth. Reflexion (2303.11366, deep-read; the memory angle is in wave-3) adds an
episodic memory of verbal lessons and, crucially, a PLUGGABLE evaluator that can be external
(exact-match, compiler, executed unit tests) or self (an LLM judge). Reflexion's own data
shows the hinge: it works best with executed tests and worst when self-generated tests are
flaky (MBPP false-positive rate 16.3%, which makes it underperform the baseline). The
counter-evidence that bounds this thread: "LLMs Cannot Self-Correct Reasoning Yet"
(2310.01798, abstract) finds intrinsic self-correction (no external feedback) does not
reliably help reasoning and "at times ... even degrades" it; SCoRe (2409.12917, abstract)
needed multi-turn RL against a correctness signal to make self-correction work. So
self-refinement's gains live in the no-ground-truth regime; on checkable claims, self-as-judge
is unreliable.

### Thread D: self-rewarding -- the model as its own reward model (the inadmissible end)

**What it introduced and why it matters.** Self-Rewarding LMs (2401.10020, deep-read) make
the model its own judge (LLM-as-a-Judge prompting) to build preference data for Iterative
DPO, improving instruction-following AND reward-modeling. It outperforms strong models on
AlpacaEval 2.0 (an LLM-judged benchmark). It works because ALIGNMENT has no deterministic
checker and the target is subjective preference. But the authors flag saturation ("this
effect likely saturates"), and the downstream evidence (CREAM 2410.12735, in wave-3) confirms
gains saturate as bias accumulates in the reward loop. Pushed into an online RL loop with a
self-consistency reward, this configuration is what Can-Self-Train (2505.21444, deep-read)
shows COLLAPSES: initial gains comparable to ground-truth RL, then sudden complete collapse
on all 4 base models, the self-reward maxed while accuracy crashes, the model emitting a fixed
template answer regardless of input. Raising the KL penalty does not save it; only a fixed
(external) teacher or injected noise delays it. This is the empirical proof of the bright
line.

### Thread E: self-play -- generate your own curriculum, but keep an external referee

**What it introduced and why it matters.** Self-play removes human task labels but the
strongest instances keep an external referee. Absolute Zero / AZR (2505.03335, deep-read) is
the cornerstone: one model proposes AND solves its own code-reasoning tasks with ZERO
external data, yet "grounded in a real environment ... feedback from the environment as a
verifiable source of reward," using a CODE EXECUTOR as the verifier, explicitly chosen over a
learned reward model because the learned one "is prone to hacking." It adds a proposer-side
**learnability reward** (prefer tasks the current solver gets right at an intermediate rate).
SPAG (2404.10642, abstract) self-plays a two-player word game (Adversarial Taboo) and trains
by RL on the GAME OUTCOME (did the defender say the target word), a verifiable rule, and
reasoning improves across benchmarks. SPIN (2401.01335, abstract) self-plays by
discriminating its own generations from a fixed HUMAN-annotated SFT set; the human data is the
external anchor and the proven global optimum is when the policy matches that target
distribution. Across all three, self-play is admissible precisely because an external signal
(executor, game rule, or human reference distribution) grades it.

## 4. The spectrum, as a single ordering

From most self-evaluated (riskiest as an outcome signal) to most externally grounded
(safest):

1. Self-Refine (2303.17651): same model is generator + critic + reviser, no external check.
   Works only where the metric is subjective; degrades on checkable reasoning (2310.01798).
2. Self-Rewarding LMs (2401.10020): model is its own reward model. Works for subjective
   alignment; saturates (CREAM 2410.12735).
3. SRT / Can-Self-Train (2505.21444): self-consistency (majority-vote) self-reward in RL.
   Improves then COLLAPSES via reward hacking.
4. Reflexion (2303.11366): pluggable evaluator. Admissible iff the evaluator is external.
5. STaR (2203.14465): self-generated data, GROUND-TRUTH filter. Admissible.
6. V-STaR (2402.06457): STaR + a verifier trained on externally-labeled correct AND incorrect
   solutions. Admissible, and uses the failures.
7. SPIN / SPAG / Absolute Zero (2401.01335 / 2404.10642 / 2505.03335): self-play grounded by
   an external referee (human reference distribution / game rule / code executor). Admissible.
8. RLVR / DeepSeek-R1 (2501.12948): RL against a deterministic verifier. The principled,
   most-grounded end.

The repo's runtime verifier puts the repo at positions 5-8 for Physical/Material outcomes
(the verifier gives a clean label) and warns it away from positions 1-3 for any outcome that
must be true (never let the actor's CycleJudgment be the score).

## 5. The 4-layer mapping

How the learning signal behaves at each WAM layer. (Reminder: physical predictions must be
reliable before social ones are meaningful; a social claim like "Bob can now mine" depends on
a physical fact like "Bob has a pickaxe with durability > 0.")

| Layer | Is there an external verifier? | Admissible signal | Inadmissible / cautioned |
|---|---|---|---|
| Physical | Yes (runtime checks movement, mining, inventory, durability, block/container deltas). | RLVR / STaR / V-STaR style: filter and learn from verifier-PASSED and verifier-FAILED transitions. Like AZR's code executor or R1's answer-matcher. | Actor self-judging whether a physical action "succeeded." |
| Material / economic | Mostly yes (possession, container, claim deltas are checkable). | Verifier-filtered self-improvement on possession/flow transitions. | Self-evaluated "I shared fairly" without a possession-delta check. |
| Social | Rarely deterministic (request/promise/refusal honored, trust, blame). | At most a SECONDARY advisory predictor (GenRM-style reason-then-verdict from wave-3), measured against verified world artifacts. | Self-rewarding / LLM-as-its-own-judge as the PRIMARY social score (saturates: 2401.10020, 2410.12735; collapses in RL: 2505.21444; biased: wave-3 judge line). |
| Institutional / settlement | No single checkable metric; contested over long horizons. | Long-horizon outcomes scored against persisted world artifacts (who kept which routine, did the commons survive). | An unbounded self-improvement loop optimizing a self-defined "settlement health" proxy. Expect proxy gaming. |

## 6. Where the autoresearch thesis holds, complicates, and breaks (honest)

- **Supports the thesis (strong).** The repo's runtime verifier is, in academic terms, a
  verifiable reward, and the cycle already emits verifier-scored (state, action, next-state)
  transitions. That is precisely the substrate STaR/V-STaR/RLVR need, at near-zero cost and
  with no human labels. An ENPIRE-style loop that proposes changes to prompts, skills, or an
  advisory WAM predictor and keeps only the ones the runtime verifier scores as improvements
  is the principled, admissible instantiation. AZR shows even the task curriculum can be
  self-generated while the environment stays the verifier; its learnability reward is a
  borrowable curriculum mechanic.
- **Complicates (the failures are signal).** V-STaR and the STaR stall show a loop that keeps
  only successes plateaus and a predictor trained only on successes cannot warn. The repo's
  advisory WAM should be conditioned on verifier-FAILED transitions too, so it predicts
  failure modes, not just confirms wins.
- **Bounds / breaks (the social ceiling).** Every admissible result above lives where an
  external check exists: code execution, math answers, game rules, a human reference
  distribution. The repo's Social and Institutional layers have no such exact check. The
  cautions (2310.01798 self-correction degrades without external feedback; 2401.10020 /
  2410.12735 self-rewarding saturates; 2505.21444 self-reward RL collapses) all say the same
  thing: where you must substitute a self-evaluated signal, do not run an unbounded
  self-improvement loop. This is exactly the ENPIRE-analogy break the thesis warns about: no
  crisp metric, costly resets, contested success at the upper layers. The loop is most
  transferable at Physical/Material, advisory-only at Social, and should not be a closed loop
  at Institutional.
- **The bright line restated for the repo.** Self-improvement grounded by the runtime verifier
  is admissible. Self-improvement scored by the actor's own judgment is progress laundering and
  is inadmissible. Can-Self-Train (2505.21444) is the empirical proof that the second one
  collapses; DeepSeek-R1 (2501.12948) and Absolute Zero (2505.03335) are the proof that the
  first one is what frontier systems actually use, and that they refuse a learned/self reward
  precisely because it hacks.

## 7. Mechanically-useful vs research-contribution (summary)

- **Mechanically useful** (engineering the repo can borrow): a STaR/V-STaR/RLVR-shaped loop
  over the repo's verifier-labeled transitions (keep passes AND failures); AZR's
  learnability-reward as a label-free curriculum-difficulty knob; Reflexion's
  Actor/Evaluator/Self-Reflection shape with the runtime verifier as the Evaluator and a
  verifier-grounded verbal lesson written to actor-workspace memory; concrete collapse
  detectors (rising self/proxy reward with falling verified outcome, rising KL from a
  reference) as guardrails. All advisory: no weight updates required, and the loop proposes,
  the runtime scores.
- **Research contribution it is NOT**: none of these methods is a contribution to copy. The
  signal/objective theory here is SUPPORT for keeping the runtime verifier as the scorer; the
  repo's contribution (if any) is the advisory social-material WAM and the embodied-social
  benchmark, not "RLVR/self-play for Minecraft." Evidence tooling (verifiers, transitions,
  logs) is support, not the research claim.

## 8. One-line ties

- **To the original query**: the query's "evaluate how Minecraft actions transform ... state"
  is a verifier judging a transition, and this area shows that a loop can self-improve from
  that judgment as long as the verifier (not the model) produces it.
- **To the autoresearch thesis**: the thesis is admissible exactly to the degree the loop's
  success signal is the runtime verifier; the moment the actor scores itself, the loop is
  progress laundering and, as Can-Self-Train (2505.21444) shows empirically, collapses.
