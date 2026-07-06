# Legibility Cycle 2 Codex Handoff (2026-07-06)

Status: active handoff prompt for executing Phase A of
`LEGIBILITY_CYCLE_2_WORK_PLAN` in a Codex session.

Search token: `LEGIBILITY_CYCLE_2_CODEX_HANDOFF`.

Usage: paste the prompt below into a fresh Codex session at the repo root,
or instruct the session to read this file and execute it. The prompt is
self-contained; everything after the horizontal rule is the prompt body.

---

You are executing Phase A of the legibility cycle 2 work plan in
`minecraft-llm-agent-community`. Work from the repo root on branch `main`.

## 0. Objective

Turn the merged provider-free legibility pipeline into a **live** 2-3 bot
substrate and pass the C2-G live provider-free gate, then self-review the
result against the plan's intent and improve it before finishing. Zero
provider spend this session. Phase B (live pilot, provider calls) is out
of scope and must not be started.

## 1. Starting state (verified 2026-07-06)

- `main` at `17b1ac6c` (`docs: add cycle-2 live-substrate work plan`),
  on top of `19fc3206` (cycle 1 substrate merge).
- Green baseline: `bun run typecheck` clean and `bun test` 565 pass / 0
  fail from `probe/`; `bun run probe:legibility-session1-smoke` reruns
  with substantively identical artifacts.
- The cycle 1 pipeline is in-memory only: its actors are stubs, its
  labels come from regex over chat text, its `history_grounded` arm is
  an oracle, and its identity-permutation leakage check is a hardcoded
  pass. Closing exactly these gaps is your job.

## 2. Read first, in this order

1. `AGENTS.md` (binding authority; also loaded natively).
2. `project-docs/research/current-spine/legibility-cycle-2-live-substrate-work-plan.md`
   — THE work order. Sections 2 (gap audit G1-G9), 3 (C2-1 design
   decision), 5 (Phase A slices C2-1..C2-7 and the C2-G gate), 7
   (testing addendum) are binding for this session.
3. `project-docs/research/current-spine/embodied-co-actor-legibility-implementation-plan.md`
   — seams, module map, testing rules; its acceptance semantics win over
   the work plan on any conflict.
4. `project-docs/research/current-spine/central-plan-embodied-co-actor-legibility.md`
   sections 3.2-3.5 (conditions, window rule, labels, metrics).
5. `project-docs/research/current-spine/transition-row-label-codebook.md`
   and `transition-row-v1-contract.md` before touching the labeler.
6. Key code: `probe/src/legibility/*`, `probe/src/runtime/createBots.ts`,
   `probe/src/runtime/socialCycleRunner.ts`,
   `probe/src/mutual/runMutualProbe.ts` (multi-bot precedent),
   `probe/src/tools/observe.ts`, `probe/src/server/serverEndpointProbe.ts`.

## 3. Non-negotiable guardrails

- **No provider spend.** Only `deterministic-social` and
  `scripted-social` provider ids may execute. Any live LLM call requires
  the quota preflight skill plus explicit user approval — neither is
  granted in this session. If you believe a live call is needed, stop
  and report instead.
- **Runtime code owns Minecraft truth.** Labels, permissions, success,
  and retry clearance come from typed runtime evidence — never from
  regex/string heuristics over provider prose. This is the exact defect
  class you are removing (work plan G2); do not reintroduce it anywhere.
- **Bun only**: `bun run <path.ts>`, `bun test`, `bun run typecheck`
  from `probe/`. Never node/ts-node/tsx.
- **No condition-keyed branches** in runtime: conditions live in the
  declaration and routing map only. Provider-id checks for bookkeeping
  are allowed; `condition ===` outside declaration/routing construction
  is not.
- **Scorer is frozen.** `probe/src/legibility/scoring.ts` metric
  definitions are locked by tests and by the central plan; changing them
  requires a central-plan amendment you are not authorized to make.
- **`DEPTH_NOT_SCALE`**: 2-3 actors, never more, regardless of results.
- Do not touch `project-docs/references/**` or archived/superseded docs.
- External/global skills (including the orchestrator skill below) are
  advisory; repo gates always win.
- Commit discipline per `CONTRIBUTING.md`: per-slice commits with
  `Why:` / `What changed:` / `Validation:` bodies; update the acceptance
  checkboxes in BOTH plan docs in the same commit as the slice that
  satisfies them.

## 4. Environment

- Live sessions use the docker-compose Minecraft server resolved by
  `resolveServerEndpoint` (see how `runSocialCycle` and `runMutualProbe`
  obtain endpoints; `fresh_world` mode for deterministic scenarios). If
  the server cannot be provisioned, record the exact failure and report
  it as a blocker — do not simulate live artifacts or substitute stubs
  and call them live.
- Artifacts land under `project-docs/experiments/raw/<date>/...`; the
  run-report skill is
  `.agents/skills/minecraft-run-report-author/SKILL.md` with its
  `report-readiness-check.ts` script.

## 5. Orchestration

Use the `parallel-subagent-orchestrator` skill
(`~/.agents/skills/parallel-subagent-orchestrator/SKILL.md`) as the lead
agent, with this dependency-respecting wave structure. Every subagent
gets a self-contained packet: objective, in-scope files, exclusions
(especially: no provider spend, no scorer edits, no references/ edits),
output contract (diff + test evidence + artifact paths), and stop
condition. You (lead) own conflict resolution, synthesis, and commits.

- **Wave 0 — lead only, sequential.** Read the docs above; re-verify the
  green baseline; then do the C2-1 prefactor yourself: extract the
  per-turn core (provider call -> gate -> execute -> verify -> record)
  from `runSocialCycle` per work plan section 3, behavior-locked — the
  extraction commit must not change any existing test expectation. Then
  land the live shared-session entrypoint on `runSharedSessionSchedule`
  + `createBots` (C2-1 acceptance). This is the bottleneck; do not
  parallelize it.
- **Wave 1 — parallel after C2-1.** Disjoint lanes, isolated worktrees
  or clearly partitioned files:
  - Lane A: C2-2 live cross-actor observation + chat capture
    (`observe` wiring, `structured-chat-event/v1` from real Mineflayer
    chat, `observed_by` from typed range policy).
  - Lane B: C2-7 condition machinery (`stable_soul` routing through the
    existing ActorSoul pipeline, `seed-reset-record/v1` writer,
    provider-free rehearsal with deterministic stand-ins).
  - Lane C (code-only start, acceptance deferred): C2-5 real leakage
    checks (actual identity permutation, key-level prompt-shape scan,
    fail-closed export/scoring, injected timestamps) and C2-6 predictor
    arms (typed public-history-only inputs) developed against cycle 1
    smoke artifacts.
- **Wave 2 — sequential core, parallel edges.** C2-3 live window
  lifecycle (including a deterministic stall fixture proving `timeout`
  closure), then C2-4 evidence-grounded labeler (delete/quarantine the
  smoke regex labelers; every codebook class gets a positive case and a
  keyword-without-evidence negative case). Meanwhile Lane C finalizes
  C2-5/C2-6 acceptance on the live-shaped fixtures Wave 2 produces.
- **Wave 3 — the gate.** Implement and run
  `probe:legibility-live-smoke` (C2-G): one command, real server, 2
  bots, deterministic + scripted routes, windows, evidence-grounded
  labels, checked export, real predictor arms, full score report,
  artifacts under the experiments tree, rerun-stable. The trivial
  history predictor must show lift over per-condition majority on
  scripted-responder rows from public history only; if it cannot, that
  is K1-shaped — stop, preserve the artifacts, and report; do not tune
  anything to force lift.

## 6. Self-review and improvement (required, not optional)

After Wave 3, run a review wave with independent reviewer lanes that did
NOT write the code they review, then an improvement pass:

- **Intent review**: re-read work plan sections 1-2 and the central plan
  3.2-3.5, then adversarially check every G1-G9 gap and every Phase A
  acceptance box against the produced artifacts — not against test
  green. The question is "does this close the gap the plan meant", e.g.
  labels provably grounded in typed evidence, windows non-vacuous,
  predictors physically unable to see private state.
- **Repo-rule review**: sweep the diff for prose-parsing policy
  decisions, condition-keyed branches, non-Bun invocations, scorer
  drift, and terminology violations (`AGENTS.md`, `terminology.md`).
- **Runtime review**: apply
  `.agents/skills/minecraft-agent-runtime-review/SKILL.md` to the C2-G
  live smoke artifacts.
- **Test-quality review**: per the implementation plan section 6, any
  test that would pass with broken runtime behavior gets rewritten or
  deleted; mock-heavy provider/Mineflayer simulations are banned.

Fix everything the review substantiates, rerun `bun run typecheck`,
`bun test`, and the C2-G smoke, and iterate review -> improve until the
reviews come back clean or a finding is genuinely out of Phase A scope
(then record it in the work plan's section 9 area as follow-up).

## 7. Deliverables

1. Per-slice commits on `main` (C2-1..C2-7, C2-G) with checkbox updates
   in both plan docs, per the commit discipline above.
2. C2-G artifacts under `project-docs/experiments/raw/<date>/` and the
   artifact path recorded in the work plan section 9.
3. A run report authored via the run-report skill, passing
   `report-readiness-check.ts`.
4. A final summary stating: which acceptance boxes are now checked with
   evidence paths; what the review wave found and what was fixed; any
   honest blockers or K1-shaped signals; and explicit confirmation that
   provider spend was zero.

If any slice cannot be completed honestly, prefer a truthful partial
handoff (what landed, what blocked, exact reproduction commands) over a
green-looking but fixture-faked result. That trade is the whole point of
this experiment's substrate.
