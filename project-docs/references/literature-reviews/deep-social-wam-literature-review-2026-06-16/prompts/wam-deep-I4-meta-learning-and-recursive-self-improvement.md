# Lane 27 (I4): Meta-learning, recursive self-improvement, and self-referential systems

Read first: `prompts/00-shared-lane-contract.md`, then
`prompts/wam-deep-00-contract-addendum-wave5.md`. This brief layers scope on top.

## Area
The theory and lineage of systems that improve their own learning process: meta-learning (learning
to learn), self-referential systems that modify their own update rule, and the recursive
self-improvement idea. This is the conceptual backbone of "자가발전". Central question: what does it
formally mean for a system to improve itself, and what is proven vs aspirational?

## Seeds (verify ids before fetching)
- Goedel machine (Schmidhuber, ~2003): a self-referential, provably-optimal self-improver (provably
  beneficial self-rewrites). Find the canonical reference; verify.
- MAML (Finn et al, 1703.03400): model-agnostic meta-learning. RL^2 (Duan et al, 1611.02779) and
  Learning to reinforcement learn (Wang et al, 1611.05763): meta-RL.
- Self-referential meta-learning: "Meta Learning Backpropagation And Improving It" (Kirsch &
  Schmidhuber, 2012.14905); "A Modern Self-Referential Weight Matrix That Learns to Modify Itself"
  (Irie et al, 2202.05780). Verify.
- AI-GAs (Clune, 1905.10985): AI-generating algorithms, the three pillars (meta-learn architectures,
  meta-learn learning algorithms, generate effective environments).
- Meta-learning survey (Hospedales et al, 2004.05439). STOP self-taught optimizer (2310.02304):
  modern recursive code self-improvement (cite I2).
- Cite Darwin Godel Machine (2505.22954, owned by H1) as the modern empirical instance; do not redo it.

## Owned deliverables
- Theme: `notes/by-theme/research-area-meta-learning-and-recursive-self-improvement.md`.
- by-paper notes (at least MAML, one self-referential/Goedel-machine source, AI-GAs).
- `raw-search-results/lane-27-manifest.jsonl`, `raw-search-results/lane-27-search-log.md`,
  `notes/subagent-briefs/lane-27-meta-learning-and-recursive-self-improvement.md`.

## Deconflict
- H1 owns DGM as a working loop and H5 owns RLVR/self-play. You own the THEORY and lineage
  (meta-learning, self-reference, Goedel machine, AI-GAs, recursive self-improvement). I6 owns the
  limits/feasibility synthesis; you supply the mechanisms, I6 judges whether they compound.

## WAM tie + thesis
Be especially honest here: recursive self-improvement is mostly theoretical or small-scale; the
Goedel machine is provably-optimal but practically unrealized, and most "self-improvement" in
practice is one or two rounds, not an unbounded recursion. Land the tie: AI-GAs' three pillars
(meta-learn architecture, meta-learn the learning algorithm, generate environments) is a clean lens
for what an autoresearch loop over the repo could and could not automate, and the modest claim is
that the repo targets pillar-three-style scenario generation plus verifier-graded recipe tuning, not
true recursive self-improvement. Flag intelligence-explosion framing as out of scope and unsupported.
