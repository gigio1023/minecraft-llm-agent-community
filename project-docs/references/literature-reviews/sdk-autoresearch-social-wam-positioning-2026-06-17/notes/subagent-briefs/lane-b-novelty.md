# Lane B brief: cross-product novelty and the prior-work-gap matrix

ASCII punctuation only. This is the short brief; the full synthesis is
`notes/by-theme/cross-product-novelty-and-closest-works.md`.

## Scope

The CROSS-PRODUCT NOVELTY question: does any single existing work combine all four axes -
Minecraft + WAM/world-model + open-world SOCIAL grounded in material dynamics + autoresearch/
self-improvement loop? If not, find the closest prior work per axis and per pair/triple, and
state precisely what each misses. Output is the prior-work-gap matrix.

## Sources reviewed (count)

- New sources verified via arXiv abstract pages + HF papers search + WebSearch this lane: 10
  (2502.05907, 2603.13131, 2510.21219, 2604.22748, 2602.10429, 2512.01078, 2508.02912,
  2410.22194, 2503.03505, 2510.13982). 7 got NEW by-paper notes; 3 are manifest-only census
  rows.
- Reused from the old 2026-06-16 archive (cited, not rewritten): 5 by-paper notes (Voyager
  2305.16291, WALL-E 2410.07484, MineCollab/MINDcraft 2504.17950, S3AP 2509.00559, plus the
  Project Sid root review 2411.00114) and 5 theme files (minecraft-world-models,
  minecraft-multi-agent-social, llm-social-simulation, project-sid-critical-review,
  research-area-coding-agent-autoresearch) and 2 capstone matrices.

## Strongest findings

1. The 4-way intersection is EMPTY. No work is embodied-Minecraft + action-conditioned world
   model + material-grounded social + verifier-grounded self-improvement loop, across 560+ old
   sources and 10 new ones.
2. The closest TRIPLE that IS occupied is Minecraft + world-model + self-improvement
   (EvolvingAgent 2502.05907), but it is single-agent, physical-only, and its loop is scored by
   self-verification - the inadmissible "progress laundering" signal. MineEvolve (2603.13131) is
   the closest Minecraft self-improver that uses TYPED in-world feedback rather than a self-judge,
   but is single-agent, no social, no predictive world model.
3. Material-grounded social exists only OUTSIDE embodied Minecraft (AIvilization 2602.10429
   economic sandbox; LLM Economist; GLEE) or as task-completion inside Minecraft
   (MineCollab/MINDcraft typed handoff with no obligation ledger). S3AP (2509.00559) is the
   closest social world model but is LLM-parsed and dialogue-scored, not embodied or verified.
4. Two 2025-2026 POSITION papers (2510.21219 "unify physical and social dynamics";
   2604.22748 "Agentic World Modeling" survey, L3 Evolver level + physical/digital/social/
   scientific law regimes) explicitly name physical-plus-social world modeling as an open
   frontier and call them "separate silos". They confirm the gap AND prove the framing is not
   itself novel.

## Weak / uncertain claims

- All 10 new sources were verified at ABSTRACT level (arXiv abstract pages), not full LaTeX
  deep-read. Component claims (e.g. EvolvingAgent's "self-verification", MineEvolve's typed
  feedback) are quoted from the abstract; exact scoring internals are not body-verified. Flagged
  in each by-paper note as abstract-availability.
- All Project Sid numbers and emergent-society claims are CLAIM-ONLY (no released code/data/logs;
  GitHub still report-PDF-only as of 2026-06-17). Labeled unreproduced throughout.
- "EMPTY 4-way" is bounded by what HF/web/arXiv surfaced; a private or very recent unindexed
  system could exist. The census is strong but not a proof of non-existence.

## Implications for the repo

- Position on the INTERSECTION, never on a single axis. Every single axis (Minecraft agents,
  world models, social world models, self-improving agents, multi-agent Minecraft society) is
  crowded; do not claim any as the contribution.
- The defensible novelty, in priority: (1) predict-and-VERIFY material-grounded social deltas
  (possession + claim + obligation + trust) against a deterministic Mineflayer verifier, with
  prediction accuracy scored separately from acting outcome; (2) keep the world model ADVISORY
  (contrast WALL-E's MPC-authority); (3) a self-improvement loop whose success signal is the
  verifier, not a self-judge (contrast Voyager/EvolvingAgent); (4) small-N reproducible
  trajectories vs Project Sid's unreproduced civilization scale.
- Use 2510.21219 and 2604.22748 as third-party evidence the direction is real, while stating
  plainly that the framing is shared and only the embodied-verified-instantiation is open.

## Recommended next questions

1. For the final report's gap matrix: should EvolvingAgent and MineEvolve be the named "closest
   triple" anchors (Minecraft+WM+self-improve), with S3AP as the "closest social WM"? (Lane B
   recommends yes.)
2. Does Lane C's substrate analysis want SimWorld (2512.01078, UE5 physical+social, open-source)
   treated as the leading SUBSTRATE alternative to Minecraft? (Flagged to Lane C.)
3. Does Lane D want the 2026-06-17 confirmation that Project Sid's GitHub is still
   report-PDF-only folded into the reproducibility-norms section? (Flagged to Lane D.)

## One-line tie to the thesis

The project's novelty is the empty 4-way intersection under the verifier-owns-truth rule, not
any one axis - each ingredient has prior art, the combination does not.

## Deconfliction

- Lane A owns the SDK/coding-agent autoresearch loop MECHANICS and authority boundary; Lane B
  cites the loop only as the 4th axis for the census (EvolvingAgent/MineEvolve/Voyager
  self-judge-vs-verifier point), not the loop engineering.
- Lane C owns substrate trade-offs (Minecraft vs robotics vs dialogue-sim); Lane B flags
  SimWorld and the substrate contrast but does not adjudicate substrate choice.
- Lane D owns reproducibility norms + the Project Sid cautionary deep-dive; Lane B uses Sid only
  as the nearest-neighbor census row and reconfirms its artifact status, deferring the norms
  treatment to Lane D.
- Built on the old archive's matrices/research-gap-matrix (the per-layer "empty social-material
  cell" finding) and source-comparison-matrix; Lane B adds the cross-product/pair-triple census
  and the 10 new 2025-2026 works.
