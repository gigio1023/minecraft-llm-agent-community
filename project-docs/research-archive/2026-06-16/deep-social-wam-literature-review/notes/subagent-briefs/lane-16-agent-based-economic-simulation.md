# Lane 16 brief: Agent-based economic simulation and computational social science

Lane name: G5, agent-based computational economics (ACE) / computational social
science, including LLM-driven economic and market simulation.

Owned outputs: `notes/by-theme/research-area-agent-based-economic-simulation.md`;
by-paper notes `2004.13332-ai-economist.md`, `2310.10436-econagent.md`,
`2507.15815-llm-economist.md`; `raw-search-results/lane-16-manifest.jsonl`;
`raw-search-results/lane-16-search-log.md`.

## Sources reviewed

- Count: 24 logged in the manifest. LaTeX deep-read: 3 (2004.13332 AI Economist,
  2310.10436 EconAgent, 2507.15815 LLM Economist). Docs/book-level classics: 4
  (Epstein-Axtell Sugarscape 1996, Tesfatsion ACE 2002, Windrum-Fagiolo-Moneta
  validation 2007, Schelling segregation 1971). Abstract-level: 17.
- Cited-not-duplicated (owned by other lanes): GLEE 2410.05254, Concordia
  2312.03664, Generative Agents 2304.03442, GovSim 2404.16698, AgentSociety as a
  social sim 2502.08691.
- Cornerstones (ids): 2004.13332, 2310.10436, 2507.15815, plus the four classics.
- Strongest long tail (ids): 2509.10147 (Virtual Agent Economies), 2605.17698
  (Agent Bazaar), 2602.06030 (PhysicsAgentABM calibration), 2502.01506 (TwinMarket),
  2406.19966 (ASFM), 2507.09901 (Large Population Models), 2504.10157 (SocioVerse),
  2403.12093 (Stackelberg MFG / TaxAI), 2603.23638 (EnterpriseArena), 2510.14401
  (CPR norm formation), 2603.27771 (Emergent risks).

## Strongest findings (source-backed)

1. The AI Economist's Gather-and-Build game (arXiv 2004.13332, deep-read) is the
   closest precedent in the economic-sim literature to a Minecraft material economy:
   a 2D grid where agents move, collect wood and stone, craft houses for coins, and
   trade resources on an open market, with movement blocked by placed houses and
   water. It supplies directly-adaptable quantities (Gini-equality, total-wealth
   productivity, isoelastic utility = value - effort) and uses **emergent
   specialization** (low-skill gatherer-sellers, high-skill builders) as a
   validation check rather than a discovery.

2. The LLM-economic-sim lineage confirms the repo's "LLM proposes, environment owns
   dynamics" architecture and shows its distinctive gap. EconAgent (arXiv 2310.10436,
   deep-read) recovers the Phillips Curve and Okun's Law with the correct sign where
   rule-based and RL baselines fail. The LLM Economist (arXiv 2507.15815, deep-read)
   does in-context Stackelberg mechanism design over Census-sampled personas. But
   the LLM Economist explicitly lists "richer actions, such as trade" as future
   work: across the whole area the exchanged "good" is a scalar (coin, labor, an
   order), never a verified physical item with location/access/durability.

3. Calibration/validity is the field's own admitted hard problem, and it is the WAM
   problem restated. Windrum-Fagiolo-Moneta (2007) is the canonical statement that
   ABM is mature at building but chronically hard at validating; PhysicsAgentABM
   (arXiv 2602.06030) is a recent admission that LLM ABMs are "poorly calibrated for
   timestep-aligned state-transition simulation" and proposes neuro-symbolic,
   uncertainty-aware transition distributions, the same target as a good WAM
   (predict o' well, with uncertainty).

## Weak or uncertain claims (could not verify)

- All headline metrics are the papers' own, not reproduced: AI Economist "16% over
  Saez" and "47% equality gain at 11% productivity cost"; EconAgent Phillips r =
  -0.619 and Okun r = -0.918; AgentSociety "10k agents / 5M interactions";
  SocioVerse "10M-user pool"; EnterpriseArena "16% survive". Logged as primary-source
  claims, marked claim-only/partial in the manifest.
- 2310.10436 (EconAgent) is not indexed on the Hugging Face Hub, so `hf papers info`
  fails; I verified the id is correct via web (ACL 2024 long paper + successful
  arXiv LaTeX fetch). The Hub gap is recorded in the search log.
- The recent (2026) arXiv long-tail entries (2605.17698, 2602.06030, 2606.02859,
  2603.23638, 2603.27771, 2602.06008) were read at abstract level only; author
  lists for a few are left as "see arXiv" because the HF result did not include
  full author strings and I did not fetch each page.
- Author/venue precision: the AI Economist arXiv 2004.13332 became Science Advances
  2022 via the companion 2108.02755; I attribute the Science Advances venue to the
  follow-up, not the 2020 preprint, to avoid misdating.

## Implications for this repo

- Mechanically useful (borrow as engineering):
  - The possession/scarcity/exchange/commons vocabulary and the scoring quantities
    (Gini-equality, productivity, value-minus-effort utility, exchange
    efficiency/fairness), mapped onto a Minecraft `material claim` / possession
    ledger and per-actor effort accounting.
  - The constructive-and-validate discipline: recover a known material regularity
    (scarcity raises contested-resource effort; tool endowment drives role
    specialization) before claiming social/institutional structure.
  - The persona-population pattern (Census-sampled heterogeneity) for seeding
    differently-endowed actors.
  - The calibration-aware, uncertainty-bearing transition lesson for the WAM's
    predictive head.
- Research contribution (what the area does not provide):
  - No work here grounds the economy in a *verified embodied runtime*. The repo's
    novel claim would be an advisory WAM that predicts material-economy deltas
    (possession changes, claims, borrow/lend/return, weak-commons depletion, costs
    to others) scored against verifier evidence of what physically happened. The
    grounding, not the metrics, is novel.
  - Keep the WAM advisory: this area's planners *act* (set taxes, optimize welfare);
    the repo's WAM must predict and evaluate only.
- Overclaim caveat to carry forward: "emergent economy" claims in this area are
  usually validation checks, not discoveries. The LLM Economist's "better
  civilizations" framing vs its 100-agent/no-trade evidence is the warning. Claim
  measurable, predictable, verifier-backed material deltas in a bounded world; do
  not claim an emergent economy or civilization or real-world transfer.

## Recommended next questions

1. Which specific material regularity should be the repo's first validation target
   (a scarcity-vs-effort curve? a tool-endowment specialization split?), and what
   verifier evidence defines "recovered"?
2. What is the minimal typed schema for a Minecraft exchange outcome (item id,
   quantity, from-actor, to-actor, location, resulting claim/obligation) so that
   GLEE-style efficiency/fairness and AI-Economist-style Gini/productivity can be
   computed over *verified transfers* rather than transcript text?
3. How should the advisory WAM represent "cost imposed on others" and "weak-commons
   depletion" as predicted deltas, drawing on the sandbox-economy axes (Virtual
   Agent Economies 2509.10147) and the CPR/Ostrom framing (owned by
   `sociology-grounding-for-social-wam.md`) without building a heavy commons engine?
4. Can the calibration-aware transition idea (PhysicsAgentABM 2602.06030) inform how
   the WAM expresses uncertainty on its material-delta predictions, and how that
   uncertainty is scored against the verifier?
