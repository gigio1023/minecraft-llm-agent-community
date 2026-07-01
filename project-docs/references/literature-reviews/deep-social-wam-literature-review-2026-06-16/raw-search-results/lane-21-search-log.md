# Lane 21 (H4) search log: open-ended automated curriculum and task generation

Lane: 21 (wave 4, H4). Date of work: 2026-06-17. Anchor: ENPIRE (`notes/by-paper/enpire.md`).
Channel order: Hugging Face CLI (`hf papers ...`) first, then web (WebSearch / WebFetch) for
arXiv-id verification. All arXiv ids verified before LaTeX fetch via `hf papers info` or web.

## 1. Hugging Face CLI searches (primary)

- `hf papers search "open-ended learning automatic curriculum environment generation" --limit 15`
  Rationale: seed the area. Surfaced POET (1901.01753), ACL survey (2003.04664), ALP-GMM
  (1910.07224), CLUTR (2210.10243), and recent self-improving LLM curriculum work: OpenSIR
  (2511.00602), Socratic-Zero (2509.24726), Self-Evolving Curriculum (2505.14970), ACuRL
  (2602.10356).
- `hf papers search "Enhanced POET open-ended algorithm minimal criterion coevolution"` ->
  POET surfaced; Enhanced POET (2003.08536) NOT indexed on HF Hub (verified via web instead).
- `hf papers search "OMNI open-endedness models human notions interestingness"` -> OMNI
  (2306.01711) exact id confirmed; OMNI-EPIC (2405.15568) also surfaced; Clune position piece
  (2406.04268) surfaced.
- `hf papers search "OMNI-EPIC programmable environments code open-endedness"` -> OMNI-EPIC
  (2405.15568) confirmed; "Dreaming in Code for Curriculum Learning in Open-Ended Worlds"
  (2602.08194) surfaced (OMNI-EPIC lineage, Faldor/Cully).
- `hf papers search "MAP-Elites illuminating search spaces quality diversity"` -> HF returned
  off-topic RAG/search results; MAP-Elites verified directly by id instead.
- `hf papers search "human-timescale adaptation open-ended task space reinforcement learning agent"`
  -> AdA / Human-Timescale Adaptation (2301.07608) exact id confirmed; "Open-Ended Learning
  Leads to Generally Capable Agents" (XLand, 2107.12808) surfaced.
- `hf papers search "unsupervised environment design emergent complexity regret PAIRED"` ->
  PAIRED / UED foundation (2012.02096) confirmed; CLUTR (2210.10243) surfaced.
- `hf papers search "Eurekaverse environment curriculum generation language model"` -> did NOT
  surface Eurekaverse (HF gap); surfaced Eureka (2310.12931, H3's reward-codegen lane),
  TeachMyAgent ACL benchmark (2103.09815), Meta-ACL (2011.08463). Eurekaverse id resolved via web.
- `hf papers search "Eurekaverse environment generation parkour curriculum LLM" --limit 8` (variant)
  -> same gap.
- `hf papers search "ACED automatic curriculum environment design agent"` -> no exact ACED match;
  surfaced DataEnvGym (2410.06215, teacher-environment data generation w/ student feedback) and
  ACL survey. ACED was a "verify-then-add" optional seed; not found as a distinct canonical paper,
  recorded as not-located (see section 4).
- `hf papers search "Minecraft open-ended task generation curriculum agent goals"` -> MCU
  (2310.08367), Odyssey (2407.15325), Optimus-2 (2502.19902), DEPS (2302.01560), GITM
  (2305.17144), EvolvingAgent (2502.05907). MCU/Odyssey already owned by wave-1
  `minecraft-agent-benchmarks`; cited not re-surveyed.
- `hf papers search "learning progress intrinsic motivation curriculum goal selection developmental"`
  -> MAGELLAN (2502.07709, LLM-native metacognitive LP), SOAR/"Teaching Models to Teach
  Themselves" (2601.18778, edge-of-learnability), "Augmenting Autotelic Agents with LLMs"
  (2305.12487), "Intrinsically-Motivated Humans and Agents in Open-World Exploration" (2503.23631).
- `hf papers search "Genie generative interactive environments foundation world model"` -> Genie
  (2402.15391). World-model-as-environment-generator; deconflicted to wave-1/2 world-model themes,
  logged here only for its task-generation angle.
- `hf papers search "asymmetric self-play automatic curriculum goal generation GAN"` -> goal-GAN /
  asymmetric self-play family (older); surfaced DARC (2601.13761), pi-Play (2604.14054).
- `hf papers search "novelty search abandoning objectives evolution"` -> novelty search /
  QD family; surfaced "Quality-Diversity through AI Feedback" (2310.13032), "Self-Improving
  Language Models with Bidirectional Evolutionary Search" (2605.28814).

## 2. Direct id verification via `hf papers info`

- `hf papers info 1504.04909` -> CONFIRMED MAP-Elites (Mouret, Clune 2015, "Illuminating search
  spaces by mapping elites"). Seed id correct.
- `hf papers info 1910.07224` -> CONFIRMED ALP-GMM (Portelas, Colas, Hofmann, Oudeyer 2019,
  "Teacher algorithms for curriculum learning ... continuously parameterized environments").
- `hf papers info 2003.08536` -> NOT on HF Hub. Verified via web (see section 3): real ICML 2020
  paper, id correct.
- `hf papers info 2602.08194` -> CONFIRMED "Dreaming in Code for Curriculum Learning in Open-Ended
  Worlds" (Mitsides, Faldor, Cully).
- `hf papers info 2505.22954` -> CONFIRMED "Darwin Godel Machine: Open-Ended Evolution of
  Self-Improving Agents" (Zhang, Hu, Lu, Lange).
- `hf papers info 2509.24726` -> Socratic-Zero (Wang, Jiao, Zhang).
- `hf papers info 2601.18778` -> SOAR "Teaching Models to Teach Themselves: Reasoning at the Edge
  of Learnability".
- `hf papers info 2203.01302` -> NOT on HF Hub (ACCEL). Real ICML 2022 paper; logged abstract-level
  from OMNI-EPIC + Eurekaverse citation context and web result.

## 3. Web verifications (only for ids HF could not confirm)

- WebSearch "Enhanced POET arXiv 2003.08536 Wang Lehman Clune ..." -> CONFIRMED arXiv 2003.08536,
  "Enhanced POET: Open-Ended Reinforcement Learning through Unbounded Invention of Learning
  Challenges and their Solutions", Wang/Lehman/Rawal/Zhi/Li/Clune/Stanley, ICML 2020. Code:
  github.com/uber-research/poet.
- WebSearch "Eurekaverse arXiv environment curriculum generation LLM parkour Liang 2024" ->
  CONFIRMED arXiv 2411.01775 (the brief gave no id for Eurekaverse, only the name). CoRL 2024.
  Liang, Wang, Wang, Bastani, Jayaraman, Ma. Code: github.com/eureka-research/eurekaverse.

## 4. Corrections / not-located

- Enhanced POET id: brief said 2003.08536. CONFIRMED correct (HF Hub just lacks the record).
- Eurekaverse: brief named it without an id under "verify-then-add". Resolved to 2411.01775 (web).
- ACED: brief named "ACED" under "verify-then-add". No distinct canonical arXiv paper located by
  HF or the queries above under that acronym in this area. NOT logged (avoid fabricating an id).
  The nearest located "verify-then-add" LLM-environment-codegen cornerstone is Eurekaverse, which
  is deep-read instead.
- OMNI id: brief said ~2306.01711. CONFIRMED exact.
- OMNI-EPIC id: brief said ~2405.15568. CONFIRMED exact.
- AdA / Human-Timescale Adaptation: brief said ~2301.07608. CONFIRMED exact.
- ACL survey (Portelas et al.): brief said ~2003.04664. CONFIRMED exact.

## 5. LaTeX fetched (deep-read cornerstones)

`bash scripts/fetch_arxiv_latex.sh <id> <slug>` for: 1901.01753 (poet), 2003.08536
(enhanced-poet), 2306.01711 (omni), 2405.15568 (omni-epic), 2003.04664 (acl-survey),
2411.01775 (eurekaverse), 2502.07709 (magellan). All extracted as tarball LaTeX (latex,
not pdf-only). MAP-Elites (1504.04909) read at abstract + survey-context level (classic, widely
re-described); not separately LaTeX-fetched to keep depth on the 7 cornerstones above.

## 6. HF models / datasets

- `hf datasets list --search "open-ended curriculum tasks"` -> No results.
- `hf datasets list --search "minecraft task"` -> only NSCBT/MinecraftTask2BT (small, BT-format,
  low relevance). No open-ended-curriculum dataset of note. Recorded as a gap: this area ships
  algorithms + code (POET, OMNI-EPIC, Eurekaverse repos), not standardized HF datasets.
