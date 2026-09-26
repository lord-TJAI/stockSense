module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['tests/integration/auth.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  setupFilesAfterEnv: [],
  testTimeout: 30000,
};
