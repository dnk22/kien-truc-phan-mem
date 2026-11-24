module.exports = {
  watchman: false,
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/generated/'],
  rootDir: process.cwd(),
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
};
