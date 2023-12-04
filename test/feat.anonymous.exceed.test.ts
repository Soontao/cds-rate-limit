
import { concurrency } from "@newdash/newdash";
import cds from "@sap/cds";
import { setupIgnoreStatus } from "./utils";

describe("Rate Limit Exceed (Memory) for Anonymous User Test Suite", () => {

  // @ts-ignore
  const { axios } = cds.test(".").in(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should reject request after limit exceed', async () => {
    const TEST_SIZE = 100
    let responses = await concurrency.limit(() => Promise.all(new Array(TEST_SIZE + 1).fill(0).map(() => axios.get(`/sample5/People`))), 10)()
    expect(responses).toHaveLength(TEST_SIZE + 1)
    expect(responses.filter(res => res.status === 401)).toHaveLength(TEST_SIZE)
    expect(responses.filter(res => res.status === 429)).toHaveLength(1)

  });


});
