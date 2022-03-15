
import cds from "@sap/cds";
import { setupIgnoreStatus } from "./utils";

describe("Rate Limit Exceed (Memory) for Anonymous User Test Suite", () => {

  // @ts-ignore
  const { axios } = cds.test(".").in(__dirname, "./app")

  setupIgnoreStatus(axios)

  it('should reject request after limit exceed', async () => {

    let responses = await Promise.all(new Array(1001).fill(0).map(() => axios.get(`/sample5/People`)))
    expect(responses).toHaveLength(1001)
    expect(responses.filter(res => res.status === 401)).toHaveLength(1000)
    expect(responses.filter(res => res.status === 429)).toHaveLength(1)

  });


});
