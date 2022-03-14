
import cds from "@sap/cds";
import { RATE_LIMIT_HEADERS } from "../src/constants";

describe("Support Bounded Action/Function Test Suite", () => {

  // @ts-ignore
  const { axios } = cds.test(".").in(__dirname, "./app")

  axios.defaults.auth = {
    username: "Theo Sun",
    password: "dummy"
  }
  
  it('should support rate limit in action/function level', async () => {
    let responses = await axios.post("/sample4/People", { Name: "Theo Sun" }, { validateStatus: () => true })
    expect(responses.status).toBe(201)

    responses = await axios.get(`/sample4/People(${responses.data.ID})`, { validateStatus: () => true })
    expect(responses.status).toBe(200)

    // bounded action
    responses = await axios.get(`/sample4/People(${responses.data.ID})/getName()`, { validateStatus: () => true })
    expect(responses.status).toBe(200)
    expect(responses.data.value).toBe("Theo Sun")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("30")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toBe("29")
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toBe("5")
  });


});
