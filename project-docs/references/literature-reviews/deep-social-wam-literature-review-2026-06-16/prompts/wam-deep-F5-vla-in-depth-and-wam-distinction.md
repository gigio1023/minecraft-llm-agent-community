# Lane 11 (F5): VLA in depth, and the WAM-vs-VLA distinction (the user's central question)

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum.md`
first. You are Lane 11. Manifest fragment: `raw-search-results/lane-11-manifest.jsonl`.

## Why this lane exists (read carefully)

The human reader stated the sharpest goal of the whole review: they want to frame this
project **as a WAM, not as a VLA**, and they want the **WAM-vs-VLA distinction made
crisp and source-backed** so they can internalize exactly why. Wave-1 and Lane 9 (F3)
touch VLA, but only as one step in an action-generation lineage. This lane gives VLA the
**proper, paradigm-level treatment it deserves** and produces the **authoritative
WAM-vs-VLA distinction artifact**.

## Deconfliction (do NOT collide with Lane 9 / F3)

Lane 9 owns: the action-generation *lineage* (behavior cloning -> VPT -> VLA canon as
steps), the WAM *synthesis* (Cascaded vs Joint), and the **by-paper notes for the VLA
canon papers (RT-1, RT-2, OpenVLA, Octo, pi-0)**. Do NOT write those same by-paper
notes; cite them by arXiv id (their notes will exist after merge). Your by-paper notes
cover VLA *depth extras* F3 will not: a VLA survey, the Open X-Embodiment dataset, and
later VLAs (pi-0.5, OpenVLA-OFT, GR00T) if verified. Your distinctive deliverables are
the **paradigm-depth theme** and the **dedicated WAM-vs-VLA matrix**.

## Part A: VLA as a paradigm, properly (primary-source, taught plainly)

- Define VLA precisely: `p(a | o, l)`, a policy mapping observation `o` + language
  instruction `l` directly to an action `a`. Reactive: no explicit forward/dynamics
  model, no predicted next state. Define "policy", "reactive", "behavior cloning",
  "action head/expert", "action tokenization", "cross-embodiment".
- The canon and what each *added* (one-line "innovation" each, in a table):
  - RT-1 (2212.06817): transformer policy trained on large real-robot demo data.
  - RT-2 (2307.15818): co-fine-tune a vision-language model on web + robot data, so web
    semantics transfer to robot actions (emergent generalization).
  - Open X-Embodiment (2310.08864, verify): the cross-embodiment dataset/effort that made
    generalist VLAs trainable.
  - OpenVLA (2406.09246): open 7B VLA, a reproducible baseline.
  - Octo (2405.12213, verify): generalist transformer policy, flexible observation/action.
  - pi-0 (2410.24164, verify): flow-matching action expert for high-frequency dexterous
    control; pi-0.5 (verify) for open-world generalization.
  - Optionally OpenVLA-OFT, GR00T N1 (verify) as recent points.
  - Find at least one VLA *survey* via `hf papers search "vision language action survey"`.
- What VLA is genuinely good at (state plainly, sourced): reusing pretrained VLM
  semantics; instruction/object generalization; architectural simplicity; fast reactive
  control; strong imitation when demos cover the distribution.
- VLA's **structural limits** (this is the motivation for WAM, keep it evidence-based,
  not editorial): no consequence prediction (cannot ask "what happens if I do this?"
  before acting); world dynamics only implicit; closed-loop distribution shift /
  compounding error inherited from behavior cloning; it *is* the actuator, so it is hard
  to use advisorily or to evaluate counterfactually. Cite the WAM survey's own
  VLA-limitation framing and `2603.22078-do-wams-generalize.md` (the robustness study
  comparing WAMs and VLAs).

## Part B: The WAM-vs-VLA distinction (the centerpiece)

Make this the artifact the reader can hold in their head. Cover, each source-backed:

1. **Formal**: VLA `p(a|o,l)` vs WAM `p(o',a|o,l)`. WAM adds the predicted future state
   `o'` and *couples* the action to it (the survey's two criteria: forward predictive
   modeling + coupled action generation). VLA has neither.
2. **Conceptual**: VLA = "perceive then react"; WAM = "imagine the consequence, then act
   consistently with it." One predicts nothing; the other predicts to decide.
3. **Roles / authority**: a VLA is necessarily an **actuator** (it emits the executed
   action). A WAM can be an actuator (DreamZero, `2602.15922`) **or** an **advisory
   predictor/evaluator** (FFDC, `2605.06222`: predict expected next state, compare to
   observed evidence, signal trust/replan). The advisory mode has no VLA analogue.
4. **Evidence on the trade**: do WAMs actually beat VLAs, and at what cost? Use
   `2603.22078-do-wams-generalize.md` (generalization/robustness) and the survey's
   cost/latency facts (WAM inference slower than VLA). Be balanced: VLA is faster and
   simpler; WAM buys foresight and an advisory/verifier mode at a compute cost.
5. **Why an LLM-actor project may choose a WAM framing over a VLA framing** (label as
   interpretation, keep modest): an LLM that reads typed state and selects one tool is
   already a *reactive policy* in the VLA mold (`p(a|o,l)`), just with an LLM instead of a
   learned visuomotor net. "Going WAM" means adding the missing piece a VLA lacks: an
   explicit prediction of the candidate action's consequences (here: social-material
   state deltas) that is then checked against runtime verifier evidence, used advisorily.
   Tie this to the repo rule "LLM proposes, runtime owns truth, a WAM stays advisory."
   Reference wave-1's `wam-foundations.md` and the matrix
   `matrices/wam-vs-vla-vs-policy-vs-runtime.md`; do not rewrite them.

## Owned deliverables

- `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md`, Part A (VLA in depth, with the
  "what each VLA added" table and a "strengths vs structural limits" table) and Part B
  (the distinction), definition-first, source-backed, newcomer-readable.
- `matrices/wam-vs-vla-distinction.md`, a focused matrix contrasting VLA vs WAM (and
  WAM-as-actuator vs WAM-as-advisory) across: formulation; predicts `o'`?; action coupled
  to predicted future?; role (actuator/advisory); inference cost; data; generalization
  evidence; fit to an LLM-actor + Mineflayer-runtime project. This is narrower and
  sharper than the existing 8-paradigm matrix; cross-link to it, do not duplicate it.
- New by-paper notes ONLY for your depth-extras (VLA survey, Open X-Embodiment, and any
  of pi-0.5 / OpenVLA-OFT / GR00T you verify and deep-read). Cite F3's canon notes for
  RT-1/RT-2/OpenVLA/Octo/pi-0.
- `raw-search-results/lane-11-manifest.jsonl`; `raw-search-results/lane-11-search-log.md`;
  `notes/subagent-briefs/lane-11-vla-and-wam-distinction.md`.

Tag rows `vla`, `wam`, and `world-model` / `data` / `validity` as apt. Verify every
arXiv id before fetching; mark anything unverifiable as "unverified report claim." No
em-dash / middle-dot / bullet-char (use ASCII `-`).
