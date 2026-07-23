import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { FunctionTool } from "openai/resources/responses/responses";

import {
  callModelStudioFunctionToolSelection,
  callModelStudioJsonSchema
} from "../src/provider/modelStudioApiProvider.js";

test("Model Studio tool selection uses the workspace endpoint and provider-default thinking", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-provider-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
  try {
    const result = await callModelStudioFunctionToolSelection({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        maxRetries: 0,
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async (url, init) => {
          fetchCalls.push({ url: String(url), init });
          return new Response(
            JSON.stringify({
              id: "chatcmpl-test",
              model: "qwen3.8-max-preview",
              choices: [
                {
                  finish_reason: "tool_calls",
                  message: {
                    content: "",
                    reasoning_content: "The actor should observe first.",
                    tool_calls: [
                      {
                        id: "call-observe",
                        type: "function",
                        function: {
                          name: "Observe",
                          arguments: "{}"
                        }
                      }
                    ]
                  }
                }
              ],
              usage: {
                prompt_tokens: 20,
                completion_tokens: 12,
                total_tokens: 32,
                completion_tokens_details: {
                  reasoning_tokens: 7
                }
              }
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
                "x-request-id": "request-test"
              }
            }
          );
        }
      },
      system: "Choose one tool.",
      user: "{}",
      tools: [
        {
          type: "function",
          name: "Observe",
          description: "Observe the current Minecraft state.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false
          },
          strict: true
        } satisfies FunctionTool
      ],
      usageContext: {
        runId: "run-test",
        actorId: "npc_b",
        turnId: "turn-test",
        stage: "actor_turn"
      }
    });

    assert.equal(result.ok, true);
    assert.equal(fetchCalls.length, 1);
    assert.equal(
      fetchCalls[0]?.url,
      "https://ws-test123.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions"
    );
    const requestBody = JSON.parse(String(fetchCalls[0]?.init?.body)) as Record<string, unknown>;
    assert.equal(requestBody.model, "qwen3.8-max-preview");
    assert.equal("chat_template_kwargs" in requestBody, false);
    assert.equal("reasoning_effort" in requestBody, false);
    assert.equal(result.ok && result.functionCalls[0]?.name, "Observe");
    assert.equal(
      result.ok &&
        (result.rawOutput as {
          response?: { choices?: Array<{ message?: { reasoning_content?: string } }> };
        }).response?.choices?.[0]?.message?.reasoning_content,
      "The actor should observe first."
    );

    const ledger = (await readFile(ledgerPath, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0]?.provider_id, "alibaba-model-studio-api");
    assert.equal(ledger[0]?.model, "qwen3.8-max-preview");
    assert.equal(
      (ledger[0]?.usage as { thinking_tokens?: number } | undefined)?.thinking_tokens,
      7
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio JSON calls preserve default thinking and parse structured content", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-json-provider-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  let requestBody: Record<string, unknown> | undefined;
  try {
    const result = await callModelStudioJsonSchema<{ accepted: boolean }>({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        maxRetries: 0,
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async (_url, init) => {
          requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return new Response(
            JSON.stringify({
              model: "qwen3.8-max-preview",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    content: "{\"accepted\":true}",
                    reasoning_content: "The requested JSON is straightforward."
                  }
                }
              ],
              usage: {
                prompt_tokens: 12,
                completion_tokens: 8,
                total_tokens: 20,
                completion_tokens_details: {
                  reasoning_tokens: 4
                }
              }
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
      },
      schemaName: "acceptance",
      schema: {
        type: "object",
        properties: { accepted: { type: "boolean" } },
        required: ["accepted"],
        additionalProperties: false
      },
      system: "Return the requested JSON.",
      user: "{}"
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.parsed, { accepted: true });
    assert.equal(requestBody && "chat_template_kwargs" in requestBody, false);
    assert.equal(requestBody && "reasoning_effort" in requestBody, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio rejects an invalid workspace id before fetch", async () => {
  let fetchCalled = false;
  const result = await callModelStudioJsonSchema({
    config: {
      apiKey: "test-model-studio-key",
      workspaceId: "https://invalid.example",
      model: "qwen3.8-max-preview",
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response();
      }
    },
    schemaName: "test",
    schema: { type: "object" },
    system: "test",
    user: "{}"
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorKind, "invalid_config");
  assert.equal(fetchCalled, false);
});
