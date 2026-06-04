/** Regression coverage for server lifecycle reporting as environment state. */
import assert from "node:assert/strict";
import { createServer } from "node:net";
import test from "node:test";
import { probePort, requirePortFree } from "../src/server/serverLifecycle.js";

async function withTcpServer<T>(fn: (port: number) => Promise<T>) {
  const server = createServer((socket) => {
    socket.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address object");
    }

    return await fn(address.port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("serverLifecycle probePort reports a random high port as not in use", async () => {
  const status = await probePort(59123, "127.0.0.1", 500);
  assert.equal(status.inUse, false);
  assert.equal(status.port, 59123);
});

test("serverLifecycle requirePortFree does not throw for an unused port", async () => {
  await requirePortFree(59124, "127.0.0.1");
});

test("serverLifecycle requirePortFree throws when a port is in use", async () => {
  await withTcpServer(async (port) => {
    await assert.rejects(() => requirePortFree(port, "127.0.0.1"), /already in use/);
  });
});

test("serverLifecycle probePort reports an active port as in use", async () => {
  await withTcpServer(async (port) => {
    const status = await probePort(port, "127.0.0.1", 500);
    assert.equal(status.inUse, true);
  });
});
