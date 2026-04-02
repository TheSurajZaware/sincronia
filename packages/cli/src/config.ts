import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runtimeConfigSchema, type RuntimeConfig } from "@sincronia/core";

export const CONFIG_FILE = ".sincronia.config.ts";

export const loadRuntimeConfig = async (
  rootDir: string,
): Promise<RuntimeConfig> => {
  const configPath = path.join(rootDir, CONFIG_FILE);
  await fs.access(configPath);
  const loaded = await import(pathToFileURL(configPath).href);
  return runtimeConfigSchema.parse(loaded.default ?? loaded.config ?? loaded);
};
