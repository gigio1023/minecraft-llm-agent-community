# Lane 24 search log (coding-agent autoresearch, the digital phenomenon)

Lane 24 (I1), wave 5. All searches 2026-06-17. Tool order per contract: Hugging Face CLI first, then web. `hf` authenticated as naem1023.

## Hugging Face CLI: papers search

- `hf papers search "MLE-bench machine learning engineering agents" --limit 12`
  rationale: locate and verify MLE-bench seed (2410.07095). Confirmed 2410.07095. Surfaced R&D-Agent (2505.14738), MLE-Dojo (2505.07782), MLR-Bench (2505.19955), MLE-STAR (2506.15692) for breadth.
- `hf papers search "SWE-bench resolving GitHub issues language models" --limit 12`
  rationale: verify SWE-bench seed (2310.06770). Confirmed. Surfaced SWE-bench Verified-family and SWE-Bench+ (2410.06992) for contamination breadth.
- `hf papers search "autonomous machine learning research engineering agent" --limit 12`
  rationale: discover ML-research-engineer agents. Surfaced AIDE (2502.13138), AgentRxiv (2503.18102), R&D-Agent, MLR-Copilot (2408.14033).
- `hf papers search "collaborative autonomous research AgentRxiv" --limit 12`
  rationale: verify AgentRxiv seed (2503.18102) + multi-agent research. Confirmed 2503.18102. Surfaced OmniScientist (2511.16931), AutoAgents (2309.17288).
- `hf papers search "RE-Bench AI research engineering human expert comparison" --limit 10`
  rationale: verify RE-Bench seed. Confirmed 2411.15114. Also EXP-Bench (2505.24785), AI-Researcher (2505.18705).
- `hf papers search "SWE-agent agent computer interface software engineering" --limit 10`
  rationale: verify SWE-agent seed. Confirmed 2405.15793. Surfaced SWE-rebench (2505.20411, decontaminated eval) for contamination thread.
- `hf papers search "MLGym framework AI research agents benchmark" --limit 10`
  rationale: verify MLGym + MLAgentBench. Confirmed MLGym 2502.14499; CORE-Bench (2409.11363).
- `hf papers search "PaperBench replicate machine learning research papers agents" --limit 10`
  rationale: verify PaperBench. Confirmed 2504.01848. Surfaced ReplicationBench (2510.24591), "How Far Are We From True Auto-Research?" (2605.19156).
- `hf papers search "Agent Laboratory using LLM agents as research assistants" --limit 10`
  rationale: verify Agent Laboratory (AgentRxiv's base). Confirmed 2501.04227.
- `hf papers search "OpenHands open platform AI software developers" --limit 10`
  rationale: verify OpenHands/OpenDevin. Confirmed OpenDevin 2407.16741; OpenHands SDK (2511.03690).
- `hf papers search "MLAgentBench evaluating agents on machine learning experimentation" --limit 10`
  rationale: verify MLAgentBench. Confirmed 2310.03302. Also AstaBench (2510.21652), AgentBench (2308.03688).
- `hf papers search "benchmark contamination software engineering agents data leakage" --limit 10`
  rationale: contamination thread. Surfaced AntiLeak-Bench (2412.13670); the SWE-bench-correctness critique came from the next query.
- `hf papers search "SWE-bench inflated scores solution leakage critique reliability" --limit 10`
  rationale: find the "how real are the gains" critique. Found "Are Solved Issues in SWE-bench Really Solved Correctly?" (2503.15223) and SWE-Bench Pro (2509.16941).
- `hf papers search "self-improving coding agent automatically edits own code benchmark" --limit 10`
  rationale: the digital self-edit loop (DGM analog). Found "A Self-Improving Coding Agent" (2504.15228), Huxley-Godel Machine (2510.21614), SlopCodeBench (2603.24755).
- `hf papers search "Kaggle Grandmaster level autonomous data science agent" --limit 10`
  rationale: Kaggle-grandmaster agent breadth. Found Agent K (2411.03562), AutoKaggle (2410.20424), AutoMind (2506.10974).
- `hf papers search "empirical study multi-agent collaboration automated research" --limit 8`
  rationale: Git-coordinated multi-agent breadth. Confirmed AgentRxiv as the main hit; ResearchCodeAgent (2504.20117).

## Hugging Face CLI: papers info (verification)

- `hf papers info 2411.15114` confirmed RE-Bench authors (METR), GitHub METR/ai-rd-tasks, the human-anchor finding.
- `hf papers info 2603.29632` -> Error: not found on the Hub. The web search returned an arXiv id 2603.29632 ("An Empirical Study of Multi-Agent Collaboration for Automated Research") but HF Hub has no record. CORRECTION: treat 2603.29632 as UNVERIFIED; not deep-read, not logged in manifest. AgentRxiv (2503.18102) covers the multi-agent-research angle instead.
- `hf papers info` batch verified: 2310.03302 (MLAgentBench, Qian Huang, snap-stanford), 2502.14499 (MLGym, Deepak Nathani, facebookresearch), 2504.01848 (PaperBench, Giulio Starace, openai/preparedness), 2501.04227 (Agent Laboratory, Samuel Schmidgall), 2407.16741 (OpenDevin, Xingyao Wang), 2510.21614 (Huxley-Godel Machine, Wenyi Wang, metauto-ai/HGM).

## Web (ToolSearch -> WebSearch / WebFetch)

- `ToolSearch("select:WebSearch,WebFetch,TaskCreate,TaskUpdate")` to load web tools.
- WebSearch "Karpathy autoresearch github AI agents nanochat training automatically"
  rationale: the term "autoresearch" origin (no arXiv). Confirmed https://github.com/karpathy/autoresearch.
- WebFetch https://raw.githubusercontent.com/karpathy/autoresearch/master/README.md
  rationale: extract the loop, metric (val_bpb), philosophy, license (MIT), anti-gaming (none discussed), git/multi-agent (theoretical only).

## LaTeX fetched (scripts/fetch_arxiv_latex.sh; 3s polite sleep each)

All extracted as LaTeX tarballs (none PDF-fallback):
2410.07095 mle-bench, 2310.06770 swe-bench, 2405.15793 swe-agent, 2411.15114 re-bench,
2503.18102 agentrxiv, 2502.13138 aide, 2504.01848 paperbench, 2503.15223 swebench-solved-correctly,
2504.15228 self-improving-coding-agent, 2505.20411 swe-rebench, 2603.24755 slopcodebench.

## Notes on seed verification

- All brief seeds verified: MLE-bench 2410.07095, SWE-bench 2310.06770, AgentRxiv 2503.18102, RE-Bench
  2411.15114, AIDE 2502.13138, Agent Laboratory 2501.04227, MLGym 2502.14499, MLAgentBench 2310.03302,
  PaperBench 2504.01848, OpenHands/OpenDevin 2407.16741, SWE-agent 2405.15793.
- "A multi-agent system for automating scientific discovery (Nature 2026, ENPIRE ref 16)": not located
  with a verifiable arXiv id via HF; left for lane H2 (lane 19, AI-scientist). Not logged here to avoid a
  fabricated id.
- Deconfliction honored: ENPIRE loop engineering (lane 18), paper-writing science (lane 19), reward/skill
  code generation (lane 20) are cited from their existing theme files, not re-surveyed.
