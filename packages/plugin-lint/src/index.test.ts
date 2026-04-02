import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLogger, MetricsCollector } from "@sincronia/core";
import { describe, expect, it } from "vitest";
import { createLintPlugin } from "./index.js";

describe("plugin-lint", () => {
  it("fails for invalid fluent filenames", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "sincronia-lint-"));
    const appRoot = "apps/test-app";
    const fluentDir = path.join(root, appRoot, "fluent/tables");
    await fs.mkdir(fluentDir, { recursive: true });
    await fs.writeFile(
      path.join(fluentDir, "BadName.ts"),
      "export default {};",
      "utf8",
    );

    const plugin = createLintPlugin({ appRoot });
    const hook = plugin.hooks?.["before:lint"];
    if (!hook) {
      throw new Error("before:lint hook is required");
    }

    await expect(
      hook({
        cwd: root,
        rootDir: root,
        runId: "test",
        args: {},
        options: {},
        flags: {},
        logger: createLogger({ runId: "test", level: "error", json: false }),
        metrics: new MetricsCollector(),
      }),
    ).rejects.toThrowError();
  });
});
