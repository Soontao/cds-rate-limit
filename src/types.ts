import type { IRateLimiterOptions } from "rate-limiter-flexible";

export type KeyPart = "user_id" | "remote_ip" | "tenant";

export interface RateLimitOptions extends IRateLimiterOptions {
  impl?: "memory" | "redis";
  keyParts?: Array<KeyPart>;
}

export interface MemoryRateLimitOptions extends RateLimitOptions {
  impl: "memory";
}

export interface RedisRateLimitOptions extends RateLimitOptions {
  impl: "redis";
  /**
   * redis client
   */
  storeClient: any;
}
