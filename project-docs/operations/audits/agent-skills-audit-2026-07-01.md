# Agent Skills Audit 2026-07-01

Search token: `AGENT_SKILLS_AUDIT_2026_07_01`.

Scope: repo-local agent skills under `.agents/skills/`.

This audit checks both shape and intent. A valid `SKILL.md` is not enough for
this repo; each agent skill must exist for a clear repeated workflow, preserve
the distinction between **agent skill** and **action skill**, and stay below
`AGENTS.md`, `SPEC.md`, runtime authority, provider quota, report, and evidence
rules.

## Summary

All five repo-local agent skills are worth keeping. Do not merge or retire them
now.

The current split is intentional:

- `provider-quota-preflight`: pre-run provider cost and quota gate.
- `minecraft-run-report-author`: report and conclusion discipline.
- `minecraft-agent-runtime-review`: behavior-loop and artifact diagnosis.
- `minecraft-research-value-harness`: research-value and experiment-design
  pressure testing.
- `mineflayer-code-generation`: bounded Actor Turn
  `author_mineflayer_action` codegen contract.

These workflows overlap in evidence sources, but they should not be collapsed.
The overlap is coordination, not duplication. Merging them would make agents
load too much context and blur when a task is about cost, report prose, runtime
debugging, research value, or generated Mineflayer source.

## Findings

### P2 - Ambiguous Action-Skill Reference Names

`minecraft-agent-runtime-review` had reference filenames that could be mistaken
for repo-local agent skill governance:

- `references/minecraft-skill-audit.md`
- `references/skill-creation-review.md`

Both files are actually about Minecraft runtime **action skills**. Rename them
to action-skill-specific names and update `SKILL.md` links:

- `references/minecraft-action-skill-audit.md`
- `references/action-skill-creation-review.md`

This is not cosmetic. The repo has a normative terminology split between agent
skills and action skills, and ambiguous file names make future audits harder.

Status: fixed in this cleanup.

### P2 - Inconsistent Skill UI Metadata

Only `minecraft-run-report-author` had `agents/openai.yaml`. Add generated
metadata for all repo-local agent skills, and update the existing default prompt
to include the explicit `$skill-name` invocation pattern required by the current
skill metadata guide.

This does not change runtime behavior. It makes skill discovery and UI
presentation consistent across Codex/agent surfaces that read
`agents/openai.yaml`.

Status: fixed in this cleanup.

### P2 - No-Regret Transition Rows Need First-Class Report Routing

`transition-row/v1` and `transition-row-batch-audit/v1` are central to the
no-regret core, but the report/review skills were still shaped mainly around
`social-cycle-run-report/v1`.

Keep `minecraft-run-report-author` and `minecraft-agent-runtime-review` as the
owning skills for now. Do not add a new top-level agent skill unless row-batch
audit becomes a repeated workflow with its own commands and fixtures. Instead,
make row-batch refs, seed/reset records, no-regret declarations, and
`observed_delta` vs `expected_outcome` separation first-class in report
readiness and review guidance.

Status: first-class report/review routing added in this cleanup.

### P2 - Publishable Reports Need Stricter Preflight Handling

Provider-backed public/model-comparison reports may keep old artifacts as
warnings, but publishable report readiness should fail when preflight evidence is
missing. Otherwise the report skill can still let agents write budget-safety
claims that are not backed by the quota gate.

Status: `report-readiness-check.ts --publishable` now fails missing provider
preflight refs and missing transition-row batch audit refs when transition rows
exist.

### P3 - Runtime Review Skill Has Highest Drift Risk

`minecraft-agent-runtime-review` is the largest skill and carries the most
historical run knowledge. It should remain large enough to diagnose real runs,
but maintainers should keep stale runtime-schema details in reference files or
the summarizer, not buried as timeless rules in the main `SKILL.md`.

Do not split it today. The current reference layout already provides progressive
disclosure. Split only if a future repeated workflow becomes independent enough
to trigger separately, such as visual-evidence-only review or action-skill
matrix triage.

### P3 - Script CLI Guardrails Should Reject Typos

Quota preflight scripts are cost gates. Unknown CLI flags should fail instead of
being ignored, because a typo in an estimate or output path can make a run look
checked when it was not.

Status: fixed for both provider quota scripts in this cleanup.

## Skill Verdicts

### `provider-quota-preflight`

Verdict: keep as a separate gate.

Reason: provider quota checks are fragile, cost-sensitive, and must happen
before live provider calls. This skill correctly bundles deterministic scripts
and repo-specific policy references. It should not be merged into report
authoring because preflight happens before a run, while report authoring happens
after artifacts exist.

Watch points:

- Keep example model strings aligned with `probe/src/provider/providerQuotaPolicies.ts`.
- Treat example model strings as illustrative only; exact run candidates and
  `providerQuotaPolicies.ts` own the policy match.
- Keep OpenAI dashboard approval as a hard blocker when local ledger alone is
  insufficient.
- Keep whole-run estimates mandatory.
- Reject unknown flags in quota scripts so estimate or output-path typos do not
  silently pass.

### `minecraft-run-report-author`

Verdict: keep as a separate report gate.

Reason: report failures are a recurring workflow problem distinct from runtime
debugging. This skill correctly forces Recording verdict vs Experiment verdict,
claim tables, preflight linkage, and screenshot limitations.

Watch points:

- Keep commands in sync with `probe/package.json`.
- Keep report-readiness checks focused on artifact integrity and claim
  discipline, not broad behavior review.
- Use `--publishable` for public, HTML, or model-comparison reports.
- For no-regret-core reports, require row-batch audit refs before making
  readiness, Goldilocks, or research claims.

### `minecraft-agent-runtime-review`

Verdict: keep as the runtime behavior diagnosis hub.

Reason: this is the right home for run/transcript/action-skill matrix/visual
evidence diagnosis. It should continue to read artifacts before code and turn
visible behavior into implementation targets.

Watch points:

- Avoid letting stale archived fields such as `action_intent_ref` override
  current Actor Turn artifacts.
- Keep action-skill review references named as action-skill references.
- Do not let review categories become hidden runtime planners.
- For `transition-row/v1` batches, load the current-spine contracts before
  judging no-regret or Goldilocks readiness.

### `minecraft-research-value-harness`

Verdict: keep as the research-intent gate.

Reason: this skill protects the project from treating schemas, verification,
logs, or polished reports as the research contribution. It correctly separates
mechanical literature lessons from repo adaptation under the no-regret core.

Watch points:

- Use web/HF research only when current prior work matters.
- Keep verdict labels strict; most ambitious ideas should remain `core-first`
  until non-degenerate transition-row evidence exists.
- The small `assets/` templates are acceptable, but if they drift from
  `references/artifact-templates.md`, keep only one source of truth.
- Do not reference nonexistent `docs/skill/templates`; use this skill's
  `assets/` templates and current-spine docs.

### `mineflayer-code-generation`

Verdict: keep as a narrow Actor Turn codegen contract.

Reason: this skill is intentionally not a generic Mineflayer cookbook. It should
only support Actor Turn `author_mineflayer_action`, schema-bound parameters,
helper allowlists, trial evidence, and promotion boundaries.

Watch points:

- Keep helper lists aligned with the runtime helper API.
- Do not add broad Minecraft strategy, raw bot access, or planner shortcuts.
- Keep generated source authority below runtime validation and lifecycle
  promotion.
- Use `PrismarineJS/mineflayer@03eba44f` as the portable Mineflayer source
  reference; local clone paths are optional inspection aids.

## Maintenance Gate

When changing repo-local agent skills:

1. Read the target `SKILL.md` and any directly referenced resource being edited.
2. Confirm the skill owns a repeated workflow, not a one-off preference.
3. Confirm the frontmatter description contains the trigger conditions.
4. Keep `SKILL.md` concise; move detailed variants to `references/`.
5. Preserve agent skill vs action skill terminology.
6. Check links, scripts, examples, and model/provider strings against current
   repo files.
7. Regenerate or update `agents/openai.yaml` when the skill's purpose changes.
8. Run `quick_validate.py` for every touched skill.
9. Run focused script tests or smoke commands for changed bundled scripts.
10. Record drift risks in an audit or handoff doc instead of hiding them in
    broad prose.
