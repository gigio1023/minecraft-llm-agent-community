---
name: minecraft-agent-runtime-review
description: >
  Review real Minecraft LLM agent runs from transcript files, canonical runtime
  artifacts, social-cycle reports, actor workspaces, logs, Langfuse traces,
  human-visible behavior notes, and code diffs, then infer concrete
  implementation flaws and next fixes. Use for prompts like "agent 행동
  리뷰해줘", "실행 결과에서 인사이트 뽑아줘", "NPC 행동 패턴 분석",
  "100 cycle 결과 봐줘", "관찰-행동-목표 루프 분석", "why did the NPC stall?",
  "matrix 12/12 깨졌어", "collectLogs 3/4에서 멈춰", or "Langfuse trace까지 보고
  구현 개선해줘" after Minecraft runtime, action-skill, or social-cycle runs.
---

# Minecraft Agent Runtime Review

This is an **agent skill**: a Codex/Claude-style `SKILL.md` capability for
reviewing this repository. When it talks about Minecraft runtime behaviors, use
the repo term **action skill**.

## Quick Start

1. Identify the exact run under review: transcript path, canonical artifact,
   `social-cycle-run-report/v1`, terminal output, human-visible behavior note,
   Langfuse trace/session, and current git diff.
2. Read artifacts before code. Treat `final.status`, optimistic messages, and
   test passes as claims to verify, not evidence.
3. For `social-cycle-run-report/v1`, run the bundled summarizer first:

   ```bash
   node .agents/skills/minecraft-agent-runtime-review/scripts/summarize-social-cycle-report.mjs <report.json>
   ```

4. Reconstruct the actual behavior loop. Include what the human saw, for
   example "pretends to chop", "walks away in one direction", or "keeps retrying
   empty space".
5. Build an evidence table: actor, task, observation before/after, tool call,
   tool result, verification, timeout/stall/reconnect evidence, final label, and
   behavior mismatch.
6. Decide the behavior verdict:
   - `VALID_PROGRESS`: world or inventory state proves progress.
   - `DIAGNOSABLE_FAILURE`: no success, but artifacts explain the next fix.
   - `MISLEADING_SUCCESS`: final status says success while evidence says stall.
   - `LIVE_BEHAVIOR_FAILURE`: human-visible behavior proves the primitive is not
     doing the task, even if artifacts are incomplete.
   - `PASSED_RUNTIME_BUT_BEHAVIOR_LOOP_WEAK`: the run completed and made
     verified low-level progress, but observation/action choices collapsed into
     narrow loops or failed to update durable settlement/social state.
   - `UNDIAGNOSABLE`: artifacts are missing the facts needed to improve code.
7. Map each finding to a small implementation target: verifier, tool primitive,
   action runner, session/reconnect, transcript/artifact, provider proposal, or
   setup/auth.
8. Report findings first, then propose or apply narrow fixes if the user asked
   for implementation.

## Evidence Sources

Read `references/evidence-sources.md` when you need the expected artifact paths,
useful `jq` queries, or Langfuse handling rules.

Read `references/behavior-insight-loop.md` when the user describes what they saw
in-game or when the artifact says "success/progress" but the visible behavior
looked wrong.

Read `references/minecraft-skill-audit.md` when reviewing seed action skills,
Mineflayer primitives, Minecraft progression, or advertised action-skill
capabilities.

Read `references/live-matrix-lessons.md` when a deterministic action-skill
matrix fails, a single-skill probe passes but the full matrix fails, block
mining/chopping stalls, storage observation breaks unrelated probes, or the run
depends on generated fixture state.

Read `references/skill-creation-review.md` when reviewing proposals to create,
promote, supersede, or retire an action skill from runtime evidence.

Read `references/social-cycle-report-schema.md` before analyzing
`social-cycle-run-report/v1` shape, actor workspace refs, provider usage,
judgments, retry constraints, settlement state, or memory reuse.

Read `references/social-cycle-analysis-rubric.md` before claiming that the
observation -> action -> long-term goal loop is strong or weak. It defines the
loop-diagnostic metrics and interpretation traps.

## Review Workflow

### 1. Establish Run Identity

Use the newest artifact only if the user did not name one.

Collect:
- terminal command and output;
- user or reviewer observation of visible in-game behavior;
- `tmp/social-cycle-*.json` and matching actor workspace when reviewing
  social-cycle runs;
- `data/evidence/*probe*.json`;
- matching `*-canonical-*.json`;
- any generated checkpoint/debug timeline;
- Langfuse trace/session URL or local trace metadata, when provider-backed paths
  were used;
- `git diff --stat` and the code diff for touched runtime modules.

If artifacts and terminal output disagree, prefer the artifact for state details
and terminal output for process/setup failures.

If human-visible behavior and artifacts disagree, treat that as a first-class
finding. The likely issue is either missing artifact evidence or a primitive that
reports the wrong thing.

For social-cycle runs, do not stop at `runtime_status`. Resolve the actor
workspace refs and compare low-level verified progress against durable
settlement/social state.

### 2. Inspect Behavior, Not Intent

For each actor, answer:
- What task did it believe it was doing?
- What did the human actually see it do?
- What did it observe before acting?
- What tool was called with which args?
- Did the tool return timeout, blocked, failed, or optimistic success?
- What changed in inventory, nearby blocks, position, chest state, dialogue, or
  session state?
- Did verification use the observed change, or just trust tool status?
- Did the final label match the evidence?
- Which implementation mechanism best explains the visible failure?

For `social-cycle-run-report/v1`, also answer:
- Did observation change the next action, and how often did that next action
  produce verified progress?
- How much of the exposed action surface was used as top-level intent and as
  executed tools?
- Did action choices concentrate into a narrow gather/craft/place loop?
- Did verified primitive evidence update settlement checklist/state?
- Were there social signals: visible actors, `say`, shared storage, relationship
  events, or obligations?
- Did retry constraints stop repeated exact target/args failures?

Do not count these as success by themselves:
- `remember` notes;
- provider explanations;
- `status: collected` without inventory or block evidence;
- `status: arrived` without distance evidence;
- socket reconnect without rebinding tool/session dependencies;
- Langfuse trace completion without matching world progress.

### 3. Classify The Failure

Prefer concrete classifications:
- `tool-evidence-gap`: tool cannot report the state needed to verify itself.
- `verification-gap`: evidence exists but verifier ignores it or accepts a weak
  proxy.
- `provider-repeat`: provider keeps proposing an action after failed evidence.
- `runtime-label-bug`: final status misrepresents a stall or failed task.
- `setup-path-bug`: server, RCON, auth, spawn, or port setup blocked the run.
- `artifact-gap`: transcript cannot explain what changed or why.
- `skill-ownership-gap`: per-agent action skill metadata exists but is not used
  to shape proposals or responsibilities.
- `skill-creation-gap`: a proposed learned/derived action skill lacks evidence,
  primitive contracts, verifier, lifecycle state, or safe promotion boundaries.
- `primitive-control-gap`: the tool combines targeting, movement, action, and
  pickup without enough local guards, cancellation, or drift checks.
- `target-selection-gap`: the tool chose a target that was too high, too far,
  stale, unreachable, or unrelated to the current task.
- `fixture-gap`: live fixture setup creates stale, high, unloaded, or
  cross-run-contaminated world state.
- `pickup-race`: the block was removed but the dropped item entered inventory
  later than the primitive or verifier expected.
- `current-run-proof-gap`: a historical transcript or single-skill pass exists,
  but the full implemented action-skill matrix does not pass in the current run.
- `loop-constriction`: observations produce actions, but choices collapse into a
  narrow subset such as observe/collect/craft/place despite a broader action
  surface.
- `state-consolidation-gap`: runtime evidence proves a world/inventory/container
  change, but settlement state, checklist, memory, or relationship state does
  not absorb it.
- `harness-narrowing`: prompts, fixtures, allowed actions, success criteria, or
  deterministic tests over-shape behavior so the NPC optimizes the harness
  instead of using the Mineflayer body broadly.
- `social-surface-gap`: a social-cycle run has little or no visible actor,
  `say`, shared-storage, relationship, obligation, or conversation evidence.

### 4. Turn Review Into Code Work

Every implementation recommendation should name:
- the exact evidence that triggered it;
- the visible behavior symptom, if one exists;
- the file or module likely responsible;
- the smallest code change that would make the next run more informative or more
  correct;
- the focused test or live smoke that would prove it.

Keep fixes narrow. Do not expand toward persona richness, raw eval, Voyager-style
loops, or broad multi-bot society behavior while single-bot competence and
observability are still weak.

When the finding is loop constriction, do not "fix" it by adding a more
deterministic planner. Prefer widening raw observation, exposing more bounded
Mineflayer-backed action choices, reducing domain-specific prompt rails, and
making durable state consolidation truthful.

## Output Shape

Lead with findings:

```text
Findings
P1 - [runtime-label-bug] final.status says success although both actors ended
     with "blocked repeatedly".
Evidence: ...
Fix target: ...

P2 - ...

Behavior verdict: MISLEADING_SUCCESS
Behavior insight: The agent is not failing at "planning"; it is failing inside
the collect_logs primitive because target selection, movement, cancellation, and
pickup are bundled without enough evidence gates.
Next implementation slice: ...
Artifacts reviewed: ...
```

If there are no blocking issues, say so and list remaining evidence gaps.

## Gotchas

- A run can exit `0` and still be product-failing. Exit code proves process
  completion, not agent competence.
- A test can pass while live behavior is weak. Use tests to protect the specific
  evidence rule discovered from the live run.
- `remember` is not success. It may be a terminal failure note.
- Human-visible behavior can be stronger evidence than a thin transcript. If the
  user says the bot only pantomimed chopping and walked away, the review must
  explain which missing artifact fields would have caught that.
- If Langfuse is unavailable for deterministic runs, say that explicitly instead
  of pretending trace review happened.
- Do not inspect or print raw provider tokens. For auth, check presence/path and
  smoke-result only.
- Keep review and implementation separate in the report. If you patch during the
  review, disclose exactly what changed and why.
- For social-cycle reports, "observation is useful" and "the loop is weak" can
  both be true. Check observation-to-next-action metrics before claiming
  observation failed.
- A high `verified_progress` count can still be weak when progress repeatedly
  creates disposable local items or never updates settlement/social state.
- If a report shows verified `place_block`, `craft_item`, or container evidence
  but the checklist remains pending, classify that as `state-consolidation-gap`
  before blaming the NPC.
- Be skeptical of narrow deterministic harness success. The project wants raw
  observation plus broad Mineflayer-backed agency, not a bot that merely learns
  the smallest scripted path through a test.
