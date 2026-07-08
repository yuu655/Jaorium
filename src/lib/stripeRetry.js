const RETRYABLE_STRIPE_ERROR_CODES = ["insufficient_funds", "rate_limit", "api_connection_error"];

export function isRetryableStripeError(errorCode) {
  return RETRYABLE_STRIPE_ERROR_CODES.includes(errorCode);
}
