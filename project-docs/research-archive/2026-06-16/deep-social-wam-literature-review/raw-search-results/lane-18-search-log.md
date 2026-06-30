# Lane 18 (H1) search log - Agentic self-improvement loops

All dates 2026-06-17. Discovery channel order per contract: Hugging Face CLI (`hf papers ...`) first, then web tools loaded via ToolSearch. `hf` was already authenticated.

## Seed-id verification (before any fetch)

- `hf papers info 2506.06658` -> verified SAIL "Self-Adapting Improvement Loops for Robotic Learning" (Luo et al.). Confirmed.
- `hf papers info 2510.16079` -> verified EvolveR "Self-Evolving LLM Agents through an Experience-Driven Lifecycle". Confirmed; has code (github.com/Edaizi/EvolveR) + HF model + dataset.
- `hf papers info 2509.04575` -> verified ExIt "Bootstrapping Task Spaces for Self-Improvement" (Jiang, Lupu, Bachrach). Confirmed.
- `hf papers info 2606.07367` -> verified Q-Evolve "Self-evolving LLM agents with in-distribution Optimization" (Zhang et al.). Confirmed (genuinely 2026-06 dated; not a fabricated id).
- `hf papers info 2601.11974` -> verified MARS "Learn Like Humans: Use Meta-cognitive Reflection for Efficient Self-Improvement" (Hou et al.). Confirmed (2026-01). Title differs slightly from the brief's "MARS, Meta-cognitive Reflection for Efficient Self-Improvement"; the brief's short name is correct, full title recorded.

All five seed ids in the brief resolved correctly. No wrong seeds to correct. (Q-Evolve and MARS are real future-dated 2026 entries in the HF index.)

## Discovery searches (hf papers search)

- `hf papers search "Darwin Godel Machine self-improving agent" --limit 6` -> surfaced the self-modifying-coding-agent vein: DGM (2505.22954), Live-SWE-agent (2511.13646), Hyperagents/DGM-H (2603.19461), Godel Agent (2410.04444), Group-Evolving Agents (2602.04837), SEA (2508.04037). Rationale: the brief said "verify-then-add if real: Darwin Godel Machine / Godel Agent".
- `hf papers search "survey self-evolving agents lifecycle" --limit 6` -> two strong surveys: 2508.07407 (Comprehensive Survey of Self-Evolving AI Agents), 2507.21046 (Gao et al., On Path to ASI). Also Autogenesis (2604.15034). Rationale: the brief said "a survey of self-evolving agents".
- `hf papers search "self-improvement collapse recursive training model collapse" --limit 6` -> the collapse-caution cluster: 2510.16657 (Escaping Collapse via Verification), 2509.10509 (Anti-Ouroboros), 2402.07712 (Model Collapse Demystified), 2412.02674 (Mind the Gap on self-improvement limits). Rationale: the brief said "any self-improvement collapse / model collapse caution you can source".
- `hf papers search "self-rewarding language models self-improvement" --limit 6` -> proposer-vs-scorer thread: 2407.19594 (Meta-Rewarding LMs), 2508.06026 (Temporal Self-Rewarding), CREAM (2410.12735). Rationale: cover the proposer-equals-scorer risk the brief asks for.
- `hf papers search "self-evolution language model learning self feedback STaR" --limit 6` -> SELF (2310.00533, the named seed), the Apr-2024 self-evolution survey (2404.14387), CoMAS (2510.08529 co-evolving multi-agent via interaction rewards), Self-Evolved Reward Learning (2411.00418), Learning to Self-Evolve (2603.18620).
- `hf papers search "reward hacking specification gaming RL verifiable reward" --limit 6` -> the verifier-gaming cluster, the heart of this lane's central question: 2604.15149 (LLMs Gaming Verifiers: RLVR can Lead to Reward Hacking), 2605.20744 (Hack-Verifiable Environments), 2510.00915 (RLVR yet Noisy Rewards under Imperfect Verifiers), 2605.12474 (Reward Hacking in Rubric-Based RL).
- `hf papers search "absolute zero self-play reasoner zero data" --limit 5` -> 2505.03335 (Absolute Zero, self-play RLVR zero data), 2605.14392 (Learning to Build the Environment: self-evolving RL via verifiable environment synthesis), Vision-Zero (2509.25541). Rationale: bound the no-human-label end of the loop (verifiable self-play); H5 (lane 22) owns the verifiable-reward theory, so cited here, not covered.

## LaTeX fetches (cornerstones, deep-read)

The repo `scripts/fetch_arxiv_latex.sh` failed in this shell with "curl: (3) Malformed input to a URL function" - the `-A "$UA"` user-agent string (containing parentheses and spaces) was mis-parsed in this zsh-initialized environment. A direct `curl` with a simpler UA succeeded (verified: 5.8MB gzip for 2506.06658). I used an inline fetch helper with `-A "deep-social-wam-litreview/1.0 research"` + tar extraction, writing to the same `papers/latex/<id>/` and `papers/metadata/<id>.json` layout the script targets, with a 2s sleep between calls. Fetched and extracted (tex file counts):

- 2506.06658 SAIL (9 tex), 2510.16079 EvolveR (10 tex), 2509.04575 ExIt (13 tex), 2606.07367 Q-Evolve (3 tex),
- 2505.22954 DGM (28 tex), 2508.07407 self-evolving survey (4 tex), 2510.16657 Escaping Collapse (12 tex), 2604.15149 LLMs Gaming Verifiers (3 tex).

All 8 read directly from `.tex` (intro, method, experiments/theory, safety/limitations). Note: SAIL's arXiv/HF title is "SAIL" but its LaTeX uses the working name "SILVR"; both recorded.

## Web tools

Loaded `ToolSearch("select:WebSearch,WebFetch")` (available if needed for id cross-check); HF CLI + arXiv LaTeX were sufficient for this lane, so no additional web fetches were required. ENPIRE was NOT re-fetched: the coordinator's `notes/by-paper/enpire.md` is the anchor and was read, not rewritten.

## Counts

- Sources logged to manifest: 28 (8 deep-read LaTeX cornerstones + 20 abstract-level long-tail).
- LaTeX downloaded + deep-read: 8. PDF-only: 0. Abstract-only: 20.
