---
sidebar_position: 2
---

# LLM Provider Configuration

This project uses Large Language Models (LLMs) to drive the decision-making process of our NPCs. This guide explains how the LLM interacts with the game and how to configure your provider.

## How the LLM Works

In our architecture, the LLM acts as the "Brain," while the runtime acts as the "Body." 

1. **Observations**: The runtime gathers information about the world (position, visible items, chat messages) and sends it to the LLM.
2. **Intent Selection**: The LLM analyzes the context and chooses a high-level action (e.g., "Move to the chest" or "Say hello").
3. **Validation**: The runtime receives the intent, validates it against the game's rules, and executes the physical actions via Mineflayer.

## Supported Providers

We currently support OpenAI-compatible APIs (like GPT-4o or GPT-4o-mini). You can configure your provider credentials in an environment file or a local JSON store.

### Local Auth Store

For local development, credentials should be stored in:
`build/provider-auth/auth-config.json`

**Security Warning:** This directory is ignored by Git. **Never commit your API keys or session tokens to the repository.**

## Data Structures

The LLM expects and returns structured data to ensure consistency.

### Agent Observation (Input)
```json
{
  "actorId": "npc_1",
  "position": {"x": 10, "y": 64, "z": 20},
  "visibleActors": [
    {"id": "npc_2", "distance": 5, "isBusy": false}
  ],
  "recentChat": [
    {"from": "npc_2", "text": "Can you help me gather wood?"}
  ],
  "allowedTools": ["move_to", "say", "mineBlock"]
}
```

### Agent Proposal (Output)
```json
{
  "tool": "move_to",
  "args": {"target": "npc_2"},
  "thought": "I will move closer to npc_2 to coordinate our task.",
  "utterance": "Sure, I'll be right there!"
}
```

## Best Practices

1. **Small Steps**: LLMs perform better when choosing one focused action per turn.
2. **Deterministic Fallbacks**: Always ensure the runtime can handle invalid or failed LLM responses gracefully.
3. **Budget Control**: Monitor your token usage, especially when running multiple bots simultaneously.
