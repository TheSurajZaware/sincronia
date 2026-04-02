import { describe, expect, it } from "vitest";
import { SampleTaskRules } from "../src/includes/SampleTaskRules.js";

describe("SampleTaskRules", () => {
  it("throws on short names", () => {
    expect(() => SampleTaskRules.validateName({ u_name: "ab" })).toThrowError();
  });

  it("accepts valid names", () => {
    expect(() =>
      SampleTaskRules.validateName({ u_name: "Valid Name" }),
    ).not.toThrowError();
  });
});
