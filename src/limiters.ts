import { RateLimiterAbstract, RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { RateLimitOptions } from "./types";

const limiters = new Map();

export const provisionRateLimiter = (options: RateLimitOptions): RateLimiterAbstract => {
  if (!limiters.has(options.keyPrefix)) {
    switch (options.impl) {
      case "redis":
        // fallback to in memory rate limiter when redis is not available
        limiters.set(
          options.keyPrefix,
          new RateLimiterRedis(Object.assign({}, options as any, { insuranceLimiter: new RateLimiterMemory(options) }))
        );
      default:
        limiters.set(
          options.keyPrefix,
          new RateLimiterMemory(options)
        );
    }
  }
  return limiters.get(options.keyPrefix);
};
