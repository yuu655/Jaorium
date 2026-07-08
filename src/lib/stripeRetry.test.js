import { describe, it, expect } from "vitest";
import { isRetryableStripeError } from "./stripeRetry";

describe("isRetryableStripeError", () => {
  it.each(["insufficient_funds", "rate_limit", "api_connection_error"])(
    "treats %s as retryable",
    (code) => {
      expect(isRetryableStripeError(code)).toBe(true);
    },
  );

  it("treats an unlisted error code as non-retryable", () => {
    expect(isRetryableStripeError("account_closed")).toBe(false);
  });

  it("treats a missing error code as non-retryable", () => {
    expect(isRetryableStripeError(undefined)).toBe(false);
  });
});
