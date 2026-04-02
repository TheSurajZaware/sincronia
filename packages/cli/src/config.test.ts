import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRuntimeConfig } from "./config.js";

describe("loadRuntimeConfig", () => {
  it("loads .sincronia.config.js and validates default environment", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "sincronia-config-"));
    await fs.writeFile(
      path.join(root, ".sincronia.config.js"),
      `export default {
        defaultEnvironment: "dev",
        sdkCommand: ["npx", "@servicenow/sdk"],
        appRoot: "apps/example-fluent-app",
        environments: {
          dev: { instanceUrl: "https://dev00000.service-now.com" }
        }
      };`,
      "utf8",
    );

    const config = await loadRuntimeConfig(root);
    expect(config.defaultEnvironment).toBe("dev");
  });

  it("fails when default environment is missing", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "sincronia-config-fail-"),
    );
    await fs.writeFile(
      path.join(root, ".sincronia.config.js"),
      `export default {
        defaultEnvironment: "dev",
        appRoot: "apps/example-fluent-app",
        environments: {
          qa: { instanceUrl: "https://qa00000.service-now.com" }
        }
      };`,
      "utf8",
    );

    await expect(loadRuntimeConfig(root)).rejects.toThrowError();
  });
});
