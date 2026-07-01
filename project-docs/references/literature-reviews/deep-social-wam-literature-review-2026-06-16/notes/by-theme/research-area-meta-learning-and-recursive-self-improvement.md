# Research area: meta-learning, recursive self-improvement, and self-referential systems

Lane 27 (I4, wave 5) theme file. Audience: a newcomer to this sub-field. Jargon is defined on first use.
ASCII punctuation only.

This file covers the THEORY and LINEAGE of systems that improve their own learning process: meta-learning
(learning to learn), self-referential systems that modify their own update rule, the Goedel machine
(provably-optimal self-improvement), AI-GAs (the three pillars of an AI-generating algorithm), and the
recursive-self-improvement idea. It is the conceptual backbone of "자가발전" (self-development).

Central question for the area: **what does it formally mean for a system to improve itself, and what is
proven versus aspirational?** The short answer this literature gives: a system can improve its own learning
process, and that is real and demonstrated at one or a few levels (meta-learning); a system can in principle
rewrite all of itself toward an optimum, but the only version with a *guarantee* (the Goedel machine) is
practically unrealized, and every runnable version drops the guarantee. Unbounded recursive self-improvement
is aspirational.

Anchors:
- Original query: "Can a hierarchical action-conditioned world model predict and evaluate how Minecraft
  actions transform physical state, material economy, social relations, memory, and future action
  opportunities in an embodied open world?"
- Wave-4/5 thesis under test: an ENPIRE-style loop (reset, rollout, verify, refine), driven by a coding
  agent and grounded by the runtime VERIFIER as the success signal, is a natural, near-zero-cost,
  no-human-label way to autonomously improve the repo's advisory social-material WAM or actor policy, IF it
  stays advisory, stays verifier-grounded, and never lets the agent score its own success (progress
  laundering). The anchor instance is ENPIRE (`notes/by-paper/enpire.md`, PDF-verified, cited not rewritten).

Deconflict (cited, NOT duplicated):
- Lane H1 (`research-area-agentic-self-improvement-loops.md`) owns the *loop as a working system* (ENPIRE,
  Darwin Godel Machine, EvolveR, SAIL). This file owns the *theory and lineage* the loop instantiates.
- Lane H5 (`research-area-self-improvement-from-verifiable-rewards.md`) owns RLVR / self-play.
- Lane I2 owns STOP (2310.02304) as modern recursive code self-improvement; cited here, not covered.
- Lane H1 owns Darwin Godel Machine (2505.22954) as the modern empirical instance; cited, not redone.
- Lane I6 (limits/feasibility synthesis) judges whether these mechanisms *compound*; this file supplies the
  mechanisms and their stated bounds.

## 0. Glossary (defined once)

- **Meta-learning / learning to learn**: training over a *distribution of tasks* so the system improves its
  own *learning procedure* (initialization, optimizer, or learning rule), not just one task's solution.
- **Bilevel optimization**: a two-level problem where an outer optimization contains an inner optimization
  as a constraint. Meta-learning's standard formalization: inner loop adapts to a task, outer loop shapes
  the conditions so the inner loop adapts well.
- **Inner loop / outer loop**: inner = adaptation to a specific task (fast, few steps); outer = the
  meta-update that improves how the inner loop behaves (slow, across tasks).
- **Self-referential system**: a system that can read and modify its own code, *including the part that does
  the reading and modifying*. The formal root of "recursive self-improvement."
- **Recursive self-improvement (RSI)**: a system improving itself, then using the improved version to
  improve itself further, and so on. In theory unbounded; in practice observed at one or a few levels.
- **Provably-optimal self-improvement**: a self-rewrite applied only after a *proof* that it is beneficial
  (the Goedel machine). The proof gate is what makes it optimal and what makes it intractable.
- **AI-GA (AI-generating algorithm)**: Clune's term for an algorithm that automatically learns how to
  produce general AI, via three pillars (architectures, learning algorithms, environments).
- **Feedback / critic / verifier**: the proxy that scores whether the agent improved. The single most
  consequential design choice; if it can be gamed or drifts, the loop optimizes the measurement, not the
  task (Goodhart's law; the repo's name for the violation is **progress laundering**).
- **Intelligence explosion**: the speculative scenario where RSI compounds without bound into
  superintelligence. **Out of scope and unsupported** by the literature below; flagged wherever it appears.

## 1. The spectrum, from demonstrated to aspirational

The field is best read as a single axis: how many levels of self-improvement are *demonstrated*, and whether
there is a *guarantee*.

| Tier | What improves itself | Levels demonstrated | Guarantee? | Representative work |
|---|---|---|---|---|
| Meta-learning | the learning procedure (init/optimizer/rule) | exactly 2 (adapt + meta-update) | none, but reliable and measured | MAML (1703.03400); RL^2 (1611.02779); Learning to RL (1611.05763) |
| Self-referential nets | the update rule, by the net itself | architecturally N, empirically ~1 useful level | none | SRWM (2202.05780); VSML (2012.14905) |
| LLM self-modifiers | the agent's own code, via an LLM | feasibility demo, 1-few rounds | none (proof gate dropped) | Goedel Agent (2410.04444); STOP (2310.02304, lane I2) |
| Empirical RSI loops | a coding agent + archive | benchmark gains over rounds | none, empirical validation only | Darwin Godel Machine (2505.22954, lane H1); ENPIRE (anchor) |
| Provably-optimal RSI | any part of itself, proof-gated | zero (theoretical construction) | YES (global optimality) | Goedel machine (cs/0309048) |
| Unbounded RSI / intelligence explosion | everything, without limit | none | none | speculative; out of scope |

The pattern: the only tier with a *guarantee* has *zero* demonstrations (it is a math object), and every tier
with demonstrations has *no* guarantee. Nothing in this literature demonstrates unbounded recursion.

## 2. Meta-learning: the demonstrated, bounded core (the two-loop structure)

**MAML (Finn, Abbeel, Levine 2017, 1703.03400, LaTeX).** What it introduced: model-agnostic meta-learning as
bilevel optimization. The inner loop adapts an initialization theta to a task with a few gradient steps
(`theta_i' = theta - alpha * grad L_i`); the outer loop optimizes theta so that *post-adaptation* loss is low
(`theta <- theta - beta * grad sum_i L_i(theta_i')`), differentiating through the inner step. Why it matters
here: it is the cleanest definition of "an outer process improves an inner learning process," the structure
every later self-improvement system varies. Crucially MAML is *not* recursive self-improvement: exactly two
levels, converges to a fixed initialization, requires a held-out task distribution with ground-truth labels,
and the outer optimizer is not itself meta-learned. The meta-objective is measured on *held-out* data, which
is the meta-learning analogue of the repo's no-train-on-the-test-set rule.

**Meta-RL (RL^2, Duan et al 2016, 1611.02779; Learning to reinforcement learn, Wang et al 2016, 1611.05763,
both verified).** What they introduced: encode the *learning algorithm itself* in the weights of a recurrent
network, trained by a slow outer RL algorithm; the RNN's recurrent dynamics then implement a fast, separate
RL procedure that adapts within an episode. Why they matter: they are the first concrete "the learned thing
is a learning algorithm," AI-GAs pillar 2 in miniature. Still bounded: two levels, a fixed task distribution.
Surveyed alongside MAMBA (2403.09859) and the Meta-World benchmark (1910.10897) for breadth.

**Hospedales et al survey (2004.05439, LaTeX).** What it provides: the field's taxonomy. Meta-learning is
bilevel optimization broken along three axes - **meta-representation ("what" is learned: init, optimizer,
loss, architecture)**, **meta-optimizer ("how" the outer loop optimizes)**, and **meta-objective ("why":
few-shot, fast convergence, robustness)**. It positions meta-learning against transfer learning, continual
learning, multi-task learning, and AutoML/NAS (meta-learning is a specialization of AutoML when an explicit
meta-objective is optimized). The lineage root it cites is Schmidhuber's 1987 thesis. This is the map for the
whole area.

Takeaway for the repo: meta-learning names the *structure* an autoresearch loop borrows (outer recipe
optimization, inner actor/WAM learning, scored on held-out scenarios), but the repo does no gradient
meta-training. The mechanical import is the *discipline* (score on held-out data), not the method.

## 3. Self-referential systems: the architecture that can modify its own rule

**SRWM (Irie, Schlag, Csordas, Schmidhuber 2022, 2202.05780, LaTeX) and VSML (Kirsch & Schmidhuber 2021,
2012.14905, LaTeX).** What they introduced: networks whose *weights are their program* and that modify that
program at runtime. SRWM uses outer products and the delta rule to update all of itself, generating its own
key/value patterns and learning rates; "the initial weights also learn and encode its own self-modification
algorithm." VSML shows weight-sharing + sparsity (weights replaced by tiny LSTMs) suffices to express
learning algorithms, can implement backprop in forward-mode, and can "meta learn new LAs that differ from
online backpropagation." Why they matter: they revive Schmidhuber's 1990s self-referential nets and make the
"meta-learn to learn, meta-meta-learn to meta-learn, ..." story concrete. The honesty point: the *abstract*
invokes recursive self-improvement "in principle"; the *experiments* are few-shot learning and multi-task RL.
The recursion is architectural capacity, not a measured multi-level climb. After 30 years, the most direct
"learns to modify itself" architectures are validated on few-shot/multi-task tasks, not on demonstrated
unbounded recursion. Not mechanically adaptable to the repo (no weight training); they are the lineage that
bounds the RSI claim by example.

## 4. The Goedel machine: the only guarantee, and why it is unreachable

**Goedel machine (Schmidhuber 2003/2006, cs/0309048, LaTeX deep-read).** What it is: "the first class of
mathematically rigorous, general, fully self-referential, self-improving, optimally efficient problem
solvers." It is loaded with self-modifying code containing a problem solver and a *proof searcher*. The
searcher constructs `(switchprog, proof)` pairs until it proves a target theorem - "rewriting p through
switchprog implies higher utility than leaving p as is" - and only then applies the rewrite, which may
rewrite any part of itself including the searcher. The **Global Optimality Theorem** shows this is not greedy:
since "leaving p as is" implicitly evaluates all alternative rewrites p might find later, the first provably
useful rewrite is *globally optimal*, "no local maxima," assuming the axiom system is consistent.

Why it is the crux of the lane's honesty mandate (limitations stated by the paper itself):
- **Incompleteness bound**: "even a Goedel machine with unlimited computational resources must ignore those
  self-improvements whose effectiveness it cannot prove" (Goedel incompleteness: any system encompassing
  arithmetic has true-but-unprovable statements).
- **Pathological cases**: "one can construct pathological examples of environments and utility functions that
  make it impossible for the machine to ever prove a target theorem."
- **No implementation**: it is a theoretical construction; the proof search is asymptotically optimal but
  intractable in general (finding a proof is undecidable).

So the Goedel machine is the *ceiling* (provably-optimal recursive self-improvement) and simultaneously the
proof that the ceiling is unreachable in practice. It is the formal ancestor of the repo's "runtime owns
truth; LLM proposes" rule: it never rewrites itself on a hunch, only on a proof.

**Goedel Agent (Yin et al 2024, 2410.04444, LaTeX deep-read)** is the LLM-era bridge and the single most
important honesty data point. It is "inspired by the Godel machine," using monkey-patching to let an LLM
rewrite its own logic (and the code that does the rewriting) toward a high-level goal. The decisive design
move, stated in the source: it replaces "the proof search mechanism with an LLM." That keeps the recursive
*form* but discards the *guarantee*. Its own limitations section is candid: the experiments "demonstrate the
*feasibility* of recursive self-improvement," it cannot beat mature hand-engineered systems (e.g. OpenDevin),
it is prone to error accumulation, and - citing Yampolskiy - "a system capable of complete self-referential
[behavior] at the outset may lose this capability as it evolves" because understanding itself may require
"exponentially more intelligence." This is RSI in practice: a feasibility demo with documented degradation,
not unbounded improvement.

## 5. AI-GAs: the three-pillar lens for what a loop could and could not automate

**AI-GAs (Clune 2019, 1905.10985, LaTeX deep-read).** The thesis: rather than hand-design intelligence,
build an *AI-generating algorithm* that learns to produce general AI, via **three pillars**:
1. **Meta-learn architectures** (neural architecture search).
2. **Meta-learn the learning algorithms** (RL^2, plastic nets, SRWM/VSML live here).
3. **Generate effective learning environments** (autocurriculum; POET and GTN are the first steps).

Clune's own assessment: pillar 3 is "the least-studied, least-understood, and likely hardest," and "more
history-making discoveries await in this pillar than the other two." He flags that a fully-expressive
("Darwin Complete") environment generator may be "*too* expressive" and intractable, and recommends
constraining environments to a physics simulator to narrow the search and keep skills relevant. The paper is
explicit it is an agenda with one existence proof (Darwinian evolution) and large compute caveats; full
recursive self-improvement = all three pillars co-evolving, which "may not be practical in time."

This is the lens the thesis tie needs (Section 7).

## 6. Mapping to the 4 WAM layers

Meta-learning and RSI are method-level and cross-layer; what changes per layer is whether a layer's success
signal is good enough to drive an *outer* (meta) loop, which is the same dependency the H1 loop file found.

| Layer | Can an outer/meta loop be driven here? | Why |
|---|---|---|
| Physical | Yes | Deterministic runtime checks give an aligned, hard-to-game critic (Socratic feedback condition met); the layer where a meta loop's outer objective is trustworthy. |
| Material / economic | Mostly | Possession/control/transfer are checkable typed facts; critic still near-unbiased. |
| Social | Partly | Some social acts have checkable correlates; "trust"/"cooperation" are language-space and contested. Per Socratic Learning, "AI-feedback is exploitable, especially under distribution shift." |
| Institutional / settlement | Rarely | Long-horizon, contested, no crisp metric; resetting a social scenario for a comparable meta-evaluation is itself unsolved. |

Dependency the contract demands stay visible: physical predictions must be reliable before social ones are
meaningful, so any meta loop should shape the Physical/Material layers first; run naively at the
Social/Institutional layers it will stagnate or game its metric.

## 7. The WAM tie to land (the AI-GAs three-pillar lens)

AI-GAs' three pillars are a clean way to say exactly which corner of "self-improvement" an autoresearch loop
over this repo could automate, and which it could not:

- **Pillar 1 (architectures): out of scope.** The repo's policy is a fixed foundation model; it is not
  searching neural architectures.
- **Pillar 2 (learning algorithm): partial and bounded.** A verifier-graded loop could tune a *recipe*
  (prompts, memory-principle curation, advisory-WAM parameters, skill-candidate acceptance thresholds). That
  is a thin slice of "meta-learn the learning algorithm," in the MAML sense of shaping the inner loop's
  conditions - not learning a new optimizer from scratch, and emphatically not self-referential weight
  modification.
- **Pillar 3 (environments): the repo's natural fit.** Generating Minecraft *social scenarios* (seeded
  worlds, scripted preconditions, obligation ledgers) is pillar-3-style environment generation. The methods
  are POET/OMNI (owned by lane 21); the repo adapts them at the scenario level, and Clune's own guard
  (constrain the generator to a simulator) is already satisfied by the Minecraft runtime.

**The modest, defensible claim**: the repo targets *pillar-3-style scenario generation plus pillar-2-flavored
verifier-graded recipe tuning*. It does not attempt pillars 1+2+3 combined, self-referential self-rewriting,
or recursive self-improvement. The strongest theoretical support and the sharpest bound both come from this
lane:
- Support: Schaul's Socratic Learning says closed-loop improvement works *if* feedback is an aligned,
  hard-to-exploit proxy that stays aligned - which the repo's deterministic verifier is, at the
  Physical/Material layers.
- Bound: the Goedel machine proves the optimum requires a proof gate that is intractable; Goedel Agent shows
  that dropping the gate (LLM judgment) yields feasibility demos with degradation; SRWM/VSML show even direct
  self-modifying architectures stay shallow; the Utility-Learning Tension result (2510.04399) proves that
  when capacity can grow without limit, "utility-rational self-changes can render learnable tasks
  unlearnable." So the repo should expect a few verifier-gated rounds, not unbounded recursion.

**Intelligence-explosion framing is out of scope and unsupported** by every paper in this lane. The Goedel
machine (the only guaranteed RSI) is unrealized; the runnable systems are feasibility demos. Do not frame
repo work as a step toward unbounded recursive self-improvement.

## 8. Mechanically useful vs research contribution (for this repo)

- **Mechanically useful (engineering this repo can borrow)**:
    - the bilevel discipline from MAML: an outer loop optimizes a recipe so the inner actor/WAM does better,
      scored on *held-out* scenarios, never on the data the recipe was tuned on;
    - the AI-GAs three-pillar vocabulary to scope claims precisely (pillar 3 scenario generation + a slice of
      pillar 2 recipe tuning, not the full program);
    - Clune's pillar-3 pragmatic guard (constrain the scenario generator to the runtime, do not free-form
      synthesize worlds);
    - Socratic Learning's three-condition checklist (aligned hard-to-exploit feedback; preserved coverage;
      scale) as a per-layer gate before running a loop;
    - the Goedel-machine design principle (gate self-modification on an authoritative external check, and
      keep that check authoritative over the proposer) - which the repo already implements as the runtime
      verifier.
- **NOT a research contribution this repo should claim**: a Goedel machine, a self-referential self-improver,
  an AI-GA, or "recursive self-improvement for Minecraft." These are theory/lineage, not method imports the
  repo can present as novel. The honest research question this lane sharpens is narrow: *which corner of the
  AI-GAs pillars can a verifier-grounded loop actually automate over this repo (answer: pillar-3 scenario
  generation + a thin pillar-2 recipe slice), and where does the guarantee disappear (answer: the moment the
  gate stops being an authoritative, hard-to-game verifier, which is at the Social/Institutional layers)?*

## 9. One-line ties

- To the original query: meta-learning/RSI is *how* one might build/refine the hierarchical WAM the query
  asks about, but the demonstrated, guaranteed end of the spectrum is shallow (two-level meta-learning), and
  only the Physical/Material layers have a critic clean enough to drive even that.
- To the autoresearch thesis: **supported as a bounded recipe loop, not as recursive self-improvement.** The
  repo can run a pillar-3 + thin-pillar-2 loop gated by the deterministic verifier (Socratic feedback
  condition met at lower layers); it cannot and should not claim self-reference, provable optimality, or
  unbounded recursion (Goedel machine unrealized; Goedel Agent a feasibility demo; SRWM/VSML shallow;
  utility-learning tension a formal counterweight).

## 10. Recommended next questions

1. What is the smallest pillar-2 recipe surface worth meta-tuning over the repo (prompt template knobs,
   memory-principle curation thresholds, skill-acceptance thresholds), such that the outer loop's objective
   stays measurable on held-out scenarios?
2. For pillar-3 scenario generation, can a POET-style complexify-when-solved rule be run over *social*
   scenarios while keeping the Physical/Material verifier as the only scorer (so generation is open-ended but
   scoring stays grounded)?
3. Where exactly does the Socratic feedback condition fail as the loop climbs layers, and can that boundary
   be detected at runtime (e.g. a verifier-confidence or invariance-probe signal that says "this layer's
   critic is now exploitable, stop the loop")?
4. Does the Utility-Learning Tension result (capacity growth makes learnable tasks unlearnable) bind the repo
   in practice, given the policy is a fixed-capacity LLM and only the recipe/scenarios vary? (Likely not the
   weight-capacity version, but the analogous "scenario distribution drift erodes the verifier's coverage"
   version may; worth formalizing.)
