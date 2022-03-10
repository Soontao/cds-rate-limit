
import cds from "@sap/cds";
import { RATE_LIMIT_HEADERS } from "../src/constants";

describe("Support Unbound Action/Function Test Suite", () => {

  // @ts-ignore
  const axios = cds.test(".").in(__dirname, "./app")

  it('should support rate limit in unbound action/function level', async () => {
    const { data: metadata } = await axios.get("/sample4/$metadata")
    let responses = await axios.post("/sample4/People", { Name: "Theo Sun" }, { validateStatus: () => true })
    expect(responses.status).toBe(201)

    responses = await axios.get(`/sample4/People(${responses.data.ID})`, { validateStatus: () => true })
    expect(responses.status).toBe(200)

    // bounded action
    responses = await axios.get(`/sample4/getName(PeopleID=${responses.data.ID})`, { validateStatus: () => true })
    expect(responses.status).toBe(200)
    expect(responses.data.value).toBe("Theo Sun")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("31")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toBe("30")
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toBe("13")
  });


});
