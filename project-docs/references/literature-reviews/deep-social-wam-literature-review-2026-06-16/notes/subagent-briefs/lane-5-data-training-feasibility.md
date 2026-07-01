# Lane 5 Brief: Data and Training Feasibility

## Lane name

Data and Training Feasibility: whether/how this repo should build a WAM, judged
against real dataset costs and the repo's own runtime artifacts.

## Sources reviewed (14 manifest entries)

LaTeX (5): VPT 2206.11795; LAPA 2410.11758; STEVE-1 2306.00937; Optimus-2
2502.19902; WAM survey data section 2605.12090 (`050-data.tex`, pre-supplied).
Abstract/web (4): VLA-JEPA 2602.10098; UniVLA 2505.06111; Open-World Skill
Discovery 2503.10684; STEVE-21K / See-and-Think 2311.15209; Oasis (Decart/Etched).
HF datasets (5): VPT data 8.0; MineStudio data-6xx..10xx; Optimus-2-MGOA;
Minecraft-Server-Chat; (plus negative findings: no structured embodied-social
Minecraft dataset on HF). Repo artifacts inspected as ground truth: 5 schemas
(`social-cycle-run-report`, `social-cycle-review-summary/v1`, `settlement-state/v1`,
`grounded-social-trajectory-report/v1`, `benchmark-score-bundle/v1`).

## Strongest findings (source-backed)

1. **The canonical WAM data ecosystem is pixel-first and expensive; structured
   social-material state is an empty quadrant.** The WAM survey's four data
   paradigms (robot teleop, UMI human demos, sim, egocentric video) are all
   RGB/sensor (`050-data.tex`); grep of eval+oppo sections = 0 hits for "minecraft",
   "structured state", "symbolic". VPT paid ~$90k-$160k of contractor data for
   Minecraft action labels (arXiv 2206.11795 `a_1_contractor_data.tex`); Oasis needs
   an H100 to infer at framerate. No public Minecraft dataset (VPT, MineStudio 168GB
   LMDB, STEVE-21K, Optimus-2 MGOA) encodes possession, obligation, or social events.
   All are pixel + low-level keyboard-mouse, single-actor, material-acquisition.

2. **This repo auto-labels structured transitions for ~$0, which is exactly the
   `(o,a,o')` triplet the WAM survey prizes.** The verifier already emits the
   physical delta per turn: `runtime_result.last_tool_result` has
   `beforePosition/afterPosition/distanceMoved` and `runtime_hooks[].progress_
   classification`; `social-cycle-review-summary/v1.rows[]` already materializes a
   near-row per cycle (`verifier_status`, `judgment_outcome` ∈ {verified_progress,
   partial_verified_progress, no_progress, blocked}); `settlement-state/v1` holds
   the material economy (inventory_counts, shared_storage, known_positions,
   social action-skill ids); `grounded-social-trajectory-report/v1.events[]` is a
   typed social ledger (request/promise/shared_deposit with item_id, count,
   target_actor_id, evidence_refs). VPT's costly IDM is, here, the free verifier.

3. **The correct build order is C+D then E; A and B are rejected, latent-action is
   not needed.** Option C (LLM zero-shot delta-predictor harness, provider-free in
   design) + Option D (structured transition dataset from logs) are training-free
   and start in days. LAPA's VQ-VAE latent-action discovery (arXiv 2410.11758) is a
   non-problem here because the repo already has a typed action vocabulary and typed
   deltas, adding latent actions imports the "visual entanglement / shortcut
   learning" failure mode that LAPA/CLAP/ConLA/VLA-JEPA all fight, for no gain. A
   concrete `social-material-transition/v1` ROW schema is specified, every field
   mapped to a real artifact, with `predicted_delta` the only new slot.

## Weak or uncertain claims (could not verify)

- **Social-event auto-emission at scale is unproven.** The
  `grounded-social-trajectory-report/v1` events in the inspected smoke run are
  partly hand-authored fixtures (`evt-001-request-wood` etc.). I did not find a
  run where social events were auto-derived from real multi-actor transcript +
  inventory/container evidence. That emitter is the main new support infra needed.
- **Row volume is an estimate.** "hundreds to low-thousands of rows in 2 months" is
  inferred from a 40-cycle run = ~40 rows and provider-budget limits; I have no
  throughput measurement to confirm it.
- **STEVE-21K / Oasis details are web/abstract-only** (no LaTeX fetched); sizes and
  modalities are as reported, marked accordingly.
- `limuyu011/minecraft_trajectory_grounding_actions` (14 MB, single zip) might hold
  structured action labels but I did not unzip it (small, recent, modality
  unconfirmed), flag for a follow-up peek.

## Implications for this repo

- Mechanically useful (engineering to borrow): VPT auto-label paradigm (verifier =
  free IDM); LAPA cascaded predict-`o'`-then-`a` as a *scoring* structure; WAM
  survey `(o,a,o')` triplet as typed fields. The logger/emitter/scoring harness are
  **support**, not the contribution.
- Research contribution (modest, defensible): a structured social-material
  transition representation + dyadic/settlement benchmark that is cheap to label
  because Mineflayer verifier evidence auto-labels it. Stays **advisory** at every
  option (predict-and-score; never gate serving), matching the repo's observe-only
  rule.

## Recommended next questions

1. Can the runtime auto-emit `social_delta.events` from real multi-actor transcript
   + inventory/container evidence (replace scripted smoke fixtures)? This is the
   gating piece of new infrastructure.
2. What is the real per-run row yield and provider cost, to size the 2-month K?
3. Should `predicted_delta` be elicited from the Actor Turn's existing
   `expected_outcome`/`success_evidence` (free, weak) before any separate harness?
4. For the social head only, is a small fine-tuned adapter worth it over a strong
   zero-shot LLM, given small-data risk? (Decide after Option C scorecard.)
5. Peek at `limuyu011/minecraft_trajectory_grounding_actions` to confirm it is not a
   structured-action exception to the "all pixel" finding.
