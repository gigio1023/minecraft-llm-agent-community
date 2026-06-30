# Source Comparison Matrix (cross-lane)

Coordinator-owned. One row per high-relevance source, drawn from all six lanes.
Full machine-readable list: `../source-manifest.jsonl` (107 unique sources).
Per-source detail: `../notes/by-paper/`. This table is the at-a-glance index of
the most decision-relevant sources only.

Legend - **Kind**: WAM (World Action Model `p(o',a|o,l)`), WM (world model
`p(o'|o,a)`), VLA (`p(a|o,l)`), POLICY (visual/RL policy), AGENT (LLM
planner/tool-use agent), BENCH (benchmark/eval), SOCSIM (social simulation),
THEORY (social science), DATA (dataset/data method). **Layer**: P=Physical,
M=Material, S=Social, I=Institutional (the WAM layers this source informs).

## A. WAM foundations and game/world models (Lane 1)

| Source | id | Kind | Predicts / measures | Weights/data public? | Layer | Repo takeaway |
|---|---|---|---|---|---|---|
| WAM survey "Next Frontier" | 2605.12090 | WAM (survey) | defines `p(o',a|o,l)`; Cascaded vs Joint; data+eval taxonomy | n/a (survey) | P (frame) | The canonical definition; modality-independent (pixels are one proxy). Anchor for the whole study. |
| DreamZero | 2602.15922 | WAM | joint video+action; zero-shot policy | partial | P | Mainstream WAM = actuator/policy (out of scope for this repo; WAM must stay advisory). 7Hz@14B = costly. |
| When-to-Trust-Imagination (FFDC) | 2605.06222 | WAM | predicted-vs-observed consistency -> trust/replan | partial | P | **WAM-as-verifier** pattern = the admissible advisory framing for this repo. |
| Privileged Foresight Distillation | 2604.25859 | WAM | future signal as distillable correction | partial | P | "Imagination" is a compressible signal, not rendered frames -> structured is enough. |
| Do-WAMs-Generalize | 2603.22078 | WAM (study) | WAM vs VLA robustness | partial | P | WAM step ≥4.8× slower than π0.5; fidelity≠control. |
| AVID | 2410.12822 | WM (adapter) | adapts frozen video-diffusion to action-conditioned WM | reproducible | P | Existing weights reusable via adapter - but output is pixels. |
| Actionable Simulators survey | 2601.15533 | WM (survey) | reframes WMs as "actionable simulators" | n/a | P | Names "visual conflation"; external endorsement of structured > pixel. |
| MineWorld | 2504.08388 | WM (pixel) | next Minecraft frame `p(x'|x,a)` | reproducible (MS) | P | Pixel Minecraft WM; 40k-160k tokens/16 frames. Visual sidecar only. |
| Solaris | 2602.22208 | WM (pixel, multiplayer) | multi-view player pixels; movement/memory/building | reproducible (nyu-visionx) | P | Only multiplayer Minecraft WM, but **no social-material state** - sharpest "open niche" evidence. |
| Matrix-Game / 2.0 | 2506.18701 / 2508.13009 | WM (pixel) | interactive Minecraft frames | reproducible (Skywork, MIT) | P | Real-time via distillation; pixels only. |
| Oasis | (Decart/Etched) | WM (pixel) | playable generated Minecraft | reproducible (Etched/oasis-500m) | P | Drifts; pixel-only; H100 to infer. |
| DreamerV3 | 2301.04104 | WM+RL (latent) | latent state + reward; actor-critic in imagination | reproducible | P | First diamonds from scratch; **latent+structured**, not pixel-primary -> structured feasibility proof. |
| Dreamer 4 | 2509.24527 | WM+RL (latent) | latent dynamics; diamonds from offline data | partial (paper) | P | Real-time single GPU; inputs incl. **inventory state** - structured/latent is the capable path in Minecraft. |
| WildWorld | 2603.23497 | WM+state (ARPG) | video + explicit per-frame state; State Alignment | partial (data) | P | Actions act through **hidden state not in pixels** ("shoot"->ammo ≈ "lend"->possession). Template for transition-accuracy metric. |
| Genie 3 | (DeepMind) | WM (pixel) | general worlds from text/image | closed | P | Impressive but closed + pixel; not a path here. |

## B. Minecraft agents / VLA / policy / benchmarks (Lane 2)

| Source | id | Kind | What it is | Weights/data | Layer | Repo takeaway |
|---|---|---|---|---|---|---|
| VPT | 2206.11795 | POLICY | video-pretrained behavior-cloned policy | weights (CraftJarvis) | P | Pixel->keyboard/mouse; auto-label via IDM (paid contractors). Modality mismatch. |
| STEVE-1 | 2306.00937 | POLICY (instructable) | instruction-tuned VPT ($60) | weights (CraftJarvis) | P | Cheap anchor, but pixels in / mouse out; predicts behavior, not consequence. |
| MineDojo | 2206.08853 | BENCH+DATA | open-ended task suite + YouTube/Wiki KB | data public | P | Task diversity + knowledge; competence-gate inspiration. |
| Voyager | 2305.16291 | AGENT | LLM + code skill library + curriculum | code | P | Skill accumulation -> actor-owned action skills (repo already adapts). Not the social target. |
| JARVIS-1 / JARVIS-VLA | 2311.05997 | AGENT/VLA | multimodal memory planner / VLA | weights (CraftJarvis) | P | Planner+memory; task-completion focused. |
| Optimus-2 / -3 | 2502.19902 / 2506.10357 | AGENT (MLLM+policy) | GOAP / MoE task experts | MGOA data (HF) | P | Pixel+low-level; single-actor; no social content. |
| MCU | 2310.08367 | BENCH | task-centric open-ended eval (6 difficulty axes) | code | P | Multi-dim difficulty scoring; competence gate. |
| MineExplorer | 2605.30931 | BENCH | hidden multi-hop dependency graphs | code+data | P | "larger/thinking models don't consistently win" (mirrors validity lane). |
| MineNPC-Task | 2601.05215 | BENCH | memory-aware, **machine-checkable validators**, bounded-knowledge | code+data | P/S | Closest to this repo's evidence stance; validator discipline reusable. |
| MineCollab / MINDcraft | 2504.17950 | BENCH (multi-agent) | decentralized collab; `givePlayer` handoff | code | M/S | Typed item handoff exists; −15% comms penalty; **no obligation ledger**. |
| TeamCraft | 2412.05255 | BENCH (multi-agent) | multimodal VLA collab | code | P/S | <50% generalization; task-completion scored. |
| VillagerBench | 2406.05720 | BENCH (multi-agent) | DAG task decomposition | code | P | Task dependency, not social dependency. |
| MineLand | 2403.19267 | BENCH (multi-agent) | 64+ agents; limited senses + needs | code | M/S | Scarcity forces comms; no claim ledger. |
| CausalMACE | 2508.18797 | BENCH (multi-agent) | causal intervention on subtask deps | code | P | Causal graph over **tasks**, not social debts. |
| MineStudio | 2412.18293 | TOOLKIT | sim+data+models+train+bench (VPT/STEVE/GROOT/ROCKET) | code+weights+data | P | Visual-policy/MineRL layer; offline reference + competence gates, not runtime. |

## C. LLM social simulation, benchmarks, validity (Lane 3)

| Source | id | Kind | What it measures | Grounded? | Layer | Repo takeaway |
|---|---|---|---|---|---|---|
| Generative Agents | 2304.03442 | SOCSIM | believability; memory/reflection/planning | no (text) | S | Memory retrieval (recency×importance×relevance) + reflection-with-citations = the transferable mechanism. |
| **Social World Models / S3AP** | 2509.00559 | **WAM (social)** | `p(A⁻ⁱ|S)`+`p(S'|S,A,aⁱ)`; Foresee-and-Act | partial (LLM-parsed state) | S | **The bridge**: structured social WAM exists, beats free text (+51% ToM). Repo's job: make `S'` a *verified* delta. |
| SOTOPIA (+ pi, Lifelong) | 2310.11667 / 2403.08715 / 2506.12666 | BENCH (social) | 7 social dims; multi-episode | no (text) | S | Dimension names reusable; LLM judge weak on diffuse dims; long-context recall collapses. |
| AgentSense | 2410.19346 | BENCH (social) | multi-party, private-info inference | no (text) | S | Asymmetric-knowledge scenario design. |
| Concordia | 2312.03664 | SOCSIM (framework) | grounded variables + LLM Game Master | code | M/S/I | Grounded-variable precedent; but GM is an LLM -> repo's GM is Mineflayer+validators (non-generative). |
| GLEE | 2410.05254 | BENCH (econ) | efficiency/fairness/self-gain (verifiable terminal) | partial | M | Formulas translate to verified material exchange; "no absolute best model - depends on partner." |
| Melting Pot | 2107.06857 | BENCH (MARL) | env-computed returns; social generalization | code | S | Partner/seed generalization methodology. |
| SimBench | 2510.17516 | BENCH (validity) | human-distribution fidelity (ceiling 40.8/100) | n/a | (validity) | Caps optimism; no inference-compute gain; variance collapse. |
| Don't-Trust-Generative-Agents | 2506.21974 | (validity) | empirical realism requires real data | n/a | (validity) | Repo must NOT claim human-fidelity; claim narrower verified trajectories. |
| Belief-Behavior Consistency | 2507.02197 | (validity) | stated belief ≠ enacted behavior | n/a | (validity) | The repo's central failure mode, scientifically stated -> verify behavior, not utterance. |
| Project Sid | 2411.00114 | SOCSIM (Minecraft, many-agent) | civilization signals (PIANO) | **claim-only** (no code/data/logs) | M/S/I | Nearest north-star + cautionary tale; only taxation-compliance is a verified material transition. |

## D. Sociology / data (Lanes 4-5)

| Source | id | Kind | Contribution | Layer | Repo takeaway |
|---|---|---|---|---|---|
| GovSim | 2404.16698 | THEORY->SIM | Ostrom CPR with LLMs; belief-of-others ↔ survival **r=0.83** | I | A Social-WAM capability is the bottleneck, not dialogue fluency. Borrow metrics; reject abstract-number commons. |
| Norms-from-public-sanctions | 2106.09012 | THEORY->MARL | norm = classifier over sanction history | I | `SanctionEvent` schema; "norm = learned from observed sanctions" matches repo. |
| Ostrom IAD + design principles | (book 1990/2005) | THEORY | action-situation; 8 CPR principles | M/I | Measurement checklist for weak commons; do NOT build full commons economy. |
| Homans/Blau exchange | (1961/1964) | THEORY | obligation/credit, imbalance->power | S | The obligation ledger = Blau's bookkeeping. |
| Coleman social capital + boat | (1988) | THEORY | credit slips, info channels, norms; micro->macro | S/I | Micro->macro is the hardest, least-proven claim. |
| VPT contractor-data paradigm | 2206.11795 | DATA | $20/h labeled seed + IDM pseudo-label | P | The repo's verifier **is** the IDM, for ~$0. |
| LAPA (latent action) | 2410.11758 | DATA | invent action vocab from pixels (VQ-VAE) | P | Explicitly **not needed** - repo already has typed actions. |
