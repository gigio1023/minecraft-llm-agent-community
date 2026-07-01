# Research area: long-horizon agent memory, and learned verifiers / reward models

Lane 17 (G6) theme file. Audience: a newcomer to these two sub-fields. Jargon is defined
on first use. This file surveys two research AREAS the original query and the project lean
on but that the wave-1/2 theme files do not survey as fields:

- **Part A, agent memory**: the query names "memory" (memory commitments, obligations
  remembered across cycles). What is the research area of long-horizon agent memory?
- **Part B, verifiers / reward models**: the project's WAM is **advisory**, which is the
  verifier role (predict expected state, compare to evidence, signal trust). What is the
  research area of *learned verifiers and reward/judge models*? This is the academic
  footing for "an advisory predictor scored against evidence."

The original query (anchor): "Can a hierarchical action-conditioned world model predict
and evaluate how Minecraft actions transform physical state, material economy, social
relations, memory, and future action opportunities in an embodied open world?"

Companion files (cited, not duplicated): `benchmark-validity-and-evaluation.md` (the
LLM-judge-is-unreliable evidence), `vla-and-the-wam-vs-vla-distinction.md` and
`notes/by-paper/2605.06222-when-to-trust-imagination.md` (the advisory-WAM = FFDC verifier
framing), `notes/by-paper/2304.03442-generative-agents.md` and `2312.03664-concordia.md`
(the existing memory-system threads).

---

## PART A: Long-horizon agent memory

### A.0 What this area is (one line)

How an LLM agent persists, organizes, and selectively recalls information across many
interactions, so that a stateless next-token model behaves like an agent that *remembers*.

### A.1 Glossary (defined once)

- **Context window**: the fixed number of tokens an LLM can attend to in one forward pass.
  Everything outside it is invisible unless explicitly brought in.
- **Working (short-term) memory**: the information currently inside the context window.
- **Long-term / external memory**: information stored *outside* the context window (a
  database, file, or vector store) that must be retrieved back in to be used.
- **Episodic memory**: memories of specific past events ("at cycle 12, I lent Bob a
  pickaxe"). **Semantic memory**: distilled general facts ("Bob returns what he borrows").
  The terms are borrowed from cognitive psychology; in LLM-agent work they are an informal
  distinction, not a strict architecture.
- **Memory stream**: a time-ordered log of natural-language memory entries (the Generative
  Agents term, 2304.03442).
- **Retrieval-augmented generation (RAG)**: fetch relevant external text and prepend it to
  the prompt before generating (Lewis et al. 2020, arXiv 2005.11401). The canonical way to
  bring long-term memory into working memory.
- **Reflection**: periodically summarizing raw memories into higher-level insights that are
  themselves stored (Generative Agents). **Self-feedback / verbal reinforcement**: writing
  a lesson from a failure into memory to do better next time (Reflexion, 2303.11366).
- **Write-manage-read loop**: the survey framing for memory as a cycle of writing entries,
  managing/consolidating them, and reading them back (2603.07670).

### A.2 Key works and sub-threads (source-backed)

**Thread 1: the memory stream + reflection (the agent-memory archetype).**
Generative Agents (Park et al. 2023, arXiv 2304.03442; covered in
`notes/by-paper/2304.03442-generative-agents.md`, cited not rewritten) introduced the
template: a natural-language **memory stream**, retrieval scored by **recency x importance
x relevance**, and **reflection** that synthesizes insights which *cite the memory objects
they are built from* (for example "Klaus is dedicated to research (because of 1, 2, 8,
15)"). What it introduced and why it matters: it is the architectural root of LLM social
agents, and the "reflection cites its evidence" idea is the single most transferable piece
for an evidence-grounded project, the memory does not just assert, it points at what
supports it. Limitation (from that note): everything is unconstrained natural language with
no typed state and no transition model, which is exactly what this project forbids as
runtime authority.

**Thread 2: external long-term memory via tool-calling (MemGPT and the OS analogy).**
MemGPT (Packer et al. 2023, arXiv 2310.08560; deep-read,
`notes/by-paper/2310.08560-memgpt.md`) is the cornerstone of the engineering side. It
treats the context window as constrained physical memory and pages data in and out of
external stores through **function calls** the LLM issues itself. Two tiers: main context
(read-only system instructions + a read/write **working context** block + a FIFO message
queue with a recursive summary of evicted messages) and external context (a full message
"recall storage" + an arbitrary-length "archival storage"). Eviction triggers a
memory-pressure warning so the LLM saves important facts before they scroll off. What it
introduced and why it matters: it is the canonical pattern for unbounded memory under a
fixed budget, and the function-call interface (the LLM decides what to store/retrieve) is a
clean substrate for "remember this obligation, recall it next cycle." Limitation: working
context is unstructured text the LLM rewrites and treats as true; the project needs memory
entries that reference runtime artifacts, not free prose.

**Thread 3: agentic memory that organizes and evolves itself.**
A-MEM (Xu et al. 2025, arXiv 2502.12110, abstract-level) adds Zettelkasten-style dynamic
linking: each new memory becomes a structured note (context, keywords, tags), the system
links it to related past memories, and adding a memory can *update* the attributes of older
ones (memory evolution). Per its abstract, it beats prior memory baselines across six
foundation models. Related 2026 work pushes consolidation and cost: HiAgent (2408.09559)
manages hierarchical *working* memory via subgoal chunks; surveys 2605.06716 (storage ->
reflection -> experience) and the systems-oriented 2603.07670 (write-manage-read loop, five
mechanism families: context compression, retrieval stores, reflective self-improvement,
hierarchical virtual context, policy-learned management). What this thread adds: memory is
not a static log; it is curated, linked, summarized, and forgotten. (Interpretation: useful
mechanics, but each is an engineering choice; none of these is a *predictive* model.)

**Thread 4: self-feedback as memory (the bridge to verifiers).**
Reflexion (Shinn et al. 2023, arXiv 2303.11366, abstract-level) reinforces an agent not by
updating weights but by writing verbal self-reflections into an **episodic memory buffer**
after a failure, improving the next trial (91% pass@1 on HumanEval in the paper's report).
This is where memory and verification meet: a *judgment about a past attempt* is stored as
memory and changes future behavior. It motivates Part B.

**Thread 5: how memory is evaluated (and why that is hard).**
MemoryAgentBench (2507.05257) names four memory competencies (accurate retrieval,
test-time learning, long-range understanding, conflict resolution) and finds current
agents master none fully. The "Anatomy of Agentic Memory" survey (2602.19320) is blunt
about fragility: underscaled benchmarks, metrics misaligned with semantic utility,
backbone-model-dependent results, **judge sensitivity** in evaluation, and ignored
system-level latency/cost. (This connects memory evaluation directly to Part B's
LLM-judge-reliability problem.)

### A.3 Maturity and open problems (Part A)

Memory mechanisms work well enough to be standard (RAG, MemGPT-style tiers, reflection),
but the field's own surveys flag that evaluation is immature and results are
backbone-dependent (2602.19320, 2507.05257). Open problems the surveys list: continual
consolidation, **causally grounded retrieval** (retrieving what actually matters, not just
what is similar), trustworthy reflection, learned forgetting, and **multimodal/embodied
memory** (2603.07670). The last is exactly where this project sits and is the least solved.

---

## PART B: Learned verifiers and reward models

### B.0 What this area is (one line)

How to train or prompt a model that *judges* whether an output (or a step) is correct or
good, used to rank candidates, give training reward, or signal trust, and how reliable that
judge is.

### B.1 Glossary (defined once)

- **Verifier / reward model (RM)**: a model that scores a candidate solution. Used for
  **best-of-N** (sample N solutions, keep the one the verifier ranks highest) and for RL
  training signal.
- **Outcome reward model (ORM)**: scores only the final result. **Process reward model
  (PRM)**: scores each intermediate step (Lightman et al. 2023, arXiv 2305.20050).
- **Outcome vs process supervision**: training the RM from final-answer labels vs from
  per-step labels.
- **Discriminative verifier**: an LLM fine-tuned as a classifier that outputs a scalar
  `r(x,y) in [0,1]`. **Generative verifier (GenRM)**: an LLM that outputs a *token* (e.g.
  "Yes"/"No"), optionally after a verification chain-of-thought (Zhang et al. 2024, arXiv
  2408.15240).
- **LLM-as-a-judge**: prompting an off-the-shelf LLM to evaluate or compare outputs (Zheng
  et al. 2023, arXiv 2306.05685). A **generative reward model** is the same idea used as a
  training reward.
- **Self-verification**: a model checking its own output. **Generator-verifier gap** (a.k.a.
  generation-verification gap): the difference between how well a model can *produce* a
  good answer and how well it can *recognize* one (Song et al. 2024, arXiv 2412.02674).
- **RLVR (RL with verifiable rewards)**: RL where the reward comes from a deterministic
  checker (unit tests, exact-match). Contrasted with learned/judge rewards.
- **Reward hacking**: a policy getting high reward without genuinely satisfying the intent
  (e.g. padding text, repeating correct-but-unnecessary steps).

### B.2 Key works and sub-threads (source-backed)

**Thread 1: process vs outcome reward (the founding distinction).**
"Let's Verify Step by Step" (Lightman et al. 2023, arXiv 2305.20050; deep-read,
`notes/by-paper/2305.20050-lets-verify-step-by-step.md`) is the cornerstone. Process
supervision trains a much more reliable verifier than outcome supervision: the PRM solves
**78.2%** of a MATH subset under best-of-1860 vs 72.4% (ORM) and 69.6% (majority vote),
and its lead grows with N. Why it matters here: (1) per-step checking gives precise credit
assignment and catches "right answer via wrong reasoning"; (2) the paper argues process
supervision is more interpretable, more aligned, and harder to reward-hack, even reporting a
**negative alignment tax**. It released PRM800K (~800K human step-labels). Follow-ups make
process labels cheaper: OmegaPRM (2406.06592) auto-collects step labels by MCTS; PAV /
"Rewarding Progress" (2410.08146) reframes a good process reward as the *change in the
probability of a correct future* (step-level advantage); ThinkPRM (2504.16828) makes the
PRM itself a long-CoT generative verifier trained on ~1% of the labels.

**Thread 2: generative verifiers (verification as generation).**
GenRM (Zhang et al. 2024, arXiv 2408.15240; deep-read,
`notes/by-paper/2408.15240-generative-verifiers-genrm.md`) trains the verifier with
next-token prediction: the score is `p("Yes")`. This unlocks verification chain-of-thought,
unified generation+verification co-training (positive transfer), and **inference-time
compute** (sample K verification rationales, average). It beats discriminative verifiers,
DPO verifiers, and LLM-as-a-judge (GSM8K 73% -> 93.4%). The decisive example: a convincing
wrong solution that a discriminative RM scores 0.999, but GenRM-CoT reasons through and
rejects (0.0015). Lesson: a verifier that *reasons before deciding* catches plausible
errors a scalar classifier rubber-stamps.

**Thread 3: LLM-as-a-judge and its biases (the caution).**
"Judging LLM-as-a-judge" (Zheng et al. 2023, arXiv 2306.05685; deep-read,
`notes/by-paper/2306.05685-judging-llm-as-judge.md`) is the founding judge paper and the
source of the bias vocabulary. GPT-4 reaches **85%** agreement with human experts (above
81% human-human), but that headline comes with hard caveats: agreement rises with the
quality gap (~70% on close pairs to ~100% on large gaps), single-answer grading is
unstable, and judges show **position bias** (GPT-4 only 65% consistent on order-swap),
**verbosity bias** (a "repetitive list" attack fools Claude-v1/GPT-3.5 91.3% of the time),
**self-enhancement bias**, and **misleadability** (a judge that can solve a problem alone
grades it wrong when shown a wrong answer). Later work confirms and systematizes this:
"Justice or Prejudice?" / CALM (2410.02736) catalogs 12 biases; "One Token to Fool
LLM-as-a-Judge" (2507.08794) shows a non-word symbol or a "Let's solve this step by step"
opener can trigger false-positive rewards across models, datasets, and prompts. The
self-rewarding line (Self-Rewarding LMs 2401.10020; CREAM 2410.12735) uses the model as its
own judge to bootstrap, and finds gains saturate as **bias accumulates** in the reward
loop. (Cross-link: `benchmark-validity-and-evaluation.md` section 6 shows the same
unreliability specifically in social settings, SOTOPIA, SOTOPIA-pi, Lifelong SOTOPIA
over-rating at long context, PersonaGym grading against an LLM-authored key.)

**Thread 4: the generator-verifier gap and verifier dynamics.**
"Mind the Gap" (Song et al. 2024, arXiv 2412.02674) formalizes a **generation-verification
gap** and finds a scaling phenomenon (it grows with pretraining compute), giving a
principled reason self-improvement can work: a model can sometimes verify better than it
generates. But "Variation in Verification" (2509.17995) tempers this: verification is
easier on easy problems and on weak generators' errors, and a verifier's skill tracks its
own problem-solving skill, so verifier scaling alone does not overcome hard cases.
ToolVerifier (2402.14158) applies self-verification to the agent surface this project cares
about: self-asking contrastive questions during **tool selection and parameter
generation** (a precedent for checking a tool/argument choice, though the project keeps
arg-filling with the runtime, not the verifier).

**Thread 5: deterministic vs learned verification (the boundary).**
A 2026 strand argues that where rules exist, deterministic verifiers beat neural judges:
VPRM (2601.17223) checks reasoning steps with rule-based verifiers and reports higher
coherence and F1 than neural-judge PRMs, calling neural judges "vulnerable to opacity,
bias, and reward hacking." This is the academic version of the project's hard rule: the
runtime (deterministic) owns physical truth; the learned predictor is advisory only.

### B.3 Maturity and open problems (Part B)

Verifiers for *checkable* domains (math, code) are mature and clearly beneficial (PRM >
ORM, GenRM > discriminative > judge). Verifiers for *non-checkable* domains (open-ended,
social, free-form) are actively contested: LLM judges are biased and gameable (2306.05685,
2410.02736, 2507.08794), self-rewarding saturates (2410.12735), and the generator-verifier
gap is real but bounded (2412.02674, 2509.17995). Open problems: process reward without
ground-truth references, robustness to superficial manipulation, and verification of
*embodied/social* outcomes that have no answer key, again exactly the project's regime.

---

## The 4-layer mapping

How each area informs the project's four WAM layers. (Reminder: physical predictions must
be reliable before social ones are meaningful, a social claim like "Bob can now mine"
depends on a physical fact like "Bob has a pickaxe with durability > 0".)

| Layer | Memory (Part A) | Verifiers / reward models (Part B) |
|---|---|---|
| Physical | Low direct relevance. Memory stores past physical events (what was mined/placed) for recall, but physical truth is owned by the runtime, not memory. | The deterministic runtime verifier already plays the ORM/PRM role for physical deltas; VPRM (2601.17223) is the academic case for keeping it rule-based, not learned. |
| Material / economic | Episodic memory of who owns/borrowed what; possession history retrievable across cycles (MemGPT-style external store). | Process-style per-delta checking (2305.20050) of inventory/container/possession changes; deterministic where possible. |
| Social | Core. Remembered obligations, promises, debts, relationship state (Generative-Agents reflection, MemGPT external memory, A-MEM linking). Memory IS the substrate for "memory commitments." | Core but cautioned. The advisory predictor (reason-then-verdict, GenRM-style) can predict/score social deltas that lack a deterministic checker, but an LLM judge must NOT be the primary social score (2306.05685, validity theme s6). |
| Institutional / settlement | Semantic memory: routines, roles, conventions distilled from many episodes; reflection-with-citations as the path from events to norms (2304.03442); cross-trajectory abstraction (2605.06716). | Long-horizon evaluation: process-style trajectory scoring, with the explicit warning that judges over-rate at long context (Lifelong SOTOPIA, in validity theme). |

---

## Relevance to the original query (mechanically-useful vs research-contribution)

The query asks whether a hierarchical model can "predict and evaluate" Minecraft action
consequences including "memory" and "social relations." These two areas are precisely the
academic homes of the "memory" noun and the "evaluate" verb.

**How external memory realizes "memory commitments" (Part A).** The query's "memory" is
not the LLM context window; it is the ability to *carry an obligation across cycles*. The
agent-memory field supplies the substrate: write the commitment to an external store
(MemGPT 2310.08560), retrieve it when relevant (RAG 2005.11401), distill recurring patterns
into norms (Generative-Agents reflection 2304.03442; A-MEM 2502.12110). The single most
transferable idea is Generative Agents' **reflection that cites the memory objects it is
built from**: in this project, a memory or relationship update should cite the runtime
artifact (inventory/container/chat/verifier id) that makes it true, a world-grounded
hardening of "(because of 1, 5, 3)."

- *Mechanically useful*: two-tier memory + tool-call read/write, retrieval scoring
  (recency x importance x relevance), reflection-with-citations, eviction/summary for
  context compaction. All are engineering the project can adopt onto its actor-workspace
  JSON records.
- *Research contribution it is NOT*: memory tooling is support, not the contribution
  (shared contract). Memory makes a commitment *persist and be retrievable*; it does not
  make the agent *honor* it. Whether the obligation is met is a behavior the runtime must
  verify.

**How the verifier/reward field is the home of "advisory-WAM-scored-against-evidence"
(Part B).** The project's advisory WAM is, in academic terms, a *verifier*: it predicts the
expected state and signals trust, and is itself scored against runtime evidence. That is
the FFDC pattern (`2605.06222-when-to-trust-imagination.md`): predict the expected future,
compare to the actual rollout, gate trust, where the prediction never fills args or
overrides the verifier. The field tells the project *how to shape and bound* such a
predictor:

- *Mechanically useful*: prefer **process/per-delta** checking over outcome-only
  (2305.20050), because it is interpretable and reward-hacking-resistant; shape the advisory
  output as **reason-then-verdict** (GenRM 2408.15240) so it is inspectable, not an opaque
  scalar; use **inference-time compute / order-swap / reference-guided** reliability guards
  (2408.15240, 2306.05685); mine **convincing-wrong** negatives for any social-transition
  verifier (2305.20050 active learning; FFDC synthetic corruptions).
- *Research contribution it is NOT*: a learned verifier is evidence tooling (support), not
  the contribution. And the explicit caution, carried from the validity theme: **an LLM
  judge must not be the primary social score.** The judge field's own results force this,
  judges are reliable mainly on large-gap, checkable calls (2306.05685: ~70% to ~100% with
  the quality gap) and are biased and gameable on close, free-form, long-context calls
  (2306.05685, 2410.02736, 2507.08794), which is exactly the project's regime. The primary
  social score stays the verified world artifact; the advisory predictor is a secondary,
  inspectable signal whose accuracy is itself measured against that artifact.

**One-sentence tie**: external memory is the academic substrate for the query's "memory
commitments remembered across cycles," and the verifier/reward-model field is the academic
home of the project's advisory-WAM-scored-against-evidence design, with the hard boundary
that deterministic runtime artifacts (not a learned LLM judge) remain the primary truth.
