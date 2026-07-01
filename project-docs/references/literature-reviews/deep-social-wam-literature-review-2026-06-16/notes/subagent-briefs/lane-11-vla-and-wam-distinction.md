# Lane 11 (F5) brief: VLA in depth, and the WAM-vs-VLA distinction

Lane name: VLA in depth, and the WAM-vs-VLA distinction (the reader's central question).
This brief summarizes what Lane 11 produced; the coordinator should Read the files below
for detail. Punctuation is ASCII `-` only.

## Owned deliverables (paths)

- Theme file (centerpiece): `notes/by-theme/vla-and-the-wam-vs-vla-distinction.md`
  (Part A VLA in depth with two tables; Part B the distinction in 5 source-backed points).
- Focused matrix: `matrices/wam-vs-vla-distinction.md` (VLA vs WAM head-to-head;
  WAM-as-actuator vs WAM-as-advisory; a "where the line blurs" table). Cross-links the
  wave-1 8-paradigm matrix `wam-vs-vla-vs-policy-vs-runtime.md`, does not duplicate it.
- By-paper notes (depth-extras only): `notes/by-paper/2507.01925-vla-survey-action-tokenization.md`,
  `2310.08864-open-x-embodiment.md`, `2504.16054-pi-0-5.md`, `2502.19645-openvla-oft.md`,
  `2503.14734-groot-n1.md`.
- Manifest: `raw-search-results/lane-11-manifest.jsonl` (9 rows).
- Search log: `raw-search-results/lane-11-search-log.md`.

Deconfliction honored: did NOT write by-paper notes for the VLA canon (RT-1, RT-2,
OpenVLA, Octo, pi-0); Lane 9 (F3) owns those and they exist after merge. Cited them by id.

## Sources reviewed (count + list)

LaTeX deep-read (5, all this lane's depth-extras): 2507.01925 (VLA survey, action
tokenization), 2310.08864 (Open X-Embodiment), 2504.16054 (pi-0.5), 2502.19645
(OpenVLA-OFT), 2503.14734 (GR00T N1).

Re-read for primary-source distinction facts (already downloaded; notes owned by other
lanes, cited not rewritten): 2605.12090 (WAM survey def/intro), 2603.22078 (do WAMs
generalize), 2605.06222 (FFDC advisory loop), 2602.15922 (DreamZero actuator), and the
VLA canon LaTeX 2212.06817 / 2307.15818 / 2406.09246 / 2405.12213 / 2410.24164.

Abstract-level breadth (4): 2405.14093 (first VLA survey, 2024), 2509.19012 (Pure VLA
survey), 2604.15483 (pi-0.7, 2026), 2512.06963 (VideoVLA, a VLA/WAM-boundary case).

Counts: sources logged in manifest = 9 (5 latex + 4 abstract). LaTeX downloaded by this
lane = 5. PDF-only = 0. Abstract-only = 4.

## Strongest findings (source-backed)

1. The formal separator is one bit, and it is strict. VLA = `p(a|o,l)`, WAM =
   `p(o',a|o,l)` with two criteria: forecast `o'` AND couple the action to it (WAM survey
   2605.12090). A model that predicts a future but does not couple the action to it is a
   "Video Policy," not a WAM (same source). This makes the distinction testable, not vibes.
2. "Has a deliberate/slow module" does not make a VLA a WAM. pi-0.5 (2504.16054) predicts a
   *language subtask* as its intermediate token, and GR00T N1's (2503.14734) System 2 plans
   - both semantic, neither a forecast of `o'`. Even goal-state VLAs (UniPi, AVDC, VPP,
   FLIP per VLA survey 2507.01925) that DO predict a future image may skip the coupling
   commitment. The WAM test stays strict against all of these.
3. The role axis is the one that decides this project. A VLA can only be an actuator (its
   output is the executed action). A WAM can be an actuator (DreamZero 2602.15922) OR an
   advisory predictor/evaluator (FFDC 2605.06222: predict expected state -> compare to
   observed evidence -> signal trust/replan, "does not fill arguments or override
   anything"). The advisory role has no VLA analogue, and it is the only role the repo
   rule ("LLM proposes, runtime owns truth, WAM stays advisory") admits.

Bonus, balanced: WAMs buy robustness/foresight at >=4.8x VLA inference cost (2603.22078);
VLAs are faster/simpler (pi-0 50 Hz; OpenVLA-OFT 26x throughput). But the latency objection
mostly dissolves for an advisory predictor running at a multi-second deliberation cadence.

## Weak or uncertain claims (what I could not verify)

- VideoVLA (2512.06963) and pi-0.7 (2604.15483) are 2025-12/2026-04 and used at abstract
  level only; their "joint future+action" / "steerable" claims are marked unverified report
  claims. VideoVLA looks like a VLA/WAM-boundary case but I did not read its body.
- GR00T N1's body LaTeX tarball contained only front matter; its exact params/Hz come from
  the abstract + the VLA survey's description, not an independent read of the paper body.
- All robustness/cost numbers (4.8x, 7 Hz, 74-82% perturbation success) are manipulation
  benchmarks; they do not transfer to social-material or Minecraft settings and are quoted
  with that caveat.

## Implications for this repo (mechanically useful vs research contribution)

- Mechanically useful: the two-criteria litmus test for "is this a WAM"; the
  actuator-vs-advisory split; the FFDC advisory control loop (predict -> verify -> signal)
  as the structure for an advisory social-material predictor; the action-token taxonomy
  (2507.01925) for locating the Actor Turn's output (closest to "code"/"raw action").
- Research contribution (interpretation, modest): an LLM tool-selector is VLA-shaped by
  default (`p(a|o,l)` over typed state). "Going WAM" = adding the missing piece a VLA
  lacks: a verified, advisory prediction of social-material consequences. That structured
  social-material transition prediction, used advisorily, is what no VLA and no surveyed
  WAM does. Building the verifier loop itself is *support*, not the contribution.

## Recommended next questions

- Does any existing WAM predict *structured/symbolic* state (not pixels/latent) and couple
  an action to it? If none, the structured-state advisory social WAM is genuinely novel
  (wave-1's `wam-foundations.md` suggests the structured branch is under-instantiated).
- For the advisory loop: what is the minimal social-material `o'` schema (possession move,
  obligation created, trust delta) that the runtime can already verify from inventory /
  container / transcript / verifier artifacts? That bounds a first small logged predictor.
- Deep-read VideoVLA (2512.06963) body to confirm whether it satisfies the WAM coupling
  criterion or is a goal-state VLA; it is the closest recent VLA-to-WAM bridge.
