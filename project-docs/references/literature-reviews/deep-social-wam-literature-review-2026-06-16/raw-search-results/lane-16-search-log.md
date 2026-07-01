# Lane 16 search log: agent-based economic simulation and computational social science

Lane G5. Date of all work: 2026-06-16. Discovery channel order: Hugging Face CLI
(`hf papers search` / `hf papers info`) first, then WebSearch for non-arXiv
classics (Sugarscape book, Tesfatsion ACE, Windrum-Fagiolo-Moneta validation) and
for arXiv-id verification. LaTeX-first extraction via
`scripts/fetch_arxiv_latex.sh`. No paid LLM / provider / API calls were made.

## 1. Hugging Face CLI searches

- `hf papers search "AI Economist reinforcement learning social planner taxation" --limit 8`
  - Rationale: find the canonical AI Economist and follow-ups (brief seed 2004.13332).
  - Hits: 2004.13332 (AI Economist, the canonical NeurIPS-era arXiv), 2108.02755
    (AI Economist two-level deep RL journal version), 2507.15815 (LLM Economist),
    2504.02648 (Steering the Herd), 2406.01575 (Contextual Bilevel RL), 2403.12093
    (Stackelberg Mean Field Game macro), 2506.00856 (Econometrics AI Agent),
    2603.19453 (LLM policy synthesis for sequential social dilemmas).
- `hf papers search "EconAgent large language model agents macroeconomic simulation" --limit 8`
  - Rationale: find EconAgent (brief seed 2310.10436, flagged "verify").
  - Hits: 2505.17648 (Simulating Macroeconomic Expectations), 2502.01506
    (TwinMarket), 2507.15815 (LLM Economist), 2410.05254 (GLEE, already covered),
    2602.06008 (AgenticPay), 2406.19966 (ASFM financial market), 2506.00856,
    2603.23638 (EnterpriseArena resource allocation CFO).
- `hf papers info 2310.10436`
  - Result: "Paper '2310.10436' not found on the Hub." This is a Hugging Face Hub
    COVERAGE GAP, not a wrong id. Web verification (below) confirms 2310.10436 is
    the correct, real arXiv id for EconAgent (ACL 2024 long paper). LaTeX fetch by
    that id succeeded (7 tex files), confirming the id resolves on arXiv.
- `hf papers search "generative agent-based models LLM social simulation emergence" --limit 8`
  - Hits: 2502.08691 (AgentSociety, 10k agents / 5M interactions, includes UBI
    policy experiment), 2411.07038 (GABM reliable-experiments guide using
    Concordia), 2307.14984 (S3 social-network sim), 2506.21974 (Don't Trust
    Generative Agents, already covered), 2304.03442 (Generative Agents, already
    covered), 2412.03563 (survey: Individual->Society social simulation), 2412.17481
    (LLM-MAS survey), 2502.01506 (TwinMarket).
- `hf papers search "large-scale generative agent society million simulation" --limit 8`
  - Hits: 2502.08691 (AgentSociety), 2412.03563 (survey), 2407.17789 (AgentScope
    very-large-scale), 2507.09901 (Large Population Models / AgentTorch), 2601.09150
    (World Craft), 2409.07486 (MarS financial market generative engine), 2504.10157
    (SocioVerse, 10M-user pool world model for social sim), 2410.14251 (MATRIX
    post-training data).
- `hf papers search "agent-based model validation calibration economics empirical" --limit 8`
  - Rationale: find the economics-specific validity/calibration literature (the
    perennial ABM hard problem, brief asks for honesty about maturity).
  - Hits: 2506.00856, 2605.17698 (Agent Bazaar economic alignment, market crash /
    Sybil), 2601.07264 (Confidence Dichotomy tool-use calibration), 2602.06030
    (PhysicsAgentABM physics-guided GABM, calibration critique), 2406.19966 (ASFM),
    2505.17648, 2507.15815, 2506.08136 (EconWebArena).
- `hf papers search "agent-based model resource scarcity trade emergent inequality wealth distribution" --limit 6`
  - Rationale: classic-ABM resource economy + emergence (Sugarscape-style).
  - Hits: 2606.02859 (Economy of Minds, Hayekian agent economy), 2510.14401 (Social
    Learning + Norm Formation in CPR LLM systems, Ostrom-grounded), 2509.10147
    (Virtual Agent Economies / sandbox economy), 2603.27771 (Emergent Social
    Intelligence Risks), 2502.01506 (TwinMarket), 2507.15815 (LLM Economist).

## 2. WebSearch (non-arXiv classics + id verification)

- WebSearch "EconAgent Large Language Model-Empowered Agents Macroeconomic
  Activities arXiv ACL 2024".
  - Verified: arXiv 2310.10436 is correct; published as ACL 2024 long paper
    (aclanthology.org/2024.acl-long.829). Code at
    github.com/tsinghua-fib-lab/ACL24-EconAgent. Resolves the Hub coverage gap.
- WebSearch "Epstein Axtell Growing Artificial Societies Sugarscape emergent wealth
  distribution Gini agent-based model".
  - Verified the classic ABM cornerstone: Epstein and Axtell 1996, "Growing
    Artificial Societies: Social Science from the Bottom Up" (MIT Press / Brookings,
    ISBN 0-262-55025-3). Sugarscape: agents with vision/metabolism on a sugar
    landscape; emergent wealth distribution measured by Lorenz curve and Gini
    coefficient; emergent trade, migration, segregation. JASSS replication appendix
    (jasss.soc.surrey.ac.uk/12/1/6/appendixB) and Wilensky NetLogo model exist.
    This is a book/docs-level source (no arXiv id); logged with id slug.
- WebSearch "Windrum Fagiolo Moneta empirical validation agent-based models
  economics methodological appraisal calibration JASSS".
  - Verified: Windrum, Fagiolo and Moneta (2007), "Empirical Validation of
    Agent-Based Models: Alternatives and Prospects", JASSS 10(2)8; and Fagiolo,
    Moneta and Windrum (2007), "A Critical Guide to Empirical Validation of
    Agent-Based Models in Economics", Computational Economics 30(3):195-226. The
    canonical statement of the ABM calibration/validity problem. Journal/docs-level.
- WebSearch "Tesfatsion agent-based computational economics ACE constructive
  bottom-up market definition".
  - Verified: Tesfatsion (2002), "Agent-Based Computational Economics: Growing
    Economies from the Bottom Up", Artificial Life 8(1):55-82. The canonical
    definition of ACE and the "culture-dish" / constructive bottom-up methodology.
    Journal/docs-level.

## 3. LaTeX downloads (cornerstones, deep-read)

- `bash scripts/fetch_arxiv_latex.sh 2004.13332 ai-economist` -> tarball_extracted,
  21 tex files. Read src/{abs,intro,environment_rules_dynamics,agent_learning_in_sim,
  learning_optimal_taxation,ai_experiments,conclusion,ethics}.tex.
- `bash scripts/fetch_arxiv_latex.sh 2507.15815 llm-economist` -> tarball_extracted,
  11 tex files. Read preprint.tex + sections/{01_introduction,03_methodology,
  06_discussion}.tex.
- `bash scripts/fetch_arxiv_latex.sh 2310.10436 econagent` -> tarball_extracted,
  7 tex files. Read 1.intro.tex, 4.method.tex, 5.exp.tex, 0.main.tex
  (Conclusion + Limitations).

## 4. Notes on verification and gaps

- Only the three cornerstones were LaTeX-deep-read. All other rows are
  abstract-level (HF search result abstracts) plus, for the four classics, the
  publisher/JASSS pages above. Marked accordingly in the manifest.
- 2310.10436 is the one seed flagged "verify": confirmed correct via web; the only
  wrinkle is that the HF Hub does not index it.
- Numbers I did not independently verify (left as the papers' own claims): AI
  Economist "16% improvement over Saez" and "47% equality gain at 11% productivity
  cost"; EconAgent Pearson r values for Phillips Curve (-0.619) and Okun's Law
  (-0.918); AgentSociety "10k agents, 5M interactions"; SocioVerse "10M real-user
  pool". These are primary-source self-reported metrics, not reproduced here.
