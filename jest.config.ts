import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  bail: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: ['<rootDir>/test/', '<rootDir>/node_modules/'],
  coverageReporters: ['text'],
  roots: ['<rootDir>/test/'],
  testEnvironment: 'jsdom',
  testRegex: '(\\.|/)(test|spec)\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: true
      }
    ]
  }
}

export default jestConfig
