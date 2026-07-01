# VLA in depth, and the WAM-vs-VLA distinction

Lane 11 (F5) theme file. This carries the reader's central question: why frame this
project as a World Action Model (WAM), not as a Vision-Language-Action model (VLA). It
gives VLA the paradigm-level treatment (Part A) and then the source-backed WAM-vs-VLA
distinction (Part B).

Source discipline (per the shared contract): primary-source facts are stated with their
source inline; every block labeled "Interpretation" is my reading, not a paper's claim.
Jargon is defined on first use. Punctuation uses ASCII `-` only.

Deconfliction: Lane 9 (F3) owns the by-paper notes for the VLA canon (RT-1 2212.06817,
RT-2 2307.15818, OpenVLA 2406.09246, Octo 2405.12213, pi-0 2410.24164) and the
action-generation lineage. This file cites those by id and does not redo them. It builds
on wave-1's `wam-foundations.md` and the matrix `wam-vs-vla-vs-policy-vs-runtime.md`, and
adds the focused matrix `matrices/wam-vs-vla-distinction.md`.

---

# Part A - VLA as a paradigm, properly

## A.0 The terms, defined plainly (for a newcomer)

- **Policy**: a function that, given what the agent currently senses, outputs an action.
  In symbols a deterministic policy is `a = pi(o)`; a probabilistic one is `p(a | o)`.
- **VLA (Vision-Language-Action model)**: a policy that also takes a language instruction.
  Formally `p(a | o, l)`: given observation `o` and instruction `l`, output action `a`.
  The WAM survey (arXiv 2605.12090) writes its objective as
  `L_VLA = E[-log p(a | o, l)]`. The VLA survey (arXiv 2507.01925) defines a VLA as a
  model that "generates actions conditioned on visual and linguistic inputs, and is built
  upon at least one large-scale vision or language foundation model."
- **Reactive**: the policy maps the present to an action with no explicit prediction of
  what will happen next. It does not contain a model of the world's dynamics. (Contrast
  with predictive, below.)
- **Behavior cloning (BC)**: the standard way VLAs are trained. Collect expert
  demonstrations as `(observation, action)` pairs and train the model to copy the expert's
  action via supervised learning (maximize `log p(a | o, l)`). pi-0.5 (2504.16054) states
  this objective verbatim: `max_theta E log pi_theta(a_{t:t+H} | o_t, l)`.
- **Action head / action expert**: the part of the network that turns fused
  vision-language features into the actual action numbers. It can be an autoregressive
  token decoder, a diffusion head, or a flow-matching "action expert" (pi-0 2410.24164).
- **Action tokenization**: how the action is represented so a transformer can emit it.
  The VLA survey (2507.01925) makes this its organizing lens, naming eight action-token
  types: language description, code, affordance, trajectory, goal state, latent
  representation, raw action, and reasoning. "Raw action" = low-level commands directly
  executable; it is the end-to-end VLA core.
- **Cross-embodiment**: training one policy on data from many different robot bodies so it
  transfers across them. Open X-Embodiment (2310.08864) is the dataset that made this
  practical for VLAs.

## A.1 What VLA is, in one paragraph

A VLA repurposes a pretrained vision-language model as a robot policy. It reads images and
a language instruction and emits an action (or an action chunk). It learns this mapping by
behavior cloning on demonstration data. It is *reactive*: there is no explicit forecast of
the next world state inside the loop. The WAM survey (2605.12090) summarizes the paradigm
as having "consolidated VLA models as the dominant paradigm for generalist embodied policy
learning," and the VLA survey (2507.01925) calls it "the next frontier" of embodied AI.

## A.2 The canon and what each one added

Each row is one source-backed innovation. By-paper notes for the canon are owned by Lane 9
(F3); the depth-extras (survey, OXE, pi-0.5, OpenVLA-OFT, GR00T N1) have notes in this lane.

| Model (arXiv) | Year | What it added (the one-line innovation) | Source |
|---|---|---|---|
| RT-1 (2212.06817) | 2022 | A transformer policy trained on large real-robot demo data (130K demos, 700+ tasks); robust to distractors, generalizes across two embodiments. | F3 note; VLA survey 2507.01925 |
| RT-2 (2307.15818) | 2023 | Co-fine-tune a web-scale vision-language model on robot data; actions are discretized into token "bins" so web semantics transfer to actions. Emergent generalization + chain-of-thought. | F3 note; VLA survey 2507.01925 |
| Open X-Embodiment / RT-X (2310.08864) | 2023 | The cross-embodiment dataset (60 datasets, 22 robots, 21 institutions, 1M+ trajectories, one standardized format) that made generalist VLAs trainable; showed positive cross-robot transfer. | this lane's note |
| OpenVLA (2406.09246) | 2024 | An open 7B VLA on a 970K OXE subset; a reproducible baseline + efficient fine-tuning (LoRA, quantization). | F3 note; VLA survey 2507.01925 |
| Octo (2405.12213) | 2024 | A generalist transformer policy with a diffusion action head and block-wise attention so observation/action spaces can be added or removed at fine-tune time. | F3 note; VLA survey 2507.01925 |
| pi-0 (2410.24164) | 2024 | A flow-matching action expert with action chunking for high-frequency dexterous control: up to 50 Hz, an order of magnitude over RT-2's 5 Hz. | F3 note; VLA survey 2507.01925 |
| pi-0-FAST (in pi-0 line) | 2025 | A frequency-space (DCT) action tokenization giving up to 13.2x token compression and smoother trajectories. | VLA survey 2507.01925 |
| OpenVLA-OFT (2502.19645) | 2025 | A fine-tuning recipe (parallel decoding + action chunking + continuous action + L1 loss) that lifts OpenVLA's LIBERO success 76.5% -> 97.1% at 26x throughput. | this lane's note |
| GR00T N1 (2503.14734) | 2025 | An open dual-system humanoid VLA: slow ~10 Hz VLM (System 2) + fast ~120 Hz diffusion transformer (System 1), trained on a web/sim/real "data pyramid." | this lane's note |
| pi-0.5 (2504.16054) | 2025 | Heterogeneous co-training (97.6% non-mobile-manip data) for open-world generalization; first end-to-end system to clean a kitchen in an unseen home. Hierarchical: predicts a semantic subtask, then acts. | this lane's note |

Interpretation: the canon is one consistent story - scale the data, reuse a pretrained
VLM, improve the action head, and the reactive policy `p(a | o, l)` gets better. None of
these adds an explicit forecast of the future world state inside the control loop. That
absence is the opening for WAM (Part B).

## A.3 What VLA is genuinely good at, and its structural limits

| Dimension | VLA strength (sourced) | VLA structural limit (sourced) |
|---|---|---|
| Pretrained semantics | Reuses web-scale VLM knowledge; RT-2 (2307.15818) shows web semantics transfer to actions, with emergent generalization. | The semantics are about perception/language, not physics; the model never predicts how the world changes (WAM survey 2605.12090). |
| Instruction / object generalization | Follows novel instructions, manipulates unseen objects; pi-0.5 (2504.16054) generalizes to entirely new homes via heterogeneous co-training. | Generalization comes from data breadth, not from reasoning about consequences; long-horizon novel situations still fail (VLA survey 2507.01925). |
| Architectural simplicity | One model maps inputs to actions; easy to train as next-token / regression (VLA survey 2507.01925, "bitter lesson"). | Simplicity = no internal simulator; the model cannot ask "what happens if I do this?" before acting (WAM survey 2605.12090 intro). |
| Speed | Reactive control is fast; pi-0 50 Hz; OpenVLA-OFT 26x throughput (2502.19645). | (This is a genuine advantage with no offsetting limit; it is the main cost argument *for* VLA in Part B.4.) |
| Imitation quality | Strong when demonstrations cover the distribution (VLA survey 2507.01925). | Inherits the imitation-learning ceiling: bounded by demonstrator skill; suboptimal/idiosyncratic demos cap performance (VLA survey 2507.01925, "From Imitation to RL"). |
| Closed-loop robustness | Action chunking reduces compounding error somewhat (pi-0 2410.24164; VLA survey 2507.01925). | Behavior cloning suffers distribution shift / compounding error: small errors take the agent to states absent from training, where it errs more (the classic DAgger problem; see wave-2 lane 7). |
| Data | Open X-Embodiment (2310.08864) pooled 1M+ trajectories. | Robot demo data is "1/200,000" of LLM corpus scale (VLA survey 2507.01925); raw actions "cannot directly generalize across embodiments," and fine-tuning causes "catastrophic forgetting." |
| Evaluation / advisory use | Directly executable; easy to deploy as the controller. | It *is* the actuator: it emits the executed action, so it is hard to use advisorily or to query counterfactually ("what would happen if...") without a separate model. |

Interpretation: the limits cluster around one thing - there is no model of consequences.
A VLA cannot forecast `o'`, cannot be asked a counterfactual before acting, and inherits
behavior cloning's distribution-shift fragility because it has no dynamics model to fall
back on. Those are exactly the gaps a WAM is built to fill.

## A.4 The boundary is already blurring inside the VLA literature (primary-source)

The VLA survey (2507.01925) lists **goal state** as one of its eight action-token types: a
"predicted future observation - such as an image, point cloud, or video clip - serving as
an intermediate target." Goal-state VLAs (UniPi, AVDC, SuSIE, CoT-VLA, VPP, FLIP, Gen2Act)
generate a future image/video, then a low-level policy conditions on it. The survey says
this pairing "is powerfully supported by world models, which can predict visual goal
states," and that "planning and online exploration in VLA agents could be substantially
enhanced by integrating advances in world models."

Interpretation: this is the VLA field itself reaching toward forward prediction. It is the
cleanest evidence that VLA and WAM are two ends of a spectrum, not a wall. But predicting a
future image is not yet a WAM (see Part B.1): a goal-state VLA may generate `o'` without
the WAM survey's second criterion, *coupling* the action to that predicted future under a
world-modeling objective. Very recent points like VideoVLA (2512.06963, abstract-level,
unverified-body), which "predicts an action sequence as well as the future visual
outcomes," sit right on this boundary.

---

# Part B - The WAM-vs-VLA distinction (the centerpiece)

This is the artifact to hold in your head. Each point is source-backed. The companion
table is `matrices/wam-vs-vla-distinction.md`.

## B.1 Formal: VLA predicts no future; WAM predicts a future and couples to it

Primary-source (WAM survey 2605.12090, definition section):

- VLA objective: `L_VLA = E[-log p(a | o, l)]`. Output: action only.
- World Model objective: `L_WM = E[-log p(o' | o, a)]`. Output: predicted next state only;
  does not select an action (it is a learned simulator).
- WAM objective: `L_WAM = E[-log p(o', a | o, l)]`. Output: the *joint* of future state
  `o'` and action `a`.

A WAM must satisfy two criteria, verbatim sense from the survey:

1. **Forward Predictive Modeling**: forecast `o'` via a quantifiable representation -
   either explicit visual (pixels, optical flow) *or* implicit physical (a physics-grounded
   latent space).
2. **Coupled Action Generation**: deduce the action `a` "by strictly aligning [it] with the
   anticipated future states `o'`."

VLA has neither. It predicts no `o'` (criterion 1 fails) and so cannot couple to one
(criterion 2 fails). The survey is explicit that a model that merely inherits a video
backbone to map `p(a | o)` is a "Video Policy," not a WAM, because a WAM "requires an
active predictive commitment ... the synthesis of the next state `o'` is an explicit
component of the model's reasoning and output."

Interpretation: criterion 2 is the subtle one and the one that keeps the distinction
honest. Predicting a future (a goal-state VLA) is necessary but not sufficient; the action
must be *derived from* that prediction. This is why a goal-state VLA can look WAM-like yet
not be one, and why pi-0.5's intermediate prediction (a *language subtask*, 2504.16054) is
not a WAM forecast at all.

## B.2 Conceptual: perceive-then-react vs imagine-then-act

- VLA = "perceive, then react." It maps the present to an action with no mental simulation.
- WAM = "imagine the consequence, then act consistently with it." The WAM survey
  (2605.12090) frames this as moving "beyond observation-to-action mapping towards joint
  state-action prediction." The VLA survey's goal-state section (2507.01925) describes the
  human version: "we often engage in a mental simulation, envisioning the desired outcomes
  before executing any steps."

One predicts nothing about the world; the other predicts in order to decide. This is the
plainest one-sentence summary for a newcomer.

## B.3 Roles / authority: a VLA can only be an actuator; a WAM can be an actuator OR an advisor

This is the distinction that matters most for this project.

- A **VLA is necessarily an actuator**: it emits the action that gets executed. There is no
  other thing it can be, because its only output is the action.
- A **WAM can be used two ways**:
  - **WAM-as-actuator**: the WAM *is* the policy and emits the executed action. DreamZero
    (2602.15922, "World Action Models are Zero-shot Policies") is the canonical case: it
    jointly predicts video and action and outputs the executed action chunk.
  - **WAM-as-advisory predictor/evaluator**: the WAM predicts the expected next state, and
    a *separate* mechanism compares predicted-vs-observed to decide trust or replan, while
    something else owns execution. FFDC ("When to Trust Imagination," 2605.06222) is the
    canonical case: the WAM produces "an internal expectation of how the physical world
    should evolve," and a lightweight verifier compares it to the real rollout to decide
    whether to keep executing or replan. The WAM "does not fill arguments or override
    anything - it produces a consistency signal" (see the by-paper note
    `2605.06222-when-to-trust-imagination.md`).

The advisory mode has **no VLA analogue**: a VLA cannot be advisory, because its prediction
*is* its action. You cannot ask a VLA "what do you think will happen?" and then have a
different component act; the VLA's forward pass commits to the action.

Interpretation: this is precisely the hook for the project's hard rule ("the LLM proposes;
the runtime owns physical truth; a WAM, if adopted, must stay advisory"). Only the
advisory-WAM role is admissible here; the actuator-WAM role (DreamZero) is forbidden by
the same rule that forbids prose from being executable authority. See
`matrices/wam-vs-vla-distinction.md` for the WAM-as-actuator vs WAM-as-advisory split, and
wave-1's `wam-vs-vla-vs-policy-vs-runtime.md` for the full 8-paradigm placement.

## B.4 Evidence on the trade: WAMs buy foresight and robustness; VLAs are faster and simpler

Be balanced. The comparison is sourced from the robustness study Do-WAMs-Generalize
(2603.22078) and the WAM survey's cost facts (see `2603.22078-do-wams-generalize.md`).

- **Robustness / generalization (favors WAM)**: released WAMs are robust to noise,
  lighting, and layout perturbations (LingBot-VA 74.2% on RoboTwin2.0-Plus; Cosmos-Policy
  82.2% on LIBERO-Plus), attributed to spatiotemporal priors from the video backbone. A
  strong VLA (pi-0.5) can match them, but only with curated diverse data and/or an explicit
  dynamics objective. The study frames the WAM advantage as "the simplicity of the embodied
  pretraining phase."
- **Cost / latency (favors VLA)**: a WAM inference step is "at least 4.8x slower than
  pi-0.5" (2603.22078). DreamZero's 14B pixel WAM reaches only ~7 Hz even after a 38x
  speedup, far below the 50 Hz of non-generative VLAs (WAM survey 2605.12090; DreamZero
  2602.15922). VLA recipes keep widening this gap: OpenVLA-OFT hits 26x throughput
  (2502.19645).
- **A nuance on WAM design (from 2603.22078)**: cascaded / inverse-dynamics designs
  (condition the action on a *predicted* future state) are more data-efficient and less
  diversity-hungry than monolithic joint-denoising designs, whose robustness "collapses
  sharply when the training data lacks diversity." If a structured predictor is ever built
  here, this favors a cascaded structure-prediction-then-consequence approach.

Net (interpretation): VLA = fast, simple, cheap, strong when demos cover the distribution.
WAM = foresight, robustness to perturbation, an advisory/verifier mode, at a real compute
cost. The trade is genuine; neither dominates. For a project that runs at the LLM Actor
Turn's multi-second cadence and wants *advisory* foresight rather than high-frequency motor
control, the WAM cost objection is largely irrelevant (the latency that hurts a 50 Hz robot
does not hurt a multi-second deliberation loop), and the advisory mode is the whole point.

## B.5 Why an LLM-actor project may choose a WAM framing over a VLA framing

This entire point is **interpretation**, not a claim from any paper. It is kept modest and
tied to the repo's own rules.

The starting observation is structural. An LLM that reads typed Minecraft + social state
and selects one function-tool is, in the abstract, already a *reactive policy* in the VLA
mold: it computes `p(a | o, l)` with `o` = typed state, `l` = goal/instruction context,
`a` = the selected tool. It just uses a prompted LLM instead of a learned visuomotor net,
and a discrete tool selection instead of a motor action. By the VLA survey's own taxonomy
(2507.01925), the Actor Turn's output is closest to a "code" or "raw action" action token
under strict schemas. So by default, the project's actor is VLA-shaped: perceive the state,
react with a tool. It predicts nothing about consequences.

"Going WAM," in this project's sense, means adding exactly the piece a VLA lacks (Part B.1):
an explicit prediction of the candidate action's consequences - here a *social-material
state delta* (who will have which item, who will owe whom, who can now do what) - that is
then **checked against the runtime's verifier evidence and used advisorily**. That is the
advisory-WAM role of Part B.3 (the FFDC pattern, 2605.06222) instantiated on structured
social state rather than pixels: predict the expected next state, compare it to observed
evidence (inventory, container, transcript, verifier artifacts), and emit a trust/risk
signal - never fill a missing argument, never mark progress true, never override a
verifier, never replace Actor Turn selection.

This is why a WAM framing fits and a VLA framing does not, for this project specifically:

- A VLA framing would say the learned policy *is* the authority that acts. The repo
  forbids that ("the LLM proposes; the runtime owns physical truth"). A VLA has no admissible
  role here, because its only role is to be the actuator.
- A WAM framing has an admissible role: the advisory predictor/evaluator, which the VLA
  paradigm simply does not contain. The project does not want a faster reactor; it wants
  foresight about social-material consequences that the runtime can verify. That is a
  prediction-then-couple-then-check structure, which is the WAM idea, used advisorily.
- And the WAM definition is modality-independent (WAM survey 2605.12090: "video is merely
  one possible proxy ... single-image state transitions, dense point clouds, tactile/force
  feedback"), so a structured social-material `o'` is squarely inside the definition's
  "implicit physical representation" branch. A structured-state social WAM is a legitimate
  WAM, not a stretch of the term.

For the full structured-state argument and the advisory-only constraint, see wave-1's
`wam-foundations.md` (which this file does not rewrite) and the matrix
`wam-vs-vla-vs-policy-vs-runtime.md`. The one-line takeaway: an LLM tool-selector is a
VLA-shaped reactor by default; adding a verified, advisory prediction of social-material
consequences is what turns the framing into a (structured-state, advisory) WAM.

---

## Mechanically useful vs research contribution (lane summary)

- **Mechanically useful to borrow**: the precise two-criteria test (forecast `o'` AND
  couple the action to it) as the litmus for "is this a WAM"; the actuator-vs-advisory
  role split; the FFDC advisory loop (predict expected state -> compare to evidence ->
  trust/replan) as the control structure for an advisory social predictor; the action-token
  taxonomy as a way to locate the Actor Turn's output.
- **NOT the research contribution**: restating WAM-vs-VLA theory is pedagogy, not novelty;
  building the verifier/evidence loop is *support* (per the shared contract). The
  defensible research target remains action-conditioned *social-material* transition
  prediction in Minecraft, used advisorily - which no VLA, and no surveyed WAM, does.
