export type ErrorCategory =
  | "ValidationError"
  | "BuildError"
  | "DeploymentError"
  | "NetworkError"
  | "SDKError"
  | "PluginError"
  | "ConfigError"
  | "LockError";

export type ErrorDetails = {
  category: ErrorCategory;
  message: string;
  cause?: unknown;
  resolutionHint: string;
  metadata?: Record<string, unknown>;
};

export class SincroniaError extends Error {
  readonly category: ErrorCategory;
  readonly resolutionHint: string;
  readonly metadata?: Record<string, unknown>;

  constructor(details: ErrorDetails) {
    super(details.message, { cause: details.cause });
    this.name = details.category;
    this.category = details.category;
    this.resolutionHint = details.resolutionHint;
    if (details.metadata !== undefined) {
      this.metadata = details.metadata;
    }
  }
}

export const asSincroniaError = (
  error: unknown,
  fallback: Omit<ErrorDetails, "cause">,
): SincroniaError => {
  if (error instanceof SincroniaError) {
    return error;
  }

  return new SincroniaError({
    ...fallback,
    cause: error,
  });
};
