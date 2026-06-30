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
