import { LRUCacheProvider } from "@newdash/newdash/cacheProvider";
import { isEmpty } from "@newdash/newdash/isEmpty";
import { RateLimiterAbstract, RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import {
  ANNOTATE_CDS_RATE_LIMIT, FLAG_RATE_LIMIT_PERFORMED,
  GLOBAL_ANONYMOUS_RATE_LIMITER_PREFIX,
  GLOBAL_RATE_LIMITER_PREFIX, RATE_LIMIT_HEADERS
} from "./constants";
import { KeyPart, MemoryRateLimitOptions, RateLimitOptions, RedisRateLimitOptions } from "./types";
import { groupByKeyPrefix } from "./utils";


export const DEFAULT_OPTIONS: RateLimitOptions = {
  impl: "memory", // use in-memory
  keyParts: ["tenant"], // generate key from tenant
  keyPrefix: GLOBAL_RATE_LIMITER_PREFIX, // default prefix
  duration: 60, // 60 seconds
  points: 200 * 60, // 200 requests per seconds

  // for anonymous requests
  anonymous: {
    // per seconds per remote ip allow 1000 requests
    keyPrefix: GLOBAL_ANONYMOUS_RATE_LIMITER_PREFIX,
    duration: 10,
    points: 10 * 1000,
  },
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

  /**
   * definition for action/function
   */
  let actionFunctionDef = undefined;

  // entity relevant
  if (evt?.entity !== undefined) {
    // entity related events, CRUD
    const entityDef = cds.model.definitions[evt.entity];
    const entityLevelOptions = groupByKeyPrefix(entityDef, ANNOTATE_CDS_RATE_LIMIT);
    if (!isEmpty(entityLevelOptions)) {
      if ("duration" in entityLevelOptions || "points" in entityLevelOptions) {
        // use entity key-prefix, which will be used to indicate the Rate Limiter
        localOptions.keyPrefix = `local-${service.name}/${evt?.entity}`;
      }
      Object.assign(localOptions, entityLevelOptions);
    };

    // bound action/function
    if (entityDef.actions !== undefined && evt.event in entityDef.actions) {
      actionFunctionDef = entityDef.actions[evt.event];
    }
  }

  // unbound action/function
  if (evt.entity === undefined && evt.event in service.operations()) {
    actionFunctionDef = service.operations()[evt.event];
  }

  if (actionFunctionDef !== undefined) {
    const eventLevelOptions = groupByKeyPrefix(actionFunctionDef, ANNOTATE_CDS_RATE_LIMIT);
    if (!isEmpty(eventLevelOptions)) {
      if ("duration" in eventLevelOptions || "points" in eventLevelOptions) {
        // use entity key-prefix, which will be used to indicate the Rate Limiter
        localOptions.keyPrefix = `local-${service.name}/${evt?.entity}/${evt.event}`;
      }
      Object.assign(localOptions, eventLevelOptions);
    };
  }

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
    case "redis":
      // fallback to in memory rate limiter when redis is not available
      return new RateLimiterRedis(Object.assign({}, options as any, { insuranceLimiter: new RateLimiterMemory(options) }));
    default:
      return new RateLimiterMemory(options);
  }
};

/**
 * attach headers to evt
 * 
 * @param response express response
 * @param total 
 * @param rateLimitRes 
 */
const attachHeaders = (response: any, total: number, rateLimitRes: RateLimiterRes) => {
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
 * @param defaultOptions 
 */
export const applyRateLimit = (cds: any, defaultOptions?: MemoryRateLimitOptions | RedisRateLimitOptions) => {
  const limiters = new LRUCacheProvider(10240);
  const globalOptions = Object.assign({}, DEFAULT_OPTIONS, defaultOptions ?? {});
  cds.on("bootstrap", createBootStrapListener(cds, globalOptions, limiters))
  cds.on("serving", createServiceListener(cds, globalOptions, limiters));
};

function createServiceListener(cds: any, globalOptions: RateLimitOptions, limiters: LRUCacheProvider<string, RateLimiterAbstract>): any {
  return (service: any) => {

    if (service instanceof cds.ApplicationService) { // only application services

      const logger = cds.log(service?.name);

      service.prepend("*", (srv: any) => {

        srv.before("*", async (evt: any) => {

          const eventKey = formatEventKey(srv, evt);

          // only affect HTTP requests
          if (evt instanceof cds.Request) {

            // if this event has been measured
            if (cds.context[FLAG_RATE_LIMIT_PERFORMED] === true) {
              logger.debug(
                "event",
                eventKey,
                "is triggered by internal communication (has been measured by first event), ignored"
              );
              return;
            }

            cds.context[FLAG_RATE_LIMIT_PERFORMED] = true;
            const options = parseOptions(srv, evt, globalOptions);
            const rateLimiter = limiters.getOrCreate(options.keyPrefix as string, () => provisionRateLimiter(options));
            const keyExtractor = createKeyExtractor(options.keyParts as []);
            const key = keyExtractor(evt);

            try {
              const response = await rateLimiter.consume(key);
              logger.debug("rate limit consume successful:", key, response);
              attachHeaders(evt?._?.req?.res, options.points as number, response);
              return;
            } catch (response) {
              logger.error("rate limit consume failed:", key, response);
              attachHeaders(evt?._?.req?.res, options.points as number, response);
              return evt.reject(
                429,
                `Rate limit exceed, please retry after ${Math.floor(response.msBeforeNext / 1000)} seconds`
              );
            }
          } else {
            logger.debug("event", eventKey, "is not from http request, ignored");
          }
        });
      });


    }
  };
}

function createBootStrapListener(cds: any, globalOptions: RateLimitOptions, limiters: LRUCacheProvider<string, RateLimiterAbstract>): any {
  return (app: any) => {
    if (globalOptions.anonymous !== false) {
      const logger = cds.log("AnonymousRateLimiter");
      app.use(async (req: any) => {
        // without authorization header
        if (req.get("authorization") === undefined) {
          const options = Object.assign({}, globalOptions, globalOptions.anonymous);
          const rateLimiter = limiters.getOrCreate(options.keyPrefix as string, () => provisionRateLimiter(options));
          try {
            const response = await rateLimiter.consume(req.ip);
            logger.debug("rate limit consume successful:", req.ip, response);
            attachHeaders(req.res, options.points as number, response);
            return req.next();
          } catch (response) {
            logger.error("rate limit consume failed:", req.ip, response);
            attachHeaders(req.res, options.points as number, response);
            return req.res.status(429).json({
              error: {
                code: "429",
                message: `Rate limit exceed, please retry after ${Math.floor(response.msBeforeNext / 1000)} seconds`
              }
            });
          }
        }

        return req.next();

      });
    }
  };
}

