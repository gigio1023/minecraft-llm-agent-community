# Lane 17 (G6) brief: long-horizon agent memory, and learned verifiers / reward models

## Lane name

Research-area mapping for two sub-fields the query and project lean on: (A) long-horizon
agent memory, (B) learned verifiers / reward / judge models. Half B is the academic footing
for the project's ADVISORY WAM = verifier role.

## Sources reviewed (count + list)

23 sources logged in `raw-search-results/lane-17-manifest.jsonl`. 4 deep-read (LaTeX) as
cornerstones; the rest abstract-level (manifest rows). Cornerstones each have a by-paper
note:

- 2310.08560 MemGPT (memory, LaTeX) -> `notes/by-paper/2310.08560-memgpt.md`
- 2305.20050 Let's Verify Step by Step (process reward, LaTeX) ->
  `notes/by-paper/2305.20050-lets-verify-step-by-step.md`
- 2408.15240 Generative Verifiers / GenRM (LaTeX) ->
  `notes/by-paper/2408.15240-generative-verifiers-genrm.md`
- 2306.05685 Judging LLM-as-a-judge / MT-Bench (LaTeX) ->
  `notes/by-paper/2306.05685-judging-llm-as-judge.md`

Abstract-level (memory): 2502.12110 A-MEM, 2404.13501 + 2603.07670 memory surveys,
2507.05257 MemoryAgentBench, 2602.19320 agentic-memory anatomy, 2303.11366 Reflexion,
2408.09559 HiAgent, 2005.11401 RAG. (Verifiers): 2412.02674 Mind the Gap, 2406.06592
OmegaPRM, 2504.16828 ThinkPRM, 2410.08146 PAV/Rewarding Progress, 2507.08794 One Token to
Fool, 2410.02736 CALM, 2401.10020 Self-Rewarding, 2410.12735 CREAM, 2601.17223 VPRM,
2509.17995 Variation in Verification, 2402.14158 ToolVerifier.

Cited (not rewritten): 2304.03442 Generative Agents, 2312.03664 Concordia, 2605.06222
FFDC/when-to-trust-imagination; theme `benchmark-validity-and-evaluation.md` s6.

Owned files: theme `notes/by-theme/research-area-memory-and-verifiers.md`; this brief;
manifest + search-log fragments.

## Strongest findings (source-backed)

1. **Process/per-step checking beats outcome-only, and is more aligned and harder to
   reward-hack** (Let's Verify, 2305.20050): PRM 78.2% vs ORM 72.4% on MATH best-of-1860,
   lead widening with N; outcome supervision rewards "right answer via wrong reasoning";
   process supervision reported as a *negative alignment tax*. Maps onto the project's
   per-delta (not outcome-only) evaluation.
2. **A verifier that reasons before deciding catches convincing errors a scalar classifier
   rubber-stamps** (GenRM, 2408.15240): discriminative RM scores a wrong solution 0.999;
   GenRM-CoT reasons and rejects (0.0015); GenRM beats discriminative/DPO/LLM-judge (GSM8K
   73% -> 93.4%). Supports shaping the advisory WAM as reason-then-verdict, inspectable.
3. **An LLM judge must not be the primary social score** (2306.05685 + 2410.02736 +
   2507.08794 + validity theme s6): GPT-4 hits 85% human agreement but only on large
   quality gaps (~70% -> ~100% with the gap); position bias (65% swap-consistency),
   verbosity bias (91.3% attack failure), self-enhancement, misleadability; a single
   non-word token can flip a generative judge to a false positive. The project's social
   calls are close/free-form/long-context, the judge's weakest regime.

## Weak or uncertain claims (could not verify)

- Most 2026 memory/verifier papers (A-MEM, FluxMem-line, ThinkPRM, VPRM, OmegaPRM, CALM,
  One Token to Fool, etc.) are **abstract-level**; their numbers are attributed to their
  abstracts, not verified against full text or independent runs.
- The strongest single unverified item: **whether any process/generative-verifier result
  transfers to embodied SOCIAL deltas that lack an answer key.** All cornerstone reliability
  numbers (78.2%, 93.4%, 85% agreement) are from math/algorithmic or chat-preference tasks
  with checkable references. The project's social regime has no ground-truth label, so the
  *mechanisms* transfer but the *reliability* is unestablished. No source measures a learned
  verifier on Minecraft-style social-material deltas.
- The generator-verifier gap is "real but bounded" (2412.02674 vs 2509.17995); I did not
  reconcile their exact conditions from full text (abstract-level for both).

## Implications for this repo (mechanically useful vs research contribution)

- *Mechanically useful (engineering, borrow)*: MemGPT two-tier external memory via
  tool-calls + eviction/summary; Generative-Agents retrieval scoring and
  reflection-with-citations (hardened to cite runtime artifacts); process/per-delta scoring
  (Let's Verify); reason-then-verdict advisory output + inference-time-compute / order-swap
  / reference-guided reliability guards (GenRM, MT-Bench); convincing-wrong negative mining.
- *NOT the research contribution*: memory and verifier tooling are SUPPORT per the shared
  contract. Memory makes a commitment persist/retrievable; it does not make the agent honor
  it. A learned verifier is evidence tooling; the deterministic runtime artifact stays the
  primary truth (VPRM 2601.17223 is the academic backing for rule-based-over-neural where
  rules exist). The advisory predictor is a secondary, inspectable signal scored against
  the artifact, never the primary social score.

## Recommended next questions

1. Build a small **social-transition verifier eval**: predicted social delta vs verified
   world delta, with convincing-wrong negatives, to measure (not assume) advisory accuracy
   in the project's no-answer-key regime. This is the open gap no surveyed source fills.
2. Decide the **memory schema**: episodic obligation/credit entries that each reference a
   runtime artifact id (MemGPT external store + Generative-Agents evidence-citation), with
   reflection distilling routines for the institutional layer, and an explicit forgetting
   policy (a named open problem in 2603.07670).
3. Specify the **advisory-WAM output contract** as reason-then-verdict (GenRM-style) plus an
   order-swap/reference-guided guard, with an explicit rule that it never fills args, marks
   progress, or overrides the verifier (FFDC + project hard rule).
