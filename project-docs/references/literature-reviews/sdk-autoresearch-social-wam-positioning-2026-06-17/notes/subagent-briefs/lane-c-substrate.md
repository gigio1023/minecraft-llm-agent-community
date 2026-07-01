# Lane C brief: substrate comparison (Minecraft vs robotics sim vs dialogue sim)

## Scope

Why wild, natural Minecraft is scientifically useful for grounded social-WAM research
relative to robotics simulators (MuJoCo, Isaac Sim, Habitat 3.0) and dialogue-only social
simulation (Generative Agents, SOTOPIA), and what Minecraft cannot claim against each.
Output: the `minecraft-vs-robotics-vs-dialogue-sim` matrix.

## Sources reviewed

- New deep-read (this archive): Habitat 3.0 (2310.13724, abstract + body speed paragraph),
  sim-to-real surveys (2009.13303 + 2502.13187, abstracts verified live), PARTNR
  (2411.00081, abstract + summaries). 3 new by-paper notes written.
- Cited from old archive (not rewritten): MineDojo (2206.08853), Generative Agents
  (2304.03442), SOTOPIA (2310.11667), GR00T-N1 (2503.14734), plus theme files
  `minecraft-vla-and-visual-policy.md`, `minecraft-agent-benchmarks.md`, `wam-foundations.md`,
  `benchmark-validity-and-evaluation.md`, `llm-social-simulation.md`,
  `minestudio-positioning.md`, and the observation/action matrices.
- Total touched: 8 manifest rows (3 new notes, 5 cite-only).

## Strongest findings

1. Two axes separate the families: (a) does the substrate have a deterministic material
   verifier, and (b) what does fidelity cost per actor. Minecraft is the only family that
   scores well on both. Robotics sim wins physical realism, loses both. Dialogue sim wins
   cost/count, has no material verifier.
2. Minecraft's defensible value: deterministic material substrate (possession/transfer/
   claim are exact engine facts), near-zero verification cost, society-scale agent count.
   The verified-vs-plausible distinction the social-sim field labored over is a property of
   the Minecraft substrate.
3. Robotics sim owns real-world physical transfer and pays the inevitable reality gap
   (2502.13187 verbatim "inevitable"). Habitat 3.0's "social" is co-presence/motion
   coordination (yielding space), not obligation/possession; per-humanoid cost (188 FPS
   single-env) caps agent count to dyads. PARTNR scales to 100k tasks but scores task
   success/step efficiency, not material-social consequence.
4. Dialogue sim (SOTOPIA actions all resolve to text; even Financial/Material is judge-
   scored) has no material verifier, so it cannot test material consequence at all; its LLM
   judge over-rates, especially at long context.

## Weak / uncertain claims (flagged)

- Habitat 3.0 FPS numbers and PARTNR ratios are claim-only (from abstract/body/summaries,
  not an independent re-derivation).
- MuJoCo/Isaac throughput figures (millions of steps/sec; 82k-94k FPS) are claim-only from
  web benchmarks, not from a deep-read of a primary source; used only as order-of-magnitude
  context, not load-bearing.
- The sim-to-real survey bodies were not deep-read; the "inevitable gap" and solution-
  category facts are from verified abstracts.

## Implications for the repo

- Position Minecraft as the material-substrate choice, not a robot proxy or a better
  chatroom. Pitch: verified material consequence, cheaply, for many actors.
- Keep the verifier deterministic/non-generative; that is the one decisive edge over
  dialogue sim. An LLM judge/game master as material authority discards it.
- Do not claim real-world transfer or perception realism; cite robotics sim as where those
  live, and the reality-gap surveys for why Minecraft does not play there.
- Label scenarios natural-world vs command-fixtured; only natural-world acquisition grounds
  a material claim.

## Recommended next questions

- Does any robotics sim cheaply carry a persisted possession/obligation ledger across
  episodes (would weaken Minecraft's uniqueness)? Current evidence: no, benchmarks stop at
  coordination.
- Quantify Minecraft actor-count ceiling on the repo's hardware to put a number on
  "society scale" (Lane C asserts feasibility; a measured cap would harden it).

## One-line tie to the thesis

Minecraft is the only substrate that gives a deterministic, society-scale **material**
floor under social predictions at near-zero verification cost; robotics owns transfer,
dialogue owns vocabulary, neither gives that floor at that cost.

## Deconfliction

- Lane C owns the cross-substrate comparison (Minecraft vs robotics vs dialogue). It does
  NOT re-derive WAM theory (Lane 1 / `wam-foundations.md`), the Minecraft policy/benchmark
  inventories (old Lane 2 themes, cited), or the social-metric validity argument (old Lane
  3 themes, cited).
- Overlap with Lane B (novelty/gap rows): Lane C supplies the substrate column (what each
  world can/cannot ground); Lane B should consume this matrix rather than re-run the
  substrate search.
- Overlap with Lane D (reproducibility/Project Sid): Lane C only notes reproducibility as a
  per-substrate cost posture; the reproducibility-norms and Project-Sid cautionary analysis
  is Lane D's.
