# Matrix: WAM vs VLA (and WAM-as-actuator vs WAM-as-advisory)

Lane 11 (F5) owned matrix. Focused and sharp: it contrasts VLA against WAM on the axes
that decide the reader's central question (frame this project as a WAM, not a VLA), then
splits the two ways a WAM can be used.

This is narrower than wave-1's 8-paradigm matrix `wam-vs-vla-vs-policy-vs-runtime.md`
(which places VLA, WAM, visual policy, model-based RL, learned simulator, symbolic planner,
LLM tool-use agent, and the Mineflayer runtime side by side). For that broader placement,
read that file; this one zooms into the VLA-vs-WAM pair and the actuator/advisory split.

Jargon: `o` = observation; `l` = language instruction; `a` = action; `o'` = predicted next
observation/state. Punctuation is ASCII `-` only. Sources are inline.

Primary sources: WAM survey 2605.12090; DreamZero 2602.15922; FFDC / When-to-Trust-
Imagination 2605.06222; Do-WAMs-Generalize 2603.22078; VLA survey 2507.01925; Open
X-Embodiment 2310.08864; pi-0 2410.24164; pi-0.5 2504.16054; OpenVLA-OFT 2502.19645;
GR00T N1 2503.14734; plus the repo SPEC/research-frame for the runtime-fit rows.

## 1. VLA vs WAM, head to head

| Axis | VLA | WAM | Source |
|---|---|---|---|
| Formulation | `p(a \| o, l)` (action only) | `p(o', a \| o, l)` (joint future + action) | WAM survey 2605.12090 def |
| Predicts `o'` (a future state)? | No | Yes (criterion 1: explicit pixels/flow OR implicit physics latent) | WAM survey 2605.12090 |
| Action coupled to a predicted future? | No (nothing to couple to) | Yes (criterion 2: action "strictly aligned with anticipated `o'`") | WAM survey 2605.12090 |
| Core stance | Perceive then react | Imagine the consequence then act | WAM survey 2605.12090; VLA survey 2507.01925 goal-state sec |
| Role / authority | Actuator only (its output is the executed action) | Actuator OR advisory predictor/evaluator | DreamZero 2602.15922; FFDC 2605.06222 |
| Counterfactual query ("what if I do X?") | Not available (forward pass = the action) | Available (can predict `o'` for a candidate `a` without executing) | WAM survey 2605.12090; FFDC 2605.06222 |
| Inference cost / speed | Fast (pi-0 50 Hz; OpenVLA-OFT 26x throughput) | Slower (>=4.8x a VLA step; DreamZero ~7 Hz at 14B) | pi-0 2410.24164; OpenVLA-OFT 2502.19645; Do-WAMs-Generalize 2603.22078; WAM survey 2605.12090 |
| Training data | Paired `(o, a)` teleop demos (behavior cloning) | `(o, a, o')` triplets AND action-free `(o, o')` video | Open X-Embodiment 2310.08864; WAM survey 2605.12090 |
| Robustness to perturbation | Good with broad data; fragile under distribution shift (BC compounding error) | Robust to noise/lighting/layout via spatiotemporal priors | VLA survey 2507.01925; Do-WAMs-Generalize 2603.22078 |
| Generalization evidence | Strong instruction/object generalization from data breadth (pi-0.5 new homes) | >2x zero-shot to unseen verbs/motions (DreamZero); robustness study mixed (VLAs can match WAMs with curated data) | pi-0.5 2504.16054; DreamZero 2602.15922; Do-WAMs-Generalize 2603.22078 |
| What a "deeper" intermediate buys | A semantic plan (pi-0.5 predicts a *language subtask*; GR00T System 2 plans) - still not a forecast of `o'` | A forecast of the world state, by definition | pi-0.5 2504.16054; GR00T N1 2503.14734; WAM survey 2605.12090 |
| Fit to an LLM-actor + Mineflayer runtime | Poor as authority: the actor would *be* the policy, violating "runtime owns truth" | Fits only in the advisory role: predict social-material `o'`, verify against evidence, never act | repo SPEC / research-frame; FFDC 2605.06222 (advisory precedent) |

Sharp takeaways (interpretation):
- The single bit that separates them is "predicts `o'` and couples to it." Everything else
  (speed, data, robustness) follows from that bit.
- "Has a slow deliberate module" does NOT make a VLA a WAM: pi-0.5 and GR00T N1 predict a
  *semantic* intermediate (a subtask/plan), not a future *state*. A goal-state VLA predicts
  a future image but may skip the coupling commitment. The WAM test is strict.
- For this project the decisive row is "role/authority": a VLA can only be the actuator,
  which the repo forbids; a WAM can be advisory, which the repo allows.

## 2. WAM-as-actuator vs WAM-as-advisory (the split that decides admissibility here)

Both are WAMs by the formal definition. They differ in who owns execution.

| Axis | WAM-as-actuator | WAM-as-advisory predictor/evaluator |
|---|---|---|
| Canonical example | DreamZero (2602.15922): "World Action Models are Zero-shot Policies" | FFDC / When-to-Trust-Imagination (2605.06222) |
| What it outputs | The executed action chunk (joint with predicted video) | A predicted next state + a consistency/trust signal; a separate module gates execution |
| Owns physical truth? | Yes (the WAM acts) | No (something else executes; the WAM only predicts and signals) |
| Can it fill missing args / set progress / override a verifier? | Yes, by construction (it is the policy) | No (FFDC "does not fill arguments or override anything - it produces a consistency signal") |
| Relationship to observed evidence | Replaces predicted frames with ground-truth obs in cache to curb drift, but still acts | Compares predicted vs observed to decide trust/replan; observation remains the source of truth |
| Inference cadence pressure | High (must act in real time; ~7 Hz is already a problem for 50 Hz robots) | Low (advice can run at the deliberation cadence; latency objection mostly dissolves) |
| Admissible in this repo? | No - forbidden by "the LLM proposes; the runtime owns physical truth" | Yes - this is the only admissible WAM role here |
| Maps onto the project as | (forbidden) a learned policy that emits the Minecraft action | predict social-material delta -> compare to inventory/container/transcript/verifier evidence -> emit trust/risk; never authority |

Sharp takeaway (interpretation): the project's "Social WAM," if built, is the right-hand
column instantiated on *structured social-material state* rather than pixels. It borrows
FFDC's control structure (predict expected state, check against evidence, signal
trust/replan), not its perceptual mechanism. The left-hand column (DreamZero-style
actuator) is out of scope by the same rule that keeps prose non-executable.

## 3. Where the line blurs (so the distinction stays honest)

| Case | Predicts `o'`? | Couples action to `o'`? | Verdict | Source |
|---|---|---|---|---|
| Raw-action VLA (RT-2, OpenVLA, pi-0) | No | No | VLA | VLA survey 2507.01925 |
| Hierarchical VLA predicting a language subtask (pi-0.5, GR00T System 2) | No (predicts a *semantic plan*, not a state) | No | Still a VLA | pi-0.5 2504.16054; GR00T N1 2503.14734 |
| Goal-state VLA (UniPi, AVDC, VPP, FLIP) | Yes (a future image/video) | Sometimes not (may lack the world-modeling coupling) | Boundary; "Video Policy" if it only inherits a video backbone | VLA survey 2507.01925; WAM survey 2605.12090 (Video Policy disambiguation) |
| VideoVLA (2512.06963, abstract-level) | Yes (future visual outcomes + actions) | Reported yes (joint) | WAM-like (unverified body) | abstract only; mark as unverified report claim |
| DreamZero | Yes (video) | Yes (joint video+action) | WAM (actuator) | DreamZero 2602.15922 |
| FFDC | Yes (expected future) | Yes, but used to *evaluate* not to act | WAM (advisory) | FFDC 2605.06222 |
| Structured-state social predictor (this project, proposed) | Yes (typed social-material delta) | Coupled only as *advice* (predict -> verify -> signal) | WAM (advisory, structured-state) | repo research-frame; interpretation |

## Cross-links (do not duplicate)

- Broad 8-paradigm placement, advisory/actuator and observation-type axes:
  `matrices/wam-vs-vla-vs-policy-vs-runtime.md` (wave-1).
- Formal `p(o',a|o,l)` foundations, Cascaded vs Joint, pixel-vs-structured argument:
  `notes/by-theme/wam-foundations.md` (wave-1).
- VLA paradigm depth + the 5-point distinction prose:
  `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md` (this lane).
- By-paper notes: VLA canon (F3): `2212.06817-rt1.md`, `2307.15818-rt2.md`,
  `2406.09246-openvla.md`, `2405.12213-octo.md`, `2410.24164-pi0.md`. Depth-extras
  (this lane): `2507.01925-vla-survey-action-tokenization.md`, `2310.08864-open-x-embodiment.md`,
  `2504.16054-pi-0-5.md`, `2502.19645-openvla-oft.md`, `2503.14734-groot-n1.md`. WAM side:
  `2602.15922-dreamzero.md`, `2605.06222-when-to-trust-imagination.md`,
  `2603.22078-do-wams-generalize.md`.
