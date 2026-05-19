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
1. `docs/superpowers/specs/2026-05-19-live-npc-dialogue-design.md`
2. `docs/docs/Migration/openai-codex-provider.md`
3. `probe/src/mutual/runLiveDialogueProbe.ts`
4. `probe/src/mutual/openaiCodexProvider.ts`
5. `probe/src/mutual/mutualLoop.ts`
6. `probe/test/runtimeLogic.test.ts`

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

Task 4 status:
- Implementation commit exists.
- Spec review passed.
- Quality review result was lost/interrupted during the long session, so rerun quality review on Task 4 before proceeding.

Known commit history on `live-npc-dialogue`:
- `dad5abf` Wire live mutual dialogue probe
- `05c1bdf` Fix whitespace-only Codex token validation
- `5f4ad70` Add auth negative-path tests
- `b009dc0` Harden Task 3 provider contract
- `886d26c` Add openai-codex auth and provider parsing
- `2c0fe21` Fix Task 2 mutual tool records
- `707aca7` Add mutual converse tool
- `12a3f9c` fix: align dialogue context contract
- `7037590` Fix Task 1 mutual contract review
- `5d0b3a6` Fix Task 1 dialogue context tool contract
- `1701234` Lock live dialogue contracts

Immediate next steps:
1. Review Task 4 quality on branch `live-npc-dialogue`.
2. Fix any Task 4 issues if found.
3. Complete Task 5:
   - update README
   - update `docs/docs/Agent-Search-Index.md`
   - run the small suite
   - run the live proof command
4. Only after that, decide how to integrate `live-npc-dialogue` with the checkpointed `main` line.

Important repo rules:
- Keep the runtime bounded: one validated tool per turn.
- Do not reintroduce Voyager-style eval/codegen loops.
- Do not start browser/device auth unless the auth store is missing/expired/rejected or the user explicitly asks.
- Game provider auth is `build/provider-auth/openai-codex-auth.json`; do not print raw tokens.
- Prefer honest failure over fake fallback dialogue.

Commands that have been passing on the branch:
- `cd probe && bun test test/runtimeLogic.test.ts`
- `cd probe && bun run typecheck`

Likely useful checks to run first:
- `git log --oneline -12`
- `git diff 05c1bdf..dad5abf`
- `cd probe && bun test test/runtimeLogic.test.ts`
- `cd probe && bun run typecheck`

Note on `main`:
- The root checkout on `main` had separate uncommitted mutual-probe/docs changes when this handoff was requested.
- Those were being checkpointed separately for push.
- Before merging anything, compare `main` and `live-npc-dialogue` carefully.
```
