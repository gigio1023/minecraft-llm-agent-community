# Lane 34 search log: long-horizon memory and continuity

Wave 6, lane 34. Date: 2026-06-16 to 2026-06-17 (Asia/Seoul). Primary discovery channel:
Hugging Face CLI (hf papers info / hf papers search). ASCII punctuation only.

## Seed verification (from the lane brief)

| Seed id | Title | hf papers info | Disposition |
|---|---|---|---|
| 2310.08560 | MemGPT | FOUND | verified; ALREADY deep-read (lane 17, notes/by-paper/2310.08560-memgpt.md). Cited, not re-derived. |
| 2308.10144 | ExpeL | FOUND | verified; deep-read (LaTeX full). |
| 2305.10250 | MemoryBank | FOUND | verified; deep-read (LaTeX method). |
| 2304.03442 | Generative Agents (memory stream only) | FOUND | verified; ALREADY deep-read (lane 3). Cited for the reflection-with-citations mechanism, not re-derived. |

All four seeds verified. Two (MemGPT, Generative Agents) are already deep-read in waves 1-3, so
per the extend-do-not-duplicate rule they are cited by id and the budget was spent on new
sources and the new angles (memory-as-OS post-MemGPT, consolidation/forgetting, experiential
learning, evidence-linked memory).

## Queries run and what HF returned

1. `hf papers search "agent memory survey LLM"` -> 2404.13501 (Zhang survey, top), 2605.06716
   (storage-to-experience, neighbor-cited), 2603.07670 (write-manage-read, neighbor-cited),
   2505.00675 (Rethinking Memory), 2507.05257 (MemoryAgentBench), 2512.12818, 2602.22769,
   2506.21605, 2512.13564, 2508.08997. Selected 2404.13501 and 2505.00675 as the two
   taxonomy cornerstones (foundational + finer six-operation).
2. `hf papers search "lifelong learning LLM agent experience"` -> 2501.07278 (roadmap),
   2510.08002 (learning on the job), 2407.08937 (self-evolving GPT), 2406.06391 (survey),
   2306.07929 (semi-parametric RL agents), 2402.15809 (action learning), 2506.06698
   (contextual experience replay), 2508.16153 (AgentFly). Confirmed ExpeL (2308.10144) as the
   experiential-learning archetype; the rest are breadth (most overlap self-improvement lanes
   18/22/27/29, not re-claimed here).
3. `hf papers search "memory consolidation forgetting LLM agent"` -> 2603.07670, 2605.27762
   (PEAM, Minecraft), 2601.18642 (FadeMem), 2605.16045 (RecMem), 2605.12978 (useful memories
   become faulty), 2606.04536 (scaling self-evolving via parametric memory), 2604.20006 (recall
   to forgetting benchmark). PEAM surfaced here and is the lane's only Minecraft instance ->
   selected for deep-read. MemoryBank confirmed as the canonical forgetting-curve work.
4. `hf papers search "episodic memory reinforcement learning agent"` -> 2303.11366 (Reflexion,
   already deep-read), 2105.14039 (HCAM, mental time travel), 2412.06531 (memory in RL
   classification), 2508.19828 (Memory-R1), 2509.25911 (Mem-alpha), 2601.03192 (MemRL).
   Selected HCAM as the pre-LLM RL-memory lineage anchor.
5. `hf papers search "experiential learning skill library agent"` -> 2308.10144 (ExpeL),
   2312.17025 (experiential co-learning), 2603.24639 (experiential reflective learning),
   2402.15809 (action learning), 2504.07079 (SkillWeaver). Confirms ExpeL; skill-library line
   overlaps Voyager (2305.16291, already in by-paper) and self-improvement lanes.
6. `hf papers search "catastrophic forgetting continual learning neural network"` -> 1802.07569
   (continual lifelong learning review), 1910.02718 (continual learning in NNs), 2009.01797,
   2102.11343, 2302.05836. Logged the two foundational reviews (1802.07569, 1910.02718) as the
   continual-learning background; PEAM is the in-domain demonstration so deep-read budget went
   there rather than to a pure continual-learning paper.
7. `hf papers search "provenance grounded memory retrieval agent"` -> 2602.17913 (TierMem,
   provenance-aware, top relevance), 2601.18204 (MemWeaver, traceable), 2603.10600
   (trajectory-informed), 2603.18516 (Total Recall QA verifiable), 2602.03315 (Memora).
   TierMem is the strongest evidence-linked-memory cornerstone -> selected for deep-read.
8. `hf papers search "Voyager skill library Minecraft lifelong"` -> 2305.16291 (Voyager,
   already deep-read), 2407.15325 (Odyssey), 2411.12977 (MindForge), 2502.05907
   (EvolvingAgent), 2503.10684 (open-world skill discovery). Confirms Voyager as the Minecraft
   skill-library anchor (cited from existing by-paper note); PEAM builds on Voyager's substrate.
9. `hf papers search "retrieval augmented memory long term conversation"` -> 2402.17753
   (LoCoMo), 2504.19413 (Mem0), 2502.05589, 2505.19549, 2510.27246 (beyond a million tokens).
   Selected LoCoMo as the canonical very-long-term-memory evaluation benchmark -> deep-read.
10. `hf papers search "working memory operating system context paging LLM"` -> 2310.08560
    (MemGPT, top), 2506.06326 (Memory OS of AI Agent), 2505.22101 (MemOS), 2504.02441
    (cognitive memory in LLMs), 2508.04664 (Sculptor). Selected MemoryOS (2506.06326) as the
    post-MemGPT memory-as-OS deep-read (it has public code and a clean three-tier OS structure;
    MemOS 2505.22101 verified FOUND but is a broader position paper, kept abstract-level).

## ids verified (hf papers info confirmed FOUND)

Deep-read set: 2308.10144, 2305.10250, 2404.13501, 2505.00675, 2506.06326, 2602.17913,
2605.27762, 2402.17753, 2105.14039. Already-deep-read cited: 2310.08560, 2304.03442,
2303.11366. Abstract-level breadth (verified FOUND): 2502.12110 (A-MEM), 2605.06716,
2603.07670, 2507.05257, 2505.22101 (MemOS).

## ids rejected / not added

- None invented. No seed returned NOT-FOUND.
- Many strong-looking results were deliberately NOT claimed because they overlap other lanes or
  are off-angle: self-evolving / self-improvement memory (2606.04536, 2509.25911, 2508.19828,
  2601.03192, lanes 18/22/27/29); skill-discovery (2504.07079, 2407.15325, lane 21); pure
  continual-learning method papers (2603.00624, 2505.11998); conversational-memory product
  systems (2504.19413 Mem0, 2602.03315 Memora, kept as breadth only). These are recorded here
  as dead ends for THIS lane's deep-read budget, not as nonexistent.

## LaTeX acquisition method

`hf papers read --format latex` is not supported (valid formats: agent/auto/human/json/quiet),
and `hf papers read` returned empty HTML for the 2026 ids. LaTeX sources were fetched from arXiv
e-print tarballs (curl https://arxiv.org/e-print/<id>, tar -xzf into papers/latex/<id>/),
matching the existing repo convention (downloaded_latex_path in the manifest). All 9 deep-read /
lineage sources downloaded successfully (http 200): 2308.10144, 2305.10250, 2105.14039,
2402.17753, 2404.13501, 2505.00675, 2506.06326 (tex under a latex/ subdir), 2602.17913,
2605.27762.

## Honesty notes

- PEAM (2605.27762): its appendix is author-marked as containing [INFERRED] placeholder values
  (per-task breakdown, several hyperparameters, on-device latency, cpair yield). Recorded in the
  by-paper note and theme as unverified; only the body's main results are stated as measured.
- All deep-read numbers are quoted from the sources, not re-derived or run. TierMem / MemoryOS /
  ExpeL / MemoryBank have public code; none was executed.
- The literature has no structured-social-material, verifier-grounded, embodied memory instance
  with a relationship/obligation ledger. PEAM is the closest (Minecraft, verifier-gated) but is
  single-agent and physical-only. That gap is the repo's surface, stated plainly, not a citable
  result.
