# Lane 1 brief - WAM Foundations and Game World Models

## Lane name
WAM Foundations and Game World Models (intellectual foundation: what a World Action
Model is, how it differs from neighbors, what it predicts, its data/training/eval
requirements, weight reuse, and the structured-vs-pixel feasibility question).

## Sources reviewed (21 in manifest; 11 LaTeX deep-read)
Deep-read (LaTeX): WAM survey **2605.12090**; DreamZero **2602.15922**;
Do-WAMs-Generalize **2603.22078**; When-to-Trust-Imagination/FFDC **2605.06222**;
Privileged Foresight Distillation **2604.25859**; AVID **2410.12822**;
actionable-simulators survey **2601.15533**; Solaris **2602.22208**; WildWorld
**2603.23497**; MineWorld **2504.08388**; Dreamer 4 **2509.24527**.
Breadth (abstract/card/docs): Matrix-Game **2506.18701** / 2.0 **2508.13009**, Oasis
(`Etched/oasis-500m`), Genie **2402.15391** / Genie 3, GameNGen **2408.14837**,
DreamerV3 **2301.04104**, iVideoGPT **2405.15223**, PAN **2511.09057**, NitroGen
**2601.02427** (existing repo analysis reused).

## Strongest findings (source-backed)
1. **The canonical WAM definition is modality-independent, and the field itself is
   questioning whether pixels are needed.** Survey 2605.12090: WAM = `p(o',a|o,l)` with
   forward prediction that may be "explicit visual OR implicit physical (latent)"; "video
   is merely one possible proxy." Open challenges explicitly note "removing the future
   prediction head at test time does not necessarily degrade downstream control" and push
   a latent-predictive (JEPA-style) direction. DreamZero's own authors: future WAMs "may
   align actions with ... learned latent representations." => A structured-state social
   WAM is a legitimate instantiation, not a stretch.
2. **Pixel WAM is expensive, fidelity != control, and inference-time pixels are
   dispensable** - three independent primary sources. Cost: DreamZero 14B hits only 7Hz
   after 38x speedup (survey: << 50Hz VLA standard); Do-WAMs-Generalize: a WAM step is
   "at least 4.8x slower than π0.5"; MineWorld: "40k-160k tokens for 16 frames." Fidelity
   != control: "Wow, wo, val!" IDM Turing Test - visually convincing models "collapse to
   nearly zero" executable success; actionable-simulators survey names this **"visual
   conflation"** and reframes WMs as **"actionable simulators ... structured ...
   constraint-aware ... closed-loop."** Dispensability: Privileged Foresight Distillation
   shows the future signal is "a compressible correction to be distilled," no inference
   rendering needed. => Structured state is the feasible, defensible path; pixel Minecraft
   WMs are at most visual sidecars.
3. **No Minecraft/game world model predicts social-material state, and hidden state is
   not in the pixels.** Solaris (the only *multiplayer* Minecraft WM) models multi-view
   *pixels* (who-sees-what), evaluated on Movement/Grounding/Memory/Building/Consistency
   - zero possession/obligation/claim/trust. WildWorld states the principle: meaningful
   actions act through hidden state ("shoot" decrements invisible ammo) "that cannot be
   reliably inferred from visual observations alone." `lend_item` is the exact
   social analogue. => The social-material transition layer is the open niche.

Bonus precision finding (lane focus question): **WAM is several things at different
layers.** As actuator/policy = DreamZero (forbidden for this repo's runtime). As learned
simulator = MineWorld/Solaris/Oasis. As evaluator/verifier = FFDC (2605.06222: predict
expected future, a *separate lightweight verifier* compares predicted-vs-observed to
decide trust/replan, never fills args). The **evaluator/verifier and counterfactual-
simulator** framings are the only ones admissible under the repo's "WAM stays advisory"
rule.

## Weak or uncertain claims (could not fully verify)
- **MineWorld weights**: the paper states code+model released (Microsoft), but no
  `MineWorld` model surfaced under `hf models list --search`. Recorded as
  released-per-paper; the exact HF/GitHub weight location not confirmed in this pass.
- **PAN (2511.09057)** and **iVideoGPT** described at abstract level only; their
  hybrid-latent-core details are not LaTeX-verified.
- **Reproducibility flags** in the manifest are coarse: "reproducible" for systems with
  public weights+code+data (Solaris, Matrix-Game, Oasis, DreamerV3), "partial" where
  weights or data are incomplete, "claim-only" for very recent papers without released
  artifacts (FFDC, Do-WAMs-Generalize). Not independently re-run (literature synthesis
  only, per contract).
- Author lists for several 2026 preprints (survey 2605.12090, FFDC, Do-WAMs-Generalize)
  taken from paper headers / known group attribution; not exhaustively verified.

## Implications for this repo (mechanically useful vs research contribution)
- **Mechanically useful (engineering to borrow)**:
  - The `p(o',a|o,l)` vocabulary + Cascaded/Joint distinction; the WM-for-VLA quad
    (esp. policy-evaluation-as-simulator and reward modeling) as the advisory-predictor
    precedent.
  - The **FFDC control loop** (predict expected state -> compare to observed evidence ->
    decide trust/replan) maps directly onto "predict social-material delta -> compare to
    inventory/container/transcript/verifier artifacts." Its verifier-training recipe
    (positives from successes, negatives from failures + **synthetic corruptions**) is a
    template for a social-transition verifier with negative controls.
  - "Future signal is compressible, no inference-time rendering" (PFD) => keep any
    predictor lightweight; do not build a pixel rollout engine.
  - WildWorld's **State Alignment** metric => template for "social-material transition
    prediction accuracy"; its per-frame structured annotations => logging design.
  - Dreamer 4's **structured inventory state as model input** => parallel for feeding
    typed Minecraft state to a predictor; latent-WM single-GPU capability => feasibility.
  - Public pixel weights (Oasis/Matrix-Game/Solaris/MineWorld) and AVID's
    adapter-over-frozen-backbone => only as optional *visual sidecars*, never runtime
    authority or social predictor.
- **Research contribution (what's actually novel here)**: **action-conditioned
  social-material transition modeling in Minecraft** - predicting and verifying
  who-has-what / who-owes-whom / who-can-now-do-what deltas, used *advisorily*. No
  surveyed system (robot WAMs, Minecraft pixel WMs, Dreamer agents) does this. Per the
  shared contract, the verifier/evidence pipeline is **support, not the contribution** -
  the modeled social-material transition is.
- **Hard boundaries to keep (from primary sources + repo rules)**: WAM stays advisory
  (FFDC framing, not DreamZero actuator framing); structured state over pixels (cost +
  hidden-state + fidelity!=control evidence); do not build another Minecraft video WM;
  do not pivot to RL-in-imagination policy as authority.

## Recommended next questions
1. **What is the minimal structured social-material state schema** that a WAM-style
   predictor would consume/emit (typed deltas for possession, claim, obligation, trust,
   access), and how does it bind to the repo's existing `current_state` + verifier
   artifacts? (Pairs with Lane 5 data/feasibility and the repo's research frame.)
2. **Can the FFDC verifier pattern be instantiated cheaply** on logged social-material
   transition records (predict expected delta+evidence, compare to observed verifier
   output, score consistency) without any learned pixel model? Design the positive/
   negative/synthetic-corruption dataset for social transitions.
3. **Does a cascaded (predict-structured-future -> derive-consequence) design beat a
   joint one for data efficiency**, mirroring Do-WAMs-Generalize's IDM-vs-joint-denoising
   finding, when/if the project ever trains a predictor rather than prompting an LLM?
4. **Is a pixel Minecraft sidecar (Solaris/MineWorld) ever worth the cost** for human
   review of social episodes, or does structured transcript+artifact review fully cover
   it? (Default answer from this lane: structured review suffices; pixel sidecar optional.)
5. **Confirm MineWorld weight location** and license if a visual sidecar is pursued.
