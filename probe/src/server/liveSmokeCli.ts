import {
  ensureLiveSmokeServer,
  formatLiveSmokeServerReport,
  getLiveSmokeServerStatus,
  stopLiveSmokeServer
} from "./liveSmokeServer.js";

function usage() {
  return [
    "Usage: bun run src/server/liveSmokeCli.ts [ready|status|stop]",
    "",
    "ready   Start the local Docker Minecraft server if needed and print the join endpoint.",
    "status  Print the endpoint only if the managed server is already reachable.",
    "stop    Stop the managed Docker Minecraft server."
  ].join("\n");
}

async function main() {
  const command = process.argv[2] ?? "ready";

  if (command === "ready" || command === "start") {
    console.log(formatLiveSmokeServerReport(await ensureLiveSmokeServer()));
    return;
  }

  if (command === "status") {
    const report = await getLiveSmokeServerStatus();
    console.log(formatLiveSmokeServerReport(report));
    process.exitCode = report.status === "ready" ? 0 : 1;
    return;
  }

  if (command === "stop") {
    console.log(formatLiveSmokeServerReport(await stopLiveSmokeServer()));
    return;
  }

  console.error(usage());
  process.exitCode = 1;
}

void main();
