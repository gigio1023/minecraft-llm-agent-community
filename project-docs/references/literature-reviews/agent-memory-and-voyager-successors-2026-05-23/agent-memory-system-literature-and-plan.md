# Agent Memory System Literature And Plan

Date: 2026-05-23

Search token: `AGENT_MEMORY_SYSTEM_LITERATURE_PLAN`.

## 2026-05-24 HF CLI Refresh

Queried with:

- `hf papers search "agent memory" --limit 5`
- `hf papers search "Minecraft agent memory" --limit 5`

Additional signals:

| Reference | Memory Signal | Fit For This Repo |
| --- | --- | --- |
| [PREPING: Building Agent Memory without Tasks](https://huggingface.co/papers/2605.13880) | Synthetic practice only helps when a proposer and validator control feasibility, redundancy, and memory insertion. | Settlement experiments should store only verifier-backed lessons and avoid letting repeated log collection become redundant memory. |
| [Beyond RAG for Agent Memory: Retrieval by Decoupling and Aggregation](https://huggingface.co/papers/2602.02007) | Agent memory is a coherent, correlated stream; fixed top-k retrieval can return redundant context and lose prerequisites. | Retrieve bounded, diverse context: current inventory/resource facts, blockers, and action outcomes rather than many similar collection episodes. |
| [GEMS: Agent-Native Multimodal Generation with Memory and Skills](https://huggingface.co/papers/2603.28088) | Combines trajectory-level memory, compressed experiential summaries, and skill loading. | Keep raw evidence, then let action skills and summaries load on demand instead of stuffing all history into every cycle. |
| [Hindsight is 20/20: Building Agent Memory that Retains, Recalls, and Reflects](https://huggingface.co/papers/2512.12818) | Separates world facts, experiences, entity summaries, and beliefs with retain/recall/reflect operations. | Keep settlement facts, tool experiences, actor summaries, and inferred beliefs separate and evidence-linked. |
| [JARVIS-1](https://huggingface.co/papers/2311.05997) | Minecraft planning improves from memory of actual survival experiences. | Survival/settlement runs should use embodied experience traces, not only generic Minecraft knowledge. |

## Principle

The intended direction is:

```text
dense Mineflayer substrate, free LLM agent
```

The LLM should be increasingly autonomous in choosing goals, generating
TypeScript action programs, trying alternate strategies, asking other actors
for help, and proposing new action skills. The system should become denser in
the places that keep that autonomy grounded:

- Mineflayer helper affordances;
- current-run verifiers;
- structured runtime artifacts;
- actor-owned memory;
- async reviewer/extractor loops;
- promotion and rejection gates.

Memory is the contract between those two goals. It should not be a loose text
tail that merely makes prompts longer. It should be a structured substrate that
lets the LLM reuse experience while the runtime keeps success, causality, and
ownership honest.

## Current-LLM Reading Filter

See
[Minecraft Memory Research Refresh: Current-LLM Reading](./minecraft-memory-current-llm-research.md)
for the narrower 2026-focused pass.

Older Minecraft agent papers are still valuable, but they should not be copied
literally. Many Voyager-era design choices compensated for weaker code
generation, smaller context, and less reliable tool use. Current LLMs make
freer TypeScript action-skill generation more practical, so this repo should
lean into direct action trials while making the substrate stricter:

- Mineflayer helpers should be easy to call and hard to misuse.
- Every attempt should create current-run verifier evidence.
- Raw episodes should be preserved before any summary or consolidation.
- Reviewer consolidation should be asynchronous and evidence-linked.
- Retrieved memory should be objective-scoped, causal, and bounded.
- Action skill promotion should remain actor-owned and proof-backed.

The current interpretation is therefore:

```text
stronger LLM autonomy
+ denser Mineflayer substrate
+ stricter evidence-linked memory
```

## Literature Signals

| Reference | Memory Signal | Fit For This Repo |
| --- | --- | --- |
| [A Survey on the Memory Mechanism of LLM-based Agents](https://arxiv.org/abs/2404.13501) | Memory sources, forms, operations, and evaluation are separate design axes. | Treat memory as lifecycle infrastructure, not a single vector store. |
| [Memory in the Age of AI Agents](https://huggingface.co/papers/2512.13564) | Distinguishes factual, experiential, and working memory; highlights formation, evolution, retrieval. | Use typed memory layers with explicit write/read/evolve operations. |
| [Memory for Autonomous LLM Agents](https://huggingface.co/papers/2603.07670) | Frames memory as a write-manage-read loop coupled to perception and action. | Runtime should write raw experience, reviewers manage/refine, provider context reads bounded slices. |
| [MemGPT](https://arxiv.org/abs/2310.08560) | Hierarchical virtual context: working context, FIFO/recall, archival storage, function-mediated memory movement. | Add context budgets and explicit retrieval rather than dumping all actor history into prompts. |
| [Generative Agents](https://arxiv.org/abs/2304.03442) | Memory stream, retrieval by relevance/recency/importance, reflection, planning. | Good for social memory, but relationship changes still need evidence refs. |
| [Reflexion](https://arxiv.org/abs/2303.11366) | Converts feedback into verbal lessons stored in episodic memory. | Reviewer lessons are useful, but cannot override runtime verifier truth. |
| [Voyager](https://arxiv.org/abs/2305.16291) | Stores executable code skills and retrieves them for new objectives. | Procedural memory should be actor-owned action skill memory with proof refs. |
| [A-Mem](https://arxiv.org/abs/2502.12110) | Atomic notes with generated keywords/tags/context plus dynamic links and memory evolution. | Use linked memory records rather than independent flat notes. |
| [MINDSTORES](https://arxiv.org/abs/2501.19318) | Experience tuples of state, task, plan, outcome retrieved for planning. | Direct match for objective trial memory and retry context. |
| [Echo](https://arxiv.org/abs/2604.05533) | Transfer axes: structural, attribute, procedural, functional, interaction. | Add transfer metadata so stone axe knowledge can help with other tools/items. |
| [Optimus-1](https://arxiv.org/abs/2408.03615) | Hybrid memory: hierarchical directed knowledge graph plus abstract multimodal experience pool. | Use a small graph for Minecraft mechanics and a separate evidence-backed experience pool. |
| [HiAgent](https://arxiv.org/abs/2408.09559) | Working memory organized by subgoals; irrelevant action-observation history is summarized away. | Provider context should be subgoal-scoped, not whole-transcript-scoped. |
| [MineNPC-Task](https://huggingface.co/papers/2601.05215) | Memory-aware Minecraft tasks with preconditions, validators, plan/action/memory logs, and bounded-knowledge policy. | Objective memory writes must be paired with machine-checkable validators. |
| [AMA-Bench](https://huggingface.co/papers/2602.22769) | Similarity retrieval underperforms when causal and objective information are missing. | Retrieval must include objective signatures, causality, preconditions, and verifier outcomes, not embedding similarity alone. |
| [MemoryAgentBench](https://arxiv.org/abs/2507.05257) | Evaluates retrieval, test-time learning, long-range understanding, and conflict resolution. | Add memory tests that cover stale facts, contradictory evidence, and failed trials. |
| [Steve-Evolving](https://arxiv.org/abs/2603.13131) | Experience anchoring: pre-state, action, diagnosis, post-state; successes become skills and failures become guardrails. | Closest match for our actor workspace and direct generated action skill loop. |
| [MineEvolve](https://arxiv.org/abs/2603.13131) | Converts subgoal runs into typed feedback, reusable skills, remedies, and stagnation-aware repair signals. | Treat every direct action attempt as raw material for episodic/procedural memory and guardrails. |
| [MemGym](https://arxiv.org/abs/2605.20833) | Evaluates memory during long-horizon tool, coding, web, and computer-use execution rather than personal chat recall. | Evaluate memory by Minecraft verifier outcomes, not by whether the agent can restate old facts. |
| [Useful Memories Become Faulty](https://arxiv.org/abs/2605.12978) | Continuous LLM consolidation can degrade useful memories; raw episodes remain important. | Do not overwrite evidence with reviewer summaries. Preserve raw trials and gate consolidation. |
| [TriMem](https://arxiv.org/abs/2605.19952) | Keeps raw segments, extracted facts, and synthesized profiles together. | Use raw evidence refs plus compact facts/profiles instead of replacing episodes with summaries. |
| [MemoryArena](https://arxiv.org/abs/2602.16313) | Tests whether memory learned from earlier actions helps later dependent tasks. | Run no-memory versus memory-assisted micro-objectives across dependent Minecraft tasks. |
| [Memp](https://arxiv.org/abs/2508.06433) | Procedural memory should build, retrieve, update, correct, and deprecate reusable procedures. | Give procedural action skill memory explicit status, proof refs, failure refs, and deprecation. |

## Memory Types

The repo should use typed memory layers instead of one generic `memory[]`.

### Working Memory

Scope: one actor turn, objective, or subgoal.

Contents:

- current objective;
- current subgoal stack;
- latest observation;
- selected helper/action affordances;
- short action-observation tail;
- active constraints.

Purpose: keep the LLM oriented during one attempt without flooding context.

### Episodic Memory

Scope: concrete events that happened.

Contents:

- `pre_state`;
- objective/task;
- generated source or active action skill id;
- helper events;
- diagnosis;
- `post_state`;
- verifier result;
- artifact refs.

Purpose: provide evidence-backed recollection. An episodic memory should never
claim success without a verifier ref.

### Semantic World Memory

Scope: durable facts about the world.

Contents:

- known resource locations;
- placed crafting tables, furnaces, beds, and chests;
- shared storage locations and contents;
- biome and terrain facts;
- recurring hazards.

Purpose: let the LLM make useful plans without rescanning everything, while
keeping each fact traceable to evidence.

### Procedural Memory

Scope: how to do things.

Contents:

- active action skill records;
- direct generated action skill trials;
- promoted recipes;
- guardrails;
- known preconditions/effects;
- proof refs and failure refs.

Purpose: let the LLM freely generate new behavior, then preserve useful
behavior as reviewable action skill memory.

### Social Memory

Scope: actor-to-actor state.

Contents:

- promises;
- requests;
- resource transfers;
- shared/private ownership events;
- relationship edge events;
- obligations and unresolved debts.

Purpose: make social simulation arise from resource pressure and evidence,
not from vague persona text.

### Meta-Memory / Index

Scope: retrieval and memory governance.

Contents:

- tags;
- objective signatures;
- item/block/entity signatures;
- spatial hash;
- causal links;
- confidence;
- recency;
- verifier status;
- promotion/deprecation status.

Purpose: prevent vector-only retrieval from selecting irrelevant or stale
records.

## Memory Lifecycle

The runtime should expose memory as a lifecycle, not as direct prompt stuffing.

```text
capture raw event
-> write evidence-backed episodic memory
-> async extract semantic/procedural/social candidates
-> link and index by objective, item, location, actor, diagnosis, verifier
-> retrieve bounded context for the next objective/action generation
-> update, promote, deprecate, or forget after new evidence
```

Important boundary:

- LLM may propose memory writes and links.
- Runtime/reviewer validates shape and evidence refs.
- Provider context reads only bounded, ranked memory slices.
- Memory alone never satisfies an objective verifier.

## Proposed Actor Workspace Shape

Keep actor workspace as source of truth:

```text
data/actors/<actor_id>/
  memory/
    working/
    episodic/
    semantic/
      world-facts/
      mechanics/
    procedural/
      direct-trials/
      promoted/
      guardrails/
    social/
      events/
      obligations/
    index/
      objective-signatures.json
      spatial-index.json
      item-index.json
      links.json
```

The existing action skill directories can remain where they are; the procedural
memory layer should reference them instead of duplicating source-of-truth files.

## Provider Context Contract

The provider-facing packet should evolve from `memory: string[]` into a typed
memory section:

```ts
memory: {
  working: {
    objective_id: string;
    subgoal?: string;
    short_tail: MemoryRef[];
  };
  retrieved_episodic: MemoryRef[];
  retrieved_semantic: MemoryRef[];
  retrieved_procedural: MemoryRef[];
  retrieved_social: MemoryRef[];
  guardrails: MemoryRef[];
  retrieval_policy: {
    objective_id: string;
    token_budget: number;
    ranking_signals: string[];
  };
}
```

Each `MemoryRef` should carry:

- stable id;
- short summary;
- evidence refs;
- confidence;
- status;
- reason it was retrieved.

The LLM receives enough memory to act freely, but every memory item remains
traceable and bounded.

## Retrieval Policy

Use hybrid retrieval:

1. Hard filters:
   - same actor or shared memory;
   - active world/session when required;
   - matching objective category;
   - compatible item/block/entity/tool tier;
   - non-rejected status.
2. Symbolic ranking:
   - objective signature;
   - prerequisite/effect overlap;
   - diagnosis match;
   - spatial proximity;
   - relationship target.
3. Semantic rerank:
   - summary/source embedding similarity;
   - linked note expansion.
4. Budget trim:
   - include the highest-utility items only;
   - preserve evidence refs;
   - never include stale facts without status.

This follows the lesson from AMA-Bench and Minecraft memory papers: similarity
alone misses causality, objective structure, and task state.

## Implementation Plan

### Phase 1: Memory Schema

- Add `MemoryRecord` types for working, episodic, semantic, procedural, social,
  and guardrail records.
- Add diagnosis enum shared with objective/direct trial reporting.
- Add actor workspace memory path helpers.
- Keep migration additive; do not delete existing memory tails.

### Phase 2: Runtime Capture

- Convert direct generated trial reports and objective reports into episodic
  memory records.
- Write `pre_state`, action/source, helper events, diagnosis, `post_state`,
  verifier result, and artifact refs.
- Preserve the rule that objective success comes only from current-run verifier
  evidence.

### Phase 3: Memory Retrieval

- Implement `retrieveActorMemoryForObjective(actorId, objective, budget)`.
- Use hard filters and symbolic ranking first; add semantic/linked expansion
  later.
- Replace provider context `memory: string[]` with typed memory while keeping a
  compatibility tail during transition.

### Phase 4: Async Extraction

- Extend per-actor reviewers so each completed trial can produce:
  - semantic world fact candidates;
  - procedural action skill candidates;
  - guardrail candidates;
  - social event candidates.
- Candidates must reference actor-local evidence.

### Phase 5: Memory Governance

- Add guarded appliers:
  - semantic fact applier;
  - procedural promotion applier;
  - guardrail applier;
  - social obligation applier.
- Add status transitions: `candidate`, `active`, `superseded`, `stale`,
  `rejected`.

### Phase 6: Dashboard

- Show memory as typed panels:
  - current working memory;
  - relevant past episodes;
  - known world facts;
  - procedural memory/action skills;
  - guardrails;
  - social obligations.
- Dashboard must remain fire-and-forget.

### Phase 7: Memory Evaluation

Add small tests/objectives:

- stale memory cannot satisfy current-run objective;
- contradictory world facts are not silently injected;
- failed direct trials retrieve as guardrails, not as successful procedures;
- actor-private memory does not leak to another actor unless promoted/shared;
- provider context respects memory token/count budget;
- social obligation appears only after guarded relationship/social applier.

## Non-Goals

- Do not build a full vector database before typed records exist.
- Do not use memory to bypass Mineflayer/world verification.
- Do not make a global memory store the source of truth.
- Do not block actor turns on memory reflection.
- Do not treat social memories as trust score floats without evidence refs.
