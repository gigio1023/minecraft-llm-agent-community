# Final positioning report: WAM-based open-world social simulation with an SDK-style autoresearch loop

What this is: the synthesis that positions this Minecraft LLM-agent project around four ideas (World
Action Models, Minecraft as a wild reproducible substrate, social consequence grounded in material
dynamics, and a coding-agent autoresearch loop). Backing: four new research lanes (2026-06-17) over a
52-source investigation manifest, built on the 560-source 2026-06-16 archive. Primary-source facts are
separated from interpretation; numbers are as-stated by sources. ASCII punctuation only.

## TL;DR

- The defensible contribution is one cell no prior work occupies: an ADVISORY, structured world model
  that predicts the physical, material, and social consequences of actions in an embodied Minecraft
  world, plus the measurement of whether embodied LLM actors actually sustain obligation, trust,
  repair, and continuation beyond a single task and whether a model can predict it. (Scoring a
  transition against engine state rather than a self-judge is assumed throughout, not the point.)
- "Autoresearch", "WAM-based research", and "LLM mineflayer code generation" are NOT competing
  directions. They are three stacked layers: the OBJECT (the advisory predictor), the LOOP (the
  autoresearch self-improvement), and the SUBSTRATE/MEASUREMENT (Minecraft + the verifier). Code
  generation is the actor's capability acquisition, the substrate, not the contribution.
- The 4-way intersection is empty across 560+ old sources and 10 newly verified 2025-2026 works. The
  closest occupied triple (Minecraft + world model + self-improvement, EvolvingAgent 2502.05907) is
  single-actor, physical-only, and self-scored (the inadmissible signal). Two 2025-2026 position papers
  name the physical-plus-social frontier, so the FRAMING is shared; only the embodied, verified,
  material-grounded instantiation is open.
- An SDK-style loop is buildable today with off-the-shelf primitives (Claude Agent SDK, OpenAI Codex,
  OpenHands, DSPy/MIPRO, GEPA), but every one of them enforces only REACHABILITY, not TRUTH. None
  supplies the verifier or the anti-gaming guard. That boundary is the research discipline.
- The credibility bar is reproducibility hygiene, not the contribution. Project Sid is the cautionary
  anchor: re-verified 2026-06-17, its public artifact is a report PDF, README, image, and video,
  scoring 0/5 on the Papers-with-Code code bar, every metric unreproduced. Do not position the project
  as evidence-first benchmarking.

## 1. The reframe (resolves the "many directions" confusion)

The directions are not alternatives. They are three layers, each depending on the one below.

| Layer | What it is | Status in this project | Is it the contribution? |
|---|---|---|---|
| OBJECT: the advisory social-material WAM | the predictor p(o' | o, l) that predicts physical + material + social deltas | does not exist as a model yet (prompt-based only) | YES, this is the headline |
| LOOP: the autoresearch self-improvement | a coding-agent loop that proposes code changes, scored by the verifier | not built (raw material exists) | method, not headline |
| SUBSTRATE / MEASUREMENT: Minecraft + the deterministic verifier | the world that produces o and the code that scores deltas | working (verifier covers Physical + Material) | support / audit surface, not the contribution |

"LLM mineflayer code generation" sits inside the substrate as the actor's capability acquisition
(`author_mineflayer_action`), not as a research result. Reading engine state to check a predicted
transition is assumed plumbing (it is how Minecraft works); the contribution is the predictive OBJECT,
not the scoring.

## 2. Grounded repo state (what the reasoning starts from)

From the dated snapshot `../../../2026-06-16/deep-social-wam-literature-review/reports/repo-implementation-state-2026-06-16.md`:

- The deterministic verifier (`probe/src/skills/generated/verifierEvaluation.ts`) auto-labels
  (state, action, next-state) at the Physical and Material layers at near-$0. Social is limited to
  "say completed"; Institutional is absent.
- The advisory WAM does NOT exist as a model; the runtime is currently an actor/policy (prompt-based
  one-step tool selection), not a predictor.
- Gated skills + `author_mineflayer_action` give Voyager-style skill-as-code, promoted only after a
  trial + verifier pass.
- The latest live run (2026-06-04, 60 cycles) is PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK: the runtime
  executed correctly but the actor looped on one behavior, never authored a skill, never used
  PlanBeads. This is a substrate/behavior problem (phase 0), not a WAM problem.

So the asset (the verifier) exists; the object (the predictor) does not; the actor loops; clean
scenario reset is missing; the social-material layer needs multi-actor that is not built.

## 3. Thesis

Recommended spine (full reasoning in `../notes/by-theme/recommended-research-spine.md`): F1 the advisory
social-material world model (predict-and-verify), carried by F2 the verifier-grounded loop, set in F4
Minecraft as the material substrate, with F5 (small-N, anti-Sid) as the posture and F3 (the benchmark)
demoted to method.

One-line thesis: an advisory, structured social-material world model predicts the physical, material,
and social consequences of actions in an embodied Minecraft world, and a coding-agent loop improves it.
(That a transition is scored against engine state, not a self-judge, is assumed, not the headline.)

Thesis candidates considered and why F1 wins: F3 (benchmark-first) is the evidence-first trap the
contract forbids; F4 and F5 are a position and a posture, not a result; F2 alone reads as engineering.
F1 is the one positive, falsifiable, unoccupied claim, and it makes the others supporting parts.

## 4. Prior-work comparison and gap analysis

Full matrix: `../matrices/prior-work-gap-matrix.md`. Census and per-axis misses:
`../notes/by-theme/cross-product-novelty-and-closest-works.md`.

- The 4-way intersection (Minecraft + advisory world model + material-grounded open-world social +
  verifier-grounded self-improvement loop) is EMPTY.
- Closest per axis and the precise miss:
    - Minecraft + WM + self-improve (TRIPLE): EvolvingAgent 2502.05907, but single-actor, physical,
      self-verified. MineEvolve 2603.13131 uses typed in-world feedback (not a self-judge) but is
      single-actor, no social, no predictive WM.
    - Social world model: S3AP / Social World Models 2509.00559 proves structured social-state beats
      free text (+51% on a theory-of-mind task with o1, claim-only), but state is an LLM parse, scored
      on a dialogue goal, not embodied, not verified. This is the bridge to make S' a verified Minecraft
      delta.
    - Material-grounded social: AIvilization 2602.10429 and LLM Economist (old archive) ground social
      in abstract economics (prices, tiers), not located durable items, not embodied, no predictor, no
      loop. MineCollab/MINDcraft 2504.17950 has the typed `givePlayer` handoff but scores task
      completion and tracks no obligation.
    - LLM-as-world-model in Minecraft: WALL-E 2410.07484 corrects mispredicted transitions with
      gradient-free rules, but uses its model as MPC planning AUTHORITY, not advisory, and is physical
      only.
- Two 2025-2026 position papers (2510.21219 "unify physical and social dynamics"; 2604.22748 "Agentic
  World Modeling" survey) explicitly name physical-plus-social world modeling an open frontier and call
  them "separate silos". They confirm the gap and prove the framing is shared, not novel.
- Honesty bound: the empty-cell claim is a strong census over indexed sources, not a proof of
  non-existence; all 10 new 2025-2026 works were verified at abstract level.

## 5. The autoresearch loop, concrete, and the authority boundary (Q3, Q4, Q5)

Full analysis: `../notes/by-theme/sdk-loop-mechanics-and-authority.md`; boundary table:
`../matrices/sdk-loop-authority-boundary.md`.

Concrete definition (Q3, not vague self-improvement): one iteration = PROPOSE a change to one named
software artifact -> RUN a fixed-budget trial on a held-out seeded scenario -> SCORE against engine
state (not the actor's own judgment) -> KEEP or DISCARD on that score plus an artifact-health check ->
REPEAT, keeping an archive of diverse candidates. SDK realization: a Claude Agent SDK `query()` or OpenAI Codex `codex exec` loop controller;
SDK edit tools under a `workspace-write` sandbox; a DSPy/MIPRO `compile` or GEPA `optimize` call whose
metric IS the verifier for the prompt/skill variant; `PreToolUse` hooks and `approval_policy` as gates.

What the loop MAY improve (Q4): harness/action_surface, Actor Turn and advisory-WAM prompts, runtime
contracts/specs (schema, enum, gate config), action skills (generated Mineflayer code), verifier rules
as REVIEWED candidates, report templates, the advisory-WAM predictors, and benchmark scenarios as
candidates.

What the loop MUST NOT decide (Q5): Minecraft physical truth, social truth (whether trust rose, an
obligation closed, a conflict repaired), scoring and success labeling, action success, obligation
closure, settlement continuity, and benchmark promotion into the held-out set. Scoring stays outside the
loop's editable surface; the isolation and escalation details (DGM node-114 defense, gated scenario
promotion) are in `../matrices/sdk-loop-authority-boundary.md`.

The assumed given under the boundary (not a finding): a transition is scored against engine state, not
the actor's own judgment, an LLM judge, or a learned reward model. The SDKs make the "must not" column
unreachable as code, but none supplies that scoring; it is the repo's plumbing, not an SDK feature.

## 6. Why Minecraft (Q6)

Full analysis: `../matrices/minecraft-vs-robotics-vs-dialogue-sim.md`;
`../notes/by-theme/substrate-comparison-minecraft-robotics-dialogue.md`.

- Minecraft is the only substrate that is both deterministically material-verifiable AND cheap at
  society scale. Possession, transfer, and control are exact engine facts a runtime verifier reads for
  free, and many lightweight actors co-inhabit one world. That is the reliable physical-material FLOOR a
  four-layer social predictor needs.
- Robotics sim (MuJoCo, Isaac, Habitat 3.0) owns physical fidelity and real-world transfer, paid for
  with the inevitable sim-to-real gap, and its high per-humanoid cost caps the agent count (Habitat 3.0
  reports a dyad). Its "social" is co-presence and motion coordination (yielding space), not a persisted
  obligation; PARTNR scales tasks but scores task success, not social-material consequence.
- Dialogue-only social sim (Generative Agents, SOTOPIA) owns social vocabulary and the cheapest actors
  but has NO material verifier (all actions resolve to text; the judge over-rates at long context), so
  it cannot test material consequence at all.
- What Minecraft cannot claim: real-world physical transfer (robotics' claim) and pixel-level perception
  realism (robotics and pixel-WM). The project claims the narrower provable thing: verified
  world-grounded social-material trajectories for a named model, partner, and seed. MineDojo-only or
  MineStudio-only would reduce Minecraft to a task suite or a visual-policy harness; the project's use
  is the material substrate, not either of those.

## 7. Proposed contributions

In priority order, all on the F1 spine:

1. An action-conditioned world model that predicts the physical-material-social delta of an action,
   with PREDICTION accuracy reported SEPARATELY from acting outcome. The per-transition social-material
   prediction-accuracy measurement is one no surveyed paper reports.
2. The predictor kept ADVISORY (predicts and proposes, never selects the executed action, fills args,
   marks progress, or overrides the verifier), a deliberate contrast to WALL-E's MPC authority.
3. A self-improvement loop that improves the advisory predictor and the actor's gated skills, with a
   measurement of what it actually improves (contrast Voyager and EvolvingAgent, which improve against
   their own judgment).
4. Small-N (2 to 3 actors), reproducible, falsifiable social-material trajectories with post-goal
   continuation, a deliberate contrast to Project Sid's unreproduced civilization scale.

Not contributions (support, per the contract): the verifier, logs, ledgers, scoring scripts, the
benchmark harness, and the loop engineering. They are the audit surface that makes the claim
trustworthy; they are not the claim.

## 8. Concrete roadmap (Q8)

Constraint honored: no live paid provider benchmark was run in this investigation; live-call items below
are design to run under the repo's existing quota guard, by the owner.

Phase 0 (prerequisite, the substrate fix). The 2026-06-04 run looped. Before any WAM work, make the
single-actor cycle select varied actions, exercise `author_mineflayer_action`, and use PlanBeads, so
trajectories are non-degenerate. This is behavior/substrate, not WAM.

2 weeks (schema + measurement scaffolding, mostly provider-free):
- Freeze a transition-row schema (social-material-transition/v1) and a post-run logger that joins
  artifacts the runtime already emits (review summary, settlement state, grounded-social-trajectory
  report). Auto-labeled by the verifier at ~$0.
- Stand up the deterministic scoring script + seed ledger + held-out-scenario discipline (the
  reproducibility checklist in `../notes/by-theme/reproducibility-norms-and-sid-cautionary.md`).
- A provider-free zero-shot delta-predictor harness skeleton: given state + candidate action, predict
  the delta; score against the verified delta. Dry-run on the existing relationship-ledger enum
  transition (the cheap Social correlate that already has a verifier).

2 months (the predictor measured at Physical/Material + the loop wired safely):
- Measure per-transition prediction accuracy of a zero-shot prompt-based WAM on verified
  Physical/Material deltas (the new metric), under the quota guard.
- First social benchmark borrowed_tool_v1 (request -> lend or refuse -> use -> return or debt or
  repair), replacing the decision-only keyword-scored seed with typed-delta + ledger scoring and live
  handoff evidence.
- Wire the SDK loop at Physical/Material ONLY: a Claude Agent SDK or Codex headless controller, the
  verifier as the metric, the verifier ISOLATED from the agent's editable surface, plus artifact-health
  and freshness checks.

6 months (climb to Social with multi-actor):
- A two-actor live scenario; material-claim, obligation, and public-affordance ledgers.
- Predict relationship-ledger and obligation transitions and VERIFY them against handoff and transfer
  evidence; report calibration (proper score + ECE) of the predictor separately from acting.
- Let the verifier-grounded loop improve the social-material predictor; report negative results, cost,
  and failure traces as first-class output; prepare a release that meets the checklist.
- Institutional / settlement layer stays OUT of scope (long-horizon, contested, no crisp metric).

## 9. Risks and failure modes, and what NOT to claim

| Risk | Mechanism | Guard |
|---|---|---|
| Progress laundering | actor/LLM-judge/learned-RM scores its own success | verifier owns scoring, isolated from and invisible to the loop (DGM node-114) |
| Sid-style overclaim | civilization-scale narrative without runnable scoring | small-N, released deterministic scoring; Sid is 0/5 (lane D) |
| Weak verifier (passes-but-wrong) | the verifier passes a transition that is not actually correct | harden with invariance/no-op/differential probes; 2503.15223 measured 6.4 points of inflation |
| Contamination / stale scenarios | the loop overfits a fixed held-out set | time-gate and refresh scenarios; private holdout (SWE-rebench discipline) |
| Social layer unprovability | no clean external scorer above Material | keep the WAM advisory at Social; never self-score; report it as the unproven surface |
| Single-actor cap | social-material needs >=2 actors | multi-actor is a phase-3 dependency, not assumed earlier |
| Silent artifact degradation | iterative self-extension bloats/erodes code | artifact-health check alongside verifier pass (SlopCodeBench) |

What NOT to claim: human-society fidelity; believable dialogue as social capability; an LLM judge's
score as ground truth; organic cooperation the world did not confirm; real-world physical transfer;
civilization-scale emergence; or that the world model may act or override the verifier. Do not position
the project as evidence-first benchmarking or as a structured-state / reproducibility contribution.

## 10. The eight core questions, answered

| # | Question | Answer (where backed) |
|---|---|---|
| 1 | Existing work combining all four axes? | No; the 4-way is empty; closest triple EvolvingAgent 2502.05907 (lane B, prior-work-gap matrix) |
| 2 | Closest prior works per axis and misses | S3AP (dialogue-scored), Voyager/EvolvingAgent (self-judged), MineCollab (task-scored, no obligation), AIvilization (abstract economy), Sid (unreproduced) (prior-work-gap matrix) |
| 3 | Define autoresearch concretely | propose code change -> fixed-budget trial -> deterministic-verifier score -> keep/discard -> repeat (sdk-loop matrix section 0) |
| 4 | What a coding-agent loop may improve | harness, prompts, specs, action skills, candidate verifiers, reports, WAM predictors, candidate scenarios (sdk-loop matrix, MAY column) |
| 5 | What must stay outside the loop | Minecraft truth, social truth, scoring/success, action success, obligation closure, benchmark promotion (sdk-loop matrix, MUST-NOT column + verifier boundaries) |
| 6 | Why Minecraft vs robotics / dialogue / MineDojo-only / MineStudio-only | deterministic material substrate at society scale, near-$0 verification; cannot claim transfer or perception realism (minecraft-vs-robotics matrix) |
| 7 | Paper-level research spine | F1 advisory social-material WAM (predict-and-verify), carried by F2 loop, set in F4 substrate (recommended-research-spine) |
| 8 | 2 weeks / 2 months / 6 months | schema+scoring scaffold / predictor measured + loop wired at Physical-Material / multi-actor climb to Social (section 8) |

## Cross-references

- Short brief: `short-human-brief.md`
- Matrices: `../matrices/prior-work-gap-matrix.md`, `../matrices/sdk-loop-authority-boundary.md`,
  `../matrices/minecraft-vs-robotics-vs-dialogue-sim.md`
- Spine: `../notes/by-theme/recommended-research-spine.md`
- Lane syntheses: `../notes/by-theme/sdk-loop-mechanics-and-authority.md`,
  `../notes/by-theme/cross-product-novelty-and-closest-works.md`,
  `../notes/by-theme/substrate-comparison-minecraft-robotics-dialogue.md`,
  `../notes/by-theme/reproducibility-norms-and-sid-cautionary.md`
- Prior wave (the OBJECT/LOOP/MEASUREMENT directions and 7 hard questions):
  `../../../2026-06-16/deep-social-wam-literature-review/reports/research-directions-for-the-repo.md`
