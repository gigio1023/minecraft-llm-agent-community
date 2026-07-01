# Research area: Open-ended automated curriculum and task/environment generation

Lane 21 (H4, wave 4) theme file. Audience: external team / newcomer. This area asks what an
autoresearch loop should attempt NEXT: methods that generate tasks, environments, or goals and
order them by *learnability*, so a system keeps improving instead of saturating. It is written
through the wave-4 autoresearch lens and anchored to ENPIRE (`notes/by-paper/enpire.md`).

Punctuation: ASCII only. Jargon is defined on first use.

## 0. Deconfliction (what this file does NOT re-survey)

- **H3 (sibling lane) owns reward/skill CODE generation** (Eureka-style reward design, skill
  synthesis). This file owns **task / environment / goal generation and ordering**. Where they
  meet (an LLM writing environment code that also contains a reward), this file treats the
  *scenario/environment* as the artifact and points to H3 for the reward function itself.
- Wave-1 `minecraft-agent-benchmarks` owns MineDojo, MCU, Odyssey, Plancraft, MineExplorer,
  MineNPC-Task (how Minecraft tasks are *scored*). This file cites them as the *task space* and
  the *verification machinery*, and does not re-describe them.
- Wave-1 `minecraft-multi-agent-social` owns multi-agent social Minecraft setups.
- Wave-3 `research-area-agent-based-economic-simulation` owns scenario design for the material
  economy (Sugarscape, AI Economist, EconAgent). This file borrows its "seed actors, run forward,
  recover a known regularity" discipline for *how to validate* a generated social scenario.
- Wave-3 `research-area-memory-and-verifiers` owns the verifier machinery this file leans on as
  the success signal.

## 1. The central question (one line)

How do you keep generating new challenges that are **solvable-but-not-trivial** for the current
system (the "frontier of learnability"), and **worth solving** (interesting), so the system keeps
improving without (a) saturating on easy variations or (b) wasting effort on the impossible?

## 2. Glossary (defined once)

- **Open-endedness**: the property of a process that keeps producing novel, increasingly complex
  artifacts without a fixed endpoint (the inspiration is natural evolution). (POET, 1901.01753;
  Hughes et al. 2406.04268.)
- **Automatic Curriculum Learning (ACL)**: "a family of mechanisms that automatically adapt the
  distribution of training data by learning to adjust the selection of learning situations to the
  capabilities of [the] agents" (Portelas et al. survey, 2003.04664). It is a special case of
  meta-learning (learn *what to train on next*).
- **Learnability / learning progress (LP)**: a task is learnable if it is at the frontier of the
  agent's current competence (not always-failed, not already-mastered). LP = the recent change in
  success probability on a task; high LP = the agent is currently improving on it (Oudeyer et al.;
  Kanitscheider et al.; used by OMNI 2306.01711 and MAGELLAN 2502.07709).
- **Minimal criterion (MC)**: a generated environment is admitted only if it is "neither too hard
  nor too easy" for current agents; from minimal-criterion coevolution (MCC), made concrete by POET
  (1901.01753) as a score band (e.g. 50 <= score <= 300).
- **Unsupervised Environment Design (UED)**: framing curriculum as a game between an environment
  *generator* and the *policy*, where the generator proposes environments (often by maximizing
  *regret* = gap between the best achievable return and the policy's return). PAIRED (2012.02096),
  ACCEL (2203.01302).
- **Quality-Diversity (QD)**: search that returns not one best solution but a *map* of diverse
  high-performers across chosen "behavior" dimensions. MAP-Elites (1504.04909) is the canonical QD
  algorithm; "cell coverage" of such a map is a standard diversity metric.
- **Interestingness / Model of Interestingness (MoI)**: a judgment of whether a task is worthwhile
  and novel (beyond merely learnable). OMNI (2306.01711) delegates this to a foundation model (FM),
  since hand-coded interestingness formulas get gamed (Goodhart's law).
- **Autotelic agent**: an agent that sets its own goals (Colas et al.). MAGELLAN (2502.07709) is an
  autotelic LLM agent that prioritizes goals by predicted LP.
- **ANNECS**: Accumulated Number of Novel Environments Created and Solved; a domain-general progress
  meter that counts an environment only if it passed the MC at creation AND was eventually solved
  (Enhanced POET, 2003.08536). ANNECS-OMNI adds a third, FM-judged "interesting" criterion
  (OMNI-EPIC, 2405.15568).

## 3. Key works and sub-threads (genealogy, source-backed)

Each item leads with what it introduced and why it matters.

### 3a. Open-endedness via coevolving environments and agents (the spine)

- **POET (1901.01753, Wang/Lehman/Clune/Stanley 2019)**. Introduced: pairing environment
  *generation* with agent *optimization*, with an explicit **minimal criterion** (admit a generated
  environment only if it is not-too-easy and not-too-hard for current agents) and **stepping-stone
  transfer** (reuse a policy that worked elsewhere). Why it matters: it is the cleanest statement of
  this lane's central question and shows that an open-ended loop reaches challenges that direct
  optimization and even a hand-built direct-path curriculum cannot. It also supplies the honest
  caution: open-ended systems "by definition cannot be asked to reproduce a defined target result,"
  so evaluation is genuinely hard.
- **Enhanced POET (2003.08536, same group, ICML 2020)**. Introduced: **PATA-EC** (a domain-general
  novelty signal: an environment is meaningfully novel if it re-orders all agents by performance),
  a CPPN (unbounded) environment encoding, and **ANNECS** (count an environment only if novel + MC
  + eventually solved). Why it matters: ANNECS is the field's first domain-general, *solve-grounded*
  progress meter; original POET's ANNECS plateaus (~20k iterations, fixed encoding), Enhanced POET's
  rises near-linearly. ANNECS is the shape of the right metric for a verifier-grounded loop.
- **DeepMind open-ended RL line**: "Open-Ended Learning Leads to Generally Capable Agents" (XLand,
  2107.12808) and "Human-Timescale Adaptation in an Open-Ended Task Space" (AdA / XLand 2.0,
  2301.07608). Introduced: massively multi-task procedurally-generated task spaces with a
  dynamic curriculum, producing agents that adapt to held-out tasks at human timescale. Why it
  matters: evidence that open-ended task spaces + curriculum yield *generalist* (not specialist)
  agents - but at industrial compute scale (abstract-level here).

### 3b. Unsupervised Environment Design (regret-based generation)

- **PAIRED (2012.02096, Dennis et al. 2020)**. Introduced: UED as a game where an adversary
  generates environments to maximize the *regret* of a protagonist policy (measured against an
  antagonist), yielding environments at the frontier and zero-shot transfer. Why it matters: regret
  is a principled "learnable + solvable" surrogate that avoids both trivial and impossible
  environments (abstract-level).
- **ACCEL (2203.01302, Parker-Holder et al., ICML 2022)**. Introduced: *evolving* a curriculum by
  editing high-regret levels (small mutations) rather than generating from scratch, giving a
  smoother difficulty ramp. Why it matters: shows curriculum design as incremental environment
  *editing*, cheaper and more stable than de-novo generation (abstract-level). CLUTR (2210.10243)
  is a related thread that learns a task-representation manifold first, then runs UED on it.

### 3c. Quality-Diversity and the "interestingness" problem

- **MAP-Elites (1504.04909, Mouret/Clune 2015)**. Introduced: illuminate a search space by keeping
  the best solution in each cell of a chosen behavior grid, returning a diverse *map* not a single
  optimum. Why it matters: the diversity backbone of open-endedness; "cell coverage" is the standard
  diversity metric reused by OMNI-EPIC. QD-through-AI-Feedback (2310.13032) replaces the hand-chosen
  behavior axes with an LLM judge (abstract-level).
- **OMNI (2306.01711, Zhang/Lehman/Stanley/Clune, ICLR 2024)**. Introduced: the key distinction that
  learnable is not enough - infinitely many learnable-but-*boring* tasks remain (minor variations) -
  and that an FM can serve as a **Model of Interestingness** because it internalized human notions of
  interestingness. Why it matters: it cleanly separates the two filters this lane needs (learnability
  = measurable/verifier-friendly; interestingness = FM-judged/contestable), tested in Crafter (a 2-D
  Minecraft) where "boring tasks = collect-N-wood numerical repeats." It also states the Goodhart
  caution explicitly: hand-coded novelty metrics get gamed.

### 3d. LLM-generated environments and goals (the autoresearch-relevant edge)

- **OMNI-EPIC (2405.15568, Faldor/Zhang/Cully/Clune, ICLR 2025)**. Introduced: an LLM that generates
  the task (natural language), the *environment code* (Gymnasium reset/step/reward/terminated), and a
  separate **success detector** `get_success`, with an archive of successes+failures retrieved by
  similarity (RAG) as stepping stones. Why it matters for the thesis: it is the closest existing
  analog of an autoresearch loop that generates situations *and* their checks, and it makes the
  decisive design choice - keep the *success-checker separate from the shaped reward* because the
  success-checker "does not affect how the agent learns" and is thus "less susceptible to reward
  hacking." It also found VLMs too unreliable as success detectors, so it uses code. (See section 6
  for why the repo's hand-authored verifier is stronger than OMNI-EPIC's auto-generated one.)
- **Eurekaverse (2411.01775, Liang et al., CoRL 2024)**. Introduced: LLM environment-curriculum
  generation as **code** (parkour terrain as a height-field + goals), with **agent-environment
  co-evolution** (evolve the environments that trained the best policy) and a validity check that
  filters impossible terrains. Why it matters: the strongest *verified-transfer* evidence in this
  lane - the generated curriculum beats human-designed courses and transfers to a real robot - which
  also marks the boundary (it works because parkour success is physically clean).
- **MAGELLAN (2502.07709, Gaven et al., Inria Flowers 2025)**. Introduced: a *metacognitive*
  learnability predictor - a goal-conditioned competence head on the agent's own LLM latent, so
  updating competence for one goal generalizes to semantically similar goals; LP = |C_t - C_{t-N}|;
  goals selected by a bandit over predicted LP. Why it matters: the LLM-native, scalable answer to
  "which goal is at my frontier?" - and a clean bridge to using an advisory WAM for scenario
  *selection*. It is purely a learnability method (no interestingness model), i.e. the
  verifier-groundable half of OMNI.
- **DiCode "Dreaming in Code" (2602.08194, Mitsides/Faldor/Cully 2026)**. Introduced: the OMNI-EPIC
  lineage's attempt to orchestrate *sustained progression* (sequences of consistently-learnable
  experiences) rather than discovering isolated behaviors. Why it matters: it names exactly the open
  problem for a social curriculum - it is easy to generate one interesting scenario, hard to generate
  a learnable *sequence* (abstract-level).

### 3e. LLM self-improvement via self-generated curricula (autoresearch core, deconflict with H1/H2/lane-19)

These generate their own training tasks and improve from them; they are the autoresearch lens applied
to LLM reasoning, adjacent to (not owned by) this lane. Logged abstract-level, tagged `autoresearch`.

- **OpenSIR (2511.00602)** and **Socratic-Zero (2509.24726)**: teacher-student (or teacher-solver-
  generator) co-evolution where an LLM generates and solves novel problems, optimizing difficulty and
  diversity, with reported large gains from a tiny seed (e.g. OpenSIR: GSM8K 73.9 -> 78.3; Socratic-
  Zero: +20.2 points from 100 seed questions). Why they matter: live evidence that self-generated
  curricula improve a model - but the success signal is a *verifiable math answer*, not a social
  outcome. **Distinguish: these report self-evaluated or answer-verified gains; treat answer-verified
  (math) as grounded and any self-judged interestingness as not.**
- **SOAR / "Teaching Models to Teach Themselves: Reasoning at the Edge of Learnability" (2601.18778)**:
  a meta-RL teacher generates a curriculum for problems the model cannot yet solve, to escape a
  learning plateau. Why it matters: it is this lane's central question stated for LLMs.
- **Self-Evolving Curriculum (2505.14970)**, **ACuRL (2602.10356)**, **DataEnvGym (2410.06215)**:
  curriculum-as-a-policy (non-stationary bandit over problem categories), autonomous curriculum RL
  for computer-use agents (with an automatic CUAJudge evaluator at 93% human agreement), and a
  teacher-environment that generates *training data* from student feedback. Why they matter: they
  show the curriculum/generator can itself be learned online and grounded by an automatic evaluator -
  the same role the repo's verifier plays.
- **Darwin Godel Machine (2505.22954, Zhang et al.)**: open-ended evolution of self-improving *agents*
  (the agent rewrites its own code). Why it matters: the autoresearch endpoint - but this is
  code/agent self-improvement (lane-19 / H1-H2 territory), cited here only as the open-ended-search
  connection, not re-surveyed.

## 4. How each source maps to the 4 WAM layers

| Source (id) | Generates | Learnability signal | Verified vs self-reported success | Primary WAM layer |
|---|---|---|---|---|
| POET (1901.01753) | environments (params) | minimal criterion (score band) | environment-verified (ES return) | Institutional (loop) |
| Enhanced POET (2003.08536) | environments (CPPN) | MC + PATA-EC rank novelty | environment-verified (solved) | Institutional (loop + metric) |
| PAIRED (2012.02096) | environments (adversary) | regret | environment-verified | Institutional |
| ACCEL (2203.01302) | environments (edits) | regret | environment-verified | Institutional |
| MAP-Elites (1504.04909) | solutions (QD map) | n/a (diversity) | objective-verified | cross-layer (diversity) |
| OMNI (2306.01711) | task selection | LP + FM interestingness | env-verified success; FM-judged interest | Institutional + Social |
| OMNI-EPIC (2405.15568) | tasks + env CODE + success fn | LP + FM interestingness | **LLM-generated** success detector | cross-layer |
| Eurekaverse (2411.01775) | env CODE (curriculum) | best-policy co-evolution | environment-verified + real-world | Physical |
| MAGELLAN (2502.07709) | goal selection | learned competence head (LP) | environment-verified (binary) | Social/Institutional (selection) |
| OpenSIR / Socratic-Zero / SOAR | problems (self-gen) | difficulty+diversity / edge-of-learnability | answer-verified or self-judged | n/a (LLM reasoning) |

Layer dependency (kept visible per the contract): a generated *social* scenario is only useful if
the verifier can label its `(state, action, next-state)`. That requires the physical/material facts
(who holds what, durability, location) to be verifiable first. So the generators above are
trustworthy at the Physical/Material layers (clean success) and progressively weaker as the success
signal becomes contested (Social, Institutional).

## 5. Maturity and open problems

- **Mature**: the *loop shape* (generate, train/run, score, select next) and the *learnability
  surrogates* (minimal criterion, learning progress, regret) are well established and reproducible
  in principle (POET, Enhanced POET, Eurekaverse, OMNI-EPIC release code). MAP-Elites diversity and
  ANNECS progress-measurement are standard.
- **Unsolved / honest**:
  - **Defining interestingness without gaming it** (OMNI's Goodhart caution). FM-as-MoI is the
    current best answer but is an LLM judgment, contestable and provider-dependent - it cannot be a
    success oracle.
  - **Sustained progression vs isolated novelty** (DiCode 2602.08194): generating one interesting
    scenario is easy; generating a learnable *sequence* is the hard part.
  - **Evaluating open-ended systems** (POET's own caution; Hughes et al. 2406.04268): there is no
    single target metric; ANNECS works only where "solved" is clean.
  - **Self-evaluated success** (the whole wave-4 point): many recent self-improving systems
    (OpenSIR, Socratic-Zero, DGM) report gains under their own or auto-generated checks. The
    distinction between environment-verified and self-reported success is the load-bearing one.

## 6. Relevance to the original query AND the autoresearch thesis

The repo needs social-material SCENARIOS to probe (borrow/lend/return, weak-commons stress,
obligation under scarcity, hoarding vs contribution). This lane is the literature on
auto-generating and ordering such situations.

- **Mechanically useful (engineering the repo can borrow)**:
  - The **generate -> run -> verify -> select-next loop** (POET/Eurekaverse/OMNI-EPIC) maps directly
    onto the repo's cycle. The repo's runtime verifier supplies the "solved" label for free.
  - **Generate scenarios as typed specs/code + a validity gate** (Eurekaverse, OMNI-EPIC), so
    malformed or impossible social setups are rejected before they cost an Actor Turn (the repo's
    schema/permission gates already do this for actions).
  - An **archive of verifier-labeled scenarios + similarity retrieval** (OMNI-EPIC) as stepping
    stones, and **co-evolution from scenarios that produced competence** (Eurekaverse, POET parent-
    eligibility).
  - **ANNECS-as-progress-meter** (Enhanced POET), with the verifier as the "solved" oracle: count a
    generated social-material scenario only when the verifier confirms it is novel-to-archive AND
    solved. A rising count = the generator is still producing learnable-and-new situations.
  - **MAGELLAN-style learnability prediction**: an advisory WAM could predict which candidate
    scenario is at the actors' frontier, scheduling the next probe without running them all.
  - **The maturity ladder (proto-social, organization, settlement, village, society) as the
    hand-authored curriculum spine** that a POET/Eurekaverse-style loop can *extend*: branch
    sub-scenarios off each rung, gated by the MC against current actor competence.

- **The honest bound (where the analogy breaks)**:
  - **Interestingness in a social world is hard to define and easy to game** (OMNI/Goodhart). A
    generated social scenario is only useful if the verifier can label its `(state, action,
    next-state)`. So the *learnability* half of every method above is verifier-groundable; the
    *interestingness* half stays advisory (FM/human judgment, never the success label).
  - **Clean success is a Physical/Material privilege.** Eurekaverse transfers to a real robot
    because "crossed the course or fell" is physically verified; OMNI-EPIC's loop works because
    `get_success` is checkable. At the Social/Institutional layers, "was the promise kept, the claim
    respected, the commons maintained?" is contested and not a single scalar - there is no 99%
    target the loop can hill-climb (POET, Hughes et al.).
  - **Social scenarios are expensive to reset cleanly**, unlike a parkour course or a PushT scene
    (ENPIRE). Resetting "Bob owes Alice a pickaxe and trust is strained" is not a `scene.reset()`.

- **One-line tie to the thesis**: an ENPIRE-style autoresearch loop can autonomously propose and
  order the repo's social-material scenarios using verifier-grounded *learnability* signals
  (minimal criterion, learning progress, ANNECS), but its *interestingness* judgments must stay
  advisory and its *success* labels must come from the runtime verifier, never the generator or the
  actor - because in a social world success is contested, which is exactly where progress laundering
  would creep in.

- **One-line tie to the original query**: this area is how a hierarchical action-conditioned WAM
  would decide *which* physical/material/social/institutional situation to predict-and-evaluate next,
  keeping the probes solvable-but-not-trivial and verifier-scorable rather than saturating or drifting
  into ungradeable social claims.
