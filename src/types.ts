import type { IRateLimiterOptions } from "rate-limiter-flexible";
import type { KeyExtractor } from "./key";

export type KeyPart = "user_id" | "remote_ip" | "tenant" | string;

export type AnonymousPolicy = false | Pick<RateLimitOptions, "duration" | "points" | "keyPrefix">

export interface RateLimitOptions extends IRateLimiterOptions {
  impl?: "memory" | "redis";
  keyParts?: Array<KeyPart>;
  /**
   * policy for anonymous requests
   */
  anonymous?: AnonymousPolicy;
  /**
   * custom keyPart extractors
   */
  keyExtractors?: Array<KeyExtractor>;
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
