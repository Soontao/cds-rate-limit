import { CDS } from "cds-internal-tool";
import { RateLimiterRes } from "rate-limiter-flexible";
import {
  FLAG_RATE_LIMIT_PERFORMED,
  GLOBAL_ANONYMOUS_RATE_LIMITER_PREFIX,
  GLOBAL_RATE_LIMITER_PREFIX, RATE_LIMIT_HEADERS
} from "./constants";
import { keyExtractorCreatorBuilder } from "./key";
import { provisionRateLimiter } from "./limiters";
import { parseOptions } from "./options";
import { MemoryRateLimitOptions, RateLimitOptions, RedisRateLimitOptions } from "./types";
import { formatEventKey } from "./utils";

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
export const applyRateLimit = (cds: CDS) => {
  const globalOptions: MemoryRateLimitOptions | RedisRateLimitOptions = Object.assign({}, DEFAULT_OPTIONS, cds.env.config?.rateLimit ?? {});
  if (globalOptions.impl === "redis") {
    const Redis = require("ioredis");
    globalOptions.storeClient = new Redis(globalOptions.redisOptions);
  }
  cds.once("bootstrap", createBootStrapListener(cds, globalOptions));
  cds.on("serving", createServiceListener(cds, globalOptions));
};

function createServiceListener(cds: any, globalOptions: RateLimitOptions): any {
  return (service: any) => {

    if (service instanceof cds.ApplicationService) { // only application services

      const logger = cds.log(service?.name);

      const createKeyExtractor = keyExtractorCreatorBuilder(globalOptions.keyExtractors);

      service.prepend((srv: any) => {

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
            const options = await parseOptions(srv, evt, globalOptions);
            const rateLimiter = provisionRateLimiter(options);
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

function createBootStrapListener(cds: any, globalOptions: RateLimitOptions): any {
  return (app: any) => {
    if (globalOptions.anonymous !== false) {
      const logger = cds.log("AnonymousRateLimiter");
      app.use(async (req: any) => {
        // without authorization header
        if (req.get("authorization") === undefined) {
          // TODO: provide `anonymous` options from remote
          const options = Object.assign({}, globalOptions, globalOptions.anonymous);
          const rateLimiter = provisionRateLimiter(options);
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

