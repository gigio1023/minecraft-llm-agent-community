# Lane 13 brief: structured, object-centric, relational, and neuro-symbolic world models (G2)

Lane name: structured / object-centric / relational / neuro-symbolic world models.
Owned theme file: `../by-theme/research-area-structured-object-centric-world-models.md`.
Manifest: `../../raw-search-results/lane-13-manifest.jsonl` (18 rows).
Search log: `../../raw-search-results/lane-13-search-log.md`.

## Sources reviewed (count + list)

18 sources logged. 9 LaTeX-fetched and read at method level; SAVi read at abstract+method; the
rest abstract-level for the long tail.

Deep-read (LaTeX, with by-paper notes for the 5 most load-bearing):
- 1911.12247 C-SWM (note written) [contrastive structured world model, object slots + GNN]
- 2002.09405 GNS (note written) [graph-network learned physics simulator, message passing]
- 1612.00222 Interaction Networks [first general-purpose learnable physics engine]
- 2006.15055 Slot Attention [the standard object-centric representation module]
- 1806.01261 Graph Networks position paper (note written) [GN block + relational inductive bias]
- 2410.07484 WALL-E (note written) [neuro-symbolic LLM+rules world model, Minecraft]
- 1910.12827 OP3 (note written) [entity-abstraction probabilistic MBRL]
- 2501.16443 OC-STORM "Objects matter" [object-centric MBRL improves RL]
- 2111.12594 SAVi [Slot Attention extended to video]

Abstract-level (manifest rows): 2010.03409 MeshGraphNets, 1806.01242 GN-as-physics-engines,
2307.02427 FOCUS, 2503.06170 OC language-guided manipulation, 2404.01220 entity-centric RL,
2504.15785 WALL-E 2.0, 1706.01427 Relation Networks, 2305.14229 Provably-Learning-OC,
2103.01937 Neural Production Systems.

## Strongest findings (source-backed)

1. Structured prediction works without pixels and is scored by ranking. C-SWM (1911.12247) trains
   a world model over object slots + a GNN transition with a TransE-style contrastive loss and NO
   reconstruction, scored by Hits@1 / MRR in latent space, reaching ~99-100% multi-step accuracy
   on structured grid worlds where pixel/VAE baselines collapse. This is a ready template for an
   evidence-scored social-material predictor.
2. Dynamics-as-message-passing scales and generalizes combinatorially. GNS (2002.09405) trains on
   ~2.5k particles and generalizes to 28k and longer horizons; long-range accuracy is governed by
   the number of message-passing steps. Interaction Networks (1612.00222) and the GN position paper
   (1806.01261) supply the genealogy and the formalism (entities + relations + shared update
   functions) and the argument that relational inductive biases drive combinatorial generalization.
   Multi-hop message passing is how a consequence reaches third parties (the lend-the-only-pickaxe
   case).
3. A neuro-symbolic Minecraft world model already exists, but as planning authority, not advisory.
   WALL-E (2410.07484) builds its world model as a pretrained LLM plus a small set of learned
   symbolic rules (induced/pruned from prediction-vs-reality mismatch) and uses it inside MPC.
   Mechanically reusable (rule learning from mismatch, minimal inspectable rule set); architecturally
   a contrast, since the project keeps the WAM advisory rather than letting it select actions.

## Weak or uncertain claims (could not fully verify)

- WALL-E's quantitative Minecraft gains (+15-30% success, 8-20 fewer replanning rounds, 60-80% of
  tokens) and OC-STORM's Atari-100k / Hollow-Knight numbers are taken from the papers' own tables;
  not independently reproduced here. Treat as unverified report claims.
- 1806.01242 (GN as physics engines) and 2111.12594 (SAVi) LaTeX was fetched but read at
  abstract/method level only; method details beyond the abstract are not deeply verified.
- Two seed IDs (1612.00222 Interaction Networks, 1806.01242) could not be confirmed via the arXiv
  listing page through WebFetch (thin metadata); both were confirmed by title in the fetched LaTeX
  (`\title{Interaction Networks ...}`) and by the canonical title match. No fabricated IDs.

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful: represent state as typed entity nodes + typed relation edges; predict
  per-entity/per-edge deltas via message passing; score predictions by ranking against
  verifier-logged ground truth (no renderer); handle a variable number of actors/items (entity
  abstraction); induce minimal inspectable rules from prediction-vs-evidence mismatch. The repo's
  material-economy vocabulary (personal possession, material claim, public affordance, weak commons,
  obligation/credit) is already an entity-relation graph, so it slots into this formalism directly.
- Research contribution: no existing structured/object-centric/relational/neuro-symbolic world
  model predicts SOCIAL-MATERIAL state. The novel claim is a predictor whose nodes/edges ARE the
  social-material vocabulary and whose deltas ARE obligation/trust/claim changes, evaluated against
  evidence. The representation and dynamics are borrowed; the social-material semantics is the
  contribution. Keep it advisory (do not copy WALL-E's MPC-as-authority or Dreamer-style
  RL-in-imagination), and do not frame the logging/evidence tooling as the contribution.

## Recommended next questions

1. Stochastic + memory extension: which object-centric/relational models handle non-Markov,
   partially observed, memory-laden state (obligations persist), since C-SWM is deterministic+Markov?
2. Edge typing: in Minecraft the relations (holds, controls, inside, owes, can-reach) are already
   typed by the runtime; is a heterogeneous-relation GN (typed edges) the right formalism, and does
   it remove the need for object discovery entirely?
3. Scoring social deltas: can the C-SWM ranking metric be adapted so a "true" post-state is the
   verifier-logged social-material delta and "corruptions" are plausible alternative deltas, giving a
   pixel-free transition-prediction-accuracy metric for the benchmark families in the research frame
   (`borrowed_tool_v1`, `claimed_chest_v1`, etc.)?
4. Rule learning from verifier mismatch: can WALL-E-style rule induction run advisory-only, emitting
   typed corrective rules for human review rather than feeding an MPC controller?
