
import cds from "@sap/cds";
import { RATE_LIMIT_HEADERS } from "../src/constants";

describe("Support Test Suite", () => {

  // @ts-ignore
  const { axios } = cds.test(".").in(__dirname, "./app")

  it('should support connect to service', async () => {
    const { data } = await axios.get("/sample/$metadata")
    expect(data).toMatch(/People/)
  });

  it('should support RateLimit headers', async () => {
    const responses = await axios.get("/sample/People")
    expect(responses.status).toBe(200)
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toBe("60")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("12000")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toBe("11999")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Reset"].toLowerCase()]).not.toBeUndefined()
  });

  it('should support rate limit in service level', async () => {
    const responses = await axios.get("/sample2/People")
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toBe("5")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("20")
  });


});
