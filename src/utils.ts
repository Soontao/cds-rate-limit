
export { cwdRequire, groupByKeyPrefix } from "cds-internal-tool";

/**
 * get the rate limiter key from event 
 * 
 * @param service 
 * @param evt 
 * @returns 
 */
export const formatEventKey = (service: any, evt: any): string => {
  return `${service.name}/${evt?.entity ?? "unbound"}/${evt}`;;
};

