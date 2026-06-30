# Lane 33 search log: mechanism design, social dilemmas, and cooperative AI

Owner: Lane 33 (wave 6). Date: 2026-06-17. ASCII punctuation only.
Discovery channel: Hugging Face CLI (`hf` 1.16.1): `hf papers info`, `hf papers search`,
`hf papers read`. LaTeX fetched via `scripts/fetch_arxiv_latex.sh`.

## Seed verification (`hf papers info`)

| seed id | result | disposition |
|---|---|---|
| 2012.08630 Open Problems in Cooperative AI | FOUND | deep-read (LaTeX) |
| 1702.03037 MARL in Sequential Social Dilemmas | NOT FOUND on HF | claim-only, full citation kept |
| 2107.06857 Melting Pot | NOT FOUND on HF | claim-only, full citation kept |
| 1709.04326 LOLA | NOT FOUND on HF | claim-only, also abstract-level in ToM theme |
| 2208.10469 Formal Contracts Mitigate Social Dilemmas | NOT FOUND on HF | recovered via direct arXiv e-print fetch; deep-read (LaTeX) |

The four NOT-FOUND seeds are pre-2023 classics (or, for 2208.10469, simply not HF-
indexed). Per the honesty rule, ids were never fabricated. 2208.10469 was confirmed real
by `scripts/fetch_arxiv_latex.sh 2208.10469` returning a valid LaTeX tarball whose
main.tex title matches exactly; the other three are logged claim-only.

## Discovery queries (`hf papers search`, scanned with scripts/hfsearch_compact.py)

1. "multi-agent reinforcement learning sequential social dilemmas cooperation"
   -> surfaced 2405.01035 (LOQA), 2301.08278 (direct punishment), 2312.05162 (review),
   1706.02275 (MADDPG), 2603.19453 (LLM SSD, via later query). Useful.
2. "formal contracting mechanism social dilemma reinforcement learning"
   -> surfaced 2603.19453, 2309.09801 (Learning Optimal Contracts), 2601.11369
   (Institutional AI), 2510.14401 (norm formation), 2606.04075 (LLMs hack rewards).
3. "mechanism design large language model agents auctions markets"
   -> surfaced 2602.02751 (strategy auctions), 2605.17698 (Agent Bazaar), GLEE
   (2410.05254, already in social-sim theme), many market/trading benchmarks.
4. "Get It in Writing Formal Contracts Mitigate Social Dilemmas Multi-Agent" (title try
   for 2208.10469) -> did NOT surface the target on HF; surfaced 2602.22302 (Agent
   Behavioral Contracts), 2603.25100 (Logic Monopoly), 2504.03255 (principal-agent
   liability), 2603.27771 (emergent social risks). Confirmed the seed is not HF-indexed.
5. "indirect reciprocity reputation cooperation image scoring"
   -> mostly reward-model / recommender noise; useful hits 2412.10270 (cultural
   evolution of cooperation), 2301.08278. Nowak-Sigmund indirect reciprocity itself is a
   2005 Nature paper, not on HF; carried claim-only via 2301.08278.
6. "Ostrom design principles common pool resource governance agents"
   -> surfaced 2510.14401, 2404.16698 (GovSim, already noted), 2010.07777 (game-theoretic
   CPR control), 2401.11269 (coupled human-resource CPR), 2509.10147 (Virtual Agent
   Economies, already in economic-sim theme), 2601.11369.
7. "binding contracts reinforcement learning cooperation enforce agreements"
   -> reinforced 2602.22302, 2309.09801, 2601.11369, 2301.08278; new 2602.15198
   (Colosseum: auditing collusion).
8. "opponent shaping differentiable game cooperation prisoner dilemma"
   -> surfaced 2405.01035 (LOQA) prominently; game-theory-meets-LLM surveys (2502.09053);
   confirmed LOLA (1709.04326) is the classic but not on HF.
9. "norm emergence enforcement sanctioning institution multi-agent systems"
   -> surfaced 2106.09012 (public sanctions, already noted), 2510.14401, 2601.11369,
   2603.25100, 2602.00755 (evolving constitutions), 2508.19562 (Democracy-in-Silico),
   2306.12345 (noise and continuous-norm emergence).

## Abstract reads (`hf papers info` summary)

Read abstracts for: 2603.19453, 2601.11369, 2309.09801, 2602.22302, 2301.08278,
2510.14401, 2504.03255, 2409.10372, 2405.01035, 2412.10270, 2603.25100. Selected the
8 deepest for LaTeX deep-read; kept 2405.01035, 2602.22302, 2603.25100, 2412.10270,
2409.10372 at abstract level in the theme/manifest.

## LaTeX deep-reads (scripts/fetch_arxiv_latex.sh, then Read)

2012.08630, 2603.19453, 2601.11369, 2309.09801, 2301.08278, 2510.14401, 2504.03255,
2208.10469. All fetched as tarball_extracted. Read main.tex (or equivalent) plus targeted
greps for results, limitations, and definitions.

## Ids verified vs rejected

- Verified on HF and logged: 2012.08630, 2603.19453, 2601.11369, 2309.09801, 2301.08278,
  2510.14401, 2504.03255, 2405.01035, 2602.22302, 2603.25100, 2412.10270, 2409.10372.
- Verified on arXiv (not HF) and logged: 2208.10469.
- Logged claim-only (HF not-found, full citation, no fabricated id): 1702.03037,
  2107.06857, 1709.04326. Plus non-arXiv classics carried via computational papers:
  Ostrom 1990, Crawford and Ostrom 1995, Nowak and Sigmund 2005.

## Dead ends / de-scoped (cited elsewhere or out of lane)

- GLEE (2410.05254), Concordia (2312.03664), AI/LLM Economist (2004.13332 / 2507.15815),
  AgentSociety, naming-game conventions (2410.08948), Hypothetical Minds, MindForge,
  public sanctions (2106.09012), GovSim (2404.16698): already deep-read or themed by the
  social-sim, economic-sim, theory-of-mind, or sociology lanes. Cited by id, not re-read.
- Market/trading benchmarks (StockBench, ContestTrade, When Agents Trade) and pure
  alignment-safety surveys (Distributional AGI Safety, SAGA security): out of the
  mechanism-design-for-cooperation lane; noted only where a deep-read paper cites them.
