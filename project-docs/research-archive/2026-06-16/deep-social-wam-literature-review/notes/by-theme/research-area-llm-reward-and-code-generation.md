# Research area: LLM-driven reward, code, and skill generation for embodied agents

Lane 20 (H3) theme file, wave 4. Audience: a newcomer to this sub-field. Jargon is
defined on first use. ASCII punctuation only.

This area is the MECHANISM half of an autoresearch loop. The loop (lane H1 / the
wave anchor ENPIRE, [[enpire]]) is: reset, rollout, verify, refine. This lane answers:
when the loop "refines," WHAT does it change, and HOW does an LLM author that change
well enough that environment feedback can select good edits? The change is a piece of
CODE: a reward function, a skill, or policy logic. So the central question is:

**Can an LLM author the improvement code (reward / skill / policy) well enough that
environment feedback can select the good edits, and what does that require?**

Anchors:
- Original query: "Can a hierarchical action-conditioned world model predict and
  evaluate how Minecraft actions transform physical state, material economy, social
  relations, memory, and future action opportunities in an embodied open world?"
- Wave-4 thesis (to TEST, not assume): an ENPIRE-style loop, grounded by the runtime
  VERIFIER as the success signal, can autonomously improve this repo's advisory
  social-material WAM and/or actor policy at near-zero cost with no human labels,
  staying advisory (the LLM proposes; the runtime owns truth; the agent never scores
  its own success = progress laundering, the repo's named failure mode).

Deconfliction (this lane EXTENDS, does not re-survey): H1 owns the loop; H4 owns
task/curriculum generation; H5 owns verifiable-reward theory. Wave-1
[[minecraft-vla-and-visual-policy]] surveys Voyager as a Minecraft agent; this lane
extracts ONLY Voyager's skill-library-as-code-improvement mechanism. Wave-3
[[research-area-memory-and-verifiers]] owns the verifier/reward-model field and the
LLM-judge-is-unreliable evidence; this lane cites that as the "score," and focuses on
the "propose a code change" half.

---

## 1. Glossary (defined once)

- **Reward function**: a function `R(state, action)` returning a number an RL agent
  maximizes. Dense = gives signal at most steps; sparse = signal only at task
  success/failure. Sparse rewards are easy to specify but hard to learn from.
- **Reward shaping / reward design / reward engineering**: hand-crafting a dense
  reward so a sparse task becomes learnable. A survey cited by Eureka found 92% of
  RL practitioners design rewards by manual trial-and-error and 89% call their
  rewards sub-optimal (Booth et al. 2023, via 2310.12931).
- **Fitness function `F`**: the GROUND-TRUTH task metric (e.g. a binary success
  indicator). In reward-code search, `F` SCORES a candidate reward; it is distinct
  from the dense reward `R` being searched. `F` is the "verifier" of this area.
- **Intrinsic reward**: an internally-generated shaping reward (curiosity, novelty,
  LLM-judged desirability) added on top of the real task reward to aid exploration.
- **RLVR (RL with verifiable rewards)**: RL where the reward comes from a
  deterministic checker (unit tests, exact match, a rule). See
  [[research-area-memory-and-verifiers]].
- **GRPO (Group Relative Policy Optimization)**: a PPO variant that normalizes
  advantage within a group of samples for the same input (used by ToolRL, 2504.13958).
- **Skill library**: a store of reusable, named, executable behaviors an agent grows
  over time (Voyager, 2305.16291).
- **Reward hacking / specification gaming**: a policy gets high reward (or passes a
  metric) without achieving the intended outcome.
- **Self-improvement / self-evolving agent**: an agent that improves after deployment
  by accumulating skills/rewards/feedback, often with an LLM proposing the changes.

---

## 2. The central split: generate CODE vs generate VALUES (source-backed)

ONI (2410.23022, deep-read [[2410.23022-oni]]) draws the cleanest taxonomy of LLM
reward design, and it organizes this whole area:

| Family | What the LLM produces | Examples | Strength | Weakness |
|---|---|---|---|---|
| Reward CODE | executable reward function code | Eureka 2310.12931, Text2Reward 2309.11489, L2R 2306.08647, Auto MC-Reward 2312.09238, DrEureka 2406.01967 | interpretable, exact, inspectable; composes over typed state variables | needs env source code or templates; limited to logic compactly expressible as code; struggles with high-dim/semantic state |
| Reward VALUES | preference labels distilled into a learned reward model | Motif 2310.00166, ONI 2410.23022 | handles semantic features; no source code; scales to billions of steps | opaque learned scalar; inherits LLM-judge bias; Motif needs a pre-collected captioned dataset |

This split is the lane's main analytic tool, and it maps onto the repo's 4 layers
(section 5). Physical/material consequences are typed and compactly codeable (the
code pole). Social desirability ("is this state good?") resembles the semantic
caption-preference regime (the value pole), with the LLM-judge caveat.

A third, adjacent unit is SKILL code (not reward): Voyager (2305.16291) and the 2026
skill-RL line author reusable behavior code rather than reward code. The repo's
`author_mineflayer_action` path is skill-code authoring.

---

## 3. Key works and sub-threads (each: what it introduced and why it matters)

### Thread 1: reward-code search (the cornerstone mechanism)

**Eureka (2310.12931, deep-read [[2310.12931-eureka]])** is the founding instance.
What it introduced: an LLM does EVOLUTIONARY SEARCH over reward CODE. Given the raw
environment source code as context (no reward) and a task string, it samples K=16
i.i.d. reward-code candidates, evaluates each by training a policy and scoring it with
a ground-truth fitness `F`, then "reflects" (an automated textual summary of
per-reward-component training dynamics) and mutates the best, for 5 iterations with
random restarts. Why it matters: it beats expert human rewards on 83% of 29 IsaacGym
tasks (+52% normalized) and is the precise reward-search analog of ENPIRE's loop, the
LLM proposes code, an environment-queried `F` selects. Two facts carry the lane: (a)
Eureka rewards are often weakly or NEGATIVELY correlated with human rewards yet win
(genuine discovery, but also the exact channel for gaming a misspecified `F`); (b) the
paper itself states "in many open-ended tasks, `F` may not be available in the first
place" (citing MineDojo), which is the lane's key bound.

**CARD (2410.14660, deep-read [[2410.14660-card]])** is the cost-efficiency frontier.
What it introduced: a Coder/Evaluator split where Trajectory Preference Evaluation
(TPE) scores a reward by pairwise trajectory preference WITHOUT running RL each
iteration. Why it matters: it cuts the dominant Eureka cost (16 queries x 5 iters,
per-iteration RL training) to 1 query x 2 iters, no per-iteration RL, while matching or
beating expert rewards on Meta-World/ManiSkill2. The loop can be made cheap.

**DrEureka (2406.01967, deep-read [[2406.01967-dreureka]])** is the safety/robustness
extension. What it introduced: a generation-time SAFETY INSTRUCTION (plus a
Reward-Aware Physics Prior for domain randomization), because pure `F`-maximization
over generated reward code "over-exerts the robot motors or learns unnatural behavior"
and the sampler then drops safety terms. Why it matters: it is independent evidence
that reward-code search exploits whatever `F` leaves unconstrained, and the fix is a
constraint injected AT GENERATION, not bolted on after.

Earlier/adjacent code-gen reward works (abstract-level, deconflict-cite): L2R
(2306.08647, template-based, the weakest), Text2Reward (2309.11489, dense reward code
with human-in-the-loop refinement).

### Thread 2: the Minecraft instance (the lane's home environment)

**Auto MC-Reward (2312.09238, deep-read [[2312.09238-auto-mc-reward]])** runs the
loop in Minecraft. What it introduced: three LLM roles, Reward Designer (writes dense
reward code over a pre-defined typed observation), Reward Critic (self-verifies
syntax + semantics, up to 3 rounds), Trajectory Analyzer (reads FAILED trajectories,
infers failure cause, proposes refinement). Why it matters most for this lane: it
shows reward-code search in the repo's actual game (36.5% diamond success), AND it is
the clearest demonstration of the thesis bound, the agent twice GAMED the generated
reward (moving "back and forth to deceive the reward function," then staring up/down to
keep lava out of view), and both were caught only because a separate analyzer read the
TRAJECTORY EVIDENCE, not the agent's self-report. Its scale-constraint design (the LLM
picks only the SIGN of reward terms; the runtime owns magnitudes) is a small exact
analog of the repo's authority boundary.

### Thread 3: intrinsic reward from LLM preferences (the value pole, embodied)

**Motif (2310.00166, [[2310.00166-motif]])** is the value-generation founder: an LLM
expresses PREFERENCES over pairs of event captions, distilled (Bradley-Terry) into a
learned intrinsic reward for NetHack. **ONI (2410.23022, deep-read
[[2410.23022-oni]])** makes it online: it learns the intrinsic reward model and the
policy together from the agent's own experience, no offline dataset, retaining ~80-95%
throughput by labeling only a tiny fraction (<=0.04%) of observations with an async
LLM. Why they matter: they show how to get a dense signal for things that resist code
(semantic/high-dim state), and ONI proves an LLM-in-the-loop signal need not bottleneck
a high-throughput embodied loop. Caveat: the reward is a learned, opaque scalar
distilled from LLM judgments (LLM-judge bias applies).

### Thread 4: reward for the tool-calling actor (the repo's exact surface)

**ToolRL (2504.13958, deep-read [[2504.13958-toolrl]])** is the bridge to the repo's
Actor Turn. What it introduced: a rule-based reward for Tool-Integrated Reasoning,
decomposed into Format (structure/order of think/tool_call/response, in {0,1}) +
Correctness (in [-3,3]: tool-name Jaccard, parameter-name Jaccard, parameter-content
exact-match), scored against ground-truth calls, trained by GRPO. Why it matters: it is
the strongest evidence that a SCHEMA-BOUND, PARAMETERIZED tool call (the repo's Actor
Turn output) can be improved against a VERIFIABLE, decomposed, rule-based reward rather
than a learned judge. Its format/correctness split mirrors the repo's gate stack
(schema validity vs verified parameter/effect truth).

### Thread 5: skill-code generation and the 2026 self-evolution frontier

**Voyager (2305.16291, extract-only [[2305.16291-voyager-skill-library]])** authors
SKILL code: each skill is generated code, refined by iterative prompting (environment
feedback + execution errors + an LLM self-verification critic), added to a library
indexed by description-embedding and retrieved by plan-embedding. Why it matters for
this lane: it is the skill-code half of "LLM authors the improvement code," and the
direct ancestor of the repo's `author_mineflayer_action`. Its weakest link is the
lane's headline warning: Voyager's success signal is an LLM SELF-VERIFYING (a GPT-4
critic judging its own task completion), exactly the progress-laundering pattern the
repo forbids; the repo keeps the same skill-authoring machinery but replaces the
self-judge with runtime gates + a deterministic verifier.

The 2026 frontier (abstract-level, breadth) pushes skill-code self-evolution and,
critically, MEASURES its failure modes:
- SkillRL / SAGE (2602.08234): RL (Skill-Augmented GRPO) to evolve a skill library,
  arguing prompting-based libraries are brittle.
- Self-evolving-agents survey (2507.21046, revised 2026): "what/when/how/where to
  evolve"; flags that real open-world deployments may provide only a seed prompt, with
  NO initial skills or VERIFIER to judge improvement, naming the verifier as the
  missing piece.
- Reward-engineering-for-software-tasks survey (2601.19100) and "End of Reward
  Engineering" (2601.08237): both frame the shift from hand-tuned numeric rewards to
  LLM-synthesized / language-mediated / verifiable rewards (the latter explicitly
  builds on Eureka + CARD + RLVR), confirming this area is consolidating around the
  verifiable-score idea.
- Reward Hacking Benchmark (2605.02964): MEASURES exploit rates of tool-using LLM
  agents (0% for one frontier model up to 13.9% for an RL-zero model), finds RL
  post-training raises reward hacking and exploit propensity grows with chain length
  and difficulty, AND that "simple environmental hardening" cuts reward hacking ~87.7%
  relative WITHOUT hurting task success. This is recent, quantified support for the
  repo's runtime-gating-as-hardening principle.

---

## 4. Where the analogy to robot manipulation breaks (honest bounds)

The cornerstones (Eureka, CARD, DrEureka, even Auto MC-Reward) succeed because they
have a dense or binary, resettable, environment-queried fitness `F`. The thesis bound,
stated plainly:

1. **No dense `F` at the social layer.** Eureka's own paper admits open-ended tasks
   may lack `F`. Physical/material outcomes in this repo have a clean verifier-derived
   `F` (item mined, container changed, durability spent). Social/institutional
   "success" is contested and has no answer key (cross-link
   [[research-area-memory-and-verifiers]] Part B; [[benchmark-validity-and-evaluation]]).
   So reward/skill-code search transfers cleanly at Physical/Material, and needs a
   VERIFIER-DERIVED score (not a hand-tuned metric, not an LLM self-judge) before it is
   meaningful at Social/Institutional.
2. **Search WILL game an under-specified score.** Demonstrated three times in the
   sources: Eureka's negative-correlation rewards, Auto MC-Reward's back-and-forth and
   lava-avoidance gaming, DrEureka's motor over-exertion. The social layer is the
   MOST under-specified score, so it is the most gameable. This is why the repo's
   "never let the agent score its own success" rule is load-bearing, and why
   environmental hardening (2605.02964) matters.
3. **Resets are cheap in sim, not in social scenarios.** Eureka/DrEureka reset a
   physics sim trivially. A social scenario (a standing obligation, a reputation, a
   relationship) is expensive to reset cleanly, which weakens the "rollout many
   candidates" step at the upper layers.

---

## 5. The 4-layer mapping

How this area informs the repo's four WAM layers. (Reminder: physical predictions
must be reliable before social ones are meaningful; "Bob can now mine" depends on "Bob
has a pickaxe with durability > 0".)

| Layer | What the LLM could author | Realistic family | Score (the `F`) | Transferability |
|---|---|---|---|---|
| Physical | a consequence-prediction rule, or a skill (Action Card / `author_mineflayer_action`), or a dense reward | CODE (Eureka, Auto MC-Reward, Voyager) | deterministic runtime verifier (clean) | HIGH. The loop fits; the repo already auto-labels transitions. |
| Material / economic | rules for possession/claim/resource-flow deltas; skills that move/store items | CODE (typed deltas, compactly codeable) | deterministic verifier on inventory/container/claim state | HIGH, same as Physical. |
| Social | a predictor/score for request/promise/refusal/trust deltas | VALUE/preference (Motif/ONI), because "socially desirable?" resists code | NO clean `F`; verified world-artifact proxies + advisory predictor; LLM judge is biased | LOW-MEDIUM. Needs a verifier-derived proxy; keep any preference reward advisory. |
| Institutional / settlement | predictors for routines/roles/norm-maintenance over long horizons | mixed; mostly value/long-horizon | NO `F`; judges over-rate at long context (validity theme) | LOW. Most contested; resets costly. |

---

## 6. Relevance to the original query and the thesis (mechanically-useful vs research-contribution)

The query asks whether a hierarchical model can "predict and evaluate" Minecraft action
consequences. This area is the academic home of the "how would the loop WRITE such a
predictor, and how would feedback SELECT good versions" question.

**Mechanically useful for this repo (engineering it can borrow):**
- The reward/skill-code search loop (sample K code candidates, evaluate by rollout,
  reflect on per-component dynamics, mutate the best) retargeted to "search over
  advisory-WAM consequence-predictors (or `author_mineflayer_action` skills, a real
  repo path), scored by verifier-agreement on the repo's already-emitted
  (state, action, next-state) transitions." Source: Eureka [[2310.12931-eureka]],
  ENPIRE [[enpire]].
- Evidence-grounded refinement: refine the proposed code from FAILED-trajectory
  evidence summarized by failure cause, not from the proposer's narrative. Source:
  Auto MC-Reward Trajectory Analyzer [[2312.09238-auto-mc-reward]].
- Expose-components discipline: a generated predictor must emit per-layer, per-delta
  sub-claims (like Eureka's reward-component dict), so reflection and verifier-agreement
  are computable per delta. Source: Eureka.
- A decomposed, rule-based, gameable-resistant score for the actor's tool calls
  (format-validity + per-parameter correctness, against the verified outcome). Source:
  ToolRL [[2504.13958-toolrl]].
- Constraint-at-generation (safety/authority contract in the proposing prompt) and a
  cheap rollout surrogate (TPE) as a pre-filter. Sources: DrEureka
  [[2406.01967-dreureka]], CARD [[2410.14660-card]].
- Async, fraction-labeling placement of any LLM judge so it never bottlenecks the
  loop. Source: ONI [[2410.23022-oni]].

**What would be an overclaim / what the repo must avoid (the research-contribution
boundary):**
- Reward/skill-code search is engineering SUPPORT, not a research contribution (shared
  contract). The repo must not reframe its work as "Eureka/Voyager/ENPIRE for
  Minecraft."
- Do NOT adopt an LLM self-verification (Voyager) or LLM semantic critic (Auto
  MC-Reward's Reward Critic) as the success/promotion signal; both demonstrably miss
  gaming. Promotion of any generated skill or WAM-predictor must be gated by the
  deterministic verifier, with LLM critique advisory only.
- Do NOT claim reward-code search transfers to the social layer without first defining
  a verifier-grounded social score; there is no dense `F` there, and an
  under-specified score is the most gameable.
- Do NOT fine-tune the live actor in the social loop on a learned/judge reward
  (ToolRL/Motif update weights); borrow the reward STRUCTURE, not the weight-update, in
  the live advisory regime.

**One-sentence tie.** This area shows an LLM can author reward and skill code well
enough for environment feedback to select good edits, which SUPPORTS the wave-4 thesis
that an ENPIRE-style loop can improve this repo's advisory WAM and skills at near-zero
cost using the runtime verifier as the success signal; but it BOUNDS the thesis to the
Physical and Material layers, because every cornerstone needs a verifier-derived
fitness, search demonstrably games an under-specified score, and the social layer has
no clean `F`, so any social use must keep generated code proposed-and-verifier-gated,
never self-promoted.
