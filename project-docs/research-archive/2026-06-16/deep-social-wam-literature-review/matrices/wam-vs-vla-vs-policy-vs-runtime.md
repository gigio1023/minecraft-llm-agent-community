# Matrix: WAM vs VLA vs Visual Policy vs Model-based RL vs Learned Simulator vs Symbolic Planner vs LLM Tool-use Agent vs Mineflayer Runtime

Lane 1 owned matrix. Source-backed. Compares paradigms across: predicts `o'`? selects
`a`? authority over execution? observation type; action type; training data; advisory
vs actuator; fit to this repo. Jargon: `o'` = predicted next state; `a` = action.

Primary sources: WAM survey 2605.12090; DreamZero 2602.15922; Do-WAMs-Generalize
2603.22078; FFDC 2605.06222; MineWorld 2504.08388; Dreamer4 2509.24527; DreamerV3
2301.04104; the repo SPEC / research-frame for the runtime rows.

## Core comparison

| Paradigm | Predicts `o'`? | Selects `a`? | Authority over execution | Observation type | Action type | Training data | Advisory or actuator | Fit to this repo |
|---|---|---|---|---|---|---|---|---|
| **VLA** (`p(a\|o,l)`) | No | Yes | Actuator (outputs motor action) | pixels (+ proprioception) | continuous motor / token actions | paired `(o,a)` teleop demos | actuator | Poor. Reactive, no dynamics, pixel/motor. Not the runtime. |
| **WAM** (`p(o',a\|o,l)`) | **Yes** | **Yes** | Actuator by default (DreamZero); can be repurposed as evaluator (FFDC) | pixels OR latent OR (rare) structured | motor / token actions | `(o,a,o')` triplets + action-free video | actuator (mainstream); **advisory only if used as verifier** | Only the **advisory/evaluator** form fits; actuator form is forbidden by repo rule. |
| **Visual Policy** (`p(a\|o)`, video backbone) | No (implicit features) | Yes | Actuator | pixels | motor actions | video-pretrained + action FT | actuator | Poor. No explicit prediction; pixel/motor. |
| **Model-based RL agent** (Dreamer: latent WM + actor-critic in imagination) | Yes (latent) | Yes (policy trained in imagination) | Actuator (the trained policy acts) | latent (from pixels + e.g. inventory state) | env / game actions | online RL experience or offline dataset | actuator | Contrast only. Latent+structured-state feasibility proof, but RL-policy-as-authority conflicts with repo rule. |
| **Learned Simulator / WM** (`p(o'\|o,a)`) | Yes | No | None (predicts, does not act) | pixels (MineWorld/Oasis/Solaris) or latent | action is an input condition | gameplay/robot video + actions | advisory (predict-only) | Admissible as a **visual sidecar** (pixel) for human review; not a social predictor. |
| **Symbolic planner** (PDDL/HTN-style) | Yes (symbolic state) | Yes (plan) | Actuator (emits plan/actions) | symbolic predicates | symbolic operators | hand-authored domain model | actuator | Contrast. Pure symbolic planning is brittle/authoritative; repo forbids hidden planners. But its *structured-state transition* idea is the right representation level. |
| **LLM tool-use agent** (this repo's Actor Turn) | No (LLM reasons, no learned forward model) | **Yes** (selects one function-tool under schema) | **Selection authority, bounded by runtime gates** | typed Minecraft + social state (`current_state`) + source evidence | typed primitive / action-skill / social action | n/a (prompted LLM, not trained WM) | n/a (selector) | This **is** the runtime. |
| **Mineflayer action-skill runtime** (this repo's execution layer) | No | No | **Owns physical truth** (schema, permission, retry, verifier, artifacts) | Minecraft world via Mineflayer | executes typed action / generated action-skill | n/a | n/a (executor of truth) | This **is** the runtime's authority layer. |
| **(proposed) Structured-state Social WAM** | Yes (typed social-material delta `o'`) | No | **None - advisory** (predict + evaluate consequences) | typed Minecraft + social/material/institutional state | candidate typed action as input | logged social-material transition records (small, first) | **advisory only** | The project's target: predict deltas + expected evidence + risk; never fills args, marks progress, or overrides verifiers. |

## Authority / advisory column - the load-bearing distinction for this repo

The repo's hard rule: "the LLM proposes; the runtime owns physical truth ... A WAM, if
adopted, must stay advisory: it predicts/evaluates consequences; it must not fill
missing args, mark progress true, override verifiers, or replace Actor Turn selection."

Mapping that onto the matrix:
- **Admissible WAM uses** (advisory): learned-simulator `p(o'|o,a)` as a predictor; the
  **FFDC evaluator/verifier** pattern (predict expected state, compare to observed
  evidence, signal trust/replan); a structured-state social predictor that outputs
  deltas + expected evidence + risk for the actor/verifier to consume.
- **Forbidden WAM uses** (actuator/authority): DreamZero-style WAM-as-policy that emits
  the executed action; any predictor that fills missing primitive args, sets progress
  true, overrides a verifier, or replaces Actor Turn selection; a symbolic planner or
  RL-in-imagination policy that becomes the action authority.

## Observation-type axis - why structured is the project's fit

| Observation representation | Examples | Cost | Encodes hidden social/material state? | Checkable against repo artifacts? |
|---|---|---|---|---|
| Pixels / video | MineWorld, Oasis, Matrix-Game, Solaris, Genie, GameNGen | High (40k-160k tokens/16 frames; 7Hz@14B; 4.8x slower than π0.5) | No (WildWorld: hidden state not in pixels) | No (would need IDM / VLM-judge) |
| Latent (visual) | DreamerV3, Dreamer4, JEPA/V-JEPA2 | Lower than pixels; single-GPU real-time (Dreamer4) | Partly (latent may capture task structure; Dreamer4 adds inventory state) | Indirectly |
| Structured / symbolic state | WildWorld state annotations; this repo's `current_state` | Lowest (typed fields) | **Yes - directly** (possession, claim, obligation, trust as typed fields) | **Yes - directly** (inventory, container, transcript, verifier artifacts) |

The bottom row is where the repo already operates (typed `current_state`, verifier
evidence) and where social-material state is *natively* representable and checkable.

## One-line takeaways (interpretation)

- The mainstream WAM (DreamZero) is an **actuator**; the repo can only use the
  **advisory/evaluator** WAM (FFDC framing) or a **learned-simulator predictor**.
- Pixel observation is expensive and does not encode hidden social-material state;
  structured observation is cheap, native to the runtime, and directly checkable.
- The project's "Social WAM" is the bottom-row **structured-state, advisory predictor**,
  not any actuator paradigm above it.
