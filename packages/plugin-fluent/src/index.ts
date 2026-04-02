import path from "node:path";
import type { SincroniaPlugin } from "@sincronia/core";
import chokidar from "chokidar";
import fg from "fast-glob";

type FluentPluginOptions = {
  appRoot: string;
};

const fluentFilePattern = "fluent/**/*.ts";

export const createFluentPlugin = (
  options: FluentPluginOptions,
): SincroniaPlugin => ({
  name: "@sincronia/plugin-fluent",
  hooks: {
    "before:build": async (ctx) => {
      const files = await fg(fluentFilePattern, {
        cwd: path.join(ctx.rootDir, options.appRoot),
      });
      if (files.length === 0) {
        throw new Error(
          `No Fluent files found under ${options.appRoot}/fluent`,
        );
      }
    },
    "before:dev": async (ctx) => {
      if (!ctx.options.watch) {
        return;
      }

      const watcher = chokidar.watch(
        path.join(ctx.rootDir, options.appRoot, fluentFilePattern),
        {
          ignoreInitial: true,
        },
      );

      watcher.on("change", (changedPath) => {
        process.stdout.write(`[fluent] changed: ${changedPath}\n`);
      });
    },
  },
});
