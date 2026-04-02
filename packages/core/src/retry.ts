import { SincroniaError } from "./errors.js";

export type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 8_000,
  factor: 2,
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const withRetry = async <T>(
  taskName: string,
  fn: (attempt: number) => Promise<T>,
  policy: RetryPolicy = defaultRetryPolicy,
): Promise<T> => {
  let attempt = 1;
  let delay = policy.initialDelayMs;
  let lastError: unknown;

  while (attempt <= policy.maxAttempts) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts) {
        break;
      }
      await wait(delay);
      delay = Math.min(policy.maxDelayMs, Math.floor(delay * policy.factor));
      attempt += 1;
    }
  }

  throw new SincroniaError({
    category: "NetworkError",
    message: `${taskName} failed after ${policy.maxAttempts} attempts.`,
    cause: lastError,
    resolutionHint:
      "Verify network connectivity and ServiceNow instance health, then retry.",
    metadata: { taskName, attempts: policy.maxAttempts },
  });
};
