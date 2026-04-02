import fs from "node:fs/promises";
import path from "node:path";
import type { SincroniaPlugin } from "@sincronia/core";
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
      const appRoot = path.join(ctx.rootDir, options.appRoot);
      const files = await fg(fluentFilePattern, {
        cwd: appRoot,
      });
      if (files.length === 0) {
        throw new Error(
          `No Fluent files found under ${options.appRoot}/fluent`,
        );
      }

      const buildCacheDir = path.join(ctx.rootDir, ".sincronia", "cache");
      const cacheFilePath = path.join(buildCacheDir, "fluent-build.json");
      await fs.mkdir(buildCacheDir, { recursive: true });

      const fileStats = await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(appRoot, file);
          const stat = await fs.stat(fullPath);
          return `${file}:${stat.mtimeMs}`;
        }),
      );
      const fingerprint = fileStats.sort().join("|");
      const previous = await fs.readFile(cacheFilePath, "utf8").catch(() => "");
      if (previous === fingerprint && !ctx.flags.force) {
        ctx.logger.info(
          "Fluent cache hit; metadata unchanged since last build.",
        );
        ctx.args.skipFluentCompile = true;
      } else {
        await fs.writeFile(cacheFilePath, fingerprint, "utf8");
        ctx.args.skipFluentCompile = false;
      }
    },
    "before:dev": async (ctx) => {
      if (!ctx.options.watch) {
        return;
      }
      const fluentPath = path.join(ctx.rootDir, options.appRoot, "fluent");
      await fs.access(fluentPath);
    },
  },
});
