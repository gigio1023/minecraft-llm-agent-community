# Minecraft Memory Research Refresh: Current-LLM Reading

Date: 2026-05-23

Search token: `MINECRAFT_MEMORY_CURRENT_LLM_RESEARCH`.

## Method

This refresh narrows the previous paper sweep toward two questions:

1. What do recent Minecraft-agent papers say about memory, experience,
   action-skill growth, validators, and repeated failure?
2. What do recent memory papers say about durable memory for agentic execution,
   not just personal chat recall?

The review used parallel subagent research, `hf papers search`, `hf papers
read`, and direct arXiv/Hugging Face checks. Older Minecraft papers are read
through a current-LLM filter: keep the parts that still matter with stronger
models, and discount scaffolding that mainly existed because earlier LLMs had
shorter context, weaker code generation, or poor tool-use reliability.

## Current-LLM Reading Filter

The repo should not copy old Voyager-era architecture literally. Current LLMs
can generate and revise TypeScript action code more effectively than 2023-era
models, so the runtime should allow freer direct action-skill trials than a
fully hand-authored primitive-only system.

The system still needs to be stricter, not looser, around:

- Mineflayer helper affordances;
- current-run verifiers;
- timeout and cancellation semantics;
- immutable raw evidence;
- typed diagnosis;
- actor-owned action skill promotion;
- memory retrieval scope and budget.

The updated interpretation is:

```text
stronger LLM autonomy
+ denser Mineflayer substrate
+ stricter evidence-linked memory
```

This makes raw or generated TypeScript useful for propagation, while keeping
runtime truth outside the model's self-report.

## Minecraft Papers To Prioritize

| Reference | Date | What To Keep | What To Avoid |
| --- | --- | --- | --- |
| [MineEvolve](https://arxiv.org/abs/2603.13131) | 2026 | Convert each subgoal run into typed feedback: state deltas, inventory deltas, failure type, progress, stagnation, reusable skills, and remedies. | Do not copy a large architecture before this repo has first-class memory records. |
| [Echo](https://arxiv.org/abs/2604.05533) | 2026 | Treat experience as transferable knowledge with structural, attribute, process, function, and interaction axes. | Do not keep memory as passive logs or generic summaries. |
| [MineNPC-Task](https://arxiv.org/abs/2601.05215) | 2026 | Use explicit preconditions, dependency structure, machine-checkable validators, plan/action/memory logs, repair attempts, and bounded-knowledge policy. | Do not let old memory, prompt claims, or out-of-world shortcuts satisfy objectives. |
| [EvolvingAgent](https://arxiv.org/abs/2502.05907) | 2025/2026 | Experience selection, self-verification, and ineffective-action reduction are useful design pressure. | Do not import a heavy continual world-model stack as a near-term dependency. |
| [Optimus-3](https://arxiv.org/abs/2506.10357) | 2025/2026 | Separate fast execution substrate from slower deliberative reasoning. | Do not make every tick or helper event part of hot LLM deliberation. |
| [MINDSTORES](https://arxiv.org/abs/2501.19318) | 2025 | Store `(state, task, plan, outcome)` experience tuples and retrieve them for future planning. | Do not rely on embedding similarity alone; add verifier, diagnosis, and causal tags. |
| [MINDcraft / MineCollab](https://arxiv.org/abs/2504.17950) | 2025 | Social behavior should begin with resource requests, delivery, storage, and partial observability. | Do not expect persona prose to create grounded collaboration. |
| [Optimus-1](https://arxiv.org/abs/2408.03615) | 2024 | Small mechanics graph plus evidence-backed experience pool is useful. | Do not build a heavy multimodal memory stack before Mineflayer state memory works. |
| [Odyssey](https://arxiv.org/abs/2407.15325) | 2024/2025 | Split primitive helpers from compositional skills and promoted reusable records. | Do not inject a huge skill library into every provider call. |
| [Voyager](https://arxiv.org/abs/2305.16291) | 2023 | Minecraft actions can be executable programs improved through environment feedback. | Do not revive long, unbounded self-verification loops as the source of truth. |

## Memory Papers To Prioritize

| Reference | Date | Useful Signal | Repo Consequence |
| --- | --- | --- | --- |
| [MemGym](https://arxiv.org/abs/2605.20833) | 2026 | Evaluates memory during long-horizon agent execution rather than only chat recall. | Memory evaluation should be objective/task based: action count, verifier outcome, repeated-failure reduction. |
| [Useful Memories Become Faulty](https://arxiv.org/abs/2605.12978) | 2026 | Continuous LLM consolidation can corrupt useful memories; raw episodes stay valuable. | Preserve raw episodes first. Consolidation must be asynchronous, gated, and traceable. |
| [TriMem](https://arxiv.org/abs/2605.19952) | 2026 | Keep raw segments, extracted facts, and synthesized profiles together. | Use raw evidence refs plus compact facts/profiles; never replace evidence with summaries. |
| [AMA-Bench](https://arxiv.org/abs/2602.22769) | 2026 | Memory systems fail when they lack causality and objective information; similarity retrieval is lossy. | Retrieval should be objective/causal/symbolic first, embedding rerank second. |
| [MemoryArena](https://arxiv.org/abs/2602.16313) | 2026 | Agent memory matters when earlier actions and feedback must guide later actions. | Compare no-memory vs memory-assisted runs across dependent Minecraft objectives. |
| [LongMemEval-V2](https://arxiv.org/abs/2605.12493) | 2026 | Environment-specific experience includes workflows, state dynamics, and recurring gotchas. | Store Mineflayer gotchas such as target unreachable, wrong tool tier, GUI failure, and pickup race. |
| [Memp](https://arxiv.org/abs/2508.06433) | 2025 | Procedural memory should be built, retrieved, updated, corrected, and deprecated. | Action skill memory needs statuses, proof refs, failure refs, and deprecation. |
| [A-Mem](https://arxiv.org/abs/2502.12110) | 2025 | Linked atomic notes can evolve with tags, context, and relations. | Link episodic, procedural, semantic, and guardrail records instead of storing flat notes. |

## Updated Repo Direction

The right target is not a bigger memory brain. It is a memory substrate that
lets the LLM act more freely without letting it lie to itself.

The hot path should stay simple:

```text
objective
-> provider context with bounded retrieved memory
-> generated/direct action attempt or active action skill
-> Mineflayer helper events
-> current-run verifier
-> immutable episode
```

The slower sidecar path should improve memory:

```text
episode
-> reviewer diagnosis
-> semantic/procedural/social/guardrail candidates
-> guarded applier
-> indexed actor memory
-> future provider context
```

The LLM may propose code, memory writes, repairs, and action-skill promotion.
The runtime owns verification, evidence, indexing, and the boundary between
candidate and active state.

## Memory Shape For This Repo

Use typed, actor-owned memory:

- `episodic`: immutable objective/action attempts with pre-state, post-state,
  helper events, verifier result, diagnosis, and artifact refs;
- `procedural`: active action skills, direct trials, promoted procedures,
  guardrails, preconditions, effects, proof refs, and failure refs;
- `semantic`: world facts, Minecraft mechanics facts, resource locations,
  stations, storage, hazards, and confidence/status;
- `social`: requests, promises, resource transfers, shared/private ownership,
  obligations, and relationship evidence;
- `beliefs`: uncertain diagnoses with alternatives, confidence, expiry, and
  recheck conditions;
- `index`: objective signatures, item/block/entity signatures, causal links,
  spatial index, actor scope, status, and retrieval reasons.

Retrieval should answer: "what memory helps this actor with this objective
right now?" It should not answer: "what memories are semantically similar to
this prompt?"

## Near-Term Implementation Slice

1. Add a `MemoryRecord` schema and actor workspace path helpers for typed
   memory folders.
2. Convert direct generated objective reports into episodic memory records.
3. Add symbolic retrieval by actor scope, objective category, target item/block,
   required tool/station, diagnosis, verifier status, and stale/rejected state.
4. Replace provider `memory: string[]` with a typed memory packet while keeping
   a legacy tail during migration.
5. Extend per-actor reviewer output so completed trials can propose semantic
   facts, procedural candidates, guardrails, social events, and uncertain
   beliefs.
6. Keep consolidation asynchronous and evidence-linked. Do not block NPC turns
   on memory reflection.
7. Upgrade the dashboard from generic memory files to typed memory panels.

## Evaluation Standard

Memory is working only if it improves real Minecraft execution. Good first
checks:

- stale memory cannot satisfy a current-run objective;
- failed direct trials retrieve as guardrails, not successful procedures;
- memory-assisted runs repeat fewer known failures than no-memory runs;
- provider context stays within count/token budget;
- actor-private memory does not leak to another actor unless explicitly shared;
- social memory appears only after evidence-backed request, promise, transfer,
  or obligation events.

## Bottom Line

Recent papers make the project direction sharper:

```text
dense Mineflayer substrate, free LLM agent, typed evidence-linked memory
```

The repo should give the LLM more room to generate and adapt action code, not
less. The safeguard is not hand-authoring every action. The safeguard is
current-run verification, immutable evidence, typed diagnosis, and actor-owned
memory governance.
