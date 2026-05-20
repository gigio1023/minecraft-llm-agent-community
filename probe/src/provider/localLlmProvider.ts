import type { ToolResult } from "../mutual/types.js";
import type { ObserveResult } from "../tools/observe.js";
import type { ToolProposal } from "../tools/index.js";

type NextInput = {
  observation: ObserveResult;
  lastResult: ToolResult | null;
  currentTask?: Record<string, any> | null;
};

export function createLocalLlmProvider() {
  const apiUrl = process.env.LLM_API_URL || "http://localhost:11434/v1";
  const modelName = process.env.LLM_MODEL_NAME || "qwen2.5-coder:7b";
  const apiKey = process.env.LLM_API_KEY || "dummy-key";

  return {
    async next(input: NextInput): Promise<ToolProposal> {
      const systemPrompt = `You are a Minecraft NPC bot controller. 
Your goal is to choose the next action (tool call) based on the observation, current task, and the result of the last action.

You MUST respond with a single valid JSON object containing:
{
  "tool": "tool_name",
  "args": {
    "arg1": "value1"
  }
}

Available tools and their schemas:
- "observe": {} -> Get fresh environment snapshot.
- "move_to": {"target": "string"} -> Walk to target actor.
- "collect_logs": {"targetCount": 4} -> Gather wood logs.
- "craft_item": {"itemName": "string"} -> Craft planks, sticks, crafting_table, etc.
- "inspect_chest": {} -> Open and read nearby shared chest.
- "deposit_shared": {"itemName": "string", "count": number} -> Put item into shared storage.
- "withdraw_shared": {"itemName": "string", "count": number, "reason": "string"} -> Take item from shared storage.
- "say": {"target": "string", "text": "string"} -> Speak to another NPC.
- "wait": {"ticks": number} -> Wait for a short duration.
- "remember": {"note": "string"} -> Save an important reflection and end the current loop slice.

Rule: Keep args simple and strict. Output ONLY the JSON. No conversational wrapper, no markdown blocks.`;

      const userPrompt = `
### Current Task
${JSON.stringify(input.currentTask || "No active task, explore or interact")}

### Latest Observation
${JSON.stringify(input.observation)}

### Last Action Result
${JSON.stringify(input.lastResult || "None (First turn)")}

Choose the next tool call and return ONLY the JSON representation.`;

      try {
        const response = await fetch(`${apiUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          })
        });

        if (!response.ok) {
          throw new Error(`Local LLM API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Local LLM returned empty content");
        }

        // Parse JSON output
        const proposal = JSON.parse(content.trim()) as ToolProposal;
        if (typeof proposal.tool !== "string") {
          throw new Error("Invalid proposal: 'tool' field missing or not a string");
        }

        return proposal;
      } catch (error) {
        console.error("Local LLM Provider failed, falling back to 'observe':", error);
        return { tool: "observe", args: {} };
      }
    }
  };
}
