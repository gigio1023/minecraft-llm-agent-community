# Reproducibility Matrix

Coordinator-owned, aggregated from `../source-manifest.jsonl` (107 unique
sources) plus per-lane notes. "Reproducibility" here = can an outside reader
re-run or re-derive the core artifact from released code/data/weights, **not**
that this review re-ran anything (the review did not run models or benchmarks).

## Summary counts (from the merged manifest)

| Status | Count | Meaning |
|---|---:|---|
| reproducible | 36 | code AND (weights or data) public enough to re-run the core artifact |
| partial | 35 | some of code/weights/data public; full re-run not guaranteed (often very recent 2026 robotics WAMs: paper + project page, weights pending) |
| claim-only | 22 | results asserted; no public code/data/logs sufficient to verify |
| n/a | 14 | surveys, theory books, frameworks where "reproducible" does not apply |

Interpretation: the **robotics WAM frontier is mostly `partial`** (2026 papers,
fast-moving, weights trickling out), the **Minecraft visual-policy stack is the
most `reproducible`** (CraftJarvis re-hosts VPT/STEVE-1/GROOT/ROCKET/JARVIS-VLA;
MineStudio ships code+data+weights), and the **headline social-simulation claims
are the most `claim-only`** (Project Sid especially). This shapes what the repo
can lean on: borrow reproducible Minecraft *infrastructure*; treat civilization
*claims* as hypotheses.

## Reproducible (lean on these as infrastructure / baselines / contrast)

| Source | id | code | weights | data | Note |
|---|---|---|---|---|---|
| MineStudio | 2412.18293 | yes (CraftJarvis) | VPT/STEVE-1/GROOT/ROCKET | `minestudio-data-6xx..10xx` (248GB+) | Full visual-policy stack; offline reference only. |
| VPT | 2206.11795 | yes | `CraftJarvis/MineStudio_VPT.*` | contractor data (converted) | Pixel policy; modality mismatch for social WAM. |
| STEVE-1 | 2306.00937 | yes | `MineStudio_STEVE-1.official` (12.8k dl) | - | Cheapest instructable Minecraft policy. |
| JARVIS-VLA | (CraftJarvis) | yes | `JarvisVLA-Qwen2-VL-7B` | `CraftJarvis/minecraft-vla-sft` (~106GB) | VLA SFT data public. |
| Solaris | 2602.22208 | yes | `nyu-visionx/solaris` (apache-2.0) | 12.64M frames (engine public) | Multiplayer pixel WM; visual sidecar at most. |
| Matrix-Game/2.0 | 2506.18701/2508.13009 | yes | `Skywork/Matrix-Game(-2.0)` (MIT) | Matrix-Game-MC 3,700h | Pixel Minecraft WM. |
| Oasis | (Etched) | partial | `Etched/oasis-500m` (MIT) | - | Pixel Minecraft WM. |
| DreamerV3 | 2301.04104 | yes (`danijar/dreamerv3`) | - | - | Latent WM; structured-feasibility proof. |
| AVID | 2410.12822 | yes | adapter | game+robot data | Weight-reuse method (pixels). |
| Melting Pot | 2107.06857 | yes (DeepMind) | - | scenarios | MARL generalization methodology. |
| Concordia | 2312.03664 | yes (`google-deepmind/concordia`) | - | - | Social-sim framework; LLM-GM (don't copy authority model). |
| MineDojo | 2206.08853 | yes | - | YouTube/Wiki/Reddit KB | Task suite + knowledge. |
| Voyager | 2305.16291 | yes | - | prompts | Skill-library agent. |
| Optimus-2 MGOA | 2502.19902 | yes | - | `iLearn-Lab/Optimus-2-MGOA` (10M+) | GOA pairs (pixel). |
| MineExplorer / MCU / MineNPC-Task | 2605.30931 / 2310.08367 / 2601.05215 | yes | - | task+validator data | Benchmark validators; competence gates. |

## Partial (cite carefully; verify before depending)

| Source | id | What's public | What's missing |
|---|---|---|---|
| DreamZero | 2602.15922 | paper, project page | full weights/training pipeline |
| FFDC / When-to-Trust | 2605.06222 | paper | code/weights |
| Privileged Foresight Distillation | 2604.25859 | paper | code |
| Do-WAMs-Generalize | 2603.22078 | paper, benchmark names | their exact eval harness |
| GigaWorld/Fast/Efficient-WAM, τ0-WM, World-VLA-Loop | 2603.17240 / 2603.16666 / 2606.10040 / 2606.01027 / 2602.06508 | papers | weights (very recent) |
| MineWorld | 2504.08388 | paper says code+weights released (Microsoft) | not located under `hf models list` search (flag) |
| Dreamer 4 | 2509.24527 | paper | code/weights |
| WildWorld | 2603.23497 | project page, dataset | full model |
| S3AP / Social World Models | 2509.00559 | paper | code/data |
| SOTOPIA family | 2310.11667 / 2403.08715 / 2506.12666 | code+data | - (mostly reproducible; partial only on hand-crafted recall set) |
| GLEE | 2410.05254 | paper, formulas | full agent harness |
| GovSim | 2404.16698 | paper, metrics | full env release status unverified this pass |

## Claim-only (treat as hypotheses / case catalogs, NOT baselines)

| Source | id | Why claim-only | Posture |
|---|---|---|---|
| **Project Sid** | 2411.00114 | report PDF + GitHub wrapper; **no code, server setup, prompts, raw transcripts, logs, seeds, replay, or scoring scripts**; metrics rest on LM-summarization / LM-inferred roles+sentiment / keyword proxies | Cite to constrain novelty; extract case designs WITH citation; only taxation-compliance is a verified material transition. |
| Genie 3 | (DeepMind) | closed weights, blog/figures | Capability reference only. |
| various 2026 robotics WAM preprints | (several) | preprint + project page, no release yet | Track; do not depend. |
| population sims (AgentSociety, SocioVerse, SALM) | 2502.08691 / 2504.10157 / 2505.09081 | macro-correlational validity; scale out of repo scope | Import intervention logic only. |

## n/a (surveys, theory, frameworks)

WAM survey (2605.12090), Actionable-Simulators survey (2601.15533), sociology
primary sources (Weber, Mead/Blumer, Goffman, Homans/Blau, Coleman, Granovetter,
North, Ostrom, Bicchieri/Elster, March-Simon/Nelson-Winter) - judged on
faithfulness of citation, not reproducibility. Several sociology anchors were
fetched as secondary-source paraphrase (TLS/503/403 on primary pages); the Lane 4
notes flag these for primary-book verification before any external publication.

## What this means for the repo (interpretation)

1. The **infrastructure** the repo might borrow (MineStudio callbacks, VPT/STEVE
   weights, Solaris data engine, Concordia components, SOTOPIA dimensions, GLEE
   formulas) is largely reproducible -> safe to adapt mechanically.
2. The **headline social/civilization results** (Project Sid) are claim-only ->
   not baselines; the repo's verified-transition stance is the corrective.
3. The repo's own runs would land in a **strong reproducibility position** by
   construction: deterministic Mineflayer world, verifier-auto-labeled
   transitions, released schema + logger + scoring - exactly the code/data/logs
   that Project Sid lacks. That is a defensible differentiator (but it is
   *support infrastructure*, not the research contribution).
