# Lane 22 (H5) brief: self-improvement from verifiable rewards, self-play, self-refinement

## Lane name
Self-improvement from verifiable rewards, self-play, and self-refinement (wave-4, the
theoretical heart of the autoresearch thesis). Owned theme:
`notes/by-theme/research-area-self-improvement-from-verifiable-rewards.md`.

## Sources reviewed (count + list)

24 sources logged in `raw-search-results/lane-22-manifest.jsonl`. 8 deep-read in LaTeX
(by-paper notes written); 16 abstract-level breadth. 0 PDF-only.

Deep-read (LaTeX), one by-paper note each:
- 2501.12948 DeepSeek-R1 (RLVR, rule-based verifier)
- 2505.03335 Absolute Zero (self-play + code-executor verifier, zero data)
- 2505.21444 Can Large Reasoning Models Self-Train? (the collapse caution)
- 2203.14465 STaR (self-generated data, ground-truth filter)
- 2303.11366 Reflexion (verbal RL, pluggable evaluator)
- 2401.10020 Self-Rewarding LMs (model as its own judge)
- 2402.06457 V-STaR (verify-then-add, train a verifier on correct AND incorrect)
- 2303.17651 Self-Refine (pure self-evaluated refinement)

Abstract-level breadth (verified ids, manifest only): 2411.15124 Tulu 3 (RLVR + IFEval
overoptimization), 2401.01335 SPIN, 2404.10642 SPAG, 2310.01798 LLMs-cannot-self-correct,
2409.12917 SCoRe, 2407.18219 RISE, 2412.01951 sharpening-mechanism, 2305.17493 curse-of-
recursion (model collapse), 2506.10947 spurious-rewards-RLVR, 2509.21882 hidden-costs-RLVR,
2506.14245 RLVR-incentivizes-correct-reasoning, 2410.12735 CREAM, 2312.09238 Auto MC-Reward
(Minecraft), 2511.02463 auditable-choice open-ended verification, 2404.17140 small-LMs-need-
strong-verifiers, 2603.25681 self-improvement survey.

## Strongest findings (source-backed)

1. **The bright line is empirically real, not rhetorical.** Can-Self-Train (2505.21444)
   shows the SAME online-RL loop is stable under ground-truth verification and collapses
   catastrophically under a majority-vote SELF-reward: initial gains comparable to ground-
   truth RL, then sudden complete collapse on all 4 base models, with the self-reward
   objective maximized while true accuracy crashes, the model degenerating to a fixed template
   answer (e.g. \boxed{1}) regardless of input. Raising the KL penalty does not prevent it;
   only a fixed (external) teacher or injected noise delays it. This is progress laundering as
   a weights-level learning dynamic.
2. **Frontier systems deliberately refuse self/learned reward signals because they hack.**
   DeepSeek-R1 (2501.12948) "abstain[s] from applying neural reward models ... susceptible to
   reward hacking" and uses rule-based verifiers (answer-match, compiler+tests); it observed
   actual hacking with its neural helpful-reward model. Absolute Zero (2505.03335) removes ALL
   human data via self-play yet keeps a CODE-EXECUTOR verifier, explicitly chosen over a
   learned reward model "prone to hacking." So the admissible recipe (verifier-grounded, no
   human labels) is exactly what the strongest results use.
3. **STaR/V-STaR show the repo already has the substrate, and that failures are signal.**
   STaR (2203.14465) is formally a policy gradient with a verifiable indicator reward
   1[y_hat=y]; "self-training with a verifier filter" and "RLVR" are the same idea. The repo's
   runtime emits verifier-scored (state, action, next-state) transitions for free, which is
   that substrate at near-zero cost. V-STaR (2402.06457) shows the verifier-FAILED transitions
   STaR discards are exactly what trains a predictor to recognize failure, so an advisory WAM
   should be conditioned on passes AND failures, not successes only.

## Weak or uncertain claims (what I could not verify)

- 16 breadth sources are abstract-level only; their internal numbers (e.g. SPAG's exact
  benchmark deltas, RISE's improvement magnitude, the sharpening-mechanism theorems) are not
  source-verified from LaTeX. Their high-level claims (self-play grounded by a game outcome;
  intrinsic self-correction degrades reasoning) were read directly from HF abstracts.
- ENPIRE's ~99% pass@8 result remains page-stated only (no arXiv/PDF fetchable), per the
  existing anchor note; I cite it as project-page-level, not source-verified.
- Whether a STaR/RLVR-style loop actually improves an ADVISORY social-material WAM on THIS
  repo is untested (literature synthesis only, no runtime, no benchmark run per contract).
  The analogy to math/code RLVR is strong at the Physical/Material layers and unproven at
  Social/Institutional.
- 2603.25681 (self-improvement survey, 2026) and 2509.21882 (RLVR position paper) are recent;
  I logged them from search results without deep-reading, so their framing is summarized, not
  verified line-by-line.

## Implications for this repo (mechanically useful vs research contribution)

- **Mechanically useful (engineering to borrow)**: a STaR/V-STaR/RLVR-shaped loop over the
  repo's verifier-labeled transitions, keeping passes AND failures (V-STaR); Absolute Zero's
  proposer-side learnability reward as a label-free curriculum-difficulty knob; Reflexion's
  Actor/Evaluator/Self-Reflection shape with the runtime verifier as the Evaluator and a
  verifier-grounded lesson written to actor-workspace memory; collapse detectors (rising
  self/proxy reward with falling verified outcome; rising KL from a reference) as guardrails.
  All advisory, no weight updates required, the loop proposes and the runtime scores.
- **Research contribution it is NOT**: none of these methods is a contribution to copy, and
  the signal/objective theory is SUPPORT for keeping the runtime verifier as the scorer, not
  the repo's research claim. The repo must not reframe its work as "RLVR/self-play for
  Minecraft." Verifiers, transitions, and logs are evidence infrastructure (support), per the
  shared contract.
- **The bright line for the repo**: self-improvement grounded by the runtime verifier is
  admissible; self-improvement scored by the actor's own CycleJudgment is progress laundering
  and inadmissible. Most transferable at Physical/Material (clean verifier label), advisory-
  only at Social, and not a closed loop at Institutional (contested success, costly resets).

## Recommended next questions

1. What is the smallest admissible loop on this repo? Likely: run the actor, keep verifier-
   PASSED and verifier-FAILED transitions, refine prompts/skills/advisory-WAM, re-run, gate
   every change on a verifier-measured improvement. Define the verifier-measured improvement
   metric before building the loop (Physical/Material first).
2. Auto MC-Reward (2312.09238) has an LLM design and self-critique a Minecraft reward function
   while the agent trains against the environment. Worth a deep-read for H1/H3 as a concrete
   "coding agent improves a Minecraft objective, env verifies" precedent on the exact platform.
3. For the social layers with no exact verifier, can the repo borrow the "auditable-choice
   reframing" idea (2511.02463) to convert some open-ended social outcomes into checkable
   choices, so a verifier exists, rather than falling back to a self-evaluated judge?
4. What collapse/guardrail instrumentation should the loop emit from day one (self-reward vs
   verified-outcome divergence, KL from a reference policy) given 2505.21444 and the
   spurious-reward results (2506.10947, 2509.21882)?
