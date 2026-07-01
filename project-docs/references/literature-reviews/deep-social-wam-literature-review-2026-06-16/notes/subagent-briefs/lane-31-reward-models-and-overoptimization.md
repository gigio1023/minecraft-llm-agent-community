# Lane 31 brief: reward models, verifiers, and reward over-optimization

## Lane name

Reward models, verifiers, and reward over-optimization (wave 6, the success-signal-failure
lane). Owned theme: `notes/by-theme/research-area-reward-models-and-overoptimization.md`.

## Sources reviewed (count + list)

17 sources logged in `raw-search-results/lane-31-manifest.jsonl`. 8 deep-read in LaTeX (by-paper
note each); 9 abstract-level breadth. 0 PDF-only.

Deep-read (LaTeX, one by-paper note each):
- 2210.10760 Scaling Laws for Reward Model Overoptimization (Gao et al.) - the cornerstone
- 2209.13085 Defining and Characterizing Reward Hacking (Skalse et al.) - formal taxonomy
- 1803.04585 Categorizing Variants of Goodhart's Law (Manheim, Garrabrant) - the four variants
- 2201.03544 The Effects of Reward Misspecification (Pan, Bhatia, Steinhardt) - phase transitions
- 2312.08935 Math-Shepherd (Wang et al.) - PRM vs ORM, automatic process labels
- 2403.13787 RewardBench (Lambert et al.) - reward-model evaluation
- 2503.11751 reWordBench (Wu et al.) - RM robustness, invariance hardening (most repo-relevant)
- 2507.08794 One Token to Fool LLM-as-a-Judge (Zhao et al.) - judge-as-reward fragility

Abstract-level breadth (verified ids, manifest only): 2310.09144 Goodhart's Law in RL,
2310.02743 Reward Model Ensembles Help Mitigate Overoptimization, 2409.13156 RRM (robust RM
training), 2504.06141 Adversarial Training of Reward Models, 2507.06419 Reward-Guided Adversarial
Failure Mode Discovery, 2506.14175 GRAM (generative foundation RM), 2506.01937 RewardBench 2,
2502.10325 AgentPRM (process rewards for agents).

Note: two deep-read seeds (1803.04585, 2201.03544) are NOT in the Hugging Face papers index;
both verified to exist as valid arXiv papers (2201.03544 = ICLR 2022) directly on arxiv.org,
LaTeX fetched and read. Logged with that caveat, not fabricated, not dropped.

## Strongest findings (source-backed)

1. **Optimizing a LEARNED reward proxy predictably destroys the true objective, and the
   severity scales smoothly with model size.** Gao 2210.10760 measures the gold score as a
   policy is optimized against a proxy RM: it rises then falls, best-of-n as
   `R = d(alpha - beta d)` and RL as `R = d(alpha - beta log d)` with `d = sqrt(KL)`, and the
   coefficients scale ~logarithmically with proxy-RM parameters. A KL penalty does NOT move the
   gold-vs-KL frontier (it only acts like early stopping). This is the quantitative case that a
   learned reward model is the more hackable choice: the repo's deterministic verifier is the
   "gold" side of this experiment, with no proxy-gold gap to open.

2. **Unhackability is essentially impossible for a general proxy but recoverable on a
   restricted behavior set.** Skalse 2209.13085 proves that over ALL stochastic policies, two
   reward functions are unhackable only if one is constant; restricting to deterministic or
   finite policy sets makes non-trivial unhackable pairs exist, and "narrowing" a reward by
   dropping terms usually makes it MORE hackable. This is the formal justification for the
   repo's hardening-by-restriction (typed action surface, gates) rather than trying to write a
   perfect reward, and a warning against simplifying a social score by omitting terms.

3. **A verifier is made trustworthy by INVARIANCE and DIFFERENTIAL hardening, and invariance
   training generalizes.** reWordBench 2503.11751 shows state-of-the-art RMs collapse below
   random under meaning-preserving transforms (the no-op "Append Other Code" shortcut drops
   accuracy from 0.96 to as low as 0.13 to 0.15), and that training the RM to assign similar
   scores to paraphrases (invariance) generalizes to robustness against 27 other distinct
   transforms (halves Chat Hard degradation; robust RM wins up to 59% in alignment). This is the
   operational recipe for the directions-report ask "harden the verifier against instance-only
   shortcuts": a no-op or meaning-preserving rewrite must not change the verdict, and injecting
   a real defect must.

## Weak or uncertain claims (flagged)

- All numbers are SELF-REPORTED by the authors; none re-run here (contract forbids it). Several
  release artifacts (Math-Shepherd, RewardBench, reWordBench, One-Token Master-RM) so are
  reproducible in principle; not reproduced in this environment.
- Pan 2201.03544 phase-transition magnitudes are shown via plots; no single "true reward drops
  by X%" figure is stated in the source (recorded as such, not invented).
- Math-Shepherd 2312.08935 had no clearly stated code/data release link inside the paper body
  per the extraction (HF artifacts exist under peiyi9979/*), so its reproducibility is
  artifact-partial, numbers self-reported.
- The hardening recipes (invariance, causal, adversarial) are demonstrated for TEXT reward
  models; whether they transfer to embodied social transitions, where "equivalent transition"
  must be defined as "same typed world delta", is unverified and is itself a research question.
- One-Token 2507.08794 and the Master-RM fix bound KNOWN attack tokens; "near-zero FPR on all
  tested master keys" is not "robust to all attacks". Recorded as a patch on a learned scorer,
  not a guarantee.

## Implications for this repo (mechanical vs contribution)

Mechanical (engineering the repo can borrow):
- A verifier-hardening test suite: invariance tests (meaning-preserving rewrite keeps verdict),
  no-op resistance (padding/dead-step/reorder keeps verdict), differential tests (injected
  defect flips verdict), causal disentangling (verdict keys on the world property, not a surface
  artifact), adversarial probing (search for pass-without-work behaviors). Sources: reWordBench
  2503.11751, RewardBench 2403.13787, RRM 2409.13156, Adversarial-RM-Training 2504.06141.
- Per-transition (process-style) scoring rather than per-episode, for precise credit assignment
  against laundering. Sources: Let's-Verify (lane 17) 2305.20050, Math-Shepherd 2312.08935.
- If any learned signal is ever introduced, an overoptimization monitor: track the gap between
  the learned score and the deterministic verifier, and the actor's behavior-distribution
  distance from a trusted reference; widening gap or sudden shift = hacking. Sources: Gao
  2210.10760, Polynomaly 2201.03544.

Contribution boundary (what the repo must NOT claim or do):
- A learned reward model or LLM-as-judge is the MORE HACKABLE choice and must not become the
  primary success signal; the deterministic verifier stays the scorer where a check exists.
  Sources: Gao 2210.10760, One-Token 2507.08794, Skalse 2209.13085.
- None of these methods is a contribution to copy; reward-model evaluation/robustness is
  evidence tooling (support). The repo must not reframe its work as "RewardBench/overoptimization
  for Minecraft".
- Do not assume the hardening recipe transfers to the social layer without first defining a
  verifier-grounded "equivalent transition"; the social score is the most under-specified and
  thus the most gameable.

## Recommended next questions

1. Define "equivalent transition" operationally for the repo (same typed world delta across
   physical/material/social ledgers), so invariance/differential verifier tests can be written
   and run on the repo's own verifier-labeled transitions.
2. Build a small verifier-hardening probe set: for a sample of passing transitions, auto-generate
   (a) meaning-preserving rewrites, (b) no-op padded variants, (c) defect-injected variants, and
   measure verdict stability/flip rates. This is the repo-native analog of reWordBench, and the
   empty cell no surveyed system fills.
3. Decide whether any social-layer signal is learned at all; if so, specify it as advisory,
   measured against verified world artifacts, hardened on shortcut negatives, with an
   overoptimization monitor, never as the primary score.

## One-line tie to the thesis

The deterministic runtime verifier is the repo's defense against the entire overoptimization and
reward-hacking failure surface this lane catalogues; a learned reward model would re-add the
proxy-side Goodhart variants (Gao, Skalse), and the verifier should still be hardened by
invariance and differential tests (reWordBench, RewardBench) so that passing it entails
correctness and not an instance-only shortcut.
