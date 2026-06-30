# Lane 28 search log (Automated agent + prompt/workflow design)

Wave 5, lane 28 (I5). All dates 2026-06-17. Discovery: Hugging Face CLI first, then web.
Punctuation ASCII only.

## Seed verification (hf papers search), all seed ids CONFIRMED unless noted

- `hf papers search "Automated Design of Agentic Systems"` -> ADAS = 2408.08435 CONFIRMED (exact title). Bonus surfaced: "A Self-Improving Coding Agent" 2504.15228; ALMA "Learning to Continually Learn via Meta-learning Agentic Memory Designs" 2602.07755.
- `hf papers search "AFlow automating agentic workflow generation"` -> AFlow = 2410.10762 CONFIRMED. Bonus surfaced workflow-optimization siblings: AWO meta-tools 2601.22037, AutoFlow 2407.12821, SEW 2505.18646, Flow 2501.07834.
- `hf papers search "GPTSwarm language agents as optimizable graphs"` -> GPTSwarm = 2402.16823 CONFIRMED ("Language Agents as Optimizable Graphs"). Bonus: workflow-optimization SURVEY 2603.22386 surfaced here.
- `hf papers search "Large Language Models as Optimizers OPRO"` -> OPRO = 2309.03409 CONFIRMED. Bonus: CAPO cost-aware prompt opt 2504.16005.
- `hf papers search "Large Language Models Are Human-Level Prompt Engineers"` -> APE = 2211.01910 CONFIRMED.
- `hf papers search "Promptbreeder self-referential self-improvement"` -> PromptBreeder = 2309.16797 CONFIRMED.
- `hf papers search "DSPy compiling declarative language model calls"` -> DSPy = 2310.03714 CONFIRMED. MIPRO optimizer = 2406.11695 CONFIRMED ("Optimizing Instructions and Demonstrations for Multi-Stage Language Model Programs"); DSPy Assertions 2312.13382 also surfaced.
- `hf papers search "EvoPrompt connecting LLMs with evolutionary algorithms prompt optimization"` -> EvoPrompt = 2309.08532 CONFIRMED ("Connecting Large Language Models with Evolutionary Algorithms Yields Powerful Prompt Optimizers").
- `hf papers search "AgentSquare automatic LLM agent search modular design"` -> exact paper did NOT surface in hf top hits (fuzzy). Surfaced AgentSwift 2506.06017 (value-guided hierarchical agent design search, kept as breadth source).

## Web verification (ToolSearch select:WebSearch,WebFetch)

- WebSearch "AgentSquare automatic modular agent search arxiv abstract 2024" -> AgentSquare = 2410.06153 CONFIRMED (Tsinghua FIB lab; four modules Planning/Reasoning/Tool-Use/Memory; module evolution + recombination; +17.2% over best human designs; code github.com/tsinghua-fib-lab/AgentSquare).
- WebSearch '"automatic prompt optimization" survey LLM systematic taxonomy arxiv 2025' -> APO surveys: 2502.16923 (A Systematic Survey of Automatic Prompt Optimization Techniques, formal APO definition + 5-part framework, chosen as the survey anchor); 2502.18746 (heuristic-search APO survey); 2502.11560 (optimization-perspective survey).
- WebSearch "automated prompt optimization overfitting validation set generalization gains do not transfer LLM" -> named failure mode "prompt distributional overfitting"; critique 2601.22025 "When Better Prompts Hurt: Evaluation-Driven Iteration"; generalization-bounds paper 2510.08413 "Prompts Generalize with Low Data". (Both kept as abstract-level; ids unverified beyond search-result titles -> tagged claim-only.)
- `hf papers info 2603.22386` -> CONFIRMED IBM survey "From Static Templates to Dynamic Runtime Graphs: A Survey of Workflow Optimization for LLM Agents" (57 upvotes; organizes literature by WHEN structure is set + WHAT is optimized + WHICH evaluation signals guide optimization: task metrics, verifier signals, preferences, trace-derived; adds structure-aware evaluation incl. robustness; github.com/IBM/awesome-agentic-workflow-optimization). Strong anchor for the honesty bound.

## LaTeX fetch (deep-read cornerstones)

The shared `scripts/fetch_arxiv_latex.sh` failed on first run (its `curl -fsSL` returned non-zero;
the PDF fallback also printed a "Malformed input to a URL function" because the slug arg leaked
into the PDF URL). Direct `curl -sSL https://arxiv.org/e-print/<id>` returned HTTP 200 valid gzip
tarballs for the same ids, so arXiv was reachable. Worked around by fetching tarballs directly with a
clean User-Agent and extracting into the same `papers/latex/<id>/` layout + writing `papers/metadata/<id>.json`
(note: zsh makes `status` a read-only special var; the inline script used `st` instead).

All fetched HTTP 200, tarball_extracted:
- 2408.08435 ADAS (3 tex), 2410.10762 AFlow (11 tex), 2402.16823 GPTSwarm (2 tex), 2410.06153 AgentSquare (16 tex)
- 2309.03409 OPRO (10 tex), 2211.01910 APE (14 tex), 2310.03714 DSPy (13 tex), 2406.11695 MIPRO (20 tex), 2309.16797 PromptBreeder (2 tex), 2309.08532 EvoPrompt (24 tex)

Deep-read (main + method + experiment + limitations): ADAS, AFlow, OPRO, GPTSwarm, DSPy(+compiler), PromptBreeder.
Abstract + key-section read: AgentSquare, MIPRO, APE, EvoPrompt.

## Deconfliction performed

Read heads of sibling theme files to set the boundary:
- `research-area-agentic-self-improvement-loops.md` (H1) owns the LOOP itself (ENPIRE/DGM). I cite, do not redo.
- `research-area-llm-reward-and-code-generation.md` (H3) owns reward/skill CODE generation. I cite, do not redo.
Lane 28 owns: automating the AGENT'S own architecture, workflow, and prompts (the agent improves the agent).

## Notes on honesty

- Seeds 2601.22025, 2510.08413, 2506.06017 are abstract/search-result-level only; ids not independently fetched, marked reproducibility_status claim-only.
- ADAS/AFlow/OPRO/DSPy/AgentSquare numeric results are as-stated by each paper (no independent re-run).
