/** Regression coverage for dashboard health reporting. */
import assert from "node:assert/strict";
import { createServer, type Socket } from "node:net";
import test from "node:test";

import { checkDashboardHealth } from "../src/dashboard/dashboardHealth.js";
import { startDashboardServer } from "../src/dashboard/dashboardServer.js";

async function withTcpServer<T>(fn: (port: number) => Promise<T>) {
  const server = createServer((socket) => {
    socket.end("not a dashboard");
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

async function withHangingTcpServer<T>(fn: (port: number) => Promise<T>) {
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
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
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("dashboard health recognizes the repo dashboard state endpoint", async () => {
  const server = startDashboardServer(0);

  try {
    const health = await checkDashboardHealth(server.port);

    assert.equal(health.status, "ready");
    assert.equal(health.url, server.url);
  } finally {
    server.stop();
  }
});

test("dashboard health rejects a non-dashboard listener on the dashboard port", async () => {
  await withTcpServer(async (port) => {
    const health = await checkDashboardHealth(port);

    assert.equal(health.status, "not_dashboard");
    assert.match(health.reason, /fetch|HTTP|terminated|invalid|Unexpected/i);
  });
});

test("dashboard health times out against stale listeners", async () => {
  await withHangingTcpServer(async (port) => {
    const startedAt = Date.now();
    const health = await checkDashboardHealth(port, 25);

    assert.equal(health.status, "not_dashboard");
    assert.ok(Date.now() - startedAt < 1_000);
  });
});
