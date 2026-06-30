# Lane 21 (H4) brief: Open-ended automated curriculum and task/environment generation

Wave 4, autoresearch lens. Anchored to ENPIRE (`notes/by-paper/enpire.md`). Owner: lane-21.

## Lane name
Open-ended automated curriculum and task/environment/goal generation, ordered by learnability.

## Sources reviewed (count + list)
27 sources logged in `raw-search-results/lane-21-manifest.jsonl`. 7 deep-read (LaTeX), 20
abstract-level (breadth + connecting nodes). No PDF-only (all deep-reads had LaTeX source).

- **Deep-read (LaTeX), with by-paper notes**:
  - POET (1901.01753) - `notes/by-paper/1901.01753-poet.md`
  - Enhanced POET (2003.08536) - `notes/by-paper/2003.08536-enhanced-poet.md`
  - OMNI (2306.01711) - `notes/by-paper/2306.01711-omni.md`
  - OMNI-EPIC (2405.15568) - `notes/by-paper/2405.15568-omni-epic.md`
  - ACL survey, Portelas et al. (2003.04664) - `notes/by-paper/2003.04664-acl-survey.md`
  - Eurekaverse (2411.01775) - `notes/by-paper/2411.01775-eurekaverse.md`
  - MAGELLAN (2502.07709) - `notes/by-paper/2502.07709-magellan.md`
- **Abstract-level (breadth)**: MAP-Elites 1504.04909, ALP-GMM 1910.07224, PAIRED 2012.02096,
  ACCEL 2203.01302, AdA/Human-Timescale 2301.07608, XLand 2107.12808, DiCode 2602.08194,
  CLUTR 2210.10243, QDAIF 2310.13032, Genie 2402.15391, Hughes-open-endedness 2406.04268,
  TeachMyAgent 2103.09815, DataEnvGym 2410.06215, Augmenting-Autotelic-w-LLMs 2305.12487, and
  the LLM self-improvement nodes (OpenSIR 2511.00602, Socratic-Zero 2509.24726, SOAR 2601.18778,
  Self-Evolving-Curriculum 2505.14970, ACuRL 2602.10356, Darwin Godel Machine 2505.22954).

## Strongest findings (source-backed)

1. **The field already separates the two filters the repo needs, and only one is
   verifier-groundable.** OMNI (2306.01711) makes it explicit: open-ended generation must filter for
   *learnability* (frontier of competence; measurable, hence verifier-friendly) AND *interestingness*
   (worthwhile/novel). It delegates interestingness to a foundation model precisely because
   hand-coded interestingness metrics get gamed (its stated Goodhart caution). Implication: the
   repo's verifier can supply the learnability signal; interestingness must stay advisory.
2. **A solve-grounded progress meter already exists, and is the right shape for a verifier loop.**
   Enhanced POET's ANNECS (2003.08536) counts a generated environment only if it passed the minimal
   criterion (not-too-easy/not-too-hard) AND was eventually *solved*. OMNI-EPIC's ANNECS-OMNI
   (2405.15568) adds an FM-interesting criterion. The repo can adopt ANNECS with its runtime verifier
   as the "solved" oracle (keeping the interesting axis advisory), giving an honest "are we still
   producing learnable-and-new social scenarios?" meter.
3. **The autoresearch loop is real and transfers when success is physically clean; this bounds the
   thesis.** Eurekaverse (2411.01775) generates an environment curriculum as code, co-evolves it with
   the policy, beats human-designed courses, and transfers to a real robot. OMNI-EPIC generates the
   environment AND a separate `get_success` checker, explicitly kept apart from the shaped reward so
   it "does not affect how the agent learns" (anti-reward-hacking). Both work because success is
   checkable. The repo's hand-authored runtime verifier is *stronger* than OMNI-EPIC's auto-generated
   `get_success`; the defensible repo design generates only the scenario setup and lets the verifier
   own the label.

## Weak or uncertain claims (what I could not verify)

- All numeric results from the LLM self-improvement nodes (OpenSIR +4.4 GSM8K, Socratic-Zero
  +20.2 points, ACuRL 4-22% and CUAJudge 93% agreement) are **abstract-stated, not source-verified**;
  logged as `claim-only`/`partial`. They are also math/answer-verified or self-judged, not social.
- Eurekaverse cost (~$15, ~24h on 8 A6000) is paper-stated; not reproduced here (and the repo's
  no-paid-provider rule makes it a reference, not a plan).
- DiCode (2602.08194) and SOAR (2601.18778) read at abstract level only; their "sustained
  progression" and "edge-of-learnability" mechanisms are promising but not deep-read.
- **ACED** (a "verify-then-add" seed) could not be located as a distinct canonical arXiv paper in
  this area via HF or web; not logged (avoided fabricating an id). Eurekaverse is deep-read as the
  LLM-environment-codegen cornerstone instead.
- I did not verify whether any released code (POET, OMNI-EPIC, Eurekaverse repos) actually runs here;
  reproducibility is judged from stated open-source availability, not execution.

## Implications for this repo (mechanically useful vs research contribution)

- **Mechanically useful**: (1) the generate -> run -> verify -> select-next loop maps onto the repo's
  cycle; (2) generate scenarios as typed specs/code with a validity gate (reject impossible social
  setups pre-Actor-Turn); (3) keep an archive of verifier-labeled scenarios + similarity retrieval as
  stepping stones, and co-evolve from scenarios that produced competence; (4) ANNECS-with-verifier as
  the progress meter; (5) MAGELLAN-style learnability prediction so an advisory WAM ranks the next
  scenario without running all; (6) use the maturity ladder (proto-social -> society) as the
  hand-authored curriculum spine the loop extends.
- **Research contribution (what none of this provides)**: every method here grounds "success" in a
  clean scalar (env return, math answer, course traversal) or an LLM/auto-generated checker. None
  generates *social-material* situations (possession, obligation, weak-commons) scored by a
  *hand-authored embodied verifier*. The repo's distinctive, defensible claim is an autoresearch loop
  that auto-generates social-material scenarios whose `(state, action, next-state)` the existing
  runtime verifier labels, keeping interestingness advisory and never letting the generator/actor
  score itself.

## Recommended next questions

1. Can the runtime verifier emit a clean enough per-scenario "solved" label at the Material layer
   (possession transfer, weak-commons depletion) to drive a minimal-criterion gate and an ANNECS
   counter? (If yes, the loop is viable there; if not, start at Physical.)
2. What is the smallest typed scenario-spec schema (who holds what, what is scarce, who needs whom,
   shared affordances) that the runtime can instantiate and the verifier can score, so generation
   targets specs rather than free prose?
3. How to define a *learnability* signal for a social scenario without an LLM judge - e.g. spread of
   actor outcomes (PATA-EC-style rank) or verifier-measured completion rate across actors?
4. How to avoid the "boring numerical-variation" trap (OMNI) in social space (e.g. "borrow N planks"
   is not N scenarios) - what is the social analog of a meaningful behavior axis (MAP-Elites cell)?
5. Sequence vs single scenario (DiCode): can the maturity ladder give a learnable *progression*
   rather than isolated probes, and can the verifier label progression, not just per-step success?
