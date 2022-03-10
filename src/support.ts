import { LRUCacheProvider } from "@newdash/newdash/cacheProvider";
import { isEmpty } from "@newdash/newdash/isEmpty";
import { IRateLimiterOptions, RateLimiterAbstract, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { ANNOTATE_CDS_RATE_LIMIT, FLAG_RATE_LIMIT_PERFORMED, GLOBAL_RATE_LIMITER_PREFIX, RATE_LIMIT_HEADERS } from "./constants";
import { groupByKeyPrefix } from "./utils";

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
const parseOptions = (service: any, evt: any, globalOptions: RateLimitOptions): RateLimitOptions => {
  const cds = require("@sap/cds");
  const localOptions: RateLimitOptions = {};

  const serviceLevelOptions = groupByKeyPrefix(service.definition, ANNOTATE_CDS_RATE_LIMIT);

  if (!isEmpty(serviceLevelOptions)) {
    if ("duration" in serviceLevelOptions || "points" in serviceLevelOptions) {
      // use service key-prefix, which will be used to indicate the Rate Limiter
      localOptions.keyPrefix = `local-${service.name}`;
    }
    Object.assign(localOptions, serviceLevelOptions);
  }

  // entity relevant
  if (evt?.entity !== undefined) {
    // entity related events
    const entityDef = cds.model.definitions[evt.entity];
    const entityLevelOptions = groupByKeyPrefix(entityDef, ANNOTATE_CDS_RATE_LIMIT);
    if (!isEmpty(serviceLevelOptions)) {
      if ("duration" in entityLevelOptions || "points" in entityLevelOptions) {
        // use entity key-prefix, which will be used to indicate the Rate Limiter
        localOptions.keyPrefix = `local-${service.name}/${evt?.entity}`;
      }
      Object.assign(localOptions, entityLevelOptions);
    };
  }
  // TODO: event def

  return Object.assign({}, globalOptions, localOptions);
};

/**
 * get the rate limiter key from event 
 * 
 * @param service 
 * @param evt 
 * @returns 
 */
const formatEventKey = (service: any, evt: any): string => {
  return `${service.name}/${evt?.entity ?? "unbound"}/${evt}`;;
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

        const eventKey = formatEventKey(service, evt);

        // only affect HTTP requests
        if (evt instanceof cds.Request) {

          // if this event has been measured
          if (evt[FLAG_RATE_LIMIT_PERFORMED] === true) {
            logger.debug(
              "event",
              eventKey,
              "is triggered by internal communication (has been measured by first event), ignored"
            );
            return;
          }

          evt[FLAG_RATE_LIMIT_PERFORMED] = true;

          const options = parseOptions(service, evt, globalOptions);
          const rateLimiter = limiters.getOrCreate(options.keyPrefix, () => provisionRateLimiter(options));
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
          logger.debug("event", eventKey, "is not from http request, ignored");
        }
      });

    }
  });

};
