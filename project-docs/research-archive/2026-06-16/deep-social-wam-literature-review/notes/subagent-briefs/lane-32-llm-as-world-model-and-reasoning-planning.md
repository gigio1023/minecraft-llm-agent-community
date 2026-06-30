# Lane 32 brief: the LLM as a world model, and reasoning-as-planning

Scope: whether and how a prompt-based LLM can serve as an ADVISORY dynamics model `p(o'|o,l)` for the repo,
covering reasoning-as-planning, LLM-as-simulator at inference, search-over-an-LLM-world-model, and the limits
(wrong/hallucinated/myopic predicted dynamics and how they are detected). Distinct from the neighbor file
`research-area-autonomous-experimentation-and-world-model-discovery.md`, which owns the SELF-IMPROVING LLM
world models (WebEvolver, WorldLLM, WMA, R-WoM, RWML); this lane owns the inference-time use and the
reasoning-as-planning genealogy.

## Sources reviewed (count + list)

Deep-read (LaTeX, full mechanism + numbers): 8

New lane-32 by-paper notes (6):
- 2305.14992 RAP (Reasoning via Planning) - EMNLP 2023
- 2305.10601 Tree of Thoughts - NeurIPS 2023
- 2310.04406 LATS (Language Agent Tree Search) - ICML 2024
- 2411.06559 WebDreamer (Is Your LLM Secretly a World Model of the Internet) - COLM 2025
- 2305.14078 LLM-MCTS (LLMs as Commonsense Knowledge for Task Planning) - NeurIPS 2023
- 2302.01560 DEPS (Describe, Explain, Plan, Select) - NeurIPS 2023, Minecraft
- 2312.05230 The LAW (Language/Agent/World Models) - 2023, conceptual anchor

Deep-read but cited via PRE-EXISTING notes from earlier lanes (not re-noted, per extend-do-not-duplicate):
- 2410.07484 WALL-E (World Alignment by Rule Learning) - 2024, Minecraft/ALFWorld (note owned by lane 13;
  lane-32 manifest row points to `notes/by-paper/2410.07484-walle-world-alignment-rule-learning.md`)
- 2303.11366 Reflexion - NeurIPS 2023, world-model-of-self angle only (note owned by lanes 17/22/34;
  lane-32 manifest row points to `notes/by-paper/2303.11366-reflexion.md`)

Abstract-level / claim-only (id verified via hf papers info): 1 deep + breadth
- 2601.22311 FLARE / Why Reasoning Fails to Plan - 2026 (abstract-only, claim-only on numbers)

Breadth verified or surfaced via HF search (not deep-read, some already owned by neighbors): 2305.10626
(Language Models Meet World Models, embodied finetuning), 2410.03136 (Deliberate Reasoning as Structure-aware
Planning with Accurate World Model), 2405.14205 (Agent Planning with World Knowledge Model), 2412.12119
(Mastering Board Games by External and Internal Planning, DeepMind), 2301.12050 (DECKARD, Do Embodied Agents
Dream of Pixelated Sheep), 2507.23773 (SimuRA), 2304.11477 (LLM+P), 2502.13092 (Text2World), 2502.11221
(PlanGenLLMs survey), 2206.10498 (PlanBench), 2504.15785 (WALL-E 2.0). Already owned by neighbors and cited,
not re-derived: 2410.13232 WMA, 2510.11892 R-WoM, 2602.05842 RWML, 2512.18832 From Word to World.

Total brought into the manifest: 9 with notes + breadth rows.

## Strongest findings (source-backed)

1. The reasoning-as-planning line proves an LLM can predict structured next-states usefully, but ONLY raises
   task accuracy, never measures per-step prediction correctness. RAP repurposes one LLM as both action
   proposer `p(a|s,c)` and world model `p(s'|s,a,c')` with MCTS; Blocksworld 64% success and +33% relative
   over GPT-4-CoT (LLaMA-33B). The world model and scorer are the SAME LLM and the rollout is fully internal,
   so RAP is also the clearest instance of the proposer-equals-scorer (progress-laundering) pattern. The repo
   inherits the useful half (LLM predicts typed next-state) and must remove the weakness (the verifier, not
   the LLM, scores).

2. WebDreamer is the closest published analog of the repo's advisory WAM, and its ablation is the key
   evidence: an LLM as `sim(o,a)` (predict next state in language) plus `score` (3-scale progress) under MPC
   beats reactive web agents (+34.1% VWA, +42.3% Online-Mind2Web), and removing the simulation to just rerank
   actions gives only a small gain, so the predicted DYNAMICS carry the improvement. WebDreamer must use a
   second LLM call to score because the web gives no cheap ground truth; the repo's deterministic verifier
   replaces that LLM-score with a free, per-step true delta, removing WebDreamer's self-scoring weakness and
   its two named failures (action-proposal hallucination, error accumulation).

3. The grounding correction is independently established by LATS and operationalized by WALL-E. LATS, a
   frontier system, DELIBERATELY drops the internal LLM world model ("RAP is constrained to tasks where the LM
   can ... accurately predict states"; internal-only reasoning "risks fact hallucination and error
   propagation while setting a performance ceiling") and grounds in environment feedback (HumanEval 92.7-94.4%
   pass@1). WALL-E, in Minecraft, shows the LLM's predicted dynamics are misaligned and patches exactly the
   mispredicted transitions with gradient-free complementary rules pruned by maximum set cover (+15-30%
   success, 60-80% of tokens), comparing on the binary action_result per transition. WALL-E's loop is the
   repo's verifier loop: predict the delta, observe the true delta, correct only the misses, at near-$0.

## Weak or uncertain claims

- FLARE (2601.22311) is abstract-only here; its step-wise-myopia mechanism is well-posed and matches LATS and
  WebDreamer, but its numbers (LLaMA-8B+FLARE beats GPT-4o) are claim-only and not verified from the body.
- The MDL principle (LLM-MCTS) is theoretical-analysis plus empirical support, not a proof; whether a social
  transition model has a shorter description length than a social policy is untested.
- "The LLM is a good world model" is inferred from downstream task gains in every deep-read source; none
  reports per-step predicted-state accuracy against a ground-truth transition (the metric the repo's verifier
  would produce). So the repo would measure something these papers do not.
- The LAW's social/level-1 (theory-of-mind) claims are explicit hypotheses, not measured results.
- No source predicts TYPED social-material state with an LLM and scores it against a deterministic verifier;
  the literature stops at physical/web/household/text-puzzle state.

## Implications for this repo (mechanical vs contribution)

- Mechanical (borrow directly): WebDreamer's `sim`+`score` MPC shape; RAP's per-task state/action
  instantiation and self-consistency-as-confidence; LATS's "score after feedback, plus reflection memory"
  loop; WALL-E's predict-vs-actual mismatch loop with maximum-set-cover rule pruning; DEPS's
  describe-explain-plan-select with a runtime descriptor. In every case, swap the LLM-or-environment scorer
  for the deterministic verifier's typed delta.
- Contribution (not in the literature): predict TYPED social-material deltas (possession, claims, obligation,
  trust) with a prompt-based LLM and score them against the verifier per step; report per-transition
  prediction accuracy (a metric none of these papers produce); test whether complementary correction rules
  (WALL-E style) exist for social transitions at all; instantiate the LAW's level-1 agent model as
  verifier-grounded social-ledger prediction.
- Admissibility: advisory at Physical/Material now (MDL favors the world-model use; verifier grounds it);
  advisory-only and unproven at Social (MDL stops favoring it; FLARE myopia and Reflexion no-guarantee apply
  hardest); weakest at Institutional (long-horizon compounding and myopia; calibration over horizons is the
  open problem). The WAM must never select the executed action, fill arguments, mark progress, or override the
  verifier.

## Recommended next questions

1. What is the per-transition prediction accuracy of a zero-shot prompt-based WAM on the repo's verified
   Physical/Material deltas? (No paper reports this; it is the first measurement the repo can uniquely make.)
2. Does WALL-E's maximum-set-cover rule-correction loop converge for typed social-material transitions, or do
   social mispredictions resist compact complementary rules (the MDL-weakens-at-Social hypothesis)?
3. Where does compounding error (WebDreamer) and step-wise myopia (FLARE) bite for a per-step advisory WAM in
   the repo's structured environment, and does per-step verifier grounding bound it, or is horizon-level
   calibration also required?
4. Can the proposer/scorer separation be enforced structurally (advisory WAM proposes, verifier scores) so
   the ToT/RAP self-scoring pattern is impossible by construction, satisfying the directions report's
   progress-laundering requirement?

## One-line tie to the thesis

A prompt-based LLM is a usable advisory social-material world model at Physical/Material because it can predict
structured next-states (RAP, WebDreamer, DEPS, WALL-E), but its dynamics hallucinate, compound, and go myopic
and its self-evaluation has no guarantee, so the repo's deterministic verifier is the external, per-step,
near-$0 grounding that converts "LLM grades itself" into the admissible "LLM proposes and predicts, verifier
scores," leaving Social and Institutional as the unproven contribution surface.
