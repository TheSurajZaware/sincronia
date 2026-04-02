import { describe, expect, it } from "vitest";
import { createLogger } from "./logger.js";
import { MetricsCollector } from "./metrics.js";
import { PluginManager } from "./index.js";

describe("PluginManager", () => {
  it("isolates plugin failures when failFast=false", async () => {
    const manager = new PluginManager();
    let successfulHookRan = false;
    await manager.registerPlugin({
      name: "fail-plugin",
      hooks: {
        "before:build": async () => {
          throw new Error("boom");
        },
      },
    });
    await manager.registerPlugin({
      name: "ok-plugin",
      hooks: {
        "before:build": async () => {
          successfulHookRan = true;
        },
      },
    });

    const result = await manager.run("before:build", {
      cwd: process.cwd(),
      rootDir: process.cwd(),
      runId: "test",
      args: {},
      options: {},
      flags: { failFast: false },
      logger: createLogger({ level: "error", runId: "test", json: false }),
      metrics: new MetricsCollector(),
    });

    expect(successfulHookRan).toBe(true);
    expect(result.failures.length).toBe(1);
  });
});
