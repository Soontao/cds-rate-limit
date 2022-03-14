
/**
 * setup a global test user with HTTP basic auth
 * @param axios 
 * @returns 
 */
export const setupBasicAuth = (axios: any) => {
  axios.defaults.auth = {
    username: "Theo Sun",
  }
  return axios
}
