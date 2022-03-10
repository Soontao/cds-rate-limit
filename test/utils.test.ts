import { groupByKeyPrefix } from "../src/utils";

describe('Utils Test Suite', () => {


  it('should support group object by key prefix', () => {

    const object = {
      "@cds.rate.limit.duration": 10,
      "@cds.rate.limit.points": 20,
      "@cds.rate.limit.keyParts": ["tenant", "remote_ip"],
    }
    const result = groupByKeyPrefix(object, "@cds.rate.limit")

    expect(result).toStrictEqual({
      duration: 10,
      points: 20,
      keyParts: ["tenant", "remote_ip"],
    })
  });


});
