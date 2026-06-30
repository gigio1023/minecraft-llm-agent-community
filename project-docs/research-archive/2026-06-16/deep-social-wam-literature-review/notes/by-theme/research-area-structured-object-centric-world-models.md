# Research area: structured, object-centric, relational, and neuro-symbolic world models

Lane 13 (G2) theme file. Source-backed; jargon defined on first use. Primary-source facts are
separated from interpretation, and "mechanically useful" is kept distinct from "research
contribution" throughout. Newcomer-readable and deliberately modest about maturity.

## What this area is (one line)

The research field that builds world models which predict TYPED STRUCTURED STATE over objects,
relations, and symbols (who/what/where, and how they interact) instead of predicting pixels.

## Why this lane exists (tie to the query)

The project's central bet is to predict structured social-material state (who has what, who owes
whom, what is now possible), not images. The WAM survey definition (arXiv 2605.12090, at
`<ROOT>/papers/latex/2605.12090/`) is modality-INDEPENDENT and explicitly includes an "implicit
physical representation" branch where future state is latent/structured, not pixels. The wave-1/2
theme files survey Minecraft/video world models and the world-model-vs-VLA debate, but none
surveys the field that builds world models over objects, relations, and symbols. This file
supplies that footing. The Minecraft/video frontier and the explicit-state argument (WildWorld,
Dreamer 4, Solaris) are covered in `minecraft-world-models.md`; this file does not redo them.

## Glossary (defined once)

- Object-centric representation: a state encoded as a SET of per-object vectors (often called
  "slots"), one per entity, rather than one global feature vector. Slots are exchangeable: any
  slot can bind to any object (Slot Attention, 2006.15055).
- Slot: one element of an object-centric representation; an "object file" that stores one
  object's properties (term from cognitive science, used by Slot Attention).
- Relational / graph dynamics: modeling change as MESSAGE PASSING on a graph whose nodes are
  entities and whose edges are relations; node-update and edge-update functions are shared across
  all nodes/edges (Interaction Networks 1612.00222; Graph Networks 1806.01261).
- Message passing: each edge computes a message from its two endpoint nodes; each node aggregates
  incoming messages (a permutation-invariant sum/pool) and updates its state. Repeating this M
  times propagates information M relational hops.
- Structured / symbolic state: state expressed in named, typed terms (entities, attributes,
  relations) that can be read and checked directly, as opposed to an opaque latent vector.
- Neuro-symbolic model: a model that combines a neural component (pattern learning) with an
  explicit symbolic component (rules/constraints that can be inspected and edited). Example:
  WALL-E (2410.07484) = a pretrained LLM plus a small set of learned symbolic rules.
- Entity abstraction: applying the SAME locally-scoped function to each entity symmetrically, so
  knowledge about one entity transfers to the same entity in a new context, and the model handles
  different numbers of entities than seen in training (OP3, 1910.12827).
- Disentanglement: separating distinct factors (here, distinct objects) into distinct parts of
  the representation, so they can vary and be predicted independently.
- World Model (WM) vs World Action Model (WAM): a WM predicts `p(o' | o, a)` (next state only); a
  WAM additionally couples action generation, `p(o', a | o, l)` (survey 2605.12090). Most papers
  in this lane are WMs (predict structured next state); the project would use such a predictor as
  the WAM's predictive component while the LLM proposes actions.

## Key works and sub-threads

### Thread A: object-centric world models (slots and contrastive structured models)

- Slot Attention (Locatello et al., NeurIPS 2020, 2006.15055). What it introduced: a simple,
  differentiable module that turns a CNN feature map into a SET of exchangeable slots via an
  iterative competitive attention (a learnable soft k-means over multiple rounds). Why it matters:
  it is the standard way to get an object-centric representation, and it "generalizes in a
  systematic way to unseen compositions, more objects, and more slots" (paper abstract). Tasks:
  unsupervised object discovery and supervised set-structured property prediction.
- C-SWM (Kipf, van der Pol, Welling, ICLR 2020, 1911.12247; deep-read, see
  `../by-paper/1911.12247-cswm-contrastive-structured-world-models.md`). What it introduced: a
  STRUCTURED world model trained CONTRASTIVELY with NO pixel-reconstruction loss. State is a set
  of per-object latents; transitions are a GNN that predicts per-object deltas; the loss is a
  TransE-style energy on `(state, action, next-state)` triples (scoring real triples above
  corrupted ones). Why it matters: it is the canonical demonstration that a world model can
  predict in object+relation latent space and be scored by RANKING (Hits@1, MRR) rather than
  pixels, and that the object factorization + GNN + contrastive loss each materially improve
  multi-step prediction and generalization to unseen object configurations.
- SAVi (Kipf et al., ICLR 2022, 2111.12594). What it introduced: a sequential (video) extension
  of Slot Attention that predicts optical flow and can be conditioned on object hints. Why it
  matters: extends object-centric representations to TIME, and shows conditioning the initial
  slots improves tracking and generalizes to novel objects/backgrounds/longer sequences.
- OP3 (Veerapaneni et al., CoRL 2019, 1910.12827; deep-read, see
  `../by-paper/1910.12827-op3-entity-abstraction-mbrl.md`). What it introduced: a fully
  probabilistic, entity-centric latent-variable model-based RL framework, enforcing ENTITY
  ABSTRACTION and framing object-to-slot binding as inference. Why it matters: on block stacking
  it generalizes to MORE objects than training and beats both a supervised oracle and a global
  video-prediction model 2-3x. It also articulates the symbolic-variable / continuous-data bridge.

### Thread B: graph-network dynamics (learned simulators over entities)

- Interaction Networks (Battaglia et al., NeurIPS 2016, 1612.00222). What it introduced: the
  first general-purpose, learnable physics engine; object- and relation-centric reasoning that is
  "analogous to a simulation." Why it matters: it is the genealogical root of learned relational
  dynamics, and showed accurate simulation of n-body, rigid, and non-rigid systems with automatic
  generalization to different numbers/configurations of objects and relations.
- Graph Networks position paper (Battaglia et al., 2018, 1806.01261; deep-read, see
  `../by-paper/1806.01261-relational-inductive-biases-graph-networks.md`). What it introduced: the
  unifying GRAPH NETWORK (GN) block (node/edge/global update functions + permutation-invariant
  aggregation) and the argument that COMBINATORIAL GENERALIZATION needs RELATIONAL INDUCTIVE
  BIASES. Why it matters: it names why structured prediction generalizes (entities/relations are
  reusable building blocks) and gives the single formalism the other works instantiate.
- GNS (Sanchez-Gonzalez et al., ICML 2020, 2002.09405; deep-read, see
  `../by-paper/2002.09405-gns-graph-network-simulators.md`). What it introduced: "Graph
  Network-based Simulators," an encode-process-decode GN that simulates fluids/solids/deformables
  via learned message passing. Why it matters: it shows relational message passing SCALES (trained
  on ~2.5k particles, generalizes to 28k at test time and to longer horizons) and identifies the
  number of message-passing steps and rollout-noise injection as the determinants of long-range
  accuracy. MeshGraphNets (2010.03409) and "graph networks as learnable physics engines"
  (1806.01242) are the mesh and control-oriented siblings (abstract-level here).

### Thread C: neuro-symbolic and object-centric model-based control

- WALL-E (Zhou et al., ICLR 2025, 2410.07484; deep-read, see
  `../by-paper/2410.07484-walle-world-alignment-rule-learning.md`). What it introduced: a
  NEURO-SYMBOLIC world model = pretrained LLM + a small set of learned symbolic rules, induced and
  pruned (maximum-coverage) gradient-free from trajectory-vs-prediction mismatch, used inside a
  model-predictive-control loop. Why it matters: it is the closest existing system to "LLM
  proposes; a structured/rule layer checks consequences," and it runs in Minecraft. WALL-E 2.0
  (2504.15785) deepens the neuro-symbolic learning (abstract-level here).
- OC-STORM / "Objects matter" (Zhang et al., 2025, 2501.16443). What it introduced: an
  object-centric model-based RL framework that conditions a learned world model on object
  representations from a pretrained segmenter. Why it matters: it gives recent evidence that
  object-centric state DIRECTS MODEL CAPACITY to task-critical entities and improves dynamics
  prediction and sample efficiency (beats the STORM baseline on Atari-100k; SOTA on a visually
  complex game). FOCUS (2307.02427), object-centric language-guided manipulation (2503.06170), and
  entity-centric RL from pixels (2404.01220) are the manipulation-oriented siblings (abstract-level).
- Relational reasoning roots: Relation Networks (Santoro et al., NeurIPS 2017, 1706.01427) and
  Neural Production Systems (Goyal et al., NeurIPS 2021, 2103.01937, rule-governed visual
  dynamics) bracket the thread from learned relations to learned rules (abstract-level).

## Maturity and open problems (be honest)

- Strong where state is already factorable. Object-centric and graph-dynamics methods are
  well-proven on TOY or STRUCTURED domains: grid worlds, 3-body physics, particle fluids, block
  stacking, Atari (C-SWM 1911.12247; GNS 2002.09405; OP3 1910.12827). They generalize across
  object counts and configurations, which is exactly the property a variable-population social
  world needs (interpretation).
- Weaker on messy open worlds. Slot-based perception still struggles on cluttered real scenes
  (the broader object-centric-learning literature, e.g. zero-shot OC 2408.09162 and stability work
  2303.17842, exists precisely because of this); C-SWM itself flags it cannot disambiguate
  identical instances (1911.12247 limitations). Where these break: high visual clutter, many
  identical objects, and long-horizon error accumulation (GNS needs noise injection to stay stable).
- Determinism and memory gaps. C-SWM is deterministic and Markov, with no memory mechanism
  (1911.12247 limitations). A social world is stochastic, partially observed, and memory-laden
  (obligations persist), so a structured social predictor needs stochastic + memory extensions
  that the cornerstone papers leave as future work.
- Perception is not the project's bottleneck (interpretation). Most of this lane learns entities
  from PIXELS. In a Mineflayer runtime the entities/relations are already typed by the runtime, so
  the project inherits the representation for free and only needs the DYNAMICS (transition) and
  SCORING parts. This makes the area more applicable here than its open-world perception
  difficulty would suggest.
- No structured world model predicts social-material state. Across this lane the predicted state
  is physical (positions, contacts, accelerations) or task-latent; possession, claims, obligation,
  trust, and reputation are absent. This is the same empty cell that `minecraft-world-models.md`
  finds on the Minecraft/video side, seen from the representation side.

## Mapping to the 4 WAM layers

This area supplies the REPRESENTATION the project would predict in, so it is cross-cutting. The
typed deltas the project cares about (inventory, possession, obligation) ARE structured/relational
state, so the same machinery spans all four layers. The table notes how each layer maps onto the
object-centric/graph formalism, and which sources speak to it.

| WAM layer | Object/relation/symbol mapping | Sources that inform it | Demonstrated or interpretation |
|---|---|---|---|
| Physical | nodes = actors/blocks/items; edges = contact/proximity/reachability; deltas = position, durability, block/inventory change | C-SWM 1911.12247, GNS 2002.09405, Interaction Networks 1612.00222, OP3 1910.12827, OC-STORM 2501.16443 | Demonstrated (physical dynamics) |
| Material / economic | nodes = actors + items + containers/stations; edges = holds, controls, inside, borrowed-from; deltas = possession/access/scarcity | C-SWM (per-object factored state), GN block global attr 1806.01261, FOCUS 2307.02427, entity-centric RL 2404.01220 | Interpretation (no paper models possession) |
| Social | nodes = actors; edges = request/promise/owe/trust/reputation; deltas = obligation created, trust up/down, claim asserted | GN block 1806.01261 (formalism), WALL-E 2410.07484 (rule learning), Relation Networks 1706.01427 | Interpretation (no structured WM models social state) |
| Institutional / settlement | global attribute `u` = norms/conventions/roles/settlement state; node/edge summaries roll up to it | GN block global update 1806.01261, Neural Production Systems 2103.01937 (rules) | Interpretation only |

Dependency to keep visible (per the shared contract): physical predictions must be reliable before
social ones are meaningful. A social claim ("Bob can now mine") rests on a physical fact ("Bob holds
a pickaxe with durability > 0"). In the graph formalism this is a multi-hop relational inference
(item-possession edge -> tool-durability node -> capability), exactly the kind GNS shows depends on
the number of message-passing steps (2002.09405).

## Relevance to the original query

Original query: can a hierarchical action-conditioned world model predict and evaluate how
Minecraft actions transform physical state, material economy, social relations, memory, and future
action opportunities in an embodied open world? This area is the natural HOME for the structured
answer, and the line between borrowing and claiming is sharp.

- Mechanically useful (engineering this repo can borrow):
  - The representation: state as a SET of typed entity nodes plus typed relation edges (Slot
    Attention 2006.15055, C-SWM 1911.12247, GN block 1806.01261). The repo's vocabulary
    (personal possession, material claim, public affordance, weak commons, obligation/credit) is
    already an entity-relation graph.
  - Dynamics as message passing: predict per-entity and per-edge deltas by propagating messages
    over relations (GNS 2002.09405, Interaction Networks 1612.00222). Multi-hop propagation is how
    a consequence reaches third parties ("Alice lends the only pickaxe -> Carol's plan blocked").
  - Contrastive / ranking-based scoring with NO renderer (C-SWM's Hits@1/MRR over candidate
    next-states, 1911.12247): score a predicted social-material delta by ranking the verifier-logged
    true post-state above corrupted alternatives. This fits an advisory predictor evaluated against
    evidence, with no pixel generation.
  - Entity-count generalization (OP3 1910.12827, Slot Attention 2006.15055): handle a variable
    number of actors/items/claims, which a settlement needs.
  - Neuro-symbolic rule learning from mismatch (WALL-E 2410.07484): when a predicted delta diverges
    from the logged delta, induce a corrective typed rule; keep the rule set minimal and inspectable.
- Research contribution (what would be genuinely new, and the overclaim to avoid):
  - NO existing structured/object-centric/relational/neuro-symbolic world model predicts
    SOCIAL-MATERIAL state (possession, claim, obligation, trust, reputation, memory commitment).
    Every cornerstone here predicts physical or task-latent state. Building an object-centric /
    relational predictor whose nodes and edges ARE the material-economy and social vocabulary, and
    whose deltas ARE obligation/trust/claim changes scored against verifier evidence, is the
    defensible novel claim. The representation and dynamics machinery is borrowed; the social-material
    SEMANTICS predicted in it is the contribution.
  - Overclaim to avoid: do not say these methods "do social modeling" (they do not), do not present
    the predictor as runtime authority (the repo rule keeps it advisory; WALL-E's MPC-as-authority
    loop and Dreamer-style RL-in-imagination are the patterns NOT to copy), and do not frame the
    evidence/logging infrastructure as the contribution (it is support).
