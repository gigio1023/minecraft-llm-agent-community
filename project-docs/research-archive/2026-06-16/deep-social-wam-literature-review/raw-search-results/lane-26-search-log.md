# Lane 26 search log (AutoML, NAS, learned optimizers)

All on 2026-06-17. Hugging Face CLI first, then web (WebSearch/WebFetch on arXiv abstract pages). HF Hub papers feed only indexes a subset (mostly post-2020 + selectively), so older 2016-2018 seeds are not on HF; verified those via arXiv abstract pages. No paid LLM/provider calls.

## Seed verification (HF papers info)

- `hf papers info 2003.03384` -> verified AutoML-Zero (Real, Liang, So, Le; published 2020-03-06). OK.
- `hf papers info 1707.07012` -> verified NASNet "Learning Transferable Architectures for Scalable Image Recognition" (Zoph, Vasudevan, Shlens, Le; 2017-07). OK.
- `hf papers info 1806.09055` -> verified DARTS (Liu, Simonyan, Yang; 2018-06). OK.
- `hf papers info 1802.03268` -> "not found on the Hub" (older paper, not in HF feed). Verified via web instead.
- `hf papers info 1808.05377` -> "not found on the Hub." Verified via web.
- `hf papers info 1606.04474` -> "not found on the Hub." Verified via web.

## Seed verification (WebFetch on arXiv abstract pages)

- WebFetch arxiv.org/abs/1802.03268 -> ENAS "Efficient Neural Architecture Search via Parameter Sharing" (Pham, Guan, Zoph, Le, Dean; 2018). OK.
- WebFetch arxiv.org/abs/1808.05377 -> "Neural Architecture Search: A Survey" (Elsken, Metzen, Hutter; 2018), 3-axis taxonomy. OK.
- WebFetch arxiv.org/abs/1606.04474 -> "Learning to learn by gradient descent by gradient descent" (Andrychowicz et al; 2016). OK.
- WebFetch arxiv.org/abs/2211.09760 -> VeLO (Metz et al; 2022). OK.
- WebFetch arxiv.org/abs/1603.06560 -> Hyperband (Li, Jamieson, DeSalvo, Rostamizadeh, Talwalkar; 2016). OK.
- WebFetch arxiv.org/abs/1807.01774 -> BOHB (Falkner, Klein, Hutter; 2018). OK.

## Discovery (web) of additional cornerstones / breadth

- WebSearch "learned loss function discovery meta-learning evolution AutoML survey" -> surfaced GLO (1905.11528) and loss-function-discovery line. Rationale: loss/optimizer/algorithm discovery beyond architecture is the "machine improves the learning algorithm" tail.
- WebSearch "LLM-driven neural architecture search large language models AutoML GPT" -> surfaced AutoML-in-age-of-LLMs survey (2306.08107), GENIUS, LLMatic, GPT-NAS, EvoPrompting. Rationale: the bridge from classical AutoML to the autoresearch/coding-agent concept (wave-5 framing).
- WebFetch arxiv.org/abs/2306.08107 -> verified AutoML-in-age-of-LLMs survey (Tornede et al; TMLR 2023/2024). Chosen as the named lineage bridge to autoresearch.
- WebFetch arxiv.org/abs/1908.06756 -> WRONG (this is BOAH, a multi-fidelity BO tool suite, not Once-for-All). Corrected below.
- WebFetch arxiv.org/abs/1908.09791 -> verified Once-for-All (Cai, Gan, Wang, Zhang, Han; ICLR 2020). The correct OFA id is 1908.09791, not 1908.06756.
- WebFetch arxiv.org/abs/1905.11528 -> verified GLO (Gonzalez, Miikkulainen; 2019); discovers loss functions de novo (Baikal loss) via tree recombination + CMA-ES.
- WebSearch "learned optimizers generalization limits cost" -> surfaced muLO (2406.00153). Rationale: explicit, recent evidence on learned-optimizer meta-generalization limits (the honest bound).
- WebFetch arxiv.org/abs/2406.00153 -> verified muLO (Therien et al; NeurIPS 2024). Learned optimizers "struggle to optimize unseen tasks, especially when training networks wider than those seen during meta-training"; muP parametrization partially fixes it.

## Corrections to seeds

- Once-for-All: lane brief listed it as a verify-then-add candidate without an id. Correct id is 1908.09791 (my first guess 1908.06756 was BOAH, a different Hutter-group paper). Logged Once-for-All at the correct id, abstract-level.
- GLO authors: confirmed Santiago Gonzalez and Risto Miikkulainen (the WebFetch excerpt initially omitted authors; confirmed by a follow-up WebSearch).

## LaTeX fetched (bash scripts/fetch_arxiv_latex.sh)

- 2003.03384 automl-zero -> tarball_extracted, 8 tex files.
- 1806.09055 darts -> tarball_extracted, 2 tex files.
- 1606.04474 learn-to-learn-gd -> tarball_extracted, 9 tex files (uses includes/).
- 1707.07012 nasnet -> tarball_extracted, 8 tex files.
- 1808.05377 nas-survey -> tarball_extracted, 1 tex file.
- 2211.09760 velo -> tarball_extracted, 9 tex files.
- 2306.08107 automl-llm-survey -> tarball_extracted, 3 tex files.
- 1802.03268 enas -> tarball_extracted, 12 tex files.

8 LaTeX deep-read. 5 breadth abstract-only (Hyperband 1603.06560, BOHB 1807.01774, Once-for-All 1908.09791, GLO 1905.11528, muLO 2406.00153).
