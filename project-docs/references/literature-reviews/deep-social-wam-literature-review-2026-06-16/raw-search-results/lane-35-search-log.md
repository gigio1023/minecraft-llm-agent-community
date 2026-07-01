# Lane 35 search log: scenario generation and eval freshness

Wave 6, lane 35. Date: 2026-06-16 to 2026-06-17 (Asia/Seoul). Primary discovery channel: Hugging Face
CLI (hf papers info / hf papers search / hf papers read). ASCII punctuation only.

## Seed verification (from the lane brief)

| Seed id | Title | hf papers info result | Disposition |
|---|---|---|---|
| 2012.02096 | PAIRED (UED) | FOUND | verified, deep-read (LaTeX) |
| 2110.02439 | robust / replay-guided PLR | NOT FOUND | claim-only, dropped from manifest |
| 2203.01302 | ACCEL (evolving curricula) | NOT FOUND | claim-only, dropped from manifest |
| 2206.06994 | ProcTHOR | FOUND | verified, deep-read (LaTeX) |
| 2312.09067 | Holodeck | FOUND | verified, deep-read (LaTeX) |
| 2403.07974 | LiveCodeBench | FOUND | verified, deep-read (LaTeX) |

Two of six seeds (the PLR/ACCEL replay-UED line) are not indexed on Hugging Face. Per the contract
honesty rules they are not invented or logged as verified; recorded claim-only below.

## Queries run and what HF returned

1. `hf papers info` batch on the 6 seeds: confirmed 4 found, 2 not-found (table above).
2. `hf papers search "Prioritized Level Replay"` -> returned Prioritized Experience Replay (1511.05952),
   CodeIt (2402.04858), unrelated replay papers. Did NOT surface the UED PLR (2010.03934) or robust
   PLR (2110.02439). Dead end for PLR on HF.
3. `hf papers search "Evolving Curricula Regret-Based Environment Design"` and
   `"Parker-Holder evolving curricula"` -> returned LLM-curriculum papers (Self-Evolving Curriculum
   2505.14970, ACuRL 2602.10356, Cog-DRIFT 2604.04767), not ACCEL. Dead end for ACCEL on HF.
4. `hf papers search "Replay-Guided Adversarial Environment Design"` -> unrelated adversarial/replay
   results; re-surfaced PAIRED (2012.02096) as the only verifiable UED anchor. Confirmed PAIRED as the
   deep-read UED cornerstone.
5. `hf papers info 2010.03934` (canonical PLR) -> NOT FOUND. Confirms the 2020 to 2022 regret-replay
   UED line is absent from HF's index; logged claim-only.
6. Batch `hf papers info` probes for adjacent cornerstones: 2210.13382 (Othello-GPT, FOUND, off-lane),
   2310.13032 (QDAIF, FOUND), 2406.04268 (Open-Endedness is Essential, FOUND), 2310.11667 (SOTOPIA,
   FOUND, already noted), 2403.08715 (SOTOPIA-pi, FOUND), 2311.04850 (rephrased samples, FOUND).
7. `hf papers search "procedural content generation reinforcement learning"` -> PCGRL (2001.09212,
   FOUND) at the top. Selected as the canonical PCG-via-RL deep-read.
8. `hf papers search "contamination-free agent benchmark time"` -> AntiLeak-Bench (2412.13670, FOUND),
   rephrased samples (2311.04850), ClawMark (2604.23781), LiveAgentBench (2603.02586). Selected
   AntiLeak-Bench + the two living-world agentic benchmarks as abstract-level breadth.
9. `hf papers search "bottom-up scenario generation social agents benchmark"` -> AgencyBench
   (2601.11044), LiveAgentBench (2603.02586), ClawMark (2604.23781): confirms the freshness problem is
   moving into multi-day real-world agent settings (abstract-level breadth).

## Ids verified (FOUND on HF) and used

Deep-read (LaTeX fetched via arxiv e-print, extracted under papers/latex/<id>/):
- 2012.02096 PAIRED, 2001.09212 PCGRL, 2206.06994 ProcTHOR, 2312.09067 Holodeck, 2310.13032 QDAIF,
  2403.07974 LiveCodeBench, 2403.08715 SOTOPIA-pi, 2311.04850 rephrased samples.

Abstract-level (verified, logged in manifest, not deep-read):
- 2406.04268 Open-Endedness is Essential, 2412.13670 AntiLeak-Bench, 2604.23781 ClawMark,
  2603.02586 LiveAgentBench.

## Ids rejected / claim-only (NOT in manifest as verified)

- 2010.03934 PLR (Prioritized Level Replay): NOT FOUND on HF. Claim-only.
- 2110.02439 robust / replay-guided PLR (seed): NOT FOUND on HF. Claim-only, dropped.
- 2203.01302 ACCEL (seed): NOT FOUND on HF. Claim-only, dropped.
- 2406.11244, 1809.10729, 2306.13169: NOT FOUND on HF during adjacent probing. Dropped.
- 2210.13382 (Othello-GPT), 2502.06807 (Competitive Programming with LRMs), 2406.12952 (Code Agents
  as testers): FOUND but off-lane or already covered by other lanes; not logged here.

## Tooling notes

- The repo helper scripts/fetch_arxiv_latex.sh passed the slug argument into the curl URL, causing
  "URL rejected: Malformed input" on every call. arXiv itself is reachable (a direct
  `curl https://arxiv.org/e-print/2012.02096` returned a 6.4MB tarball). Worked around it by calling
  curl directly per id (https://arxiv.org/e-print/<id>), extracting the gzip'd tar under
  papers/latex/<id>/, with a 3-second sleep between calls per the script's politeness note. All 8
  deep-read LaTeX sources fetched successfully (tex file counts: PAIRED 4, PCGRL 1, ProcTHOR 10,
  Holodeck 13, LiveCodeBench 23, SOTOPIA-pi 14, AntiLeak-Bench 17, rephrased 11, QDAIF 38).
- `hf papers read <id>` works as the primary channel fallback (returns markdown of the paper) and was
  used to confirm content where LaTeX extraction was ambiguous.

## Deconfliction confirmed by listing notes/by-theme/ and grepping notes/by-paper/

- Lane 21 already deep-read POET, Enhanced POET, OMNI, OMNI-EPIC, Eurekaverse, MAGELLAN (cited, not
  redone). Lane 24 already covered SWE-rebench, passes-but-wrong (2503.15223), SlopCodeBench (cited).
- SOTOPIA (2310.11667) and Lifelong-SOTOPIA (2506.12666) already have by-paper notes; this lane covers
  only SOTOPIA-pi (2403.08715), the synthesis angle.
