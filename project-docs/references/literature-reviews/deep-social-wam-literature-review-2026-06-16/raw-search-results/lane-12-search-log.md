# Lane 12 search log: hierarchical and temporally-abstract world models and RL

Date of all activity: 2026-06-16. Lane 12 (wave 3). Discovery order per the shared contract: Hugging
Face CLI first, then web (arXiv, Semantic Scholar, OpenReview). LaTeX-first via
`scripts/fetch_arxiv_latex.sh`. Every seed ID verified before fetch; corrected seeds are recorded
below.

## 0. Grounding reads (no network)

- Read `prompts/00-shared-lane-contract.md`, `prompts/wam-deep-00-contract-addendum-wave3.md`,
  `prompts/wam-deep-G1-hierarchical-world-models.md` in full.
- Read existing theme files I must extend-not-duplicate:
  `notes/by-theme/hierarchical-wam-for-minecraft-societies.md` (wave-1 project capstone, NOT an HRL
  field survey) and `notes/by-theme/wam-lineage-rl-and-latent-dynamics.md` (covers Dreamer/MuZero/
  TD-MPC2 but NOT options/feudal/skill-discovery/hierarchy). Conclusion: the academic HRL/options/
  hierarchical-world-model field is genuinely uncovered. Confirmed by `ls notes/by-paper/` (79 notes)
  and `grep` over all manifests: none of the HRL seeds (Director, FeUdal, Option-Critic, HIRO, DIAYN)
  were logged by any prior lane.

## 1. Seed ID verification (before any fetch)

Verified via `hf papers info <id>` where the paper is in HF's Daily-Papers index (mostly 2021+), else
via WebFetch of the arXiv abstract page or WebSearch + Semantic Scholar.

- `hf papers info 2206.04114` -> VERIFIED. Director, "Deep Hierarchical Planning from Pixels", Hafner,
  Lee, Fischer, Abbeel, 2022; github.com/danijar/director (120 stars). The mandatory deep-read.
- `hf papers info 1703.01161` -> "Paper not found on the Hub" (HF index gap for 2017 papers). Verified
  via WebFetch arxiv.org/abs/1703.01161: "FeUdal Networks for Hierarchical Reinforcement Learning",
  Vezhnevets, Osindero, Schaul, Heess, Jaderberg, Silver, Kavukcuoglu, 2017. VERIFIED.
- `hf papers info 1609.05140` -> not on Hub. Verified via WebFetch arxiv.org/abs/1609.05140: "The
  Option-Critic Architecture", Bacon, Harb, Precup, 2016 (AAAI 2017). VERIFIED.
- `hf papers info 1805.08296` -> not on Hub. Verified via WebFetch arxiv.org/api/query?id_list=1805.08296
  (Atom feed renders cleanly where the abstract HTML did not): "Data-Efficient Hierarchical
  Reinforcement Learning", Nachum, Gu, Lee, Levine, 2018; method named HIRO; uses off-policy correction
  by goal relabeling. VERIFIED.
- `hf papers info 1712.00948` -> not on Hub. Verified via WebFetch arxiv.org/abs/1712.00948: title is
  "Learning Multi-Level Hierarchies with Hindsight" (Levy, Konidaris, Platt, Saenko; ICLR 2019).
  CORRECTION TO SEED: the brief called it "HAC (hierarchical actor-critic)"; HAC is the *method name*
  inside this paper, but the paper *title* is "Learning Multi-Level Hierarchies with Hindsight".
  Recorded both in the manifest title field. VERIFIED.
- `hf papers info 1802.06070` -> VERIFIED on Hub. "Diversity is All You Need: Learning Skills without a
  Reward Function" (DIAYN), Eysenbach, Gupta, Ibarz, Levine, 2018 (ICLR 2019).

## 2. Skill-discovery predecessors and modern hierarchical world models

- WebSearch "Variational Intrinsic Control Gregor option discovery empowerment 2016" -> VIC =
  arXiv 1611.07507, Gregor, Rezende, Wierstra, 2016. VERIFIED (the "VIC" named in the brief). Recorded
  abstract-level.
- WebSearch "Dynamics-Aware Unsupervised Discovery of Skills DADS Sharma Gu 2019" -> DADS =
  arXiv 1907.01657, Sharma, Gu, Levine, Kumar, Hausman, 2019 (ICLR 2020); github.com/google-research/dads.
  VERIFIED. The most world-model-relevant skill-discovery variant (skills with predictable outcomes).
- WebSearch "Director Hafner follow-up hierarchical world model latent subgoal 2023 2024" surfaced two
  modern hierarchical-world-model cornerstones:
  - "Exploring the limits of Hierarchical World Models in RL" -> arXiv 2406.00483. Verified via WebFetch
    arxiv.org/abs/2406.00483: Schiewer, Subramoney, Wiskott, 2024. VERIFIED. Chosen as the maturity
    anchor (did NOT beat flat methods; diagnoses abstract-level model exploitation).
  - "Learning Hierarchical World Models" (ICLR 2024). Verified via WebSearch + OpenReview: THICK,
    Gumbsch, Sajid, Martius, Butz, ICLR 2024 (OpenReview TjCDNssXKU; github.com/CognitiveModeling/THICK).
    Could not locate a single clean arxiv.org/abs id for THICK in the time budget; recorded at
    abstract/repo level keyed on its OpenReview id. NOT FABRICATED an arXiv id.
- WebSearch (Director follow-up) also surfaced "Hierarchical World Models as Visual Whole-Body Humanoid
  Controllers" -> arXiv 2405.18418. Verified via WebFetch: Hansen, Jyothir S V, Sobal, LeCun, Wang, Su,
  2024. VERIFIED. Recorded abstract-level.
- WebSearch surfaced "Flattening Hierarchies with Policy Bootstrapping" -> arXiv 2505.14975. Verified
  via WebFetch: Zhou, Kao, 2025 (NeurIPS 2025 Spotlight). VERIFIED. The skeptical-edge source (a flat
  policy matching SOTA hierarchical goal-conditioned RL). Recorded abstract-level.

## 3. Corrected / rejected seeds (verify-before-fetch caught these)

- `2408.13384` (a guess for a hierarchical-world-model paper) -> WebFetch shows it is "DESI data and
  refinement of standard recombination theory ... Hubble tension" (Shepelev, 2024), a COSMOLOGY paper.
  REJECTED, not logged. No fetch performed.
- `2404.16078` -> guessed it might be the Gumbsch THICK paper. WebFetch shows it is "Learning World
  Models With Hierarchical Temporal Abstractions: A Probabilistic Perspective" by Vaisakh Shaj (a PhD
  dissertation, Karlsruhe Institute of Technology, 2024), NOT the Gumbsch paper. Still a valid
  hierarchical-temporal-abstraction world-model source; recorded abstract-level with the correct author
  and the "dissertation, not Gumbsch" caveat in the manifest and theme file.

## 4. Canonical docs-level references (no arXiv)

- WebSearch "Sutton Precup Singh 1999 Between MDPs and semi-MDPs" -> full citation VERIFIED:
  Artificial Intelligence 112(1-2):181-211, 1999, DOI 10.1016/S0004-3702(99)00052-1. The options
  framework. Recorded source_availability=docs. Note: the precise subtitle is "A Framework for Temporal
  Abstraction in Reinforcement Learning".
- Dayan and Hinton 1993, "Feudal Reinforcement Learning", NIPS 1992 (NeurIPS Advances 5). Docs-level, no
  arXiv. Recorded source_availability=docs; primary-source content drawn via Vezhnevets et al. 2017
  which cites it as the feudal-RL inspiration.

## 5. LLM hierarchical-decomposition (the survey's "high-level semantic" half)

WebSearch "Minecraft LLM hierarchical task decomposition high-level subgoal planner low-level controller"
-> three representative works VERIFIED (abstract-level; deep behavior already covered by other lanes'
Minecraft-agent themes, so logged here only as the high-level-decomposition half of the survey's
hierarchical-WAM challenge):
- DEPS (Describe, Explain, Plan and Select) = arXiv 2302.01560 (Wang et al., NeurIPS 2023).
- Plan4MC = arXiv 2303.16563 (Yuan et al., 2023).
- GITM (Ghost in the Minecraft) = arXiv 2305.17144 (Zhu et al., 2023; github.com/OpenGVLab/GITM).

## 6. LaTeX fetches (LaTeX-first)

All via `bash scripts/fetch_arxiv_latex.sh <id> <slug>` (sleeps 3s per network call; polite).

- `2206.04114 director` -> latex tarball extracted (30 tex files). Deep-read abstract/intro/method/
  experiments/related/discussion.
- `1703.01161 feudal-networks` -> latex tarball extracted (10 tex files). Deep-read abstract/intro/model.
- `1609.05140 option-critic` -> latex tarball extracted. Read abstract + key claims (first end-to-end
  options, line 127).
- `1805.08296 hiro` -> latex tarball extracted. Read abstract + intro.
- `1802.06070 diayn` -> latex tarball extracted. Read abstract + intro.
- `1712.00948 hac-hindsight-hierarchies` -> latex tarball extracted (fetched; HAC note kept at
  manifest-level, not a full by-paper note, since it is a goal-conditioned-HRL neighbor of HIRO).
- `2406.00483 hierarchical-wm-limits` -> latex tarball extracted. Deep-read abstract + intro (the
  maturity anchor).

Note on a transient tool error: an earlier attempt ran the three older IDs in a shell `for` loop that
split the slug into a separate argument, so the script appended the slug to the URL and the fetch
failed for FeUdal/Option-Critic/HIRO (and wrote stray space-named metadata files). Re-running each ID
individually succeeded. The stray space-named metadata files in `papers/metadata/` (this lane's own
artifacts) were removed; the canonical `<id>.json` and `latex/<id>/` for all affected papers (including
four files that belonged to other lanes' VLA fetches) were confirmed intact before/after.

## 7. by-paper notes written (deep-read cornerstones)

`notes/by-paper/2206.04114-director.md` (mandatory), `1703.01161-feudal-networks.md`,
`1609.05140-option-critic.md`, `1805.08296-hiro.md`, `1802.06070-diayn.md`,
`2406.00483-hierarchical-wm-limits.md`. The long tail (HAC, VIC, DADS, THICK, 2405.18418, 2404.16078,
2505.14975, Sutton-Precup-Singh, Dayan-Hinton, DEPS/Plan4MC/GITM) is manifest + abstract-level per the
contract (depth on cornerstones, breadth on the tail).
