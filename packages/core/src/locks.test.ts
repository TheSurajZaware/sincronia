import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { acquireLock } from "./locks.js";

describe("acquireLock", () => {
  it("creates and releases lock", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "sincronia-lock-"));
    const lock = await acquireLock(temp, "deploy-dev");
    await expect(
      acquireLock(temp, "deploy-dev", 999999),
    ).rejects.toThrowError();
    await lock.release();
    await expect(acquireLock(temp, "deploy-dev", 999999)).resolves.toBeTruthy();
  });
});
