# Memory Persistence Semantics and Decoupling Math

## The Missing Knowledge Layer
Current cognitive architectures for LLM agents (like CoALA and JEPA) conflate different types of memory. A recent survey on the "Missing Knowledge Layer" (arXiv:2604.11364) identifies a category error: systems apply cognitive decay to factual claims, or treat facts and episodic experiences with identical update mechanics. 

To solve this, memory must be mathematically and semantically decoupled into a four-layer architecture, each with fundamentally different persistence semantics:
1. **Knowledge:** Indefinite supersession (facts replace old facts entirely).
2. **Memory (Episodic):** Ebbinghaus decay (experiences fade over time unless reinforced).
3. **Wisdom/Rules:** Evidence-gated revision (heuristics only change when statistically significant contrary evidence is gathered).
4. **Intelligence (Context):** Ephemeral inference (discarded immediately after the task).

## Decoupling Math and Advanced Architectures

### Fisher-Rao Quantization-Aware Distance (FRQAD)
The *SuperLocalMemory V3.3* architecture (arXiv:2604.04514) introduces rigorous mathematical frameworks for local-first agent memory, moving away from simple cosine similarity. 
- It uses **FRQAD**, a new metric on the Gaussian statistical manifold, which achieves 100% precision at preferring high-fidelity embeddings over quantized ones (compared to 85.6% for cosine similarity). This allows the system to compress memory mathematically without destroying the semantic topology.

### Ebbinghaus Adaptive Forgetting
The same architecture implements Ebbinghaus Adaptive Forgetting coupled with progressive embedding compression. Instead of a hard FIFO context window, memory items decay according to a mathematical forgetting curve. This lifecycle-aware quantization increases discriminative power by 6.7x, proving that biological forgetting functions can be formalized into vector constraints to improve signal-to-noise ratios.

### MemOS: Memory Operating System
Another approach to decoupling is **MemOS** (arXiv:2507.03724), which treats memory as a manageable system resource via "MemCubes." 
- MemCubes encapsulate content alongside metadata (provenance, versioning).
- They allow memory to be migrated across temporal scales (from ephemeral activation-based memory to persistent plain-text, and eventually fused into parameter-level updates).
- This separation prevents the catastrophic noise accumulation seen in stateless RAG systems.
