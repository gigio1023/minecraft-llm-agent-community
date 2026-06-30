# Lane 13 search log (structured / object-centric / relational / neuro-symbolic world models)

Date: 2026-06-16. All commands run from the review ROOT. HF CLI first, then web for
ID verification. arXiv LaTeX fetched with `scripts/fetch_arxiv_latex.sh`.

## 1. ID verification (HF papers search + arXiv abstract pages)

- `hf papers search "Contrastive Learning of Structured World Models" --limit 5`
  Did NOT surface 1911.12247 (returned unrelated contrastive-learning papers). Verified
  separately by fetching `https://arxiv.org/abs/1911.12247`: confirmed C-SWM (Kipf, van der
  Pol, Welling, ICLR 2020). Seed ID correct.
- `hf papers search "Object-Centric Learning with Slot Attention" --limit 5`
  Top hit = 2006.15055, exact title. Seed ID correct.
- `hf papers search "Learning to Simulate Complex Physics with Graph Networks" --limit 5`
  Top hit = 2002.09405, exact title (GNS). Seed ID correct. Also surfaced MeshGraphNets
  2010.03409 (long-tail).
- `hf papers search "Interaction Networks for Learning about Objects Relations and Physics"`
  Did NOT surface 1612.00222 (2016 paper, thin HF indexing). Web fetch of the abstract page
  was inconclusive on metadata, so verification was completed from the fetched LaTeX:
  `\title{Interaction Networks for Learning about Objects, Relations and ...}`. Seed ID correct.
- `WebFetch https://arxiv.org/abs/2111.12594`: confirmed SAVi = "Conditional Object-Centric
  Learning from Video" (Kipf et al., ICLR 2022). Seed ID correct.
- `WebFetch https://arxiv.org/abs/1806.01242`: title matches "Graph networks as learnable
  physics engines for inference and control"; metadata thin on the listing page, treated as
  confirmed via title + later LaTeX fetch.
- `WebSearch "OP3 Entity Abstraction in Visual Model-Based Reinforcement Learning"`:
  corrected the seed (brief said "verify OP3"): the OP3 paper is 1910.12827 (Veerapaneni et
  al., CoRL 2019), code at github.com/jcoreyes/OP3. NOT 1910.x guessed; verified ID.

## 2. Thread discovery (HF papers search)

- `hf papers search "object-centric world model reinforcement learning" --limit 6`
  -> 2501.16443 (OC-STORM, "Objects matter"), 2307.02427 (FOCUS), 2503.06170 (OC language-
  guided manipulation), 1811.05432 (OC policies driving). Picked first three as on-thread.
- `hf papers search "neuro-symbolic world model planning" --limit 6`
  -> 2504.15785 (WALL-E 2.0). Then `hf papers search "WALL-E World Alignment Rule Learning LLM
  agents"` -> 2410.07484 (WALL-E original) and 2504.15785 (2.0). Picked 2410.07484 for deep-read
  (neuro-symbolic LLM world model, Minecraft).
- `hf papers search "Deep Reinforcement Learning with Relational Inductive Biases"` ambiguous;
  `hf papers search "Relational Deep Reinforcement Learning relational reasoning agent"`
  -> 1706.01427 (Relation Networks, Santoro et al.), 1806.01261 (GN position paper). Confirmed
  the GN position paper ID 1806.01261.
- `hf papers search "object-centric representation learning survey"`
  -> 2305.14229 (Provably Learning Object-Centric Representations) for the maturity/theory note.
- `hf papers search "structured object dynamics graph neural network model-based planning"`
  -> mostly robot-manipulation graph-dynamics (2410.18912, 2506.15680, 2312.12791). Logged as
  context, not deep-read (covered conceptually by GNS + Interaction Networks).
- `hf papers info 2307.02427` -> confirmed FOCUS metadata (Ferraro, Mazzaglia, Verbelen, Dhoedt).

## 3. LaTeX fetches (LaTeX-first rule)

```
bash scripts/fetch_arxiv_latex.sh 1911.12247 cswm-contrastive-structured-world-models   # tex x2
bash scripts/fetch_arxiv_latex.sh 2002.09405 gns-graph-network-simulators                # tex x1
bash scripts/fetch_arxiv_latex.sh 1612.00222 interaction-networks                        # tex x2
bash scripts/fetch_arxiv_latex.sh 2006.15055 slot-attention                              # tex x2
bash scripts/fetch_arxiv_latex.sh 1806.01242 graph-networks-physics-engines              # tex x19
bash scripts/fetch_arxiv_latex.sh 2111.12594 savi-conditional-object-centric-video       # tex x1
bash scripts/fetch_arxiv_latex.sh 1806.01261 relational-inductive-biases-graph-networks  # tex x3 (content in sections/)
bash scripts/fetch_arxiv_latex.sh 2410.07484 walle-world-alignment-rule-learning         # tex x2
bash scripts/fetch_arxiv_latex.sh 2501.16443 objects-matter-oc-world-models-rl           # tex x3
bash scripts/fetch_arxiv_latex.sh 1910.12827 op3-entity-abstraction-mbrl                 # tex x12 (content in src/)
```

All returned `latex=tarball_extracted`. Metadata written to `papers/metadata/<id>.json`.

## 4. Deep-read (LaTeX) vs abstract-level

- Deep-read (read method + experiments + limitations): 1911.12247 (C-SWM), 2002.09405 (GNS),
  1612.00222 (Interaction Networks), 2006.15055 (Slot Attention), 1806.01261 (GN position
  paper), 2410.07484 (WALL-E), 1910.12827 (OP3), 2501.16443 (OC-STORM). SAVi 2111.12594 LaTeX
  fetched, read at abstract+method level (extension of Slot Attention to video, no separate note).
- Abstract-level (manifest row only): 2010.03409 (MeshGraphNets), 1806.01242 (GN physics
  engines, LaTeX present but noted at abstract level), 2307.02427 (FOCUS), 2503.06170,
  2404.01220, 2504.15785 (WALL-E 2.0), 1706.01427 (Relation Networks), 2305.14229, 2103.01937
  (Neural Production Systems).

## 5. Notes on duplication

- Did NOT re-survey WildWorld, Dreamer 4, MineWorld, Solaris: covered in Lane 1
  `notes/by-theme/minecraft-world-models.md`. Cited there for the explicit-state argument and
  the Minecraft social gap. This lane supplies the OBJECT/RELATION/SYMBOL representation field
  that those Minecraft/video files do not cover.
- Cross-checked source-manifest.jsonl before fetching: none of my seed IDs were already logged.
