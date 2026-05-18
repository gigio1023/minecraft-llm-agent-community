---
sidebar_position: 3
---

# OpenAI Codex Provider

Status: active provider guidance
Search tokens: `OPENAI_CODEX_PROVIDER`, `GAME_RUNTIME_CODEX_AUTH`,
`CODEX_CLI_IS_NOT_GAME_PROVIDER_AUTH`.

## Meaning

For this project, `openai-codex` means a game-runtime LLM provider that uses a
Codex-compatible ChatGPT OAuth profile to call an OpenAI/Codex model for
bounded NPC proposals.

It does not mean:

- run Codex CLI login;
- call `codex auth` just because a task says "Codex auth";
- let an LLM mutate Minecraft state directly;
- let an LLM write arbitrary JavaScript and `eval` it as the core behavior;
- use `OPENAI_API_KEY` as an implicit replacement without a provider decision.

## Provider Role

The provider may propose:

- the next allowed tool call;
- a short utterance;
- a short reason;
- a small memory note.

The runtime must own:

- Minecraft connection;
- bot position and movement result;
- distance and target validation;
- chat delivery and turn/busy state;
- inventory, container, trade, or block state;
- transcript and evidence writing;
- budget, timeout, fallback, and termination.

## Auth Store

Use an ignored repo-local auth store:

```text
build/provider-auth/openai-codex-auth.json
```

This path is ignored by `.gitignore`. Never commit provider auth.

Agents may inspect whether the file exists and whether a profile is present,
but must not print raw access tokens, refresh tokens, or cookies.

## Check Order

When a task says "Codex auth" in this repo:

1. Confirm whether the task is about game-runtime provider auth.
2. Inspect `build/provider-auth/openai-codex-auth.json` without printing
   secrets.
3. If the store exists, check profile metadata and expiry.
4. Run a no-live-spend provider configuration check if one exists.
5. Run a live model smoke only when the user intends to spend the small budget.
6. Start a browser/device login flow only if the store is missing, expired,
   rejected by live proof, or explicitly requested.

## First Implementation Policy

The first spike should not start with provider auth. Build this order:

1. deterministic fake provider returns a valid next tool call;
2. bot loop executes observe/move/say/wait and writes transcript;
3. provider interface is separated from mineflayer runtime;
4. live `openai-codex` provider is added behind the same interface;
5. live proof uses `gpt-5.4-mini`, low reasoning, no model fallback, and a
   small budget cap unless the user changes it.

This prevents auth work from blocking the game-loop proof.

## Proposed Interface

```ts
type AgentObservation = {
  actorId: string;
  visibleActors: Array<{ id: string; distance: number; busy: boolean }>;
  recentChat: Array<{ from: string; text: string }>;
  memory: string[];
  allowedTools: string[];
};

type AgentProposal = {
  tool: "observe" | "move_to" | "say" | "wait" | "remember";
  args: Record<string, unknown>;
  utterance?: string;
  reason: string;
  memoryNote?: string;
};
```

The provider returns `AgentProposal`. The runtime validates it before calling
mineflayer.
