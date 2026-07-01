# Lane 22 (H5) search log: self-improvement from verifiable rewards, self-play, self-refinement

All dates 2026-06-17. Tool: Hugging Face CLI (`hf papers search` / `hf papers read`) first,
then WebSearch for ids that did not surface in HF. Discovery channel order follows the shared
contract (HF primary, web secondary). Each entry: command, rationale, outcome.

## Seed id verification (HF papers search, grep for id+title)

- `hf papers search "Self-Refine iterative refinement self-feedback" --limit 6`
  - rationale: verify Self-Refine seed 2303.17651.
  - outcome: confirmed 2303.17651 "Self-Refine: Iterative Refinement with Self-Feedback".
- `hf papers search "Reflexion verbal reinforcement learning language agents" --limit 6`
  - confirmed 2303.11366 "Reflexion: Language Agents with Verbal Reinforcement Learning".
- `hf papers search "STaR self-taught reasoner bootstrapping reasoning" --limit 6`
  - confirmed 2203.14465 "STaR: Bootstrapping Reasoning With Reasoning". Also surfaced
    Quiet-STaR (2403.09629), RL-STaR (2410.23912) as adjacent (not pursued, breadth only).
- `hf papers search "Self-Rewarding Language Models" --limit 6`
  - confirmed 2401.10020. Adjacent: Meta-Rewarding (2407.19594), Process-based Self-Rewarding
    (2503.03746), CREAM (2410.12735, logged as caution).
- `hf papers search "DeepSeek-R1 reasoning reinforcement learning" --limit 6`
  - confirmed 2501.12948 "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL".
- `hf papers search "Tulu 3 open post-training RLVR" --limit 6`
  - confirmed 2411.15124 "TULU 3: Pushing Frontiers in Open Language Model Post-Training".
- `hf papers search "Absolute Zero self-play reasoning zero data" --limit 6`
  - confirmed 2505.03335. Adjacent self-play: SPIRAL (2506.24119), Vision-Zero (2509.25541).
- `hf papers search "Self-Play Fine-Tuning SPIN" --limit 6`
  - confirmed 2401.01335 (SPIN). Also surfaced SCoRe (2409.12917) -> logged as caution.
- `hf papers search "self-play adversarial language game" --limit 6`
  - confirmed 2404.10642 (SPAG). Adjacent: SPC (2504.19162), Language Self-Play (2509.07414).

## Verify-then-add + cautions (HF papers search)

- `hf papers search "V-STaR verifiers self-taught reasoners" --limit 6`
  - confirmed 2402.06457 "V-STaR: Training Verifiers for Self-Taught Reasoners".
- `hf papers search "RISE recursive introspection self-improve" --limit 6`
  - confirmed 2407.18219 "Recursive Introspection: Teaching Language Model Agents How to
    Self-Improve".
- `hf papers search "self-improvement language models sharpening limits" --limit 8`
  - confirmed 2412.01951 "Self-Improvement in Language Models: The Sharpening Mechanism";
    also Multiagent Finetuning (2501.05707), Mind the Gap (2412.02674, already in wave-3),
    survey 2603.25681.
- `hf papers search "large language models cannot self-correct reasoning yet" --limit 6`
  - confirmed 2310.01798 (Huang et al.); also 2404.17140 "Small Language Models Need Strong
    Verifiers to Self-Correct Reasoning".
- `hf papers search "spurious rewards rethinking RLVR" --limit 6`
  - confirmed 2506.10947 "Spurious Rewards: Rethinking Training Signals in RLVR"; also
    2509.21882 "Hidden Costs and Measurement Gaps of RLVR".
- `hf papers search "reinforcement learning verifiable rewards" --limit 12`
  - surfaced 2506.14245 "RLVR Implicitly Incentivizes Correct Reasoning in Base LLMs"
    (CoT-Pass@K), published 2025-06-17, 45 upvotes. Logged.

## Minecraft bridge + open-ended verification (HF papers search)

- `hf papers search "open-ended reinforcement learning minecraft verifiable reward agent" --limit 8`
  - surfaced 2312.09238 "Auto MC-Reward: Automated Dense Reward Design with LLMs for
    Minecraft" (LLM writes+self-critiques a dense reward, agent trains against env); and
    2511.02463 "Auditable-choice reframing unlocks RL-based verification for open-ended
    tasks". Both logged as direct ties to the repo's setting.
- `hf papers read 2312.09238` (abstract+figure): confirmed LLM Reward Designer + LLM Reward
  Critic loop over a Minecraft RL agent; env provides observation, reward function is the
  artifact being self-improved.
- `hf papers read 2505.21444` (abstract+intro): confirmed the collapse finding (majority-vote
  self-reward -> reward hacking -> collapse).
- `hf papers read 2511.02463` (abstract): Baidu/Nankai, open-ended RL verification via
  auditable-choice reframing.

## Web verification (id not in HF results)

- WebSearch: `Shumailov "The Curse of Recursion" arXiv 2305.17493 model collapse training on
  generated data`
  - rationale: the canonical model-collapse paper did not surface in HF papers search.
  - outcome: confirmed arXiv 2305.17493 (Shumailov et al.; Nature 2024 revised version,
    "Model Collapse"). Logged as the model-collapse anchor.

## Notes / corrections

- No wrong seed ids: all 9 brief seeds (2303.17651, 2303.11366, 2203.14465, 2401.10020,
  2501.12948, 2411.15124, 2505.03335, 2401.01335, 2404.10642) verified exactly as given.
- Manifest fix: the CoT-Pass@K entry initially had `id` 2406.14245 (typo) corrected to
  2506.14245 to match `arxiv_id`.
- LaTeX downloaded (8 cornerstones, via `bash scripts/fetch_arxiv_latex.sh`): 2303.11366,
  2203.14465, 2401.10020, 2505.03335, 2501.12948, 2303.17651, 2402.06457, 2505.21444. All
  extracted as tarballs with tex files. No PDFs needed.
- "Let's Verify Step by Step" (2305.20050) is already noted in wave-3; cited, not re-fetched
  or re-noted, per the brief.
- Politeness: HF searches in small batches, web used only for the one missing id.
