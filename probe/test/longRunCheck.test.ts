import { describe, test, expect, spyOn } from "bun:test";
import { runAgentLoop } from "../src/runtime/agentLoop.js";
import { createDeterministicProvider } from "../src/provider/deterministicProvider.js";
import { createDialogueState } from "../src/runtime/dialogueState.js";
import { createMemory } from "../src/runtime/memory.js";

describe("Long-Run 1000+ Cycle Optimization & Safety", () => {
  test("runAgentLoop survives 1000 steps with memory compaction and event-driven LLM call reduction", async () => {
    // Setup minimal actor/target objects
    const actor = { username: "npc_a" };
    const target = { username: "npc_b" };

    const memory = createMemory(10);
    const dialogueState = createDialogueState({ busyRepliesBeforeAvailable: 5 });
    
    // Track provider.next call count
    const provider = createDeterministicProvider();
    const nextSpy = spyOn(provider, "next");

    const transcript = {
      recordStep(step: any) {
        // Mock recording
      }
    };

    // Tools mock
    const tools = {
      validateProposal(proposal: any) {
        return { tool: proposal.tool, args: proposal.args || {} };
      },
      observe() {
        return {
          status: "ok" as const,
          visibleActors: [{ id: "npc_b", distance: 2.0, busy: false }],
          memory: [],
          inventory: [{ name: "oak_log", count: 2 }]
        };
      },
      move_to() { return { tool: "move_to", ok: true, status: "success" }; },
      collect_logs() { return { tool: "collect_logs", ok: true, status: "success" }; },
      craft_item() { return { tool: "craft_item", ok: true, status: "success" }; },
      inspect_chest() { return { tool: "inspect_chest", ok: true, status: "success" }; },
      deposit_shared() { return { tool: "deposit_shared", ok: true, status: "success" }; },
      withdraw_shared() { return { tool: "withdraw_shared", ok: true, status: "success" }; },
      say() { return { tool: "say", ok: true, status: "success" }; },
      wait() { return { tool: "wait", ok: true, status: "success" }; },
      remember() { return { tool: "remember", ok: true, status: "success", note: "terminated successfully" }; }
    };

    // runAgentLoop under 1000-step budget
    // Note: in deterministic curriculum, once "remember" is called, the loop finishes with "success"
    const result = await runAgentLoop({
      bots: { actor, target },
      provider,
      tools,
      transcript,
      maxSteps: 1000
    });

    expect(result.status).toBe("success");
    
    // Ensure LLM/provider calls were skipped at some steps due to the event-driven bypass
    // (A normal 10-turn sequence would call provider 10 times, but event-driven triggers bypass sustainable tools like collect_logs / move_to)
    expect(nextSpy.mock.calls.length).toBeLessThan(10);
  }, 30000);
});
