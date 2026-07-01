# Lane 28 brief (I5): Automated design of agentic systems and prompt/workflow optimization

Wave 5, lane 28. Area: self-improvement aimed at the AGENT itself (the agent improves the agent's own
prompts, workflow, and architecture, scored on task performance). ASCII punctuation only.

## Sources reviewed (16 total; 10 LaTeX-fetched, 6 abstract-level)

Deep-read (LaTeX, main + method + experiments + limitations):
- ADAS, Automated Design of Agentic Systems (2408.08435, ICLR 2025)
- AFlow, Automating Agentic Workflow Generation (2410.10762, ICLR 2025)
- OPRO, Large Language Models as Optimizers (2309.03409, ICLR 2024)
- GPTSwarm, Language Agents as Optimizable Graphs (2402.16823, ICML 2024)
- DSPy, Compiling Declarative LM Calls into Self-Improving Pipelines (2310.03714, ICLR 2024)
- Promptbreeder, Self-Referential Self-Improvement via Prompt Evolution (2309.16797, DeepMind)

Abstract + key-section read (LaTeX fetched):
- MIPRO, Optimizing Instructions and Demonstrations for Multi-Stage LM Programs (2406.11695, EMNLP 2024)
- AgentSquare, Automatic LLM Agent Search in Modular Design Space (2410.06153, ICLR 2025)
- APE, Large Language Models Are Human-Level Prompt Engineers (2211.01910, ICLR 2023)
- EvoPrompt, Connecting LLMs with Evolutionary Algorithms (2309.08532, ICLR 2024)

Breadth (abstract / search-result level; ids beyond title unverified -> claim-only where noted):
- A Systematic Survey of Automatic Prompt Optimization Techniques (2502.16923)
- From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents (2603.22386, IBM; hf-info verified)
- When Better Prompts Hurt: Evaluation-Driven Iteration (2601.22025, claim-only)
- Prompts Generalize with Low Data: Non-vacuous Generalization Bounds for Prompts (2510.08413, claim-only)
- A Self-Improving Coding Agent (2504.15228)
- AgentSwift: Efficient LLM Agent Design via Value-guided Hierarchical Search (2506.06017, claim-only)

All seed ids in the lane brief were CONFIRMED. AgentSquare needed web (hf fuzzy); everything else
confirmed via `hf papers search`.

## Strongest findings (source-backed)

1. One frame covers the whole lane: ADAS's decomposition (design SPACE, search ALGORITHM, evaluation
   FUNCTION). Every method is a special case differing in which it searches: prompt text (APE, OPRO,
   PromptBreeder, EvoPrompt) -> prompts + demonstrations (DSPy/MIPRO) -> graph topology (GPTSwarm) ->
   typed module schema (AgentSquare) -> arbitrary code (ADAS). The IBM survey (2603.22386) confirms the
   same field, organized by when structure is set, what is optimized, and which evaluation signals
   guide it (task metrics, verifier signals, preferences, trace-derived feedback).

2. Auto-search beats hand-design, and ADAS shows it can TRANSFER. OPRO +8% GSM8K / +50% Big-Bench Hard;
   DSPy +5-46% over expert demos; AFlow +5.7% over manual and a weak model beating GPT-4o at 4.55% cost;
   AgentSquare +17.2% over best human designs; ADAS +13.6 F1 / +14.4% per domain AND its math-found
   agents improve GSM8K 25.9% and still beat baselines on non-math domains and across models. So the
   honest claim is not "search overfits, ignore it" but "search can find robust, transferable designs,
   and whether a run does depends on the evaluation function."

3. The central bound, instantiated by primary sources: optimization is only as honest as the score it
   optimizes. OPRO's dedicated overfitting section measures train accuracy "5%-20% higher than test."
   PromptBreeder beats OPRO on GSM8K (83.9% vs 80.2%) with the near-meaningless prompt "SOLUTION\"",
   and OPRO measured that a plausible MERGE of two good prompts ("Let's work together to solve this
   problem step by step.") scores 49.4 vs 71.8 for "Let's think step by step." -> human plausibility
   and LLM-judge-of-prompt-quality are the WRONG selection criteria; only a held-out verifier score is
   legitimate. The cost-saving surrogates (MIPRO's mini-batch surrogate, AgentSquare's in-context
   predictor) reintroduce the risk by letting the surrogate, not the verifier, gate candidates.
   Mitigations are in the sources: real held-out set + early stopping (OPRO), 5 runs per candidate on
   held-out validation (AFlow), cross-validation against a user-supplied metric (DSPy).

## Weak or uncertain claims (what I could not verify)

- The biggest gap: NO paper in this lane evaluates auto-designed agents on embodied, multi-step, SOCIAL
  tasks. All results are QA, math, code, web, or game benchmarks with crisp numerical or answer-checking
  metrics. ADAS itself scopes to single-step QA and lists multi-step environments as future work.
  Whether prompt/agent search transfers to the Social/Institutional WAM layers is UNVERIFIED, and the
  theme file marks it so.
- 2601.22025, 2510.08413, 2506.06017 are abstract/search-result-level only; their arXiv ids were not
  independently fetched, so they are tagged reproducibility_status claim-only. The "prompt
  distributional overfitting" failure mode is corroborated across multiple web sources but I did not
  deep-read a single canonical paper for it.
- MIPRO, AgentSquare, APE, EvoPrompt were read at abstract + key-section depth, not full method
  deep-read; their mechanism descriptions are cross-confirmed (e.g. PromptBreeder's related-work
  section describes APE's and EvoPrompt's mechanisms), but I did not independently read every
  experimental table.
- All numeric results are as-stated by each paper; no independent re-run.

## Implications for this repo (mechanically useful vs research contribution)

Mechanically useful (ordered cheapest to richest):
- Prompt optimization (APE/OPRO/PromptBreeder/EvoPrompt) to tune the Actor Turn or advisory-WAM prompt,
  scored on the runtime verifier. APE's minimal loop is the entry point; OPRO's (solution, score)
  trajectory is a drop-in.
- Pipeline optimization (DSPy/MIPRO): declare the actor's prompted steps as modules, supply the runtime
  verifier as the DSPy metric, bootstrap demonstrations from verifier-passing cycles, select by
  cross-validation. Best engineering-grade fit; DSPy's "metric + cross-validation" IS the thesis
  requirement.
- Architecture search (ADAS/AgentSquare/GPTSwarm): mostly future work. ADAS's `forward`-against-a-tiny-
  helper-API mirrors the repo's `author_mineflayer_action`; AgentSquare's Planning/Reasoning/Tool-Use/
  Memory schema is a candidate actor decomposition; GPTSwarm edge optimization only if multiple actors.

Research contribution to avoid claiming: do not frame the repo as "ADAS for Minecraft," and do not
claim these gains transfer to Social/Institutional layers. The defensible borrow is the loop structure,
the space/algorithm/evaluation decomposition, and the held-out-verifier discipline, used where the
verifier returns a clean score (Physical/Material).

Honest enforcement for the thesis: search must be scored by the runtime VERIFIER (not LLM judge, not
training accuracy), on HELD-OUT scenarios, with the train/held-out gap tracked and early stopping;
surrogates may triage but never make the final accept; auto-designed prompts/workflows stay ADVISORY
(proposed, verifier-gated, never self-promoted = the anti-progress-laundering rule applied to agent
design).

## Recommended next questions

1. Define the smallest honest evaluation function for an Actor Turn prompt: a held-out set of replayed
   Minecraft scenarios scored purely by the runtime verifier (physical/material deltas), no LLM judge.
2. Wire DSPy with the runtime verifier as the metric and bootstrap few-shot demonstrations from
   existing verifier-passing cycles in the evidence trace (label-free).
3. Measure the train/held-out overfitting gap for a verifier-scored prompt search in this domain; check
   whether OPRO's "candidates overfit to a similar extent" property holds so ranking is trustworthy.
4. Decide whether GPTSwarm-style topology optimization is worth it if/when multiple actors cooperate,
   vs a fixed topology plus prompt optimization at lower risk.
5. Locate the boundary where a verifier score stops existing (Material -> Social) and confine
   auto-design to below it.

## Files created by this lane

- notes/by-paper/2408.08435-adas-meta-agent-search.md
- notes/by-paper/2410.10762-aflow-workflow-mcts.md
- notes/by-paper/2309.03409-opro-llm-as-optimizer.md
- notes/by-paper/2402.16823-gptswarm-optimizable-graphs.md
- notes/by-paper/2310.03714-dspy-and-mipro.md
- notes/by-paper/2309.16797-promptbreeder.md
- notes/by-paper/2410.06153-agentsquare-modular-search.md
- notes/by-paper/2211.01910-ape-and-2309.08532-evoprompt.md
- notes/by-theme/research-area-automated-agent-and-prompt-design.md
- raw-search-results/lane-28-manifest.jsonl
- raw-search-results/lane-28-search-log.md
- notes/subagent-briefs/lane-28-automated-agent-and-prompt-design.md
