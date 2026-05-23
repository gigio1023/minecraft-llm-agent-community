# Retrieval Mechanics and Vector DB Constraints

## The Retrieval Bottleneck
Recent studies, such as the diagnostic framework on memory bottlenecks (arXiv:2603.02473), reveal that the dominant factor in agent memory failure is **retrieval**, not utilization or writing strategy. 

- **Retrieval dominates performance:** Accuracy spans 20 points across different retrieval methods (e.g., BM25 vs. cosine vs. hybrid reranking), whereas sophisticated write strategies (like summarization or fact extraction) only affect accuracy by 3–8 points.
- **Top-K Failure Modes:** Failure analysis shows retrieval failure accounts for 11–46% of errors. Under BM25 with Extracted Facts, retrieval failure reached 46.3%. 
- **Lossy Compression is Harmful:** Sophisticated write strategies (summarizing episodes, extracting facts) often perform worse than storing raw, chunked text. Lossy compression discards conversational or environmental details that the LLM backbone could otherwise leverage. Raw chunked storage, which requires zero LLM calls, matches or outperforms expensive lossy alternatives.

## Vector DB Limitations
Vector databases rely on similarity-based retrieval (cosine distance, inner product), which inherently lacks causality and strict state tracking. In complex, long-horizon agent environments (as evaluated by AMA-Bench, arXiv:2602.22769), simply pulling the most semantically similar chunks fails to reconstruct the chronological or causal chain of events. 
- **Causality Blindness:** Similarity search might retrieve an early state of an inventory or task and ignore a later, causal event that negated it, leading to logical contradictions.
- **Semantic Drift:** Index-side approaches like key expansion accumulate noise and semantic drift over time if not gated by correctness feedback (arXiv:2602.05152).

## Causality Graphs as a Solution
To solve this, frameworks like AMA-Agent introduce a **Causality Graph** combined with tool-augmented retrieval. 
- Instead of flattening the trajectory into a vector index, the system extracts objective state changes, environment triggers, and task updates into a structured, machine-parsable graph.
- Removing the Causality Graph causes a massive ~25% relative performance drop in AMA-Bench tasks, demonstrating that causality-aware representations are strictly necessary for agent memory.
- Pure embedding similarity search is insufficient; agents need structured interfaces (tools) to traverse causal links rather than relying strictly on top-k vector similarity.
