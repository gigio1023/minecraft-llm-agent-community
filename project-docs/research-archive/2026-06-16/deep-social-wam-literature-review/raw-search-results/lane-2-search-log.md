# Lane 2 Search Log - Minecraft Agent / VLA / Visual Policy / Benchmarks

Date: 2026-06-16. Tools: Hugging Face CLI (`hf`, primary), then WebSearch/WebFetch.
Authenticated `hf` user as seen in coordinator log (`naem1023`). Each block lists
the exact command/query and a one-line rationale.

## Hugging Face CLI - model/dataset availability

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
(`MineStudio_STEVE-1.official`, 12,822 downloads - most used), GROOT
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
- `CraftJarvis/minecraft-vla-sft` - 216 train parquet shards, ~106 GB, 1M-10M
  rows, MIT, 2,177 downloads (JARVIS-VLA SFT data).
- `iLearn-Lab/Optimus-2-MGOA` - webdataset, 10M-100M scale, MIT, 974 downloads
  (Optimus-2 GOA pairs).
- `zhwang4ai/minecraft-trajectory` + `minecraft-language-trajectory` - GROOT-2 /
  CraftJarvis trajectory data (manual-download gated, small download counts).
- MineStudio converted VPT contractor data lives under
  `CraftJarvis/minestudio-data-6xx..10xx` (per existing repo analysis;
  6xx page = 248 GB, no card, viewer unavailable).
- STEVE-21K is not a clean HF dataset record (hosted off-Hub / Google Drive).
- `osanseviero/minedojo_knowledge` exists but is a tiny knowledge dump, not the
  MineDojo YouTube/Wiki/Reddit corpus.

## Hugging Face CLI - paper discovery (reused coordinator dumps + new)

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
Videos", a CraftJarvis skill-segmentation work - kept separately).
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

## Web (arXiv / ACL / GitHub / OpenReview) - benchmarks not in hf papers

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
Also surfaced: PillagerBench 2509.06235 (competitive team Minecraft) - noted, not
deep-read.

## Existing repo analyses reused (NOT re-cloned, per brief)

- `project-docs/research-archive/2026-06-16/minestudio-reference-check.md`
- `project-docs/research-archive/2026-06-16/minestudio-implementation-analysis.md`
These already inventory MineStudio at commit 278aa85 (Oct 2025): 153 task YAMLs
(76 simple + 77 hard), 671 init commands (368 `/give`), VPT/STEVE-1/GROOT/ROCKET
model code, MineRL/Malmo simulator, VLM auto-eval. Lane-2 sharpens, not repeats.
