# Lane 19 (H2): AI Scientist and automated scientific discovery

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
Systems that automate the scientific method itself: idea generation, experiment design and
execution, analysis, paper writing, review, and falsification. Central question: can an agent
produce trustworthy new knowledge, and how is correctness established (environment verification vs
self-review)? Emphasize the HONESTY and RISK angle: self-reviewed "success" vs externally verified
findings.

## Seeds (verify ids before fetching)
- The AI Scientist: 2408.06292; The AI Scientist-v2 (agentic tree search): 2504.08066.
- Kosmos, an AI Scientist for Autonomous Discovery: 2511.02824. Note: it uses a STRUCTURED WORLD
  MODEL to share state across agents (tie to WAM). Reports 79.4% statement accuracy (page-stated).
- AGS, Scaling Laws in Scientific Discovery with AI and Robot Scientists: 2503.22444.
- AIGS / Baby-AIGS, Generating Science from AI-Powered Automated Falsification: 2411.11910
  (FalsificationAgent).
- PhysMaster, autonomous AI physicist: 2512.19799.
- Jr. AI Scientist and Its Risk Report: 2511.04583 (failure modes, fabrication risk).
- AblationBench: 2507.08038 (evaluating automated ablation planning).
- Verify-then-add: Google "AI co-scientist" (Gemini), MLE-bench (OpenAI), RE-Bench (METR), AIDE,
  Agent Laboratory, Curie.

## Owned deliverables
- Theme: `notes/by-theme/research-area-ai-scientist-automated-discovery.md`.
- by-paper notes (at least AI Scientist v1/v2, Kosmos, Baby-AIGS).
- `raw-search-results/lane-19-manifest.jsonl`, `raw-search-results/lane-19-search-log.md`,
  `notes/subagent-briefs/lane-19-ai-scientist-automated-discovery.md`.

## Deconflict
- H1 (lane 18) owns the loop ENGINEERING; you own the SCIENTIFIC-METHOD framing and the
  trust/falsification question.
- Cite wave-1 `llm-social-simulation` and `project-sid-critical-review` for the
  "self-reported vs verified" caution.

## WAM tie + thesis
Two angles. (1) The "research" an autoresearch loop automates here = discovering and validating the
WAM's predictive rules (which action causes which social-material delta); falsification equals a
verifier-grounded hypothesis test. (2) The risk angle is central to the thesis: AI-Scientist
findings are often graded by an AI reviewer or by the system itself; the repo's rule (runtime owns
truth, no progress laundering) is the antidote. Report measured accuracy of AI-generated findings
where stated, and treat self-review scores as claims, not facts.
