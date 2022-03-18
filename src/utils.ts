import { cwd } from "process";

export const groupByKeyPrefix = (obj: any, key: string) => {
  if (obj === undefined || obj === null) {
    return {};
  }
  const keys = Object.keys(obj);
  return keys
    .filter(objectKey => objectKey.startsWith(key))
    .reduce((pre: any, cur: string) => {
      pre[cur.substring(key.length + 1)] = obj[cur];
      return pre;
    }, {});

};

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


export const cwdRequire = (id: string) => require(require.resolve(id, { paths: [cwd()] }));