export type StepRecord = {
  actor: string;
  observation: any;
  task?: any;
  pressureContext?: any;
  tool: string;
  args?: any;
  result: any;
  verification?: any;
};

export function createMemoryCompactor() {
  const apiUrl = process.env.LLM_API_URL || "http://localhost:11434/v1";
  const modelName = process.env.LLM_MODEL_NAME || "qwen2.5-coder:7b";
  const apiKey = process.env.LLM_API_KEY || "dummy-key";

  return {
    async compact(steps: StepRecord[], previousSummary = ""): Promise<string> {
      if (steps.length === 0) {
        return previousSummary;
      }

      const stepsText = steps.map((step, idx) => {
        return `Step ${idx + 1}:
- Actor: ${step.actor}
- Tool: ${step.tool}
- Args: ${JSON.stringify(step.args || {})}
- Result: ${JSON.stringify(step.result || {})}
- Task: ${step.task ? step.task.id : "None"}
- Verification: ${step.verification ? step.verification.status : "None"}`;
      }).join("\n\n");

      const systemPrompt = `You are a memory compaction module for a Minecraft NPC agent.
Your job is to read a raw execution history of the agent (past steps) and synthesize a concise, high-level summary of what happened.

Focus on:
1. Tasks started and completed (e.g., crafted a wooden pickaxe, gathered 4 logs).
2. Key resource changes (e.g., deposited wood into shared chest, gear lost/recovered).
3. Social interactions and promises made.
4. Any repeated failures or blockages.

Incorporate the previous summary to maintain continuity. Output ONLY the new consolidated summary text, maximum 3-4 bullet points. Do not include any greeting or explanation.`;

      const userPrompt = `
### Previous Summary:
${previousSummary || "None"}

### New Steps to Incorporate:
${stepsText}

Synthesize a consolidated, concise summary:`;

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
            temperature: 0.1
          })
        });

        if (!response.ok) {
          throw new Error(`Memory compaction API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        return content ? content.trim() : previousSummary;
      } catch (error) {
        console.error("Memory compaction failed, falling back to simple local concatenation:", error);
        // Fallback to simple rule-based summary
        const completedTasks = steps
          .filter(s => s.verification?.status === "passed")
          .map(s => s.task?.id)
          .filter(Boolean);
        const uniqueTasks = [...new Set(completedTasks)];
        return `[Fallback Summary] Completed tasks: ${uniqueTasks.join(", ") || "none"}. Previous: ${previousSummary}`;
      }
    }
  };
}
