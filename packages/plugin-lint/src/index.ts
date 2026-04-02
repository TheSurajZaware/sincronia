import path from "node:path";
import type { SincroniaPlugin } from "@sincronia/core";
import fg from "fast-glob";

type LintPluginOptions = {
  appRoot: string;
};

const allowedName = /^[a-z][a-z0-9_]*$/;

export const createLintPlugin = (
  options: LintPluginOptions,
): SincroniaPlugin => ({
  name: "@sincronia/plugin-lint",
  hooks: {
    "before:lint": async (ctx) => {
      const fluentFiles = await fg("fluent/**/*.ts", {
        cwd: path.join(ctx.rootDir, options.appRoot),
      });
      const violations = fluentFiles.filter(
        (file) => !allowedName.test(path.basename(file, ".ts")),
      );
      if (violations.length > 0) {
        throw new Error(
          `Naming convention violations in Fluent files:\n${violations.map((v) => ` - ${v}`).join("\n")}`,
        );
      }
    },
  },
});
