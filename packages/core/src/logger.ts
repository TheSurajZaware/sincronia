export type LogLevel = "debug" | "info" | "warn" | "error";

type LoggerOptions = {
  level: LogLevel;
  json: boolean;
  runId: string;
};

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  constructor(private readonly options: LoggerOptions) {}

  child(extra: Record<string, unknown>): Logger {
    return new Logger({
      ...this.options,
      runId: String(extra.runId ?? this.options.runId),
    });
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.log("debug", message, fields);
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.log("info", message, fields);
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.log("warn", message, fields);
  }

  error(message: string, fields?: Record<string, unknown>): void {
    this.log("error", message, fields);
  }

  private log(
    level: LogLevel,
    message: string,
    fields?: Record<string, unknown>,
  ): void {
    if (levelOrder[level] < levelOrder[this.options.level]) {
      return;
    }

    const payload = {
      ts: new Date().toISOString(),
      runId: this.options.runId,
      level,
      message,
      ...(fields ?? {}),
    };

    if (this.options.json) {
      process.stdout.write(`${JSON.stringify(payload)}\n`);
      return;
    }

    process.stdout.write(
      `[${payload.ts}] [${level.toUpperCase()}] ${message}\n`,
    );
  }
}

export const createLogger = (opts?: Partial<LoggerOptions>): Logger =>
  new Logger({
    level: opts?.level ?? "info",
    json: opts?.json ?? false,
    runId: opts?.runId ?? `run-${Date.now()}`,
  });
