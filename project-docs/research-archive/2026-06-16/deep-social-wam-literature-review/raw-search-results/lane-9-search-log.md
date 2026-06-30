# Lane 9 search log (action models, VLA, WAM synthesis)

Date: 2026-06-16. Lane 9 (wave 2, F3). Discovery channel order per contract: Hugging
Face CLI (`hf papers search`) first to VERIFY every seed arXiv id, then LaTeX fetch via
`scripts/fetch_arxiv_latex.sh`, then `hf models info` for availability. No web search was
needed: all six VLA-canon seed ids verified correct on the first `hf papers search`, so no
ID corrections were required.

## 1. ID verification (hf papers search) - all seeds confirmed, zero corrections

- `hf papers search "RT-1 Robotics Transformer real-world control at scale" --limit 5`
  -> top hit **2212.06817** (RT-1). Seed 2212.06817 CONFIRMED.
- `hf papers search "RT-2 vision-language-action models web knowledge robotic control" --limit 3`
  -> top hit **2307.15818** (RT-2). Seed 2307.15818 CONFIRMED.
- `hf papers search "OpenVLA open-source vision-language-action model" --limit 3`
  -> top hit **2406.09246** (OpenVLA). Seed 2406.09246 CONFIRMED.
- `hf papers search "Octo open-source generalist robot policy transformer" --limit 4`
  -> top hit **2405.12213** (Octo). Seed 2405.12213 CONFIRMED (brief flagged "verify").
- `hf papers search "pi0 vision-language-action flow matching model generalist robot" --limit 4`
  -> hit **2410.24164** (π_0). Seed 2410.24164 CONFIRMED (brief flagged "verify"). Bonus:
  **2504.16054** = pi-0.5 surfaced.
- `hf papers search "FAST efficient action tokenization vision-language-action robot" --limit 4`
  -> top hit **2501.09747** (FAST). Seed 2501.09747 CONFIRMED. Bonus: **2507.01925** =
  "A Survey on VLA Models: An Action Tokenization Perspective" surfaced (useful action-token
  taxonomy: language/code/affordance/trajectory/goal-state/latent/raw-action/reasoning).

## 2. LaTeX fetch (cornerstone deep-reads)

One batched call to `scripts/fetch_arxiv_latex.sh` (the script sleeps 3s after each
network call, so a serial batch is the polite path):

- `bash scripts/fetch_arxiv_latex.sh 2212.06817 rt1`     -> tarball_extracted, 2 tex
- `bash scripts/fetch_arxiv_latex.sh 2307.15818 rt2`     -> tarball_extracted, 2 tex
- `bash scripts/fetch_arxiv_latex.sh 2406.09246 openvla` -> tarball_extracted, 9 tex
- `bash scripts/fetch_arxiv_latex.sh 2405.12213 octo`    -> tarball_extracted, 8 tex
- `bash scripts/fetch_arxiv_latex.sh 2410.24164 pi0`     -> tarball_extracted, 1 tex (575 lines)
- `bash scripts/fetch_arxiv_latex.sh 2501.09747 fast`    -> tarball_extracted, 9 tex

All 6 deep-read from LaTeX: RT-1 `main.tex` (model/data/action-tokenization/inference);
RT-2 `main.tex` (action-as-text-tokens, co-fine-tuning, 55B); OpenVLA
`sections/03_approach.tex` (Prismatic backbone, quantile binning, LoRA, 6 Hz); Octo
`sections/03_approach.tex` (modular tokenizers, readout heads, diffusion head); pi-0
`main.tex` (flow-matching action expert, H=50, 50 Hz, pre/post-train recipe); FAST
`sections/03_educational_example.tex` + `04_method.tex` (marginal-information diagnosis,
DCT+BPE, FAST+ universal tokenizer).

## 3. WAM survey re-read (already downloaded `papers/latex/2605.12090/`)

Per brief, re-read with the teaching lens: `020-def.tex` (the two criteria + WAM vs
VAM/Video-Policy/AWM disambiguation), `040-arch.tex` (Cascaded vs Joint taxonomy, explicit
vs implicit planning, autoregressive vs diffusion joint), `070-oppo.tex` (open problems:
"remove future-prediction head at test time," latent-predictive/JEPA, latency tax,
joint-evaluation gap, prediction-integrated safety = predict-then-verify).

## 4. HF availability checks (hf models info / list)

- `hf models info openvla/openvla-7b` -> open weights, MIT, 7.54B params, ~1.37M downloads,
  arxiv:2406.09246 tagged. reproducibility=reproducible.
- `hf models info rail-berkeley/octo-base-1.5` -> open, MIT, checkpoints + JAX pipeline.
  reproducibility=reproducible.
- `hf models list --search "pi0"` -> official pi-0/pi-0.5 weights live in the openpi GitHub
  repo (Physical Intelligence); HF has community ports (e.g. lerobot/pi0fast-libero). pi-0
  reproducibility=partial (official code public, HF ports exist).
- `hf models info physical-intelligence/fast` -> official FAST+ tokenizer, Apache-2.0, 172
  likes, released as HuggingFace AutoProcessor. reproducibility=reproducible.

## 5. Existing wave-1 notes read (cite, do not overwrite)

`notes/by-theme/wam-foundations.md`, `matrices/wam-vs-vla-vs-policy-vs-runtime.md`,
`matrices/action-space-comparison.md`, `notes/by-theme/minecraft-vla-and-visual-policy.md`,
and by-paper notes `2206.11795-vpt.md`, `2410.11758-lapa.md`, `2602.15922-dreamzero.md`,
`2603.22078-do-wams-generalize.md`, `2605.06222-when-to-trust-imagination.md`,
`2604.25859-privileged-foresight-distillation.md`, `2410.12822-avid.md`.

## Scope notes

- Robot-manipulation specifics kept brief per brief; teaching goal is the *concepts*
  (action tokenization, IDM, generalist policy, the two WAM criteria, Cascaded vs Joint).
- The repo-application argument (structured social WAM, 4-layer hierarchy) was deliberately
  NOT re-derived; it is wave-1's (`wam-foundations.md`, `repo-adaptation-matrix.md`). Each
  source got at most a one-line repo-relevance pointer per wave-2 scope discipline.
- Biggest unverified item: pi-0's "largest robot learning experiment / 10,000 hours" and
  RT-2's emergent-reasoning anecdotes are the authors' own claims (claim-only / partial
  reproducibility); the open canon (OpenVLA, Octo, FAST+) is the reproducible part.
