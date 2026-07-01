# Lane 13 (G2): Structured, object-centric, relational, and neuro-symbolic world models

Read `prompts/00-shared-lane-contract.md` then `prompts/wam-deep-00-contract-addendum-wave3.md`
first. You are Lane 13. Manifest fragment: `raw-search-results/lane-13-manifest.jsonl`.
Owned theme: `notes/by-theme/research-area-structured-object-centric-world-models.md`.

## Why this area (tie to the query)

This is the technical heart of the project's central bet: predict TYPED STRUCTURED STATE (who has
what, who owes whom, what is now possible), not pixels. The WAM survey's definition is
modality-independent and includes an "implicit physical representation" branch, but the wave-1/2
files do not survey the research field that builds world models over OBJECTS, RELATIONS, and
SYMBOLS. This lane supplies that footing: the literature on object-centric, relational/graph, and
neuro-symbolic world models that predict structured state.

## What to nail down (source-backed, taught plainly)

- Define: object-centric representation (slots), relational/graph dynamics (entities + relations,
  message passing), structured/symbolic state, neuro-symbolic model, disentanglement.
- The threads: (a) object-centric world models (slots, contrastive structured models); (b) graph
  network dynamics / learned simulators over entities; (c) neuro-symbolic and relational RL.
- Why structured prediction is cheaper and more checkable than pixels for control, and how it
  handles hidden state (cite WildWorld in `minecraft-world-models.md`, do not redo it).
- Honest maturity: object-centric methods are strong on toy/structured domains, less proven on
  messy open worlds; say where they break.

## Seed sources (verify IDs before fetching)

- Object-centric WMs: C-SWM "Contrastive Learning of Structured World Models" 1911.12247 (deep-read);
  Slot Attention 2006.15055; SAVi 2111.12594 (verify); OP3 / entity abstraction (verify).
- Relational/graph dynamics: Interaction Networks 1612.00222; "Learning to Simulate Complex Physics
  with Graph Networks" (GNS) 2002.09405 (deep-read); Graph Networks as learnable physics engines
  1806.01242 (verify); NerveNet or relational RL (verify).
- Neuro-symbolic / structured-latent world models: a representative recent work (e.g. structured
  world models for planning; verify and pick 1-2).
- Object-centric for RL / model-based control (e.g. object-centric Dreamer variants if found).

## Layer tie and deliverable

Cross-cutting: this is the REPRESENTATION the project would predict in, so it touches all 4 layers
(typed deltas for inventory/possession/obligation are exactly structured/relational state). In the
theme file give the 4-layer mapping and a closing "relevance to the original query": how
object-centric/relational/graph state is the natural home for a structured social-material WAM, what
is mechanically useful (the representation + dynamics-as-message-passing idea) vs research
contribution (no existing structured WM predicts social-material state).

Write: the theme file, by-paper notes for cornerstones (C-SWM and GNS at minimum), manifest +
search-log fragments, lane brief `notes/subagent-briefs/lane-13-structured-object-centric-world-models.md`.
Tag rows `world-model`, `physical-wam`, `material-wam` as apt.
