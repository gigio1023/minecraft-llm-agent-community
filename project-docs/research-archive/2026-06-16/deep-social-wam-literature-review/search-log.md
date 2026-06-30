# Search Log

All discovery commands/searches, dated, with rationale. Coordinator entries
first; per-lane fragments live in `raw-search-results/lane-<N>-search-log.md` and
are merged here at the end.

Channels: Hugging Face CLI (`hf`, primary), then WebSearch/WebFetch (arXiv,
Semantic Scholar, Papers with Code, GitHub, project pages, docs).

## 2026-06-16 — Coordinator seed

Environment: `hf` v1.16.1, authenticated as `naem1023`. Rationale for hf-first:
the task mandates Hugging Face CLI as a primary discovery channel; `hf papers`
gives upvote-ranked recent papers + markdown reads, and `hf datasets/models`
reveal weight/data availability directly.

```
# WAM / world-model / Minecraft seed discovery (raw output saved):
hf papers search "world action model" --limit 12
hf papers search "Minecraft agent" --limit 15
hf papers search "action-conditioned video world model game" --limit 12
# -> raw-search-results/hf-discovery-coordinator.txt (+ persisted large dump)
```

Cornerstone found: arXiv **2605.12090** "World Action Models: The Next Frontier
in Embodied AI" (formal WAM definition, Cascaded/Joint taxonomy, data ecosystem,
evaluation). Pulled LaTeX source to validate the fetch pipeline:

```
chmod +x scripts/fetch_arxiv_latex.sh
bash scripts/fetch_arxiv_latex.sh 2605.12090 world-action-models-survey
# -> papers/latex/2605.12090/ (9 .tex files incl. 020-def, 040-arch, 050-data, 060-eval)
# -> papers/metadata/2605.12090.json (latex_status: tarball_extracted)
```

Coordinator read `020-def.tex` + `010-intro.tex` to extract the canonical
definitions (recorded in README and used to seed all lane contracts).

Other seeds surfaced for lane hand-off (full list in
`raw-search-results/hf-discovery-coordinator.txt`):

- WAM/robotics: 2602.15922 DreamZero, 2603.22078 (WAM vs VLA robustness),
  2605.06222 (When to Trust Imagination), 2604.25859 (Privileged Foresight
  Distillation), 2603.16666 Fast-WAM, 2606.10040 Efficient-WAM,
  2603.17240 GigaWorld-Policy, 2606.01027 tau_0-WM, 2602.06508 World-VLA-Loop,
  2410.12822 AVID.
- Game/Minecraft world models: 2602.22208 Solaris, 2604.18564 MultiWorld,
  2508.13009 Matrix-Game 2.0, 2603.23497 WildWorld, 2511.09057 PAN,
  2502.07825 DWS, 2605.08567 ACWM-Phys.
- Minecraft agents: 2502.19902 Optimus-2, 2506.10357 Optimus-3, 2310.08367 MCU,
  2601.05215 MineNPC-Task, 2605.30931 MineExplorer, 2305.16291 Voyager,
  2311.05997 JARVIS-1, 2604.05533 Echo, 2605.27762 PEAM, 2410.22194 ADAM,
  2305.17144 GITM, 2311.15209 STEVE, 2507.23698 (multi-task RL spatial).

## Per-lane logs (merged at synthesis)

See `raw-search-results/lane-1-search-log.md` ... `lane-6-search-log.md`.

## MERGED_LANE_LOGS_BELOW

---

### From raw-search-results/lane-1-search-log.md

# Lane 1 search log (WAM Foundations and Game World Models)

Date: 2026-06-16. Discovery: Hugging Face CLI (`hf`) first, then web. All paper LaTeX
fetched via `bash scripts/fetch_arxiv_latex.sh <id> <slug>`.

## Repo grounding read first
- `prompts/00-shared-lane-contract.md`, `prompts/lane-1-wam-foundations.md`
- `project-docs/research-archive/2026-06-16/social-wam-research-frame.md` (the WAM seed this review expands)
- `project-docs/research-archive/2026-06-16/nitrogen-2601-02427-analysis.md` (existing NitroGen analysis; reused as the "future motor substrate / contrast class" framing)
- `raw-search-results/hf-discovery-coordinator.txt` (coordinator's pre-run HF dump; scanned for minecraft/world-model/dreamer/genie/oasis hits)

## WAM survey deep-read (already downloaded)
- Read `papers/latex/2605.12090/`: 020-def (formal defs), 010-intro, 070-oppo (open challenges), 030-wm (background lineage + WM-for-VLA quad), 060-eval (eval taxonomy + IDM Turing Test), 050-data (four data sources). Rationale: this is the definitional anchor for the whole lane.

## LaTeX downloads (primary sources)
- `fetch_arxiv_latex.sh 2602.15922 dreamzero` — DreamZero (WAMs are zero-shot policies). 7 tex.
- `fetch_arxiv_latex.sh 2603.22078 do-wams-generalize` — robustness comparative study. 1 tex.
- `fetch_arxiv_latex.sh 2605.06222 when-to-trust-imagination` — FFDC adaptive WAM execution (verifier framing). 1 tex.
- `fetch_arxiv_latex.sh 2604.25859 privileged-foresight` — PFD (future signal is compressible). 1 tex.
- `fetch_arxiv_latex.sh 2410.12822 avid` — adapt frozen video diffusion to WM (weight reuse). 10 tex.
- `fetch_arxiv_latex.sh 2602.22208 solaris` — multiplayer Minecraft video WM. 31 tex (split sections).
- `fetch_arxiv_latex.sh 2603.23497 wildworld` — explicit-state ARPG dataset (structured-state contrast). 7 tex.
- `fetch_arxiv_latex.sh 2504.08388 mineworld` — open-source Minecraft pixel WM. 3 tex.
- `fetch_arxiv_latex.sh 2509.24527 dreamer4` — latent WM agent, diamonds from offline data. 27 tex.
- `fetch_arxiv_latex.sh 2601.15533 actionable-simulators` — "visual conflation" / actionable-simulator survey. 1 tex.
- `fetch_arxiv_latex.sh 2506.18701 matrix-game` — interactive world foundation model (Minecraft). 1 tex.

## HF papers searches
- `hf papers search "MineWorld interactive Minecraft world model" --limit 6` — surfaced Matrix-Game (2506.18701), MineWorld (2504.08388), Dreamer 4 (2509.24527), iVideoGPT (2405.15223), "Simulating the Visual World" roadmap (2511.08585), and crucially **"From Generative Engines to Actionable Simulators" (2601.15533)**.
- `hf papers search "Oasis real-time generated Minecraft" --limit 6` — confirmed Matrix-Game beats Oasis+MineWorld; surfaced Dreamer 4 again, BugCraft, MCU.
- (coordinator dump already contained Solaris 2602.22208, WildWorld 2603.23497, Matrix-Game 2.0 2508.13009, and the Minecraft-agent long tail: Optimus-2/3, JARVIS-1, Voyager, GITM, ADAM, MineExplorer, MineNPC-Task, PEAM.)

## HF model/dataset availability checks (weight reuse question)
- `hf models list --author nyu-visionx --limit 15` — `nyu-visionx/solaris` (minecraft, world-model, multi-agent, apache-2.0) confirmed public.
- `hf models list --search MineWorld` — no direct hit under that name (paper states code+weights released by Microsoft; recorded as released-per-paper).
- `hf models list --search Matrix-Game` — `Skywork/Matrix-Game` and `Skywork/Matrix-Game-2.0` (MIT) + distilled diffusers variants confirmed.
- `hf models list --search Oasis-500m` / `open-oasis` — `Etched/oasis-500m` (MIT, ~500M, 496 likes) confirmed.
- Finding: all public Minecraft/game WM weights output **pixels**; none outputs structured social-material state.

## Web searches (canonical breadth facts)
- WebSearch "DreamerV3 Hafner first to collect diamonds Minecraft from scratch without human data Nature 2025" — confirmed DreamerV3 (arXiv 2301.04104) Nature 2025, first diamonds from scratch without human data; code `danijar/dreamerv3`.
- WebSearch "Genie 3 DeepMind 2025 real-time interactive general world model 720p" — confirmed Genie 3: real-time 720p/24fps, autoregressive, several-minutes memory, text/image prompts, weights not public.

## Notes on coverage
- LaTeX deep-read: 11 sources (2605.12090, 2602.15922, 2603.22078, 2605.06222, 2604.25859, 2410.12822, 2602.22208, 2603.23497, 2504.08388, 2509.24527, 2601.15533). Matrix-Game LaTeX downloaded, treated abstract-level.
- Abstract / card / docs level: Matrix-Game 2.0, Oasis, Genie, Genie 3, GameNGen, DreamerV3, iVideoGPT, PAN, NitroGen.
- Did NOT chase the full Minecraft-LLM-agent long tail (Voyager, JARVIS-1, Optimus, GITM, ADAM, MineExplorer) — those are Lane 2 (Minecraft agents) territory; recorded only as context.

---

### From raw-search-results/lane-2-search-log.md

# Lane 2 Search Log — Minecraft Agent / VLA / Visual Policy / Benchmarks

Date: 2026-06-16. Tools: Hugging Face CLI (`hf`, primary), then WebSearch/WebFetch.
Authenticated `hf` user as seen in coordinator log (`naem1023`). Each block lists
the exact command/query and a one-line rationale.

## Hugging Face CLI — model/dataset availability

```
hf models list --search VPT --limit 15
hf models list --search STEVE-1 --limit 10
hf models list --search GROOT --limit 10
hf models list --search ROCKET --limit 10
hf models list --author CraftJarvis --limit 30
```
Rationale: confirm which Minecraft visual-policy weights are actually public.
Finding: generic name searches return unrelated repos (VPTQ quantization, GPT-2
bots, Marvel "Groot" dreambooth). The canonical re-hosting org is
**CraftJarvis**, which publishes VPT (`MineStudio_VPT.*`), STEVE-1
(`MineStudio_STEVE-1.official`, 12,822 downloads — most used), GROOT
(`MineStudio_GROOT.18w_EMA`), ROCKET (`MineStudio_ROCKET-1.12w_EMA`,
`ROCKET-3-1.5x`), JarvisVLA (`JarvisVLA-Qwen2-VL-7B`, 519 downloads), and a 2509
OpenHA / CrossAgent / motion-action family.

```
hf datasets list --search minecraft --limit 25
hf datasets list --search MineRL --limit 10
hf datasets list --search minedojo --limit 10
hf datasets list --search STEVE-21K --limit 5          # No results found
hf datasets list --search "minecraft trajectory" --limit 8
hf datasets list --search MGOA --limit 5
hf datasets list --search "Optimus minecraft" --limit 5
hf datasets info CraftJarvis/minecraft-vla-sft
hf papers info 2502.19902
```
Rationale: record public trajectory/dataset shapes and sizes.
Findings:
- `CraftJarvis/minecraft-vla-sft` — 216 train parquet shards, ~106 GB, 1M–10M
  rows, MIT, 2,177 downloads (JARVIS-VLA SFT data).
- `iLearn-Lab/Optimus-2-MGOA` — webdataset, 10M–100M scale, MIT, 974 downloads
  (Optimus-2 GOA pairs).
- `zhwang4ai/minecraft-trajectory` + `minecraft-language-trajectory` — GROOT-2 /
  CraftJarvis trajectory data (manual-download gated, small download counts).
- MineStudio converted VPT contractor data lives under
  `CraftJarvis/minestudio-data-6xx..10xx` (per existing repo analysis;
  6xx page = 248 GB, no card, viewer unavailable).
- STEVE-21K is not a clean HF dataset record (hosted off-Hub / Google Drive).
- `osanseviero/minedojo_knowledge` exists but is a tiny knowledge dump, not the
  MineDojo YouTube/Wiki/Reddit corpus.

## Hugging Face CLI — paper discovery (reused coordinator dumps + new)

```
hf papers search "multi-agent Minecraft cooperation" --limit 12
hf papers search "TeamCraft multi-agent embodied" --limit 6
hf papers search "collaborative Minecraft agents communication" --limit 10
hf papers search "video pretraining Minecraft action labels" --limit 8
hf papers search "MineDojo internet knowledge open-ended" --limit 6
hf papers search "JARVIS-VLA vision language action keyboard mouse" --limit 6
hf papers search "STEVE-1 instructable generative agent Minecraft" --limit 6
```
Rationale: pull upvote-ranked recent + canonical IDs and confirm arXiv numbers.
Confirmed canonical IDs: VPT 2206.11795, STEVE-1 2306.00937, MineDojo 2206.08853,
JARVIS-VLA 2503.16365, GROOT 2310.08235 (note: coordinator-seed "2503.10684" is a
DIFFERENT paper, "Open-World Skill Discovery from Unsegmented Demonstration
Videos", a CraftJarvis skill-segmentation work — kept separately).
Multi-agent in-HF: MineCollab/MINDcraft 2504.17950, S-Agents 2402.04578, HAS
2403.08282, MindForge 2411.12977, MindAgent 2309.09971, CWM 2307.02485.

## LaTeX pulls (primary sources)

```
bash scripts/fetch_arxiv_latex.sh 2206.11795 vpt
bash scripts/fetch_arxiv_latex.sh 2306.00937 steve1
bash scripts/fetch_arxiv_latex.sh 2503.16365 jarvis-vla
bash scripts/fetch_arxiv_latex.sh 2206.08853 minedojo
bash scripts/fetch_arxiv_latex.sh 2503.10684 groot        # actually Skill-Discovery
bash scripts/fetch_arxiv_latex.sh 2310.08235 groot-v1     # the real GROOT
bash scripts/fetch_arxiv_latex.sh 2412.10410 groot2
bash scripts/fetch_arxiv_latex.sh 2410.17856 rocket1
bash scripts/fetch_arxiv_latex.sh 2502.19902 optimus2
bash scripts/fetch_arxiv_latex.sh 2506.10357 optimus3
bash scripts/fetch_arxiv_latex.sh 2601.05215 minenpc-task
bash scripts/fetch_arxiv_latex.sh 2605.30931 mineexplorer
bash scripts/fetch_arxiv_latex.sh 2504.17950 minecollab-mindcraft
bash scripts/fetch_arxiv_latex.sh 2310.08367 mcu
```
All 14 returned `latex=tarball_extracted`. Read intro/method/action-observation/
data/eval sections directly.

## Web (arXiv / ACL / GitHub / OpenReview) — benchmarks not in hf papers

```
WebSearch "VillagerBench Minecraft multi-agent benchmark VillagerAgent arxiv"
WebSearch "TeamCraft multi-modal multi-agent Minecraft benchmark arxiv 2024 2025"
WebSearch "Plancraft Minecraft planning LLM agent benchmark crafting evaluation arxiv"
WebSearch "CausalMACE causal multi-agent Minecraft cooperation arxiv 2025"
WebSearch "Odyssey empowering Minecraft agents open-world skills arxiv MineMA"
WebSearch "MineLand multi-agent Minecraft simulator limited multimodal senses physical needs arxiv"
WebSearch "ROCKET-1 ROCKET-2 Minecraft visual-temporal context segmentation embodied agent arxiv CraftJarvis"
WebSearch "Narayan-Chen collaborative building Minecraft architect builder grounded dialogue corpus dataset"
WebSearch "GROOT learning to follow instruction-free gameplay videos Minecraft arxiv 2024 CraftJarvis"
```
Confirmed IDs: VillagerAgent/VillagerBench 2406.05720 (ACL-Findings 2024, code on
GitHub), TeamCraft 2412.05255 (55k task variants, has VLA baseline), Plancraft
2412.21033 (text + GUI, includes intentionally-unsolvable subset, PyPI package),
CausalMACE 2508.18797 (EMNLP-Findings 2025), Odyssey 2407.15325 (IJCAI 2025, 40
primitive + 183 compositional skills, LLaMA-3 fine-tune, code zju-vipa/Odyssey),
MineLand 2403.19267 (64+ agents, limited senses + physical needs, code
cocacola-lab/MineLand), ROCKET-1 2410.17856 (CVPR'25), Narayan-Chen Minecraft
Dialogue Corpus ACL 2019 (P19-1537, 509 dialogues, architect/builder, no arXiv).
Also surfaced: PillagerBench 2509.06235 (competitive team Minecraft) — noted, not
deep-read.

## Existing repo analyses reused (NOT re-cloned, per brief)

- `project-docs/research-archive/2026-06-16/minestudio-reference-check.md`
- `project-docs/research-archive/2026-06-16/minestudio-implementation-analysis.md`
These already inventory MineStudio at commit 278aa85 (Oct 2025): 153 task YAMLs
(76 simple + 77 hard), 671 init commands (368 `/give`), VPT/STEVE-1/GROOT/ROCKET
model code, MineRL/Malmo simulator, VLM auto-eval. Lane-2 sharpens, not repeats.

---

### From raw-search-results/lane-3-search-log.md

# Lane 3 Search Log — LLM Social Simulation and Social Benchmarks

Lane 3 (N=3). Discovery channels: Hugging Face CLI (`hf`, primary), then
WebSearch/WebFetch (arXiv, ACL Anthology, OpenReview, Semantic Scholar, GitHub,
project pages). Each entry: command/search, date, one-line rationale.

## 2026-06-16

Environment: `hf` v1.16.1, authenticated (`naem1023`). Rationale for hf-first:
the contract mandates Hugging Face CLI as primary discovery; `hf papers search`
gives upvote-ranked recent papers and resolves arXiv ids directly. The
coordinator HF dump (`hf-discovery-coordinator.txt`) was WAM/world-model heavy
(other lanes); none of Lane 3's social-eval seeds were in it, so Lane 3 ran its
own searches.

### HF paper searches (resolving seed ids + surfacing new sources)

```
hf papers search "SOTOPIA social intelligence agents" --limit 8
  -> 2310.11667 SOTOPIA (core), 2506.12666 Lifelong SOTOPIA, 2403.08715 SOTOPIA-pi,
     2508.03905 Sotopia-RL, 2509.00559 Social World Models (S3AP, new high-value find)
hf papers search "generative agents interactive human behavior" --limit 5
  -> 2304.03442 Generative Agents; 2411.10109 1000 People
hf papers search "generative agent simulations 1000 people" --limit 5
  -> 2411.10109 (confirm); 2502.08691 AgentSociety; 2412.03563 From Individual to Society survey
hf papers search "Concordia generative agent-based modeling" --limit 5
  -> 2312.03664 Concordia; 2411.07038 Concordia GABM guide; 2512.03318 Concordia mixed-motive
     generalization (NeurIPS 2024 Concordia Contest writeup, new)
hf papers search "do not trust generative agents mimic communication benchmark" --limit 5
  -> 2510.07709 multimodal safety sim (peripheral)
hf papers search "SimBench benchmarking LLM social simulation" --limit 5
  -> 2510.17516 SimBench (confirm)
hf papers search "belief behavior consistency LLM agents simulation" --limit 6
  -> 2507.02197 belief-behavior consistency (Trust Game); 2503.02016 belief-gap group identity;
     2402.04559 Can LLM Agents Simulate Human Trust Behaviors? (new, pairs with 2507.02197)
hf papers search "PersonaGym persona agents evaluation" --limit 5
  -> 2407.18416 PersonaGym; 2508.10014 PersonaEval; 2603.25620 PICon
hf papers search "GLEE LLM economic games negotiation bargaining" --limit 4
  -> economic-game cluster; GLEE itself (2410.05254) not top-ranked in hf, verified via web
hf papers search "MAgIC multi-agent LLM cognition game" --limit 4
  -> 2311.08562 MAgIC; 2310.10701 ToM for multi-agent collab
hf papers search "MultiAgentBench coordination milestone KPI" --limit 4
  -> 2503.01935 MultiAgentBench
hf papers search "Melting Pot multi-agent reinforcement learning evaluation" --limit 4
  -> 2403.11381 LLM-augmented agents on Melting Pot; 2407.07086 Hypothetical Minds (ToM scaffolding, new)
hf papers search "PARTNR embodied multi-agent household planning benchmark" --limit 4
  -> 2411.00081 PARTNR
hf papers search "AgentSense social scenario benchmark goal completion" --limit 4
  -> 2410.19346 AgentSense
hf papers search "M3-Bench social agent memory benchmark" --limit 4
  -> 2508.09736 M3-Bench (multimodal long-term-memory agent)
hf papers search "PsyMem psychological memory persona LLM" --limit 4
  -> 2505.12814 PsyMem
hf papers search "SALM social agent language model benchmark" --limit 4
  -> 2505.09081 SALM (social network simulation); 2305.14938 SocKET (social knowledge, new)
hf papers search "CoELA cooperative embodied agents language" --limit 4
  -> 2307.02485 CoELA
hf papers search "Overcooked human-AI coordination zero-shot" --limit 4
  -> 2312.15224 hierarchical LM agent for real-time human-AI coordination (Overcooked-style)
hf papers search "SocioVerse social simulation world model 10 million" --limit 4
  -> 2504.10157 SocioVerse
```

### Web verifications (seeds not top-ranked in hf)

```
WebSearch "arXiv 2506.21974 Do Not Trust Generative Agents to Mimic Communication"
  -> confirmed 2506.21974 (EACL 2026), authors Munker/Schwager/Rettinger, empirical-realism thesis
WebSearch "GLEE arXiv 2410.05254 LLM economic games framework efficiency fairness"
  -> confirmed 2410.05254 (OpenReview/ICLR), efficiency/fairness/self-gain metrics,
     finding "no absolute best model; performance depends on competitor's model"
```

### LaTeX downloads (12 primaries, LaTeX-first per contract §5)

```
bash scripts/fetch_arxiv_latex.sh 2310.11667 sotopia              # tarball, 23 tex
bash scripts/fetch_arxiv_latex.sh 2304.03442 generative-agents    # tarball, 19 tex
bash scripts/fetch_arxiv_latex.sh 2312.03664 concordia            # tarball, 1 tex (self-contained main)
bash scripts/fetch_arxiv_latex.sh 2510.17516 simbench             # tarball, 2 tex
bash scripts/fetch_arxiv_latex.sh 2506.21974 dont-trust-genagents # tarball, 14 tex
bash scripts/fetch_arxiv_latex.sh 2507.02197 belief-behavior-trust# tarball, 7 tex
bash scripts/fetch_arxiv_latex.sh 2410.05254 glee                 # tarball, 34 tex
bash scripts/fetch_arxiv_latex.sh 2509.00559 social-world-models  # tarball, 15 tex
bash scripts/fetch_arxiv_latex.sh 2411.10109 1000-people          # source was PDF -> papers/pdf/2411.10109.pdf
bash scripts/fetch_arxiv_latex.sh 2410.19346 agentsense           # tarball, 40 tex
bash scripts/fetch_arxiv_latex.sh 2506.12666 lifelong-sotopia     # tarball, 26 tex
bash scripts/fetch_arxiv_latex.sh 2407.18416 personagym           # tarball, 12 tex
```

Read depth: full method/eval/limitations LaTeX for SOTOPIA, Generative Agents,
Concordia, SimBench, belief-behavior, GLEE, S3AP/Social World Models, AgentSense,
Lifelong SOTOPIA, Don't Trust. PersonaGym (rubric only). 1000 People (abstract +
PDF, web-confirmed numbers). Breadth sources (AgentSociety, SocioVerse, MAgIC,
MultiAgentBench, PARTNR, Concordia-contest, PsyMem, SALM, From-Individual survey)
recorded at abstract level; the repo's own reference-sweep + expanded-related-work
notes already carry their abstracts, so Lane 3 cross-references rather than re-fetches.

### Repo grounding read

```
SPEC.md (vocabulary + non-negotiables)
project-docs/research-archive/2026-06-16/social-wam-research-frame.md (the WAM seed expanded)
project-docs/research-archive/Project-Sid-2411-00114-Review-2026-06-15.md (existing Sid review)
project-docs/research-archive/2026-06-16/reference-sweep-beyond-project-sid.md
project-docs/research-archive/2026-06-16/expanded-related-work-sweep.md
```

---

### From raw-search-results/lane-4-search-log.md

# Lane 4 Search Log, Sociology / Social Theory Grounding

Lane 4 (N=4). Date: 2026-06-16 (`Asia/Seoul`). Channels: Hugging Face CLI
(`hf`, authenticated as `naem1023`) for computational-sociology papers; WebSearch
/ WebFetch for canonical theory (Stanford Encyclopedia of Philosophy, Ostrom
Workshop, primary-text references).

Note on this lane: most canonical sociology anchors (Weber, Goffman, Homans,
Blau, Coleman, Granovetter, North, Ostrom, Bicchieri, Elster, Nelson & Winter)
are books / pre-arXiv journal articles, so the primary discovery channel for them
is the web (SEP + reputable secondary catalogs), not `hf papers`. `hf papers` was
used to find the *computational* operationalizations (norm emergence, LLM
commons governance, generative social agents) that show how these theories have
already been turned into measurable agent variables.

## Hugging Face CLI, computational-sociology discovery

```
# norm emergence / LLM social norms
hf papers search "social norm emergence multi-agent" --limit 12
hf papers search "LLM agents social norms conventions" --limit 12
# social exchange / reputation / reciprocity
hf papers search "reputation reciprocity cooperation agents simulation" --limit 10
# commons governance / social dilemma (Ostrom-adjacent)
hf papers search "commons governance social dilemma reinforcement learning" --limit 10
# generative agents / social capital / trust
hf papers search "generative agents social capital trust simulation" --limit 10
# emergent roles / division of labor
hf papers search "emergent role specialization division of labor multi-agent" --limit 10
```

Strongest computational hits (read in depth via `hf papers read`):

```
hf papers read 2404.16698   # GovSim: Ostrom-grounded common-pool-resource LLM sim
hf papers read 2106.09012   # social norms from public sanctions (Classifier Norm Model)
```

Other relevant computational candidates recorded to manifest (abstract-level):
2510.14401 (social learning + collective norm formation in LLM agents),
2412.10270 (cultural evolution of cooperation among LLM agents),
2404.02491 (Measuring Social Norms of LLMs), 2606.14600 (LoSoNA local-norm
adaptation benchmark), 2304.03442 (Generative Agents), 2502.08691
(AgentSociety), 2606.02859 (Economy of Minds, economic interactions),
2011.00620 (Social Chemistry 101 norm reasoning).

## Web, canonical theory anchors

```
WebSearch "Ostrom IAD framework ... action situation rules-in-use eight design principles commons"
WebFetch  https://en.wikipedia.org/wiki/Institutional_analysis_and_development_framework   # rule taxonomy (thin)
WebFetch  https://plato.stanford.edu/entries/social-norms/        # Bicchieri empirical/normative expectations; Elster
WebSearch "Ostrom eight design principles long-enduring common-pool resource ..."
WebFetch  https://www.agrariantrust.org/ostroms-eight-design-principles-for-a-successfully-managed-commons/  # 8 principles wording
WebFetch  https://plato.stanford.edu/entries/social-institutions/  # North/Weber/roles/sanctions/collective-acceptance
WebSearch "Granovetter strength of weak ties 1973 / embeddedness 1985"
WebSearch "Goffman interaction order / Blau exchange and power / Homans elementary social behavior"
WebSearch "Coleman 1988 social capital ... obligations expectations information channels norms; Coleman's boat"
WebSearch "Weber social action ... four types instrumentally rational value-rational affectual traditional"
WebSearch "Nelson Winter 1982 organizational routines ... March Simon bounded rationality"
```

Failed / blocked fetches (recorded for honesty, did not fabricate around them):

- `WebFetch gpde.direito.ufmg.br/.../Ostrom-2011-Policy_Studies_Journal.pdf`, TLS
  cert error ("unable to verify the first certificate"). Used Ostrom Workshop +
  SEP + Wikipedia + agrariantrust instead for IAD components and design principles.
- `WebFetch ostromworkshop.indiana.edu/.../iad-framework/index.html`, HTTP 503.
- `WebFetch wiki.p2pfoundation.net/Eight_Design_Principles...`, HTTP 403. Got the
  eight principles from agrariantrust.org (paraphrased wording; flagged as such).

## Reproducibility note

Theory anchors are claim-faithful to widely cited primary works; where I relied
on a secondary catalog (not the original book) I label the source as secondary in
the by-paper notes and matrix. GovSim (2404.16698) and the public-sanctions norm
model (2106.09012) are reproducible/partial (open-source sim + standard MARL
methods, respectively).

---

### From raw-search-results/lane-5-search-log.md

# Lane 5 Search Log (Data and Training Feasibility)

All work 2026-06-16 (Asia/Seoul). Tooling: `hf` CLI 1.16.1 (auth user `naem1023`),
WebSearch/WebFetch, repo Read/Bash. No provider/API calls. No live benchmarks.

## Repo artifact grounding (Read, not run)

- `project-docs/Architecture/Transcript-And-Runtime-Artifacts.md`, evidence
  contract: transcript steps, actor evidence files, provider snapshots, usage
  records. Rationale: ground ROW schema in real fields.
- `project-docs/Architecture/Context-Projection-And-Source-Evidence.md` , 
  `current_state` + `source_evidence_bundle` two-layer Actor Turn input.
- `project-docs/Architecture/Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`
 , function-tool selection, Action Card schema, codegen boundary.
- `project-docs/Specification/Runtime-Evidence-And-Action-Skills.md`, verifier
  fake-progress rules, `settlement-state/v1`, world-scan schemas.
- `project-docs/Specification/Reference-Adaptation-Guide.md`, which references
  the repo already adopts (Voyager, MineDojo, Embodied Agent Interface, etc.).
- Real report JSON inspected (Bash + python json):
  - `tmp/social-cycle-...-20260607T152128Z.json`, `social-cycle-run-report`
    full shape (cycles[], settlement_state/v1, postcondition_results,
    plan_bead_operation_results, provider_usage).
  - `tmp/...-review-summary.json`, `social-cycle-review-summary/v1` with per-cycle
    `rows[]` (the closest existing thing to a transition ROW).
  - `project-docs/Experiments/2026-06-15/grounded-social-trajectory-smoke/report.json`
   , `grounded-social-trajectory-report/v1`: typed social `events[]`
    (request/promise/shared_deposit) + scored `dimensions[]`.
  - `project-docs/Experiments/2026-06-14/placed-furnace-natural-60/scored-summary.json`
   , `benchmark-score-bundle/v1`: milestone `evidence_rule` auto-label rules.
  - `project-docs/Experiments/2026-06-13/50-cycle-gpt55-medium-worksite/report-review-summary.json`
   , confirms row schema generalizes to craft/mine/build/author rows.

## HF dataset discovery (`hf datasets ...`)

- `hf datasets list --search minecraft --limit 25`, mostly text-QA + skins +
  text-to-image. Trajectory ones are pixel/video.
- `hf datasets list --search VPT`, `BarryFutureman/vpt_data_8.0_*` (LeRobot,
  image+action parquet). `rp-yu/VPT_Datasets` is NOT Minecraft (Visual Perception
  Token VQA; name collision, excluded).
- `hf datasets list --search minerl`, `irotem98/minerl*`, `Andemand11/minerl-navigate`
  (video).
- `hf datasets list --search minestudio`, `CraftJarvis/minestudio-data-6xx..10xx`
  (-v106 and -v110). MIT.
- `hf datasets info CraftJarvis/minestudio-data-10xx-v110`, 168 GB shard, LMDB
  (`.mdb`) channels: action/, image/, event/, meta_info/, motion/, segmentation/.
- `hf datasets info BarryFutureman/vpt_data_8.0_part_0`, LeRobot v2.1, fps 20,
  3 episodes / 14238 frames / 1 task per part, parquet image+action, ~3 GB/part.
- `hf datasets list --search STEVE`, no Minecraft STEVE-21K (it lives on GitHub).
- `hf datasets list --search basalt`, none.
- `hf datasets list --search "minecraft trajectory"` , 
  `zhwang4ai/minecraft-trajectory` (video, manual gate),
  `zhwang4ai/minecraft-language-trajectory`,
  `limuyu011/minecraft_trajectory_grounding_actions` (14 MB, single
  `samples_v1.zip`; small grounding-action sample, modality unconfirmed).
- `hf datasets list --search "minecraft dialogue"` / `"embodied social interaction"`
 , no results (no structured embodied-social Minecraft dataset on HF).
- `hf datasets list --search "optimus minecraft"` /  `"MGOA"` , 
  `iLearn-Lab/Optimus-2-MGOA` (MIT, 10M-100M, webdataset, arxiv 2502.19902).
- `hf datasets card iLearn-Lab/Optimus-2-MGOA`, Multimodal Goal-Observation-Action.

## HF papers (`hf papers search`)

- "latent action pretraining", LAPA (2410.11758), CLAP (2601.04061), Motus
  (2512.13030), JALA (2602.21736), VLA-JEPA (2602.10098), UniVLA (2505.06111).
- "video pretraining minecraft", VPT (2206.11795), STEVE-1 (2306.00937),
  Open-World Skill Discovery / SBD (2503.10684), BC-via-search (2212.13326).

## LaTeX downloaded (`scripts/fetch_arxiv_latex.sh`)

- 2206.11795 vpt (18 tex), method + contractor-data + data-scaling appendices.
- 2410.11758 lapa (2 tex), VQ-VAE latent action, >30x pretrain efficiency.
- 2306.00937 steve1 (15 tex), $60 instruction-tuning cost anchor.
- 2502.19902 optimus2 (41 tex), MGOA dataset paper.
- (2605.12090 WAM survey 050-data.tex already present; deep-read for data ecosystem.)

## Web (WebSearch)

- "STEVE-21K dataset", See and Think (2311.15209): 600 vision-env pairs +
  20K QA pairs (Wiki/Reddit, GPT-3.5 cleaned) + skill-code DB. Pixel + text.
- "Oasis Decart minecraft diffusion world model", autoregressive diffusion pixel
  WAM, millions of hours, 1 frame/keystroke, 360-720p @ 20fps on H100.

## Grep checks

- WAM survey eval (060-eval.tex) + oppo (070-oppo.tex): zero matches for
  "minecraft", "structured state", "symbolic". The canonical WAM literature is
  robotics/egocentric/sim pixel data; structured-state Minecraft is a gap.

---

### From raw-search-results/lane-6-search-log.md

# Lane 6 Search Log

Lane 6 = Repo Adaptation and Benchmark Design. This lane is primarily
repo-facing (Read repo docs + code, no execution, no edits outside ROOT).
External lookups are intentionally minimal per shared lane contract §5 (breadth =
manifest + abstract; LaTeX extraction for the social/multi-agent literature is
owned by Lanes 2-4).

## 2026-06-16: Repo reads (no commands run; Read tool only)

Read in full for grounding (cited in the matrix and brief):
- `SPEC.md`, `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`, repo `CLAUDE.md`.
- `project-docs/research-archive/2026-06-16/social-wam-research-frame.md`.
- Specification: `Soul-Grounded-Social-Simulation.md`, `Evidence-Grounded-Minecraft-Society.md`, `Runtime-Evidence-And-Action-Skills.md`.
- Architecture: `Actor-Episode-And-Actor-Turn-Architecture.md`, `Actor-Turn-Tool-Calling-And-Full-Context-Codegen.md`, `Context-Projection-And-Source-Evidence.md`, `Actor-Persistent-State-And-PlanBeads.md`, `Material-Claims-And-Social-Economy-Benchmark-Plan.md`, `Grounded-Social-Trajectory-Benchmark-Spec.md`, `Research-Direction-Reference-Synthesis.md`.

Code grounding (Read only):
- `probe/src/runtime/goals/actorEpisode/{types.ts,outcomeContract.ts,resolver.ts}`, found the `ActorTurnExpectedOutcome` enum and the expected-vs-observed delta comparison (the WAM seam).
- `probe/src/runtime/evidence/actorEvidence.ts`, `probe/src/gameplay/verification/verifyTask.ts`, verifier + fake-progress rejection.
- `probe/src/npc/relationships/relationshipLedger.ts`, evidence-gated social-state enum machine.
- `probe/src/runtime/settlement/settlementState.ts`, `probe/src/gameplay/primitives/registry.ts`, `probe/src/server/worldScenarios.ts`.
- `probe/src/objectives/socialIssues/{borrowedTool.ts,types.ts}`, `probe/src/objectives/socialTrajectory/{types.ts,scorer.ts}`.
- `probe/src/provider/providerQuotaPolicies.ts`.

Grep (read-only, no execution):
- `grep -rln "MaterialClaimLedger|ObligationLedger|PublicAffordanceLedger|material_claim|obligation_ledger" probe/src` -> 0 matches. Confirms the material/obligation/affordance ledgers are designed in markdown only, not implemented. (Key gap finding.)
- `grep -rn "world_block_delta|inventory_delta|..." runtime/goals/actorEpisode/types.ts` -> located the expected-outcome enum (types.ts:40-50).
- `grep -n "textIncludes|includes(" objectives/socialTrajectory/scorer.ts` and read `borrowedTool.ts` -> confirmed `textIncludesAny` keyword scoring in the social-issue smoke (brittle; against SPEC prose-parsing rule).

## 2026-06-16: External breadth searches (WebSearch; small batch, no hammering)

Loaded web tools via ToolSearch("select:WebSearch,WebFetch").

1. WebSearch: "Minecraft LLM agent benchmark material possession obligation social trajectory 2026 evidence grounded"
   - Rationale: confirm the gap (evidence-grounded social-material transition) is still open in 2025-2026; identify the active neighbor benchmarks.
   - Result: neighbors are task/competition/memory benchmarks (PillagerBench 2509.06235, Orak 2506.03610, MineNPC-Task 2601.05215, Odyssey 2407.15325). The repo itself surfaced as a public GitHub project (gigio1023/minecraft-llm-agent-community). None target advisory action-conditioned social-material transition prediction. Gap confirmed.

2. WebSearch: "multi-agent benchmark separate base task reward coordination social reward Melting Pot ALEM scoring"
   - Rationale: ground the benchmark-family methodology recommendation (separate physical competence from social/material consequence; mixed-motive scoring that does not reward unconditional cooperation).
   - Result: Melting Pot (2107.06857), mixed-motive social-dilemma scenarios, global-vs-individual reward. ALEM (2508.15679), efficient open-world multi-agent social-learning environment with base-vs-coordination separation. Both reinforce the repo's existing "do not reward automatic cooperation" rule and the base-vs-coordination split (Research-Direction-Reference-Synthesis.md:113).

All external sources recorded abstract-only in `lane-6-manifest.jsonl`. No LaTeX
downloaded by this lane (deep extraction of social/multi-agent literature is
owned by Lanes 2-4). No provider/API calls. No edits outside ROOT.
