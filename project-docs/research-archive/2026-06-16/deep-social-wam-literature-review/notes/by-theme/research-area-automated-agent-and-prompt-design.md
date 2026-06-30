# Research area: automated design of agentic systems and prompt/workflow optimization

Lane 28 (I5, wave 5) theme file. Audience: a newcomer to this sub-field. Jargon is defined on
first use. ASCII punctuation only (no em-dash, middle-dot, or bullet-char; only `-`, `:`, `,`, `.`).

This file surveys self-improvement aimed at the AGENT ITSELF: systems that automatically design or
optimize an LLM agent's prompts, its tool-use workflow, and its multi-agent architecture, scored on
task performance. The defining move is "the agent improves the agent": an outer search proposes agent
DESIGNS (prompts, graphs, code, module choices) and an evaluation function scores them. The central
question, taken from the lane brief: can a system search over agent designs and find better agents
than humans hand-build, and is the gain ROBUST or OVERFIT to the eval?

Anchors:
- Original query: "Can a hierarchical action-conditioned world model predict and evaluate how
  Minecraft actions transform physical state, material economy, social relations, memory, and future
  action opportunities in an embodied open world?"
- Wave-4 thesis under test (see `research-area-agentic-self-improvement-loops.md` and the anchor
  `notes/by-paper/enpire.md`, cited not rewritten): an ENPIRE-style loop, driven by a coding agent and
  grounded by the runtime VERIFIER as the success signal, can autonomously improve this repo's
  advisory social-material WAM and/or actor policy at near-zero cost with no human labels, IF it stays
  advisory (the LLM proposes; the runtime owns physical truth) and the agent never scores its own
  success (the repo's named failure mode: "progress laundering").

Deconfliction (this lane EXTENDS, does not re-survey): the loop itself is owned by lane H1
(`research-area-agentic-self-improvement-loops.md`); reward/skill CODE generation is owned by lane H3
(`research-area-llm-reward-and-code-generation.md`); task/curriculum generation by lane H4. This lane
owns automating the AGENT'S architecture, workflow, and prompts. The neighbors answer "how does the
loop refine" and "what code does it write"; this lane answers "the thing being refined is the agent's
own prompt and structure, and here is how that search works and where it overfits."

## 0. Glossary (defined once)

- **Agentic system / agent**: a foundation model used as one or more modules inside a program that
  plans, uses tools, and runs multiple steps to solve a task (ADAS, 2408.08435, uses this definition).
- **Prompt optimization (PO)**: automatically searching for the prompt text (instruction, examples)
  that maximizes a task score, instead of hand-writing it.
- **Agentic workflow**: a structured sequence of LLM calls (nodes) connected by control flow (edges)
  that together solve a task (AFlow, 2410.10762).
- **Meta agent**: an agent whose job is to design other agents (ADAS).
- **Evaluation function / metric / score function / utility**: the function that decides how good a
  candidate design is. The single most consequential choice in this whole area.
- **Held-out set**: data set aside and never used to choose the design, used only to check whether a
  gain generalizes. "Training set" is what the search optimizes against.
- **Overfitting to the eval**: a design scores high on the data used to select it but does not
  generalize. Training accuracy ends up much higher than held-out accuracy (OPRO, 2309.03409,
  measures this directly).
- **Surrogate model**: a cheap learned approximation of the true evaluation function, used to triage
  candidates during search so you do not run the expensive real check on every one (MIPRO, 2406.11695;
  AgentSquare, 2410.06153).
- **Verifier**: in this repo, the runtime check that scores a (state, action, next-state) transition
  on physical truth (schema, permission, execution evidence). The honest candidate for the metric.
- **Progress laundering**: this repo's name for the agent scoring its own success, so the search
  optimizes the measurement rather than the task (Goodhart's law).

## 1. The unifying frame: design space, search algorithm, evaluation function

ADAS (2408.08435, Hu, Lu, Clune, ICLR 2025) gives the cleanest decomposition, and every paper in this
lane is a special case of it. ADAS formulates the problem as: use a SEARCH ALGORITHM to discover
agentic systems across a SEARCH SPACE that optimize an EVALUATION FUNCTION. The papers differ only in
which of the three they fix and which they search.

| Paper (id) | Search space (what is optimized) | Search algorithm | Evaluation function | Headline result (as stated) |
|---|---|---|---|---|
| APE (2211.01910) | prompt text (one instruction) | LLM proposes candidates, select best | zero-shot accuracy of a held-out LLM | matches/beats humans on 24/24 Instruction Induction + 17/21 BIG-Bench |
| OPRO (2309.03409) | prompt text (one instruction) | LLM-as-optimizer reads (solution, score) trajectory, proposes more | training-subset accuracy, test after | up to +8% GSM8K, up to +50% Big-Bench Hard vs human prompts |
| PromptBreeder (2309.16797) | prompt text + the mutation-prompts that edit it (self-referential) | genetic algorithm, LLM as mutation operator | fitness on a random batch of 100 training Q&A | beats CoT/Plan-and-Solve; 83.9% GSM8K |
| EvoPrompt (2309.08532) | prompt text | evolutionary algorithm, LLM runs mutation/crossover | task performance | beats human prompts + prior automatic methods |
| DSPy + MIPRO (2310.03714, 2406.11695) | prompts + few-shot demonstrations of every module in a pipeline | teleprompter: bootstrap demos, random search / TPE / surrogate | user-supplied metric, cross-validated | DSPy >25%/>65% over few-shot; MIPRO up to +13% (Llama3-8B) |
| GPTSwarm (2402.16823) | per-node prompts + inter-agent edges (topology) | policy gradient over a distribution over DAGs | task utility u_tau | recombines ToT/Reflexion by edge optimization (MMLU, HumanEval, GAIA) |
| AgentSquare (2410.06153) | choice of Planning/Reasoning/Tool-Use/Memory module implementations | module evolution + recombination, surrogate predictor | benchmark score (surrogate to triage) | +17.2% over best human designs, 6 benchmarks |
| ADAS (2408.08435) | the ENTIRE agent, written in code | meta agent programs new agents from an archive | held-out validation accuracy | +13.6 F1 DROP, +14.4% MGSM; transfers across domains/models |

The progression is a widening of the search space: from prompt TEXT (APE, OPRO, PromptBreeder,
EvoPrompt), to prompts + DEMONSTRATIONS in a pipeline (DSPy/MIPRO), to TOPOLOGY of a multi-agent graph
(GPTSwarm), to a typed MODULE schema (AgentSquare), to ARBITRARY CODE (ADAS). ADAS argues code is the
limit case: because programming languages are Turing-complete, a code search space can in principle
represent "any possible agentic system: including novel prompts, tool use, workflows, and combinations
thereof." The IBM workflow-optimization survey (2603.22386) organizes the same field by a different
axis (WHEN the workflow structure is decided, WHAT part is optimized, and crucially WHICH evaluation
signals guide optimization: task metrics, verifier signals, preferences, or trace-derived feedback),
and proposes a structure-aware evaluation that adds robustness and cost alongside the task metric.

## 2. The demonstrated result: auto-search beats hand-design, and can transfer

The primary-source evidence that this works is strong and consistent.

- APE reaches human-level prompt engineering on 24/24 Instruction Induction tasks.
- OPRO beats human prompts by up to 8% on GSM8K and up to 50% on Big-Bench Hard.
- DSPy beats expert-written demonstrations by 5-46% (GPT-3.5) and 16-40% (llama2-13b), and lets small
  open models (770M T5) rival expert prompt chains for proprietary GPT-3.5.
- AFlow beats manual workflows by 5.7% on average and other automated methods by 19.5%, and makes a
  weaker model beat GPT-4o on specific tasks at 4.55% of the dollar cost.
- AgentSquare beats the best-known human agent designs by 17.2% across six benchmarks.
- ADAS not only beats hand-designed baselines per domain but its discovered agents TRANSFER: agents
  found on MGSM math improve GSM8K by 25.9% and GSM-Hard by 13.2%, and still beat hand-designed
  baselines when moved to non-math domains (MMLU, DROP) and across models (GPT-3.5 to Claude-Sonnet).

ADAS's transfer result is the strongest evidence AGAINST a naive "all agent search just overfits the
eval" story. Code-space agent search can find genuinely transferable DESIGN PATTERNS, not just
benchmark-specific tricks. So the honest position is not "search overfits, ignore it" but "search can
find robust designs, and whether a given run does depends entirely on the evaluation function."

## 3. The central bound: optimization is only as honest as the score it optimizes

This is the recurring failure mode across the lane, and it is the bound this repo must enforce. Three
primary-source facts make it concrete.

First, the optimized artifacts are often things a human would never pick, and would mis-rank by
reading. OPRO's best discovered GSM8K prompt is "Take a deep breath and work on this problem
step-by-step." PromptBreeder beats that (83.9% vs 80.2% on GSM8K) with the near-meaningless string
"SOLUTION\"", and the authors themselves call it "further evidence for the sensitivity of LLMs to
prompts." OPRO also measured that "Let's think step by step." scores 71.8, "Let's solve the problem
together." scores 60.5, but their plausible-looking semantic MERGE "Let's work together to solve this
problem step by step." scores only 49.4. The lesson: the selection criterion cannot be human
plausibility, and it cannot be an LLM judging whether a prompt "looks good," because the wins are only
legible through the score on real data.

Second, the optimized artifacts measurably overfit the data used to select them. OPRO has a dedicated
overfitting analysis: "our training accuracies are often 5%-20% higher than our test accuracies."
OPRO's stated mitigation is exactly the held-out discipline: keep a real validation set, use enough
training samples (at least tens) "so that the optimized prompt does not severely overfit," and use
early stopping. The web literature names this failure "prompt distributional overfitting" (optimized
prompts accumulate narrow sample-specific rules and generalize poorly; see 2601.22025 and the
generalization-bounds work 2510.08413, both abstract-level here).

Third, the cost-reduction tricks reintroduce the failure through a side door. MIPRO learns a SURROGATE
of the objective from stochastic mini-batches; AgentSquare uses an in-context performance PREDICTOR to
skip unpromising designs. Both speed up search, but when scaled they let the surrogate, not the true
verifier, decide which candidates survive. If the surrogate is biased, the search optimizes the
surrogate's error. The honest practice is: surrogate for ranking DURING search, true verifier for the
FINAL accept.

The good news, also from the primary sources: the failure is bounded by a real held-out signal.
OPRO's nuance is that "overfitting is less harmful when each candidate solution overfits to a similar
extent," so relative ranking can survive even when absolute scores overfit, provided the held-out set
is real. AFlow's practice answers the noise version of the problem directly: it runs each candidate
workflow 5 times on a held-out validation set and selects high-variance problems, so a single lucky
run does not win.

## 4. How this maps onto this repo (mechanically useful vs research contribution)

This is the most directly transferable wave-5 area because the repo's actor IS an LLM tool-use agent
with prompts and a workflow. The reusable machinery, ordered cheapest to richest:

1. PROMPT optimization (APE, OPRO, PromptBreeder, EvoPrompt): tune the Actor Turn selection prompt or
   the advisory-WAM prompt by having an LLM propose variants and scoring each on the runtime verifier.
   APE's minimal loop is the cheapest; OPRO's (solution, score) trajectory is a drop-in pattern;
   PromptBreeder adds diversity and an optional self-referential second loop. APE's own
   diminishing-returns-after-3-rounds finding warns this plateaus, so do not expect unbounded gains.
2. PIPELINE optimization (DSPy/MIPRO): declare the actor's prompted steps as modules, supply the
   runtime verifier as the DSPy metric, and let the compiler bootstrap demonstrations from
   verifier-passing cycles and select instructions by cross-validation. This is the most engineering-
   grade fit: DSPy's own phrasing, "optimizing average quality using the metric with cross-validation,"
   is the thesis requirement stated as a feature.
3. ARCHITECTURE search (ADAS, AgentSquare, GPTSwarm): heavier, and mostly future work for this repo.
   ADAS's `forward`-function-against-a-tiny-helper-API maps onto the repo's `author_mineflayer_action`
   (the LLM authors code against a bounded helper API, the runtime executes). AgentSquare's
   Planning/Reasoning/Tool-Use/Memory schema is a candidate decomposition for the actor. GPTSwarm's
   edge optimization only matters if the repo moves from one actor to several cooperating actors.

The research contribution to AVOID claiming: none of these papers validates auto-designed agents on
EMBODIED, MULTI-STEP, SOCIAL tasks. ADAS explicitly scopes to single-step QA and lists multi-step
interactive environments as future work; AFlow/OPRO/DSPy/AgentSquare results are all on QA, math,
code, web, or game benchmarks with crisp numerical or answer-checking metrics. Do not reframe the repo
as "ADAS for Minecraft" or claim these gains transfer to the Social or Institutional WAM layers. The
defensible borrow is the loop structure, the design-space/algorithm/evaluation decomposition, and
above all the held-out-verifier discipline, applied where the verifier returns a clean score.

## 5. Where this lane lands the thesis, and where it bounds it

Supports the thesis: the entire lane is existence proof that an LLM agent's prompts and structure CAN
be auto-improved against an evaluation function, often beating hand-design and sometimes transferring
(ADAS). The repo already emits verifier-scored (state, action, next-state) transitions, which is
exactly the evaluation function these methods need. DSPy/MIPRO show a working framework for "the metric
is the verifier." So an ADAS/AFlow/OPRO/DSPy-style search over the Actor Turn or advisory-WAM prompts,
scored by the runtime verifier, is a natural and near-$0 way to improve the agent.

Bounds the thesis (the lane's whole point): every method here breaks in the same way if the score is
wrong. OPRO documents 5-20% train/test overfitting; PromptBreeder's "SOLUTION\"" shows the optimizer
finds things only the score can justify; MIPRO and AgentSquare show that cost-saving surrogates can
quietly become the de facto scorer. Therefore, for this repo:

- The search must be scored by the RUNTIME VERIFIER, not an LLM judge and not training-set accuracy.
- The score must be on HELD-OUT scenarios, with the train/held-out gap tracked as a health metric, and
  early stopping, per OPRO's own mitigation and AFlow's multi-run practice.
- Surrogates may triage during search but never make the FINAL accept; the verifier does.
- An auto-designed prompt or workflow stays ADVISORY: it is proposed and verifier-gated, never
  self-promoted. This is the repo's anti-progress-laundering rule applied to agent design.

The dependency the shared contract insists on holds here too: this works cleanly at the Physical and
Material WAM layers, where the verifier gives clean labels (Bob has a pickaxe with durability > 0).
At the Social and Institutional layers there is no single numerical metric and scenarios are costly to
reset, so auto-design there is meaningful only after physical/material prediction is reliable and only
to the extent a verifier-grounded score exists.

## 6. Open questions for this repo

1. What is the smallest honest evaluation function for an Actor Turn prompt: a held-out set of replayed
   Minecraft scenarios scored purely by the runtime verifier (physical/material deltas), with no LLM
   judge in the loop?
2. Can DSPy's "bootstrap demonstrations from traces that pass the metric" be fed by verifier-passing
   cycles already in the repo's evidence trace, giving label-free few-shot examples for free?
3. What is the train/held-out overfitting gap for a verifier-scored prompt search in this domain, and
   does OPRO's "candidates overfit to a similar extent" property hold so that relative ranking is
   trustworthy?
4. If the repo ever runs multiple cooperating actors, is GPTSwarm-style edge optimization worth it, or
   does a fixed hand-set topology plus prompt optimization capture most of the gain at lower risk?
5. Where exactly is the boundary at which a verifier score stops existing (the move from Material to
   Social), and can auto-design be cleanly confined to below that boundary?
