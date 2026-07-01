# Lane 15 search log: Theory of Mind, opponent/agent modeling, emergent norms

Lane 15 (G4), wave 3 research-area mapping. All searches run 2026-06-16.
Channel order per contract: Hugging Face `hf papers` CLI first, then web
(WebSearch / WebFetch) for arXiv id verification and non-HF sources.

## 1. Seed-ID verification (mandatory before fetch)

The brief gave seed ids; the HF papers index only holds papers submitted to the
HF papers feed, so an `hf papers info` "not found" does NOT mean a bad arXiv id.
Cross-checked every "not found" against the arXiv abstract page directly.

| seed claim | id given | verification | result |
|---|---|---|---|
| Machine Theory of Mind (Rabinowitz) | 1802.07740 | `hf papers info 1802.07740` | VERIFIED, exact title match |
| FANToM (ToM stress-test benchmark) | 2310.15421 | `hf papers info 2310.15421` | VERIFIED, exact title match |
| Albrecht & Stone agent-modeling survey | 1709.08071 | not on HF; WebFetch arxiv.org/abs/1709.08071 | VERIFIED "Autonomous Agents Modelling Other Agents: A Comprehensive Survey and Open Problems", Albrecht & Stone, 2017/2018 |
| LOLA Learning with Opponent-Learning Awareness | 1709.04326 | not on HF; WebFetch arxiv.org/abs/1709.04326 | VERIFIED "Learning with Opponent-Learning Awareness", Foerster et al., 2017/2018 |
| Social Influence as Intrinsic Motivation | 1810.08647 | not on HF; WebFetch arxiv.org/abs/1810.08647 | VERIFIED "Social Influence as Intrinsic Motivation for Multi-Agent Deep RL", Jaques et al., 2018/2019 |

No seed ids were wrong. Three were simply absent from the HF papers feed (older
DeepMind / OpenAI RL papers predate that feed).

## 2. HF papers searches (exact commands)

- `hf papers info 1802.07740` -- confirm Machine ToM seed.
- `hf papers info 2310.15421` -- confirm FANToM seed.
- `hf papers info 1709.08071` / `1709.04326` / `1810.08647` -- all "not found on Hub" (see sec 1).
- `hf papers search "theory of mind large language models emergent" --limit 12` -- ToM-in-LLM landscape; surfaced ToMBench 2402.15052, MindGames 2305.03353, situated-ToM landscape 2310.19619, Percept-ToMi 2407.06004.
- `hf papers search "theory of mind large language models" --limit 8` -- same cluster, confirmed ToMBench / situated-landscape as balanced-critique candidates.
- `hf papers search "opponent modeling deep reinforcement learning" --limit 8` -- surfaced Model-Based Opponent Modeling (MBOM) 2108.01843 (recursive-reasoning, imagine-then-execute), Policy-Conditioned Policies 2512.21024.
- `hf papers search "emergent social conventions multi-agent" --limit 8` -- surfaced Cultural Evolution of Cooperation among LLM Agents 2412.10270 (Donor Game), Constitutional Evolution 2602.00755, plus the existing GovSim 2404.16698 and public-sanctions 2106.09012 (already covered; cited not rewritten).
- `hf papers search "recursive reasoning multi-agent reinforcement learning" --limit 6` -- mostly off-topic recent LLM-MAS reasoning-scaling papers, not the I-POMDP/level-k lineage. Did not adopt.
- `hf papers search "Bayesian theory of mind inverse planning" --limit 6` -- surfaced AutoToM 2502.15676, MMToM-QA 2401.08743, Hypothetical Minds 2407.07086 (ToM module scaffolding MARL in Melting Pot), CLIPS 2402.17930, BIGAI social-intelligence 2405.11841.

## 3. Web searches (arXiv id resolution + non-HF cornerstones)

- WebSearch: Kosinski "Theory of Mind May Have Spontaneously Emerged in Large Language Models" -> id 2302.02083 (the contested "emerged" claim).
- WebSearch: Ullman "Large Language Models Fail on Trivial Alterations to Theory-of-Mind Tasks" -> id 2302.08399 (direct rebuttal; the balanced-pair partner to Kosinski).
- WebSearch: Baronchelli "spontaneous emergence of social conventions" LLM populations -> id 2410.08948, published Science Advances 2025 (naming-game, collective bias, tipping points / committed minority).
- WebSearch: "Theory of Mind for Multi-Agent Collaboration via Large Language Models" -> id 2310.10701 (Li et al., EMNLP 2023; explicit belief-state representation helps ToM inference + task).
- WebFetch arxiv.org/abs/2411.12977 -> MindForge, NeurIPS 2025, embodied LLM agents in Minecraft with structured ToM (percept/belief/desire/action). Strongest single tie to this project.
- WebFetch arxiv.org/abs/2410.08948 -> confirmed Baronchelli title/authors/findings.

## 4. Cornerstones selected for LaTeX deep-read

1. 1802.07740 Machine Theory of Mind (Rabinowitz) -- required cornerstone.
2. 1709.08071 Albrecht & Stone agent-modeling survey -- required cornerstone.
3. 2407.07086 Hypothetical Minds -- closest mechanical analogue (advisory ToM loop).
4. 2411.12977 MindForge -- Minecraft + embodied ToM.
5. 2410.08948 Baronchelli emergent conventions -- emergent-norms cornerstone.
6. 2302.08399 Ullman trivial-alterations -- the balance/critique cornerstone.
7. 2108.01843 MBOM -- opponent modeling as imagine-then-execute.
8. 1709.04326 LOLA -- opponent-learning awareness.

Abstract / PDF level (long tail, manifest rows only): 2310.15421 FANToM,
2302.02083 Kosinski, 2402.15052 ToMBench, 2310.19619 situated-ToM landscape,
2412.10270 Cultural Evolution / Donor Game, 1810.08647 Social Influence,
2310.10701 ToM-for-MA-collab, 2502.15676 AutoToM, 2401.08743 MMToM-QA.

## 5. Already-covered sources (cite, do NOT rewrite)

- GovSim 2404.16698 -> `notes/by-paper/2404.16698-govsim.md` (the r=0.83 belief/survival result; institutional + social).
- Public-sanctions norm model 2106.09012 -> `notes/by-paper/2106.09012-norms-from-public-sanctions.md` (CNM, sanction stream).
- Bicchieri/Elster social norms -> `notes/by-paper/bicchieri-elster-social-norms.md` (sociology theme owns the human-theory side).
