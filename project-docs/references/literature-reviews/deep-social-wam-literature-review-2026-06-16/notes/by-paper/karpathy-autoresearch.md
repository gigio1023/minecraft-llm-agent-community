# Karpathy autoresearch (the term origin; coding-agent autoresearch as a digital phenomenon)

- **title**: autoresearch ("AI agents running research on single-GPU nanochat training automatically")
- **authors**: Andrej Karpathy
- **year**: 2025-2026 (repo)
- **venue/source**: GitHub repo (not a paper). This is the origin of the term "autoresearch" that ENPIRE (notes/by-paper/enpire.md) adopts (ENPIRE ref 22).
- **arxiv_id**: none (repo/docs)
- **urls**: https://github.com/karpathy/autoresearch
- **source availability**: repo/docs (README fetched and read 2026-06-17; code not deep-read)

## Primary-source facts (from README)

- **What it is**: give an AI agent a small but real LLM training setup (nanochat) and let it experiment autonomously overnight. "It modifies the code, trains for 5 minutes, checks if the result improved, keeps or discards, and repeats," so the user wakes up to a log of experiments and a better model.
- **The loop**: the agent edits `train.py`, runs a 5-minute training experiment, evaluates the validation metric, and retains or discards the change based on whether the metric improved.
- **Design philosophy**: "one GPU, one file, one metric." Single file to modify, fixed time budget, self-contained (no distributed training, no complex configs, minimal dependencies beyond PyTorch). Requires a single NVIDIA GPU.
- **Why experiments are comparable**: a FIXED time budget per experiment makes results comparable regardless of what the agent changes (model size, batch size, architecture); the search finds the best model for the platform within the time budget.
- **The metric**: `val_bpb` (validation bits per byte), "lower is better, and vocab-size-independent so architectural changes are fairly compared." Success = reducing val_bpb.
- **Multi-agent / git**: the README mentions multi-agent only as a theoretical possibility ("add more agents to the mix"); the documented design is single-agent. No git/branch coordination in the README (this is where ENPIRE extends the idea: Git-coordinated subagent fleet).
- **License**: MIT. No specific results/benchmarks stated in the README.
- **Metric-gaming safeguards**: the README contains NO discussion of preventing the agent from gaming/cheating the metric.

## Interpretation (flagged as inference)

- This repo is the cleanest, smallest statement of the DIGITAL autoresearch pattern that this whole wave sits on: a coding agent hill-climbs an external, automatically-computed metric (val_bpb) by editing code under a fixed budget, keeping improvements. ENPIRE explicitly extends this to the physical world; SICA (2504.15228) extends it to editing the agent's own scaffold; AIDE (2502.13138) is the tree-search inner loop; MLE/SWE/RE-bench are the scored arenas.
- Two design choices are directly reusable and modest. (1) "One metric, fixed budget makes experiments comparable" is the same discipline the repo needs to compare two autoresearch runs of a social scenario (the repo's open problem is that a SOCIAL scenario has no clean reset/fixed-budget-comparable metric, per the wave-4 sibling). (2) val_bpb being vocab-independent so "architectural changes are fairly compared" is the analog of needing a verifier whose label does not shift when the candidate changes shape.
- The honest gap to flag: even this canonical autoresearch has no anti-gaming safeguard, because val_bpb on a held-out set is hard to game and the agent does not control the metric. That is exactly the property the repo must preserve (the agent must not control or be able to alter the verifier), and exactly what breaks once the success signal becomes contestable (social layers).

## Mechanically useful vs research contribution

- **Mechanically useful**: the minimal autoresearch loop skeleton (edit code, run a fixed-budget trial, keep-or-discard on an external metric) as the smallest reference for the repo's advisory-WAM loop; the "fixed budget makes runs comparable" and "metric must be invariant to candidate shape" design rules.
- **Not a contribution to copy**: this is a tool/demo, not a research result; there is nothing to claim as a contribution. It is the lineage marker that names the phenomenon.
- **Honest bound**: it works because nanochat val_bpb is a clean, cheap, uncheatable held-out metric and one experiment resets trivially. The repo's Physical/Material layers can approximate this; its Social/Institutional layers cannot (no cheap clean reset, no single invariant metric), which is the central limit on porting autoresearch upward.

## WAM layer(s) informed

Method-level lineage marker, cross-layer. Names the digital autoresearch phenomenon and supplies the minimal loop + the two design invariants (fixed comparable budget; candidate-shape-invariant external metric) that the repo's advisory-WAM loop should keep, while marking the social-layer reset/metric gap as the limit.
