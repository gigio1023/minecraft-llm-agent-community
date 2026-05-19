# Live NPC Dialogue Handoff Prompt

Use the prompt below to hand this repo to another AI.

```text
You are taking over unfinished work in /Users/naem1023/git/minecraft-llm-agent-community.

Current situation:
- There are two lines of work in this repo right now.
- `main` contains a checkpoint of earlier mutual-probe/docs work done directly in the root checkout.
- `live-npc-dialogue` contains the newer live-provider dialogue work done in an isolated worktree at `.worktrees/live-npc-dialogue`.
- Do not assume those two lines are already integrated. Check branch history before changing anything.

Worktree/branch to continue first:
- Branch: `live-npc-dialogue`
- Worktree path: `/Users/naem1023/git/minecraft-llm-agent-community/.worktrees/live-npc-dialogue`

Read these first:
1. `docs/specs/2026-05-19-live-npc-dialogue-design.md`
2. `docs/reports/2026-05-19-local-minecraft-agent-repo-analysis.md`
3. `docs/docs/Migration/openai-codex-provider.md`
4. `probe/src/mutual/runLiveDialogueProbe.ts`
5. `probe/src/mutual/openaiCodexProvider.ts`
6. `probe/src/mutual/mutualLoop.ts`
7. `probe/test/runtimeLogic.test.ts`

What is already complete on `live-npc-dialogue`:
- Task 1 complete and review-approved:
  - live dialogue config
  - dialogue context contract
  - provider schema parsing
- Task 2 complete and review-approved:
  - `converse` tool
  - transcript-visible speech fields
  - dispatcher-level transcript/failure wiring
- Task 3 complete and review-approved:
  - `openai-codex` auth loader
  - live provider request/response parsing
  - negative-path coverage for token/expiry/retry behavior
- Task 4 implementation exists and spec review passed:
  - async provider support in `runMutualLoop()`
  - `runLiveDialogueProbe.ts`
  - `liveCli.ts`
  - `probe:v1:live`
  - `scripts/run-live-mutual-dialogue-probe.sh`

Current direction:
- `docs/superpowers` is deprecated. Use `docs/reports`, `docs/specs`, and `docs/plans`.
- Do not continue by polishing persona prompts. Add Minecraft gameplay semantics first:
  curriculum, seed survival skills, and success verification.
- Voyager and other Minecraft agent repos have been cloned locally under `/Users/naem1023/git`.

Important repo rules:
- Keep runtime authority bounded and transcript-visible.
- Do not start browser/device auth unless the auth store is missing/expired/rejected or the user explicitly asks.
- Game provider auth is `build/provider-auth/openai-codex-auth.json`; do not print raw tokens.
- Prefer honest failure over fake fallback dialogue.
- Split large files before adding more behavior.

Likely useful checks to run first:
- `git log --oneline -12`
- `cd probe && bun test test/runtimeLogic.test.ts`
- `cd probe && bun run typecheck`
```
