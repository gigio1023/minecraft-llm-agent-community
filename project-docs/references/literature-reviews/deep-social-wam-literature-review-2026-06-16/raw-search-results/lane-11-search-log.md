# Lane 11 (F5) Search Log: VLA in depth, and the WAM-vs-VLA distinction

Lane: 11 (wave 2). Date of all entries: 2026-06-16.
Tooling order per contract: Hugging Face CLI (`hf papers ...`) first, then web via
WebSearch / WebFetch. LaTeX-first extraction via `scripts/fetch_arxiv_latex.sh`.

Deconfliction note: Lane 9 (F3) owns the by-paper notes for the VLA canon (RT-1,
RT-2, OpenVLA, Octo, pi-0). This lane cites those by arXiv id and only writes
by-paper notes for depth-extras (VLA survey, Open X-Embodiment, later VLAs).

---

## 1. arXiv id verification (seed brief said "verify first")

All IDs below were verified via `hf papers search` / `hf papers info` before any fetch.

| Seed in brief | Verified id | Title | Status |
|---|---|---|---|
| Open X-Embodiment 2310.08864 | 2310.08864 | Open X-Embodiment: Robotic Learning Datasets and RT-X Models | CORRECT (exact title match) |
| pi-0.5 (no id given) | 2504.16054 | pi_{0.5}: a Vision-Language-Action Model with Open-World Generalization | RESOLVED |
| OpenVLA-OFT (no id given) | 2502.19645 | Fine-Tuning VLA Models: Optimizing Speed and Success (OpenVLA-OFT) | RESOLVED |
| GR00T N1 (no id given) | 2503.14734 | GR00T N1: An Open Foundation Model for Generalist Humanoid Robots | RESOLVED (code+weights public; dual-system VLA) |
| VLA survey (find one) | 2507.01925 | A Survey on VLA Models: An Action Tokenization Perspective | CHOSEN as primary deep-read (39 upvotes, taxonomy = action tokens; directly relevant to distinction) |

Canon IDs (F3-owned notes; cited not re-noted), confirmed present in papers/latex/:
- RT-1 2212.06817, RT-2 2307.15818, OpenVLA 2406.09246, Octo 2405.12213, pi-0 2410.24164.

WAM-side primary sources for the distinction (wave-1 notes exist; cited + re-read for
primary facts), confirmed present in papers/latex/:
- WAM survey 2605.12090; do-WAMs-generalize 2603.22078; FFDC/when-to-trust-imagination
  2605.06222; DreamZero 2602.15922.

## 2. Searches run (hf papers)

1. `hf papers search "vision language action models survey" --limit 12`
   - Rationale: find at least one VLA survey for the paradigm-depth note.
   - Result: many surveys. Picked 2507.01925 (action-tokenization perspective) as the
     deep-read; logged 2405.14093 (the *first* VLA survey, 2024-05) and 2509.19012
     ("Pure VLA: A Comprehensive Survey") as breadth/abstract-only.
2. `hf papers search "Open X-Embodiment robotic learning datasets RT-X" --limit 8`
   - Result: 2310.08864 confirmed (22 robots, 21 institutions, 527 skills, 160266 tasks).
3. `hf papers search "pi-0.5 vision-language-action open-world generalization" --limit 6`
   - Result: 2504.16054 (pi_{0.5}); also surfaced 2604.15483 (pi_{0.7}, 2026-04, bonus
     recent point) and 2512.06963 (VideoVLA: a VLA that ALSO predicts future visual
     outcomes -- conceptually a VLA/WAM hybrid; logged as a "line is blurring" datapoint).
4. `hf papers search "OpenVLA-OFT optimized fine-tuning vision-language-action" --limit 6`
   - Result: 2502.19645 (OpenVLA-OFT) confirmed.
5. `hf papers search "GR00T N1 foundation model humanoid robots" --limit 6` and
   `hf papers info 2503.14734`
   - Result: 2503.14734 confirmed; dual-system (System 2 VLM + System 1 diffusion
     transformer); github NVIDIA/Isaac-GR00T (7.3k stars), weights nvidia/GR00T-N1-2B public.

## 3. LaTeX fetches (depth-extras only; canon already downloaded by wave-1/F3)

- `bash scripts/fetch_arxiv_latex.sh 2507.01925 vla-survey-action-tokenization`
- `bash scripts/fetch_arxiv_latex.sh 2310.08864 open-x-embodiment`
- `bash scripts/fetch_arxiv_latex.sh 2504.16054 pi-0-5`
- `bash scripts/fetch_arxiv_latex.sh 2502.19645 openvla-oft`
- `bash scripts/fetch_arxiv_latex.sh 2503.14734 groot-n1`
(See "source_availability" in lane-11-manifest.jsonl for which resolved to latex vs pdf.)

## 4. Re-reads of already-downloaded LaTeX (for primary-source distinction facts)

- papers/latex/2605.12090/ (WAM survey): VLA-limitation framing, two WAM criteria,
  cost/latency facts, decoupled evaluation.
- papers/latex/2603.22078/ (do WAMs generalize): WAM-vs-VLA robustness comparison + cost.
- papers/latex/2605.06222/ (FFDC): advisory predict-then-verify loop (the no-VLA-analogue
  WAM mode).
- papers/latex/2602.15922/ (DreamZero): WAM-as-actuator ("zero-shot policy") framing.
- papers/latex/2212.06817, 2307.15818, 2406.09246, 2405.12213, 2410.24164 (VLA canon):
  consulted for primary-source VLA definition facts; by-paper notes owned by F3.

## 5. Notes on what could not be fully verified

- Some 2026 papers (pi-0.7 2604.15483, the "Datasets/Benchmarks/Data Engines" survey
  2604.23001) are very recent; used at abstract level only, marked accordingly.
- Exact inference-rate numbers vary by source and hardware; quoted with their source and
  not generalized.
