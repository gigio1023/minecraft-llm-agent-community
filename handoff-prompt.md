# Successor Agent Prompt: Live Gates After A3/B2

You are continuing the V4 Minecraft social-sandbox implementation after the
provider-free A3/B2 successor repairs. Do not redo A3 budget stopping or B2
artifact-bag loading unless a regression is proven.

Use plain engineering and research language. Preserve exact branch, file, and
code identifiers when they must be spelled literally. English only.

## Objective

Stop before provider use unless the user supplies an exact provider/model/budget
and explicitly approves the run after quota preflight. Do not begin D2 unless
the user selects a real D1 observation record (fixture permanently ineligible).

## Definition Of Done For Previous Wave (already landed)

- A3 stops on cycle, total action, wall-time, provider-request, token, and
  estimated-cost limits; budget stops label `timeout` / `budget_exhausted`
  (or `unverifiable` for cost); declaration + partial artifacts preserved.
- B2 strictly loads `goal-continuity-artifact-bag/v1`, asserts bags at evaluate
  entry, and can write typed restart observations offline.
- Focused + full probe suite, typecheck, docs build, and diff check pass.
- No live provider request without the required user decision.

## Current Repository State

- Repository: `/Users/gigio/git/minecraft-llm-agent-community`
- Branch: `codex/capability-gated-social-sandbox-v4`
- Key commits: `76db6cc0` (B2 loader), `75a68ec9` (A3 stops), `83b26f85`
  (B2 evaluate assert), `c4266841` (A3 labeling/wall observe)
- Branch state: ahead of origin and not pushed unless the user asked
- Validation snapshot: `cd probe && bun test` → 725 pass; typecheck pass;
  `cd docs && npm run build` → pass

Before editing, run `git status -sb` and inspect the latest commits.

## Authority And Required Reading

1. `SPEC.md`
2. `AGENTS.md`
3. `CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`
4. `project-docs/orientation/agent-search-index.md`
5. `project-docs/orientation/terminology.md`
6. `project-docs/research/current-spine/central-plan-capability-gated-social-sandbox.md`
7. `project-docs/research/current-spine/capability-gated-social-sandbox-implementation-plan.md`
8. `project-docs/research/benchmarks/v4-implementation-explanation.md`
9. `implementation-notes.md`

For provider-backed work, use `.agents/skills/provider-quota-preflight/SKILL.md`
before any HTTP request.

Binding rules: Bun-only TypeScript; runtime owns Minecraft truth; no prose
authority; no live run without preflight + approval; no D2 from fixture.

## Accepted Provider-Free Work

A1R, A2, A3, A4, B1, B2, C1/C2 declarations, C3 format/writer, D1 fixture,
B3 declarations only.

## Still Blocked

- A5 / B3 live / live multi-actor: exact `(provider_id, model)`, estimate,
  preflight, and explicit user approval
- D2: user-selected real D1 phenomenon only
- Push/PR: only on request
- Live restart survival: not proven by offline writer alone

## Known Remaining Limits (do not regress)

- Tool-timeout `Promise.race` in `runAction` may still return while tool work
  continues; case budgets use abort+await instead.
- Provider HTTP cancel is a pre-planning abort check, not mid-request cancel.
- `max_estimated_cost` without normalized USD → `cost_unverifiable`.
- Mineflayer primitives are not fully abortable mid-primitive.

## Next Work (only after user decision)

1. Present exact `(provider_id, model)` and whole-run estimate.
2. Run provider quota preflight.
3. Treat `blocked` / `unbudgeted` / `needs_dashboard_approval` as not runnable
   unless the user explicitly approves after dashboard check.
4. Run only the approved command and budget.
5. Record truthful A5 artifacts; do not overclaim.

## First Three Actions

1. `git status -sb` and `git log -4 --oneline --decorate`
2. Confirm A3/B2 status in the implementation plan matches code
3. Wait for user provider/model approval or push request — do not invent either

## Final Delivery

Lead with what works and what remains unproven. Include commits, test counts,
provider preflight if any, remaining gaps, D1 fixture vs real observations, and
branch push state. Do not call V4 complete until live capability, continuity,
and multi-actor evidence exist.
