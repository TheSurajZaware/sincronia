import { describe, expect, it } from "vitest";
import { withRetry } from "./retry.js";

describe("withRetry", () => {
  it("retries and eventually succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      "retry-test",
      async () => {
        attempts += 1;
        if (attempts < 2) {
          throw new Error("transient");
        }
        return "ok";
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1,
        maxDelayMs: 2,
        factor: 2,
      },
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });
});
