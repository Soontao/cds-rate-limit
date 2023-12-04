
import { setupTest } from "cds-internal-tool";
import { RATE_LIMIT_HEADERS } from "../src/constants";

describe("Support Anonymous User Test Suite", () => {

  const axios = setupTest(__dirname, "./app")

  it('should support RateLimit headers', async () => {
    let responses = await axios.get("/sample/People")
    expect(responses.status).toBe(401)
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Reset"].toLowerCase()]).not.toBeUndefined()

    // for another ip
    responses = await axios.get("/sample/People", {
      headers: {
        'X-Forwarded-For': '1.1.1.1'
      }
    })

    expect(responses.status).toBe(401)
    expect(responses.headers[RATE_LIMIT_HEADERS["Retry-After"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Limit"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Remaining"].toLowerCase()]).toMatchSnapshot()
    expect(responses.headers[RATE_LIMIT_HEADERS["X-RateLimit-Reset"].toLowerCase()]).not.toBeUndefined()

  });

});
