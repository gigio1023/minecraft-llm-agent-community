# Lane 20 (H3): LLM-driven reward, code, and skill generation for embodied agents

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
The mechanism by which an autoresearch loop proposes an improvement: an LLM writes or edits a reward
function, a skill, or policy code, and the change is then scored by rollout. Central question: can
an LLM author the improvement code well enough that environment feedback can select good edits?
Cover reward-code search, skill libraries, intrinsic-reward synthesis, and the Minecraft instances.

## Seeds (verify ids before fetching)
- Eureka, Human-Level Reward Design via Coding LLMs: 2310.12931 (evolutionary search over reward
  code). DrEureka (verify id; sim-to-real reward + domain randomization).
- CARD, LLM-Driven Reward Design via Dynamic Feedback: 2410.14660 (no human in the loop).
- ONI, Online Intrinsic Rewards from LLM Feedback: 2410.23022 (NetHack; learns policy + intrinsic
  reward together).
- ToolRL, Reward is All Tool Learning Needs: 2504.13958.
- Minecraft instances: Auto-MC-Reward (verify id ~2312.09238). Cite Voyager's self-extending skill
  library (wave-1 minecraft themes) for the skill-loop idea; EXTEND, do not re-survey Voyager.
- Verify-then-add: Text2Reward, Language to Rewards (L2R), GenSim, RoboGen, Eurekaverse.

## Owned deliverables
- Theme: `notes/by-theme/research-area-llm-reward-and-code-generation.md`.
- by-paper notes (at least Eureka, CARD, ONI, one Minecraft instance).
- `raw-search-results/lane-20-manifest.jsonl`, `raw-search-results/lane-20-search-log.md`,
  `notes/subagent-briefs/lane-20-llm-reward-and-code-generation.md`.

## Deconflict
- H1 owns the loop; H4 owns task/curriculum generation; H5 owns the verifiable-reward theory. You
  own the PROPOSE-A-CODE-CHANGE mechanism (reward/skill/policy code).
- Cite wave-1 `minecraft-vla-and-visual-policy` and wave-3 `research-area-memory-and-verifiers`.

## WAM tie + thesis
In this repo the "improvement code" an agent could write is: an Action Card or
`author_mineflayer_action` skill (already a repo path, runtime-gated by schema, permission,
verifier, trial), a prompt, or, if a WAM is adopted, the WAM's consequence-prediction rules. Map
Eureka-style reward-code search onto "search over advisory-WAM predictors scored by
verifier-agreement". Land the key bound: an open-ended social world has no dense numeric reward, so
reward-code search needs a verifier-derived score, not a hand-tuned metric. Keep advisory: generated
code is proposed and runtime-gated, never self-promoted.
