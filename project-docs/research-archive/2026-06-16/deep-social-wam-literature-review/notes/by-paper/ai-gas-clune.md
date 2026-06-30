# AI-GAs - Clune 2019 (the three-pillars lens)

- **title**: AI-GAs: AI-generating algorithms, an alternate paradigm for producing general artificial intelligence
- **authors**: Jeff Clune (Uber AI Labs / OpenAI at the time)
- **year**: 2019 (v1 27 May 2019; revised 1 Feb 2020)
- **venue/source**: arXiv position paper
- **arxiv_id**: 1905.10985
- **urls**: paper https://arxiv.org/abs/1905.10985 ; no code (position paper). Cites the author's own POET (1901.01753) and Generative Teaching Networks (GTN) as first steps on pillar 3.
- **source availability**: latex (extracted AI-GAs.tex, 434 lines, deep-read)

## Primary-source facts (LaTeX-verified)

- **Thesis (abstract, AI-GAs.tex:62)**: instead of hand-designing the components of intelligence ("the manual AI approach"), build an *AI-generating algorithm* that "automatically learns how to produce general AI," modeled on how Darwinian evolution produced human intelligence on Earth.
- **The Three Pillars (AI-GAs.tex:62, 185-188)**, the part this lane uses as a lens:
  1. **Meta-learning architectures** (the most studied; neural architecture search). "We can reasonably assume the trend will continue and that searching for architectures will replace the hand-designing of architectures."
  2. **Meta-learning the learning algorithms themselves** (often just called meta-learning; RNNs/plastic nets that learn their own update rule). Cites RL^2, Learning to reinforcement learn, differentiable plasticity.
  3. **Generating effective learning environments and training data** (the autocurriculum pillar). "There has been very little research into the Third Pillar... It is the least-studied, least-understood, and likely hardest of the three pillars." Clune predicts "more history-making discoveries await in this pillar than the other two."
- **Pillar 3 detail (AI-GAs.tex:262-347)**: an environment is parameterized (theta_E) and co-evolved with agents (theta_A); POET is the demonstration (an environment vector + an agent vector, complexify the environment once the agent solves it). A "Darwin Complete" environment encoding is one that can generate *any possible* learning environment (analogue of Turing Complete). Generative Teaching Networks (GTN) are a fully-expressive environment/data generator. Warning he raises himself: a fully-expressive generator "may prove *too* expressive and thus make searching their vast search space intractable"; constraining environments to a physics simulator narrows the search and increases real-world relevance.
- **Honest hedges in the paper**: AI-GAs "will require a lot of computation, and therefore may not be practical in time" (conclusion, AI-GAs.tex:419); pillar 3 "may require orders of magnitude more compute than we have at present" (AI-GAs.tex:345); the only existence proof is Darwinian evolution on Earth (AI-GAs.tex:347). It is explicitly a position/agenda paper, not a result.
- **Relation to AIXI/Solomonoff (AI-GAs.tex:367)**: even if pillars 1 and 2 were solved by AIXI-like universal induction, "one would still need work on AI-GA's Third Pillar because Solomonoff induction and AIXI take as a starting assumption a single environment to be solved." Environment generation is orthogonal to the learner.

## Interpretation (flagged as inference)

- The three pillars are a clean decomposition of "what an autoresearch loop could automate." Mapping them onto this repo:
  - **Pillar 1 (architectures)**: out of scope for the repo. The repo is not searching neural architectures; the LLM is a fixed foundation model.
  - **Pillar 2 (learning algorithm)**: partially in scope and bounded. A verifier-graded loop could tune a *recipe* (prompts, memory-principle curation, advisory-WAM parameters, skill-candidate acceptance), which is a thin slice of "meta-learning the learning algorithm," not learning a new optimizer from scratch.
  - **Pillar 3 (environments)**: this is the repo's natural fit. Generating Minecraft *social scenarios* (seeded worlds, scripted preconditions, obligation ledgers) is pillar-3-style environment generation. POET/OMNI (owned by lane 21) are the methods; the repo would adapt them at the scenario level.
- The modest, defensible thesis claim this lens yields: **the repo targets pillar-3-style scenario generation plus pillar-2-flavored verifier-graded recipe tuning, not pillars 1+2+3 combined and not recursive self-improvement.** AI-GAs is the agenda; the repo borrows one corner of it.
- Clune's own pillar-3 warning (too-expressive generators are intractable; constrain to a physics sim) directly supports constraining the repo's scenario generator to the Minecraft runtime rather than free-form world synthesis.

## Mechanically useful vs research contribution

- **Mechanically useful**: the three-pillar vocabulary itself (a way to say precisely which corner of "self-improvement" the repo automates and which it does not); the pillar-3 "parameterize the environment and complexify it as the agent solves it" recipe (POET-style), applied to social scenarios; the "constrain the generator to a simulator" pragmatic guard.
- **Not a contribution to claim**: building an AI-GA, or claiming the repo is "an AI-generating algorithm," is overclaim. AI-GAs is a grand-challenge agenda with one existence proof (evolution) and large compute caveats. The repo's scenario generation is a narrow pillar-3 instance, not the program.
- **For lane I6 (limits)**: AI-GAs supplies the upper-bound framing (full recursive self-improvement = all three pillars co-evolving) and its own admission that pillar 3 is unsolved and compute-bound. That is the gap between the aspiration and what a verifier-grounded repo loop can actually do.

## WAM layer(s) informed

Cross-layer / Institutional. Pillar-3 environment generation maps to generating Social/Institutional scenarios (the layers the runtime verifier is weakest at scoring), which is exactly why the repo should generate scenarios but keep scoring on the deterministic Physical/Material verifier.
