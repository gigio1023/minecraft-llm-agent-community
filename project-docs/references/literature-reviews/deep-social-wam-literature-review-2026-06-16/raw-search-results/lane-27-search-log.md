# Lane 27 (I4) search log: meta-learning, recursive self-improvement, self-referential systems

All work 2026-06-17. Discovery: Hugging Face CLI (`hf papers ...`) first, then arXiv via WebFetch.
No paid LLM/provider/API calls. ASCII punctuation only.

## Seed verification (lane brief seeds)

- `hf papers info 1703.03400` -> VERIFIED MAML (Finn, Abbeel, Levine 2017). On HF.
- `hf papers info 1905.10985` -> NOT on HF index. Verified directly via `WebFetch https://arxiv.org/abs/1905.10985`: AI-GAs (Clune 2019), three pillars confirmed (architectures, learning algorithms, environments).
- `hf papers info 2004.05439` -> NOT on HF index. Verified via `WebFetch https://arxiv.org/abs/2004.05439`: Meta-Learning in Neural Networks: A Survey (Hospedales, Antoniou, Micaelli, Storkey 2020).
- `hf papers info 1611.02779` -> NOT on HF. Verified via WebFetch: RL^2 (Duan, Schulman, Chen, Bartlett, Sutskever, Abbeel 2016).
- `hf papers info 1611.05763` -> NOT on HF. Verified via WebFetch: Learning to reinforcement learn (Wang et al, DeepMind 2016).
- `hf papers info 2012.14905` -> NOT on HF (info), but APPEARS in search results. Verified via WebFetch: Meta Learning Backpropagation And Improving It / VSML (Kirsch & Schmidhuber, NeurIPS 2021).
- `hf papers info 2202.05780` -> VERIFIED on HF: A Modern Self-Referential Weight Matrix That Learns to Modify Itself (Irie, Schlag, Csordas, Schmidhuber 2022).
- `hf papers info 2310.02304` -> VERIFIED on HF: STOP (Zelikman, Lorch, Mackey, Kalai 2023). Owned by lane I2; cited not covered.
- Goedel machine seed ("Schmidhuber ~2003, find canonical"): resolved via `WebFetch https://arxiv.org/abs/cs/0309048` -> "Goedel Machines: Self-Referential Universal Problem Solvers Making Provably Optimal Self-Improvements" (Schmidhuber, v1 2003, canonical v5 Dec 2006). This is the canonical reference. No separate "real" id.

Correction logged: the brief's seed ids were all correct. The only adjustment is that AI-GAs, Hospedales, RL^2, and Learning-to-RL are not in the HF papers index (older / lower HF activity), so they were verified directly on arXiv.

## HF papers searches (landscape discovery)

- `hf papers search "recursive self-improvement" --limit 12` -> surfaced Goedel Agent (2410.04444), STOP (2310.02304), SRWM (2202.05780), Boundless Socratic Learning (2411.16905), SAHOO (2603.06333), Meta-Agent Challenge (2606.04455), LADDER (2503.00735), RISE (2407.18219), and several agent-design/coding-agent RSI items (AIRA 2605.15871, Connect-Four-AlphaZero 2604.25067).
- `hf papers search "meta-learning learning to learn" --limit 10` -> General-Purpose In-Context Learning by Meta-Learning Transformers (2212.04458, Kirsch), Bilevel Programming for HPO and Meta-Learning (1806.04910), plus narrow applications.
- `hf papers search "self-referential weight matrix self-modify" --limit 8` -> confirmed SRWM (2202.05780) as the head result; rest were LLM self-correction (different area).
- `hf papers search "AI-generating algorithms open-ended" --limit 8` -> POET (1901.01753), OMNI (2306.01711), OMNI-EPIC (2405.15568), Open-Endedness is Essential (2406.04268), Darwin Godel Machine (2505.22954). All owned by lane 21 / lane H1; cited not redone.
- `hf papers search "meta reinforcement learning survey" --limit 6` -> AutoRL survey (2201.03916), MAMBA meta-RL world model (2403.09859), Meta-World benchmark (1910.10897).
- `hf papers search "recursive self improvement limits feasibility" --limit 6` -> Mind the Gap (2412.02674, already in H1 sibling), Sharpening Mechanism (2412.01951), Utility-Learning Tension in Self-Modifying Agents (2510.04399), STOP (2310.02304), Socratic Learning (2411.16905).
- `hf papers info 2510.04399` -> abstract captured: five-axis self-modification decomposition + "utility-learning tension"; "when capacity can grow without limit, utility-rational self-changes can render learnable tasks unlearnable." Strong RSI bound; cite for lane I6.

## LaTeX fetches (deep-read cornerstones)

Via `bash scripts/fetch_arxiv_latex.sh <id> <slug>` (script sleeps 3s per network call; batched <=4 per shell call):
- `cs/0309048 goedel-machine` -> tarball_extracted, gm6.tex (2138 lines). Deep-read: abstract, Basic Idea (334-382), Global Optimality Theorem (972-1029), Limitations (418-447). NOTE: metadata JSON write failed because the `/` in id `cs/0309048` broke the metadata filename path; the LaTeX itself extracted correctly (papers/latex/cs/0309048/gm6.tex). Not blocking.
- `1905.10985 ai-gas` -> tarball_extracted, AI-GAs.tex (434 lines). Deep-read: abstract, Three Pillars (185-188), Pillar-3 (262-347), conclusion hedges (419).
- `1703.03400 maml` -> tarball_extracted, senstive.tex. Deep-read: abstract, problem set-up (131-173), MAML algorithm + meta-objective (200-235), RL instantiation (329-365).
- `2012.14905 kirsch-vsml` -> tarball_extracted, neurips_2021.tex. Read abstract.
- `2004.05439 hospedales-meta-survey` -> tarball_extracted, short_version_try.tex. Read definition + taxonomy axes (meta-representation/optimizer/objective), positioning vs TL/CL/MTL/AutoML, bilevel view.
- `2410.04444 goedel-agent` -> tarball_extracted, main.tex + sections/*.tex (16 tex). Deep-read: abstract, intro (43-100), Godel formalism (2-Godel.tex), Limitations (9-Limitations.tex). Key: proof-search replaced by LLM (2-Godel.tex:4); Yampolskiy self-understanding ceiling.
- `2411.16905 socratic-learning` -> tarball_extracted, main.tex. Deep-read: Three Necessary Conditions (100-143), Fundamental Limits (199-220).
- `2202.05780 irie-srwm` -> tarball_extracted, paper.tex. Deep-read: abstract, mechanism (152-247), self-modification experiments framing (326-440).

## Deconflict actions taken

- Did NOT re-survey the loop-as-system (ENPIRE/DGM/EvolveR/SAIL = lane H1), RLVR/self-play (lane H5), STOP (lane I2), or open-ended environment generation (POET/OMNI = lane 21). Cited each where this lane's theory connects.
- Anchored to ENPIRE (notes/by-paper/enpire.md, PDF-verified) without rewriting it.

## Counts

- Sources logged: 13 (manifest lines).
- LaTeX deep-read: 8 (cs/0309048, 1905.10985, 1703.03400, 2202.05780, 2012.14905, 2004.05439, 2410.04444, 2411.16905).
- PDF-only: 0.
- Abstract-only (breadth / cited-elsewhere): 5 (1611.02779, 1611.05763, 2510.04399, 2403.09859, 1910.10897).
