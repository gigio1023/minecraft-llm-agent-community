import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { FunctionTool } from "openai/resources/responses/responses";

import {
  callModelStudioFunctionToolSelection,
  callModelStudioJsonSchema
} from "../src/provider/modelStudioApiProvider.js";
import { callModelScopeJsonSchema } from "../src/provider/modelscopeApiProvider.js";
import { appendProviderUsageRecord } from "../src/provider/providerUsageTracker.js";

const observeTool = {
  type: "function",
  name: "Observe",
  description: "Observe the current Minecraft state.",
  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  strict: true
} satisfies FunctionTool;

function assertOmittedThinkingAndTokenCaps(body: Record<string, unknown>) {
  assert.equal("chat_template_kwargs" in body, false);
  assert.equal("enable_thinking" in body, false);
  assert.equal("reasoning_effort" in body, false);
  assert.equal("max_tokens" in body, false);
  assert.equal("max_completion_tokens" in body, false);
}

async function ledgerRows(ledgerPath: string) {
  try {
    await access(ledgerPath);
  } catch {
    return [] as Array<Record<string, unknown>>;
  }
  const text = (await readFile(ledgerPath, "utf8")).trim();
  if (!text) {
    return [];
  }
  return text.split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

function hangUntilAbort(signal: AbortSignal | null | undefined): Promise<never> {
  return new Promise((_, reject) => {
    if (!signal) {
      reject(new Error("missing abort signal"));
      return;
    }
    if (signal.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => reject(new DOMException("The operation was aborted.", "AbortError")),
      { once: true }
    );
  });
}

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
      tools: [observeTool],
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
    assertOmittedThinkingAndTokenCaps(requestBody);
    assert.equal(result.ok && result.functionCalls[0]?.name, "Observe");
    assert.equal(
      result.ok &&
        (result.rawOutput as {
          response?: { choices?: Array<{ message?: { reasoning_content?: string } }> };
        }).response?.choices?.[0]?.message?.reasoning_content,
      "The actor should observe first."
    );

    const ledger = await ledgerRows(ledgerPath);
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
    assert.ok(requestBody);
    assertOmittedThinkingAndTokenCaps(requestBody!);
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

test("Model Studio rejects non-preview models before fetch or ledger for JSON and tool", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-exact-model-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  let fetchCalls = 0;
  try {
    const jsonResult = await callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen-plus",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response();
        }
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}"
    });
    const toolResult = await callModelStudioFunctionToolSelection({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen-max",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response();
        }
      },
      system: "test",
      user: "{}",
      tools: [observeTool]
    });

    assert.equal(jsonResult.ok, false);
    assert.equal(!jsonResult.ok && jsonResult.errorKind, "invalid_config");
    assert.equal(toolResult.ok, false);
    assert.equal(!toolResult.ok && toolResult.errorKind, "invalid_config");
    assert.equal(fetchCalls, 0);
    assert.deepEqual(await ledgerRows(ledgerPath), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio exact-model rejection wins over a pre-aborted signal", async () => {
  const controller = new AbortController();
  controller.abort();
  let fetchCalled = false;
  const result = await callModelStudioJsonSchema({
    config: {
      apiKey: "",
      workspaceId: "ws-test123",
      model: "not-supported",
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response();
      }
    },
    schemaName: "test",
    schema: { type: "object" },
    system: "test",
    user: "{}",
    signal: controller.signal
  });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorKind, "invalid_config");
  assert.equal(fetchCalled, false);
});

test("Model Studio makes exactly one fetch on retryable HTTP failure", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-no-retry-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  let fetchCalls = 0;
  try {
    const result = await callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response("temporary failure", { status: 503 });
        }
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}"
    });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.errorKind, "server_error");
    assert.equal(fetchCalls, 1);
    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0]?.status, "failed");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio pre-aborted signal returns aborted with zero fetch and ledger", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-preabort-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  let fetchCalls = 0;
  const controller = new AbortController();
  controller.abort();
  try {
    const jsonResult = await callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response();
        }
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}",
      signal: controller.signal
    });
    const toolResult = await callModelStudioFunctionToolSelection({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response();
        }
      },
      system: "test",
      user: "{}",
      tools: [observeTool],
      signal: controller.signal
    });

    assert.equal(jsonResult.ok, false);
    assert.equal(!jsonResult.ok && jsonResult.errorKind, "aborted");
    assert.equal(toolResult.ok, false);
    assert.equal(!toolResult.ok && toolResult.errorKind, "aborted");
    assert.equal(fetchCalls, 0);
    assert.deepEqual(await ledgerRows(ledgerPath), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio mid-flight abort returns aborted with one failed estimated usage row", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-midabort-"));
  const jsonLedgerPath = path.join(dir, "json-ledger.jsonl");
  const toolLedgerPath = path.join(dir, "tool-ledger.jsonl");
  let jsonFetchCalls = 0;
  let toolFetchCalls = 0;
  const jsonController = new AbortController();
  const toolController = new AbortController();
  try {
    const pendingJson = callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: jsonLedgerPath,
        requestTimeoutMs: 5_000,
        fetchImpl: async (_url, init) => {
          jsonFetchCalls += 1;
          return hangUntilAbort(init?.signal);
        }
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}",
      signal: jsonController.signal
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    jsonController.abort();
    const jsonResult = await pendingJson;

    assert.equal(jsonResult.ok, false);
    assert.equal(!jsonResult.ok && jsonResult.errorKind, "aborted");
    assert.ok(jsonFetchCalls <= 1);
    const jsonLedger = await ledgerRows(jsonLedgerPath);
    assert.equal(jsonLedger.length, 1);
    assert.equal(jsonLedger[0]?.status, "failed");
    assert.equal(jsonLedger[0]?.usage_source, "estimated");

    const pendingTool = callModelStudioFunctionToolSelection({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: toolLedgerPath,
        requestTimeoutMs: 5_000,
        fetchImpl: async (_url, init) => {
          toolFetchCalls += 1;
          return hangUntilAbort(init?.signal);
        }
      },
      system: "test",
      user: "{}",
      tools: [observeTool],
      signal: toolController.signal
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    toolController.abort();
    const toolResult = await pendingTool;

    assert.equal(toolResult.ok, false);
    assert.equal(!toolResult.ok && toolResult.errorKind, "aborted");
    assert.ok(toolFetchCalls <= 1);
    const toolLedger = await ledgerRows(toolLedgerPath);
    assert.equal(toolLedger.length, 1);
    assert.equal(toolLedger[0]?.status, "failed");
    assert.equal(toolLedger[0]?.usage_source, "estimated");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio same-minute guard blocks immediately without sleep or fetch", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-guard-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  let fetchCalls = 0;
  try {
    // Seed the current UTC minute so the guard projection matches live now.
    for (let index = 0; index < 120; index++) {
      await appendProviderUsageRecord({
        providerId: "alibaba-model-studio-api",
        model: "qwen3.8-max-preview",
        status: "succeeded",
        usageSource: "estimated",
        usage: {
          requests: 1,
          input_tokens: 1,
          output_tokens: 0,
          thinking_tokens: 0,
          total_tokens: 1
        },
        context: { ledgerPath, repoRoot: dir }
      });
    }

    const started = Date.now();
    const result = await callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async () => {
          fetchCalls += 1;
          return new Response("should not fetch", { status: 200 });
        }
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}"
    });
    const elapsedMs = Date.now() - started;

    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.errorKind, "usage_budget_exceeded");
    assert.equal(fetchCalls, 0);
    assert.ok(elapsedMs < 500);
    assert.equal((await ledgerRows(ledgerPath)).length, 120);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio local elapsed timeout remains timeout not aborted", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-timeout-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const result = await callModelStudioJsonSchema({
      config: {
        apiKey: "test-model-studio-key",
        workspaceId: "ws-test123",
        model: "qwen3.8-max-preview",
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        requestTimeoutMs: 30,
        fetchImpl: async (_url, init) => hangUntilAbort(init?.signal)
      },
      schemaName: "test",
      schema: { type: "object" },
      system: "test",
      user: "{}"
    });
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.errorKind, "timeout");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio pre-abort wins over missing API key after valid adapter config", async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await callModelStudioJsonSchema({
    config: {
      apiKey: "",
      workspaceId: "ws-test123",
      model: "qwen3.8-max-preview",
      fetchImpl: async () => new Response()
    },
    schemaName: "test",
    schema: { type: "object" },
    system: "test",
    user: "{}",
    signal: controller.signal
  });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorKind, "aborted");
});

test("shared ModelScope adapter without signal keeps retry, timeout, and disabled thinking", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "modelscope-regression-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const timeoutLedgerPath = path.join(dir, "timeout-ledger.jsonl");
  const bodies: Array<Record<string, unknown>> = [];
  let fetchCalls = 0;
  try {
    const result = await callModelScopeJsonSchema<{ accepted: boolean }>({
      config: {
        apiKey: "test-modelscope-key",
        model: "Qwen-Ambassador/Qwen3.7-Max",
        maxRetries: 1,
        repoRoot: dir,
        usageLedgerPath: ledgerPath,
        fetchImpl: async (_url, init) => {
          fetchCalls += 1;
          bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
          if (fetchCalls === 1) {
            return new Response("temporary", { status: 503 });
          }
          return new Response(
            JSON.stringify({
              model: "Qwen-Ambassador/Qwen3.7-Max",
              choices: [
                {
                  finish_reason: "stop",
                  message: { content: "{\"accepted\":true}" }
                }
              ],
              usage: {
                prompt_tokens: 4,
                completion_tokens: 2,
                total_tokens: 6
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
      system: "Return JSON.",
      user: "{}"
    });

    assert.equal(result.ok, true);
    assert.equal(fetchCalls, 2);
    assert.equal(
      (bodies[0]?.chat_template_kwargs as { enable_thinking?: boolean } | undefined)
        ?.enable_thinking,
      false
    );
    assert.equal(
      (bodies[1]?.chat_template_kwargs as { enable_thinking?: boolean } | undefined)
        ?.enable_thinking,
      false
    );

    const timeoutResult = await callModelScopeJsonSchema({
      config: {
        apiKey: "test-modelscope-key",
        model: "Qwen-Ambassador/Qwen3.7-Max",
        maxRetries: 0,
        requestTimeoutMs: 30,
        repoRoot: dir,
        usageLedgerPath: timeoutLedgerPath,
        fetchImpl: async (_url, init) => hangUntilAbort(init?.signal)
      },
      schemaName: "timeout",
      schema: { type: "object" },
      system: "Return JSON.",
      user: "{}"
    });
    assert.equal(timeoutResult.ok, false);
    assert.equal(!timeoutResult.ok && timeoutResult.errorKind, "timeout");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
