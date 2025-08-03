// jest.config.js

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude main export file
    '!src/register.js', // Exclude service worker registration
    '!src/kernel.js' // Exclude service worker kernel
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 11,
      functions: 11,
      lines: 12,
      statements: 12
    },
    // Core modules should have higher coverage
    'src/data/AetherStore.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/component/AetherComponent.js': {
      branches: 11,
      functions: 23,
      lines: 14,
      statements: 14
    },
    'src/sync/SyncEngine.js': {
      branches: 65,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000
};
