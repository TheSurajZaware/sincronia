import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  asSincroniaError,
  runtimeConfigSchema,
  type RuntimeConfig,
} from "@sincronia/core";

export const CONFIG_FILE = ".sincronia.config.ts";

const CONFIG_CANDIDATES = [
  ".sincronia.config.ts",
  ".sincronia.config.mts",
  ".sincronia.config.js",
  ".sincronia.config.mjs",
  ".sincronia.config.cjs",
];

const resolveConfigPath = async (rootDir: string): Promise<string> => {
  for (const candidate of CONFIG_CANDIDATES) {
    const fullPath = path.join(rootDir, candidate);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      // try next
    }
  }

  throw asSincroniaError(undefined, {
    category: "ConfigError",
    message: "No .sincronia.config file found.",
    resolutionHint: `Create one of: ${CONFIG_CANDIDATES.join(", ")}`,
  });
};

export const loadRuntimeConfig = async (
  rootDir: string,
): Promise<RuntimeConfig> => {
  const configPath = await resolveConfigPath(rootDir);
  try {
    const loaded = await import(pathToFileURL(configPath).href);
    return runtimeConfigSchema.parse(loaded.default ?? loaded.config ?? loaded);
  } catch (error) {
    throw asSincroniaError(error, {
      category: "ConfigError",
      message: `Failed to load configuration from ${path.basename(configPath)}.`,
      resolutionHint:
        "Ensure the config exports a default object with valid environments and SDK settings.",
    });
  }
};
