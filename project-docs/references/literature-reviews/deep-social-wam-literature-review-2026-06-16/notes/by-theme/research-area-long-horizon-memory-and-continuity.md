# Research area: long-horizon memory and continuity for agents

Lane 34 (wave 6) theme file. Audience: a newcomer to LLM-agent memory. Jargon is defined on
first use. ASCII punctuation only.

This file surveys the mechanisms that make multi-cycle memory continuity real: how an agent
persists, organizes, consolidates, forgets, retrieves, and reuses information across many
episodes, so that a stateless model behaves like an agent that remembers and accumulates
verified experience. It is the mechanism survey behind the repo's claims of post-goal
continuation and evidence-linked memory.

## Scope and relation to neighbors (do not duplicate)

Wave 1 already surveyed the two parent fields and deep-read the archetypes. This file extends,
it does not re-derive them:

- `research-area-memory-and-verifiers.md` (lane 17) surveys agent memory AND learned verifiers
  as fields, and already deep-reads Generative Agents' memory stream, MemGPT, Reflexion, and
  cites A-MEM / HiAgent / the storage-to-experience (2605.06716) and write-manage-read
  (2603.07670) surveys. Cited, not rewritten.
- `notes/by-paper/2304.03442-generative-agents.md` (memory stream + reflection-with-citations)
  and `notes/by-paper/2310.08560-memgpt.md` (memory as an OS, function-call paging) are the
  archetypes; cited by id below, NOT re-derived.
- `notes/by-paper/2303.11366-reflexion.md` (self-feedback into an episodic buffer) is the
  memory-meets-verifier bridge; cited.

The NEW angles this lane adds: (1) the post-MemGPT "memory as an OS" line (MemoryOS); (2)
explicit consolidation/forgetting mechanisms (MemoryBank's Ebbinghaus curve; PEAM's
parametric consolidation); (3) experiential/lifelong learning that accumulates and reuses
verified experience across episodes (ExpeL); (4) the parametric-vs-contextual memory axis and
the six-operation taxonomy (Rethinking-Memory survey, Zhang survey); (5) evidence-linked /
provenance-grounded memory where every memory cites a concrete artifact (TierMem), extending
Generative Agents' "(because of 1,5,3)" idea with newer work; (6) the older learned-memory
lineage for RL agents (HCAM) and the canonical very-long-term evaluation (LoCoMo).

## Glossary (defined once)

- Context window: the fixed token budget an LLM attends to in one forward pass. Everything
  outside it is invisible unless retrieved back in.
- Working / short-term memory: information currently inside the context window.
- Long-term / external memory: information stored outside the context window (database, file,
  vector store) that must be retrieved back to be used.
- Episodic memory: memories of specific past events ("at cycle 12 I lent Bob a pickaxe").
  Semantic memory: distilled general facts ("Bob returns what he borrows"). Procedural
  memory: learned skills / action sequences. Working memory: the active control layer over the
  context window. (Terms from cognitive psychology; informal in LLM-agent work.)
- Parametric memory: knowledge implicit in model weights. Contextual memory: explicit external
  data, either unstructured (text, embeddings) or structured (graphs, tables, typed records).
- Consolidation: integrating short-term experiences into persistent memory. Forgetting:
  selectively removing outdated/irrelevant content. Retrieval: scoring stored memory by a
  similarity function and returning what is above a threshold. (Six-operation taxonomy:
  Consolidation, Indexing, Updating, Forgetting, Retrieval, Condensation, from 2505.00675.)
- Provenance link: an explicit pointer from a distilled memory back to the immutable source
  record (raw page, event id) that supports it. Evidence-linked memory: memory where every
  entry carries such a pointer.
- RAG (retrieval-augmented generation): fetch relevant external text and prepend it to the
  prompt before generating. The canonical way to bring long-term memory into working memory.

## Sub-threads (source-backed)

### Thread 1: memory architectures and the OS analogy (working / external memory)

The dominant engineering pattern treats the context window as a constrained resource and pages
data in and out of external tiers. MemGPT (2310.08560, deep-read in lane 17) introduced the
operating-system analogy: main context + external context, with the LLM issuing function calls
to store and retrieve, and a memory-pressure interrupt before eviction. The post-MemGPT
instantiation this lane deep-reads is MemoryOS (2506.06326): an explicit three-tier hierarchy
(Short-Term, Mid-Term, Long-term Personal Memory), four modules (Storage, Updating, Retrieval,
Generation), with OS-style segment-page organization (segment = conversation topic, page = one
exchange) and heat-based eviction (LRU / working-set), plus a dialogue-chain FIFO for
STM-to-MTM promotion. It reports +49.11% F1 and +46.18% BLEU-1 over baselines on LoCoMo
(GPT-4o-mini). The transferable structure: tier memory by recency and abstraction, and govern
promotion/eviction by an explicit, inspectable policy rather than ad hoc.

### Thread 2: consolidation, forgetting, and retrieval scoring

Memory is not a static log; it is curated, summarized, and forgotten. MemoryBank (2305.10250,
deep-read) is the canonical mechanization of principled forgetting: an Ebbinghaus-forgetting-
curve updater R = e^(-t/S) (retention decays with time t unless memory strength S grows), where
recall increments S and resets t, so a recalled memory is forgotten with lower probability. It
pairs this with hierarchical distillation (turn -> daily summary -> global summary) and
dual-tower FAISS retrieval. The neighbor theme already cites A-MEM (self-linking, memory
evolution) and HiAgent (hierarchical working memory). The two surveys this lane deep-reads
formalize the operation set: the Zhang survey (2404.13501) names writing/management/reading
over inside-trial / cross-trial / external sources; the Rethinking-Memory survey (2505.00675)
adds a finer six-operation taxonomy (Consolidation, Indexing, Updating, Forgetting, Retrieval,
Condensation) grouped as Encoding / Evolving / Adapting, over parametric vs
contextual-structured vs contextual-unstructured representations, and explicitly notes the
Zhang survey misses indexing. Generative Agents' retrieval scoring (recency x importance x
relevance, deep-read in lane 17) remains the field-standard recipe.

### Thread 3: experiential and lifelong learning (accumulate and reuse verified experience)

This thread is the direct mechanism behind "post-goal continuation": an agent that keeps
learning from its own episodes. ExpeL (2308.10144, deep-read) is the gradient-free archetype:
it gathers success and failure trajectories into an experience pool, extracts cross-task
natural-language insights via curation operators (ADD / EDIT / UPVOTE / DOWNVOTE with an
importance count that decays to removal), and at inference augments the task with the insight
list plus top-k retrieved successful trajectories. It matches Reflexion without retries
(HotpotQA 40% vs 39%), exceeds it on ALFWorld (54% one-shot vs 59% at R3), and transfers
HotpotQA insights to FEVER (70%). The key property over Reflexion: cross-trial (inter-episode)
retention, not just intra-task retries, and both abstraction and recall are synergistic.
PEAM (2605.27762, deep-read, and the lane's only Minecraft instance) sits at the parametric end
of the same thread: it consolidates verified failure-correction trajectory pairs into
per-category isolated LoRA adapters (a craft skill cannot modify the combat adapter), gated by
a parameterization-worthiness score and a scale-free self-triggered consolidation trigger.
Crucially, it requires environment-side verification before any trajectory enters the
consolidation pool. It reports 69.7% vs VOYAGER 54.5% task success (McNemar p = 0.018), -85%
tokens, and 0% cross-category forgetting vs 32.4% (shared LoRA) / 43.3% (EWC) / 78.5% (full
fine-tune). (Caveat: PEAM's appendix per-task numbers and several constants are author-marked
[INFERRED] placeholders; the body's main results are stated as measured.)

### Thread 4: continual learning and catastrophic forgetting (the structural-isolation lesson)

For a multi-cycle actor, catastrophic forgetting (acquiring new competence erases old) is the
core continual-learning failure. The field's taxonomy (regularization, replay, architecture /
parameter-isolation) is summarized in the surveys (2505.00675 has a dedicated
parametric-memory-continual-learning table; the broad reviews 1802.07569 and 1910.02718 sit on
HF). PEAM's forgetting result is the cleanest in-domain demonstration that structural
isolation (separate adapters per skill category) beats regularization (EWC) and naive
fine-tuning by a wide margin. The lesson for continuity: durable competence across many cycles
needs structural separation of what is stored, not just a growing undifferentiated log. (For
an advisory predictor that never acts, this lesson applies to how its memory is partitioned,
not to internalizing skills into an acting policy.)

### Thread 5: evidence-linked / provenance-grounded memory (every memory cites an artifact)

This is the thread most specific to the repo. Generative Agents (2304.03442, deep-read in lane
17) introduced reflection that cites the memory objects it is built from ("Klaus is dedicated
to research (because of 1,2,8,15)"). TierMem (2602.17913, deep-read) is the newer, hardened
version: a provenance-linked two-tier memory where Tier-2 is an immutable paged raw log (stable
identifiers, the authoritative source of truth) and Tier-1 is a summary index in which every
entry carries provenance links back to the Tier-2 pages it summarizes, so no summary exists
without a traceable raw source. A sufficiency router answers from cheap summaries by default
and escalates to immutable raw evidence only when summaries are underspecified; verified
write-back distills only grounded findings, linked back. The paper formalizes the
write-before-query barrier (compression decides what to keep before knowing the future query,
causing unverifiable omissions) and shows provenance pointers measurably help: +4.2 pp on
escalated queries, 0.851 vs 0.873 raw-only accuracy at -54.1% tokens on LoCoMo. This is the
academic statement of the repo's rule that a memory must cite a concrete artifact rather than be
free prose.

### Thread 6: the older RL-memory lineage and how memory is evaluated

Before LLM agents, learned memory architectures addressed the same recall problem. HCAM
(2105.14039, deep-read) introduced Hierarchical Chunk Attention Memory: chunk the past, attend
coarsely over chunk summaries to locate the relevant chunk, then attend in detail within it
("mental time travel"), outperforming LSTM / Transformer-XL and extrapolating to sequences an
order of magnitude longer than training. It is the differentiable analog of the
summary-then-detail pattern that TierMem and MemoryOS realize with external stores. On
evaluation, LoCoMo (2402.17753, deep-read) is the canonical very-long-term-memory benchmark
(300 turns / 9K tokens / up to 35 sessions, grounded on personas and temporal event graphs,
human-verified). Its message: the best model scores 32.4 overall F1 vs human 87.9, long context
alone increases hallucination (adversarial accuracy collapses to 2.1%), and summarization loses
decisive information. The neighbor theme additionally cites MemoryAgentBench (2507.05257) and
the Anatomy-of-Agentic-Memory survey (2602.19320) for memory-evaluation fragility.

## Maturity and open problems

Memory mechanisms are standard and work well enough to ship (RAG, OS-style tiering, reflection,
forgetting curves, experience pools). But the field's own benchmarks say evaluation is immature
and results are backbone-dependent (LoCoMo 2402.17753; MemoryAgentBench 2507.05257; Anatomy
survey 2602.19320, both in the neighbor theme). The hardest open problems, named across the
surveys (2505.00675, 2404.13501, and 2603.07670 / 2605.06716 in the neighbor theme):
continual consolidation without catastrophic forgetting, causally grounded retrieval (retrieve
what matters, not just what is similar), trustworthy / non-hallucinated reflection, learned
forgetting that does not delete decisive evidence, and multimodal / embodied memory. The last
two are exactly where the repo sits and are the least solved.

## Tie to the project and 4-layer admissibility

The repo claims post-goal continuation and multi-cycle memory continuity (PlanBeads, an actor
workspace, evidence-linked memory). This area supplies the mechanisms, with one hard constraint
the literature does not impose but the repo does: a memory is admissible only if it cites a
verified runtime artifact, and the advisory predictor never acts on it.

Which mechanism backs verifiable post-goal continuation:

- Cross-trial experience reuse (ExpeL 2308.10144) is the mechanism for an agent that keeps
  improving after a goal is met: it accumulates success/failure experience and reuses it across
  episodes. The repo's hardening: insights must cite the verified events that justify them, not
  float as prose.
- Verifier-gated consolidation (PEAM 2605.27762) is the mechanism that makes continuation
  trustworthy: nothing enters durable memory until the environment-side verifier confirms it.
  This is the repo's deterministic runtime verifier used as an admission gate. (The repo adopts
  the gate, not PEAM's internalization into an acting policy, since the WAM is advisory.)
- Provenance-linked tiering (TierMem 2602.17913, MemoryOS 2506.06326, MemoryBank 2305.10250)
  is the storage substrate: an immutable raw tier (Mineflayer world/inventory snapshots, chat
  logs, verifier records, stably addressed) plus a distilled tier (relationship/material/norm
  summaries) whose every entry points back to the raw tier. The forgetting curve and heat-based
  eviction apply to surfacing/ranking the distilled tier, never to deleting the immutable
  evidence.

What must cite a concrete Mineflayer artifact rather than be free-form prose (the 4-layer
admissibility table):

| Layer | What memory stores | What it must cite (admissibility) |
|---|---|---|
| Physical | Past movement/block/world events, recallable across cycles | The verifier's (state, action, next-state) record id. Physical truth is owned by the runtime, not by memory. |
| Material / economic | Possession history, who borrowed/returned what, obligation/credit ledger across cycles | The inventory/container snapshot diff and the verified transfer event id. A "Bob owes a pickaxe" entry points at the lend event, not a prose note. |
| Social | Relationship state, trust enums, beliefs about others, remembered promises | The chat/transfer/verifier event(s) that moved the enum. A trust update cites the verified events; it is a ledger value, never a free-floating float or label (the repo's hard line). ExpeL's belief-update and MemoryBank's dynamic portrait are the un-grounded versions of this. |
| Institutional / settlement | Routines, roles, conventions distilled from many episodes | The set of verified social/material events the norm was abstracted from. Generative Agents' reflection-with-citations, hardened to cite runtime artifacts (TierMem's invariant), not other prose. |

The single most transferable idea across the area: Generative Agents' reflection cites its
evidence, and TierMem makes that an architectural invariant (no summary without a provenance
link to an immutable source). The repo's version is stronger than any in the literature, because
its source of truth is a deterministic verifier's record produced at near-$0, so grounding is
automatic rather than a human-annotation pass (LoCoMo) or an LLM-judge label (TierMem's router
training).

## What I could not verify

- PEAM (2605.27762): the appendix is author-marked as containing [INFERRED] placeholder
  values (per-task breakdown, several hyperparameters, on-device latency, cpair yield). Those
  specific numbers are NOT verified measured values; only the body's main table, forgetting,
  and core ablations are stated as measured. No public code link in the paper.
- All deep-read results here are self-reported (quoted from papers), not environment-verified
  by me. TierMem, MemoryOS, ExpeL, MemoryBank have public code; I did not run any of it.
- LLM-judge-based metrics (TierMem's primary LoCoMo accuracy; MemoryOS QA) inherit the
  judge-reliability caveats documented in the neighbor verifier theme; I did not independently
  assess judge bias on these specific benchmarks.
- I read PEAM and the two surveys in full from LaTeX; for TierMem I read the body and analysis
  (lines 1-879 of 1920) but not the full appendix; for HCAM I read the abstract and mechanism
  via grep, not the full results tables (so HCAM's quantitative figures are the paper's
  qualitative claims, not extracted numbers).
- The literature has NO structured-social-material, verifier-grounded, embodied memory
  instance with a relationship/obligation ledger. PEAM is the closest (Minecraft, verifier-
  gated) but is single-agent and physical-only (craft/gather/combat), with no social or
  material-economic layer. That gap is the repo's surface, not a citable result.
