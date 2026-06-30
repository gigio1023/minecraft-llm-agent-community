# Research area: the LLM as a world model, and reasoning-as-planning

What this area is (one line for a newcomer): instead of training a separate dynamics model, use a pretrained
LLM as the predictor of how the world changes, `p(o'|o,a)`, and run a planning or search algorithm on top of
those predictions. The LLM proposes actions, imagines (predicts) their consequences with its own internal
knowledge, scores the imagined outcomes, and acts on the best one.

Why this lane exists for the repo: the repo's CHEAPEST first predictor is prompt-based, an LLM asked to emit
the next structured state. This lane asks the load-bearing question directly: can a prompt-based LLM serve as
an ADVISORY dynamics model `p(o'|o,l)` over typed Minecraft and social state, what are its failure modes, and
how does the deterministic verifier catch them? It surveys reasoning-as-planning, LLM-as-simulator at
inference, search-over-an-LLM-world-model, and the limits (when the predicted dynamics are wrong,
hallucinated, or myopic).

Companions (cite, do not duplicate):
- `research-area-autonomous-experimentation-and-world-model-discovery.md` already owns the LLM world models
  that SELF-IMPROVE from collected data (WebEvolver `2504.21024`, WorldLLM `2506.06725`, WMA `2410.13232`,
  R-WoM `2510.11892`, RWML `2602.05842`, From Word to World `2512.18832`). This file does NOT re-derive those.
  It owns the INFERENCE-TIME use of an LLM as a world model (predict, search, act now), and the reasoning-as-
  planning genealogy (RAP, ToT, LATS, LLM-MCTS, WebDreamer, DEPS, WALL-E).
- `wam-foundations.md` owns the formal WAM `p(o',a|o,l)` definitions and the FFDC WAM-as-evaluator framing.
- `wam-generative-video-and-the-world-model-debate.md` owns the pixels-vs-latents debate; this file is its
  symbolic-text-state counterpart (the LLM predicts the next STATE in language, not pixels).
- `research-area-theory-of-mind-and-agent-modeling.md` owns ToM in depth; this file uses only the LAW paper's
  level-1-agent-model framing to bridge the LLM-world-model line to the repo's Social layer.

Jargon defined on first use. Repo terms (advisory WAM, verifier, progress laundering, material claim, weak
commons, typed delta) are in the shared contract and `<repo>/SPEC.md`.

---

## Glossary (defined once)

- LLM as world model: prompt one LLM to predict the next state given the current state and an action,
  `p(s'|s,a,prompt)`. The same model is often ALSO the action proposer and the scorer, which is the central
  risk this lane flags.
- Reasoning-as-planning: treat a chain of reasoning as a sequence of (state, action) steps in a Markov
  decision process, so a planning/search algorithm (tree search) can explore alternatives instead of
  generating one left-to-right chain.
- Internal vs grounded rollout: an INTERNAL rollout is simulated entirely by the LLM with no environment
  contact (RAP, ToT); a GROUNDED rollout checks each step against real feedback (LATS via environment,
  WALL-E and the repo via a verifier). Internal rollouts compound error silently; grounded ones do not.
- Model-based planning / MPC: simulate candidate actions over a horizon H, score the simulated outcomes, and
  execute the highest-scoring action's first step (WebDreamer, WALL-E).
- Progress laundering (repo term): the proposer also being the scorer, so the system can declare success it
  did not achieve. ToT (LLM grades its own thoughts) is the archetype this lane warns against.
- Action-proposal hallucination: during simulation the LLM imagines an action that its OWN predicted state
  does not actually support (WebDreamer's named failure).

---

## Part A: reasoning-as-planning with an internal LLM world model

Central question: can an LLM plan better by simulating consequences with its own internal world model?

### A.1 The cornerstone: RAP

RAP (`2305.14992`, Hao et al., EMNLP 2023, LaTeX deep-read; see `notes/by-paper/2305.14992-...`) is the
canonical statement. ONE LLM is repurposed as both the reasoning agent (proposes `a_t ~ p(a|s_t,c)`) and the
world model (predicts `p(s_{t+1}|s_t,a_t,c')`), and MCTS searches the resulting reasoning tree. State and
action are instantiated per task (block configuration / block move; intermediate variable values /
subquestion; a fact / a deduction rule), so it is a structured-state, not pixel, world model. The whole
rollout is INTERNAL ("simulated by the LLM itself ... without interacting with the external real
environment"). Rewards include action log-prob, state confidence (self-consistency over sampled states),
self-evaluation ("Is this reasoning step correct?" -> P(Yes)), and task heuristics. Numbers: Blocksworld 64%
average success on LLaMA-33B and +33% relative over GPT-4-CoT; GSM8k 48.8%; PrOntoQA 94.2% answer / 78.8%
proof. The honest reading: RAP shows internal-WM-guided search raises TASK accuracy; it never measures
whether the individual predicted states are correct, and its scorer is the same LLM, so it is also the
clearest instance of the proposer-equals-scorer pattern.

### A.2 The search scaffolding: Tree of Thoughts

ToT (`2305.10601`, Yao et al., NeurIPS 2023, LaTeX deep-read) generalizes Chain-of-Thought into a tree where
each node is a partial-solution state and the LLM SELF-EVALUATES the promise of each state (its four choices:
decompose, generate, evaluate, search via BFS/DFS). The key distinction for this lane: ToT does NOT predict
environment dynamics, it self-grades partial solutions. Game of 24 jumps from 4% (GPT-4 CoT) to 74%. ToT is
the purest progress-laundering structure (LLM proposes and grades with no external check); it works only
because closed puzzles have a checkable final answer. For the repo it is the clearest negative example: keep
the search, move the evaluator out of the LLM and into the verifier.

### A.3 The grounding correction: LATS

LATS (`2310.04406`, Zhou et al., ICML 2024, LaTeX deep-read) is the most important counter-move in this lane.
It runs MCTS over ReAct steps but DELIBERATELY drops the internal world model: "While standard MCTS and RAP
rely on internal dynamics models to facilitate simulation, LATS uses environment interaction and does not
require a world model." Its stated reason is the lane's thesis in one sentence: reasoning-only methods "rely
solely on the internal representations of the LM and cannot consider external observations. This dependency
risks fact hallucination and error propagation while setting a performance ceiling," and "RAP ... is
constrained to tasks where the LM can become a world model and accurately predict states." It scores AFTER
feedback (unlike ToT), and adds Reflexion-style memory. HumanEval 92.7-94.4% pass@1 (GPT-4); WebShop 75.9
(GPT-3.5). LATS is independent, frontier-quality evidence that the LLM internal world model has a ceiling and
external grounding fixes it. (Caveat: LATS resets state by replaying text, which works for reversible text
tasks; the repo can reset physical/material state by scenario reload but not social history.)

---

## Part B: the LLM as a simulator of an environment (predict, then act now)

Central question: can an LLM stand in for a learned simulator of a real environment at inference, predicting
the next state of a web page / household / game well enough to choose the next action?

### B.1 The most on-target precedent: WebDreamer

WebDreamer (`2411.06559`, Gu et al., COLM 2025, LaTeX deep-read) is the closest published analog of the
repo's advisory WAM. It uses an LLM as both a simulation function `sim(o,a)` (predicts the next state as a
natural-language description) and a scoring function `score(tau)` (a 3-scale progress judgment: complete 1.0,
on track 0.5, incorrect 0), and runs MPC: `a* = argmax_a score(sim(o,a))` over horizon H. Its motivating
thesis: "LLMs have implicitly acquired both structural knowledge of websites and common sense needed to
predict the outcomes of proposed actions." It chose model-based (imagine, do not act) over tree search
because live websites have irreversible actions, the same safety argument the repo makes for a never-acting
advisory predictor. Numbers: VWA +34.1% relative over reactive (and 4-5x more efficient than tree search),
Online-Mind2Web +42.3%, Mind2Web-Live +23.8%; a fine-tuned Dreamer-7B adds +4.7% absolute on VWA. The
ablation is the lane's key evidence: replacing simulation with direct action reranking gives only a small
gain, so the predicted DYNAMICS (not a better ranker) carry the improvement. Named failures: action-proposal
hallucination (imagining unavailable actions) and error accumulation over the horizon.

### B.2 The decision rule: LLM-MCTS and the MDL principle

LLM-MCTS (`2305.14078`, Zhao, Lee, Hsu, NeurIPS 2023, LaTeX deep-read) gives the principled answer to WHEN to
use the LLM as a world model versus as a policy. It names the two roles (L-Policy = act on the LLM's chosen
action; L-Model = use the LLM as a commonsense world model) and uses BOTH: the LLM provides a commonsense
prior belief over states (the world model), MCTS samples from it, and the LLM-policy is only a search
heuristic, never committed to. Its minimum-description-length (MDL) argument: "if the description length of
the world model is substantially smaller than that of the policy, using LLM as a world model for model-based
planning is likely better than using LLM solely as a policy." For the repo this is the decision rule for the
advisory-WAM framing: at Physical/Material the transition rules are short, compact hypotheses, so MDL favors
the world-model use; at Social the dynamics are not obviously more compact than a policy, so MDL does not
clearly favor it (an honest upward boundary).

---

## Part C: Minecraft LLM planning that uses an implicit world model

Central question: in Minecraft specifically, how does an LLM's implicit world model (its plan's preconditions)
behave, and what keeps it honest?

### C.1 DEPS: describe, explain, plan, select

DEPS (`2302.01560`, Wang et al., NeurIPS 2023, LaTeX deep-read) is the Minecraft case. The LLM plans
sub-goals; on failure a DESCRIPTOR summarizes the actual world state, the LLM as EXPLAINER reasons about why
its implicit model was wrong (e.g. "iron ore needs a stone pickaxe"), the LLM re-plans, and a learned
SELECTOR ranks parallel sub-goals by predicted proximity. The dynamics live inside the LLM's planning prior
(precondition structure); the descriptor is the structured-state grounding channel (the LLM never sees
pixels). First zero-shot agent to do 70+ Minecraft tasks, nearly doubling performance, first to do
ObtainDiamond via planning, 50%+ relative over prior LLM planners. The lane point: an LLM's predicted
dynamics are wrong often enough that an explicit failure-feedback-and-explain loop is needed even at the
Physical/Material layer, which is direct evidence for the repo that a prompt-based WAM will mispredict and
needs the verifier.

### C.2 WALL-E: detect the misprediction, patch it with rules

WALL-E (`2410.07484`, Zhou et al., 2024, LaTeX deep-read) is the highest-value failure-detection cornerstone
and the operational template for the repo's verifier loop. It asks "Can LLMs directly serve as powerful world
models for model-based agents?" and answers: not alone, the LLM's predicted dynamics are misaligned, but a
gradient-free rule-learning loop bridges the gap. Each iteration: compare predicted vs actual trajectories,
have the LLM induce/refine natural-language rules for the transitions it got wrong, translate them to code,
and PRUNE via maximum set cover so only rules COMPLEMENTARY to the LLM (covering its mispredictions) survive.
It compares on the binary action_result per transition ("a reliable basis for identifying discrepancies").
Minecraft +15-30% success with 8-20 fewer replanning rounds and 60-80% of tokens; ALFWorld 95% after 6
iterations. This is the repo's verifier thesis in operational form: the deterministic verifier supplies the
"true delta" for free and per-step, so the repo can run WALL-E's mismatch loop at near-$0.

---

## Part D: the limits (when the predicted dynamics are wrong, and how it is detected)

Central question: how do LLM-as-world-model systems fail, and what catches the failure?

Four failure modes, each source-backed:
- Self-scoring / progress laundering: ToT's self-evaluated search and Reflexion's self-reflection have no
  external check. Reflexion (`2303.11366`, Shinn et al., NeurIPS 2023, deep-read) states it plainly: it relies
  on "the LLM's self-evaluation capabilities (or heuristics)" and has "no formal guarantee for success." The
  detector is an EXTERNAL grounding signal (LATS's environment feedback, WALL-E's and the repo's verifier).
- Action-proposal hallucination: WebDreamer's named failure, the LLM imagines actions its predicted state
  does not support. The detector is checking the predicted next-state against the real one per step.
- Compounding error over horizons: WebDreamer's "error accumulation," LATS's "error propagation," V-JEPA-2's
  and R-WoM's long-rollout degradation. The detector is per-step grounding (do not roll forward ungrounded).
- Step-wise myopia: FLARE (`2601.22311`, 2026, abstract-only, claim-only) argues step-wise reasoning is a
  "step-wise greedy policy" causing "early myopic commitments that are systematically amplified over time,"
  studied in "deterministic, fully structured environments with explicit state transitions and evaluation
  signals" (the repo's exact setting). The detector is harder: a well-calibrated one-step predictor can still
  mislead a long-horizon plan if its scores are consumed greedily, so calibration over horizons (the
  directions report's sharpening-ceiling point) matters, not just one-step accuracy.

The unifying lesson: every robust system in this lane either (a) keeps a checkable final answer (closed
puzzles), or (b) grounds each step against an external signal. The repo has the strongest version of (b): a
deterministic verifier that auto-labels the true typed delta per transition at near-$0. So the repo can adopt
the useful half of this lane (LLM proposes and predicts) while structurally removing its central weakness
(LLM grades itself), because the verifier, not the LLM, owns the score.

---

## Tie to the project and 4-layer admissibility

The conceptual bridge is the LAW (`2312.05230`, Hu and Shu, 2023, deep-read), written by the RAP authors. It
puts the LLM-world-model line on the repo's exact axis: the world model `p(s'|s,a)` is physical/material
dynamics; the level-1 agent model (theory of mind, beliefs about other agents' goals and beliefs) is the
Social layer; and it states the repo's dependency verbatim, that social reasoning must "combine social
commonsense (via level-1 agent models) and physical commonsense (via world models)." Its social claims are
explicit hypotheses ("we hypothesize"), so it is the citation for WHY a structured social WAM is worth
building, not evidence one works.

| Layer | LLM-as-WM at inference (A,B,C) | How the verifier catches its failure (D) | Admissibility |
| --- | --- | --- | --- |
| Physical (movement, blocks) | Strongest fit: RAP/WebDreamer predict next state, DEPS/WALL-E in Minecraft. MDL favors the WM use (compact rules). | Predicted block/position delta is checked against the runtime snapshot per step; WALL-E's action_result is the template. | Admissible NOW as advisory: LLM proposes and predicts, verifier scores. |
| Material / economic (possession, claims, obligation) | Transition rules (lending moves possession and creates an obligation) are compact, MDL-favored; RAP-style typed-state prediction transposes. | Verifier confirms the possession move / obligation creation; a mispredicted claim change is a measurable per-step error (not silent). | Admissible as advisory once Physical verifies; the repo's contribution surface. |
| Social (relationships, trust, beliefs) | The LAW's level-1 agent model is the target; no surveyed system grounds it. WebDreamer never simulates a partner's reaction; RAP never models another agent. | Trust/belief are ledger values updated only from verified events; the WAM may PREDICT a social delta but the verifier-driven ledger, not the LLM, sets it. | Advisory-only and unproven; MDL stops favoring the WM framing here; FLARE's myopia and Reflexion's no-guarantee apply hardest. |
| Institutional / settlement (norms, routines) | Long-horizon LLM rollouts compound error (WebDreamer, LATS) and go myopic (FLARE). Least mature. | Per-step grounding limits compounding; but long-horizon calibration is the open problem, not solved by one-step verification. | Weakest; the WAM can offer hypotheses, never authority; sharpening-ceiling caution dominates. |

Dependency reminder (shared contract): physical predictions must be reliable before social ones are
meaningful. Every system in this lane is proven on physical/factored/text-puzzle state; the social and
institutional transport is the repo's contribution, not a citable result.

---

## What I could not verify

- No surveyed system predicts TYPED social-material state (possession, claims, obligations, trust) with an
  LLM and scores it against a deterministic verifier. The literature stops at physical/web/household state and
  at LLM-self-scored or environment-interaction grounding. That gap is the repo's surface, not a result I can
  cite.
- RAP, ToT, LATS, WebDreamer, DEPS, WALL-E report TASK-level accuracy/success; none reports per-step
  predicted-state accuracy against a ground-truth transition (the metric the repo's verifier would produce).
  So "the LLM is a good world model" is, in every case, inferred from downstream task gains, not measured at
  the transition level. The repo would be measuring something these papers do not.
- The MDL principle (LLM-MCTS) is a theoretical-analysis argument plus empirical support, not a proof; whether
  a social-transition world model really has a shorter description length than a social policy is untested.
- FLARE (`2601.22311`) is abstract-only here; its mechanism (step-wise myopia) is well-posed and consistent
  with LATS and WebDreamer, but its quantitative claims (LLaMA-8B+FLARE beating GPT-4o) are claim-only.
- The LAW's social/level-1 claims are explicit hypotheses; there is no measured social-WAM result to cite.
- I did not run any model; all "predicted dynamics are wrong" statements are quoted from the sources
  (WebDreamer hallucination, WALL-E misalignment, LATS ceiling), not independently reproduced.

---

## One-sentence tie to the thesis

A prompt-based LLM is a viable ADVISORY social-material world model at the Physical and Material layers,
because the reasoning-as-planning line (RAP, LLM-MCTS, WebDreamer, DEPS, WALL-E) shows an LLM can predict
structured next-states usefully, but its predicted dynamics hallucinate, compound error, and go myopic
(WebDreamer, LATS, FLARE) and its self-evaluation has no guarantee (ToT, Reflexion); the repo's deterministic
verifier is exactly the external, per-step, near-$0 grounding signal that turns the unsafe "LLM grades itself"
pattern into the admissible "LLM proposes and predicts, verifier scores" pattern, with the Social and
Institutional layers remaining the unproven contribution surface.
