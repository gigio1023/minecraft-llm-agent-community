# Data Requirements Matrix (Lane 5)

Option x {data needed, volume, label source, compute cost, weights reusable?,
time-to-first-result, fit to structured social-material WAM, risk}.

Options (from `notes/by-theme/data-and-training-feasibility.md`): A train-from-
scratch pixel; B adapt existing Minecraft weights; C LLM zero-shot delta predictor;
D structured transition dataset from runtime logs; E small symbolic/adapter model.

| Option | Data needed | Volume | Label source | Compute cost | Weights reusable? | Time to 1st result | Fit to structured social-material WAM | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **A** Pixel from scratch | Minecraft video + labeled seed | 10k-70k+ hours video; ≥100 h labeled (VPT) | IDM-pseudolabel from paid contractor seed | H100-weeks/months (Oasis needs H100 just to infer) | n/a (you train it) | months | **Very low**, pixels, no possession/obligation, re-learns what Mineflayer already knows | Huge cost; wrong modality; violates "runtime owns truth" |
| **B** Adapt Minecraft weights (VPT/STEVE-1/Optimus-2) | Pretrained pixel policy + small finetune set | STEVE-1 $60 finetune; Optimus-2 MGOA 10M-100M | their pixel/action labels | small finetune, but pixel inference stack needed | yes, but pixel obs + mouse/keyboard action | weeks | **Low**, single-actor, material-acquisition, no social events; no transfer path to typed state | Integration cost for ~zero transfer; modality mismatch |
| **C** LLM zero-shot delta predictor | Held-out logged transitions for scoring | starts at 0 new; eval set N≈50-300 | verifier (auto) + small human gold | provider inference only (metered, guarded); harness is provider-free | uses LLM as-is, no training | **days** | **High**, directly tests advisory WAM consequence prediction in typed space | Elicitation not a learned model; provider cost if run large |
| **D** Structured transition dataset from logs | Existing run artifacts joined into ROWs | hundreds-low thousands of rows in 2 mo (bounded by run throughput + budget) | verifier + inventory/container deltas + social-event ledger (auto, ~$0) | ~$0 labeling; run generation is metered | n/a (it is data) | **days** (logger) | **Highest**, the WAM `(o,a,o')` triplet in a modality no public dataset covers, cheap | Volume ceiling; social ledger today partly scripted in smokes |
| **E** Small symbolic / adapter | Option D rows | same K as D | from D (auto) + human social gold | hours on 1 GPU (adapter); rules ~free | small adapter weights, this repo's own | weeks (after D) | **Medium-high**, physical deltas near-deterministic; social head is the learnable part | Small-data overfit; sequence after C+D; do NOT add latent-action (entanglement risk) |

## Public Minecraft dataset reuse assessment

| Dataset | Size | License | Modality | Structured social-material fit | Use here |
| --- | --- | --- | --- | --- | --- |
| VPT (OpenAI) | ~70k h web + ~2k h contractor; HF `vpt_data_8.0_*` parts ~3GB each | Apache-2.0 / MIT | RGB video + keyboard-mouse 20 Hz | No (pixel, low-level action) | Contrast only |
| MineStudio data-6xx..10xx (CraftJarvis) | ~168 GB per shard | MIT | LMDB: image/action/event/meta/motion/segmentation | No (pixel primary; `event/` keyed to frames) | Contrast; note `event/` exists |
| STEVE-21K (See and Think 2311.15209) | 600 vision-env pairs + 20K QA + skill-code DB | research | first-person video + text QA | No (video + knowledge QA, no transition) | Contrast |
| Optimus-2 MGOA (2502.19902) | ~25k videos, 8 atomic tasks, 10M-100M | MIT | webdataset, pixel + low-level action | No (single-actor, gather/craft only) | Contrast |
| Oasis (Decart/Etched) | "millions of hours" trained | n/a (hosted model) | pixel diffusion world model | No (pure pixel WM, no symbolic state) | Cost/compute anchor |
| `declip/Minecraft-Server-Chat` | 1M-10M lines | CC0-1.0 | text chat | No (no embodied link) | Optional chat-style realism reference only |
| `naklecha/minecraft-question-answer-700k` | 100k-1M | CC-BY-NC-SA-3.0 | text QA | No | Game-knowledge only |

## Cost anchors (for reviewers)

| Anchor | Cost / compute | Source |
| --- | --- | --- |
| VPT contractor data (best IDM, ~2000 h) | ~$40,000 (of ~$90k used, ~$160k total) | arXiv 2206.11795 `a_1_contractor_data.tex` |
| VPT minimal viable IDM (~100 h) | ~$2,000 | arXiv 2206.11795 `3_4_data_scaling.tex` |
| STEVE-1 instruction tuning | $60 | arXiv 2306.00937 |
| LAPA pretraining efficiency | >30x vs SOTA VLA; +6.22% over OpenVLA | arXiv 2410.11758 |
| Oasis inference | 1 NVIDIA H100, 360-720p @ 20 fps, minutes of coherence | Decart/Etched 2024 (web) |
| **This repo: auto-label one transition ROW** | **~$0 (verifier emits it)**; run generation metered per provider call | repo artifacts (`runtime_result.last_tool_result`, `social-cycle-review-summary/v1`) |
