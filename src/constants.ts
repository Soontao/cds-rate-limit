
export const ANNOTATE_CDS_RATE_LIMIT = "@cds.rate.limit";

export const FLAG_RATE_LIMIT_PERFORMED = "__rate_limit_performed";

export const GLOBAL_RATE_LIMITER_PREFIX = "global-rate-limiter";

export const RATE_LIMIT_HEADERS = {
  "Retry-After": "Retry-After",
  "X-RateLimit-Limit": "X-RateLimit-Limit",
  "X-RateLimit-Remaining": "X-RateLimit-Remaining",
  "X-RateLimit-Reset": "X-RateLimit-Reset",
} as const;
