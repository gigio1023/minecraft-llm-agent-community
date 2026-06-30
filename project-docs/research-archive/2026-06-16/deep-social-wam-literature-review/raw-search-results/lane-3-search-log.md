# Lane 3 Search Log — LLM Social Simulation and Social Benchmarks

Lane 3 (N=3). Discovery channels: Hugging Face CLI (`hf`, primary), then
WebSearch/WebFetch (arXiv, ACL Anthology, OpenReview, Semantic Scholar, GitHub,
project pages). Each entry: command/search, date, one-line rationale.

## 2026-06-16

Environment: `hf` v1.16.1, authenticated (`naem1023`). Rationale for hf-first:
the contract mandates Hugging Face CLI as primary discovery; `hf papers search`
gives upvote-ranked recent papers and resolves arXiv ids directly. The
coordinator HF dump (`hf-discovery-coordinator.txt`) was WAM/world-model heavy
(other lanes); none of Lane 3's social-eval seeds were in it, so Lane 3 ran its
own searches.

### HF paper searches (resolving seed ids + surfacing new sources)

```
hf papers search "SOTOPIA social intelligence agents" --limit 8
  -> 2310.11667 SOTOPIA (core), 2506.12666 Lifelong SOTOPIA, 2403.08715 SOTOPIA-pi,
     2508.03905 Sotopia-RL, 2509.00559 Social World Models (S3AP, new high-value find)
hf papers search "generative agents interactive human behavior" --limit 5
  -> 2304.03442 Generative Agents; 2411.10109 1000 People
hf papers search "generative agent simulations 1000 people" --limit 5
  -> 2411.10109 (confirm); 2502.08691 AgentSociety; 2412.03563 From Individual to Society survey
hf papers search "Concordia generative agent-based modeling" --limit 5
  -> 2312.03664 Concordia; 2411.07038 Concordia GABM guide; 2512.03318 Concordia mixed-motive
     generalization (NeurIPS 2024 Concordia Contest writeup, new)
hf papers search "do not trust generative agents mimic communication benchmark" --limit 5
  -> 2510.07709 multimodal safety sim (peripheral)
hf papers search "SimBench benchmarking LLM social simulation" --limit 5
  -> 2510.17516 SimBench (confirm)
hf papers search "belief behavior consistency LLM agents simulation" --limit 6
  -> 2507.02197 belief-behavior consistency (Trust Game); 2503.02016 belief-gap group identity;
     2402.04559 Can LLM Agents Simulate Human Trust Behaviors? (new, pairs with 2507.02197)
hf papers search "PersonaGym persona agents evaluation" --limit 5
  -> 2407.18416 PersonaGym; 2508.10014 PersonaEval; 2603.25620 PICon
hf papers search "GLEE LLM economic games negotiation bargaining" --limit 4
  -> economic-game cluster; GLEE itself (2410.05254) not top-ranked in hf, verified via web
hf papers search "MAgIC multi-agent LLM cognition game" --limit 4
  -> 2311.08562 MAgIC; 2310.10701 ToM for multi-agent collab
hf papers search "MultiAgentBench coordination milestone KPI" --limit 4
  -> 2503.01935 MultiAgentBench
hf papers search "Melting Pot multi-agent reinforcement learning evaluation" --limit 4
  -> 2403.11381 LLM-augmented agents on Melting Pot; 2407.07086 Hypothetical Minds (ToM scaffolding, new)
hf papers search "PARTNR embodied multi-agent household planning benchmark" --limit 4
  -> 2411.00081 PARTNR
hf papers search "AgentSense social scenario benchmark goal completion" --limit 4
  -> 2410.19346 AgentSense
hf papers search "M3-Bench social agent memory benchmark" --limit 4
  -> 2508.09736 M3-Bench (multimodal long-term-memory agent)
hf papers search "PsyMem psychological memory persona LLM" --limit 4
  -> 2505.12814 PsyMem
hf papers search "SALM social agent language model benchmark" --limit 4
  -> 2505.09081 SALM (social network simulation); 2305.14938 SocKET (social knowledge, new)
hf papers search "CoELA cooperative embodied agents language" --limit 4
  -> 2307.02485 CoELA
hf papers search "Overcooked human-AI coordination zero-shot" --limit 4
  -> 2312.15224 hierarchical LM agent for real-time human-AI coordination (Overcooked-style)
hf papers search "SocioVerse social simulation world model 10 million" --limit 4
  -> 2504.10157 SocioVerse
```

### Web verifications (seeds not top-ranked in hf)

```
WebSearch "arXiv 2506.21974 Do Not Trust Generative Agents to Mimic Communication"
  -> confirmed 2506.21974 (EACL 2026), authors Munker/Schwager/Rettinger, empirical-realism thesis
WebSearch "GLEE arXiv 2410.05254 LLM economic games framework efficiency fairness"
  -> confirmed 2410.05254 (OpenReview/ICLR), efficiency/fairness/self-gain metrics,
     finding "no absolute best model; performance depends on competitor's model"
```

### LaTeX downloads (12 primaries, LaTeX-first per contract §5)

```
bash scripts/fetch_arxiv_latex.sh 2310.11667 sotopia              # tarball, 23 tex
bash scripts/fetch_arxiv_latex.sh 2304.03442 generative-agents    # tarball, 19 tex
bash scripts/fetch_arxiv_latex.sh 2312.03664 concordia            # tarball, 1 tex (self-contained main)
bash scripts/fetch_arxiv_latex.sh 2510.17516 simbench             # tarball, 2 tex
bash scripts/fetch_arxiv_latex.sh 2506.21974 dont-trust-genagents # tarball, 14 tex
bash scripts/fetch_arxiv_latex.sh 2507.02197 belief-behavior-trust# tarball, 7 tex
bash scripts/fetch_arxiv_latex.sh 2410.05254 glee                 # tarball, 34 tex
bash scripts/fetch_arxiv_latex.sh 2509.00559 social-world-models  # tarball, 15 tex
bash scripts/fetch_arxiv_latex.sh 2411.10109 1000-people          # source was PDF -> papers/pdf/2411.10109.pdf
bash scripts/fetch_arxiv_latex.sh 2410.19346 agentsense           # tarball, 40 tex
bash scripts/fetch_arxiv_latex.sh 2506.12666 lifelong-sotopia     # tarball, 26 tex
bash scripts/fetch_arxiv_latex.sh 2407.18416 personagym           # tarball, 12 tex
```

Read depth: full method/eval/limitations LaTeX for SOTOPIA, Generative Agents,
Concordia, SimBench, belief-behavior, GLEE, S3AP/Social World Models, AgentSense,
Lifelong SOTOPIA, Don't Trust. PersonaGym (rubric only). 1000 People (abstract +
PDF, web-confirmed numbers). Breadth sources (AgentSociety, SocioVerse, MAgIC,
MultiAgentBench, PARTNR, Concordia-contest, PsyMem, SALM, From-Individual survey)
recorded at abstract level; the repo's own reference-sweep + expanded-related-work
notes already carry their abstracts, so Lane 3 cross-references rather than re-fetches.

### Repo grounding read

```
SPEC.md (vocabulary + non-negotiables)
project-docs/research-archive/2026-06-16/social-wam-research-frame.md (the WAM seed expanded)
project-docs/research-archive/Project-Sid-2411-00114-Review-2026-06-15.md (existing Sid review)
project-docs/research-archive/2026-06-16/reference-sweep-beyond-project-sid.md
project-docs/research-archive/2026-06-16/expanded-related-work-sweep.md
```
