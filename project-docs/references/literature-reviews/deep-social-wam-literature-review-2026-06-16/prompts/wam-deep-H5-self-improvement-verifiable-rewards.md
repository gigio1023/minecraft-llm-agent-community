# Lane 22 (H5): Self-improvement from verifiable rewards, self-play, and self-refinement

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave4.md`. This brief layers scope on top.

## Area
The learning SIGNAL that drives an autoresearch loop: improving from a checkable reward (RLVR), from
self-generated data (STaR, self-rewarding), from iterative self-critique (Self-Refine, Reflexion),
or from self-play. Central question: when can a system improve from signals it generates or checks
itself, without human labels, and when does it instead collapse or reward-hack?

## Seeds (verify ids before fetching)
- Self-Refine: 2303.17651; Reflexion: 2303.11366 (verbal self-feedback loop with memory).
- STaR, Self-Taught Reasoner: 2203.14465; Self-Rewarding Language Models: 2401.10020.
- RLVR (reinforcement learning from verifiable rewards): cite DeepSeek-R1 2501.12948 and/or Tulu 3
  2411.15124. "Let's Verify Step by Step" is already noted in wave-3; cite it, do not re-note.
- Self-play: Absolute Zero 2505.03335 (self-play + verifier, zero external data); SPIN 2401.01335;
  SPAG, self-play adversarial language game 2404.10642.
- Verify-then-add: V-STaR, RISE, and any sourced "limits of self-improvement / model-collapse"
  caution.

## Owned deliverables
- Theme: `notes/by-theme/research-area-self-improvement-from-verifiable-rewards.md`.
- by-paper notes (at least Reflexion, STaR, Self-Rewarding LMs, Absolute Zero, one RLVR source).
- `raw-search-results/lane-22-manifest.jsonl`, `raw-search-results/lane-22-search-log.md`,
  `notes/subagent-briefs/lane-22-self-improvement-verifiable-rewards.md`.

## Deconflict
- EXTEND wave-3 `research-area-memory-and-verifiers` (it covered verifier and reward-model
  ARCHITECTURES and LLM-as-judge). You cover how a loop LEARNS from those signals (RLVR, self-play,
  self-refine). Cite it, do not re-survey verifier architectures.
- H1 owns loop engineering; H3 owns the code-gen mechanism. You own the signal and objective.

## WAM tie + thesis
This is the theoretical heart of the thesis. The repo's verifier is a verifiable reward; RLVR is the
principled name for "improve from verifier signal, no human labels." State clearly: self-refinement
WITHOUT an external check tends to plateau or drift (cite the cautions), which is exactly why the
repo's runtime verifier (not the actor's self-judgment) must be the scorer. Draw the bright line:
"self-improvement grounded by an external verifier" (admissible) vs "self-evaluated
self-improvement" (progress laundering, inadmissible).
