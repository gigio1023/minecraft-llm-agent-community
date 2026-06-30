# Lane 9 (F3): Action Models, VLA, and the WAM Synthesis (the "act" half + the fusion)

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum.md`
first. You are Lane 9. Manifest fragment: `raw-search-results/lane-9-manifest.jsonl`.

## Why this lane exists

A World Action Model fuses two lineages: "predict the world" (lanes 7-8) and **"produce
the action."** A newcomer needs the action-generation side and then the synthesis that
makes WAM distinct from its neighbors. This is the conceptual core: what, precisely,
turns a world model + a policy into a *World Action Model*.

## What to nail down (primary-source, taught plainly)

- The action-generation lineage: behavior cloning -> large-scale internet-video
  pretraining with inverse-dynamics labeling (VPT) -> Vision-Language-Action (VLA) models
  that map pixels+instruction to motor actions. Define: behavior cloning, inverse-
  dynamics model (IDM), action tokenization, "generalist policy."
- The VLA canon and what each added (vision-language backbone reuse, cross-embodiment
  data, flow/diffusion action heads).
- The WAM synthesis itself, taught from the survey: the two criteria (forward predictive
  modeling + coupled action generation), Cascaded vs Joint, and the crisp contrasts WAM
  vs {pure World Model, pure VLA, Video Policy}. Build on the existing
  `wam-foundations.md` and the existing notes for DreamZero / FFDC / Do-WAMs-Generalize /
  AVID / Privileged-Foresight rather than rewriting them; your value-add is the
  *pedagogical synthesis* and the *VLA-canon notes that are currently missing*.
- The key conceptual question for a newcomer: when is predicting the future actually
  load-bearing for choosing the action, vs decorative? (Tie to the survey's "remove the
  prediction head at test time" observation; deep treatment is Lane 10's.)

## Seed sources (verify IDs before fetching)

Action-generation lineage:
- 2206.11795 VPT (note exists: `2206.11795-vpt.md`, cite/extend, the IDM-labeling trick
  is the teaching point; do not overwrite).
- VLA canon (these are the MISSING notes to create): 2212.06817 RT-1; 2307.15818 RT-2
  (web-knowledge transfer to robot actions); 2406.09246 OpenVLA (open 7B VLA); 2405.12213
  Octo (verify; generalist transformer policy); 2410.24164 pi-0 / "pi_0" (verify; flow-
  matching action head). Optionally pi-0.5 / FAST action tokenizer (2501.09747, verify).
- 2410.11758 LAPA (note exists, latent action pretraining; cite as bridge from VPT to
  the latent-action idea).

WAM synthesis (re-read with the teaching lens; notes mostly exist, extend in your theme):
- 2605.12090 WAM survey (DOWNLOADED at `papers/latex/2605.12090/`; re-read 020-def,
  040-arch, 070-oppo). 2602.15922 DreamZero (WAM-as-zero-shot-policy). 2603.22078 Do-WAMs-
  Generalize. 2605.06222 When-to-Trust-Imagination / FFDC (WAM-as-verifier). 2410.12822
  AVID (adapt frozen video-diffusion weights into an action-conditioned WM). 2604.25859
  Privileged Foresight Distillation.

## Owned deliverables

- `notes/by-theme/wam-action-models-vla-and-synthesis.md`, two parts: (1) the action-
  generation lineage taught plainly (BC -> VPT/IDM -> VLA canon), with a small "what each
  added" table; (2) the WAM synthesis: the two criteria, Cascaded vs Joint with a tiny
  worked example each, and a clean "WAM vs WM vs VLA vs Video-Policy" contrast aimed at a
  newcomer (this complements, not duplicates, `wam-foundations.md` and the
  `wam-vs-vla-vs-policy-vs-runtime.md` matrix, link to them).
- New by-paper notes for the missing VLA canon: RT-1, RT-2, OpenVLA, Octo, pi-0
  (and FAST if verified).
- Manifest + search-log fragments (lane 9); brief
  `notes/subagent-briefs/lane-9-action-models-vla-synthesis.md`.

Tag rows `vla`, `wam`, `world-model` as apt. Keep robot-manipulation specifics brief;
the teaching goal is the *concepts*, not a robotics survey.
