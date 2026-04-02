import fs from "node:fs/promises";
import path from "node:path";
import { SincroniaError } from "./errors.js";

export type LockHandle = {
  lockPath: string;
  release: () => Promise<void>;
};

export const acquireLock = async (
  rootDir: string,
  key: string,
  ttlMs = 30 * 60 * 1000,
): Promise<LockHandle> => {
  const lockDir = path.join(rootDir, ".sincronia", "locks");
  await fs.mkdir(lockDir, { recursive: true });
  const lockPath = path.join(lockDir, `${key}.lock`);

  try {
    await fs.writeFile(lockPath, JSON.stringify({ ts: Date.now() }), {
      flag: "wx",
      encoding: "utf8",
    });
  } catch {
    const existing = await fs.readFile(lockPath, "utf8").catch(() => "");
    const ts = Number(JSON.parse(existing || "{}").ts ?? 0);
    if (Date.now() - ts > ttlMs) {
      await fs.unlink(lockPath).catch(() => undefined);
      return acquireLock(rootDir, key, ttlMs);
    }
    throw new SincroniaError({
      category: "LockError",
      message: `Lock already held for ${key}`,
      resolutionHint:
        "Wait for the current operation to complete, or remove stale lock file if safe.",
      metadata: { key, lockPath },
    });
  }

  return {
    lockPath,
    release: async () => {
      await fs.unlink(lockPath).catch(() => undefined);
    },
  };
};
