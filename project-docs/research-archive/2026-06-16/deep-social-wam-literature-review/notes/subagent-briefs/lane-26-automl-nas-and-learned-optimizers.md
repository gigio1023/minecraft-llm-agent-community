# Lane 26 brief (I3): AutoML, NAS, and learned optimizers

Wave 5, lane 26. Anchored to ENPIRE (`notes/by-paper/enpire.md`, cited not rewritten) and the
wave-4 thesis. ASCII punctuation only.

## Lane name
AutoML, neural architecture search, and learned optimizers: the classical "machine improves machine
learning" lineage that predates LLM agents.

## Sources reviewed (13 total: 8 LaTeX deep-read, 5 abstract-level breadth)

Deep-read (LaTeX, with by-paper notes):
- AutoML-Zero (2003.03384) - evolve whole ML algorithms from 65 basic ops.
- DARTS (1806.09055) - differentiable, gradient-based NAS.
- Learning to learn by gradient descent by gradient descent (1606.04474) - learned-optimizer origin.
- VeLO (2211.09760) - learned optimizer scaled to ~4000 TPU-months + its failure regime.
- AutoML in the Age of LLMs survey (2306.08107) - the bridge to autoresearch / coding-agent loops.
- NASNet (1707.07012) - RL-based transferable cell search; cost anchor.
- ENAS (1802.03268) - parameter sharing, 1000x cost drop.
- NAS: A Survey (1808.05377) - the search-space / search-strategy / performance-estimation taxonomy.

Breadth (abstract-level, manifest only):
- Hyperband (1603.06560), BOHB (1807.01774) - HPO milestones.
- Once-for-All (1908.09791) - train-once-specialize; correct id (not 1908.06756, which is BOAH).
- GLO (1905.11528) - loss-function discovery (Baikal loss) via trees + CMA-ES.
- muLO (2406.00153) - learned-optimizer meta-generalization limits, 2024.

## Strongest findings (source-backed)

1. The NAS cost trajectory is the lane's hard evidence that automated self-improvement of a learning
   system is real but its central problem was cost. Primary-source numbers: original NAS 22,400
   GPU-hours (800 GPUs x 28 days, cited in NASNet), NASNet cell 2,000 GPU-hours + 20,000 child
   models, AmoebaNet evolution 3,150 GPU-days (cited in DARTS), then ENAS 0.5 GPU-day ("1000x"
   cheaper via parameter sharing) and DARTS 1.5-4 GPU-days (continuous relaxation). The field spent
   years driving the cost down ~1000x.
2. Search-space genericity has a steep, quantified price. AutoML-Zero (2003.03384) states that
   dropping human priors makes the space "quite sparse," with good algorithms "as rare as 1 in
   10^12," requiring proxy tasks + FEC + hurdles + 100-1000 CPU cores x 5 days. The NAS survey
   states the same tradeoff qualitatively: prior knowledge shrinks the space but "introduces a human
   bias, which may prevent finding novel architectural building blocks." A repo recipe-search must
   stay small and typed.
3. Learned self-improvement is trained-distribution-bound. The founding learned-optimizer paper
   (1606.04474) grounds this in No Free Lunch ("specialization ... is the only way that improved
   performance can be achieved") and claims only same-distribution transfer. VeLO (2211.09760), the
   most-scaled learned optimizer (~4000 TPU-months), beats a 1000-trial tuned search with zero
   tuning on >85% of tasks BUT fails out of distribution (>500M params, >200K steps), even
   re-introducing a hyperparameter to stay stable. muLO (2406.00153) confirms the wider-task
   generalization gap. This is the cleanest bound on the wave-4 thesis.

Bonus finding: the AutoML-in-age-of-LLMs survey (2306.08107) shows the coding-agent autoresearch
loop existed in AutoML (GENIUS prompts GPT-4 to propose+evaluate+re-propose architectures;
EvoPrompting uses an LLM as crossover/mutation operator; AutoML-GPT/MLCopilot) years before ENPIRE
applied it to robots. It also names the repo's exact risk: AutoML-GPT "never evaluate a single ML
pipeline ... only use LLMs to simulate the entire AutoML process" (progress laundering).

## Weak or uncertain claims (what I could not verify)

- ENAS/DARTS later-literature critiques (search instability, weak shared-weight-proxy-to-true-accuracy
  correlation for ENAS; DARTS "collapse" to all-skip cells) are flagged as known follow-on work; I
  verified only DARTS's own "initialization-sensitive" statement and ENAS's own claims, not the
  later critique papers. Marked as inference in the notes.
- Hyperband, BOHB, Once-for-All, GLO, muLO are abstract-level only (no LaTeX deep-read), so their
  exact numbers beyond the abstracts are not independently verified here.
- All performance/cost numbers are as-stated by the papers; no independent re-run (consistent with
  the literature-synthesis-only rule).
- HF papers feed does not index the 2016-2018 seeds (ENAS, NAS survey, learn-to-learn); verified
  those via arXiv abstract pages instead, which is reliable for id/title/author/year but not a
  substitute for the LaTeX I then fetched and read.

## Implications for this repo (mechanically useful vs research contribution)

Mechanically useful (reference patterns): frame a WAM-recipe autoresearch loop as the three-axis
NAS problem (typed recipe space, search strategy, CHEAP performance estimation = the runtime
verifier on a small cycle fixture); keep the space small/typed to stay affordable; reuse verifier
evidence across overlapping candidates (ENAS/FEC analog); report the failure regime (VeLO
discipline); use the evaluation-grounded LLM loop shape (GENIUS/CAAFE) and reject the
simulation-only shape (AutoML-GPT).

Research contribution (NOT ours): AutoML-Zero, DARTS, VeLO are frontier-lab programs; the repo does
not contribute to AutoML and should not reframe itself as "AutoML for Minecraft."

## Recommended next questions

1. What is the smallest typed recipe space worth searching for the advisory WAM (e.g. which state
   features to include, one reward-shaping scalar, one context-compaction setting), such that the
   verifier-on-a-fixture estimate is faithful enough to rank candidates?
2. Does the repo's verifier signal give a stable enough ranking to avoid the shared-weight-proxy
   problem ENAS/DARTS hit, where a cheap proxy ranks candidates wrongly?
3. How to bound and REPORT the out-of-distribution failure regime of any tuned WAM component, given
   the VeLO/muLO evidence that meta-learned components break outside their training distribution?
4. Where does the Physical/Material-layer verifier give clean labels (where a NAS-style loop could
   work) versus the Social/Institutional layers where success is contested (where it cannot)?
