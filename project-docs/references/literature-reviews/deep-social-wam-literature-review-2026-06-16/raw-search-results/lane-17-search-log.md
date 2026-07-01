# Lane 17 (G6) search log: long-horizon agent memory, and learned verifiers / reward models

Wave 3 research-area lane. All commands run 2026-06-16. `hf` = Hugging Face CLI
(authenticated). Web tools loaded via `ToolSearch("select:WebSearch,WebFetch")`.
Rationale is one line per command. Punctuation: ASCII only.

## 1. ID verification (verify before fetch, per wave-3 rule)

- `hf papers info 2310.08560` -> CONFIRMED MemGPT: Towards LLMs as Operating Systems
  (Packer, Wooders, Lin, Fang, Patil, Stoica, Gonzalez; UC Berkeley; 2023-10-12).
  code at memgpt.ai. Cornerstone (memory). Verified, then fetched LaTeX.
- `hf papers info 2305.20050` -> CONFIRMED Let's Verify Step by Step (Lightman,
  Kosaraju, Burda, Edwards, Baker, Lee, Leike, Schulman, Sutskever, Cobbe; OpenAI;
  2023-05-31). github.com/openai/prm800k. Cornerstone (process reward). Fetched LaTeX.
- `hf papers info 2306.05685` -> CONFIRMED Judging LLM-as-a-judge with MT-Bench and
  Chatbot Arena (Zheng et al.; 2023-06-09). github.com/lm-sys/fastchat. Names position,
  verbosity, self-enhancement bias. Cornerstone (judge biases). Fetched LaTeX.
- `hf papers info 2408.15240` -> CONFIRMED Generative Verifiers: Reward Modeling as
  Next-Token Prediction (GenRM; Zhang, Hosseini, Bansal, Kazemi, Kumar, Agarwal;
  DeepMind/Toronto; 2024-08-27). Cornerstone (generative verifier). Fetched LaTeX.
- `hf papers info 2005.11401` -> CONFIRMED Retrieval-Augmented Generation for
  Knowledge-Intensive NLP Tasks (Lewis et al.; 2020). Canonical RAG / non-parametric
  memory. Abstract-level (foundational citation).
- `hf papers info 2303.11366` -> CONFIRMED Reflexion: Language Agents with Verbal
  Reinforcement Learning (Shinn et al.; 2023-03-20). Episodic memory buffer + verbal
  self-feedback. Abstract-level (memory + self-verification bridge).
- `hf papers info 2408.15240` confirmed github/data link sites.google.com/view/generative-reward-models.

No wrong seeds were given in the brief; all 6 seed/secondary IDs verified on first try.

## 2. HF papers search (discovery)

Memory half:
- `hf papers search "A-MEM agentic memory for LLM agents" --limit 8`
  -> A-MEM 2502.12110 (Zettelkasten-style agentic memory, dynamic linking/evolution),
     plus 2602.22406 U-Mem, 2603.14597 D-MEM, 2602.19320 anatomy/taxonomy survey,
     2601.01885 AgeMem, 2602.03036 LatentMem, 2605.28773 FluxMem.
- `hf papers search "survey memory mechanisms LLM agents" --limit 8`
  -> 2404.13501 (canonical 2024 memory survey, "what is / why need"), 2603.07670
     (comprehensive 2026 survey, write-manage-read loop, 5 mechanism families),
     2605.06716 (storage->reflection->experience survey), 2507.05257 MemoryAgentBench,
     2506.21605 MemBench, 2408.09559 HiAgent (hierarchical working memory).

Verifier / reward half:
- `hf papers search "generative verifiers reward modeling next-token" --limit 8`
  -> 2408.15240 GenRM (cornerstone), 2507.08794 One Token to Fool LLM-as-a-Judge,
     2510.14660 rubric generative verifier, 2510.07242 HERO hybrid, 2407.12863 TVM,
     2503.22230 RLHF data scaling (RTV vs GenRM), 2512.03244 SPARK.
- `hf papers search "process reward model survey verifier LLM reasoning" --limit 8`
  -> 2406.06592 OmegaPRM (automated process supervision), 2504.16828 ThinkPRM
     (generative long-CoT PRM), 2410.08146 Rewarding Progress / PAV (process reward =
     change in P(correct future)), 2601.17223 VPRM (deterministic rule verifiers),
     2509.25598 process reward for non-verifiable agentic tasks, 2511.06209 uncertainty
     heads, 2410.15115 reward hacking in RL training.
- `hf papers search "generation verification gap self-verification language models" --limit 6`
  -> 2412.02674 Mind the Gap (formalizes generation-verification gap; scaling phenomenon),
     2602.07594 Learning to Self-Verify, 2509.17995 Variation in Verification (gen vs
     verifier capability), 2506.01369 Incentivizing self-verify, 2402.14158 ToolVerifier
     (self-verification for tool selection + parameter generation).
- `hf papers search "LLM-as-a-judge survey biases evaluation" --limit 6`
  -> 2406.07791 position bias study, 2410.02736 Justice or Prejudice? (CALM, 12 biases),
     2602.09383 BiasScope, 2603.08091 JudgeBiasBench, 2409.16788 / 2505.17100 debiasing.
- `hf papers search "Reflexion verbal reinforcement learning agents" --limit 5`
  -> 2303.11366 Reflexion (cornerstone-adjacent), 2509.02547 Agentic RL survey,
     2603.08706 Agentic Critical Training.
- `hf papers search "self-rewarding language models" --limit 5`
  -> 2401.10020 Self-Rewarding LMs (LLM-as-Judge as own reward; bootstrap),
     2407.19594 Meta-Rewarding, 2508.06026 Temporal Self-Rewarding, 2502.08922 SCIR,
     2410.12735 CREAM (self-rewarding bias accumulation / saturation).

## 3. LaTeX downloads (cornerstones, LaTeX-first)

- `bash scripts/fetch_arxiv_latex.sh 2310.08560 memgpt` -> tarball_extracted, 12 tex.
- `bash scripts/fetch_arxiv_latex.sh 2305.20050 lets-verify-step-by-step` -> extracted,
  single process_supervision.tex (+ figures, +PDF). Read in full.
- `bash scripts/fetch_arxiv_latex.sh 2408.15240 generative-verifiers-genrm` -> 7 tex.
- `bash scripts/fetch_arxiv_latex.sh 2306.05685 judging-llm-as-judge` -> 14 tex.

Deep-read (.tex): MemGPT intro+method+conclusion; Let's Verify full body+discussion+
appendix; GenRM background+method+intro; LLM-as-Judge sec-llm-judge (biases) + sec-exp
(agreement). All four are LaTeX-grade reads.

## 4. Existing files cited (NOT rewritten, per wave-3 rule)

- `notes/by-paper/2304.03442-generative-agents.md` (memory stream, reflection-with-
  citations, retrieval = recency x importance x relevance). Memory thread anchor.
- `notes/by-paper/2312.03664-concordia.md` (component-based associative memory).
- `notes/by-paper/2605.06222-when-to-trust-imagination.md` (FFDC verifier = WAM-as-
  evaluator; the project's advisory framing). Verifier thread anchor.
- `notes/by-theme/benchmark-validity-and-evaluation.md` section 6 (LLM-judge
  unreliability: SOTOPIA, SOTOPIA-pi, Lifelong SOTOPIA over-rating, PersonaGym).
- `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md` (cited for advisory-WAM = FFDC).

## 5. Notes on availability and honesty

- All cornerstone numbers (78.2% PRM, 85% GPT-4-human agreement, 91.3% verbosity-attack
  failure, 73->93.4% GenRM GSM8K) are quoted from the LaTeX bodies above, not abstracts.
- Long-tail memory/verifier 2026 papers (D-MEM, FluxMem, SPARK, VPRM, JudgeBiasBench,
  etc.) are abstract-level (manifest rows only); claims attributed to their abstracts.
- Did not run any provider/LLM call or benchmark (synthesis only).
