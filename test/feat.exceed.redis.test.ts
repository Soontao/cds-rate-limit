
import { sleep } from "@newdash/newdash";
import cds from "@sap/cds";

describe("Rate Limit Exceed (Redis) Test Suite", () => {

  // @ts-ignore
  const axios = cds.test(".").in(__dirname, "./redis-app")

  it('should reject request after limit exceed', async () => {

    let responses = await Promise.all(new Array(20).fill(0).map(() => axios.get(`/sample5/People`, { validateStatus: () => true })))
    expect(responses).toHaveLength(20)
    expect(responses.filter(res => res.status === 200)).toHaveLength(5)
    expect(responses.filter(res => res.status === 429)).toHaveLength(15)

    await sleep(1000)

    responses = await Promise.all(new Array(20).fill(0).map(() => axios.get(`/sample5/People`, { validateStatus: () => true })))
    expect(responses).toHaveLength(20)
    expect(responses.filter(res => res.status === 200)).toHaveLength(5)
    expect(responses.filter(res => res.status === 429)).toHaveLength(15)

  });


});
