# Lane 34 brief: long-horizon memory and continuity for agents

Wave 6, lane 34. ASCII punctuation only.

## Mandate

Survey the mechanisms that make the repo's claims of post-goal continuation and multi-cycle
memory continuity (PlanBeads, actor workspace, evidence-linked memory) real. New angles beyond
the wave-1 memory theme: agent memory architectures (episodic/semantic/working; memory as an
OS), consolidation/forgetting/retrieval scoring, experiential/lifelong learning, continual
learning and catastrophic forgetting, and evidence-linked/citation-grounded memory.

Extend, do not duplicate: the wave-1 theme `research-area-memory-and-verifiers.md` and the
deep-read archetypes Generative Agents (2304.03442), MemGPT (2310.08560), Reflexion
(2303.11366) are cited by id, NOT re-derived.

## Sources reviewed (count + list)

Deep-read (LaTeX or paper-read), 8 cornerstones, all HF-verified:

1. 2308.10144 ExpeL: LLM Agents Are Experiential Learners (AAAI 2024). Gradient-free
   cross-task experience pool + insight extraction. LaTeX full.
2. 2305.10250 MemoryBank (AAAI 2024). Ebbinghaus-forgetting-curve consolidation. LaTeX method.
3. 2404.13501 A Survey on the Memory Mechanism of LLM-based Agents. Sources (inside/cross-trial
   /external) + W/P/R operations. LaTeX taxonomy.
4. 2505.00675 Rethinking Memory in AI: Taxonomy, Operations. Parametric vs contextual; six
   operations. LaTeX foundations.
5. 2506.06326 Memory OS of AI Agent (MemoryOS). Three-tier OS-style memory, segment-page,
   heat eviction. LaTeX modules.
6. 2602.17913 From Lossy to Verified: Provenance-Aware Tiered Memory (TierMem, ICML 2026 fmt).
   Immutable raw tier + provenance-linked summaries + sufficiency router. LaTeX body+analysis.
7. 2605.27762 PEAM: Parametric Embodied Agent Memory in Minecraft. Verifier-gated consolidation
   into isolated LoRA adapters; failure-correction pairs. LaTeX full (appendix partly placeholder).
8. 2402.17753 LoCoMo: Evaluating Very Long-Term Conversational Memory (ACL 2024). 35-session
   benchmark grounded on temporal event graphs. LaTeX sections.

Cited from neighbor theme / abstract level (not re-derived): 2304.03442 (Generative Agents,
memory stream + reflection-with-citations), 2310.08560 (MemGPT, memory as OS), 2303.11366
(Reflexion), 2502.12110 (A-MEM), 2408.09559 (HiAgent), 2605.06716 / 2603.07670 (memory
surveys), 2507.05257 (MemoryAgentBench), 2602.19320 (Anatomy of Agentic Memory), 2510.16079
(EvolveR, already in by-paper). Continual-learning reviews on HF: 1802.07569, 1910.02718.

## Strongest findings (source-backed)

1. Evidence-linked memory is an architectural invariant, not just hygiene, and it measurably
   helps. TierMem (2602.17913) makes every distilled summary carry a provenance link to an
   immutable raw page (no summary without a traceable source) and shows provenance pointers add
   +4.2 pp accuracy on exactly the queries that need raw evidence (Acc@R 77.5 -> 81.7), reaching
   0.851 vs 0.873 raw-only at -54.1% tokens / -60.7% latency on LoCoMo. This is the hardened
   form of Generative Agents' "(because of 1,5,3)" and the direct academic statement of the
   repo's "cite a concrete artifact" rule.

2. Verifier-gated consolidation is the mechanism for trustworthy continuation, demonstrated in
   Minecraft. PEAM (2605.27762) requires environment-side verification before any trajectory
   enters its consolidation pool, on the exact VOYAGER/Mineflayer substrate the repo uses, and
   shows structural isolation prevents catastrophic forgetting (0% cross-category vs 32.4%
   shared-LoRA / 43.3% EWC / 78.5% full fine-tune) with 69.7% vs 54.5% task success (McNemar
   p = 0.018). The transferable piece is the gate (nothing durable until verified), not PEAM's
   internalization into an acting policy.

3. Cross-trial experience reuse is the mechanism behind post-goal continuation, and works
   gradient-free. ExpeL (2308.10144) accumulates success/failure experience and reuses it
   across episodes (not just intra-task retries like Reflexion), matching Reflexion without
   retries (HotpotQA 40 vs 39) and exceeding it on ALFWorld (54 one-shot vs 59 at R3), with
   abstraction and recall synergistic. Its curation operators (ADD/EDIT/UPVOTE/DOWNVOTE with a
   decaying importance count) are a simple consolidation/forgetting primitive.

## Weak / uncertain claims

- PEAM (2605.27762) appendix is author-marked [INFERRED]/[VERIFY]: the per-task breakdown,
  several hyperparameters, on-device latency, and cpair yield are placeholder values, not
  measured. Only the body's main table, forgetting, and core ablations are stated as measured.
  No public code link in the paper. Treat PEAM's headline numbers as self-reported and the
  appendix specifics as unverified.
- All results are self-reported (quoted, not run). TierMem / MemoryOS / ExpeL / MemoryBank have
  public code but I ran none.
- TierMem and MemoryOS primary metrics are LLM-judge / n-gram (BLEU-1) accuracy, which inherit
  judge-reliability caveats (neighbor verifier theme). MemoryBank's forgetting curve is
  author-described as "highly simplified," not validated as cognitively accurate.
- HCAM (2105.14039) quantitative figures here are the paper's qualitative claims (read abstract
  + mechanism, not full tables).

## Implications for this repo (mechanical vs contribution)

Mechanical (adoptable plumbing):
- Provenance invariant: no distilled memory (relationship/material/norm) without a pointer to
  the verified runtime artifact (Mineflayer snapshot diff, chat/transfer event, verifier id).
  Source: TierMem 2602.17913, hardening Generative Agents 2304.03442.
- Immutable raw tier + distilled tier: keep Mineflayer world/inventory/chat/verifier records as
  the stably-addressed source of truth; distilled tiers summarize and must link back. Forgetting
  (MemoryBank's R=e^(-t/S), MemoryOS heat eviction) applies to surfacing/ranking the distilled
  tier, never to deleting the immutable evidence. Source: TierMem, MemoryOS 2506.06326,
  MemoryBank 2305.10250.
- Verifier-as-admission-gate for consolidation: nothing enters durable cross-cycle memory until
  the deterministic verifier confirms it. Source: PEAM 2605.27762.
- Cross-trial experience pool + insight curation for post-goal continuation, with insights
  required to cite their supporting verified events. Source: ExpeL 2308.10144.
- Coarse-to-fine chunked retrieval over the cycle history (summarize chunks, locate, drill in).
  Source: HCAM 2105.14039, MemoryOS two-stage retrieval.
- Memory-design checklist: contextual-structured representation + the six operations
  (consolidate/index/update/forget/retrieve/condense), each evidence-linked. Source: surveys
  2505.00675, 2404.13501.

NOT the contribution (support, not the research object):
- All of the above is memory plumbing. None of it is a predictive model. Memory makes a
  commitment persist and be retrievable; whether the obligation is honored is a behavior the
  runtime verifies. The repo's contribution is the verifier-grounded advisory predictor; memory
  is the substrate it reads and writes.
- The parametric-internalization half of PEAM (skills into an acting policy) is out of scope:
  the WAM is advisory and never selects actions.
- Free-prose memory (ExpeL insights, MemoryBank portrait, MemoryOS persona) is the un-hardened
  version the repo forbids as runtime authority; it must be made evidence-linked first.

## Recommended next questions

1. What is the right schema for an evidence-linked social/material ledger entry so that every
   trust/obligation value carries the verifier record id(s) that moved it (the repo's hard
   line), and how does that schema support the six memory operations without ever laundering
   un-verified prose into durable state?
2. Can the repo's deterministic verifier serve as TierMem's "raw tier" directly, so that the
   provenance link is to a (state, action, next-state) record rather than a raw text page, and
   what does the sufficiency-router analog look like when the source of truth is structured and
   near-$0 to query?
3. For post-goal continuation, what is the forgetting/surfacing policy over the distilled tier
   that keeps the working set small (MemoryOS heat, MemoryBank recall-reinforced decay) while
   guaranteeing the immutable evidence is never lost, and how is it evaluated on a
   very-long-horizon, multi-cycle social scenario (LoCoMo-style but verifier-grounded)?
4. Does structural isolation of memory by layer/relationship (PEAM's per-category isolation,
   applied to storage not to an acting policy) prevent cross-contamination of social state
   across cycles, and is that the right partitioning for an advisory predictor's memory?

## One-line tie to the thesis

Long-horizon memory mechanisms (OS-style tiering, forgetting curves, cross-trial experience
pools) supply the substrate for the repo's multi-cycle continuity, but only become admissible
under the repo's hard line when consolidation is verifier-gated and every memory cites a
concrete Mineflayer artifact rather than free-form prose, the provenance-linked discipline that
TierMem makes architectural and the repo grounds in a deterministic verifier at near-$0.
