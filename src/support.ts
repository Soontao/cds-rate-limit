import { LRUCacheProvider } from "@newdash/newdash/cacheProvider";
import { IRateLimiterOptions, RateLimiterAbstract, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { FLAG_RATE_LIMIT_PERFORMED, GLOBAL_RATE_LIMITER_PREFIX, RATE_LIMIT_HEADERS } from "./constants";


export type KeyPart = "user_id" | "remote_ip" | "tenant";

export interface RateLimitOptions extends IRateLimiterOptions {
  impl?: "memory" | "redis";
  keyParts?: Array<KeyPart>;
}

export const DEFAULT_OPTIONS: RateLimitOptions = {
  impl: "memory",
  keyParts: ["tenant"],
  keyPrefix: GLOBAL_RATE_LIMITER_PREFIX,
  duration: 60, // 60 seconds
  points: 200 * 60, // 200 requests per seconds
};

const createKeyExtractor = (keyParts: Array<KeyPart>) => (evt: any) => {
  const parts = [];
  if (keyParts.includes("tenant")) {
    parts.push(evt?.tenant ?? "unknown_tenant");
  }
  if (keyParts.includes("user_id")) {
    parts.push(evt?.user?.id ?? "unknown_user");
  }
  if (keyParts.includes("remote_ip")) {
    const req = evt?._?.req;
    if (req !== undefined) {
      parts.push(req?.ip ?? req.socket.remoteAddress ?? "unknown_ip");
    }
  }
  return parts.join("/");
};

/**
 * parse options for events
 * 
 * @param evt 
 * @param globalOptions 
 * @returns 
 */
const parseOptions = (evt: any, globalOptions: RateLimitOptions): RateLimitOptions => {
  // TODO: if not have configured, return default
  return Object.assign({}, globalOptions);
};

/**
 * get the rate limiter key from event 
 * 
 * @param service 
 * @param evt 
 * @returns 
 */
const extractRateLimiterKey = (service: any, evt: any): string => {
  const rateLimiterKey = `${service.name}/${evt?.entity ?? "unbound"}/${evt}`;
  // TODO: if not have configured, return GLOBAL
  return rateLimiterKey;
};

const provisionRateLimiter = (options: RateLimitOptions): RateLimiterAbstract => {
  switch (options.impl) {
    default:
      return new RateLimiterMemory(options);
  }
};

/**
 * attach headers to evt
 * 
 * @param evt 
 * @param total 
 * @param rateLimitRes 
 */
const attachHeaders = (evt: any, total: number, rateLimitRes: RateLimiterRes) => {
  const response = evt?._?.req?.res;
  if (response !== undefined) {
    response?.set?.({
      [RATE_LIMIT_HEADERS["Retry-After"]]: Math.floor(rateLimitRes.msBeforeNext / 1000),
      [RATE_LIMIT_HEADERS["X-RateLimit-Limit"]]: total,
      [RATE_LIMIT_HEADERS["X-RateLimit-Remaining"]]: rateLimitRes.remainingPoints,
      [RATE_LIMIT_HEADERS["X-RateLimit-Reset"]]: Math.floor((Date.now() + rateLimitRes.msBeforeNext) / 1000)
    });
  }
};

/**
 * apply rate limitation for cds
 * 
 * @param cds 
 * @param globalOptions 
 */
export const applyRateLimit = (cds: any, globalOptions: RateLimitOptions = {}) => {
  /**
   * key: service/event id
   */
  const limiters = new LRUCacheProvider(10240);

  globalOptions = Object.assign({}, DEFAULT_OPTIONS, globalOptions ?? {});

  cds.on("serving", (service: any) => {

    if (service instanceof cds.ApplicationService) { // only application services

      const logger = cds.log(service?.name);

      service.before("*", async (evt: any) => {

        const rateLimiterKey = extractRateLimiterKey(service, evt);
        // only affect HTTP requests
        if (evt instanceof cds.Request) {
          // if this event has been measured
          if (evt[FLAG_RATE_LIMIT_PERFORMED] === true) {
            logger.debug(
              "event",
              rateLimiterKey,
              "is triggered by internal communication (has been measured by first event), ignored"
            );
            return;
          }

          evt[FLAG_RATE_LIMIT_PERFORMED] = true;

          const options = parseOptions(evt, globalOptions);
          const rateLimiter = limiters.getOrCreate(rateLimiterKey, () => provisionRateLimiter(options));
          const keyExtractor = createKeyExtractor(options.keyParts as []);
          const key = keyExtractor(evt);

          try {
            const response = await rateLimiter.consume(key);
            logger.debug("rate limit consume successful:", key, response);
            attachHeaders(evt, options.points as number, response);
            return;
          } catch (response) {
            logger.error("rate limit consume failed:", key, response);
            attachHeaders(evt, options.points as number, response);
            return evt.reject(
              429,
              `Rate limit exceed, please retry after ${Math.floor(response.msBeforeNext / 1000)} seconds`
            );
          }
        } else {
          logger.debug("event", rateLimiterKey, "is not from http request, ignored");
        }
      });

    }
  });

};
