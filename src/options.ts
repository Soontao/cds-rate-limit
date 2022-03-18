import { isEmpty } from "@newdash/newdash/isEmpty";
import { ANNOTATE_CDS_RATE_LIMIT } from "./constants";
import { RateLimitOptions } from "./types";
import { cwdRequire, formatEventKey, groupByKeyPrefix } from "./utils";

const optionsCache = new Map<string, RateLimitOptions>();

/**
 * parse options for events
 * 
 * @param evt 
 * @param globalOptions 
 * @returns 
 */
export const parseOptions = (service: any, evt: any, globalOptions: RateLimitOptions): RateLimitOptions => {

  const key = formatEventKey(service, evt);
  if (!optionsCache.has(key)) {
    const cds = cwdRequire("@sap/cds");

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

    optionsCache.set(key, Object.assign({}, globalOptions, localOptions));
  }

  return optionsCache.get(key) as any;

};