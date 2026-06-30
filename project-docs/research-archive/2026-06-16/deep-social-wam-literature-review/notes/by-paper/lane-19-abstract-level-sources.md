# Lane 19 abstract-level sources (long tail)

Abstract/landing-level only (not LaTeX deep-read). Each entry: id, one-line what-it-introduced, the honesty/verification angle, and why it is logged. Discovered via `hf papers search` unless noted; ids verified in the search log.

## Systems and benchmarks (verify-then-add seeds)

- **2502.18864 - Towards an AI co-scientist** (Google, Gemini 2.0). Multi-agent generate-debate-evolve hypothesis generator with a tournament/Elo self-improvement loop; validated in 3 biomedical areas (drug repurposing, target discovery, AMR mechanism), some wet-lab confirmation reported. Angle: improvement is graded by an internal Elo tournament (LLM self-ranking), with the real verification being downstream WET-LAB experiments by humans, exactly the external-verifier separation. Relevant as the largest "AI proposes, lab verifies" precedent. (abstract)

- **2411.15114 - RE-Bench (METR)**. 7 open-ended ML R&D environments; 71 8-hour attempts by 61 human experts as a direct baseline. Best AI agents score 4x humans at a 2-hour budget but humans overtake at 8 hours and reach 2x AI at 32 hours. 82% of human attempts scored nonzero. Angle: a RARE case of an environment-verified, human-anchored success metric for research engineering, the kind of clean signal the social layers lack. Verified via web (arxiv.org/abs/2411.15114, METR). (abstract, web-verified)

- **2410.07095 - MLE-bench (OpenAI)**. 75 Kaggle competitions with human leaderboard baselines; best setup (o1-preview + AIDE) reaches a bronze medal in 16.9%. Angle: success is the Kaggle grader (external, automatic), a clean verifier; the engineering-loop counterpart to this lane (owned by H1/lane-18). (abstract)

- **2501.04227 - Agent Laboratory**. Three-stage assistant (lit review, experimentation, report); 84% cost reduction vs prior autonomous methods; human feedback at each stage "significantly improves quality." Angle: explicitly shows human-in-the-loop feedback raises quality, i.e. the fully-autonomous self-graded mode is weaker. (abstract)

- **2503.18102 - AgentRxiv**. A shared preprint server letting agent labs build on each other's reports; collaborating agents improve more than isolated ones (11.4% relative on MATH-500). Angle: a multi-agent self-improvement loop; success measured against benchmark accuracy (external). Tie to cumulative/institutional knowledge. (abstract)

- **2512.19799 - PhysMaster**. Autonomous theoretical/computational physicist; couples reasoning with numerical computation, uses LANDAU (a layered store of validated methodological traces) for decision reliability over ultra-long-horizon tasks. Angle: "validated methodological traces" is an evidence-grounding move; verification is via numerical computation (executable) plus claimed open-problem exploration. (abstract)

- **2507.08038 - AblationBench** (seed). Benchmark for automated ablation planning: AuthorAblation (83 instances), ReviewerAblation (350); best LM identifies only 29% of original ablations; uses LM-judges for evaluation. Angle: ablation = the falsification step (cf. AIGS); a 29% ceiling quantifies how weak automated falsification-PLANNING currently is. Companion AbGen (2507.13300) finds automated evaluation of ablation design unreliable vs humans. (abstract)

- **2510.18003 - BadScientist**. Shows fabrication-oriented paper generators (no real experiments) can fool multi-model LLM reviewers; identifies "concern-acceptance conflict" (reviewers flag integrity issues yet assign accept scores); mitigations barely beat chance. Angle: direct evidence that an LLM reviewer is gameable, reinforcing the no-self-scoring rule. (abstract)

- **2605.26340 - ScientistOne / Chain-of-Evidence**. Requires every claim traceable to its evidence source (CoE), with a post-hoc CoE Audit (score verification, spec violation, reference verification, method-code alignment). Across 75 papers from 5 systems, baselines show hallucinated-reference rates to 21%, score verification passing as low as 42%. Angle: claim-evidence binding as a design principle, matching Kosmos provenance and the repo's verifier-evidence binding. (abstract)

## Surveys and risk/landscape (breadth, abstract-only)

- **2507.23276 - How Far Are AI Scientists from Changing the World?** Prospect-driven survey of AI-scientist systems, bottlenecks, missing components. Modest-claim anchor against hype. (abstract)
- **2605.23204 - AutoResearch AI survey**. Frames "AutoResearch" as a spectrum; proposes 5 evaluation dimensions (novelty, validity, impact, reliability, provenance); concludes autonomy is "domain-conditioned," credible in structured/verifiable settings, limited in embodied/delayed/ethical ones. Direct support for the thesis's honest bound. (abstract)
- **2605.18661 - AI for Auto-Research: Roadmap & User Guide**. Maps a "sharp, stage-dependent boundary between reliable assistance and unreliable autonomy"; under pressure even frontier LLMs "fabricate results, miss hidden errors, fail to judge novelty"; argues human-governed collaboration is the credible paradigm. (abstract)
- **2601.03315 - Why LLMs Aren't Scientists Yet**. Four end-to-end autonomous ML-paper attempts; 3 of 4 failed; documents six recurring failure modes incl. "overexcitement that declares success despite obvious failures." Names the self-scoring failure directly. (abstract)
- **2505.11855 - SPOT**. LLMs-as-verifiers benchmark: 83 papers, 91 errata/retraction-level errors; best model under 21.1% recall / 6.1% precision; models rarely rediscover the same error across runs. Quantifies how weak LLM verification of real papers is. (abstract)

All entries logged in `raw-search-results/lane-19-manifest.jsonl`. Deep-read cornerstones have their own by-paper notes.
