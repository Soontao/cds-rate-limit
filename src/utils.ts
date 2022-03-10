
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
