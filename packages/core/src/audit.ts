import fs from "node:fs/promises";
import path from "node:path";

export type AuditEvent = {
  ts: string;
  runId: string;
  action: string;
  env?: string;
  outcome: "success" | "failure";
  metadata?: Record<string, unknown>;
};

export const appendAuditEvent = async (
  rootDir: string,
  event: AuditEvent,
): Promise<void> => {
  const dir = path.join(rootDir, ".sincronia", "audit");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(
    dir,
    `${new Date().toISOString().slice(0, 10)}.log`,
  );
  await fs.appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
};
