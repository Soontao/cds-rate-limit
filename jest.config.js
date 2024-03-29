
/**
 * @type {import("@jest/types").Config.ProjectConfig}
 */
module.exports = {
  testTimeout: 30 * 1000,
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/node_modules/**"
  ],
  coveragePathIgnorePatterns: [
    "node_modules/",
  ],
  testEnvironment: "node",
  testRegex: "/test/.*\\.test\\.ts$",
  setupFiles: ["./jest.setup.js"],
  moduleFileExtensions: [
    "ts",
    "js",
    "json"
  ],
};
