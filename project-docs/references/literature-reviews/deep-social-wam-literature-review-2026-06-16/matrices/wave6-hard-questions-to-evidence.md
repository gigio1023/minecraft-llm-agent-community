# Matrix: directions-report hard questions mapped to wave-6 evidence

Wave-6. One row per hard question from reports/research-directions-for-the-repo.md section 7. Columns:
the wave-6 lane that addresses it, the strongest source(s), the engineering recipe, and what is still an
empty cell the repo must build. ASCII only. Numbers are as-stated by sources.

## A. Hard question to evidence

| Hard question | Lane | Strongest source(s) | Recipe | Still empty (repo builds) |
|---|---|---|---|---|
| 1. Reset granularity (comparable scenario + ledger reset) | 35 | ProcTHOR 2206.06994 (10K verified scenes/hour, reject-and-resample), PCGRL 2001.09212 (solver-gated) | seed-spec + fixed RNG + replayable artifact + per-layer reject-and-resample against the verifier; ledger reset = deterministic restore of typed Material state | a deterministic validity gate ABOVE the physical layer; the social/obligation reset |
| 2. Verifier hardening | 31 | reWordBench 2503.11751 (no-op drops RM acc 0.96 to 0.13; invariance training generalizes to 27 transforms), RewardBench 2403.13787 | invariance + no-op + differential + causal + adversarial probe suite on sampled passing transitions | "equivalent transition" defined as same typed world delta, so the suite runs on social deltas |
| 3. Progress laundering blocked | 31, 32, 33, 30 | Gao 2210.10760, RAP 2305.14992 (proposer=scorer), WebDreamer 2411.06559, writable-scorer gamed 59x 2603.19453 | verifier scores, never actor/proposer; isolate verifier logic; two-axis eval | a per-step verifier-grounded scorer for SOCIAL transitions |
| 4. Sharpening ceiling (calibration not capability) | 30 | calibration of NNs 1706.04599 (accuracy does not buy calibration), emergent-mirage 2304.15004 (threshold metric fakes a jump) | measure proper score + ECE of the predictor confidence vs verified delta; report calibration, not capability | ECE/proper-score machinery applied to verified social-material deltas |
| 5. Multi-actor dependency | 33 | Formal Contracts 2208.10469, Institutional AI 2601.11369 | social-material variables (claims, obligations, commons) need >=2 actors and (in the literature) enforcement; repo is observe-only | a multi-actor substrate; emergent norms without hardcoding |
| 6. Cost posture (structured cheap, pixels not) | 32, 35 | WALL-E 2410.07484 (gradient-free rule patches, near-$0), ProcTHOR 2206.06994 (10K scenes/hour), LiveCodeBench 2403.07974 (time-gating ~free) | keep prediction and correction structured and gradient-free; time-gating costs almost nothing | a structured-state social predictor measured for cost on the repo's own traces |
| 7. Freshness | 35 | LiveCodeBench 2403.07974 (score post-cutoff only; before/after drop detects contamination), decontaminator 2311.04850, SOTOPIA-pi 2403.08715 | time-gate by authoring date + private holdout + verifier-labeled synthesis + admission-time paraphrase check | cheap authoring of fresh SOCIAL scenarios labeled by the verifier, not an LLM judge |

## B. The one rule every lane re-derived

| Mode | Verdict | Wave-6 sources |
|---|---|---|
| Deterministic external verifier scores; predictor/actor/generator only propose | ADMISSIBLE | Gao (no proxy gap), reWordBench (hardenable), WebDreamer (external score), PEAM (verifier-gated), ProcTHOR (deterministic gate) |
| A learned reward model, an LLM judge, or the actor scores its own success | INADMISSIBLE (over-optimizes, hacks, or collapses) | Gao 2210.10760, RAP self-score, writable-scorer 59x 2603.19453, SOTOPIA-pi GPT-4 5.71 vs human 4.29, QDAIF judge hacking |

## C. Cross-reference

- Wave-6 capstone: reports/building-and-measuring-the-loop.md
- Directions report (the questions): reports/research-directions-for-the-repo.md
- Wave-4 loop-to-repo mapping: matrices/autoresearch-loop-mapping.md
- Wave-5 by-domain matrix: matrices/self-improvement-by-domain.md
