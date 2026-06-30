# Lane 23 brief: Autonomous experimentation and self-improving / discovered world models (H6)

Lane focus: loops that autonomously improve or DISCOVER the world model (the dynamics) itself, not just the
policy: curiosity / intrinsic-motivation exploration to gather model-improving data, active / experimental
causal discovery (intervene to learn structure), and LLM-agent world models that co-evolve with the policy.
This is the most direct wave-4 tie: autoresearch aimed at the WAM itself.

## Sources reviewed

Deep-read cornerstones (LaTeX, 7 papers, 9 ids including the RND comparison folded into the ICM note):
- WebEvolver `2504.21024` (anchor precedent: co-evolving LLM WM + look-ahead engine)
- WorldLLM `2506.06725` (most on-target: Scientist/Statistician/Experimenter loop to improve an LLM WM)
- CausaLab `2605.26029` (LLM interactive causal discovery; the prediction-vs-mechanism bound)
- RWML / WMRL `2602.05842` (sim-to-real-gap reward, less hackable than LLM-as-judge)
- ICM `1705.05363` + RND `1810.12894` (curiosity cornerstones; noisy-TV problem)
- Plan2Explore `2005.05960` (explore via ensemble disagreement / expected information gain)
- Active Interventions for neural causal models `2109.02429` (AIT: choose the most discriminating intervention)
- WorldTest / AutumnBench `2510.19788` (how to evaluate whether an agent LEARNED the dynamics)

Breadth (abstract-level, in manifest): WMA web agent `2410.13232`, From Word to World `2512.18832`, R-WoM
`2510.11892`, reward-free self-evolution `2604.18131`, Text World Models survey `2606.09032`, DynaWeb
`2601.22149`, BED-LLM `2508.21184`, Curiosity in Hindsight `2211.10515`, Variational Intrinsic Control
`1611.07507`, Intrinsically-Motivated Humans/Agents in Crafter `2503.23631`, AvE `2006.14796`, Transfer
Empowerment `2203.03355`, Developmental Curiosity + Social Interaction `2305.13396`.

Counts: 22 sources logged in manifest (lane=23). LaTeX downloaded and deep-read: 9 ids (7 notes; RND folded
into the ICM note, Plan2Explore deconflicted against the existing Dreamer notes). PDF-only: 0. Abstract-only:
13. Deconflicted (cited, not re-surveyed): Dreamer line and CDL/CoDA (existing wave-2/3 notes).

## Owned deliverables (all written)
- Theme: `notes/by-theme/research-area-autonomous-experimentation-and-world-model-discovery.md`
- By-paper notes: the 7 listed above under `notes/by-paper/`
- `raw-search-results/lane-23-manifest.jsonl`, `raw-search-results/lane-23-search-log.md`, this brief.

## Strongest findings (source-backed)

1. There is a clean, advisory precedent for the thesis. WebEvolver (`2504.21024`) co-trains an LLM world
   model `p(o'|o,a)` from the agent's own collected transitions and uses it BOTH as a synthetic-data
   generator and as an inference-time look-ahead engine that scores candidate actions before execution. That
   is the exact advisory role this repo wants (predict and evaluate; never act), and it improved web-agent
   success ~10% with no distillation.

2. The experiment-to-improve-your-own-model loop is realizable at prompt level. WorldLLM (`2506.06725`) runs
   a Scientist (proposes natural-language hypotheses by Bayesian inference) / Statistician (the LLM WM scores
   them on real data) / Experimenter (curiosity-driven RL collects poorly-predicted transitions) loop in a
   reward-LESS environment, improving prediction with NO gradient training. Its RL-ALP failure (collapsing
   onto trivial transitions) is a concrete transferable caution.

3. Verifier-grounding beats self-scoring, measurably. RWML (`2602.05842`) trains an LLM WM with a sim-to-real
   gap reward (predicted vs environment-OBSERVED next state, binarized) and reports it is empirically less
   susceptible to reward hacking than LLM-as-judge. This is the engineering form of the repo's "the runtime
   owns truth; the LLM must never score its own success" (progress laundering). Together with CausaLab's RQ2
   (agent-chosen online intervention recovers more structure than passive observation: 0.80 vs 0.47 edge-F1),
   the constructive half of the thesis is supported at the Physical/Material layers.

## Weak or uncertain claims (what I could not verify)

- The biggest unverified thing: NONE of these methods is a structured-state SOCIAL world model. Every result
  is on web pages (WebEvolver, WMA, R-WoM), tiny text games (WorldLLM), Atari/DM-Control (ICM, RND,
  Plan2Explore), small synthetic SCMs (AIT, CausaLab), or grid-worlds (WorldTest). The transport to Minecraft
  social/material state is the repo's contribution surface, not a citable result.
- I could not verify any value-aware curiosity objective that works in a multi-agent social setting. The
  pro-social empowerment thread (AvE `2006.14796`, Transfer Empowerment `2203.03355`) is the lead but is
  abstract-level here and unproven at this scale.
- ENPIRE's and several 2026 papers' numbers are page/abstract-stated, not source-verified from a fetched PDF
  (ENPIRE has no arXiv id; I cite the coordinator's `enpire.md` and did not re-fetch).
- RWML's author block was anonymized-style in the source; I did not transcribe individual authors.
- Code availability for WorldLLM, RWML, and CausaLab was not confirmed from the .tex (marked partial).

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful (engineering to borrow): (a) the co-evolving-WM loop and the look-ahead-scoring pattern
  from WebEvolver, applied to the repo's verifier-labeled transitions; (b) WorldLLM's prompt-level hypothesis
  refinement (no training) as the way to improve an advisory WAM cheaply; (c) RWML's sim-to-real gap reward
  (predicted vs verifier-observed delta, binarized) as the verifier-grounded, self-scoring-proof signal; (d)
  AIT's "intervene where your hypotheses most disagree" as a principled experiment-selection rule, and
  Plan2Explore's epistemic-vs-aleatoric distinction (chase reducible uncertainty, not noise); (e) WorldTest's
  explore-then-test-on-DERIVED-scenes protocol plus CausaLab's separate mechanism-recovery scoring as the
  evaluation discipline (and a consistency/stopping check against premature stopping).
- Research contribution (not yet citable, the repo's surface): showing any of this holds for STRUCTURED
  SOCIAL/material Minecraft state; a value-aware (claim-respecting, weak-commons-respecting) exploration
  objective so curiosity does not become anti-social probing; closing the prediction-vs-mechanism gap for
  social dynamics. Hard rule throughout: a discovered WM stays advisory (predicts, never executes / fills args
  / marks progress / overrides the verifier).

## Recommended next questions
1. Can the repo run a minimal WorldLLM-style loop on the Physical layer first (verifier-labeled transitions,
   prompt-level hypotheses, sim-to-real-gap reward), and measure prediction AND mechanism recovery separately
   (CausaLab discipline) before touching social layers?
2. What is the right value-aware exploration objective for the social layer: pro-social empowerment, or
   curiosity hard-gated by the existing material-claim / permission gates so only afforded, non-violating
   actions are ever selected for model-improving experiments?
3. Does the repo's cycle support a WorldTest-style held-out DERIVED scene to test whether an improved WAM
   transfers, including detecting when the world's rules changed (the change-detection task family)?
