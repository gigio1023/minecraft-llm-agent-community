# Reproducibility Norms and the Project Sid Cautionary Case

Lane D synthesis note (2026-06-17). Audience: the positioning report and the repo
owner. Jargon defined on first use. ASCII punctuation only.

Scope: (a) the concrete release checklist this project should meet to be
publishable; (b) a verified Project Sid artifact-status table; (c) the cautionary
lesson, tied to the framing rule that the project must NOT position itself as
evidence-first benchmarking.

This note is the DELTA on top of the existing archive. It does not rewrite the
existing Sid review or the validity analysis. It cites them:
- old archive Sid review:
  ../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/project-sid-critical-review.md
- old archive validity/overclaim boundaries:
  ../../../../2026-06-16/deep-social-wam-literature-review/notes/by-theme/benchmark-validity-and-evaluation.md
- old archive reproducibility classification (Sid = claim-only):
  ../../../../2026-06-16/deep-social-wam-literature-review/matrices/reproducibility-matrix.md

New by-paper notes in THIS archive back the norm claims:
- pineau-ml-reproducibility-2020-checklist.md (the canonical ML checklist, verbatim)
- paperswithcode-code-completeness-checklist.md (the 5-item code bar)
- neurips-datasets-benchmarks-track-norms.md (release/hosting norms)
- embracing-negative-results-2406-03980.md, questionable-practices-ml-2407-12220.md
- reproducibility-ai-governance-2510-11595.md, aivilization-v0-2602-10429.md
- project-sid-2411-00114-artifact-status.md (live re-verification 2026-06-17)

## 0. The one framing rule this note serves

Reproducibility infrastructure (seeds, raw logs, deterministic scoring scripts,
held-out scenarios, env pinning) is SUPPORT INFRASTRUCTURE and an audit surface, it
is NOT the research contribution. The contribution is the scientific question:
whether a small number of embodied LLM actors sustain socially meaningful behavior
where action consequences move material state, opportunity, memory, obligation,
trust, conflict, repair, and continuation. The checklist below makes that question
CREDIBLE; it does not replace it. Do not position the project as evidence-first
benchmarking, and do not present the release artifacts as the novelty.

## 1. The publishable release checklist (what the project must satisfy)

Sourced from the ML Reproducibility Checklist v2.0 (Pineau et al.), the Papers with
Code 5-item code bar (the official NeurIPS 2020 code recommendations), and the
NeurIPS Datasets and Benchmarks track norms. Verbatim checklist text is in the
by-paper notes. Items are grouped, with the repo-specific form on the right.

### 1a. Determinism and seeds

- Pin and record EVERY source of randomness: world seed, Minecraft server seed,
  actor/provider sampling settings (temperature, top-p), tool-call ordering, and any
  scenario randomization. The Pineau checklist folds seeds into "exact number of
  runs," "all hyper-parameters used," and "precise command to produce results"; a
  determinism-first project should make seeds explicit because exact re-derivability
  of (state, action, next-state) labels IS the claim.
- For every reported result, give the exact number of runs and the seed set, not a
  single cherry-run. (Pineau: "exact number of training and evaluation runs.")

### 1b. Raw logs and world artifacts

- Release the raw per-cycle artifacts the verifier reads: inventory/container
  deltas, block/position events, chat events, the actor turn transcript, tool-call
  inputs/outputs, verifier output, actor workspace state (PlanBeads JSON), and
  provider usage records. These are the world-anchored evidence the old archive
  validity note requires every social score to cite.
- A social claim in any released table must link to the specific artifact line that
  makes it true (no transcript-only or summary-only social score).

### 1c. Deterministic scoring scripts (the core differentiator)

- Release the scoring script that turns raw logs into the reported metrics, and it
  must be DETERMINISTIC: the external verifier scores; a learned reward model, an
  LLM judge, or the actor scoring its own success is INADMISSIBLE (it over-optimizes,
  hacks, or collapses; the repo term is "progress laundering"). This is the one rule
  the whole validity literature enforces (old archive validity note sections 1, 6).
- If an LLM judge appears at all, it is a clearly-separated SECONDARY axis with a
  Lifelong-SOTOPIA-style explicit failure checklist and human-correlation reporting,
  never the primary score.
- Papers-with-Code item 5 (results table + one command to reproduce it) maps cleanly
  here: the released command runs the deterministic verifier over released logs and
  regenerates the table.

### 1d. Held-out scenarios (no tuning on the test)

- Reserve unseen social-material scenarios (new partner, new seed, new world layout)
  scored ONCE, mirroring NeurIPS D&B train/val/test discipline and Pineau's
  "details of train / validation / test splits." This guards against HARKing
  (hypothesizing after results are known) and cherry-picking
  (questionable-practices note).
- Pre-state the social-material hypotheses (possession, material claim, obligation/
  credit, refusal, repair, memory continuity) BEFORE the held-out run, so a result
  is a test, not a post-hoc story.

### 1e. Negative results, cost, and failure traces as first-class output

- Report runs where the actor FAILED: hoarding under scarcity, refusal-without-
  repair, broken continuity, and progress the verifier caught as fake. Suppressing
  these reproduces the publication bias that "Embracing Negative Results"
  (2406.03980) warns against and that "Reproducibility: the New Frontier in AI
  Governance" (2510.11595) calls evidentially weak. The old archive validity note
  already lists cost/latency/action-count/retry/stall/blocked-action/failed-
  continuity as first-class results, not footnotes.
- Report cost and latency per run (Pineau: "average runtime for each result, or
  estimated energy cost"; "description of the computing infrastructure used").

### 1f. Environment and version pinning

- Pin: provider/model id and version, Mineflayer/helper API version, Minecraft
  server version, OS/arch (the repo moves between Apple Silicon macOS and Linux
  ARM), Python/Node and dependency lockfiles, and the verifier/schema version.
  (Pineau: "specification of dependencies"; Papers-with-Code item 1.)
- A released run must name which platform produced it; a result on one platform/
  provider/seed is re-measured before being claimed for another (the old archive
  validity note's English-vs-German collapse lesson).

### 1g. Release hosting and documentation (if any artifact is published)

- Persistent public hosting (Hugging Face, Dataverse, Kaggle, OpenML); for >4GB a
  small inspectable sample; Croissant machine-readable metadata; an open permissive
  license (CC BY 4.0 / CC0); a maintenance note. (NeurIPS D&B norms.)
- A README results table with the precise reproduction command (Pineau shared-code
  section; Papers-with-Code item 5).

### 1h. Honest n/a marking

- Some code-checklist items are n/a by design: the repo does not train a policy from
  scratch (the actor is provider-driven, the WAM is advisory), so "training code"
  and "pretrained weights" should be marked n/a WITH a comment, not faked. The
  Pineau checklist explicitly supports "Not applicable" plus a free-form reason.

## 2. Project Sid artifact-status table (verified 2026-06-17)

Re-verified live this pass (WebFetch of the repo, raw README, and org repo list, all
accessed OK). The altera-al GitHub org has exactly ONE public repo, project-sid, and
its top level holds only: `2024-10-31.pdf`, `README.md`, `visual_abstract.png`,
`projectSidVideo.mp4`. The README is SILENT on code availability (no release, no
promise, no explicit decline). No independent reimplementation located.

Papers-with-Code 5-item score for the repo: 0/5.

Claims are restated from the old archive Sid review (primary-source facts the report
states); the status column is this lane's verified artifact status. Every metric is
UNREPRODUCED because no scoring artifact is released.

| Sid claim / metric | Released evidence to re-derive it? | Status |
|---|---|---|
| PIANO architecture | report text + figures only | described, code unreleased -> unreproduced |
| Single-agent item diversity (~17/agent in 30 min; ~320 across 49 agents in 4h) | no logs, no item-count script, no seeds | claim-only -> unreproduced |
| Relationship / sentiment graphs (LM-scored 0-10) | no transcripts, no scoring prompts | claim-only -> unreproduced |
| Perceived vs true likeability (LM-inferred "true") | no data, no inference script | claim-only -> unreproduced |
| Specialization / roles (GPT-4-labeled) | no goal histories, no labeling script | claim-only -> unreproduced |
| Food distribution under scarcity | no event logs (transfer is a world event, but unreleased) | claim-only -> unreproduced; verifiable IF released |
| Collective rules / taxation compliance (% inventory deposited per window) | no inventory/deposit logs, no window defs | claim-only -> unreproduced; the MOST verifiable signal IF released |
| Cultural / religion spread (keyword frequency, 500 agents) | no goal/chat logs, no keyword script | claim-only -> unreproduced; weak even if released |
| Scale ~500 cultural / ~1000+ attempts | report statement only | claim-only -> unreproduced; scale is a technical variable, not a social signal |

Verified-vs-claim split: the LEFT two columns (the claims) are primary-source facts
the Sid report states, per the old archive review. The RIGHT column (artifact
status) is what I verified on the live repo on 2026-06-17. The plausibility-vs-
verified MAPPING of each signal (which would be defensible if released, which would
not) is the old archive review's analysis, cited not rewritten: even released,
likeability-as-truth and meme-keyword-frequency would remain weak; only the taxation
deposit and the food transfer are real material transitions.

## 3. The cautionary lesson (tie to the framing rule)

1. Large emergent-society claims WITHOUT released runnable scoring are exactly what
   this project must NOT become. Sid reports civilization-scale signals (economy,
   culture, religion, government) and ships zero runnable artifacts; by the Papers-
   with-Code bar it scores 0/5, and by the AI-governance-reproducibility framing
   (2510.11595) its claims are evidentially weak inputs. The post-Sid trend
   continues (AIvilization v0, 2602.10429, a publicly deployed large society), so
   the temptation to chase scale-and-narrative is live, not historical.

2. The project's edge is the inverse posture: small-N, world-verified, falsifiable
   social-material transitions with a deterministic scoring script released. That is
   a STRONG reproducibility position by construction (old archive reproducibility
   matrix). But, and this is the framing rule, that strength is SUPPORT
   INFRASTRUCTURE, not the contribution. The deterministic verifier, the seed
   ledger, the raw logs, the held-out scenarios, and the scoring scripts are the
   audit surface that makes the social-science claim trustworthy; they are not
   themselves the claim.

3. Therefore do NOT position the project as evidence-first benchmarking or as a
   reproducibility/structured-state contribution. Structured state and evidence
   logging are implementation details. The contribution is the question about
   sustained, consequential, embodied social behavior. The reproducibility checklist
   in section 1 is the credibility bar the project clears on its way to making that
   claim, exactly the bar Sid did not clear.

4. The narrow, verifiable claim the project MAY make (consistent with the old
   archive validity note and Sid review): a NAMED model, with a NAMED partner and
   seed, produced social-material transitions (possession, material claim,
   obligation/credit, refusal, repair, memory continuity) that were VERIFIED against
   Mineflayer world artifacts, at a measured cost, with failures and uncertainty
   reported, and one model did so more reliably than another. It must NOT claim
   human-society fidelity, believable dialogue as social capability, an LLM judge's
   score as ground truth, or organic cooperation the world did not confirm.

## 4. One-paragraph takeaway

Project Sid is the cautionary anchor: an embodied many-agent Minecraft society whose
every reported metric (item diversity, sentiment, likeability, specialization, food
distribution, taxation compliance, cultural spread) is UNREPRODUCED, because the
public artifact is a report PDF, a README, an image, and a video, with no code,
logs, seeds, prompts, or scoring scripts, re-verified 2026-06-17. The publishable
bar the project should meet instead is concrete and well-established: pinned seeds
and environment, released raw world logs, a deterministic verifier scoring script
with a one-command results table, held-out scenarios scored once, and negative
results plus cost and failure traces reported as first-class output (Pineau
checklist, Papers-with-Code 5-item bar, NeurIPS D&B hosting norms, the negative-
results and questionable-practices literature). Clearing that bar is what separates
the project from Sid, but clearing it is hygiene and audit surface, not the
contribution; the contribution is the social-science question about sustained,
consequential, world-grounded behavior, and the project must be positioned that way,
not as evidence-first benchmarking.
