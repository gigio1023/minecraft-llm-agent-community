# Lane 9 brief: Action Models, VLA, and the WAM Synthesis (wave 2, F3)

Lane goal: teach a newcomer the **action-generation lineage** (behavior cloning -> VPT
+ inverse-dynamics labeling -> the VLA canon) and the **WAM synthesis** (the survey's two
criteria, Cascaded vs Joint, and the clean WAM-vs-WM-vs-VLA-vs-Video-Policy contrast).
Concrete value-add: the pedagogical synthesis theme file, plus the **VLA-canon by-paper
notes that wave-1 was missing**.

## Sources reviewed (8; 6 deep-read from LaTeX, 2 abstract-level)

VLA canon, deep-read from LaTeX (all 6 seed arXiv ids verified correct, zero corrections):
- 2212.06817 RT-1 (Robotics Transformer; action tokenization under BC)
- 2307.15818 RT-2 (coined "VLA"; web-VLM backbone + actions-as-text-tokens + co-fine-tuning)
- 2406.09246 OpenVLA (open 7B VLA; the reproducible reference; LoRA-fine-tunable)
- 2405.12213 Octo (diffusion action head + modular reconfigurable interface)
- 2410.24164 pi-0 / π_0 (flow-matching action expert; 50 Hz dexterous; pre/post-train recipe)
- 2501.09747 FAST (frequency-space action tokenizer; fixes high-frequency binning failure)

Abstract-level breadth (logged, no note): 2504.16054 pi-0.5; 2507.01925 VLA action-
tokenization survey.

WAM-synthesis sources re-read with the teaching lens (notes already existed from wave-1;
cited, not overwritten): 2605.12090 survey (020-def/040-arch/070-oppo), 2602.15922
DreamZero, 2603.22078 Do-WAMs-Generalize, 2605.06222 FFDC, 2604.25859 PFD, 2410.12822 AVID,
2206.11795 VPT, 2410.11758 LAPA.

## Files created

- `notes/by-theme/wam-action-models-vla-and-synthesis.md` (owned theme; Part 1 action
  lineage with a "what each VLA added" table; Part 2 WAM synthesis with a tiny worked
  example for Cascaded and for Joint, and the neighbor-contrast table). Links to
  `wam-foundations.md` and `wam-vs-vla-vs-policy-vs-runtime.md`; does not duplicate them.
- New by-paper notes: `2212.06817-rt1.md`, `2307.15818-rt2.md`, `2406.09246-openvla.md`,
  `2405.12213-octo.md`, `2410.24164-pi0.md`, `2501.09747-fast.md`.
- `raw-search-results/lane-9-manifest.jsonl` (8 rows), `lane-9-search-log.md`, this brief.

## Strongest findings (source-backed)

1. **The VLA canon's progress is on two levers, not the objective.** All six members are
   behavior cloning / supervised `p(a|o,l)`; what advances is (a) the reused backbone
   knowledge (ImageNet -> web VLM, RT-2's thesis that web pretraining is the source of
   generalization) and (b) the action representation (RT-1/RT-2/OpenVLA discrete 256-bin
   text tokens -> Octo diffusion head -> pi-0 flow matching -> FAST frequency-space tokens).
   FAST makes the representation point exactly: per-timestep binning gives near-zero
   marginal information per token at high frequency, so the policy copies the last action
   (OpenVLA's documented DROID failure).
2. **Every VLA is reactive; the WAM is precisely the one that adds a coupled forward
   prediction.** The survey's two criteria (Forward Predictive Modeling + Coupled Action
   Generation) draw the line cleanly: a WM predicts `o'` but does not act; a VLA acts but
   does not predict; a Video Policy uses video features but makes no explicit prediction;
   a WAM predicts `o'` AND aligns the action to it (Cascaded = imagine-then-IDM; Joint =
   co-generate in one model). This is the conceptual core a newcomer needs.
3. **Predicting the future is often not load-bearing as rendered pixels; it is load-bearing
   as a checkable expectation.** Primary sources converge: the survey ("removing the future
   prediction head at test time does not necessarily degrade control"), PFD ("future is a
   compressible correction to be distilled," no inference-time generation), Fast-WAM
   (future only during training). The case where prediction does real work is the
   **verifier/safety** framing (FFDC; survey's "prediction-integrated safety = verify
   before execution"), which is also the only WAM use compatible with an advisory runtime.

## Weak or uncertain claims (could not fully verify)

- pi-0's "largest robot learning experiment / ~10,000 hours" and RT-2's emergent-reasoning
  anecdotes are authors' own claims (reproducibility partial/claim-only). The reproducible
  slice of the canon is the open set: OpenVLA (open 7B, MIT, ~1.37M HF downloads), Octo
  (open, MIT), FAST+ (official HF AutoProcessor, Apache-2.0). pi-0/pi-0.5 official weights
  live in the openpi GitHub repo with community HF ports.
- The Cascaded-vs-Joint comparison is taxonomic, not a settled ranking: the survey itself
  says no controlled matched-scale study exists (070-oppo). Only weak evidence that
  IDM-style cascaded designs are more data-efficient (Do-WAMs-Generalize).

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful: the *principles*, not the machinery. "Reuse a large pretrained
  model's knowledge" (RT-2) = the repo's LLM-Actor-Turn bet. "A token should carry real
  marginal information" (FAST) = independent validation of the repo's high-altitude typed
  Action Cards over low-level motor tokens. "Modular I/O so the interface evolves without
  retraining" (Octo) = a good prior for any future learned helper. The admissible WAM use
  is predict-then-verify (FFDC) / compressible-advisory-signal (PFD), never actuator.
- NOT the contribution: re-deriving VLA/WAM theory; adopting motor tokenization or flow
  heads (wrong altitude); treating manipulation success numbers as social/material
  evidence. Building a verifier is support per the shared contract.

## Recommended next questions

1. Is there a *structured-state* (non-pixel, non-motor) joint WAM anywhere in the
   literature, or is the structured branch genuinely empty (as wave-1 argues)? The survey's
   Joint-Predictive-Latent branch (VLA-JEPA) is the closest; worth a focused check.
2. For the advisory verifier use, what is the minimal "expected social-material delta"
   representation that an FFDC-style monitor could check against the repo's existing typed
   evidence, without ever gating action selection?
