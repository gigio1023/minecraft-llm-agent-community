# Lane 29 search log (I6: self-improvement concept, surveys, and limits)

All searches run 2026-06-17. Tools: Hugging Face CLI (`hf papers ...`), WebSearch, WebFetch.
Lane focus: the field-level CONCEPT of self-improvement and its honest LIMITS map (what
compounds, what collapses, what only sharpens). Deconflict: cite H1 (loop architecture, lane
18), H5 (verifiable-reward signal/objective, lane 22), I4 (recursive-self-improvement theory)
rather than re-surveying them.

## Seed-id verification (corrections noted)

- `hf papers info 2305.17493` -> VERIFIED. Note: the HF/arXiv-v1 title is "Model Dementia:
  Generated Data Makes Models Forget"; the authors renamed it "The Curse of Recursion: Training
  on Generated Data Makes Models Forget" (the LaTeX title) and the Nature 2024 camera-ready is
  "AI Models Collapse When Trained on Recursively Generated Data." All three are the same paper.
  The term of art used in the paper is "model collapse" (LaTeX `\newcommand{\md}{model collapse}`).
- `hf papers info 2307.01850` -> VERIFIED. "Self-Consuming Generative Models Go MAD"
  (Alemohammad et al.). MAD = Model Autophagy Disorder. ICLR 2024.
- `hf papers info 2404.01413` -> VERIFIED. "Is Model Collapse Inevitable? Breaking the Curse of
  Recursion by Accumulating Real and Synthetic Data" (Gerstgrasser et al.). COLM 2024.
- `hf papers info 2412.01951` -> VERIFIED. "Self-Improvement in Language Models: The Sharpening
  Mechanism" (Huang et al.). ICLR 2025. (Seed brief listed it as the conceptual "sharpening"
  source; confirmed.)
- `2505.21444` (Can-Self-Train collapse) and `2508.07407` (self-evolving-agents survey): already
  deep-read by lane 22 (H5) and lane 18 (H1) respectively, with by-paper notes present
  (`notes/by-paper/2505.21444-can-lrm-self-train.md`,
  `notes/by-paper/2508.07407-self-evolving-agents-survey.md`). Cited, NOT re-fetched.

## HF papers searches (concept + surveys)

- `hf papers search "survey self-improving large language models"` -> surfaced 2510.02665
  (Self-Improvement in MLLMs survey, 21 upvotes), 2412.14352 (Inference-Time Self-Improvement
  survey), 2411.00750 (tail-narrowing plateau), 2501.05707 (multiagent finetuning diminishing
  returns). Rationale: find the field-level survey framing distinct from lane 18's.
- `hf papers search "self-evolving LLM agents survey lifelong"` -> surfaced 2507.21046 (Survey of
  Self-Evolving Agents: On Path to ASI, 85 upvotes), 2508.07407 (the lane-18 survey, 99 upvotes),
  2501.07278 (lifelong-learning roadmap), and several self-evolution method papers (CoMAS,
  AgentGym/AgentEvol, Meta-Team). Rationale: locate the ASI-framed survey to critique at the
  concept level. Chose 2507.21046 to deep-read (its title literally invokes ASI rhetoric -
  perfect target for the "RSI is rhetoric" bound; its what/when/how/where taxonomy is the field's
  organizing frame).
- `hf papers search "model collapse synthetic data degradation recursive training"` -> surfaced
  the seeds plus 2412.14689 (How to Synthesize Text Data without Model Collapse, token-editing
  fix, 53 upvotes), 2410.12954 (a critical Note arguing collapse "may be unavoidable" as a
  statistical phenomenon), 2402.07712 (Model Collapse Demystified: regression theory, the
  Dohmatob framework that 2404.01413 extends), 2502.15654 (MGT-detection prevents collapse),
  2402.07087 (self-correcting self-consuming loops), 2603.11784 (learning-theoretic replay view).
  Rationale: bound the model-collapse cluster; confirm independent confirmations and the
  "mitigations" line.
- `hf papers search "misevolution self-evolving agents safety risks"` -> surfaced 2509.26354
  (misevolution, the primary source the 2507.21046 survey cites for emergent risks, 18 upvotes),
  2602.09877 (Moltbook self-evolution trilemma, 197 upvotes), 2509.26100 (SafeEvalAgent:
  self-evolving safety eval, GPT-5 safety drops under harder iterations). Rationale: find the
  concrete demonstrated FAILURE-mode evidence for the limits map.
- `hf papers search "self-improvement plateau diminishing returns iterations limit"` -> surfaced
  2412.02674 (Mind the Gap: generation-verification gap formalization), 2411.00750 (tail
  narrowing), 2412.17256 (B-STaR: exploration deteriorates over iterations), 2601.06794 (stale
  critic feedback in on-policy RL), 2603.06009 (PPO plateaus from loss-proxy noise). Rationale:
  collect the "what only sharpens / plateaus" mechanism papers.

## Web searches (intelligence-explosion critique)

- WebSearch "recursive self-improvement AI limits critique intelligence explosion empirical
  evidence 2025" -> surfaced arXiv 2507.23181 (Will Compute Bottlenecks Prevent an Intelligence
  Explosion?, Whitfill & Wu, Epoch-style production-function analysis) and 2512.04119 (Humanity
  in the Age of AI: Reassessing 2025's Existential-Risk Narratives, El Louadi), plus DeepMind
  AlphaEvolve as a demonstrated-but-narrow positive (1% LLM-training-time reduction). Rationale:
  source the "RSI-to-superintelligence is rhetoric not evidence" bound with citable papers, not
  blog posts.
- WebFetch arxiv.org/abs/2507.23181 -> VERIFIED title/authors/abstract. Mixed result: baseline
  model says compute and labor are substitutes (RSI-permissive); "frontier experiments" model
  says they are complements (compute bottleneck limits software-only RSI). Does not resolve a
  timescale.
- WebFetch arxiv.org/abs/2512.04119 -> VERIFIED. Direct quote captured: "Sixty years after Good's
  speculation, none of the required phenomena (sustained recursive self-improvement, autonomous
  strategic awareness, or intractable lethal misalignment) have been observed." Characterizes
  existential-risk claims as "a speculative hypothesis amplified by a speculative financial bubble
  rather than a demonstrated probability." This is the field-honesty anchor for the lane.

## LaTeX fetched (deep-read)

```
bash scripts/fetch_arxiv_latex.sh 2305.17493 model-collapse-curse-of-recursion   # 9 tex
bash scripts/fetch_arxiv_latex.sh 2307.01850 self-consuming-models-mad           # 4 tex
bash scripts/fetch_arxiv_latex.sh 2404.01413 accumulating-data-breaks-collapse   # 7 tex
bash scripts/fetch_arxiv_latex.sh 2412.01951 sharpening-mechanism                # 28 tex
bash scripts/fetch_arxiv_latex.sh 2507.21046 self-evolving-agents-asi-survey     # 14 tex (sections/ intact)
bash scripts/fetch_arxiv_latex.sh 2602.09877 self-evolution-trilemma-moltbook    # 2 tex
bash scripts/fetch_arxiv_latex.sh 2509.26354 misevolution-emergent-risks         # 2 tex
```

## Could not verify / open

- 2507.23181 and 2512.04119 are read at abstract/WebFetch level only (no LaTeX fetched, both are
  argumentative/economic rather than empirical-method papers); marked abstract in the manifest.
- AlphaEvolve (DeepMind) appears only via the web summary as a demonstrated narrow positive
  (algorithmic discovery cutting LLM training time ~1%); not separately fetched here (lane H2 /
  ai-scientist territory). Cited as interpretation, flagged.
- Exact author lists for some survey/abstract-only entries (2510.02665, 2412.14352) are "multi
  author survey" in the manifest; not individually verified.
