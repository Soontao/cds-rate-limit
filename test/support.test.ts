
import cds from "@sap/cds";
import { RATE_LIMIT_HEADERS } from "../src/constants";

describe("Support Test Suite", () => {

  // @ts-ignore
  const axios = cds.test(".").in(__dirname, "./app")

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

  it('should support rate limit in entity level', async () => {
    let responses = await axios.post("/sample3/People", { Name: "Theo Sun" })
    expect(responses.status).toBe(201)
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toBe("126")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("25")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toBe("24")

    responses = await axios.get("/sample3/People")

    expect(responses.data.value).toHaveLength(1)
    expect(responses.status).toBe(200)
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toBe("25")
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toBe("23") // will share the points

  });


});
